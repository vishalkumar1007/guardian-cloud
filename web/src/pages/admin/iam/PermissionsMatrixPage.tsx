import React from 'react'
import { KeyRound, Check, Shield } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'

export function PermissionsMatrixPage() {
  const permissions = useAdminData(() => adminService.getPermissions())
  const roles = useAdminData(() => adminService.getRoles())

  // Categories
  const categories = Array.from(new Set(permissions.map((p) => p.category)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-signal" />
          Guardian IAM Fine-Grained Permissions Matrix
        </h1>
        <p className="text-xs text-ink-soft font-mono mt-0.5">
          Explicit resource and action permissions assigned across system administrator roles.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface font-mono text-xs shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-line bg-surface-2 text-ink-soft text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Permission Key</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                {roles.map((r) => (
                  <th key={r.id} className="py-3 px-3 text-center whitespace-nowrap">
                    {r.name.replace('Guardian ', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-surface-2/30">
                  <td className="py-2.5 px-4 font-bold text-signal font-mono text-[11px]">
                    {perm.key}
                  </td>
                  <td className="py-2.5 px-4 text-ink-soft">{perm.category}</td>
                  <td className="py-2.5 px-4 text-ink">{perm.description}</td>
                  {roles.map((r) => {
                    const hasPerm =
                      r.permissions.includes('*') ||
                      r.permissions.includes(perm.key) ||
                      r.permissions.some((p) => p.endsWith('.*') && perm.key.startsWith(p.replace('.*', ''))) ||
                      (r.permissions.includes('*.read') && perm.action === 'read')

                    return (
                      <td key={r.id} className="py-2.5 px-3 text-center">
                        {hasPerm ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 mx-auto">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
