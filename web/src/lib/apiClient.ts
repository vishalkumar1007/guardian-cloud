/**
 * The single HTTP client for the Guardian API.
 *
 * Before this existed, `fetch` was duplicated inline across the theme modules,
 * each with its own base-URL helper. Everything goes through here now so three
 * things are guaranteed in one place: cookies are always sent, the CSRF token is
 * always attached to unsafe methods, and a 401 always lands somewhere sensible.
 */

/**
 * Where the API lives, relative to the page.
 *
 * Empty by default, meaning same-origin: requests go to `/api/v1/...` and Vite's
 * dev proxy (and a production ingress) forwards them to the backend.
 *
 * This matters for more than tidiness. Sessions live in cookies, and pointing
 * the browser straight at the API's own origin makes them cross-site — a page on
 * localhost:5175 talking to 127.0.0.1:8083 is a *different site*, so SameSite=Lax
 * withholds the cookie on any POST. Sign-in still works (it needs no cookie) and
 * the next request fails with 401. Going through the same origin keeps every
 * cookie first-party and sidesteps CORS entirely.
 *
 * Set VITE_API_BASE_URL only when the API genuinely cannot be reached under the
 * app's own origin.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

/** Which identity plane a request belongs to. The two are entirely separate. */
export type Plane = 'admin' | 'customer'

const CSRF_COOKIE: Record<Plane, string> = {
  admin: 'guardian_admin_csrf',
  customer: 'guardian_csrf',
}

const LOGIN_PATH: Record<Plane, string> = {
  admin: '/super/login',
  customer: '/login',
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Why the server rejected a session, so the UI can explain rather than just bounce. */
export type UnauthorizedReason = 'idle_timeout' | 'expired' | 'account_disabled' | 'no_session'

export class ApiError extends Error {
  readonly status: number
  readonly reason?: UnauthorizedReason
  /** Populated on 423 lockout responses so the UI can count down. */
  readonly retryAfterSeconds?: number
  readonly body: Record<string, unknown>

  constructor(status: number, body: Record<string, unknown>) {
    super(typeof body.error === 'string' ? body.error : `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.reason = body.reason as UnauthorizedReason | undefined
    this.retryAfterSeconds =
      typeof body.retry_after_seconds === 'number' ? body.retry_after_seconds : undefined
  }
}

/**
 * Notified whenever the API reports the session is gone.
 *
 * AuthProvider subscribes so it can clear its own state and redirect once,
 * rather than every call site handling 401 for itself.
 */
type UnauthorizedHandler = (plane: Plane, reason: UnauthorizedReason) => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

/**
 * Read a cookie by name.
 *
 * Only ever used for the CSRF token, which is deliberately not httpOnly because
 * it has to be echoed back in a header. The session cookie is httpOnly and is
 * never readable here — that is the point.
 */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Thrown when a request could not reach the API at all, or timed out. */
export class NetworkError extends Error {
  readonly timedOut: boolean

  constructor(message: string, timedOut: boolean) {
    super(message)
    this.name = 'NetworkError'
    this.timedOut = timedOut
  }
}

export interface RequestOptions {
  method?: string
  body?: unknown
  plane?: Plane
  /** Skip the automatic redirect on 401, for calls that probe session state. */
  suppressUnauthorized?: boolean
  signal?: AbortSignal
  /**
   * Abort after this many milliseconds. A cold API container can take several
   * seconds to answer its first request, so callers on the startup path should
   * allow generously rather than failing fast.
   */
  timeoutMs?: number
}

/**
 * Perform an API request.
 *
 * `credentials: 'include'` is mandatory: session cookies are httpOnly and the
 * dev frontend runs on a different port to the API, so the browser will not
 * attach them otherwise.
 */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, plane = 'admin', suppressUnauthorized, signal, timeoutMs } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (!SAFE_METHODS.has(method.toUpperCase())) {
    const csrf = readCookie(CSRF_COOKIE[plane])
    if (csrf) headers['X-CSRF-Token'] = csrf
  }

  // A timeout is its own abort signal, combined with any the caller passed so
  // an unmounting component can still cancel.
  const controller = new AbortController()
  const timer = timeoutMs ? window.setTimeout(() => controller.abort(), timeoutMs) : undefined
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    // Distinguish "we gave up waiting" from "the server is unreachable": the
    // first is worth retrying, and the two need different wording.
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    if (aborted && signal?.aborted) throw error

    // A rejected CORS response is indistinguishable from an unreachable server
    // here — the browser deliberately hides the difference from script. Since a
    // wrong or stale origin allowlist is by far the more common cause in
    // development, the message names both rather than guessing.
    throw new NetworkError(
      aborted
        ? 'The Guardian API did not respond in time.'
        : `Could not reach the Guardian API at ${API_BASE_URL}. It may be stopped, or it may be rejecting this origin (${window.location.origin}) — check the API's CORS allowlist.`,
      aborted,
    )
  } finally {
    if (timer !== undefined) window.clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }

  if (response.status === 204) return undefined as T

  const raw = await response.text()
  let parsed: Record<string, unknown> = {}
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      parsed = { error: raw }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !suppressUnauthorized) {
      onUnauthorized?.(plane, (parsed.reason as UnauthorizedReason) ?? 'no_session')
    }
    throw new ApiError(response.status, parsed)
  }

  return parsed as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE', body }),
}

export function loginPathFor(plane: Plane): string {
  return LOGIN_PATH[plane]
}
