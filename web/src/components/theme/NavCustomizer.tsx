import React, { useState } from 'react'
import { Star, LayoutPanelLeft, StretchHorizontal, Sparkles, Check, Eye, EyeOff, PanelTop, Bell, Search, SunMoon } from 'lucide-react'
import { useNavPrefs, NAV_PRESETS, type NavPresetId } from '../../theme/navPrefs'
import { cn } from '../../lib/utils'

const FAV_OPTIONS = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/organizations', label: 'Organizations' },
  { to: '/admin/users', label: 'Individual Users' },
  { to: '/admin/devices', label: 'Fleet Devices' },
  { to: '/admin/plans', label: 'Plans & Billing' },
  { to: '/admin/security', label: 'Security Center' },
  { to: '/admin/iam/users', label: 'Guardian IAM' },
  { to: '/admin/audit', label: 'Audit & Governance' },
  { to: '/admin/platform', label: 'Platform Ops' },
  { to: '/admin/settings/general', label: 'System Settings' },
]

const SECTIONS = [
  { id: 'enterprise', label: 'Enterprise Subscription' },
  { id: 'user', label: 'User Subscription' },
  { id: 'superadmin', label: 'Superadmin Management' },
]

export function NavCustomizer() {
  const { prefs, setPrefs, applyPreset, toggleFavorite, toggleSection, reset } = useNavPrefs()
  const [sub, setSub] = useState<'side' | 'top'>('side')

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-signal/10 border border-signal/20 flex items-center justify-center shrink-0"><LayoutPanelLeft className="h-4 w-4 text-signal" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-ink">Navigation Customizer — Side + Top Nav Synced</h3>
          <p className="text-ink-soft text-xs font-sans mt-0.5">Width, density, sections, favorites for sidebar; height/visibility for top bar. <b className="text-ink">Sync with sidebar</b> makes both share same glass material over <span className="text-signal">g-atmosphere</span>.</p>
        </div>
        <button type="button" onClick={reset} className="text-xs px-3 py-1.5 rounded-lg border border-line bg-surface-2 text-ink shrink-0">Reset</button>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl border border-line bg-surface-2 w-fit">
        {(['side', 'top'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSub(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize', sub === s ? 'bg-signal text-white' : 'text-ink-soft hover:text-ink')}>{s === 'side' ? 'Side Nav' : 'Top Nav'}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2"><Sparkles className="h-4 w-4 text-signal" /> Quick Picks — Side + Top synced</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {(Object.entries(NAV_PRESETS) as [NavPresetId, typeof NAV_PRESETS[NavPresetId]][]).map(([id, pr]) => {
            const active = prefs.favorites.join(',') === pr.favorites.join(',') && prefs.width === pr.width && prefs.topHeight === pr.topHeight
            return (
              <button key={id} type="button" onClick={() => applyPreset(id)} className={cn('p-3 rounded-xl border text-left', active ? 'border-signal bg-signal/10 ring-1 ring-signal/30' : 'border-line bg-surface-2')}>
                <div className="text-xs font-bold text-ink flex items-center gap-1">{pr.label} {active && <Check className="h-3 w-3 text-signal" />}</div>
                <div className="text-[11px] text-ink-soft font-sans">{pr.desc}</div>
                <div className="text-[10px] text-ink-soft mt-1">{pr.width}px · {pr.density} · h{pr.topHeight}</div>
              </button>
            )
          })}
        </div>
      </div>

      {sub === 'side' ? (
        <>
          <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2"><StretchHorizontal className="h-4 w-4 text-signal" /> Side — Layout</h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-ink mb-1.5">Width</div>
                <div className="flex flex-wrap gap-1.5">
                  {(['220', '240', '270', '300', '320'] as const).map((w) => (
                    <button key={w} type="button" onClick={() => setPrefs({ width: w })} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border', prefs.width === w ? 'bg-signal text-white border-signal' : 'border-line bg-surface-2 text-ink-soft')}>{w}px</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-ink mb-1.5">Collapsed width</div>
                <div className="flex gap-1.5">
                  {(['56', '68', '80'] as const).map((w) => (
                    <button key={w} type="button" onClick={() => setPrefs({ collapsedWidth: w })} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border', prefs.collapsedWidth === w ? 'bg-signal text-white border-signal' : 'border-line bg-surface-2 text-ink-soft')}>{w}px</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-ink mb-1.5">Density</div>
                <div className="flex gap-1.5">
                  {(['dense', 'compact', 'cozy'] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setPrefs({ density: d })} className={cn('px-3 py-1.5 rounded-lg text-xs capitalize font-semibold border', prefs.density === d ? 'bg-signal text-white border-signal' : 'border-line bg-surface-2 text-ink-soft')}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: 'showSubtitles' as const, label: 'Show subtitles' },
                  { k: 'showSectionIcons' as const, label: 'Show section icons' },
                  { k: 'showSectionDots' as const, label: 'Show dots' },
                  { k: 'showFooterUser' as const, label: 'Show footer user' },
                ].map((o) => (
                  <label key={o.k} className="flex items-center gap-2 p-2.5 rounded-xl border border-line bg-surface-2/40 cursor-pointer">
                    <input type="checkbox" checked={(prefs as any)[o.k]} onChange={(e) => setPrefs({ [o.k]: e.target.checked } as any)} className="rounded" />
                    <span className="text-xs font-semibold text-ink">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2"><Eye className="h-4 w-4 text-signal" /> Visible Sections</h4>
            <p className="text-ink-soft text-xs font-sans -mt-1">Hide whole service groups from sidebar (e.g. Billing Focus hides superadmin).</p>
            <div className="space-y-2">
              {SECTIONS.map((s) => {
                const hidden = prefs.hiddenSections.includes(s.id)
                return (
                  <button key={s.id} type="button" onClick={() => toggleSection(s.id)} className={cn('w-full flex items-center justify-between p-3 rounded-xl border text-left', hidden ? 'border-line bg-surface-2 opacity-60' : 'border-signal/30 bg-signal/5')}>
                    <span className="text-xs font-semibold text-ink">{s.label}</span>
                    <span className={cn('flex items-center gap-1 text-xs', hidden ? 'text-ink-soft' : 'text-signal')}>{hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{hidden ? 'Hidden' : 'Visible'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2"><Star className="h-4 w-4 text-signal" /> Favorites — pin to top</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FAV_OPTIONS.map((o) => {
                const on = prefs.favorites.includes(o.to)
                return (
                  <button key={o.to} type="button" onClick={() => toggleFavorite(o.to)} className={cn('p-2.5 rounded-xl border flex items-center gap-2 text-left', on ? 'border-signal/40 bg-signal/10' : 'border-line bg-surface-2')}>
                    <Star className={cn('h-3.5 w-3.5', on ? 'fill-signal text-signal' : 'text-ink-soft')} />
                    <span className="text-xs font-medium text-ink truncate">{o.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2"><PanelTop className="h-4 w-4 text-signal" /> Top Nav — Appearance & Visibility</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-ink mb-1.5">Height</div>
              <div className="flex gap-1.5">
                {(['56', '64'] as const).map((h) => (
                  <button key={h} type="button" onClick={() => setPrefs({ topHeight: h })} className={cn('flex-1 py-2 rounded-xl border text-xs font-semibold', prefs.topHeight === h ? 'bg-signal text-white border-signal' : 'border-line bg-surface-2 text-ink-soft')}>{h}px</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink mb-1.5">Opacity</div>
              <div className="flex gap-1.5">
                {(['70', '75', '90'] as const).map((o) => (
                  <button key={o} type="button" onClick={() => setPrefs({ topOpacity: o } as any)} className={cn('flex-1 py-2 rounded-xl border text-xs font-semibold', (prefs as any).topOpacity === o ? 'bg-signal text-white border-signal' : 'border-line bg-surface-2 text-ink-soft')}>{o}%</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-ink mb-1.5">Blur</div>
            <div className="flex gap-1.5">
              {(['none', 'md', 'xl'] as const).map((b) => (
                <button key={b} type="button" onClick={() => setPrefs({ topBlur: b })} className={cn('flex-1 py-2 rounded-xl border text-xs font-semibold capitalize', prefs.topBlur === b ? 'bg-signal text-white border-signal' : 'border-line bg-surface-2 text-ink-soft')}>{b}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { k: 'showBreadcrumbs' as const, label: 'Breadcrumbs', icon: Eye },
              { k: 'showSearch' as const, label: 'Search bar', icon: Search },
              { k: 'showDemoBadge' as const, label: 'Demo badge', icon: Sparkles },
              { k: 'showNotifications' as const, label: 'Notifications', icon: Bell },
              { k: 'showThemeToggle' as const, label: 'Theme toggle', icon: SunMoon },
              { k: 'syncWithSidebar' as const, label: 'Sync glass with sidebar', icon: Sparkles },
            ].map((o) => (
              <label key={o.k} className="flex items-center gap-2 p-2.5 rounded-xl border border-line bg-surface-2/40 cursor-pointer">
                <input type="checkbox" checked={(prefs as any)[o.k]} onChange={(e) => setPrefs({ [o.k]: e.target.checked } as any)} className="rounded" />
                <o.icon className="h-3.5 w-3.5 text-ink-soft" />
                <span className="text-xs font-semibold text-ink">{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
