import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Separator } from '../../components/ui/separator'

export function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(true)
  const [saved, setSaved] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(true)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-ink-soft">Account, profile, and notification preferences.</p>
      </div>

      <form onSubmit={onSubmit} className="max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" defaultValue="Alex Rivera" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="alex@example.com" />
        </div>
        <Button type="submit" variant="signal">
          Save profile
        </Button>
        {saved ? <p className="text-sm text-signal">Saved locally — F1.1 will persist to API.</p> : null}
      </form>

      <Separator />

      <div className="max-w-lg space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Notifications</p>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="email-alerts">Email on alerts</Label>
          <Switch id="email-alerts" checked={emailAlerts} onCheckedChange={setEmailAlerts} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="push-alerts">Push on offline</Label>
          <Switch id="push-alerts" checked={pushAlerts} onCheckedChange={setPushAlerts} />
        </div>
      </div>
    </div>
  )
}
