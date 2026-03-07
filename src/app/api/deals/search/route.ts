import { NextRequest, NextResponse } from 'next/server'
import { fetchZillowListings, fetchRedfinListings, fetchRealtorListings } from '../../../../lib/rapidapi'
import { transformToDeal, scoreDeal, deduplicateListings, type RawListing } from '../../../../lib/deal-transformer'

// In-memory cache for search results
const searchCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

// Rate limiting
const requestLog: number[] = []
const MAX_REQUESTS_PER_MINUTE = 15

function checkRateLimit(): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60_000
  while (requestLog.length > 0 && requestLog[0] < oneMinuteAgo) {
    requestLog.shift()
  }
  if (requestLog.length >= MAX_REQUESTS_PER_MINUTE) return false
  requestLog.push(now)
  return true
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-rapidapi-key')
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RapidAPI key required. Add your key in Settings to search real listings.' },
      { status: 401 }
    )
  }

  if (!checkRateLimit()) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before searching again.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') || ''
  const sourcesParam = searchParams.get('sources') || 'zillow,redfin,realtor'
  const sources = sourcesParam.split(',').filter(Boolean)
  const limit = parseInt(searchParams.get('limit') || '50')
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
  const beds = searchParams.get('beds') ? parseInt(searchParams.get('beds')!) : undefined

  if (!location.trim()) {
    return NextResponse.json(
      { error: 'Location is required. Enter a city, state, or zip code.' },
      { status: 400 }
    )
  }

  // Check cache
  const cacheKey = `${location.toLowerCase().trim()}-${sources.sort().join(',')}-${minPrice || ''}-${maxPrice || ''}-${beds || ''}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ ...(cached.data as object), cached: true })
  }

  const options = { location, minPrice, maxPrice, beds, limit }

  // Fan out to enabled sources in parallel
  const promises: { source: string; promise: Promise<RawListing[]> }[] = []

  if (sources.includes('zillow')) {
    promises.push({ source: 'Zillow', promise: fetchZillowListings(apiKey, options) })
  }
  if (sources.includes('redfin')) {
    promises.push({ source: 'Redfin', promise: fetchRedfinListings(apiKey, options) })
  }
  if (sources.includes('realtor')) {
    promises.push({ source: 'Realtor.com', promise: fetchRealtorListings(apiKey, options) })
  }

  const results = await Promise.allSettled(promises.map(p => p.promise))

  const allListings: RawListing[] = []
  const errors: { source: string; error: string }[] = []
  const sourceCounts: Record<string, number> = {}

  results.forEach((result, idx) => {
    const { source } = promises[idx]
    if (result.status === 'fulfilled') {
      allListings.push(...result.value)
      sourceCounts[source] = result.value.length
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason)
      errors.push({ source, error: msg })
      sourceCounts[source] = 0
    }
  })

  // Deduplicate across sources
  const deduped = deduplicateListings(allListings)

  // Transform, score, and sort
  const deals = deduped
    .map(raw => {
      const deal = transformToDeal(raw)
      deal.score = scoreDeal(deal)
      return deal
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // Compute market stats
  const prices = deals.map(d => d.listPrice).filter(p => p > 0)
  const doms = deals.map(d => d.daysOnMarket).filter(d => d > 0)

  const responsePayload = {
    deals,
    count: deals.length,
    totalRaw: allListings.length,
    deduplicated: allListings.length - deduped.length,
    errors,
    sourceCounts,
    cached: false,
    marketStats: {
      medianPrice: prices.length > 0
        ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
        : 0,
      avgDom: doms.length > 0
        ? Math.round(doms.reduce((s, d) => s + d, 0) / doms.length)
        : 0,
      inventory: deals.length,
    },
  }

  // Cache the result
  searchCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() })

  return NextResponse.json(responsePayload)
}
