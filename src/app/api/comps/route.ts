import { NextResponse } from 'next/server'

// =============================================================================
// In-memory cache — 24-hour TTL keyed by normalized address
// Minimizes RentCast API calls (free tier: 50/month)
// =============================================================================

interface CacheEntry {
  data: unknown
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(address: string): string {
  return address.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getCached(key: string): unknown | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() })
  // Evict old entries if cache grows too large
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
    for (let i = 0; i < 50; i++) {
      cache.delete(oldest[i][0])
    }
  }
}

// =============================================================================
// GET /api/comps?address=...&beds=3&baths=2&sqft=2000&compCount=15
// Proxies to RentCast /v1/avm/value with API key from request header
// =============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const beds = searchParams.get('beds')
    const baths = searchParams.get('baths')
    const sqft = searchParams.get('sqft')
    const compCount = searchParams.get('compCount') || '20'

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      )
    }

    // API key from header (client sends it per-request from localStorage)
    const apiKey = request.headers.get('x-rentcast-key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing RentCast API key. Configure it in Settings.' },
        { status: 401 }
      )
    }

    // Check cache
    const cacheKey = getCacheKey(address)
    const cached = getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached as Record<string, unknown>, cached: true })
    }

    // Build RentCast URL
    const rentCastUrl = new URL('https://api.rentcast.io/v1/avm/value')
    rentCastUrl.searchParams.set('address', address)
    rentCastUrl.searchParams.set('compCount', compCount)
    if (beds) rentCastUrl.searchParams.set('bedrooms', beds)
    if (baths) rentCastUrl.searchParams.set('bathrooms', baths)
    if (sqft) rentCastUrl.searchParams.set('squareFootage', sqft)

    const res = await fetch(rentCastUrl.toString(), {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      let errorMsg = `RentCast API error (${res.status})`

      if (res.status === 401 || res.status === 403) {
        // Check for subscription-inactive specifically
        if (errorText.includes('subscription-inactive')) {
          errorMsg = 'RentCast API subscription not active. Go to app.rentcast.io/app/api to activate your free plan (50 calls/month).'
        } else {
          errorMsg = 'Invalid RentCast API key. Check your key in Settings.'
        }
      } else if (res.status === 404) {
        errorMsg = 'No data found for this address. The property may not be in the RentCast database.'
      } else if (res.status === 429) {
        errorMsg = 'RentCast API rate limit reached. Free tier allows 50 calls/month.'
      } else if (res.status >= 500) {
        errorMsg = 'RentCast API is temporarily unavailable. Try again later.'
      }

      console.error(`RentCast error: ${res.status} — ${errorText}`)
      return NextResponse.json({ error: errorMsg }, { status: res.status })
    }

    const data = await res.json()

    // Cache the response
    setCache(cacheKey, data)

    return NextResponse.json({ ...data, cached: false })
  } catch (err) {
    console.error('Comps API error:', err)
    return NextResponse.json(
      { error: 'Internal server error while fetching comps' },
      { status: 500 }
    )
  }
}
