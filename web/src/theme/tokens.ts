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
}

export type PlatformTheme = ThemeTokens & {
  version: number
  updatedAt?: string
}

/** Light Watchline (legacy mist). */
export const LIGHT_DEFAULTS: ThemeTokens = {
  ink: '#0b1220',
  inkSoft: '#3d4a5c',
  mist: '#e8eef4',
  mistDeep: '#d5dee8',
  signal: '#0f766e',
  signalSoft: '#ccfbf1',
  alert: '#c2410c',
  atmosphereMode: 'mist',
  colorScheme: 'light',
}

/** Dark void Watchline — teal signal + amber protect (security glass). */
export const DARK_DEFAULTS: ThemeTokens = {
  ink: '#f1f5f9',
  inkSoft: '#94a3b8',
  mist: '#07090f',
  mistDeep: '#0f1419',
  signal: '#2dd4bf',
  signalSoft: '#115e59',
  alert: '#f59e0b',
  atmosphereMode: 'void',
  colorScheme: 'dark',
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
}

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement
  const scheme = tokens.colorScheme === 'light' ? 'light' : 'dark'
  root.dataset.theme = scheme
  root.dataset.atmosphere = tokens.atmosphereMode || (scheme === 'dark' ? 'void' : 'mist')

  ;(Object.keys(TOKEN_CSS_VARS) as (keyof typeof TOKEN_CSS_VARS)[]).forEach((key) => {
    if (key === 'atmosphereMode') return
    root.style.setProperty(TOKEN_CSS_VARS[key], tokens[key])
  })

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
    '--g-glow',
    `color-mix(in srgb, ${tokens.signal} 35%, transparent)`,
  )
}

export function presetForScheme(scheme: ColorScheme): ThemeTokens {
  return scheme === 'light' ? { ...LIGHT_DEFAULTS } : { ...DARK_DEFAULTS }
}

export const THEME_POLL_MS = 15_000
