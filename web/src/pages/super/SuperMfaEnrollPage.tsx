import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { ShieldCheck, ArrowRight, Copy, Check, Download, AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuth } from '../../auth/AuthProvider'
import { api, ApiError } from '../../lib/apiClient'
import type { TotpEnrollmentResponse, VerifyEnrollmentResponse } from '../../auth/types'
import { AuthShell } from './AuthShell'

type Step = 'enroll' | 'codes'

/**
 * Two-factor enrolment.
 *
 * Reached either from account settings, or mid-login when policy requires a
 * second factor and the account has none. In the second case there is no session
 * yet — the enrolment challenge cookie stands in for one, and completing this
 * flow is what finally issues the session.
 */
export function SuperMfaEnrollPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/admin'

  const [step, setStep] = useState<Step>('enroll')
  const [enrollment, setEnrollment] = useState<TotpEnrollmentResponse | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const startedRef = useRef(false)

  useEffect(() => {
    // Guarded rather than cancelled on cleanup. Starting enrolment creates a
    // row, so it must happen exactly once — but React's StrictMode double
    // invocation means a per-run "cancelled" flag would be set by the first
    // run's cleanup and then throw away the only response we asked for,
    // leaving the page stuck on its loading state forever.
    if (startedRef.current) return
    startedRef.current = true

    void (async () => {
      try {
        setEnrollment(
          await api.post<TotpEnrollmentResponse>(
            '/api/v1/admin/auth/mfa/totp',
            { label: 'Authenticator app' },
            { plane: 'admin', suppressUnauthorized: true },
          ),
        )
      } catch {
        setError('Could not start enrolment. Please sign in again.')
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
        `/api/v1/admin/auth/mfa/totp/${enrollment.mfa_method_id}/verify`,
        { code: code.trim() },
        { plane: 'admin', suppressUnauthorized: true },
      )
      setRecoveryCodes(result.recovery_codes)
      // Shown before continuing: these are the only copy the user will ever get.
      setStep('codes')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(
          err.message === 'authentication required'
            ? 'This sign-in step expired. Please sign in again.'
            : 'That code is not valid. Check your authenticator and try again.',
        )
      } else {
        setError('Could not complete enrolment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onFinish() {
    // Verification may have issued the session (mid-login enrolment), so pick it
    // up before navigating into the console.
    await refresh()
    navigate(returnTo, { replace: true })
  }

  function copyCodes() {
    void navigator.clipboard.writeText(recoveryCodes.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  function downloadCodes() {
    const blob = new Blob(
      [
        'Guardian recovery codes\n',
        'Each code works once. Store them somewhere safe and offline.\n\n',
        recoveryCodes.join('\n'),
        '\n',
      ],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'guardian-recovery-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="rounded-[20px] border border-line bg-surface p-6 shadow-sm sm:p-7">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-signal">
            <ShieldCheck className="h-3 w-3" /> Set up two-factor
          </div>

          {step !== 'codes' && (
            <>
              <h2 className="mt-3 font-display text-[22px] font-bold tracking-tight text-ink">
                Protect your account
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                Scan this with an authenticator app, then enter the code it shows. You can remove
                two-factor authentication later from Account security unless policy requires it.
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

                  <form onSubmit={onVerify} className="mt-4 space-y-3.5 text-left">
                    <div className="space-y-1.5">
                      <Label htmlFor="enroll-code" className="text-xs font-semibold text-ink">
                        Code from your app
                      </Label>
                      <Input
                        id="enroll-code"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="000000"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        className="h-11 rounded-xl border-line bg-surface-2 text-center font-mono text-lg tracking-[0.3em] focus-visible:ring-signal/20"
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
                <div className="mt-6 flex justify-center py-8 font-mono text-xs tracking-widest text-ink-soft">
                  PREPARING ENROLMENT…
                </div>
              )}
            </>
          )}

          {step === 'codes' && (
            <>
              <h2 className="mt-3 font-display text-[22px] font-bold tracking-tight text-ink">
                Save your recovery codes
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                These are the only way in if you lose your authenticator. Each one works once.
              </p>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-[11px] leading-relaxed text-ink-soft">
                  This is the only time these codes are shown. Store them somewhere safe before
                  continuing.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-2 p-3">
                {recoveryCodes.map((recoveryCode) => (
                  <code key={recoveryCode} className="font-mono text-[12px] tracking-wide text-ink">
                    {recoveryCode}
                  </code>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyCodes}
                  className="rounded-xl border-line bg-surface-2 font-mono text-xs font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCodes}
                  className="rounded-xl border-line bg-surface-2 font-mono text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>

              <Button
                type="button"
                variant="signal"
                onClick={onFinish}
                className="mt-3 w-full rounded-xl py-5 text-sm font-semibold"
              >
                <span className="inline-flex items-center gap-2">
                  I've saved them, continue <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </AuthShell>
  )
}
