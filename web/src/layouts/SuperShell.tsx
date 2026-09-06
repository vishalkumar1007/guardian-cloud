import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { GuardianMark } from '../components/GuardianMark'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import {
  LayoutDashboard,
  Building2,
  Users,
  Laptop,
  Package,
  CreditCard,
  Activity,
  FileText,
  LifeBuoy,
  Sparkles,
  ChevronLeft,
  LogOut,
  Search,
  Bell,
  Settings,
  Menu,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '../theme/useTheme'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

const NAV_SECTIONS = [
  {
    title: 'Common',
    items: [
      { to: '/super', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/super/ai', label: 'AI Triage', icon: Sparkles },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/super/organizations', label: 'Organizations', icon: Building2 },
      { to: '/super/users', label: 'Users', icon: Users },
      { to: '/super/devices', label: 'Devices', icon: Laptop },
      { to: '/super/agents', label: 'Agents', icon: Package },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { to: '/super/plans', label: 'Plans', icon: CreditCard },
      { to: '/super/subscriptions', label: 'Subscriptions', icon: CreditCard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/super/system-health', label: 'System health', icon: Activity },
      { to: '/super/audit', label: 'Audit Log', icon: FileText },
      { to: '/super/support', label: 'Support', icon: LifeBuoy },
    ],
  },
  {
    title: 'Admin',
    items: [{ to: '/super/settings', label: 'Settings', icon: Settings }],
  },
]

export function SuperShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleColorMode } = useTheme()
  const [checked, setChecked] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('guardian-super-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLogin = location.pathname === '/super/login'

  useEffect(() => {
    try {
      localStorage.setItem('guardian-super-sidebar', collapsed ? 'collapsed' : 'expanded')
    } catch {
      // ignore
    }
  }, [collapsed])

  useEffect(() => {
    if (isLogin) {
      setChecked(true)
      return
    }
    const session = localStorage.getItem('super_admin_session')
    if (!session) {
      navigate('/super/login', { replace: true })
      return
    }
    setChecked(true)
  }, [location.pathname, navigate, isLogin])

  function handleLogout() {
    localStorage.removeItem('super_admin_session')
    navigate('/super/login', { replace: true })
  }

  if (isLogin) {
    return <Outlet />
  }

  if (!checked) {
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
    <div className="h-screen overflow-hidden bg-mist">
      <div className="flex h-screen overflow-hidden">
        <aside
          className={cn(
            'hidden lg:flex flex-col border-r border-line bg-surface sticky top-0 h-screen shrink-0 transition-[width] duration-200',
            collapsed ? 'w-[70px]' : 'w-[250px]',
          )}
        >
          <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-3 shrink-0">
            <Link to="/super" className="flex items-center gap-2 min-w-0 no-underline">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-signal text-mist-deep shadow-sm">
                <GuardianMark className="h-5 w-5" />
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold leading-none tracking-tight text-ink">Guardian</span>
                  <span className="block font-mono text-[10px] leading-none text-ink-soft">Super Admin</span>
                </span>
              )}
            </Link>
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-soft hover:text-ink">
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                {!collapsed && <p className="px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">{section.title}</p>}
                <div className="space-y-0.5">
                  {section.items.map((item: any) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end ? true : false}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition relative',
                          isActive ? 'bg-signal/10 text-signal' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                          collapsed && 'justify-center px-2',
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line p-3">
            <div className={cn('flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-2', collapsed && 'justify-center')}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-mist font-display text-xs font-bold">SA</span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xs font-semibold text-ink">Super Admin</span>
                  <span className="block truncate font-mono text-[10px] text-ink-soft">superadmin@guardian.local</span>
                </span>
              )}
            </div>
            {!collapsed && (
              <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2 w-full rounded-xl gap-1.5 font-mono text-xs">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/80 backdrop-blur-xl px-4">
            <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink">
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden lg:block font-mono text-xs text-ink-soft">
              <span className="text-ink">Super Admin</span> <span className="opacity-40">/</span> <span className="text-ink-soft">{location.pathname.split('/').pop() || 'overview'}</span>
            </div>
            <div className="flex-1 max-w-[360px] hidden sm:flex">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
                <input placeholder="Search tenants, users, devices…" className="h-8 w-full rounded-xl border border-line bg-surface-2 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none" />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleColorMode}
                className="rounded-xl h-8 w-8 p-0"
                title={`Switch to ${theme.colorScheme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label={`Switch to ${theme.colorScheme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme.colorScheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex rounded-xl gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          </header>

          {mobileOpen && (
            <div className="lg:hidden border-b border-line bg-surface p-3">
              <div className="grid grid-cols-2 gap-1">
                {NAV_SECTIONS.flatMap((s: any) => s.items as any[]).map((item: any) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border', isActive ? 'bg-ink text-mist border-ink' : 'bg-surface border-line text-ink-soft')}>
                    <item.icon className="h-4 w-4" /> {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-mist">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
