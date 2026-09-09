/**
 * Compatibility shims for the per-user settings APIs.
 *
 * These used to fabricate a super-admin session in localStorage and identify the
 * caller with an `X-User-Id` header the server simply trusted. Authentication is
 * now a real httpOnly session cookie (see auth/AuthProvider), so identity is
 * established by the browser attaching that cookie and these helpers no longer
 * carry any.
 *
 * They remain as no-ops purely so the theme and navigation modules keep their
 * current shape; they go away with the rest of the legacy path once
 * AUTH_LEGACY_MODE is switched off server-side.
 */

const SESSION_KEY = 'super_admin_session'

/**
 * Previously created a fake session when none existed. Now it only clears any
 * stale object left over from before the cutover, so nothing downstream reads a
 * user id that the server would not agree with.
 */
export function ensureSessionUserId(): string {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Private browsing or blocked storage; nothing to clean up.
  }
  return ''
}

/**
 * No headers are needed any more: the session travels as an httpOnly cookie,
 * which requests must send with `credentials: 'include'`.
 */
export function getSuperAdminAuthHeaders(): Record<string, string> {
  return {}
}
