'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Star,
  StarOff,
  TrendingUp,
  Home,
  DollarSign,
  BarChart3,
  Globe,
  SlidersHorizontal,
  X,
  Loader2,
  Link2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { formatCurrency, formatPercent, cn } from '../../lib/utils'
import { Deal, SAMPLE_DEALS } from '../../data/store'
import { getSettings, hasApiKey } from '../../lib/settings-store'
import ImportUrlModal from './ImportUrlModal'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCES = ['All', 'Redfin', 'Zillow', 'Realtor.com', 'MLS', 'Homes.com'] as const
type Source = (typeof SOURCES)[number]

const PROPERTY_TYPES = ['All', 'Land', 'Single Family', 'Multi-Family', 'Fixer-Upper'] as const
type PropertyType = (typeof PROPERTY_TYPES)[number]

const SOURCE_COLORS: Record<string, string> = {
  Redfin: 'bg-red-600',
  Zillow: 'bg-blue-600',
  'Realtor.com': 'bg-green-600',
  MLS: 'bg-purple-600',
  'Homes.com': 'bg-orange-600',
}

const BEDS_OPTIONS = ['Any', '1+', '2+', '3+', '4+', '5+'] as const
const BATHS_OPTIONS = ['Any', '1+', '2+', '3+', '4+'] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBgGradient(score: number): string {
  if (score >= 75) return 'from-emerald-600/60 to-teal-700/60'
  if (score >= 50) return 'from-yellow-600/60 to-amber-700/60'
  return 'from-red-600/60 to-rose-700/60'
}

function scoreRingColor(score: number): string {
  if (score >= 75) return 'ring-emerald-500'
  if (score >= 50) return 'ring-yellow-500'
  return 'ring-red-500'
}

function inferPropertyType(deal: Deal): string {
  if (deal.sqft === 0 && deal.beds === 0) return 'Land'
  if (deal.beds >= 5 || (deal.notes && /multi/i.test(deal.notes))) return 'Multi-Family'
  if (deal.notes && /rehab|fixer|renovation/i.test(deal.notes)) return 'Fixer-Upper'
  return 'Single Family'
}

function computeROI(deal: Deal): number | undefined {
  if (deal.roi != null) return deal.roi
  if (deal.estimatedARV && deal.estimatedRehab) {
    const totalInvestment = deal.listPrice + deal.estimatedRehab
    if (totalInvestment === 0) return undefined
    return ((deal.estimatedARV - totalInvestment) / totalInvestment) * 100
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MarketInsightsBar({ deals }: { deals: Deal[] }) {
  const stats = useMemo(() => {
    if (deals.length === 0)
      return { median: 0, avgDOM: 0, count: 0, trend: 0 }
    const prices = deals.map((d) => d.listPrice).sort((a, b) => a - b)
    const mid = Math.floor(prices.length / 2)
    const median =
      prices.length % 2 === 0
        ? (prices[mid - 1] + prices[mid]) / 2
        : prices[mid]
    const avgDOM = Math.round(
      deals.reduce((s, d) => s + d.daysOnMarket, 0) / deals.length
    )
    // Simulated trend: positive if most deals are recent
    const recentCount = deals.filter((d) => d.daysOnMarket < 30).length
    const trend = recentCount > deals.length / 2 ? 3.2 : -1.8
    return { median, avgDOM, count: deals.length, trend }
  }, [deals])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        {
          label: 'Median List Price',
          value: formatCurrency(stats.median),
          icon: DollarSign,
          color: 'text-teal-400',
        },
        {
          label: 'Avg Days on Market',
          value: `${stats.avgDOM} days`,
          icon: BarChart3,
          color: 'text-cyan-400',
        },
        {
          label: 'Inventory Count',
          value: `${stats.count} listings`,
          icon: Home,
          color: 'text-indigo-400',
        },
        {
          label: 'Price Trend',
          value: `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}%`,
          icon: TrendingUp,
          color: stats.trend > 0 ? 'text-emerald-400' : 'text-red-400',
        },
      ].map((item) => (
        <div
          key={item.label}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3"
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center bg-slate-700/60',
              item.color
            )}
          >
            <item.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              {item.label}
            </p>
            <p className={cn('text-lg font-semibold', item.color)}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DealScoreExplainer() {
  const factors = [
    { name: 'Price-to-ARV Ratio', weight: 30 },
    { name: 'Cap Rate', weight: 20 },
    { name: 'Days on Market', weight: 15 },
    { name: 'Price/Sqft vs Market', weight: 15 },
    { name: 'Location Score', weight: 20 },
  ]

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-teal-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Deal Scoring Engine
        </h3>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Our algorithm scores deals 0&ndash;100 based on multiple weighted
        factors to help you quickly identify the best opportunities.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {factors.map((f) => (
          <div
            key={f.name}
            className="bg-slate-700/50 rounded-lg p-3 text-center"
          >
            <p className="text-xs text-slate-400 mb-1">{f.name}</p>
            <p className="text-lg font-bold text-teal-400">{f.weight}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DealCardProps {
  deal: Deal
  onToggleSave: (id: string) => void
  onUpdateNote: (id: string, note: string) => void
}

function DealCard({ deal, onToggleSave, onUpdateNote }: DealCardProps) {
  const [localNote, setLocalNote] = useState(deal.notes ?? '')
  const roi = computeROI(deal)
  const propertyType = inferPropertyType(deal)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all group">
      {/* Image placeholder with score-based gradient */}
      <div
        className={cn(
          'relative h-40 bg-gradient-to-br flex items-center justify-center',
          scoreBgGradient(deal.score)
        )}
      >
        <Home className="w-12 h-12 text-white/30" />
        {/* Source badge */}
        <span
          className={cn(
            'absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-md text-white',
            SOURCE_COLORS[deal.source] ?? 'bg-slate-600'
          )}
        >
          {deal.source}
        </span>
        {/* Property type badge */}
        <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/70 text-slate-200 backdrop-blur-sm">
          {propertyType}
        </span>
        {/* Deal score badge */}
        <div
          className={cn(
            'absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center ring-2 bg-slate-900/80 backdrop-blur-sm',
            scoreRingColor(deal.score)
          )}
        >
          <span className={cn('text-sm font-bold', scoreColor(deal.score))}>
            {deal.score}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Address */}
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <h4 className="text-sm font-semibold truncate">{deal.address}</h4>
            </div>
            <button
              onClick={() => onToggleSave(deal.id)}
              className="shrink-0 ml-2 text-slate-400 hover:text-yellow-400 transition-colors"
              aria-label={deal.saved ? 'Unsave deal' : 'Save deal'}
            >
              {deal.saved ? (
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 ml-5">
            {deal.city}, {deal.state} {deal.zip}
          </p>
        </div>

        {/* Price */}
        <p className="text-xl font-bold text-teal-400">
          {formatCurrency(deal.listPrice)}
        </p>

        {/* Property details row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {deal.beds > 0 && (
            <span>
              <span className="font-medium text-slate-300">{deal.beds}</span>{' '}
              bed
            </span>
          )}
          {deal.baths > 0 && (
            <span>
              <span className="font-medium text-slate-300">{deal.baths}</span>{' '}
              bath
            </span>
          )}
          {deal.sqft > 0 && (
            <span>
              <span className="font-medium text-slate-300">
                {deal.sqft.toLocaleString()}
              </span>{' '}
              sqft
            </span>
          )}
          {deal.lotSize > 0 && (
            <span>
              <span className="font-medium text-slate-300">
                {deal.lotSize}
              </span>{' '}
              ac
            </span>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/40 rounded-lg px-3 py-2">
            <p className="text-slate-500">Days on Market</p>
            <p className="font-semibold text-slate-200">
              {deal.daysOnMarket}
            </p>
          </div>
          {deal.pricePerSqft > 0 && (
            <div className="bg-slate-700/40 rounded-lg px-3 py-2">
              <p className="text-slate-500">Price/Sqft</p>
              <p className="font-semibold text-slate-200">
                {formatCurrency(deal.pricePerSqft)}
              </p>
            </div>
          )}
          {deal.estimatedARV != null && (
            <div className="bg-slate-700/40 rounded-lg px-3 py-2">
              <p className="text-slate-500">Est. ARV</p>
              <p className="font-semibold text-emerald-400">
                {formatCurrency(deal.estimatedARV)}
              </p>
            </div>
          )}
          {deal.estimatedRehab != null && (
            <div className="bg-slate-700/40 rounded-lg px-3 py-2">
              <p className="text-slate-500">Est. Rehab</p>
              <p className="font-semibold text-amber-400">
                {formatCurrency(deal.estimatedRehab)}
              </p>
            </div>
          )}
          {deal.capRate != null && (
            <div className="bg-slate-700/40 rounded-lg px-3 py-2">
              <p className="text-slate-500">Cap Rate</p>
              <p className="font-semibold text-cyan-400">
                {formatPercent(deal.capRate)}
              </p>
            </div>
          )}
          {roi != null && (
            <div className="bg-slate-700/40 rounded-lg px-3 py-2">
              <p className="text-slate-500">Projected ROI</p>
              <p
                className={cn(
                  'font-semibold',
                  roi >= 20 ? 'text-emerald-400' : 'text-yellow-400'
                )}
              >
                {formatPercent(roi)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 border border-teal-600/30 rounded-lg py-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on {deal.source}
          </a>
        </div>

        {/* Quick note */}
        <input
          type="text"
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={() => onUpdateNote(deal.id, localNote)}
          placeholder="Add a note..."
          className="w-full text-xs bg-slate-700/40 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition-colors"
        />
      </div>
    </div>
  )
}

interface SavedDealsPanelProps {
  deals: Deal[]
  open: boolean
  onClose: () => void
  onToggleSave: (id: string) => void
}

function SavedDealsPanel({
  deals,
  open,
  onClose,
  onToggleSave,
}: SavedDealsPanelProps) {
  const saved = deals.filter((d) => d.saved)

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-850 border-l border-slate-700 z-50 transform transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
      style={{ backgroundColor: 'rgb(17 24 39)' }}
    >
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <h2 className="text-lg font-bold text-slate-100">
            Saved Deals ({saved.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100%-70px)] p-4 space-y-3">
        {saved.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            No saved deals yet. Click the star icon on a deal to save it.
          </p>
        )}
        {saved.map((deal) => {
          const roi = computeROI(deal)
          return (
            <div
              key={deal.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {deal.address}
                  </p>
                  <p className="text-xs text-slate-500">
                    {deal.city}, {deal.state}
                  </p>
                </div>
                <button
                  onClick={() => onToggleSave(deal.id)}
                  className="text-yellow-400 hover:text-slate-400 transition-colors"
                >
                  <Star className="w-4 h-4 fill-yellow-400" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-400 font-semibold">
                  {formatCurrency(deal.listPrice)}
                </span>
                <span
                  className={cn(
                    'font-bold px-2 py-0.5 rounded-full text-xs',
                    deal.score >= 75
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : deal.score >= 50
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-red-900/50 text-red-400'
                  )}
                >
                  Score: {deal.score}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-slate-400">
                {deal.estimatedARV != null && (
                  <span>ARV: {formatCurrency(deal.estimatedARV)}</span>
                )}
                {roi != null && <span>ROI: {formatPercent(roi)}</span>}
              </div>
              {deal.notes && (
                <p className="text-xs text-slate-500 italic">{deal.notes}</p>
              )}
            </div>
          )
        })}

        {/* Comparison summary */}
        {saved.length >= 2 && (
          <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 mt-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Quick Comparison
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left pb-2">Property</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Score</th>
                  <th className="text-right pb-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {saved.map((deal) => {
                  const dealROI = computeROI(deal)
                  return (
                    <tr
                      key={deal.id}
                      className="border-b border-slate-700/50"
                    >
                      <td className="py-2 text-slate-300 max-w-[120px] truncate">
                        {deal.address}
                      </td>
                      <td className="py-2 text-right text-teal-400">
                        {formatCurrency(deal.listPrice)}
                      </td>
                      <td
                        className={cn(
                          'py-2 text-right font-semibold',
                          scoreColor(deal.score)
                        )}
                      >
                        {deal.score}
                      </td>
                      <td className="py-2 text-right text-slate-300">
                        {dealROI != null ? formatPercent(dealROI) : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filters state interface
// ---------------------------------------------------------------------------

interface Filters {
  query: string
  source: Source
  propertyType: PropertyType
  minPrice: string
  maxPrice: string
  beds: string
  baths: string
  minLotSize: string
  // Advanced
  maxDOM: string
  minCapRate: string
  minROI: string
  maxPricePerSqft: string
  minSchoolRating: string
}

const DEFAULT_FILTERS: Filters = {
  query: '',
  source: 'All',
  propertyType: 'All',
  minPrice: '',
  maxPrice: '',
  beds: 'Any',
  baths: 'Any',
  minLotSize: '',
  maxDOM: '',
  minCapRate: '',
  minROI: '',
  maxPricePerSqft: '',
  minSchoolRating: '',
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DealFinder() {
  const [deals, setDeals] = useState<Deal[]>(SAMPLE_DEALS)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedPanelOpen, setSavedPanelOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'price-asc' | 'price-desc' | 'dom' | 'roi'>('score')

  // --- API integration state ---
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [lastSearchMeta, setLastSearchMeta] = useState<{
    count: number
    errors: { source: string; error: string }[]
    cached: boolean
    sourceCounts?: Record<string, number>
  } | null>(null)

  // --- Handlers ---

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSave = (id: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, saved: !d.saved } : d))
    )
  }

  const updateNote = (id: string, note: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, notes: note } : d))
    )
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  // --- API Search Handler ---
  const handleApiSearch = async () => {
    const settings = getSettings()
    if (!settings.rapidApiKey) {
      setSearchError('No RapidAPI key configured. Add your key in Settings to search live listings.')
      return
    }
    if (!filters.query.trim()) {
      setSearchError('Enter a location (city, state, or zip) to search.')
      return
    }
    setIsSearching(true)
    setSearchError(null)
    setLastSearchMeta(null)
    try {
      const params = new URLSearchParams({
        location: filters.query,
        sources: settings.enabledSources.join(','),
        limit: String(settings.searchResultsLimit),
      })
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.beds !== 'Any') params.set('beds', filters.beds.replace('+', ''))

      const res = await fetch(`/api/deals/search?${params}`, {
        headers: { 'x-rapidapi-key': settings.rapidApiKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Search failed (${res.status})`)

      // Merge new deals with existing, deduplicating by address+zip
      setDeals(prev => {
        const existingKeys = new Set(
          prev.map(d => `${d.address.toLowerCase().replace(/[^a-z0-9]/g, '')}-${d.zip}`)
        )
        const newDeals = (data.deals || []).filter((d: Deal) =>
          !existingKeys.has(`${d.address.toLowerCase().replace(/[^a-z0-9]/g, '')}-${d.zip}`)
        )
        return [...newDeals, ...prev]
      })
      setLastSearchMeta({
        count: data.count || 0,
        errors: data.errors || [],
        cached: data.cached || false,
        sourceCounts: data.sourceCounts,
      })
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // --- Import from URL ---
  const handleImportDeal = (deal: Deal) => {
    setDeals(prev => {
      const key = `${deal.address.toLowerCase().replace(/[^a-z0-9]/g, '')}-${deal.zip}`
      const exists = prev.some(d =>
        `${d.address.toLowerCase().replace(/[^a-z0-9]/g, '')}-${d.zip}` === key
      )
      if (exists) return prev
      return [deal, ...prev]
    })
    setImportModalOpen(false)
  }

  // --- Filtering & sorting ---

  const filteredDeals = useMemo(() => {
    let result = [...deals]

    // Text search: match against address, city, state, zip
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase().trim()
      result = result.filter(
        (d) =>
          d.address.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.state.toLowerCase().includes(q) ||
          d.zip.includes(q)
      )
    }

    // Source
    if (filters.source !== 'All') {
      result = result.filter((d) => d.source === filters.source)
    }

    // Property type
    if (filters.propertyType !== 'All') {
      result = result.filter(
        (d) => inferPropertyType(d) === filters.propertyType
      )
    }

    // Price range
    const minP = parseFloat(filters.minPrice)
    const maxP = parseFloat(filters.maxPrice)
    if (!isNaN(minP)) result = result.filter((d) => d.listPrice >= minP)
    if (!isNaN(maxP)) result = result.filter((d) => d.listPrice <= maxP)

    // Beds
    if (filters.beds !== 'Any') {
      const minBeds = parseInt(filters.beds)
      result = result.filter((d) => d.beds >= minBeds)
    }

    // Baths
    if (filters.baths !== 'Any') {
      const minBaths = parseInt(filters.baths)
      result = result.filter((d) => d.baths >= minBaths)
    }

    // Lot size
    const minLot = parseFloat(filters.minLotSize)
    if (!isNaN(minLot)) result = result.filter((d) => d.lotSize >= minLot)

    // Advanced filters
    const maxDOM = parseInt(filters.maxDOM)
    if (!isNaN(maxDOM))
      result = result.filter((d) => d.daysOnMarket <= maxDOM)

    const minCap = parseFloat(filters.minCapRate)
    if (!isNaN(minCap))
      result = result.filter((d) => (d.capRate ?? 0) >= minCap)

    const minROI = parseFloat(filters.minROI)
    if (!isNaN(minROI))
      result = result.filter((d) => (computeROI(d) ?? 0) >= minROI)

    const maxPPS = parseFloat(filters.maxPricePerSqft)
    if (!isNaN(maxPPS))
      result = result.filter(
        (d) => d.pricePerSqft === 0 || d.pricePerSqft <= maxPPS
      )

    // Sort
    switch (sortBy) {
      case 'score':
        result.sort((a, b) => b.score - a.score)
        break
      case 'price-asc':
        result.sort((a, b) => a.listPrice - b.listPrice)
        break
      case 'price-desc':
        result.sort((a, b) => b.listPrice - a.listPrice)
        break
      case 'dom':
        result.sort((a, b) => a.daysOnMarket - b.daysOnMarket)
        break
      case 'roi':
        result.sort(
          (a, b) => (computeROI(b) ?? 0) - (computeROI(a) ?? 0)
        )
        break
    }

    return result
  }, [deals, filters, sortBy])

  const savedCount = deals.filter((d) => d.saved).length

  // Active filter count (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.source !== 'All') count++
    if (filters.propertyType !== 'All') count++
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    if (filters.beds !== 'Any') count++
    if (filters.baths !== 'Any') count++
    if (filters.minLotSize) count++
    if (filters.maxDOM) count++
    if (filters.minCapRate) count++
    if (filters.minROI) count++
    if (filters.maxPricePerSqft) count++
    if (filters.minSchoolRating) count++
    return count
  }, [filters])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Import URL Modal */}
      <ImportUrlModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportDeal}
      />

      {/* Saved deals sidebar */}
      <SavedDealsPanel
        deals={deals}
        open={savedPanelOpen}
        onClose={() => setSavedPanelOpen(false)}
        onToggleSave={toggleSave}
      />

      {/* Overlay when sidebar open */}
      {savedPanelOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setSavedPanelOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Deal Finder
              </h1>
              <p className="text-sm text-slate-400">
                Search nationwide for the best real estate opportunities
              </p>
            </div>
          </div>
          <button
            onClick={() => setSavedPanelOpen(true)}
            className="relative flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Star className="w-4 h-4 text-yellow-400" />
            Saved Deals
            {savedCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>
        </div>

        {/* ============= Search Header ============= */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6 space-y-5">
          {/* Search row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilter('query', e.target.value)}
                placeholder="Search by city, state, or zip code..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/60 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleApiSearch}
                disabled={isSearching}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                title="Import a listing from URL"
              >
                <Link2 className="w-4 h-4" />
                Import URL
              </button>
            </div>
          </div>

          {/* Source filter */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2 block">
              Source
            </label>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((src) => (
                <button
                  key={src}
                  onClick={() => setFilter('source', src)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    filters.source === src
                      ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                      : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  )}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Property type filter */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2 block">
              Property Type
            </label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setFilter('propertyType', pt)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    filters.propertyType === pt
                      ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                      : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  )}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Price / Beds / Baths / Lot Size row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                Min Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilter('minPrice', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                Max Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilter('maxPrice', e.target.value)}
                  placeholder="No max"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                Beds
              </label>
              <select
                value={filters.beds}
                onChange={(e) => setFilter('beds', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all appearance-none cursor-pointer"
              >
                {BEDS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                Baths
              </label>
              <select
                value={filters.baths}
                onChange={(e) => setFilter('baths', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all appearance-none cursor-pointer"
              >
                {BATHS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                Min Lot Size (ac)
              </label>
              <input
                type="number"
                step="0.1"
                value={filters.minLotSize}
                onChange={(e) => setFilter('minLotSize', e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
              />
            </div>
          </div>

          {/* Advanced filters toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 transition-colors font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-600 text-white text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                    Max Days on Market
                  </label>
                  <input
                    type="number"
                    value={filters.maxDOM}
                    onChange={(e) => setFilter('maxDOM', e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                    Min Cap Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.minCapRate}
                    onChange={(e) => setFilter('minCapRate', e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                    Min ROI (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.minROI}
                    onChange={(e) => setFilter('minROI', e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                    Max Price/Sqft
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="number"
                      value={filters.maxPricePerSqft}
                      onChange={(e) =>
                        setFilter('maxPricePerSqft', e.target.value)
                      }
                      placeholder="Any"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5 block">
                    School District (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filters.minSchoolRating}
                    onChange={(e) =>
                      setFilter('minSchoolRating', e.target.value)
                    }
                    placeholder="Any"
                    className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          )}
        </div>

        {/* ============= Search Status / Errors ============= */}
        {searchError && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{searchError}</p>
            <button onClick={() => setSearchError(null)} className="text-red-400 hover:text-red-200 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {lastSearchMeta && (
          <div className="bg-teal-900/15 border border-teal-700/30 rounded-xl p-3 mb-6 flex flex-wrap items-center gap-3 text-sm">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-teal-300 font-medium">
              Found {lastSearchMeta.count} live listing{lastSearchMeta.count !== 1 ? 's' : ''}
              {lastSearchMeta.cached && <span className="text-slate-500 ml-1">(cached)</span>}
            </span>
            {lastSearchMeta.sourceCounts && Object.entries(lastSearchMeta.sourceCounts).map(([src, count]) => (
              <span key={src} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {src}: {count as number}
              </span>
            ))}
            {lastSearchMeta.errors.length > 0 && (
              <span className="text-xs text-amber-400">
                ({lastSearchMeta.errors.length} source{lastSearchMeta.errors.length > 1 ? 's' : ''} unavailable)
              </span>
            )}
          </div>
        )}
        {!hasApiKey() && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 mb-6 flex items-center gap-3 text-sm">
            <Link2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">
              Add a <span className="text-teal-400 font-medium">RapidAPI key</span> in Settings to search live listings from Zillow, Redfin &amp; Realtor.com. Or use <button onClick={() => setImportModalOpen(true)} className="text-teal-400 font-medium hover:underline">Import URL</button> to add individual listings.
            </span>
          </div>
        )}

        {/* ============= Market Insights ============= */}
        <MarketInsightsBar deals={filteredDeals} />

        {/* ============= Deal Scoring Explainer ============= */}
        <DealScoreExplainer />

        {/* ============= Sort & Results Count ============= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <p className="text-sm text-slate-400">
            Showing{' '}
            <span className="text-slate-200 font-semibold">
              {filteredDeals.length}
            </span>{' '}
            {filteredDeals.length === 1 ? 'deal' : 'deals'}
            {filters.query && (
              <span>
                {' '}
                matching &ldquo;
                <span className="text-teal-400">{filters.query}</span>&rdquo;
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500/50 appearance-none cursor-pointer"
            >
              <option value="score">Best Score</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="dom">Newest Listings</option>
              <option value="roi">Highest ROI</option>
            </select>
          </div>
        </div>

        {/* ============= Results Grid ============= */}
        {filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onToggleSave={toggleSave}
                onUpdateNote={updateNote}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">
              No deals found
            </h3>
            <p className="text-sm text-slate-500 max-w-md">
              Try adjusting your search criteria or removing some filters to see
              more results.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
