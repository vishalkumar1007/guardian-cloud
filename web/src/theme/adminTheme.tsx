import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { WATCHLINE_DEFAULTS, applySchemeToThemePreserve, themePackToTokens, THEME_PACKS, softAccent, type ColorScheme, type ThemeTokens } from './tokens'
import { ensureSessionUserId, getSuperAdminAuthHeaders } from './session'

const EVENT = 'guardian-admin-theme'

export type AdminTheme = ThemeTokens | null
export type DashboardThemeMode = 'follow_brand' | 'personal'

type DashboardThemeResponse = {
  mode: DashboardThemeMode
  theme: ThemeTokens | null
}

function apiBase() {
  return (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

function getAuthHeaders(): Record<string, string> {
  ensureSessionUserId()
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
    const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { headers })
    if (res.status === 401) return { mode: 'follow_brand', theme: null }
    if (!res.ok) return { mode: 'follow_brand', theme: null }
    return parseDashboardResponse(await res.json())
  } catch {
    return { mode: 'follow_brand', theme: null }
  }
}

async function putDashboardTheme(tokens: ThemeTokens): Promise<DashboardThemeResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders() }
  const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, {
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
  const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { method: 'DELETE', headers })
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
  handleAtmosphere: (id: string) => void
  handleAccent: (accent: string, accent2?: string) => void
  clear: () => void
  isPersonal: boolean
  refresh: () => Promise<void>
}

const AdminThemeCtx = createContext<Ctx | null>(null)

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
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
      const res = await fetch(`${apiBase()}/api/v1/admin/dashboard-theme`, { headers })
      if (!res.ok) return
      applyResponse(parseDashboardResponse(await res.json()))
    } catch {
      // keep last known state while offline
    }
  }, [applyResponse])

  useEffect(() => {
    purgeLegacyLocalCache()
    ensureSessionUserId()
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
  }, [applyResponse, refresh])

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

  const handleAtmosphere = useCallback((id: string) => {
    const base: ThemeTokens = snapshotRef.current.theme ?? adminTheme ?? WATCHLINE_DEFAULTS
    void persistPersonal({ ...base, atmosphereMode: id })
  }, [adminTheme, persistPersonal])

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
      handleAtmosphere,
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
      handleAtmosphere,
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
