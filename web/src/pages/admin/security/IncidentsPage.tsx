import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  UserCheck,
  Flame,
  Plus,
  X,
  Clock,
  Shield,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { SecurityIncident, IncidentStatus, IncidentSeverity } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'

export function IncidentsPage() {
  const incidents = useAdminData(() => adminService.getIncidents())
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH')
  const [category, setCategory] = useState('Anomalous Kernel Activity')
  const [summary, setSummary] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    adminService.createIncident({
      title,
      severity,
      category,
      summary,
    })
    setCreateModalOpen(false)
    setTitle('')
    setSummary('')
  }

  function handleResolve(inc: SecurityIncident) {
    adminService.updateIncidentStatus(inc.id, 'RESOLVED', 'Resolved after SOC triage review.')
    if (selectedIncident?.id === inc.id) {
      setSelectedIncident((prev) => (prev ? { ...prev, status: 'RESOLVED' } : null))
    }
  }

  function handleAssign(inc: SecurityIncident) {
    adminService.assignIncident(inc.id, 'Alexander Vance', 'alexander.vance@guardian.internal')
    if (selectedIncident?.id === inc.id) {
      setSelectedIncident((prev) => (prev ? { ...prev, assignedToAdmin: 'Alexander Vance' } : null))
    }
  }

  const columns: ColumnDef<SecurityIncident>[] = [
    {
      accessorKey: 'title',
      header: 'Incident',
      cell: ({ row }) => (
        <div className="font-mono min-w-[220px]">
          <span className="font-semibold text-ink block truncate">{row.original.title}</span>
          <span className="text-[10px] text-ink-soft block truncate">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => <RiskBadge level={row.original.severity} score={row.original.riskScore} />,
    },
    {
      accessorKey: 'tenantName',
      header: 'Tenant',
      cell: ({ row }) => <span className="font-mono text-xs text-ink">{row.original.tenantName}</span>,
    },
    {
      accessorKey: 'deviceHostname',
      header: 'Device',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-signal font-medium">{row.original.deviceHostname ?? 'Platform'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'assignedToAdmin',
      header: 'Assigned',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink-soft">{row.original.assignedToAdmin ?? 'Unassigned'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const inc = row.original
        return (
          <div className="flex items-center justify-end gap-1 font-mono">
            {inc.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleResolve(inc)
                }}
                className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40 text-[10px]"
                title="Resolve Incident"
              >
                Resolve
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIncident(inc)}
              className="p-1 rounded text-ink-soft hover:text-signal hover:bg-surface-2"
              title="Inspect Incident"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            SOC Incident Management & Containment
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Security incident triage, threat timelines, containment procedures, and forensic attribution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Incident
        </button>
      </div>

      <DataTable
        columns={columns}
        data={incidents}
        searchKey="title"
        searchPlaceholder="Filter incidents by title or category…"
        filterOptions={[
          {
            id: 'severity',
            label: 'Severity',
            options: [
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Open', value: 'OPEN' },
              { label: 'Investigating', value: 'INVESTIGATING' },
              { label: 'Mitigated', value: 'MITIGATED' },
              { label: 'Resolved', value: 'RESOLVED' },
            ],
          },
        ]}
        onRowClick={(row) => setSelectedIncident(row)}
      />

      {/* Incident Detail Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between font-mono text-xs overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-500" />
                  <span className="font-display text-base font-bold text-ink">Incident Dossier</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="text-ink-soft hover:text-ink p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-line bg-surface-2/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink text-sm">{selectedIncident.title}</span>
                  <RiskBadge level={selectedIncident.severity} score={selectedIncident.riskScore} />
                </div>
                <p className="text-[11px] text-ink leading-relaxed">{selectedIncident.summary}</p>
                <div className="pt-1 flex items-center gap-2">
                  <StatusBadge status={selectedIncident.status} />
                  <span className="text-ink-soft text-[10px]">
                    Assigned: <strong className="text-ink">{selectedIncident.assignedToAdmin ?? 'None'}</strong>
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-ink-soft font-semibold block">Incident Timeline</span>
                <div className="space-y-2.5 border-l border-line pl-3">
                  {selectedIncident.timeline?.map((item, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <span className="absolute -left-[16.5px] top-1 h-2 w-2 rounded-full bg-signal" />
                      <div className="flex justify-between text-ink font-semibold">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-ink-soft">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft">{item.description}</p>
                      <span className="text-[10px] text-ink-soft">Actor: {item.actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAssign(selectedIncident)}
                  className="flex-1 rounded-lg border border-line bg-surface-2 py-2 text-ink hover:text-ink"
                >
                  Assign to Me
                </button>
                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleResolve(selectedIncident)}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-ink font-semibold"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="font-display text-base font-semibold text-ink">Create Security Incident</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Incident Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Anomalous LSASS Injection on Workstation"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Incident Summary *</label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Detailed findings and initial mitigation status..."
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
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
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
