'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Copy,
  Check,
} from 'lucide-react'
import type { ProposalData, ProposalOptions } from '../../lib/proposal-types'
import { STRATEGY_LABELS, getDefaultProposalOptions } from '../../lib/proposal-types'
import { buildProposalContent, getSlideCount } from '../../lib/proposal-content-builder'
import { cn } from '../../lib/utils'

interface ProposalGeneratorModalProps {
  open: boolean
  onClose: () => void
  data: ProposalData
  onGenerate?: (inputText: string, numCards: number) => void
}

export default function ProposalGeneratorModal({ open, onClose, data, onGenerate }: ProposalGeneratorModalProps) {
  const [options, setOptions] = useState<ProposalOptions>(() => getDefaultProposalOptions(data))
  const [showPreview, setShowPreview] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [gammaUrl, setGammaUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const content = buildProposalContent(data, options)
  const slideCount = getSlideCount(options)

  const handleClose = () => {
    setOptions(getDefaultProposalOptions(data))
    setShowPreview(false)
    setGenerating(false)
    setGammaUrl(null)
    setError(null)
    setCopied(false)
    onClose()
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)

    try {
      if (onGenerate) {
        onGenerate(content, slideCount)
      }
      // The actual Gamma MCP call is made by Claude after the user clicks Generate.
      // The modal signals readiness and provides the content.
      // For now, we show the content is ready and provide copy-to-clipboard.
      setGammaUrl('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }

  const toggleSection = (id: string) => {
    setOptions(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }))
  }

  const enabledCount = options.sections.filter(s => s.enabled).length
  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 placeholder-slate-500'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* ========== Header ========== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate Investor Proposal</h3>
              <p className="text-xs text-slate-400">
                {STRATEGY_LABELS[data.strategy]} — {data.deal.address}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========== Body (scrollable) ========== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Success State */}
          {gammaUrl && (
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Proposal Content Ready</span>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Your investor proposal has been prepared with {slideCount} slides covering{' '}
                {enabledCount} sections. The content is ready to be generated via Gamma.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleCopyContent}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Proposal Content
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Claude will generate your Gamma deck with {slideCount} professional slides
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Configuration Form (hidden after generation) */}
          {!gammaUrl && (
            <>
              {/* Proposal Title */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Proposal Title</label>
                <input
                  type="text"
                  value={options.title}
                  onChange={e => setOptions(prev => ({ ...prev, title: e.target.value }))}
                  className={inputCls}
                  placeholder="Investment Proposal — Property Address"
                />
              </div>

              {/* Recipient */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Recipient Name</label>
                  <input
                    type="text"
                    value={options.recipientName}
                    onChange={e => setOptions(prev => ({ ...prev, recipientName: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Company / Organization</label>
                  <input
                    type="text"
                    value={options.recipientCompany}
                    onChange={e => setOptions(prev => ({ ...prev, recipientCompany: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. The Dime Bank"
                  />
                </div>
              </div>

              {/* Executive Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Executive Notes <span className="text-slate-600">(optional)</span></label>
                <textarea
                  value={options.executiveNotes}
                  onChange={e => setOptions(prev => ({ ...prev, executiveNotes: e.target.value }))}
                  className={cn(inputCls, 'resize-none h-20')}
                  placeholder="Additional context for the executive summary..."
                />
              </div>

              {/* Sections to Include */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400 font-medium">Proposal Sections</label>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                    {enabledCount} of {options.sections.length} enabled • {slideCount} slides
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-800">
                  {options.sections.map(section => {
                    // Hide strategy-specific sections that don't apply
                    if (section.strategyOnly && !section.strategyOnly.includes(data.strategy)) {
                      return null
                    }
                    return (
                      <label
                        key={section.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                          section.enabled ? 'bg-slate-900' : 'bg-slate-900/50 opacity-60'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => toggleSection(section.id)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500/30 bg-slate-800 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{section.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Content Preview Toggle */}
              <div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 transition-colors font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? 'Hide' : 'Preview'} proposal content
                  {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showPreview && (
                  <div className="mt-2 bg-slate-950 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ========== Footer ========== */}
        <div className="px-6 py-4 border-t border-slate-700 shrink-0">
          {gammaUrl ? (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGammaUrl(null)
                  setError(null)
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                Edit & Regenerate
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating || enabledCount === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing proposal...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Proposal ({slideCount} slides)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
