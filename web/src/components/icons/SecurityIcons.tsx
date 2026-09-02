import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function base(props: IconProps) {
  const { title, ...rest } = props
  return { title, rest }
}

/** Central protect shield — amber/signal metallic. */
export function IconShieldCheck(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="g-shield" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--g-alert)" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--g-alert) 55%, #fff)" />
        </linearGradient>
      </defs>
      <path
        d="M32 6L50 14V30c0 14-10.5 24.5-18 28-7.5-3.5-18-14-18-28V14L32 6Z"
        fill="url(#g-shield)"
        stroke="color-mix(in srgb, var(--g-alert) 40%, white)"
        strokeWidth="1.5"
      />
      <path
        d="M22 31.5l6.5 6.5L42 24.5"
        stroke="var(--g-mist)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconLockAuth(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="16" y="28" width="32" height="26" rx="6" fill="var(--g-surface-2)" stroke="var(--g-ink-soft)" strokeWidth="1.5" />
      <path
        d="M22 28v-6a10 10 0 0 1 20 0v6"
        stroke="var(--g-ink-soft)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="3.5" fill="var(--g-signal)" />
      <path d="M32 43.5V48" stroke="var(--g-signal)" strokeWidth="2" strokeLinecap="round" />
      <text x="20" y="60" fill="var(--g-ink-soft)" fontSize="7" fontFamily="monospace" letterSpacing="2">
        ****
      </text>
    </svg>
  )
}

export function IconCloudLock(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <path
        d="M20 40h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A9 9 0 0 0 20 40Z"
        fill="var(--g-surface-2)"
        stroke="var(--g-ink-soft)"
        strokeWidth="1.6"
      />
      <rect x="26" y="34" width="12" height="10" rx="2.5" fill="var(--g-mist-deep)" stroke="var(--g-signal)" strokeWidth="1.2" />
      <path d="M29 34v-2.5a3 3 0 0 1 6 0V34" stroke="var(--g-signal)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function IconMonitorScan(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="10" y="12" width="36" height="28" rx="4" fill="var(--g-surface-2)" stroke="var(--g-ink-soft)" strokeWidth="1.5" />
      <path d="M16 20h10M16 25h16M16 30h12" stroke="var(--g-ink-soft)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="44" cy="40" r="12" fill="color-mix(in srgb, var(--g-signal) 18%, var(--g-mist))" stroke="var(--g-signal)" strokeWidth="1.6" />
      <circle cx="44" cy="40" r="5" stroke="var(--g-signal)" strokeWidth="1.6" />
      <path d="M52 48l5 5" stroke="var(--g-signal)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconDataBlocks(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="22" y="10" width="20" height="14" rx="3" fill="var(--g-surface-2)" stroke="var(--g-ink-soft)" strokeWidth="1.4" />
      <rect x="16" y="26" width="20" height="14" rx="3" fill="var(--g-surface-2)" stroke="var(--g-ink-soft)" strokeWidth="1.4" />
      <rect x="28" y="42" width="20" height="14" rx="3" fill="var(--g-surface-2)" stroke="var(--g-signal)" strokeWidth="1.4" />
    </svg>
  )
}

export function IconAuditDoc(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <path
        d="M18 8h22l10 10v36a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z"
        fill="var(--g-surface-2)"
        stroke="var(--g-ink-soft)"
        strokeWidth="1.5"
      />
      <path d="M40 8v10h10" stroke="var(--g-ink-soft)" strokeWidth="1.5" />
      <path d="M22 28h20M22 34h16M22 40h12" stroke="var(--g-ink-soft)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="44" cy="46" r="8" fill="var(--g-alert)" />
      <path d="M40.5 46.5l2.5 2.5 4.5-5" stroke="var(--g-mist)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSecureCode(props: IconProps) {
  const { title, rest } = base(props)
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={!title} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="8" y="12" width="48" height="36" rx="6" fill="var(--g-surface-2)" stroke="var(--g-ink-soft)" strokeWidth="1.5" />
      <circle cx="16" cy="20" r="2" fill="var(--g-alert)" />
      <circle cx="22" cy="20" r="2" fill="var(--g-signal)" />
      <circle cx="28" cy="20" r="2" fill="var(--g-ink-soft)" />
      <path
        d="M24 34l-6 6 6 6M40 34l6 6-6 6M36 30l-8 20"
        stroke="var(--g-signal)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
