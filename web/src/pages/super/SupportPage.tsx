import { useEffect, useState } from 'react'
import { LifeBuoy, Search } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type Ticket = { id: string; actor_type: string; action: string; occurred_at?: string }

export function SupportPage() {
  const [items, setItems] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/support`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-signal" /> Support</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Customer escalations and lock tickets.</p>
        </div>
        <Badge variant="alert">{items.length} Open</Badge>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="p-3 border-b border-line flex items-center gap-3">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            <input placeholder="Search tickets…" className="h-8 w-full rounded-xl border border-line bg-surface-2 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none" />
          </div>
          <span className="hidden sm:inline-flex rounded-full bg-ink text-mist px-2.5 py-1 font-mono text-xs">Queue</span>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-ink-soft">Loading support feed…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20"><LifeBuoy className="h-5 w-5 text-emerald-600" /></div>
            <p className="mt-3 font-display text-sm font-semibold text-ink">No open tickets</p>
            <p className="mt-1 font-mono text-xs text-ink-soft">Support queue is clear — 100% SLA.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {items.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-surface-2/50">
                <div>
                  <p className="font-mono text-xs font-semibold text-ink">{t.action}</p>
                  <p className="font-mono text-[11px] text-ink-soft">{t.actor_type} · {t.occurred_at ? new Date(t.occurred_at).toLocaleDateString() : ''}</p>
                </div>
                <Badge variant="soft" className="text-[10px]">Open</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
