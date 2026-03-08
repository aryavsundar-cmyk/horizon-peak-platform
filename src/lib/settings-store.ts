// Client-side settings stored in localStorage
// API key is only sent via headers to server routes, never persisted server-side

export interface AppSettings {
  rapidApiKey: string | null
  rentCastApiKey: string | null
  enabledSources: ('zillow' | 'redfin' | 'realtor')[]
  searchResultsLimit: number
  cacheExpiryMinutes: number
}

const SETTINGS_KEY = 'horizon-peak-settings'

const DEFAULT_SETTINGS: AppSettings = {
  rapidApiKey: null,
  rentCastApiKey: null,
  enabledSources: ['zillow', 'redfin', 'realtor'],
  searchResultsLimit: 50,
  cacheExpiryMinutes: 30,
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(partial: Partial<AppSettings>): void {
  if (typeof window === 'undefined') return
  const current = getSettings()
  const updated = { ...current, ...partial }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
}

export function hasApiKey(): boolean {
  return !!getSettings().rapidApiKey
}
