import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Activity,
  ArrowRight,
  Laptop,
  Building2,
  Users,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { MetricCard } from '../../../components/admin/MetricCard'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'

const THREAT_TRAJECTORY = [
  { time: '00:00', critical: 1, high: 4, medium: 12 },
  { time: '04:00', critical: 0, high: 3, medium: 8 },
  { time: '08:00', critical: 2, high: 9, medium: 24 },
  { time: '12:00', critical: 4, high: 14, medium: 38 },
  { time: '16:00', critical: 2, high: 8, medium: 22 },
  { time: '20:00', critical: 1, high: 5, medium: 14 },
]

export function SecurityOverviewPage() {
  const metrics = useAdminData(() => adminService.getMetrics())
  const orgs = useAdminData(() => adminService.getOrganizations())
  const users = useAdminData(() => adminService.getUsers())
  const devices = useAdminData(() => adminService.getDevices())
  const incidents = useAdminData(() => adminService.getIncidents())

  const highRiskOrgs = orgs.filter((o) => o.riskLevel === 'HIGH' || o.riskLevel === 'CRITICAL')
  const highRiskUsers = users.filter((u) => u.riskLevel === 'HIGH' || u.riskLevel === 'CRITICAL')
  const atRiskDevices = devices.filter((d) => d.status === 'AT_RISK' || d.riskLevel === 'CRITICAL')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            Security Operations & Command Center
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Fleet-wide threat intelligence, anomalous eBPF signals, incident triage, and platform risk posture.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Link
            to="/admin/security/events"
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-ink hover:text-ink no-underline"
          >
            Live Event Stream
          </Link>
          <Link
            to="/admin/security/incidents"
            className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white font-semibold no-underline"
          >
            Active Incidents ({incidents.filter((i) => i.status === 'OPEN').length})
          </Link>
        </div>
      </div>

      {/* Severity Breakdown KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
            <Flame className="h-4 w-4" /> Critical Threats
          </span>
          <div className="font-display text-2xl font-bold text-ink mt-1">2 Active</div>
          <span className="text-[10px] text-ink-soft">Autonomous quarantine enforced</span>
        </div>

        <div className="rounded-xl border border-orange-900/60 bg-orange-950/20 p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-signal font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> High Risk Signals
          </span>
          <div className="font-display text-2xl font-bold text-ink mt-1">5 Signals</div>
          <span className="text-[10px] text-ink-soft">SOC investigation required</span>
        </div>

        <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
            Medium Severity
          </span>
          <div className="font-display text-2xl font-bold text-ink mt-1">14 Flagged</div>
          <span className="text-[10px] text-ink-soft">DNS & network anomalies</span>
        </div>

        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Low / Monitored
          </span>
          <div className="font-display text-2xl font-bold text-ink mt-1">98.4% Fleet</div>
          <span className="text-[10px] text-ink-soft">Compliant baseline</span>
        </div>
      </div>

      {/* Threat Trajectory Chart */}
      <div className="rounded-xl border border-line bg-surface p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink">24-Hour Threat Signal Ingestion</h2>
          <span className="text-[11px] text-ink-soft">Updated real-time from eBPF sensors</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={THREAT_TRAJECTORY}>
              <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Critical" />
              <Area type="monotone" dataKey="high" stroke="#f97316" fill="#f97316" fillOpacity={0.15} name="High" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-Risk Tenants, Users & At-Risk Devices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* High-Risk Organizations */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-signal" /> High-Risk Tenants
            </h2>
            <Link to="/admin/organizations?risk=HIGH" className="text-[10px] text-signal hover:underline">View</Link>
          </div>
          <div className="space-y-2">
            {highRiskOrgs.map((o) => (
              <div key={o.id} className="p-2.5 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <Link to={`/admin/organizations/${o.id}`} className="font-semibold text-ink hover:text-signal no-underline block truncate max-w-[150px]">
                    {o.name}
                  </Link>
                  <span className="text-[10px] text-ink-soft">{o.openIncidentsCount} open incidents</span>
                </div>
                <RiskBadge level={o.riskLevel} score={o.riskScore} />
              </div>
            ))}
          </div>
        </div>

        {/* High-Risk Users */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <Users className="h-4 w-4 text-sky-400" /> High-Risk Users
            </h2>
            <Link to="/admin/users" className="text-[10px] text-signal hover:underline">View</Link>
          </div>
          <div className="space-y-2">
            {highRiskUsers.map((u) => (
              <div key={u.id} className="p-2.5 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <Link to={`/admin/users/${u.id}`} className="font-semibold text-ink hover:text-signal no-underline block truncate max-w-[150px]">
                    {u.name}
                  </Link>
                  <span className="text-[10px] text-ink-soft">{u.email}</span>
                </div>
                <RiskBadge level={u.riskLevel} score={u.riskScore} />
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Devices */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <Laptop className="h-4 w-4 text-rose-400" /> Endpoints At Risk
            </h2>
            <Link to="/admin/devices?status=AT_RISK" className="text-[10px] text-signal hover:underline">View</Link>
          </div>
          <div className="space-y-2">
            {atRiskDevices.map((d) => (
              <div key={d.id} className="p-2.5 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <Link to={`/admin/devices/${d.id}`} className="font-semibold text-ink hover:text-signal no-underline block truncate max-w-[150px]">
                    {d.hostname}
                  </Link>
                  <span className="text-[10px] text-ink-soft">{d.tenantName}</span>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
