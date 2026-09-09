import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Laptop,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Plus,
  MailWarning,
  Monitor,
  Trash2,
  KeyRound,
  LogOut,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { InlineTotpEnroll } from '../../components/auth/InlineTotpEnroll'
import { useAuth } from '../../auth/AuthProvider'
import { ApiError, api } from '../../lib/apiClient'
import type { AuthSession, MfaListResponse, SessionListResponse } from '../../auth/types'

interface Overview {
  user: { id: string; email: string; display_name: string; mfa_enabled: boolean; email_verified: boolean }
  tenant: { id: string; name: string; status: string }
  subscription: { status?: string; plan?: string; device_limit?: number; current_period_end?: string }
  devices: { count: number; needs_first_device: boolean }
}

function Card({
  title,
  children,
  action,
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/* -------------------------------------------------------------- Overview */

export function PersonalOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setOverview(await api.get<Overview>('/api/v1/me/overview', { plane: 'customer' }))
      } catch {
        setError('Could not load your workspace.')
      }
    })()
  }, [])

  if (error) {
    return <Card><p className="text-sm text-alert">{error}</p></Card>
  }
  if (!overview) {
    return (
      <p className="py-16 text-center font-mono text-xs tracking-widest text-ink-soft">LOADING…</p>
    )
  }

  const firstName = overview.user.display_name?.split(' ')[0] || 'there'

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Hello, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">{overview.tenant.name} · your personal workspace</p>
      </header>

      {!overview.user.email_verified && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-ink">Confirm your email address</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              Check your inbox for the confirmation link. You'll need a verified address before you
              can enroll devices.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Devices</span>
            <Laptop className="h-3.5 w-3.5 text-ink-soft" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{overview.devices.count}</p>
          {overview.subscription.device_limit !== undefined && (
            <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
              of {overview.subscription.device_limit} included
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              Two-factor
            </span>
            {overview.user.mfa_enabled ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {overview.user.mfa_enabled ? 'On' : 'Off'}
          </p>
          {!overview.user.mfa_enabled && (
            <Link
              to="/app/security"
              className="mt-0.5 inline-block font-mono text-[11px] text-signal no-underline hover:underline"
            >
              Turn it on →
            </Link>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Plan</span>
            <CreditCard className="h-3.5 w-3.5 text-ink-soft" />
          </div>
          <p className="mt-2 font-display text-lg font-bold text-ink">
            {overview.subscription.plan ?? 'None'}
          </p>
          {overview.subscription.status && (
            <div className="mt-1">
              <StatusBadge status={overview.subscription.status} />
            </div>
          )}
        </Card>
      </div>

      {/* The empty state the spec calls for on a brand-new account. */}
      {overview.devices.needs_first_device ? (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-soft">
              <Laptop className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-ink">
              Add your first device
            </h2>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
              Install the Guardian agent on a laptop or desktop to start protecting it. You can
              enroll up to {overview.subscription.device_limit ?? 3} devices on your plan.
            </p>
            <Button variant="signal" className="mt-4 rounded-xl text-xs" disabled>
              <Plus className="h-3.5 w-3.5" /> Add a device
            </Button>
            <p className="mt-2 font-mono text-[10px] text-ink-soft">
              Device enrollment arrives with the agent release.
            </p>
          </div>
        </Card>
      ) : (
        <Card title="Your devices">
          <p className="text-sm text-ink-soft">
            {overview.devices.count} device{overview.devices.count === 1 ? '' : 's'} enrolled.
          </p>
        </Card>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- Devices */

export function PersonalDevicesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Devices</h1>
        <p className="mt-1 text-sm text-ink-soft">Everything protected by your Guardian plan.</p>
      </header>
      <Card>
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-soft">
            <Laptop className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm text-ink-soft">
            No devices yet. Enrollment ships with the Guardian agent.
          </p>
        </div>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------- Security */

/**
 * The customer's account security centre: two-factor, password and sessions.
 * The same capabilities staff get, against the customer plane's endpoints.
 */
export function PersonalSecurityPage() {
  const { refresh } = useAuth()
  const [mfa, setMfa] = useState<MfaListResponse | null>(null)
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  const load = useCallback(async () => {
    try {
      const [mfaResult, sessionResult] = await Promise.all([
        api.get<MfaListResponse>('/api/v1/auth/mfa', { plane: 'customer' }),
        api.get<SessionListResponse>('/api/v1/me/sessions', { plane: 'customer' }),
      ])
      setMfa(mfaResult)
      setSessions(sessionResult.items)
    } catch {
      setError('Could not load your security settings.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const methods = mfa?.items ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Security</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Two-factor authentication, your password, and where you're signed in.
        </p>
      </header>

      {notice && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
          {error}
        </div>
      )}

      <Card
        title="Two-factor authentication"
        action={
          !enrolling ? (
            <Button
              type="button"
              variant="signal"
              onClick={() => setEnrolling(true)}
              className="rounded-xl text-xs"
            >
              {methods.length === 0 ? 'Enable authenticator' : 'Add method'}
            </Button>
          ) : undefined
        }
      >
        {enrolling ? (
          <InlineTotpEnroll
            plane="customer"
            onCancel={() => setEnrolling(false)}
            onComplete={async () => {
              setEnrolling(false)
              setNotice('Authenticator enabled. Keep your recovery codes somewhere safe.')
              await load()
              await refresh()
            }}
          />
        ) : methods.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-ink">2FA is off</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  Your account is protected by a password alone. Enable an authenticator for stronger
                  protection.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="signal"
              onClick={() => setEnrolling(true)}
              className="shrink-0 rounded-xl text-xs"
            >
              Enable authenticator
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {method.label || method.method_type}
                  </p>
                  <p className="font-mono text-[11px] text-ink-soft">{method.method_type}</p>
                </div>
                {method.is_primary && <StatusBadge status="PRIMARY" />}
              </div>
            ))}
            <p className="font-mono text-[11px] text-ink-soft">
              {mfa?.recovery_codes_remaining ?? 0} recovery codes unused
            </p>
          </div>
        )}
      </Card>

      <PasswordCard onNotice={setNotice} onError={setError} />

      <Card
        title="Signed in devices"
        action={
          sessions.some((s) => !s.current) ? (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await api.delete('/api/v1/me/sessions', undefined, { plane: 'customer' })
                  setNotice('Signed out on your other devices.')
                  await load()
                  await refresh()
                } catch {
                  setError('Could not sign out the other devices.')
                }
              }}
              className="rounded-xl border-line text-xs"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out others
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
            >
              <Monitor className="h-4 w-4 shrink-0 text-ink-soft" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {session.user_agent || 'Unknown device'}
                </p>
                <p className="font-mono text-[11px] text-ink-soft">
                  {session.ip_address || 'unknown IP'} ·{' '}
                  {new Date(session.last_activity_at).toLocaleString()} · {session.auth_method}
                </p>
              </div>
              {session.current ? (
                <StatusBadge status="CURRENT" />
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.delete(`/api/v1/me/sessions/${session.id}`, undefined, {
                        plane: 'customer',
                      })
                      setNotice('That device has been signed out.')
                      await load()
                    } catch {
                      setError('Could not sign that device out.')
                    }
                  }}
                  className="rounded-lg p-1.5 text-ink-soft transition-colors hover:text-alert"
                  aria-label="Sign this device out"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function PasswordCard({
  onNotice,
  onError,
}: {
  onNotice: (message: string) => void
  onError: (message: string) => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <Card title="Password">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="current-password" className="text-xs font-semibold text-ink">
            Current password
          </Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="h-9 rounded-xl border-line bg-surface-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-xs font-semibold text-ink">
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="h-9 rounded-xl border-line bg-surface-2 text-sm"
          />
          <p className="font-mono text-[10px] text-ink-soft">At least 10 characters.</p>
        </div>
      </div>
      <Button
        type="button"
        variant="signal"
        disabled={saving || !current || next.length < 10}
        onClick={async () => {
          setSaving(true)
          try {
            await api.post(
              '/api/v1/me/password',
              { current_password: current, new_password: next },
              { plane: 'customer' },
            )
            onNotice('Password changed. Your other devices have been signed out.')
            setCurrent('')
            setNext('')
          } catch (err) {
            onError(
              err instanceof ApiError && err.status === 401
                ? 'Your current password is not correct.'
                : err instanceof ApiError
                  ? err.message
                  : 'Could not change your password.',
            )
          } finally {
            setSaving(false)
          }
        }}
        className="mt-3 rounded-xl text-xs"
      >
        {saving ? 'Saving…' : 'Change password'}
      </Button>
    </Card>
  )
}

/* -------------------------------------------------------------- Profile */

export function PersonalProfilePage() {
  const { user, refresh } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(user?.display_name ?? '')
  }, [user?.display_name])

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-soft">How you appear in Guardian.</p>
      </header>

      {notice && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600">
          {notice}
        </div>
      )}

      <Card>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-xs font-semibold text-ink">
              Display name
            </Label>
            <Input
              id="profile-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-9 rounded-xl border-line bg-surface-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">Email</Label>
            <Input
              value={user?.email ?? ''}
              readOnly
              disabled
              className="h-9 rounded-xl border-line bg-mist text-sm text-ink-soft"
            />
            <p className="font-mono text-[10px] text-ink-soft">
              Contact support to change the address on your account.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="signal"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await api.patch('/api/v1/me/profile', { display_name: displayName }, { plane: 'customer' })
              await refresh()
              setNotice('Profile updated.')
            } finally {
              setSaving(false)
            }
          }}
          className="mt-4 rounded-xl text-xs"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Card>
    </div>
  )
}
