import { useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  Monitor,
  Trash2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Check,
  Copy,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { InlineTotpEnroll } from '../../../components/auth/InlineTotpEnroll'
import { useAuth } from '../../../auth/AuthProvider'
import { api, ApiError } from '../../../lib/apiClient'
import type { AuthSession, MfaListResponse, SessionListResponse } from '../../../auth/types'

/**
 * Account security for the signed-in Guardian staff member.
 *
 * Everything here acts on the caller's own account only — managing *other*
 * people's accounts lives under Guardian IAM and needs the iam.users.manage
 * permission.
 */
export function AccountSecurityPage() {
  const { user, refresh } = useAuth()

  const [mfa, setMfa] = useState<MfaListResponse | null>(null)
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [mfaResult, sessionResult] = await Promise.all([
        api.get<MfaListResponse>('/api/v1/admin/auth/mfa'),
        api.get<SessionListResponse>('/api/v1/admin/account/sessions'),
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

  async function revokeSession(id: string) {
    try {
      await api.delete(`/api/v1/admin/account/sessions/${id}`)
      setNotice('That device has been signed out.')
      await load()
    } catch {
      setError('Could not sign that device out.')
    }
  }

  async function revokeOthers() {
    try {
      await api.delete('/api/v1/admin/account/sessions')
      setNotice('All other devices have been signed out.')
      await load()
    } catch {
      setError('Could not sign the other devices out.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Account security</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Signed in as <span className="font-medium text-ink">{user?.email}</span>. These settings
            apply to your own account.
          </p>
        </div>
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

      <TwoFactorSection
        mfa={mfa}
        onChanged={async () => {
          await load()
          await refresh()
        }}
        onError={setError}
        onNotice={setNotice}
      />

      <PasswordSection onError={setError} onNotice={setNotice} />

      <SessionsSection
        sessions={sessions}
        onRevoke={revokeSession}
        onRevokeOthers={revokeOthers}
      />
    </div>
  )
}

function Card({
  title,
  description,
  icon: Icon,
  children,
  action,
}: {
  title: string
  description: string
  icon: typeof ShieldCheck
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-soft">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function TwoFactorSection({
  mfa,
  onChanged,
  onError,
  onNotice,
}: {
  mfa: MfaListResponse | null
  onChanged: () => Promise<void>
  onError: (message: string) => void
  onNotice: (message: string) => void
}) {
  const [password, setPassword] = useState('')
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null)
  const [newCodes, setNewCodes] = useState<string[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  const methods = mfa?.items ?? []
  const remaining = mfa?.recovery_codes_remaining ?? 0

  async function removeMethod(id: string) {
    try {
      await api.delete(`/api/v1/admin/account/mfa/${id}`, { password })
      onNotice('Two-factor method removed.')
      setPendingRemoval(null)
      setPassword('')
      await onChanged()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        onError(
          'Two-factor is required for your account. Add another method before removing this one.',
        )
      } else if (err instanceof ApiError && err.status === 401) {
        onError('That password is not correct.')
      } else {
        onError('Could not remove that method.')
      }
    }
  }

  async function regenerateCodes() {
    try {
      const result = await api.post<{ recovery_codes: string[] }>(
        '/api/v1/admin/account/mfa/recovery-codes',
        { password },
      )
      setNewCodes(result.recovery_codes)
      setPassword('')
      await onChanged()
    } catch (err) {
      onError(
        err instanceof ApiError && err.status === 401
          ? 'That password is not correct.'
          : 'Could not regenerate your recovery codes.',
      )
    }
  }

  function startEnrol() {
    setPendingRemoval(null)
    setNewCodes(null)
    setEnrolling(true)
  }

  return (
    <Card
      title="Two-factor authentication"
      description="Optional but recommended. Add an authenticator app so a stolen password alone cannot open the control plane."
      icon={ShieldCheck}
      action={
        !enrolling ? (
          <Button type="button" variant="signal" onClick={startEnrol} className="shrink-0 rounded-xl text-xs">
            {methods.length === 0 ? 'Enable authenticator' : 'Add method'}
          </Button>
        ) : undefined
      }
    >
      {enrolling ? (
        <InlineTotpEnroll
          plane="admin"
          onCancel={() => setEnrolling(false)}
          onComplete={async () => {
            setEnrolling(false)
            onNotice('Authenticator enabled. Keep your recovery codes somewhere safe.')
            await onChanged()
          }}
        />
      ) : (
        <div className="mt-4 space-y-2">
          {methods.length === 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-ink">2FA is off</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                    Your account is protected by a password alone. Enable an authenticator for stronger
                    protection.
                  </p>
                </div>
              </div>
              <Button type="button" variant="signal" onClick={startEnrol} className="shrink-0 rounded-xl text-xs">
                Enable authenticator
              </Button>
            </div>
          )}

          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft">
                <Smartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {method.label || method.method_type}
                </p>
                <p className="font-mono text-[11px] text-ink-soft">
                  {method.method_type}
                  {method.last_used_at
                    ? ` · last used ${new Date(method.last_used_at).toLocaleDateString()}`
                    : ' · never used'}
                </p>
              </div>
              {method.is_primary && <StatusBadge status="PRIMARY" />}
              <button
                type="button"
                onClick={() => setPendingRemoval(method.id)}
                className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-surface hover:text-alert"
                aria-label="Remove this method"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Recovery codes</p>
                <p className="font-mono text-[11px] text-ink-soft">
                  {methods.length === 0 ? 'Available after you enable 2FA' : `${remaining} unused`}
                </p>
              </div>
            </div>
            {methods.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingRemoval('recovery')}
                className="rounded-xl border-line text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Password re-entry: an unlocked screen alone must not be enough to
          weaken the account's second factor. */}
      {!enrolling && pendingRemoval && !newCodes && (
        <div className="mt-3 rounded-xl border border-line bg-mist/40 p-3">
          <Label htmlFor="mfa-password" className="text-xs font-semibold text-ink">
            Confirm your password to continue
          </Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="mfa-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 rounded-xl border-line bg-surface text-sm"
            />
            <Button
              type="button"
              variant="signal"
              disabled={!password}
              onClick={() =>
                pendingRemoval === 'recovery' ? regenerateCodes() : removeMethod(pendingRemoval)
              }
              className="shrink-0 rounded-xl text-xs"
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingRemoval(null)
                setPassword('')
              }}
              className="shrink-0 rounded-xl border-line text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!enrolling && newCodes && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold text-ink">
            Your new recovery codes — every previous code has been invalidated.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {newCodes.map((code) => (
              <code key={code} className="font-mono text-[12px] text-ink">
                {code}
              </code>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(newCodes.join('\n'))
                setCopied(true)
                window.setTimeout(() => setCopied(false), 2000)
              }}
              className="rounded-xl border-line text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              type="button"
              variant="signal"
              onClick={() => {
                setNewCodes(null)
                setPendingRemoval(null)
              }}
              className="rounded-xl text-xs"
            >
              I've saved them
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function PasswordSection({
  onError,
  onNotice,
}: {
  onError: (message: string) => void
  onNotice: (message: string) => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await api.post('/api/v1/admin/account/password', {
        current_password: current,
        new_password: next,
      })
      onNotice('Password changed. Your other devices have been signed out.')
      setCurrent('')
      setNext('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onError('Your current password is not correct.')
      } else if (err instanceof ApiError && err.status === 400) {
        onError(err.message)
      } else {
        onError('Could not change your password.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Password"
      description="Changing your password signs you out on every other device."
      icon={KeyRound}
    >
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        onClick={submit}
        className="mt-3 rounded-xl text-xs"
      >
        {saving ? 'Saving…' : 'Change password'}
      </Button>
    </Card>
  )
}

function SessionsSection({
  sessions,
  onRevoke,
  onRevokeOthers,
}: {
  sessions: AuthSession[]
  onRevoke: (id: string) => void
  onRevokeOthers: () => void
}) {
  const hasOthers = sessions.some((session) => !session.current)

  return (
    <Card
      title="Active sessions"
      description="Every device currently signed in to your account."
      icon={Monitor}
      action={
        hasOthers ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRevokeOthers}
            className="shrink-0 rounded-xl border-line text-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out others
          </Button>
        ) : undefined
      }
    >
      <div className="mt-4 space-y-2">
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
                {session.ip_address || 'unknown IP'} · active{' '}
                {new Date(session.last_activity_at).toLocaleString()} · {session.auth_method}
              </p>
            </div>
            {session.current ? (
              <StatusBadge status="CURRENT" />
            ) : (
              <button
                type="button"
                onClick={() => onRevoke(session.id)}
                className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-surface hover:text-alert"
                aria-label="Sign this device out"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
