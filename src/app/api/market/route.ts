import { NextRequest, NextResponse } from 'next/server'

// Market data API - aggregates econometric data
// In production, this would connect to FRED, Census, BLS APIs

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const indicator = searchParams.get('indicator') || 'all'

  const data = {
    mortgageRates: {
      current: 6.85,
      trend: generateTrend(7.2, 6.85, 12),
      change: -0.35,
      source: 'FRED (Freddie Mac)',
    },
    housePriceIndex: {
      current: 412.5,
      trend: generateTrend(385, 412.5, 12),
      change: 7.1,
      source: 'FHFA',
    },
    housingStarts: {
      current: 1420,
      trend: generateTrend(1380, 1420, 12),
      change: 2.3,
      unit: 'thousands',
      source: 'Census Bureau',
    },
    rentalVacancy: {
      current: 6.4,
      trend: generateTrend(6.8, 6.4, 12),
      change: -0.4,
      source: 'Census Bureau',
    },
    unemployment: {
      current: 3.8,
      trend: generateTrend(3.9, 3.8, 12),
      change: -0.1,
      source: 'BLS',
    },
    cpiShelter: {
      current: 5.2,
      trend: generateTrend(6.1, 5.2, 12),
      change: -0.9,
      source: 'BLS',
    },
    consumerConfidence: {
      current: 102.4,
      trend: generateTrend(98, 102.4, 12),
      change: 4.4,
      source: 'Conference Board',
    },
    regionalData: {
      'Pike County, PA': { medianPrice: 285000, pricePerSqft: 165, avgDom: 58, popGrowth: 1.8, medianIncome: 62000, taxRate: 1.42, rentalYield: 6.2, score: 82 },
      'Monroe County, PA': { medianPrice: 245000, pricePerSqft: 148, avgDom: 45, popGrowth: 2.1, medianIncome: 58000, taxRate: 1.65, rentalYield: 7.1, score: 78 },
      'Wayne County, PA': { medianPrice: 215000, pricePerSqft: 135, avgDom: 72, popGrowth: 0.8, medianIncome: 52000, taxRate: 1.38, rentalYield: 5.8, score: 71 },
      'Sussex County, NJ': { medianPrice: 365000, pricePerSqft: 195, avgDom: 38, popGrowth: 0.5, medianIncome: 82000, taxRate: 2.45, rentalYield: 4.5, score: 65 },
      'Orange County, NY': { medianPrice: 420000, pricePerSqft: 225, avgDom: 32, popGrowth: 1.2, medianIncome: 78000, taxRate: 2.12, rentalYield: 4.8, score: 68 },
    },
  }

  if (indicator !== 'all') {
    const key = indicator as keyof typeof data
    if (data[key]) {
      return NextResponse.json({ [indicator]: data[key] })
    }
    return NextResponse.json({ error: 'Unknown indicator' }, { status: 400 })
  }

  return NextResponse.json(data)
}

function generateTrend(start: number, end: number, months: number) {
  const points = []
  const monthNames = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
  for (let i = 0; i < months; i++) {
    const progress = i / (months - 1)
    const noise = (Math.random() - 0.5) * Math.abs(end - start) * 0.15
    const value = start + (end - start) * progress + noise
    points.push({ month: monthNames[i], value: Math.round(value * 100) / 100 })
  }
  return points
}
