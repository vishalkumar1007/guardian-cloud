/** Shared super-admin session helpers for personal settings APIs. */

export const SEEDED_SUPERADMIN_UUID = '00000000-0000-4000-8000-0000000000bb'
const SESSION_KEY = 'super_admin_session'

const DEMO_EMAILS = new Set([
  'superadmin@guardian.local',
  'alexander.vance@guardian.internal',
])

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

function newUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export type SuperAdminSession = {
  id: string
  email?: string
  role?: string
  name?: string
  at?: number
  rememberMe?: boolean
  tenantId?: string
  tenant_id?: string
}

/** Resolve API user id from session id (maps demo-session → seeded UUID). */
export function resolveApiUserId(sessionId: string | null | undefined): string | null {
  if (!sessionId) return null
  if (sessionId === 'demo-session') return SEEDED_SUPERADMIN_UUID
  if (isUuid(sessionId)) return sessionId
  return null
}

/**
 * Ensure super_admin_session always has a stable UUID id.
 * Patches existing sessions that only stored email.
 */
export function ensureSessionUserId(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw) as SuperAdminSession
      const mapped = resolveApiUserId(s?.id ? String(s.id) : null)
      if (mapped) return mapped

      // Session exists but id missing/invalid — assign stable id and persist
      const email = s?.email ? String(s.email).toLowerCase() : ''
      const id =
        DEMO_EMAILS.has(email) || !email
          ? 'demo-session'
          : newUuid()
      const next = { ...s, id }
      localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return resolveApiUserId(id) || SEEDED_SUPERADMIN_UUID
    }
  } catch {}

  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: 'demo-session',
        email: 'alexander.vance@guardian.internal',
        role: 'SUPER_ADMIN',
        name: 'Alexander Vance',
      }),
    )
  } catch {}
  return SEEDED_SUPERADMIN_UUID
}

/** Build auth headers for personal admin APIs. */
export function getSuperAdminAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {}
  try {
    const uid = ensureSessionUserId()
    if (uid) h['X-User-Id'] = uid
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw) as SuperAdminSession
      if (s?.tenantId || s?.tenant_id) h['X-Tenant-Id'] = String(s.tenantId || s.tenant_id)
      if (s?.email) h['X-User-Email'] = String(s.email)
    }
  } catch {}
  return h
}

/** Build session payload for login (stable id per email). */
export function buildLoginSession(email: string, rememberMe: boolean): SuperAdminSession {
  const normalized = email.trim().toLowerCase()
  const id = DEMO_EMAILS.has(normalized) ? 'demo-session' : newUuid()
  return {
    id,
    email: email.trim(),
    role: 'SUPER_ADMIN',
    at: Date.now(),
    rememberMe,
  }
}
