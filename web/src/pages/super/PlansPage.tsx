import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type Plan = { id: string; name: string; tenant_type: string; tier: string; price_cents: number; billing_interval: string; device_limit?: number; active: boolean }

export function PlansPage() {
  const [items, setItems] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/plans`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><CreditCard className="h-5 w-5 text-signal" /> Subscription Plans</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Personal Basic and Enterprise tiers — pricing and quotas.</p>
        </div>
        <Badge variant="signal">{items.length} Plans</Badge>
      </div>

      {loading ? (
        <div className="p-8 text-center font-mono text-xs text-ink-soft">Loading plans…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-semibold text-ink">{p.name}</p>
                  <p className="font-mono text-xs text-ink-soft">{p.tenant_type} · {p.tier}</p>
                </div>
                <Badge variant={p.active ? 'signal' : 'soft'} className="text-[10px]">{p.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">${(p.price_cents / 100).toFixed(2)}<span className="font-mono text-xs font-normal text-ink-soft">/{p.billing_interval.toLowerCase()}</span></p>
              <p className="mt-2 font-mono text-xs text-ink-soft">Device limit: {p.device_limit ?? 'Unlimited'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
