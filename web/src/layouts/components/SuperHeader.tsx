import React, { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import { useTheme } from '../../theme/useTheme'
import { useNavPrefs } from '../../theme/navPrefs'
import { useAdminTheme } from '../../theme/adminTheme'
import { NotificationCenter } from './NotificationCenter'
import { cn } from '../../lib/utils'

interface SuperHeaderProps {
  onOpenMobileMenu: () => void
  onOpenCommandPalette: () => void
}

export function SuperHeader({ onOpenMobileMenu, onOpenCommandPalette }: SuperHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleColorMode } = useTheme()
  const { adminTheme, isPersonal, handleScheme } = useAdminTheme()
  const { prefs } = useNavPrefs()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const pathSegments = location.pathname.split('/').filter(Boolean)
  // Custom dashboard uses personal tokens; Following Brand uses global Brand tokens.
  const activeScheme = (isPersonal && adminTheme ? adminTheme.colorScheme : theme.colorScheme) === 'dark' ? 'dark' : 'light'

  function handleSignOut() {
    localStorage.removeItem('super_admin_session')
    navigate('/super/login')
  }

  function handleThemeToggle() {
    if (isPersonal) {
      handleScheme(activeScheme === 'dark' ? 'light' : 'dark')
      return
    }
    toggleColorMode()
  }

  const heightClass = prefs.topHeight === '56' ? 'h-14' : 'h-16'
  const blurClass = prefs.topBlur === 'none' ? '' : prefs.topBlur === 'md' ? 'backdrop-blur-md' : 'backdrop-blur-xl'
  const opacityClass = prefs.topOpacity === '70' ? 'bg-surface/70' : prefs.topOpacity === '90' ? 'bg-surface/90' : 'bg-surface/75'
  const syncedBg = prefs.syncWithSidebar ? 'bg-surface/80' : opacityClass

  return (
    <header className={cn('sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line px-4 select-none transition-colors duration-200', heightClass, syncedBg, blurClass)}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:text-ink"
        >
          <Menu className="h-4 w-4" />
        </button>

        {prefs.showBreadcrumbs && <nav className="flex items-center gap-1.5 font-mono text-xs text-ink-soft overflow-hidden">
          <Link to="/admin" className="text-ink-soft hover:text-ink no-underline shrink-0">
            Super Admin
          </Link>
          {pathSegments.slice(1).map((seg, idx) => {
            const isLast = idx === pathSegments.length - 2
            const currentPath = `/${pathSegments.slice(0, idx + 2).join('/')}`
            const label = seg.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

            return (
              <React.Fragment key={seg}>
                <span className="text-ink-soft/40">/</span>
                {isLast ? (
                  <span className="text-ink font-medium truncate">{label}</span>
                ) : (
                  <Link to={currentPath} className="text-ink-soft hover:text-ink truncate no-underline">
                    {label}
                  </Link>
                )}
              </React.Fragment>
            )
          })}
        </nav>}
      </div>

      {prefs.showSearch && <div className="hidden md:flex flex-1 max-w-sm mx-4">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex h-8 w-full items-center justify-between rounded-xl border border-line bg-surface-2 px-3 font-mono text-xs text-ink-soft hover:border-line hover:text-ink transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-ink-soft" />
            <span>Search platform…</span>
          </div>
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-ink-soft">
            ⌘K
          </kbd>
        </button>
      </div>}
      {!prefs.showSearch && <div className="hidden md:flex flex-1 max-w-sm mx-4" />}

      <div className="flex items-center gap-2">
        {prefs.showDemoBadge && <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-signal/20 bg-signal/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-signal shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
          <span>Demo Mode</span>
        </div>}

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:text-ink"
        >
          <Search className="h-4 w-4" />
        </button>

        {prefs.showNotifications && <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:text-ink hover:border-line transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-signal" />
          </button>

          <NotificationCenter
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />
        </div>}

        {prefs.showThemeToggle && <button
          type="button"
          onClick={handleThemeToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:text-ink hover:border-line transition-colors"
          title={`Switch to ${activeScheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${activeScheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {activeScheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>}

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-1 pr-2.5 text-xs text-ink hover:border-line transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-signal text-mist-deep font-bold font-mono text-[10px]">
              AV
            </div>
            <span className="hidden sm:inline font-medium">Alex Vance</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-line bg-surface p-2 shadow-2xl space-y-1 text-xs font-mono">
              <div className="px-2 py-1.5 border-b border-line">
                <span className="block font-semibold text-ink">Alexander Vance</span>
                <span className="block text-[10px] text-ink-soft truncate">alexander.vance@guardian.internal</span>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-signal font-semibold">
                  <Shield className="h-3 w-3" /> SUPER_ADMIN
                </div>
              </div>

              <Link
                to="/admin/iam/users/adm-001"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink no-underline"
              >
                <User className="h-3.5 w-3.5" /> My Admin Profile
              </Link>

              <Link
                to="/admin/settings/general"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink no-underline"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Platform Settings
              </Link>

              <div className="border-t border-line pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-alert hover:bg-surface-2 text-left transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
