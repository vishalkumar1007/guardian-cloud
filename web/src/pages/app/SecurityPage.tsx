import { useState } from 'react'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'

export function SecurityPage() {
  const [lockOnOffline, setLockOnOffline] = useState(true)
  const [trustedFace, setTrustedFace] = useState(true)
  const [screenshotEvidence, setScreenshotEvidence] = useState(false)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Security</h1>
        <p className="mt-1 text-ink-soft">Personal protect posture and trusted identity on your watchline.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="signal">Template: Personal Guard</Badge>
        <Badge variant="soft">Policy sync OK</Badge>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <div>
            <Label htmlFor="lock-offline">Auto-lock when offline</Label>
            <p className="mt-1 text-sm text-ink-soft">Escalate protect if heartbeat is lost beyond the window.</p>
          </div>
          <Switch id="lock-offline" checked={lockOnOffline} onCheckedChange={setLockOnOffline} />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <div>
            <Label htmlFor="trusted-face">Trusted face gate</Label>
            <p className="mt-1 text-sm text-ink-soft">Require enrolled face match for sensitive unlocks.</p>
          </div>
          <Switch id="trusted-face" checked={trustedFace} onCheckedChange={setTrustedFace} />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <div>
            <Label htmlFor="evidence">Screenshot evidence</Label>
            <p className="mt-1 text-sm text-ink-soft">Capture desktop evidence on high-severity alerts.</p>
          </div>
          <Switch id="evidence" checked={screenshotEvidence} onCheckedChange={setScreenshotEvidence} />
        </div>
      </div>

      <Separator />

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Trusted faces</p>
        <div className="mt-3 flex gap-3">
          {['You', 'Partner'].map((name) => (
            <div
              key={name}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-line bg-surface/60"
            >
              <span className="font-display text-sm font-bold text-ink">{name}</span>
              <span className="mt-1 font-mono text-[9px] uppercase text-signal">Enrolled</span>
            </div>
          ))}
          <button
            type="button"
            className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-soft transition hover:border-signal hover:text-ink"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
