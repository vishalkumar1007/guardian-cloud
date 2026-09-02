import { Link, useParams } from 'react-router-dom'
import { MOCK_DEVICES, MOCK_EVENTS } from '../../data/mock'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

export function DeviceDetailPage() {
  const { id } = useParams()
  const device = MOCK_DEVICES.find((d) => d.id === id) ?? MOCK_DEVICES[0]
  const events = MOCK_EVENTS.filter((e) => e.deviceId === device.id)

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/devices">← Devices</Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">{device.name}</h1>
          <Badge variant={device.status === 'online' ? 'signal' : 'alert'}>{device.status}</Badge>
        </div>
        <p className="mt-2 text-ink-soft">
          {device.platform} · {device.locationHint} · last seen {device.lastSeen}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { label: 'Agent', value: device.agentVersion },
          { label: 'Risk', value: device.risk },
          { label: 'Heartbeat', value: device.lastSeen },
        ].map((item) => (
          <div key={item.label} className="border-t border-line pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">{item.label}</p>
            <p className="mt-1 font-display text-xl font-bold capitalize text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Lock device
        </Button>
        <Button variant="alert" size="sm">
          Mark lost
        </Button>
        <Button variant="ghost" size="sm">
          Rotate enrollment
        </Button>
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Device timeline</p>
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="rounded-xl border border-line bg-surface/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={ev.tone === 'alert' ? 'alert' : ev.tone === 'signal' ? 'signal' : 'soft'}>
                  {ev.code}
                </Badge>
                <span className="font-mono text-[11px] text-ink-soft">{ev.when}</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{ev.detail}</p>
            </li>
          ))}
          {events.length === 0 ? <p className="text-sm text-ink-soft">No recent events for this device.</p> : null}
        </ul>
      </div>
    </div>
  )
}
