import { useEffect, useState } from 'react'
import { Building2, Search, ShieldCheck } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type Tenant = { id: string; name: string; type: string; status: string; created_at?: string }

export function OrganizationsPage() {
  const [items, setItems] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/organizations`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.type.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><Building2 className="h-5 w-5 text-signal" /> Organizations</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Tenant organizations — zero-trust isolation per tenant.</p>
        </div>
        <Badge variant="signal">{items.length} Active</Badge>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-line">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenants…" className="h-8 w-full rounded-xl border border-line bg-surface-2 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none" />
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1 font-mono text-xs font-medium text-signal"><ShieldCheck className="h-3 w-3" /> Isolated</span>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-ink-soft">Loading tenants…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-line"><Building2 className="h-5 w-5 text-ink-soft" /></div>
            <p className="mt-3 font-display text-sm font-semibold text-ink">No organizations yet</p>
            <p className="mt-1 font-mono text-xs text-ink-soft">Tenants appear here after first Personal/Org signup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
                    <td className="px-4 py-3"><Badge variant={t.type === 'ORGANIZATION' ? 'signal' : 'soft'} className="text-[10px]">{t.type}</Badge></td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>{t.status}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
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
