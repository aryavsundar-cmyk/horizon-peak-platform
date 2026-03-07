'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Hammer,
  Users,
  Building2,
  Landmark,
  Scale,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  BarChart3,
  Target,
  Sparkles,
  Minus,
  Plus,
  Info,
  Banknote,
  Percent,
  Clock,
  Home,
  Wrench,
  Truck,
  Shield,
  FileText,
  HardHat,
  MapPin,
  Calculator,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react'
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { formatCurrency, formatPercent, cn } from '../../lib/utils'
import type { Deal } from '../../data/store'
import { useAppState } from '../../data/store'
import { HORIZON_PEAK_BUSINESS_PLAN } from '../../data/conashaugh-lakes'

// =============================================================================
// Types
// =============================================================================

interface RenovationLineItem {
  id: string
  category: string
  description: string
  laborCost: number
  materialCost: number
  contingency: number
}

interface ContractorEntry {
  id: string
  role: string
  name: string
  rate: string
  estimatedCost: number
  timeline: string
  notes: string
}

interface BankOption {
  id: string
  name: string
  loanType: string
  interestRate: number
  downPaymentPct: number
  originationFee: number
  closingCosts: number
  termMonths: number
  notes: string
}

interface LegalCost {
  id: string
  item: string
  estimatedCost: number
  notes: string
}

interface AgentEntry {
  id: string
  role: 'Buyer Agent' | 'Seller Agent' | 'Dual Agent'
  name: string
  commissionPct: number
  estimatedCost: number
  notes: string
}

interface ProjectTimeline {
  phase: string
  durationWeeks: number
  cost: number
}

type StrategyType = 'flip' | 'rental' | 'build-to-sell' | 'brrrr'

// =============================================================================
// Build-to-Sell Property Configuration Types & Value Matrix
// =============================================================================

type HomeType = 'ranch' | 'cape-cod' | 'colonial' | 'split-level' | 'contemporary'
type GarageType = 'none' | '1-car-attached' | '2-car-attached' | '3-car-attached' | '2-car-detached'
type QualityLevel = 'standard' | 'upgraded' | 'premium'

interface CustomAmenity {
  id: string
  label: string
  cost: number
  arv: number
}

interface PropertyBuildConfig {
  homeType: HomeType
  sqft: number
  bedrooms: number
  bathrooms: number
  garage: GarageType
  qualityLevel: QualityLevel
  amenities: string[]
  customAmenities: CustomAmenity[]
}

// Pike County / Pocono Region Value Matrix
// Sources: Horizon Peak Business Plan sale comps ($220–$290/sqft), builder quotes ($140–$200/sqft)
const PIKE_COUNTY_VALUES = {
  buildCostPerSqft: {
    standard: 145,   // Base modular, builder-grade finishes
    upgraded: 170,   // Better fixtures, upgraded cabinets/trim
    premium: 200,    // High-end finishes, custom features
  } as Record<QualityLevel, number>,
  arvPerSqft: {
    standard: 225,   // Conservative — slightly above $220 comp
    upgraded: 255,   // Market average — near $250 comp
    premium: 285,    // Premium — near $290 best-case comp
  } as Record<QualityLevel, number>,
  homeType: {
    'ranch':        { label: 'Ranch',        desc: 'Single-story, open layout',   costMult: 1.0,  arvMult: 0.98, typicalSqft: 1400, holdingMonths: 7 },
    'cape-cod':     { label: 'Cape Cod',     desc: '1.5 story, dormered rooms',   costMult: 1.02, arvMult: 1.0,  typicalSqft: 1600, holdingMonths: 8 },
    'colonial':     { label: 'Colonial',     desc: '2-story traditional',         costMult: 1.05, arvMult: 1.05, typicalSqft: 2200, holdingMonths: 9 },
    'split-level':  { label: 'Split-Level',  desc: 'Multi-level, space efficient', costMult: 1.03, arvMult: 0.97, typicalSqft: 1800, holdingMonths: 8 },
    'contemporary': { label: 'Contemporary', desc: 'Modern design, premium feel', costMult: 1.10, arvMult: 1.08, typicalSqft: 2000, holdingMonths: 9 },
  } as Record<HomeType, { label: string; desc: string; costMult: number; arvMult: number; typicalSqft: number; holdingMonths: number }>,
  garage: {
    'none':            { label: 'No Garage',       cost: 0,     arv: 0 },
    '1-car-attached':  { label: '1-Car Attached',  cost: 15000, arv: 20000 },
    '2-car-attached':  { label: '2-Car Attached',  cost: 25000, arv: 38000 },
    '3-car-attached':  { label: '3-Car Attached',  cost: 38000, arv: 52000 },
    '2-car-detached':  { label: '2-Car Detached',  cost: 30000, arv: 35000 },
  } as Record<GarageType, { label: string; cost: number; arv: number }>,
  bedrooms: [
    { count: 2, cost: -8000,  arv: -15000 },
    { count: 3, cost: 0,      arv: 0 },
    { count: 4, cost: 12000,  arv: 22000 },
    { count: 5, cost: 25000,  arv: 40000 },
  ],
  bathrooms: [
    { count: 1,   cost: -5000,  arv: -12000 },
    { count: 1.5, cost: -2000,  arv: -6000 },
    { count: 2,   cost: 0,      arv: 0 },
    { count: 2.5, cost: 5000,   arv: 10000 },
    { count: 3,   cost: 10000,  arv: 18000 },
    { count: 3.5, cost: 16000,  arv: 25000 },
  ],
  amenities: [
    { id: 'deck-patio',          label: 'Deck / Patio',            cost: 8000,  arv: 12000, category: 'Exterior' },
    { id: 'covered-porch',       label: 'Covered Porch',           cost: 6000,  arv: 9000,  category: 'Exterior' },
    { id: 'energy-star-windows', label: 'Energy Star Windows',     cost: 4000,  arv: 5500,  category: 'Exterior' },
    { id: 'landscaping',         label: 'Landscaping Package',     cost: 5000,  arv: 8000,  category: 'Exterior' },
    { id: 'paved-driveway',      label: 'Paved Driveway',          cost: 6000,  arv: 8000,  category: 'Exterior' },
    { id: 'fireplace',           label: 'Fireplace',               cost: 5000,  arv: 8000,  category: 'Interior' },
    { id: 'finished-basement',   label: 'Finished Basement',       cost: 25000, arv: 35000, category: 'Interior' },
    { id: 'hardwood-floors',     label: 'Hardwood Floors',         cost: 6000,  arv: 9000,  category: 'Interior' },
    { id: 'walk-in-closets',     label: 'Walk-in Closet(s)',       cost: 2000,  arv: 4000,  category: 'Interior' },
    { id: 'main-floor-laundry',  label: 'Main Floor Laundry',      cost: 1500,  arv: 3000,  category: 'Interior' },
    { id: 'granite-quartz',      label: 'Granite/Quartz Counters', cost: 4500,  arv: 7000,  category: 'Kitchen' },
    { id: 'stainless-appliances',label: 'SS Appliances Package',   cost: 4000,  arv: 5500,  category: 'Kitchen' },
    { id: 'central-air',         label: 'Central Air Conditioning', cost: 5000,  arv: 7000,  category: 'HVAC' },
    { id: 'heat-pump',           label: 'Heat Pump / Mini-Split',  cost: 7000,  arv: 8500,  category: 'HVAC' },
    { id: 'tankless-water-heater', label: 'Tankless Water Heater', cost: 2500,  arv: 3500,  category: 'Plumbing' },
    { id: 'smart-home',          label: 'Smart Home Package',      cost: 3500,  arv: 5000,  category: 'Tech' },
  ],
  monthlyHolding: {
    propertyTax: 250,  // Pike County avg for new construction
    insurance: 150,     // Builder's risk / homeowner's
    hoaDues: 100,       // CLCA $1,200/year = $100/month
    utilities: 200,     // During construction phase
  },
}

const DEFAULT_BUILD_CONFIG: PropertyBuildConfig = {
  homeType: 'ranch',
  sqft: 1600,
  bedrooms: 3,
  bathrooms: 2,
  garage: '2-car-attached',
  qualityLevel: 'upgraded',
  amenities: ['central-air', 'granite-quartz', 'stainless-appliances', 'energy-star-windows'],
  customAmenities: [],
}

function computeBuildValues(config: PropertyBuildConfig) {
  const v = PIKE_COUNTY_VALUES
  const typeData = v.homeType[config.homeType]
  const garageData = v.garage[config.garage]

  // Base costs from sqft × rate × home type multiplier
  const baseCost = Math.round(config.sqft * v.buildCostPerSqft[config.qualityLevel] * typeData.costMult)
  const baseARV = Math.round(config.sqft * v.arvPerSqft[config.qualityLevel] * typeData.arvMult)

  // Bedroom / bathroom adjustments (base = 3 bed / 2 bath)
  const bedAdj = v.bedrooms.find(b => b.count === config.bedrooms) || { cost: 0, arv: 0 }
  const bathAdj = v.bathrooms.find(b => b.count === config.bathrooms) || { cost: 0, arv: 0 }

  // Amenity totals (preset + custom)
  let amenityCost = 0
  let amenityARV = 0
  config.amenities.forEach(id => {
    const amenity = v.amenities.find(a => a.id === id)
    if (amenity) {
      amenityCost += amenity.cost
      amenityARV += amenity.arv
    }
  })
  config.customAmenities.forEach(ca => {
    amenityCost += ca.cost
    amenityARV += ca.arv
  })

  const totalBuildCost = baseCost + garageData.cost + bedAdj.cost + bathAdj.cost + amenityCost
  const estimatedARV = baseARV + garageData.arv + bedAdj.arv + bathAdj.arv + amenityARV

  // Holding period: base from home type + size adjustments
  let holdingMonths = typeData.holdingMonths
  if (config.sqft > 2500) holdingMonths += 2
  else if (config.sqft > 2000) holdingMonths += 1

  // Monthly holding cost (excluding loan interest which is computed separately)
  const monthlyHoldingCost = v.monthlyHolding.propertyTax + v.monthlyHolding.insurance + v.monthlyHolding.hoaDues + v.monthlyHolding.utilities

  return { totalBuildCost, estimatedARV, holdingMonths, monthlyHoldingCost }
}

function generateBuildToSellRenovation(totalBuildCost: number): RenovationLineItem[] {
  return [
    { id: 'r1', category: 'Site Preparation', description: 'Clearing, grading, driveway, well/septic', laborCost: Math.round(totalBuildCost * 0.18), materialCost: Math.round(totalBuildCost * 0.07), contingency: Math.round(totalBuildCost * 0.025) },
    { id: 'r2', category: 'Foundation', description: 'Concrete slab/crawl space, footings', laborCost: Math.round(totalBuildCost * 0.08), materialCost: Math.round(totalBuildCost * 0.12), contingency: Math.round(totalBuildCost * 0.02) },
    { id: 'r3', category: 'Modular/Structure', description: 'Home unit purchase, delivery, and set', laborCost: Math.round(totalBuildCost * 0.05), materialCost: Math.round(totalBuildCost * 0.35), contingency: Math.round(totalBuildCost * 0.03) },
    { id: 'r4', category: 'Mechanical/Utilities', description: 'HVAC, plumbing, electrical connections', laborCost: Math.round(totalBuildCost * 0.08), materialCost: Math.round(totalBuildCost * 0.04), contingency: Math.round(totalBuildCost * 0.015) },
    { id: 'r5', category: 'Finishes & Fixtures', description: 'Interior upgrades, appliances, flooring', laborCost: Math.round(totalBuildCost * 0.04), materialCost: Math.round(totalBuildCost * 0.06), contingency: Math.round(totalBuildCost * 0.01) },
    { id: 'r6', category: 'Exterior & Landscaping', description: 'Siding, deck, landscaping, grading', laborCost: Math.round(totalBuildCost * 0.04), materialCost: Math.round(totalBuildCost * 0.03), contingency: Math.round(totalBuildCost * 0.01) },
    { id: 'r7', category: 'Permits & Inspections', description: 'Township, CLCA review, final CO', laborCost: 0, materialCost: Math.round(totalBuildCost * 0.01), contingency: Math.round(totalBuildCost * 0.005) },
  ]
}

// =============================================================================
// Default Data Generators
// =============================================================================

function generateDefaultRenovation(deal: Deal): RenovationLineItem[] {
  const isLand = deal.sqft === 0 && deal.beds === 0
  const rehab = deal.estimatedRehab || (isLand ? 280000 : 60000)

  if (isLand) {
    return [
      { id: 'r1', category: 'Site Preparation', description: 'Clearing, grading, driveway, well/septic', laborCost: Math.round(rehab * 0.18), materialCost: Math.round(rehab * 0.07), contingency: Math.round(rehab * 0.025) },
      { id: 'r2', category: 'Foundation', description: 'Concrete slab/crawl space, footings', laborCost: Math.round(rehab * 0.08), materialCost: Math.round(rehab * 0.12), contingency: Math.round(rehab * 0.02) },
      { id: 'r3', category: 'Modular/Structure', description: 'Home unit purchase, delivery, and set', laborCost: Math.round(rehab * 0.05), materialCost: Math.round(rehab * 0.35), contingency: Math.round(rehab * 0.03) },
      { id: 'r4', category: 'Mechanical/Utilities', description: 'HVAC, plumbing, electrical connections', laborCost: Math.round(rehab * 0.08), materialCost: Math.round(rehab * 0.04), contingency: Math.round(rehab * 0.015) },
      { id: 'r5', category: 'Finishes & Fixtures', description: 'Interior upgrades, appliances, flooring', laborCost: Math.round(rehab * 0.04), materialCost: Math.round(rehab * 0.06), contingency: Math.round(rehab * 0.01) },
      { id: 'r6', category: 'Exterior & Landscaping', description: 'Siding, deck, landscaping, grading', laborCost: Math.round(rehab * 0.04), materialCost: Math.round(rehab * 0.03), contingency: Math.round(rehab * 0.01) },
      { id: 'r7', category: 'Permits & Inspections', description: 'Township, CLCA review, final CO', laborCost: 0, materialCost: Math.round(rehab * 0.01), contingency: Math.round(rehab * 0.005) },
    ]
  }

  return [
    { id: 'r1', category: 'Kitchen', description: 'Cabinets, countertops, appliances, plumbing', laborCost: Math.round(rehab * 0.12), materialCost: Math.round(rehab * 0.18), contingency: Math.round(rehab * 0.03) },
    { id: 'r2', category: 'Bathrooms', description: 'Tile, vanities, fixtures, shower/tub', laborCost: Math.round(rehab * 0.08), materialCost: Math.round(rehab * 0.12), contingency: Math.round(rehab * 0.02) },
    { id: 'r3', category: 'Flooring', description: 'Hardwood, LVP, carpet, tile', laborCost: Math.round(rehab * 0.05), materialCost: Math.round(rehab * 0.08), contingency: Math.round(rehab * 0.01) },
    { id: 'r4', category: 'Paint & Drywall', description: 'Interior paint, drywall repair, trim', laborCost: Math.round(rehab * 0.06), materialCost: Math.round(rehab * 0.03), contingency: Math.round(rehab * 0.01) },
    { id: 'r5', category: 'Roof & Exterior', description: 'Roof repair/replace, siding, windows', laborCost: Math.round(rehab * 0.05), materialCost: Math.round(rehab * 0.08), contingency: Math.round(rehab * 0.02) },
    { id: 'r6', category: 'HVAC & Electrical', description: 'HVAC servicing, panel upgrade, wiring', laborCost: Math.round(rehab * 0.04), materialCost: Math.round(rehab * 0.04), contingency: Math.round(rehab * 0.01) },
    { id: 'r7', category: 'Landscaping', description: 'Lawn, trees, driveway, exterior lighting', laborCost: Math.round(rehab * 0.02), materialCost: Math.round(rehab * 0.02), contingency: Math.round(rehab * 0.005) },
    { id: 'r8', category: 'Permits & Inspections', description: 'Building permits, inspection fees', laborCost: 0, materialCost: Math.round(rehab * 0.015), contingency: Math.round(rehab * 0.005) },
  ]
}

function generateDefaultContractors(deal: Deal): ContractorEntry[] {
  const isLand = deal.sqft === 0 && deal.beds === 0
  const rehab = deal.estimatedRehab || (isLand ? 280000 : 60000)

  if (isLand) {
    return [
      { id: 'c1', role: 'General Contractor / Builder', name: 'Kintner Modular Homes', rate: '$140–180/sqft', estimatedCost: Math.round(rehab * 0.55), timeline: '4-6 months', notes: 'Local PA builder, factory-built quality' },
      { id: 'c2', role: 'Excavation & Site Work', name: 'TBD Local Excavator', rate: 'Project bid', estimatedCost: Math.round(rehab * 0.18), timeline: '2-4 weeks', notes: 'Clearing, grading, driveway, septic' },
      { id: 'c3', role: 'Foundation Contractor', name: 'TBD Foundation Co.', rate: 'Project bid', estimatedCost: Math.round(rehab * 0.12), timeline: '2-3 weeks', notes: 'Footings, slab or crawl space' },
      { id: 'c4', role: 'Plumber', name: 'TBD Licensed Plumber', rate: '$85-120/hr', estimatedCost: Math.round(rehab * 0.05), timeline: '1-2 weeks', notes: 'Water, sewer/septic connections' },
      { id: 'c5', role: 'Electrician', name: 'TBD Licensed Electrician', rate: '$75-110/hr', estimatedCost: Math.round(rehab * 0.04), timeline: '1-2 weeks', notes: 'Panel, meter, interior connections' },
      { id: 'c6', role: 'Landscaper', name: 'TBD Landscaping Co.', rate: 'Project bid', estimatedCost: Math.round(rehab * 0.04), timeline: '1-2 weeks', notes: 'Grading, seed/sod, trees' },
    ]
  }

  return [
    { id: 'c1', role: 'General Contractor', name: 'TBD', rate: '$50-80/hr', estimatedCost: Math.round(rehab * 0.25), timeline: '3-4 months', notes: 'Oversees full rehab project' },
    { id: 'c2', role: 'Kitchen/Bath Specialist', name: 'TBD', rate: 'Project bid', estimatedCost: Math.round(rehab * 0.25), timeline: '3-5 weeks', notes: 'Cabinets, counters, tile, fixtures' },
    { id: 'c3', role: 'Flooring Installer', name: 'TBD', rate: '$3-8/sqft', estimatedCost: Math.round(rehab * 0.10), timeline: '1-2 weeks', notes: 'Hardwood, LVP, tile' },
    { id: 'c4', role: 'Roofer', name: 'TBD', rate: 'Project bid', estimatedCost: Math.round(rehab * 0.12), timeline: '1-2 weeks', notes: 'Full roof or spot repair' },
    { id: 'c5', role: 'HVAC Technician', name: 'TBD', rate: '$75-100/hr', estimatedCost: Math.round(rehab * 0.08), timeline: '1 week', notes: 'Service or replace HVAC system' },
    { id: 'c6', role: 'Painter', name: 'TBD', rate: '$2-4/sqft', estimatedCost: Math.round(rehab * 0.08), timeline: '1-2 weeks', notes: 'Interior and exterior paint' },
    { id: 'c7', role: 'Electrician', name: 'TBD', rate: '$75-100/hr', estimatedCost: Math.round(rehab * 0.06), timeline: '1 week', notes: 'Panel upgrade, wiring, fixtures' },
    { id: 'c8', role: 'Plumber', name: 'TBD', rate: '$85-120/hr', estimatedCost: Math.round(rehab * 0.06), timeline: '1 week', notes: 'Re-pipe, fixture install' },
  ]
}

function generateDefaultBanks(): BankOption[] {
  const { banks } = HORIZON_PEAK_BUSINESS_PLAN
  return banks.map((b, i) => ({
    id: `b${i + 1}`,
    name: b.name,
    loanType: b.type,
    interestRate: 7.5,
    downPaymentPct: b.minDown * 100,
    originationFee: b.originationFee * 100,
    closingCosts: b.closingCosts,
    termMonths: 360,
    notes: b.notes,
  }))
}

function generateDefaultLegal(): LegalCost[] {
  return [
    { id: 'l1', item: 'Real Estate Attorney (Closing)', estimatedCost: 2500, notes: 'Title review, contract prep, closing representation' },
    { id: 'l2', item: 'Title Search & Insurance', estimatedCost: 1800, notes: 'Title search, title insurance policy' },
    { id: 'l3', item: 'Survey', estimatedCost: 800, notes: 'Property boundary survey' },
    { id: 'l4', item: 'Recording Fees', estimatedCost: 300, notes: 'County deed recording' },
    { id: 'l5', item: 'Transfer Tax (PA)', estimatedCost: 0, notes: 'PA transfer tax: 2% split buyer/seller — calculated below' },
    { id: 'l6', item: 'Entity Formation / Operating Agreement', estimatedCost: 500, notes: 'LLC formation if new entity needed' },
    { id: 'l7', item: 'Insurance (Builder\'s Risk / Liability)', estimatedCost: 2400, notes: '12-month policy during construction/renovation' },
  ]
}

function generateDefaultAgents(deal: Deal): AgentEntry[] {
  const arv = deal.estimatedARV || deal.listPrice * 1.3
  return [
    { id: 'a1', role: 'Buyer Agent', name: 'TBD Local Agent', commissionPct: 2.5, estimatedCost: Math.round(deal.listPrice * 0.025), notes: 'Represents buyer at acquisition' },
    { id: 'a2', role: 'Seller Agent', name: 'TBD Listing Agent', commissionPct: 3.0, estimatedCost: Math.round(arv * 0.03), notes: 'Lists and sells the property at disposition' },
  ]
}

// =============================================================================
// Chart colors
// =============================================================================

const PIE_COLORS = ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#6366f1']

// =============================================================================
// Sub-Components
// =============================================================================

function SectionHeader({ icon: Icon, title, subtitle, collapsed, onToggle }: {
  icon: React.ElementType
  title: string
  subtitle?: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-4 group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-teal-400" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {collapsed ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronUp className="w-5 h-5 text-slate-500" />}
    </button>
  )
}

function MetricCard({ label, value, sub, color = 'text-teal-400', icon: Icon }: {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: React.ElementType
}) {
  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={cn('w-4 h-4', color)} />}
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function NumberInput({ label, value, onChange, prefix, suffix, step = 1, min, max }: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  max?: number
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
          className={cn(
            'w-full bg-slate-900 border border-slate-700 rounded-lg py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all',
            prefix ? 'pl-7 pr-3' : 'px-3',
            suffix ? 'pr-10' : ''
          )}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

interface DealAnalyzerProps {
  deal: Deal
  onBack: () => void
}

export default function DealAnalyzer({ deal, onBack }: DealAnalyzerProps) {
  const { openDealInCalculator } = useAppState()

  // ---------------------------------------------------------------------------
  // Strategy
  // ---------------------------------------------------------------------------
  const isLand = deal.sqft === 0 && deal.beds === 0
  const [strategy, setStrategy] = useState<StrategyType>(isLand ? 'build-to-sell' : 'flip')

  // ---------------------------------------------------------------------------
  // Investment Assumptions
  // ---------------------------------------------------------------------------
  const [purchasePrice, setPurchasePrice] = useState(deal.listPrice)
  const [afterRepairValue, setAfterRepairValue] = useState(deal.estimatedARV || Math.round(deal.listPrice * 1.6))
  const [holdingMonths, setHoldingMonths] = useState(isLand ? 8 : 5)
  const [monthlyHoldingCost, setMonthlyHoldingCost] = useState(1800)
  const [monthlyRentalIncome, setMonthlyRentalIncome] = useState(2200)

  // ---------------------------------------------------------------------------
  // Build-to-Sell Property Configuration
  // ---------------------------------------------------------------------------
  const [buildConfig, setBuildConfig] = useState<PropertyBuildConfig>({ ...DEFAULT_BUILD_CONFIG })

  const buildValues = useMemo(() => computeBuildValues(buildConfig), [buildConfig])

  const updateBuildConfig = useCallback((updates: Partial<PropertyBuildConfig>) => {
    const updated = { ...buildConfig, ...updates }
    // Auto-adjust sqft when home type changes
    if (updates.homeType && updates.homeType !== buildConfig.homeType) {
      updated.sqft = PIKE_COUNTY_VALUES.homeType[updates.homeType].typicalSqft
    }
    // Enforce CLCA minimum 1,200 sqft
    if (updated.sqft < 1200) updated.sqft = 1200
    setBuildConfig(updated)
    // Auto-populate investment assumptions from config
    const values = computeBuildValues(updated)
    setAfterRepairValue(values.estimatedARV)
    setHoldingMonths(values.holdingMonths)
    setMonthlyHoldingCost(values.monthlyHoldingCost)
    setRenovation(generateBuildToSellRenovation(values.totalBuildCost))
  }, [buildConfig])

  const toggleBuildAmenity = useCallback((id: string) => {
    const newAmenities = buildConfig.amenities.includes(id)
      ? buildConfig.amenities.filter(a => a !== id)
      : [...buildConfig.amenities, id]
    const updated = { ...buildConfig, amenities: newAmenities }
    setBuildConfig(updated)
    const values = computeBuildValues(updated)
    setAfterRepairValue(values.estimatedARV)
    setHoldingMonths(values.holdingMonths)
    setMonthlyHoldingCost(values.monthlyHoldingCost)
    setRenovation(generateBuildToSellRenovation(values.totalBuildCost))
  }, [buildConfig])

  const addCustomAmenity = useCallback(() => {
    const newItem: CustomAmenity = { id: `ca-${Date.now()}`, label: '', cost: 0, arv: 0 }
    const updated = { ...buildConfig, customAmenities: [...buildConfig.customAmenities, newItem] }
    setBuildConfig(updated)
  }, [buildConfig])

  const updateCustomAmenity = useCallback((id: string, field: keyof CustomAmenity, value: string | number) => {
    const updated = {
      ...buildConfig,
      customAmenities: buildConfig.customAmenities.map(ca =>
        ca.id === id ? { ...ca, [field]: value } : ca
      ),
    }
    setBuildConfig(updated)
    const values = computeBuildValues(updated)
    setAfterRepairValue(values.estimatedARV)
    setHoldingMonths(values.holdingMonths)
    setMonthlyHoldingCost(values.monthlyHoldingCost)
    setRenovation(generateBuildToSellRenovation(values.totalBuildCost))
  }, [buildConfig])

  const removeCustomAmenity = useCallback((id: string) => {
    const updated = {
      ...buildConfig,
      customAmenities: buildConfig.customAmenities.filter(ca => ca.id !== id),
    }
    setBuildConfig(updated)
    const values = computeBuildValues(updated)
    setAfterRepairValue(values.estimatedARV)
    setHoldingMonths(values.holdingMonths)
    setMonthlyHoldingCost(values.monthlyHoldingCost)
    setRenovation(generateBuildToSellRenovation(values.totalBuildCost))
  }, [buildConfig])

  // ---------------------------------------------------------------------------
  // Renovation
  // ---------------------------------------------------------------------------
  const [renovation, setRenovation] = useState<RenovationLineItem[]>(() => generateDefaultRenovation(deal))
  const [renoCollapsed, setRenoCollapsed] = useState(false)

  const updateRenoItem = useCallback((id: string, field: keyof RenovationLineItem, value: number | string) => {
    setRenovation(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }, [])

  const addRenoItem = useCallback(() => {
    const newId = `r${Date.now()}`
    setRenovation(prev => [...prev, { id: newId, category: 'New Item', description: '', laborCost: 0, materialCost: 0, contingency: 0 }])
  }, [])

  const removeRenoItem = useCallback((id: string) => {
    setRenovation(prev => prev.filter(r => r.id !== id))
  }, [])

  // ---------------------------------------------------------------------------
  // Contractors
  // ---------------------------------------------------------------------------
  const [contractors, setContractors] = useState<ContractorEntry[]>(() => generateDefaultContractors(deal))
  const [contractorCollapsed, setContractorCollapsed] = useState(true)

  const updateContractor = useCallback((id: string, field: keyof ContractorEntry, value: string | number) => {
    setContractors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }, [])

  // ---------------------------------------------------------------------------
  // Banking / Financing
  // ---------------------------------------------------------------------------
  const [banks, setBanks] = useState<BankOption[]>(() => generateDefaultBanks())
  const [selectedBankId, setSelectedBankId] = useState(banks[0]?.id || '')
  const [bankCollapsed, setBankCollapsed] = useState(true)

  const updateBank = useCallback((id: string, field: keyof BankOption, value: string | number) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }, [])

  const selectedBank = banks.find(b => b.id === selectedBankId) || banks[0]

  // ---------------------------------------------------------------------------
  // Legal
  // ---------------------------------------------------------------------------
  const [legal, setLegal] = useState<LegalCost[]>(() => generateDefaultLegal())
  const [legalCollapsed, setLegalCollapsed] = useState(true)

  const updateLegal = useCallback((id: string, field: keyof LegalCost, value: string | number) => {
    setLegal(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }, [])

  // ---------------------------------------------------------------------------
  // Agents
  // ---------------------------------------------------------------------------
  const [agents, setAgents] = useState<AgentEntry[]>(() => generateDefaultAgents(deal))
  const [agentCollapsed, setAgentCollapsed] = useState(true)

  const updateAgent = useCallback((id: string, field: keyof AgentEntry, value: string | number) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }, [])

  // ---------------------------------------------------------------------------
  // Computed Totals
  // ---------------------------------------------------------------------------
  const computed = useMemo(() => {
    // Renovation totals
    const totalLabor = renovation.reduce((s, r) => s + r.laborCost, 0)
    const totalMaterials = renovation.reduce((s, r) => s + r.materialCost, 0)
    const totalContingency = renovation.reduce((s, r) => s + r.contingency, 0)
    const totalRenovation = totalLabor + totalMaterials + totalContingency

    // Contractor totals
    const totalContractors = contractors.reduce((s, c) => s + c.estimatedCost, 0)

    // Legal totals
    const transferTax = Math.round(purchasePrice * 0.02) // PA 2% transfer tax
    const totalLegal = legal.reduce((s, l) => s + l.estimatedCost, 0) + transferTax

    // Agent totals
    const totalAgentBuy = agents.filter(a => a.role === 'Buyer Agent').reduce((s, a) => s + a.estimatedCost, 0)
    const totalAgentSell = agents.filter(a => a.role !== 'Buyer Agent').reduce((s, a) => s + a.estimatedCost, 0)
    const totalAgents = totalAgentBuy + totalAgentSell

    // Banking
    const downPayment = Math.round(purchasePrice * (selectedBank.downPaymentPct / 100))
    const loanAmount = purchasePrice - downPayment
    const originationFeeAmt = Math.round(loanAmount * (selectedBank.originationFee / 100))
    const monthlyRate = selectedBank.interestRate / 100 / 12
    const monthlyPayment = monthlyRate > 0
      ? Math.round(loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, selectedBank.termMonths)) / (Math.pow(1 + monthlyRate, selectedBank.termMonths) - 1))
      : Math.round(loanAmount / selectedBank.termMonths)
    const interestDuringHold = Math.round(loanAmount * monthlyRate * holdingMonths)
    const totalFinancingCosts = originationFeeAmt + selectedBank.closingCosts + interestDuringHold

    // Holding costs
    const totalHolding = monthlyHoldingCost * holdingMonths

    // Total investment
    const totalInvestment = purchasePrice + totalRenovation + totalFinancingCosts + totalLegal + totalAgents + totalHolding

    // Cash required (out-of-pocket)
    const cashRequired = downPayment + totalRenovation + totalFinancingCosts + totalLegal + totalAgentBuy + totalHolding

    // Returns
    const grossProfit = afterRepairValue - totalInvestment - totalAgentSell
    const roi = totalInvestment > 0 ? (grossProfit / cashRequired) * 100 : 0
    const annualizedROI = holdingMonths > 0 ? roi * (12 / holdingMonths) : roi

    // Rental analysis
    const annualRent = monthlyRentalIncome * 12
    const annualExpenses = (monthlyHoldingCost * 12) + (monthlyPayment * 12)
    const netOperatingIncome = annualRent - (monthlyHoldingCost * 12)
    const cashFlowMonthly = monthlyRentalIncome - monthlyHoldingCost - monthlyPayment
    const capRate = purchasePrice > 0 ? (netOperatingIncome / (purchasePrice + totalRenovation)) * 100 : 0
    const cashOnCashReturn = cashRequired > 0 ? ((cashFlowMonthly * 12) / cashRequired) * 100 : 0

    return {
      totalLabor, totalMaterials, totalContingency, totalRenovation,
      totalContractors,
      totalLegal, transferTax,
      totalAgentBuy, totalAgentSell, totalAgents,
      downPayment, loanAmount, originationFeeAmt, monthlyPayment, interestDuringHold, totalFinancingCosts,
      totalHolding,
      totalInvestment, cashRequired,
      grossProfit, roi, annualizedROI,
      annualRent, netOperatingIncome, cashFlowMonthly, capRate, cashOnCashReturn,
    }
  }, [renovation, contractors, legal, agents, purchasePrice, afterRepairValue, holdingMonths, monthlyHoldingCost, monthlyRentalIncome, selectedBank])

  // ---------------------------------------------------------------------------
  // Chart Data
  // ---------------------------------------------------------------------------
  const costBreakdownData = useMemo(() => [
    { name: 'Acquisition', value: purchasePrice },
    { name: 'Renovation', value: computed.totalRenovation },
    { name: 'Financing', value: computed.totalFinancingCosts },
    { name: 'Legal & Title', value: computed.totalLegal },
    { name: 'Agent Fees', value: computed.totalAgents },
    { name: 'Holding Costs', value: computed.totalHolding },
  ], [purchasePrice, computed])

  const renoBreakdownData = useMemo(() =>
    renovation.map(r => ({
      name: r.category,
      labor: r.laborCost,
      materials: r.materialCost,
      contingency: r.contingency,
    }))
  , [renovation])

  const cashflowProjection = useMemo(() => {
    const months = []
    let cumulative = -computed.cashRequired
    for (let i = 1; i <= Math.max(holdingMonths + 6, 12); i++) {
      if (strategy === 'flip' || strategy === 'build-to-sell') {
        cumulative -= monthlyHoldingCost
        if (i === holdingMonths) {
          cumulative += afterRepairValue - computed.totalAgentSell
        }
      } else {
        cumulative += computed.cashFlowMonthly
      }
      months.push({ month: `M${i}`, cumulative: Math.round(cumulative) })
    }
    return months
  }, [strategy, holdingMonths, monthlyHoldingCost, afterRepairValue, computed])

  const timelineData: ProjectTimeline[] = useMemo(() => {
    if (isLand) {
      return [
        { phase: 'Acquisition & Permitting', durationWeeks: 4, cost: purchasePrice + computed.totalLegal },
        { phase: 'Site Prep & Foundation', durationWeeks: 6, cost: Math.round(computed.totalRenovation * 0.30) },
        { phase: 'Modular Delivery & Set', durationWeeks: 4, cost: Math.round(computed.totalRenovation * 0.35) },
        { phase: 'Connections & Mechanical', durationWeeks: 4, cost: Math.round(computed.totalRenovation * 0.15) },
        { phase: 'Finishes & Landscaping', durationWeeks: 4, cost: Math.round(computed.totalRenovation * 0.15) },
        { phase: 'Inspection & Listing', durationWeeks: 2, cost: Math.round(computed.totalRenovation * 0.05) },
        { phase: 'Marketing & Sale', durationWeeks: 8, cost: computed.totalAgentSell },
      ]
    }
    return [
      { phase: 'Due Diligence & Close', durationWeeks: 3, cost: purchasePrice + computed.totalLegal },
      { phase: 'Demolition & Prep', durationWeeks: 2, cost: Math.round(computed.totalRenovation * 0.05) },
      { phase: 'Structural & Rough-In', durationWeeks: 4, cost: Math.round(computed.totalRenovation * 0.30) },
      { phase: 'Kitchen & Bath', durationWeeks: 3, cost: Math.round(computed.totalRenovation * 0.30) },
      { phase: 'Finishes & Paint', durationWeeks: 3, cost: Math.round(computed.totalRenovation * 0.25) },
      { phase: 'Final Punch & Landscaping', durationWeeks: 2, cost: Math.round(computed.totalRenovation * 0.10) },
      { phase: 'Marketing & Sale', durationWeeks: 6, cost: computed.totalAgentSell },
    ]
  }, [isLand, purchasePrice, computed])

  // ---------------------------------------------------------------------------
  // Verdict
  // ---------------------------------------------------------------------------
  const verdict = useMemo(() => {
    if (strategy === 'rental' || strategy === 'brrrr') {
      if (computed.cashOnCashReturn >= 10) return { grade: 'A', label: 'Strong Cash Flow', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' }
      if (computed.cashOnCashReturn >= 5) return { grade: 'B', label: 'Decent Returns', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' }
      return { grade: 'C', label: 'Marginal Returns', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' }
    }
    if (computed.roi >= 25) return { grade: 'A', label: 'Excellent Deal', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' }
    if (computed.roi >= 15) return { grade: 'B', label: 'Good Opportunity', color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/30' }
    if (computed.roi >= 5) return { grade: 'C', label: 'Marginal Return', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' }
    return { grade: 'F', label: 'Not Recommended', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' }
  }, [strategy, computed])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30'

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* ========== Header ========== */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-teal-400" />
            <h1 className="text-2xl font-bold text-white">Deal Analyzer</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            <MapPin className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
            {deal.address}, {deal.city}, {deal.state} {deal.zip} — {deal.source}
          </p>
        </div>
        {/* Verdict Badge */}
        <div className={cn('border rounded-xl px-5 py-3 text-center', verdict.bg)}>
          <p className={cn('text-3xl font-black', verdict.color)}>{verdict.grade}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{verdict.label}</p>
        </div>
      </div>

      {/* ========== Strategy Selector ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Investment Strategy</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {([
            { key: 'flip', label: 'Fix & Flip', icon: Hammer, desc: 'Buy, renovate, sell for profit' },
            { key: 'rental', label: 'Buy & Hold Rental', icon: Home, desc: 'Long-term rental cash flow' },
            { key: 'build-to-sell', label: 'Build-to-Sell', icon: Building2, desc: 'New construction on vacant land' },
            { key: 'brrrr', label: 'BRRRR', icon: TrendingUp, desc: 'Buy, Rehab, Rent, Refinance, Repeat' },
          ] as { key: StrategyType; label: string; icon: React.ElementType; desc: string }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setStrategy(s.key)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                strategy === s.key
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              )}
            >
              <s.icon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-[10px] text-slate-500">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========== Key Metrics Grid ========== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Purchase Price" value={formatCurrency(purchasePrice)} icon={DollarSign} />
        <MetricCard label="Total Renovation" value={formatCurrency(computed.totalRenovation)} icon={Hammer} color="text-amber-400" />
        <MetricCard label="Total Investment" value={formatCurrency(computed.totalInvestment)} icon={Target} color="text-purple-400" />
        <MetricCard label="Cash Required" value={formatCurrency(computed.cashRequired)} sub={`Down: ${formatCurrency(computed.downPayment)}`} icon={Banknote} color="text-orange-400" />
        {(strategy === 'flip' || strategy === 'build-to-sell') ? (
          <>
            <MetricCard label="Gross Profit" value={formatCurrency(computed.grossProfit)} sub={`ARV: ${formatCurrency(afterRepairValue)}`} icon={TrendingUp} color={computed.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <MetricCard label="ROI" value={formatPercent(computed.roi)} sub={`Annualized: ${formatPercent(computed.annualizedROI)}`} icon={Percent} color={computed.roi >= 15 ? 'text-emerald-400' : 'text-yellow-400'} />
          </>
        ) : (
          <>
            <MetricCard label="Monthly Cash Flow" value={formatCurrency(computed.cashFlowMonthly)} sub={`Cap Rate: ${formatPercent(computed.capRate)}`} icon={TrendingUp} color={computed.cashFlowMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <MetricCard label="Cash-on-Cash" value={formatPercent(computed.cashOnCashReturn)} sub={`NOI: ${formatCurrency(computed.netOperatingIncome)}`} icon={Percent} color={computed.cashOnCashReturn >= 8 ? 'text-emerald-400' : 'text-yellow-400'} />
          </>
        )}
      </div>

      {/* ========== Investment Assumptions ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Investment Assumptions</h3>
            <p className="text-xs text-slate-500">Adjust purchase price, ARV, and holding period</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <NumberInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" step={5000} />
          <NumberInput label="After Repair Value (ARV)" value={afterRepairValue} onChange={setAfterRepairValue} prefix="$" step={5000} />
          <NumberInput label="Holding Period" value={holdingMonths} onChange={setHoldingMonths} suffix="mos" min={1} max={60} />
          <NumberInput label="Monthly Holding Cost" value={monthlyHoldingCost} onChange={setMonthlyHoldingCost} prefix="$" step={100} />
          {(strategy === 'rental' || strategy === 'brrrr') && (
            <NumberInput label="Monthly Rental Income" value={monthlyRentalIncome} onChange={setMonthlyRentalIncome} prefix="$" step={100} />
          )}
        </div>
      </div>

      {/* ========== Build-to-Sell Property Configuration ========== */}
      {strategy === 'build-to-sell' && (
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-teal-900/10 border border-teal-500/20 rounded-xl p-5 mb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Property Build Configuration</h3>
                <p className="text-xs text-slate-500">Select property features — estimates auto-update as you configure</p>
              </div>
            </div>
            <button
              onClick={() => {
                setBuildConfig({ ...DEFAULT_BUILD_CONFIG })
                const values = computeBuildValues(DEFAULT_BUILD_CONFIG)
                setAfterRepairValue(values.estimatedARV)
                setHoldingMonths(values.holdingMonths)
                setMonthlyHoldingCost(values.monthlyHoldingCost)
                setRenovation(generateBuildToSellRenovation(values.totalBuildCost))
              }}
              className="text-xs text-slate-500 hover:text-teal-400 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>

          {/* Home Type */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Home Type</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(Object.entries(PIKE_COUNTY_VALUES.homeType) as [HomeType, (typeof PIKE_COUNTY_VALUES.homeType)[HomeType]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => updateBuildConfig({ homeType: key })}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    buildConfig.homeType === key
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  )}
                >
                  <p className="text-sm font-semibold">{data.label}</p>
                  <p className="text-[10px] text-slate-500">{data.desc}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">~{data.typicalSqft.toLocaleString()} sqft</p>
                </button>
              ))}
            </div>
          </div>

          {/* Size & Layout Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Square Footage */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Square Footage</label>
              <input
                type="number"
                value={buildConfig.sqft}
                onChange={e => updateBuildConfig({ sqft: Math.max(Number(e.target.value), 1200) })}
                min={1200}
                max={5000}
                step={100}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
              />
              <p className="text-[10px] text-slate-600 mt-1">Min 1,200 sqft (CLCA requirement)</p>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Bedrooms</label>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => updateBuildConfig({ bedrooms: n })}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                      buildConfig.bedrooms === n
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                        : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Bathrooms</label>
              <div className="flex gap-1.5">
                {[1, 1.5, 2, 2.5, 3, 3.5].map(n => (
                  <button
                    key={n}
                    onClick={() => updateBuildConfig({ bathrooms: n })}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-semibold transition-all',
                      buildConfig.bathrooms === n
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                        : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Garage */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Garage</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(Object.entries(PIKE_COUNTY_VALUES.garage) as [GarageType, (typeof PIKE_COUNTY_VALUES.garage)[GarageType]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => updateBuildConfig({ garage: key })}
                  className={cn(
                    'py-2.5 px-3 rounded-lg border text-sm font-medium transition-all text-center',
                    buildConfig.garage === key
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'
                  )}
                >
                  {data.label}
                  {data.arv > 0 && <span className="block text-[10px] text-slate-600">+{formatCurrency(data.arv)} ARV</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Level */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Quality Level</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'standard' as QualityLevel, label: 'Standard', desc: 'Base finishes, builder-grade fixtures', cost: PIKE_COUNTY_VALUES.buildCostPerSqft.standard, arv: PIKE_COUNTY_VALUES.arvPerSqft.standard },
                { key: 'upgraded' as QualityLevel, label: 'Upgraded', desc: 'Better cabinets, upgraded fixtures & trim', cost: PIKE_COUNTY_VALUES.buildCostPerSqft.upgraded, arv: PIKE_COUNTY_VALUES.arvPerSqft.upgraded },
                { key: 'premium' as QualityLevel, label: 'Premium', desc: 'High-end finishes, custom features', cost: PIKE_COUNTY_VALUES.buildCostPerSqft.premium, arv: PIKE_COUNTY_VALUES.arvPerSqft.premium },
              ]).map(q => (
                <button
                  key={q.key}
                  onClick={() => updateBuildConfig({ qualityLevel: q.key })}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    buildConfig.qualityLevel === q.key
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  )}
                >
                  <p className="text-sm font-semibold">{q.label}</p>
                  <p className="text-[10px] text-slate-500">{q.desc}</p>
                  <p className="text-[10px] text-teal-500/70 mt-0.5">Build: ${q.cost}/sqft &middot; ARV: ${q.arv}/sqft</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amenities & Upgrades */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Amenities & Upgrades</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
              {(() => {
                const categories = [...new Set(PIKE_COUNTY_VALUES.amenities.map(a => a.category))]
                return categories.map(cat => (
                  <div key={cat} className="mb-3">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1.5 border-b border-slate-700/50 pb-1">{cat}</p>
                    {PIKE_COUNTY_VALUES.amenities.filter(a => a.category === cat).map(amenity => (
                      <label
                        key={amenity.id}
                        className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={buildConfig.amenities.includes(amenity.id)}
                          onChange={() => toggleBuildAmenity(amenity.id)}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                            buildConfig.amenities.includes(amenity.id)
                              ? 'bg-teal-500 border-teal-500 text-white'
                              : 'border-slate-600 bg-slate-900/50 group-hover:border-slate-500'
                          )}
                        >
                          {buildConfig.amenities.includes(amenity.id) && (
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={cn(
                          'text-sm transition-colors flex-1',
                          buildConfig.amenities.includes(amenity.id) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                        )}>
                          {amenity.label}
                        </span>
                        <span className="text-[10px] text-slate-600">+{formatCurrency(amenity.arv)}</span>
                      </label>
                    ))}
                  </div>
                ))
              })()}
            </div>

            {/* Custom / Miscellaneous Amenities */}
            <div className="mt-3 border-t border-slate-700/50 pt-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">Custom / Miscellaneous</p>
              {buildConfig.customAmenities.map(ca => (
                <div key={ca.id} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={ca.label}
                    onChange={e => updateCustomAmenity(ca.id, 'label', e.target.value)}
                    placeholder="e.g. Pool, Outdoor Kitchen, Sauna..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">Cost</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">$</span>
                      <input
                        type="number"
                        value={ca.cost}
                        onChange={e => updateCustomAmenity(ca.id, 'cost', Number(e.target.value))}
                        step={1000}
                        min={0}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-sm text-amber-400 font-medium focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">ARV</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">$</span>
                      <input
                        type="number"
                        value={ca.arv}
                        onChange={e => updateCustomAmenity(ca.id, 'arv', Number(e.target.value))}
                        step={1000}
                        min={0}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-sm text-emerald-400 font-medium focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeCustomAmenity(ca.id)}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addCustomAmenity}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium mt-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Item
              </button>
            </div>
          </div>

          {/* Auto-Computed Summary */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-teal-400" />
              <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Auto-Computed Estimates (Pike County Averages)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Est. Build Cost</p>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(buildValues.totalBuildCost)}</p>
                <p className="text-[10px] text-slate-600">{formatCurrency(Math.round(buildValues.totalBuildCost / buildConfig.sqft))}/sqft</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Est. After-Built Value</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(buildValues.estimatedARV)}</p>
                <p className="text-[10px] text-slate-600">{formatCurrency(Math.round(buildValues.estimatedARV / buildConfig.sqft))}/sqft</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Construction + Sale</p>
                <p className="text-lg font-bold text-cyan-400">{buildValues.holdingMonths} months</p>
                <p className="text-[10px] text-slate-600">Build + marketing period</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Monthly Holding Cost</p>
                <p className="text-lg font-bold text-orange-400">{formatCurrency(buildValues.monthlyHoldingCost)}</p>
                <p className="text-[10px] text-slate-600">Tax + ins. + HOA + utilities</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 italic">
              Values based on Pike County/Pocono region averages from Horizon Peak Business Plan sale comps ($220&ndash;$290/sqft) and builder quotes ($140&ndash;$200/sqft).
              All values auto-populate the Investment Assumptions above &mdash; override anytime by editing the fields directly.
            </p>
          </div>
        </div>
      )}

      {/* ========== Quick Calculator Links ========== */}
      {openDealInCalculator && (
        <div className="bg-gradient-to-r from-purple-900/20 to-slate-800 border border-purple-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Deep Dive in Calculator Suite</p>
            </div>
            <div className="flex gap-2">
              {[
                { tab: 'construction', label: 'Construction Loan', show: isLand },
                { tab: 'flip', label: 'Flip / Rehab', show: !isLand },
                { tab: 'rental', label: 'Rental Analyzer', show: true },
                { tab: 'wholesale', label: 'Wholesale', show: true },
                { tab: 'brrrr', label: 'BRRRR', show: true },
              ].filter(t => t.show).map(t => (
                <button
                  key={t.tab}
                  onClick={() => openDealInCalculator(deal, t.tab)}
                  className="px-3 py-1.5 text-xs font-medium bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
                >
                  {t.label} →
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">Opens the deal in the full calculator with pre-populated values for deeper analysis.</p>
        </div>
      )}

      {/* ========== Renovation Budget ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 mb-4">
        <SectionHeader icon={Hammer} title="Renovation Budget" subtitle={`Labor: ${formatCurrency(computed.totalLabor)} | Materials: ${formatCurrency(computed.totalMaterials)} | Contingency: ${formatCurrency(computed.totalContingency)} | Total: ${formatCurrency(computed.totalRenovation)}`} collapsed={renoCollapsed} onToggle={() => setRenoCollapsed(!renoCollapsed)} />
        {!renoCollapsed && (
          <div className="pb-5 space-y-3">
            {/* Reno chart */}
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={renoBreakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} stroke="#64748b" fontSize={11} />
                  <Tooltip formatter={(value: number | undefined) => [formatCurrency(value ?? 0), undefined]} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="labor" stackId="a" fill="#14b8a6" name="Labor" />
                  <Bar dataKey="materials" stackId="a" fill="#06b6d4" name="Materials" />
                  <Bar dataKey="contingency" stackId="a" fill="#f59e0b" name="Contingency" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Reno table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
                    <th className="text-left pb-2 pr-2">Category</th>
                    <th className="text-left pb-2 pr-2">Description</th>
                    <th className="text-right pb-2 pr-2 w-28">Labor</th>
                    <th className="text-right pb-2 pr-2 w-28">Materials</th>
                    <th className="text-right pb-2 pr-2 w-28">Contingency</th>
                    <th className="text-right pb-2 w-28">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {renovation.map(r => (
                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-2 pr-2">
                        <input value={r.category} onChange={e => updateRenoItem(r.id, 'category', e.target.value)} className="bg-transparent text-white text-sm font-medium w-full focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1" />
                      </td>
                      <td className="py-2 pr-2">
                        <input value={r.description} onChange={e => updateRenoItem(r.id, 'description', e.target.value)} className="bg-transparent text-slate-400 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1" />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input type="number" value={r.laborCost} onChange={e => updateRenoItem(r.id, 'laborCost', Number(e.target.value))} className="bg-transparent text-slate-200 text-sm w-24 text-right focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1" />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input type="number" value={r.materialCost} onChange={e => updateRenoItem(r.id, 'materialCost', Number(e.target.value))} className="bg-transparent text-slate-200 text-sm w-24 text-right focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1" />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input type="number" value={r.contingency} onChange={e => updateRenoItem(r.id, 'contingency', Number(e.target.value))} className="bg-transparent text-slate-200 text-sm w-24 text-right focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1" />
                      </td>
                      <td className="py-2 text-right text-teal-400 font-semibold">{formatCurrency(r.laborCost + r.materialCost + r.contingency)}</td>
                      <td className="py-2 pl-2">
                        <button onClick={() => removeRenoItem(r.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Minus className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold text-white border-t-2 border-slate-600">
                    <td colSpan={2} className="py-3">TOTAL</td>
                    <td className="py-3 text-right text-teal-400">{formatCurrency(computed.totalLabor)}</td>
                    <td className="py-3 text-right text-cyan-400">{formatCurrency(computed.totalMaterials)}</td>
                    <td className="py-3 text-right text-amber-400">{formatCurrency(computed.totalContingency)}</td>
                    <td className="py-3 text-right text-teal-400">{formatCurrency(computed.totalRenovation)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button onClick={addRenoItem} className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium mt-2">
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>
        )}
      </div>

      {/* ========== Contractors & Builders ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 mb-4">
        <SectionHeader icon={HardHat} title="Contractors & Builders" subtitle={`${contractors.length} vendors | Est. total: ${formatCurrency(computed.totalContractors)}`} collapsed={contractorCollapsed} onToggle={() => setContractorCollapsed(!contractorCollapsed)} />
        {!contractorCollapsed && (
          <div className="pb-5">
            <div className="grid gap-3">
              {contractors.map(c => (
                <div key={c.id} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Role</label>
                      <input value={c.role} onChange={e => updateContractor(c.id, 'role', e.target.value)} className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Name</label>
                      <input value={c.name} onChange={e => updateContractor(c.id, 'name', e.target.value)} className="w-full bg-transparent text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Rate</label>
                      <input value={c.rate} onChange={e => updateContractor(c.id, 'rate', e.target.value)} className="w-full bg-transparent text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Estimated Cost</label>
                      <input type="number" value={c.estimatedCost} onChange={e => updateContractor(c.id, 'estimatedCost', Number(e.target.value))} className="w-full bg-transparent text-teal-400 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Timeline</label>
                      <input value={c.timeline} onChange={e => updateContractor(c.id, 'timeline', e.target.value)} className="w-full bg-transparent text-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Notes</label>
                      <input value={c.notes} onChange={e => updateContractor(c.id, 'notes', e.target.value)} className="w-full bg-transparent text-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Reference builders from business plan */}
            <div className="mt-4 bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Horizon Peak Pre-Vetted Builders</p>
              <div className="grid grid-cols-2 gap-2">
                {HORIZON_PEAK_BUSINESS_PLAN.builders.map((b, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg p-2">
                    <p className="text-xs font-semibold text-slate-300">{b.name}</p>
                    <p className="text-[10px] text-slate-500">${b.costPerSqft.min}–{b.costPerSqft.max}/sqft | {b.timeline}</p>
                    <p className="text-[10px] text-slate-600">{b.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== Banking & Financing ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 mb-4">
        <SectionHeader icon={Landmark} title="Banking & Financing" subtitle={`${selectedBank.name} | ${selectedBank.loanType} | ${formatPercent(selectedBank.interestRate)} | Down: ${formatCurrency(computed.downPayment)}`} collapsed={bankCollapsed} onToggle={() => setBankCollapsed(!bankCollapsed)} />
        {!bankCollapsed && (
          <div className="pb-5 space-y-4">
            {/* Bank selector */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Select Lender</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {banks.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBankId(b.id)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      selectedBankId === b.id
                        ? 'bg-teal-500/15 border-teal-500/40'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    <p className="text-sm font-semibold text-white">{b.name}</p>
                    <p className="text-[10px] text-slate-500">{b.loanType}</p>
                    <p className="text-xs text-teal-400 font-medium mt-1">{formatPercent(b.interestRate)} | {b.downPaymentPct}% down</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank detail editor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 rounded-lg p-4 border border-slate-700/40">
              <NumberInput label="Interest Rate (%)" value={selectedBank.interestRate} onChange={v => updateBank(selectedBank.id, 'interestRate', v)} suffix="%" step={0.125} />
              <NumberInput label="Down Payment (%)" value={selectedBank.downPaymentPct} onChange={v => updateBank(selectedBank.id, 'downPaymentPct', v)} suffix="%" step={1} />
              <NumberInput label="Origination Fee (%)" value={selectedBank.originationFee} onChange={v => updateBank(selectedBank.id, 'originationFee', v)} suffix="%" step={0.25} />
              <NumberInput label="Closing Costs ($)" value={selectedBank.closingCosts} onChange={v => updateBank(selectedBank.id, 'closingCosts', v)} prefix="$" step={100} />
            </div>

            {/* Computed financing metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard label="Loan Amount" value={formatCurrency(computed.loanAmount)} icon={Banknote} />
              <MetricCard label="Down Payment" value={formatCurrency(computed.downPayment)} icon={DollarSign} color="text-orange-400" />
              <MetricCard label="Monthly Payment" value={formatCurrency(computed.monthlyPayment)} icon={Calendar} color="text-cyan-400" />
              <MetricCard label="Interest (Hold Period)" value={formatCurrency(computed.interestDuringHold)} icon={Percent} color="text-amber-400" />
              <MetricCard label="Total Financing Cost" value={formatCurrency(computed.totalFinancingCosts)} icon={Landmark} color="text-purple-400" />
            </div>

            <p className="text-xs text-slate-600 italic">{selectedBank.notes}</p>
          </div>
        )}
      </div>

      {/* ========== Legal & Title ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 mb-4">
        <SectionHeader icon={Scale} title="Legal, Title & Insurance" subtitle={`Total: ${formatCurrency(computed.totalLegal)} (incl. ${formatCurrency(computed.transferTax)} PA transfer tax)`} collapsed={legalCollapsed} onToggle={() => setLegalCollapsed(!legalCollapsed)} />
        {!legalCollapsed && (
          <div className="pb-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
                    <th className="text-left pb-2 pr-2">Item</th>
                    <th className="text-right pb-2 pr-2 w-32">Est. Cost</th>
                    <th className="text-left pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {legal.map(l => (
                    <tr key={l.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-2 pr-2">
                        <input value={l.item} onChange={e => updateLegal(l.id, 'item', e.target.value)} className="bg-transparent text-white text-sm w-full focus:outline-none rounded px-1" />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input type="number" value={l.estimatedCost} onChange={e => updateLegal(l.id, 'estimatedCost', Number(e.target.value))} className="bg-transparent text-teal-400 text-sm w-24 text-right focus:outline-none rounded px-1 font-semibold" />
                      </td>
                      <td className="py-2">
                        <input value={l.notes} onChange={e => updateLegal(l.id, 'notes', e.target.value)} className="bg-transparent text-slate-500 text-sm w-full focus:outline-none rounded px-1" />
                      </td>
                    </tr>
                  ))}
                  {/* PA Transfer Tax row */}
                  <tr className="border-b border-slate-700/50 bg-slate-700/10">
                    <td className="py-2 pr-2 text-slate-300 text-sm font-medium px-1">PA Transfer Tax (2%)</td>
                    <td className="py-2 pr-2 text-right text-amber-400 text-sm font-semibold">{formatCurrency(computed.transferTax)}</td>
                    <td className="py-2 text-slate-500 text-sm px-1">Auto-calculated: 2% of purchase price, typically split buyer/seller</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-bold text-white border-t-2 border-slate-600">
                    <td className="py-3 px-1">TOTAL</td>
                    <td className="py-3 text-right text-teal-400">{formatCurrency(computed.totalLegal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========== Realtor Agents ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 mb-4">
        <SectionHeader icon={Users} title="Realtor Agents & Commissions" subtitle={`Buy-side: ${formatCurrency(computed.totalAgentBuy)} | Sell-side: ${formatCurrency(computed.totalAgentSell)}`} collapsed={agentCollapsed} onToggle={() => setAgentCollapsed(!agentCollapsed)} />
        {!agentCollapsed && (
          <div className="pb-5">
            <div className="grid gap-3">
              {agents.map(a => (
                <div key={a.id} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Role</label>
                      <p className="text-sm font-semibold text-white mt-0.5">{a.role}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Agent Name</label>
                      <input value={a.name} onChange={e => updateAgent(a.id, 'name', e.target.value)} className="w-full bg-transparent text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Commission %</label>
                      <input type="number" value={a.commissionPct} step={0.25} onChange={e => {
                        const pct = Number(e.target.value)
                        const base = a.role === 'Buyer Agent' ? purchasePrice : afterRepairValue
                        updateAgent(a.id, 'commissionPct', pct)
                        updateAgent(a.id, 'estimatedCost', Math.round(base * (pct / 100)))
                      }} className="w-full bg-transparent text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Estimated Cost</label>
                      <p className="text-sm font-semibold text-teal-400 mt-0.5">{formatCurrency(a.estimatedCost)}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Notes</label>
                      <input value={a.notes} onChange={e => updateAgent(a.id, 'notes', e.target.value)} className="w-full bg-transparent text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/30 rounded px-1 mt-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== Charts Row ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Cost Breakdown Pie */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-400" />
            Total Cost Breakdown
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {costBreakdownData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => [formatCurrency(value ?? 0), undefined]} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash Flow Projection */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Cumulative Cash Flow Projection
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowProjection}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Cumulative']} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="cumulative" stroke="#14b8a6" fill="url(#cashGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========== Project Timeline ========== */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          Projected Timeline
        </h3>
        <div className="space-y-2">
          {(() => {
            let cumulativeWeeks = 0
            const totalWeeks = timelineData.reduce((s, p) => s + p.durationWeeks, 0)
            return timelineData.map((phase, idx) => {
              const startPct = (cumulativeWeeks / totalWeeks) * 100
              const widthPct = (phase.durationWeeks / totalWeeks) * 100
              cumulativeWeeks += phase.durationWeeks
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-48 text-xs text-slate-300 font-medium truncate shrink-0">{phase.phase}</div>
                  <div className="flex-1 h-7 bg-slate-900/60 rounded-lg overflow-hidden relative">
                    <div
                      className="absolute h-full rounded-lg flex items-center justify-end pr-2"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] + '60',
                        borderLeft: `3px solid ${PIE_COLORS[idx % PIE_COLORS.length]}`,
                      }}
                    >
                      <span className="text-[10px] text-white font-medium whitespace-nowrap">{phase.durationWeeks}w</span>
                    </div>
                  </div>
                  <div className="w-24 text-xs text-slate-500 text-right shrink-0">{formatCurrency(phase.cost)}</div>
                </div>
              )
            })
          })()}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
            <div className="w-48 text-xs text-white font-bold">Total Duration</div>
            <div className="flex-1 text-xs text-teal-400 font-bold">{timelineData.reduce((s, p) => s + p.durationWeeks, 0)} weeks ({Math.round(timelineData.reduce((s, p) => s + p.durationWeeks, 0) / 4.33)} months)</div>
            <div className="w-24 text-xs text-teal-400 text-right font-bold">{formatCurrency(timelineData.reduce((s, p) => s + p.cost, 0))}</div>
          </div>
        </div>
      </div>

      {/* ========== Final Summary / P&L ========== */}
      <div className={cn('border rounded-xl p-6', verdict.bg)}>
        <div className="flex items-center gap-3 mb-4">
          {computed.grossProfit >= 0 ? <CheckCircle2 className={cn('w-6 h-6', verdict.color)} /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
          <h3 className="text-lg font-bold text-white">Investment Summary — {verdict.label}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase">Acquisition</p>
            <p className="text-lg font-bold text-white">{formatCurrency(purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">+ Renovation</p>
            <p className="text-lg font-bold text-amber-400">{formatCurrency(computed.totalRenovation)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">+ Financing</p>
            <p className="text-lg font-bold text-purple-400">{formatCurrency(computed.totalFinancingCosts)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">+ Legal & Agents</p>
            <p className="text-lg font-bold text-cyan-400">{formatCurrency(computed.totalLegal + computed.totalAgents)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">+ Holding Costs</p>
            <p className="text-lg font-bold text-orange-400">{formatCurrency(computed.totalHolding)}</p>
          </div>
          <div className="border-l-2 border-slate-600 pl-4">
            <p className="text-xs text-slate-500 uppercase">= Total Investment</p>
            <p className="text-xl font-black text-white">{formatCurrency(computed.totalInvestment)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Sale / ARV</p>
            <p className="text-xl font-black text-teal-400">{formatCurrency(afterRepairValue)}</p>
          </div>
          <div className="border-l-2 border-slate-600 pl-4">
            <p className="text-xs text-slate-500 uppercase">{(strategy === 'rental' || strategy === 'brrrr') ? 'Annual Cash Flow' : 'Net Profit'}</p>
            <p className={cn('text-xl font-black', computed.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {(strategy === 'rental' || strategy === 'brrrr')
                ? formatCurrency(computed.cashFlowMonthly * 12)
                : formatCurrency(computed.grossProfit)
              }
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-6 text-sm">
          <span className="text-slate-400">ROI: <span className={cn('font-bold', verdict.color)}>{formatPercent(computed.roi)}</span></span>
          <span className="text-slate-400">Annualized: <span className="font-bold text-white">{formatPercent(computed.annualizedROI)}</span></span>
          <span className="text-slate-400">Cash Required: <span className="font-bold text-orange-400">{formatCurrency(computed.cashRequired)}</span></span>
          {(strategy === 'rental' || strategy === 'brrrr') && (
            <>
              <span className="text-slate-400">Cap Rate: <span className="font-bold text-cyan-400">{formatPercent(computed.capRate)}</span></span>
              <span className="text-slate-400">Cash-on-Cash: <span className={cn('font-bold', verdict.color)}>{formatPercent(computed.cashOnCashReturn)}</span></span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
