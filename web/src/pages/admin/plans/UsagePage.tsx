import React from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { HardDrive, Activity, Radio, Database, Building2 } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { MetricCard } from '../../../components/admin/MetricCard'

const EVENT_VOLUME_TREND = [
  { day: 'Sep 1', events: 1.4 },
  { day: 'Sep 2', events: 1.8 },
  { day: 'Sep 3', events: 2.1 },
  { day: 'Sep 4', events: 2.9 },
  { day: 'Sep 5', events: 3.4 },
  { day: 'Sep 6', events: 4.2 },
]

const TOP_CONSUMING_ORGS = [
  { name: 'Stark Industries', eventsPerDay: '1.8M', storageGb: 840, devices: 3800, tier: 'ENTERPRISE' },
  { name: 'Cyberdyne Systems Corp', eventsPerDay: '1.2M', storageGb: 620, devices: 1420, tier: 'ENTERPRISE' },
  { name: 'Acme Defense Technologies', eventsPerDay: '750K', storageGb: 410, devices: 650, tier: 'ENTERPRISE' },
  { name: 'Helios Financial Corp', eventsPerDay: '680K', storageGb: 390, devices: 980, tier: 'ENTERPRISE' },
  { name: 'Nexus Health Systems', eventsPerDay: '320K', storageGb: 180, devices: 510, tier: 'BUSINESS_PLUS' },
]

export function UsagePage() {
  const metrics = useAdminData(() => adminService.getMetrics())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Activity className="h-5 w-5 text-signal" />
          Platform Usage & Telemetry Consumption
        </h1>
        <p className="text-xs text-ink-soft font-mono mt-0.5">
          Real-time event throughput, evidence bucket storage, eBPF telemetry pipelines, and top tenant consumers.
        </p>
      </div>

      {/* Top gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Daily Event Throughput"
          value="4.2M / day"
          change="+18% peak"
          trend="up"
          subtitle="Kafka Ingestion"
          icon={Activity}
        />
        <MetricCard
          title="Active Agent Heartbeats"
          value={metrics.activeAgents}
          change="99.98% online"
          trend="up"
          subtitle="mTLS Gateway"
          icon={Radio}
        />
        <MetricCard
          title="Forensic S3 Vault"
          value="2.84 TB"
          change="+120 GB / mo"
          trend="up"
          subtitle="WORM Encrypted"
          icon={HardDrive}
        />
        <MetricCard
          title="PostgreSQL Index Size"
          value="428 GB"
          change="Optimal"
          trend="neutral"
          subtitle="Partitioned logs"
          icon={Database}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Event Volume Ingestion (Millions)</h2>
            <span className="text-[11px] text-signal">4.2M events / 24h</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EVENT_VOLUME_TREND}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="events" stroke="#f97316" fill="#f97316" fillOpacity={0.2} name="Events (M)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Organizations Table */}
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Top 5 Resource Consuming Tenants</h2>
            <Link to="/admin/organizations" className="text-[11px] text-signal hover:underline">All Tenants</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-ink-soft border-b border-line">
                <tr>
                  <th className="py-2">Organization</th>
                  <th>Events / Day</th>
                  <th>Storage</th>
                  <th>Devices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {TOP_CONSUMING_ORGS.map((org) => (
                  <tr key={org.name}>
                    <td className="py-2 text-ink font-semibold">{org.name}</td>
                    <td className="text-signal font-bold">{org.eventsPerDay}</td>
                    <td>{org.storageGb} GB</td>
                    <td>{org.devices}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
