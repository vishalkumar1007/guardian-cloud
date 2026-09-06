import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ensureSessionUserId, getSuperAdminAuthHeaders } from './session'

export type NavWidth = '220' | '240' | '270' | '300' | '320'
export type NavCollapsedWidth = '56' | '68' | '80'
export type NavDensity = 'dense' | 'cozy' | 'compact'
export type TopHeight = '56' | '64'
export type TopBlur = 'none' | 'md' | 'xl'

export type NavPrefs = {
  width: NavWidth
  collapsedWidth: NavCollapsedWidth
  density: NavDensity
  showSubtitles: boolean
  showSectionIcons: boolean
  showSectionDots: boolean
  showFooterUser: boolean
  favorites: string[]
  hiddenSections: string[]
  topHeight: TopHeight
  topOpacity: '70' | '75' | '90'
  topBlur: TopBlur
  showBreadcrumbs: boolean
  showSearch: boolean
  showDemoBadge: boolean
  showNotifications: boolean
  showThemeToggle: boolean
  syncWithSidebar: boolean
  adminRadius: string
  adminRadiusSm: string
  adminRadiusLg: string
  messageDensity: 'cozy' | 'compact'
  messageStyle: 'bubble' | 'flat'
}

export type NavPresetId = 'full' | 'minimal' | 'ops' | 'billing' | 'dense' | 'executive'

export const NAV_PRESETS: Record<NavPresetId, { label: string; desc: string; favorites: string[]; width: NavWidth; density: NavDensity; topHeight: TopHeight }> = {
  full: { label: 'Full', desc: 'All 3 services', favorites: [], width: '270', density: 'cozy', topHeight: '64' },
  minimal: { label: 'Minimal', desc: 'Overview + Platform only', favorites: ['/admin', '/admin/platform'], width: '240', density: 'compact', topHeight: '56' },
  ops: { label: 'Ops Focus', desc: 'Security + Platform + Audit', favorites: ['/admin/security', '/admin/platform', '/admin/audit'], width: '270', density: 'cozy', topHeight: '64' },
  billing: { label: 'Billing Focus', desc: 'Enterprise + User Billing', favorites: ['/admin/organizations', '/admin/users', '/admin/plans'], width: '300', density: 'cozy', topHeight: '64' },
  dense: { label: 'Dense Ops', desc: 'Compact + icon search', favorites: ['/admin/security', '/admin/platform'], width: '240', density: 'dense', topHeight: '56' },
  executive: { label: 'Executive', desc: 'Spacious + breadcrumbs', favorites: [], width: '320', density: 'cozy', topHeight: '64' },
}

const BASE_KEY = 'guardian-nav-prefs'
const KEY = BASE_KEY
const NAV_DB_ONLY = true
function getUserId(): string | null {
  return ensureSessionUserId()
}
function getKey(): string {
  const uid = getUserId()
  return uid ? `${BASE_KEY}:${uid}` : BASE_KEY
}
const DEFAULTS: NavPrefs = {
  width: '270',
  collapsedWidth: '68',
  density: 'cozy',
  showSubtitles: true,
  showSectionIcons: true,
  showSectionDots: true,
  showFooterUser: true,
  favorites: [],
  hiddenSections: [],
  topHeight: '64',
  topOpacity: '75',
  topBlur: 'xl',
  showBreadcrumbs: true,
  showSearch: true,
  showDemoBadge: true,
  showNotifications: true,
  showThemeToggle: true,
  syncWithSidebar: true,
  adminRadius: '14px',
  adminRadiusSm: '10px',
  adminRadiusLg: '22px',
  messageDensity: 'cozy',
  messageStyle: 'bubble',
}

function apiBase() {
  return (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}
function getAuthHeaders(): Record<string, string> {
  ensureSessionUserId()
  return getSuperAdminAuthHeaders()
}
let memoryPrefs: NavPrefs | null = null
let prefsWriteGen = 0
function read(): NavPrefs {
  if (NAV_DB_ONLY) return memoryPrefs ? { ...DEFAULTS, ...memoryPrefs } as NavPrefs : { ...DEFAULTS }
  try {
    const k = getKey()
    let raw = localStorage.getItem(k)
    if (!raw && k !== BASE_KEY) raw = localStorage.getItem(BASE_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw)
    return { ...DEFAULTS, ...p, favorites: Array.isArray(p.favorites) ? p.favorites : [], hiddenSections: Array.isArray(p.hiddenSections) ? p.hiddenSections : [] }
  } catch { return { ...DEFAULTS } }
}
function write(p: NavPrefs) {
  prefsWriteGen += 1
  memoryPrefs = { ...p }
  if (!NAV_DB_ONLY) {
    try {
      const k = getKey()
      localStorage.setItem(k, JSON.stringify(p))
      localStorage.setItem(BASE_KEY, JSON.stringify(p))
      window.dispatchEvent(new CustomEvent('guardian-nav-prefs'))
    } catch {}
  } else {
    try { window.dispatchEvent(new CustomEvent('guardian-nav-prefs')) } catch {}
  }
  try {
    const { width, collapsedWidth, density, showSubtitles, showSectionIcons, showSectionDots, showFooterUser, favorites, hiddenSections, topHeight, topOpacity, topBlur, showBreadcrumbs, showSearch, showDemoBadge, showNotifications, showThemeToggle, syncWithSidebar } = p
    const navigation = { width, collapsedWidth, density, showSubtitles, showSectionIcons, showSectionDots, showFooterUser, favorites, hiddenSections, topHeight, topOpacity, topBlur, showBreadcrumbs, showSearch, showDemoBadge, showNotifications, showThemeToggle, syncWithSidebar }
    const adminStudio = { adminRadius: p.adminRadius, adminRadiusSm: p.adminRadiusSm, adminRadiusLg: p.adminRadiusLg, messageDensity: p.messageDensity, messageStyle: p.messageStyle }
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders() }
    fetch(`${apiBase()}/api/v1/admin/settings/navigation?scope=personal`, { method: 'PUT', headers, body: JSON.stringify(navigation) }).catch(() => {})
    fetch(`${apiBase()}/api/v1/admin/settings/admin_studio?scope=personal`, { method: 'PUT', headers, body: JSON.stringify(adminStudio) }).catch(() => {})
  } catch {}
}

type Ctx = {
  prefs: NavPrefs
  setPrefs: (p: Partial<NavPrefs>) => void
  applyPreset: (id: NavPresetId) => void
  toggleFavorite: (path: string) => void
  toggleSection: (id: string) => void
  reset: () => void
}

const NavCtx = createContext<Ctx | null>(null)

export function NavPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<NavPrefs>(() => read())
  useEffect(() => {
    ;(async () => {
      const genAtStart = prefsWriteGen
      try {
        const headers: Record<string, string> = { ...getAuthHeaders() }
        const [navRes, adminRes] = await Promise.all([
          fetch(`${apiBase()}/api/v1/admin/settings/navigation?scope=personal`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${apiBase()}/api/v1/admin/settings/admin_studio?scope=personal`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ])
        // Don't clobber Personal Radius / local edits made while the fetch was in flight.
        if (genAtStart !== prefsWriteGen) return
        let base = read()
        if (navRes && Object.keys(navRes).length) {
          base = { ...base, ...navRes, favorites: Array.isArray((navRes as any).favorites) ? (navRes as any).favorites : base.favorites, hiddenSections: Array.isArray((navRes as any).hiddenSections) ? (navRes as any).hiddenSections : base.hiddenSections }
        }
        if (adminRes && Object.keys(adminRes).length) {
          base = { ...base, ...adminRes }
        }
        if (genAtStart !== prefsWriteGen) return
        if (navRes && Object.keys(navRes).length || adminRes && Object.keys(adminRes).length) {
          memoryPrefs = { ...base }
          if (!NAV_DB_ONLY) {
            try {
              const k = getKey()
              localStorage.setItem(k, JSON.stringify(base))
              localStorage.setItem(BASE_KEY, JSON.stringify(base))
            } catch {}
          }
          setPrefsState(base as any)
        }
      } catch {}
    })()
    const h = () => setPrefsState(read())
    window.addEventListener('guardian-nav-prefs', h as any)
    if (!NAV_DB_ONLY) window.addEventListener('storage', h as any)
    return () => { window.removeEventListener('guardian-nav-prefs', h as any); if (!NAV_DB_ONLY) window.removeEventListener('storage', h as any) }
  }, [])
  const setPrefs = useCallback((patch: Partial<NavPrefs>) => {
    const next = { ...read(), ...patch }
    write(next); setPrefsState(next)
  }, [])
  const applyPreset = useCallback((id: NavPresetId) => {
    const pr = NAV_PRESETS[id]
    const next: NavPrefs = { ...read(), width: pr.width, density: pr.density, favorites: [...pr.favorites], topHeight: pr.topHeight }
    write(next); setPrefsState(next)
  }, [])
  const toggleFavorite = useCallback((path: string) => {
    const cur = read()
    const fav = cur.favorites.includes(path) ? cur.favorites.filter((x) => x !== path) : [...cur.favorites, path]
    const next = { ...cur, favorites: fav }
    write(next); setPrefsState(next)
  }, [])
  const toggleSection = useCallback((id: string) => {
    const cur = read()
    const hs = cur.hiddenSections.includes(id) ? cur.hiddenSections.filter((x) => x !== id) : [...cur.hiddenSections, id]
    const next = { ...cur, hiddenSections: hs }
    write(next); setPrefsState(next)
  }, [])
  const reset = useCallback(() => { write({ ...DEFAULTS }); setPrefsState({ ...DEFAULTS }) }, [])
  const value = useMemo(() => ({ prefs, setPrefs, applyPreset, toggleFavorite, toggleSection, reset }), [prefs, setPrefs, applyPreset, toggleFavorite, toggleSection, reset])
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>
}

export function useNavPrefs() {
  const c = useContext(NavCtx)
  if (!c) throw new Error('useNavPrefs must be within NavPrefsProvider')
  return c
}
