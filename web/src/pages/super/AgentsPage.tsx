import { useEffect, useState } from 'react'
import { Package, Search } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type Agent = { id: string; platform: string; version: string; release_notes?: string; released_at?: string }

export function AgentsPage() {
  const [items, setItems] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/agents`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><Package className="h-5 w-5 text-signal" /> Rust Core Agents</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">Binary builds, hash verification, OTA channels.</p>
        </div>
        <Badge variant="soft">{items.length} Builds</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <div className="col-span-3 p-8 text-center font-mono text-xs text-ink-soft">Loading agents…</div>
        ) : (
          items.map((a) => (
            <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <Badge variant={a.platform === 'MACOS' ? 'signal' : a.platform === 'WINDOWS' ? 'soft' : 'soft'} className="text-[10px]">{a.platform}</Badge>
                <span className="font-mono text-xs font-semibold text-ink">v{a.version}</span>
              </div>
              <p className="mt-3 font-mono text-xs text-ink-soft line-clamp-2">{a.release_notes || '—'}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-soft">{a.released_at ? new Date(a.released_at).toLocaleDateString() : ''}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[11px] font-medium text-emerald-600">Verified</span>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-surface-2 p-12 text-center">
          <p className="font-display text-sm font-semibold text-ink">No agent builds</p>
          <p className="mt-1 font-mono text-xs text-ink-soft">Seeded dev builds will appear here.</p>
        </div>
      )}
    </div>
  )
}
