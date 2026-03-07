// Conashaugh Lakes Community Association (CLCA) reference data
// Based on building codes, deed restrictions, and Horizon Peak Capital business plan

export const CLCA_BUILDING_CODES = {
  community: 'Conashaugh Lakes Community Association',
  township: 'Dingman Township',
  county: 'Pike County',
  state: 'Pennsylvania',
  minSquareFootage: 1200,
  maxLotCoverage: 0.25, // 25% of lot
  setbacks: {
    front: 30, // feet
    side: 15,
    rear: 25,
  },
  maxHeight: 35, // feet
  requiresArchitecturalReview: true,
  modularHomesAllowed: true,
  mobileHomesAllowed: false,
  deedRestrictions: [
    'Single-family residential use only',
    'Minimum 1,200 sq ft living space',
    'No mobile homes or trailers as permanent residences',
    'Modular/manufactured homes must meet HUD standards',
    'Architectural review required before construction',
    'Must connect to community water/sewer or approved well/septic',
    'External modifications require CLCA board approval',
    'Rental period minimum: 7 days (no short-term/Airbnb)',
    'HOA dues must be current for any transfers',
    'No commercial use of residential property',
  ],
  permitFees: {
    clca: { min: 200, max: 500 },
    township: { min: 500, max: 1000 },
  },
  hoaDues: {
    annual: 1200,
    amenities: [
      'Community lake access',
      'Pool & clubhouse',
      'Tennis courts',
      'Road maintenance',
      'Security patrol',
      'Trash collection',
    ],
  },
}

export const HORIZON_PEAK_BUSINESS_PLAN = {
  company: 'Horizon Peak Capital LLC',
  strategy: 'Build-to-Sell / Build-to-Rent Modular Homes',
  targetMarket: 'Pike County, PA and surrounding Pocono region',
  costEstimates: {
    modularHome: { min: 120000, max: 145000 },
    landPurchase: { min: 30000, max: 50000 },
    sitePrep: { min: 25000, max: 80000 },
    deliveryInstall: { min: 15000, max: 25000 },
    permits: { min: 700, max: 1500 },
    customizations: { min: 10000, max: 50000 },
    contingency: { min: 10000, max: 20000 },
    totalLow: 210700,
    totalHigh: 371500,
  },
  builders: [
    {
      name: 'Kintner Modular Homes',
      costPerSqft: { min: 140, max: 180 },
      timeline: '4-6 months',
      notes: 'Local PA builder, good reputation',
    },
    {
      name: 'Hogan Homes',
      costPerSqft: { min: 150, max: 200 },
      timeline: '5-7 months',
      notes: 'Partner with Fidelity Bank financing',
    },
  ],
  banks: [
    {
      name: 'The Dime Bank',
      type: 'Construction-to-Permanent',
      originationFee: 0.01,
      closingCosts: 2500,
      minDown: 0.15,
      notes: '#1 for Pike County, single-close, interest-only build phase',
    },
    {
      name: 'Wayne Bank',
      type: 'Construction-to-Permanent',
      originationFee: 0.01,
      closingCosts: 2000,
      minDown: 0.10,
      notes: 'Low down payment, no PMI available',
    },
    {
      name: 'Citizens Savings Bank',
      type: 'Construction-to-Permanent',
      originationFee: 0.005,
      closingCosts: 1500,
      minDown: 0.15,
      notes: 'Zero-point options, local decision-making',
    },
    {
      name: 'Fidelity Bank',
      type: 'Construction-to-Permanent',
      originationFee: 0.01,
      closingCosts: 2500,
      minDown: 0.15,
      notes: 'Hogan Homes partner, pre-approved packets',
    },
  ],
  drawSchedule: [
    { percent: 0.10, phase: 'Permit & Site Prep' },
    { percent: 0.20, phase: 'Foundation & Utility Lines' },
    { percent: 0.25, phase: 'Modular Unit Delivery & Set' },
    { percent: 0.15, phase: 'Connections & Mechanical' },
    { percent: 0.20, phase: 'Finishes & Landscaping' },
    { percent: 0.10, phase: 'Final Inspection & Occupancy' },
  ],
  saleComps: {
    conservativePerSqft: 220,
    marketAvgPerSqft: 250,
    premiumPerSqft: 270,
    bestCasePerSqft: 290,
  },
  goals: {
    year1: { units: 2, revenue: 800000, profit: 200000 },
    year2: { units: 4, revenue: 1600000, profit: 440000 },
    year3: { units: 6, revenue: 2400000, profit: 720000 },
    year5: { units: 10, revenue: 4000000, profit: 1300000 },
  },
}

export const SAMPLE_PROPERTY = {
  id: 'clca-lot-4204',
  address: 'Lot 4204, Conashaugh Lakes',
  city: 'Dingman Township',
  county: 'Pike County',
  state: 'PA',
  zip: '18328',
  lotSize: 0.5, // acres
  landValue: 50000,
  purchaseDate: '2025-06-01',
  status: 'Planning' as const,
  plannedSqft: 2000,
  plannedBeds: 3,
  plannedBaths: 2,
  estimatedBuildCost: 320000,
  estimatedSalePrice: 500000,
  builder: 'Kintner Modular Homes',
  bank: 'The Dime Bank',
}

// Public data sources for econometric modeling
export const DATA_SOURCES = {
  listings: [
    { name: 'Redfin', url: 'https://www.redfin.com', type: 'Listings & Comps' },
    { name: 'Zillow', url: 'https://www.zillow.com', type: 'Zestimate & Market Data' },
    { name: 'Realtor.com', url: 'https://www.realtor.com', type: 'Listings & Agent Data' },
    { name: 'Homes.com', url: 'https://www.homes.com', type: 'Listings' },
    { name: 'MLS (via Agent)', url: '', type: 'Comprehensive Listings' },
  ],
  economics: [
    { name: 'FRED (Federal Reserve)', url: 'https://fred.stlouisfed.org', type: 'Interest Rates, Employment, GDP' },
    { name: 'Census Bureau', url: 'https://data.census.gov', type: 'Demographics, Housing Stats' },
    { name: 'BLS', url: 'https://www.bls.gov', type: 'Employment, CPI, Wage Data' },
    { name: 'HUD', url: 'https://www.huduser.gov', type: 'Fair Market Rents, Housing Affordability' },
    { name: 'FHFA', url: 'https://www.fhfa.gov', type: 'House Price Index' },
  ],
  regulations: [
    { name: 'Pike County Recorder', url: 'https://www.pikepa.org', type: 'Deed Records, Zoning' },
    { name: 'PA DEP', url: 'https://www.dep.pa.gov', type: 'Environmental Permits' },
    { name: 'Dingman Township', url: '', type: 'Local Zoning & Permits' },
  ],
}
