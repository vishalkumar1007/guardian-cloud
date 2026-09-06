import React, { useState } from 'react'
import { Copy, Check, RotateCcw, Search } from 'lucide-react'
import { type ThemeTokens, TOKEN_CSS_VARS } from '../../theme/tokens'
import { cn } from '../../lib/utils'

const GROUPS: { title: string; keys: (keyof ThemeTokens)[]; desc: string }[] = [
  { title: 'Text', keys: ['ink', 'inkSoft'], desc: 'Headings & muted captions' },
  { title: 'Canvas', keys: ['mist', 'mistDeep'], desc: 'Page bg & surfaces' },
  { title: 'Brand', keys: ['signal', 'signalSoft', 'accent', 'accent2'], desc: 'Actions, active states, glow' },
  { title: 'State', keys: ['alert'], desc: 'Critical & danger' },
  { title: 'Typography & Shape', keys: ['fontDisplay', 'fontBody', 'radius', 'radiusSm', 'radiusLg'], desc: 'Fonts & corner radius' },
]

const LABELS: Record<string, { label: string; desc: string }> = {
  ink: { label: 'Ink', desc: '--g-ink · primary text' },
  inkSoft: { label: 'Ink Soft', desc: '--g-ink-soft · muted' },
  mist: { label: 'Mist', desc: '--g-mist · page bg' },
  mistDeep: { label: 'Mist Deep', desc: '--g-mist-deep · cards' },
  signal: { label: 'Signal', desc: '--g-signal · brand' },
  signalSoft: { label: 'Signal Soft', desc: '--g-signal-soft · glow' },
  accent: { label: 'Accent', desc: '--g-accent' },
  accent2: { label: 'Accent 2', desc: '--g-accent-2' },
  alert: { label: 'Alert', desc: '--g-alert · critical' },
  fontDisplay: { label: 'Font Display', desc: '--g-font-display' },
  fontBody: { label: 'Font Body', desc: '--g-font-body' },
  radius: { label: 'Radius', desc: '--g-radius' },
  radiusSm: { label: 'Radius Sm', desc: '--g-radius-sm' },
  radiusLg: { label: 'Radius Lg', desc: '--g-radius-lg' },
}

export function TokenStudio({ draft, onChange }: { draft: ThemeTokens; onChange: (patch: Partial<ThemeTokens>) => void }) {
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  function copyVar(k: string) {
    const v = (TOKEN_CSS_VARS as any)[k] || k
    navigator.clipboard.writeText(v)
    setCopied(k)
    setTimeout(() => setCopied(null), 1200)
  }
  const isColor = (k: string) => ['ink', 'inkSoft', 'mist', 'mistDeep', 'signal', 'signalSoft', 'alert', 'accent', 'accent2'].includes(k)
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
        <h3 className="font-display text-sm font-bold text-ink">Design Tokens — grouped, copyable CSS vars</h3>
        <p className="text-ink-soft text-xs font-sans -mt-1">Superadmin edits whole-app vars. Changes apply live via <code className="text-signal">applyThemeTokens</code>. Use search to filter.</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter ink, mist, signal…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-line bg-surface-2 text-ink text-xs" />
          </div>
        </div>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="rounded-2xl border border-line bg-surface p-4 space-y-3">
          <div><h4 className="font-display text-sm font-bold text-ink">{g.title}</h4><p className="text-[11px] text-ink-soft font-sans">{g.desc}</p></div>
          <div className="space-y-2">
            {g.keys.filter((k) => !q || k.toLowerCase().includes(q.toLowerCase()) || LABELS[k].label.toLowerCase().includes(q.toLowerCase())).map((k) => {
              const meta = LABELS[k as string]
              const val = (draft as any)[k] as string
              return (
                <div key={k} className="p-3 rounded-xl border border-line bg-surface-2/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-xs flex items-center gap-2">{meta.label}<button type="button" onClick={() => copyVar(k as string)} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-line bg-surface text-ink-soft hover:text-ink">{copied === k ? <Check className="h-3 w-3 text-signal" /> : <Copy className="h-3 w-3" />} {copied === k ? 'Copied' : meta.desc}</button></div>
                    <div className="text-[11px] text-ink-soft font-mono truncate">{String(val)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isColor(k as string) && <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : '#888888'} onChange={(e) => onChange({ [k]: e.target.value } as any)} className="h-8 w-10 rounded border bg-transparent p-0.5" />}
                    <input value={String(val)} onChange={(e) => onChange({ [k]: e.target.value } as any)} className="w-36 sm:w-40 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-ink font-mono text-xs" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
