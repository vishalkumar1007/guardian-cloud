import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Laptop,
  ShieldAlert,
  User,
  Building2,
  Package,
  Activity,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Lock,
  WifiOff,
  RotateCw,
  HardDrive,
  Info,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'
import { SimulatedActionDialog } from '../../../components/admin/SimulatedActionDialog'
import { cn } from '../../../lib/utils'

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')

  const device = useAdminData(() => adminService.getDeviceById(id ?? ''))
  const events = useAdminData(() => adminService.getSecurityEvents().filter((e) => e.deviceId === id))
  const incidents = useAdminData(() => adminService.getIncidents().filter((i) => i.deviceId === id))

  const [simCommand, setSimCommand] = useState<'LOCK' | 'WIPE' | 'ISOLATE' | 'SYNC' | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  if (!device) {
    return (
      <div className="p-8 text-center space-y-3 font-mono">
        <h2 className="text-base text-ink">Device Not Found</h2>
        <Link to="/admin/devices" className="text-signal hover:underline text-xs">
          ← Back to Devices
        </Link>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Laptop },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'owner', label: 'Owner', icon: User },
    { id: 'tenant', label: 'Tenant', icon: Building2 },
    { id: 'agent', label: 'Agent', icon: Package },
    { id: 'events', label: 'Events', icon: Activity, count: events.length },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: incidents.length },
    { id: 'audit', label: 'Audit', icon: FileText },
  ]

  function handleExecuteSimAction(reason: string) {
    if (!simCommand || !device) return
    const res = adminService.simulateDeviceCommand(device.id, simCommand, reason)
    setToastMessage(res.message)
    setTimeout(() => setToastMessage(null), 5000)
    setSimCommand(null)
  }

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-3 rounded-xl border border-amber-800/60 bg-amber-950/30 text-amber-300 font-mono text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-amber-400 font-bold">×</button>
        </div>
      )}

      <div>
        <Link
          to="/admin/devices"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Devices
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-line/80 bg-surface/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-line font-display text-xl font-bold text-signal">
              <Laptop className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-bold tracking-tight text-ink">{device.hostname}</h1>
                <StatusBadge status={device.status} pulse={device.status === 'ONLINE'} />
                <RiskBadge level={device.riskLevel} score={device.riskScore} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-ink-soft">
                <span>{device.displayName}</span>
                <span>•</span>
                <span>{device.platform} ({device.osVersion})</span>
                <span>•</span>
                <span>IP: <strong className="text-ink">{device.ipAddress}</strong></span>
                <span>•</span>
                <span>Last Seen: {new Date(device.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Simulated Action Command Palette */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSimCommand('ISOLATE')}
              className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/20 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40"
            >
              <WifiOff className="h-3.5 w-3.5" /> Isolate Network [DEMO]
            </button>
            <button
              type="button"
              onClick={() => setSimCommand('LOCK')}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-ink hover:text-ink"
            >
              <Lock className="h-3.5 w-3.5 text-ink-soft" /> Lock Screen [DEMO]
            </button>
            <button
              type="button"
              onClick={() => setSimCommand('SYNC')}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-ink hover:text-ink"
            >
              <RotateCw className="h-3.5 w-3.5 text-ink-soft" /> Force Sync [DEMO]
            </button>
          </div>
        </div>

        {/* 8 Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-line/80 pt-3 text-xs font-mono">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-signal/10 text-signal font-semibold border border-signal/20'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.2 text-[10px] text-ink-soft">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Disk Encryption</span>
              <div className="font-display text-base font-bold text-emerald-400 mt-2">{device.encryptionStatus}</div>
              <span className="text-[11px] text-ink-soft">BitLocker / FileVault</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Firewall State</span>
              <div className="font-display text-base font-bold text-ink mt-2">
                {device.firewallEnabled ? 'ACTIVE / BLOCKING' : 'DISABLED'}
              </div>
              <span className="text-[11px] text-ink-soft">eBPF Packet Inspection</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Agent Version</span>
              <div className="font-display text-base font-bold text-signal mt-2">{device.agentVersion}</div>
              <span className="text-[11px] text-ink-soft">Daemon PID: 4912</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Serial Number</span>
              <div className="font-display text-xs font-bold text-ink mt-2 truncate">{device.serialNumber}</div>
              <span className="text-[11px] text-ink-soft">MAC: {device.macAddress}</span>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 font-mono text-xs space-y-3">
            <h3 className="font-display text-sm font-semibold text-ink">Hardware & Telemetry Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-ink">
              <div className="p-3 rounded-lg border border-line bg-surface-2/60 space-y-1">
                <span className="text-ink-soft text-[11px]">Tenant Scope:</span>
                <p className="font-semibold text-ink">{device.tenantName} [{device.tenantType}]</p>
              </div>
              <div className="p-3 rounded-lg border border-line bg-surface-2/60 space-y-1">
                <span className="text-ink-soft text-[11px]">Assigned User:</span>
                <p className="font-semibold text-ink">{device.assignedUserName ?? 'Unassigned'}</p>
              </div>
              <div className="p-3 rounded-lg border border-line bg-surface-2/60 space-y-1">
                <span className="text-ink-soft text-[11px]">Enrollment Certificate:</span>
                <p className="font-mono text-[11px] text-ink-soft truncate">sha256:4a8b...99e1 (mTLS Verified)</p>
              </div>
              <div className="p-3 rounded-lg border border-line bg-surface-2/60 space-y-1">
                <span className="text-ink-soft text-[11px]">Registered Date:</span>
                <p className="font-mono text-ink">{new Date(device.registeredAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="rounded-xl border border-line bg-surface p-4 font-mono text-xs space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">Security Posture & Findings</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink">Kernel eBPF Sensor Integrity</span>
                <p className="text-[11px] text-ink-soft">All syscall probes hooked with zero bypass detections.</p>
              </div>
              <StatusBadge status="HEALTHY" />
            </div>
            <div className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink">Zero Trust Network Tunnel</span>
                <p className="text-[11px] text-ink-soft">WireGuard mTLS micro-tunnel active to nearest Guardian gateway.</p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="rounded-xl border border-line bg-surface p-4 font-mono text-xs space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">Security Events Stream ({events.length})</h3>
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map((evt) => (
                <div key={evt.id} className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-ink">[{evt.severity}] {evt.eventType}</span>
                    <p className="text-[11px] text-ink-soft">Action: {evt.actionTaken} • Source: {evt.source}</p>
                  </div>
                  <StatusBadge status={evt.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-soft py-4 text-center">No anomalous security events recorded for this device.</p>
          )}
        </div>
      )}

      {/* Other Tabs */}
      {['owner', 'tenant', 'agent', 'incidents', 'audit'].includes(activeTab) && (
        <div className="rounded-xl border border-line bg-surface p-6 text-center text-xs font-mono text-ink-soft">
          <p className="text-ink font-semibold mb-1 capitalize">{activeTab} Details</p>
          <span>Linked device metadata synchronized for {device.hostname}.</span>
        </div>
      )}

      {simCommand && (
        <SimulatedActionDialog
          isOpen={true}
          actionName={`Remote ${simCommand} Command`}
          targetDeviceName={device.hostname}
          commandType={simCommand}
          onExecute={handleExecuteSimAction}
          onCancel={() => setSimCommand(null)}
        />
      )}
    </div>
  )
}
