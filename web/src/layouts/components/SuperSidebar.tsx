import React, { useState } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Laptop,
  CreditCard,
  Shield,
  KeyRound,
  FileText,
  Activity,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package,
  UserCircle,
} from 'lucide-react'
import { GuardianMark } from '../../components/GuardianMark'
import { cn } from '../../lib/utils'
import { useNavPrefs } from '../../theme/navPrefs'
import { Star } from 'lucide-react'

interface SuperSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onMobileClose?: () => void
}

interface NavChild {
  to: string
  label: string
}

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  children?: NavChild[]
}

interface NavSection {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  dot: string
  items: NavItem[]
}

const OVERVIEW_ITEM: NavItem = {
  to: '/admin',
  label: 'Overview',
  icon: LayoutDashboard,
  exact: true,
}

const ENTERPRISE_SECTION: NavSection = {
  id: 'enterprise',
  title: 'Enterprise Subscription',
  subtitle: 'B2B tenants & fleet',
  icon: Building2,
  accent: 'text-signal',
  dot: 'bg-signal',
  items: [
    {
      to: '/admin/organizations',
      label: 'Organizations',
      icon: Building2,
      children: [
        { to: '/admin/organizations', label: 'All Organizations' },
        { to: '/admin/organizations/new', label: 'Onboarding' },
        { to: '/admin/organizations?status=ACTIVE', label: 'Active' },
        { to: '/admin/organizations?status=TRIAL', label: 'Trial' },
        { to: '/admin/organizations?status=SUSPENDED', label: 'Suspended' },
        { to: '/admin/organizations?status=ARCHIVED', label: 'Archived' },
      ],
    },
    {
      to: '/admin/devices',
      label: 'Fleet Devices',
      icon: Laptop,
      children: [
        { to: '/admin/devices', label: 'All Devices' },
        { to: '/admin/devices?status=ONLINE', label: 'Online' },
        { to: '/admin/devices?status=OFFLINE', label: 'Offline' },
        { to: '/admin/devices?status=AT_RISK', label: 'At Risk' },
      ],
    },
    {
      to: '/admin/plans',
      label: 'Enterprise Billing',
      icon: CreditCard,
      children: [
        { to: '/admin/plans?targetType=ORGANIZATION', label: 'Enterprise Plans' },
        { to: '/admin/subscriptions?customerType=ORGANIZATION', label: 'Subscriptions' },
        { to: '/admin/usage?scope=enterprise', label: 'Usage & Quotas' },
        { to: '/admin/subscriptions?status=TRIALING&customerType=ORGANIZATION', label: 'Active Trials' },
      ],
    },
  ],
}

const USER_SECTION: NavSection = {
  id: 'user',
  title: 'User Subscription',
  subtitle: 'B2C personal licenses',
  icon: UserCircle,
  accent: 'text-signal',
  dot: 'bg-signal',
  items: [
    {
      to: '/admin/users',
      label: 'Individual Users',
      icon: Users,
      children: [
        { to: '/admin/users', label: 'All Users' },
        { to: '/admin/users?status=ACTIVE', label: 'Active' },
        { to: '/admin/users?status=TRIAL', label: 'Trial' },
        { to: '/admin/users?status=SUSPENDED', label: 'Suspended' },
        { to: '/admin/users?status=ARCHIVED', label: 'Archived' },
      ],
    },
    {
      to: '/admin/plans?targetType=PERSONAL',
      label: 'Personal Billing',
      icon: Package,
      children: [
        { to: '/admin/plans?targetType=PERSONAL', label: 'Personal Plans' },
        { to: '/admin/subscriptions?customerType=PERSONAL', label: 'Subscriptions' },
        { to: '/admin/usage?scope=personal', label: 'Usage' },
        { to: '/admin/subscriptions?status=TRIALING&customerType=PERSONAL', label: 'Trials' },
      ],
    },
  ],
}

const SUPERADMIN_SECTION: NavSection = {
  id: 'superadmin',
  title: 'Superadmin Management',
  subtitle: 'Platform & governance',
  icon: Shield,
  accent: 'text-signal',
  dot: 'bg-signal',
  items: [
    {
      to: '/admin/security',
      label: 'Security Center',
      icon: Shield,
      children: [
        { to: '/admin/security', label: 'Overview' },
        { to: '/admin/security/events', label: 'Events' },
        { to: '/admin/security/incidents', label: 'Incidents' },
        { to: '/admin/security/alerts', label: 'Alerts' },
        { to: '/admin/security/risk', label: 'Risk Analysis' },
      ],
    },
    {
      to: '/admin/iam/users',
      label: 'Guardian IAM',
      icon: KeyRound,
      children: [
        { to: '/admin/iam/users', label: 'Admin Users' },
        { to: '/admin/iam/roles', label: 'Roles' },
        { to: '/admin/iam/permissions', label: 'Permissions' },
        { to: '/admin/iam/teams', label: 'Teams' },
        { to: '/admin/iam/invitations', label: 'Invitations' },
        { to: '/admin/iam/sessions', label: 'Sessions' },
        { to: '/admin/iam/access-reviews', label: 'Access Reviews' },
      ],
    },
    {
      to: '/admin/audit',
      label: 'Audit & Governance',
      icon: FileText,
      children: [
        { to: '/admin/audit', label: 'All Audit Logs' },
        { to: '/admin/audit/admin-actions', label: 'Admin Actions' },
        { to: '/admin/audit/security-actions', label: 'Security Actions' },
        { to: '/admin/audit/data-access', label: 'Data Access' },
      ],
    },
    {
      to: '/admin/platform',
      label: 'Platform Ops',
      icon: Activity,
      children: [
        { to: '/admin/platform', label: 'Overview' },
        { to: '/admin/platform/health', label: 'System Health' },
        { to: '/admin/platform/services', label: 'Services' },
        { to: '/admin/platform/agents', label: 'Agent Releases' },
        { to: '/admin/platform/features', label: 'Feature Flags' },
        { to: '/admin/platform/maintenance', label: 'Maintenance' },
      ],
    },
    {
      to: '/admin/settings/general',
      label: 'System Settings',
      icon: Settings,
      children: [
        { to: '/admin/settings/general', label: 'General (SaaS)' },
        { to: '/admin/settings/appearance', label: 'Appearance & Theme' },
        { to: '/admin/settings/security', label: 'Security' },
        { to: '/admin/settings/authentication', label: 'Authentication' },
        { to: '/admin/settings/notifications', label: 'Notifications' },
        { to: '/admin/settings/storage', label: 'Storage' },
        { to: '/admin/settings/retention', label: 'Retention' },
        { to: '/admin/settings/integrations', label: 'Integrations' },
        { to: '/admin/settings/defaults', label: 'Defaults' },
      ],
    },
  ],
}

const NAV_SECTIONS: NavSection[] = [ENTERPRISE_SECTION, USER_SECTION, SUPERADMIN_SECTION]

function isItemActive(location: ReturnType<typeof useLocation>, item: NavItem): boolean {
  if (location.pathname === item.to.split('?')[0]) return true
  if (item.children?.some((c) => location.pathname.startsWith(c.to.split('?')[0]))) return true
  return false
}

function buildSectionKey(sectionId: string, label: string) {
  return `${sectionId}::${label}`
}

export function SuperSidebar({ collapsed, onToggleCollapse, onMobileClose }: SuperSidebarProps) {
  const location = useLocation()
  const { prefs } = useNavPrefs()
  const widthMap: Record<string, string> = { '220': 'w-[220px]', '240': 'w-[240px]', '270': 'w-[270px]', '300': 'w-[300px]', '320': 'w-[320px]' }
  const collapsedMap: Record<string, string> = { '56': 'w-[56px]', '68': 'w-[68px]', '80': 'w-[80px]' }
  const widthClass = widthMap[prefs.width] || 'w-[270px]'
  const collapsedClass = collapsedMap[prefs.collapsedWidth] || 'w-[68px]'
  const densityPad = prefs.density === 'compact' ? 'py-1.5' : prefs.density === 'dense' ? 'py-1' : 'py-2.5'
  const densityText = prefs.density === 'dense' ? 'text-[11px]' : 'text-xs'
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    NAV_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const active = item.children.some((c) => location.pathname.startsWith(c.to.split('?')[0]))
          const alsoParent = location.pathname.startsWith(item.to.split('?')[0])
          map[buildSectionKey(section.id, item.label)] = active || alsoParent
        }
      })
    })
    return map
  })

  function toggleSection(sectionId: string, label: string) {
    const key = buildSectionKey(sectionId, label)
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-line bg-surface/90 backdrop-blur-xl sticky top-0 h-screen shrink-0 transition-[width,background-color] duration-200 z-30 select-none',
        collapsed ? collapsedClass : widthClass,
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-3.5 shrink-0 bg-surface/90 backdrop-blur-xl">
        <Link to="/admin" className="flex items-center gap-2.5 min-w-0 no-underline" onClick={onMobileClose}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-mist-deep shadow-sm font-bold"
            style={{ backgroundColor: 'var(--g-accent, #f97316)' }}
          >
            <GuardianMark className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block font-display text-sm font-bold tracking-tight text-ink leading-none">GUARDIAN</span>
              <span className="block font-mono text-[10px] text-ink-soft mt-1 uppercase tracking-wider">Super Admin</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-soft hover:text-ink"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 font-mono text-xs">
        {!collapsed && prefs.favorites.length > 0 && (
          <div className="mx-2 mb-2 rounded-xl border border-signal/20 bg-signal/5 p-2">
            <div className="flex items-center gap-1.5 px-1 pb-1 text-[10px] font-bold text-signal uppercase tracking-wide"><Star className="h-3 w-3 fill-signal text-signal" /> Favorites</div>
            <div className="space-y-0.5">
              {prefs.favorites.map((fav) => (
                <NavLink key={fav} to={fav} onClick={onMobileClose} className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs', isActive ? 'bg-signal/10 text-signal font-semibold' : 'text-ink-soft hover:bg-surface hover:text-ink')}>
                  <span className="h-1.5 w-1.5 rounded-full bg-signal shrink-0" />{fav.split('/').pop()?.replace(/-/g, ' ') || fav}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        <div className="px-2.5 pb-2">
          <NavLink
            to={OVERVIEW_ITEM.to}
            end={OVERVIEW_ITEM.exact}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-xl px-2.5 transition-colors border',
                densityPad,
                isActive
                  ? 'bg-signal/10 text-signal font-semibold border-signal/20'
                  : 'text-ink-soft hover:bg-surface-2 hover:text-ink border-transparent',
                collapsed && 'justify-center px-0',
              )
            }
            title={collapsed ? OVERVIEW_ITEM.label : undefined}
          >
            <OVERVIEW_ITEM.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate font-sans font-semibold text-xs">Overview</span>}
          </NavLink>
          {!collapsed && prefs.showSubtitles && <p className="mt-1.5 px-1 font-mono text-[10px] leading-none text-ink-soft/70">Command center & live KPIs</p>}
        </div>

        {NAV_SECTIONS.filter((s) => !prefs.hiddenSections.includes(s.id)).map((section) => (
          <div key={section.id} className={cn('mx-2 mt-3 rounded-xl border border-line/60 bg-surface-2/40 overflow-hidden', collapsed && 'bg-transparent border-transparent mx-1')}>
            {!collapsed ? (
              prefs.showSubtitles ? (
                <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
                  {prefs.showSectionIcons && <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-surface', section.accent, 'border-current/20')}>
                    <section.icon className="h-3.5 w-3.5" />
                  </span>}
                  <div className="min-w-0 flex-1">
                    <span className="block font-sans text-[11px] font-bold tracking-wide text-ink leading-none uppercase">{section.title}</span>
                    <span className="block font-mono text-[10px] text-ink-soft truncate leading-none mt-1">{section.subtitle}</span>
                  </div>
                  {prefs.showSectionDots && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', section.dot)} />}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-2">
                  {prefs.showSectionIcons && <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border bg-surface', section.accent, 'border-current/20')}>
                    <section.icon className="h-3 w-3.5" />
                  </span>}
                  <span className="font-sans text-xs font-semibold text-ink truncate">{section.title}</span>
                </div>
              )
            ) : (
              <div className="flex justify-center py-2">
                {prefs.showSectionIcons && <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg border bg-surface', section.accent, 'border-current/20')}>
                  <section.icon className="h-3.5 w-3.5" />
                </span>}
              </div>
            )}

            {!collapsed && prefs.showSubtitles && <div className="mx-2.5 border-t border-line/50 mb-1" />}

            <div className={cn('px-1.5 pb-2 space-y-0.5', collapsed && 'px-1')}>
              {section.items.map((item) => {
                const key = buildSectionKey(section.id, item.label)
                const hasChildren = item.children && item.children.length > 0
                const isOpen = openSections[key]
                const isParentActive = isItemActive(location, item)

                if (!hasChildren) {
                  return (
                    <NavLink
                      key={key}
                      to={item.to}
                      end={item.exact}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                          isActive ? 'bg-signal/10 text-signal font-semibold' : 'text-ink-soft hover:bg-surface hover:text-ink',
                          collapsed && 'justify-center px-0',
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate font-sans font-medium text-xs">{item.label}</span>}
                    </NavLink>
                  )
                }

                return (
                  <div key={key} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (collapsed) onToggleCollapse()
                        toggleSection(section.id, item.label)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-2.5 text-left transition-colors group',
                        densityPad,
                        isParentActive ? 'text-ink bg-surface' : 'text-ink-soft hover:bg-surface hover:text-ink',
                        collapsed && 'justify-center px-0',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                       <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={cn('h-4 w-4 shrink-0', isParentActive ? section.accent : 'text-ink-soft', densityText)} />
                        {!collapsed && <span className={cn('truncate font-sans font-medium', densityText)}>{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <span className="text-ink-soft group-hover:text-ink">
                          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </span>
                      )}
                    </button>

                    {!collapsed && isOpen && (
                      <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-line ml-4">
                        {item.children?.map((child) => {
                          const childPath = child.to.split('?')[0]
                          const childQuery = child.to.includes('?') ? child.to.split('?')[1] : ''
                          const isCurrentChild =
                            location.pathname === childPath && (!childQuery || location.search.includes(childQuery))
                          const isFallbackActive =
                            !childQuery && location.pathname === childPath && location.search === ''
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={onMobileClose}
                              className={cn(
                                'block truncate rounded-md px-2 py-1.5 text-[11px] font-mono transition-colors',
                                isCurrentChild || isFallbackActive
                                  ? 'text-signal font-semibold bg-signal/10'
                                  : 'text-ink-soft hover:text-ink hover:bg-surface',
                              )}
                            >
                              {child.label}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {prefs.showFooterUser && <div className="border-t border-line p-2.5 bg-surface/90 backdrop-blur-xl">
        <div className={cn('flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 p-2', collapsed && 'justify-center')}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-signal/20 text-signal font-mono text-xs font-bold border border-signal/30">
            AV
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block truncate font-sans text-xs font-semibold text-ink leading-none">Alexander Vance</span>
              <span className="block truncate font-mono text-[10px] text-ink-soft mt-1">SUPER_ADMIN</span>
            </div>
          )}
        </div>
      </div>}
    </aside>
  )
}
