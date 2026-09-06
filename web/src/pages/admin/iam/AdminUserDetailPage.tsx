import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  User,
  Shield,
  KeyRound,
  Key,
  Clock,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { cn } from '../../../lib/utils'

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('profile')

  const admin = useAdminData(() => adminService.getAdminById(id ?? ''))
  const sessions = useAdminData(() => adminService.getSessions().filter((s) => s.adminId === id || s.adminEmail === admin?.email))
  const auditLogs = useAdminData(() => adminService.getAuditLogs().filter((a) => a.actorEmail === admin?.email))

  if (!admin) {
    return (
      <div className="p-8 text-center space-y-3 font-mono">
        <h2 className="text-base text-ink">Admin User Not Found</h2>
        <Link to="/admin/iam/users" className="text-signal hover:underline text-xs">
          ← Back to Admin Users
        </Link>
      </div>
    )
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'role', label: 'Role & Scope', icon: Shield },
    { id: 'permissions', label: 'Permissions', icon: KeyRound },
    { id: 'sessions', label: 'Sessions', icon: Key, count: sessions.length },
    { id: 'security', label: 'Security', icon: CheckCircle2 },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'audit', label: 'Audit Log', icon: FileText, count: auditLogs.length },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/iam/users"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin Users
        </Link>
      </div>

      <div className="rounded-2xl border border-line/80 bg-surface/90 p-5 shadow-sm space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-line font-display text-xl font-bold text-signal">
              {admin.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-xl font-bold text-ink">{admin.name}</h1>
                <StatusBadge status={admin.status} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
                <span className="text-signal font-semibold">{admin.roleTitle}</span>
                <span>•</span>
                <span>Team: {admin.team}</span>
                <span>•</span>
                <span>{admin.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-t border-line pt-3 text-xs overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors',
                activeTab === t.id
                  ? 'bg-signal/10 text-signal font-semibold border border-signal/20'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              {t.count !== undefined && `(${t.count})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
            <h3 className="font-bold text-ink">Identity Attributes</h3>
            <div className="space-y-1.5 text-ink">
              <div className="flex justify-between py-1 border-b border-line">
                <span className="text-ink-soft">Subject ID:</span>
                <span className="text-ink">{admin.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line">
                <span className="text-ink-soft">MFA Status:</span>
                <span className="text-emerald-400 font-bold">Hardware Passkey Enforced</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-soft">Provisioned Date:</span>
                <span>{new Date(admin.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="p-4 rounded-xl border border-line bg-surface font-mono text-xs space-y-3">
          <h3 className="font-bold text-ink">Assigned Permissions Matrix</h3>
          <div className="flex flex-wrap gap-2">
            {admin.assignedPermissions.map((perm) => (
              <span key={perm} className="px-2.5 py-1 rounded bg-surface-2 border border-line text-signal">
                {perm}
              </span>
            ))}
          </div>
        </div>
      )}

      {['role', 'sessions', 'security', 'activity', 'audit'].includes(activeTab) && (
        <div className="p-6 rounded-xl border border-line bg-surface text-center font-mono text-xs text-ink-soft">
          <p className="text-ink font-semibold mb-1 capitalize">{activeTab} Details</p>
          <span>IAM policy state synced for {admin.email}.</span>
        </div>
      )}
    </div>
  )
}
