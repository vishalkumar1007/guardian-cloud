import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { PublicLayout } from './layouts/PublicLayout'
import { SuperShell } from './layouts/SuperShell'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SuperOverviewPage } from './pages/super/SuperOverviewPage'
import { SuperLoginPage } from './pages/super/SuperLoginPage'
import { AppearancePage } from './pages/super/AppearancePage'
import { AiPage } from './pages/super/AiPage'
import { OrganizationsPage } from './pages/super/OrganizationsPage'
import { UsersPage } from './pages/super/UsersPage'
import { DevicesPageSuper } from './pages/super/DevicesPageSuper'
import { AgentsPage } from './pages/super/AgentsPage'
import { PlansPage } from './pages/super/PlansPage'
import { SubscriptionsPage } from './pages/super/SubscriptionsPage'
import { SystemHealthPage } from './pages/super/SystemHealthPage'
import { AuditPage } from './pages/super/AuditPage'
import { SupportPage } from './pages/super/SupportPage'
import { SettingsPageSuper } from './pages/super/SettingsPageSuper'
import { TooltipProvider } from './components/ui/tooltip'

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
          {/* Public Website & Auth */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          <Route path="super/login" element={<SuperLoginPage />} />

          {/* Super Admin Control-Plane (protected) */}
          <Route path="super" element={<SuperShell />}>
            <Route index element={<SuperOverviewPage />} />
            <Route path="overview" element={<Navigate to="/super" replace />} />
            <Route path="ai" element={<AiPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="devices" element={<DevicesPageSuper />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="system-health" element={<SystemHealthPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="appearance" element={<Navigate to="/super/settings?tab=appearance" replace />} />
            <Route path="settings" element={<SettingsPageSuper />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
