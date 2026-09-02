import { Badge } from '../../components/ui/badge'

export function OrgOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Organization overview</h1>
        <p className="mt-1 text-ink-soft">Inventory, policy posture, and open security work for your tenant.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Employees', value: '48' },
          { label: 'Devices', value: '61' },
          { label: 'Open alerts', value: '3' },
          { label: 'Policy coverage', value: '94%' },
        ].map((stat) => (
          <div key={stat.label} className="border-t border-line pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Attention</p>
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3 py-2.5 text-sm">
            <span>2 devices missing agent heartbeat</span>
            <Badge variant="alert">HEALTH</Badge>
          </li>
          <li className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3 py-2.5 text-sm">
            <span>Finance group policy pending publish</span>
            <Badge variant="soft">POLICY</Badge>
          </li>
        </ul>
      </div>
    </div>
  )
}
