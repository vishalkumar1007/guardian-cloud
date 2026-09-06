import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  CreditCard,
  Plus,
  Check,
  ExternalLink,
  Edit,
  Power,
  PowerOff,
  Layers,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { Plan, PlanTier } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function PlansPage() {
  const navigate = useNavigate()
  const plans = useAdminData(() => adminService.getPlans())

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  const [planName, setPlanName] = useState('')
  const [planTier, setPlanTier] = useState<PlanTier>('BUSINESS')
  const [targetType, setTargetType] = useState<'PERSONAL' | 'ORGANIZATION'>('ORGANIZATION')
  const [priceMonthly, setPriceMonthly] = useState(25)
  const [deviceLimit, setDeviceLimit] = useState(100)
  const [employeeLimit, setEmployeeLimit] = useState(50)
  const [description, setDescription] = useState('')

  function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()
    adminService.createPlan({
      name: planName,
      tier: planTier,
      targetType,
      priceMonthly,
      priceAnnual: priceMonthly * 10,
      deviceLimit,
      employeeLimit,
      description,
      features: ['Core Endpoint Shield', 'Automated Patch Validation', '24/7 Threat Feeds'],
    })
    setCreateModalOpen(false)
    setPlanName('')
    setDescription('')
  }

  function handleTogglePlanStatus(p: Plan) {
    const newStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    adminService.updatePlan(p.id, { status: newStatus })
  }

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: 'name',
      header: 'Plan Name',
      cell: ({ row }) => (
        <div className="font-mono">
          <Link
            to={`/admin/plans/${row.original.id}`}
            className="font-bold text-ink hover:text-signal no-underline"
          >
            {row.original.name}
          </Link>
          <span className="block text-[10px] text-ink-soft">{row.original.description}</span>
        </div>
      ),
    },
    {
      accessorKey: 'targetType',
      header: 'Audience',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">[{row.original.targetType}]</span>
      ),
    },
    {
      accessorKey: 'priceMonthly',
      header: 'Monthly Price',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-signal">
          ${row.original.priceMonthly} / mo
        </span>
      ),
    },
    {
      accessorKey: 'deviceLimit',
      header: 'Device Limit',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.deviceLimit} devices</span>
      ),
    },
    {
      accessorKey: 'employeeLimit',
      header: 'Employee Limit',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">{row.original.employeeLimit} seats</span>
      ),
    },
    {
      accessorKey: 'subscriberCount',
      header: 'Subscribers',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {row.original.subscriberCount.toLocaleString()}
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
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center justify-end gap-1 font-mono">
            <Link
              to={`/admin/plans/${p.id}`}
              className="p-1 rounded text-ink-soft hover:text-ink hover:bg-surface-2"
              title="Plan Details"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => handleTogglePlanStatus(p)}
              className="p-1 rounded text-ink-soft hover:text-signal hover:bg-surface-2"
              title={p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            >
              {p.status === 'ACTIVE' ? <PowerOff className="h-3.5 w-3.5 text-rose-400" /> : <Power className="h-3.5 w-3.5 text-emerald-400" />}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-signal" />
            Guardian Commercial Plans Catalog
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            Manage public and custom pricing tiers, feature gates, seat allowances, and subscriber quotas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Plan
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-line/80 bg-surface p-4 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-signal font-semibold">
                  {p.tier}
                </span>
                <StatusBadge status={p.status} />
              </div>
              <h3 className="font-display text-base font-bold text-ink mt-1">{p.name}</h3>
              <div className="mt-2 font-mono">
                <span className="text-2xl font-bold text-ink">${p.priceMonthly}</span>
                <span className="text-ink-soft text-xs"> / mo</span>
              </div>
              <p className="text-[11px] text-ink-soft mt-1 line-clamp-2">{p.description}</p>
            </div>

            <div className="border-t border-line/80 pt-2 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-ink-soft">
                <span>Devices:</span>
                <span className="text-ink font-semibold">{p.deviceLimit}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Subscribers:</span>
                <span className="text-emerald-400 font-semibold">{p.subscriberCount}</span>
              </div>
              <Link
                to={`/admin/plans/${p.id}`}
                className="block text-center rounded-lg bg-surface-2 border border-line py-1.5 text-ink hover:text-ink hover:border-line transition-colors no-underline text-xs mt-2"
              >
                Inspect Plan →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Full Catalog Table */}
      <DataTable
        columns={columns}
        data={plans}
        searchKey="name"
        searchPlaceholder="Search plans…"
      />

      {/* Create Plan Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="font-display text-base font-semibold text-ink">Create Commercial Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Plan Name *</label>
                <input
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Guardian Business Ultra"
                  className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Tier</label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="FREE">Free</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="BUSINESS">Business</option>
                    <option value="BUSINESS_PLUS">Business Plus</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Target Audience</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="ORGANIZATION">Organization</option>
                    <option value="PERSONAL">Personal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Monthly ($)</label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Device Limit</label>
                  <input
                    type="number"
                    value={deviceLimit}
                    onChange={(e) => setDeviceLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-ink block font-semibold">Seat Limit</label>
                  <input
                    type="number"
                    value={employeeLimit}
                    onChange={(e) => setEmployeeLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-ink block font-semibold">Plan Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Target demographic and core value proposition..."
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
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
