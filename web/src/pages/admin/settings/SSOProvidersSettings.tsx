import { useCallback, useEffect, useState } from 'react'
import {
  Plug,
  Plus,
  Trash2,
  Check,
  X,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { ApiError, api } from '../../../lib/apiClient'

/**
 * Social sign-in configuration.
 *
 * A super admin registers an OAuth application here and enables it; the button
 * then appears on the corresponding login page with no deploy. Which page it
 * appears on is the `plane` field: staff sign-in, or the customer app.
 *
 * Client secrets are write-only. The API returns only client_secret_set, so a
 * saved secret can be replaced but never read back.
 */

interface Provider {
  id: string
  plane: 'admin' | 'customer'
  slug: string
  vendor: 'GOOGLE' | 'GITHUB' | 'OKTA' | 'AZURE_AD' | 'GENERIC'
  display_name: string
  button_label: string
  issuer: string
  client_id: string
  client_secret_set: boolean
  jit_provisioning: boolean
  enabled: boolean
  redirect_uri: string
  last_test_ok: boolean | null
  last_test_error: string | null
  last_tested_at: string | null
}

const VENDORS = [
  { value: 'GOOGLE', label: 'Google', needsIssuer: false },
  { value: 'GITHUB', label: 'GitHub', needsIssuer: false },
  { value: 'OKTA', label: 'Okta', needsIssuer: true },
  { value: 'AZURE_AD', label: 'Microsoft Entra ID', needsIssuer: true },
  { value: 'GENERIC', label: 'Other (OpenID Connect)', needsIssuer: true },
] as const

export function SSOProvidersSettings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busyID, setBusyID] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await api.get<{ items: Provider[] }>('/api/v1/admin/sso-providers/')
      setProviders(result.items)
      setError(null)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? 'You need the platform.settings.manage permission to configure sign-in providers.'
          : 'Could not load sign-in providers.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function runTest(provider: Provider) {
    setBusyID(provider.id)
    setNotice(null)
    try {
      const result = await api.post<{ ok: boolean; error: string }>(
        `/api/v1/admin/sso-providers/${provider.id}/test`,
      )
      setNotice(
        result.ok
          ? `${provider.display_name} configuration looks good. You can enable it now.`
          : `${provider.display_name} test failed: ${result.error}`,
      )
      await load()
    } catch {
      setError('Could not run the connection test.')
    } finally {
      setBusyID(null)
    }
  }

  async function toggle(provider: Provider) {
    setBusyID(provider.id)
    try {
      await api.post(
        `/api/v1/admin/sso-providers/${provider.id}/${provider.enabled ? 'disable' : 'enable'}`,
      )
      setNotice(
        provider.enabled
          ? `${provider.display_name} is hidden from the ${provider.plane} sign-in page.`
          : `${provider.display_name} now appears on the ${provider.plane} sign-in page.`,
      )
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Run a successful connection test before enabling this provider.'
          : 'Could not update the provider.',
      )
    } finally {
      setBusyID(null)
    }
  }

  async function remove(provider: Provider) {
    if (!window.confirm(`Remove ${provider.display_name}? Anyone who signs in with it will lose that option.`)) {
      return
    }
    setBusyID(provider.id)
    try {
      await api.delete(`/api/v1/admin/sso-providers/${provider.id}`)
      setNotice(`${provider.display_name} removed.`)
      await load()
    } catch {
      setError('Could not remove the provider.')
    } finally {
      setBusyID(null)
    }
  }

  if (loading) {
    return <p className="py-10 font-mono text-xs tracking-widest text-ink-soft">LOADING PROVIDERS…</p>
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Social sign-in</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Let people sign in with Google or GitHub. Enable a provider to make its button appear on
            the sign-in page you choose.
          </p>
        </div>
        <Button
          type="button"
          variant="signal"
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-xl text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add provider
        </Button>
      </header>

      {notice && (
        <div className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-ink-soft">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
          {error}
        </div>
      )}

      {showForm && (
        <ProviderForm
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false)
            setNotice('Provider saved. Run a connection test, then enable it.')
            await load()
          }}
        />
      )}

      {providers.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-soft">
            <Plug className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">No sign-in providers yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-soft">
            Add Google or GitHub to let people sign in without a password. Until then, both sign-in
            pages show email and password only.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              busy={busyID === provider.id}
              onTest={() => runTest(provider)}
              onToggle={() => toggle(provider)}
              onRemove={() => remove(provider)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProviderRow({
  provider,
  busy,
  onTest,
  onToggle,
  onRemove,
}: {
  provider: Provider
  busy: boolean
  onTest: () => void
  onToggle: () => void
  onRemove: () => void
}) {
  const [copied, setCopied] = useState(false)
  const tested = provider.last_test_ok === true

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-ink">{provider.display_name}</h3>
            <StatusBadge status={provider.enabled ? 'ACTIVE' : 'DISABLED'} />
            <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
              {provider.plane === 'admin' ? 'Staff sign-in' : 'Customer sign-in'}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-ink-soft">
            {provider.vendor} · client {provider.client_id.slice(0, 12)}…
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onTest}
            className="rounded-xl border-line text-xs"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Test connection
          </Button>
          <Button
            type="button"
            variant={provider.enabled ? 'outline' : 'signal'}
            disabled={busy || (!provider.enabled && !tested)}
            onClick={onToggle}
            className="rounded-xl text-xs"
            // Explains the disabled state rather than leaving it inert and unexplained.
            title={!provider.enabled && !tested ? 'Run a successful connection test first' : undefined}
          >
            {provider.enabled ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
            {provider.enabled ? 'Disable' : 'Enable'}
          </Button>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-2 hover:text-alert"
            aria-label="Remove provider"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* The operator has to paste this into the provider's own console, so it
          is shown rather than described. */}
      <div className="mt-3 rounded-xl border border-line bg-mist/40 px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
          Authorised redirect URI
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-ink">
            {provider.redirect_uri}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(provider.redirect_uri)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            }}
            className="shrink-0 rounded-lg p-1.5 text-ink-soft hover:text-ink"
            aria-label="Copy redirect URI"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {provider.last_test_ok === false && provider.last_test_error && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" />
          <p className="text-[11px] leading-relaxed text-alert">{provider.last_test_error}</p>
        </div>
      )}
      {tested && !provider.enabled && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <p className="text-[11px] text-ink-soft">
            Connection verified. Enable it to show the button on the sign-in page.
          </p>
        </div>
      )}
    </section>
  )
}

function ProviderForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: () => void | Promise<void>
}) {
  const [plane, setPlane] = useState<'admin' | 'customer'>('customer')
  const [vendor, setVendor] = useState<(typeof VENDORS)[number]['value']>('GOOGLE')
  const [clientID, setClientID] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [issuer, setIssuer] = useState('')
  const [jit, setJit] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsIssuer = VENDORS.find((v) => v.value === vendor)?.needsIssuer ?? false

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      await api.post('/api/v1/admin/sso-providers/', {
        plane,
        vendor,
        client_id: clientID.trim(),
        client_secret: clientSecret.trim(),
        issuer: issuer.trim(),
        jit_provisioning: jit,
      })
      await onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the provider.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-signal/20 bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">Add a sign-in provider</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Create an OAuth app with the provider first, then paste its credentials here. We'll show you
        the redirect URI to register once it's saved.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-ink">Sign-in page</Label>
          <select
            value={plane}
            onChange={(e) => setPlane(e.target.value as 'admin' | 'customer')}
            className="h-9 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink"
          >
            <option value="customer">Customer sign-in (/login)</option>
            <option value="admin">Staff sign-in (/super/login)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-ink">Provider</Label>
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value as typeof vendor)}
            className="h-9 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink"
          >
            {VENDORS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {needsIssuer && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sso-issuer" className="text-xs font-semibold text-ink">
              Issuer URL
            </Label>
            <Input
              id="sso-issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="https://your-org.okta.com"
              className="h-9 rounded-xl border-line bg-surface-2 text-sm"
            />
            <p className="font-mono text-[10px] text-ink-soft">
              We'll read /.well-known/openid-configuration from here.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="sso-client-id" className="text-xs font-semibold text-ink">
            Client ID
          </Label>
          <Input
            id="sso-client-id"
            value={clientID}
            onChange={(e) => setClientID(e.target.value)}
            className="h-9 rounded-xl border-line bg-surface-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sso-client-secret" className="text-xs font-semibold text-ink">
            Client secret
          </Label>
          <Input
            id="sso-client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="h-9 rounded-xl border-line bg-surface-2 text-sm"
          />
          <p className="font-mono text-[10px] text-ink-soft">
            Encrypted at rest and never shown again.
          </p>
        </div>

        {plane === 'customer' && (
          <label className="flex items-start gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={jit}
              onChange={(e) => setJit(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-line accent-signal"
            />
            <span className="text-xs leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">Create accounts automatically.</span> New people
              signing in with this provider get a Guardian account. Turn this off to allow only
              people who already have one.
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-alert/20 bg-alert/5 px-3 py-2 text-xs font-medium text-alert">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="signal"
          disabled={saving || !clientID.trim() || !clientSecret.trim() || (needsIssuer && !issuer.trim())}
          onClick={submit}
          className="rounded-xl text-xs"
        >
          {saving ? 'Saving…' : 'Save provider'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl border-line text-xs">
          Cancel
        </Button>
      </div>
    </section>
  )
}
