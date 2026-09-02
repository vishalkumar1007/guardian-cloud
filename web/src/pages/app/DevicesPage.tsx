import { Link } from 'react-router-dom'
import { MOCK_DEVICES } from '../../data/mock'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

export function DevicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Devices</h1>
          <p className="mt-1 text-ink-soft">Enroll and watch every machine on your Personal plan.</p>
        </div>
        <Button variant="signal" size="sm">
          Enroll device
        </Button>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {MOCK_DEVICES.map((device) => (
          <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/app/devices/${device.id}`} className="font-display text-lg font-bold text-ink no-underline hover:text-signal">
                  {device.name}
                </Link>
                <Badge variant={device.status === 'online' ? 'signal' : 'soft'}>
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      device.status === 'online' ? 'bg-signal' : 'bg-ink-soft/50',
                    )}
                  />
                  {device.status}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                {device.platform} · agent {device.agentVersion} · {device.lastSeen}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/app/devices/${device.id}`}>Open</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
