import type { Deal } from '../data/store'

// Raw listing from any API source before normalization
export interface RawListing {
  source: string
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
  listingId?: string
}

// Pike County market average $/sqft — used as default ARV estimate before comp analysis
// Sources: Horizon Peak Business Plan sale comps ($220-$290/sqft), market avg ~$250/sqft
const REGIONAL_AVG_PPSF = 250

// Default per-acre land value for vacant lots without buildings
const REGIONAL_LAND_VALUE_PER_ACRE = 500000

/** Transform a raw API listing into a Deal */
export function transformToDeal(raw: RawListing): Deal {
  const sqft = raw.sqft || 0
  const listPrice = raw.price || 0
  const pricePerSqft = sqft > 0 ? Math.round(listPrice / sqft) : 0

  return {
    id: `api-${raw.source.toLowerCase().replace(/[^a-z]/g, '')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: raw.source,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    listPrice,
    beds: raw.beds || 0,
    baths: raw.baths || 0,
    sqft,
    lotSize: raw.lotSize || 0,
    yearBuilt: raw.yearBuilt || 0,
    daysOnMarket: raw.daysOnMarket || 0,
    pricePerSqft,
    estimatedARV: sqft > 0 ? sqft * REGIONAL_AVG_PPSF : (raw.lotSize || 0.25) * REGIONAL_LAND_VALUE_PER_ACRE,
    estimatedRehab: undefined,
    cashFlow: undefined,
    capRate: undefined,
    roi: undefined,
    score: 0, // scored after creation
    url: raw.url,
    notes: undefined,
    saved: false,
  }
}

/** Score a deal 0-100 based on weighted factors */
export function scoreDeal(deal: Deal): number {
  let score = 50

  // Factor 1: Price-to-ARV ratio (30%)
  if (deal.estimatedARV && deal.estimatedARV > 0) {
    const ratio = deal.listPrice / deal.estimatedARV
    if (ratio < 0.50) score += 30
    else if (ratio < 0.65) score += 22
    else if (ratio < 0.75) score += 15
    else if (ratio < 0.85) score += 8
    else if (ratio < 0.95) score += 3
  }

  // Factor 2: Cap rate (20%)
  if (deal.capRate != null) {
    if (deal.capRate > 10) score += 20
    else if (deal.capRate > 8) score += 15
    else if (deal.capRate > 6) score += 10
    else if (deal.capRate > 4) score += 5
  }

  // Factor 3: Days on market (15%) - longer = more negotiation room
  if (deal.daysOnMarket > 90) score += 15
  else if (deal.daysOnMarket > 60) score += 10
  else if (deal.daysOnMarket > 30) score += 5

  // Factor 4: Price/sqft vs regional average (15%)
  const REGIONAL_AVG_PPSF = 165
  if (deal.pricePerSqft > 0 && deal.pricePerSqft < REGIONAL_AVG_PPSF * 0.7) score += 15
  else if (deal.pricePerSqft > 0 && deal.pricePerSqft < REGIONAL_AVG_PPSF * 0.85) score += 10
  else if (deal.pricePerSqft > 0 && deal.pricePerSqft < REGIONAL_AVG_PPSF) score += 5

  // Factor 5: Land/lot bonus (part of location score 20%)
  if (deal.sqft === 0 && deal.beds === 0 && deal.listPrice < 60000) score += 10
  if (deal.lotSize >= 0.5) score += 5

  return Math.min(100, Math.max(0, score))
}

/** Deduplicate listings by normalized address + zip */
export function deduplicateListings(listings: RawListing[]): RawListing[] {
  const seen = new Map<string, RawListing>()
  for (const listing of listings) {
    const key = normalizeAddress(listing.address, listing.zip)
    const existing = seen.get(key)
    if (!existing || (listing.sqft > (existing.sqft || 0))) {
      seen.set(key, listing)
    }
  }
  return Array.from(seen.values())
}

function normalizeAddress(address: string, zip: string): string {
  return `${address.toLowerCase().replace(/[^a-z0-9]/g, '')}-${zip}`
}
