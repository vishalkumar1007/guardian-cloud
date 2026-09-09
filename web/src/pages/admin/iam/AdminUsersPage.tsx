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
  Mail,
  Users,
  Fingerprint,
  Clock,
  Crown,
  Settings2,
  UserPlus,
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

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRoleType>('SUPPORT_ADMIN')
  const [team, setTeam] = useState('Support')
  const [requireMfa, setRequireMfa] = useState(false)
  const [sendInvite, setSendInvite] = useState(true)
  const [expiry, setExpiry] = useState('7')

  const ROLE_META: Record<AdminRoleType, { label: string; desc: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', desc: 'Full platform control' },
    OPERATIONS_ADMIN: { label: 'Operations', desc: 'Health, agents, features' },
    SECURITY_ADMIN: { label: 'Security', desc: 'Events, incidents, risk' },
    SUPPORT_ADMIN: { label: 'Support', desc: 'Tenants, users, devices' },
    BILLING_ADMIN: { label: 'Billing', desc: 'Plans, subscriptions' },
    READ_ONLY_ADMIN: { label: 'Read Only', desc: 'View-only audit' },
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    adminService.createAdmin({ name, email, role, team })
    setCreateModalOpen(false)
    setName('')
    setEmail('')
    setRequireMfa(true)
    setSendInvite(true)
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[560px] max-h-[92dvh] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-line">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal text-white shadow-sm"><UserPlus className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-display text-[16px] font-bold tracking-tight text-ink">Provision super-admin</h3>
                    <p className="font-mono text-[11px] leading-relaxed text-ink-soft">Create an isolated control-plane account. Invite is audit-logged, tenant-free.</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-[10px] font-semibold text-signal"><Crown className="h-3 w-3" /> CONTROL PLANE</span>
              </div>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-soft flex items-center gap-1.5"><Mail className="h-3 w-3" /> Identity</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="font-mono text-xs font-semibold text-ink">Full name *</span>
                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Rachel Foster" className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/20" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-mono text-xs font-semibold text-ink">Corporate email *</span>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rachel@guardian.internal" className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-signal/20" />
                  </label>
                </div>
                <p className="font-mono text-[11px] text-ink-soft/70">@guardian.internal enforced · invitation expires in {expiry} days</p>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-soft flex items-center gap-1.5"><Settings2 className="h-3 w-3" /> Access</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="font-mono text-xs font-semibold text-ink">Role</span>
                    <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20">
                      {(Object.keys(ROLE_META) as AdminRoleType[]).map((k) => (
                        <option key={k} value={k}>{ROLE_META[k].label} — {ROLE_META[k].desc}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-mono text-xs font-semibold text-ink flex items-center gap-1"><Users className="h-3 w-3" />Team</span>
                    <select value={team} onChange={(e) => setTeam(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20">
                      <option value="Platform">Platform</option>
                      <option value="Security">Security</option>
                      <option value="Operations">Operations</option>
                      <option value="Support">Support</option>
                      <option value="Billing">Billing</option>
                    </select>
                  </label>
                </div>
                <div className="rounded-xl border border-signal/15 bg-signal-soft/40 px-3 py-2.5 flex gap-2">
                  <Shield className="h-3.5 w-3.5 text-signal mt-0.5 shrink-0" />
                  <p className="font-mono text-[11px] leading-relaxed text-ink-soft"><b className="text-ink">{ROLE_META[role].label}</b> — {ROLE_META[role].desc}. Permissions derive from role; least-privilege by default. Manage in <Link to="/admin/iam/roles" className="text-signal hover:underline">Roles</Link>.</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-soft flex items-center gap-1.5"><Fingerprint className="h-3 w-3" /> Security & invite</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 cursor-pointer">
                    <input type="checkbox" checked={requireMfa} onChange={(e) => setRequireMfa(e.target.checked)} className="h-3.5 w-3.5 rounded border-line accent-signal" />
                    <span className="font-mono text-xs font-semibold text-ink">Require MFA</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 cursor-pointer">
                    <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} className="h-3.5 w-3.5 rounded border-line accent-signal" />
                    <span className="font-mono text-xs font-semibold text-ink">Send email invite</span>
                  </label>
                  <label className="space-y-1">
                    <span className="font-mono text-[11px] font-semibold text-ink flex items-center gap-1"><Clock className="h-3 w-3" />Expiry</span>
                    <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 px-2.5 py-2 text-xs text-ink">
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                    </select>
                  </label>
                </div>
                <p className="font-mono text-[11px] text-ink-soft/70">New admin starts as <b className="text-ink">INVITED</b> → must set password + enroll MFA before ACTIVE. Hardware MFA reset available after provision.</p>
              </div>
            </form>

            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-line bg-surface-2/50">
              <p className="font-mono text-[11px] text-ink-soft hidden sm:block">Audit-logged · tenant-free · HSM-backed</p>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-xl border border-line bg-surface px-4 py-2.5 font-mono text-xs font-semibold text-ink hover:bg-surface-2">Cancel</button>
                <button type="button" onClick={(e) => handleCreate(e as any)} className="rounded-xl bg-signal hover:bg-signal/90 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-sm">Provision account →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
