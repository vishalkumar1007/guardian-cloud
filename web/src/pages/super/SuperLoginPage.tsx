import { useState, type FormEvent, useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Activity, Shield, Terminal, Building2, Cpu, Smartphone, Mail, LifeBuoy, Copy, Check, Download, AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { GuardianMark } from '../../components/GuardianMark'
import { useAuth } from '../../auth/AuthProvider'
import { ApiError, api } from '../../lib/apiClient'
import { AuthBoundary } from '../../auth/AuthBoundary'
import type { TotpEnrollmentResponse, VerifyEnrollmentResponse } from '../../auth/types'

const ENDED_MESSAGE: Record<string, string> = {
  idle_timeout: 'You were signed out after a period of inactivity.',
  expired: 'Your session expired. Please sign in again.',
  account_disabled: 'This account is no longer permitted to sign in.',
}

type Factor = 'TOTP' | 'EMAIL' | 'RECOVERY_CODE'
const FACTOR_COPY: Record<Factor, { label: string; hint: string; icon: typeof Smartphone }> = {
  TOTP: { label: 'Authenticator app', hint: 'Enter the 6-digit code from your authenticator app.', icon: Smartphone },
  EMAIL: { label: 'Email code', hint: 'Enter the 6-digit code we sent to your email.', icon: Mail },
  RECOVERY_CODE: { label: 'Recovery code', hint: 'Enter one of your one-time recovery codes.', icon: LifeBuoy },
}

export function SuperLoginPage() {
  return (
    <AuthBoundary>
      <SuperLoginForm />
    </AuthBoundary>
  )
}

function SuperLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setupRequired, login, verifyMfa, endedReason, clearEndedReason, refresh } = useAuth()
  const [email, setEmail] = useState('superadmin@guardian.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null)
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/admin'

  const [mfaMethods, setMfaMethods] = useState<Factor[] | null>(null)
  const [mfaFactor, setMfaFactor] = useState<Factor>('TOTP')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [enrollRequired, setEnrollRequired] = useState(false)
  const [enrollment, setEnrollment] = useState<TotpEnrollmentResponse | null>(null)
  const [enrollCode, setEnrollCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [copied, setCopied] = useState(false)
  const enrollStartedRef = useRef(false)

  useEffect(() => { if (user) navigate(returnTo, { replace: true }) }, [user, navigate, returnTo])
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return
    const t = window.setInterval(() => setLockoutSeconds((c) => (c === null || c <= 1 ? null : c - 1)), 1000)
    return () => window.clearInterval(t)
  }, [lockoutSeconds])

  useEffect(() => {
    if (!enrollRequired || enrollStartedRef.current) return
    enrollStartedRef.current = true
    void (async () => {
      try {
        const res = await api.post<TotpEnrollmentResponse>('/api/v1/admin/auth/mfa/totp', { label: 'Authenticator app' }, { plane: 'admin', suppressUnauthorized: true })
        setEnrollment(res)
      } catch { setEnrollError('Could not start enrolment. Please sign in again.') }
    })()
  }, [enrollRequired])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Please enter a valid work email.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setIsSubmitting(true); setError(null); clearEndedReason()
    try {
      const r = await login(email.trim(), password)
      if (r.status === 'authenticated') navigate(returnTo, { replace: true })
      else if (r.status === 'mfa_required') {
        const methods = ((r.methods ?? ['TOTP']) as Factor[])
        const withRecovery = Array.from(new Set<Factor>([...methods, 'RECOVERY_CODE']))
        setMfaMethods(withRecovery)
        setMfaFactor(methods[0] as Factor ?? 'TOTP')
        setMfaCode(''); setMfaError(null)
      } else if (r.status === 'mfa_enrollment_required') {
        setEnrollRequired(true)
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) { setLockoutSeconds(err.retryAfterSeconds ?? 60); setError('Too many failed attempts. Please wait.') }
      else if (err instanceof ApiError && err.status === 403) setError(err.message)
      else if (err instanceof ApiError) setError('Invalid email or password.')
      else setError('Could not reach Guardian API.')
    } finally { setIsSubmitting(false) }
  }

  async function onVerifyMfa(e: FormEvent) {
    e.preventDefault()
    setIsVerifying(true); setMfaError(null)
    try {
      const r = await verifyMfa(mfaCode.trim(), mfaFactor)
      if (r.status === 'authenticated') navigate(returnTo, { replace: true })
      else setMfaError('Verification did not complete. Please sign in again.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) { setMfaMethods(null); setError('Challenge expired. Please sign in again.'); return }
      if (err instanceof ApiError && err.status === 423) setMfaError('Too many incorrect codes. Please sign in again.')
      else setMfaError('That code is not valid. Check the code and try again.')
    } finally { setIsVerifying(false) }
  }

  async function onEnrollVerify(e: FormEvent) {
    e.preventDefault()
    if (!enrollment) return
    setIsEnrolling(true); setEnrollError(null)
    try {
      const res = await api.post<VerifyEnrollmentResponse>(`/api/v1/admin/auth/mfa/totp/${enrollment.mfa_method_id}/verify`, { code: enrollCode.trim() }, { plane: 'admin', suppressUnauthorized: true })
      setRecoveryCodes(res.recovery_codes)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setEnrollError(
          err.message === 'authentication required'
            ? 'This sign-in step expired. Please sign in again.'
            : 'That code is not valid. Check your authenticator and try again.',
        )
      } else {
        setEnrollError('Could not complete enrolment. Please try again.')
      }
    } finally { setIsEnrolling(false) }
  }

  async function onEnrollFinish() {
    await refresh()
    navigate(returnTo, { replace: true })
  }

  function resetToLogin() {
    setMfaMethods(null); setMfaCode(''); setMfaError(null)
    setEnrollRequired(false); setEnrollment(null); setEnrollCode(''); setRecoveryCodes([]); setEnrollError(null); enrollStartedRef.current = false
    setError(null)
  }

  if (setupRequired) return <Navigate to="/super/setup" replace />

  const endedMessage = endedReason ? ENDED_MESSAGE[endedReason] : null
  const isLockedOut = lockoutSeconds !== null && lockoutSeconds > 0
  const showMfa = mfaMethods !== null
  const showEnroll = enrollRequired
  const showLogin = !showMfa && !showEnroll
  const recoveryCodesReady = recoveryCodes.length > 0

  const mfaCopy = FACTOR_COPY[mfaFactor]
  const isRecovery = mfaFactor === 'RECOVERY_CODE'

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-mist grid lg:grid-cols-[1.08fr_0.92fr]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-mist" />
        <div className="absolute inset-0 opacity-100" style={{ background: 'radial-gradient(860px 420px at 18% -4%, color-mix(in srgb, var(--g-signal) 16%, transparent), transparent 68%), radial-gradient(680px 420px at 88% 12%, color-mix(in srgb, var(--g-accent-2) 14%, transparent), transparent 64%), radial-gradient(520px 360px at 70% 88%, color-mix(in srgb, var(--g-signal) 8%, transparent), transparent 62%)' }} />
        <div className="absolute inset-0 opacity-[0.45]" style={{ backgroundImage: 'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 92% 78% at 50% 6%, black 24%, transparent 76%)', WebkitMaskImage: 'radial-gradient(ellipse 92% 78% at 50% 6%, black 24%, transparent 76%)' }} />
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)', backgroundSize: '160px 160px', maskImage: 'radial-gradient(ellipse 88% 70% at 50% 10%, black 18%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 88% 70% at 50% 10%, black 18%, transparent 70%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[color-mix(in_srgb,var(--g-mist-deep)_40%,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--g-line)] to-transparent" />
      </div>

      <div className="relative z-10 hidden lg:flex h-[100dvh] flex-col justify-between overflow-hidden p-8 xl:p-10 border-r border-line">
        <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-white shadow-sm"><GuardianMark className="h-5 w-5" /></span>
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">Guardian</span>
          <span className="ml-1 hidden xl:inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest text-ink-soft">CONTROL PLANE</span>
        </Link>
        <div className="max-w-[420px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-ink-soft"><Terminal className="h-3 w-3 text-signal" /> Isolated · tenant-free</span>
          <h1 className="mt-4 font-display text-[34px] font-bold leading-[0.95] tracking-tight text-ink xl:text-[38px]">The control plane<br /><span className="font-light text-ink-soft">for device trust.</span></h1>
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">Manage tenants, health, billing and security policy — one isolated console.</p>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[{ k: 'Tenants', v: '128', icon: Building2 }, { k: 'Uptime', v: '99.95%', icon: Activity }, { k: 'Agents', v: '4.2k', icon: Cpu }].map((s) => (
              <div key={s.k} className="rounded-2xl border border-line bg-surface px-3 py-3 shadow-sm">
                <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-soft">{s.k}<s.icon className="h-3 w-3 text-signal" /></span>
                <p className="mt-1 font-display text-[17px] font-bold text-ink">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="inline-flex items-center gap-2 font-mono text-[11px] text-ink-soft"><ShieldCheck className="h-3.5 w-3.5 text-signal" /> Platform administration is separate from customer tenants</p>
      </div>

      <div className="relative z-10 flex h-[100dvh] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end px-6 py-3 sm:px-8">
          <Link to="/" className="font-mono text-xs text-ink-soft hover:text-ink no-underline">← Back to home</Link>
        </div>

        <div className="flex flex-1 min-h-0 items-center justify-center px-6 py-2 sm:px-8 overflow-hidden">
          <div className="w-full max-w-[400px] max-h-full overflow-y-auto scrollbar-none">
            <AnimatePresence mode="wait">
              {showLogin && (
                <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white lg:hidden shadow-sm"><GuardianMark className="h-4 w-4" /></span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-soft"><Shield className="h-3 w-3 text-signal" /> Super Admin</span>
                    <span className="ml-auto hidden sm:inline-flex items-center gap-1 rounded-full bg-signal px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-white">ISOLATED</span>
                  </div>
                  <div>
                    <h2 className="font-display text-[26px] font-bold tracking-tight text-ink">Welcome back</h2>
                    <p className="mt-1 text-[13px] text-ink-soft">Sign in to the super-admin control plane.</p>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-ink">Work email</Label>
                      <div className="relative">
                        <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="superadmin@guardian.local" className="h-10 rounded-xl border-line bg-surface-2 pl-9 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-ink">Password</Label>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="font-mono text-[11px] text-ink-soft hover:text-ink inline-flex items-center gap-1">{showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{showPassword ? 'Hide' : 'Show'}</button>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                        <Input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-xl border-line bg-surface-2 pl-9 pr-9 text-sm" />
                      </div>
                    </div>
                    <Button type="submit" variant="signal" disabled={isSubmitting || isLockedOut} className="w-full rounded-xl py-5 text-sm font-bold shadow-sm">{isSubmitting ? 'Signing in…' : isLockedOut ? `Locked — ${lockoutSeconds}s` : <span className="inline-flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>}</Button>
                  </form>

                  {endedMessage && !error && <div className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-ink-soft">{endedMessage}</div>}
                  {error && <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">{error}</div>}
                  <p className="text-center font-mono text-[11px] text-ink-soft">Protected by Guardian IAM · <Link to="/login" className="text-ink-soft hover:text-ink underline decoration-line underline-offset-2">User login</Link></p>
                </motion.div>
              )}

              {showMfa && (
                <motion.div key="mfa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-signal"><ShieldCheck className="h-3 w-3" /> Two-factor</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-soft">{email}</span>
                  </div>
                  <div>
                    <h2 className="font-display text-[22px] font-bold tracking-tight text-ink">Verify it's you</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{mfaCopy.hint}</p>
                  </div>

                  <form onSubmit={onVerifyMfa} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="mfa-code" className="text-xs font-semibold text-ink">{isRecovery ? 'Recovery code' : 'Verification code'}</Label>
                      <Input
                        id="mfa-code"
                        autoFocus
                        required
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder={isRecovery ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
                        inputMode={isRecovery ? 'text' : 'numeric'}
                        autoComplete={isRecovery ? 'off' : 'one-time-code'}
                        maxLength={isRecovery ? 24 : 6}
                        className="h-11 rounded-xl border-line bg-surface-2 text-center font-mono text-lg tracking-[0.3em] focus-visible:ring-signal/20"
                      />
                    </div>
                    <Button type="submit" variant="signal" disabled={isVerifying || mfaCode.trim().length < 6} className="w-full rounded-xl py-5 text-sm font-bold shadow-sm">
                      {isVerifying ? 'Verifying…' : <span className="inline-flex items-center gap-2">Verify <ArrowRight className="h-4 w-4" /></span>}
                    </Button>
                  </form>

                  {mfaError && <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">{mfaError}</div>}

                  {mfaMethods && mfaMethods.length > 1 && (
                    <>
                      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-line" /><span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">or use</span><span className="h-px flex-1 bg-line" /></div>
                      <div className="grid gap-2">
                        {mfaMethods.filter((c) => c !== mfaFactor).map((candidate) => {
                          const Icon = FACTOR_COPY[candidate].icon
                          return (
                            <button key={candidate} type="button" onClick={() => { setMfaFactor(candidate); setMfaCode(''); setMfaError(null) }} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs font-semibold text-ink hover:bg-surface transition-colors">
                              <Icon className="h-3.5 w-3.5 text-ink-soft" /> {FACTOR_COPY[candidate].label}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}

                  <button type="button" onClick={resetToLogin} className="w-full text-center font-mono text-[11px] text-ink-soft hover:text-ink">← Back to sign in</button>
                </motion.div>
              )}

              {showEnroll && (
                <motion.div key="enroll" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
                  {!recoveryCodesReady ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-signal"><ShieldCheck className="h-3 w-3" /> Set up two-factor</div>
                      <div>
                        <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight text-ink">Protect your account</h2>
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">Scan this with your authenticator app, then enter the code it shows.</p>
                      </div>

                      {enrollment ? (
                        <>
                          <div className="flex justify-center rounded-2xl border border-line bg-white p-4">
                            <QRCodeSVG value={enrollment.otpauth_uri} size={168} level="M" />
                          </div>
                          <details className="rounded-xl border border-line bg-surface-2 px-3 py-2">
                            <summary className="cursor-pointer font-mono text-[11px] text-ink-soft">Can't scan? Enter this key manually</summary>
                            <p className="mt-2 break-all font-mono text-xs leading-relaxed text-ink">{enrollment.secret}</p>
                          </details>
                          <form onSubmit={onEnrollVerify} className="space-y-3.5">
                            <div className="space-y-1.5">
                              <Label htmlFor="enroll-code" className="text-xs font-semibold text-ink">Code from your app</Label>
                              <Input id="enroll-code" required value={enrollCode} onChange={(e) => setEnrollCode(e.target.value)} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="h-11 rounded-xl border-line bg-surface-2 text-center font-mono text-lg tracking-[0.3em] focus-visible:ring-signal/20" />
                            </div>
                            <Button type="submit" variant="signal" disabled={isEnrolling || enrollCode.trim().length !== 6} className="w-full rounded-xl py-5 text-sm font-bold">{isEnrolling ? 'Verifying…' : <span className="inline-flex items-center gap-2">Confirm <ArrowRight className="h-4 w-4" /></span>}</Button>
                          </form>
                        </>
                      ) : (
                        <div className="flex justify-center py-8 font-mono text-xs tracking-widest text-ink-soft">PREPARING ENROLMENT…</div>
                      )}
                      {enrollError && <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">{enrollError}</div>}
                      <button type="button" onClick={resetToLogin} className="w-full text-center font-mono text-[11px] text-ink-soft hover:text-ink">← Back to sign in</button>
                    </>
                  ) : (
                    <>
                      <h2 className="font-display text-[22px] font-bold tracking-tight text-ink">Save your recovery codes</h2>
                      <p className="text-[13px] leading-relaxed text-ink-soft">These are the only way in if you lose your authenticator. Each one works once.</p>
                      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <p className="text-[11px] leading-relaxed text-ink-soft">This is the only time these codes are shown. Store them somewhere safe before continuing.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-2 p-3">
                        {recoveryCodes.map((c) => <code key={c} className="font-mono text-xs tracking-wide text-ink">{c}</code>)}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => { void navigator.clipboard.writeText(recoveryCodes.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="rounded-xl border-line bg-surface-2 font-mono text-xs font-semibold">{copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}</Button>
                        <Button type="button" variant="outline" onClick={() => { const blob = new Blob(['Guardian recovery codes\nEach code works once.\n\n' + recoveryCodes.join('\n') + '\n'], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'guardian-recovery-codes.txt'; a.click(); URL.revokeObjectURL(url) }} className="rounded-xl border-line bg-surface-2 font-mono text-xs font-semibold"><Download className="h-3.5 w-3.5" /> Download</Button>
                      </div>
                      <Button type="button" variant="signal" onClick={onEnrollFinish} className="w-full rounded-xl py-5 text-sm font-bold"><span className="inline-flex items-center gap-2">I've saved them, continue <ArrowRight className="h-4 w-4" /></span></Button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="shrink-0 pb-3 text-center font-mono text-[10px] text-ink-soft/60">© {new Date().getFullYear()} Guardian · TLS 1.3 · HSM-backed</div>
      </div>
    </div>
  )
}
