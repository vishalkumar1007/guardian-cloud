import { useState, type FormEvent } from 'react'
import { MOCK_DEVICES } from '../../data/mock'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'

export function RecoveryPage() {
  const [submitted, setSubmitted] = useState(false)
  const [deviceId, setDeviceId] = useState(MOCK_DEVICES[1]?.id ?? 'win')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Recovery</h1>
        <p className="mt-1 text-ink-soft">Report lost or stolen devices and track protect status.</p>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-signal/30 bg-signal-soft/40 px-4 py-5">
          <Badge variant="signal">REQUEST OPEN</Badge>
          <p className="mt-3 font-display text-xl font-bold text-ink">Recovery request filed</p>
          <p className="mt-1 text-sm text-ink-soft">
            Protect commands queued for the selected device. Status updates will appear on the ribbon.
          </p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => setSubmitted(false)}>
            File another
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device">Device</Label>
            <select
              id="device"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-line bg-surface/70 px-3 text-sm outline-none focus:border-signal"
            >
              {MOCK_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">What happened</Label>
            <Input id="note" required placeholder="Left bag on train / stolen from cafe…" />
          </div>
          <Button type="submit" variant="alert">
            Report lost / stolen
          </Button>
        </form>
      )}

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Active protect</p>
        <ul className="mt-3 space-y-2">
          <li className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3 py-2.5 text-sm">
            <span>Travel Win — pending lock</span>
            <Badge variant="alert">LOST</Badge>
          </li>
        </ul>
      </div>
    </div>
  )
}
