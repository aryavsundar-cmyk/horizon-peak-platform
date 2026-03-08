'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  BarChart3,
  Search,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MapPin,
  Calendar,
  Home,
  DollarSign,
  CheckCircle2,
  Shield,
  Info,
  ArrowRight,
  Target,
} from 'lucide-react'
import { formatCurrency, cn } from '../../lib/utils'
import { getSettings } from '../../lib/settings-store'
import type { Deal } from '../../data/store'
import type {
  CompAnalysisResult,
  ComparableSale,
  SubjectProperty,
  RentCastAVMResponse,
} from '../../lib/comp-analyzer'
import { runCompAnalysis } from '../../lib/comp-analyzer'

// =============================================================================
// Types
// =============================================================================

interface PropertyBuildConfig {
  homeType: string
  sqft: number
  bedrooms: number
  bathrooms: number
  garage: string
  qualityLevel: string
  amenities: string[]
  customAmenities: { id: string; label: string; cost: number; arv: number }[]
}

type StrategyType = 'flip' | 'rental' | 'build-to-sell' | 'brrrr'

interface CompAnalysisPanelProps {
  deal: Deal
  strategy: StrategyType
  afterRepairValue: number
  onApplyARV: (arv: number) => void
  buildConfig: PropertyBuildConfig | null
}

// =============================================================================
// Component
// =============================================================================

export default function CompAnalysisPanel({
  deal,
  strategy,
  afterRepairValue,
  onApplyARV,
  buildConfig,
}: CompAnalysisPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompAnalysisResult | null>(null)
  const [expandedComp, setExpandedComp] = useState<string | null>(null)
  const [appliedTier, setAppliedTier] = useState<'conservative' | 'market' | 'premium' | 'recommended' | null>(null)

  // Derive subject property from deal + buildConfig
  const subject = useMemo<SubjectProperty>(() => {
    if (strategy === 'build-to-sell' && buildConfig && buildConfig.sqft > 0) {
      return {
        address: deal.address,
        sqft: buildConfig.sqft,
        beds: buildConfig.bedrooms,
        baths: buildConfig.bathrooms,
        lotSize: deal.lotSize || 0.25,
        yearBuilt: new Date().getFullYear(), // new construction
        isNewConstruction: true,
      }
    }
    return {
      address: deal.address,
      sqft: deal.sqft || 0,
      beds: deal.beds || 0,
      baths: deal.baths || 0,
      lotSize: deal.lotSize || 0,
      yearBuilt: deal.yearBuilt || 0,
      isNewConstruction: false,
    }
  }, [deal, strategy, buildConfig])

  // Full address for API call
  const fullAddress = useMemo(() => {
    const parts = [deal.address, deal.city, deal.state, deal.zip].filter(Boolean)
    return parts.join(', ')
  }, [deal])

  const fetchComps = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setAppliedTier(null)

    try {
      const settings = getSettings()
      if (!settings.rentCastApiKey) {
        setError('RentCast API key not configured. Go to Settings to add your key.')
        setLoading(false)
        return
      }

      const params = new URLSearchParams({
        address: fullAddress,
        compCount: '20',
      })
      if (subject.beds > 0) params.set('beds', String(subject.beds))
      if (subject.baths > 0) params.set('baths', String(subject.baths))
      if (subject.sqft > 0) params.set('sqft', String(subject.sqft))

      const res = await fetch(`/api/comps?${params.toString()}`, {
        headers: {
          'x-rentcast-key': settings.rentCastApiKey,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `API error (${res.status})`)
      }

      // data shape: RentCastAVMResponse (with price, priceRangeLow, priceRangeHigh, comparables)
      const avmResponse = data as RentCastAVMResponse & { cached?: boolean }

      const analysis = runCompAnalysis(
        avmResponse.comparables || [],
        {
          price: avmResponse.price || 0,
          low: avmResponse.priceRangeLow || 0,
          high: avmResponse.priceRangeHigh || 0,
        },
        subject
      )

      setResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparable sales')
    } finally {
      setLoading(false)
    }
  }, [fullAddress, subject])

  const handleApplyARV = useCallback((value: number, tier: 'conservative' | 'market' | 'premium' | 'recommended') => {
    onApplyARV(value)
    setAppliedTier(tier)
  }, [onApplyARV])

  const confidenceColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    return 'text-red-400 bg-red-500/20 border-red-500/30'
  }

  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white'

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900/10 border border-blue-500/20 rounded-xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Comparable Sales Analysis</h3>
              {result && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                  {result.compCount} comps
                </span>
              )}
              {result && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${confidenceColor(result.confidence.score)}`}>
                  {result.confidence.label} ({result.confidence.score}/100)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">RentCast AVM + adjusted comp analysis for data-driven ARV</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <button
              onClick={fetchComps}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              {result ? 'Refresh' : 'Fetch Comps'}
            </button>
          )}
          {result && (
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-10">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-sm text-slate-400">Fetching comparable sales from RentCast...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-700/40 rounded-lg p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-300">{error}</p>
            {error.includes('Settings') && (
              <p className="text-xs text-red-400/70 mt-1">
                Get a free API key at{' '}
                <a href="https://app.rentcast.io/app/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  app.rentcast.io
                </a>
                {' '}(50 free calls/month)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !result && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-blue-400/60" />
          </div>
          <p className="text-sm text-slate-400 mb-1">No comparable sales loaded</p>
          <p className="text-xs text-slate-600 mb-4 max-w-sm mx-auto">
            Fetch real comparable sales data to compute a data-driven ARV instead of using static $/sqft estimates.
          </p>
          <button
            onClick={fetchComps}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            Fetch Comparable Sales
          </button>
        </div>
      )}

      {/* Results (collapsed hides everything below ARV bar) */}
      {result && !collapsed && (
        <div className="mt-5 space-y-4">

          {/* ====== ARV Recommendation Bar ====== */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">ARV Recommendation</span>
            </div>

            {/* Range Visualization */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 px-1">
                <span>Conservative</span>
                <span>Market</span>
                <span>Premium</span>
              </div>
              <div className="relative h-3 rounded-full bg-gradient-to-r from-amber-600/30 via-blue-500/30 to-emerald-500/30 border border-slate-700">
                {/* Market position indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-lg" />
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1.5 px-1">
                <span className="text-amber-400">{formatCurrency(result.derivedARV.conservative)}</span>
                <span className="text-blue-400 font-bold">{formatCurrency(result.derivedARV.market)}</span>
                <span className="text-emerald-400">{formatCurrency(result.derivedARV.premium)}</span>
              </div>
            </div>

            {/* Blended Recommendation */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-blue-300/70 uppercase tracking-wider font-medium">Blended Recommendation (40% AVM + 60% Comps)</p>
                  <p className="text-xl font-bold text-blue-300 mt-0.5">{formatCurrency(result.recommendedARV)}</p>
                </div>
                <button
                  onClick={() => handleApplyARV(result.recommendedARV, 'recommended')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors',
                    appliedTier === 'recommended'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  )}
                >
                  {appliedTier === 'recommended' ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Applied</>
                  ) : (
                    <><ArrowRight className="w-3.5 h-3.5" /> Apply</>
                  )}
                </button>
              </div>
            </div>

            {/* Apply Tier Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'conservative' as const, label: 'Conservative', value: result.derivedARV.conservative, color: 'amber' },
                { key: 'market' as const, label: 'Market', value: result.derivedARV.market, color: 'blue' },
                { key: 'premium' as const, label: 'Premium', value: result.derivedARV.premium, color: 'emerald' },
              ]).map(tier => (
                <button
                  key={tier.key}
                  onClick={() => handleApplyARV(tier.value, tier.key)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-center transition-colors border',
                    appliedTier === tier.key
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                  )}
                >
                  <p className="text-[10px] text-slate-500 uppercase">{tier.label}</p>
                  <p className="text-xs font-bold font-mono">{formatCurrency(tier.value)}</p>
                </button>
              ))}
            </div>

            {/* Current vs Comp ARV Comparison */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700">
              <div className="flex-1 text-center">
                <p className="text-[10px] text-slate-500 uppercase">Current ARV</p>
                <p className="text-sm font-bold text-slate-300 font-mono">{formatCurrency(afterRepairValue)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="flex-1 text-center">
                <p className="text-[10px] text-slate-500 uppercase">Comp-Derived</p>
                <p className="text-sm font-bold text-blue-300 font-mono">{formatCurrency(result.recommendedARV)}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-[10px] text-slate-500 uppercase">Difference</p>
                <p className={cn(
                  'text-sm font-bold font-mono',
                  result.recommendedARV >= afterRepairValue ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {result.recommendedARV >= afterRepairValue ? '+' : ''}{formatCurrency(result.recommendedARV - afterRepairValue)}
                </p>
              </div>
            </div>
          </div>

          {/* ====== RentCast AVM vs Comp Analysis ====== */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] text-slate-400 uppercase font-medium">RentCast AVM</span>
              </div>
              <p className="text-base font-bold text-purple-300 font-mono">{formatCurrency(result.rentCastEstimate.price)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Range: {formatCurrency(result.rentCastEstimate.low)} – {formatCurrency(result.rentCastEstimate.high)}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-slate-400 uppercase font-medium">Comp Median</span>
              </div>
              <p className="text-base font-bold text-blue-300 font-mono">{formatCurrency(result.derivedARV.market)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Adj. $/sqft: ${result.medianPricePerSqft}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[10px] text-slate-400 uppercase font-medium">Blended</span>
              </div>
              <p className="text-base font-bold text-teal-300 font-mono">{formatCurrency(result.recommendedARV)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                40% AVM + 60% Comps
              </p>
            </div>
          </div>

          {/* ====== Confidence Factors ====== */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-white">Confidence Factors</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${confidenceColor(result.confidence.score)}`}>
                {result.confidence.score}/100
              </span>
            </div>
            <div className="space-y-1.5">
              {result.confidence.factors.map((factor, i) => (
                <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-slate-600 mt-0.5">{'•'}</span>
                  {factor}
                </p>
              ))}
            </div>
            {/* Summary Stats */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">Avg distance: {result.averageDistance.toFixed(1)} mi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">Avg age: {Math.round(result.averageAge)} days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Home className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">{result.compCount} comps</span>
              </div>
            </div>
          </div>

          {/* ====== Comps Table ====== */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <span className="text-xs font-bold text-white">Comparable Sales</span>
              <span className="text-[10px] text-slate-500 ml-2">sorted by correlation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                    <th className="text-left px-4 py-2 font-medium">Address</th>
                    <th className="text-right px-3 py-2 font-medium">Sale Price</th>
                    <th className="text-right px-3 py-2 font-medium">Sqft</th>
                    <th className="text-right px-3 py-2 font-medium">$/Sqft</th>
                    <th className="text-center px-3 py-2 font-medium">Bd/Ba</th>
                    <th className="text-right px-3 py-2 font-medium">Dist.</th>
                    <th className="text-right px-3 py-2 font-medium">Age</th>
                    <th className="text-right px-3 py-2 font-medium">Adj. Price</th>
                    <th className="text-right px-3 py-2 font-medium">Adj. $/Sqft</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {result.comps.map(comp => (
                    <React.Fragment key={comp.id}>
                      <tr
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => setExpandedComp(expandedComp === comp.id ? null : comp.id)}
                      >
                        <td className="px-4 py-2.5 text-slate-300 font-medium max-w-[180px] truncate" title={comp.address}>
                          {comp.address}
                        </td>
                        <td className="text-right px-3 py-2.5 text-slate-300 font-mono">
                          {formatCurrency(comp.price)}
                        </td>
                        <td className="text-right px-3 py-2.5 text-slate-400">
                          {comp.sqft.toLocaleString()}
                        </td>
                        <td className="text-right px-3 py-2.5 text-slate-400 font-mono">
                          ${comp.pricePerSqft}
                        </td>
                        <td className="text-center px-3 py-2.5 text-slate-400">
                          {comp.beds}/{comp.baths}
                        </td>
                        <td className="text-right px-3 py-2.5 text-slate-500">
                          {comp.distance.toFixed(1)} mi
                        </td>
                        <td className="text-right px-3 py-2.5 text-slate-500">
                          {comp.daysOld}d
                        </td>
                        <td className="text-right px-3 py-2.5 font-mono font-medium">
                          <span className={comp.totalAdjustment >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                            {formatCurrency(comp.adjustedPrice)}
                          </span>
                        </td>
                        <td className="text-right px-3 py-2.5 font-mono font-medium text-blue-300">
                          ${comp.adjustedPricePerSqft}
                        </td>
                      </tr>
                      {/* Expanded Adjustment Details */}
                      {expandedComp === comp.id && (
                        <tr>
                          <td colSpan={9} className="px-4 py-3 bg-slate-800/40">
                            <div className="grid grid-cols-5 gap-3 text-[10px]">
                              <AdjustmentChip label="Sqft Adj." value={comp.sqftAdjustment} />
                              <AdjustmentChip label="Bed/Bath Adj." value={comp.bedBathAdjustment} />
                              <AdjustmentChip label="Age Adj." value={comp.ageAdjustment} />
                              <AdjustmentChip label="Lot Adj." value={comp.lotSizeAdjustment} />
                              <AdjustmentChip label="Condition Adj." value={comp.conditionAdjustment} />
                            </div>
                            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-700">
                              <span className="text-slate-500">Total Adjustment:</span>
                              <span className={cn('font-bold font-mono', comp.totalAdjustment >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {comp.totalAdjustment >= 0 ? '+' : ''}{formatCurrency(comp.totalAdjustment)}
                              </span>
                              {comp.lastSaleDate && (
                                <>
                                  <span className="text-slate-600">|</span>
                                  <span className="text-slate-500">Sale Date: {comp.lastSaleDate}</span>
                                </>
                              )}
                              {comp.correlation > 0 && (
                                <>
                                  <span className="text-slate-600">|</span>
                                  <span className="text-slate-500">Correlation: {(comp.correlation * 100).toFixed(0)}%</span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed summary */}
      {result && collapsed && (
        <div className="mt-3 flex items-center gap-4">
          <span className="text-xs text-slate-400">
            {result.compCount} comps | Recommended ARV: <span className="text-blue-300 font-mono font-bold">{formatCurrency(result.recommendedARV)}</span>
          </span>
          <button
            onClick={() => handleApplyARV(result.recommendedARV, 'recommended')}
            className={cn(
              'text-xs px-2.5 py-1 rounded-lg font-medium transition-colors',
              appliedTier === 'recommended'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            {appliedTier === 'recommended' ? 'Applied' : 'Apply ARV'}
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Adjustment Chip Sub-Component
// =============================================================================

function AdjustmentChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-900 rounded-lg px-2 py-1.5 text-center">
      <p className="text-slate-500 text-[9px] uppercase mb-0.5">{label}</p>
      <p className={cn('font-mono font-medium text-[11px]', value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-500')}>
        {value > 0 ? '+' : ''}{formatCurrency(value)}
      </p>
    </div>
  )
}
