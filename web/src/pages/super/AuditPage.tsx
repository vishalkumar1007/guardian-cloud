import { useEffect, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type Log = { id: string; actor_type: string; action: string; target_type?: string; occurred_at?: string }

export function AuditPage() {
  const [items, setItems] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/audit`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((l) => l.action.toLowerCase().includes(query.toLowerCase()) || l.actor_type.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><FileText className="h-5 w-5 text-signal" /> Audit Log</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Immutable ledger — all super-admin and system actions.</p>
        </div>
        <Badge variant="signal">Sealed</Badge>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="p-3 border-b border-line">
          <div className="relative max-w-[360px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action or actor…" className="h-8 w-full rounded-xl border border-line bg-surface-2 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-ink-soft">Loading audit trail…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-line"><FileText className="h-5 w-5 text-ink-soft" /></div>
            <p className="mt-3 font-display text-sm font-semibold text-ink">No audit events</p>
            <p className="mt-1 font-mono text-xs text-ink-soft">Actions will appear here as they are sealed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Actor</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Target</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3"><Badge variant="soft" className="text-[10px]">{l.actor_type}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-ink">{l.action}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{l.target_type || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{l.occurred_at ? new Date(l.occurred_at).toLocaleString() : '—'}</td>
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
