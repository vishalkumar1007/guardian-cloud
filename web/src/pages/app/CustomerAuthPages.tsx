import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck, MailCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { GuardianMark } from '../../components/GuardianMark'
import { ApiError, api } from '../../lib/apiClient'

/**
 * The customer auth screens that have no designed counterpart: email
 * confirmation and password recovery. Sign-in and sign-up live in
 * pages/LoginPage.tsx and pages/SignupPage.tsx, which own their own design.
 */

/** Minimum accepted by the server; stated up front rather than after a failure. */
const MIN_PASSWORD_LENGTH = 10

/** The shared frame for every customer authentication screen. */
function CustomerAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-mist px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(760px 380px at 20% -6%, color-mix(in srgb, var(--g-signal) 14%, transparent), transparent 66%), radial-gradient(620px 380px at 85% 10%, color-mix(in srgb, var(--g-accent-2) 12%, transparent), transparent 62%)',
          }}
        />
      </div>

      <Link to="/" className="relative z-10 mb-6 flex items-center gap-2 no-underline">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-white shadow-sm">
          <GuardianMark className="h-5 w-5" />
        </span>
        <span className="font-display text-[15px] font-bold tracking-tight text-ink">Guardian</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {children}
      </motion.div>
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-line bg-surface p-6 shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:p-7">
      {children}
    </div>
  )
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
      {children}
    </div>
  )
}

/* ------------------------------------------------------- Email verification */

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working')

  useEffect(() => {
    if (!token) {
      setState('failed')
      return
    }
    void (async () => {
      try {
        await api.post('/api/v1/auth/email/verify', { token }, { plane: 'customer' })
        setState('done')
      } catch {
        setState('failed')
      }
    })()
  }, [token])

  return (
    <CustomerAuthShell>
      <Card>
        {state === 'working' && (
          <p className="py-6 text-center font-mono text-xs tracking-widest text-ink-soft">
            CONFIRMING YOUR EMAIL…
          </p>
        )}

        {state === 'done' && (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-[22px] font-bold tracking-tight text-ink">
              Email confirmed
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Your address is verified. You can sign in and start adding devices.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-white no-underline"
            >
              Sign in
            </Link>
          </>
        )}

        {state === 'failed' && (
          <>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
              This link is no longer valid
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Confirmation links expire after 24 hours and can only be used once. Sign in and we'll
              send you a new one.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-white no-underline"
            >
              Go to sign in
            </Link>
          </>
        )}
      </Card>
    </CustomerAuthShell>
  )
}

/* --------------------------------------------------------- Password recovery */

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/api/v1/auth/password/forgot', { email: email.trim() }, { plane: 'customer' })
    } catch {
      // The server answers the same way for every address, and so does this
      // page — a network failure must not become an existence signal either.
    } finally {
      setSent(true)
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerAuthShell>
      <Card>
        {sent ? (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-signal/15 bg-signal-soft text-signal">
              <MailCheck className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-[22px] font-bold tracking-tight text-ink">
              Check your email
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              If an account exists for {email.trim()}, we've sent a reset link. It expires in an
              hour.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink no-underline"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
              Reset your password
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              We'll email you a link to choose a new one.
            </p>
            <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold text-ink">
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 rounded-xl border-line bg-surface-2 text-sm"
                />
              </div>
              <Button
                type="submit"
                variant="signal"
                disabled={isSubmitting || !email.includes('@')}
                className="w-full rounded-xl py-5 text-sm font-semibold"
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
            <p className="mt-4 text-center text-[13px] text-ink-soft">
              <Link to="/login" className="font-medium text-signal no-underline hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </Card>
    </CustomerAuthShell>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await api.post('/api/v1/auth/password/reset', { token, password }, { plane: 'customer' })
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not reach Guardian. Check your connection and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerAuthShell>
      <Card>
        {done ? (
          <>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
              Password updated
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              You've been signed out everywhere for safety. Sign in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-white no-underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-signal/15 bg-signal-soft text-signal">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-[22px] font-bold tracking-tight text-ink">
              Choose a new password
            </h1>
            <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="reset-password" className="text-xs font-semibold text-ink">
                  New password
                </Label>
                <Input
                  id="reset-password"
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 rounded-xl border-line bg-surface-2 text-sm"
                />
                <p className="font-mono text-[10px] text-ink-soft">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm" className="text-xs font-semibold text-ink">
                  Confirm password
                </Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-9 rounded-xl border-line bg-surface-2 text-sm"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="font-mono text-[10px] text-alert">Passwords do not match.</p>
                )}
              </div>
              <Button
                type="submit"
                variant="signal"
                disabled={
                  isSubmitting || !token || password.length < MIN_PASSWORD_LENGTH || password !== confirm
                }
                className="w-full rounded-xl py-5 text-sm font-semibold"
              >
                {isSubmitting ? 'Updating…' : 'Update password'}
              </Button>
            </form>
            {error && <ErrorNote>{error}</ErrorNote>}
          </>
        )}
      </Card>
    </CustomerAuthShell>
  )
}
