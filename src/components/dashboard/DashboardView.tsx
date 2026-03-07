'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Home,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users,
} from 'lucide-react'
import { formatCurrency, formatPercent } from '../../lib/utils'
import {
  Property,
  Goal,
  SAMPLE_PROPERTIES,
  SAMPLE_GOALS,
} from '../../data/store'
import { HORIZON_PEAK_BUSINESS_PLAN } from '../../data/conashaugh-lakes'

// ---------------------------------------------------------------------------
// Derived data helpers
// ---------------------------------------------------------------------------

const properties = SAMPLE_PROPERTIES
const goals = SAMPLE_GOALS
const plan = HORIZON_PEAK_BUSINESS_PLAN

const STATUS_ORDER = [
  'Prospect',
  'Under Contract',
  'Planning',
  'Permitting',
  'Construction',
  'Finishing',
  'Listed',
  'Sold',
] as const

const STATUS_COLORS: Record<string, string> = {
  Prospect: '#64748b',
  'Under Contract': '#f59e0b',
  Planning: '#3b82f6',
  Permitting: '#8b5cf6',
  Construction: '#f97316',
  Finishing: '#06b6d4',
  Listed: '#10b981',
  Sold: '#22d3ee',
}

const CATEGORY_COLORS: Record<string, string> = {
  Acquisition: '#06b6d4',
  Revenue: '#10b981',
  Profit: '#f59e0b',
  Pipeline: '#8b5cf6',
  Operations: '#f97316',
}

const PIE_COLORS = [
  '#06b6d4', // teal-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#f97316', // orange-500
  '#10b981', // emerald-500
]

// ---------------------------------------------------------------------------
// KPI computations
// ---------------------------------------------------------------------------

function computeKPIs() {
  const totalPortfolioValue = properties.reduce(
    (sum, p) => sum + p.estimatedSalePrice,
    0
  )

  const activeStatuses = new Set([
    'Under Contract',
    'Planning',
    'Permitting',
    'Construction',
    'Finishing',
    'Listed',
  ])
  const activeProjects = properties.filter((p) =>
    activeStatuses.has(p.status)
  ).length

  const projectedProfit = properties.reduce(
    (sum, p) => sum + (p.estimatedSalePrice - p.estimatedBuildCost),
    0
  )

  const avgROI =
    properties.length > 0
      ? properties.reduce(
          (sum, p) =>
            sum +
            ((p.estimatedSalePrice - p.estimatedBuildCost) /
              p.estimatedBuildCost) *
              100,
          0
        ) / properties.length
      : 0

  const pipelineStatuses = new Set(['Prospect', 'Under Contract'])
  const pipelineValue = properties
    .filter((p) => pipelineStatuses.has(p.status))
    .reduce((sum, p) => sum + p.estimatedSalePrice, 0)

  const ytdCashDeployed = properties.reduce(
    (sum, p) => sum + p.landValue + (p.actualBuildCost ?? 0),
    0
  )

  return {
    totalPortfolioValue,
    activeProjects,
    projectedProfit,
    avgROI,
    pipelineValue,
    ytdCashDeployed,
  }
}

// ---------------------------------------------------------------------------
// Revenue projection chart data
// ---------------------------------------------------------------------------

function getRevenueProjectionData() {
  const g = plan.goals
  return [
    { year: 'Year 1', revenue: g.year1.revenue, profit: g.year1.profit, units: g.year1.units },
    { year: 'Year 2', revenue: g.year2.revenue, profit: g.year2.profit, units: g.year2.units },
    { year: 'Year 3', revenue: g.year3.revenue, profit: g.year3.profit, units: g.year3.units },
    { year: 'Year 4', revenue: 3200000, profit: 1000000, units: 8 }, // interpolated
    { year: 'Year 5', revenue: g.year5.revenue, profit: g.year5.profit, units: g.year5.units },
  ]
}

// ---------------------------------------------------------------------------
// Pipeline data
// ---------------------------------------------------------------------------

function getPipelineCounts() {
  const counts: Record<string, number> = {}
  STATUS_ORDER.forEach((s) => (counts[s] = 0))
  properties.forEach((p) => {
    if (counts[p.status] !== undefined) {
      counts[p.status]++
    }
  })
  return STATUS_ORDER.map((s) => ({ status: s, count: counts[s] }))
}

// ---------------------------------------------------------------------------
// Cost breakdown data
// ---------------------------------------------------------------------------

function getCostBreakdownData() {
  const ce = plan.costEstimates
  return [
    { name: 'Modular Home', value: (ce.modularHome.min + ce.modularHome.max) / 2 },
    { name: 'Land', value: (ce.landPurchase.min + ce.landPurchase.max) / 2 },
    { name: 'Site Prep', value: (ce.sitePrep.min + ce.sitePrep.max) / 2 },
    { name: 'Delivery', value: (ce.deliveryInstall.min + ce.deliveryInstall.max) / 2 },
    { name: 'Permits', value: (ce.permits.min + ce.permits.max) / 2 },
    { name: 'Customizations', value: (ce.customizations.min + ce.customizations.max) / 2 },
    { name: 'Contingency', value: (ce.contingency.min + ce.contingency.max) / 2 },
  ]
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

function getUpcomingMilestones() {
  const now = new Date()
  const milestones: Array<{
    name: string
    property: string
    phase: string
    dueDate: string
    status: string
  }> = []

  properties.forEach((p) => {
    if (p.milestones) {
      p.milestones.forEach((m) => {
        if (m.status !== 'Completed') {
          milestones.push({
            name: m.name,
            property: p.address,
            phase: m.phase,
            dueDate: m.dueDate,
            status: m.status,
          })
        }
      })
    }
  })

  milestones.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  return milestones.slice(0, 5)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface KPICardProps {
  label: string
  value: string
  delta: number
  icon: React.ReactNode
  accentColor: string
}

function KPICard({ label, value, delta, icon, accentColor }: KPICardProps) {
  const isPositive = delta >= 0
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-800 p-5 shadow-lg">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <div className="mt-1 flex items-center gap-1">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            )}
            <span
              className={`text-xs font-medium ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatPercent(Math.abs(delta))}
            </span>
            <span className="text-xs text-slate-500">vs target</span>
          </div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Not Started': 'bg-slate-600 text-slate-300',
    'In Progress': 'bg-cyan-900/60 text-cyan-300',
    Delayed: 'bg-red-900/60 text-red-300',
    Completed: 'bg-emerald-900/60 text-emerald-300',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] ?? 'bg-slate-600 text-slate-300'
      }`}
    >
      {status}
    </span>
  )
}

// Custom tooltip for the revenue chart
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 shadow-xl">
      <p className="mb-1 text-sm font-semibold text-white">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-slate-300">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// Custom tooltip for the pie chart
function CostTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-white">{entry.name}</p>
      <p className="text-xs text-slate-300">{formatCurrency(entry.value)}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardView() {
  const kpis = computeKPIs()
  const revenueData = getRevenueProjectionData()
  const pipelineData = getPipelineCounts()
  const costData = getCostBreakdownData()
  const milestones = getUpcomingMilestones()
  const costTotal = costData.reduce((s, d) => s + d.value, 0)

  const kpiCards: KPICardProps[] = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(kpis.totalPortfolioValue),
      delta: 12.5,
      icon: <DollarSign className="h-5 w-5 text-teal-400" />,
      accentColor: '#2dd4bf',
    },
    {
      label: 'Active Projects',
      value: String(kpis.activeProjects),
      delta: 0,
      icon: <Home className="h-5 w-5 text-cyan-400" />,
      accentColor: '#22d3ee',
    },
    {
      label: 'Projected Profit',
      value: formatCurrency(kpis.projectedProfit),
      delta: 8.3,
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
      accentColor: '#34d399',
    },
    {
      label: 'Avg ROI',
      value: formatPercent(kpis.avgROI),
      delta: kpis.avgROI > 20 ? 5.0 : -2.1,
      icon: <Target className="h-5 w-5 text-amber-400" />,
      accentColor: '#fbbf24',
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(kpis.pipelineValue),
      delta: -4.2,
      icon: <Users className="h-5 w-5 text-violet-400" />,
      accentColor: '#a78bfa',
    },
    {
      label: 'YTD Cash Deployed',
      value: formatCurrency(kpis.ytdCashDeployed),
      delta: 15.0,
      icon: <Calendar className="h-5 w-5 text-orange-400" />,
      accentColor: '#fb923c',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Horizon Peak Capital &mdash; Real Estate Investment Overview
        </p>
      </div>

      {/* ====== 1. KPI Cards Row ====== */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* ====== 2 & 6. Revenue Projection + Cost Breakdown ====== */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Projection Chart */}
        <div className="col-span-1 rounded-xl bg-slate-800 p-6 shadow-lg lg:col-span-2">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Revenue Projections (5-Year)
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Annual revenue targets and projected profit from business plan
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    `$${(v / 1000000).toFixed(1)}M`
                  }
                />
                <Tooltip content={<RevenueTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#22d3ee"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown Pie Chart */}
        <div className="col-span-1 rounded-xl bg-slate-800 p-6 shadow-lg">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Cost Breakdown
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Average per-property build costs
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {costData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CostTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {costData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{
                    backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                  }}
                />
                <span className="truncate text-xs text-slate-400">
                  {item.name}
                </span>
                <span className="ml-auto text-xs font-medium text-slate-300">
                  {((item.value / costTotal) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== 3. Property Pipeline ====== */}
      <div className="mb-8 rounded-xl bg-slate-800 p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold text-white">
          Property Pipeline
        </h2>
        <p className="mb-5 text-xs text-slate-400">
          Current status distribution across the portfolio
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {pipelineData.map((item, idx) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="flex min-w-[120px] items-center justify-between rounded-lg px-4 py-2.5"
                style={{
                  backgroundColor: `${STATUS_COLORS[item.status]}18`,
                  border: `1px solid ${STATUS_COLORS[item.status]}40`,
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: STATUS_COLORS[item.status] }}
                >
                  {item.status}
                </span>
                <span
                  className="ml-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                >
                  {item.count}
                </span>
              </div>
              {idx < pipelineData.length - 1 && (
                <svg
                  className="h-4 w-4 flex-shrink-0 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ====== 4 & 5. Goal Tracker + Milestones ====== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Goal Tracker */}
        <div className="rounded-xl bg-slate-800 p-6 shadow-lg">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Goal Tracker
          </h2>
          <p className="mb-5 text-xs text-slate-400">
            Progress toward strategic targets
          </p>
          <div className="space-y-5">
            {goals.map((goal) => {
              const pct =
                goal.target > 0
                  ? Math.min((goal.current / goal.target) * 100, 100)
                  : 0
              const barColor =
                CATEGORY_COLORS[goal.category] ?? '#06b6d4'
              return (
                <div key={goal.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {goal.name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${barColor}20`,
                          color: barColor,
                        }}
                      >
                        {goal.category}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-300">
                      {formatPercent(pct)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {goal.unit === 'USD'
                        ? `${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}`
                        : `${goal.current} / ${goal.target} ${goal.unit}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="rounded-xl bg-slate-800 p-6 shadow-lg">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Upcoming Milestones
          </h2>
          <p className="mb-5 text-xs text-slate-400">
            Next deadlines across all active properties
          </p>
          {milestones.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No upcoming milestones
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Milestone</th>
                    <th className="pb-3 pr-4 font-medium">Property</th>
                    <th className="pb-3 pr-4 font-medium">Due</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {milestones.map((m, idx) => {
                    const dueDate = new Date(m.dueDate)
                    const now = new Date()
                    const daysUntil = Math.ceil(
                      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <tr key={`${m.name}-${idx}`}>
                        <td className="py-3 pr-4">
                          <div className="text-sm font-medium text-white">
                            {m.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {m.phase}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-300">
                          {m.property}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-xs text-slate-300">
                            {dueDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div
                            className={`text-[10px] ${
                              daysUntil < 0
                                ? 'text-red-400'
                                : daysUntil <= 14
                                  ? 'text-amber-400'
                                  : 'text-slate-500'
                            }`}
                          >
                            {daysUntil < 0
                              ? `${Math.abs(daysUntil)}d overdue`
                              : daysUntil === 0
                                ? 'Today'
                                : `${daysUntil}d away`}
                          </div>
                        </td>
                        <td className="py-3">
                          <MilestoneStatusBadge status={m.status} />
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
    </div>
  )
}
