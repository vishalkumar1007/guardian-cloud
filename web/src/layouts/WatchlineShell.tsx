import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { GuardianMark } from '../components/GuardianMark'
import { Badge } from '../components/ui/badge'
import { MOCK_DEVICES, MOCK_EVENTS } from '../data/mock'
import { cn } from '../lib/utils'
import { IconShieldCheck } from '../components/icons/SecurityIcons'

const NAV = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/devices', label: 'Devices' },
  { to: '/app/security', label: 'Security' },
  { to: '/app/events', label: 'Events' },
  { to: '/app/incidents', label: 'Incidents' },
  { to: '/app/recovery', label: 'Recovery' },
  { to: '/app/settings', label: 'Settings' },
  { to: '/app/billing', label: 'Billing' },
] as const

export function WatchlineShell() {
  const location = useLocation()
  const ribbon = MOCK_EVENTS.slice(0, 3)

  return (
    <div className="g-atmosphere relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-5 md:px-6">
        <header className="g-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <GuardianMark className="h-8 w-8 text-signal" />
            <div>
              <p className="font-display text-xl font-bold leading-none tracking-tight">Guardian</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Personal watchline
              </p>
            </div>
            <IconShieldCheck className="ml-2 hidden h-8 w-8 sm:block" />
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium no-underline transition',
                    isActive
                      ? 'bg-ink text-mist'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div
          key={location.pathname}
          className="animate-ribbon-in mt-3 flex gap-2 overflow-x-auto pb-1"
          aria-label="Recent signal ribbon"
        >
          {ribbon.map((item) => (
            <Badge
              key={item.id}
              variant={item.tone === 'alert' ? 'alert' : item.tone === 'signal' ? 'signal' : 'soft'}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  item.tone === 'alert' ? 'bg-alert' : item.tone === 'signal' ? 'bg-signal' : 'bg-ink-soft/40',
                )}
              />
              {item.code}
              <span className="text-ink-soft">{item.when}</span>
            </Badge>
          ))}
        </div>

        <div className="mt-6 flex flex-1 gap-6 md:gap-8">
          <aside className="hidden w-16 shrink-0 flex-col items-center sm:flex" aria-label="Signal spine">
            <div className="relative flex h-full min-h-[280px] flex-col items-center justify-between py-2">
              <div className="absolute inset-y-3 w-px bg-gradient-to-b from-signal via-line to-line" />
              {MOCK_DEVICES.map((node) => (
                <div key={node.id} className="relative z-10 flex flex-col items-center gap-1">
                  <span
                    title={node.name}
                    className={cn(
                      'block h-3.5 w-3.5 rounded-full border-2 border-mist bg-surface',
                      node.status === 'online'
                        ? 'border-signal bg-signal animate-spine-pulse'
                        : 'border-ink-soft/40',
                    )}
                  />
                  <span className="max-w-[4.5rem] truncate text-center font-mono text-[9px] uppercase tracking-wider text-ink-soft">
                    {node.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <section className="animate-reveal g-glass min-w-0 flex-1 rounded-2xl p-5 md:p-7">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  )
}
