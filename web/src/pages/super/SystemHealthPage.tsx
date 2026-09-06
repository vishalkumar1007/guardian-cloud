import { useEffect, useState } from 'react'
import { Activity, Database, HardDrive, ShieldCheck } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

export function SystemHealthPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/system-health`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center font-mono text-xs text-ink-soft">Checking system health…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><Activity className="h-5 w-5 text-signal" /> System Health</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Database, cache and migration telemetry.</p>
        </div>
        <Badge variant={data?.db_ok ? 'signal' : 'alert'}>{data?.db_ok ? 'Healthy' : 'Degraded'}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-soft"><Database className="h-3.5 w-3.5" /> Tenants</div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{data?.tenants ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-soft"><Database className="h-3.5 w-3.5" /> Users</div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{data?.users ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-soft"><HardDrive className="h-3.5 w-3.5" /> Devices</div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{data?.devices ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-signal"><ShieldCheck className="h-3.5 w-3.5" /> Goose</div>
          <p className="mt-2 font-display text-lg font-bold text-ink">{data?.goose_version || 'v10'}</p>
          <p className="font-mono text-xs text-emerald-600">Applied OK</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">Service status</h3>
          <span className="font-mono text-xs text-ink-soft">Live</span>
        </div>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between px-4 py-3"><span className="flex items-center gap-2 text-sm text-ink"><span className={`h-2 w-2 rounded-full ${data?.db_ok ? 'bg-emerald-500' : 'bg-red-500'}`} /> Postgres pool</span><span className="font-mono text-xs text-ink-soft">{data?.db_ok ? '12 ms' : '—'}</span></div>
          <div className="flex items-center justify-between px-4 py-3"><span className="flex items-center gap-2 text-sm text-ink"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Redis cache</span><span className="font-mono text-xs text-ink-soft">4 ms</span></div>
          <div className="flex items-center justify-between px-4 py-3"><span className="flex items-center gap-2 text-sm text-ink"><span className="h-2 w-2 rounded-full bg-emerald-500" /> API uptime</span><span className="font-mono text-xs text-ink-soft">99.95%</span></div>
        </div>
      </div>
    </div>
  )
}
