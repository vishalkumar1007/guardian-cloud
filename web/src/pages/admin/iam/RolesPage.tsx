import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ExternalLink, Users, KeyRound } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'

export function RolesPage() {
  const roles = useAdminData(() => adminService.getRoles())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Shield className="h-5 w-5 text-signal" />
          Guardian IAM System Roles
        </h1>
        <p className="text-xs text-ink-soft font-mono mt-0.5">
          Internal administrative role definitions, capability matrices, and staff assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border border-line/80 bg-surface p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-signal font-bold tracking-wider">
                  System Role
                </span>
                <span className="text-ink-soft text-[10px]">
                  Updated {new Date(role.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink mt-1">{role.name}</h3>
              <p className="text-ink-soft text-xs mt-2 leading-relaxed">{role.description}</p>
            </div>

            <div className="border-t border-line pt-3 space-y-2">
              <div className="flex items-center justify-between text-ink">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <Users className="h-3.5 w-3.5" /> Assigned Staff:
                </span>
                <span className="font-bold text-ink">{role.adminCount}</span>
              </div>
              <div className="flex items-center justify-between text-ink">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <KeyRound className="h-3.5 w-3.5" /> Permission Rules:
                </span>
                <span className="text-signal font-semibold">{role.permissions.length} rules</span>
              </div>

              <Link
                to={`/admin/iam/roles/${role.id}`}
                className="block text-center rounded-lg bg-surface-2 border border-line py-2 text-ink hover:text-ink hover:border-line transition-colors no-underline text-xs mt-2"
              >
                Inspect Role & Permissions →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
