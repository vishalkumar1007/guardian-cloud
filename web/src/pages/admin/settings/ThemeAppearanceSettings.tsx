import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  Shield,
  Layers,
  Activity,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import { useTheme } from '../../../theme/useTheme'
import {
  ACCENT_PRESETS,
  FONT_PAIRS,
  RADIUS_PRESETS,
  applySchemeToTheme,
  applyThemeTokens,
  type ColorScheme,
  type ThemeTokens,
} from '../../../theme/tokens'
import { GuardianMark } from '../../../components/GuardianMark'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../lib/utils'

const COLOR_FIELDS: { key: keyof ThemeTokens; label: string; description: string; isColor?: boolean }[] = [
  { key: 'ink', label: 'Ink (Primary Text)', description: 'Headers, primary labels and high-contrast text', isColor: true },
  { key: 'inkSoft', label: 'Ink Soft (Muted Text)', description: 'Secondary captions, metadata, and timestamps', isColor: true },
  { key: 'mist', label: 'Mist (Page Background)', description: 'Root canvas background color', isColor: true },
  { key: 'mistDeep', label: 'Mist Deep (Card & Surface)', description: 'Panels, tables, modals and navigation backdrops', isColor: true },
  { key: 'signal', label: 'Signal (Brand Accent)', description: 'Primary action buttons, active tabs and highlights', isColor: true },
  { key: 'signalSoft', label: 'Signal Soft (Subtle Glow)', description: 'Chip backgrounds, hover states and badges', isColor: true },
  { key: 'alert', label: 'Alert / Protect (Critical)', description: 'Security incidents, quarantine alerts and danger actions', isColor: true },
]

export function ThemeAppearanceSettings() {
  const {
    theme,
    applyLocal,
    save,
    resetDefaults,
    applySchemePreset,
    localScheme,
    setLocalScheme,
  } = useTheme()

  const [draft, setDraft] = useState<ThemeTokens>(theme)
  const [saving, setSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [customAccent, setCustomAccent] = useState(draft.accent || '#f97316')
  const [activeTab, setActiveTab] = useState<'visual' | 'tokens' | 'preview'>('visual')

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDraft(theme)
    if (theme.accent) setCustomAccent(theme.accent)
  }, [theme])

  // Real-time background auto-uploader
  const triggerAutoUpload = useCallback((nextTokens: ThemeTokens, immediate = false) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }

    const executeUpload = async () => {
      setSyncStatus('syncing')
      try {
        await save(nextTokens)
        setSyncStatus('synced')
        adminService.updateSettings('general', {
          themeScheme: nextTokens.colorScheme,
          themeAccent: nextTokens.accent,
          themeFont: nextTokens.fontDisplay,
          themeRadius: nextTokens.radius,
        })
      } catch (err) {
        console.warn('Real-time upload failed, cached locally:', err)
        setSyncStatus('offline')
      }
    }

    if (immediate) {
      void executeUpload()
    } else {
      autoSaveTimerRef.current = setTimeout(() => {
        void executeUpload()
      }, 400)
    }
  }, [save])

  function updateDraft(patch: Partial<ThemeTokens>, immediate = false) {
    const next = { ...draft, ...patch }
    setDraft(next)
    applyLocal(next, theme.version)
    triggerAutoUpload(next, immediate)
  }

  function handleSchemeChange(scheme: ColorScheme) {
    const next = applySchemeToTheme(draft, scheme)
    setDraft(next)
    applySchemePreset(scheme)
    triggerAutoUpload(next, true)
  }

  function handleAccentChange(accent: string, accent2?: string) {
    setCustomAccent(accent)
    const next: ThemeTokens = {
      ...draft,
      accent,
      accent2: accent2 || accent,
      signal: accent,
      signalSoft: draft.colorScheme === 'dark' ? 'rgba(129,140,248,0.15)' : '#e0e7ff',
    }
    setDraft(next)
    applyLocal(next, theme.version)
    triggerAutoUpload(next, true)
  }

  function handleTypographyChange(display: string, body: string) {
    updateDraft({ fontDisplay: display, fontBody: body }, true)
  }

  function handleRadiusChange(radius: string, radiusSm: string, radiusLg: string) {
    updateDraft({ radius, radiusSm, radiusLg }, true)
  }

  async function handleManualSave() {
    setSaving(true)
    setSyncStatus('syncing')
    setStatusMessage(null)
    try {
      await save(draft)
      setSyncStatus('synced')
      setStatusMessage('Platform theme successfully published and synchronized across all portals!')
      adminService.updateSettings('general', {
        themeScheme: draft.colorScheme,
        themeAccent: draft.accent,
        themeFont: draft.fontDisplay,
        themeRadius: draft.radius,
      })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Theme saved to local session')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Reset all theme customizations back to default Watchline dark mode?')) return
    setSaving(true)
    setStatusMessage(null)
    try {
      await resetDefaults()
      setStatusMessage('Theme reset to default Watchline dark configuration.')
      setSyncStatus('synced')
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 font-mono text-xs max-w-4xl">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-line bg-surface shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
            style={{
              backgroundColor: 'var(--g-signal-soft, rgba(249,115,22,0.1))',
              borderColor: 'var(--g-signal, #f97316)',
              color: 'var(--g-signal, #f97316)',
            }}
          >
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-bold text-ink">Appearance & Theme Management</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] border-line bg-surface-2 text-ink border border-line">
                v{theme.version}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-signal/10 text-signal border border-signal/30">
                Active: {draft.colorScheme.toUpperCase()}
              </span>

              {/* Real-time Sync Status Badge */}
              {syncStatus === 'syncing' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Uploading in real-time…
                </span>
              )}
              {syncStatus === 'synced' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-signal/10 text-signal border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Synced in real-time
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] border-line bg-surface-2 text-ink-soft border border-line flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /> Saved locally
                </span>
              )}
            </div>
            <p className="text-ink-soft text-xs mt-1 font-sans">
              All visual changes (color scheme, brand accents, typography, radius) upload in real-time and recolor the entire Guardian SaaS control plane, tenant portals, and authentication screens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface-2 text-ink hover:text-ink hover:border-line bg-surface-2 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal hover:bg-signal text-ink font-semibold transition-colors shadow-sm disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Publishing…' : 'Save Theme'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-signal shrink-0" />
          <span className="font-sans text-xs">{statusMessage}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-2/90 border border-line rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('visual')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors font-medium',
            activeTab === 'visual'
              ? 'bg-signal/10 text-signal border border-signal/30'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Theme Presets & Brand</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors font-medium',
            activeTab === 'tokens'
              ? 'bg-signal/10 text-signal border border-signal/30'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Granular Tokens (CSS Vars)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors font-medium',
            activeTab === 'preview'
              ? 'bg-signal/10 text-signal border border-signal/30'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Full UI Live Sandbox</span>
        </button>
      </div>

      {/* TAB 1: Visual Presets & Brand */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          {/* Color Scheme Selection */}
          <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-signal" />
                  Platform Color Scheme
                </h3>
                <p className="text-ink-soft text-xs mt-0.5 font-sans">
                  Sets the primary default theme mode across all Guardian clusters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSchemeChange('dark')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all relative flex items-center justify-between',
                  draft.colorScheme === 'dark'
                    ? 'border-signal bg-signal/5 ring-1 ring-signal/50'
                    : 'border-line bg-surface-2 hover:border-line'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-ink">
                    <Moon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      Dark (Cyber Defense)
                      {draft.colorScheme === 'dark' && <Check className="h-3.5 w-3.5 text-signal" />}
                    </div>
                    <span className="text-ink-soft text-[11px] font-sans">
                      High-contrast dark mode engineered for security operations.
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSchemeChange('light')}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all relative flex items-center justify-between',
                  draft.colorScheme === 'light'
                    ? 'border-signal bg-signal/5 ring-1 ring-signal/50'
                    : 'border-line bg-surface-2 hover:border-line'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-800">
                    <Sun className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      Light (Enterprise Crisp)
                      {draft.colorScheme === 'light' && <Check className="h-3.5 w-3.5 text-signal" />}
                    </div>
                    <span className="text-ink-soft text-[11px] font-sans">
                      Crisp daytime canvas with high legibility and light surfaces.
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* LocalStorage Device Overrides */}
            <div className="p-3.5 rounded-xl border border-line/80 bg-surface-2/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-ink font-semibold block">Browser Device Override</span>
                <span className="text-ink-soft text-[11px] font-sans">
                  Local browser storage state:{' '}
                  <strong className="text-signal">
                    {localScheme ? `${localScheme.toUpperCase()} (Override Active)` : `None (Inheriting Platform Default)`}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocalScheme('light')}
                  className={cn(
                    'px-2.5 py-1 rounded-md border text-[11px] transition-colors',
                    localScheme === 'light'
                      ? 'bg-signal text-white border-signal font-bold'
                      : 'border-line bg-surface-2 text-ink hover:text-ink'
                  )}
                >
                  Force Light
                </button>
                <button
                  type="button"
                  onClick={() => setLocalScheme('dark')}
                  className={cn(
                    'px-2.5 py-1 rounded-md border text-[11px] transition-colors',
                    localScheme === 'dark'
                      ? 'bg-signal text-white border-signal font-bold'
                      : 'border-line bg-surface-2 text-ink hover:text-ink'
                  )}
                >
                  Force Dark
                </button>
                {localScheme && (
                  <button
                    type="button"
                    onClick={() => setLocalScheme(null)}
                    className="px-2.5 py-1 rounded-md border border-line border-line bg-surface-2 text-ink-soft hover:text-ink text-[11px]"
                  >
                    Clear Override
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Accent Color Presets & Custom Picker */}
          <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Palette className="h-4 w-4 text-signal" />
                  Primary Brand Accent
                </h3>
                <p className="text-ink-soft text-xs mt-0.5 font-sans">
                  Controls action buttons, signals, status indicators, and active navigation across all tenant views.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: draft.accent }}
                />
                <span className="text-ink font-semibold uppercase">{draft.accent}</span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {ACCENT_PRESETS.map((p) => {
                const isSelected = draft.accent.toLowerCase() === p.accent.toLowerCase()
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAccentChange(p.accent, p.accent2)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5',
                      isSelected
                        ? 'border-signal bg-signal/10 ring-1 ring-signal/50'
                        : 'border-line bg-surface-2 hover:border-line'
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-lg shrink-0 shadow-inner flex items-center justify-center text-ink"
                      style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}
                    >
                      {isSelected && <Check className="h-3 w-3 drop-shadow" />}
                    </span>
                    <span className="truncate text-ink font-medium">{p.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom Hex Color Input */}
            <div className="p-3.5 rounded-xl border border-line bg-surface-2/60 flex items-center gap-3">
              <span className="text-ink font-semibold shrink-0">Custom Hex:</span>
              <input
                type="color"
                value={customAccent}
                onChange={(e) => handleAccentChange(e.target.value)}
                className="h-8 w-12 rounded-lg border border-line bg-transparent cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={draft.accent}
                onChange={(e) => handleAccentChange(e.target.value)}
                placeholder="#f97316"
                className="w-32 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-ink font-mono text-xs uppercase"
              />
              <span className="text-ink-soft text-[11px] font-sans">
                Applies dynamically to CSS custom property <code className="text-signal">--g-accent</code> and{' '}
                <code className="text-signal">--g-signal</code>.
              </span>
            </div>
          </div>

          {/* Typography System */}
          <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
            <div>
              <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                <Type className="h-4 w-4 text-signal" />
                Typography Pairings
              </h3>
              <p className="text-ink-soft text-xs mt-0.5 font-sans">
                Curated enterprise font pairs loaded via Google Fonts for headings and body content.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FONT_PAIRS.map((pair) => {
                const isSelected = draft.fontDisplay === pair.display
                return (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => handleTypographyChange(pair.display, pair.body)}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all space-y-1',
                      isSelected
                        ? 'border-signal bg-signal/10 ring-1 ring-signal/50'
                        : 'border-line bg-surface-2 hover:border-line'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-ink" style={{ fontFamily: pair.display }}>
                        {pair.label}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-signal" />}
                    </div>
                    <div className="text-[11px] text-ink-soft font-sans" style={{ fontFamily: pair.body }}>
                      {pair.display} + {pair.body}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Border Radius Density */}
          <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
            <div>
              <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                <Layers className="h-4 w-4 text-signal" />
                Border Radius & Density
              </h3>
              <p className="text-ink-soft text-xs mt-0.5 font-sans">
                Adjust the corner curvature density across tables, cards, dialogs, and button controls.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {RADIUS_PRESETS.map((r) => {
                const isSelected = draft.radius === r.md
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRadiusChange(r.md, r.sm, r.lg)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all space-y-2 flex flex-col items-center',
                      isSelected
                        ? 'border-signal bg-signal/10 ring-1 ring-signal/50'
                        : 'border-line bg-surface-2 hover:border-line'
                    )}
                  >
                    <div
                      className="h-8 w-12 border-2 border-orange-400/80 bg-signal/20 mx-auto"
                      style={{ borderRadius: r.md }}
                    />
                    <div className="text-xs font-semibold text-ink">{r.label}</div>
                    <div className="text-[10px] text-ink-soft">{r.md}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Granular CSS Tokens */}
      {activeTab === 'tokens' && (
        <div className="p-5 rounded-2xl border border-line bg-surface space-y-5">
          <div>
            <h3 className="font-display text-sm font-bold text-ink">Granular Token Customization</h3>
            <p className="text-ink-soft text-xs mt-0.5 font-sans">
              Override individual theme tokens for exact brand alignment. These map 1-to-1 with Guardian CSS variables.
            </p>
          </div>

          <div className="space-y-3">
            {COLOR_FIELDS.map((field) => (
              <div
                key={field.key}
                className="p-3 rounded-xl border border-line bg-surface-2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-ink font-semibold">{field.label}</div>
                  <div className="text-ink-soft text-[11px] font-sans">{field.description}</div>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={
                      /^#[0-9a-fA-F]{6}$/.test(String(draft[field.key]))
                        ? String(draft[field.key])
                        : '#10121a'
                    }
                    onChange={(e) => updateDraft({ [field.key]: e.target.value })}
                    className="h-8 w-10 rounded border border-line bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={String(draft[field.key])}
                    onChange={(e) => updateDraft({ [field.key]: e.target.value })}
                    className="w-36 rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-ink font-mono text-xs"
                  />
                </div>
              </div>
            ))}

            {/* Atmosphere Mode */}
            <div className="p-3 rounded-xl border border-line bg-surface-2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-ink font-semibold">Atmosphere Mode</div>
                <div className="text-ink-soft text-[11px] font-sans">Canvas backdrop gradient depth style</div>
              </div>
              <select
                value={draft.atmosphereMode || 'void'}
                onChange={(e) => updateDraft({ atmosphereMode: e.target.value })}
                className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-ink"
              >
                <option value="void">Void (Deep Cosmic Black)</option>
                <option value="mist">Mist (Diffused Ambient Glow)</option>
                <option value="obsidian">Obsidian (High Contrast)</option>
                <option value="aurora">Aurora (Subtle Cyberpunk Hues)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Full UI Live Sandbox */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-line bg-surface">
            <h3 className="font-display text-sm font-bold text-ink mb-2">Live Whole-App Preview Sandbox</h3>
            <p className="text-ink-soft text-xs font-sans mb-4">
              Real-time rendering of all currently selected tokens (Color scheme: {draft.colorScheme}, Accent: {draft.accent}, Fonts: {draft.fontDisplay}/{draft.fontBody}, Radius: {draft.radius}).
            </p>

            {/* Simulated Miniature Portal */}
            <div
              className="rounded-2xl border border-line overflow-hidden shadow-2xl transition-all"
              style={{
                backgroundColor: draft.mist || '#0a0b14',
                color: draft.ink || '#f1f5f9',
                borderRadius: draft.radiusLg,
                fontFamily: draft.fontBody,
              }}
            >
              {/* Fake Window Header */}
              <div
                className="px-4 py-2.5 border-b flex items-center justify-between"
                style={{
                  borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: draft.mistDeep || '#12141f',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                  <span
                    className="ml-3 font-bold text-xs flex items-center gap-1.5"
                    style={{ fontFamily: draft.fontDisplay, color: draft.ink }}
                  >
                    <span style={{ color: draft.signal }} className="inline-flex">
                      <GuardianMark className="h-4 w-4" />
                    </span>
                    Guardian Control Plane
                  </span>
                </div>
                <div
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                  style={{
                    backgroundColor: draft.signalSoft,
                    color: draft.signal,
                    borderRadius: draft.radiusSm,
                  }}
                >
                  LIVE PREVIEW
                </div>
              </div>

              {/* Fake Body */}
              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4
                      className="text-lg font-bold tracking-tight"
                      style={{ fontFamily: draft.fontDisplay, color: draft.ink }}
                    >
                      Global Security Command Center
                    </h4>
                    <p className="text-xs opacity-75" style={{ color: draft.inkSoft }}>
                      eBPF real-time threat telemetry and fleet health.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                      style={{
                        backgroundColor: draft.signal,
                        borderRadius: draft.radius,
                        fontFamily: draft.fontDisplay,
                      }}
                    >
                      Deploy Quarantine
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium border"
                      style={{
                        borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        backgroundColor: draft.mistDeep,
                        color: draft.ink,
                        borderRadius: draft.radius,
                      }}
                    >
                      Export Telemetry
                    </button>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className="p-4 border shadow-sm space-y-1"
                    style={{
                      backgroundColor: draft.mistDeep,
                      borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      borderRadius: draft.radius,
                    }}
                  >
                    <div className="text-[11px] opacity-70" style={{ color: draft.inkSoft }}>
                      Fleet Threat Level
                    </div>
                    <div
                      className="text-xl font-bold flex items-center gap-2"
                      style={{ fontFamily: draft.fontDisplay, color: draft.ink }}
                    >
                      <Shield className="h-5 w-5" style={{ color: draft.signal }} />
                      ELEVATED (68)
                    </div>
                  </div>

                  <div
                    className="p-4 border shadow-sm space-y-1"
                    style={{
                      backgroundColor: draft.mistDeep,
                      borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      borderRadius: draft.radius,
                    }}
                  >
                    <div className="text-[11px] opacity-70" style={{ color: draft.inkSoft }}>
                      Active Alerts (24h)
                    </div>
                    <div
                      className="text-xl font-bold flex items-center gap-2"
                      style={{ fontFamily: draft.fontDisplay, color: draft.alert }}
                    >
                      <Activity className="h-5 w-5" />
                      14 Critical
                    </div>
                  </div>

                  <div
                    className="p-4 border shadow-sm space-y-1"
                    style={{
                      backgroundColor: draft.mistDeep,
                      borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      borderRadius: draft.radius,
                    }}
                  >
                    <div className="text-[11px] opacity-70" style={{ color: draft.inkSoft }}>
                      Protected Devices
                    </div>
                    <div
                      className="text-xl font-bold flex items-center gap-2"
                      style={{ fontFamily: draft.fontDisplay, color: draft.ink }}
                    >
                      <Smartphone className="h-5 w-5" style={{ color: draft.signal }} />
                      8,421 Online
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
