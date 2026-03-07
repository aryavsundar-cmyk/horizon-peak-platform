// RapidAPI client for real estate listing searches
// Supports Zillow, Redfin, and Realtor.com via third-party RapidAPI services

import type { RawListing } from './deal-transformer'

interface SearchOptions {
  location: string
  minPrice?: number
  maxPrice?: number
  beds?: number
  baths?: number
  limit?: number
}

// ==================== Zillow Working API ====================
export async function fetchZillowListings(
  apiKey: string,
  options: SearchOptions
): Promise<RawListing[]> {
  const params = new URLSearchParams({ location: options.location })
  if (options.minPrice) params.set('minPrice', String(options.minPrice))
  if (options.maxPrice) params.set('maxPrice', String(options.maxPrice))
  if (options.beds) params.set('bedsMin', String(options.beds))

  const res = await fetch(
    `https://zillow-working-api.p.rapidapi.com/search?${params}`,
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'zillow-working-api.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Zillow API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = data.results || data.searchResults || data.props || data.listings || []

  return (Array.isArray(results) ? results : []).slice(0, options.limit || 50).map((item: any): RawListing => ({
    source: 'Zillow',
    address: item.streetAddress || item.address || item.addr || '',
    city: item.city || item.addressCity || '',
    state: item.state || item.addressState || '',
    zip: item.zipcode || item.zip || item.addressZipcode || '',
    price: item.price || item.listPrice || item.unformattedPrice || 0,
    beds: item.bedrooms || item.beds || 0,
    baths: item.bathrooms || item.baths || 0,
    sqft: item.livingArea || item.sqft || item.area || 0,
    lotSize: item.lotSize || item.lotAreaValue || 0,
    yearBuilt: item.yearBuilt || 0,
    daysOnMarket: item.daysOnZillow || item.timeOnZillow || 0,
    url: item.detailUrl
      ? (item.detailUrl.startsWith('http') ? item.detailUrl : `https://www.zillow.com${item.detailUrl}`)
      : `https://www.zillow.com/homedetails/${item.zpid}_zpid/`,
    listingId: item.zpid ? String(item.zpid) : undefined,
  }))
}

// ==================== Redfin API ====================
export async function fetchRedfinListings(
  apiKey: string,
  options: SearchOptions
): Promise<RawListing[]> {
  const res = await fetch(
    `https://redfin-api.p.rapidapi.com/properties/search?location=${encodeURIComponent(options.location)}`,
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'redfin-api.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Redfin API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = data.properties || data.results || data.listings || data.data || []

  return (Array.isArray(results) ? results : []).slice(0, options.limit || 50).map((item: any): RawListing => ({
    source: 'Redfin',
    address: item.streetAddress || item.address || item.streetLine || '',
    city: item.city || '',
    state: item.state || item.stateCode || '',
    zip: item.zip || item.zipCode || '',
    price: item.listPrice || item.price || item.listingPrice || 0,
    beds: item.beds || item.numBeds || item.bedrooms || 0,
    baths: item.baths || item.numBaths || item.bathrooms || 0,
    sqft: item.sqFt || item.sqft || item.area || 0,
    lotSize: item.lotSize || 0,
    yearBuilt: item.yearBuilt || 0,
    daysOnMarket: item.dom || item.daysOnMarket || item.timeOnRedfin || 0,
    url: item.url || item.detailUrl || '#',
    listingId: item.listingId || item.propertyId ? String(item.listingId || item.propertyId) : undefined,
  }))
}

// ==================== US Real Estate Listings (Realtor.com) ====================
export async function fetchRealtorListings(
  apiKey: string,
  options: SearchOptions
): Promise<RawListing[]> {
  const params = new URLSearchParams({
    location: options.location,
    limit: String(options.limit || 50),
  })
  if (options.minPrice) params.set('minPrice', String(options.minPrice))
  if (options.maxPrice) params.set('maxPrice', String(options.maxPrice))
  if (options.beds) params.set('beds', String(options.beds))

  const res = await fetch(
    `https://us-real-estate-listings.p.rapidapi.com/for-sale?${params}`,
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'us-real-estate-listings.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Realtor API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = data.listings || data.results || data.data || data.properties || []

  return (Array.isArray(results) ? results : []).slice(0, options.limit || 50).map((item: any): RawListing => {
    const loc = item.location || item.address || {}
    return {
      source: 'Realtor.com',
      address: loc.streetAddress || loc.address || item.address_line || item.line || '',
      city: loc.city || item.city || loc.addressLocality || '',
      state: loc.state || item.state_code || loc.addressRegion || '',
      zip: loc.postalCode || item.postal_code || loc.zipCode || '',
      price: item.list_price || item.price || item.listPrice || 0,
      beds: item.beds || item.bedrooms || item.description?.beds || 0,
      baths: item.baths || item.bathrooms || item.description?.baths || 0,
      sqft: item.sqft || item.building_size?.size || item.description?.sqft || 0,
      lotSize: item.lot_sqft ? Number(item.lot_sqft) / 43560 : (item.lotSize || 0),
      yearBuilt: item.year_built || item.yearBuilt || 0,
      daysOnMarket: item.days_on_market || item.list_date ? daysSince(item.list_date) : 0,
      url: item.href || item.url || item.detailUrl || '#',
      listingId: item.property_id || item.listing_id ? String(item.property_id || item.listing_id) : undefined,
    }
  })
}

function daysSince(dateStr: string): number {
  try {
    const d = new Date(dateStr)
    return Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000))
  } catch {
    return 0
  }
}
