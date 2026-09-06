import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  Laptop,
  FolderLock,
  FileCheck2,
  ShieldAlert,
  AlertTriangle,
  Bell,
  Clock,
  FileText,
  CreditCard,
  Settings,
  ArrowLeft,
  CheckCircle2,
  ShieldBan,
  RotateCcw,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog'
import { cn } from '../../../lib/utils'

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const org = useAdminData(() => adminService.getOrganizationById(id ?? ''))
  const devices = useAdminData(() => adminService.getDevices().filter((d) => d.tenantId === id))
  const incidents = useAdminData(() => adminService.getIncidents().filter((i) => i.tenantId === id))
  const alerts = useAdminData(() => adminService.getAlerts().filter((a) => a.tenantName === org?.name))
  const auditLogs = useAdminData(() => adminService.getAuditLogs().filter((a) => a.resourceId === id || a.details?.tenant === org?.name))

  const [suspendOpen, setSuspendOpen] = useState(false)

  if (!org) {
    return (
      <div className="p-8 text-center space-y-3 font-mono">
        <h2 className="text-base text-ink">Organization Not Found</h2>
        <Link to="/admin/organizations" className="text-signal hover:underline text-xs">
          ← Back to Organizations
        </Link>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'employees', label: 'Employees', icon: Users, count: org.employeeCount },
    { id: 'devices', label: 'Devices', icon: Laptop, count: devices.length },
    { id: 'groups', label: 'Groups', icon: FolderLock },
    { id: 'policies', label: 'Policies', icon: FileCheck2 },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: incidents.length },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: alerts.length },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'audit', label: 'Audit', icon: FileText, count: auditLogs.length },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  function handleSuspend(reason: string) {
    adminService.setOrganizationStatus(org!.id, 'SUSPENDED', reason)
    setSuspendOpen(false)
  }

  function handleReactivate() {
    adminService.setOrganizationStatus(org!.id, 'ACTIVE', 'Reactivated by Super Admin')
  }

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <div>
        <Link
          to="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink no-underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Organizations
        </Link>
      </div>

      {/* Organization Header */}
      <div className="rounded-2xl border border-line/80 bg-surface/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-line font-display text-xl font-bold text-signal">
              {org.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-bold tracking-tight text-ink">{org.name}</h1>
                <StatusBadge status={org.status} pulse={org.status === 'ACTIVE'} />
                <RiskBadge level={org.riskLevel} score={org.riskScore} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-ink-soft">
                <span>Tenant ID: <strong className="text-ink">{org.id}</strong></span>
                <span>•</span>
                <span>Domain: <strong className="text-ink">{org.domain}</strong></span>
                <span>•</span>
                <span>Plan: <strong className="text-signal">{org.planName}</strong></span>
                <span>•</span>
                <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
            {org.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => setSuspendOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/20 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <ShieldBan className="h-3.5 w-3.5" /> Suspend
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReactivate}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-3 py-1.5 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reactivate
              </button>
            )}
          </div>
        </div>

        {/* 12 Tabs Navigation */}
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Total Employees</span>
              <div className="font-display text-2xl font-bold text-ink mt-1">{org.employeeCount}</div>
              <span className="text-[11px] text-ink-soft">Seats: 500 max</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Healthy Devices</span>
              <div className="font-display text-2xl font-bold text-emerald-400 mt-1">
                {org.healthyDeviceCount} / {org.deviceCount}
              </div>
              <span className="text-[11px] text-ink-soft">Compliance: 98.2%</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Open Incidents</span>
              <div className="font-display text-2xl font-bold text-rose-400 mt-1">{org.openIncidentsCount}</div>
              <span className="text-[11px] text-ink-soft">Under investigation</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <span className="text-ink-soft text-xs">Monthly Billing (MRR)</span>
              <div className="font-display text-2xl font-bold text-signal mt-1">${org.mrr}</div>
              <span className="text-[11px] text-ink-soft">Status: {org.subscriptionStatus}</span>
            </div>
          </div>

          {/* Quick Details & Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-ink">Owner & Infrastructure</h3>
              <div className="space-y-2 text-ink">
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Owner Contact:</span>
                  <span className="text-ink font-semibold">{org.ownerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Owner Email:</span>
                  <span className="text-signal">{org.ownerEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Industry:</span>
                  <span>{org.industry ?? 'Defense'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/60">
                  <span className="text-ink-soft">Cloud Region:</span>
                  <span>{org.region ?? 'us-east-1'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-soft">Policy Violations:</span>
                  <span className="text-amber-400">{org.policyViolationsCount} recorded</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-ink">Security Timeline</h3>
              <div className="space-y-2.5">
                <div className="relative pl-3 border-l border-line space-y-0.5">
                  <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-signal" />
                  <span className="font-semibold text-ink">Security Audit Completed</span>
                  <p className="text-ink-soft text-[11px]">SOC2 Type II telemetry mapping verified.</p>
                </div>
                <div className="relative pl-3 border-l border-line space-y-0.5">
                  <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-ink">Device Quotas Scaled</span>
                  <p className="text-ink-soft text-[11px]">Expanded device allowance to 800 seats.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">Enrolled Employees ({org.employeeCount})</h3>
            <span className="text-ink-soft">Directory Sync: SCIM / Okta Active</span>
          </div>
          <table className="w-full text-left">
            <thead className="text-ink-soft border-b border-line">
              <tr>
                <th className="py-2">Employee</th>
                <th>Role</th>
                <th>Devices</th>
                <th>MFA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="py-2.5 text-ink font-semibold">{org.ownerName}</td>
                <td className="text-signal">ORG_ADMIN</td>
                <td>2 devices</td>
                <td className="text-emerald-400">WEBAUTHN</td>
                <td><StatusBadge status="ACTIVE" /></td>
              </tr>
              <tr>
                <td className="py-2.5 text-ink">Engineering Staff Lead</td>
                <td className="text-ink-soft">MEMBER</td>
                <td>1 device</td>
                <td className="text-emerald-400">TOTP</td>
                <td><StatusBadge status="ACTIVE" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">Tenant Devices ({devices.length})</h3>
            <Link to="/admin/devices" className="text-signal hover:underline">Full Inventory →</Link>
          </div>
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface-2/60">
                <div className="flex items-center gap-3">
                  <Laptop className="h-4 w-4 text-ink-soft" />
                  <div>
                    <Link to={`/admin/devices/${d.id}`} className="font-semibold text-ink hover:text-signal no-underline">
                      {d.hostname}
                    </Link>
                    <span className="block text-[11px] text-ink-soft">{d.platform} • {d.osVersion}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} />
                  <RiskBadge level={d.riskLevel} score={d.riskScore} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">Active Policy Bundles</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface-2/60">
              <div>
                <span className="font-semibold text-ink">Strict Removable Media Quarantine</span>
                <p className="text-[11px] text-ink-soft">Blocks unencrypted USB mass storage across macOS & Windows.</p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface-2/60">
              <div>
                <span className="font-semibold text-ink">Continuous BitLocker / FileVault Enforcement</span>
                <p className="text-[11px] text-ink-soft">Auto-isolates endpoints with disabled disk encryption.</p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">Security Incidents ({incidents.length})</h3>
          {incidents.length > 0 ? (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-ink">[{inc.severity}] {inc.title}</span>
                    <p className="text-[11px] text-ink-soft">{inc.summary}</p>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-soft py-4 text-center">No open incidents for this tenant.</p>
          )}
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="rounded-xl border border-line bg-surface p-4 text-xs font-mono space-y-3">
          <h3 className="font-display text-sm font-semibold text-ink">Subscription & Licensing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-line bg-surface-2/60 space-y-1.5">
              <span className="text-ink-soft">Plan Tier:</span>
              <div className="text-base font-bold text-ink">{org.planName}</div>
              <span className="text-signal">${org.mrr} / month</span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-surface-2/60 space-y-1.5">
              <span className="text-ink-soft">Renewal Date:</span>
              <div className="text-base font-bold text-ink">January 15, 2027</div>
              <span className="text-emerald-400">Auto-renew enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Audit / Other Tabs */}
      {['groups', 'security', 'alerts', 'activity', 'audit', 'settings'].includes(activeTab) && (
        <div className="rounded-xl border border-line bg-surface p-6 text-center text-xs font-mono text-ink-soft">
          <p className="text-ink font-semibold mb-1 capitalize">{activeTab} Details</p>
          <span>Live telemetry synced with Guardian Control Plane for {org.name}.</span>
        </div>
      )}

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={suspendOpen}
        title={`Suspend ${org.name}`}
        description="This will lock down all tenant user access and freeze new enrollments."
        consequences={[
          'All employee sessions revoked',
          'Agent telemetry restricted to audit log transmission only',
          'Invoices placed on hold',
        ]}
        confirmLabel="Confirm Suspension"
        variant="danger"
        onConfirm={handleSuspend}
        onCancel={() => setSuspendOpen(false)}
      />
    </div>
  )
}
