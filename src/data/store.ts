'use client'
import { createContext, useContext } from 'react'

// ==================== Types ====================
export type PropertyStatus = 'Prospect' | 'Under Contract' | 'Planning' | 'Permitting' | 'Construction' | 'Finishing' | 'Listed' | 'Sold' | 'Rental'

export interface Property {
  id: string
  address: string
  city: string
  county: string
  state: string
  zip: string
  lotSize: number
  landValue: number
  purchaseDate: string
  status: PropertyStatus
  plannedSqft: number
  plannedBeds: number
  plannedBaths: number
  estimatedBuildCost: number
  estimatedSalePrice: number
  actualBuildCost?: number
  actualSalePrice?: number
  builder?: string
  bank?: string
  agent?: string
  notes?: string
  milestones?: Milestone[]
  vendors?: Vendor[]
  expenses?: Expense[]
}

export interface Milestone {
  id: string
  propertyId: string
  name: string
  phase: string
  startDate: string
  dueDate: string
  completedDate?: string
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed'
  drawPercent: number
  drawAmount: number
  notes?: string
}

export interface Vendor {
  id: string
  name: string
  trade: string
  phone: string
  email: string
  rate?: string
  rating: number
  licensed: boolean
  insured: boolean
  notes?: string
}

export interface Expense {
  id: string
  propertyId: string
  date: string
  category: string
  description: string
  amount: number
  vendor?: string
  receipt?: boolean
}

export interface Deal {
  id: string
  source: string
  address: string
  city: string
  state: string
  zip: string
  listPrice: number
  beds: number
  baths: number
  sqft: number
  lotSize: number
  yearBuilt: number
  daysOnMarket: number
  pricePerSqft: number
  estimatedARV?: number
  estimatedRehab?: number
  cashFlow?: number
  capRate?: number
  roi?: number
  score: number
  url: string
  notes?: string
  saved: boolean
}

export interface KPI {
  label: string
  value: string
  change?: number
  target?: string
  icon?: string
}

export interface Goal {
  id: string
  name: string
  target: number
  current: number
  unit: string
  deadline: string
  category: string
}

// ==================== Sample Data ====================
export const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'clca-lot-4204',
    address: 'Lot 4204, Conashaugh Lakes',
    city: 'Dingman Township',
    county: 'Pike County',
    state: 'PA',
    zip: '18328',
    lotSize: 0.5,
    landValue: 50000,
    purchaseDate: '2025-06-01',
    status: 'Planning',
    plannedSqft: 2000,
    plannedBeds: 3,
    plannedBaths: 2,
    estimatedBuildCost: 320000,
    estimatedSalePrice: 500000,
    builder: 'Kintner Modular Homes',
    bank: 'The Dime Bank',
    milestones: [
      { id: 'm1', propertyId: 'clca-lot-4204', name: 'Architectural Review', phase: 'Pre-Construction', startDate: '2026-03-01', dueDate: '2026-03-15', status: 'In Progress', drawPercent: 0, drawAmount: 0 },
      { id: 'm2', propertyId: 'clca-lot-4204', name: 'Permit & Site Prep', phase: 'Site Work', startDate: '2026-03-15', dueDate: '2026-04-15', status: 'Not Started', drawPercent: 10, drawAmount: 32000 },
      { id: 'm3', propertyId: 'clca-lot-4204', name: 'Foundation & Utilities', phase: 'Foundation', startDate: '2026-04-15', dueDate: '2026-05-30', status: 'Not Started', drawPercent: 20, drawAmount: 64000 },
      { id: 'm4', propertyId: 'clca-lot-4204', name: 'Modular Delivery & Set', phase: 'Construction', startDate: '2026-06-01', dueDate: '2026-06-30', status: 'Not Started', drawPercent: 25, drawAmount: 80000 },
      { id: 'm5', propertyId: 'clca-lot-4204', name: 'Connections & Mechanical', phase: 'Construction', startDate: '2026-07-01', dueDate: '2026-07-31', status: 'Not Started', drawPercent: 15, drawAmount: 48000 },
      { id: 'm6', propertyId: 'clca-lot-4204', name: 'Finishes & Landscaping', phase: 'Finishing', startDate: '2026-08-01', dueDate: '2026-08-31', status: 'Not Started', drawPercent: 20, drawAmount: 64000 },
      { id: 'm7', propertyId: 'clca-lot-4204', name: 'Final Inspection & CO', phase: 'Closeout', startDate: '2026-09-01', dueDate: '2026-09-15', status: 'Not Started', drawPercent: 10, drawAmount: 32000 },
    ],
    vendors: [
      { id: 'v1', name: 'Kintner Modular Homes', trade: 'General Contractor / Builder', phone: '(570) 992-3155', email: 'info@kintnermodular.com', rating: 5, licensed: true, insured: true },
      { id: 'v2', name: 'Pike County Excavating', trade: 'Excavation & Site Work', phone: '(570) 296-7100', email: '', rating: 4, licensed: true, insured: true },
      { id: 'v3', name: 'Dingman Township Permits', trade: 'Permitting', phone: '(570) 828-2312', email: '', rating: 0, licensed: true, insured: true },
    ],
  },
]

export const SAMPLE_DEALS: Deal[] = [
  {
    id: 'd1', source: 'Redfin', address: '142 Lakeview Dr', city: 'Milford', state: 'PA', zip: '18337',
    listPrice: 45000, beds: 0, baths: 0, sqft: 0, lotSize: 0.75, yearBuilt: 0, daysOnMarket: 120,
    pricePerSqft: 0, estimatedARV: 400000, estimatedRehab: 280000, score: 78, url: '#', saved: true, notes: 'Vacant lot - good for new build'
  },
  {
    id: 'd2', source: 'Zillow', address: '88 Mountain Rd', city: 'Bushkill', state: 'PA', zip: '18324',
    listPrice: 159000, beds: 3, baths: 1, sqft: 1400, lotSize: 0.4, yearBuilt: 1985, daysOnMarket: 65,
    pricePerSqft: 114, estimatedARV: 280000, estimatedRehab: 60000, capRate: 7.2, score: 82, url: '#', saved: false, notes: 'Needs kitchen/bath rehab'
  },
  {
    id: 'd3', source: 'Realtor.com', address: '201 Pocono Blvd', city: 'East Stroudsburg', state: 'PA', zip: '18301',
    listPrice: 225000, beds: 4, baths: 2, sqft: 2100, lotSize: 0.3, yearBuilt: 2001, daysOnMarket: 14,
    pricePerSqft: 107, estimatedARV: 350000, estimatedRehab: 35000, capRate: 6.8, cashFlow: 450, score: 71, url: '#', saved: false
  },
  {
    id: 'd4', source: 'Redfin', address: 'Lot 12 Silver Lake Rd', city: 'Dingmans Ferry', state: 'PA', zip: '18328',
    listPrice: 35000, beds: 0, baths: 0, sqft: 0, lotSize: 0.6, yearBuilt: 0, daysOnMarket: 200,
    pricePerSqft: 0, estimatedARV: 450000, estimatedRehab: 310000, score: 85, url: '#', saved: true, notes: 'CLCA community, similar to our lot'
  },
]

export const SAMPLE_GOALS: Goal[] = [
  { id: 'g1', name: 'Properties Acquired', target: 2, current: 1, unit: 'properties', deadline: '2026-12-31', category: 'Acquisition' },
  { id: 'g2', name: 'Revenue Generated', target: 800000, current: 0, unit: 'USD', deadline: '2026-12-31', category: 'Revenue' },
  { id: 'g3', name: 'Net Profit', target: 200000, current: 0, unit: 'USD', deadline: '2026-12-31', category: 'Profit' },
  { id: 'g4', name: 'Build Pipeline', target: 4, current: 1, unit: 'properties', deadline: '2027-06-30', category: 'Pipeline' },
  { id: 'g5', name: 'Vendor Network', target: 20, current: 3, unit: 'vendors', deadline: '2026-12-31', category: 'Operations' },
]

// Context for global state
export const AppContext = createContext<{
  properties: Property[]
  deals: Deal[]
  goals: Goal[]
  setProperties: (p: Property[]) => void
  setDeals: (d: Deal[]) => void
  setGoals: (g: Goal[]) => void
  openDealInCalculator?: (deal: Deal, tab?: string) => void
} | null>(null)

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
