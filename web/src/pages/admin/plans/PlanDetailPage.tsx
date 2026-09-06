import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CreditCard,
  Check,
  Users,
  Laptop,
  ArrowLeft,
  DollarSign,
  History,
  Sliders,
} from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { StatusBadge } from '../../../components/admin/StatusBadge'
import { cn } from '../../../lib/utils'

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')

  const plan = useAdminData(() => adminService.getPlanById(id ?? ''))
  const subscriptions = useAdminData(() => adminService.getSubscriptions().filter((s) => s.planId === id || s.planTier === plan?.tier))

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-3 font-mono">
        <h2 className="text-base text-ink">Plan Not Found</h2>
        <Link to="/admin/plans" className="text-signal hover:underline text-xs">
          ← Back to Plans
        </Link>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'limits', label: 'Limits' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'subscribers', label: 'Subscribers', count: subscriptions.length },
    { id: 'usage', label: 'Usage' },
    { id: 'history', label: 'History' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/plans"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Plans
        </Link>
      </div>

      <div className="rounded-2xl border border-line/80 bg-surface/90 p-5 shadow-sm space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-xl font-bold text-ink">{plan.name}</h1>
              <StatusBadge status={plan.status} />
              <span className="text-signal text-xs font-semibold">[{plan.tier}]</span>
            </div>
            <p className="text-xs text-ink-soft mt-1">{plan.description}</p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold text-ink font-mono">${plan.priceMonthly}</span>
            <span className="text-ink-soft text-xs"> / mo</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3 text-xs overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors',
                activeTab === t.id
                  ? 'bg-signal/10 text-signal font-semibold border border-signal/20'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {t.label} {t.count !== undefined && `(${t.count})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-ink-soft">Max Device Quota:</span>
            <div className="text-xl font-bold text-ink">{plan.deviceLimit} devices</div>
          </div>
          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-ink-soft">Max Employee Seats:</span>
            <div className="text-xl font-bold text-ink">{plan.employeeLimit} seats</div>
          </div>
          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-ink-soft">Annual Discount:</span>
            <div className="text-xl font-bold text-emerald-400">${plan.priceAnnual} / yr (Save 17%)</div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="p-4 rounded-xl border border-line bg-surface font-mono text-xs space-y-3">
          <h3 className="text-ink font-semibold">Included Entitlements & Features</h3>
          <div className="space-y-2">
            {plan.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-ink">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div className="p-4 rounded-xl border border-line bg-surface font-mono text-xs space-y-3">
          <h3 className="text-ink font-semibold">Active Subscribers ({subscriptions.length})</h3>
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-3 rounded-lg border border-line bg-surface-2/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-ink">{sub.customerName}</span>
                  <span className="block text-[11px] text-ink-soft">{sub.customerEmail} • {sub.billingInterval}</span>
                </div>
                <div className="text-right">
                  <span className="text-signal font-bold">${sub.mrr}/mo</span>
                  <StatusBadge status={sub.status} className="ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {['limits', 'pricing', 'usage', 'history'].includes(activeTab) && (
        <div className="p-6 rounded-xl border border-line bg-surface text-center font-mono text-xs text-ink-soft">
          <p className="text-ink font-semibold mb-1 capitalize">{activeTab} Matrix</p>
          <span>Catalog parameters for {plan.name}.</span>
        </div>
      )}
    </div>
  )
}
