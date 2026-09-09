import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { PublicLayout } from './layouts/PublicLayout'
import { LandingPage } from './pages/LandingPage'
import { AdminAuthScope, AdminConsoleScope, CustomerAuthScope } from './auth/PlaneScopes'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/app/CustomerAuthPages'
import { CustomerMfaChallengePage, CustomerMfaEnrollPage } from './pages/app/CustomerMfaPages'
import { PersonalShell } from './pages/app/PersonalShell'
import {
  PersonalOverviewPage,
  PersonalDevicesPage,
  PersonalSecurityPage,
  PersonalProfilePage,
} from './pages/app/PersonalPages'
import { SuperLoginPage } from './pages/super/SuperLoginPage'
import { SuperSetupPage } from './pages/super/SuperSetupPage'
import { SuperMfaChallengePage } from './pages/super/SuperMfaChallengePage'
import { SuperMfaEnrollPage } from './pages/super/SuperMfaEnrollPage'
import { RequireAuth } from './auth/RequireAuth'
import { AuthBoundary } from './auth/AuthBoundary'
import { AccountSecurityPage } from './pages/admin/account/AccountSecurityPage'
import { TooltipProvider } from './components/ui/tooltip'

// Guardian Super Admin Control Plane Components
import { SuperAdminShell } from './layouts/SuperAdminShell'
import { SettingsLayout } from './layouts/SettingsLayout'

// Pages
import { SuperAdminOverview } from './pages/admin/overview/SuperAdminOverview'
import { OrganizationListPage } from './pages/admin/organizations/OrganizationListPage'
import { OrganizationDetailPage } from './pages/admin/organizations/OrganizationDetailPage'
import { OrganizationOnboardingPage } from './pages/admin/organizations/OrganizationOnboardingPage'

import { UserListPage } from './pages/admin/users/UserListPage'
import { UserDetailPage } from './pages/admin/users/UserDetailPage'

import { DeviceListPage } from './pages/admin/devices/DeviceListPage'
import { DeviceDetailPage } from './pages/admin/devices/DeviceDetailPage'

import { PlansPage } from './pages/admin/plans/PlansPage'
import { PlanDetailPage } from './pages/admin/plans/PlanDetailPage'
import { SubscriptionsPage } from './pages/admin/plans/SubscriptionsPage'
import { UsagePage } from './pages/admin/plans/UsagePage'

import { SecurityOverviewPage } from './pages/admin/security/SecurityOverviewPage'
import { SecurityEventsPage } from './pages/admin/security/SecurityEventsPage'
import { IncidentsPage } from './pages/admin/security/IncidentsPage'
import { AlertsPage } from './pages/admin/security/AlertsPage'
import { RiskAnalysisPage } from './pages/admin/security/RiskAnalysisPage'

import { AdminUsersPage } from './pages/admin/iam/AdminUsersPage'
import { AdminUserDetailPage } from './pages/admin/iam/AdminUserDetailPage'
import { RolesPage } from './pages/admin/iam/RolesPage'
import { RoleDetailPage } from './pages/admin/iam/RoleDetailPage'
import { PermissionsMatrixPage } from './pages/admin/iam/PermissionsMatrixPage'
import { TeamsPage } from './pages/admin/iam/TeamsPage'
import { InvitationsPage } from './pages/admin/iam/InvitationsPage'
import { SessionsPage } from './pages/admin/iam/SessionsPage'
import { AccessReviewsPage } from './pages/admin/iam/AccessReviewsPage'

import { AuditLogPage } from './pages/admin/audit/AuditLogPage'

import { PlatformOverviewPage } from './pages/admin/platform/PlatformOverviewPage'
import { SystemHealthPage } from './pages/admin/platform/SystemHealthPage'
import { ServicesPage } from './pages/admin/platform/ServicesPage'
import { AgentReleasesPage } from './pages/admin/platform/AgentReleasesPage'
import { FeatureFlagsPage } from './pages/admin/platform/FeatureFlagsPage'
import { MaintenancePage } from './pages/admin/platform/MaintenancePage'

import { SettingsPages } from './pages/admin/settings/SettingsPages'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Marketing site. */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
          </Route>

          {/* ======================================================== */}
          {/* CUSTOMER PLANE (/login, /signup, /app)                   */}
          {/* A separate identity domain from Guardian staff, with its  */}
          {/* own cookie; it must never share auth state with /admin.   */}
          {/* ======================================================== */}
          <Route element={<CustomerAuthScope />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            {/* Follow-on sign-in steps; no session yet, only a challenge cookie. */}
            <Route path="login/mfa" element={<CustomerMfaChallengePage />} />
            <Route path="login/enroll-mfa" element={<CustomerMfaEnrollPage />} />

            <Route
              path="app"
              element={
                <RequireAuth>
                  <PersonalShell />
                </RequireAuth>
              }
            >
              <Route index element={<PersonalOverviewPage />} />
              <Route path="devices" element={<PersonalDevicesPage />} />
              <Route path="security" element={<PersonalSecurityPage />} />
              <Route path="profile" element={<PersonalProfilePage />} />
            </Route>
          </Route>

          {/* ======================================================== */}
          {/* GUARDIAN STAFF PLANE (/super/*, /admin)                  */}
          {/* A separate identity domain from customers, with its own   */}
          {/* cookie. Scoped here so public pages never probe it.       */}
          {/* ======================================================== */}
          <Route element={<AdminAuthScope />}>
            {/* First-run setup. Redirects to sign-in once an admin exists. */}
            <Route path="super/setup" element={<AuthBoundary><SuperSetupPage /></AuthBoundary>} />
            <Route path="super/login" element={<SuperLoginPage />} />
            {/* The two follow-on steps of signing in. Neither has a session yet:
                both run on the short-lived challenge cookie the login issued. */}
            <Route path="super/login/mfa" element={<SuperMfaChallengePage />} />
            <Route path="super/login/enroll-mfa" element={<SuperMfaEnrollPage />} />

            {/* ======================================================== */}
            {/* GUARDIAN SUPER ADMIN CONTROL PLANE ROUTES (/admin)       */}
            {/* ======================================================== */}
            <Route
              path="admin"
              element={
                <RequireAuth>
                  <AdminConsoleScope>
                    <SuperAdminShell />
                  </AdminConsoleScope>
                </RequireAuth>
              }
            >
              {/* 1. Overview */}
              <Route index element={<SuperAdminOverview />} />
              <Route path="overview" element={<Navigate to="/admin" replace />} />

              {/* 2. Organizations */}
              <Route path="organizations" element={<OrganizationListPage />} />
              <Route path="organizations/new" element={<OrganizationOnboardingPage />} />
              <Route path="organizations/:id" element={<OrganizationDetailPage />} />

              {/* 3. Individual Users */}
              <Route path="users" element={<UserListPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />

              {/* 4. Devices */}
              <Route path="devices" element={<DeviceListPage />} />
              <Route path="devices/:id" element={<DeviceDetailPage />} />

              {/* 5. Plans, Subscriptions & Usage */}
              <Route path="plans" element={<PlansPage />} />
              <Route path="plans/:id" element={<PlanDetailPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="usage" element={<UsagePage />} />

              {/* 6. Security */}
              <Route path="security" element={<SecurityOverviewPage />} />
              <Route path="security/events" element={<SecurityEventsPage />} />
              <Route path="security/incidents" element={<IncidentsPage />} />
              <Route path="security/alerts" element={<AlertsPage />} />
              <Route path="security/risk" element={<RiskAnalysisPage />} />

              {/* 7. Guardian IAM */}
              <Route path="iam/users" element={<AdminUsersPage />} />
              <Route path="iam/users/:id" element={<AdminUserDetailPage />} />
              <Route path="iam/roles" element={<RolesPage />} />
              <Route path="iam/roles/:id" element={<RoleDetailPage />} />
              <Route path="iam/permissions" element={<PermissionsMatrixPage />} />
              <Route path="iam/teams" element={<TeamsPage />} />
              <Route path="iam/invitations" element={<InvitationsPage />} />
              <Route path="iam/sessions" element={<SessionsPage />} />
              <Route path="iam/access-reviews" element={<AccessReviewsPage />} />

              {/* 8. Audit */}
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="audit/admin-actions" element={<AuditLogPage forcedCategory="ADMIN_ACTION" />} />
              <Route path="audit/security-actions" element={<AuditLogPage forcedCategory="SECURITY_ACTION" />} />
              <Route path="audit/data-access" element={<AuditLogPage forcedCategory="DATA_ACCESS" />} />

              {/* 9. Platform Operations */}
              <Route path="platform" element={<PlatformOverviewPage />} />
              <Route path="platform/health" element={<SystemHealthPage />} />
              <Route path="platform/services" element={<ServicesPage />} />
              <Route path="platform/agents" element={<AgentReleasesPage />} />
              <Route path="platform/features" element={<FeatureFlagsPage />} />
              <Route path="platform/maintenance" element={<MaintenancePage />} />

              {/* Direct Theme / Appearance shortcuts */}
              <Route path="appearance" element={<Navigate to="/admin/settings/appearance" replace />} />
              <Route path="theme" element={<Navigate to="/admin/settings/appearance" replace />} />

              {/* 10. Platform Settings */}
              <Route path="account" element={<AccountSecurityPage />} />
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/admin/settings/general" replace />} />
                <Route path=":section" element={<SettingsPages />} />
              </Route>
            </Route>
          </Route>

          {/* Mirror /super/* directly to /admin/*. Outside the staff scope:
              these only redirect and need no identity context. */}
          <Route path="super/appearance" element={<Navigate to="/admin/settings/appearance" replace />} />
          <Route path="super/settings" element={<Navigate to="/admin/settings/appearance" replace />} />
          <Route path="super/*" element={<Navigate to="/admin" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
