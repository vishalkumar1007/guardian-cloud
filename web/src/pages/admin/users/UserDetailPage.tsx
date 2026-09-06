import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  User,
  Laptop,
  Shield,
  AlertTriangle,
  Bell,
  CreditCard,
  Clock,
  Key,
  FileText,
  Settings,
  ArrowLeft,
  ShieldBan,
  RotateCcw,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog'
import { cn } from '../../../lib/utils'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')

  const user = useAdminData(() => adminService.getUserById(id ?? ''))
  const devices = useAdminData(() => adminService.getDevices().filter((d) => d.assignedUserId === id || d.tenantId === id))

  const [suspendOpen, setSuspendOpen] = useState(false)

  if (!user) {
    return (
      <div className="p-8 text-center space-y-3 font-mono">
        <h2 className="text-base text-ink">User Not Found</h2>
        <Link to="/admin/users" className="text-signal hover:underline text-xs">
          ← Back to Users
        </Link>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'devices', label: 'Devices', icon: Laptop, count: devices.length },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: 0 },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: 0 },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'sessions', label: 'Sessions', icon: Key, count: 2 },
    { id: 'audit', label: 'Audit', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  function handleSuspend(reason: string) {
    adminService.setUserStatus(user!.id, 'SUSPENDED', reason)
    setSuspendOpen(false)
  }

  function handleReactivate() {
    adminService.setUserStatus(user!.id, 'ACTIVE', 'Reactivated by Super Admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Individual Users
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-line/80 bg-surface/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-line font-display text-xl font-bold text-sky-400">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-bold tracking-tight text-ink">{user.name}</h1>
                <StatusBadge status={user.status} pulse={user.status === 'ACTIVE'} />
                <RiskBadge level={user.riskLevel} score={user.riskScore} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-ink-soft">
                <span>Email: <strong className="text-ink">{user.email}</strong></span>
                <span>•</span>
                <span>Plan: <strong className="text-signal">{user.planName}</strong></span>
                <span>•</span>
                <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {user.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => setSuspendOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/20 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40"
              >
                <ShieldBan className="h-3.5 w-3.5" /> Suspend
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReactivate}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-3 py-1.5 text-emerald-400 hover:bg-emerald-950/40"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reactivate
              </button>
            )}
          </div>
        </div>

        {/* 10 Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-line/80 pt-3 text-xs font-mono">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-signal/10 text-signal font-semibold border border-signal/20'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.2 text-[10px] text-ink-soft">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Security Score</span>
              <div className="font-display text-2xl font-bold text-emerald-400 mt-1">{user.securityScore} / 100</div>
              <span className="text-[11px] text-ink-soft">Optimal baseline</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Enrolled Devices</span>
              <div className="font-display text-2xl font-bold text-ink mt-1">{devices.length}</div>
              <span className="text-[11px] text-ink-soft">Allowance: 5 devices</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">MFA Method</span>
              <div className="font-display text-base font-bold text-sky-400 mt-2">{user.mfaMethod ?? 'TOTP'}</div>
              <span className="text-[11px] text-ink-soft">Enforced</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Subscription</span>
              <div className="font-display text-base font-bold text-ink mt-2">{user.planName}</div>
              <span className="text-[11px] text-emerald-400">{user.subscriptionStatus}</span>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
            <h3 className="font-display text-sm font-semibold text-ink">Registered Endpoints</h3>
            <div className="space-y-2">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface-2/60">
                  <div className="flex items-center gap-3">
                    <Laptop className="h-4 w-4 text-ink-soft" />
                    <div>
                      <span className="font-semibold text-ink">{d.displayName}</span>
                      <span className="block text-[11px] text-ink-soft">{d.platform} • {d.osVersion} • IP: {d.ipAddress}</span>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
              {devices.length === 0 && (
                <p className="text-ink-soft py-2">No personal devices registered yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">Device Posture ({devices.length})</h3>
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-ink">{d.hostname}</span>
                  <p className="text-[11px] text-ink-soft">Agent: {d.agentVersion} • Encryption: {d.encryptionStatus}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs placeholder views */}
      {['security', 'incidents', 'alerts', 'subscription', 'activity', 'sessions', 'audit', 'settings'].includes(activeTab) && (
        <div className="rounded-xl border border-line bg-surface p-6 text-center text-xs font-mono text-ink-soft">
          <p className="text-ink font-semibold mb-1 capitalize">{activeTab} Details</p>
          <span>Synced account information for {user.name} ({user.email}).</span>
        </div>
      )}

      <ConfirmDialog
        isOpen={suspendOpen}
        title={`Suspend ${user.name}`}
        description="Temporarily freeze access to personal Guardian recovery portal."
        consequences={['End sessions across all devices', 'Prevent passkey recovery']}
        confirmLabel="Suspend User"
        variant="danger"
        onConfirm={handleSuspend}
        onCancel={() => setSuspendOpen(false)}
      />
    </div>
  )
}
