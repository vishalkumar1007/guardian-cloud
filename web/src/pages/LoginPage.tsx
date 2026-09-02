import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { GuardianMark } from '../components/GuardianMark'
import { LineGridBg } from '../components/home/LineGridBg'

export function LoginPage() {
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || password.length < 8) {
      setNotice('Enter a valid email and password (8+ characters).')
      return
    }
    setNotice('Sign-in lands with F1.1 — auth APIs are not wired yet.')
  }

  return (
    <section className="relative flex h-[100dvh] w-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative z-10 grid h-[100dvh] min-h-0 w-screen md:grid-cols-2"
      >
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-mist p-10 md:flex lg:p-12">
          <div className="pointer-events-none absolute inset-0">
            <LineGridBg />
          </div>

          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white">
                <GuardianMark className="h-5 w-5" />
              </span>
              <span className="font-display text-sm font-semibold tracking-tight text-ink">Guardian</span>
            </Link>
            <div className="mt-12 max-w-[320px]">
              <h2 className="font-display text-[28px] font-bold leading-[1.1] tracking-tight text-ink">
                Return to the
                <br />
                <span className="font-light text-ink-soft">watchline.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">Your devices kept watch. Sign in to see presence.</p>
            </div>
          </div>

          <p className="relative font-mono text-[11px] tracking-wide text-ink-soft">Tenant-isolated · audited</p>
        </div>

        <div className="relative flex flex-col justify-center bg-surface p-8 sm:p-10 md:p-10 lg:p-11 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-sm flex-col">
            <div className="flex items-center gap-3 md:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white">
                <GuardianMark className="h-5 w-5" />
              </span>
              <p className="font-display text-sm font-semibold tracking-tight text-ink">Guardian</p>
            </div>

            <div className="mt-2 text-left md:mt-0">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-ink-soft">
                <Shield className="h-3 w-3 text-signal" /> Secure sign in
              </p>
              <h1 className="mt-3 text-left font-display text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
              <p className="mt-1.5 text-left text-sm leading-relaxed text-ink-soft">Sign in to your watchline — tenant-isolated and audited.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-7 space-y-5 text-left">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] font-medium text-ink-soft hover:bg-mist hover:text-ink transition-colors"
                  >
                    {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] font-medium tracking-wide text-ink-soft">{password.length ? `${password.length}•` : ''}</span>
                </div>
                <p className="font-mono text-[11px] text-ink-soft">At least 8 characters. Phase 1 enforces server-side.</p>
              </div>

              <Button type="submit" variant="signal" size="lg" className="w-full rounded-full">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[11px] tracking-wide text-ink-soft">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs font-medium text-ink-soft">
                  <Shield className="h-3.5 w-3.5 text-ink-soft" /> SSO soon
                </span>
                <span className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs font-medium text-ink-soft">
                  <span className="h-2 w-2 rounded-full bg-signal" /> Passkey soon
                </span>
              </div>
            </form>

            {notice ? (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-ink"
              >
                {notice}
              </motion.p>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
              <p className="text-sm text-ink-soft">
                New here?{' '}
                <Link to="/signup" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:text-signal transition-colors">
                  Create an account
                </Link>
              </p>
              <Link to="/" className="hidden font-mono text-xs font-medium text-ink-soft hover:text-ink transition-colors sm:inline-flex">
                ← Back to home
              </Link>
            </div>

            <p className="mt-4 text-center font-mono text-[10px] leading-relaxed tracking-wide text-ink-soft">Protected by tenant isolation + RLS · Evidence is HIGHLY-SENSITIVE</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
