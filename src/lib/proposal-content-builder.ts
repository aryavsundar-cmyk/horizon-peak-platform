import type { ProposalData, ProposalOptions, StrategyType } from './proposal-types'
import { STRATEGY_LABELS } from './proposal-types'
import { CLCA_BUILDING_CODES, HORIZON_PEAK_BUSINESS_PLAN } from '../data/conashaugh-lakes'

// =============================================================================
// Utility helpers
// =============================================================================

function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

function fmtCurrency(n: number): string {
  return `$${fmt(Math.round(n))}`
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

// =============================================================================
// Main entry — builds full proposal markdown from data + options
// =============================================================================

export function buildProposalContent(data: ProposalData, options: ProposalOptions): string {
  const sections: string[] = []
  const enabled = new Set(options.sections.filter(s => s.enabled).map(s => s.id))

  // Title slide is always included
  sections.push(buildTitleSlide(data, options))

  if (enabled.has('executive-summary')) sections.push(buildExecutiveSummary(data, options))
  if (enabled.has('property-details')) sections.push(buildPropertyDetails(data))
  if (enabled.has('investment-strategy')) sections.push(buildInvestmentStrategy(data))
  if (enabled.has('build-config') && data.strategy === 'build-to-sell' && data.buildConfig) {
    sections.push(buildBuildConfiguration(data))
  }
  if (enabled.has('renovation-budget')) sections.push(buildRenovationBudget(data))
  if (enabled.has('timeline')) sections.push(buildTimeline(data))
  if (enabled.has('financial-analysis')) sections.push(buildFinancialAnalysis(data))
  if (enabled.has('financing-structure')) sections.push(buildFinancingStructure(data))
  if (enabled.has('community-requirements')) sections.push(buildCommunityRequirements())
  if (enabled.has('risk-analysis')) sections.push(buildRiskAnalysis(data))
  if (enabled.has('growth-projections')) sections.push(buildGrowthProjections())
  if (enabled.has('call-to-action')) sections.push(buildCallToAction(data, options))

  return sections.join('\n\n---\n\n')
}

/** Returns the count of slides that will be generated */
export function getSlideCount(options: ProposalOptions): number {
  return options.sections.filter(s => s.enabled).length + 1 // +1 for title slide
}

// =============================================================================
// Section Builders
// =============================================================================

function buildTitleSlide(data: ProposalData, options: ProposalOptions): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const lines = [
    `# ${options.title}`,
    '',
    `**Prepared by:** Horizon Peak Capital LLC`,
  ]
  if (options.recipientName) {
    lines.push(`**Prepared for:** ${options.recipientName}${options.recipientCompany ? `, ${options.recipientCompany}` : ''}`)
  }
  lines.push(
    `**Date:** ${date}`,
    `**Strategy:** ${STRATEGY_LABELS[data.strategy]}`,
    `**Property:** ${data.deal.address}, ${data.deal.city}, ${data.deal.state} ${data.deal.zip}`,
  )
  return lines.join('\n')
}

// ---------------------------------------------------------------------------

function buildExecutiveSummary(data: ProposalData, options: ProposalOptions): string {
  const { computed, verdict } = data
  const isFlipLike = data.strategy === 'flip' || data.strategy === 'build-to-sell'

  let md = `## Executive Summary\n\n`
  md += `**Investment Grade: ${verdict.grade} — ${verdict.label}**\n\n`
  md += `Horizon Peak Capital LLC presents this ${STRATEGY_LABELS[data.strategy]} opportunity located at ${data.deal.address}, ${data.deal.city}, ${data.deal.state} ${data.deal.zip}.\n\n`

  md += `| Metric | Value |\n|--------|-------|\n`
  md += `| Purchase Price | ${fmtCurrency(data.purchasePrice)} |\n`
  md += `| Total Investment | ${fmtCurrency(computed.totalInvestment)} |\n`
  md += `| ${isFlipLike ? 'After-Repair / After-Built Value' : 'Property Value (ARV)'} | ${fmtCurrency(data.afterRepairValue)} |\n`
  md += `| Cash Required (Out-of-Pocket) | ${fmtCurrency(computed.cashRequired)} |\n`

  if (isFlipLike) {
    md += `| Net Profit | ${fmtCurrency(computed.grossProfit)} |\n`
    md += `| Return on Investment (ROI) | ${fmtPct(computed.roi)} |\n`
    md += `| Annualized ROI | ${fmtPct(computed.annualizedROI)} |\n`
    md += `| Holding Period | ${data.holdingMonths} months |\n`
  } else {
    md += `| Monthly Cash Flow | ${fmtCurrency(computed.cashFlowMonthly)} |\n`
    md += `| Annual Cash Flow | ${fmtCurrency(computed.cashFlowMonthly * 12)} |\n`
    md += `| Cap Rate | ${fmtPct(computed.capRate)} |\n`
    md += `| Cash-on-Cash Return | ${fmtPct(computed.cashOnCashReturn)} |\n`
  }

  if (options.executiveNotes) {
    md += `\n**Additional Notes:** ${options.executiveNotes}`
  }

  return md
}

// ---------------------------------------------------------------------------

function buildPropertyDetails(data: ProposalData): string {
  const d = data.deal
  const isLand = d.sqft === 0 && d.beds === 0

  let md = `## Property Details & Market Context\n\n`
  md += `### Location\n`
  md += `- **Address:** ${d.address}, ${d.city}, ${d.state} ${d.zip}\n`
  md += `- **Market:** Pike County / Pocono Region, Pennsylvania\n`
  md += `- **Source:** ${d.source}\n\n`

  md += `### Property Specifications\n`
  md += `| Spec | Value |\n|------|-------|\n`
  md += `| Lot Size | ${d.lotSize} acres |\n`

  if (isLand) {
    md += `| Property Type | Vacant Land |\n`
    md += `| Zoning | Residential — Single Family |\n`
  } else {
    md += `| Bedrooms | ${d.beds} |\n`
    md += `| Bathrooms | ${d.baths} |\n`
    md += `| Living Area | ${fmt(d.sqft)} sqft |\n`
    md += `| Year Built | ${d.yearBuilt} |\n`
    md += `| Price per Sqft | ${fmtCurrency(d.pricePerSqft)} |\n`
  }

  md += `| List Price | ${fmtCurrency(d.listPrice)} |\n`
  md += `| Days on Market | ${d.daysOnMarket} |\n`

  if (d.estimatedARV) {
    md += `| Estimated ARV | ${fmtCurrency(d.estimatedARV)} |\n`
  }

  md += `\n### Market Context\n`
  md += `The Pike County / Pocono region sits approximately 80 miles from New York City, offering significant value compared to metro pricing. `
  md += `Regional comparable sales range from $${HORIZON_PEAK_BUSINESS_PLAN.saleComps.conservativePerSqft} to $${HORIZON_PEAK_BUSINESS_PLAN.saleComps.bestCasePerSqft} per square foot. `
  md += `The area benefits from growing demand for affordable single-family housing, remote worker migration, and seasonal tourism.`

  if (d.notes) {
    md += `\n\n**Notes:** ${d.notes}`
  }

  return md
}

// ---------------------------------------------------------------------------

function buildInvestmentStrategy(data: ProposalData): string {
  let md = `## Investment Strategy: ${STRATEGY_LABELS[data.strategy]}\n\n`

  switch (data.strategy) {
    case 'flip':
      md += `### Fix & Flip Strategy\n\n`
      md += `This project targets a **quick-turn renovation and resale** within ${data.holdingMonths} months.\n\n`
      md += `**Approach:**\n`
      md += `1. Acquire the property at ${fmtCurrency(data.purchasePrice)} (below market value)\n`
      md += `2. Execute targeted renovations totaling ${fmtCurrency(data.computed.totalRenovation)}\n`
      md += `3. List and sell at the projected after-repair value of ${fmtCurrency(data.afterRepairValue)}\n\n`
      md += `**Exit Strategy:** Direct sale through licensed agent. Target holding period of ${data.holdingMonths} months.\n\n`
      md += `**Projected Return:** ${fmtCurrency(data.computed.grossProfit)} net profit (${fmtPct(data.computed.roi)} ROI)`
      break

    case 'rental':
      md += `### Buy & Hold Rental Strategy\n\n`
      md += `This project targets **long-term rental income** with property appreciation.\n\n`
      md += `**Approach:**\n`
      md += `1. Acquire at ${fmtCurrency(data.purchasePrice)}\n`
      md += `2. Complete renovations of ${fmtCurrency(data.computed.totalRenovation)} to maximize rental value\n`
      md += `3. Lease at projected ${fmtCurrency(data.monthlyRentalIncome)}/month\n\n`
      md += `**Exit Strategy:** Long-term hold for cash flow and appreciation. Optional sale after 5+ years.\n\n`
      md += `**Projected Returns:**\n`
      md += `- Monthly Cash Flow: ${fmtCurrency(data.computed.cashFlowMonthly)}\n`
      md += `- Annual Cash Flow: ${fmtCurrency(data.computed.cashFlowMonthly * 12)}\n`
      md += `- Cap Rate: ${fmtPct(data.computed.capRate)}\n`
      md += `- Cash-on-Cash Return: ${fmtPct(data.computed.cashOnCashReturn)}`
      break

    case 'build-to-sell':
      md += `### Build-to-Sell Strategy (New Construction)\n\n`
      md += `This project involves **building a new modular home on vacant land** for resale.\n\n`
      md += `**Approach:**\n`
      md += `1. Secure the lot at ${fmtCurrency(data.purchasePrice)}\n`
      md += `2. Construct a new home with total build cost of ${fmtCurrency(data.computed.totalRenovation)}\n`
      md += `3. Sell the completed property at the projected after-built value of ${fmtCurrency(data.afterRepairValue)}\n\n`
      md += `**Advantages of Modular Construction:**\n`
      md += `- Factory-built quality with reduced weather and labor risks\n`
      md += `- Faster timeline (${data.holdingMonths} months vs. 12-18 for stick-built)\n`
      md += `- Cost-effective at $${HORIZON_PEAK_BUSINESS_PLAN.costEstimates.modularHome.min.toLocaleString()}-$${HORIZON_PEAK_BUSINESS_PLAN.costEstimates.modularHome.max.toLocaleString()} for the home unit\n\n`
      md += `**Exit Strategy:** Direct sale upon completion. Target: ${fmtCurrency(data.afterRepairValue)}.\n\n`
      md += `**Projected Return:** ${fmtCurrency(data.computed.grossProfit)} net profit (${fmtPct(data.computed.roi)} ROI)`
      break

    case 'brrrr':
      md += `### BRRRR Strategy\n\n`
      md += `This project follows the **Buy, Rehab, Rent, Refinance, Repeat** cycle.\n\n`
      md += `**Five-Step Process:**\n`
      md += `1. **Buy:** Acquire at ${fmtCurrency(data.purchasePrice)} (below market)\n`
      md += `2. **Rehab:** Invest ${fmtCurrency(data.computed.totalRenovation)} in value-add renovations\n`
      md += `3. **Rent:** Lease at ${fmtCurrency(data.monthlyRentalIncome)}/month\n`
      md += `4. **Refinance:** Cash-out refi at 75% of ARV (${fmtCurrency(data.afterRepairValue * 0.75)})\n`
      md += `5. **Repeat:** Recycle recovered capital into the next property\n\n`
      md += `**Exit Strategy:** Hold long-term for cash flow with option to sell after appreciation.\n\n`
      md += `**Projected Returns:**\n`
      md += `- Monthly Cash Flow: ${fmtCurrency(data.computed.cashFlowMonthly)}\n`
      md += `- Cash-on-Cash Return: ${fmtPct(data.computed.cashOnCashReturn)}\n`
      md += `- Equity Captured at Refi: ${fmtCurrency(data.afterRepairValue - data.computed.totalInvestment)}`
      break
  }

  return md
}

// ---------------------------------------------------------------------------

function buildBuildConfiguration(data: ProposalData): string {
  const bc = data.buildConfig!
  const bv = data.buildValues!

  let md = `## Build Configuration & Specifications\n\n`

  md += `### Home Design\n`
  md += `| Specification | Selection |\n|---------------|----------|\n`
  md += `| Home Type | ${bc.homeType.charAt(0).toUpperCase() + bc.homeType.slice(1).replace('-', ' ')} |\n`
  md += `| Living Area | ${fmt(bc.sqft)} sqft |\n`
  md += `| Bedrooms | ${bc.bedrooms} |\n`
  md += `| Bathrooms | ${bc.bathrooms} |\n`
  md += `| Garage | ${bc.garage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} |\n`
  md += `| Quality Level | ${bc.qualityLevel.charAt(0).toUpperCase() + bc.qualityLevel.slice(1)} |\n`

  if (bc.amenities.length > 0 || bc.customAmenities.length > 0) {
    md += `\n### Included Amenities & Upgrades\n`
    if (bc.amenities.length > 0) {
      bc.amenities.forEach(a => {
        md += `- ${a.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n`
      })
    }
    if (bc.customAmenities.length > 0) {
      md += `\n**Custom Additions:**\n`
      bc.customAmenities.forEach(ca => {
        if (ca.label) {
          md += `- ${ca.label}: ${fmtCurrency(ca.cost)} cost / ${fmtCurrency(ca.arv)} added value\n`
        }
      })
    }
  }

  md += `\n### Build Value Summary\n`
  md += `| Metric | Value |\n|--------|-------|\n`
  md += `| Total Build Cost | ${fmtCurrency(bv.totalBuildCost)} |\n`
  md += `| Estimated After-Built Value | ${fmtCurrency(bv.estimatedARV)} |\n`
  md += `| Estimated Holding Period | ${bv.holdingMonths} months |\n`
  md += `| Monthly Holding Cost | ${fmtCurrency(bv.monthlyHoldingCost)} |\n`

  return md
}

// ---------------------------------------------------------------------------

function buildRenovationBudget(data: ProposalData): string {
  const isConstruction = data.strategy === 'build-to-sell'
  const title = isConstruction ? 'Construction Budget' : 'Renovation Budget'

  let md = `## ${title}\n\n`
  md += `| Category | Labor | Materials | Contingency | Total |\n`
  md += `|----------|-------|-----------|-------------|-------|\n`

  data.renovation.forEach(r => {
    const total = r.laborCost + r.materialCost + r.contingency
    md += `| ${r.category} | ${fmtCurrency(r.laborCost)} | ${fmtCurrency(r.materialCost)} | ${fmtCurrency(r.contingency)} | ${fmtCurrency(total)} |\n`
  })

  const { totalLabor, totalMaterials, totalContingency, totalRenovation } = data.computed
  md += `| **Totals** | **${fmtCurrency(totalLabor)}** | **${fmtCurrency(totalMaterials)}** | **${fmtCurrency(totalContingency)}** | **${fmtCurrency(totalRenovation)}** |\n`

  const contingencyPct = totalRenovation > 0 ? ((totalContingency / (totalLabor + totalMaterials)) * 100).toFixed(1) : '0'
  md += `\n*Contingency reserve: ${contingencyPct}% of base costs*`

  if (data.contractors.length > 0) {
    md += `\n\n### Key Contractors\n`
    md += `| Role | Name | Estimated Cost | Timeline |\n`
    md += `|------|------|----------------|----------|\n`
    data.contractors.forEach(c => {
      md += `| ${c.role} | ${c.name || 'TBD'} | ${fmtCurrency(c.estimatedCost)} | ${c.timeline || 'TBD'} |\n`
    })
  }

  return md
}

// ---------------------------------------------------------------------------

function buildTimeline(data: ProposalData): string {
  let md = `## Project Timeline & Milestones\n\n`

  const totalWeeks = data.timeline.reduce((s, p) => s + p.durationWeeks, 0)
  const totalMonths = Math.round(totalWeeks / 4.33)

  md += `**Total Duration:** ${totalWeeks} weeks (~${totalMonths} months)\n\n`
  md += `| Phase | Duration | Cost | Cumulative |\n`
  md += `|-------|----------|------|------------|\n`

  let cumulative = 0
  data.timeline.forEach(p => {
    cumulative += p.cost
    md += `| ${p.phase} | ${p.durationWeeks} weeks | ${fmtCurrency(p.cost)} | ${fmtCurrency(cumulative)} |\n`
  })

  md += `| **Total** | **${totalWeeks} weeks** | **${fmtCurrency(data.timeline.reduce((s, p) => s + p.cost, 0))}** | |\n`

  return md
}

// ---------------------------------------------------------------------------

function buildFinancialAnalysis(data: ProposalData): string {
  const c = data.computed
  const isFlipLike = data.strategy === 'flip' || data.strategy === 'build-to-sell'

  let md = `## Full Financial Analysis\n\n`

  // Cost structure
  md += `### Cost Structure\n`
  md += `| Category | Amount | % of Total |\n`
  md += `|----------|--------|------------|\n`
  const costs = [
    { label: 'Acquisition / Purchase', amount: data.purchasePrice },
    { label: data.strategy === 'build-to-sell' ? 'Construction' : 'Renovation', amount: c.totalRenovation },
    { label: 'Financing Costs', amount: c.totalFinancingCosts },
    { label: 'Legal & Title', amount: c.totalLegal },
    { label: 'Agent Commissions', amount: c.totalAgents },
    { label: `Holding Costs (${data.holdingMonths} mo)`, amount: c.totalHolding },
  ]
  costs.forEach(item => {
    const pct = c.totalInvestment > 0 ? ((item.amount / c.totalInvestment) * 100).toFixed(1) : '0'
    md += `| ${item.label} | ${fmtCurrency(item.amount)} | ${pct}% |\n`
  })
  md += `| **Total Investment** | **${fmtCurrency(c.totalInvestment)}** | **100%** |\n`

  // Financing details
  md += `\n### Financing Details\n`
  md += `| Metric | Value |\n|--------|-------|\n`
  md += `| Down Payment | ${fmtCurrency(c.downPayment)} |\n`
  md += `| Loan Amount | ${fmtCurrency(c.loanAmount)} |\n`
  md += `| Origination Fee | ${fmtCurrency(c.originationFeeAmt)} |\n`
  md += `| Monthly Payment | ${fmtCurrency(c.monthlyPayment)} |\n`
  md += `| Interest During Hold | ${fmtCurrency(c.interestDuringHold)} |\n`
  md += `| Total Financing Cost | ${fmtCurrency(c.totalFinancingCosts)} |\n`

  // Returns
  md += `\n### Return Metrics\n`
  md += `| Metric | Value |\n|--------|-------|\n`

  if (isFlipLike) {
    md += `| Sale Price (ARV) | ${fmtCurrency(data.afterRepairValue)} |\n`
    md += `| Total Investment | ${fmtCurrency(c.totalInvestment)} |\n`
    md += `| Seller Agent Fees | ${fmtCurrency(c.totalAgentSell)} |\n`
    md += `| **Net Profit** | **${fmtCurrency(c.grossProfit)}** |\n`
    md += `| ROI | ${fmtPct(c.roi)} |\n`
    md += `| Annualized ROI | ${fmtPct(c.annualizedROI)} |\n`
    md += `| Cash Required | ${fmtCurrency(c.cashRequired)} |\n`
  } else {
    md += `| Monthly Rental Income | ${fmtCurrency(data.monthlyRentalIncome)} |\n`
    md += `| Monthly Expenses | ${fmtCurrency(data.monthlyHoldingCost + c.monthlyPayment)} |\n`
    md += `| Monthly Cash Flow | ${fmtCurrency(c.cashFlowMonthly)} |\n`
    md += `| Annual Cash Flow | ${fmtCurrency(c.cashFlowMonthly * 12)} |\n`
    md += `| Net Operating Income | ${fmtCurrency(c.netOperatingIncome)} |\n`
    md += `| Cap Rate | ${fmtPct(c.capRate)} |\n`
    md += `| Cash-on-Cash Return | ${fmtPct(c.cashOnCashReturn)} |\n`
    md += `| Cash Required | ${fmtCurrency(c.cashRequired)} |\n`
  }

  return md
}

// ---------------------------------------------------------------------------

function buildFinancingStructure(data: ProposalData): string {
  const bank = data.selectedBank

  let md = `## Financing Structure\n\n`
  md += `### Selected Lender\n`
  md += `| Detail | Value |\n|--------|-------|\n`
  md += `| Lender | ${bank.name} |\n`
  md += `| Loan Type | ${bank.loanType} |\n`
  md += `| Interest Rate | ${bank.interestRate}% |\n`
  md += `| Down Payment | ${bank.downPaymentPct}% (${fmtCurrency(data.computed.downPayment)}) |\n`
  md += `| Loan Amount | ${fmtCurrency(data.computed.loanAmount)} |\n`
  md += `| Origination Fee | ${bank.originationFee}% (${fmtCurrency(data.computed.originationFeeAmt)}) |\n`
  md += `| Closing Costs | ${fmtCurrency(bank.closingCosts)} |\n`
  md += `| Term | ${bank.termMonths} months |\n`
  md += `| Monthly Payment | ${fmtCurrency(data.computed.monthlyPayment)} |\n`

  if (bank.notes) {
    md += `\n*${bank.notes}*\n`
  }

  // Draw schedule for construction
  if (data.strategy === 'build-to-sell') {
    md += `\n### Construction Draw Schedule\n`
    md += `| Phase | Draw % | Amount |\n|-------|--------|--------|\n`
    HORIZON_PEAK_BUSINESS_PLAN.drawSchedule.forEach(draw => {
      const amount = data.computed.loanAmount * draw.percent
      md += `| ${draw.phase} | ${(draw.percent * 100).toFixed(0)}% | ${fmtCurrency(amount)} |\n`
    })
  }

  // Other financing options
  if (data.allBanks.length > 1) {
    md += `\n### Alternative Financing Options\n`
    md += `| Lender | Type | Rate | Down Payment | Notes |\n`
    md += `|--------|------|------|-------------|-------|\n`
    data.allBanks
      .filter(b => b.id !== bank.id)
      .forEach(b => {
        md += `| ${b.name} | ${b.loanType} | ${b.interestRate}% | ${b.downPaymentPct}% | ${b.notes || '—'} |\n`
      })
  }

  return md
}

// ---------------------------------------------------------------------------

function buildCommunityRequirements(): string {
  const codes = CLCA_BUILDING_CODES

  let md = `## Community & Regulatory Requirements\n\n`
  md += `### ${codes.community}\n`
  md += `**Location:** ${codes.township}, ${codes.county}, ${codes.state}\n\n`

  md += `### Building Standards\n`
  md += `| Requirement | Value |\n|-------------|-------|\n`
  md += `| Minimum Square Footage | ${fmt(codes.minSquareFootage)} sqft |\n`
  md += `| Max Lot Coverage | ${(codes.maxLotCoverage * 100)}% |\n`
  md += `| Max Height | ${codes.maxHeight} ft |\n`
  md += `| Front Setback | ${codes.setbacks.front} ft |\n`
  md += `| Side Setback | ${codes.setbacks.side} ft |\n`
  md += `| Rear Setback | ${codes.setbacks.rear} ft |\n`
  md += `| Architectural Review | ${codes.requiresArchitecturalReview ? 'Required' : 'Not required'} |\n`
  md += `| Modular Homes | ${codes.modularHomesAllowed ? 'Allowed' : 'Not allowed'} |\n`

  md += `\n### Deed Restrictions\n`
  codes.deedRestrictions.forEach(r => {
    md += `- ${r}\n`
  })

  md += `\n### HOA Details\n`
  md += `- **Annual Dues:** $${fmt(codes.hoaDues.annual)}\n`
  md += `- **Amenities:** ${codes.hoaDues.amenities.join(', ')}\n`

  md += `\n### Permit Fees\n`
  md += `- **CLCA:** $${codes.permitFees.clca.min}–$${codes.permitFees.clca.max}\n`
  md += `- **Township:** $${codes.permitFees.township.min}–$${codes.permitFees.township.max}\n`

  return md
}

// ---------------------------------------------------------------------------

function buildRiskAnalysis(data: ProposalData): string {
  interface Risk {
    risk: string
    severity: 'Low' | 'Medium' | 'High'
    mitigation: string
  }

  const risks: Risk[] = [
    {
      risk: 'Market downturn or price correction',
      severity: 'Medium',
      mitigation: 'Conservative ARV estimates used; multiple exit strategies available',
    },
    {
      risk: 'Interest rate fluctuation',
      severity: 'Medium',
      mitigation: 'Rate lock at closing; fixed-rate options evaluated',
    },
    {
      risk: 'Construction / renovation cost overruns',
      severity: 'Medium',
      mitigation: `${data.computed.totalContingency > 0 ? fmtCurrency(data.computed.totalContingency) : 'Built-in'} contingency reserve (${data.computed.totalRenovation > 0 ? ((data.computed.totalContingency / (data.computed.totalLabor + data.computed.totalMaterials)) * 100).toFixed(0) : 0}% of base costs)`,
    },
  ]

  // Strategy-specific risks
  switch (data.strategy) {
    case 'build-to-sell':
      risks.push(
        { risk: 'Permitting / regulatory delays', severity: 'Low', mitigation: 'Pre-consultation with Dingman Township; CLCA architectural review initiated' },
        { risk: 'Supply chain or delivery delays', severity: 'Low', mitigation: 'Factory-built modular construction reduces exposure to weather and labor shortages' },
        { risk: 'Extended time on market', severity: 'Medium', mitigation: 'Competitive pricing below comps; rental fallback option available' },
      )
      break
    case 'flip':
      risks.push(
        { risk: 'Unexpected structural issues', severity: 'Medium', mitigation: 'Professional inspection prior to closing; contingency reserves' },
        { risk: 'Extended holding period', severity: 'Medium', mitigation: 'Aggressive pricing strategy; pre-marketing during renovation' },
      )
      break
    case 'rental':
      risks.push(
        { risk: 'Vacancy and tenant turnover', severity: 'Medium', mitigation: 'Conservative vacancy factor; quality tenant screening' },
        { risk: 'Maintenance and capital expenditure', severity: 'Low', mitigation: 'New/renovated systems reduce near-term maintenance' },
      )
      break
    case 'brrrr':
      risks.push(
        { risk: 'Refinance appraisal below target', severity: 'Medium', mitigation: 'Conservative ARV estimates; comparable sales documentation' },
        { risk: 'Vacancy during seasoning period', severity: 'Low', mitigation: 'Tenant placement before refinance; short seasoning lenders identified' },
      )
      break
  }

  let md = `## Risk Analysis & Mitigation\n\n`
  md += `| Risk | Severity | Mitigation Strategy |\n`
  md += `|------|----------|--------------------|\n`
  risks.forEach(r => {
    md += `| ${r.risk} | ${r.severity} | ${r.mitigation} |\n`
  })

  return md
}

// ---------------------------------------------------------------------------

function buildGrowthProjections(): string {
  const goals = HORIZON_PEAK_BUSINESS_PLAN.goals

  let md = `## Growth Projections — Horizon Peak Capital\n\n`
  md += `### Business Scaling Plan\n`
  md += `| Year | Units | Revenue | Projected Profit |\n`
  md += `|------|-------|---------|------------------|\n`
  md += `| Year 1 | ${goals.year1.units} | ${fmtCurrency(goals.year1.revenue)} | ${fmtCurrency(goals.year1.profit)} |\n`
  md += `| Year 2 | ${goals.year2.units} | ${fmtCurrency(goals.year2.revenue)} | ${fmtCurrency(goals.year2.profit)} |\n`
  md += `| Year 3 | ${goals.year3.units} | ${fmtCurrency(goals.year3.revenue)} | ${fmtCurrency(goals.year3.profit)} |\n`
  md += `| Year 5 | ${goals.year5.units} | ${fmtCurrency(goals.year5.revenue)} | ${fmtCurrency(goals.year5.profit)} |\n`

  md += `\n### Strategy\n`
  md += `- **Target Market:** ${HORIZON_PEAK_BUSINESS_PLAN.targetMarket}\n`
  md += `- **Core Strategy:** ${HORIZON_PEAK_BUSINESS_PLAN.strategy}\n`
  md += `- **Year 5 Target:** ${goals.year5.units} units, ${fmtCurrency(goals.year5.revenue)} revenue, ${fmtCurrency(goals.year5.profit)} profit\n`

  md += `\nThis property represents a key project in the Year 1 pipeline, establishing the operational model and local market presence for scaled growth.`

  return md
}

// ---------------------------------------------------------------------------

function buildCallToAction(data: ProposalData, options: ProposalOptions): string {
  const c = data.computed

  let md = `## Investment Terms & Next Steps\n\n`

  md += `### Financing Requirements\n`
  md += `| Item | Amount |\n|------|--------|\n`
  md += `| Total Project Cost | ${fmtCurrency(c.totalInvestment)} |\n`
  md += `| Cash Required | ${fmtCurrency(c.cashRequired)} |\n`
  md += `| Loan Amount | ${fmtCurrency(c.loanAmount)} |\n`
  md += `| Down Payment | ${fmtCurrency(c.downPayment)} |\n`

  const isFlipLike = data.strategy === 'flip' || data.strategy === 'build-to-sell'
  if (isFlipLike) {
    md += `| Expected Net Profit | ${fmtCurrency(c.grossProfit)} |\n`
    md += `| Expected ROI | ${fmtPct(c.roi)} |\n`
  } else {
    md += `| Expected Annual Cash Flow | ${fmtCurrency(c.cashFlowMonthly * 12)} |\n`
    md += `| Expected Cash-on-Cash Return | ${fmtPct(c.cashOnCashReturn)} |\n`
  }

  md += `\n### Next Steps\n`
  md += `1. Review this investment proposal\n`
  md += `2. Schedule a meeting to discuss terms and structure\n`
  md += `3. Conduct site visit and due diligence\n`
  md += `4. Finalize financing and begin execution\n`

  md += `\n### Contact\n`
  md += `**Horizon Peak Capital LLC**\n`
  if (options.recipientName) {
    md += `\n*Prepared for ${options.recipientName}${options.recipientCompany ? ` at ${options.recipientCompany}` : ''}*`
  }

  return md
}
