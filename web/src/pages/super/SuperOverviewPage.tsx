import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PLATFORM_HEALTH } from '../../data/mock'
import { Badge } from '../../components/ui/badge'
import { Users, Server, Activity, LifeBuoy, TrendingUp, TrendingDown } from 'lucide-react'

const KPI = [
  { label: 'Active tenants', value: '128', delta: '+4.2%', up: true, icon: Users },
  { label: 'Agents online', value: '4.2k', delta: '+2.1%', up: true, icon: Server },
  { label: 'API uptime', value: '99.95%', delta: '-0.02%', up: false, icon: Activity },
  { label: 'Open support', value: '7', delta: '−2 today', up: true, icon: LifeBuoy },
]

export function SuperOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Real-time health — control plane, 7 / 30 / 90 days</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-xs font-medium text-signal">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Live
          </span>
          <span className="rounded-full bg-surface border border-line px-2.5 py-1 font-mono text-xs text-ink-soft">7 days</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-signal/10 text-signal">
                <Icon className="h-4 w-4" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{k.label}</p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">{k.value}</p>
              <p className={`mt-1 inline-flex items-center gap-1 font-mono text-xs font-medium ${k.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {k.delta}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="font-display text-sm font-semibold text-ink">Platform health — API vs Agents</h3>
            <span className="font-mono text-[11px] text-ink-soft">Mon → Sun</span>
          </div>
          <div className="h-56 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PLATFORM_HEALTH}>
                <CartesianGrid stroke="var(--g-line)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[96, 100]} tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: 'var(--g-surface)', border: '1px solid var(--g-line)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="api" stroke="var(--g-signal)" fill="color-mix(in srgb, var(--g-signal) 18%, transparent)" strokeWidth={2.5} dot={{ r: 2.5, fill: 'var(--g-signal)' }} />
                <Area type="monotone" dataKey="agents" stroke="var(--g-ink-soft)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <h3 className="font-display text-sm font-semibold text-ink">Plan mix</h3>
            <p className="font-mono text-[11px] text-ink-soft">12.8k active subscriptions</p>
          </div>
          <div className="p-4 flex flex-col items-center gap-4">
            <div className="h-28 w-28 rounded-full" style={{ background: `conic-gradient(var(--g-signal) 0 50%, color-mix(in srgb, var(--g-signal) 65%, #8b5cf6) 50% 88%, var(--g-line) 88% 100%)` }}>
              <div className="h-full w-full rounded-full bg-surface m-[14px] flex items-center justify-center" style={{ width: 'calc(100% - 28px)', height: 'calc(100% - 28px)', margin: '14px' }}>
                <span className="font-display text-lg font-bold text-ink">Pro 50%</span>
              </div>
            </div>
            <div className="w-full space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--g-signal)]" /> Pro</span><span className="font-semibold text-ink">50%</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> Teams</span><span className="font-semibold text-ink">38%</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--g-line)]" /> Free</span><span className="font-semibold text-ink">12%</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="font-display text-sm font-semibold text-ink">System health</h3>
          <Badge variant="soft">Goose v10 OK</Badge>
        </div>
        <div className="divide-y divide-line">
          {[
            { name: 'Auth API', latency: '142 ms', status: 'ok' },
            { name: 'Device ingest', latency: '88 ms', status: 'ok' },
            { name: 'Postgres pool', latency: '12 ms', status: 'ok' },
            { name: 'Redis cache', latency: '4 ms', status: 'warn' },
          ].map((r) => (
            <div key={r.name} className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-ink"><span className={`h-2 w-2 rounded-full ${r.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {r.name}</span>
              <span className="font-mono text-xs text-ink-soft">{r.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
