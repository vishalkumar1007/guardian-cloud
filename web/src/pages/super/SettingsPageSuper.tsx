import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../theme/useTheme'
import { ACCENT_PRESETS, FONT_PAIRS, RADIUS_PRESETS, applySchemeToTheme, type ThemeTokens } from '../../theme/tokens'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Building2, Palette, KeyRound, Plug, User, ShieldCheck, Bell, Monitor, Smartphone } from 'lucide-react'
import { GuardianMark } from '../../components/GuardianMark'

type SettingsTab = 'org' | 'appearance' | 'api' | 'platform' | 'profile' | 'security' | 'notif'

const TABS: { id: SettingsTab; label: string; icon: any; section: 'platform' | 'admin' }[] = [
  { id: 'org', label: 'Organization', icon: Building2, section: 'platform' },
  { id: 'appearance', label: 'Appearance', icon: Palette, section: 'platform' },
  { id: 'api', label: 'API & Webhooks', icon: KeyRound, section: 'platform' },
  { id: 'platform', label: 'Platform', icon: Plug, section: 'platform' },
  { id: 'profile', label: 'Admin profile', icon: User, section: 'admin' },
  { id: 'security', label: 'Security', icon: ShieldCheck, section: 'admin' },
  { id: 'notif', label: 'Notifications', icon: Bell, section: 'admin' },
]

function apiBase() {
  return (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

export function SettingsPageSuper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile'
  const [tab, setTab] = useState<SettingsTab>(['org','appearance','api','platform','profile','security','notif'].includes(initialTab) ? initialTab : 'profile')
  const { theme, applyLocal, save, localScheme, setLocalScheme } = useTheme()
  const [draft, setDraft] = useState<ThemeTokens>(theme)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [orgName, setOrgName] = useState('Guardian')
  const [workspaceUrl, setWorkspaceUrl] = useState('guardian.local')
  const [profileName, setProfileName] = useState('Super Admin')
  const [profileEmail, setProfileEmail] = useState('superadmin@guardian.local')

  useEffect(() => setDraft(theme), [theme])

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/admin/settings`)
      .then((r) => r.json())
      .then((data) => {
        setSettings(data || {})
        if (data?.org) {
          if (data.org.name) setOrgName(data.org.name)
          if (data.org.workspaceUrl) setWorkspaceUrl(data.org.workspaceUrl)
        }
        if (data?.profile) {
          if (data.profile.displayName) setProfileName(data.profile.displayName)
          if (data.profile.email) setProfileEmail(data.profile.email)
        }
      })
      .catch(() => {})
  }, [])

  async function persistCategory(category: string, data: any) {
    try {
      localStorage.setItem(`guardian-admin-${category}`, JSON.stringify(data))
    } catch {}
    try {
      await fetch(`${apiBase()}/api/v1/admin/settings/${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {}
    try {
      const all = { ...settings, [category]: data }
      localStorage.setItem('guardian-admin-settings', JSON.stringify(all))
      setSettings(all)
    } catch {}
  }

  function switchTab(next: SettingsTab) {
    setTab(next)
    setSearchParams(next === 'profile' ? {} : { tab: next }, { replace: true })
  }

  const platformTabs = TABS.filter((t) => t.section === 'platform')
  const adminTabs = TABS.filter((t) => t.section === 'admin')

  function updateDraft(patch: Partial<ThemeTokens>) {
    const next = { ...draft, ...patch }
    setDraft(next)
    applyLocal(next, theme.version)
  }

  async function handleSaveAppearance() {
    setSaving(true)
    try {
      await save(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // keep draft
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 font-mono text-xs text-ink-soft">Admin profile and workspace configuration.</p>
      </div>

      <div className="set-grid">
        <div className="set-nav">
          <div className="set-section">Platform</div>
          {platformTabs.map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => switchTab(t.id)} className={`set-link ${tab === t.id ? 'on' : ''}`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
          <div className="set-section">Admin</div>
          {adminTabs.map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => switchTab(t.id)} className={`set-link ${tab === t.id ? 'on' : ''}`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>

        <div>
          {tab === 'profile' && (
            <div className="set-panel g-card">
              <div className="prof-head">
                <div className="avatar">SA</div>
                <div>
                  <h3>Super Admin</h3>
                  <span>Platform Admin · {profileEmail}</span>
                </div>
                <button className="ml-auto rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink-soft">Change photo</button>
              </div>
              <div className="form-2">
                <div className="field2"><label>Full name</label><input value={profileName} onChange={(e) => setProfileName(e.target.value)} /></div>
                <div className="field2"><label>Email</label><input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} /></div>
                <div className="field2"><label>Role</label><input value="SUPER_ADMIN" disabled /></div>
                <div className="field2"><label>Admin ID</label><input value="00000000-0000-4000-8000-0000000000bb" disabled style={{ fontFamily: 'monospace', fontSize: '11px' }} /></div>
              </div>
              <div className="set-row"><div className="sr-l"><b>Two-factor authentication</b><span>Authenticator app</span></div><span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-600">Enabled</span></div>
              <div className="set-row"><div className="sr-l"><b>Active sessions</b><span>1 device</span></div><button className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink">Manage</button></div>
              <div className="pt-3"><button onClick={() => void persistCategory('profile', { displayName: profileName, email: profileEmail })} className="rounded-full bg-ink text-mist px-4 py-1.5 text-xs font-semibold hover:bg-ink/90">Save profile — DB + local</button></div>
            </div>
          )}

          {tab === 'org' && (
            <div className="set-panel g-card">
              <h3>Organization</h3>
              <div className="sd">Workspace-wide settings for Guardian. Saved to DB + localStorage.</div>
              <div className="field2"><label>Organization name</label><input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
              <div className="field2"><label>Workspace URL</label><input value={workspaceUrl} onChange={(e) => setWorkspaceUrl(e.target.value)} /></div>
              <div className="field2"><label>Default plan for new seats</label><select><option>Personal Basic</option><option>Enterprise</option></select></div>
              <div className="set-row"><div className="sr-l"><b>Auto-assign licenses</b><span>On new seat creation</span></div><div className="sw on" /></div>
              <button onClick={() => void persistCategory('org', { name: orgName, workspaceUrl })} className="mt-2 rounded-full bg-ink text-mist px-4 py-1.5 text-xs font-semibold hover:bg-ink/90">Save changes — DB + local</button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="set-panel g-card overflow-hidden">
              <div className="flex items-center gap-3 pb-4 border-b border-line">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--g-accent)] to-[var(--g-accent-2)] text-white shadow-sm">
                  <Palette className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">Appearance</h3>
                  <p className="font-mono text-xs text-ink-soft">Platform theme — whole-app premium. Every portal recolors instantly.</p>
                </div>
                <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-signal-soft border border-signal/15 px-2.5 py-1 font-mono text-xs font-medium text-signal">Live</span>
              </div>

              <div className="mt-6 rounded-2xl border border-line bg-surface-2/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink text-mist"><Monitor className="h-3.5 w-3.5" /></span>
                  <p className="font-display text-sm font-semibold text-ink">Theme mode (Platform default)</p>
                  <span className="ml-auto font-mono text-[11px] text-ink-soft">Whole-app — sidebar, nav, cards, home</span>
                </div>
                <div className="mode-cards mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalScheme('light')
                      const next = applySchemeToTheme(draft, 'light')
                      setDraft(next)
                      applyLocal(next, theme.version)
                    }}
                    className={`mode-card light ${draft.colorScheme === 'light' ? 'on' : ''}`}
                  >
                    <div className="mprev" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalScheme('dark')
                      const next = applySchemeToTheme(draft, 'dark')
                      setDraft(next)
                      applyLocal(next, theme.version)
                    }}
                    className={`mode-card dark ${draft.colorScheme === 'dark' ? 'on' : ''}`}
                  >
                    <div className="mprev" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = draft.colorScheme === 'light' ? 'dark' : 'light'
                      setLocalScheme(target)
                      const next = applySchemeToTheme(draft, target)
                      setDraft(next)
                      applyLocal(next, theme.version)
                    }}
                    className="mode-card system"
                  >
                    <div className="mprev system" />
                    <span>Toggle</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-line">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-xs font-semibold text-ink">Device Local Storage Mode</p>
                      <p className="font-mono text-[11px] text-ink-soft mt-0.5">
                        Current:{' '}
                        <strong className="text-signal">
                          {localScheme ? `${localScheme.toUpperCase()} (saved in localStorage)` : `None (using platform default: ${draft.colorScheme})`}
                        </strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLocalScheme('light')}
                        className={`rounded-full border border-line px-3 py-1 font-mono text-xs font-medium transition-colors ${
                          localScheme === 'light' ? 'bg-signal text-mist-deep border-signal' : 'bg-surface text-ink hover:bg-surface-2'
                        }`}
                      >
                        Force Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalScheme('dark')}
                        className={`rounded-full border border-line px-3 py-1 font-mono text-xs font-medium transition-colors ${
                          localScheme === 'dark' ? 'bg-signal text-mist-deep border-signal' : 'bg-surface text-ink hover:bg-surface-2'
                        }`}
                      >
                        Force Dark
                      </button>
                      {localScheme && (
                        <button
                          type="button"
                          onClick={() => setLocalScheme(null)}
                          className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-soft hover:text-ink hover:bg-surface-2"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-surface-2/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-signal text-mist-deep"><Palette className="h-3.5 w-3.5" /></span>
                  <p className="font-display text-sm font-semibold text-ink">Accent — whole-app primary</p>
                  <span className="ml-auto hidden sm:inline-flex h-6 items-center rounded-full border border-line bg-surface px-2 font-mono text-xs font-medium text-ink" style={{ background: draft.accent, color: '#fff' }}>{draft.accent}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-ink-soft">Buttons, nav, signals, sidebar — single brand color system.</p>
                <div className="swatches mt-3">
                  {ACCENT_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => updateDraft({ accent: p.accent, accent2: p.accent2, signal: p.accent, signalSoft: '#e0e7ff' })} className={`swatch ${draft.accent === p.accent ? 'active' : ''}`} style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} aria-label={p.label} />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                  <span className="font-mono text-xs font-medium text-ink">Custom</span>
                  <input type="color" value={draft.accent} onChange={(e) => updateDraft({ accent: e.target.value, signal: e.target.value, signalSoft: '#e0e7ff' })} className="h-8 w-12 cursor-pointer rounded-lg border border-line p-1" />
                  <span className="font-mono text-xs font-semibold text-ink px-2 py-1 rounded-full border border-line bg-surface-2">{draft.accent}</span>
                  <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-signal text-mist-deep px-2.5 py-1 font-mono text-xs font-medium" style={{ background: draft.accent }}>Preview</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-surface-2/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink text-mist" style={{ fontFamily: draft.fontDisplay }}>Aa</span>
                  <p className="font-display text-sm font-semibold text-ink">Typography — whole-app</p>
                  <span className="ml-auto font-mono text-[11px] text-ink-soft">Display + body</span>
                </div>
                <p className="mt-1 font-mono text-xs text-ink-soft">Sidebar, home hero, cards — every text node.</p>
                <div className="font-cards mt-3">
                  {FONT_PAIRS.map((pair) => (
                    <button key={pair.id} onClick={() => updateDraft({ fontDisplay: pair.display, fontBody: pair.body })} className={`font-card ${draft.fontDisplay === pair.display ? 'on' : ''}`}><div className="fp-label" style={{ fontFamily: pair.display }}>{pair.label}</div><div className="fp-desc" style={{ fontFamily: pair.body }}>{pair.desc}</div></button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-line bg-surface p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">Live — sidebar, home, cards</p>
                  <p className="mt-2 font-display text-lg font-bold tracking-tight text-ink" style={{ fontFamily: draft.fontDisplay }}>Guardian — The quick brown fox jumps</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft" style={{ fontFamily: draft.fontBody }}>Body — Pack my box with five dozen liquor jugs. Every portal uses this pair instantly.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-mist" style={{ fontFamily: draft.fontDisplay }}>Aa</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal text-mist-deep" style={{ fontFamily: draft.fontBody }}>Bb</span>
                    <span className="font-mono text-xs text-ink-soft">{draft.fontDisplay} / {draft.fontBody}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-surface-2/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface border border-line text-ink-soft">⬢</span>
                  <p className="font-display text-sm font-semibold text-ink">Border radius — density</p>
                  <span className="ml-auto font-mono text-[11px] text-ink-soft">Cards, buttons, sidebar</span>
                </div>
                <div className="radius-cards mt-3">
                  {RADIUS_PRESETS.map((r) => (
                    <button key={r.id} onClick={() => updateDraft({ radius: r.md, radiusSm: r.sm, radiusLg: r.lg })} className={`radius-card ${draft.radius === r.md ? 'on' : ''}`}><div className="rp-demo" style={{ borderRadius: r.md, borderColor: 'var(--g-text)' }} /><span>{r.label}</span></button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-line bg-surface p-3 flex items-center gap-3">
                  <span className="h-6 w-12 rounded-full bg-ink" style={{ borderRadius: draft.radius }} />
                  <span className="h-8 w-20 rounded-xl bg-signal" style={{ borderRadius: draft.radius }} />
                  <span className="h-10 w-16 rounded-2xl border border-line bg-surface" style={{ borderRadius: draft.radiusLg }} />
                  <span className="font-mono text-xs text-ink-soft">Live radius — whole-app</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-line overflow-hidden">
                <div className="bg-ink px-3 py-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
                  <p className="font-mono text-xs font-semibold tracking-wide text-mist">Whole-app live preview</p>
                  <span className="ml-auto font-mono text-[10px] text-mist/60">Sidebar + home + card</span>
                </div>
                <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
                  <div className="hidden sm:flex flex-col gap-1 bg-surface-2 p-2 border-r border-line">
                    <span className="flex items-center gap-2 rounded-lg bg-ink text-mist px-2 py-1.5 text-xs font-medium" style={{ fontFamily: draft.fontDisplay }}><GuardianMark className="h-3.5 w-3.5" /> Guard</span>
                    <span className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-soft" style={{ fontFamily: draft.fontBody }}><Monitor className="h-3.5 w-3.5" /> Dashboard</span>
                    <span className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-soft" style={{ fontFamily: draft.fontBody }}><Smartphone className="h-3.5 w-3.5" /> Devices</span>
                  </div>
                  <div className="p-3 space-y-2 bg-surface">
                    <p className="font-display text-sm font-bold text-ink" style={{ fontFamily: draft.fontDisplay }}>Continuous security</p>
                    <p className="text-xs leading-relaxed text-ink-soft" style={{ fontFamily: draft.fontBody }}>Home hero, cards and sidebar all recolor with accent, font and radius.</p>
                    <span className="inline-flex rounded-full bg-signal text-mist-deep px-3 py-1 text-xs font-semibold" style={{ borderRadius: draft.radius, fontFamily: draft.fontDisplay }}>Signal button</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button variant="signal" size="sm" className="rounded-full shadow-sm" disabled={saving} onClick={() => void handleSaveAppearance()}>{saving ? 'Saving…' : 'Save appearance — whole app'}</Button>
                {saved && <span className="font-mono text-xs text-emerald-600 py-2">Saved — whole app recolored. DB persisted, other browsers reload to see.</span>}
              </div>
            </div>
          )}

          {tab === 'api' && (
            <div className="set-panel g-card">
              <h3>API & Webhooks</h3>
              <div className="sd">Programmatic access — saved to DB + localStorage.</div>
              <div className="field2"><label>API key</label><input value="grd_live_sk_••••••••••••4f9a" disabled style={{ fontFamily: 'monospace' }} /></div>
              <div className="field2"><label>Webhook endpoint</label><input placeholder="https://hooks.guardian.io/telemetry" id="wh-endpoint" /></div>
              <div className="set-row"><div className="sr-l"><b>Send crash events</b></div><div className="sw on" /></div>
              <div className="set-row"><div className="sr-l"><b>Send subscription events</b></div><div className="sw on" /></div>
              <button onClick={() => void persistCategory('api', { webhook: (document.getElementById('wh-endpoint') as HTMLInputElement)?.value || '', updatedAt: new Date().toISOString() })} className="mt-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface">Rotate & Save — DB + local</button>
            </div>
          )}

          {tab === 'platform' && (
            <div className="set-panel g-card">
              <h3>Platform</h3>
              <div className="sd">Guardian control-plane — saved to DB + localStorage.</div>
              <div className="field2"><label>Product name</label><input defaultValue="Guardian" id="plat-name" /></div>
              <div className="field2"><label>Logo URL</label><input placeholder="Not configured" disabled /></div>
              <div className="set-row"><div className="sr-l"><b>Audit retention</b><span>Append-only ledger</span></div><span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 font-mono text-xs">Immutable</span></div>
              <button onClick={() => void persistCategory('platform_cfg', { productName: (document.getElementById('plat-name') as HTMLInputElement)?.value || 'Guardian' })} className="mt-2 rounded-full bg-ink text-mist px-4 py-1.5 text-xs font-semibold">Save platform — DB + local</button>
            </div>
          )}

          {tab === 'security' && (
            <div className="set-panel g-card">
              <h3>Security</h3>
              <div className="sd">Protect access — saved to DB + localStorage.</div>
              <div className="set-row"><div className="sr-l"><b>Enforce SSO / SAML</b><span>Require single sign-on</span></div><div className="sw on" /></div>
              <div className="set-row"><div className="sr-l"><b>Require 2FA for all admins</b></div><div className="sw on" /></div>
              <div className="set-row"><div className="sr-l"><b>Device binding</b><span>Lock to registered devices</span></div><div className="sw on" /></div>
              <div className="set-row"><div className="sr-l"><b>Session timeout</b><span>Auto sign-out after 30 min idle</span></div><div className="sw" /></div>
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div><Label>Session TTL (minutes)</Label><Input type="number" defaultValue={30} className="mt-1 rounded-xl" id="sec-ttl" /></div>
                <div><Label>Min password length</Label><Input type="number" defaultValue={10} className="mt-1 rounded-xl" id="sec-minlen" /></div>
              </div>
              <button onClick={() => void persistCategory('security', { ttl: (document.getElementById('sec-ttl') as HTMLInputElement)?.value, minLen: (document.getElementById('sec-minlen') as HTMLInputElement)?.value })} className="mt-3 rounded-full bg-ink text-mist px-4 py-1.5 text-xs font-semibold">Save security — DB + local</button>
            </div>
          )}

          {tab === 'notif' && (
            <div className="set-panel g-card">
              <h3>Notifications</h3>
              <div className="sd">Alerts — saved to DB + localStorage.</div>
              <div className="set-row"><div className="sr-l"><b>Crash spike alerts</b></div><div className="sw on" /></div>
              <div className="set-row"><div className="sr-l"><b>Past-due subscriptions</b></div><div className="sw on" /></div>
              <div className="set-row"><div className="sr-l"><b>New release rolled out</b></div><div className="sw" /></div>
              <div className="set-row"><div className="sr-l"><b>Weekly digest email</b></div><div className="sw on" /></div>
              <button onClick={() => void persistCategory('notif', { crash: true, pastDue: true, digest: true })} className="mt-3 rounded-full bg-ink text-mist px-4 py-1.5 text-xs font-semibold">Save notifications — DB + local</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
