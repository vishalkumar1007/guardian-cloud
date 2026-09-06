import React, { useMemo } from 'react'
import { Palette, Type, BoxSelect } from 'lucide-react'
import { ACCENT_PRESETS, FONT_PAIRS, RADIUS_PRESETS, themeTokensToCssVars, formatFontFamily, type ThemeTokens } from '../../theme/tokens'
import { useAdminTheme } from '../../theme/adminTheme'
import { cn } from '../../lib/utils'

export function BrandStudio({ draft, onAccent, onFont, onRadius, customAccent, onCustomAccent }: {
  draft: ThemeTokens
  onAccent: (a: string, a2?: string) => void
  onFont: (d: string, b: string) => void
  onRadius: (md: string, sm: string, lg: string) => void
  customAccent: string
  onCustomAccent: (v: string) => void
}) {
  const { isPersonal } = useAdminTheme()
  // Only paint Brand tokens onto this panel when Following Brand. In Enable Custom,
  // inheritable --g-radius / fonts would restyle dashboard chrome under .g-dashboard-shell.
  const liveStyle = useMemo(() => {
    if (isPersonal) return undefined
    const vars = themeTokensToCssVars(draft)
    return {
      ...vars,
      fontFamily: formatFontFamily(draft.fontBody),
    } as React.CSSProperties
  }, [draft, isPersonal])

  return (
    <div className={cn('space-y-6', !isPersonal && 'brand-studio-live')} style={liveStyle}>
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <Palette className="h-4 w-4 text-signal" /> Accent
          </h4>
          <span className="text-xs font-mono text-ink font-semibold uppercase flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border border-line" style={{ background: draft.accent }} />
            {draft.accent}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ACCENT_PRESETS.map((p) => {
            const sel = draft.accent.toLowerCase() === p.accent.toLowerCase()
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onAccent(p.accent, p.accent2)}
                className={cn(
                  'p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-colors',
                  sel ? 'border-signal bg-signal/10 ring-1 ring-signal/30' : 'border-line bg-surface-2 hover:border-signal/40',
                )}
              >
                <span className="h-6 w-6 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                <span className="text-xs font-medium text-ink truncate">{p.label}</span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-line bg-surface-2/60">
          <span className="text-ink font-semibold text-xs">Custom</span>
          <input type="color" value={customAccent} onChange={(e) => onCustomAccent(e.target.value)} className="h-8 w-12 rounded border bg-transparent p-0.5" />
          <input
            value={draft.accent}
            onChange={(e) => onCustomAccent(e.target.value)}
            className="w-32 rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-xs uppercase text-ink"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <Type className="h-4 w-4 text-signal" /> Typography
          </h4>
          <span className="ml-auto text-[11px] text-ink-soft truncate">{draft.fontDisplay} + {draft.fontBody}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_PAIRS.map((f) => {
            const sel = draft.fontDisplay === f.display && draft.fontBody === f.body
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFont(f.display, f.body)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-colors',
                  sel ? 'border-signal bg-signal/10 ring-1 ring-signal/30' : 'border-line bg-surface-2 hover:border-signal/40',
                )}
              >
                <div className="font-bold text-ink text-base" style={{ fontFamily: formatFontFamily(f.display) }}>{f.label}</div>
                <div className="text-[11px] text-ink-soft mt-0.5" style={{ fontFamily: formatFontFamily(f.body) }}>
                  {f.display} + {f.body}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <BoxSelect className="h-4 w-4 text-signal" /> Radius
          </h4>
          <span className="ml-auto text-[11px] font-mono text-ink">{draft.radius}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {RADIUS_PRESETS.map((r) => {
            const sel = draft.radius === r.md
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onRadius(r.md, r.sm, r.lg)}
                className={cn(
                  'p-2 rounded-xl border text-center transition-colors',
                  sel ? 'border-signal bg-signal/10 ring-1 ring-signal/30' : 'border-line bg-surface-2 hover:border-signal/40',
                )}
              >
                <div
                  className="h-6 w-8 mx-auto border-2 border-signal/40 bg-signal/10"
                  style={{ borderRadius: r.md }}
                />
                <div className="text-[11px] font-semibold text-ink mt-1">{r.label}</div>
                <div className="text-[10px] text-ink-soft">{r.md}</div>
              </button>
            )
          })}
        </div>
        <div
          className="p-3 border border-line bg-surface-2 text-xs text-ink"
          style={{ borderRadius: draft.radius }}
        >
          Live radius preview — corners use <span className="font-mono text-signal">{draft.radius}</span>
        </div>
      </div>
    </div>
  )
}
