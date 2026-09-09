import { API_BASE_URL } from '../lib/apiClient'
import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  WATCHLINE_DEFAULTS,
  LIGHT_DEFAULTS,
  DARK_DEFAULTS,
  THEME_POLL_MS,
  applyThemeTokens,
  applySchemeToTheme,
  type ColorScheme,
  type PlatformTheme,
  type ThemeTokens,
} from './tokens'

const SCHEME_KEY = 'guardian-color-scheme'
const THEME_KEY = 'guardian-theme'
const LEGACY_SAVED_KEY = 'guardian-saved-theme'
const THEME_DB_ONLY = true

export type ThemeContextValue = {
  theme: PlatformTheme
  loading: boolean
  error: string | null
  isDark: boolean
  localScheme: ColorScheme | null
  setLocalScheme: (scheme: ColorScheme | null) => void
  applyLocal: (tokens: ThemeTokens, version?: number) => void
  refresh: () => Promise<void>
  save: (tokens: ThemeTokens) => Promise<void>
  resetDefaults: () => Promise<void>
  applySchemePreset: (scheme: ColorScheme) => void
  toggleColorMode: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function apiBase() {
  // Shared with the rest of the app: same-origin by default so session
  // cookies stay first-party. See lib/apiClient.
  return API_BASE_URL
}

function platformToken() {
  return import.meta.env.VITE_PLATFORM_DEV_TOKEN ?? 'guardian-dev-super-admin'
}

function readLocalScheme(): ColorScheme | null {
  if (THEME_DB_ONLY) return null
  try {
    const v = localStorage.getItem(SCHEME_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function readSavedTheme(): PlatformTheme | null {
  if (THEME_DB_ONLY) return null
  try {
    const raw = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_SAVED_KEY)
    if (!raw) return null
    const t = JSON.parse(raw)
    if (t && (t.colorScheme === 'light' || t.colorScheme === 'dark') && t.accent) {
      return t as PlatformTheme
    }
  } catch {}
  return null
}

function persistTheme(tokens: ThemeTokens) {
  if (THEME_DB_ONLY) return
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(tokens))
    localStorage.setItem(SCHEME_KEY, tokens.colorScheme)
  } catch {}
}

function withLocalScheme(remote: PlatformTheme): PlatformTheme {
  if (THEME_DB_ONLY) return remote
  const local = readLocalScheme()
  if (!local || local === remote.colorScheme) return remote
  const applied = applySchemeToTheme(remote, local)
  return {
    ...applied,
    version: remote.version,
    updatedAt: remote.updatedAt,
  }
}

function mapTheme(data: any): PlatformTheme {
  const remoteScheme: ColorScheme = data.color_scheme === 'light' ? 'light' : 'dark'
  const base = remoteScheme === 'light' ? { ...LIGHT_DEFAULTS } : { ...DARK_DEFAULTS }
  const accent = data.accent ?? data.signal ?? base.accent
  const accent2 = data.accent2 ?? data.accent_2 ?? base.accent2
  return {
    ink: data.ink ?? base.ink,
    inkSoft: data.ink_soft ?? base.inkSoft,
    mist: data.mist ?? base.mist,
    mistDeep: data.mist_deep ?? base.mistDeep,
    signal: data.signal ?? accent,
    signalSoft: data.signal_soft ?? base.signalSoft,
    alert: data.alert ?? base.alert,
    atmosphereMode: data.atmosphere_mode ?? base.atmosphereMode,
    colorScheme: remoteScheme,
    version: data.version ?? 0,
    updatedAt: data.updated_at,
    accent,
    accent2,
    radius: data.radius ?? base.radius,
    radiusSm: data.radius_sm ?? base.radiusSm,
    radiusLg: data.radius_lg ?? base.radiusLg,
    fontDisplay: data.font_display ?? base.fontDisplay,
    fontBody: data.font_body ?? base.fontBody,
  } as PlatformTheme
}

async function fetchTheme(): Promise<PlatformTheme> {
  const res = await fetch(`${apiBase()}/api/v1/platform/theme`, { credentials: 'include' })
  if (!res.ok) throw new Error(`theme fetch failed (${res.status})`)
  return mapTheme(await res.json())
}

async function putTheme(tokens: ThemeTokens): Promise<PlatformTheme> {
  const accent = tokens.accent || tokens.signal || '#6366f1'
  const accent2 = tokens.accent2 || accent
  const signalSoft = tokens.signalSoft || (tokens.colorScheme === 'dark' ? 'rgba(129,140,248,0.15)' : '#e0e7ff')
  const normalized: ThemeTokens = { ...tokens, accent, accent2, signal: tokens.signal || accent, signalSoft }
  persistTheme(normalized)
  const res = await fetch(`${apiBase()}/api/v1/platform/theme`, { credentials: 'include',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${platformToken()}`,
    },
    body: JSON.stringify({
      ink: tokens.ink,
      ink_soft: tokens.inkSoft,
      mist: tokens.mist,
      mist_deep: tokens.mistDeep,
      signal: tokens.signal || accent,
      signal_soft: signalSoft,
      alert: tokens.alert,
      atmosphere_mode: tokens.atmosphereMode || (tokens.colorScheme === 'dark' ? 'void' : 'mist'),
      color_scheme: tokens.colorScheme,
      accent,
      accent2,
      radius: tokens.radius,
      radius_sm: tokens.radiusSm,
      radius_lg: tokens.radiusLg,
      font_display: tokens.fontDisplay,
      font_body: tokens.fontBody,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Failed to save theme to backend:', body)
    throw new Error(body || `theme save failed (${res.status})`)
  }
  return fetchTheme()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initialTheme = useMemo(() => {
    const saved = readSavedTheme()
    if (saved) {
      const local = readLocalScheme()
      const target = local || saved.colorScheme
      if (target !== saved.colorScheme) return { ...applySchemeToTheme(saved, target), version: (saved as PlatformTheme).version ?? 0 }
      return { ...saved, version: (saved as PlatformTheme).version ?? 0 } as PlatformTheme
    }
    const local = readLocalScheme()
    const target = local || WATCHLINE_DEFAULTS.colorScheme
    return {
      ...applySchemeToTheme(WATCHLINE_DEFAULTS, target),
      version: 0,
    }
  }, [])

  const [theme, setTheme] = useState<PlatformTheme>(initialTheme)
  const [localScheme, setLocalSchemeState] = useState<ColorScheme | null>(readLocalScheme)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const versionRef = useRef(initialTheme.version)
  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  const setLocalScheme = useCallback((scheme: ColorScheme | null) => {
    if (!THEME_DB_ONLY) {
      try {
        if (scheme) {
          localStorage.setItem(SCHEME_KEY, scheme)
        } else {
          localStorage.removeItem(SCHEME_KEY)
          const saved = readSavedTheme()
          if (saved) localStorage.setItem(SCHEME_KEY, saved.colorScheme)
        }
      } catch {}
    }
    const nextScheme = scheme || (!THEME_DB_ONLY ? readSavedTheme()?.colorScheme : null) || null
    setLocalSchemeState(scheme)
    setTheme((prev) => {
      const target = scheme || prev.colorScheme || 'dark'
      const next = applySchemeToTheme(prev, target)
      applyThemeTokens(next)
      persistTheme(next)
      return { ...next, version: prev.version, updatedAt: prev.updatedAt }
    })
    if (scheme === null && nextScheme) setLocalSchemeState(nextScheme as ColorScheme | null)
  }, [])

  const applyLocal = useCallback((tokens: ThemeTokens, version?: number) => {
    // Force so Brand Studio edits paint when Following Brand (dashboard owns doc).
    // No-op on document while Enable Custom — personalDashboardOwnsTheme blocks Brand paints.
    applyThemeTokens(tokens, { force: true })
    persistTheme(tokens)
    if (!THEME_DB_ONLY) {
      try {
        localStorage.setItem(SCHEME_KEY, tokens.colorScheme)
        setLocalSchemeState(tokens.colorScheme)
      } catch {}
    } else {
      setLocalSchemeState(tokens.colorScheme)
    }
    setTheme((prev) => ({
      ...tokens,
      version: version ?? prev.version,
      updatedAt: prev.updatedAt,
    }))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const remote = await fetchTheme()
      const effective = withLocalScheme(remote)
      applyThemeTokens(effective)
      persistTheme(effective)
      if (!THEME_DB_ONLY) {
        try {
          localStorage.setItem(SCHEME_KEY, effective.colorScheme)
          setLocalSchemeState(readLocalScheme())
        } catch {}
      } else {
        setLocalSchemeState(effective.colorScheme)
      }
      versionRef.current = effective.version
      setTheme(effective)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'theme unavailable')
      if (THEME_DB_ONLY) {
        const fallback = WATCHLINE_DEFAULTS
        applyThemeTokens(fallback as PlatformTheme)
        setTheme({ ...(fallback as PlatformTheme), version: versionRef.current } as PlatformTheme)
      } else {
        const saved = readSavedTheme()
        if (saved) {
          const local = readLocalScheme()
          const fallback = local && local !== saved.colorScheme ? applySchemeToTheme(saved, local) : saved
          applyThemeTokens(fallback as PlatformTheme)
          setTheme({ ...(fallback as PlatformTheme), version: versionRef.current } as PlatformTheme)
        } else {
          const local = readLocalScheme() || 'dark'
          const fallback = applySchemeToTheme(WATCHLINE_DEFAULTS, local)
          applyThemeTokens(fallback)
          setTheme({ ...fallback, version: 0 })
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (tokens: ThemeTokens) => {
    const next = await putTheme(tokens)
    const effective = withLocalScheme(next)
    applyThemeTokens(effective)
    persistTheme(effective)
    versionRef.current = effective.version
    setTheme(effective)
    if (!THEME_DB_ONLY) setLocalSchemeState(readLocalScheme())
    else setLocalSchemeState(effective.colorScheme)
    setError(null)
  }, [])

  const resetDefaults = useCallback(async () => {
    if (!THEME_DB_ONLY) {
      try {
        localStorage.removeItem(SCHEME_KEY)
        localStorage.removeItem(THEME_KEY)
        localStorage.removeItem(LEGACY_SAVED_KEY)
      } catch {}
    }
    setLocalSchemeState(null)
    await save(WATCHLINE_DEFAULTS)
  }, [save])

  const applySchemePreset = useCallback(
    (scheme: ColorScheme) => {
      setTheme((prev) => {
        const next = applySchemeToTheme(prev, scheme)
        applyThemeTokens(next)
        persistTheme(next)
        if (!THEME_DB_ONLY) {
          try {
            localStorage.setItem(SCHEME_KEY, scheme)
          } catch {}
        }
        setLocalSchemeState(scheme)
        return { ...next, version: prev.version, updatedAt: prev.updatedAt }
      })
    },
    [],
  )

  const toggleColorMode = useCallback(() => {
    setTheme((prev) => {
      const nextScheme: ColorScheme = prev.colorScheme === 'dark' ? 'light' : 'dark'
      if (!THEME_DB_ONLY) {
        try {
          localStorage.setItem(SCHEME_KEY, nextScheme)
        } catch {}
      }
      setLocalSchemeState(nextScheme)
      const nextTheme = applySchemeToTheme(prev, nextScheme)
      applyThemeTokens(nextTheme)
      persistTheme(nextTheme)
      return { ...nextTheme, version: prev.version, updatedAt: prev.updatedAt }
    })
  }, [])

  useEffect(() => {
    if (THEME_DB_ONLY) return
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SCHEME_KEY || e.key === THEME_KEY || e.key === LEGACY_SAVED_KEY) {
        const val = readLocalScheme()
        setLocalSchemeState(val)
        const saved = readSavedTheme()
        if (saved) {
          const target = val || saved.colorScheme
          const next = target !== saved.colorScheme ? applySchemeToTheme(saved, target) : saved
          applyThemeTokens(next as PlatformTheme)
          setTheme((prev) => ({ ...(next as PlatformTheme), version: prev.version } as PlatformTheme))
        } else {
          setTheme((prev) => {
            const target = val || prev.colorScheme || 'dark'
            const next = applySchemeToTheme(prev, target)
            applyThemeTokens(next)
            return { ...next, version: prev.version, updatedAt: prev.updatedAt }
          })
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    applyThemeTokens(theme)
    void refresh()

    let cancelled = false
    let timer: number | null = null
    let delay = THEME_POLL_MS
    const maxDelay = 60_000

    const schedule = () => {
      if (cancelled) return
      timer = window.setTimeout(() => {
        void (async () => {
          try {
            const remote = await fetchTheme()
            delay = THEME_POLL_MS
            if (remote.version !== versionRef.current) {
              versionRef.current = remote.version
              const next = withLocalScheme(remote)
              applyThemeTokens(next)
              persistTheme(next)
              setTheme(next)
              setError(null)
            }
          } catch {
            delay = Math.min(maxDelay, Math.max(THEME_POLL_MS, delay * 2))
          } finally {
            schedule()
          }
        })()
      }, delay)
    }
    schedule()

    return () => {
      cancelled = true
      if (timer != null) window.clearTimeout(timer)
    }
  }, [])

  const value = useMemo(
    () => ({
      theme,
      loading,
      error,
      isDark: theme.colorScheme === 'dark',
      localScheme,
      setLocalScheme,
      applyLocal,
      refresh,
      save,
      resetDefaults,
      applySchemePreset,
      toggleColorMode,
    }),
    [
      theme,
      loading,
      error,
      localScheme,
      setLocalScheme,
      applyLocal,
      refresh,
      save,
      resetDefaults,
      applySchemePreset,
      toggleColorMode,
    ],
  )

  return createElement(ThemeContext.Provider, { value }, children)
}
