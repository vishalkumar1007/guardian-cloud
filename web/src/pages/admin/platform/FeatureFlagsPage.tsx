import React, { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../lib/utils'

export function FeatureFlagsPage() {
  const flags = useAdminData(() => adminService.getFeatureFlags())
  const [env, setEnv] = useState<'ALL' | 'PRODUCTION' | 'STAGING'>('ALL')
  function handleToggle(flagId: string) {
    adminService.toggleFeatureFlag(flagId)
  }
  const filtered = env === 'ALL' ? flags : flags.filter((f) => f.environment === env || f.environment === 'ALL')

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-signal" />
            Feature Flags & Experiments
          </h1>
          <p className="text-ink-soft mt-0.5">Mock governance — toggles are in-memory, audit-logged. No real rollout.</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border border-line bg-surface-2">
          {(['ALL', 'PRODUCTION', 'STAGING'] as const).map((e) => (
            <button key={e} type="button" onClick={() => setEnv(e)} className={`px-2.5 py-1 rounded-lg text-[11px] ${env === e ? 'bg-signal text-white' : 'text-ink-soft hover:text-ink'}`}>{e}</button>
          ))}
        </div>
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
            {filtered.map((flag) => (
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
