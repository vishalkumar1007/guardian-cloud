import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, ArrowRight, Copy, Check, Download, AlertTriangle, Smartphone, LifeBuoy } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { GuardianMark } from '../../components/GuardianMark'
import { useAuth } from '../../auth/AuthProvider'
import { ApiError, api } from '../../lib/apiClient'
import type { TotpEnrollmentResponse, VerifyEnrollmentResponse } from '../../auth/types'

/**
 * Two-factor screens for the customer plane.
 *
 * Structurally the same flows as the staff console, but pointed at
 * /api/v1/auth/* and landing in /app. Kept separate rather than shared because
 * the two planes are deliberately independent — a change to staff MFA should
 * never silently alter what customers see.
 */

function MfaShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-mist px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(760px 380px at 20% -6%, color-mix(in srgb, var(--g-signal) 14%, transparent), transparent 66%)',
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
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="rounded-[20px] border border-line bg-surface p-6 shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:p-7">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

type Factor = 'TOTP' | 'EMAIL' | 'RECOVERY_CODE'

/** The second step of signing in, when a factor is already enrolled. */
export function CustomerMfaChallengePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyMfa, user } = useAuth()

  const state = location.state as { methods?: string[]; returnTo?: string } | null
  const returnTo = state?.returnTo ?? '/app'
  const available = (state?.methods ?? ['TOTP']) as Factor[]

  const [factor, setFactor] = useState<Factor>(available[0] ?? 'TOTP')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate(returnTo, { replace: true })
  }, [user, navigate, returnTo])

  const isRecovery = factor === 'RECOVERY_CODE'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await verifyMfa(code.trim(), factor)
      if (result.status === 'authenticated') navigate(returnTo, { replace: true })
      else setError('Verification did not complete. Please sign in again.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        navigate('/login', { replace: true })
        return
      }
      setError(
        err instanceof ApiError && err.status === 423
          ? 'Too many incorrect codes. Please sign in again.'
          : 'That code is not valid. Check it and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MfaShell>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-signal">
        <ShieldCheck className="h-3 w-3" /> Two-factor
      </span>
      <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-ink">
        Verify it's you
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
        {isRecovery
          ? 'Enter one of the recovery codes you saved.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="customer-mfa-code" className="text-xs font-semibold text-ink">
            {isRecovery ? 'Recovery code' : 'Verification code'}
          </Label>
          <Input
            id="customer-mfa-code"
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={isRecovery ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
            inputMode={isRecovery ? 'text' : 'numeric'}
            autoComplete={isRecovery ? 'off' : 'one-time-code'}
            maxLength={isRecovery ? 24 : 6}
            className="h-11 rounded-xl border-line bg-surface-2 text-center font-mono text-lg tracking-[0.3em]"
          />
        </div>
        <Button
          type="submit"
          variant="signal"
          disabled={isSubmitting || code.trim().length < 6}
          className="w-full rounded-xl py-5 text-sm font-semibold"
        >
          {isSubmitting ? 'Verifying…' : (
            <span className="inline-flex items-center gap-2">
              Verify <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-3 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setFactor(isRecovery ? 'TOTP' : 'RECOVERY_CODE')
          setCode('')
          setError(null)
        }}
        className="mt-4 w-full justify-start rounded-xl border-line bg-surface-2 text-xs font-semibold"
      >
        {isRecovery ? <Smartphone className="h-3.5 w-3.5" /> : <LifeBuoy className="h-3.5 w-3.5" />}
        {isRecovery ? 'Use your authenticator app' : 'Use a recovery code instead'}
      </Button>

      <button
        type="button"
        onClick={() => navigate('/login', { replace: true })}
        className="mt-3 w-full text-center font-mono text-[11px] text-ink-soft hover:text-ink"
      >
        ← Back to sign in
      </button>
    </MfaShell>
  )
}

/** Enrolment, reachable from account settings or forced mid-login by policy. */
export function CustomerMfaEnrollPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/app'

  const [enrollment, setEnrollment] = useState<TotpEnrollmentResponse | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Starting enrolment creates a row, so it must happen exactly once. React
  // invokes effects twice in StrictMode, which would otherwise leave an orphan
  // unverified method behind on every visit.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    // Deliberately no per-run cancellation flag: StrictMode invokes this twice,
    // and the first run's cleanup would discard the only response the guard
    // above allows, leaving the page stuck on its loading state.
    void (async () => {
      try {
        setEnrollment(
          await api.post<TotpEnrollmentResponse>(
            '/api/v1/auth/mfa/totp',
            { label: 'Authenticator app' },
            { plane: 'customer', suppressUnauthorized: true },
          ),
        )
      } catch {
        setError('Could not start setup. Please sign in again.')
      }
    })()
  }, [])

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    if (!enrollment) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await api.post<VerifyEnrollmentResponse>(
        `/api/v1/auth/mfa/totp/${enrollment.mfa_method_id}/verify`,
        { code: code.trim() },
        { plane: 'customer', suppressUnauthorized: true },
      )
      setRecoveryCodes(result.recovery_codes)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(
          err.message === 'authentication required'
            ? 'This sign-in step expired. Please sign in again.'
            : 'That code is not valid. Check your authenticator and try again.',
        )
      } else {
        setError('Could not complete setup. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (recoveryCodes) {
    return (
      <MfaShell>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
          Save your recovery codes
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          These are the only way in if you lose your authenticator. Each one works once.
        </p>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-ink-soft">
            This is the only time these are shown. Store them somewhere safe before continuing.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-2 p-3">
          {recoveryCodes.map((recoveryCode) => (
            <code key={recoveryCode} className="font-mono text-[12px] text-ink">
              {recoveryCode}
            </code>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(recoveryCodes.join('\n'))
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            }}
            className="rounded-xl border-line text-xs font-semibold"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const blob = new Blob(
                ['Guardian recovery codes\n\n', recoveryCodes.join('\n'), '\n'],
                { type: 'text/plain' },
              )
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'guardian-recovery-codes.txt'
              link.click()
              URL.revokeObjectURL(url)
            }}
            className="rounded-xl border-line text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>

        <Button
          type="button"
          variant="signal"
          onClick={async () => {
            await refresh()
            navigate(returnTo, { replace: true })
          }}
          className="mt-3 w-full rounded-xl py-5 text-sm font-semibold"
        >
          <span className="inline-flex items-center gap-2">
            I've saved them, continue <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </MfaShell>
    )
  }

  return (
    <MfaShell>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-signal">
        <ShieldCheck className="h-3 w-3" /> Set up two-factor
      </span>
      <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight text-ink">
        Protect your account
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
        Scan this with an authenticator app, then enter the code it shows.
      </p>

      {enrollment ? (
        <>
          <div className="mt-5 flex justify-center rounded-2xl border border-line bg-white p-4">
            <QRCodeSVG value={enrollment.otpauth_uri} size={168} level="M" />
          </div>

          <details className="mt-3 rounded-xl border border-line bg-surface-2 px-3 py-2">
            <summary className="cursor-pointer font-mono text-[11px] text-ink-soft">
              Can't scan? Enter this key manually
            </summary>
            <p className="mt-2 break-all font-mono text-[12px] leading-relaxed text-ink">
              {enrollment.secret}
            </p>
          </details>

          <form onSubmit={onVerify} className="mt-4 space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="customer-enroll-code" className="text-xs font-semibold text-ink">
                Code from your app
              </Label>
              <Input
                id="customer-enroll-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="h-11 rounded-xl border-line bg-surface-2 text-center font-mono text-lg tracking-[0.3em]"
              />
            </div>
            <Button
              type="submit"
              variant="signal"
              disabled={isSubmitting || code.trim().length !== 6}
              className="w-full rounded-xl py-5 text-sm font-semibold"
            >
              {isSubmitting ? 'Verifying…' : (
                <span className="inline-flex items-center gap-2">
                  Confirm <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </>
      ) : (
        <p className="py-8 text-center font-mono text-xs tracking-widest text-ink-soft">
          PREPARING SETUP…
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
          {error}
        </div>
      )}
    </MfaShell>
  )
}
