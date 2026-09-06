import { useState, type FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Activity, Users, Shield } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { GuardianMark } from '../../components/GuardianMark'
import { buildLoginSession } from '../../theme/session'

export function SuperLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('superadmin@guardian.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const existing = localStorage.getItem('super_admin_session')
    if (existing) navigate('/super', { replace: true })
  }, [navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Please enter a valid work email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    setTimeout(() => {
      if (password.length >= 8) {
        localStorage.setItem('super_admin_session', JSON.stringify(buildLoginSession(email, rememberMe)))
        navigate('/super', { replace: true })
      } else {
        setError('Invalid credentials.')
      }
      setIsSubmitting(false)
    }, 600)
  }

  return (
    <div className="relative min-h-[100dvh] w-screen overflow-hidden bg-mist grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden" style={{ background: 'linear-gradient(150deg, var(--g-signal) 0%, color-mix(in srgb, var(--g-signal) 85%, #8b5cf6) 100%)' }}>
        <div className="pointer-events-none absolute -left-24 -top-24 h-[460px] w-[460px] rounded-full bg-white/[0.10]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[280px] w-[280px] rounded-full bg-white/[0.08]" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[var(--g-signal)] shadow-sm">
              <GuardianMark className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-white">Guardian</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white">Control Plane</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-[420px]">
          <h1 className="font-display text-[34px] font-bold leading-[1.12] tracking-tight text-white xl:text-[38px]">
            The control plane
            <br />
            <span className="font-light text-white/90">for device trust.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80">Manage tenants, platform health, billing and security policy from one isolated super-admin console.</p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-3 border border-white/15">
              <p className="font-display text-lg font-bold leading-none text-white">128</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-mist/70">Tenants</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-3 border border-white/15">
              <p className="font-display text-lg font-bold leading-none text-white">99.95%</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-mist/70">Uptime</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-3 border border-white/15">
              <p className="font-display text-lg font-bold leading-none text-white">4.2k</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-mist/70">Agents</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white border border-white/15"><Activity className="h-3 w-3" /> Live telemetry</span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white border border-white/15"><Shield className="h-3 w-3" /> Zero-trust</span>
          </div>

          <div className="mt-8 rounded-xl bg-white/[0.07] border border-white/15 p-3 backdrop-blur">
            <p className="font-mono text-[11px] leading-relaxed text-white/80">“Guardian’s isolated control plane finally gives us tenant-free super-admin — no customer Tenant can escalate.”</p>
            <p className="mt-2 font-mono text-[10px] font-semibold tracking-wide text-mist/70">— Platform Security, Guardian</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 font-mono text-[11px] text-mist/60">
          <ShieldCheck className="h-3.5 w-3.5" /> Platform administration is separate from customer tenants
        </div>
      </div>

      <div className="relative flex min-h-[100dvh] flex-col bg-surface lg:bg-mist">
        <div className="flex items-center justify-between px-6 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2 lg:hidden no-underline">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal text-mist-deep"><GuardianMark className="h-4 w-4" /></span>
            <span className="font-display text-sm font-bold text-ink">Guardian</span>
          </Link>
          <Link to="/" className="ml-auto font-mono text-xs text-ink-soft hover:text-ink no-underline">← Back to home</Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[380px] space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[11px] font-medium text-signal">
                <Shield className="h-3 w-3" /> Super Admin
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">Welcome back</h2>
              <p className="mt-1 text-sm text-ink-soft">Sign in to the super-admin control plane.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="super-email" className="text-xs font-medium text-ink">Work email</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="super-email" type="email" required autoComplete="email" placeholder="superadmin@guardian.local" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl pl-9 text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="super-password" className="text-xs font-medium text-ink">Password</Label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-soft hover:text-ink">
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="super-password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="current-password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl pl-9 pr-9 text-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-ink-soft">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-3.5 w-3.5 rounded border-line accent-signal" />
                  <span>Remember this device</span>
                </label>
                <span className="font-mono text-[11px] text-ink-soft">Argon2id</span>
              </div>

              <Button type="submit" variant="signal" disabled={isSubmitting} className="w-full rounded-xl py-5 text-sm font-semibold shadow-sm">
                {isSubmitting ? 'Signing in…' : <span className="inline-flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </form>

            {error && <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs text-alert">{error}</div>}

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="rounded-xl font-mono text-xs"><Users className="h-3.5 w-3.5 text-ink-soft" /> SSO/SAML</Button>
              <Button type="button" variant="outline" className="rounded-xl font-mono text-xs"><ShieldCheck className="h-3.5 w-3.5 text-signal" /> Passkey</Button>
            </div>

            <p className="text-center font-mono text-[11px] text-ink-soft">Protected by Guardian IAM · Control-plane isolated</p>
          </motion.div>
        </div>

        <div className="px-6 pb-4 text-center font-mono text-[10px] text-ink-soft/60 sm:px-8">Protected by Guardian IAM · Control-plane isolated</div>
      </div>
    </div>
  )
}
