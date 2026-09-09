import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { loginPathFor } from '../lib/apiClient'
import { AuthBoundary } from './AuthBoundary'
import { useAuth } from './AuthProvider'

/**
 * Gate a route behind a session.
 *
 * This replaces the block in SuperAdminShell that used to *create* a fake
 * super-admin session in localStorage when none existed, which made the entire
 * console reachable by anyone who typed the URL.
 *
 * AuthBoundary runs first, so by the time the checks below execute both "has
 * Guardian been set up" and "is anyone signed in" are settled answers rather
 * than in-flight requests.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <AuthBoundary>
      <AuthenticatedOnly>{children}</AuthenticatedOnly>
    </AuthBoundary>
  )
}

function AuthenticatedOnly({ children }: { children: ReactNode }) {
  const { user, setupRequired, plane } = useAuth()
  const location = useLocation()

  // Nothing to sign in as yet: take ownership of the instance first.
  if (setupRequired) {
    return <Navigate to="/super/setup" replace />
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to={loginPathFor(plane)} replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

/**
 * Gate a route behind a permission.
 *
 * Cosmetic only — the API enforces the same permission server-side. This exists
 * so a staff member is not shown a page that will only fail once they open it.
 */
export function RequirePermission({
  permission,
  children,
  fallback,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can } = useAuth()

  if (!can(permission)) {
    return <>{fallback ?? <PermissionDenied permission={permission} />}</>
  }
  return <>{children}</>
}

function PermissionDenied({ permission }: { permission: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-xl font-bold text-ink">Not available to your role</h1>
      <p className="mt-2 text-sm text-ink-soft">
        This page needs the <code className="font-mono text-xs text-ink">{permission}</code>{' '}
        permission. Ask a Guardian super admin if you need access.
      </p>
    </div>
  )
}
