import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { CreditCard, ExternalLink, X, Building2, User } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import type { Subscription } from '../../../types/admin'
import { DataTable } from '../../../components/admin/DataTable'
import { StatusBadge } from '../../../components/admin/StatusBadge'

export function SubscriptionsPage() {
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const customerTypeParam = searchParams.get('customerType')

  const subscriptions = useAdminData(() => {
    let list = adminService.getSubscriptions()
    if (customerTypeParam) {
      list = list.filter((s) => s.customerType === customerTypeParam)
    }
    if (statusParam) {
      list = list.filter((s) => s.status.toUpperCase() === statusParam.toUpperCase())
    }
    return list
  })

  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="font-mono min-w-[180px]">
          <span className="font-semibold text-ink block truncate">{row.original.customerName}</span>
          <span className="text-[10px] text-ink-soft block truncate">{row.original.customerEmail}</span>
        </div>
      ),
    },
    {
      accessorKey: 'customerType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">[{row.original.customerType}]</span>
      ),
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-signal font-semibold">{row.original.planName}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'seatsUsed',
      header: 'Seats',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">
          {row.original.seatsUsed} / {row.original.seatsAllocated}
        </span>
      ),
    },
    {
      accessorKey: 'devicesUsed',
      header: 'Devices',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink">
          {row.original.devicesUsed} / {row.original.devicesAllocated}
        </span>
      ),
    },
    {
      accessorKey: 'mrr',
      header: 'MRR',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-ink">
          ${row.original.mrr.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'startedAt',
      header: 'Started',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.startedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'renewsAt',
      header: 'Renewal',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
          {new Date(row.original.renewsAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedSub(row.original)}
          className="p-1 rounded text-ink-soft hover:text-signal hover:bg-surface-2"
          title="Inspect Subscription"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            {customerTypeParam === 'PERSONAL' ? <User className="h-5 w-5 text-sky-500" /> : customerTypeParam === 'ORGANIZATION' ? <Building2 className="h-5 w-5 text-orange-500" /> : <CreditCard className="h-5 w-5 text-signal" />}
            {customerTypeParam === 'PERSONAL' ? 'Personal Subscriptions' : customerTypeParam === 'ORGANIZATION' ? 'Enterprise Subscriptions' : 'Active Subscriptions & Licenses'}
            {customerTypeParam && (
              <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs font-mono font-semibold text-ink">
                {customerTypeParam}
              </span>
            )}
            {statusParam && (
              <span className="text-xs font-mono text-ink-soft uppercase font-normal">/ {statusParam}</span>
            )}
          </h1>
          <p className="text-xs text-ink-soft font-mono mt-0.5">
            {customerTypeParam === 'PERSONAL'
              ? 'B2C personal licenses — per-user MRR, device allocation, and renewal.'
              : customerTypeParam === 'ORGANIZATION'
                ? 'B2B enterprise subscriptions — pooled seats, fleet quotas, and org MRR.'
                : 'Real-time MRR, seat allocations, billing renewal cycles, and invoice statuses.'}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={subscriptions}
        searchKey="customerName"
        searchPlaceholder="Filter subscriptions by customer or email…"
        filterOptions={[
          {
            id: 'customerType',
            label: 'Customer Type',
            options: [
              { label: 'Organization', value: 'ORGANIZATION' },
              { label: 'Personal', value: 'PERSONAL' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Trialing', value: 'TRIALING' },
              { label: 'Past Due', value: 'PAST_DUE' },
            ],
          },
        ]}
        onRowClick={(row) => setSelectedSub(row)}
      />

      {/* Subscription Drawer */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between font-mono text-xs overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-signal" />
                  <span className="font-display text-base font-bold text-ink">Subscription Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="text-ink-soft hover:text-ink p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-ink">
                <div className="p-3 rounded-xl border border-line bg-surface-2/50 space-y-1">
                  <span className="text-[10px] text-ink-soft uppercase">Customer Account</span>
                  <div className="font-bold text-ink text-sm">{selectedSub.customerName}</div>
                  <span className="text-ink-soft">{selectedSub.customerEmail}</span>
                  <div className="pt-1">
                    <StatusBadge status={selectedSub.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl border border-line bg-surface-2/60">
                    <span className="text-ink-soft">Plan Tier</span>
                    <div className="font-bold text-ink mt-1">{selectedSub.planName}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-line bg-surface-2/60">
                    <span className="text-ink-soft">MRR</span>
                    <div className="font-bold text-signal mt-1">${selectedSub.mrr} / mo</div>
                  </div>
                  <div className="p-3 rounded-xl border border-line bg-surface-2/60">
                    <span className="text-ink-soft">Seats In Use</span>
                    <div className="font-bold text-ink mt-1">
                      {selectedSub.seatsUsed} / {selectedSub.seatsAllocated}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-line bg-surface-2/60">
                    <span className="text-ink-soft">Devices Enrolled</span>
                    <div className="font-bold text-ink mt-1">
                      {selectedSub.devicesUsed} / {selectedSub.devicesAllocated}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-line bg-surface-2/60 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Billing Interval:</span>
                    <span className="text-ink">{selectedSub.billingInterval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Started:</span>
                    <span className="text-ink">{new Date(selectedSub.startedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Renews:</span>
                    <span className="text-emerald-400 font-semibold">
                      {new Date(selectedSub.renewsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="w-full rounded-lg border border-line bg-surface-2 py-2 text-ink hover:text-ink"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
