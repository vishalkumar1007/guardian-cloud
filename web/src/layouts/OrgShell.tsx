import { NavLink, Outlet } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { GuardianMark } from '../components/GuardianMark'
import { cn } from '../lib/utils'
import { IconCloudLock, IconDataBlocks } from '../components/icons/SecurityIcons'
import { useTheme } from '../theme/useTheme'

const NAV = [
  { to: '/org', label: 'Overview', end: true },
  { to: '/org/employees', label: 'Employees' },
  { to: '/org/devices', label: 'Devices' },
  { to: '/org/groups', label: 'Groups' },
  { to: '/org/policies', label: 'Policies' },
  { to: '/org/events', label: 'Events' },
  { to: '/org/alerts', label: 'Alerts' },
  { to: '/org/incidents', label: 'Incidents' },
  { to: '/org/reports', label: 'Reports' },
  { to: '/org/settings', label: 'Settings' },
] as const

export function OrgShell() {
  const { theme, toggleColorMode } = useTheme()
  return (
    <div className="g-atmosphere relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-5 md:px-6">
        <header className="g-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <GuardianMark className="h-8 w-8 text-signal" />
            <div>
              <p className="font-display text-xl font-bold leading-none tracking-tight">Guardian</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Organization admin
              </p>
            </div>
            <div className="ml-2 hidden items-center gap-1 sm:flex">
              <IconCloudLock className="h-7 w-7" />
              <IconDataBlocks className="h-7 w-7" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex max-w-full flex-wrap gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium no-underline transition',
                      isActive ? 'bg-ink text-mist' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={toggleColorMode}
              aria-label={`Switch to ${theme.colorScheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme.colorScheme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink hover:bg-surface-2 transition"
            >
              {theme.colorScheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>
        <section className="animate-reveal g-glass mt-6 min-w-0 flex-1 rounded-2xl p-5 md:p-7">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
