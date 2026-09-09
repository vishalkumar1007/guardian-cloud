import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Shield, Terminal, Building2, Activity, Cpu, UserPlus, KeyRound } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { GuardianMark } from '../../components/GuardianMark'
import { useAuth } from '../../auth/AuthProvider'
import { ApiError, api } from '../../lib/apiClient'

const MIN_PASSWORD_LENGTH = 10

export function SuperSetupPage() {
  const navigate = useNavigate()
  const { setupRequired, refreshSetupStatus } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!setupRequired) return <Navigate to="/super/login" replace />

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = email.includes('@') && password.length >= MIN_PASSWORD_LENGTH && password === confirm

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true); setError(null)
    try {
      await api.post('/api/v1/admin/auth/setup', { email: email.trim(), display_name: displayName.trim(), password })
      await refreshSetupStatus()
      navigate('/super/login', { replace: true, state: { justSetUp: true } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) { await refreshSetupStatus(); navigate('/super/login', { replace: true }); return }
      setError(err instanceof ApiError ? err.message : 'Could not reach the Guardian API. Check your connection and try again.')
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-mist grid lg:grid-cols-[1.08fr_0.92fr]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-mist" />
        <div className="absolute inset-0 opacity-100" style={{ background: 'radial-gradient(860px 420px at 18% -4%, color-mix(in srgb, var(--g-signal) 15%, transparent), transparent 68%), radial-gradient(680px 420px at 88% 12%, color-mix(in srgb, var(--g-accent-2) 13%, transparent), transparent 64%), radial-gradient(520px 360px at 70% 88%, color-mix(in srgb, var(--g-signal) 7%, transparent), transparent 62%)' }} />
        <div className="absolute inset-0 opacity-[0.45]" style={{ backgroundImage: 'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 92% 78% at 50% 6%, black 24%, transparent 76%)', WebkitMaskImage: 'radial-gradient(ellipse 92% 78% at 50% 6%, black 24%, transparent 76%)' }} />
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)', backgroundSize: '160px 160px', maskImage: 'radial-gradient(ellipse 88% 70% at 50% 10%, black 18%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 88% 70% at 50% 10%, black 18%, transparent 70%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[color-mix(in_srgb,var(--g-mist-deep)_40%,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--g-line)] to-transparent" />
      </div>

      <div className="relative z-10 hidden lg:flex h-[100dvh] flex-col justify-between overflow-hidden p-8 xl:p-10 border-r border-line">
        <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-white shadow-sm"><GuardianMark className="h-5 w-5" /></span>
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">Guardian</span>
          <span className="ml-1 hidden xl:inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest text-signal">CONTROL PLANE</span>
        </Link>
        <div className="max-w-[420px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-ink-soft"><Terminal className="h-3 w-3 text-signal" /> First-run setup · one-time</span>
          <h1 className="mt-4 font-display text-[34px] font-bold leading-[0.95] tracking-tight text-ink xl:text-[38px]">Create your<br /><span className="font-light text-ink-soft">super admin.</span></h1>
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">This instance has no administrator yet. Create the first account to take ownership of the control plane. Closes permanently after.</p>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[{ k: 'Tenants', v: '128', icon: Building2 }, { k: 'Uptime', v: '99.95%', icon: Activity }, { k: 'Agents', v: '4.2k', icon: Cpu }].map((s) => (
              <div key={s.k} className="rounded-2xl border border-line bg-surface px-3 py-3 shadow-sm">
                <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-soft">{s.k}<s.icon className="h-3 w-3 text-signal" /></span>
                <p className="mt-1 font-display text-[17px] font-bold text-ink">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-signal/15 bg-signal-soft px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-signal" />
            <p className="font-mono text-[11px] leading-relaxed text-ink-soft">You can enable 2FA any time under Account security after signing in.</p>
          </div>
        </div>
        <p className="inline-flex items-center gap-2 font-mono text-[11px] text-ink-soft"><Shield className="h-3.5 w-3.5 text-signal" /> Isolated control plane · tenant-free from day one</p>
      </div>

      <div className="relative z-10 flex h-[100dvh] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end px-6 py-3 sm:px-8">
          <Link to="/super/login" className="font-mono text-xs text-ink-soft hover:text-ink no-underline">Already have an account? Sign in →</Link>
        </div>

        <div className="flex flex-1 min-h-0 items-center justify-center px-6 py-2 sm:px-8 overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[400px] max-h-full overflow-y-auto scrollbar-none">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white lg:hidden shadow-sm"><GuardianMark className="h-4 w-4" /></span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-signal"><UserPlus className="h-3 w-3" /> First-run setup</span>
              <span className="ml-auto hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft"><KeyRound className="h-3.5 w-3.5" /></span>
            </div>
            <h2 className="mt-4 font-display text-[26px] font-bold tracking-tight text-ink">Create your super admin</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">No admin exists yet. This creates the owner of the control plane.</p>

            <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="setup-email" className="text-xs font-semibold text-ink">Work email</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="setup-email" type="email" required autoFocus autoComplete="username" placeholder="you@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl border-line bg-surface-2 pl-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-name" className="text-xs font-semibold text-ink">Display name <span className="font-normal text-ink-soft">(optional)</span></Label>
                <Input id="setup-name" autoComplete="name" placeholder="Alex Vance" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 rounded-xl border-line bg-surface-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="setup-password" className="text-xs font-semibold text-ink">Password</Label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-soft hover:text-ink">{showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="setup-password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl border-line bg-surface-2 pl-9 text-sm" />
                </div>
                <p className={`font-mono text-[11px] ${passwordTooShort ? 'text-alert font-medium' : 'text-ink-soft'}`}>At least {MIN_PASSWORD_LENGTH} chars. Common passwords are rejected.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-confirm" className="text-xs font-semibold text-ink">Confirm password</Label>
                <Input id="setup-confirm" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10 rounded-xl border-line bg-surface-2 text-sm" />
                {mismatch && <p className="font-mono text-[11px] font-medium text-alert">Passwords do not match.</p>}
              </div>
              <Button type="submit" variant="signal" disabled={isSubmitting || !canSubmit} className="w-full rounded-xl py-5 text-sm font-bold shadow-sm">{isSubmitting ? 'Creating account…' : <span className="inline-flex items-center gap-2">Create super admin <ArrowRight className="h-4 w-4" /></span>}</Button>
            </form>

            {error && <div className="mt-3 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">{error}</div>}

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-signal shrink-0" />
              <p className="font-mono text-[11px] leading-relaxed text-ink-soft"><b className="text-ink">What happens next:</b> You’ll sign in to the control plane. Two-factor authentication is optional and recommended under Account security. This page closes permanently.</p>
            </div>
            <p className="mt-3 text-center font-mono text-[11px] text-ink-soft">Protected by Guardian IAM · <Link to="/super/login" className="underline decoration-line underline-offset-2 hover:text-ink">Back to sign in</Link></p>
          </motion.div>
        </div>
        <div className="shrink-0 pb-3 text-center font-mono text-[10px] text-ink-soft/60">© {new Date().getFullYear()} Guardian · One-time setup · HSM-backed</div>
      </div>
    </div>
  )
}
