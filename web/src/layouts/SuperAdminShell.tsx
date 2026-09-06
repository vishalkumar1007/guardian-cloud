import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { SuperSidebar } from './components/SuperSidebar'
import { SuperHeader } from './components/SuperHeader'
import { CommandPalette } from './components/CommandPalette'
import { useAdminTheme } from '../theme/adminTheme'
import { useTheme } from '../theme/useTheme'
import { themeTokensToCssVars, applyThemeTokensToElement, applyThemeTokens, setDashboardShellOwnsTheme, setPersonalDashboardOwnsTheme } from '../theme/tokens'
import { ensureSessionUserId } from '../theme/session'

function applyRadiusCssVars(el: HTMLElement, radius: string, radiusSm: string, radiusLg: string) {
  el.style.setProperty('--g-radius', radius)
  el.style.setProperty('--g-radius-sm', radiusSm)
  el.style.setProperty('--g-radius-lg', radiusLg)
  el.style.setProperty('--radius', radius)
  el.style.setProperty('--radius-sm', radiusSm)
  el.style.setProperty('--radius-md', radius)
  el.style.setProperty('--radius-lg', radius)
  el.style.setProperty('--radius-xl', radiusLg)
  el.style.setProperty('--radius-2xl', radiusLg)
  el.style.setProperty('--radius-3xl', radiusLg)
}

export function SuperAdminShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)

  useEffect(() => {
    const session = localStorage.getItem('super_admin_session')
    if (!session) {
      localStorage.setItem('super_admin_session', JSON.stringify({
        id: 'demo-session',
        email: 'alexander.vance@guardian.internal',
        role: 'SUPER_ADMIN',
        name: 'Alexander Vance',
      }))
    } else {
      ensureSessionUserId()
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { adminTheme, loading: adminThemeLoading, isPersonal } = useAdminTheme()
  const { theme: globalTheme } = useTheme()
  // While hydrating personal preference, follow Brand to avoid a flash of stale custom theme
  const effective = (!adminThemeLoading && isPersonal && adminTheme) ? adminTheme : globalTheme
  const shellRef = useRef<HTMLDivElement>(null)
  const globalThemeRef = useRef(globalTheme)
  globalThemeRef.current = globalTheme

  // Personal Radius / packs write radius onto adminTheme — that is the shell source of truth.
  const shellStyle = useMemo(
    () => themeTokensToCssVars(effective) as React.CSSProperties,
    [effective],
  )

  const dataTheme = effective.colorScheme
  const dataAtmos = effective.atmosphereMode || (dataTheme === 'dark' ? 'void' : 'mist')

  // Own document theme while the dashboard is mounted.
  useEffect(() => {
    setDashboardShellOwnsTheme(true)
    return () => {
      setPersonalDashboardOwnsTheme(false)
      setDashboardShellOwnsTheme(false)
      applyThemeTokens(globalThemeRef.current, { force: true })
    }
  }, [])

  // Personal custom theme: Brand Studio must not paint over the dashboard document.
  useEffect(() => {
    setPersonalDashboardOwnsTheme(isPersonal)
    return () => setPersonalDashboardOwnsTheme(false)
  }, [isPersonal])

  // Keep shell + document tokens in sync (radius included via effective / Personal Radius).
  useEffect(() => {
    applyThemeTokens(effective, { force: true, allowWhilePersonal: true })
    const el = shellRef.current
    if (el) applyThemeTokensToElement(el, effective)
    applyRadiusCssVars(document.documentElement, effective.radius, effective.radiusSm, effective.radiusLg)
    if (el) applyRadiusCssVars(el, effective.radius, effective.radiusSm, effective.radiusLg)
  }, [effective, isPersonal, globalTheme, effective.radius, effective.radiusSm, effective.radiusLg])

  return (
    <div
      ref={shellRef}
      className="g-dashboard-shell h-screen overflow-hidden g-atmosphere text-ink flex font-sans transition-[background,color,font] duration-300"
      data-theme={dataTheme}
      data-atmosphere={dataAtmos}
      style={{
        ...shellStyle,
        fontFamily: 'var(--g-font-body)',
      }}
    >
      <div className="hidden lg:block shrink-0 relative z-10">
        <SuperSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72">
            <SuperSidebar
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              onMobileClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col min-w-0 h-screen overflow-hidden bg-transparent">
        <SuperHeader
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent relative z-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
      />
    </div>
  )
}
