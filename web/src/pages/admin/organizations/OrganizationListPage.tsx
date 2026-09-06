import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Building2,
  Plus,
  MoreHorizontal,
  ExternalLink,
  ShieldBan,
  RotateCcw,
  Archive,
  CreditCard,
  Edit,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { Organization, TenantStatus } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog'

export function OrganizationListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')

  const organizations = useAdminData(() => {
    const list = adminService.getOrganizations()
    if (statusParam) {
      return list.filter((o) => o.status.toUpperCase() === statusParam.toUpperCase())
    }
    return list
  })

  // Dialog states
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [newPlanTier, setNewPlanTier] = useState('ENTERPRISE')

  function handleOpenSuspend(org: Organization) {
    setSelectedOrg(org)
    setSuspendDialogOpen(true)
  }

  function handleConfirmSuspend(reason: string) {
    if (!selectedOrg) return
    adminService.setOrganizationStatus(selectedOrg.id, 'SUSPENDED', reason)
    setSuspendDialogOpen(false)
    setSelectedOrg(null)
  }

  function handleOpenArchive(org: Organization) {
    setSelectedOrg(org)
    setArchiveDialogOpen(true)
  }

  function handleConfirmArchive(reason: string) {
    if (!selectedOrg) return
    adminService.setOrganizationStatus(selectedOrg.id, 'ARCHIVED', reason)
    setArchiveDialogOpen(false)
    setSelectedOrg(null)
  }

  function handleReactivate(org: Organization) {
    adminService.setOrganizationStatus(org.id, 'ACTIVE', 'Reactivated by Super Admin')
  }

  function handleChangePlanSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrg) return
    const planNames: Record<string, string> = {
      BUSINESS: 'Guardian Business',
      BUSINESS_PLUS: 'Guardian Business Plus',
      ENTERPRISE: 'Guardian Enterprise',
    }
    adminService.updateOrganization(selectedOrg.id, {
      planTier: newPlanTier as any,
      planName: planNames[newPlanTier] ?? 'Custom Plan',
    })
    setPlanModalOpen(false)
    setSelectedOrg(null)
  }

  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: 'name',
      header: 'Organization',
      cell: ({ row }) => {
        const org = row.original
        return (
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-signal font-bold border border-line/60 font-mono text-xs">
              {org.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/admin/organizations/${org.id}`}
                className="font-semibold text-ink hover:text-signal truncate block no-underline transition-colors"
              >
                {org.name}
              </Link>
              <span className="font-mono text-[11px] text-ink-soft truncate block">{org.domain}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink whitespace-nowrap">
          {row.original.planName}
        </span>
      ),
    },
    {
      accessorKey: 'employeeCount',
      header: 'Employees',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">
          {row.original.employeeCount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'deviceCount',
      header: 'Devices',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">
          {row.original.healthyDeviceCount} / {row.original.deviceCount}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'riskLevel',
      header: 'Risk',
      cell: ({ row }) => (
        <RiskBadge level={row.original.riskLevel} score={row.original.riskScore} />
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Subscription',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink-soft">
          {row.original.subscriptionStatus} (${row.original.mrr}/mo)
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'lastActiveAt',
      header: 'Last Active',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const org = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/organizations/${org.id}`}
              className="p-1 text-ink-soft hover:text-ink rounded hover:bg-surface-2"
              title="View Details"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setSelectedOrg(org)
                setNewPlanTier(org.planTier)
                setPlanModalOpen(true)
              }}
              className="p-1 text-ink-soft hover:text-signal rounded hover:bg-surface-2"
              title="Change Plan"
            >
              <CreditCard className="h-4 w-4" />
            </button>

            {org.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => handleOpenSuspend(org)}
                className="p-1 text-ink-soft hover:text-rose-400 rounded hover:bg-surface-2"
                title="Suspend Organization"
              >
                <ShieldBan className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleReactivate(org)}
                className="p-1 text-ink-soft hover:text-emerald-400 rounded hover:bg-surface-2"
                title="Reactivate Organization"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenArchive(org)}
              className="p-1 text-ink-soft hover:text-amber-400 rounded hover:bg-surface-2"
              title="Archive Organization"
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Building2 className="h-5 w-5 text-signal" />
            Customer Organizations
            {statusParam && (
              <span className="text-xs font-mono text-ink-soft uppercase font-normal">
                / {statusParam}
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Fleet governance, tenant risk, seat allocation, and compliance telemetry.
          </p>
        </div>

        <Link
          to="/admin/organizations/new"
          className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto no-underline"
        >
          <Plus className="h-4 w-4" /> Onboard Organization
        </Link>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={organizations}
        searchKey="name"
        searchPlaceholder="Filter organizations by name or domain…"
        filterOptions={[
          {
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Trial', value: 'TRIAL' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Archived', value: 'ARCHIVED' },
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
          {
            id: 'planName',
            label: 'Plan',
            options: [
              { label: 'Enterprise', value: 'Guardian Enterprise' },
              { label: 'Business Plus', value: 'Guardian Business Plus' },
              { label: 'Business', value: 'Guardian Business' },
            ],
          },
        ]}
        onRowClick={(row) => navigate(`/admin/organizations/${row.id}`)}
      />

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={suspendDialogOpen}
        title={`Suspend ${selectedOrg?.name ?? 'Organization'}`}
        description="Temporarily cut off tenant access while preserving data for audit."
        consequences={[
          'Disable all organization user access immediately',
          'Stop new device enrollments and token generation',
          'Preserve existing audit records, device history, and telemetry',
          'Notify tenant primary admin via email',
        ]}
        confirmLabel="Suspend Organization"
        variant="danger"
        onConfirm={handleConfirmSuspend}
        onCancel={() => setSuspendDialogOpen(false)}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={archiveDialogOpen}
        title={`Archive ${selectedOrg?.name ?? 'Organization'}`}
        description="Permanently disable tenant and release seat quotas."
        consequences={[
          'Mark organization as permanently ARCHIVED',
          'Revoke all agent communication tokens',
          'Retain records per 7-year statutory compliance',
        ]}
        confirmLabel="Archive Organization"
        variant="warning"
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveDialogOpen(false)}
      />

      {/* Change Plan Modal */}
      {planModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">
              Change Plan for {selectedOrg.name}
            </h3>
            <form onSubmit={handleChangePlanSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-ink-soft block font-semibold">Select Tier</label>
                <select
                  value={newPlanTier}
                  onChange={(e) => setNewPlanTier(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                >
                  <option value="BUSINESS">Guardian Business ($18/mo)</option>
                  <option value="BUSINESS_PLUS">Guardian Business Plus ($28/mo)</option>
                  <option value="ENTERPRISE">Guardian Enterprise ($45/mo)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-ink hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
