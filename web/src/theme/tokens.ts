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
  { id: 'forest', label: 'Forest', accent: '#16a34a', accent2: '#22c55e' },
  { id: 'midnight', label: 'Midnight', accent: '#0ea5e9', accent2: '#6366f1' },
  { id: 'coral', label: 'Coral', accent: '#ff6b6b', accent2: '#f97316' },
  { id: 'lavender', label: 'Lavender', accent: '#a78bfa', accent2: '#c4b5fd' },
  { id: 'graphite', label: 'Graphite', accent: '#334155', accent2: '#64748b' },
  { id: 'teal', label: 'Teal', accent: '#14b8a6', accent2: '#06b6d4' },
] as const

export const FONT_PAIRS = [
  { id: 'inter-sora', label: 'Classic', display: 'Sora', body: 'Inter', desc: 'Sora + Inter' },
  { id: 'jakarta-dm', label: 'Modern', display: 'Plus Jakarta Sans', body: 'DM Sans', desc: 'Jakarta + DM Sans' },
  { id: 'space-grotesk', label: 'Space', display: 'Space Grotesk', body: 'Space Grotesk', desc: 'Space Grotesk' },
  { id: 'manrope-outfit', label: 'Sleek', display: 'Outfit', body: 'Manrope', desc: 'Outfit + Manrope' },
  { id: 'archivo', label: 'Sharp', display: 'Archivo', body: 'Inter', desc: 'Archivo + Inter' },
  { id: 'epilogue', label: 'Elegant', display: 'Epilogue', body: 'Inter', desc: 'Epilogue + Inter' },
  { id: 'jetbrains', label: 'Technical', display: 'JetBrains Mono', body: 'Inter', desc: 'JetBrains Mono + Inter' },
  { id: 'lora', label: 'Editorial', display: 'Lora', body: 'Inter', desc: 'Lora + Inter' },
] as const

export type ThemePackKind = 'standard' | 'mood'

export type ThemePack = {
  id: string
  label: string
  description: string
  /** Short mood line shown on the pack card */
  mood: string
  kind: ThemePackKind
  scheme: ColorScheme
  accent: string
  accent2: string
  fontDisplay: string
  fontBody: string
  radius: string
  radiusSm: string
  radiusLg: string
  atmosphere: string
  /** Optional canvas overrides — make moods feel like places, not just accents */
  mist?: string
  mistDeep?: string
  ink?: string
  inkSoft?: string
  alert?: string
}

/**
 * Curated packs: 2 standards + distinct dark/light moods.
 * Each mood changes atmosphere, canvas, type, radius, and accent together.
 */
export const THEME_PACKS: ThemePack[] = [
  // ── Standards (baseline) ──────────────────────────────────────────
  {
    id: 'watchline-dark',
    label: 'Watchline Dark',
    description: 'Default Guardian ops shell',
    mood: 'Calm · reliable · SOC-ready',
    kind: 'standard',
    scheme: 'dark',
    accent: '#818cf8',
    accent2: '#a78bfa',
    fontDisplay: 'Sora',
    fontBody: 'Inter',
    radius: '14px',
    radiusSm: '10px',
    radiusLg: '22px',
    atmosphere: 'void',
    mist: '#0a0b14',
    mistDeep: '#12141f',
  },
  {
    id: 'watchline-light',
    label: 'Watchline Light',
    description: 'Bright daytime ops shell',
    mood: 'Clear · airy · focused',
    kind: 'standard',
    scheme: 'light',
    accent: '#6366f1',
    accent2: '#8b5cf6',
    fontDisplay: 'Sora',
    fontBody: 'Inter',
    radius: '14px',
    radiusSm: '10px',
    radiusLg: '22px',
    atmosphere: 'mist',
    mist: '#f6f7fb',
    mistDeep: '#eef0f7',
  },

  // ── Dark moods ────────────────────────────────────────────────────
  {
    id: 'aurora-ops',
    label: 'Aurora Ops',
    description: 'Neon night watch — cyan aurora over deep navy',
    mood: 'Electric · neon',
    kind: 'mood',
    scheme: 'dark',
    accent: '#22d3ee',
    accent2: '#a78bfa',
    fontDisplay: 'Space Grotesk',
    fontBody: 'Space Grotesk',
    radius: '18px',
    radiusSm: '12px',
    radiusLg: '28px',
    atmosphere: 'aurora',
    mist: '#070a1a',
    mistDeep: '#0c122c',
    ink: '#e0f7ff',
    inkSoft: '#7dd3fc',
    alert: '#fb7185',
  },
  {
    id: 'snow-ops',
    label: 'Snow Ops',
    description: 'Winter night desk — frost flakes on charcoal',
    mood: 'Cold · quiet · winter',
    kind: 'mood',
    scheme: 'dark',
    accent: '#e2e8f0',
    accent2: '#94a3b8',
    fontDisplay: 'Sora',
    fontBody: 'Inter',
    radius: '16px',
    radiusSm: '12px',
    radiusLg: '24px',
    atmosphere: 'snow',
    mist: '#070a14',
    mistDeep: '#0c1424',
    ink: '#f8fafc',
    inkSoft: '#cbd5e1',
  },
  {
    id: 'starfield-night',
    label: 'Starfield',
    description: 'Deep space ops — pinpoint stars, silver signal',
    mood: 'Cosmic · quiet · night',
    kind: 'mood',
    scheme: 'dark',
    accent: '#f8fafc',
    accent2: '#a78bfa',
    fontDisplay: 'Archivo',
    fontBody: 'Inter',
    radius: '12px',
    radiusSm: '8px',
    radiusLg: '18px',
    atmosphere: 'starfield',
    mist: '#050714',
    mistDeep: '#080a1a',
    ink: '#f1f5f9',
    inkSoft: '#a5b4fc',
  },
  {
    id: 'nebula-pulse',
    label: 'Nebula Pulse',
    description: 'Violet nebula clouds — magenta energy',
    mood: 'Dream · violet · pulse',
    kind: 'mood',
    scheme: 'dark',
    accent: '#e879f9',
    accent2: '#818cf8',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
    radius: '16px',
    radiusSm: '12px',
    radiusLg: '26px',
    atmosphere: 'nebula',
    mist: '#0b0614',
    mistDeep: '#130a24',
    ink: '#fdf4ff',
    inkSoft: '#e9d5ff',
  },
  {
    id: 'mesh-midnight',
    label: 'Mesh Midnight',
    description: 'Soft mesh blur — indigo haze, modern type',
    mood: 'Soft · midnight · haze',
    kind: 'mood',
    scheme: 'dark',
    accent: '#8b5cf6',
    accent2: '#6366f1',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
    radius: '14px',
    radiusSm: '10px',
    radiusLg: '22px',
    atmosphere: 'mesh',
    mist: '#070a14',
    mistDeep: '#0e1430',
    ink: '#ede9fe',
    inkSoft: '#c4b5fd',
  },
  {
    id: 'ember-forge',
    label: 'Ember Forge',
    description: 'Warm forge floor — amber heat on charcoal',
    mood: 'Warm · urgent',
    kind: 'mood',
    scheme: 'dark',
    accent: '#f59e0b',
    accent2: '#f97316',
    fontDisplay: 'Archivo',
    fontBody: 'Inter',
    radius: '8px',
    radiusSm: '6px',
    radiusLg: '12px',
    atmosphere: 'ember',
    mist: '#140a06',
    mistDeep: '#1a0f0a',
    ink: '#fff7ed',
    inkSoft: '#fdba74',
    alert: '#ef4444',
  },
  {
    id: 'grid-tactical',
    label: 'Grid Tactical',
    description: 'Mission grid — mono type, tight corners',
    mood: 'Tactical · precise',
    kind: 'mood',
    scheme: 'dark',
    accent: '#6366f1',
    accent2: '#818cf8',
    fontDisplay: 'JetBrains Mono',
    fontBody: 'Inter',
    radius: '6px',
    radiusSm: '4px',
    radiusLg: '10px',
    atmosphere: 'grid',
    mist: '#070a14',
    mistDeep: '#0d1020',
    ink: '#e2e8f0',
    inkSoft: '#94a3b8',
  },
  {
    id: 'ocean-depth',
    label: 'Ocean Depth',
    description: 'Deep water ops — teal pressure, soft curves',
    mood: 'Deep · fluid',
    kind: 'mood',
    scheme: 'dark',
    accent: '#2dd4bf',
    accent2: '#38bdf8',
    fontDisplay: 'Outfit',
    fontBody: 'Manrope',
    radius: '20px',
    radiusSm: '14px',
    radiusLg: '32px',
    atmosphere: 'ocean',
    mist: '#04121a',
    mistDeep: '#081a24',
    ink: '#ecfeff',
    inkSoft: '#5eead4',
  },
  {
    id: 'obsidian-ink',
    label: 'Obsidian Ink',
    description: 'High-contrast ink black — razor edges',
    mood: 'Sharp · ink · contrast',
    kind: 'mood',
    scheme: 'dark',
    accent: '#fbbf24',
    accent2: '#f97316',
    fontDisplay: 'Archivo',
    fontBody: 'Inter',
    radius: '4px',
    radiusSm: '2px',
    radiusLg: '8px',
    atmosphere: 'obsidian',
    mist: '#040510',
    mistDeep: '#0a0c1a',
    ink: '#f8fafc',
    inkSoft: '#94a3b8',
  },

  // ── Light moods ───────────────────────────────────────────────────
  {
    id: 'paper-board',
    label: 'Paper Boardroom',
    description: 'Editorial slate — cream paper, crisp type',
    mood: 'Formal · editorial',
    kind: 'mood',
    scheme: 'light',
    accent: '#0f172a',
    accent2: '#334155',
    fontDisplay: 'Epilogue',
    fontBody: 'Inter',
    radius: '10px',
    radiusSm: '6px',
    radiusLg: '16px',
    atmosphere: 'paper',
    mist: '#fffcf5',
    mistDeep: '#f5efe3',
    ink: '#0f172a',
    inkSoft: '#475569',
  },
  {
    id: 'lagoon-tide',
    label: 'Lagoon Tide',
    description: 'Coastal calm — soft teal wash, rounded glass',
    mood: 'Airy · coastal',
    kind: 'mood',
    scheme: 'light',
    accent: '#0d9488',
    accent2: '#06b6d4',
    fontDisplay: 'Outfit',
    fontBody: 'Manrope',
    radius: '18px',
    radiusSm: '12px',
    radiusLg: '28px',
    atmosphere: 'lagoon',
    mist: '#f0fdfa',
    mistDeep: '#ccfbf1',
    ink: '#134e4a',
    inkSoft: '#0f766e',
  },
  {
    id: 'sunrise-studio',
    label: 'Sunrise Studio',
    description: 'Morning studio — peach glow, serif headers',
    mood: 'Warm · dawn',
    kind: 'mood',
    scheme: 'light',
    accent: '#e11d48',
    accent2: '#f97316',
    fontDisplay: 'Lora',
    fontBody: 'Inter',
    radius: '16px',
    radiusSm: '12px',
    radiusLg: '26px',
    atmosphere: 'sunrise',
    mist: '#fff8f6',
    mistDeep: '#ffe4d6',
    ink: '#4c0519',
    inkSoft: '#9f1239',
  },
  {
    id: 'frost-lab',
    label: 'Frost Lab',
    description: 'Clinical frost — ice blue, sharp geometry',
    mood: 'Cool · clinical',
    kind: 'mood',
    scheme: 'light',
    accent: '#0284c7',
    accent2: '#06b6d4',
    fontDisplay: 'Sora',
    fontBody: 'Inter',
    radius: '8px',
    radiusSm: '4px',
    radiusLg: '12px',
    atmosphere: 'frost',
    mist: '#f8fffe',
    mistDeep: '#e0f2fe',
    ink: '#0c4a6e',
    inkSoft: '#0369a1',
  },
  {
    id: 'daylight-sky',
    label: 'Daylight Sky',
    description: 'Bright open sky — crisp blue wash',
    mood: 'Bright · open · sky',
    kind: 'mood',
    scheme: 'light',
    accent: '#2563eb',
    accent2: '#0ea5e9',
    fontDisplay: 'Inter',
    fontBody: 'Inter',
    radius: '14px',
    radiusSm: '10px',
    radiusLg: '22px',
    atmosphere: 'daylight',
    mist: '#ffffff',
    mistDeep: '#e6efff',
    ink: '#1e3a8a',
    inkSoft: '#3b82f6',
  },
  {
    id: 'orchid-blush',
    label: 'Orchid Blush',
    description: 'Soft lavender blush — modern rounded chrome',
    mood: 'Soft · orchid · blush',
    kind: 'mood',
    scheme: 'light',
    accent: '#a78bfa',
    accent2: '#ec4899',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'DM Sans',
    radius: '20px',
    radiusSm: '14px',
    radiusLg: '30px',
    atmosphere: 'blush',
    mist: '#fdf8ff',
    mistDeep: '#ede6ff',
    ink: '#4c1d95',
    inkSoft: '#7c3aed',
  },
  {
    id: 'honey-paper',
    label: 'Honey Paper',
    description: 'Warm honey cream — amber accents on parchment',
    mood: 'Warm · honey · paper',
    kind: 'mood',
    scheme: 'light',
    accent: '#d97706',
    accent2: '#f59e0b',
    fontDisplay: 'Lora',
    fontBody: 'Inter',
    radius: '14px',
    radiusSm: '10px',
    radiusLg: '22px',
    atmosphere: 'paper',
    mist: '#fffbeb',
    mistDeep: '#fde68a',
    ink: '#78350f',
    inkSoft: '#b45309',
  },
  {
    id: 'mint-breeze',
    label: 'Mint Breeze',
    description: 'Fresh mint glass — soft green lagoon light',
    mood: 'Fresh · mint · breeze',
    kind: 'mood',
    scheme: 'light',
    accent: '#059669',
    accent2: '#14b8a6',
    fontDisplay: 'Outfit',
    fontBody: 'Manrope',
    radius: '16px',
    radiusSm: '12px',
    radiusLg: '24px',
    atmosphere: 'lagoon',
    mist: '#f0fdf4',
    mistDeep: '#bbf7d0',
    ink: '#14532d',
    inkSoft: '#15803d',
  },
]

export const ATMOSPHERE_PRESETS = [
  { id: 'void', label: 'Void', desc: 'Deep cosmic black, indigo glow', bg: 'radial-gradient(900px 340px at 50% -12%, rgba(129,140,248,0.22), transparent 68%), radial-gradient(700px 260px at 80% 0%, rgba(99,102,241,0.12), transparent 60%), linear-gradient(180deg,#07080f 0%, #0a0b14 45%, #0c0f1e 100%)' },
  { id: 'obsidian', label: 'Obsidian', desc: 'High contrast, sharp edges', bg: 'linear-gradient(180deg,#040510 0%, #0a0c1a 55%, #0f1226 100%)' },
  { id: 'aurora', label: 'Aurora', desc: 'Cyberpunk aurora hues', bg: 'radial-gradient(700px 340px at 12% -8%, rgba(6,182,214,0.26), transparent 64%), radial-gradient(800px 360px at 88% -12%, rgba(139,92,246,0.22), transparent 66%), linear-gradient(180deg,#070a1a 0%, #0c122c 100%)' },
  { id: 'nebula', label: 'Nebula', desc: 'Violet nebula clouds, superadmin', bg: 'radial-gradient(650px 320px at 18% -6%, rgba(217,70,239,0.22), transparent 62%), radial-gradient(720px 340px at 82% -10%, rgba(99,102,241,0.18), transparent 64%), linear-gradient(180deg,#0b0614 0%, #130a24 55%, #0a0b1e 100%)' },
  { id: 'ember', label: 'Ember', desc: 'Warm ember, amber glow', bg: 'radial-gradient(750px 320px at 30% -10%, rgba(249,115,22,0.20), transparent 64%), radial-gradient(600px 280px at 78% -6%, rgba(244,63,94,0.16), transparent 62%), linear-gradient(180deg,#160a06 0%, #1a0f0a 50%, #0f0a14 100%)' },
  { id: 'ocean', label: 'Ocean', desc: 'Deep ocean teal, superadmin', bg: 'radial-gradient(760px 340px at 22% -10%, rgba(20,184,166,0.22), transparent 64%), radial-gradient(700px 300px at 86% -8%, rgba(14,165,233,0.18), transparent 62%), linear-gradient(180deg,#04121a 0%, #081a24 55%, #0a0f1e 100%)' },
  { id: 'grid', label: 'Grid', desc: 'Tactical grid + glow — dark', bg: 'linear-gradient(rgba(129,140,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.06) 1px, transparent 1px), radial-gradient(700px 320px at 50% -10%, rgba(129,140,248,0.16), transparent 70%), linear-gradient(180deg,#070a14,#0d1020)' },
  { id: 'snow', label: 'Snow', desc: 'Winter snow, falling dots — dark', bg: 'radial-gradient(900px 340px at 50% -12%, rgba(255,255,255,0.10), transparent 68%), radial-gradient(2px 2px at 15% 20%, white 60%, transparent), linear-gradient(180deg,#070a14 0%, #0c1424 55%, #0a0f1e 100%)' },
  { id: 'mesh', label: 'Mesh', desc: 'Mesh gradient, soft blur — dark', bg: 'radial-gradient(760px 320px at 20% -10%, rgba(99,102,241,0.18), transparent 62%), radial-gradient(700px 340px at 80% -8%, rgba(217,70,239,0.14), transparent 64%), linear-gradient(180deg,#070a14 0%, #0e1430 100%)' },
  { id: 'starfield', label: 'Starfield', desc: 'Starfield twinkle — dark', bg: 'radial-gradient(1.5px 1.5px at 12% 18%, white 70%, transparent), radial-gradient(1px 1px at 42% 32%, white 60%, transparent), linear-gradient(180deg,#050714 0%, #080a1a 100%)' },
  { id: 'mist', label: 'Mist', desc: 'Diffused ambient glow — light', bg: 'radial-gradient(800px 320px at 20% -12%, rgba(99,102,241,0.10), transparent 62%), radial-gradient(700px 280px at 85% -8%, rgba(139,92,246,0.08), transparent 64%), linear-gradient(180deg,#f8f9ff 0%, #f1f3f9 55%, #eef0f7 100%)' },
  { id: 'daylight', label: 'Daylight', desc: 'Bright sky, light blue — light', bg: 'radial-gradient(820px 320px at 18% -12%, rgba(14,165,233,0.14), transparent 62%), radial-gradient(720px 300px at 84% -8%, rgba(99,102,241,0.10), transparent 64%), linear-gradient(180deg,#ffffff 0%, #f0f6ff 55%, #e6efff 100%)' },
  { id: 'paper', label: 'Paper', desc: 'Warm paper cream — light', bg: 'radial-gradient(760px 300px at 22% -10%, rgba(245,158,11,0.12), transparent 62%), radial-gradient(640px 280px at 82% -6%, rgba(251,146,60,0.08), transparent 64%), linear-gradient(180deg,#fffcf5 0%, #fef7eb 55%, #fdf1d8 100%)' },
  { id: 'frost', label: 'Frost', desc: 'Icy frost aqua — light', bg: 'radial-gradient(760px 320px at 20% -10%, rgba(6,182,214,0.12), transparent 62%), radial-gradient(680px 280px at 86% -8%, rgba(20,184,166,0.10), transparent 64%), linear-gradient(180deg,#f8fffe 0%, #ecf8f5 55%, #e0f2ee 100%)' },
  { id: 'sunrise', label: 'Sunrise', desc: 'Peach sunrise coral — light', bg: 'radial-gradient(780px 320px at 24% -10%, rgba(251,113,133,0.14), transparent 62%), radial-gradient(700px 300px at 84% -8%, rgba(249,115,22,0.10), transparent 64%), linear-gradient(180deg,#fff8f6 0%, #fff1e8 55%, #ffe4d6 100%)' },
  { id: 'lagoon', label: 'Lagoon', desc: 'Tropical lagoon teal — light', bg: 'radial-gradient(780px 320px at 20% -12%, rgba(20,184,166,0.14), transparent 62%), radial-gradient(700px 300px at 85% -8%, rgba(6,182,214,0.12), transparent 64%), linear-gradient(180deg,#f0fdfa 0%, #e0f7f3 55%, #ccfbf1 100%)' },
  { id: 'blush', label: 'Blush', desc: 'Soft blush pink lavender — light', bg: 'radial-gradient(780px 320px at 20% -10%, rgba(167,139,250,0.14), transparent 62%), radial-gradient(700px 300px at 85% -8%, rgba(236,72,153,0.10), transparent 64%), linear-gradient(180deg,#fdf8ff 0%, #f5f0ff 55%, #ede6ff 100%)' },
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

/** CSS font-family stack from a family name (quotes names for safety). */
export function formatFontFamily(font: string): string {
  const name = (font || '').trim().replace(/^["']|["']$/g, '')
  if (!name) return 'sans-serif'
  return `"${name}", ui-sans-serif, system-ui, sans-serif`
}

export function softAccent(accent: string, scheme: ColorScheme): string {
  const rgb = hexToRgb(accent)
  return scheme === 'dark' ? `rgba(${rgb},0.15)` : `color-mix(in srgb, ${accent} 16%, white)`
}

export function themeTokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const scheme = tokens.colorScheme === 'light' ? 'light' : 'dark'
  const accent = tokens.accent || tokens.signal
  const accent2 = tokens.accent2 || accent
  const signal = tokens.signal || accent
  const fontDisplay = formatFontFamily(tokens.fontDisplay)
  const fontBody = formatFontFamily(tokens.fontBody)
  // Keep canvas/surfaces neutral — accent only drives chrome + a soft local glow.
  const mist = tokens.mist
  const mistDeep = tokens.mistDeep
  const vars: Record<string, string> = {}
  vars['--g-ink'] = tokens.ink
  vars['--g-ink-soft'] = tokens.inkSoft
  vars['--g-mist'] = mist
  vars['--g-mist-deep'] = mistDeep
  vars['--g-signal'] = signal
  vars['--g-signal-soft'] = tokens.signalSoft || softAccent(accent, scheme)
  vars['--g-alert'] = tokens.alert
  vars['--g-accent'] = accent
  vars['--g-accent-2'] = accent2
  vars['--g-accent-rgb'] = hexToRgb(accent)
  vars['--accent'] = accent
  vars['--accent-2'] = accent2
  vars['--accent-rgb'] = hexToRgb(accent)
  vars['--g-radius'] = tokens.radius
  vars['--g-radius-sm'] = tokens.radiusSm
  vars['--g-radius-lg'] = tokens.radiusLg
  vars['--radius'] = tokens.radius
  vars['--radius-sm'] = tokens.radiusSm
  vars['--radius-md'] = tokens.radius
  vars['--radius-lg'] = tokens.radius
  vars['--radius-xl'] = tokens.radiusLg
  vars['--radius-2xl'] = tokens.radiusLg
  vars['--radius-3xl'] = tokens.radiusLg
  vars['--g-font-display'] = fontDisplay
  vars['--g-font-body'] = fontBody
  vars['--font-display'] = fontDisplay
  vars['--font-body'] = fontBody
  vars['--font-sans'] = fontBody
  vars['--g-text'] = tokens.ink
  vars['--g-text-2'] = tokens.inkSoft
  vars['--g-text-3'] = scheme === 'dark' ? '#6b7590' : '#94a3b8'
  vars['--g-border'] = scheme === 'dark' ? '#262a3a' : '#e6e8ef'
  vars['--g-border-strong'] = scheme === 'dark' ? '#333a4f' : '#d5d9e4'
  const lineMix = tokens.ink
  const lineAlpha = scheme === 'dark' ? 14 : 12
  vars['--g-line'] = `color-mix(in srgb, ${lineMix} ${lineAlpha}%, transparent)`
  vars['--g-surface'] = scheme === 'dark' ? `color-mix(in srgb, ${mistDeep} 72%, #1a2332)` : `color-mix(in srgb, white 70%, ${mist})`
  vars['--g-surface-2'] = scheme === 'dark' ? `color-mix(in srgb, ${mistDeep} 55%, #243044)` : `color-mix(in srgb, white 55%, ${mistDeep})`
  vars['--g-surface-3'] = scheme === 'dark' ? `color-mix(in srgb, ${mistDeep} 35%, #2a374d)` : `color-mix(in srgb, white 35%, ${mistDeep})`
  // Soft localized wash only (not a full-canvas flood)
  vars['--g-glow'] = `color-mix(in srgb, ${signal} ${scheme === 'dark' ? 14 : 10}%, transparent)`
  return vars
}

export function applyThemeTokensToElement(el: HTMLElement, tokens: ThemeTokens) {
  const scheme = tokens.colorScheme === 'light' ? 'light' : 'dark'
  el.dataset.theme = scheme
  el.dataset.atmosphere = tokens.atmosphereMode || (scheme === 'dark' ? 'void' : 'mist')
  el.classList.toggle('dark', scheme === 'dark')
  ensureGoogleFontLoaded(tokens.fontDisplay)
  ensureGoogleFontLoaded(tokens.fontBody)
  const vars = themeTokensToCssVars(tokens)
  Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v))
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

/** While SuperAdminShell is mounted it owns document theme application. */
export function setDashboardShellOwnsTheme(owns: boolean) {
  if (typeof document === 'undefined') return
  if (owns) document.documentElement.setAttribute('data-dashboard-shell', '1')
  else document.documentElement.removeAttribute('data-dashboard-shell')
}

export function dashboardShellOwnsTheme(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('data-dashboard-shell') === '1'
}

/**
 * When a super-admin has Enable Custom (personal dashboard theme), Brand Studio /
 * platform theme paints must not overwrite the document — only the shell may apply.
 */
let personalDashboardOwnsTheme = false

export function setPersonalDashboardOwnsTheme(owns: boolean) {
  personalDashboardOwnsTheme = owns
}

export function personalDashboardOwnsThemeActive(): boolean {
  return personalDashboardOwnsTheme
}

/**
 * Apply tokens to <html>.
 * - Without force: no-op while the dashboard shell owns the document.
 * - With force: Brand live-edit / shell sync — blocked while personal dashboard owns theme
 *   unless `allowWhilePersonal` (shell re-applying the personal effective theme).
 */
export function applyThemeTokens(
  tokens: ThemeTokens,
  opts?: { force?: boolean; allowWhilePersonal?: boolean },
) {
  if (personalDashboardOwnsTheme && !opts?.allowWhilePersonal) return
  if (!opts?.force && dashboardShellOwnsTheme()) return
  applyThemeTokensToElement(document.documentElement, tokens)
}

export const LIGHT_ATMOS = new Set(['mist', 'daylight', 'paper', 'frost', 'sunrise', 'lagoon', 'blush'])
export const DARK_ATMOS = new Set(['void', 'obsidian', 'aurora', 'nebula', 'ember', 'ocean', 'grid', 'snow', 'mesh', 'starfield'])

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

export function applySchemeToThemePreserve(baseTheme: ThemeTokens, newScheme: ColorScheme): ThemeTokens {
  if (baseTheme.colorScheme === newScheme) return baseTheme
  const isDark = newScheme === 'dark'
  const modeDefaults = isDark ? DARK_DEFAULTS : LIGHT_DEFAULTS
  const accent = baseTheme.accent || modeDefaults.accent
  const accent2 = baseTheme.accent2 || modeDefaults.accent2
  const keepAtmos = (isDark ? DARK_ATMOS.has(baseTheme.atmosphereMode) : LIGHT_ATMOS.has(baseTheme.atmosphereMode)) ? baseTheme.atmosphereMode : modeDefaults.atmosphereMode
  return {
    ...baseTheme,
    colorScheme: newScheme,
    ink: modeDefaults.ink,
    inkSoft: modeDefaults.inkSoft,
    mist: modeDefaults.mist,
    mistDeep: modeDefaults.mistDeep,
    alert: modeDefaults.alert,
    atmosphereMode: keepAtmos,
    signalSoft: softAccent(accent, newScheme),
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

export function themePackToTokens(p: ThemePack): ThemeTokens {
  const base = p.scheme === 'light' ? LIGHT_DEFAULTS : DARK_DEFAULTS
  return {
    ...base,
    colorScheme: p.scheme,
    accent: p.accent,
    accent2: p.accent2,
    signal: p.accent,
    signalSoft: softAccent(p.accent, p.scheme),
    fontDisplay: p.fontDisplay,
    fontBody: p.fontBody,
    radius: p.radius,
    radiusSm: p.radiusSm,
    radiusLg: p.radiusLg,
    atmosphereMode: p.atmosphere,
    mist: p.mist || base.mist,
    mistDeep: p.mistDeep || base.mistDeep,
    ink: p.ink || base.ink,
    inkSoft: p.inkSoft || base.inkSoft,
    alert: p.alert || base.alert,
  }
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
