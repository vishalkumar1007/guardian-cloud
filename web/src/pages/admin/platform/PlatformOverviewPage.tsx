import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Server, Flag, Package, Calendar, ShieldCheck, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function PlatformOverviewPage() {
  const services = useAdminData(() => adminService.getServicesHealth())
  const flags = useAdminData(() => adminService.getFeatureFlags())
  const releases = useAdminData(() => adminService.getAgentReleases())
  const windows = useAdminData(() => adminService.getMaintenanceWindows())
  const [env, setEnv] = useState<'PRODUCTION' | 'STAGING' | 'ALL'>('PRODUCTION' as any)
  const healthy = services.filter((s) => s.status === 'HEALTHY').length
  const nextMaint = windows[0]

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Server className="h-5 w-5 text-violet-500" />
            Platform Management
          </h1>
          <p className="text-ink-soft mt-0.5">Guardian infrastructure, service mesh, agent fleet, feature governance, and ops calendar — mocked UI, audit-logged actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-soft">Environment</span>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-line bg-surface-2">
            {(['PRODUCTION', 'STAGING', 'ALL'] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEnv(e)} className={`px-2.5 py-1 rounded-lg text-[11px] ${env === e ? 'bg-signal text-white' : 'text-ink-soft hover:text-ink'}`}>{e}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-line bg-surface">
          <span className="text-[10px] uppercase text-ink-soft">Cluster Status</span>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-2 mt-1"><CheckCircle2 className="h-4 w-4" /> {healthy}/{services.length} Healthy</div>
          <span className="text-[10px] text-ink-soft">Env filter: {env}</span>
        </div>
        <div className="p-4 rounded-xl border border-line bg-surface">
          <span className="text-[10px] uppercase text-ink-soft">Active Agent Channels</span>
          <div className="text-2xl font-bold text-ink mt-1">{releases.filter((r) => r.status === 'ACTIVE').length}</div>
          <span className="text-[10px] text-ink-soft">Latest {releases[0]?.version}</span>
        </div>
        <div className="p-4 rounded-xl border border-line bg-surface">
          <span className="text-[10px] uppercase text-ink-soft">Feature Flags Enabled</span>
          <div className="text-2xl font-bold text-signal mt-1">{flags.filter((f) => f.enabled).length}/{flags.length}</div>
          <span className="text-[10px] text-ink-soft">Progressive rollouts</span>
        </div>
        <div className="p-4 rounded-xl border border-line bg-surface">
          <span className="text-[10px] uppercase text-ink-soft">Next Maintenance</span>
          <div className="text-sm font-bold text-ink mt-1 truncate">{nextMaint?.title ?? '—'}</div>
          <span className="text-[10px] text-amber-400">{nextMaint ? new Date(nextMaint.startAt).toLocaleString() : 'No window'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-ink flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500" /> Services</span>
            <Link to="/admin/platform/health" className="text-signal text-[11px] hover:underline flex items-center gap-1">View health <ExternalLink className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-line">
            {services.slice(0, 5).map((s) => (
              <div key={s.id} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-ink font-semibold truncate">{s.name}</span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-ink flex items-center gap-2"><Flag className="h-4 w-4 text-signal" /> Flags</span>
            <Link to="/admin/platform/features" className="text-signal text-[11px] hover:underline flex items-center gap-1">Manage flags <ExternalLink className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-line">
            {flags.slice(0, 5).map((f) => (
              <div key={f.id} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-ink truncate">{f.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${f.enabled ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 'bg-surface-2 text-ink-soft border-line'}`}>{f.enabled ? 'ENABLED' : 'DISABLED'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-ink flex items-center gap-2"><Package className="h-4 w-4 text-sky-500" /> Agent Releases</span>
            <Link to="/admin/platform/agents" className="text-signal text-[11px] hover:underline flex items-center gap-1">Channels <ExternalLink className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-line">
            {releases.slice(0, 4).map((r) => (
              <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-signal font-bold">{r.version}</span>
                <span className="text-ink-soft">[{r.platform}] {r.adoptionRate}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-ink flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-500" /> Ops Calendar</span>
            <Link to="/admin/platform/maintenance" className="text-signal text-[11px] hover:underline flex items-center gap-1">Schedule <ExternalLink className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-line">
            {windows.slice(0, 4).map((w) => (
              <div key={w.id} className="px-4 py-2.5">
                <div className="font-semibold text-ink truncate">{w.title}</div>
                <div className="text-[11px] text-ink-soft">{new Date(w.startAt).toLocaleString()} — {w.impactLevel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
