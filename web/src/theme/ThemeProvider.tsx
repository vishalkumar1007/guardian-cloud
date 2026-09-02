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
  THEME_POLL_MS,
  applyThemeTokens,
  presetForScheme,
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
  if (!local || local === remote.colorScheme) return remote
  return { ...presetForScheme(local), version: remote.version, updatedAt: remote.updatedAt }
}

function mapTheme(data: {
  ink: string
  ink_soft: string
  mist: string
  mist_deep: string
  signal: string
  signal_soft: string
  alert: string
  atmosphere_mode: string
  color_scheme?: string
  version: number
  updated_at?: string
}): PlatformTheme {
  const colorScheme: ColorScheme = data.color_scheme === 'light' ? 'light' : 'dark'
  return {
    ink: data.ink,
    inkSoft: data.ink_soft,
    mist: data.mist,
    mistDeep: data.mist_deep,
    signal: data.signal,
    signalSoft: data.signal_soft,
    alert: data.alert,
    atmosphereMode: data.atmosphere_mode,
    colorScheme,
    version: data.version,
    updatedAt: data.updated_at,
  }
}

async function fetchTheme(): Promise<PlatformTheme> {
  const res = await fetch(`${apiBase()}/api/v1/platform/theme`)
  if (!res.ok) throw new Error(`theme fetch failed (${res.status})`)
  return mapTheme(await res.json())
}

async function putTheme(tokens: ThemeTokens): Promise<PlatformTheme> {
  const res = await fetch(`${apiBase()}/api/v1/platform/theme`, {
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
      signal: tokens.signal,
      signal_soft: tokens.signalSoft,
      alert: tokens.alert,
      atmosphere_mode: tokens.atmosphereMode,
      color_scheme: tokens.colorScheme,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `theme save failed (${res.status})`)
  }
  return fetchTheme()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PlatformTheme>({
    ...WATCHLINE_DEFAULTS,
    version: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const versionRef = useRef(0)

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
      const next = withLocalScheme(remote)
      applyThemeTokens(next)
      versionRef.current = remote.version
      setTheme(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'theme unavailable')
      const local = readLocalScheme()
      const fallback = local ? presetForScheme(local) : WATCHLINE_DEFAULTS
      applyThemeTokens(fallback)
      setTheme({ ...fallback, version: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (tokens: ThemeTokens) => {
    const next = await putTheme(tokens)
    try {
      localStorage.setItem(SCHEME_KEY, tokens.colorScheme)
    } catch {
      /* ignore */
    }
    applyThemeTokens(next)
    versionRef.current = next.version
    setTheme(next)
    setError(null)
  }, [])

  const resetDefaults = useCallback(async () => {
    await save(WATCHLINE_DEFAULTS)
  }, [save])

  const applySchemePreset = useCallback(
    (scheme: ColorScheme) => {
      try {
        localStorage.setItem(SCHEME_KEY, scheme)
      } catch {
        /* ignore */
      }
      applyLocal(presetForScheme(scheme), theme.version)
    },
    [applyLocal, theme.version],
  )

  const toggleColorMode = useCallback(() => {
    const next: ColorScheme = theme.colorScheme === 'dark' ? 'light' : 'dark'
    applySchemePreset(next)
  }, [theme.colorScheme, applySchemePreset])

  useEffect(() => {
    const local = readLocalScheme()
    applyThemeTokens(local ? presetForScheme(local) : WATCHLINE_DEFAULTS)
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
