// =============================================================================
// Comparable Sales Analysis Engine
// Adjusts raw comparable sales for subject property differences,
// computes confidence scoring, and derives data-driven ARV ranges.
// =============================================================================

// =============================================================================
// Types
// =============================================================================

export interface SubjectProperty {
  address: string
  sqft: number
  beds: number
  baths: number
  lotSize: number      // acres
  yearBuilt: number
  isNewConstruction: boolean
}

export interface RawRentCastComp {
  id?: string
  formattedAddress?: string
  addressLine1?: string
  city?: string
  state?: string
  zipCode?: string
  price?: number
  squareFootage?: number
  bedrooms?: number
  bathrooms?: number
  lotSize?: number      // sqft from API
  yearBuilt?: number
  lastSaleDate?: string
  lastSalePrice?: number
  distance?: number     // miles
  correlation?: number  // 0-1
  propertyType?: string
  listedDate?: string
}

export interface RentCastAVMResponse {
  price: number
  priceRangeLow: number
  priceRangeHigh: number
  comparables: RawRentCastComp[]
}

export interface ComparableSale {
  id: string
  address: string
  city: string
  state: string
  zip: string
  price: number
  sqft: number
  beds: number
  baths: number
  lotSize: number         // acres
  yearBuilt: number
  lastSaleDate: string
  lastSalePrice: number
  distance: number        // miles from subject
  correlation: number     // RentCast similarity score (0-1)
  pricePerSqft: number
  // Adjustment fields (computed)
  sqftAdjustment: number
  bedBathAdjustment: number
  ageAdjustment: number
  lotSizeAdjustment: number
  conditionAdjustment: number
  totalAdjustment: number
  adjustedPrice: number
  adjustedPricePerSqft: number
  daysOld: number         // days since last sale
}

export interface ARVRange {
  conservative: number    // 25th percentile of adjusted $/sqft x subject sqft
  market: number          // median adjusted $/sqft x subject sqft
  premium: number         // 75th percentile of adjusted $/sqft x subject sqft
}

export interface ConfidenceResult {
  score: number           // 0-100
  label: 'High' | 'Moderate' | 'Low'
  factors: string[]       // explanation of what drives confidence
}

export interface CompAnalysisResult {
  subjectProperty: SubjectProperty
  rentCastEstimate: { price: number; low: number; high: number }
  comps: ComparableSale[]
  derivedARV: ARVRange
  recommendedARV: number  // weighted: 40% RentCast estimate + 60% median adjusted comps
  confidence: ConfidenceResult
  compCount: number
  medianPricePerSqft: number
  averageDistance: number
  averageAge: number      // avg days since sale
}

// =============================================================================
// Adjustment Constants
// =============================================================================

// Per-bedroom delta (avg of Pike County bed adjustments from PIKE_COUNTY_VALUES)
const BED_ADJUSTMENT = 7000

// Per-bathroom delta
const BATH_ADJUSTMENT = 5000

// Per-year-newer adjustment
const YEAR_BUILT_ADJUSTMENT = 1000

// Per-acre lot size adjustment
const LOT_SIZE_ADJUSTMENT_PER_ACRE = 15000

// Sqft adjustment factor (diminishing returns)
const SQFT_ADJUSTMENT_FACTOR = 0.5

// New construction premium over existing homes
const NEW_CONSTRUCTION_PREMIUM = 0.05

// =============================================================================
// Utility Functions
// =============================================================================

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return percentile(sorted, 50)
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => (v - mean) ** 2)
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1))
}

function daysBetween(dateStr: string): number {
  try {
    const saleDate = new Date(dateStr)
    const now = new Date()
    return Math.max(0, Math.round((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)))
  } catch {
    return 365 // default to 1 year if unparseable
  }
}

// =============================================================================
// Core: Transform raw RentCast data into normalized comparables
// =============================================================================

export function normalizeComps(raw: RawRentCastComp[]): ComparableSale[] {
  return raw
    .filter(c => {
      // Must have a price and sqft to be useful
      const price = c.lastSalePrice || c.price || 0
      const sqft = c.squareFootage || 0
      return price > 0 && sqft > 0
    })
    .map((c, idx) => {
      const price = c.lastSalePrice || c.price || 0
      const sqft = c.squareFootage || 0
      const lotSizeAcres = (c.lotSize || 0) / 43560 // convert sqft to acres

      return {
        id: c.id || `comp-${idx}`,
        address: c.formattedAddress || c.addressLine1 || 'Unknown',
        city: c.city || '',
        state: c.state || '',
        zip: c.zipCode || '',
        price,
        sqft,
        beds: c.bedrooms || 0,
        baths: c.bathrooms || 0,
        lotSize: lotSizeAcres,
        yearBuilt: c.yearBuilt || 0,
        lastSaleDate: c.lastSaleDate || '',
        lastSalePrice: c.lastSalePrice || c.price || 0,
        distance: c.distance || 0,
        correlation: c.correlation || 0,
        pricePerSqft: sqft > 0 ? Math.round(price / sqft) : 0,
        daysOld: c.lastSaleDate ? daysBetween(c.lastSaleDate) : 365,
        // Adjustment fields — populated by adjustComps()
        sqftAdjustment: 0,
        bedBathAdjustment: 0,
        ageAdjustment: 0,
        lotSizeAdjustment: 0,
        conditionAdjustment: 0,
        totalAdjustment: 0,
        adjustedPrice: price,
        adjustedPricePerSqft: sqft > 0 ? Math.round(price / sqft) : 0,
      }
    })
    .sort((a, b) => b.correlation - a.correlation) // best correlations first
}

// =============================================================================
// Core: Adjust comparables relative to subject property
// =============================================================================

export function adjustComps(comps: ComparableSale[], subject: SubjectProperty): ComparableSale[] {
  return comps.map(comp => {
    const basePricePerSqft = comp.sqft > 0 ? comp.price / comp.sqft : 0

    // 1. Square Footage Adjustment
    //    Larger subject → positive adjustment (comp price goes up to match)
    //    Uses diminishing returns factor
    const sqftDiff = subject.sqft - comp.sqft
    const sqftAdjustment = Math.round(sqftDiff * basePricePerSqft * SQFT_ADJUSTMENT_FACTOR)

    // 2. Bedroom / Bathroom Adjustment
    const bedDiff = subject.beds - comp.beds
    const bathDiff = subject.baths - comp.baths
    const bedBathAdjustment = Math.round(bedDiff * BED_ADJUSTMENT + bathDiff * BATH_ADJUSTMENT)

    // 3. Age / Year Built Adjustment
    //    Newer subject → positive adjustment
    const subjectYear = subject.yearBuilt || new Date().getFullYear()
    const compYear = comp.yearBuilt || subjectYear
    const yearDiff = subjectYear - compYear
    const ageAdjustment = Math.round(yearDiff * YEAR_BUILT_ADJUSTMENT)

    // 4. Lot Size Adjustment (acres)
    const lotDiff = subject.lotSize - comp.lotSize
    const lotSizeAdjustment = Math.round(lotDiff * LOT_SIZE_ADJUSTMENT_PER_ACRE)

    // 5. Condition Adjustment — new construction premium
    const conditionAdjustment = subject.isNewConstruction
      ? Math.round(comp.price * NEW_CONSTRUCTION_PREMIUM)
      : 0

    const totalAdjustment = sqftAdjustment + bedBathAdjustment + ageAdjustment + lotSizeAdjustment + conditionAdjustment
    const adjustedPrice = comp.price + totalAdjustment
    const adjustedPricePerSqft = subject.sqft > 0
      ? Math.round(adjustedPrice / subject.sqft)
      : comp.pricePerSqft

    return {
      ...comp,
      sqftAdjustment,
      bedBathAdjustment,
      ageAdjustment,
      lotSizeAdjustment,
      conditionAdjustment,
      totalAdjustment,
      adjustedPrice,
      adjustedPricePerSqft,
    }
  })
}

// =============================================================================
// Core: Confidence Scoring
// =============================================================================

export function computeConfidence(comps: ComparableSale[]): ConfidenceResult {
  const factors: string[] = []
  let score = 0

  // 1. Comp Count (max 30 pts)
  if (comps.length >= 10) {
    score += 30
    factors.push(`${comps.length} comparable sales found`)
  } else if (comps.length >= 5) {
    score += 20
    factors.push(`${comps.length} comparable sales found`)
  } else if (comps.length >= 3) {
    score += 10
    factors.push(`Only ${comps.length} comps — limited data`)
  } else {
    factors.push(`Very few comps (${comps.length}) — low reliability`)
  }

  // 2. Recency (max 25 pts)
  const ages = comps.map(c => c.daysOld).filter(d => d > 0)
  const medianAge = ages.length > 0 ? median(ages) : 999
  if (medianAge < 90) {
    score += 25
    factors.push(`Recent sales (median ${Math.round(medianAge)} days ago)`)
  } else if (medianAge < 180) {
    score += 15
    factors.push(`Moderately recent sales (median ${Math.round(medianAge)} days ago)`)
  } else if (medianAge < 365) {
    score += 8
    factors.push(`Older sales data (median ${Math.round(medianAge)} days ago)`)
  } else {
    factors.push('Very old sales data — values may have shifted')
  }

  // 3. Proximity (max 25 pts)
  const distances = comps.map(c => c.distance).filter(d => d > 0)
  const avgDist = distances.length > 0
    ? distances.reduce((a, b) => a + b, 0) / distances.length
    : 99
  if (avgDist < 1) {
    score += 25
    factors.push(`Very close comps (avg ${avgDist.toFixed(1)} mi)`)
  } else if (avgDist < 3) {
    score += 15
    factors.push(`Nearby comps (avg ${avgDist.toFixed(1)} mi)`)
  } else if (avgDist < 5) {
    score += 8
    factors.push(`Moderate distance (avg ${avgDist.toFixed(1)} mi)`)
  } else {
    factors.push(`Distant comps (avg ${avgDist.toFixed(1)} mi) — less comparable`)
  }

  // 4. Consistency — std dev of adjusted $/sqft (max 20 pts)
  const adjustedPpsf = comps.map(c => c.adjustedPricePerSqft).filter(v => v > 0)
  if (adjustedPpsf.length >= 3) {
    const mean = adjustedPpsf.reduce((a, b) => a + b, 0) / adjustedPpsf.length
    const sd = stdDev(adjustedPpsf)
    const cv = mean > 0 ? sd / mean : 1 // coefficient of variation
    if (cv < 0.15) {
      score += 20
      factors.push('High consistency among adjusted comp values')
    } else if (cv < 0.25) {
      score += 12
      factors.push('Moderate consistency among adjusted comp values')
    } else {
      factors.push('Wide variation in comp values — interpret cautiously')
    }
  }

  const label: ConfidenceResult['label'] =
    score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low'

  return { score, label, factors }
}

// =============================================================================
// Core: Derive ARV from adjusted comps + RentCast estimate
// =============================================================================

export function deriveARV(
  comps: ComparableSale[],
  rentCastEstimate: { price: number; low: number; high: number },
  subjectSqft: number
): { arvRange: ARVRange; recommendedARV: number; medianPricePerSqft: number } {
  const adjustedPpsf = comps
    .map(c => c.adjustedPricePerSqft)
    .filter(v => v > 0)
    .sort((a, b) => a - b)

  if (adjustedPpsf.length === 0 && rentCastEstimate.price > 0) {
    // No usable comps — fall back to RentCast estimate only
    return {
      arvRange: {
        conservative: rentCastEstimate.low,
        market: rentCastEstimate.price,
        premium: rentCastEstimate.high,
      },
      recommendedARV: rentCastEstimate.price,
      medianPricePerSqft: subjectSqft > 0
        ? Math.round(rentCastEstimate.price / subjectSqft)
        : 0,
    }
  }

  const p25 = Math.round(percentile(adjustedPpsf, 25) * subjectSqft)
  const p50 = Math.round(percentile(adjustedPpsf, 50) * subjectSqft)
  const p75 = Math.round(percentile(adjustedPpsf, 75) * subjectSqft)

  // Blend with RentCast AVM: 40% AVM + 60% comp median
  const recommended = rentCastEstimate.price > 0
    ? Math.round(rentCastEstimate.price * 0.4 + p50 * 0.6)
    : p50

  return {
    arvRange: { conservative: p25, market: p50, premium: p75 },
    recommendedARV: recommended,
    medianPricePerSqft: Math.round(percentile(adjustedPpsf, 50)),
  }
}

// =============================================================================
// Master: Run full comp analysis pipeline
// =============================================================================

export function runCompAnalysis(
  rawComps: RawRentCastComp[],
  rentCastEstimate: { price: number; low: number; high: number },
  subject: SubjectProperty
): CompAnalysisResult {
  // Step 1: Normalize
  const normalized = normalizeComps(rawComps)

  // Step 2: Adjust
  const adjusted = adjustComps(normalized, subject)

  // Step 3: Confidence
  const confidence = computeConfidence(adjusted)

  // Step 4: Derive ARV
  const { arvRange, recommendedARV, medianPricePerSqft } = deriveARV(
    adjusted,
    rentCastEstimate,
    subject.sqft
  )

  // Aggregate stats
  const distances = adjusted.map(c => c.distance).filter(d => d > 0)
  const ages = adjusted.map(c => c.daysOld).filter(d => d > 0)

  return {
    subjectProperty: subject,
    rentCastEstimate: { price: rentCastEstimate.price, low: rentCastEstimate.low, high: rentCastEstimate.high },
    comps: adjusted,
    derivedARV: arvRange,
    recommendedARV,
    confidence,
    compCount: adjusted.length,
    medianPricePerSqft,
    averageDistance: distances.length > 0
      ? distances.reduce((a, b) => a + b, 0) / distances.length
      : 0,
    averageAge: ages.length > 0
      ? ages.reduce((a, b) => a + b, 0) / ages.length
      : 0,
  }
}
