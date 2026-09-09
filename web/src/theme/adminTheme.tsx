import { API_BASE_URL } from '../lib/apiClient'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { WATCHLINE_DEFAULTS, applySchemeToThemePreserve, themePackToTokens, THEME_PACKS, softAccent, type ColorScheme, type ThemeTokens } from './tokens'
import { getSuperAdminAuthHeaders } from './session'
import { useAuth } from '../auth/AuthProvider'

const EVENT = 'guardian-admin-theme'

export type AdminTheme = ThemeTokens | null
export type DashboardThemeMode = 'follow_brand' | 'personal'

type DashboardThemeResponse = {
  mode: DashboardThemeMode
  theme: ThemeTokens | null
}

function apiBase() {
  // Shared with the rest of the app: same-origin by default so session
  // cookies stay first-party. See lib/apiClient.
  return API_BASE_URL
}

function getAuthHeaders(): Record<string, string> {
  return getSuperAdminAuthHeaders()
}

function isThemeTokens(v: unknown): v is ThemeTokens {
  if (!v || typeof v !== 'object') return false
  const t = v as Record<string, unknown>
  return (t.colorScheme === 'light' || t.colorScheme === 'dark') && typeof t.accent === 'string' && !!t.accent
}

function parseDashboardResponse(res: any): DashboardThemeResponse {
  if (!res || typeof res !== 'object') {
    return { mode: 'follow_brand', theme: null }
  }
  if (res.mode === 'follow_brand') {
    return { mode: 'follow_brand', theme: null }
  }
  if (res.mode === 'personal' && isThemeTokens(res.theme)) {
    return { mode: 'personal', theme: res.theme }
  }
  if (isThemeTokens(res)) {
    return { mode: 'personal', theme: res as ThemeTokens }
  }
  return { mode: 'follow_brand', theme: null }
}

async function fetchDashboardTheme(): Promise<DashboardThemeResponse> {
  try {
    const headers = { ...getAuthHeaders() }
    const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { credentials: 'include', headers })
    if (res.status === 401) return { mode: 'follow_brand', theme: null }
    if (!res.ok) return { mode: 'follow_brand', theme: null }
    return parseDashboardResponse(await res.json())
  } catch {
    return { mode: 'follow_brand', theme: null }
  }
}

async function putDashboardTheme(tokens: ThemeTokens): Promise<DashboardThemeResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders() }
  const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { credentials: 'include',
    method: 'PUT',
    headers,
    body: JSON.stringify(tokens),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `failed to save dashboard theme (${res.status})`)
  }
  return parseDashboardResponse(await res.json())
}

async function deleteDashboardTheme(): Promise<DashboardThemeResponse> {
  const headers = { ...getAuthHeaders() }
  const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { credentials: 'include', method: 'DELETE', headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `failed to clear dashboard theme (${res.status})`)
  }
  return parseDashboardResponse(await res.json())
}

function purgeLegacyLocalCache() {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k === 'guardian-admin-theme' || k.startsWith('guardian-admin-theme:'))) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {}
}

type Ctx = {
  adminTheme: AdminTheme
  mode: DashboardThemeMode
  loading: boolean
  saving: boolean
  error: string | null
  clearError: () => void
  setAdminTheme: (t: ThemeTokens | null) => void
  handlePack: (id: string) => void
  handleScheme: (s: ColorScheme) => void
  handleAccent: (accent: string, accent2?: string) => void
  clear: () => void
  isPersonal: boolean
  refresh: () => Promise<void>
}

const AdminThemeCtx = createContext<Ctx | null>(null)

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const authUserId = useAuth().user?.id ?? null
  const [adminTheme, setState] = useState<AdminTheme>(null)
  const [mode, setMode] = useState<DashboardThemeMode>('follow_brand')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const snapshotRef = useRef<{ mode: DashboardThemeMode; theme: AdminTheme }>({
    mode: 'follow_brand',
    theme: null,
  })

  const applyResponse = useCallback((parsed: DashboardThemeResponse) => {
    setMode(parsed.mode)
    const theme = parsed.mode === 'personal' ? parsed.theme : null
    setState(theme)
    snapshotRef.current = { mode: parsed.mode, theme }
  }, [])

  const revertOptimistic = useCallback(() => {
    const snap = snapshotRef.current
    setMode(snap.mode)
    setState(snap.theme)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const refresh = useCallback(async () => {
    try {
      const headers = { ...getAuthHeaders() }
      const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { credentials: 'include', headers })
      if (!res.ok) return
      applyResponse(parseDashboardResponse(await res.json()))
    } catch {
      // keep last known state while offline
    }
  }, [applyResponse])

  // Keyed on the signed-in account: these preferences are per-user, and at first
  // mount there is usually no session yet, so this has to re-run once the user
  // signs in — and again if a different person signs in after them.
  useEffect(() => {
    purgeLegacyLocalCache()
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const parsed = await fetchDashboardTheme()
        if (!cancelled) applyResponse(parsed)
      } catch {
        if (!cancelled) applyResponse({ mode: 'follow_brand', theme: null })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    const onEvent = () => { void refresh() }
    window.addEventListener(EVENT as any, onEvent as any)
    return () => {
      cancelled = true
      window.removeEventListener(EVENT as any, onEvent as any)
    }
  }, [applyResponse, refresh, authUserId])

  const persistPersonal = useCallback(async (t: ThemeTokens) => {
    setSaving(true)
    setError(null)
    setMode('personal')
    setState(t)
    try {
      const parsed = await putDashboardTheme(t)
      applyResponse(parsed)
      window.dispatchEvent(new CustomEvent(EVENT))
    } catch (err) {
      revertOptimistic()
      setError(err instanceof Error ? err.message : 'Failed to save personal theme')
    } finally {
      setSaving(false)
    }
  }, [applyResponse, revertOptimistic])

  const setAdminTheme = useCallback((t: ThemeTokens | null) => {
    if (!t) {
      setSaving(true)
      setError(null)
      setMode('follow_brand')
      setState(null)
      void (async () => {
        try {
          const parsed = await deleteDashboardTheme()
          applyResponse(parsed)
          window.dispatchEvent(new CustomEvent(EVENT))
        } catch (err) {
          revertOptimistic()
          setError(err instanceof Error ? err.message : 'Failed to follow Brand Studio')
        } finally {
          setSaving(false)
        }
      })()
      return
    }
    void persistPersonal(t)
  }, [applyResponse, persistPersonal, revertOptimistic])

  const handlePack = useCallback((id: string) => {
    const p = THEME_PACKS.find((x) => x.id === id)
    if (!p) return
    void persistPersonal(themePackToTokens(p))
  }, [persistPersonal])

  const handleScheme = useCallback((s: ColorScheme) => {
    const base: ThemeTokens = snapshotRef.current.theme ?? adminTheme ?? WATCHLINE_DEFAULTS
    if (s === base.colorScheme && mode === 'personal') return
    const n = applySchemeToThemePreserve(base, s)
    void persistPersonal(n)
  }, [adminTheme, mode, persistPersonal])

  const handleAccent = useCallback((accent: string, accent2?: string) => {
    const base: ThemeTokens = snapshotRef.current.theme ?? adminTheme ?? WATCHLINE_DEFAULTS
    const n: ThemeTokens = {
      ...base,
      accent,
      accent2: accent2 || accent,
      signal: accent,
      signalSoft: softAccent(accent, base.colorScheme),
    }
    void persistPersonal(n)
  }, [adminTheme, persistPersonal])

  const clear = useCallback(() => {
    setAdminTheme(null)
  }, [setAdminTheme])

  const value = useMemo(
    () => ({
      adminTheme,
      mode,
      loading,
      saving,
      error,
      clearError,
      setAdminTheme,
      handlePack,
      handleScheme,
      handleAccent,
      clear,
      isPersonal: mode === 'personal' && !!adminTheme,
      refresh,
    }),
    [
      adminTheme,
      mode,
      loading,
      saving,
      error,
      clearError,
      setAdminTheme,
      handlePack,
      handleScheme,
      handleAccent,
      clear,
      refresh,
    ],
  )

  return <AdminThemeCtx.Provider value={value}>{children}</AdminThemeCtx.Provider>
}

export function useAdminTheme() {
  const c = useContext(AdminThemeCtx)
  if (!c) throw new Error('useAdminTheme must be within AdminThemeProvider')
  return c
}
