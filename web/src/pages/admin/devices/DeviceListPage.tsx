import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Laptop,
  Apple,
  Terminal,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Lock,
  WifiOff,
  RotateCw,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { ManagedDevice, DevicePlatform } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'
import { SimulatedActionDialog } from '../../../components/admin/SimulatedActionDialog'

export function DeviceListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')

  const devices = useAdminData(() => {
    const list = adminService.getDevices()
    if (statusParam) {
      return list.filter((d) => d.status.toUpperCase() === statusParam.toUpperCase())
    }
    return list
  })

  const [selectedDevice, setSelectedDevice] = useState<ManagedDevice | null>(null)
  const [simCommand, setSimCommand] = useState<'LOCK' | 'WIPE' | 'ISOLATE' | 'SYNC' | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function handleTriggerSimAction(dev: ManagedDevice, cmd: 'LOCK' | 'WIPE' | 'ISOLATE' | 'SYNC') {
    setSelectedDevice(dev)
    setSimCommand(cmd)
  }

  function handleExecuteSimAction(reason: string) {
    if (!selectedDevice || !simCommand) return
    const res = adminService.simulateDeviceCommand(selectedDevice.id, simCommand, reason)
    setToastMessage(res.message)
    setTimeout(() => setToastMessage(null), 5000)
    setSimCommand(null)
    setSelectedDevice(null)
  }

  function renderPlatformIcon(platform: DevicePlatform) {
    if (platform === 'MACOS') return <span className="text-ink font-bold">macOS</span>
    if (platform === 'WINDOWS') return <span className="text-sky-400 font-bold">Windows</span>
    if (platform === 'LINUX') return <span className="text-emerald-400 font-bold">Linux</span>
    if (platform === 'IOS') return <span className="text-ink font-bold">iOS</span>
    if (platform === 'ANDROID') return <span className="text-emerald-400 font-bold">Android</span>
    return <span>{platform}</span>
  }

  const columns: ColumnDef<ManagedDevice>[] = [
    {
      accessorKey: 'hostname',
      header: 'Device',
      cell: ({ row }) => {
        const d = row.original
        return (
          <div className="flex items-center gap-2.5 min-w-[190px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink border border-line font-mono text-xs">
              <Laptop className="h-4 w-4 text-signal" />
            </div>
            <div className="min-w-0">
              <Link
                to={`/admin/devices/${d.id}`}
                className="font-semibold text-ink hover:text-signal truncate block no-underline transition-colors"
              >
                {d.hostname}
              </Link>
              <span className="font-mono text-[10px] text-ink-soft truncate block">{d.displayName}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'assignedUserName',
      header: 'Owner',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.assignedUserName ?? 'Unassigned'}</span>
      ),
    },
    {
      accessorKey: 'tenantName',
      header: 'Tenant',
      cell: ({ row }) => (
        <div className="min-w-0 font-mono text-xs">
          <span className="text-ink block truncate">{row.original.tenantName}</span>
          <span className="text-[10px] text-ink-soft">[{row.original.tenantType}]</span>
        </div>
      ),
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          {renderPlatformIcon(row.original.platform)}
          <span className="block text-[10px] text-ink-soft truncate">{row.original.osVersion}</span>
        </div>
      ),
    },
    {
      accessorKey: 'agentVersion',
      header: 'Agent',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-signal/90 font-semibold">{row.original.agentVersion}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} pulse={row.original.status === 'ONLINE'} />,
    },
    {
      accessorKey: 'riskLevel',
      header: 'Risk',
      cell: ({ row }) => <RiskBadge level={row.original.riskLevel} score={row.original.riskScore} />,
    },
    {
      accessorKey: 'lastSeenAt',
      header: 'Last Seen',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Simulated Actions',
      cell: ({ row }) => {
        const d = row.original
        return (
          <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleTriggerSimAction(d, 'ISOLATE')
              }}
              className="px-1.5 py-1 rounded bg-surface-2 hover:bg-rose-950/40 text-ink hover:text-rose-400 border border-line flex items-center gap-1"
              title="Isolate Device (Simulated)"
            >
              <WifiOff className="h-3 w-3" /> Isolate [DEMO]
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleTriggerSimAction(d, 'LOCK')
              }}
              className="p-1 rounded text-ink-soft hover:text-ink hover:bg-surface-2"
              title="Lock Screen [DEMO]"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleTriggerSimAction(d, 'SYNC')
              }}
              className="p-1 rounded text-ink-soft hover:text-ink hover:bg-surface-2"
              title="Force Telemetry Sync [DEMO]"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <Link
              to={`/admin/devices/${d.id}`}
              className="p-1 rounded text-ink-soft hover:text-signal hover:bg-surface-2 no-underline"
              title="View Device Detail"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-3 rounded-xl border border-amber-800/60 bg-amber-950/30 text-amber-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-amber-400 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Laptop className="h-5 w-5 text-signal" />
            Platform Device Fleet Inventory
            {statusParam && (
              <span className="text-xs font-mono text-ink-soft uppercase font-normal">
                / {statusParam}
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Cross-tenant endpoint inventory, eBPF agent telemetry, encryption status, and simulated remediation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
          <span>SIMULATED COMMANDS ENABLED</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={devices}
        searchKey="hostname"
        searchPlaceholder="Filter devices by hostname, serial or IP…"
        filterOptions={[
          {
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Online', value: 'ONLINE' },
              { label: 'Offline', value: 'OFFLINE' },
              { label: 'At Risk', value: 'AT_RISK' },
            ],
          },
          {
            id: 'platform',
            label: 'Platform',
            options: [
              { label: 'macOS', value: 'MACOS' },
              { label: 'Windows', value: 'WINDOWS' },
              { label: 'Linux', value: 'LINUX' },
              { label: 'iOS', value: 'IOS' },
            ],
          },
          {
            id: 'riskLevel',
            label: 'Risk',
            options: [
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Critical', value: 'CRITICAL' },
            ],
          },
        ]}
        onRowClick={(row) => navigate(`/admin/devices/${row.id}`)}
      />

      {simCommand && selectedDevice && (
        <SimulatedActionDialog
          isOpen={true}
          actionName={`Remote ${simCommand} Command`}
          targetDeviceName={`${selectedDevice.hostname} (${selectedDevice.displayName})`}
          commandType={simCommand}
          onExecute={handleExecuteSimAction}
          onCancel={() => {
            setSimCommand(null)
            setSelectedDevice(null)
          }}
        />
      )}
    </div>
  )
}
