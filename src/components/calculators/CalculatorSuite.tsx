'use client'

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import {
  Calculator,
  DollarSign,
  Home,
  TrendingUp,
  Percent,
  Building,
  Wrench,
  PiggyBank,
} from 'lucide-react'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { HORIZON_PEAK_BUSINESS_PLAN } from '../../data/conashaugh-lakes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'construction' | 'rental' | 'flip' | 'wholesale' | 'brrrr'

interface TabDef {
  id: TabId
  label: string
  icon: React.ReactNode
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
  min,
  max,
}: {
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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <div className="flex items-center rounded-lg bg-slate-700/60 border border-slate-600 focus-within:border-teal-400 transition-colors">
        {prefix && (
          <span className="pl-3 text-sm text-slate-400">{prefix}</span>
        )}
        <input
          type="number"
          className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={value}
          step={step ?? 1}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && (
          <span className="pr-3 text-sm text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function ResultCard({
  label,
  value,
  color = 'text-white',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-lg bg-slate-700/40 border border-slate-600/50 p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-teal-400 mb-3 flex items-center gap-2">
      {children}
    </h3>
  )
}

function profitColor(value: number): string {
  if (value > 0.2) return 'text-emerald-400'
  if (value > 0.05) return 'text-yellow-400'
  return 'text-red-400'
}

function cashFlowColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value === 0) return 'text-yellow-400'
  return 'text-red-400'
}

// ---------------------------------------------------------------------------
// Tab 1: Construction Loan Calculator
// ---------------------------------------------------------------------------

interface DealDefaults {
  purchasePrice: number
  arv: number
  rehabCost: number
  sqft: number
  monthlyRent: number
  isLand: boolean
  address: string
}

function ConstructionLoanCalculator({ dealDefaults }: { dealDefaults?: DealDefaults | null }) {
  const [sqft, setSqft] = useState(dealDefaults?.sqft || 2000)
  const [costPerSqft, setCostPerSqft] = useState(160)
  const [landValue, setLandValue] = useState(dealDefaults?.isLand ? dealDefaults.purchasePrice : 50000)
  const [downPayment, setDownPayment] = useState(dealDefaults ? Math.round(dealDefaults.purchasePrice * 0.15) : 80000)
  const [interestRate, setInterestRate] = useState(7.5)
  const [timeline, setTimeline] = useState(6)
  const [selectedBank, setSelectedBank] = useState(0)

  const banks = HORIZON_PEAK_BUSINESS_PLAN.banks
  const drawSchedule = HORIZON_PEAK_BUSINESS_PLAN.drawSchedule
  const comps = HORIZON_PEAK_BUSINESS_PLAN.saleComps
  const bank = banks[selectedBank]

  // Core calculations
  const totalConstructionCost = sqft * costPerSqft + landValue
  const originationFee = totalConstructionCost * bank.originationFee
  const loanAmount = totalConstructionCost - downPayment + originationFee + bank.closingCosts
  const monthlyRate = interestRate / 100 / 12
  const numPayments = 30 * 12
  const monthlyPayment =
    monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments
  const constructionInterest = loanAmount * (interestRate / 100) * (timeline / 12)
  const totalInterest = monthlyPayment * numPayments - loanAmount
  const estimatedSalePrice = sqft * comps.marketAvgPerSqft
  const grossProfit = estimatedSalePrice - totalConstructionCost - constructionInterest - originationFee - bank.closingCosts
  const margin = totalConstructionCost > 0 ? grossProfit / totalConstructionCost : 0

  // Draw schedule table data
  const draws = drawSchedule.map((d, i) => {
    const cumulativePercent = drawSchedule.slice(0, i + 1).reduce((s, x) => s + x.percent, 0)
    const drawAmount = d.percent * (totalConstructionCost - landValue)
    const cumulativeDraw = cumulativePercent * (totalConstructionCost - landValue)
    const monthIndex = Math.round(((i + 1) / drawSchedule.length) * timeline)
    const interestAccrued = cumulativeDraw * (interestRate / 100) * (monthIndex / 12)
    return {
      phase: d.phase,
      percent: d.percent,
      drawAmount,
      cumulativeDraw,
      month: monthIndex,
      interestAccrued,
    }
  })

  // Scenario analysis
  const scenarios = [
    { label: 'Conservative', perSqft: comps.conservativePerSqft },
    { label: 'Market', perSqft: comps.marketAvgPerSqft },
    { label: 'Premium', perSqft: comps.premiumPerSqft },
    { label: 'Best Case', perSqft: comps.bestCasePerSqft },
  ].map((s) => {
    const salePrice = sqft * s.perSqft
    const profit = salePrice - totalConstructionCost - constructionInterest - originationFee - bank.closingCosts
    const roi = totalConstructionCost > 0 ? profit / (downPayment + originationFee + bank.closingCosts) : 0
    return { ...s, salePrice, profit, roi }
  })

  function reset() {
    setSqft(2000)
    setCostPerSqft(160)
    setLandValue(50000)
    setDownPayment(80000)
    setInterestRate(7.5)
    setTimeline(6)
    setSelectedBank(0)
  }

  return (
    <div className="space-y-6">
      {/* Input / Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <Building className="w-4 h-4" /> Build Parameters
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Square Footage" value={sqft} onChange={setSqft} suffix="sq ft" min={0} />
            <InputField label="Cost / Sq Ft" value={costPerSqft} onChange={setCostPerSqft} prefix="$" min={0} />
            <InputField label="Land Value" value={landValue} onChange={setLandValue} prefix="$" min={0} />
            <InputField label="Down Payment" value={downPayment} onChange={setDownPayment} prefix="$" min={0} />
            <InputField label="Interest Rate" value={interestRate} onChange={setInterestRate} suffix="%" step={0.1} min={0} max={30} />
            <InputField label="Build Timeline" value={timeline} onChange={setTimeline} suffix="mo" min={1} max={36} />
          </div>

          {/* Bank Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Lender</label>
            <div className="grid grid-cols-2 gap-2">
              {banks.map((b, i) => (
                <button
                  key={b.name}
                  onClick={() => setSelectedBank(i)}
                  className={`text-left rounded-lg border p-2.5 text-xs transition-all ${
                    selectedBank === i
                      ? 'border-teal-400 bg-teal-400/10 text-teal-300'
                      : 'border-slate-600 bg-slate-700/40 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-medium">{b.name}</p>
                  <p className="text-slate-400 mt-0.5">{b.notes.slice(0, 40)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <DollarSign className="w-4 h-4" /> Results
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Total Construction Cost" value={formatCurrency(totalConstructionCost)} />
            <ResultCard label="Loan Amount" value={formatCurrency(loanAmount)} />
            <ResultCard label="Monthly Payment (30yr)" value={formatCurrency(monthlyPayment)} />
            <ResultCard label="Construction Interest" value={formatCurrency(constructionInterest)} color="text-yellow-400" />
            <ResultCard label="Total Interest (30yr)" value={formatCurrency(totalInterest)} color="text-yellow-400" />
            <ResultCard label="Est. Sale Price (Market)" value={formatCurrency(estimatedSalePrice)} color="text-cyan-400" />
            <ResultCard label="Gross Profit" value={formatCurrency(grossProfit)} color={grossProfit > 0 ? 'text-emerald-400' : 'text-red-400'} />
            <ResultCard label="Margin %" value={formatPercent(margin * 100)} color={profitColor(margin)} />
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Bank: {bank.name} &middot; Origination: {formatPercent(bank.originationFee * 100)} &middot; Closing: {formatCurrency(bank.closingCosts)} &middot; Min Down: {formatPercent(bank.minDown * 100)}
          </div>
        </div>
      </div>

      {/* Draw Schedule */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <SectionTitle>
          <TrendingUp className="w-4 h-4" /> Draw Schedule
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Phase</th>
                <th className="pb-2 pr-4 text-right">Draw %</th>
                <th className="pb-2 pr-4 text-right">Draw Amount</th>
                <th className="pb-2 pr-4 text-right">Cumulative</th>
                <th className="pb-2 pr-4 text-right">Month</th>
                <th className="pb-2 text-right">Interest Accrued</th>
              </tr>
            </thead>
            <tbody>
              {draws.map((d, i) => (
                <tr key={i} className="border-b border-slate-700/50 text-slate-300">
                  <td className="py-2 pr-4 text-slate-500">{i + 1}</td>
                  <td className="py-2 pr-4">{d.phase}</td>
                  <td className="py-2 pr-4 text-right">{formatPercent(d.percent * 100)}</td>
                  <td className="py-2 pr-4 text-right">{formatCurrency(d.drawAmount)}</td>
                  <td className="py-2 pr-4 text-right font-medium">{formatCurrency(d.cumulativeDraw)}</td>
                  <td className="py-2 pr-4 text-right">{d.month}</td>
                  <td className="py-2 text-right text-yellow-400">{formatCurrency(d.interestAccrued)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <SectionTitle>
          <Calculator className="w-4 h-4" /> Scenario Analysis
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">Scenario</th>
                <th className="pb-2 pr-4 text-right">$/Sq Ft</th>
                <th className="pb-2 pr-4 text-right">Sale Price</th>
                <th className="pb-2 pr-4 text-right">Net Profit</th>
                <th className="pb-2 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i} className="border-b border-slate-700/50 text-slate-300">
                  <td className="py-2 pr-4 font-medium">{s.label}</td>
                  <td className="py-2 pr-4 text-right">${s.perSqft}</td>
                  <td className="py-2 pr-4 text-right">{formatCurrency(s.salePrice)}</td>
                  <td className={`py-2 pr-4 text-right font-medium ${s.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(s.profit)}
                  </td>
                  <td className={`py-2 text-right font-medium ${profitColor(s.roi)}`}>
                    {formatPercent(s.roi * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: Rental Property Analyzer
// ---------------------------------------------------------------------------

function RentalPropertyAnalyzer({ dealDefaults }: { dealDefaults?: DealDefaults | null }) {
  const [purchasePrice, setPurchasePrice] = useState(dealDefaults ? dealDefaults.purchasePrice + dealDefaults.rehabCost : 350000)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [interestRate, setInterestRate] = useState(7.0)
  const [monthlyRent, setMonthlyRent] = useState(dealDefaults?.monthlyRent || 2200)
  const [vacancyRate, setVacancyRate] = useState(8)
  const [propertyTax, setPropertyTax] = useState(4200)
  const [insurance, setInsurance] = useState(1800)
  const [hoa, setHoa] = useState(1200)
  const [maintenance, setMaintenance] = useState(2400)
  const [mgmtFee, setMgmtFee] = useState(8)

  // Core calcs
  const downPaymentAmt = purchasePrice * (downPaymentPct / 100)
  const loanAmount = purchasePrice - downPaymentAmt
  const monthlyRate = interestRate / 100 / 12
  const numPayments = 30 * 12
  const monthlyMortgage =
    monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments

  const effectiveRent = monthlyRent * (1 - vacancyRate / 100)
  const monthlyTax = propertyTax / 12
  const monthlyInsurance = insurance / 12
  const monthlyHoa = hoa / 12
  const monthlyMaint = maintenance / 12
  const monthlyMgmt = effectiveRent * (mgmtFee / 100)

  const totalMonthlyExpenses = monthlyMortgage + monthlyTax + monthlyInsurance + monthlyHoa + monthlyMaint + monthlyMgmt
  const monthlyCashFlow = effectiveRent - totalMonthlyExpenses
  const annualCashFlow = monthlyCashFlow * 12

  const noi = effectiveRent * 12 - propertyTax - insurance - hoa - maintenance - (effectiveRent * 12 * (mgmtFee / 100))
  const capRate = purchasePrice > 0 ? noi / purchasePrice : 0
  const cashOnCash = downPaymentAmt > 0 ? annualCashFlow / downPaymentAmt : 0
  const annualDebtService = monthlyMortgage * 12
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0
  const grm = monthlyRent > 0 ? purchasePrice / (monthlyRent * 12) : 0

  // 10-year projection
  const appreciationRate = 0.03
  const rentGrowth = 0.02
  const projectionData = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year)
    const appreciation = propertyValue - purchasePrice
    const projectedRent = monthlyRent * Math.pow(1 + rentGrowth, year)
    const projectedEffective = projectedRent * (1 - vacancyRate / 100)
    const projectedExpenses =
      monthlyMortgage +
      (propertyTax * Math.pow(1.02, year)) / 12 +
      (insurance * Math.pow(1.03, year)) / 12 +
      monthlyHoa +
      (maintenance * Math.pow(1.02, year)) / 12 +
      projectedEffective * (mgmtFee / 100)
    const projectedAnnualCF = (projectedEffective - projectedExpenses) * 12
    const cumulativeCF = Array.from({ length: year }, (__, j) => {
      const r = monthlyRent * Math.pow(1 + rentGrowth, j + 1)
      const eff = r * (1 - vacancyRate / 100)
      const exp =
        monthlyMortgage +
        (propertyTax * Math.pow(1.02, j + 1)) / 12 +
        (insurance * Math.pow(1.03, j + 1)) / 12 +
        monthlyHoa +
        (maintenance * Math.pow(1.02, j + 1)) / 12 +
        eff * (mgmtFee / 100)
      return (eff - exp) * 12
    }).reduce((s, v) => s + v, 0)
    return {
      year: `Yr ${year}`,
      appreciation: Math.round(appreciation),
      cashFlow: Math.round(projectedAnnualCF),
      cumulativeCF: Math.round(cumulativeCF),
      totalReturn: Math.round(appreciation + cumulativeCF),
    }
  })

  function reset() {
    setPurchasePrice(350000)
    setDownPaymentPct(20)
    setInterestRate(7.0)
    setMonthlyRent(2200)
    setVacancyRate(8)
    setPropertyTax(4200)
    setInsurance(1800)
    setHoa(1200)
    setMaintenance(2400)
    setMgmtFee(8)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <Home className="w-4 h-4" /> Property Details
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" min={0} />
            <InputField label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} suffix="%" step={1} min={0} max={100} />
            <InputField label="Interest Rate" value={interestRate} onChange={setInterestRate} suffix="%" step={0.1} min={0} max={30} />
            <InputField label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} prefix="$" min={0} />
            <InputField label="Vacancy Rate" value={vacancyRate} onChange={setVacancyRate} suffix="%" step={1} min={0} max={100} />
            <InputField label="Property Tax / yr" value={propertyTax} onChange={setPropertyTax} prefix="$" min={0} />
            <InputField label="Insurance / yr" value={insurance} onChange={setInsurance} prefix="$" min={0} />
            <InputField label="HOA / yr" value={hoa} onChange={setHoa} prefix="$" min={0} />
            <InputField label="Maintenance / yr" value={maintenance} onChange={setMaintenance} prefix="$" min={0} />
            <InputField label="Mgmt Fee" value={mgmtFee} onChange={setMgmtFee} suffix="%" step={1} min={0} max={100} />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <DollarSign className="w-4 h-4" /> Analysis
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard
              label="Monthly Cash Flow"
              value={formatCurrency(monthlyCashFlow)}
              color={cashFlowColor(monthlyCashFlow)}
            />
            <ResultCard
              label="Annual Cash Flow"
              value={formatCurrency(annualCashFlow)}
              color={cashFlowColor(annualCashFlow)}
            />
            <ResultCard
              label="Cap Rate"
              value={formatPercent(capRate * 100)}
              color={capRate >= 0.06 ? 'text-emerald-400' : capRate >= 0.04 ? 'text-yellow-400' : 'text-red-400'}
            />
            <ResultCard
              label="Cash-on-Cash Return"
              value={formatPercent(cashOnCash * 100)}
              color={cashOnCash >= 0.08 ? 'text-emerald-400' : cashOnCash >= 0.04 ? 'text-yellow-400' : 'text-red-400'}
            />
            <ResultCard
              label="DSCR"
              value={dscr.toFixed(2)}
              color={dscr >= 1.25 ? 'text-emerald-400' : dscr >= 1.0 ? 'text-yellow-400' : 'text-red-400'}
            />
            <ResultCard label="GRM" value={grm.toFixed(1)} color="text-cyan-400" />
          </div>

          {/* Expense breakdown */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-400">Monthly Expense Breakdown</p>
            {[
              { label: 'Mortgage (P&I)', value: monthlyMortgage },
              { label: 'Property Tax', value: monthlyTax },
              { label: 'Insurance', value: monthlyInsurance },
              { label: 'HOA', value: monthlyHoa },
              { label: 'Maintenance', value: monthlyMaint },
              { label: 'Management', value: monthlyMgmt },
            ].map((e) => (
              <div key={e.label} className="flex justify-between text-xs">
                <span className="text-slate-400">{e.label}</span>
                <span className="text-slate-300">{formatCurrency(e.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-medium border-t border-slate-600 pt-2">
              <span className="text-slate-300">Total Expenses</span>
              <span className="text-white">{formatCurrency(totalMonthlyExpenses)}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Effective Rent</span>
              <span className="text-cyan-400">{formatCurrency(effectiveRent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Year Projection Chart */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <SectionTitle>
          <TrendingUp className="w-4 h-4" /> 10-Year Projection (3% appreciation, 2% rent growth)
        </SectionTitle>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="appreciation" name="Appreciation" stackId="1" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.3} />
              <Area type="monotone" dataKey="cumulativeCF" name="Cumulative Cash Flow" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Flip / Rehab Calculator
// ---------------------------------------------------------------------------

function FlipRehabCalculator({ dealDefaults }: { dealDefaults?: DealDefaults | null }) {
  const [purchasePrice, setPurchasePrice] = useState(dealDefaults?.purchasePrice || 200000)
  const [rehabBudget, setRehabBudget] = useState(dealDefaults?.rehabCost || 50000)
  const [holdingCostsMonth, setHoldingCostsMonth] = useState(2500)
  const [holdingPeriod, setHoldingPeriod] = useState(4)
  const [arv, setArv] = useState(dealDefaults?.arv || 350000)
  const [closingBuyPct, setClosingBuyPct] = useState(2)
  const [closingSellPct, setClosingSellPct] = useState(2)
  const [agentCommission, setAgentCommission] = useState(5)

  // Core calcs
  const closingBuy = purchasePrice * (closingBuyPct / 100)
  const closingSell = arv * (closingSellPct / 100)
  const agentCost = arv * (agentCommission / 100)
  const totalHoldingCosts = holdingCostsMonth * holdingPeriod
  const totalInvestment = purchasePrice + rehabBudget + closingBuy + totalHoldingCosts
  const totalCostBasis = totalInvestment + closingSell + agentCost
  const netProfit = arv - totalCostBasis
  const roi = totalInvestment > 0 ? netProfit / totalInvestment : 0
  const annualizedRoi = holdingPeriod > 0 ? roi * (12 / holdingPeriod) : 0

  // 70% rule
  const maxPurchaseRehab = arv * 0.7
  const actualPurchaseRehab = purchasePrice + rehabBudget
  const meets70Rule = actualPurchaseRehab <= maxPurchaseRehab

  // Break-even chart: what sale price do you need at different rehab costs
  const breakEvenData = Array.from({ length: 8 }, (_, i) => {
    const rehabMultiplier = 0.5 + i * 0.25
    const rehab = Math.round(rehabBudget * rehabMultiplier)
    const totalCost = purchasePrice + rehab + closingBuy + totalHoldingCosts
    const breakEvenSale = totalCost / (1 - (closingSellPct + agentCommission) / 100)
    return {
      rehab: `$${(rehab / 1000).toFixed(0)}k`,
      breakEven: Math.round(breakEvenSale),
      arv,
    }
  })

  function reset() {
    setPurchasePrice(200000)
    setRehabBudget(50000)
    setHoldingCostsMonth(2500)
    setHoldingPeriod(4)
    setArv(350000)
    setClosingBuyPct(2)
    setClosingSellPct(2)
    setAgentCommission(5)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <Wrench className="w-4 h-4" /> Flip Parameters
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" min={0} />
            <InputField label="Rehab Budget" value={rehabBudget} onChange={setRehabBudget} prefix="$" min={0} />
            <InputField label="Holding Costs / mo" value={holdingCostsMonth} onChange={setHoldingCostsMonth} prefix="$" min={0} />
            <InputField label="Holding Period" value={holdingPeriod} onChange={setHoldingPeriod} suffix="mo" min={1} max={36} />
            <InputField label="ARV (After Repair)" value={arv} onChange={setArv} prefix="$" min={0} />
            <InputField label="Closing Costs Buy" value={closingBuyPct} onChange={setClosingBuyPct} suffix="%" step={0.5} min={0} max={10} />
            <InputField label="Closing Costs Sell" value={closingSellPct} onChange={setClosingSellPct} suffix="%" step={0.5} min={0} max={10} />
            <InputField label="Agent Commission" value={agentCommission} onChange={setAgentCommission} suffix="%" step={0.5} min={0} max={10} />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <DollarSign className="w-4 h-4" /> Deal Analysis
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Total Investment" value={formatCurrency(totalInvestment)} />
            <ResultCard
              label="Net Profit"
              value={formatCurrency(netProfit)}
              color={netProfit > 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <ResultCard label="ROI" value={formatPercent(roi * 100)} color={profitColor(roi)} />
            <ResultCard
              label="Annualized ROI"
              value={formatPercent(annualizedRoi * 100)}
              color={profitColor(annualizedRoi)}
            />
          </div>

          {/* Cost breakdown */}
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-slate-400">Cost Breakdown</p>
            {[
              { label: 'Purchase', value: purchasePrice },
              { label: 'Rehab', value: rehabBudget },
              { label: 'Closing (Buy)', value: closingBuy },
              { label: 'Holding Costs', value: totalHoldingCosts },
              { label: 'Closing (Sell)', value: closingSell },
              { label: 'Agent Commission', value: agentCost },
            ].map((e) => (
              <div key={e.label} className="flex justify-between text-xs">
                <span className="text-slate-400">{e.label}</span>
                <span className="text-slate-300">{formatCurrency(e.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-medium border-t border-slate-600 pt-2">
              <span className="text-slate-300">Total Cost Basis</span>
              <span className="text-white">{formatCurrency(totalCostBasis)}</span>
            </div>
          </div>

          {/* 70% Rule */}
          <div className={`mt-4 rounded-lg border p-3 ${meets70Rule ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
            <p className="text-xs font-semibold mb-1" style={{ color: meets70Rule ? '#34d399' : '#f87171' }}>
              70% Rule Check: {meets70Rule ? 'PASS' : 'FAIL'}
            </p>
            <p className="text-xs text-slate-300">
              Purchase + Rehab = {formatCurrency(actualPurchaseRehab)}
            </p>
            <p className="text-xs text-slate-400">
              70% of ARV = {formatCurrency(maxPurchaseRehab)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {meets70Rule
                ? `Under by ${formatCurrency(maxPurchaseRehab - actualPurchaseRehab)}`
                : `Over by ${formatCurrency(actualPurchaseRehab - maxPurchaseRehab)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Break-even Chart */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <SectionTitle>
          <TrendingUp className="w-4 h-4" /> Break-Even Analysis
        </SectionTitle>
        <p className="text-xs text-slate-400 mb-4">
          Minimum sale price needed to break even at different rehab cost levels
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakEvenData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="rehab" stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Rehab Budget', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="breakEven" name="Break-Even Sale Price" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="arv" name="ARV" fill="#2dd4bf" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 4: Wholesale Calculator
// ---------------------------------------------------------------------------

function WholesaleCalculator({ dealDefaults }: { dealDefaults?: DealDefaults | null }) {
  const [arvW, setArvW] = useState(dealDefaults?.arv || 350000)
  const [rehabEstimate, setRehabEstimate] = useState(dealDefaults?.rehabCost || 50000)
  const [investorProfitPct, setInvestorProfitPct] = useState(30)
  const [assignmentFee, setAssignmentFee] = useState(10000)

  // MAO = ARV * (1 - Investor Profit %) - Rehab - Assignment Fee
  const mao = arvW * (1 - investorProfitPct / 100) - rehabEstimate - assignmentFee
  const investorBuysAt = mao + assignmentFee
  const investorEquity = arvW - investorBuysAt - rehabEstimate
  const investorRoi = investorBuysAt + rehabEstimate > 0 ? investorEquity / (investorBuysAt + rehabEstimate) : 0

  // Sensitivity analysis: show MAO at different investor profit margins
  const sensitivityData = [20, 25, 30, 35, 40].map((pct) => {
    const m = arvW * (1 - pct / 100) - rehabEstimate - assignmentFee
    return {
      margin: `${pct}%`,
      mao: Math.round(m),
      yourProfit: assignmentFee,
    }
  })

  function reset() {
    setArvW(350000)
    setRehabEstimate(50000)
    setInvestorProfitPct(30)
    setAssignmentFee(10000)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <Percent className="w-4 h-4" /> Wholesale Deal
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="ARV" value={arvW} onChange={setArvW} prefix="$" min={0} />
            <InputField label="Rehab Estimate" value={rehabEstimate} onChange={setRehabEstimate} prefix="$" min={0} />
            <InputField label="Investor Profit Margin" value={investorProfitPct} onChange={setInvestorProfitPct} suffix="%" step={1} min={0} max={100} />
            <InputField label="Assignment Fee" value={assignmentFee} onChange={setAssignmentFee} prefix="$" min={0} />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Formula display */}
          <div className="rounded-lg bg-slate-700/40 border border-slate-600/50 p-4 mt-4">
            <p className="text-xs font-medium text-teal-400 mb-2">MAO Formula</p>
            <p className="text-sm text-slate-300 font-mono">
              MAO = ARV x (1 - Investor Profit%) - Rehab - Assignment Fee
            </p>
            <p className="text-sm text-slate-400 font-mono mt-1">
              MAO = {formatCurrency(arvW)} x {(1 - investorProfitPct / 100).toFixed(2)} - {formatCurrency(rehabEstimate)} - {formatCurrency(assignmentFee)}
            </p>
            <p className="text-lg font-bold text-cyan-400 mt-2">
              MAO = {formatCurrency(mao)}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <DollarSign className="w-4 h-4" /> Results
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard
              label="Max Allowable Offer (MAO)"
              value={formatCurrency(mao)}
              color={mao > 0 ? 'text-cyan-400' : 'text-red-400'}
            />
            <ResultCard
              label="Your Profit (Assignment Fee)"
              value={formatCurrency(assignmentFee)}
              color="text-emerald-400"
            />
            <ResultCard
              label="Investor Buys At"
              value={formatCurrency(investorBuysAt)}
            />
            <ResultCard
              label="Investor Equity (post-rehab)"
              value={formatCurrency(investorEquity)}
              color={investorEquity > 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <ResultCard
              label="Investor ROI"
              value={formatPercent(investorRoi * 100)}
              color={profitColor(investorRoi)}
            />
            <ResultCard label="ARV" value={formatCurrency(arvW)} color="text-cyan-400" />
          </div>

          {/* Deal flow visual */}
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium text-slate-400">Deal Flow</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md bg-teal-500/20 border border-teal-500/40 text-teal-300 px-2 py-1">You Contract at {formatCurrency(mao)}</span>
              <span className="text-slate-500">&rarr;</span>
              <span className="rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-2 py-1">Assign at {formatCurrency(investorBuysAt)}</span>
              <span className="text-slate-500">&rarr;</span>
              <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-1">Pocket {formatCurrency(assignmentFee)}</span>
            </div>
          </div>

          {/* Sensitivity table */}
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-400 mb-2">MAO Sensitivity (by Investor Margin)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-1.5 pr-4">Investor Margin</th>
                    <th className="pb-1.5 text-right">MAO</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivityData.map((row) => (
                    <tr key={row.margin} className="border-b border-slate-700/50 text-slate-300">
                      <td className="py-1.5 pr-4">{row.margin}</td>
                      <td className={`py-1.5 text-right font-medium ${row.mao > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {formatCurrency(row.mao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 5: BRRRR Calculator
// ---------------------------------------------------------------------------

function BRRRRCalculator({ dealDefaults }: { dealDefaults?: DealDefaults | null }) {
  const [purchasePrice, setPurchasePrice] = useState(dealDefaults?.purchasePrice || 180000)
  const [rehabCost, setRehabCost] = useState(dealDefaults?.rehabCost || 40000)
  const [arvB, setArvB] = useState(dealDefaults?.arv || 300000)
  const [rentMonth, setRentMonth] = useState(dealDefaults?.monthlyRent || 2000)
  const [refiLtv, setRefiLtv] = useState(75)
  const [interestRateB, setInterestRateB] = useState(7.0)
  const [propertyTaxB, setPropertyTaxB] = useState(3600)
  const [insuranceB, setInsuranceB] = useState(1500)
  const [hoaB, setHoaB] = useState(1200)
  const [maintenanceB, setMaintenanceB] = useState(2000)
  const [vacancyB, setVacancyB] = useState(8)
  const [mgmtB, setMgmtB] = useState(8)

  // BRRRR cycle
  const totalCashIn = purchasePrice + rehabCost
  const refinanceAmount = arvB * (refiLtv / 100)
  const cashLeftInDeal = Math.max(0, totalCashIn - refinanceAmount)
  const cashRecovered = Math.min(totalCashIn, refinanceAmount)

  // Post-refi mortgage
  const monthlyRateB = interestRateB / 100 / 12
  const numPaymentsB = 30 * 12
  const refiMonthlyPayment =
    monthlyRateB > 0
      ? (refinanceAmount * monthlyRateB * Math.pow(1 + monthlyRateB, numPaymentsB)) /
        (Math.pow(1 + monthlyRateB, numPaymentsB) - 1)
      : refinanceAmount / numPaymentsB

  const effectiveRentB = rentMonth * (1 - vacancyB / 100)
  const monthlyExpenses =
    refiMonthlyPayment +
    propertyTaxB / 12 +
    insuranceB / 12 +
    hoaB / 12 +
    maintenanceB / 12 +
    effectiveRentB * (mgmtB / 100)
  const monthlyCashFlowB = effectiveRentB - monthlyExpenses
  const annualCashFlowB = monthlyCashFlowB * 12

  const cashOnCashB = cashLeftInDeal > 0 ? annualCashFlowB / cashLeftInDeal : annualCashFlowB > 0 ? Infinity : 0

  // BRRRR cycle data for visual
  const cycleSteps = [
    {
      step: 'Buy',
      detail: `Purchase at ${formatCurrency(purchasePrice)}`,
      amount: purchasePrice,
      color: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
    },
    {
      step: 'Rehab',
      detail: `Invest ${formatCurrency(rehabCost)} in repairs`,
      amount: rehabCost,
      color: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    },
    {
      step: 'Rent',
      detail: `${formatCurrency(rentMonth)}/mo gross rent`,
      amount: rentMonth * 12,
      color: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    },
    {
      step: 'Refinance',
      detail: `Refi at ${refiLtv}% LTV = ${formatCurrency(refinanceAmount)}`,
      amount: refinanceAmount,
      color: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    },
    {
      step: 'Repeat',
      detail: cashLeftInDeal <= 0 ? `All cash out + ${formatCurrency(Math.abs(totalCashIn - refinanceAmount))} extra` : `${formatCurrency(cashLeftInDeal)} left in deal`,
      amount: cashRecovered,
      color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    },
  ]

  // 5-year equity buildup chart
  const equityData = Array.from({ length: 6 }, (_, i) => {
    const year = i
    const propertyValue = arvB * Math.pow(1.03, year)
    // Approximate remaining loan balance (simplified)
    const paymentsM = year * 12
    const remainingBalance =
      monthlyRateB > 0
        ? refinanceAmount *
          (Math.pow(1 + monthlyRateB, numPaymentsB) - Math.pow(1 + monthlyRateB, paymentsM)) /
          (Math.pow(1 + monthlyRateB, numPaymentsB) - 1)
        : refinanceAmount - (refinanceAmount / numPaymentsB) * paymentsM
    const equity = propertyValue - remainingBalance
    const cumulativeCF = annualCashFlowB * year
    return {
      year: year === 0 ? 'Now' : `Yr ${year}`,
      equity: Math.round(equity),
      cashFlow: Math.round(cumulativeCF),
      totalWealth: Math.round(equity + cumulativeCF),
    }
  })

  function reset() {
    setPurchasePrice(180000)
    setRehabCost(40000)
    setArvB(300000)
    setRentMonth(2000)
    setRefiLtv(75)
    setInterestRateB(7.0)
    setPropertyTaxB(3600)
    setInsuranceB(1500)
    setHoaB(1200)
    setMaintenanceB(2000)
    setVacancyB(8)
    setMgmtB(8)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <PiggyBank className="w-4 h-4" /> BRRRR Parameters
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" min={0} />
            <InputField label="Rehab Cost" value={rehabCost} onChange={setRehabCost} prefix="$" min={0} />
            <InputField label="ARV" value={arvB} onChange={setArvB} prefix="$" min={0} />
            <InputField label="Rent / mo" value={rentMonth} onChange={setRentMonth} prefix="$" min={0} />
            <InputField label="Refinance LTV" value={refiLtv} onChange={setRefiLtv} suffix="%" step={1} min={0} max={100} />
            <InputField label="Interest Rate" value={interestRateB} onChange={setInterestRateB} suffix="%" step={0.1} min={0} max={30} />
            <InputField label="Property Tax / yr" value={propertyTaxB} onChange={setPropertyTaxB} prefix="$" min={0} />
            <InputField label="Insurance / yr" value={insuranceB} onChange={setInsuranceB} prefix="$" min={0} />
            <InputField label="HOA / yr" value={hoaB} onChange={setHoaB} prefix="$" min={0} />
            <InputField label="Maintenance / yr" value={maintenanceB} onChange={setMaintenanceB} prefix="$" min={0} />
            <InputField label="Vacancy Rate" value={vacancyB} onChange={setVacancyB} suffix="%" step={1} min={0} max={100} />
            <InputField label="Mgmt Fee" value={mgmtB} onChange={setMgmtB} suffix="%" step={1} min={0} max={100} />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
          <SectionTitle>
            <DollarSign className="w-4 h-4" /> BRRRR Results
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Total Cash In" value={formatCurrency(totalCashIn)} />
            <ResultCard label="Refinance Amount" value={formatCurrency(refinanceAmount)} color="text-purple-400" />
            <ResultCard
              label="Cash Left In Deal"
              value={formatCurrency(cashLeftInDeal)}
              color={cashLeftInDeal <= 0 ? 'text-emerald-400' : 'text-yellow-400'}
            />
            <ResultCard label="Cash Recovered" value={formatCurrency(cashRecovered)} color="text-cyan-400" />
            <ResultCard
              label="Monthly Cash Flow"
              value={formatCurrency(monthlyCashFlowB)}
              color={cashFlowColor(monthlyCashFlowB)}
            />
            <ResultCard
              label="Cash-on-Cash Return"
              value={cashOnCashB === Infinity ? 'Infinite' : formatPercent(cashOnCashB * 100)}
              color={cashOnCashB === Infinity || cashOnCashB >= 0.08 ? 'text-emerald-400' : cashOnCashB >= 0.04 ? 'text-yellow-400' : 'text-red-400'}
            />
          </div>

          {/* Expense breakdown */}
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-slate-400">Post-Refi Monthly Expenses</p>
            {[
              { label: 'Mortgage (P&I)', value: refiMonthlyPayment },
              { label: 'Property Tax', value: propertyTaxB / 12 },
              { label: 'Insurance', value: insuranceB / 12 },
              { label: 'HOA', value: hoaB / 12 },
              { label: 'Maintenance', value: maintenanceB / 12 },
              { label: 'Management', value: effectiveRentB * (mgmtB / 100) },
            ].map((e) => (
              <div key={e.label} className="flex justify-between text-xs">
                <span className="text-slate-400">{e.label}</span>
                <span className="text-slate-300">{formatCurrency(e.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-medium border-t border-slate-600 pt-2">
              <span className="text-slate-300">Total Expenses</span>
              <span className="text-white">{formatCurrency(monthlyExpenses)}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Effective Rent</span>
              <span className="text-cyan-400">{formatCurrency(effectiveRentB)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BRRRR Cycle Visual */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <SectionTitle>
          <TrendingUp className="w-4 h-4" /> BRRRR Cycle
        </SectionTitle>
        <div className="flex flex-wrap items-center gap-3">
          {cycleSteps.map((s, i) => (
            <React.Fragment key={s.step}>
              <div className={`rounded-lg border p-3 min-w-[140px] ${s.color}`}>
                <p className="text-sm font-bold">{s.step}</p>
                <p className="text-xs mt-1 opacity-80">{s.detail}</p>
              </div>
              {i < cycleSteps.length - 1 && (
                <span className="text-slate-500 text-lg">&rarr;</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Equity Buildup Chart */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <SectionTitle>
          <TrendingUp className="w-4 h-4" /> 5-Year Wealth Building (3% appreciation)
        </SectionTitle>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="equity" name="Equity" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cashFlow" name="Cumulative Cash Flow" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="totalWealth" name="Total Wealth" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main: Tabbed Calculator Suite
// ---------------------------------------------------------------------------

const TABS: TabDef[] = [
  { id: 'construction', label: 'Construction Loan', icon: <Building className="w-4 h-4" /> },
  { id: 'rental', label: 'Rental Analyzer', icon: <Home className="w-4 h-4" /> },
  { id: 'flip', label: 'Flip / Rehab', icon: <Wrench className="w-4 h-4" /> },
  { id: 'wholesale', label: 'Wholesale', icon: <Percent className="w-4 h-4" /> },
  { id: 'brrrr', label: 'BRRRR', icon: <PiggyBank className="w-4 h-4" /> },
]

interface CalculatorSuiteProps {
  initialDeal?: import('../../data/store').Deal | null
  initialTab?: string | null
  onDealConsumed?: () => void
}

export default function CalculatorSuite({ initialDeal, initialTab, onDealConsumed }: CalculatorSuiteProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (initialTab && ['construction', 'rental', 'flip', 'wholesale', 'brrrr'].includes(initialTab)) {
      return initialTab as TabId
    }
    if (initialDeal) {
      const isLand = initialDeal.sqft === 0 && initialDeal.beds === 0
      return isLand ? 'construction' : 'flip'
    }
    return 'construction'
  })

  // If deal was passed, extract defaults
  const dealDefaults = initialDeal ? {
    purchasePrice: initialDeal.listPrice,
    arv: initialDeal.estimatedARV || Math.round(initialDeal.listPrice * 1.6),
    rehabCost: initialDeal.estimatedRehab || 60000,
    sqft: initialDeal.sqft || 2000,
    monthlyRent: initialDeal.cashFlow ? Math.round(initialDeal.cashFlow / 0.4) : 2200,
    isLand: initialDeal.sqft === 0 && initialDeal.beds === 0,
    address: `${initialDeal.address}, ${initialDeal.city}, ${initialDeal.state}`,
  } : null

  // Notify parent the deal has been consumed
  React.useEffect(() => {
    if (initialDeal && onDealConsumed) {
      // We don't clear immediately - let the calculator use the values first
    }
  }, [initialDeal, onDealConsumed])

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-teal-400" />
          Investment Calculator Suite
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Comprehensive real estate analysis tools for Horizon Peak Capital
        </p>
        {dealDefaults && (
          <div className="mt-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-purple-300">
              📍 Pre-loaded from Deal Analyzer: <span className="font-semibold text-white">{dealDefaults.address}</span> — {formatCurrency(dealDefaults.purchasePrice)} | ARV: {formatCurrency(dealDefaults.arv)}
            </span>
            {onDealConsumed && (
              <button onClick={onDealConsumed} className="text-xs text-purple-400 hover:text-purple-300 ml-auto underline">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 mb-6 rounded-xl bg-slate-800 border border-slate-700 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60 border border-transparent'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'construction' && <ConstructionLoanCalculator dealDefaults={dealDefaults} />}
        {activeTab === 'rental' && <RentalPropertyAnalyzer dealDefaults={dealDefaults} />}
        {activeTab === 'flip' && <FlipRehabCalculator dealDefaults={dealDefaults} />}
        {activeTab === 'wholesale' && <WholesaleCalculator dealDefaults={dealDefaults} />}
        {activeTab === 'brrrr' && <BRRRRCalculator dealDefaults={dealDefaults} />}
      </div>
    </div>
  )
}
