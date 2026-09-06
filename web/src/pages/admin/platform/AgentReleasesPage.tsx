import React from 'react'
import { Package, ToggleLeft, ToggleRight, Download, CheckCircle2 } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function AgentReleasesPage() {
  const releases = useAdminData(() => adminService.getAgentReleases())

  function handleToggleMinSupported(releaseId: string) {
    adminService.toggleAgentMinSupported(releaseId)
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Package className="h-5 w-5 text-signal" />
          Guardian Endpoint Agent Release Channels
        </h1>
        <p className="text-ink-soft mt-0.5">
          macOS, Windows, and Linux client binaries, adoption rollouts, code-signing verification, and minimum supported version gates.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-surface-2 text-ink-soft text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Platform OS</th>
              <th className="py-3 px-4">Release Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Fleet Adoption</th>
              <th className="py-3 px-4">Minimum Supported Gate</th>
              <th className="py-3 px-4">Release Notes & SHA256</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {releases.map((rel) => (
              <tr key={rel.id} className="hover:bg-surface-2/30">
                <td className="py-3 px-4 font-bold text-signal">{rel.version}</td>
                <td className="py-3 px-4 text-ink font-semibold">[{rel.platform}]</td>
                <td className="py-3 px-4 text-ink-soft">{new Date(rel.releaseDate).toLocaleDateString()}</td>
                <td className="py-3 px-4"><StatusBadge status={rel.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${rel.adoptionRate}%` }} />
                    </div>
                    <span className="text-ink font-bold">{rel.adoptionRate}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleMinSupported(rel.id)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {rel.isMinSupported ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/60 font-semibold">
                        Strict Minimum (True)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-surface-2 text-ink-soft border border-line">
                        Optional (False)
                      </span>
                    )}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <span className="text-ink block truncate max-w-xs">{rel.releaseNotes}</span>
                  <span className="text-[10px] text-ink-soft font-mono block truncate max-w-xs">{rel.checksumSha256}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
