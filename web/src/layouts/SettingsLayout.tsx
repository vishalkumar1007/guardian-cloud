import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Sliders,
  Palette,
  Shield,
  Key,
  Bell,
  HardDrive,
  Clock,
  Puzzle,
  FileCheck,
} from 'lucide-react'
import { cn } from '../lib/utils'

const SETTINGS_NAV = [
  { to: '/admin/settings/general', label: 'General', icon: Sliders },
  { to: '/admin/settings/appearance', label: 'Appearance & Theme', icon: Palette },
  { to: '/admin/settings/security', label: 'Security', icon: Shield },
  { to: '/admin/settings/authentication', label: 'Authentication', icon: Key },
  { to: '/admin/settings/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings/storage', label: 'Storage', icon: HardDrive },
  { to: '/admin/settings/retention', label: 'Retention', icon: Clock },
  { to: '/admin/settings/integrations', label: 'Integrations', icon: Puzzle },
  { to: '/admin/settings/defaults', label: 'Defaults', icon: FileCheck },
]

export function SettingsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink">Platform Settings</h1>
        <p className="text-xs text-ink-soft mt-1 font-mono">
          Global Guardian SaaS control-plane configuration, policies, data retention, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 font-mono text-xs border-b md:border-b-0 md:border-r border-line pr-0 md:pr-4">
          {SETTINGS_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-signal/10 text-signal font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
