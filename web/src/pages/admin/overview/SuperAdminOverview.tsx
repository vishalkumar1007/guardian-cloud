import React from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Laptop,
  Radio,
  CreditCard,
  DollarSign,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { MetricCard } from '../../../components/admin/MetricCard'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'

// Realistic 6-month historical trends
const CUSTOMER_GROWTH_DATA = [
  { month: 'Apr', organizations: 4, users: 1100, mrr: 58000 },
  { month: 'May', organizations: 5, users: 1520, mrr: 72000 },
  { month: 'Jun', organizations: 6, users: 2100, mrr: 88000 },
  { month: 'Jul', organizations: 6, users: 2750, mrr: 104000 },
  { month: 'Aug', organizations: 7, users: 3400, mrr: 121000 },
  { month: 'Sep', organizations: 8, users: 4320, mrr: 149150 },
]

const SUBSCRIPTION_TIER_DATA = [
  { name: 'Enterprise', value: 64, color: '#f97316' },
  { name: 'Business Plus', value: 148, color: '#38bdf8' },
  { name: 'Business', value: 312, color: '#818cf8' },
  { name: 'Personal', value: 2840, color: '#34d399' },
  { name: 'Free', value: 1420, color: '#64748b' },
]

const DEVICE_GROWTH_DATA = [
  { week: 'W1', macos: 1420, windows: 1980, linux: 650 },
  { week: 'W2', macos: 1510, windows: 2040, linux: 690 },
  { week: 'W3', macos: 1680, windows: 2180, linux: 720 },
  { week: 'W4', macos: 1840, windows: 2350, linux: 790 },
]

const SECURITY_EVENTS_DATA = [
  { time: '00:00', blocked: 42, quarantined: 2, monitored: 310 },
  { time: '04:00', blocked: 28, quarantined: 1, monitored: 240 },
  { time: '08:00', blocked: 94, quarantined: 7, monitored: 890 },
  { time: '12:00', blocked: 142, quarantined: 12, monitored: 1240 },
  { time: '16:00', blocked: 88, quarantined: 4, monitored: 780 },
  { time: '20:00', blocked: 51, quarantined: 3, monitored: 410 },
]

const INCIDENT_TREND_DATA = [
  { day: 'Mon', open: 3, resolved: 5 },
  { day: 'Tue', open: 4, resolved: 6 },
  { day: 'Wed', open: 2, resolved: 4 },
  { day: 'Thu', open: 5, resolved: 7 },
  { day: 'Fri', open: 3, resolved: 4 },
  { day: 'Sat', open: 2, resolved: 3 },
  { day: 'Sun', open: 3, resolved: 2 },
]

export function SuperAdminOverview() {
  const metrics = useAdminData(() => adminService.getMetrics())
  const services = useAdminData(() => adminService.getServicesHealth())
  const auditLogs = useAdminData(() => adminService.getAuditLogs().slice(0, 5))
  const incidents = useAdminData(() => adminService.getIncidents().slice(0, 3))

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/80 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
            Platform Command Center
            <span className="rounded border border-signal/30 bg-signal/10 px-2 py-0.5 text-[10px] font-mono text-signal uppercase tracking-widest font-semibold">
              Live Fleet
            </span>
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-1">
            Real-time telemetry, tenant posture, and infrastructure metrics for Guardian SaaS.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Link
            to="/admin/organizations/new"
            className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white font-medium shadow-sm transition-colors flex items-center gap-1.5 no-underline"
          >
            <span>+ Onboard Organization</span>
          </Link>
          <Link
            to="/admin/security/incidents"
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-ink hover:bg-surface-2 transition-colors flex items-center gap-1.5 no-underline"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            <span>SOC War Room</span>
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Organizations"
          value={metrics.totalOrganizations}
          change="+12% MoM"
          trend="up"
          subtitle={`${metrics.activeOrganizations} active`}
          to="/admin/organizations"
          icon={Building2}
        />
        <MetricCard
          title="Individual Users"
          value={metrics.totalUsers.toLocaleString()}
          change="+24% MoM"
          trend="up"
          subtitle="Personal & org users"
          to="/admin/users"
          icon={Users}
        />
        <MetricCard
          title="Managed Devices"
          value={metrics.managedDevices.toLocaleString()}
          change="+18% MoM"
          trend="up"
          subtitle="macOS, Win, Linux"
          to="/admin/devices"
          icon={Laptop}
        />
        <MetricCard
          title="Active Agents"
          value={metrics.activeAgents.toLocaleString()}
          change="98.2% online"
          trend="up"
          subtitle="Heartbeat < 60s"
          to="/admin/devices?status=ONLINE"
          icon={Radio}
        />
        <MetricCard
          title="Subscriptions"
          value={metrics.activeSubscriptions.toLocaleString()}
          change="99.4% retention"
          trend="up"
          subtitle="Enterprise & Personal"
          to="/admin/subscriptions"
          icon={CreditCard}
        />
        <MetricCard
          title="Platform MRR"
          value={`$${metrics.mrr.toLocaleString()}`}
          change="+15.4% Q3"
          trend="up"
          subtitle="Monthly Recurring"
          to="/admin/plans"
          icon={DollarSign}
        />
        <MetricCard
          title="Open Incidents"
          value={metrics.openIncidents}
          change="2 Critical"
          trend="down"
          subtitle="Under SOC triage"
          to="/admin/security/incidents"
          icon={AlertOctagon}
          variant={metrics.openIncidents > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          title="Critical Alerts"
          value={metrics.criticalAlerts}
          change="Response < 8m"
          trend="neutral"
          subtitle="Unacknowledged"
          to="/admin/security/alerts"
          icon={ShieldAlert}
          variant={metrics.criticalAlerts > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Row 2: Customer Growth Chart & Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold text-ink">Customer & Revenue Growth</h2>
              <p className="text-[11px] font-mono text-ink-soft">Monthly recurring revenue ($) and onboarded tenants</p>
            </div>
            <span className="font-mono text-xs text-signal font-semibold">$149,150 MRR</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CUSTOMER_GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--g-signal)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--g-signal)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--g-surface)", borderColor: "var(--g-border)", borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                  itemStyle={{ color: "var(--g-ink)" }}
                />
                <Area type="monotone" dataKey="mrr" stroke="var(--g-signal)" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" name="MRR ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink">Subscription Distribution</h2>
            <p className="text-[11px] font-mono text-ink-soft">Breakdown by plan tier license volume</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SUBSCRIPTION_TIER_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                  {SUBSCRIPTION_TIER_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--g-surface)", borderColor: "var(--g-border)", borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1">
            {SUBSCRIPTION_TIER_DATA.map((t) => (
              <div key={t.name} className="flex items-center gap-1.5 text-ink-soft">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="truncate">{t.name}: {t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Device Growth & Security Event Volume & Incident Trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device Growth by Platform */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Device Growth by OS</h2>
            <Link to="/admin/devices" className="text-[11px] font-mono text-signal hover:underline">View Fleet</Link>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEVICE_GROWTH_DATA}>
                <XAxis dataKey="week" stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--g-surface)", borderColor: "var(--g-border)", borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                />
                <Bar dataKey="macos" fill="#818cf8" stackId="a" name="macOS" />
                <Bar dataKey="windows" fill="#38bdf8" stackId="a" name="Windows" />
                <Bar dataKey="linux" fill="#34d399" stackId="a" name="Linux" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Events Stream */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Security Event Volume</h2>
            <Link to="/admin/security/events" className="text-[11px] font-mono text-signal hover:underline">Events</Link>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SECURITY_EVENTS_DATA}>
                <XAxis dataKey="time" stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--g-surface)", borderColor: "var(--g-border)", borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Threats Blocked" />
                <Area type="monotone" dataKey="monitored" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.1} name="Monitored" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Trend */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Incident MTTR Trend</h2>
            <Link to="/admin/security/incidents" className="text-[11px] font-mono text-signal hover:underline">Incidents</Link>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={INCIDENT_TREND_DATA}>
                <XAxis dataKey="day" stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--g-ink-soft)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--g-surface)", borderColor: "var(--g-border)", borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="open" stroke="var(--g-signal)" strokeWidth={2} name="Opened" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: System Health Panel & Security Overview & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health Panel */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-400" /> System Health
            </h2>
            <Link to="/admin/platform/health" className="text-[11px] font-mono text-ink-soft hover:text-ink">
              Full Status →
            </Link>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-2/60 border border-line/60"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-ink truncate max-w-[150px]">{srv.name}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-soft text-[11px]">
                  <span>{srv.latencyMs}ms</span>
                  <span className="text-emerald-400 font-semibold">{srv.uptimePercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Posture Overview */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-signal" /> Platform Risk Posture
              </h2>
              <Link to="/admin/security/risk" className="text-[11px] font-mono text-ink-soft hover:text-ink">
                Risk Matrix →
              </Link>
            </div>
            <p className="text-[11px] font-mono text-ink-soft mt-1">Tenant risk classification distribution</p>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Healthy</span>
              <div className="font-display text-2xl font-bold text-ink mt-1">{metrics.riskBreakdown.healthy}</div>
              <span className="text-[10px] text-ink-soft">Risk score &lt; 35</span>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-semibold">Warning</span>
              <div className="font-display text-2xl font-bold text-ink mt-1">{metrics.riskBreakdown.warning}</div>
              <span className="text-[10px] text-ink-soft">Risk score 35-70</span>
            </div>

            <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 p-3">
              <span className="text-[10px] text-signal uppercase font-semibold">High Risk</span>
              <div className="font-display text-2xl font-bold text-ink mt-1">{metrics.riskBreakdown.highRisk}</div>
              <span className="text-[10px] text-ink-soft">Risk score 70-85</span>
            </div>

            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3">
              <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-semibold">Critical</span>
              <div className="font-display text-2xl font-bold text-ink mt-1">{metrics.riskBreakdown.critical}</div>
              <span className="text-[10px] text-ink-soft">Active containment</span>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface-2/30 p-2 text-[11px] font-mono text-ink-soft flex items-center justify-between">
            <span>Critical quarantine threshold:</span>
            <span className="text-signal font-bold">Score ≥ 80</span>
          </div>
        </div>

        {/* Recent Platform Activity Timeline */}
        <div className="rounded-xl border border-line/80 bg-surface/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Activity Stream</h2>
            <Link to="/admin/audit" className="text-[11px] font-mono text-ink-soft hover:text-ink">
              All Logs →
            </Link>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {auditLogs.map((log) => (
              <div key={log.id} className="relative pl-3 border-l border-line space-y-0.5">
                <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-signal" />
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-ink truncate">{log.action}</span>
                  <span className="text-[10px] text-ink-soft shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft truncate">
                  By {log.actorName} on {log.resource} ({log.resourceId})
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
