import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GuardianMark } from '../../components/GuardianMark'

/**
 * Shared backdrop for secondary staff auth screens (MFA challenge, MFA enrolment).
 *
 * Matches the light control-plane mist used by Super login / setup so Account →
 * “Add method” does not feel like a different product from /super/login.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-screen flex-col overflow-hidden bg-mist">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-mist" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(860px 420px at 18% -4%, color-mix(in srgb, var(--g-signal) 16%, transparent), transparent 68%), radial-gradient(680px 420px at 88% 12%, color-mix(in srgb, var(--g-accent-2) 14%, transparent), transparent 64%), radial-gradient(520px 360px at 70% 88%, color-mix(in srgb, var(--g-signal) 8%, transparent), transparent 62%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 92% 78% at 50% 6%, black 24%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(ellipse 92% 78% at 50% 6%, black 24%, transparent 76%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[color-mix(in_srgb,var(--g-mist-deep)_40%,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--g-line)] to-transparent" />
      </div>

      <div className="relative z-10 flex shrink-0 items-center px-6 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white shadow-sm">
            <GuardianMark className="h-4 w-4" />
          </span>
          <span className="font-display text-sm font-bold tracking-tight text-ink">Guardian</span>
          <span className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-ink-soft">
            CONTROL PLANE
          </span>
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-4 sm:px-8">
        {children}
      </div>

      <div className="relative z-10 shrink-0 px-6 pb-4 text-center font-mono text-[10px] tracking-wide text-ink-soft/60 sm:px-8">
        © {new Date().getFullYear()} Guardian Cloud · Super-admin console
      </div>
    </div>
  )
}
