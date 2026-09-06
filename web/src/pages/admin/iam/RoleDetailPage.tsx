import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, ArrowLeft, Check, Users, KeyRound } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../lib/utils'

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const role = useAdminData(() => adminService.getRoleById(id ?? ''))
  const permissions = useAdminData(() => adminService.getPermissions())
  const admins = useAdminData(() => adminService.getAdmins().filter((a) => a.role === role?.key))

  const [activeTab, setActiveTab] = useState<'info' | 'permissions' | 'admins'>('info')

  if (!role) {
    return (
      <div className="p-8 text-center space-y-3 font-mono">
        <h2 className="text-base text-ink">Role Not Found</h2>
        <Link to="/admin/iam/roles" className="text-signal hover:underline text-xs">
          ← Back to Roles
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <Link
          to="/admin/iam/roles"
          className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Roles
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink">{role.name}</h1>
              <span className="text-signal font-semibold">[{role.key}]</span>
            </div>
            <p className="text-ink-soft mt-1">{role.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={cn('px-3 py-1.5 rounded-lg', activeTab === 'info' ? 'bg-signal/10 text-signal font-semibold' : 'text-ink-soft hover:text-ink')}
          >
            Role Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={cn('px-3 py-1.5 rounded-lg', activeTab === 'permissions' ? 'bg-signal/10 text-signal font-semibold' : 'text-ink-soft hover:text-ink')}
          >
            Permissions ({role.permissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={cn('px-3 py-1.5 rounded-lg', activeTab === 'admins' ? 'bg-signal/10 text-signal font-semibold' : 'text-ink-soft hover:text-ink')}
          >
            Assigned Admins ({admins.length})
          </button>
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
          <h3 className="font-bold text-ink text-sm">Security Model Boundaries</h3>
          <p className="text-ink-soft leading-relaxed">
            Guardian IAM controls internal staff authorizations for operating the multi-tenant SaaS control plane. This role is completely walled off from customer tenant organizations.
          </p>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <h3 className="font-bold text-ink text-sm">Fine-Grained Permission Grants</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {role.permissions.map((perm) => (
              <div key={perm} className="p-2.5 rounded-lg bg-surface-2 border border-line flex items-center gap-2 text-ink">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-ink">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <h3 className="font-bold text-ink text-sm">Staff Members with this Role</h3>
          <div className="space-y-2">
            {admins.map((adm) => (
              <div key={adm.id} className="p-3 rounded-lg bg-surface-2 border border-line flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink">{adm.name}</span>
                  <span className="block text-[10px] text-ink-soft">{adm.email}</span>
                </div>
                <Link to={`/admin/iam/users/${adm.id}`} className="text-signal hover:underline">
                  Inspect User →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
