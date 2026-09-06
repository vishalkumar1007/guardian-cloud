import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Users,
  ExternalLink,
  ShieldBan,
  RotateCcw,
  Archive,
  CreditCard,
  Plus,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { IndividualUser } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { RiskBadge } from '../../../components/admin/RiskBadge'
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog'

export function UserListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')

  const users = useAdminData(() => {
    const list = adminService.getUsers()
    if (statusParam) {
      return list.filter((u) => u.status.toUpperCase() === statusParam.toUpperCase())
    }
    return list
  })

  const [selectedUser, setSelectedUser] = useState<IndividualUser | null>(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPlan, setNewUserPlan] = useState<'PERSONAL' | 'FREE'>('PERSONAL')

  function handleConfirmSuspend(reason: string) {
    if (!selectedUser) return
    adminService.setUserStatus(selectedUser.id, 'SUSPENDED', reason)
    setSuspendOpen(false)
    setSelectedUser(null)
  }

  function handleConfirmArchive(reason: string) {
    if (!selectedUser) return
    adminService.setUserStatus(selectedUser.id, 'ARCHIVED', reason)
    setArchiveOpen(false)
    setSelectedUser(null)
  }

  function handleReactivate(u: IndividualUser) {
    adminService.setUserStatus(u.id, 'ACTIVE', 'Reactivated by Super Admin')
  }

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    adminService.createUser({
      name: newUserName,
      email: newUserEmail,
      planTier: newUserPlan,
    })
    setCreateModalOpen(false)
    setNewUserName('')
    setNewUserEmail('')
  }

  const columns: ColumnDef<IndividualUser>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sky-400 font-bold border border-line/60 font-mono text-xs">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/admin/users/${u.id}`}
                className="font-semibold text-ink hover:text-signal truncate block no-underline transition-colors"
              >
                {u.name}
              </Link>
              <span className="font-mono text-[10px] text-ink-soft truncate block">{u.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => <span className="font-mono text-xs text-ink">{row.original.planName}</span>,
    },
    {
      accessorKey: 'deviceCount',
      header: 'Devices',
      cell: ({ row }) => <span className="font-mono text-xs text-ink">{row.original.deviceCount} endpoints</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'riskLevel',
      header: 'Risk',
      cell: ({ row }) => <RiskBadge level={row.original.riskLevel} score={row.original.riskScore} />,
    },
    {
      accessorKey: 'securityScore',
      header: 'Security Score',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {row.original.securityScore} / 100
        </span>
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Subscription',
      cell: ({ row }) => <span className="font-mono text-xs text-ink-soft">{row.original.subscriptionStatus}</span>,
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/users/${u.id}`}
              className="p-1 text-ink-soft hover:text-ink rounded hover:bg-surface-2"
              title="View User"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>

            {u.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(u)
                  setSuspendOpen(true)
                }}
                className="p-1 text-ink-soft hover:text-rose-400 rounded hover:bg-surface-2"
                title="Suspend User"
              >
                <ShieldBan className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleReactivate(u)}
                className="p-1 text-ink-soft hover:text-emerald-400 rounded hover:bg-surface-2"
                title="Reactivate User"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedUser(u)
                setArchiveOpen(true)
              }}
              className="p-1 text-ink-soft hover:text-amber-400 rounded hover:bg-surface-2"
              title="Archive User"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            Individual Users
            {statusParam && (
              <span className="text-xs font-mono text-ink-soft uppercase font-normal">
                / {statusParam}
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Personal plan accounts, device posture, and self-hosted backup verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search individual users by name or email…"
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
            id: 'planName',
            label: 'Plan',
            options: [
              { label: 'Personal', value: 'Guardian Personal' },
              { label: 'Free', value: 'Guardian Free' },
            ],
          },
          {
            id: 'riskLevel',
            label: 'Risk',
            options: [
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Critical', value: 'CRITICAL' },
            ],
          },
        ]}
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
      />

      <ConfirmDialog
        isOpen={suspendOpen}
        title={`Suspend ${selectedUser?.name ?? 'User'}`}
        description="Disable account access and stop device sync."
        consequences={[
          'Revoke all user active sessions',
          'Lock personal recovery portal access',
          'Keep device telemetry in audit hold',
        ]}
        confirmLabel="Suspend User"
        variant="danger"
        onConfirm={handleConfirmSuspend}
        onCancel={() => setSuspendOpen(false)}
      />

      <ConfirmDialog
        isOpen={archiveOpen}
        title={`Archive ${selectedUser?.name ?? 'User'}`}
        description="Archive user records and disassociate endpoint certificates."
        consequences={['Permanently tag account as ARCHIVED', 'Preserve event history']}
        confirmLabel="Archive User"
        variant="warning"
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveOpen(false)}
      />

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">Create Individual User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Full Name *</label>
                <input
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. David Chen"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Email *</label>
                <input
                  required
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="david.chen@example.com"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Plan</label>
                <select
                  value={newUserPlan}
                  onChange={(e) => setNewUserPlan(e.target.value as any)}
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                >
                  <option value="PERSONAL">Guardian Personal ($9.99/mo)</option>
                  <option value="FREE">Guardian Free</option>
                </select>
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
