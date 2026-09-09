import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminThemeProvider } from '../theme/adminTheme'
import { NavPrefsProvider } from '../theme/navPrefs'
import { AuthProvider } from './AuthProvider'

/**
 * Route-scoped provider boundaries.
 *
 * These exist so a page only ever calls the API it actually belongs to. The
 * providers used to be mounted at the app root, which meant the public landing
 * page fired a staff session probe, a first-run setup check and two per-admin
 * preference requests — all of them 401s that had nothing to do with the page
 * being viewed.
 *
 * Each scope is a pathless layout route, so mounting is driven by the URL and a
 * provider's requests begin only when someone navigates into its area.
 */

/**
 * Staff identity, for the sign-in screens and the console.
 *
 * Wraps /super/* as well as /admin, because signing in, first-run setup and MFA
 * enrolment all need the staff session context before a session exists.
 */
export function AdminAuthScope() {
  return (
    <AuthProvider plane="admin">
      <Outlet />
    </AuthProvider>
  )
}

/** Customer identity, for /login, /signup and the personal portal. */
export function CustomerAuthScope() {
  return (
    <AuthProvider plane="customer">
      <Outlet />
    </AuthProvider>
  )
}

/**
 * Per-admin console preferences: dashboard theme and navigation layout.
 *
 * Deliberately mounted inside RequireAuth rather than alongside it. Both fetch
 * settings that belong to a signed-in staff member, so mounting them any earlier
 * guarantees a 401 on every visit to a sign-in page.
 */
export function AdminConsoleScope({ children }: { children: ReactNode }) {
  return (
    <NavPrefsProvider>
      <AdminThemeProvider>{children}</AdminThemeProvider>
    </NavPrefsProvider>
  )
}
