import React from 'react'
import { Key, ShieldBan, Laptop, MapPin, Globe } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function SessionsPage() {
  const sessions = useAdminData(() => adminService.getSessions())

  function handleRevoke(sessionId: string) {
    adminService.revokeSession(sessionId)
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Key className="h-5 w-5 text-signal" />
          Active Administrator Sessions
        </h1>
        <p className="text-ink-soft mt-0.5">
          Live internal administrator web and CLI sessions, cryptographic tokens, IP geolocation, and revocation controls.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-surface-2 text-ink-soft text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Admin</th>
              <th className="py-3 px-4">Device & OS</th>
              <th className="py-3 px-4">Browser / Client</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Last Active</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {sessions.map((ses) => (
              <tr key={ses.id} className="hover:bg-surface-2/30">
                <td className="py-3 px-4">
                  <span className="font-bold text-ink block">{ses.adminName}</span>
                  <span className="text-[10px] text-ink-soft">{ses.adminEmail}</span>
                </td>
                <td className="py-3 px-4 text-ink">{ses.device}</td>
                <td className="py-3 px-4 text-ink-soft">{ses.browser}</td>
                <td className="py-3 px-4 text-signal font-semibold">{ses.ipAddress}</td>
                <td className="py-3 px-4 text-ink-soft flex items-center gap-1 mt-2.5">
                  <MapPin className="h-3 w-3 text-ink-soft" /> {ses.location}
                </td>
                <td className="py-3 px-4 text-ink-soft">
                  {new Date(ses.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={ses.status} pulse={ses.status === 'ACTIVE'} />
                </td>
                <td className="py-3 px-4 text-right">
                  {ses.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(ses.id)}
                      className="px-2.5 py-1 rounded bg-rose-950/40 text-rose-400 border border-rose-800/60 hover:bg-rose-900/40"
                    >
                      Revoke
                    </button>
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
