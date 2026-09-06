import React from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { ShieldAlert, Building2, Laptop, ArrowRight } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { RiskBadge } from '../../../components/admin/RiskBadge'

const RISK_SCORE_HISTOGRAM = [
  { range: '0-20 (Safe)', count: 4 },
  { range: '21-40 (Low)', count: 3 },
  { range: '41-60 (Med)', count: 2 },
  { range: '61-80 (High)', count: 2 },
  { range: '81-100 (Crit)', count: 1 },
]

const RISK_TREND_DATA = [
  { week: 'W1', avgRisk: 34 },
  { week: 'W2', avgRisk: 31 },
  { week: 'W3', avgRisk: 42 },
  { week: 'W4', avgRisk: 38 },
]

export function RiskAnalysisPage() {
  const orgs = useAdminData(() => adminService.getOrganizations())
  const devices = useAdminData(() => adminService.getDevices())

  const sortedOrgs = [...orgs].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4)
  const sortedDevices = [...devices].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-signal" />
          Enterprise Risk Posture & Fleet Analysis
        </h1>
        <p className="text-xs text-ink-soft font-mono mt-0.5">
          Heuristic risk calculation across tenant fleet devices, policy non-compliance, and vulnerability exposure.
        </p>
      </div>

      {/* Top 2 charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-ink">Risk Score Distribution (0-100)</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RISK_SCORE_HISTOGRAM}>
                <XAxis dataKey="range" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Tenants" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <h2 className="font-display text-sm font-semibold text-ink">4-Week Average Risk Trend</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RISK_TREND_DATA}>
                <XAxis dataKey="week" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="avgRisk" stroke="#ef4444" strokeWidth={2} name="Avg Fleet Risk" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Highest Risk Organizations and Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-signal" /> Highest-Risk Organizations
            </h3>
            <Link to="/admin/organizations" className="text-signal hover:underline text-[11px]">All Orgs</Link>
          </div>
          <div className="space-y-2">
            {sortedOrgs.map((o) => (
              <div key={o.id} className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <Link to={`/admin/organizations/${o.id}`} className="font-semibold text-ink hover:text-signal no-underline">
                    {o.name}
                  </Link>
                  <span className="block text-[11px] text-ink-soft">Violations: {o.policyViolationsCount}</span>
                </div>
                <RiskBadge level={o.riskLevel} score={o.riskScore} />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
              <Laptop className="h-4 w-4 text-rose-400" /> Highest-Risk Devices
            </h3>
            <Link to="/admin/devices" className="text-signal hover:underline text-[11px]">All Devices</Link>
          </div>
          <div className="space-y-2">
            {sortedDevices.map((d) => (
              <div key={d.id} className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <Link to={`/admin/devices/${d.id}`} className="font-semibold text-ink hover:text-signal no-underline">
                    {d.hostname}
                  </Link>
                  <span className="block text-[11px] text-ink-soft">{d.tenantName}</span>
                </div>
                <RiskBadge level={d.riskLevel} score={d.riskScore} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
