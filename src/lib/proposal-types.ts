import type { Deal } from '../data/store'

// =============================================================================
// Strategy
// =============================================================================

export type StrategyType = 'flip' | 'rental' | 'build-to-sell' | 'brrrr'

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  'flip': 'Fix & Flip',
  'rental': 'Buy & Hold Rental',
  'build-to-sell': 'Build-to-Sell (New Construction)',
  'brrrr': 'BRRRR (Buy, Rehab, Rent, Refinance, Repeat)',
}

// =============================================================================
// Mirrors DealAnalyzer internal types (re-exported for proposal use)
// =============================================================================

export interface RenovationLineItem {
  id: string
  category: string
  description: string
  laborCost: number
  materialCost: number
  contingency: number
}

export interface ContractorEntry {
  id: string
  role: string
  name: string
  rate: string
  estimatedCost: number
  timeline: string
  notes: string
}

export interface BankOption {
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

export interface LegalCost {
  id: string
  item: string
  estimatedCost: number
  notes: string
}

export interface AgentEntry {
  id: string
  role: 'Buyer Agent' | 'Seller Agent' | 'Dual Agent'
  name: string
  commissionPct: number
  estimatedCost: number
  notes: string
}

export interface ProjectTimeline {
  phase: string
  durationWeeks: number
  cost: number
}

export interface PropertyBuildConfig {
  homeType: string
  sqft: number
  bedrooms: number
  bathrooms: number
  garage: string
  qualityLevel: string
  amenities: string[]
  customAmenities: { id: string; label: string; cost: number; arv: number }[]
}

export interface BuildValues {
  totalBuildCost: number
  estimatedARV: number
  holdingMonths: number
  monthlyHoldingCost: number
}

// =============================================================================
// Computed financials (mirrors DealAnalyzer useMemo output)
// =============================================================================

export interface ComputedFinancials {
  totalLabor: number
  totalMaterials: number
  totalContingency: number
  totalRenovation: number
  totalContractors: number
  totalLegal: number
  transferTax: number
  totalAgentBuy: number
  totalAgentSell: number
  totalAgents: number
  downPayment: number
  loanAmount: number
  originationFeeAmt: number
  monthlyPayment: number
  interestDuringHold: number
  totalFinancingCosts: number
  totalHolding: number
  totalInvestment: number
  cashRequired: number
  grossProfit: number
  roi: number
  annualizedROI: number
  annualRent: number
  netOperatingIncome: number
  cashFlowMonthly: number
  capRate: number
  cashOnCashReturn: number
}

export interface VerdictInfo {
  grade: string
  label: string
}

// =============================================================================
// Master data object: DealAnalyzer → ProposalGeneratorModal
// =============================================================================

export interface ProposalData {
  deal: Deal
  strategy: StrategyType
  purchasePrice: number
  afterRepairValue: number
  holdingMonths: number
  monthlyHoldingCost: number
  monthlyRentalIncome: number
  buildConfig: PropertyBuildConfig | null
  buildValues: BuildValues | null
  renovation: RenovationLineItem[]
  contractors: ContractorEntry[]
  selectedBank: BankOption
  allBanks: BankOption[]
  legal: LegalCost[]
  agents: AgentEntry[]
  computed: ComputedFinancials
  verdict: VerdictInfo
  timeline: ProjectTimeline[]
}

// =============================================================================
// User-customizable proposal options
// =============================================================================

export interface ProposalSection {
  id: string
  label: string
  description: string
  enabled: boolean
  strategyOnly?: StrategyType[]
}

export interface ProposalOptions {
  title: string
  recipientName: string
  recipientCompany: string
  executiveNotes: string
  sections: ProposalSection[]
}

// =============================================================================
// Default section list factory
// =============================================================================

export function getDefaultSections(strategy: StrategyType): ProposalSection[] {
  const budgetLabel = strategy === 'build-to-sell' ? 'Construction Budget' : 'Renovation Budget'

  return [
    { id: 'executive-summary', label: 'Executive Summary', description: 'Investment grade, key metrics, and thesis', enabled: true },
    { id: 'property-details', label: 'Property Details & Market Context', description: 'Location, specs, and market positioning', enabled: true },
    { id: 'investment-strategy', label: 'Investment Strategy', description: 'Strategy rationale and exit plan', enabled: true },
    { id: 'build-config', label: 'Build Configuration & Specifications', description: 'Home type, sqft, amenities, quality level', enabled: strategy === 'build-to-sell', strategyOnly: ['build-to-sell'] },
    { id: 'renovation-budget', label: budgetLabel, description: 'Line-item cost breakdown with labor, materials, contingency', enabled: true },
    { id: 'timeline', label: 'Project Timeline & Milestones', description: 'Phased schedule with durations and costs', enabled: true },
    { id: 'financial-analysis', label: 'Full Financial Analysis', description: 'Complete P&L, cost structure, and return metrics', enabled: true },
    { id: 'financing-structure', label: 'Financing Structure', description: 'Lender details, loan terms, and draw schedule', enabled: true },
    { id: 'community-requirements', label: 'Community & Regulatory Requirements', description: 'Building codes, deed restrictions, HOA, permits', enabled: true },
    { id: 'risk-analysis', label: 'Risk Analysis & Mitigation', description: 'Key risks with severity and mitigation strategies', enabled: true },
    { id: 'growth-projections', label: 'Growth Projections', description: 'Horizon Peak Capital 5-year business plan', enabled: true },
    { id: 'call-to-action', label: 'Investment Terms & Next Steps', description: 'Financing requirements and call to action', enabled: true },
  ]
}

export function getDefaultProposalOptions(data: ProposalData): ProposalOptions {
  return {
    title: `Investment Proposal — ${data.deal.address}`,
    recipientName: '',
    recipientCompany: '',
    executiveNotes: '',
    sections: getDefaultSections(data.strategy),
  }
}
