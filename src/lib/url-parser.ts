import * as cheerio from 'cheerio'

export type SupportedHost = 'zillow' | 'redfin' | 'realtor'

export interface ParsedListing {
  address: string
  city: string
  state: string
  zip: string
  price: number
  beds: number
  baths: number
  sqft: number
  lotSize: number
  yearBuilt: number
  daysOnMarket: number
  url: string
  source: string
}

/** Detect which real estate site a URL belongs to */
export function detectHost(url: string): SupportedHost | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('zillow.com')) return 'zillow'
    if (hostname.includes('redfin.com')) return 'redfin'
    if (hostname.includes('realtor.com')) return 'realtor'
    return null
  } catch {
    return null
  }
}

/** Parse a Zillow listing page */
export function parseZillowHtml(html: string, url: string): ParsedListing {
  const $ = cheerio.load(html)

  // Strategy 1: JSON-LD structured data
  const jsonLd = extractJsonLd($, 'SingleFamilyResidence', 'Product', 'RealEstateListing')
  if (jsonLd) {
    return {
      address: jsonLd.name || jsonLd.address?.streetAddress || '',
      city: jsonLd.address?.addressLocality || '',
      state: jsonLd.address?.addressRegion || '',
      zip: jsonLd.address?.postalCode || '',
      price: parsePrice(jsonLd.offers?.price || jsonLd.price || '0'),
      beds: parseInt(jsonLd.numberOfRooms || jsonLd.numberOfBedrooms || '0') || 0,
      baths: parseInt(jsonLd.numberOfBathroomsTotal || '0') || 0,
      sqft: parseInt(jsonLd.floorSize?.value || '0') || 0,
      lotSize: 0,
      yearBuilt: parseInt(jsonLd.yearBuilt || '0') || 0,
      daysOnMarket: 0,
      url,
      source: 'Zillow',
    }
  }

  // Strategy 2: __NEXT_DATA__ script tag
  const nextData = extractNextData($)
  if (nextData) {
    const property = findDeep(nextData, 'property') || findDeep(nextData, 'homeData') || {}
    return {
      address: property.streetAddress || property.address?.streetAddress || extractMeta($, 'og:title') || '',
      city: property.city || property.address?.city || '',
      state: property.state || property.address?.state || '',
      zip: property.zipcode || property.address?.zipcode || '',
      price: parsePrice(property.price || property.listPrice || property.zestimate || '0'),
      beds: parseInt(property.bedrooms || property.beds || '0') || 0,
      baths: parseInt(property.bathrooms || property.baths || '0') || 0,
      sqft: parseInt(property.livingArea || property.sqft || '0') || 0,
      lotSize: parseFloat(property.lotSize || property.lotAreaValue || '0') || 0,
      yearBuilt: parseInt(property.yearBuilt || '0') || 0,
      daysOnMarket: parseInt(property.daysOnZillow || '0') || 0,
      url,
      source: 'Zillow',
    }
  }

  // Strategy 3: Open Graph meta tags
  return parseFromMeta($, url, 'Zillow')
}

/** Parse a Redfin listing page */
export function parseRedfinHtml(html: string, url: string): ParsedListing {
  const $ = cheerio.load(html)

  // Strategy 1: JSON-LD
  const jsonLd = extractJsonLd($, 'SingleFamilyResidence', 'Product', 'RealEstateListing', 'Residence')
  if (jsonLd) {
    return {
      address: jsonLd.name || jsonLd.address?.streetAddress || '',
      city: jsonLd.address?.addressLocality || '',
      state: jsonLd.address?.addressRegion || '',
      zip: jsonLd.address?.postalCode || '',
      price: parsePrice(jsonLd.offers?.price || '0'),
      beds: parseInt(jsonLd.numberOfRooms || jsonLd.numberOfBedrooms || '0') || 0,
      baths: parseInt(jsonLd.numberOfBathroomsTotal || '0') || 0,
      sqft: parseInt(jsonLd.floorSize?.value || '0') || 0,
      lotSize: 0,
      yearBuilt: parseInt(jsonLd.yearBuilt || '0') || 0,
      daysOnMarket: 0,
      url,
      source: 'Redfin',
    }
  }

  // Strategy 2: Redfin-specific inline data
  const preloadMatch = html.match(/window\.__reactServerState\s*=\s*({[\s\S]*?});?\s*<\/script>/)
    || html.match(/"propertyData"\s*:\s*({[\s\S]*?})\s*[,}]/)
  if (preloadMatch) {
    try {
      const data = JSON.parse(preloadMatch[1])
      const prop = findDeep(data, 'propertyData') || findDeep(data, 'homeData') || data
      return {
        address: prop.streetAddress || prop.address || '',
        city: prop.city || '',
        state: prop.state || prop.stateCode || '',
        zip: prop.zip || prop.zipCode || '',
        price: parsePrice(prop.listPrice || prop.price || '0'),
        beds: parseInt(prop.beds || prop.numBeds || '0') || 0,
        baths: parseInt(prop.baths || prop.numBaths || '0') || 0,
        sqft: parseInt(prop.sqFt || prop.sqft || '0') || 0,
        lotSize: parseFloat(prop.lotSize || '0') || 0,
        yearBuilt: parseInt(prop.yearBuilt || '0') || 0,
        daysOnMarket: parseInt(prop.dom || prop.daysOnMarket || '0') || 0,
        url,
        source: 'Redfin',
      }
    } catch { /* fall through */ }
  }

  // Strategy 3: Meta tags
  return parseFromMeta($, url, 'Redfin')
}

/** Parse a Realtor.com listing page */
export function parseRealtorHtml(html: string, url: string): ParsedListing {
  const $ = cheerio.load(html)

  // Strategy 1: JSON-LD
  const jsonLd = extractJsonLd($, 'SingleFamilyResidence', 'Product', 'RealEstateListing', 'Residence')
  if (jsonLd) {
    return {
      address: jsonLd.name || jsonLd.address?.streetAddress || '',
      city: jsonLd.address?.addressLocality || '',
      state: jsonLd.address?.addressRegion || '',
      zip: jsonLd.address?.postalCode || '',
      price: parsePrice(jsonLd.offers?.price || jsonLd.price || '0'),
      beds: parseInt(jsonLd.numberOfRooms || jsonLd.numberOfBedrooms || '0') || 0,
      baths: parseInt(jsonLd.numberOfBathroomsTotal || '0') || 0,
      sqft: parseInt(jsonLd.floorSize?.value || '0') || 0,
      lotSize: 0,
      yearBuilt: parseInt(jsonLd.yearBuilt || '0') || 0,
      daysOnMarket: 0,
      url,
      source: 'Realtor.com',
    }
  }

  // Strategy 2: __NEXT_DATA__
  const nextData = extractNextData($)
  if (nextData) {
    const prop = findDeep(nextData, 'property') || findDeep(nextData, 'listing') || {}
    const loc = prop.location || prop.address || {}
    return {
      address: loc.streetAddress || loc.address || prop.address_line || '',
      city: loc.city || prop.city || '',
      state: loc.state || loc.stateCode || prop.state_code || '',
      zip: loc.postalCode || loc.zipCode || prop.postal_code || '',
      price: parsePrice(prop.list_price || prop.price || prop.listPrice || '0'),
      beds: parseInt(prop.beds || prop.bedrooms || '0') || 0,
      baths: parseInt(prop.baths || prop.bathrooms || '0') || 0,
      sqft: parseInt(prop.sqft || prop.livingArea || '0') || 0,
      lotSize: parseFloat(prop.lot_sqft ? String(Number(prop.lot_sqft) / 43560) : '0') || 0,
      yearBuilt: parseInt(prop.year_built || prop.yearBuilt || '0') || 0,
      daysOnMarket: parseInt(prop.days_on_market || '0') || 0,
      url,
      source: 'Realtor.com',
    }
  }

  // Strategy 3: Meta tags
  return parseFromMeta($, url, 'Realtor.com')
}

// ============= Helpers =============

/** Extract JSON-LD script blocks and find matching @type */
function extractJsonLd($: cheerio.CheerioAPI, ...types: string[]): Record<string, any> | null {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      const text = $(scripts[i]).html()
      if (!text) continue
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const itemType = item['@type']
        if (typeof itemType === 'string' && types.some(t => itemType.includes(t))) {
          return item
        }
        // Check @graph
        if (item['@graph']) {
          for (const graphItem of item['@graph']) {
            if (typeof graphItem['@type'] === 'string' && types.some(t => graphItem['@type'].includes(t))) {
              return graphItem
            }
          }
        }
      }
    } catch { /* skip invalid JSON-LD */ }
  }
  return null
}

/** Extract __NEXT_DATA__ from Next.js pages */
function extractNextData($: cheerio.CheerioAPI): Record<string, any> | null {
  const script = $('#__NEXT_DATA__').html()
  if (!script) return null
  try {
    const data = JSON.parse(script)
    return data?.props?.pageProps || data?.props || data
  } catch {
    return null
  }
}

/** Extract Open Graph meta tag content */
function extractMeta($: cheerio.CheerioAPI, property: string): string {
  return $(`meta[property="${property}"]`).attr('content')
    || $(`meta[name="${property}"]`).attr('content')
    || ''
}

/** Fallback: parse from Open Graph and standard meta tags */
function parseFromMeta($: cheerio.CheerioAPI, url: string, source: string): ParsedListing {
  const title = extractMeta($, 'og:title') || $('title').text() || ''
  const description = extractMeta($, 'og:description') || extractMeta($, 'description') || ''

  // Try to extract address from title (common pattern: "123 Main St, City, ST 12345")
  const addressMatch = title.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5})?/)
  const priceMatch = description.match(/\$[\d,]+/) || title.match(/\$[\d,]+/)
  const bedMatch = description.match(/(\d+)\s*(?:bed|br|bedroom)/i)
  const bathMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i)
  const sqftMatch = description.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i)

  const priceFromMeta = extractMeta($, 'product:price:amount')

  return {
    address: addressMatch?.[1]?.trim() || title.split('|')[0]?.trim() || '',
    city: addressMatch?.[2]?.trim() || '',
    state: addressMatch?.[3]?.trim() || '',
    zip: addressMatch?.[4]?.trim() || '',
    price: parsePrice(priceFromMeta || priceMatch?.[0] || '0'),
    beds: parseInt(bedMatch?.[1] || '0') || 0,
    baths: parseFloat(bathMatch?.[1] || '0') || 0,
    sqft: parseInt(sqftMatch?.[1]?.replace(/,/g, '') || '0') || 0,
    lotSize: 0,
    yearBuilt: 0,
    daysOnMarket: 0,
    url,
    source,
  }
}

/** Parse a price string to number */
function parsePrice(val: string | number): number {
  if (typeof val === 'number') return val
  return parseInt(val.replace(/[$,\s]/g, '')) || 0
}

/** Recursively find a key in a nested object (max depth 8) */
function findDeep(obj: any, key: string, depth = 0): any {
  if (depth > 8 || !obj || typeof obj !== 'object') return null
  if (obj[key] && typeof obj[key] === 'object') return obj[key]
  for (const k of Object.keys(obj)) {
    if (k === key && obj[k] && typeof obj[k] === 'object') return obj[k]
    const found = findDeep(obj[k], key, depth + 1)
    if (found) return found
  }
  return null
}
