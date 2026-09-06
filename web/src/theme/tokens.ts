export type ColorScheme = 'light' | 'dark'

export type ThemeTokens = {
  ink: string
  inkSoft: string
  mist: string
  mistDeep: string
  signal: string
  signalSoft: string
  alert: string
  atmosphereMode: string
  colorScheme: ColorScheme
  accent: string
  accent2: string
  radius: string
  radiusSm: string
  radiusLg: string
  fontDisplay: string
  fontBody: string
}

export type PlatformTheme = ThemeTokens & {
  version: number
  updatedAt?: string
}

export const ACCENT_PRESETS = [
  { id: 'indigo-violet', label: 'Indigo Violet', accent: '#6366f1', accent2: '#8b5cf6' },
  { id: 'violet', label: 'Violet', accent: '#8b5cf6', accent2: '#d946ef' },
  { id: 'blue', label: 'Blue', accent: '#3b82f6', accent2: '#06b6d4' },
  { id: 'emerald', label: 'Emerald', accent: '#10b981', accent2: '#14b8a6' },
  { id: 'rose', label: 'Rose', accent: '#f43f5e', accent2: '#fb7185' },
  { id: 'amber', label: 'Amber', accent: '#f59e0b', accent2: '#f97316' },
  { id: 'slate', label: 'Slate', accent: '#64748b', accent2: '#475569' },
  { id: 'cyan', label: 'Cyan', accent: '#06b6d4', accent2: '#22d3ee' },
  { id: 'orange', label: 'Orange', accent: '#f97316', accent2: '#fb923c' },
  { id: 'pink', label: 'Pink', accent: '#ec4899', accent2: '#f472b6' },
] as const

export const FONT_PAIRS = [
  { id: 'inter-sora', label: 'Classic', display: 'Sora', body: 'Inter', desc: 'Sora + Inter' },
  { id: 'jakarta-dm', label: 'Modern', display: 'Plus Jakarta Sans', body: 'DM Sans', desc: 'Jakarta + DM Sans' },
  { id: 'space-grotesk', label: 'Space', display: 'Space Grotesk', body: 'Space Grotesk', desc: 'Space Grotesk' },
  { id: 'manrope-outfit', label: 'Sleek', display: 'Outfit', body: 'Manrope', desc: 'Outfit + Manrope' },
  { id: 'archivo', label: 'Sharp', display: 'Archivo', body: 'Inter', desc: 'Archivo + Inter' },
  { id: 'epilogue', label: 'Elegant', display: 'Epilogue', body: 'Inter', desc: 'Epilogue + Inter' },
] as const

export const RADIUS_PRESETS = [
  { id: 'none', label: 'None', sm: '2px', md: '4px', lg: '6px' },
  { id: 'subtle', label: 'Subtle', sm: '6px', md: '8px', lg: '12px' },
  { id: 'medium', label: 'Medium', sm: '10px', md: '14px', lg: '22px' },
  { id: 'rounded', label: 'Rounded', sm: '14px', md: '18px', lg: '28px' },
  { id: 'full', label: 'Full', sm: '20px', md: '24px', lg: '36px' },
] as const

export const LIGHT_DEFAULTS: ThemeTokens = {
  ink: '#0f172a',
  inkSoft: '#475569',
  mist: '#f6f7fb',
  mistDeep: '#f1f3f9',
  signal: '#6366f1',
  signalSoft: '#e0e7ff',
  alert: '#dc2626',
  atmosphereMode: 'mist',
  colorScheme: 'light',
  accent: '#6366f1',
  accent2: '#8b5cf6',
  radius: '14px',
  radiusSm: '10px',
  radiusLg: '22px',
  fontDisplay: 'Sora',
  fontBody: 'Inter',
}

export const DARK_DEFAULTS: ThemeTokens = {
  ink: '#f1f5f9',
  inkSoft: '#a2acc4',
  mist: '#0a0b14',
  mistDeep: '#12141f',
  signal: '#818cf8',
  signalSoft: 'rgba(129,140,248,0.15)',
  alert: '#f87171',
  atmosphereMode: 'void',
  colorScheme: 'dark',
  accent: '#818cf8',
  accent2: '#a78bfa',
  radius: '14px',
  radiusSm: '10px',
  radiusLg: '22px',
  fontDisplay: 'Sora',
  fontBody: 'Inter',
}

export const WATCHLINE_DEFAULTS = DARK_DEFAULTS

export const TOKEN_CSS_VARS: Record<Exclude<keyof ThemeTokens, 'colorScheme'>, string> = {
  ink: '--g-ink',
  inkSoft: '--g-ink-soft',
  mist: '--g-mist',
  mistDeep: '--g-mist-deep',
  signal: '--g-signal',
  signalSoft: '--g-signal-soft',
  alert: '--g-alert',
  atmosphereMode: '--g-atmosphere-mode',
  accent: '--g-accent',
  accent2: '--g-accent-2',
  radius: '--g-radius',
  radiusSm: '--g-radius-sm',
  radiusLg: '--g-radius-lg',
  fontDisplay: '--g-font-display',
  fontBody: '--g-font-body',
}

export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `${r},${g},${b}`
}

function ensureGoogleFontLoaded(font: string) {
  if (!font || typeof document === 'undefined') return
  const id = `font-${font.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700;800&display=swap`
  document.head.appendChild(link)
}

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement
  const scheme = tokens.colorScheme === 'light' ? 'light' : 'dark'
  root.dataset.theme = scheme
  root.dataset.atmosphere = tokens.atmosphereMode || (scheme === 'dark' ? 'void' : 'mist')
  root.classList.toggle('dark', scheme === 'dark')

  ensureGoogleFontLoaded(tokens.fontDisplay)
  ensureGoogleFontLoaded(tokens.fontBody)

  ;(Object.keys(TOKEN_CSS_VARS) as (keyof typeof TOKEN_CSS_VARS)[]).forEach((key) => {
    if (key === 'atmosphereMode') return
    root.style.setProperty(TOKEN_CSS_VARS[key], (tokens as any)[key])
  })

  const accentColor = tokens.accent || tokens.signal
  const accent2Color = tokens.accent2 || accentColor
  const accentRgb = hexToRgb(accentColor)
  root.style.setProperty('--g-accent-rgb', accentRgb)
  root.style.setProperty('--accent', accentColor)
  root.style.setProperty('--accent-2', accent2Color)
  root.style.setProperty('--accent-rgb', accentRgb)

  // Ensure semantic tokens and surfaces are synchronized with the scheme
  root.style.setProperty('--g-text', tokens.ink)
  root.style.setProperty('--g-text-2', tokens.inkSoft)
  root.style.setProperty('--g-text-3', scheme === 'dark' ? '#6b7590' : '#94a3b8')
  root.style.setProperty('--g-border', scheme === 'dark' ? '#262a3a' : '#e6e8ef')
  root.style.setProperty('--g-border-strong', scheme === 'dark' ? '#333a4f' : '#d5d9e4')

  const lineMix = scheme === 'dark' ? tokens.ink : tokens.ink
  const lineAlpha = scheme === 'dark' ? 14 : 12
  root.style.setProperty('--g-line', `color-mix(in srgb, ${lineMix} ${lineAlpha}%, transparent)`)
  root.style.setProperty(
    '--g-surface',
    scheme === 'dark'
      ? `color-mix(in srgb, ${tokens.mistDeep} 72%, #1a2332)`
      : `color-mix(in srgb, white 70%, ${tokens.mist})`,
  )
  root.style.setProperty(
    '--g-surface-2',
    scheme === 'dark'
      ? `color-mix(in srgb, ${tokens.mistDeep} 55%, #243044)`
      : `color-mix(in srgb, white 55%, ${tokens.mistDeep})`,
  )
  root.style.setProperty(
    '--g-surface-3',
    scheme === 'dark'
      ? `color-mix(in srgb, ${tokens.mistDeep} 35%, #2a374d)`
      : `color-mix(in srgb, white 35%, ${tokens.mistDeep})`,
  )
  root.style.setProperty('--g-glow', `color-mix(in srgb, ${tokens.signal} 35%, transparent)`)
  root.style.setProperty('--radius', tokens.radius)
  root.style.setProperty('--radius-sm', tokens.radiusSm)
  root.style.setProperty('--radius-lg', tokens.radiusLg)
}

export function applySchemeToTheme(baseTheme: ThemeTokens, newScheme: ColorScheme): ThemeTokens {
  const isDark = newScheme === 'dark'
  const modeDefaults = isDark ? DARK_DEFAULTS : LIGHT_DEFAULTS
  const accent = baseTheme.accent || modeDefaults.accent
  const accent2 = baseTheme.accent2 || modeDefaults.accent2

  return {
    ...baseTheme,
    colorScheme: newScheme,
    ink: modeDefaults.ink,
    inkSoft: modeDefaults.inkSoft,
    mist: modeDefaults.mist,
    mistDeep: modeDefaults.mistDeep,
    alert: modeDefaults.alert,
    atmosphereMode: modeDefaults.atmosphereMode,
    signalSoft: isDark ? 'rgba(129,140,248,0.15)' : '#e0e7ff',
    accent,
    accent2,
    signal: accent,
    radius: baseTheme.radius || modeDefaults.radius,
    radiusSm: baseTheme.radiusSm || modeDefaults.radiusSm,
    radiusLg: baseTheme.radiusLg || modeDefaults.radiusLg,
    fontDisplay: baseTheme.fontDisplay || modeDefaults.fontDisplay,
    fontBody: baseTheme.fontBody || modeDefaults.fontBody,
  }
}

export function presetForScheme(scheme: ColorScheme): ThemeTokens {
  return scheme === 'light' ? { ...LIGHT_DEFAULTS } : { ...DARK_DEFAULTS }
}

export function findAccentPreset(accent: string) {
  return ACCENT_PRESETS.find((p) => p.accent.toLowerCase() === accent.toLowerCase()) || null
}

export function findFontPair(display: string, body: string) {
  return FONT_PAIRS.find((p) => p.display === display && p.body === body) || FONT_PAIRS[0]
}

export function findRadiusPreset(sm: string, md: string, lg: string) {
  return RADIUS_PRESETS.find((p) => p.sm === sm && p.md === md && p.lg === lg) || RADIUS_PRESETS[2]
}

export const THEME_POLL_MS = 15_000
