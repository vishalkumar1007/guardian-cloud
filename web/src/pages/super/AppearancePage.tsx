import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'
import { LIGHT_DEFAULTS, DARK_DEFAULTS, applySchemeToTheme, type ColorScheme, type ThemeTokens } from '../../theme/tokens'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { GuardianMark } from '../../components/GuardianMark'
import { Separator } from '../../components/ui/separator'
import { IconShieldCheck } from '../../components/icons/SecurityIcons'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'

const FIELDS: { key: keyof ThemeTokens; label: string; color?: boolean }[] = [
  { key: 'ink', label: 'Ink (text)', color: true },
  { key: 'inkSoft', label: 'Ink soft', color: true },
  { key: 'mist', label: 'Mist (bg)', color: true },
  { key: 'mistDeep', label: 'Mist deep', color: true },
  { key: 'signal', label: 'Signal', color: true },
  { key: 'signalSoft', label: 'Signal soft', color: true },
  { key: 'alert', label: 'Alert / protect', color: true },
  { key: 'atmosphereMode', label: 'Atmosphere mode' },
]

function pickTokens(theme: ThemeTokens): ThemeTokens {
  return { ...theme }
}

export function AppearancePage() {
  const { theme, applyLocal, save, resetDefaults, applySchemePreset, localScheme, setLocalScheme } = useTheme()
  const [dirty, setDirty] = useState<ThemeTokens | null>(null)
  const draft = dirty ?? pickTokens(theme)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function updateField<K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) {
    const next = { ...draft, [key]: value }
    setDirty(next)
    applyLocal(next, theme.version)
  }

  function onScheme(scheme: ColorScheme) {
    const next = applySchemeToTheme(draft, scheme)
    setDirty(next)
    applySchemePreset(scheme)
  }

  async function onSave() {
    setSaving(true)
    setStatus(null)
    try {
      await save(draft)
      setDirty(null)
      setStatus('Theme published — home, auth, and all dashboards sync live.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onReset() {
    setSaving(true)
    setStatus(null)
    try {
      await resetDefaults()
      setDirty(null)
      setStatus('Reset to dark Watchline defaults.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Appearance</h1>
          <p className="mt-1 text-ink-soft">
            Platform light/dark scheme and tokens. Changes recolor home, login, and every portal.
          </p>
        </div>
        <Badge variant="soft">
          {draft.colorScheme} · v{theme.version}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={draft.colorScheme} onValueChange={(v) => onScheme(v as ColorScheme)}>
          <TabsList>
            <TabsTrigger value="dark">Dark (Platform)</TabsTrigger>
            <TabsTrigger value="light">Light (Platform)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-1.5 text-xs">
          <span className="font-mono text-ink-soft">
            LocalStorage: <strong className="text-signal">{localScheme ? localScheme.toUpperCase() : 'None'}</strong>
          </span>
          <button
            type="button"
            onClick={() => setLocalScheme('light')}
            className={`rounded-lg border border-line px-2 py-0.5 font-mono text-[11px] ${localScheme === 'light' ? 'bg-signal text-mist-deep' : 'bg-surface text-ink'}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setLocalScheme('dark')}
            className={`rounded-lg border border-line px-2 py-0.5 font-mono text-[11px] ${localScheme === 'dark' ? 'bg-signal text-mist-deep' : 'bg-surface text-ink'}`}
          >
            Dark
          </button>
          {localScheme && (
            <button
              type="button"
              onClick={() => setLocalScheme(null)}
              className="rounded-lg border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="grid gap-2 sm:grid-cols-[140px_1fr_auto] sm:items-center">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={String(draft[field.key])}
                onChange={(e) => updateField(field.key, e.target.value as ThemeTokens[typeof field.key])}
                className="bg-mist/30"
              />
              {field.color ? (
                <input
                  type="color"
                  aria-label={`${field.label} picker`}
                  value={/^#[0-9a-fA-F]{6}$/.test(String(draft[field.key])) ? String(draft[field.key]) : '#000000'}
                  onChange={(e) => updateField(field.key, e.target.value as ThemeTokens[typeof field.key])}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-transparent p-1"
                />
              ) : (
                <span />
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="signal" onClick={() => void onSave()} disabled={saving}>
              {saving ? 'Saving…' : 'Save theme'}
            </Button>
            <Button variant="outline" onClick={() => void onReset()} disabled={saving}>
              Reset dark defaults
            </Button>
          </div>
          {status ? <p className="text-sm text-ink-soft">{status}</p> : null}
        </div>

        <div className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Live preview</p>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <GuardianMark className="h-5 w-5 text-signal" />
                <span className="font-display text-sm font-bold">Guardian</span>
              </div>
              <IconShieldCheck className="h-12 w-12" />
              <div className="rounded-xl border border-line bg-mist/40 px-3 py-2 text-xs text-ink-soft">
                Dashboard glass chip ·{' '}
                <span className="text-signal">signal</span> · <span className="text-alert">protect</span>
              </div>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-ink-soft">
            Auth: <code className="font-mono">GUARDIAN_PLATFORM_DEV_TOKEN</code>
          </p>
        </div>
      </div>
    </div>
  )
}
