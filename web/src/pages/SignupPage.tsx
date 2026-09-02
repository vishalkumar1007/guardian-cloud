import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { User, AtSign, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { GuardianMark } from '../components/GuardianMark'

export function SignupPage() {
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const strength = password.length === 0 ? 0 : password.length < 10 ? 1 : password.length < 14 ? 2 : 3

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email || password.length < 10) {
      setNotice('Name, email, and a password of at least 10 characters are required.')
      return
    }
    setNotice('Signup lands with F1.1 — personal tenant creation comes next.')
  }

  return (
    <section className="relative flex h-[100dvh] w-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative z-10 grid h-[100dvh] min-h-0 w-screen md:grid-cols-2"
      >
        <div className="relative flex flex-col justify-center bg-surface p-8 sm:p-10 md:p-10 lg:p-12">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white">
                <GuardianMark className="h-5 w-5" />
              </span>
              <span className="font-display text-sm font-semibold tracking-tight text-ink">Guardian</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Personal Basic
              </span>
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-[22px] font-bold leading-tight tracking-tight text-ink">Create your watchline</h1>
              <p className="text-sm leading-relaxed text-ink-soft">Up to 3 devices, one line.</p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="name" required autoComplete="name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="email" type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" onClick={() => setShow((v) => !v)} className="font-mono text-xs font-medium text-ink-soft hover:text-ink">
                    {show ? <EyeOff className="inline h-3.5 w-3.5" /> : <Eye className="inline h-3.5 w-3.5" />} {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input id="password" type={show ? 'text' : 'password'} required minLength={10} autoComplete="new-password" placeholder="At least 10 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl pl-9 pr-9" />
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i < strength ? (strength === 1 ? 'bg-amber-500' : 'bg-signal') : 'bg-line'}`} />
                  ))}
                </div>
              </div>

              <Button type="submit" variant="signal" className="mt-1 w-full rounded-full py-6 text-sm font-semibold">
                Create account <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {notice ? <p className="rounded-xl border border-line bg-mist px-3 py-2.5 text-xs leading-relaxed text-ink-soft">{notice}</p> : null}

            <div className="flex flex-col items-center gap-2 border-t border-line pt-5">
              <p className="text-sm text-ink-soft">
                Already watching?{' '}
                <Link to="/login" className="font-semibold text-signal hover:underline">
                  Sign in
                </Link>
              </p>
              <Link to="/" className="font-mono text-xs text-ink-soft hover:text-ink">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>

        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0f1e] p-10 md:flex lg:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-spine-pulse" /> Personal Basic · $9/mo
            </p>
            <h2 className="mt-5 font-display text-[28px] font-bold leading-[1.1] tracking-tight text-white">
              Start with
              <br />
              <span className="font-light text-white/60">3 devices, today.</span>
            </h2>
            <p className="mt-3 max-w-[300px] text-[14px] leading-relaxed text-white/60">Enroll your first device in under a minute. Signals start instantly.</p>
          </div>

          <div className="relative">
            <div className="absolute left-[13px] top-3 bottom-3 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
            <ol className="space-y-6">
              {[
                { n: '1', t: 'Create account', d: 'Personal Basic — free' },
                { n: '2', t: 'Enroll device', d: 'One command · token' },
                { n: '3', t: 'Watch & protect', d: 'Signals · LOCK when needed' },
              ].map((s) => (
                <li key={s.n} className="relative flex gap-3.5 pl-1">
                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0a0f1e] shadow-sm">{s.n}</span>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold leading-none tracking-tight text-white">{s.t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-2">
              {['3 devices', 'Presence', 'Ribbon', 'Audit trail'].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/70">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="relative font-mono text-[11px] tracking-wide text-white/35">No credit card · Upgrade for faces & evidence</p>
        </div>
      </motion.div>
    </section>
  )
}
