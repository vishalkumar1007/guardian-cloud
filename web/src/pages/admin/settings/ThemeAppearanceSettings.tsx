import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Palette, RotateCcw, Save, CheckCircle2, Sliders, Sparkles, RefreshCw, Store, LayoutPanelLeft } from 'lucide-react'
import { useTheme } from '../../../theme/useTheme'
import { useAdminTheme } from '../../../theme/adminTheme'
import { useNavPrefs } from '../../../theme/navPrefs'
import { softAccent, themePackToTokens, THEME_PACKS, type ThemeTokens } from '../../../theme/tokens'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../lib/utils'
import { BrandStudio } from '../../../components/theme/BrandStudio'
import { TokenStudio } from '../../../components/theme/TokenStudio'
import { AdminStudio } from '../../../components/theme/AdminStudio'

export function ThemeAppearanceSettings() {
  const { theme, applyLocal, save, resetDefaults } = useTheme()
  const { setAdminTheme, isPersonal } = useAdminTheme()
  const { setPrefs } = useNavPrefs()
  const [draft, setDraft] = useState<ThemeTokens>(theme)
  const [saving, setSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [customAccent, setCustomAccent] = useState(draft.accent || '#6366f1')
  const [studio, setStudio] = useState<'admin' | 'brand'>('admin')
  const [brandTab, setBrandTab] = useState<'studio' | 'tokens'>('studio')
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => { setDraft(theme); setCustomAccent(theme.accent || '#6366f1') }, [theme])

  const trigger = useCallback((next: ThemeTokens, immediate = false) => {
    if (autoRef.current) clearTimeout(autoRef.current)
    const run = async () => {
      setSyncStatus('syncing')
      try { await save(next); setSyncStatus('synced'); adminService.updateSettings('general', { themeScheme: next.colorScheme, themeAccent: next.accent } as any) } catch { setSyncStatus('offline') }
    }
    if (immediate) void run()
    else autoRef.current = setTimeout(() => void run(), 400)
  }, [save])

  function patch(p: Partial<ThemeTokens>, imm = false) {
    const n = { ...draftRef.current, ...p }
    draftRef.current = n
    setDraft(n)
    applyLocal(n, theme.version)
    trigger(n, imm)
  }
  function handleAccent(a: string, a2?: string) {
    setCustomAccent(a)
    const n: ThemeTokens = {
      ...draftRef.current,
      accent: a,
      accent2: a2 || a,
      signal: a,
      signalSoft: softAccent(a, draftRef.current.colorScheme),
    }
    draftRef.current = n
    setDraft(n)
    applyLocal(n, theme.version)
    trigger(n, true)
  }
  async function handleSave() {
    if (studio !== 'brand') return
    setSaving(true); setSyncStatus('syncing')
    try { await save(draft); setSyncStatus('synced'); setStatusMessage('Brand Studio published to public pages (global)'); setTimeout(() => setStatusMessage(null), 3500) } catch (e) { setStatusMessage(e instanceof Error ? e.message : 'Saved locally') } finally { setSaving(false) }
  }
  async function handleReset() {
    if (studio === 'admin') {
      if (!isPersonal) return
      if (!window.confirm('Reset personal dashboard to Watchline Dark? Brand Studio is unchanged.')) return
      setSaving(true)
      try {
        const pack = THEME_PACKS.find((p) => p.id === 'watchline-dark') || THEME_PACKS[0]
        const tokens = themePackToTokens(pack)
        setPrefs({ adminRadius: pack.radius, adminRadiusSm: pack.radiusSm, adminRadiusLg: pack.radiusLg })
        setAdminTheme(tokens)
        setStatusMessage('Personal dashboard reset to Watchline Dark')
        setTimeout(() => setStatusMessage(null), 2500)
      } finally {
        setSaving(false)
      }
      return
    }

    if (!window.confirm('Reset Brand Studio to Watchline defaults? Personal theme is unchanged.')) return
    setSaving(true)
    try {
      await resetDefaults()
      setStatusMessage('Brand Studio reset to Watchline defaults')
      setTimeout(() => setStatusMessage(null), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 text-xs max-w-5xl font-sans">
      <div className="p-4 rounded-2xl border border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-signal/10 border border-signal/20 flex items-center justify-center"><Palette className="h-4 w-4 text-signal" /></span>
          <div>
            <div className="flex items-center gap-2 flex-wrap"><h2 className="font-display text-sm font-bold text-ink">Appearance & Theme</h2><span className="text-[10px] px-2 py-0.5 rounded-full border border-line bg-surface-2 text-ink font-mono">v{theme.version}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-signal/10 text-signal border border-signal/20">{draft.colorScheme}</span>{syncStatus === 'syncing' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-signal/10 text-signal border border-signal/20 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> syncing</span>}{syncStatus === 'synced' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-signal/10 text-signal border border-signal/20">synced</span>}</div>
            <p className="text-ink-soft text-xs">Personal dashboard look, or global Brand for public pages.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || (studio === 'admin' && !isPersonal)}
            className="px-3 py-2 rounded-lg border border-line bg-surface-2 text-ink text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              studio === 'admin'
                ? (isPersonal ? 'Reset personal dashboard theme' : 'Enable Custom first — Following Brand has nothing personal to reset')
                : 'Reset Brand Studio (global)'
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {studio === 'admin' ? 'Reset Personal' : 'Reset Brand'}
          </button>
          {studio === 'brand' && (
            <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-signal text-white text-xs flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save Theme'}
            </button>
          )}
        </div>
      </div>

      {statusMessage && <div className="p-3 rounded-xl border border-signal/30 bg-signal/10 text-signal flex items-center gap-2 text-xs"><CheckCircle2 className="h-4 w-4" />{statusMessage}</div>}

      <div className="flex items-center gap-1 p-1 rounded-xl border border-line bg-surface-2 w-fit">
        {([
          { id: 'admin', label: 'Theme & Customized', icon: LayoutPanelLeft, sub: 'Dashboard · Personal' },
          { id: 'brand', label: 'Brand Studio', icon: Store, sub: 'Global · Public' },
        ] as const).map((t) => (
          <button key={t.id} type="button" onClick={() => setStudio(t.id as any)} className={cn('px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs', studio === t.id ? 'bg-signal text-white' : 'text-ink-soft hover:text-ink')}>
            <t.icon className="h-3.5 w-3.5" />{t.label} <span className={cn('text-[10px] px-1 py-0.5 rounded border', studio === t.id ? 'bg-white/20 border-white/20 text-white' : 'bg-surface border-line text-ink-soft')}>{t.sub}</span>
          </button>
        ))}
      </div>

      {studio === 'admin' && (
        <div className="space-y-4">
          <p className="text-ink-soft text-xs leading-relaxed">
            Theme &amp; Customized sets your personal look for the <span className="text-ink font-semibold">/admin dashboard</span> only. Public pages keep Brand Studio.
          </p>
          <AdminStudio />
        </div>
      )}

      {studio === 'brand' && (
        <div className="space-y-4">
          <p className="text-ink-soft text-xs leading-relaxed">
            Brand Studio sets global branding for <span className="text-ink font-semibold">public pages</span>, and for dashboards that are Following Brand.
          </p>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-line bg-surface-2 w-fit">
            {([
              { id: 'studio', label: 'Brand Tokens', icon: Sliders },
              { id: 'tokens', label: 'Design Tokens', icon: Sparkles },
            ] as const).map((t) => (
              <button key={t.id} type="button" onClick={() => setBrandTab(t.id as any)} className={cn('px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs', brandTab === t.id ? 'bg-signal/10 text-signal border border-signal/20' : 'text-ink-soft')}><t.icon className="h-3 w-3" />{t.label}</button>
            ))}
          </div>
          {brandTab === 'studio' ? (
            <BrandStudio
              draft={draft}
              customAccent={customAccent}
              onAccent={handleAccent}
              onFont={(d, b) => patch({ fontDisplay: d, fontBody: b }, true)}
              onRadius={(md, sm, lg) => patch({ radius: md, radiusSm: sm, radiusLg: lg }, true)}
              onCustomAccent={(v) => handleAccent(v)}
            />
          ) : (
            <TokenStudio draft={draft} onChange={(p) => patch(p, true)} />
          )}
        </div>
      )}
    </div>
  )
}
