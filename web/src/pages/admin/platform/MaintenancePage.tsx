import React, { useState } from 'react'
import { Calendar, Plus, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function MaintenancePage() {
  const windows = useAdminData(() => adminService.getMaintenanceWindows())
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [impactLevel, setImpactLevel] = useState<'NONE' | 'LOW' | 'MODERATE' | 'CRITICAL'>('LOW')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [affectedService, setAffectedService] = useState('Guardian Edge API Gateway')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    adminService.createMaintenanceWindow({
      title,
      impactLevel,
      startAt: startAt || new Date(Date.now() + 86400000).toISOString(),
      endAt: endAt || new Date(Date.now() + 90000000).toISOString(),
      affectedServices: [affectedService],
    })
    setCreateModalOpen(false)
    setTitle('')
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Calendar className="h-5 w-5 text-signal" />
            Scheduled Infrastructure Maintenance Windows
          </h1>
          <p className="text-ink-soft mt-0.5">
            Zero-downtime database schema migrations, edge SSL rotations, and microservice upgrades.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Schedule Window
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {windows.map((w) => (
          <div key={w.id} className="p-4 rounded-xl border border-line bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-signal font-bold tracking-wider">
                Impact: {w.impactLevel}
              </span>
              <StatusBadge status={w.status} />
            </div>

            <h3 className="font-display text-base font-bold text-ink">{w.title}</h3>

            <div className="border-t border-line pt-3 space-y-1.5 text-ink">
              <div className="flex justify-between">
                <span className="text-ink-soft">Starts (UTC):</span>
                <span className="text-ink">{new Date(w.startAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Concludes:</span>
                <span className="text-ink">{new Date(w.endAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Services Affected:</span>
                <span className="text-signal truncate max-w-xs">{w.affectedServices.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Scheduled By:</span>
                <span className="text-ink-soft">{w.createdBy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">Schedule Platform Maintenance</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Edge TLS Certificate Key Roll"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Affected Service</label>
                <select
                  value={affectedService}
                  onChange={(e) => setAffectedService(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                >
                  <option value="Guardian Edge API Gateway">Guardian Edge API Gateway</option>
                  <option value="Primary PostgreSQL Cluster (HA)">Primary PostgreSQL Cluster (HA)</option>
                  <option value="Kafka Event Ingestion Bus">Kafka Event Ingestion Bus</option>
                  <option value="Agent mTLS Gateway Ring">Agent mTLS Gateway Ring</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Impact Level</label>
                  <select
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="NONE">None</option>
                    <option value="LOW">Low</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-ink hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white"
                >
                  Schedule Window
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
