import { Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuth } from './AuthProvider'
import { useIdleTimeout } from './useIdleTimeout'

/**
 * Warns before an idle session ends.
 *
 * Without this the timeout arrives as an unexplained redirect on whatever the
 * user clicked next, which reads as a bug rather than a policy.
 */
export function IdleTimeoutWarning() {
  const { refresh } = useAuth()
  const { warning, secondsRemaining } = useIdleTimeout()

  if (!warning) return null

  return (
    <div
      role="alert"
      className="fixed bottom-5 left-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-amber-500/25 bg-surface p-4 shadow-[0_16px_48px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Still there?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            You'll be signed out in{' '}
            <span className="font-mono font-semibold text-ink">
              {Math.max(0, secondsRemaining)}s
            </span>{' '}
            because of inactivity.
          </p>
        </div>
        <Button
          type="button"
          variant="signal"
          onClick={() => void refresh()}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
        >
          Stay signed in
        </Button>
      </div>
    </div>
  )
}
