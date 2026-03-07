import { NextRequest, NextResponse } from 'next/server'

// Deal search API endpoint
// In production, this would proxy to Redfin, Zillow, Realtor.com APIs
// For now, it returns structured mock data based on search parameters

interface SearchParams {
  location?: string
  minPrice?: number
  maxPrice?: number
  beds?: number
  baths?: number
  propertyType?: string
  source?: string
  minLotSize?: number
  maxDom?: number
}

// Mock listing database - in production this would query real APIs
const MOCK_LISTINGS = [
  // Pike County PA
  { id: 'rf-1', source: 'Redfin', address: '142 Lakeview Dr', city: 'Milford', state: 'PA', zip: '18337', listPrice: 45000, beds: 0, baths: 0, sqft: 0, lotSize: 0.75, yearBuilt: 0, daysOnMarket: 120, type: 'Land' },
  { id: 'rf-2', source: 'Redfin', address: '88 Mountain Rd', city: 'Bushkill', state: 'PA', zip: '18324', listPrice: 159000, beds: 3, baths: 1, sqft: 1400, lotSize: 0.4, yearBuilt: 1985, daysOnMarket: 65, type: 'Single Family' },
  { id: 'zl-1', source: 'Zillow', address: '201 Pocono Blvd', city: 'East Stroudsburg', state: 'PA', zip: '18301', listPrice: 225000, beds: 4, baths: 2, sqft: 2100, lotSize: 0.3, yearBuilt: 2001, daysOnMarket: 14, type: 'Single Family' },
  { id: 'rf-3', source: 'Redfin', address: 'Lot 12 Silver Lake Rd', city: 'Dingmans Ferry', state: 'PA', zip: '18328', listPrice: 35000, beds: 0, baths: 0, sqft: 0, lotSize: 0.6, yearBuilt: 0, daysOnMarket: 200, type: 'Land' },
  { id: 'rt-1', source: 'Realtor.com', address: '55 Birch Lane', city: 'Matamoras', state: 'PA', zip: '18336', listPrice: 189000, beds: 3, baths: 2, sqft: 1600, lotSize: 0.35, yearBuilt: 1995, daysOnMarket: 42, type: 'Single Family' },
  { id: 'zl-2', source: 'Zillow', address: '412 Route 209', city: 'Marshalls Creek', state: 'PA', zip: '18335', listPrice: 275000, beds: 4, baths: 3, sqft: 2400, lotSize: 0.5, yearBuilt: 2005, daysOnMarket: 28, type: 'Single Family' },
  // Monroe County PA
  { id: 'rf-4', source: 'Redfin', address: '789 Oak St', city: 'Stroudsburg', state: 'PA', zip: '18360', listPrice: 199000, beds: 3, baths: 2, sqft: 1800, lotSize: 0.25, yearBuilt: 1990, daysOnMarket: 35, type: 'Single Family' },
  { id: 'rt-2', source: 'Realtor.com', address: '22 Maple Ave', city: 'Mount Pocono', state: 'PA', zip: '18344', listPrice: 165000, beds: 2, baths: 1, sqft: 1200, lotSize: 0.2, yearBuilt: 1978, daysOnMarket: 90, type: 'Single Family' },
  // Nationwide samples
  { id: 'zl-3', source: 'Zillow', address: '1201 Main St', city: 'Austin', state: 'TX', zip: '78701', listPrice: 385000, beds: 3, baths: 2, sqft: 1900, lotSize: 0.15, yearBuilt: 2010, daysOnMarket: 7, type: 'Single Family' },
  { id: 'rf-5', source: 'Redfin', address: '456 Peach Rd', city: 'Atlanta', state: 'GA', zip: '30301', listPrice: 320000, beds: 4, baths: 3, sqft: 2200, lotSize: 0.2, yearBuilt: 2015, daysOnMarket: 12, type: 'Single Family' },
]

function scoreDeal(listing: typeof MOCK_LISTINGS[0]): number {
  let score = 50 // base score

  // Price-to-estimated-value ratio (30%)
  const estimatedValue = listing.sqft > 0 ? listing.sqft * 250 : listing.lotSize * 500000
  const priceRatio = listing.listPrice / estimatedValue
  if (priceRatio < 0.5) score += 30
  else if (priceRatio < 0.65) score += 22
  else if (priceRatio < 0.75) score += 15
  else if (priceRatio < 0.85) score += 8

  // Days on market factor (15%) - longer DOM = more negotiation room
  if (listing.daysOnMarket > 90) score += 15
  else if (listing.daysOnMarket > 60) score += 10
  else if (listing.daysOnMarket > 30) score += 5

  // Land deals get bonus for new construction potential
  if (listing.type === 'Land' && listing.listPrice < 60000) score += 10

  // Cap score at 100
  return Math.min(100, Math.max(0, score))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')?.toLowerCase() || ''
  const minPrice = parseInt(searchParams.get('minPrice') || '0')
  const maxPrice = parseInt(searchParams.get('maxPrice') || '999999999')
  const source = searchParams.get('source') || 'all'

  let results = MOCK_LISTINGS

  // Filter by location
  if (location) {
    results = results.filter(l =>
      l.city.toLowerCase().includes(location) ||
      l.state.toLowerCase().includes(location) ||
      l.zip.includes(location) ||
      l.address.toLowerCase().includes(location)
    )
  }

  // Filter by price
  results = results.filter(l => l.listPrice >= minPrice && l.listPrice <= maxPrice)

  // Filter by source
  if (source !== 'all') {
    results = results.filter(l => l.source.toLowerCase() === source.toLowerCase())
  }

  // Score and sort
  const scored = results.map(l => ({
    ...l,
    score: scoreDeal(l),
    pricePerSqft: l.sqft > 0 ? Math.round(l.listPrice / l.sqft) : 0,
    estimatedARV: l.sqft > 0 ? l.sqft * 250 : l.lotSize * 500000,
  })).sort((a, b) => b.score - a.score)

  return NextResponse.json({
    results: scored,
    count: scored.length,
    marketStats: {
      medianPrice: Math.round(scored.reduce((s, l) => s + l.listPrice, 0) / (scored.length || 1)),
      avgDom: Math.round(scored.reduce((s, l) => s + l.daysOnMarket, 0) / (scored.length || 1)),
      inventory: scored.length,
    },
  })
}
