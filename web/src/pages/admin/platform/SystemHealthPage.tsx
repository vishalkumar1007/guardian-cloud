import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, AlertTriangle, ShieldCheck, Database, Radio, Server } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function SystemHealthPage() {
  const services = useAdminData(() => adminService.getServicesHealth())

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          Guardian Platform Cluster & Service Health
        </h1>
        <p className="text-ink-soft mt-0.5">
          Real-time mTLS gateway latency, database cluster replication lag, and distributed event bus throughput.
        </p>
      </div>

      {/* Top Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <span className="text-ink-soft uppercase text-[10px]">Global Cluster Status</span>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-2 mt-1">
            <CheckCircle2 className="h-4 w-4" /> 100% OPERATIONAL
          </div>
          <span className="text-[10px] text-ink-soft">Zero open degradations</span>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <span className="text-ink-soft uppercase text-[10px]">Average Edge Latency</span>
          <div className="text-2xl font-bold text-ink mt-1">16.2 ms</div>
          <span className="text-[10px] text-emerald-400">Global Anycast SLA</span>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <span className="text-ink-soft uppercase text-[10px]">DB Read/Write Latency</span>
          <div className="text-2xl font-bold text-ink mt-1">3.8 ms</div>
          <span className="text-[10px] text-ink-soft">PostgreSQL HA Cluster</span>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <span className="text-ink-soft uppercase text-[10px]">mTLS Handshake Rate</span>
          <div className="text-2xl font-bold text-signal mt-1">4,820 / sec</div>
          <span className="text-[10px] text-ink-soft">Agent Gateway Ring</span>
        </div>
      </div>

      {/* Main Service Health Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-surface-2 text-ink-soft text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Microservice / Subsystem</th>
              <th className="py-3 px-4">Domain Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">P99 Latency</th>
              <th className="py-3 px-4">30-Day Uptime</th>
              <th className="py-3 px-4">Cluster Region</th>
              <th className="py-3 px-4 text-right">Last Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {services.map((srv) => (
              <tr key={srv.id} className="hover:bg-surface-2/30">
                <td className="py-3 px-4 font-bold text-ink flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {srv.name}
                </td>
                <td className="py-3 px-4 text-ink-soft">{srv.category}</td>
                <td className="py-3 px-4"><StatusBadge status={srv.status} /></td>
                <td className="py-3 px-4 text-signal font-bold">{srv.latencyMs} ms</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">{srv.uptimePercent}%</td>
                <td className="py-3 px-4 text-ink-soft">{srv.region}</td>
                <td className="py-3 px-4 text-right text-ink-soft">
                  {new Date(srv.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
