import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { KeyRound, ShieldCheck, ArrowRight, Smartphone, Mail, LifeBuoy } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuth } from '../../auth/AuthProvider'
import { ApiError } from '../../lib/apiClient'
import { AuthShell } from './AuthShell'

type Factor = 'TOTP' | 'EMAIL' | 'RECOVERY_CODE'

const FACTOR_COPY: Record<Factor, { label: string; hint: string; icon: typeof Smartphone }> = {
  TOTP: {
    label: 'Authenticator app',
    hint: 'Enter the 6-digit code from your authenticator app.',
    icon: Smartphone,
  },
  EMAIL: {
    label: 'Email code',
    hint: 'Enter the 6-digit code we sent to your email address.',
    icon: Mail,
  },
  RECOVERY_CODE: {
    label: 'Recovery code',
    hint: 'Enter one of the recovery codes you saved when you set up two-factor.',
    icon: LifeBuoy,
  },
}

/**
 * The second step of signing in.
 *
 * Reached only when the password succeeded and a challenge was issued. There is
 * no session yet — the challenge lives in its own short-lived cookie, so a
 * reload lands back here rather than anywhere authenticated.
 */
export function SuperMfaChallengePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyMfa, user } = useAuth()

  const state = location.state as { methods?: string[]; returnTo?: string } | null
  const available = (state?.methods ?? ['TOTP']) as Factor[]
  const returnTo = state?.returnTo ?? '/admin'

  const [factor, setFactor] = useState<Factor>(available[0] ?? 'TOTP')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Someone who lands here already signed in has nothing to do.
  useEffect(() => {
    if (user) navigate(returnTo, { replace: true })
  }, [user, navigate, returnTo])

  // Recovery codes are always offered: the whole point is that they work when
  // the enrolled factor is unavailable, so the server never advertises them.
  const factors: Factor[] = Array.from(new Set<Factor>([...available, 'RECOVERY_CODE']))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await verifyMfa(code.trim(), factor)
      if (result.status === 'authenticated') {
        navigate(returnTo, { replace: true })
      } else {
        setError('Verification did not complete. Please sign in again.')
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        // The challenge expired or was already used; there is nothing to retry.
        navigate('/super/login', {
          replace: true,
          state: { expiredChallenge: true },
        })
        return
      }
      if (err instanceof ApiError && err.status === 423) {
        setError('Too many incorrect codes. Please sign in again.')
      } else {
        setError('That code is not valid. Check the code and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const copy = FACTOR_COPY[factor]
  const isRecovery = factor === 'RECOVERY_CODE'

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="rounded-[20px] border border-line bg-surface p-6 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-signal">
                <ShieldCheck className="h-3 w-3" /> Two-factor
              </div>
              <h2 className="mt-3 font-display text-[22px] font-bold tracking-tight text-ink">
                Verify it's you
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{copy.hint}</p>
            </div>
            <span className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-soft">
              <KeyRound className="h-4 w-4" />
            </span>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="mfa-code" className="text-xs font-semibold text-ink">
                {isRecovery ? 'Recovery code' : 'Verification code'}
              </Label>
              <Input
                id="mfa-code"
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={isRecovery ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
                inputMode={isRecovery ? 'text' : 'numeric'}
                // One-time-code autocomplete lets the browser and iOS offer the
                // code straight from the SMS/authenticator.
                autoComplete={isRecovery ? 'off' : 'one-time-code'}
                maxLength={isRecovery ? 24 : 6}
                className="h-11 rounded-xl border-line bg-surface-2 text-center font-mono text-lg tracking-[0.3em] focus-visible:ring-signal/20"
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

          {factors.length > 1 && (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">
                  or use
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid gap-2">
                {factors
                  .filter((candidate) => candidate !== factor)
                  .map((candidate) => {
                    const Icon = FACTOR_COPY[candidate].icon
                    return (
                      <Button
                        key={candidate}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFactor(candidate)
                          setCode('')
                          setError(null)
                        }}
                        className="justify-start rounded-xl border-line bg-surface-2 font-mono text-xs font-semibold hover:bg-surface"
                      >
                        <Icon className="h-3.5 w-3.5 text-ink-soft" /> {FACTOR_COPY[candidate].label}
                      </Button>
                    )
                  })}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => navigate('/super/login', { replace: true })}
            className="mt-4 w-full text-center font-mono text-[11px] text-ink-soft transition-colors hover:text-ink"
          >
            ← Back to sign in
          </button>
        </div>
      </motion.div>
    </AuthShell>
  )
}
