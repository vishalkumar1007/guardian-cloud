import React, { useState } from 'react'
import { ShieldAlert, X, Info } from 'lucide-react'

interface SimulatedActionDialogProps {
  isOpen: boolean
  actionName: string
  targetDeviceName: string
  commandType: 'LOCK' | 'WIPE' | 'ISOLATE' | 'SYNC'
  onExecute: (reason: string) => void
  onCancel: () => void
}

export function SimulatedActionDialog({
  isOpen,
  actionName,
  targetDeviceName,
  commandType,
  onExecute,
  onCancel,
}: SimulatedActionDialogProps) {
  const [reason, setReason] = useState('Security incident containment verification')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
        {/* Banner: DEMO / SIMULATED */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300 font-mono">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>DEMO / SIMULATED ACTION:</strong> No physical hardware will be affected.
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-900/60 bg-rose-950/40 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">{actionName}</h3>
              <p className="text-xs text-ink-soft font-mono mt-0.5">Target: {targetDeviceName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink-soft hover:text-ink transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-ink leading-relaxed">
          You are initiating a simulated remote device action ({commandType}). In production, this issues a cryptographically signed mTLS command payload to the Guardian Agent daemon.
        </p>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
            Operator Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-ink focus:border-signal/80 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/80">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-xs font-medium text-ink hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onExecute(reason)}
            className="rounded-lg bg-signal hover:bg-signal/90 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            Dispatch Simulated {commandType}
          </button>
        </div>
      </div>
    </div>
  )
}
