import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { GuardianMark } from '../components/GuardianMark'
import { cn } from '../lib/utils'
import { IconMonitorScan, IconShieldCheck } from '../components/icons/SecurityIcons'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

const NAV = [
  { to: '/super', label: 'Overview', end: true },
  { to: '/super/ai', label: 'AI Triage' },
  { to: '/super/organizations', label: 'Organizations' },
  { to: '/super/users', label: 'Users' },
  { to: '/super/devices', label: 'Devices' },
  { to: '/super/agents', label: 'Agents' },
  { to: '/super/plans', label: 'Plans' },
  { to: '/super/subscriptions', label: 'Subscriptions' },
  { to: '/super/system-health', label: 'System health' },
  { to: '/super/audit', label: 'Audit' },
  { to: '/super/support', label: 'Support' },
  { to: '/super/appearance', label: 'Appearance' },
] as const

export function SuperShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    async function verifyBootstrap() {
      try {
        const res = await fetch(`${apiBase()}/api/v1/platform/bootstrap`)
        if (res.ok) {
          const data = await res.json()
          if (data.needs_setup && location.pathname !== '/super/setup') {
            navigate('/super/setup', { replace: true })
          }
        }
      } catch {
        // Continue offline
      } finally {
        setChecked(true)
      }
    }
    void verifyBootstrap()
  }, [location.pathname, navigate])

  if (!checked && location.pathname !== '/super/setup') {
    return (
      <div className="g-atmosphere relative min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-ping" />
          Verifying control-plane authorization…
        </div>
      </div>
    )
  }

  return (
    <div className="g-atmosphere relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-5 md:px-6">
        <header className="g-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <GuardianMark className="h-8 w-8 text-signal" />
            <div>
              <p className="font-display text-xl font-bold leading-none tracking-tight">Guardian</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Super admin
              </p>
            </div>
            <div className="ml-2 hidden items-center gap-1 sm:flex">
              <IconShieldCheck className="h-8 w-8" />
              <IconMonitorScan className="h-7 w-7" />
            </div>
          </div>
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
        </header>
        <section className="animate-reveal g-glass mt-6 min-w-0 flex-1 rounded-2xl p-5 md:p-7">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
