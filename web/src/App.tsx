import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { PublicLayout } from './layouts/PublicLayout'
import { SuperShell } from './layouts/SuperShell'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SuperOverviewPage } from './pages/super/SuperOverviewPage'
import { SuperSetupPage } from './pages/super/SuperSetupPage'
import { AppearancePage } from './pages/super/AppearancePage'
import { AiPage } from './pages/super/AiPage'
import { SuperPlaceholderPage } from './pages/super/SuperPlaceholderPage'
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

          {/* Super Admin Control-Plane */}
          <Route path="super" element={<SuperShell />}>
            <Route index element={<SuperOverviewPage />} />
            <Route path="setup" element={<SuperSetupPage />} />
            <Route path="overview" element={<Navigate to="/super" replace />} />
            <Route path="ai" element={<AiPage />} />
            <Route path="appearance" element={<AppearancePage />} />
            <Route path="organizations" element={<SuperPlaceholderPage title="Organizations" subtitle="Manage tenant organizations, zero-trust policies, and isolation." tag="Tenants" metricTitle="Active Orgs" metricValue="128 Active" />} />
            <Route path="users" element={<SuperPlaceholderPage title="Platform Users" subtitle="Control-plane platform administrators and enterprise role memberships." tag="Identity" metricTitle="Super Admins" metricValue="2 Seeded" />} />
            <Route path="devices" element={<SuperPlaceholderPage title="Fleet Devices" subtitle="Hardware endpoints enrolled across macOS, Windows, and Linux." tag="Hardware" metricTitle="Enclave Guarded" metricValue="4,210 Nodes" />} />
            <Route path="agents" element={<SuperPlaceholderPage title="Rust Core Agents" subtitle="Agent binary builds, hash verification, and OTA auto-upgrade channels." tag="Daemons" metricTitle="Latest Version" metricValue="v1.4.2" />} />
            <Route path="plans" element={<SuperPlaceholderPage title="Subscription Plans" subtitle="Personal Basic (900c) and Enterprise fleet licensing tiers." tag="Pricing" metricTitle="Tiers" metricValue="3 Plans" />} />
            <Route path="subscriptions" element={<SuperPlaceholderPage title="Active Subscriptions" subtitle="Recurring billing status, seat quotas, and usage telemetry." tag="Billing" metricTitle="MRR Status" metricValue="Healthy" />} />
            <Route path="system-health" element={<SuperPlaceholderPage title="System Health & Migrations" subtitle="Database connection pool, Redis cache, and Goose migration version 10." tag="Telemetry" metricTitle="DB Status" metricValue="Goose v10 OK" />} />
            <Route path="audit" element={<SuperPlaceholderPage title="Platform Audit Trail" subtitle="Cryptographically sealed ledger of all SUPER_ADMIN and system actions." tag="Audit Log" metricTitle="Sealed Events" metricValue="100% Immutable" />} />
            <Route path="support" element={<SuperPlaceholderPage title="Support & Security Tickets" subtitle="Customer incident escalations and emergency hardware lock tickets." tag="Support" metricTitle="Open Queue" metricValue="7 Tickets" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
