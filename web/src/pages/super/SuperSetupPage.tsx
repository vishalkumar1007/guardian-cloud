import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldAlert, CheckCircle2, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { GuardianMark } from '../../components/GuardianMark'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

export function SuperSetupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [email, setEmail] = useState('superadmin@guardian.security')
  const [displayName, setDisplayName] = useState('Chief Security Officer')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function checkBootstrap() {
      try {
        const res = await fetch(`${apiBase()}/api/v1/platform/bootstrap`)
        if (res.ok) {
          const data = await res.json()
          if (!data.needs_setup) {
            setAlreadyCompleted(true)
          }
        }
      } catch {
        // Continue if offline/dev
      } finally {
        setLoading(false)
      }
    }
    void checkBootstrap()
  }, [])

  const passwordLengthOk = password.length >= 10
  const passwordHasUpper = /[A-Z]/.test(password)
  const passwordHasLower = /[a-z]/.test(password)
  const passwordHasNumber = /[0-9]/.test(password)
  const passwordHasSymbol = /[^A-Za-z0-9]/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const isFormValid =
    email.includes('@') &&
    displayName.trim().length > 0 &&
    passwordLengthOk &&
    passwordHasUpper &&
    passwordHasLower &&
    passwordHasNumber &&
    passwordHasSymbol &&
    passwordsMatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${apiBase()}/api/v1/platform/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      })

      if (res.status === 410) {
        setAlreadyCompleted(true)
        setError('Platform setup has already been completed and locked.')
        return
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Setup failed with HTTP ${res.status}`)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize platform setup')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-sm text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
          Verifying platform bootstrap state…
        </div>
      </div>
    )
  }

  if (alreadyCompleted && !success) {
    return (
      <div className="mx-auto max-w-md text-center py-12 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/15 text-signal ring-1 ring-signal/30">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Platform Already Initialized</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          The root platform super-admin has already been provisioned and the bootstrap endpoint is locked (HTTP 410 Gone).
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Button asChild variant="signal" className="rounded-full">
            <Link to="/super">Go to Super Admin Console</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md text-center py-12 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Platform Setup Complete</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          Root administrator <strong className="text-ink">{email}</strong> provisioned with Argon2id credentials. Bootstrap endpoint permanently sealed.
        </p>
        <div className="pt-4">
          <Button onClick={() => navigate('/super')} variant="signal" size="lg" className="rounded-full px-8">
            Access Control-Plane Overview <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg py-6 space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-mono font-medium text-signal">
          <GuardianMark className="h-3.5 w-3.5" />
          First-Run Provisioning
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Initialize Platform Super-Admin
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
          One-time ceremony to establish root cryptographic control of the Guardian platform. This endpoint is sealed after initialization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-lg">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-alert/30 bg-alert/10 p-3 text-xs text-alert font-mono">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-mono text-xs font-medium text-ink-soft uppercase tracking-wider">
            Root Admin Email
          </label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@guardian.security"
            className="rounded-xl border-line bg-surface-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-xs font-medium text-ink-soft uppercase tracking-wider">
            Display Name
          </label>
          <Input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Chief Security Officer"
            className="rounded-xl border-line bg-surface-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-xs font-medium text-ink-soft uppercase tracking-wider">
            Master Password
          </label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="rounded-xl border-line bg-surface-2"
          />
          {/* Password Policy Grid */}
          <div className="grid grid-cols-2 gap-1 pt-1.5 text-[11px] font-mono">
            <span className={passwordLengthOk ? 'text-emerald-500 font-semibold' : 'text-ink-soft'}>
              {passwordLengthOk ? '✓' : '○'} 10+ characters
            </span>
            <span className={passwordHasUpper && passwordHasLower ? 'text-emerald-500 font-semibold' : 'text-ink-soft'}>
              {passwordHasUpper && passwordHasLower ? '✓' : '○'} Upper & lower case
            </span>
            <span className={passwordHasNumber ? 'text-emerald-500 font-semibold' : 'text-ink-soft'}>
              {passwordHasNumber ? '✓' : '○'} Number included
            </span>
            <span className={passwordHasSymbol ? 'text-emerald-500 font-semibold' : 'text-ink-soft'}>
              {passwordHasSymbol ? '✓' : '○'} Symbol included
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-xs font-medium text-ink-soft uppercase tracking-wider">
            Confirm Password
          </label>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            className="rounded-xl border-line bg-surface-2"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="font-mono text-[11px] text-alert">Passwords do not match</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="signal"
            size="lg"
            disabled={!isFormValid || submitting}
            className="w-full rounded-full font-display font-semibold text-sm shadow-md"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-white animate-spin" />
                Sealing Root Credentials…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Initialize Platform Control-Plane
              </span>
            )}
          </Button>
        </div>

        <p className="text-center font-mono text-[10px] text-ink-soft pt-1">
          Atomic Transaction: creates user_credentials, platform_admins, and audit log.
        </p>
      </form>
    </div>
  )
}
