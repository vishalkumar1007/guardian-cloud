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
} from 'lucide-react'
import { GuardianMark } from '../../components/GuardianMark'
import { cn } from '../../lib/utils'

interface SuperSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onMobileClose?: () => void
}

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  children?: Array<{
    to: string
    label: string
  }>
}

const NAV_STRUCTURE: NavItem[] = [
  {
    to: '/admin',
    label: 'Overview',
    icon: LayoutDashboard,
    exact: true,
  },
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
    to: '/admin/devices',
    label: 'Devices',
    icon: Laptop,
    children: [
      { to: '/admin/devices', label: 'All Devices' },
      { to: '/admin/devices?status=ONLINE', label: 'Online' },
      { to: '/admin/devices?status=OFFLINE', label: 'Offline' },
      { to: '/admin/devices?status=AT_RISK', label: 'At Risk' },
      { to: '/admin/platform/agents', label: 'Agent Versions' },
    ],
  },
  {
    to: '/admin/plans',
    label: 'Plans & Billing',
    icon: CreditCard,
    children: [
      { to: '/admin/plans', label: 'Plans' },
      { to: '/admin/subscriptions', label: 'Subscriptions' },
      { to: '/admin/usage', label: 'Usage' },
      { to: '/admin/subscriptions?status=TRIALING', label: 'Trials' },
      { to: '/admin/audit?category=ADMIN_ACTION', label: 'Billing Events' },
    ],
  },
  {
    to: '/admin/security',
    label: 'Security',
    icon: Shield,
    children: [
      { to: '/admin/security', label: 'Overview' },
      { to: '/admin/security/events', label: 'Events' },
      { to: '/admin/security/incidents', label: 'Incidents' },
      { to: '/admin/security/alerts', label: 'Alerts' },
      { to: '/admin/security/risk', label: 'Risk' },
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
    label: 'Audit',
    icon: FileText,
    children: [
      { to: '/admin/audit', label: 'Audit Logs' },
      { to: '/admin/audit/admin-actions', label: 'Admin Actions' },
      { to: '/admin/audit/security-actions', label: 'Security Actions' },
      { to: '/admin/audit/data-access', label: 'Data Access' },
    ],
  },
  {
    to: '/admin/platform/health',
    label: 'Platform',
    icon: Activity,
    children: [
      { to: '/admin/platform/health', label: 'System Health' },
      { to: '/admin/platform/services', label: 'Services' },
      { to: '/admin/platform/agents', label: 'Agent Releases' },
      { to: '/admin/platform/features', label: 'Feature Flags' },
      { to: '/admin/platform/maintenance', label: 'Maintenance' },
    ],
  },
  {
    to: '/admin/settings/general',
    label: 'Settings',
    icon: Settings,
    children: [
      { to: '/admin/settings/general', label: 'General' },
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
]

export function SuperSidebar({ collapsed, onToggleCollapse, onMobileClose }: SuperSidebarProps) {
  const location = useLocation()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    NAV_STRUCTURE.forEach((item) => {
      if (item.children) {
        const active = item.children.some((c) => location.pathname.startsWith(c.to.split('?')[0]))
        map[item.label] = active
      }
    })
    return map
  })

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-line bg-surface sticky top-0 h-screen shrink-0 transition-[width,background-color] duration-200 z-30 select-none',
        collapsed ? 'w-[68px]' : 'w-[250px]',
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-3.5 shrink-0 bg-surface">
        <Link to="/admin" className="flex items-center gap-2.5 min-w-0 no-underline" onClick={onMobileClose}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-mist-deep shadow-sm font-bold"
            style={{ backgroundColor: 'var(--g-accent, #f97316)' }}
          >
            <GuardianMark className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block font-display text-sm font-bold tracking-tight text-ink leading-none">
                GUARDIAN
              </span>
              <span className="block font-mono text-[10px] text-ink-soft mt-1 uppercase tracking-wider">
                Super Admin
              </span>
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

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 font-mono text-xs">
        {NAV_STRUCTURE.map((item) => {
          const hasChildren = item.children && item.children.length > 0
          const isOpen = openSections[item.label]
          const isParentActive =
            location.pathname === item.to ||
            (hasChildren && item.children?.some((c) => location.pathname.startsWith(c.to.split('?')[0])))

          if (!hasChildren) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors relative group',
                    isActive
                      ? 'bg-signal/10 text-signal font-semibold'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
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
            <div key={item.label} className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  if (collapsed) onToggleCollapse()
                  toggleSection(item.label)
                }}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors group',
                  isParentActive ? 'text-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className={cn('h-4 w-4 shrink-0', isParentActive ? 'text-signal' : 'text-ink-soft')} />
                  {!collapsed && <span className="truncate font-sans font-medium text-xs">{item.label}</span>}
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
                    const childPathWithoutQuery = child.to.split('?')[0]
                    const childQuery = child.to.includes('?') ? child.to.split('?')[1] : ''
                    const isCurrentChild =
                      location.pathname === childPathWithoutQuery &&
                      (!childQuery || location.search.includes(childQuery))

                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={onMobileClose}
                        className={cn(
                          'block truncate rounded-md px-2 py-1.5 text-[11px] font-mono transition-colors',
                          isCurrentChild
                            ? 'text-signal font-semibold bg-signal/10'
                            : 'text-ink-soft hover:text-ink hover:bg-surface-2',
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

      <div className="border-t border-line p-2.5 bg-surface">
        <div className={cn('flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 p-2', collapsed && 'justify-center')}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-signal/20 text-signal font-mono text-xs font-bold border border-signal/30">
            AV
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block truncate font-sans text-xs font-semibold text-ink leading-none">
                Alexander Vance
              </span>
              <span className="block truncate font-mono text-[10px] text-ink-soft mt-1">
                SUPER_ADMIN
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
