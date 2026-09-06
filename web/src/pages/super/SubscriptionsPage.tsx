import { useEffect, useState } from 'react'
import { CreditCard, Search } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type Sub = { id: string; tenant_name: string; plan_name: string; status: string; current_period_end?: string }

export function SubscriptionsPage() {
  const [items, setItems] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/subscriptions`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((s) => s.tenant_name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><CreditCard className="h-5 w-5 text-signal" /> Subscriptions</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Recurring billing, seat quotas and telemetry.</p>
        </div>
        <Badge variant="soft">{items.length} Active</Badge>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="p-3 border-b border-line">
          <div className="relative max-w-[360px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenant…" className="h-8 w-full rounded-xl border border-line bg-surface-2 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-ink-soft">Loading subscriptions…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-sm font-semibold text-ink">No subscriptions</p>
            <p className="mt-1 font-mono text-xs text-ink-soft">Subscriptions appear after tenant provisioning.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Tenant</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Period End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-medium text-ink">{s.tenant_name}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.plan_name}</td>
                    <td className="px-4 py-3"><Badge variant={s.status === 'ACTIVE' ? 'signal' : 'soft'} className="text-[10px]">{s.status}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
