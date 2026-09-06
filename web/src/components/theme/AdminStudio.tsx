import React, { useState, useMemo } from 'react'
import { LayoutPanelLeft, Sparkles, Check, Info, Monitor, Moon, Sun, Layers, Image as ImageIcon, Palette, RefreshCw, AlertCircle } from 'lucide-react'
import { useNavPrefs } from '../../theme/navPrefs'
import { RADIUS_PRESETS, ACCENT_PRESETS, THEME_PACKS, ATMOSPHERE_PRESETS, themePackToTokens, applySchemeToThemePreserve, softAccent, type ColorScheme, type ThemeTokens } from '../../theme/tokens'
import { useTheme } from '../../theme/useTheme'
import { useAdminTheme } from '../../theme/adminTheme'
import { cn } from '../../lib/utils'
import { NavCustomizer } from './NavCustomizer'

const ADMIN_ATMOS = ['void', 'obsidian', 'aurora', 'grid', 'snow', 'mesh', 'starfield', 'mist', 'daylight', 'paper', 'frost', 'sunrise', 'lagoon', 'blush'] as const

const selBtn = 'border-signal bg-signal/10 ring-1 ring-signal/30'
const idleBtn = 'border-line bg-surface-2 hover:border-signal/40'
const badge = 'text-[10px] px-2 py-0.5 rounded-full bg-signal/10 text-signal border border-signal/20'
const lockedBadge = 'text-[10px] px-2 py-0.5 rounded-full border border-line bg-surface-2 text-ink-soft'

export function AdminStudio() {
  const { prefs, setPrefs } = useNavPrefs()
  const { theme: globalTheme } = useTheme()
  const { adminTheme, setAdminTheme, clear, isPersonal, saving, error, clearError } = useAdminTheme()
  const draft = adminTheme ?? globalTheme
  const [filter, setFilter] = useState<'all' | ColorScheme>('all')
  const filteredPacks = useMemo(() => filter === 'all' ? THEME_PACKS : THEME_PACKS.filter(p => p.scheme === filter), [filter])
  const themeLocked = !isPersonal

  function handlePack(id: string) {
    if (themeLocked) return
    const p = THEME_PACKS.find(x => x.id === id); if (!p) return
    setAdminTheme(themePackToTokens(p))
  }
  function handleScheme(s: ColorScheme) {
    if (themeLocked) return
    const base: ThemeTokens = draft
    if (s === base.colorScheme) return
    setAdminTheme(applySchemeToThemePreserve(base, s))
  }
  function handleAtmosphere(id: string) {
    if (themeLocked) return
    setAdminTheme({ ...draft, atmosphereMode: id })
  }
  function handleAccent(accent: string, accent2?: string) {
    if (themeLocked) return
    setAdminTheme({
      ...draft,
      accent,
      accent2: accent2 || accent,
      signal: accent,
      signalSoft: softAccent(accent, draft.colorScheme),
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-signal/20 bg-signal/5 p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-signal/10 border border-signal/20 flex items-center justify-center shrink-0">
          <LayoutPanelLeft className="h-4 w-4 text-signal" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-ink">Theme & Customized — Dashboard Only</h3>
          <p className="text-ink-soft text-xs mt-0.5">
            {isPersonal ? (
              <>
                <span className="text-signal font-semibold">Personal</span> {draft.accent} · {draft.colorScheme} · {draft.atmosphereMode} — saved per admin in DB.
              </>
            ) : (
              <>
                <span className="text-ink font-semibold">Following Brand</span> {globalTheme.accent} · {globalTheme.colorScheme} · {globalTheme.atmosphereMode} — dashboard mirrors Brand Studio.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold text-white', isPersonal ? 'bg-signal' : 'bg-ink')}>
            {isPersonal ? 'PERSONAL' : 'FOLLOWING'}
          </span>
          {saving && <span className="text-[10px] text-ink-soft flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />Saving…</span>}
          {!saving && isPersonal && !error && <span className="text-[10px] text-signal">Saved</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-signal/20 bg-signal/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 bg-signal text-white border-signal">
            {isPersonal ? <Palette className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <div className="font-display text-xs font-bold text-ink">
              {isPersonal ? 'Custom Dashboard — Personal Theme Active' : 'Following Brand Studio (Global)'}
            </div>
            <div className="text-[11px] text-ink-soft">
              {isPersonal
                ? 'Brand changes do not affect this dashboard. Customize options below.'
                : 'Dashboard uses Brand Studio. Enable Custom to unlock Theme & Customized controls.'}
            </div>
          </div>
        </div>
        {isPersonal ? (
          <button type="button" onClick={clear} disabled={saving} className="shrink-0 px-3.5 py-2 rounded-xl bg-signal hover:brightness-110 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Layers className="h-3.5 w-3.5" /> Follow Brand Studio
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              const defaultPack = THEME_PACKS.find(p => p.id === 'void-defense') || THEME_PACKS[0]
              setAdminTheme(themePackToTokens(defaultPack))
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl border border-signal bg-signal/10 hover:bg-signal/20 disabled:opacity-60 text-signal text-xs font-semibold flex items-center gap-1.5"
          >
            <Palette className="h-3.5 w-3.5" /> Enable Custom
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-alert/30 bg-alert/10 p-3 flex items-start gap-2 text-xs">
          <AlertCircle className="h-4 w-4 text-alert shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-alert">Could not save personal theme</div>
            <div className="text-ink-soft mt-0.5 break-all">{error}</div>
          </div>
          <button type="button" onClick={clearError} className="text-alert underline shrink-0">Dismiss</button>
        </div>
      )}

      <div className="rounded-xl border border-signal/15 bg-signal/[0.04] p-2.5 text-xs flex items-center gap-2">
        <Info className="h-3.5 w-3.5 text-signal shrink-0" />
        <span className="text-ink-soft">
          {isPersonal
            ? <>Public routes stay on Brand Studio. Personal dashboard options save per super-admin in DB.</>
            : <>Following Brand — Theme & Customized is disabled. Enable Custom to edit.</>}
        </span>
      </div>

      {themeLocked && (
        <div className="rounded-xl border border-line bg-surface-2 p-3 flex items-center gap-2 text-xs">
          <Info className="h-4 w-4 text-ink-soft shrink-0" />
          <span className="text-ink-soft font-medium">
            Controls below are locked while Following Brand. Click <b className="text-ink">Enable Custom</b> to unlock.
          </span>
        </div>
      )}

      <div className={cn('space-y-5 relative', themeLocked && 'opacity-45 select-none')} aria-disabled={themeLocked}>
        {themeLocked && <div className="absolute inset-0 z-10 cursor-not-allowed" aria-hidden />}

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Layers className="h-4 w-4 text-signal" /> Curated Packs — Dashboard
            </h4>
            <span className={badge}>1-click · personal</span>
            {themeLocked && <span className={lockedBadge}>disabled</span>}
            <div className="ml-auto flex items-center gap-1 p-1 rounded-xl border border-line bg-surface-2">
              {(['all', 'dark', 'light'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  disabled={themeLocked}
                  onClick={() => setFilter(f)}
                  className={cn('px-3 py-1 rounded-lg text-xs capitalize font-semibold disabled:cursor-not-allowed', filter === f ? 'bg-signal text-white' : 'text-ink-soft hover:text-ink')}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPacks.map(p => {
              const active = isPersonal && draft.accent.toLowerCase() === p.accent.toLowerCase() && draft.colorScheme === p.scheme && draft.atmosphereMode === p.atmosphere
              const atmos = ATMOSPHERE_PRESETS.find(a => a.id === p.atmosphere)
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={themeLocked || saving}
                  onClick={() => handlePack(p.id)}
                  className={cn('rounded-xl border overflow-hidden text-left disabled:cursor-not-allowed', active ? selBtn : 'border-line hover:border-signal/30')}
                >
                  <div className="h-14 relative border-b border-line overflow-hidden" style={{ background: atmos?.bg || `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}>
                    <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                    <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full bg-mist/80 text-ink border border-line capitalize">{p.scheme} · {p.atmosphere}</span>
                    {active && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-signal text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-surface flex gap-3">
                    <span className="h-8 w-8 rounded-lg shrink-0 border border-line mt-0.5" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink text-sm truncate">{p.label}</div>
                      <div className="text-[11px] text-ink-soft truncate">{p.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Monitor className="h-4 w-4 text-signal" /> Color Scheme — Dashboard
            </h4>
            {themeLocked && <span className={lockedBadge}>disabled</span>}
            <span className="ml-auto text-[11px] text-ink-soft">packs sync</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map(s => (
              <button
                key={s}
                type="button"
                disabled={themeLocked || saving}
                onClick={() => handleScheme(s)}
                className={cn('p-4 rounded-xl border flex items-center gap-3 text-left disabled:cursor-not-allowed', isPersonal && draft.colorScheme === s ? selBtn : idleBtn)}
              >
                <span className="h-10 w-10 rounded-lg flex items-center justify-center border border-line shrink-0 bg-surface text-signal">
                  {s === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </span>
                <span className="font-semibold text-ink capitalize">{s}</span>
                {isPersonal && draft.colorScheme === s && <Check className="h-4 w-4 text-signal ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-signal" /> Background Atmosphere — Dashboard
            </h4>
            <span className={badge}>scoped</span>
            {themeLocked && <span className={lockedBadge}>disabled</span>}
            <span className="ml-auto text-[11px] text-ink-soft">dashboard shell only</span>
          </div>
          <p className="text-ink-soft text-xs -mt-1">Presets update <code className="text-signal">data-atmosphere</code> on the dashboard shell.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ADMIN_ATMOS.map(id => {
              const a = ATMOSPHERE_PRESETS.find(x => x.id === id); if (!a) return null
              const active = isPersonal && draft.atmosphereMode === id
              return (
                <button
                  key={id}
                  type="button"
                  disabled={themeLocked || saving}
                  onClick={() => handleAtmosphere(id)}
                  className={cn('rounded-xl border overflow-hidden text-left disabled:cursor-not-allowed', active ? selBtn : 'border-line hover:border-signal/30')}
                >
                  <div className="h-12 border-b border-line" style={{ background: a.bg }} />
                  <div className="p-2 bg-surface flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-ink capitalize truncate">{a.label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-signal shrink-0" />}
                  </div>
                  <div className="px-2 pb-2 text-[10px] text-ink-soft truncate">{a.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Palette className="h-4 w-4 text-signal" /> Accent — Dashboard
            </h4>
            {themeLocked && <span className={lockedBadge}>disabled</span>}
            <span className="text-xs font-mono text-ink font-semibold uppercase flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-line" style={{ background: draft.accent }} />
              {draft.accent}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ACCENT_PRESETS.map(p => {
              const sel = isPersonal && draft.accent.toLowerCase() === p.accent.toLowerCase()
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={themeLocked || saving}
                  onClick={() => handleAccent(p.accent, p.accent2)}
                  className={cn('p-2.5 rounded-xl border flex items-center gap-2.5 text-left disabled:cursor-not-allowed', sel ? selBtn : idleBtn)}
                >
                  <span className="h-6 w-6 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                  <span className="text-xs font-medium text-ink truncate">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-signal" /> Personal Radius — dashboard shell
            </h4>
            {themeLocked && <span className={lockedBadge}>disabled</span>}
          </div>
          <p className="text-ink-soft text-xs -mt-1">Only while Custom is enabled. When Following Brand, use Brand Studio → Radius & Density.</p>
          <div className="grid grid-cols-5 gap-2">
            {RADIUS_PRESETS.map(r => {
              const active = !themeLocked && (prefs.adminRadius === r.md || draft.radius === r.md)
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={themeLocked}
                  onClick={() => {
                    setPrefs({ adminRadius: r.md, adminRadiusSm: r.sm, adminRadiusLg: r.lg })
                    if (isPersonal) setAdminTheme({ ...draft, radius: r.md, radiusSm: r.sm, radiusLg: r.lg })
                  }}
                  className={cn('p-2 rounded-xl border text-center disabled:cursor-not-allowed', active ? selBtn : idleBtn)}
                >
                  <div className="h-6 w-8 mx-auto border-2 border-signal/40 bg-signal/10" style={{ borderRadius: r.md }} />
                  <div className="text-[11px] font-semibold text-ink mt-1">{r.label}</div>
                  <div className="text-[10px] text-ink-soft">{r.md}</div>
                  {active && <Check className="h-3 w-3 text-signal mx-auto mt-1" />}
                </button>
              )
            })}
          </div>
          <div className="text-[11px] text-ink-soft">
            Current: <span className="text-ink font-mono">{prefs.adminRadius}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-sm font-bold text-ink">Message Theme — personal</h4>
            {themeLocked && <span className={lockedBadge}>disabled</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-ink mb-1.5">Density</div>
              <div className="flex gap-1.5">
                {(['cozy', 'compact'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    disabled={themeLocked}
                    onClick={() => setPrefs({ messageDensity: d })}
                    className={cn('flex-1 py-2 rounded-xl border text-xs capitalize font-semibold disabled:cursor-not-allowed', prefs.messageDensity === d ? 'bg-signal text-white border-signal' : idleBtn + ' text-ink-soft')}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink mb-1.5">Style</div>
              <div className="flex gap-1.5">
                {(['bubble', 'flat'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    disabled={themeLocked}
                    onClick={() => setPrefs({ messageStyle: s })}
                    className={cn('flex-1 py-2 rounded-xl border text-xs capitalize font-semibold disabled:cursor-not-allowed', prefs.messageStyle === s ? 'bg-signal text-white border-signal' : idleBtn + ' text-ink-soft')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-2">
            <div
              className={cn('border border-line bg-surface p-2 text-xs', prefs.messageStyle === 'bubble' ? 'rounded-2xl' : 'rounded-md')}
              style={{ borderRadius: prefs.adminRadius }}
            >
              Preview bubble — {prefs.messageDensity} · {prefs.messageStyle} · {prefs.adminRadius}
            </div>
          </div>
        </div>

        <div className={cn(themeLocked && 'pointer-events-none')}>
          <NavCustomizer />
        </div>
      </div>
    </div>
  )
}
