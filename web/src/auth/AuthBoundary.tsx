import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { GuardianMark } from '../components/GuardianMark'
import { useAuth } from './AuthProvider'

/**
 * Holds every auth-dependent screen until startup has resolved.
 *
 * The login page, the setup page and the console all render behind this, so
 * exactly one of them can ever appear. Without it each screen would decide for
 * itself while the status request was still in flight, and the user would see
 * the login form flash before being redirected to setup.
 *
 * The three outcomes are: still resolving (a stable splash), resolved (children),
 * or failed (an error with a retry, never a silent blank page).
 */
export function AuthBoundary({ children }: { children: ReactNode }) {
  const { initState, initError, retryInit } = useAuth()

  if (initState === 'error') {
    return <StartupError message={initError} onRetry={retryInit} />
  }
  if (initState === 'loading') {
    return <StartupSplash />
  }
  return <>{children}</>
}

/**
 * The waiting state.
 *
 * Deliberately identical in layout to the screens that follow it — same dark
 * ground, same centred card position — so the transition is a swap of content
 * rather than a jump.
 *
 * The reassurance line only appears after a couple of seconds. A fast API never
 * shows it; a slow one explains itself instead of looking stuck.
 */
function StartupSplash() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 2500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <StartupFrame>
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <ShieldCheck className="h-5 w-5 text-white/70" />
          <span className="absolute inset-0 animate-ping rounded-2xl border border-[var(--g-signal)] opacity-20" />
        </span>
        <p className="font-mono text-[11px] tracking-widest text-white/45">STARTING GUARDIAN</p>
        {slow && (
          <p className="max-w-[280px] text-center text-xs leading-relaxed text-white/35">
            Still connecting to the Guardian API. This can take a few seconds on a cold start.
          </p>
        )}
      </div>
    </StartupFrame>
  )
}

function StartupError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false)

  return (
    <StartupFrame>
      <div className="w-full max-w-[380px] rounded-[20px] border border-line bg-surface p-6 text-left shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-alert/20 bg-alert/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-alert">
          <AlertTriangle className="h-3 w-3" /> Cannot reach Guardian
        </span>
        <h1 className="mt-3 font-display text-[20px] font-bold tracking-tight text-ink">
          The console could not start
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          {message ?? 'Something went wrong starting the Guardian console.'}
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft/70">
          Check that the Guardian API is running and reachable, then try again.
        </p>
        <Button
          type="button"
          variant="signal"
          disabled={retrying}
          onClick={() => {
            setRetrying(true)
            onRetry()
            // The boundary unmounts this on success; the reset only matters if
            // the retry fails and we land back here.
            window.setTimeout(() => setRetrying(false), 1500)
          }}
          className="mt-4 w-full rounded-xl py-5 text-sm font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    </StartupFrame>
  )
}

/** The shared ground for both startup states, matching the auth screens. */
function StartupFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-[#080a14] px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-8%] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--g-signal)] opacity-[0.14] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 20%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 60% at 50% 20%, black 20%, transparent 75%)',
          }}
        />
      </div>

      <div className="absolute left-6 top-5 z-10 flex items-center gap-2 sm:left-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#080a14]">
          <GuardianMark className="h-4 w-4" />
        </span>
        <span className="font-display text-sm font-bold text-white">Guardian</span>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">{children}</div>
    </div>
  )
}
