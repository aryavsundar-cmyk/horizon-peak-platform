import { NextRequest, NextResponse } from 'next/server'
import { detectHost, parseZillowHtml, parseRedfinHtml, parseRealtorHtml } from '../../../../lib/url-parser'
import { transformToDeal, scoreDeal } from '../../../../lib/deal-transformer'

export async function POST(request: NextRequest) {
  let body: { url?: string; rapidApiKey?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url } = body
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  // Validate URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  const host = detectHost(url)
  if (!host) {
    return NextResponse.json({
      error: 'Unsupported URL. Please use a Zillow, Redfin, or Realtor.com listing URL.',
      supportedHosts: ['zillow.com', 'redfin.com', 'realtor.com'],
    }, { status: 400 })
  }

  try {
    // Fetch the listing page server-side
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      // Try RapidAPI fallback if key provided
      const apiKey = body.rapidApiKey || request.headers.get('x-rapidapi-key')
      if (apiKey) {
        const fallbackResult = await tryRapidApiFallback(host, url, apiKey)
        if (fallbackResult) {
          const deal = transformToDeal(fallbackResult)
          deal.score = scoreDeal(deal)
          return NextResponse.json({ deal, method: 'rapidapi-fallback' })
        }
      }
      return NextResponse.json({
        error: `Could not fetch listing page (HTTP ${response.status}). The site may be blocking automated requests. Try adding a RapidAPI key in Settings for API-based import.`,
      }, { status: 502 })
    }

    const html = await response.text()

    // Parse based on detected host
    let parsed
    switch (host) {
      case 'zillow': parsed = parseZillowHtml(html, url); break
      case 'redfin': parsed = parseRedfinHtml(html, url); break
      case 'realtor': parsed = parseRealtorHtml(html, url); break
    }

    // Validate we got meaningful data
    if (!parsed.address && !parsed.price) {
      // Try RapidAPI fallback
      const apiKey = body.rapidApiKey || request.headers.get('x-rapidapi-key')
      if (apiKey) {
        const fallbackResult = await tryRapidApiFallback(host, url, apiKey)
        if (fallbackResult) {
          const deal = transformToDeal(fallbackResult)
          deal.score = scoreDeal(deal)
          return NextResponse.json({ deal, method: 'rapidapi-fallback' })
        }
      }
      return NextResponse.json({
        error: 'Could not extract listing details from the page. The site may have changed its format. Try adding a RapidAPI key in Settings for better results.',
      }, { status: 422 })
    }

    // Transform to Deal and score
    const deal = transformToDeal({
      source: parsed.source,
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      price: parsed.price,
      beds: parsed.beds,
      baths: parsed.baths,
      sqft: parsed.sqft,
      lotSize: parsed.lotSize,
      yearBuilt: parsed.yearBuilt,
      daysOnMarket: parsed.daysOnMarket,
      url: parsed.url,
    })
    deal.score = scoreDeal(deal)

    return NextResponse.json({ deal, method: 'html-parse' })
  } catch (error) {
    return NextResponse.json({
      error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 })
  }
}

/** RapidAPI fallback: use property detail endpoints when HTML parsing fails */
async function tryRapidApiFallback(
  host: string,
  url: string,
  apiKey: string
): Promise<{ source: string; address: string; city: string; state: string; zip: string; price: number; beds: number; baths: number; sqft: number; lotSize: number; yearBuilt: number; daysOnMarket: number; url: string } | null> {
  try {
    if (host === 'zillow') {
      // Extract zpid from Zillow URL
      const zpidMatch = url.match(/\/(\d+)_zpid/)
      if (!zpidMatch) return null

      const res = await fetch(`https://zillow-working-api.p.rapidapi.com/byZpid?zpid=${zpidMatch[1]}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'zillow-working-api.p.rapidapi.com',
        },
      })
      if (!res.ok) return null
      const data = await res.json()
      const prop = data.property || data
      return {
        source: 'Zillow',
        address: prop.streetAddress || prop.address || '',
        city: prop.city || '',
        state: prop.state || '',
        zip: prop.zipcode || '',
        price: prop.price || prop.listPrice || prop.zestimate || 0,
        beds: prop.bedrooms || prop.beds || 0,
        baths: prop.bathrooms || prop.baths || 0,
        sqft: prop.livingArea || prop.sqft || 0,
        lotSize: prop.lotSize || 0,
        yearBuilt: prop.yearBuilt || 0,
        daysOnMarket: prop.daysOnZillow || 0,
        url,
      }
    }

    if (host === 'redfin') {
      const res = await fetch(`https://redfin-api.p.rapidapi.com/property?url=${encodeURIComponent(url)}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'redfin-api.p.rapidapi.com',
        },
      })
      if (!res.ok) return null
      const data = await res.json()
      const prop = data.property || data
      return {
        source: 'Redfin',
        address: prop.streetAddress || prop.address || '',
        city: prop.city || '',
        state: prop.state || prop.stateCode || '',
        zip: prop.zip || prop.zipCode || '',
        price: prop.listPrice || prop.price || 0,
        beds: prop.beds || prop.numBeds || 0,
        baths: prop.baths || prop.numBaths || 0,
        sqft: prop.sqFt || prop.sqft || 0,
        lotSize: prop.lotSize || 0,
        yearBuilt: prop.yearBuilt || 0,
        daysOnMarket: prop.dom || prop.daysOnMarket || 0,
        url,
      }
    }

    return null
  } catch {
    return null
  }
}
