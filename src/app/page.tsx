'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  LayoutDashboard,
  Search,
  Calculator,
  FolderKanban,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mountain,
  Bell,
  User,
  HelpCircle,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  Key,
  AlertCircle,
} from 'lucide-react'
import { AppContext, SAMPLE_PROPERTIES, SAMPLE_DEALS, SAMPLE_GOALS } from '../data/store'
import type { Property, Deal, Goal } from '../data/store'
import { getSettings, saveSettings, type AppSettings } from '../lib/settings-store'
import DashboardView from '../components/dashboard/DashboardView'
import DealFinder from '../components/deals/DealFinder'
import CalculatorSuite from '../components/calculators/CalculatorSuite'
import ProjectManager from '../components/projects/ProjectManager'
import MarketAnalysis from '../components/market/MarketAnalysis'

type ViewId = 'dashboard' | 'deals' | 'calculators' | 'projects' | 'market' | 'settings'

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard; section: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { id: 'deals', label: 'Deal Finder', icon: Search, section: 'Acquisition' },
  { id: 'market', label: 'Market Analysis', icon: BarChart3, section: 'Acquisition' },
  { id: 'calculators', label: 'Calculators', icon: Calculator, section: 'Analysis' },
  { id: 'projects', label: 'Project Manager', icon: FolderKanban, section: 'Operations' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
]

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [properties, setProperties] = useState<Property[]>(SAMPLE_PROPERTIES)
  const [deals, setDeals] = useState<Deal[]>(SAMPLE_DEALS)
  const [goals, setGoals] = useState<Goal[]>(SAMPLE_GOALS)

  const grouped = useMemo(() => {
    const map: Record<string, typeof NAV_ITEMS> = {}
    NAV_ITEMS.forEach(item => {
      if (!map[item.section]) map[item.section] = []
      map[item.section].push(item)
    })
    return map
  }, [])

  return (
    <AppContext.Provider value={{ properties, deals, goals, setProperties, setDeals, setGoals }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-screen bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 z-50 ${
            sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
              <Mountain className="w-5 h-5 text-slate-900" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white tracking-wide leading-tight">Horizon Peak</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Capital LLC</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {Object.entries(grouped).map(([section, items]) => (
              <div key={section} className="mb-4">
                {!sidebarCollapsed && (
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600 font-semibold px-2 mb-2">
                    {section}
                  </p>
                )}
                {items.map(item => {
                  const Icon = item.icon
                  const isActive = activeView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 shadow-sm shadow-teal-500/10 border border-teal-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-teal-400' : ''}`} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-800 p-3">
            {!sidebarCollapsed && (
              <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/5 border border-teal-500/20 rounded-lg p-3 mb-3">
                <p className="text-[11px] text-teal-300 font-semibold mb-1">Conashaugh Lakes, PA</p>
                <p className="text-[10px] text-slate-400">Pike County | Dingman Twp</p>
                <p className="text-[10px] text-slate-500 mt-1">1 Active Project</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors text-xs"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'
          }`}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {NAV_ITEMS.find(n => n.id === activeView)?.label}
              </h2>
              <p className="text-xs text-slate-500">
                {activeView === 'dashboard' && 'Portfolio overview and key performance indicators'}
                {activeView === 'deals' && 'Search and analyze deals nationwide'}
                {activeView === 'calculators' && 'Construction, rental, flip, wholesale & BRRRR calculators'}
                {activeView === 'projects' && 'Manage properties, vendors, milestones & budgets'}
                {activeView === 'market' && 'Market data, restrictions, and econometric analysis'}
                {activeView === 'settings' && 'Application settings and preferences'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-900">
                HP
              </div>
            </div>
          </header>

          {/* View Content */}
          <main className="p-6">
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'deals' && <DealFinder />}
            {activeView === 'calculators' && <CalculatorSuite />}
            {activeView === 'projects' && <ProjectManager />}
            {activeView === 'market' && <MarketAnalysis />}
            {activeView === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  )
}

function SettingsView() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [enabledSources, setEnabledSources] = useState<AppSettings['enabledSources']>(['zillow', 'redfin', 'realtor'])
  const [validating, setValidating] = useState(false)
  const [keyValid, setKeyValid] = useState<boolean | null>(null)

  useEffect(() => {
    const s = getSettings()
    if (s.rapidApiKey) setApiKey(s.rapidApiKey)
    setEnabledSources(s.enabledSources)
  }, [])

  const handleSaveKey = () => {
    saveSettings({ rapidApiKey: apiKey || null, enabledSources })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleSource = (src: 'zillow' | 'redfin' | 'realtor') => {
    setEnabledSources(prev => {
      const next = prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
      saveSettings({ enabledSources: next })
      return next
    })
  }

  const handleValidateKey = async () => {
    if (!apiKey) return
    setValidating(true)
    setKeyValid(null)
    try {
      const res = await fetch(
        `https://zillow-working-api.p.rapidapi.com/search?location=Pike+County+PA`,
        { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'zillow-working-api.p.rapidapi.com' } }
      )
      setKeyValid(res.ok || res.status === 429) // 429 means key is valid but rate limited
    } catch {
      setKeyValid(false)
    } finally {
      setValidating(false)
    }
  }

  const hasKey = !!apiKey

  const dataSources = [
    { name: 'Zillow', key: 'zillow' as const, desc: 'Zestimate, listings, and market data', api: 'Zillow Working API' },
    { name: 'Redfin', key: 'redfin' as const, desc: 'Property listings and sold comps', api: 'Redfin API' },
    { name: 'Realtor.com', key: 'realtor' as const, desc: 'Agent network and listings', api: 'US Real Estate Listings' },
  ]

  const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"

  return (
    <div className="max-w-3xl">
      {/* API Configuration */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 rounded-xl border border-teal-500/20 p-6 mb-6 shadow-lg shadow-teal-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">API Configuration</h3>
            <p className="text-xs text-slate-400">Connect to RapidAPI to search live listings from Zillow, Redfin &amp; Realtor.com</p>
          </div>
        </div>

        {/* API Key */}
        <div className="mb-5">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">RapidAPI Key</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); setKeyValid(null) }}
                placeholder="Enter your RapidAPI key..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleValidateKey}
              disabled={!apiKey || validating}
              className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 border border-slate-600 rounded-lg text-xs font-medium text-slate-300 transition-colors"
            >
              {validating ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={handleSaveKey}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Get your key at{' '}
            <a href="https://rapidapi.com/hub" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
              rapidapi.com
            </a>
            . Subscribe to the APIs listed below to enable each source.
          </p>

          {/* Status messages */}
          {saved && (
            <div className="flex items-center gap-2 mt-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> API key saved to local storage
            </div>
          )}
          {keyValid === true && (
            <div className="flex items-center gap-2 mt-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Key verified successfully
            </div>
          )}
          {keyValid === false && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" /> Key validation failed. Check your key and subscriptions.
            </div>
          )}
        </div>

        {/* Source Toggles */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">Enabled Sources</label>
          <div className="space-y-2">
            {dataSources.map(src => (
              <label key={src.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={enabledSources.includes(src.key)}
                  onChange={() => toggleSource(src.key)}
                  className="rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 w-4 h-4"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">{src.name}</span>
                  <span className="text-xs text-slate-500 ml-2">{src.desc}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  hasKey && enabledSources.includes(src.key)
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                    : 'bg-slate-700 text-slate-500 border-slate-600'
                }`}>
                  {hasKey && enabledSources.includes(src.key) ? 'Active' : 'Inactive'}
                </span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Each source requires its own RapidAPI subscription. Your single RapidAPI key works for all subscribed APIs.
          </p>
        </div>
      </div>

      {/* Company Profile */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Company Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Company Name</label>
            <input type="text" defaultValue="Horizon Peak Capital LLC" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Primary Market</label>
            <input type="text" defaultValue="Pike County, PA" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Strategy</label>
            <input type="text" defaultValue="Build-to-Sell / Build-to-Rent" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Entity Type</label>
            <input type="text" defaultValue="LLC" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Data Sources Status */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Data Sources</h3>
        {[
          { name: 'Zillow', status: hasKey && enabledSources.includes('zillow') ? 'Connected' : 'Configure Above', desc: 'Listings, Zestimate, market trends' },
          { name: 'Redfin', status: hasKey && enabledSources.includes('redfin') ? 'Connected' : 'Configure Above', desc: 'Property listings and sold comps' },
          { name: 'Realtor.com', status: hasKey && enabledSources.includes('realtor') ? 'Connected' : 'Configure Above', desc: 'Agent network and listings' },
          { name: 'URL Import', status: 'Always Available', desc: 'Paste any listing URL to import' },
          { name: 'FRED API', status: 'Available', desc: 'Federal Reserve economic data' },
          { name: 'Census Bureau', status: 'Available', desc: 'Demographics and housing stats' },
        ].map(source => (
          <div key={source.name} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
            <div>
              <p className="text-sm font-medium text-white">{source.name}</p>
              <p className="text-xs text-slate-500">{source.desc}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              source.status === 'Connected' ? 'bg-teal-500/20 text-teal-300' :
              source.status === 'Always Available' ? 'bg-emerald-500/20 text-emerald-300' :
              source.status === 'Available' ? 'bg-blue-500/20 text-blue-300' :
              'bg-slate-700 text-slate-400'
            }`}>
              {source.status}
            </span>
          </div>
        ))}
      </div>

      {/* Default Parameters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Default Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Default Interest Rate (%)</label>
            <input type="number" defaultValue="7.5" step="0.1" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Default Construction Timeline (months)</label>
            <input type="number" defaultValue="6" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Default Vacancy Rate (%)</label>
            <input type="number" defaultValue="8" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target ROI (%)</label>
            <input type="number" defaultValue="20" className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  )
}
