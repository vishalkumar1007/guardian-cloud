import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShieldAlert, CheckCheck, ExternalLink, X, Info } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface PlatformNotification {
  id: string
  title: string
  message: string
  timestamp: string
  type: 'CRITICAL_INCIDENT' | 'ONBOARDING' | 'SUBSCRIPTION' | 'AGENT_RELEASE'
  read: boolean
  link?: string
}

const INITIAL_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'notif-1',
    title: 'Critical Security Incident: C2 Beaconing',
    message: 'Workstation CYBERDYNE-WKSTN-08 quarantined after Cobalt Strike sleep mask match.',
    timestamp: '10m ago',
    type: 'CRITICAL_INCIDENT',
    read: false,
    link: '/admin/security/incidents',
  },
  {
    id: 'notif-2',
    title: 'New Enterprise Onboarding: Acme Defense',
    message: 'Acme Defense Technologies completed phase 2 enrollment with 650 devices.',
    timestamp: '45m ago',
    type: 'ONBOARDING',
    read: false,
    link: '/admin/organizations/org-101',
  },
  {
    id: 'notif-3',
    title: 'Subscription Past Due: Vanguard Quantum',
    message: 'Invoice inv-8890 payment failed; tenant status flagged for suspension review.',
    timestamp: '2h ago',
    type: 'SUBSCRIPTION',
    read: false,
    link: '/admin/subscriptions',
  },
  {
    id: 'notif-4',
    title: 'Agent Release v2.4.1 Rolled Out',
    message: 'macOS and Windows 2.4.1 clients reached 75% fleet adoption.',
    timestamp: '1d ago',
    type: 'AGENT_RELEASE',
    read: true,
    link: '/admin/platform/agents',
  },
]

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<PlatformNotification[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayed = filter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications

  function markAllAsRead() {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  function toggleRead(id: string) {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    )
  }

  return (
    <div className="absolute right-0 top-12 z-40 w-96 rounded-2xl border border-line bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-signal" />
          <span className="font-display text-sm font-semibold text-ink">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-signal/20 text-signal px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] font-mono text-ink-soft hover:text-ink flex items-center gap-1 px-1.5 py-1 rounded hover:bg-surface-2"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-line/80 px-3 py-1.5 text-xs font-mono">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={cn(
            'px-2.5 py-1 rounded font-medium transition-colors',
            filter === 'ALL' ? 'bg-surface-2 text-ink' : 'text-ink-soft hover:text-ink',
          )}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={cn(
            'px-2.5 py-1 rounded font-medium transition-colors',
            filter === 'UNREAD' ? 'bg-surface-2 text-ink' : 'text-ink-soft hover:text-ink',
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Items list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-line">
        {displayed.length > 0 ? (
          displayed.map((item) => (
            <div
              key={item.id}
              className={cn(
                'p-3 transition-colors hover:bg-surface-2 text-xs flex gap-3',
                !item.read && 'bg-signal/5',
              )}
            >
              <div className="mt-0.5 shrink-0">
                {item.type === 'CRITICAL_INCIDENT' ? (
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                ) : (
                  <Info className="h-4 w-4 text-signal" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn('font-semibold truncate text-ink', !item.read && 'text-ink')}>
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-ink-soft shrink-0">{item.timestamp}</span>
                </div>
                <p className="text-ink-soft text-[11px] leading-relaxed line-clamp-2">{item.message}</p>
                <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                  {item.link ? (
                    <Link
                      to={item.link}
                      onClick={onClose}
                      className="text-signal hover:text-orange-300 flex items-center gap-1 no-underline"
                    >
                      Inspect <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleRead(item.id)}
                    className="text-ink-soft hover:text-ink"
                  >
                    {item.read ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-ink-soft font-mono text-xs">
            No notifications in this view.
          </div>
        )}
      </div>

      <div className="border-t border-line/80 p-2 text-center">
        <Link
          to="/admin/audit"
          onClick={onClose}
          className="text-[11px] font-mono text-ink-soft hover:text-ink no-underline"
        >
          View full platform audit event stream →
        </Link>
      </div>
    </div>
  )
}
