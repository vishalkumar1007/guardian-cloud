import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'

/** Seconds of warning before the session is expected to end. */
const WARNING_WINDOW_SECONDS = 60

/** How often the countdown re-evaluates. */
const TICK_MS = 1000

export interface IdleState {
  /** True once the deadline is inside the warning window. */
  warning: boolean
  secondsRemaining: number
}

/**
 * Mirror the server's idle deadline so a timeout is announced rather than
 * arriving as a silent 401 on whatever the user clicked next.
 *
 * The server remains the authority — this only reads the deadline it reported.
 * Because activity is recorded at most once a minute, the real cut-off can be
 * up to a minute later than shown, so this never signs anyone out on its own; it
 * warns, and lets the next request be refused for real.
 */
export function useIdleTimeout(): IdleState {
  const { user, refresh } = useAuth()
  const idleExpiresAt = user?.session.idle_expires_at
  const [secondsRemaining, setSecondsRemaining] = useState<number>(Number.POSITIVE_INFINITY)

  useEffect(() => {
    if (!idleExpiresAt) {
      setSecondsRemaining(Number.POSITIVE_INFINITY)
      return
    }

    const deadline = new Date(idleExpiresAt).getTime()
    const tick = () => setSecondsRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)))

    tick()
    const timer = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(timer)
  }, [idleExpiresAt])

  // Real interaction pushes the deadline out, so re-read it. Throttled to well
  // under the server's own write interval to avoid a request per keystroke.
  useEffect(() => {
    if (!user) return

    let lastPing = Date.now()
    const onActivity = () => {
      if (Date.now() - lastPing < 60_000) return
      lastPing = Date.now()
      void refresh()
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'focus']
    events.forEach((event) => window.addEventListener(event, onActivity))
    return () => events.forEach((event) => window.removeEventListener(event, onActivity))
  }, [user, refresh])

  return {
    warning: Number.isFinite(secondsRemaining) && secondsRemaining <= WARNING_WINDOW_SECONDS,
    secondsRemaining,
  }
}
