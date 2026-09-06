import React, { useState } from 'react'
import { ShieldCheck, Calendar, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react'

export function AccessReviewsPage() {
  const [reviewed, setReviewed] = useState(false)

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-signal" />
          Quarterly IAM Privilege Access Reviews
        </h1>
        <p className="text-ink-soft mt-0.5">
          Periodic SOC2 & ISO 27001 compliant administrative access attestation.
        </p>
      </div>

      <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-signal uppercase font-bold tracking-wider">
              Active Review Cycle: Q3 2026
            </span>
            <h3 className="font-display text-base font-bold text-ink mt-1">Super Admin & Security Operations Attestation</h3>
            <p className="text-ink-soft mt-1">6 total administrative accounts subject to mandatory re-certification.</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-ink-soft block">Due In:</span>
            <span className="text-emerald-400 font-bold text-sm">14 Days (Sep 20, 2026)</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-line bg-surface-2/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <span className="text-ink font-semibold">Attestation Checklist</span>
              <p className="text-[11px] text-ink-soft">All 6 admins have confirmed hardware MFA and least-privilege scoping.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReviewed(true)}
            disabled={reviewed}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-ink font-semibold disabled:opacity-50"
          >
            {reviewed ? 'Attestation Certified' : 'Certify Q3 Privileges'}
          </button>
        </div>
      </div>
    </div>
  )
}
