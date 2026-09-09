import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  NetworkError,
  api,
  setUnauthorizedHandler,
  type Plane,
  type UnauthorizedReason,
} from '../lib/apiClient'
import type { AuthUser, LoginResponse } from './types'

/**
 * Holds the signed-in caller, and resolves what the app should show before any
 * auth-dependent route renders.
 *
 * Startup asks two questions — has Guardian been set up at all, and is anyone
 * signed in — and both are answered in a single `initState` phase. Screens wait
 * on that one flag rather than each deciding for itself, which is what stops the
 * login form flashing before a redirect to setup (or vice versa).
 *
 * The session itself lives in an httpOnly cookie the browser attaches
 * automatically, so there is no token here to read or steal.
 */

/** Startup phases. Nothing auth-dependent renders until this leaves 'loading'. */
export type InitState = 'loading' | 'ready' | 'error'

interface AuthContextValue {
  user: AuthUser | null
  plane: Plane

  initState: InitState
  /** Human-readable reason startup failed, shown with a retry control. */
  initError: string | null
  /** True when no super admin exists yet and first-run setup should be shown. */
  setupRequired: boolean
  retryInit: () => void

  /** Why the last session ended, so the login page can explain it. */
  endedReason: UnauthorizedReason | null

  login: (email: string, password: string) => Promise<LoginResponse>
  verifyMfa: (code: string, method: string) => Promise<LoginResponse>
  logout: () => Promise<void>
  refresh: () => Promise<AuthUser | null>
  can: (permission: string) => boolean
  clearEndedReason: () => void
  /** Re-reads setup status, for the moment setup completes. */
  refreshSetupStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const BASE_PATH: Record<Plane, string> = {
  admin: '/api/v1/admin/auth',
  customer: '/api/v1/auth',
}

/**
 * Startup request budget.
 *
 * Generous on purpose: a cold API container answering its first query, or one
 * still running migrations, can legitimately take several seconds. Failing fast
 * here would show an error to someone whose stack is merely still starting.
 */
const INIT_TIMEOUT_MS = 10_000
const INIT_RETRIES = 2
const INIT_RETRY_DELAY_MS = 1_200

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function AuthProvider({ plane, children }: { plane: Plane; children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initState, setInitState] = useState<InitState>('loading')
  const [initError, setInitError] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [endedReason, setEndedReason] = useState<UnauthorizedReason | null>(null)

  // Mirrors `user` so the 401 handler below can read it without being
  // re-created on every sign-in. Synced in an effect rather than assigned during
  // render, which React does not permit for refs.
  const userRef = useRef<AuthUser | null>(null)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const base = BASE_PATH[plane]

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      // Suppressed: a 401 here is the ordinary "not signed in" answer, not a
      // session that just died.
      const me = await api.get<AuthUser>(`${base}/me`, { plane, suppressUnauthorized: true })
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    }
  }, [base, plane])

  const fetchSetupStatus = useCallback(async (): Promise<boolean> => {
    // Only the staff plane has a first-run setup; customers sign up normally.
    if (plane !== 'admin') return false
    const result = await api.get<{ setup_required: boolean }>('/api/v1/admin/auth/setup-status', {
      plane,
      suppressUnauthorized: true,
      timeoutMs: INIT_TIMEOUT_MS,
    })
    return Boolean(result.setup_required)
  }, [plane])

  /**
   * Resolve everything the first render depends on.
   *
   * Retries transient network failures a couple of times before surfacing an
   * error, so a dev server that is a second from ready does not greet the user
   * with a failure they would only have to dismiss.
   */
  const bootstrap = useCallback(async () => {
    setInitState('loading')
    setInitError(null)

    for (let attempt = 0; attempt <= INIT_RETRIES; attempt++) {
      try {
        const needsSetup = await fetchSetupStatus()
        setSetupRequired(needsSetup)

        // With no admin account there is nothing to be signed in as, so the
        // session probe is skipped entirely.
        if (!needsSetup) await refresh()

        setInitState('ready')
        return
      } catch (error) {
        const isLast = attempt === INIT_RETRIES

        // A definite answer from the server is not worth retrying.
        if (error instanceof ApiError) {
          // A 404 here means the API is running but is an older build that
          // predates this endpoint — almost always a stale container still
          // serving the port. Saying so beats "something went wrong".
          setInitError(
            error.status === 404
              ? 'The Guardian API is running an older version that does not support this app. Rebuild and restart the API, then try again.'
              : 'Guardian could not report its setup status. The API responded, but with an error.',
          )
          setInitState('error')
          return
        }

        if (isLast) {
          setInitError(
            error instanceof NetworkError
              ? error.message
              : 'Something went wrong starting the Guardian console.',
          )
          setInitState('error')
          return
        }

        await delay(INIT_RETRY_DELAY_MS * (attempt + 1))
      }
    }
  }, [fetchSetupStatus, refresh])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  // One handler for every 401 the app produces, so a session that expires
  // mid-use clears state once instead of at each call site.
  useEffect(() => {
    setUnauthorizedHandler((failedPlane, reason) => {
      if (failedPlane !== plane) return
      if (!userRef.current) return
      setUser(null)
      setEndedReason(reason)
    })
    return () => setUnauthorizedHandler(null)
  }, [plane])

  const refreshSetupStatus = useCallback(async () => {
    try {
      setSetupRequired(await fetchSetupStatus())
    } catch {
      // Leave the last known value; the caller is mid-flow and a transient
      // failure here should not strand them on an error screen.
    }
  }, [fetchSetupStatus])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      const result = await api.post<LoginResponse>(`${base}/login`, { email, password }, { plane })
      // Only a fully authenticated result carries a session; the MFA statuses
      // deliberately do not, and must not populate the user.
      if (result.status === 'authenticated') {
        setEndedReason(null)
        await refresh()
      }
      return result
    },
    [base, plane, refresh],
  )

  const verifyMfa = useCallback(
    async (code: string, method: string): Promise<LoginResponse> => {
      const result = await api.post<LoginResponse>(`${base}/login/mfa`, { code, method }, { plane })
      if (result.status === 'authenticated') {
        setEndedReason(null)
        await refresh()
      }
      return result
    },
    [base, plane, refresh],
  )

  const logout = useCallback(async () => {
    try {
      await api.post(`${base}/logout`, undefined, { plane, suppressUnauthorized: true })
    } catch (error) {
      // An already-dead session still needs to clear locally; anything else is
      // worth surfacing.
      if (!(error instanceof ApiError) || error.status !== 401) throw error
    } finally {
      setUser(null)
      setEndedReason(null)
    }
  }, [base, plane])

  const can = useCallback(
    (permission: string) => Boolean(user?.permissions?.includes(permission)),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      plane,
      initState,
      initError,
      setupRequired,
      retryInit: () => void bootstrap(),
      endedReason,
      login,
      verifyMfa,
      logout,
      refresh,
      can,
      clearEndedReason: () => setEndedReason(null),
      refreshSetupStatus,
    }),
    [
      user,
      plane,
      initState,
      initError,
      setupRequired,
      bootstrap,
      endedReason,
      login,
      verifyMfa,
      logout,
      refresh,
      can,
      refreshSetupStatus,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
