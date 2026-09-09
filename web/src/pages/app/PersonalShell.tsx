import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Laptop, ShieldCheck, User, LogOut, Menu, X } from 'lucide-react'
import { GuardianMark } from '../../components/GuardianMark'
import { useAuth } from '../../auth/AuthProvider'
import { IdleTimeoutWarning } from '../../auth/IdleTimeoutWarning'
import { cn } from '../../lib/utils'

/**
 * The personal customer portal shell.
 *
 * Deliberately separate from SuperAdminShell: this is a customer's own
 * workspace, not the staff console, and the two must not share navigation or
 * state. Nothing here can reach a platform endpoint.
 */

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/app/devices', label: 'Devices', icon: Laptop },
  { to: '/app/security', label: 'Security', icon: ShieldCheck },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export function PersonalShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const name = user?.display_name || user?.email || 'Your account'

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-[100dvh] bg-mist">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-line bg-surface transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <Link to="/app" className="flex items-center gap-2 no-underline">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal text-white">
              <GuardianMark className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-bold text-ink">Guardian</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-ink-soft lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors',
                  isActive
                    ? 'bg-signal-soft text-signal'
                    : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-line p-3">
          <div className="rounded-xl border border-line bg-surface-2 p-2.5">
            <p className="truncate text-xs font-semibold text-ink">{name}</p>
            <p className="truncate font-mono text-[10px] text-ink-soft">{user?.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] font-semibold text-ink-soft transition-colors hover:text-alert"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-ink-soft"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-bold text-ink">Guardian</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <IdleTimeoutWarning />
    </div>
  )
}
