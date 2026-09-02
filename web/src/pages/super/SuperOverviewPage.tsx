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

export function SuperOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-ink-soft">Control-plane health across tenants, agents, and subscriptions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Tenants', value: '128' },
          { label: 'Agents online', value: '4.2k' },
          { label: 'API uptime', value: '99.95%' },
          { label: 'Open support', value: '7' },
        ].map((stat) => (
          <div key={stat.label} className="border-t border-line pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">System health</p>
          <Badge variant="signal">Live</Badge>
        </div>
        <div className="h-52 w-full rounded-xl border border-line bg-mist/30 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PLATFORM_HEALTH}>
              <CartesianGrid stroke="var(--g-line)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[96, 100]} tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: 'var(--g-mist)',
                  border: '1px solid var(--g-line)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="api" stroke="var(--g-signal)" fill="color-mix(in srgb, var(--g-signal) 18%, transparent)" strokeWidth={2} />
              <Area type="monotone" dataKey="agents" stroke="var(--g-ink-soft)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
