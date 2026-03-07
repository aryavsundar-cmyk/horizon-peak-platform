'use client'

import React, { useState, useMemo } from 'react'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  Building,
  MapPin,
  Phone,
  Mail,
  Star,
  Edit,
  Trash2,
  FileText,
  Milestone as MilestoneIcon,
} from 'lucide-react'
import { formatCurrency, cn } from '../../lib/utils'
import {
  Property,
  PropertyStatus,
  Milestone,
  Vendor,
  Expense,
  SAMPLE_PROPERTIES,
} from '../../data/store'

// ==================== Constants ====================

const STATUS_COLORS: Record<string, string> = {
  Prospect: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Under Contract': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Permitting: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Construction: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  Finishing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Listed: 'bg-green-500/20 text-green-400 border-green-500/30',
  Sold: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Rental: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-gray-500',
  'In Progress': 'bg-blue-500',
  Completed: 'bg-green-500',
  Delayed: 'bg-red-500',
}

const MILESTONE_BADGE_COLORS: Record<string, string> = {
  'Not Started': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  Delayed: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const TRADE_CATEGORIES = [
  'General Contractor',
  'Excavation',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Roofing',
  'Drywall',
  'Painting',
  'Landscaping',
  'Permits',
  'Inspection',
  'Realtor',
]

const EXPENSE_CATEGORIES = [
  'Land',
  'Permits & Fees',
  'Site Work',
  'Foundation',
  'Framing',
  'Roofing',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Insulation',
  'Drywall',
  'Painting',
  'Flooring',
  'Cabinets & Counters',
  'Appliances',
  'Landscaping',
  'Closing Costs',
  'Insurance',
  'Utilities',
  'Other',
]

const TABS = [
  { id: 'properties', label: 'Properties', icon: Building },
  { id: 'milestones', label: 'Milestones', icon: MilestoneIcon },
  { id: 'vendors', label: 'Vendors', icon: Users },
  { id: 'budget', label: 'Budget & Expenses', icon: DollarSign },
  { id: 'forecast', label: 'Forecasting', icon: Calendar },
]

// ==================== Helper Functions ====================

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// ==================== Sub-Components ====================

function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        className
      )}
    >
      {status}
    </span>
  )
}

function MilestoneBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        MILESTONE_BADGE_COLORS[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      )}
    >
      {status}
    </span>
  )
}

function StarRating({
  rating,
  onRate,
  readonly = false,
}: {
  rating: number
  onRate?: (val: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(i)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-300'
          )}
        >
          <Star
            className={cn(
              'w-4 h-4',
              i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}

function ProgressBar({
  value,
  max = 100,
  className,
  barColor = 'bg-teal-400',
}: {
  value: number
  max?: number
  className?: string
  barColor?: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cn('w-full bg-slate-700 rounded-full h-2', className)}>
      <div
        className={cn('h-2 rounded-full transition-all duration-500', barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors'

const selectClass =
  'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors'

const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900'

const btnSecondary =
  'inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500'

const btnDanger =
  'inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg transition-colors'

// ==================== Tab 1: Properties Overview ====================

function PropertiesOverview({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onAddProperty,
  onDeleteProperty,
}: {
  properties: Property[]
  selectedPropertyId: string | null
  onSelectProperty: (id: string | null) => void
  onAddProperty: (p: Property) => void
  onDeleteProperty: (id: string) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const initialForm = {
    address: '',
    city: '',
    county: '',
    state: 'PA',
    zip: '',
    lotSize: '',
    landValue: '',
    purchaseDate: '',
    status: 'Prospect' as PropertyStatus,
    plannedSqft: '',
    plannedBeds: '',
    plannedBaths: '',
    estimatedBuildCost: '',
    estimatedSalePrice: '',
    builder: '',
    bank: '',
    agent: '',
    notes: '',
  }

  const [form, setForm] = useState(initialForm)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newProperty: Property = {
      id: generateId(),
      address: form.address,
      city: form.city,
      county: form.county,
      state: form.state,
      zip: form.zip,
      lotSize: Number(form.lotSize) || 0,
      landValue: Number(form.landValue) || 0,
      purchaseDate: form.purchaseDate,
      status: form.status,
      plannedSqft: Number(form.plannedSqft) || 0,
      plannedBeds: Number(form.plannedBeds) || 0,
      plannedBaths: Number(form.plannedBaths) || 0,
      estimatedBuildCost: Number(form.estimatedBuildCost) || 0,
      estimatedSalePrice: Number(form.estimatedSalePrice) || 0,
      builder: form.builder || undefined,
      bank: form.bank || undefined,
      agent: form.agent || undefined,
      notes: form.notes || undefined,
      milestones: [],
      vendors: [],
      expenses: [],
    }
    onAddProperty(newProperty)
    setForm(initialForm)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Properties Overview</h2>
          <p className="text-sm text-slate-400 mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} in portfolio
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {properties.map((prop) => {
          const milestones = prop.milestones || []
          const completed = milestones.filter((m) => m.status === 'Completed').length
          const total = milestones.length
          const profitMargin =
            prop.estimatedSalePrice > 0
              ? (
                  ((prop.estimatedSalePrice - prop.estimatedBuildCost - prop.landValue) /
                    prop.estimatedSalePrice) *
                  100
                ).toFixed(1)
              : '0.0'
          const isExpanded = expandedCard === prop.id
          const isSelected = selectedPropertyId === prop.id

          return (
            <div
              key={prop.id}
              className={cn(
                'bg-slate-800 border rounded-xl transition-all duration-200 hover:border-teal-500/50',
                isSelected ? 'border-teal-400 ring-1 ring-teal-400/30' : 'border-slate-700'
              )}
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => {
                  onSelectProperty(prop.id)
                  setExpandedCard(isExpanded ? null : prop.id)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-white truncate">
                        {prop.address}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 ml-6">
                      {prop.city}, {prop.state} {prop.zip}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={prop.status} />
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Build Cost</p>
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(prop.estimatedBuildCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sale Price</p>
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(prop.estimatedSalePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Profit Margin</p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        Number(profitMargin) >= 20 ? 'text-green-400' : 'text-yellow-400'
                      )}
                    >
                      {profitMargin}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Milestones</p>
                    <p className="text-sm font-medium text-white">
                      {completed}/{total}
                    </p>
                  </div>
                </div>

                {total > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
                    </div>
                    <ProgressBar value={completed} max={total} />
                  </div>
                )}

                {(prop.builder || prop.bank) && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-700">
                    {prop.builder && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Building className="w-3 h-3" />
                        <span>{prop.builder}</span>
                      </div>
                    )}
                    {prop.bank && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <DollarSign className="w-3 h-3" />
                        <span>{prop.bank}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 space-y-3 border-t border-slate-700 mt-0">
                  <div className="pt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Lot Size</span>
                      <p className="text-white font-medium">{prop.lotSize} acres</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Sq Ft</span>
                      <p className="text-white font-medium">{prop.plannedSqft.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Bed / Bath</span>
                      <p className="text-white font-medium">
                        {prop.plannedBeds} / {prop.plannedBaths}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Land Value</span>
                      <p className="text-white font-medium">{formatCurrency(prop.landValue)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Purchase Date</span>
                      <p className="text-white font-medium">{formatDate(prop.purchaseDate)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">County</span>
                      <p className="text-white font-medium">{prop.county}</p>
                    </div>
                  </div>
                  {prop.notes && (
                    <div className="text-xs">
                      <span className="text-slate-500">Notes</span>
                      <p className="text-slate-300 mt-1">{prop.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteProperty(prop.id)
                      }}
                      className={btnDanger}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-16">
          <Building className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No properties yet. Add one to get started.</p>
        </div>
      )}

      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="Add New Property">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Address" className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St"
                required
              />
            </FormField>
            <FormField label="City">
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Dingman Township"
                required
              />
            </FormField>
            <FormField label="County">
              <input
                className={inputClass}
                value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
                placeholder="Pike County"
              />
            </FormField>
            <FormField label="State">
              <input
                className={inputClass}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="PA"
                required
              />
            </FormField>
            <FormField label="ZIP">
              <input
                className={inputClass}
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                placeholder="18328"
                required
              />
            </FormField>
            <FormField label="Status">
              <select
                className={selectClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Property['status'] })}
              >
                {Object.keys(STATUS_COLORS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Lot Size (acres)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                value={form.lotSize}
                onChange={(e) => setForm({ ...form, lotSize: e.target.value })}
                placeholder="0.5"
              />
            </FormField>
            <FormField label="Land Value">
              <input
                className={inputClass}
                type="number"
                value={form.landValue}
                onChange={(e) => setForm({ ...form, landValue: e.target.value })}
                placeholder="50000"
              />
            </FormField>
            <FormField label="Purchase Date">
              <input
                className={inputClass}
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </FormField>
            <FormField label="Planned Sq Ft">
              <input
                className={inputClass}
                type="number"
                value={form.plannedSqft}
                onChange={(e) => setForm({ ...form, plannedSqft: e.target.value })}
                placeholder="2000"
              />
            </FormField>
            <FormField label="Beds">
              <input
                className={inputClass}
                type="number"
                value={form.plannedBeds}
                onChange={(e) => setForm({ ...form, plannedBeds: e.target.value })}
                placeholder="3"
              />
            </FormField>
            <FormField label="Baths">
              <input
                className={inputClass}
                type="number"
                value={form.plannedBaths}
                onChange={(e) => setForm({ ...form, plannedBaths: e.target.value })}
                placeholder="2"
              />
            </FormField>
            <FormField label="Estimated Build Cost">
              <input
                className={inputClass}
                type="number"
                value={form.estimatedBuildCost}
                onChange={(e) => setForm({ ...form, estimatedBuildCost: e.target.value })}
                placeholder="320000"
                required
              />
            </FormField>
            <FormField label="Estimated Sale Price">
              <input
                className={inputClass}
                type="number"
                value={form.estimatedSalePrice}
                onChange={(e) => setForm({ ...form, estimatedSalePrice: e.target.value })}
                placeholder="500000"
                required
              />
            </FormField>
            <FormField label="Builder">
              <input
                className={inputClass}
                value={form.builder}
                onChange={(e) => setForm({ ...form, builder: e.target.value })}
                placeholder="Builder name"
              />
            </FormField>
            <FormField label="Bank / Lender">
              <input
                className={inputClass}
                value={form.bank}
                onChange={(e) => setForm({ ...form, bank: e.target.value })}
                placeholder="Bank name"
              />
            </FormField>
            <FormField label="Agent">
              <input
                className={inputClass}
                value={form.agent}
                onChange={(e) => setForm({ ...form, agent: e.target.value })}
                placeholder="Agent name"
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              className={cn(inputClass, 'h-20 resize-none')}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes..."
            />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowAddForm(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ==================== Tab 2: Milestone Tracker ====================

function MilestoneTracker({
  property,
  onUpdateMilestones,
}: {
  property: Property | null
  onUpdateMilestones: (propertyId: string, milestones: Milestone[]) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const initialMsForm = {
    name: '',
    phase: 'Pre-Construction',
    startDate: '',
    dueDate: '',
    status: 'Not Started' as Milestone['status'],
    drawPercent: '',
    drawAmount: '',
    notes: '',
  }
  const [msForm, setMsForm] = useState(initialMsForm)

  const milestones = property?.milestones || []

  const summary = useMemo(() => {
    const totalDraws = milestones.reduce((s, m) => s + m.drawAmount, 0)
    const completedDraws = milestones
      .filter((m) => m.status === 'Completed')
      .reduce((s, m) => s + m.drawAmount, 0)
    const remaining = totalDraws - completedDraws
    return { totalDraws, completedDraws, remaining }
  }, [milestones])

  // Compute the timeline range
  const timelineRange = useMemo(() => {
    if (milestones.length === 0) return { minDate: '', maxDate: '', totalDays: 1 }
    const dates = milestones.flatMap((m) => [new Date(m.startDate), new Date(m.dueDate)])
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
    const totalDays = Math.max(
      1,
      Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    return {
      minDate: minDate.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0],
      totalDays,
    }
  }, [milestones])

  // Generate month markers
  const monthMarkers = useMemo(() => {
    if (!timelineRange.minDate || !timelineRange.maxDate) return []
    const markers: { label: string; leftPct: number }[] = []
    const start = new Date(timelineRange.minDate + 'T00:00:00')
    const end = new Date(timelineRange.maxDate + 'T00:00:00')
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    while (current <= end) {
      const dayOffset = Math.ceil(
        (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      )
      const pct = Math.max(0, (dayOffset / timelineRange.totalDays) * 100)
      markers.push({
        label: current.toLocaleDateString('en-US', { month: 'short' }),
        leftPct: pct,
      })
      current.setMonth(current.getMonth() + 1)
    }
    return markers
  }, [timelineRange])

  function getBarPosition(start: string, due: string) {
    if (!timelineRange.minDate) return { left: '0%', width: '0%' }
    const rangeStart = new Date(timelineRange.minDate + 'T00:00:00').getTime()
    const s = new Date(start + 'T00:00:00').getTime()
    const d = new Date(due + 'T00:00:00').getTime()
    const leftPct = ((s - rangeStart) / (timelineRange.totalDays * 86400000)) * 100
    const widthPct = Math.max(2, ((d - s) / (timelineRange.totalDays * 86400000)) * 100)
    return { left: `${leftPct}%`, width: `${widthPct}%` }
  }

  function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!property) return
    const newMs: Milestone = {
      id: generateId(),
      propertyId: property.id,
      name: msForm.name,
      phase: msForm.phase,
      startDate: msForm.startDate,
      dueDate: msForm.dueDate,
      status: msForm.status,
      drawPercent: Number(msForm.drawPercent) || 0,
      drawAmount: Number(msForm.drawAmount) || 0,
      notes: msForm.notes || undefined,
    }
    onUpdateMilestones(property.id, [...milestones, newMs])
    setMsForm(initialMsForm)
    setShowAddForm(false)
  }

  function handleDeleteMilestone(msId: string) {
    if (!property) return
    onUpdateMilestones(
      property.id,
      milestones.filter((m) => m.id !== msId)
    )
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <MilestoneIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Select a property from the Properties tab to view milestones.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Milestone Tracker</h2>
          <p className="text-sm text-slate-400 mt-1">
            <MapPin className="w-3 h-3 inline mr-1" />
            {property.address}
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <DollarSign className="w-4 h-4" />
            Total Draws
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(summary.totalDraws)}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Completed Draws
          </div>
          <p className="text-xl font-bold text-green-400">
            {formatCurrency(summary.completedDraws)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            Remaining Budget
          </div>
          <p className="text-xl font-bold text-yellow-400">
            {formatCurrency(summary.remaining)}
          </p>
        </div>
      </div>

      {/* Gantt Chart */}
      {milestones.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month Header */}
              <div className="relative h-8 bg-slate-750 border-b border-slate-700 bg-slate-800/80">
                {monthMarkers.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-center text-xs text-slate-500 border-l border-slate-700 pl-2"
                    style={{ left: `calc(280px + (100% - 280px) * ${m.leftPct / 100})` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Milestone Rows */}
              {milestones.map((ms) => {
                const bar = getBarPosition(ms.startDate, ms.dueDate)
                return (
                  <div
                    key={ms.id}
                    className="flex items-center border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Info Column */}
                    <div className="w-[280px] flex-shrink-0 px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{ms.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{ms.phase}</span>
                        <MilestoneBadge status={ms.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>
                          {formatDate(ms.startDate)} - {formatDate(ms.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-cyan-400 font-medium">
                          {formatCurrency(ms.drawAmount)}
                        </span>
                        <button
                          onClick={() => handleDeleteMilestone(ms.id)}
                          className="text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-16 px-2">
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-6 rounded-md transition-all',
                          MILESTONE_STATUS_COLORS[ms.status]
                        )}
                        style={{ left: bar.left, width: bar.width, minWidth: '12px' }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium truncate px-1">
                          {ms.drawPercent > 0 ? `${ms.drawPercent}%` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-xl">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No milestones yet. Add one to get started.</p>
        </div>
      )}

      {/* Add Milestone Modal */}
      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Milestone"
      >
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Milestone Name" className="sm:col-span-2">
              <input
                className={inputClass}
                value={msForm.name}
                onChange={(e) => setMsForm({ ...msForm, name: e.target.value })}
                placeholder="Foundation Pour"
                required
              />
            </FormField>
            <FormField label="Phase">
              <select
                className={selectClass}
                value={msForm.phase}
                onChange={(e) => setMsForm({ ...msForm, phase: e.target.value })}
              >
                {[
                  'Pre-Construction',
                  'Site Work',
                  'Foundation',
                  'Construction',
                  'Finishing',
                  'Closeout',
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className={selectClass}
                value={msForm.status}
                onChange={(e) =>
                  setMsForm({ ...msForm, status: e.target.value as Milestone['status'] })
                }
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </FormField>
            <FormField label="Start Date">
              <input
                className={inputClass}
                type="date"
                value={msForm.startDate}
                onChange={(e) => setMsForm({ ...msForm, startDate: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Due Date">
              <input
                className={inputClass}
                type="date"
                value={msForm.dueDate}
                onChange={(e) => setMsForm({ ...msForm, dueDate: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Draw %">
              <input
                className={inputClass}
                type="number"
                min="0"
                max="100"
                value={msForm.drawPercent}
                onChange={(e) => setMsForm({ ...msForm, drawPercent: e.target.value })}
                placeholder="10"
              />
            </FormField>
            <FormField label="Draw Amount">
              <input
                className={inputClass}
                type="number"
                value={msForm.drawAmount}
                onChange={(e) => setMsForm({ ...msForm, drawAmount: e.target.value })}
                placeholder="32000"
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              className={cn(inputClass, 'h-20 resize-none')}
              value={msForm.notes}
              onChange={(e) => setMsForm({ ...msForm, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowAddForm(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ==================== Tab 3: Vendor Management ====================

function VendorManagement({
  vendors,
  onAddVendor,
  onDeleteVendor,
  onUpdateVendorRating,
}: {
  vendors: Vendor[]
  onAddVendor: (v: Vendor) => void
  onDeleteVendor: (id: string) => void
  onUpdateVendorRating: (id: string, rating: number) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTrade, setFilterTrade] = useState('')

  const initialVendorForm = {
    name: '',
    trade: 'General Contractor',
    phone: '',
    email: '',
    rating: 0,
    licensed: true,
    insured: true,
    notes: '',
  }
  const [vendorForm, setVendorForm] = useState(initialVendorForm)

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !searchTerm || v.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTrade = !filterTrade || v.trade.toLowerCase().includes(filterTrade.toLowerCase())
      return matchesSearch && matchesTrade
    })
  }, [vendors, searchTerm, filterTrade])

  function handleAddVendor(e: React.FormEvent) {
    e.preventDefault()
    const newVendor: Vendor = {
      id: generateId(),
      name: vendorForm.name,
      trade: vendorForm.trade,
      phone: vendorForm.phone,
      email: vendorForm.email,
      rating: vendorForm.rating,
      licensed: vendorForm.licensed,
      insured: vendorForm.insured,
      notes: vendorForm.notes || undefined,
    }
    onAddVendor(newVendor)
    setVendorForm(initialVendorForm)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Vendor Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} in network
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            className={inputClass}
            placeholder="Search vendors by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={cn(selectClass, 'sm:w-56')}
          value={filterTrade}
          onChange={(e) => setFilterTrade(e.target.value)}
        >
          <option value="">All Trades</option>
          {TRADE_CATEGORIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Vendor Table */}
      {filteredVendors.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Trade
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Licensed
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Insured
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{v.name}</td>
                    <td className="px-4 py-3 text-slate-300">{v.trade}</td>
                    <td className="px-4 py-3">
                      {v.phone ? (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {v.phone}
                        </span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {v.email ? (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {v.email}
                        </span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StarRating
                        rating={v.rating}
                        onRate={(val) => onUpdateVendorRating(v.id, val)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.licensed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.insured ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDeleteVendor(v.id)}
                        className="text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-xl">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {vendors.length === 0
              ? 'No vendors yet. Add one to get started.'
              : 'No vendors match your search.'}
          </p>
        </div>
      )}

      {/* Add Vendor Modal */}
      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="Add Vendor">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Vendor Name" className="sm:col-span-2">
              <input
                className={inputClass}
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="Company Name"
                required
              />
            </FormField>
            <FormField label="Trade">
              <select
                className={selectClass}
                value={vendorForm.trade}
                onChange={(e) => setVendorForm({ ...vendorForm, trade: e.target.value })}
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Phone">
              <input
                className={inputClass}
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                placeholder="(570) 555-0100"
              />
            </FormField>
            <FormField label="Email">
              <input
                className={inputClass}
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                placeholder="contact@vendor.com"
              />
            </FormField>
            <FormField label="Rating">
              <div className="pt-1">
                <StarRating
                  rating={vendorForm.rating}
                  onRate={(val) => setVendorForm({ ...vendorForm, rating: val })}
                />
              </div>
            </FormField>
            <FormField label="Licensed">
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendorForm.licensed}
                  onChange={(e) => setVendorForm({ ...vendorForm, licensed: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-300">Yes</span>
              </label>
            </FormField>
            <FormField label="Insured">
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendorForm.insured}
                  onChange={(e) => setVendorForm({ ...vendorForm, insured: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-300">Yes</span>
              </label>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              className={cn(inputClass, 'h-20 resize-none')}
              value={vendorForm.notes}
              onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowAddForm(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ==================== Tab 4: Budget & Expenses ====================

function BudgetExpenses({
  property,
  onAddExpense,
  onDeleteExpense,
}: {
  property: Property | null
  onAddExpense: (propertyId: string, expense: Expense) => void
  onDeleteExpense: (propertyId: string, expenseId: string) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const initialExpForm = {
    date: '',
    category: 'Site Work',
    description: '',
    amount: '',
    vendor: '',
    receipt: false,
  }
  const [expForm, setExpForm] = useState(initialExpForm)

  const expenses = property?.expenses || []

  const budgetData = useMemo(() => {
    if (!property) return { categories: [], totalEstimated: 0, totalActual: 0, remaining: 0 }

    // Build category totals from expenses
    const categoryMap: Record<string, { estimated: number; actual: number }> = {}
    const estimatedPerCategory = property.estimatedBuildCost / EXPENSE_CATEGORIES.length

    EXPENSE_CATEGORIES.forEach((cat) => {
      categoryMap[cat] = { estimated: 0, actual: 0 }
    })

    // Distribute estimated cost proportionally among categories that have expenses
    const activeCats = new Set(expenses.map((e) => e.category))
    const numActive = activeCats.size || EXPENSE_CATEGORIES.length

    EXPENSE_CATEGORIES.forEach((cat) => {
      categoryMap[cat].estimated = Math.round(property.estimatedBuildCost / numActive)
    })

    expenses.forEach((exp) => {
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { estimated: 0, actual: 0 }
      }
      categoryMap[exp.category].actual += exp.amount
    })

    const categories = Object.entries(categoryMap)
      .filter(([, data]) => data.actual > 0 || data.estimated > 0)
      .map(([name, data]) => ({
        name,
        estimated: data.estimated,
        actual: data.actual,
        overBudget: data.actual > data.estimated,
      }))
      .sort((a, b) => b.actual - a.actual)

    const totalActual = expenses.reduce((s, e) => s + e.amount, 0)
    const totalEstimated = property.estimatedBuildCost
    const remaining = totalEstimated - totalActual

    return { categories, totalEstimated, totalActual, remaining }
  }, [property, expenses])

  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!property) return
    const newExp: Expense = {
      id: generateId(),
      propertyId: property.id,
      date: expForm.date,
      category: expForm.category,
      description: expForm.description,
      amount: Number(expForm.amount) || 0,
      vendor: expForm.vendor || undefined,
      receipt: expForm.receipt,
    }
    onAddExpense(property.id, newExp)
    setExpForm(initialExpForm)
    setShowAddForm(false)
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Select a property from the Properties tab to view budget details.</p>
      </div>
    )
  }

  const spentPct =
    budgetData.totalEstimated > 0
      ? Math.round((budgetData.totalActual / budgetData.totalEstimated) * 100)
      : 0
  const isOverBudget = budgetData.remaining < 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Budget & Expenses</h2>
          <p className="text-sm text-slate-400 mt-1">
            <MapPin className="w-3 h-3 inline mr-1" />
            {property.address}
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-sm text-slate-400 mb-1">Estimated Budget</div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(budgetData.totalEstimated)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-sm text-slate-400 mb-1">Actual Spent</div>
          <p className={cn('text-xl font-bold', isOverBudget ? 'text-red-400' : 'text-cyan-400')}>
            {formatCurrency(budgetData.totalActual)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{spentPct}% of budget</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            {isOverBudget && <AlertTriangle className="w-4 h-4 text-red-400" />}
            {isOverBudget ? 'Over Budget' : 'Remaining'}
          </div>
          <p
            className={cn('text-xl font-bold', isOverBudget ? 'text-red-400' : 'text-green-400')}
          >
            {formatCurrency(Math.abs(budgetData.remaining))}
          </p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Budget Utilization</span>
          <span className={cn('font-medium', isOverBudget ? 'text-red-400' : 'text-white')}>
            {spentPct}%
          </span>
        </div>
        <ProgressBar
          value={budgetData.totalActual}
          max={budgetData.totalEstimated}
          barColor={isOverBudget ? 'bg-red-500' : spentPct > 80 ? 'bg-yellow-500' : 'bg-teal-400'}
          className="h-3"
        />
        {isOverBudget && (
          <div className="flex items-center gap-2 text-xs text-red-400 mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cost overrun detected. Budget exceeded by {formatCurrency(Math.abs(budgetData.remaining))}.
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {budgetData.categories.filter((c) => c.actual > 0).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-medium text-white">Category Breakdown</h3>
          <div className="space-y-3">
            {budgetData.categories
              .filter((c) => c.actual > 0)
              .map((cat) => {
                const pct =
                  cat.estimated > 0 ? Math.min(150, (cat.actual / cat.estimated) * 100) : 100
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className={cn('font-medium', cat.overBudget ? 'text-red-400' : 'text-slate-400')}>
                        {formatCurrency(cat.actual)}{' '}
                        <span className="text-slate-600">/ {formatCurrency(cat.estimated)}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 relative">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          cat.overBudget ? 'bg-red-500' : 'bg-teal-400'
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                      {/* Estimated marker line */}
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-white/30"
                        style={{ left: '100%' }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Expense Log */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">Expense Log</h3>
        </div>
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-300">{formatDate(exp.date)}</td>
                    <td className="px-4 py-2.5 text-slate-300">{exp.category}</td>
                    <td className="px-4 py-2.5 text-white">{exp.description}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-cyan-400">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{exp.vendor || '--'}</td>
                    <td className="px-4 py-2.5 text-center">
                      {exp.receipt ? (
                        <FileText className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => onDeleteExpense(property.id, exp.id)}
                        className="text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No expenses recorded yet.</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date">
              <input
                className={inputClass}
                type="date"
                value={expForm.date}
                onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Category">
              <select
                className={selectClass}
                value={expForm.category}
                onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <input
                className={inputClass}
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                placeholder="What was this expense for?"
                required
              />
            </FormField>
            <FormField label="Amount">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                value={expForm.amount}
                onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                placeholder="5000"
                required
              />
            </FormField>
            <FormField label="Vendor">
              <input
                className={inputClass}
                value={expForm.vendor}
                onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })}
                placeholder="Vendor name"
              />
            </FormField>
            <FormField label="Receipt">
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expForm.receipt}
                  onChange={(e) => setExpForm({ ...expForm, receipt: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-300">Receipt on file</span>
              </label>
            </FormField>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowAddForm(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ==================== Tab 5: Forecasting ====================

function Forecasting({ property }: { property: Property | null }) {
  if (!property) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Select a property from the Properties tab to view forecasts.</p>
      </div>
    )
  }

  const milestones = property.milestones || []
  const expenses = property.expenses || []
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  // Compute completion estimates
  const completedMs = milestones.filter((m) => m.status === 'Completed').length
  const delayedMs = milestones.filter((m) => m.status === 'Delayed').length
  const totalMs = milestones.length
  const progressPct = totalMs > 0 ? (completedMs / totalMs) * 100 : 0

  // Find last milestone due date for expected completion
  const lastMilestoneDue =
    milestones.length > 0
      ? milestones.reduce((latest, m) =>
          new Date(m.dueDate) > new Date(latest.dueDate) ? m : latest
        ).dueDate
      : ''

  // Calculate delay factor
  const delayWeeks = delayedMs * 2 // estimate 2 weeks per delayed milestone
  const worstCaseDate = lastMilestoneDue
    ? new Date(
        new Date(lastMilestoneDue + 'T00:00:00').getTime() +
          delayWeeks * 2 * 7 * 86400000
      )
        .toISOString()
        .split('T')[0]
    : ''
  const bestCaseDate = lastMilestoneDue
    ? new Date(
        new Date(lastMilestoneDue + 'T00:00:00').getTime() - 14 * 86400000
      )
        .toISOString()
        .split('T')[0]
    : ''

  // Build month-by-month forecast
  const forecast = useMemo(() => {
    if (milestones.length === 0) return []

    const months: {
      month: string
      draws: number
      cumDraws: number
      milestoneNames: string[]
      cashIn: number
      cumCashIn: number
      netPosition: number
    }[] = []

    // Get date range
    const allDates = milestones.flatMap((m) => [m.startDate, m.dueDate])
    const minDate = allDates.reduce((min, d) => (d < min ? d : min))
    const maxDate = allDates.reduce((max, d) => (d > max ? d : max))

    // Extend a couple months past last milestone for listing/sale
    const startMonth = new Date(minDate + 'T00:00:00')
    startMonth.setDate(1)
    const endMonth = new Date(maxDate + 'T00:00:00')
    endMonth.setMonth(endMonth.getMonth() + 3)

    let cumDraws = 0
    let cumCashIn = 0
    const current = new Date(startMonth)

    while (current <= endMonth) {
      const monthStr = current.toISOString().split('T')[0].substring(0, 7) // YYYY-MM
      const monthLabel = current.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })

      // Find milestones due this month
      const dueThisMonth = milestones.filter((m) => {
        return m.dueDate.substring(0, 7) === monthStr
      })

      const monthDraws = dueThisMonth.reduce((s, m) => s + m.drawAmount, 0)
      cumDraws += monthDraws

      const milestoneNames = dueThisMonth.map((m) => m.name)

      // Estimate cash in: If we're past all milestones, assume listing + sale
      let cashIn = 0
      const isFinalMonth =
        current.getFullYear() === endMonth.getFullYear() &&
        current.getMonth() === endMonth.getMonth()
      if (isFinalMonth) {
        cashIn = property.estimatedSalePrice
      }
      cumCashIn += cashIn

      months.push({
        month: monthLabel,
        draws: monthDraws,
        cumDraws,
        milestoneNames,
        cashIn,
        cumCashIn,
        netPosition: cumCashIn - cumDraws - property.landValue,
      })

      current.setMonth(current.getMonth() + 1)
    }

    return months
  }, [milestones, property])

  // Risk indicators
  const risks = useMemo(() => {
    const r: { level: 'low' | 'medium' | 'high'; label: string; detail: string }[] = []

    if (delayedMs > 0) {
      r.push({
        level: delayedMs > 2 ? 'high' : 'medium',
        label: 'Schedule Delays',
        detail: `${delayedMs} milestone${delayedMs > 1 ? 's' : ''} delayed`,
      })
    }

    if (totalSpent > property.estimatedBuildCost * 0.8 && progressPct < 80) {
      r.push({
        level: 'high',
        label: 'Cost Overrun Risk',
        detail: `${Math.round((totalSpent / property.estimatedBuildCost) * 100)}% of budget spent at ${Math.round(progressPct)}% completion`,
      })
    }

    if (progressPct < 30 && milestones.length > 0) {
      r.push({
        level: 'low',
        label: 'Early Stage',
        detail: 'Project in early stages, timeline subject to change',
      })
    }

    if (r.length === 0) {
      r.push({
        level: 'low',
        label: 'On Track',
        detail: 'No significant risks identified',
      })
    }

    return r
  }, [delayedMs, totalSpent, property, progressPct, milestones.length])

  const riskColors = {
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  const expectedProfit = property.estimatedSalePrice - property.estimatedBuildCost - property.landValue
  const bestCaseProfit = expectedProfit * 1.1
  const worstCaseProfit = expectedProfit * 0.7

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Forecasting</h2>
        <p className="text-sm text-slate-400 mt-1">
          <MapPin className="w-3 h-3 inline mr-1" />
          {property.address}
        </p>
      </div>

      {/* Completion Estimates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-green-500/20 rounded-xl p-4">
          <div className="text-xs text-green-400 uppercase tracking-wider mb-1">Best Case</div>
          <p className="text-lg font-bold text-white">
            {bestCaseDate ? formatDate(bestCaseDate) : 'TBD'}
          </p>
          <p className="text-sm text-green-400 mt-1">{formatCurrency(bestCaseProfit)} profit</p>
        </div>
        <div className="bg-slate-800 border border-teal-500/20 rounded-xl p-4">
          <div className="text-xs text-teal-400 uppercase tracking-wider mb-1">Expected</div>
          <p className="text-lg font-bold text-white">
            {lastMilestoneDue ? formatDate(lastMilestoneDue) : 'TBD'}
          </p>
          <p className="text-sm text-teal-400 mt-1">{formatCurrency(expectedProfit)} profit</p>
        </div>
        <div className="bg-slate-800 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-red-400 uppercase tracking-wider mb-1">Worst Case</div>
          <p className="text-lg font-bold text-white">
            {worstCaseDate ? formatDate(worstCaseDate) : 'TBD'}
          </p>
          <p className="text-sm text-red-400 mt-1">{formatCurrency(worstCaseProfit)} profit</p>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Risk Indicators
        </h3>
        <div className="space-y-2">
          {risks.map((risk, i) => (
            <div
              key={i}
              className={cn('flex items-center justify-between px-3 py-2 rounded-lg border', riskColors[risk.level])}
            >
              <div>
                <p className="text-sm font-medium">{risk.label}</p>
                <p className="text-xs opacity-75">{risk.detail}</p>
              </div>
              <span className="text-xs uppercase font-bold tracking-wider">{risk.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Month-by-Month Forecast */}
      {forecast.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-white">Month-by-Month Cash Flow Projection</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Draws (Out)
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Cumulative Out
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Cash In
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Net Position
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {forecast.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-white whitespace-nowrap">
                      {row.month}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 text-xs max-w-[200px]">
                      {row.milestoneNames.length > 0
                        ? row.milestoneNames.join(', ')
                        : row.cashIn > 0
                          ? 'Projected Sale'
                          : '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {row.draws > 0 ? (
                        <span className="text-red-400">-{formatCurrency(row.draws)}</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      {formatCurrency(row.cumDraws)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {row.cashIn > 0 ? (
                        <span className="text-green-400">+{formatCurrency(row.cashIn)}</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          'font-medium',
                          row.netPosition >= 0 ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        {row.netPosition >= 0 ? '+' : ''}
                        {formatCurrency(row.netPosition)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-xl">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Add milestones to generate a forecast.</p>
        </div>
      )}

      {/* Scenario Summary */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Scenario Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-xs font-medium text-slate-400 uppercase">
                  Scenario
                </th>
                <th className="text-right py-2 text-xs font-medium text-slate-400 uppercase">
                  Completion
                </th>
                <th className="text-right py-2 text-xs font-medium text-slate-400 uppercase">
                  Total Cost
                </th>
                <th className="text-right py-2 text-xs font-medium text-slate-400 uppercase">
                  Sale Price
                </th>
                <th className="text-right py-2 text-xs font-medium text-slate-400 uppercase">
                  Profit
                </th>
                <th className="text-right py-2 text-xs font-medium text-slate-400 uppercase">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <tr className="text-green-400">
                <td className="py-2.5 font-medium">Best Case</td>
                <td className="py-2.5 text-right">{bestCaseDate ? formatDate(bestCaseDate) : 'TBD'}</td>
                <td className="py-2.5 text-right">
                  {formatCurrency(property.estimatedBuildCost * 0.95 + property.landValue)}
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(property.estimatedSalePrice * 1.05)}
                </td>
                <td className="py-2.5 text-right font-bold">{formatCurrency(bestCaseProfit)}</td>
                <td className="py-2.5 text-right">
                  {(
                    (bestCaseProfit / (property.estimatedBuildCost + property.landValue)) *
                    100
                  ).toFixed(1)}
                  %
                </td>
              </tr>
              <tr className="text-teal-400">
                <td className="py-2.5 font-medium">Expected</td>
                <td className="py-2.5 text-right">
                  {lastMilestoneDue ? formatDate(lastMilestoneDue) : 'TBD'}
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(property.estimatedBuildCost + property.landValue)}
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(property.estimatedSalePrice)}
                </td>
                <td className="py-2.5 text-right font-bold">{formatCurrency(expectedProfit)}</td>
                <td className="py-2.5 text-right">
                  {(
                    (expectedProfit / (property.estimatedBuildCost + property.landValue)) *
                    100
                  ).toFixed(1)}
                  %
                </td>
              </tr>
              <tr className="text-red-400">
                <td className="py-2.5 font-medium">Worst Case</td>
                <td className="py-2.5 text-right">
                  {worstCaseDate ? formatDate(worstCaseDate) : 'TBD'}
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(property.estimatedBuildCost * 1.2 + property.landValue)}
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(property.estimatedSalePrice * 0.9)}
                </td>
                <td className="py-2.5 text-right font-bold">{formatCurrency(worstCaseProfit)}</td>
                <td className="py-2.5 text-right">
                  {(
                    (worstCaseProfit / (property.estimatedBuildCost * 1.2 + property.landValue)) *
                    100
                  ).toFixed(1)}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export default function ProjectManager() {
  const [activeTab, setActiveTab] = useState('properties')
  const [properties, setProperties] = useState<Property[]>(SAMPLE_PROPERTIES)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    SAMPLE_PROPERTIES.length > 0 ? SAMPLE_PROPERTIES[0].id : null
  )

  // Collect all vendors from all properties
  const allVendors = useMemo(() => {
    const vendorMap = new Map<string, Vendor>()
    properties.forEach((p) => {
      ;(p.vendors || []).forEach((v) => {
        if (!vendorMap.has(v.id)) {
          vendorMap.set(v.id, v)
        }
      })
    })
    return Array.from(vendorMap.values())
  }, [properties])

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null

  // Property Handlers
  function handleAddProperty(newProp: Property) {
    setProperties((prev) => [...prev, newProp])
  }

  function handleDeleteProperty(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id))
    if (selectedPropertyId === id) {
      setSelectedPropertyId(properties.length > 1 ? properties.find((p) => p.id !== id)?.id || null : null)
    }
  }

  // Milestone Handlers
  function handleUpdateMilestones(propertyId: string, milestones: Milestone[]) {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, milestones } : p))
    )
  }

  // Vendor Handlers
  function handleAddVendor(vendor: Vendor) {
    // Add vendor to the selected property (or first property if none selected)
    const targetId = selectedPropertyId || properties[0]?.id
    if (!targetId) return
    setProperties((prev) =>
      prev.map((p) =>
        p.id === targetId
          ? { ...p, vendors: [...(p.vendors || []), vendor] }
          : p
      )
    )
  }

  function handleDeleteVendor(vendorId: string) {
    setProperties((prev) =>
      prev.map((p) => ({
        ...p,
        vendors: (p.vendors || []).filter((v) => v.id !== vendorId),
      }))
    )
  }

  function handleUpdateVendorRating(vendorId: string, rating: number) {
    setProperties((prev) =>
      prev.map((p) => ({
        ...p,
        vendors: (p.vendors || []).map((v) =>
          v.id === vendorId ? { ...v, rating } : v
        ),
      }))
    )
  }

  // Expense Handlers
  function handleAddExpense(propertyId: string, expense: Expense) {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, expenses: [...(p.expenses || []), expense] }
          : p
      )
    )
  }

  function handleDeleteExpense(propertyId: string, expenseId: string) {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, expenses: (p.expenses || []).filter((e) => e.id !== expenseId) }
          : p
      )
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Project Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track properties, milestones, vendors, budgets, and forecasts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 border-b border-slate-700">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-[1px]',
                  isActive
                    ? 'text-teal-400 border-teal-400 bg-slate-800/50'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-500'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Selected Property Indicator (for property-scoped tabs) */}
        {['milestones', 'budget', 'forecast'].includes(activeTab) && selectedProperty && (
          <div className="mb-6 flex items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Active Property:</span>
            <select
              className={cn(selectClass, 'w-auto')}
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value || null)}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address} ({p.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'properties' && (
          <PropertiesOverview
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
            onAddProperty={handleAddProperty}
            onDeleteProperty={handleDeleteProperty}
          />
        )}
        {activeTab === 'milestones' && (
          <MilestoneTracker
            property={selectedProperty}
            onUpdateMilestones={handleUpdateMilestones}
          />
        )}
        {activeTab === 'vendors' && (
          <VendorManagement
            vendors={allVendors}
            onAddVendor={handleAddVendor}
            onDeleteVendor={handleDeleteVendor}
            onUpdateVendorRating={handleUpdateVendorRating}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetExpenses
            property={selectedProperty}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
        {activeTab === 'forecast' && <Forecasting property={selectedProperty} />}
      </div>
    </div>
  )
}
