import { useEffect, useState } from 'react'
import { API_BASE_URL, api, type Plane } from '../lib/apiClient'

export interface SSOProvider {
  slug: string
  vendor: 'GOOGLE' | 'GITHUB' | 'OKTA' | 'AZURE_AD' | 'GENERIC'
  display_name: string
  button_label: string
}

const PROVIDERS_PATH: Record<Plane, string> = {
  admin: '/api/v1/admin/auth/sso/providers',
  customer: '/api/v1/auth/sso/providers',
}

const START_PATH: Record<Plane, string> = {
  admin: '/api/v1/admin/auth/sso',
  customer: '/api/v1/auth/sso',
}

/**
 * Loads the social sign-in buttons a login page should show.
 *
 * The list is whatever a super admin has configured and enabled for this plane,
 * so enabling Google in Platform Settings makes the button appear here with no
 * code change. A failure returns an empty list rather than an error: password
 * sign-in still works, and a broken provider list must not block the page.
 */
export function useSSOProviders(plane: Plane): { providers: SSOProvider[]; loading: boolean } {
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const result = await api.get<{ items: SSOProvider[] }>(PROVIDERS_PATH[plane], {
          plane,
          suppressUnauthorized: true,
          signal: controller.signal,
          timeoutMs: 8000,
        })
        setProviders(result.items ?? [])
      } catch {
        setProviders([])
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [plane])

  return { providers, loading }
}

/**
 * The URL that begins a sign-in.
 *
 * A full page navigation, not a fetch: the browser has to leave for the
 * provider's consent screen and come back with a session cookie set.
 */
export function ssoStartURL(plane: Plane, slug: string, redirectAfter?: string): string {
  const base = `${API_BASE_URL}${START_PATH[plane]}/${encodeURIComponent(slug)}/start`
  if (!redirectAfter) return base
  return `${base}?redirect=${encodeURIComponent(redirectAfter)}`
}

/** Explains an `?error=` code the SSO callback redirected back with. */
export const SSO_ERROR_MESSAGE: Record<string, string> = {
  sso_cancelled: 'Sign-in was cancelled.',
  sso_expired: 'That sign-in attempt expired. Please try again.',
  sso_failed: 'Sign-in with that provider failed. Please try again.',
  sso_unavailable: 'That sign-in method is not available.',
  sso_misconfigured: 'That sign-in method is not configured correctly. Contact your administrator.',
  sso_no_email: 'That provider did not share an email address, so we could not sign you in.',
  sso_no_account:
    'No Guardian account matches that identity. Ask an administrator for an invitation.',
  sso_account_disabled: 'That account is not permitted to sign in.',
}
