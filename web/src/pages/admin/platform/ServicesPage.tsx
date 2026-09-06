import React from 'react'
import { Server, ExternalLink } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function ServicesPage() {
  const services = useAdminData(() => adminService.getServicesHealth())

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Server className="h-5 w-5 text-signal" />
          Internal Microservice Architecture Inventory
        </h1>
        <p className="text-ink-soft mt-0.5">
          Comprehensive inventory of core daemon containers, ingress controllers, and storage partitions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => (
          <div key={srv.id} className="p-4 rounded-xl border border-line bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-soft uppercase">{srv.category}</span>
              <StatusBadge status={srv.status} />
            </div>
            <h3 className="font-display text-base font-bold text-ink">{srv.name}</h3>
            <div className="space-y-1.5 text-ink border-t border-line pt-3">
              <div className="flex justify-between">
                <span className="text-ink-soft">Region:</span>
                <span className="text-ink">{srv.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">P99 Latency:</span>
                <span className="text-signal font-bold">{srv.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Uptime:</span>
                <span className="text-emerald-400 font-bold">{srv.uptimePercent}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
