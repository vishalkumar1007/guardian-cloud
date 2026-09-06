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
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

function platformToken() {
  return import.meta.env.VITE_PLATFORM_DEV_TOKEN ?? 'guardian-dev-super-admin'
}

function readLocalScheme(): ColorScheme | null {
  try {
    const v = localStorage.getItem(SCHEME_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function withLocalScheme(remote: PlatformTheme): PlatformTheme {
  const local = readLocalScheme()
  const target = local || remote.colorScheme || 'dark'
  const applied = applySchemeToTheme(remote, target)
  return {
    ...applied,
    version: remote.version,
    updatedAt: remote.updatedAt,
  }
}

function mapTheme(data: any): PlatformTheme {
  const remoteScheme: ColorScheme = data.color_scheme === 'light' ? 'light' : 'dark'
  const local = readLocalScheme()
  const colorScheme: ColorScheme = local ?? remoteScheme
  const base = colorScheme === 'light' ? { ...LIGHT_DEFAULTS } : { ...DARK_DEFAULTS }
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
    colorScheme,
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
  const res = await fetch(`${apiBase()}/api/v1/platform/theme`)
  if (!res.ok) throw new Error(`theme fetch failed (${res.status})`)
  return mapTheme(await res.json())
}

async function putTheme(tokens: ThemeTokens): Promise<PlatformTheme> {
  // Ensure the tokens being persisted match the scheme's background & text rules
  const normalized = applySchemeToTheme(tokens, tokens.colorScheme)
  const res = await fetch(`${apiBase()}/api/v1/platform/theme`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${platformToken()}`,
    },
    body: JSON.stringify({
      ink: normalized.ink,
      ink_soft: normalized.inkSoft,
      mist: normalized.mist,
      mist_deep: normalized.mistDeep,
      signal: normalized.signal,
      signal_soft: normalized.signalSoft,
      alert: normalized.alert,
      atmosphere_mode: normalized.atmosphereMode,
      color_scheme: normalized.colorScheme,
      accent: normalized.accent ?? normalized.signal,
      accent2: normalized.accent2 ?? normalized.signal,
      radius: normalized.radius,
      radius_sm: normalized.radiusSm,
      radius_lg: normalized.radiusLg,
      font_display: normalized.fontDisplay,
      font_body: normalized.fontBody,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `theme save failed (${res.status})`)
  }
  return fetchTheme()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initialTheme = useMemo(() => {
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
  const versionRef = useRef(0)

  const setLocalScheme = useCallback((scheme: ColorScheme | null) => {
    try {
      if (scheme) {
        localStorage.setItem(SCHEME_KEY, scheme)
      } else {
        localStorage.removeItem(SCHEME_KEY)
      }
    } catch {}
    setLocalSchemeState(scheme)
    setTheme((prev) => {
      const target = scheme || prev.colorScheme || 'dark'
      const next = applySchemeToTheme(prev, target)
      applyThemeTokens(next)
      return { ...next, version: prev.version, updatedAt: prev.updatedAt }
    })
  }, [])

  const applyLocal = useCallback((tokens: ThemeTokens, version?: number) => {
    applyThemeTokens(tokens)
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
      versionRef.current = effective.version
      setTheme(effective)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'theme unavailable')
      const local = readLocalScheme() || 'dark'
      const fallback = applySchemeToTheme(WATCHLINE_DEFAULTS, local)
      applyThemeTokens(fallback)
      setTheme({ ...fallback, version: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (tokens: ThemeTokens) => {
    const next = await putTheme(tokens)
    const effective = withLocalScheme(next)
    applyThemeTokens(effective)
    versionRef.current = effective.version
    setTheme(effective)
    setError(null)
  }, [])

  const resetDefaults = useCallback(async () => {
    await save(WATCHLINE_DEFAULTS)
  }, [save])

  const applySchemePreset = useCallback(
    (scheme: ColorScheme) => {
      try {
        localStorage.setItem(SCHEME_KEY, scheme)
      } catch {}
      setLocalSchemeState(scheme)
      const next = applySchemeToTheme(theme, scheme)
      applyLocal(next, theme.version)
    },
    [applyLocal, theme],
  )

  const toggleColorMode = useCallback(() => {
    const next: ColorScheme = theme.colorScheme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(SCHEME_KEY, next)
    } catch {}
    setLocalSchemeState(next)
    const nextTheme = applySchemeToTheme(theme, next)
    applyLocal(nextTheme, theme.version)
  }, [theme, applyLocal])

  // Sync when localStorage is modified externally or in another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SCHEME_KEY) {
        const val = e.newValue === 'light' || e.newValue === 'dark' ? (e.newValue as ColorScheme) : null
        setLocalSchemeState(val)
        setTheme((prev) => {
          const target = val || prev.colorScheme || 'dark'
          const next = applySchemeToTheme(prev, target)
          applyThemeTokens(next)
          return { ...next, version: prev.version, updatedAt: prev.updatedAt }
        })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    applyThemeTokens(theme)
    void refresh()
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const remote = await fetchTheme()
          if (remote.version === versionRef.current) return
          versionRef.current = remote.version
          const next = withLocalScheme(remote)
          applyThemeTokens(next)
          setTheme(next)
          setError(null)
        } catch {
          /* keep last good theme while offline */
        }
      })()
    }, THEME_POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

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
