import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, Fingerprint, Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { GuardianMark } from '../components/GuardianMark'
import { SentinelMeshBg } from '../components/home/SentinelMeshBg'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setNotice('Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setNotice('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    setNotice(null)

    setTimeout(() => {
      setIsSubmitting(false)
      setNotice('Credentials validated. Ready to connect to backend session.')
    }, 600)
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-mist">
      <SentinelMeshBg className="opacity-50" />
      <div className="grid h-full w-full lg:grid-cols-2 relative z-10">
        {/* LEFT: Clean, High-Impact Brand Showcase */}
        <div className="relative hidden h-full flex-col justify-between border-r border-line bg-surface/40 p-10 lg:flex xl:p-14">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-signal/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-signal/5 blur-[90px]" />

          {/* Brand Header */}
          <div className="relative z-10">
            <Link to="/" className="group inline-flex items-center gap-2.5 no-underline">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-white shadow-sm transition-transform group-hover:scale-105">
                <GuardianMark className="h-5 w-5" />
              </span>
              <span className="font-display text-base font-bold tracking-tight text-ink">Guardian</span>
            </Link>
          </div>

          {/* Central Hero Message */}
          <div className="relative z-10 my-auto max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11px] font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              Zero-Trust Control Plane
            </div>

            <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink xl:text-4xl">
              Protect the person.
              <br />
              <span className="text-ink-soft font-medium">Protect the organization.</span>
              <br />
              <span className="text-signal">Control the device.</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Continuous endpoint security, presence monitoring, and instant incident response for all your hardware.
            </p>

            <div className="mt-8 space-y-3 font-mono text-xs text-ink-soft">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <Check className="h-3 w-3" />
                </span>
                <span>Hardware-bound Ed25519 device keys</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <Check className="h-3 w-3" />
                </span>
                <span>Strict multi-tenant cryptographic isolation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <Check className="h-3 w-3" />
                </span>
                <span>Append-only security audit trail</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="relative z-10 font-mono text-[11px] text-ink-soft/70">
            Guardian Cloud · Personal Watchline & Enterprise
          </div>
        </div>

        {/* RIGHT: Clean, Focused, Unscrollable Auth Card */}
        <div className="relative flex h-full flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 overflow-hidden">
          {/* Top Home Link */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-ink lg:hidden no-underline">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal text-white">
                <GuardianMark className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-bold">Guardian</span>
            </Link>
            <Link
              to="/"
              className="ml-auto font-mono text-xs text-ink-soft hover:text-ink transition-colors no-underline"
            >
              ← Back to home
            </Link>
          </div>

          {/* Centered Auth Card */}
          <div className="mx-auto my-auto w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Welcome back
                </h2>
                <p className="mt-1 text-xs text-ink-soft sm:text-sm">
                  Sign in to access your Watchline dashboard.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-ink">
                    Email address
                  </Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-ink">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-soft hover:text-ink transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 rounded-xl pl-9 pr-9 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-ink-soft">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-line accent-signal"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="font-mono text-[11px] text-ink-soft">Argon2id</span>
                </div>

                <Button
                  type="submit"
                  variant="signal"
                  size="default"
                  disabled={isSubmitting}
                  className="w-full rounded-xl py-5 text-sm font-semibold shadow-sm"
                >
                  {isSubmitting ? (
                    'Signing in...'
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {notice && (
                <div className="rounded-xl border border-signal/30 bg-signal-soft/20 px-3 py-2 text-xs text-ink">
                  {notice}
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl gap-2 font-mono text-xs"
              >
                <Fingerprint className="h-4 w-4 text-signal" />
                <span>Continue with Passkey (FIDO2)</span>
              </Button>

              <p className="text-center text-xs text-ink-soft pt-1">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-signal hover:underline">
                  Create one here
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Subtle Bottom Guarantee */}
          <div className="text-center font-mono text-[10px] text-ink-soft/60">
            Protected by hardware-isolated encryption · TLS 1.3
          </div>
        </div>
      </div>
    </div>
  )
}
