import React, { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  FileText,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Database,
  Lock,
  X,
  Code2,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { AuditLogEntry } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { cn } from '../../../lib/utils'

interface AuditLogPageProps {
  forcedCategory?: 'ADMIN_ACTION' | 'SECURITY_ACTION' | 'DATA_ACCESS'
}

export function AuditLogPage({ forcedCategory }: AuditLogPageProps) {
  const location = useLocation()
  const navigate = useNavigate()

  let currentCategory = forcedCategory
  if (!currentCategory) {
    if (location.pathname.includes('/admin-actions')) currentCategory = 'ADMIN_ACTION'
    else if (location.pathname.includes('/security-actions')) currentCategory = 'SECURITY_ACTION'
    else if (location.pathname.includes('/data-access')) currentCategory = 'DATA_ACCESS'
  }

  const logs = useAdminData(() => {
    const list = adminService.getAuditLogs()
    if (currentCategory) {
      return list.filter((l) => l.category === currentCategory)
    }
    return list
  })

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp (UTC)',
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
      accessorKey: 'actorName',
      header: 'Actor & Role',
      cell: ({ row }) => (
        <div className="font-mono min-w-[170px]">
          <span className="font-bold text-ink block truncate">{row.original.actorName}</span>
          <span className="text-[10px] text-signal block truncate">{row.original.actorRole}</span>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action Executed',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="font-mono flex items-center gap-2">
            <span className="font-semibold text-ink">{item.action}</span>
            {item.isSensitiveDataAccess && (
              <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Sensitive Data
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'resource',
      header: 'Resource',
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          <span className="text-ink block">{row.original.resource}</span>
          <span className="text-[10px] text-ink-soft font-mono truncate max-w-[110px] block">
            {row.original.resourceId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => <StatusBadge status={row.original.result} />,
    },
    {
      accessorKey: 'ipAddress',
      header: 'Source IP',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink-soft">{row.original.ipAddress}</span>
      ),
    },
    {
      accessorKey: 'requestId',
      header: 'Request ID',
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-ink-soft">{row.original.requestId}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedEntry(row.original)}
          className="p-1 rounded text-ink-soft hover:text-signal hover:bg-surface-2"
          title="Inspect Audit Entry"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  const SUB_TABS = [
    { to: '/admin/audit', label: 'All Audit Events', exact: true },
    { to: '/admin/audit/admin-actions', label: 'Admin Actions' },
    { to: '/admin/audit/security-actions', label: 'Security Actions' },
    { to: '/admin/audit/data-access', label: 'Sensitive Data Access' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
          <FileText className="h-5 w-5 text-signal" />
          Immutable Platform Audit Log & Forensic Records
        </h1>
        <p className="text-xs text-ink-soft font-mono mt-0.5">
          Cryptographically hashed, append-only records of all internal admin mutations, security overrides, and sensitive customer data views.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2 text-xs font-mono">
        {SUB_TABS.map((tab) => {
          const isActive = location.pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'px-3 py-1.5 rounded-lg whitespace-nowrap no-underline transition-colors',
                isActive
                  ? 'bg-signal/10 text-signal font-semibold border border-signal/20'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchKey="action"
        searchPlaceholder="Filter audit records by action or actor…"
        filterOptions={[
          {
            id: 'result',
            label: 'Result',
            options: [
              { label: 'Success', value: 'SUCCESS' },
              { label: 'Failure', value: 'FAILURE' },
              { label: 'Denied', value: 'DENIED' },
            ],
          },
        ]}
        onRowClick={(row) => setSelectedEntry(row)}
      />

      {/* Audit Detail Drawer */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between font-mono text-xs overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-signal" />
                  <span className="font-display text-base font-bold text-ink">Audit Entry Record</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="text-ink-soft hover:text-ink p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-line bg-surface-2/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">{selectedEntry.action}</span>
                  <StatusBadge status={selectedEntry.result} />
                </div>
                <div className="text-ink-soft text-[11px]">
                  Actor: <strong className="text-ink">{selectedEntry.actorName}</strong> ({selectedEntry.actorEmail})
                </div>
                {selectedEntry.isSensitiveDataAccess && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-[11px]">
                    ⚠️ SENSITIVE DATA ACCESS: Requires mandatory audit justification review.
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-ink">
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Record ID:</span>
                  <span className="text-ink">{selectedEntry.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Timestamp:</span>
                  <span className="text-ink">{new Date(selectedEntry.timestamp).toISOString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Target Resource:</span>
                  <span className="text-signal font-semibold">{selectedEntry.resource} ({selectedEntry.resourceId})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Source IP & Geo:</span>
                  <span className="text-ink">{selectedEntry.ipAddress}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Request Correlation ID:</span>
                  <span className="text-ink-soft font-mono">{selectedEntry.requestId}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-ink-soft uppercase tracking-wider font-semibold block">
                  Action Detail Metadata
                </span>
                <pre className="p-3 rounded-xl bg-black border border-line text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedEntry.details ?? { note: 'No extra metadata payload' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="w-full rounded-lg border border-line bg-surface-2 py-2 text-ink hover:text-ink"
              >
                Close Audit Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
