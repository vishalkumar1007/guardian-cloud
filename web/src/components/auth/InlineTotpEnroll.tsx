import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import {
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { api, ApiError, type Plane } from '../../lib/apiClient'
import type { TotpEnrollmentResponse, VerifyEnrollmentResponse } from '../../auth/types'

type Step = 'loading' | 'scan' | 'codes' | 'error'

/**
 * In-place authenticator enrolment for Account / Security settings.
 *
 * Stays on the current page — no redirect to /login/enroll-mfa. Works for both
 * staff and customer planes via the `plane` prop.
 */
export function InlineTotpEnroll({
  plane,
  onComplete,
  onCancel,
}: {
  plane: Plane
  onComplete: (recoveryCodes: string[]) => void
  onCancel: () => void
}) {
  const startPath =
    plane === 'admin' ? '/api/v1/admin/auth/mfa/totp' : '/api/v1/auth/mfa/totp'

  const [step, setStep] = useState<Step>('loading')
  const [enrollment, setEnrollment] = useState<TotpEnrollmentResponse | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    void (async () => {
      try {
        const res = await api.post<TotpEnrollmentResponse>(
          startPath,
          { label: 'Authenticator app' },
          { plane },
        )
        setEnrollment(res)
        setStep('scan')
      } catch {
        setError('Could not start enrolment. Refresh and try again.')
        setStep('error')
      }
    })()
  }, [plane, startPath])

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    if (!enrollment) return

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await api.post<VerifyEnrollmentResponse>(
        `${startPath}/${enrollment.mfa_method_id}/verify`,
        { code: code.trim() },
        { plane },
      )
      setRecoveryCodes(result.recovery_codes)
      setStep('codes')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(
          err.message === 'authentication required'
            ? 'Your session expired. Sign in again and retry.'
            : 'That code is not valid. Check your authenticator and try again.',
        )
      } else {
        setError('Could not complete enrolment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
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
        'Each code works once. Store them somewhere safe.\n\n',
        recoveryCodes.join('\n'),
        '\n',
      ],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guardian-recovery-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22 }}
        className="mt-4 overflow-hidden rounded-2xl border border-signal/20 bg-signal-soft/40"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wide text-signal">
            <ShieldCheck className="h-3.5 w-3.5" />
            {step === 'codes' ? 'Save recovery codes' : 'Enable authenticator'}
          </div>
          {step !== 'codes' && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-surface hover:text-ink"
              aria-label="Cancel enrolment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {step === 'loading' && (
            <p className="py-8 text-center font-mono text-xs tracking-widest text-ink-soft">
              PREPARING ENROLMENT…
            </p>
          )}

          {step === 'error' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
                {error}
              </div>
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl text-xs">
                Close
              </Button>
            </div>
          )}

          {step === 'scan' && enrollment && (
            <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
              <div className="mx-auto flex flex-col items-center gap-2">
                <div className="rounded-2xl border border-line bg-white p-3 shadow-sm">
                  <QRCodeSVG value={enrollment.otpauth_uri} size={168} level="M" />
                </div>
                <p className="font-mono text-[10px] text-ink-soft">Scan with your authenticator app</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">Confirm with a code</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                    Open Google Authenticator, 1Password, or Authy, scan the QR, then enter the
                    6-digit code it shows.
                  </p>
                </div>

                <details className="rounded-xl border border-line bg-surface px-3 py-2">
                  <summary className="cursor-pointer font-mono text-[11px] text-ink-soft">
                    Can&apos;t scan? Enter this key manually
                  </summary>
                  <p className="mt-2 break-all font-mono text-xs leading-relaxed text-ink">
                    {enrollment.secret}
                  </p>
                </details>

                <form onSubmit={onVerify} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inline-enroll-code" className="text-xs font-semibold text-ink">
                      Code from your app
                    </Label>
                    <Input
                      id="inline-enroll-code"
                      required
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="h-11 rounded-xl border-line bg-surface text-center font-mono text-lg tracking-[0.3em] focus-visible:ring-signal/20"
                    />
                  </div>
                  {error && (
                    <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
                      {error}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      variant="signal"
                      disabled={isSubmitting || code.trim().length !== 6}
                      className="rounded-xl text-xs"
                    >
                      {isSubmitting ? (
                        'Verifying…'
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          Confirm <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="rounded-xl border-line text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {step === 'codes' && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-[11px] leading-relaxed text-ink-soft">
                  These codes are shown once. Each works a single time if you lose your authenticator.
                  Store them somewhere safe before continuing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-3 sm:grid-cols-3">
                {recoveryCodes.map((c) => (
                  <code key={c} className="font-mono text-xs tracking-wide text-ink">
                    {c}
                  </code>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyCodes}
                  className="rounded-xl border-line text-xs"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCodes}
                  className="rounded-xl border-line text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button
                  type="button"
                  variant="signal"
                  onClick={() => onComplete(recoveryCodes)}
                  className="rounded-xl text-xs"
                >
                  I&apos;ve saved them
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
