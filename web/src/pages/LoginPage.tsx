import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { GuardianMark } from '../components/GuardianMark'
import { SentinelMeshBg } from '../components/home/SentinelMeshBg'
import { useAuth } from '../auth/AuthProvider'
import { AuthBoundary } from '../auth/AuthBoundary'
import { SSOButtons } from '../auth/SSOButtons'
import { SSO_ERROR_MESSAGE } from '../auth/useSSOProviders'
import { ApiError } from '../lib/apiClient'

/**
 * Customer sign-in.
 *
 * Wrapped in AuthBoundary so the form is not shown before startup resolves —
 * otherwise someone already signed in would see it flash before the redirect.
 */
export function LoginPage() {
  return (
    <AuthBoundary>
      <LoginForm />
    </AuthBoundary>
  )
}

function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, login, endedReason, clearEndedReason } = useAuth()

  // Where the route guard bounced them from, so sign-in returns them there.
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/app'
  const ssoError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (user) navigate(returnTo, { replace: true })
  }, [user, navigate, returnTo])

  // Counts the lockout down so the wait is visible rather than a flat refusal.
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return
    const timer = window.setInterval(
      () => setLockoutSeconds((current) => (current === null || current <= 1 ? null : current - 1)),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [lockoutSeconds])

  // A failed SSO round trip comes back as a redirect carrying ?error=.
  useEffect(() => {
    if (!ssoError) return
    setNotice(SSO_ERROR_MESSAGE[ssoError] ?? 'Sign-in failed. Please try again.')
    setIsError(true)
  }, [ssoError])

  function fail(message: string) {
    setNotice(message)
    setIsError(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      fail('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    setNotice(null)
    setIsError(false)
    clearEndedReason()

    try {
      const result = await login(email.trim(), password)

      switch (result.status) {
        case 'authenticated':
          navigate(returnTo, { replace: true })
          break
        case 'mfa_required':
          // The password was right but no session exists yet; the challenge
          // lives in a short-lived cookie the next screen presents.
          navigate('/login/mfa', {
            replace: true,
            state: { methods: result.methods ?? ['TOTP'], returnTo },
          })
          break
        case 'mfa_enrollment_required':
          navigate('/login/enroll-mfa', { replace: true, state: { returnTo } })
          break
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setLockoutSeconds(err.retryAfterSeconds ?? 60)
        fail('Too many failed attempts. Please wait before trying again.')
      } else if (err instanceof ApiError && err.status === 403) {
        fail(err.message)
      } else if (err instanceof ApiError) {
        fail('Invalid email or password.')
      } else {
        fail('Could not reach Guardian. Check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLockedOut = lockoutSeconds !== null && lockoutSeconds > 0
  const sessionEndedNote =
    endedReason === 'idle_timeout'
      ? 'You were signed out after a period of inactivity.'
      : endedReason === 'expired'
        ? 'Your session expired. Please sign in again.'
        : null

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-mist">
      <SentinelMeshBg className="opacity-50" />
      <div className="grid h-full w-full lg:grid-cols-2 relative z-10">
        {/* LEFT: Clean, High-Impact Brand Showcase */}
        <div className="relative hidden h-full flex-col justify-between border-r border-line bg-surface/40 p-10 lg:flex xl:p-14">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-signal/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-signal/5 blur-[90px]" />

          {/* Brand Header */}
          <div className="relative z-10">
            <Link to="/" className="group inline-flex items-center gap-2.5 no-underline">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-mist-deep shadow-sm transition-transform group-hover:scale-105">
                <GuardianMark className="h-5 w-5" />
              </span>
              <span className="font-display text-base font-bold tracking-tight text-ink">Guardian</span>
            </Link>
          </div>

          {/* Central Hero Message */}
          <div className="relative z-10 my-auto max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11px] font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              Zero-Trust Control Plane
            </div>

            <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink xl:text-4xl">
              Protect the person.
              <br />
              <span className="text-ink-soft font-medium">Protect the organization.</span>
              <br />
              <span className="text-signal">Control the device.</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Continuous endpoint security, presence monitoring, and instant incident response for all your hardware.
            </p>

            <div className="mt-8 space-y-3 font-mono text-xs text-ink-soft">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <Check className="h-3 w-3" />
                </span>
                <span>Hardware-bound Ed25519 device keys</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <Check className="h-3 w-3" />
                </span>
                <span>Strict multi-tenant cryptographic isolation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <Check className="h-3 w-3" />
                </span>
                <span>Append-only security audit trail</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="relative z-10 font-mono text-[11px] text-ink-soft/70">
            Guardian Cloud · Personal Watchline & Enterprise
          </div>
        </div>

        {/* RIGHT: Clean, Focused, Unscrollable Auth Card */}
        <div className="relative flex h-full flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 overflow-hidden">
          {/* Top Home Link */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-ink lg:hidden no-underline">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal text-mist-deep">
                <GuardianMark className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-bold">Guardian</span>
            </Link>
            <Link
              to="/"
              className="ml-auto font-mono text-xs text-ink-soft hover:text-ink transition-colors no-underline"
            >
              ← Back to home
            </Link>
          </div>

          {/* Centered Auth Card */}
          <div className="mx-auto my-auto w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Welcome back
                </h2>
                <p className="mt-1 text-xs text-ink-soft sm:text-sm">
                  Sign in to access your Watchline dashboard.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-ink">
                    Email address
                  </Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-ink">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-soft hover:text-ink transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 rounded-xl pl-9 pr-9 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-ink-soft">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-line accent-signal"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="font-mono text-[11px] text-ink-soft">Argon2id</span>
                </div>

                <Button
                  type="submit"
                  variant="signal"
                  size="default"
                  disabled={isSubmitting || isLockedOut}
                  className="w-full rounded-xl py-5 text-sm font-semibold shadow-sm"
                >
                  {isSubmitting ? (
                    'Signing in...'
                  ) : isLockedOut ? (
                    `Locked — retry in ${lockoutSeconds}s`
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {(notice || sessionEndedNote) && (
                <div
                  className={
                    isError
                      ? 'rounded-xl border border-alert/30 bg-alert/5 px-3 py-2 text-xs text-alert'
                      : 'rounded-xl border border-signal/30 bg-signal-soft/20 px-3 py-2 text-xs text-ink'
                  }
                >
                  {notice ?? sessionEndedNote}
                </div>
              )}

              <SSOButtons plane="customer" redirectAfter={returnTo} dividerLabel="or" />

              <p className="text-center text-xs text-ink-soft pt-1">
                <Link to="/forgot-password" className="text-ink-soft hover:text-ink hover:underline">
                  Forgot your password?
                </Link>
              </p>

              <p className="text-center text-xs text-ink-soft">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-signal hover:underline">
                  Create one here
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Subtle Bottom Guarantee */}
          <div className="text-center font-mono text-[10px] text-ink-soft/60">
            Protected by hardware-isolated encryption · TLS 1.3
          </div>
        </div>
      </div>
    </div>
  )
}
