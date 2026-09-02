import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MOCK_DEVICES, MOCK_EVENTS, SIGNAL_SERIES } from '../../data/mock'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'

export function OverviewPage() {
  const online = MOCK_DEVICES.filter((d) => d.status === 'online').length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-ink-soft">Your devices and latest signals on one watchline.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/devices">Manage devices</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Online', value: `${online}/${MOCK_DEVICES.length}` },
          { label: 'Open signals', value: String(MOCK_EVENTS.filter((e) => e.tone === 'alert').length) },
          { label: 'Risk posture', value: 'Guarded' },
        ].map((stat) => (
          <div key={stat.label} className="border-t border-line pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Signal trend</p>
        <div className="h-56 w-full rounded-xl border border-line bg-mist/30 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SIGNAL_SERIES}>
              <defs>
                <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--g-signal)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--g-signal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--g-line)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  background: 'var(--g-mist)',
                  border: '1px solid var(--g-line)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="signals" stroke="var(--g-signal)" fill="url(#signalFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="risk" stroke="var(--g-alert)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Recent ribbon</p>
        <ul className="space-y-2">
          {MOCK_EVENTS.slice(0, 4).map((ev) => (
            <li
              key={ev.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Badge variant={ev.tone === 'alert' ? 'alert' : ev.tone === 'signal' ? 'signal' : 'soft'}>
                  {ev.code}
                </Badge>
                <span className="text-sm text-ink-soft">{ev.deviceName}</span>
              </div>
              <span className="font-mono text-[11px] text-ink-soft">{ev.when}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
