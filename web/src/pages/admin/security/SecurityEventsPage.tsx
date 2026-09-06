import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { ShieldAlert, ExternalLink, X, Terminal, Code2 } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { SecurityEvent } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'

export function SecurityEventsPage() {
  const events = useAdminData(() => adminService.getSecurityEvents())
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)

  const columns: ColumnDef<SecurityEvent>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.timestamp).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => <RiskBadge level={row.original.severity} />,
    },
    {
      accessorKey: 'eventType',
      header: 'Event Type',
      cell: ({ row }) => (
        <div className="font-mono">
          <span className="font-semibold text-ink block">{row.original.eventType}</span>
          <span className="text-[10px] text-ink-soft">[{row.original.category}]</span>
        </div>
      ),
    },
    {
      accessorKey: 'tenantName',
      header: 'Organization',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.tenantName ?? 'Global'}</span>
      ),
    },
    {
      accessorKey: 'deviceHostname',
      header: 'Device',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-signal font-medium">
          {row.original.deviceHostname ?? 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source Sensor',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft truncate max-w-[150px] block">
          {row.original.source}
        </span>
      ),
    },
    {
      accessorKey: 'actionTaken',
      header: 'Action Taken',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink bg-surface-2 border border-line px-2 py-0.5 rounded">
          {row.original.actionTaken}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedEvent(row.original)}
          className="p-1 rounded text-ink-soft hover:text-signal hover:bg-surface-2"
          title="Inspect Payload"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-signal" />
          Security Telemetry & Event Stream
        </h1>
        <p className="text-xs text-ink-soft font-mono mt-0.5">
          Real-time low-level eBPF kernel events, anomalous process executions, and network socket blocks.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={events}
        searchKey="eventType"
        searchPlaceholder="Filter events by type, process or hash…"
        filterOptions={[
          {
            id: 'severity',
            label: 'Severity',
            options: [
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Quarantined', value: 'QUARANTINED' },
              { label: 'Blocked', value: 'BLOCKED' },
              { label: 'Flagged', value: 'FLAGGED' },
              { label: 'Allowed', value: 'ALLOWED' },
            ],
          },
        ]}
        onRowClick={(row) => setSelectedEvent(row)}
      />

      {/* Event Detail Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between font-mono text-xs overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-signal" />
                  <span className="font-display text-base font-bold text-ink">Event Telemetry Payload</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="text-ink-soft hover:text-ink p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface-2/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">{selectedEvent.eventType}</span>
                  <RiskBadge level={selectedEvent.severity} />
                </div>
                <div className="text-[11px] text-ink-soft">
                  <span>Sensor: {selectedEvent.source}</span>
                </div>
                <div>
                  <StatusBadge status={selectedEvent.status} />
                </div>
              </div>

              <div className="space-y-1.5 text-ink">
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Event ID:</span>
                  <span className="text-ink">{selectedEvent.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Target Tenant:</span>
                  <span className="text-ink">{selectedEvent.tenantName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Target Hostname:</span>
                  <span className="text-signal font-bold">{selectedEvent.deviceHostname}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Action Enforced:</span>
                  <span className="text-emerald-400">{selectedEvent.actionTaken}</span>
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-ink-soft uppercase tracking-wider font-semibold block">
                  Raw Structured Telemetry
                </span>
                <pre className="p-3 rounded-xl bg-black border border-line text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedEvent.rawPayload ?? { event: selectedEvent.eventType }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-full rounded-lg border border-line bg-surface-2 py-2 text-ink hover:text-ink"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
