'use client'

import React, { useState } from 'react'
import { Link2, X, Loader2, AlertCircle, CheckCircle2, Home, DollarSign, Clipboard } from 'lucide-react'
import type { Deal } from '../../data/store'
import { formatCurrency } from '../../lib/utils'
import { getSettings } from '../../lib/settings-store'

interface ImportUrlModalProps {
  open: boolean
  onClose: () => void
  onImport: (deal: Deal) => void
}

export default function ImportUrlModal({ open, onClose, onImport }: ImportUrlModalProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Deal | null>(null)
  const [method, setMethod] = useState<string>('')

  if (!open) return null

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
    } catch {
      // Clipboard API may not be available
    }
  }

  const handleFetch = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const settings = getSettings()
      const res = await fetch('/api/deals/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.rapidApiKey ? { 'x-rapidapi-key': settings.rapidApiKey } : {}),
        },
        body: JSON.stringify({
          url: url.trim(),
          rapidApiKey: settings.rapidApiKey || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Import failed (${res.status})`)
      }

      setPreview(data.deal)
      setMethod(data.method || 'unknown')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (preview) {
      onImport(preview)
      setUrl('')
      setPreview(null)
      setError(null)
      setMethod('')
    }
  }

  const handleClose = () => {
    setUrl('')
    setPreview(null)
    setError(null)
    setMethod('')
    onClose()
  }

  const sourceColor = (source: string) => {
    if (source.includes('Zillow')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    if (source.includes('Redfin')) return 'bg-red-500/20 text-red-300 border-red-500/30'
    if (source.includes('Realtor')) return 'bg-green-500/20 text-green-300 border-green-500/30'
    return 'bg-slate-600/20 text-slate-300 border-slate-500/30'
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import from URL</h3>
              <p className="text-xs text-slate-400">Paste a Zillow, Redfin, or Realtor.com listing URL</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Listing URL</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  placeholder="https://www.zillow.com/homedetails/..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono text-xs"
                  autoFocus
                />
              </div>
              <button
                onClick={handlePaste}
                className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {['zillow.com', 'redfin.com', 'realtor.com'].map(host => (
                <span key={host} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500 border border-slate-700">
                  {host}
                </span>
              ))}
            </div>
          </div>

          {/* Fetch Button */}
          {!preview && (
            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching listing details...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Fetch Details
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-700/40 rounded-lg p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">Listing details extracted</span>
                {method === 'rapidapi-fallback' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    via API
                  </span>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                {/* Source + Score */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sourceColor(preview.source)}`}>
                    {preview.source}
                  </span>
                  <div className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    preview.score >= 75 ? 'bg-emerald-500/20 text-emerald-300' :
                    preview.score >= 50 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    Score: {preview.score}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <Home className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{preview.address || 'Address not found'}</p>
                    <p className="text-xs text-slate-400">
                      {[preview.city, preview.state, preview.zip].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-lg font-bold text-teal-300">
                    {preview.listPrice > 0 ? formatCurrency(preview.listPrice) : 'Price not found'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Beds', value: preview.beds || '—' },
                    { label: 'Baths', value: preview.baths || '—' },
                    { label: 'Sq Ft', value: preview.sqft ? preview.sqft.toLocaleString() : '—' },
                    { label: 'Lot (ac)', value: preview.lotSize ? preview.lotSize.toFixed(2) : '—' },
                    { label: 'Year Built', value: preview.yearBuilt || '—' },
                    { label: 'DOM', value: preview.daysOnMarket || '—' },
                    { label: '$/Sq Ft', value: preview.pricePerSqft ? `$${preview.pricePerSqft}` : '—' },
                    { label: 'Est. ARV', value: preview.estimatedARV ? formatCurrency(preview.estimatedARV) : '—' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800 rounded-lg py-2 px-1">
                      <p className="text-[10px] text-slate-500 uppercase">{item.label}</p>
                      <p className="text-xs font-semibold text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Button */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setPreview(null); setError(null) }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  Try Different URL
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import as Deal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
