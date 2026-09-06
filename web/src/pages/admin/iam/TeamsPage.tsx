import React from 'react'
import { Users, MessageSquare, Mail, Plus } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'

export function TeamsPage() {
  const teams = useAdminData(() => adminService.getTeams())

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Users className="h-5 w-5 text-signal" />
            Guardian Internal Engineering & SOC Teams
          </h1>
          <p className="text-ink-soft mt-0.5">
            Internal departments responsible for platform gateway, threat hunting, and customer success.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="p-4 rounded-xl border border-line bg-surface space-y-3">
            <div>
              <span className="text-[10px] uppercase text-signal font-bold tracking-wider">
                Internal Department
              </span>
              <h3 className="font-display text-base font-bold text-ink mt-1">{t.name}</h3>
              <p className="text-ink-soft text-xs mt-1">{t.description}</p>
            </div>

            <div className="border-t border-line pt-3 space-y-1.5 text-ink">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Department Lead:</span>
                <span className="text-ink truncate max-w-[160px]">{t.leadEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Active Members:</span>
                <span className="text-emerald-400 font-bold">{t.memberCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Escalation Channel:</span>
                <span className="text-sky-400">{t.slackChannel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
