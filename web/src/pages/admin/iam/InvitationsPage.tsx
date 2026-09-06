import React from 'react'
import { Mail, RotateCcw, XCircle, Clock } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function InvitationsPage() {
  const invitations = useAdminData(() => adminService.getInvitations())

  function handleResend(inv: any) {
    alert(`Invitation re-sent to ${inv.email}.`)
  }

  function handleRevoke(invId: string) {
    adminService.revokeInvitation(invId)
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Mail className="h-5 w-5 text-signal" />
          Pending Administrator Invitations
        </h1>
        <p className="text-ink-soft mt-0.5">
          Pending internal team invitations, token expiration windows, and onboarding links.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-surface-2 text-ink-soft text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Invited Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-4">Invited By</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Expires</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-surface-2/30">
                <td className="py-3 px-4 font-bold text-ink">{inv.email}</td>
                <td className="py-3 px-4 text-signal font-semibold">{inv.role}</td>
                <td className="py-3 px-4 text-ink-soft">{inv.team}</td>
                <td className="py-3 px-4 text-ink">{inv.invitedBy}</td>
                <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                <td className="py-3 px-4 text-ink-soft">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right">
                  {inv.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleResend(inv)}
                        className="px-2 py-1 rounded bg-surface-2 text-ink hover:text-ink"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.id)}
                        className="px-2 py-1 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/40"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
