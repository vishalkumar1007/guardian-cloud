import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  KeyRound,
  Plus,
  Shield,
  ShieldBan,
  RotateCcw,
  Key,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { GuardianAdminUser, AdminRoleType } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const admins = useAdminData(() => adminService.getAdmins())

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<GuardianAdminUser | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRoleType>('SUPPORT_ADMIN')
  const [team, setTeam] = useState('Support')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    adminService.createAdmin({ name, email, role, team })
    setCreateModalOpen(false)
    setName('')
    setEmail('')
  }

  function handleConfirmSuspend(reason: string) {
    if (!selectedAdmin) return
    adminService.setAdminStatus(selectedAdmin.id, 'SUSPENDED')
    setSuspendDialogOpen(false)
    setSelectedAdmin(null)
  }

  function handleConfirmRemove(reason: string) {
    if (!selectedAdmin) return
    adminService.removeAdmin(selectedAdmin.id)
    setRemoveDialogOpen(false)
    setSelectedAdmin(null)
  }

  function handleResetMfa(adm: GuardianAdminUser) {
    adminService.resetAdminMfa(adm.id)
    alert(`MFA has been reset for ${adm.name}. Temporary recovery instructions sent.`)
  }

  function handleReactivate(adm: GuardianAdminUser) {
    adminService.setAdminStatus(adm.id, 'ACTIVE')
  }

  const columns: ColumnDef<GuardianAdminUser>[] = [
    {
      accessorKey: 'name',
      header: 'Admin Name',
      cell: ({ row }) => (
        <div className="font-mono min-w-[180px]">
          <Link
            to={`/admin/iam/users/${row.original.id}`}
            className="font-bold text-ink hover:text-signal block truncate no-underline"
          >
            {row.original.name}
          </Link>
          <span className="text-[10px] text-ink-soft block truncate">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'roleTitle',
      header: 'Assigned Role',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-signal font-semibold">{row.original.roleTitle}</span>
      ),
    },
    {
      accessorKey: 'team',
      header: 'Team',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">[{row.original.team}]</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'mfaEnabled',
      header: 'Hardware MFA',
      cell: ({ row }) => (
        <span className={row.original.mfaEnabled ? 'text-emerald-400 font-mono text-xs font-bold' : 'text-rose-400 font-mono text-xs'}>
          {row.original.mfaEnabled ? 'ENFORCED' : 'DISABLED'}
        </span>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {row.original.lastLoginAt === 'Never'
            ? 'Never'
            : new Date(row.original.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className="flex items-center justify-end gap-1 font-mono">
            <Link
              to={`/admin/iam/users/${a.id}`}
              className="p-1 rounded text-ink-soft hover:text-ink hover:bg-surface-2"
              title="Admin Dossier"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => handleResetMfa(a)}
              className="p-1 rounded text-ink-soft hover:text-amber-400 hover:bg-surface-2"
              title="Reset MFA"
            >
              <Key className="h-3.5 w-3.5" />
            </button>

            {a.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedAdmin(a)
                  setSuspendDialogOpen(true)
                }}
                className="p-1 rounded text-ink-soft hover:text-rose-400 hover:bg-surface-2"
                title="Suspend Admin"
              >
                <ShieldBan className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleReactivate(a)}
                className="p-1 rounded text-ink-soft hover:text-emerald-400 hover:bg-surface-2"
                title="Reactivate Admin"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedAdmin(a)
                setRemoveDialogOpen(true)
              }}
              className="p-1 rounded text-ink-soft hover:text-rose-400 hover:bg-surface-2"
              title="Remove Admin"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
            <KeyRound className="h-5 w-5 text-signal" />
            Guardian IAM Internal Administrators
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Internal Guardian operations, security engineers, billing analysts, and super admin access controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Provision Admin
        </button>
      </div>

      <DataTable
        columns={columns}
        data={admins}
        searchKey="name"
        searchPlaceholder="Filter internal admins by name or email…"
        filterOptions={[
          {
            id: 'roleTitle',
            label: 'Role',
            options: [
              { label: 'Super Admin', value: 'Guardian Super Admin' },
              { label: 'Security Admin', value: 'Guardian Security Admin' },
              { label: 'Operations Admin', value: 'Guardian Operations Admin' },
              { label: 'Billing Admin', value: 'Guardian Billing Admin' },
              { label: 'Support Admin', value: 'Guardian Support Admin' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ],
          },
        ]}
        onRowClick={(row) => navigate(`/admin/iam/users/${row.id}`)}
      />

      <ConfirmDialog
        isOpen={suspendDialogOpen}
        title={`Suspend Admin Access for ${selectedAdmin?.name}`}
        description="Immediately revoke platform credentials and active sessions."
        consequences={[
          'Instantly invalidate JWT authentication tokens',
          'Revoke access to all tenant data and audit tables',
        ]}
        confirmLabel="Suspend Admin"
        variant="danger"
        onConfirm={handleConfirmSuspend}
        onCancel={() => setSuspendDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={removeDialogOpen}
        title={`Remove Admin ${selectedAdmin?.name}`}
        description="Permanently remove staff member from Guardian IAM."
        consequences={['Delete internal account identity', 'Retain prior audit action history']}
        confirmLabel="Remove Admin"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveDialogOpen(false)}
      />

      {/* Provision Admin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="font-display text-base font-semibold text-ink">Provision Guardian Administrator</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Admin Full Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rachel Foster"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Corporate Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rachel.foster@guardian.internal"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="SUPER_ADMIN">Guardian Super Admin</option>
                    <option value="OPERATIONS_ADMIN">Guardian Operations Admin</option>
                    <option value="SECURITY_ADMIN">Guardian Security Admin</option>
                    <option value="SUPPORT_ADMIN">Guardian Support Admin</option>
                    <option value="BILLING_ADMIN">Guardian Billing Admin</option>
                    <option value="READ_ONLY_ADMIN">Guardian Read Only Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Team</label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="Platform">Platform</option>
                    <option value="Security">Security</option>
                    <option value="Operations">Operations</option>
                    <option value="Support">Support</option>
                    <option value="Billing">Billing</option>
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
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
