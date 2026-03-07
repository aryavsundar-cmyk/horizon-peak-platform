'use client'

import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Shield,
  Home,
  DollarSign,
  Users,
  BarChart3,
  Globe,
  ExternalLink,
  Info,
  Building,
  Landmark,
  Scale,
} from 'lucide-react'
import { formatCurrency, formatPercent, cn } from '../../lib/utils'
import { CLCA_BUILDING_CODES, DATA_SOURCES } from '../../data/conashaugh-lakes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MacroIndicator {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  description: string
}

interface RegionalData {
  region: string
  state: string
  medianPrice: number
  pricePerSqft: number
  avgDOM: number
  populationGrowth: number
  medianIncome: number
  propertyTaxRate: number
  rentalYield: number
  overallScore: number
}

interface HousingRestriction {
  region: string
  zoning: string
  shortTermRental: 'Allowed' | 'Banned' | 'Restricted'
  minLotSize: string
  setbacks: string
  hoaRestrictions: string
  permitRequirements: string
  modularPolicy: string
  bestFor: string[]
}

interface RentalVsSaleScenario {
  region: string
  salePrice: number
  agentFees: number
  closingCosts: number
  netProceeds: number
  totalROI: number
  monthlyRent: number
  annualCashFlow: number
  capRate: number
  fiveYearCashFlow: number
  fiveYearROI: number
  recommendation: 'RENT' | 'SELL'
}

interface DataSourceEntry {
  name: string
  url: string
  type: string
  status: 'Connected' | 'Manual' | 'Not Connected'
  description: string
  category: 'Listings' | 'Economic Data' | 'Regulatory'
}

interface FredIndicator {
  label: string
  unit: string
  current: string
  data: { month: string; value: number }[]
  color: string
}

// ---------------------------------------------------------------------------
// Sample Data
// ---------------------------------------------------------------------------

const macroIndicators: MacroIndicator[] = [
  {
    label: 'National Median Home Price',
    value: '$412,000',
    change: 3.8,
    icon: <Home className="w-5 h-5" />,
    description: 'S&P/Case-Shiller Index',
  },
  {
    label: '30-Year Mortgage Rate',
    value: '6.85%',
    change: -0.15,
    icon: <Landmark className="w-5 h-5" />,
    description: 'Freddie Mac PMMS',
  },
  {
    label: 'Housing Starts (YoY)',
    value: '+2.3%',
    change: 2.3,
    icon: <Building className="w-5 h-5" />,
    description: 'Census Bureau',
  },
  {
    label: 'Consumer Confidence',
    value: '102.4',
    change: 1.2,
    icon: <Users className="w-5 h-5" />,
    description: 'Conference Board',
  },
  {
    label: 'Unemployment Rate',
    value: '3.8%',
    change: -0.1,
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'BLS Monthly Report',
  },
  {
    label: 'CPI (Shelter)',
    value: '+5.2%',
    change: 5.2,
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Bureau of Labor Statistics',
  },
]

const regionalData: RegionalData[] = [
  {
    region: 'Pike County',
    state: 'PA',
    medianPrice: 285000,
    pricePerSqft: 172,
    avgDOM: 62,
    populationGrowth: 1.4,
    medianIncome: 62500,
    propertyTaxRate: 1.82,
    rentalYield: 7.2,
    overallScore: 88,
  },
  {
    region: 'Monroe County',
    state: 'PA',
    medianPrice: 310000,
    pricePerSqft: 185,
    avgDOM: 48,
    populationGrowth: 2.1,
    medianIncome: 65200,
    propertyTaxRate: 2.14,
    rentalYield: 6.5,
    overallScore: 82,
  },
  {
    region: 'Wayne County',
    state: 'PA',
    medianPrice: 265000,
    pricePerSqft: 158,
    avgDOM: 78,
    populationGrowth: 0.6,
    medianIncome: 55800,
    propertyTaxRate: 1.95,
    rentalYield: 6.8,
    overallScore: 74,
  },
  {
    region: 'Sussex County',
    state: 'NJ',
    medianPrice: 375000,
    pricePerSqft: 215,
    avgDOM: 38,
    populationGrowth: 0.3,
    medianIncome: 85400,
    propertyTaxRate: 2.85,
    rentalYield: 5.1,
    overallScore: 65,
  },
  {
    region: 'Orange County',
    state: 'NY',
    medianPrice: 425000,
    pricePerSqft: 248,
    avgDOM: 32,
    populationGrowth: 1.8,
    medianIncome: 82100,
    propertyTaxRate: 2.68,
    rentalYield: 5.5,
    overallScore: 70,
  },
]

const housingRestrictions: HousingRestriction[] = [
  {
    region: 'Pike County, PA (Conashaugh Lakes)',
    zoning: 'R-1 Residential / CLCA Overlay',
    shortTermRental: 'Restricted',
    minLotSize: `Per CLCA: max ${CLCA_BUILDING_CODES.maxLotCoverage * 100}% lot coverage`,
    setbacks: `Front: ${CLCA_BUILDING_CODES.setbacks.front}ft, Side: ${CLCA_BUILDING_CODES.setbacks.side}ft, Rear: ${CLCA_BUILDING_CODES.setbacks.rear}ft`,
    hoaRestrictions: `$${CLCA_BUILDING_CODES.hoaDues.annual}/yr dues, architectural review required, min ${CLCA_BUILDING_CODES.minSquareFootage} sqft`,
    permitRequirements: `CLCA fee $${CLCA_BUILDING_CODES.permitFees.clca.min}-$${CLCA_BUILDING_CODES.permitFees.clca.max} + Township $${CLCA_BUILDING_CODES.permitFees.township.min}-$${CLCA_BUILDING_CODES.permitFees.township.max}`,
    modularPolicy: CLCA_BUILDING_CODES.modularHomesAllowed
      ? 'Modular allowed (HUD standards required). No mobile homes.'
      : 'Modular homes not allowed.',
    bestFor: ['New Construction', 'Rentals (7+ day min)'],
  },
  {
    region: 'Pike County, PA (General)',
    zoning: 'R-1 / R-2 Residential, varies by township',
    shortTermRental: 'Restricted',
    minLotSize: '0.5 acres (varies by township)',
    setbacks: 'Front: 30ft, Side: 15ft, Rear: 25ft (typical)',
    hoaRestrictions: 'Varies by community; many areas have no HOA',
    permitRequirements: 'Township building permit + county review, $500-$1,500',
    modularPolicy: 'Generally allowed, must meet PA UCC standards',
    bestFor: ['New Construction', 'Flips', 'Rentals'],
  },
  {
    region: 'Monroe County, PA',
    zoning: 'R-1 / R-2 Residential + Resort Overlay zones',
    shortTermRental: 'Allowed',
    minLotSize: '0.25 - 1 acre depending on zone',
    setbacks: 'Front: 25ft, Side: 12ft, Rear: 20ft',
    hoaRestrictions: 'Resort communities have strict HOAs; rural areas often no HOA',
    permitRequirements: 'County building permit, ~$800-$2,000',
    modularPolicy: 'Allowed in most zones, HUD/PA UCC compliance required',
    bestFor: ['Rentals', 'Flips'],
  },
  {
    region: 'Wayne County, PA',
    zoning: 'Rural Residential / Agricultural',
    shortTermRental: 'Allowed',
    minLotSize: '1 acre minimum in most zones',
    setbacks: 'Front: 40ft, Side: 20ft, Rear: 30ft',
    hoaRestrictions: 'Minimal; few organized HOAs outside lake communities',
    permitRequirements: 'Township permit, $400-$1,000',
    modularPolicy: 'Broadly allowed, less restrictive than neighboring counties',
    bestFor: ['New Construction', 'Rentals'],
  },
  {
    region: 'Sussex County, NJ',
    zoning: 'R-1 through R-5 Residential zones',
    shortTermRental: 'Banned',
    minLotSize: '0.5 - 2 acres depending on zone',
    setbacks: 'Front: 35ft, Side: 15ft, Rear: 30ft',
    hoaRestrictions: 'Many communities have HOAs with rental restrictions',
    permitRequirements: 'NJ DCA permit, $1,500-$3,500, rigorous inspections',
    modularPolicy: 'Allowed with NJ DCA approval; lengthy approval process',
    bestFor: ['Flips'],
  },
  {
    region: 'Orange County, NY',
    zoning: 'R-1 Residential / Mixed Use in villages',
    shortTermRental: 'Restricted',
    minLotSize: '0.25 - 1 acre',
    setbacks: 'Front: 30ft, Side: 10ft, Rear: 25ft',
    hoaRestrictions: 'Common in planned developments; moderate restrictions',
    permitRequirements: 'Town building permit + NY State code compliance, $1,000-$3,000',
    modularPolicy: 'Allowed with NY State certification, moderate process',
    bestFor: ['Flips', 'Rentals'],
  },
]

const rentalVsSaleData: RentalVsSaleScenario[] = [
  {
    region: 'Pike County, PA',
    salePrice: 375000,
    agentFees: 22500,
    closingCosts: 11250,
    netProceeds: 341250,
    totalROI: 32.5,
    monthlyRent: 2200,
    annualCashFlow: 18400,
    capRate: 7.1,
    fiveYearCashFlow: 92000,
    fiveYearROI: 48.2,
    recommendation: 'RENT',
  },
  {
    region: 'Monroe County, PA',
    salePrice: 395000,
    agentFees: 23700,
    closingCosts: 11850,
    netProceeds: 359450,
    totalROI: 28.6,
    monthlyRent: 2100,
    annualCashFlow: 15800,
    capRate: 6.2,
    fiveYearCashFlow: 79000,
    fiveYearROI: 39.4,
    recommendation: 'SELL',
  },
  {
    region: 'Wayne County, PA',
    salePrice: 340000,
    agentFees: 20400,
    closingCosts: 10200,
    netProceeds: 309400,
    totalROI: 25.8,
    monthlyRent: 1900,
    annualCashFlow: 14200,
    capRate: 6.5,
    fiveYearCashFlow: 71000,
    fiveYearROI: 42.6,
    recommendation: 'RENT',
  },
  {
    region: 'Sussex County, NJ',
    salePrice: 465000,
    agentFees: 27900,
    closingCosts: 13950,
    netProceeds: 423150,
    totalROI: 22.3,
    monthlyRent: 2500,
    annualCashFlow: 16200,
    capRate: 4.8,
    fiveYearCashFlow: 81000,
    fiveYearROI: 28.5,
    recommendation: 'SELL',
  },
  {
    region: 'Orange County, NY',
    salePrice: 510000,
    agentFees: 30600,
    closingCosts: 15300,
    netProceeds: 464100,
    totalROI: 20.1,
    monthlyRent: 2700,
    annualCashFlow: 17800,
    capRate: 5.2,
    fiveYearCashFlow: 89000,
    fiveYearROI: 34.8,
    recommendation: 'SELL',
  },
]

const radarData = [
  { metric: 'ROI', sale: 75, rental: 85 },
  { metric: 'Risk', sale: 60, rental: 45 },
  { metric: 'Liquidity', sale: 90, rental: 35 },
  { metric: 'Tax Benefits', sale: 40, rental: 80 },
  { metric: 'Cash Flow', sale: 30, rental: 90 },
  { metric: 'Appreciation', sale: 85, rental: 70 },
]

const dataSourceEntries: DataSourceEntry[] = [
  // Listings
  ...DATA_SOURCES.listings.map((s) => ({
    name: s.name,
    url: s.url,
    type: s.type,
    status: (s.name === 'Redfin' || s.name === 'Zillow'
      ? 'Connected'
      : s.name === 'Realtor.com'
        ? 'Manual'
        : 'Not Connected') as DataSourceEntry['status'],
    description:
      s.name === 'Redfin'
        ? 'Active listings, sold comps, price history, and market trends for Pike County and surrounding areas.'
        : s.name === 'Zillow'
          ? 'Zestimate valuations, rent estimates, market heat index, and neighborhood-level analytics.'
          : s.name === 'Realtor.com'
            ? 'Agent contact data, listing details, and school/neighborhood ratings.'
            : s.name === 'Homes.com'
              ? 'Property listings, neighborhood data, and home value estimates.'
              : 'Full MLS access including off-market and coming-soon listings via licensed agent.',
    category: 'Listings' as const,
  })),
  // Economics
  ...DATA_SOURCES.economics.map((s) => ({
    name: s.name,
    url: s.url,
    type: s.type,
    status: (s.name === 'FRED (Federal Reserve)' || s.name === 'Census Bureau'
      ? 'Connected'
      : s.name === 'BLS'
        ? 'Manual'
        : 'Not Connected') as DataSourceEntry['status'],
    description:
      s.name === 'FRED (Federal Reserve)'
        ? 'Mortgage rates, treasury yields, GDP, unemployment, CPI, and 800+ economic series via API.'
        : s.name === 'Census Bureau'
          ? 'ACS demographic data, population projections, housing vacancy rates, and income statistics.'
          : s.name === 'BLS'
            ? 'Employment data, CPI breakdowns, wage growth, and regional labor market statistics.'
            : s.name === 'HUD'
              ? 'Fair Market Rents (FMR), Housing Affordability Index, and Section 8 payment standards.'
              : 'FHFA House Price Index, conforming loan limits, and regional price appreciation data.',
    category: 'Economic Data' as const,
  })),
  // Regulations
  ...DATA_SOURCES.regulations.map((s) => ({
    name: s.name,
    url: s.url,
    type: s.type,
    status: (s.name === 'Pike County Recorder'
      ? 'Manual'
      : 'Not Connected') as DataSourceEntry['status'],
    description:
      s.name === 'Pike County Recorder'
        ? 'Deed records, property transfers, lien searches, and zoning classification lookups.'
        : s.name === 'PA DEP'
          ? 'Wetland permits, septic system approvals, stormwater management, and environmental compliance.'
          : 'Local zoning ordinances, building permits, subdivision regulations, and land use applications.',
    category: 'Regulatory' as const,
  })),
]

const fredIndicators: FredIndicator[] = [
  {
    label: '30-Year Mortgage Rate',
    unit: '%',
    current: '6.85%',
    color: '#2dd4bf',
    data: [
      { month: 'Apr', value: 7.12 },
      { month: 'May', value: 7.03 },
      { month: 'Jun', value: 6.95 },
      { month: 'Jul', value: 6.88 },
      { month: 'Aug', value: 6.92 },
      { month: 'Sep', value: 6.78 },
      { month: 'Oct', value: 6.72 },
      { month: 'Nov', value: 6.84 },
      { month: 'Dec', value: 6.91 },
      { month: 'Jan', value: 6.89 },
      { month: 'Feb', value: 6.82 },
      { month: 'Mar', value: 6.85 },
    ],
  },
  {
    label: 'FHFA House Price Index',
    unit: '',
    current: '418.2',
    color: '#22d3ee',
    data: [
      { month: 'Apr', value: 395.4 },
      { month: 'May', value: 398.1 },
      { month: 'Jun', value: 401.3 },
      { month: 'Jul', value: 403.8 },
      { month: 'Aug', value: 406.2 },
      { month: 'Sep', value: 408.5 },
      { month: 'Oct', value: 410.1 },
      { month: 'Nov', value: 412.4 },
      { month: 'Dec', value: 414.8 },
      { month: 'Jan', value: 415.9 },
      { month: 'Feb', value: 417.1 },
      { month: 'Mar', value: 418.2 },
    ],
  },
  {
    label: 'Housing Starts (thousands)',
    unit: 'K',
    current: '1,432K',
    color: '#a78bfa',
    data: [
      { month: 'Apr', value: 1380 },
      { month: 'May', value: 1395 },
      { month: 'Jun', value: 1410 },
      { month: 'Jul', value: 1388 },
      { month: 'Aug', value: 1402 },
      { month: 'Sep', value: 1415 },
      { month: 'Oct', value: 1398 },
      { month: 'Nov', value: 1420 },
      { month: 'Dec', value: 1435 },
      { month: 'Jan', value: 1418 },
      { month: 'Feb', value: 1425 },
      { month: 'Mar', value: 1432 },
    ],
  },
  {
    label: 'Rental Vacancy Rate',
    unit: '%',
    current: '6.6%',
    color: '#fb923c',
    data: [
      { month: 'Apr', value: 6.4 },
      { month: 'May', value: 6.3 },
      { month: 'Jun', value: 6.2 },
      { month: 'Jul', value: 6.3 },
      { month: 'Aug', value: 6.4 },
      { month: 'Sep', value: 6.5 },
      { month: 'Oct', value: 6.4 },
      { month: 'Nov', value: 6.5 },
      { month: 'Dec', value: 6.6 },
      { month: 'Jan', value: 6.5 },
      { month: 'Feb', value: 6.6 },
      { month: 'Mar', value: 6.6 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-teal-400/10 text-teal-400">{icon}</div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <p className="text-sm text-slate-400 ml-12">{subtitle}</p>
    </div>
  )
}

function MacroCard({ indicator }: { indicator: MacroIndicator }) {
  const isPositive = indicator.change >= 0
  const isRate = indicator.label.includes('Mortgage') || indicator.label.includes('Unemployment')
  const trendGood = isRate ? !isPositive : isPositive

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-400/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-slate-700/50 text-teal-400">{indicator.icon}</div>
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full',
            trendGood
              ? 'text-emerald-400 bg-emerald-400/10'
              : 'text-red-400 bg-red-400/10'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {isPositive ? '+' : ''}
          {indicator.change.toFixed(2)}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{indicator.value}</p>
      <p className="text-sm text-slate-300 font-medium mb-0.5">{indicator.label}</p>
      <p className="text-xs text-slate-500">{indicator.description}</p>
    </div>
  )
}

function RegionalTable({ data }: { data: RegionalData[] }) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-400/10'
    if (score >= 75) return 'text-teal-400 bg-teal-400/10'
    if (score >= 65) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-red-400 bg-red-400/10'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-3 text-slate-400 font-medium">Region</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Median Price</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Price/Sqft</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Avg DOM</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Pop. Growth</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Median Income</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Tax Rate</th>
            <th className="text-right py-3 px-3 text-slate-400 font-medium">Rental Yield</th>
            <th className="text-center py-3 px-3 text-slate-400 font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.region}
              className={cn(
                'border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors',
                idx === 0 && 'bg-teal-400/5'
              )}
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span className="text-white font-medium">
                    {row.region}, {row.state}
                  </span>
                </div>
              </td>
              <td className="text-right py-3 px-3 text-slate-300">
                {formatCurrency(row.medianPrice)}
              </td>
              <td className="text-right py-3 px-3 text-slate-300">
                ${row.pricePerSqft}
              </td>
              <td className="text-right py-3 px-3 text-slate-300">{row.avgDOM}</td>
              <td className="text-right py-3 px-3">
                <span
                  className={
                    row.populationGrowth >= 1.0 ? 'text-emerald-400' : 'text-slate-300'
                  }
                >
                  {formatPercent(row.populationGrowth)}
                </span>
              </td>
              <td className="text-right py-3 px-3 text-slate-300">
                {formatCurrency(row.medianIncome)}
              </td>
              <td className="text-right py-3 px-3 text-slate-300">
                {formatPercent(row.propertyTaxRate)}
              </td>
              <td className="text-right py-3 px-3">
                <span
                  className={
                    row.rentalYield >= 6.5 ? 'text-emerald-400' : 'text-slate-300'
                  }
                >
                  {formatPercent(row.rentalYield)}
                </span>
              </td>
              <td className="text-center py-3 px-3">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-10 py-0.5 rounded-full text-xs font-bold',
                    getScoreColor(row.overallScore)
                  )}
                >
                  {row.overallScore}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RestrictionCard({
  restriction,
  isExpanded,
  onToggle,
}: {
  restriction: HousingRestriction
  isExpanded: boolean
  onToggle: () => void
}) {
  const strBadge = (policy: HousingRestriction['shortTermRental']) => {
    const colors = {
      Allowed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      Restricted: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      Banned: 'text-red-400 bg-red-400/10 border-red-400/20',
    }
    return colors[policy]
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-teal-400/20 transition-colors">
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="text-white font-semibold">{restriction.region}</span>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border',
              strBadge(restriction.shortTermRental)
            )}
          >
            STR: {restriction.shortTermRental}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {restriction.bestFor.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
            >
              {tag}
            </span>
          ))}
          <svg
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <DetailRow label="Zoning" value={restriction.zoning} />
            <DetailRow label="Short-Term Rental" value={restriction.shortTermRental} />
            <DetailRow label="Min Lot Size" value={restriction.minLotSize} />
            <DetailRow label="Setbacks" value={restriction.setbacks} />
            <DetailRow label="HOA Restrictions" value={restriction.hoaRestrictions} />
            <DetailRow label="Permit Requirements" value={restriction.permitRequirements} />
            <div className="md:col-span-2">
              <DetailRow label="Modular/Manufactured Home Policy" value={restriction.modularPolicy} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  )
}

function RentalVsSaleCard({ scenario }: { scenario: RentalVsSaleScenario }) {
  const isRent = scenario.recommendation === 'RENT'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-400/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-400" />
          <h4 className="text-white font-semibold">{scenario.region}</h4>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-3 py-1 rounded-full',
            isRent
              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
          )}
        >
          {scenario.recommendation}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Sale Side */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Sale Scenario
          </p>
          <div className="space-y-1.5">
            <MiniRow label="Sale Price" value={formatCurrency(scenario.salePrice)} />
            <MiniRow label="Agent Fees (6%)" value={`-${formatCurrency(scenario.agentFees)}`} />
            <MiniRow label="Closing Costs" value={`-${formatCurrency(scenario.closingCosts)}`} />
            <div className="border-t border-slate-700 pt-1.5">
              <MiniRow label="Net Proceeds" value={formatCurrency(scenario.netProceeds)} bold />
              <MiniRow label="Total ROI" value={formatPercent(scenario.totalROI)} bold />
            </div>
          </div>
        </div>

        {/* Rental Side */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Rental Scenario
          </p>
          <div className="space-y-1.5">
            <MiniRow label="Monthly Rent" value={formatCurrency(scenario.monthlyRent)} />
            <MiniRow label="Annual Cash Flow" value={formatCurrency(scenario.annualCashFlow)} />
            <MiniRow label="Cap Rate" value={formatPercent(scenario.capRate)} />
            <div className="border-t border-slate-700 pt-1.5">
              <MiniRow label="5-Year Cash Flow" value={formatCurrency(scenario.fiveYearCashFlow)} bold />
              <MiniRow label="5-Year ROI" value={formatPercent(scenario.fiveYearROI)} bold />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'rounded-lg p-3 text-sm',
          isRent ? 'bg-emerald-400/5 border border-emerald-400/10' : 'bg-cyan-400/5 border border-cyan-400/10'
        )}
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
          <p className={cn('text-sm', isRent ? 'text-emerald-300' : 'text-cyan-300')}>
            Based on current market conditions in {scenario.region},{' '}
            <strong>{isRent ? 'RENTING' : 'SELLING'}</strong> is recommended.
            {isRent
              ? ` The ${formatPercent(scenario.capRate)} cap rate and strong rental demand support a hold strategy.`
              : ` Current appreciation and lower rental yields favor capturing gains through a sale.`}
          </p>
        </div>
      </div>
    </div>
  )
}

function MiniRow({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={cn(bold ? 'text-white font-semibold' : 'text-slate-300')}>
        {value}
      </span>
    </div>
  )
}

function DataSourceCard({ source }: { source: DataSourceEntry }) {
  const statusStyles = {
    Connected: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Manual: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'Not Connected': 'text-slate-500 bg-slate-700/50 border-slate-600',
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-400/20 transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-white font-semibold text-sm">{source.name}</h4>
          <p className="text-xs text-teal-400 mt-0.5">{source.type}</p>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border whitespace-nowrap',
            statusStyles[source.status]
          )}
        >
          {source.status}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4 flex-grow">{source.description}</p>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Visit {source.name}
        </a>
      )}
    </div>
  )
}

function FredChartCard({ indicator }: { indicator: FredIndicator }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-400/20 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-white font-semibold text-sm">{indicator.label}</h4>
        <span className="text-lg font-bold text-white">{indicator.current}</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">Last 12 months</p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={indicator.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
              domain={['auto', 'auto']}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: indicator.color }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={indicator.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: indicator.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MarketAnalysis() {
  const [expandedRestrictions, setExpandedRestrictions] = useState<Set<number>>(new Set())
  const [selectedRentVsSaleRegion, setSelectedRentVsSaleRegion] = useState(0)
  const [activeDataCategory, setActiveDataCategory] = useState<
    'All' | 'Listings' | 'Economic Data' | 'Regulatory'
  >('All')

  const toggleRestriction = (index: number) => {
    setExpandedRestrictions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const filteredDataSources =
    activeDataCategory === 'All'
      ? dataSourceEntries
      : dataSourceEntries.filter((s) => s.category === activeDataCategory)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20">
              <BarChart3 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Market Analysis Hub</h1>
              <p className="text-sm text-slate-400">
                Horizon Peak Capital &mdash; Regional Real Estate Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Section 1: Market Overview Dashboard                             */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionHeader
            icon={<Globe className="w-5 h-5" />}
            title="Market Overview Dashboard"
            subtitle="Key macro-level indicators driving the U.S. housing market"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {macroIndicators.map((indicator) => (
              <MacroCard key={indicator.label} indicator={indicator} />
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 2: Regional Market Comparison                            */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionHeader
            icon={<MapPin className="w-5 h-5" />}
            title="Regional Market Comparison"
            subtitle="Side-by-side investment metrics for target counties"
          />
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <RegionalTable data={regionalData} />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> 85+: Excellent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> 75-84: Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> 65-74: Fair
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> &lt;65: Caution
            </span>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 3: Housing Restrictions Intelligence                     */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionHeader
            icon={<Shield className="w-5 h-5" />}
            title="Housing Restrictions Intelligence"
            subtitle="Zoning, rental policies, and building code requirements by area"
          />
          <div className="space-y-3">
            {housingRestrictions.map((restriction, idx) => (
              <RestrictionCard
                key={restriction.region}
                restriction={restriction}
                isExpanded={expandedRestrictions.has(idx)}
                onToggle={() => toggleRestriction(idx)}
              />
            ))}
          </div>
          <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-400" />
              <span>
                Conashaugh Lakes (CLCA) data sourced from community deed restrictions and building
                codes. Other regions use publicly available zoning ordinances. Always verify with
                local authorities before making investment decisions.
              </span>
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 4: Rental vs. Sale Analysis                              */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionHeader
            icon={<Scale className="w-5 h-5" />}
            title="Rental vs. Sale Analysis"
            subtitle="Compare exit strategies for a typical build (~2,000 sqft, 3BR/2BA)"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Region selector + cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {rentalVsSaleData.map((s, idx) => (
                  <button
                    key={s.region}
                    onClick={() => setSelectedRentVsSaleRegion(idx)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium',
                      selectedRentVsSaleRegion === idx
                        ? 'bg-teal-400/10 text-teal-400 border-teal-400/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {s.region}
                  </button>
                ))}
              </div>
              <RentalVsSaleCard scenario={rentalVsSaleData[selectedRentVsSaleRegion]} />
            </div>

            {/* Radar chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center">
              <h4 className="text-sm font-semibold text-white mb-2">Strategy Comparison</h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: '#64748b' }}
                    />
                    <Radar
                      name="Sale"
                      dataKey="sale"
                      stroke="#22d3ee"
                      fill="#22d3ee"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Rental"
                      dataKey="rental"
                      stroke="#2dd4bf"
                      fill="#2dd4bf"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 5: Data Sources & Connections                            */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionHeader
            icon={<Globe className="w-5 h-5" />}
            title="Data Sources & Connections"
            subtitle="External data providers powering our market intelligence"
          />

          {/* Category filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['All', 'Listings', 'Economic Data', 'Regulatory'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveDataCategory(cat)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium',
                    activeDataCategory === cat
                      ? 'bg-teal-400/10 text-teal-400 border-teal-400/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                  )}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDataSources.map((source) => (
              <DataSourceCard key={source.name} source={source} />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Connected: Live API
              feed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> Manual: Periodic
              import
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> Not Connected: Planned
            </span>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 6: Econometric Indicators (FRED Data)                    */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionHeader
            icon={<Landmark className="w-5 h-5" />}
            title="Econometric Indicators"
            subtitle="Federal Reserve Economic Data (FRED) trends impacting housing markets"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fredIndicators.map((indicator) => (
              <FredChartCard key={indicator.label} indicator={indicator} />
            ))}
          </div>
        </section>

        {/* Footer disclaimer */}
        <footer className="border-t border-slate-800 pt-6 pb-4">
          <p className="text-xs text-slate-600 text-center">
            Data shown is for analysis and planning purposes only. Hardcoded sample values are used
            where live API connections are not yet established. Always verify with primary sources
            before making investment decisions. &copy; {new Date().getFullYear()} Horizon Peak
            Capital LLC.
          </p>
        </footer>
      </div>
    </div>
  )
}
