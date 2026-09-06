import React from 'react'
import { SlidersHorizontal, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../lib/utils'

export function FeatureFlagsPage() {
  const flags = useAdminData(() => adminService.getFeatureFlags())

  function handleToggle(flagId: string) {
    adminService.toggleFeatureFlag(flagId)
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-signal" />
          Platform Operational Feature Flags
        </h1>
        <p className="text-ink-soft mt-0.5">
          Dynamic runtime toggles, autonomous containment overrides, eBPF heuristics, and progressive rollout percentages.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-surface-2 text-ink-soft text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Feature Flag Key</th>
              <th className="py-3 px-4">Target Environment</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Rollout %</th>
              <th className="py-3 px-4">Last Modified By</th>
              <th className="py-3 px-4 text-right">Toggle Switch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {flags.map((flag) => (
              <tr key={flag.id} className="hover:bg-surface-2/30">
                <td className="py-3 px-4">
                  <span className="font-bold text-ink block">{flag.name}</span>
                  <span className="text-[10px] text-signal block font-mono">{flag.key}</span>
                  <span className="text-[11px] text-ink-soft mt-0.5 block">{flag.description}</span>
                </td>
                <td className="py-3 px-4 text-ink">[{flag.environment}]</td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-bold uppercase',
                      flag.enabled
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                        : 'bg-surface-2 text-ink-soft border border-line',
                    )}
                  >
                    {flag.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-ink">{flag.rolloutPercentage}%</td>
                <td className="py-3 px-4 text-ink-soft">
                  <span className="block">{flag.updatedBy}</span>
                  <span className="text-[10px] text-ink-soft">{new Date(flag.updatedAt).toLocaleDateString()}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleToggle(flag.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      flag.enabled ? 'bg-signal' : 'bg-surface-2',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        flag.enabled ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
