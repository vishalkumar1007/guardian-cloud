import { useEffect, useState } from 'react'
import { Users as UsersIcon, Search, ShieldCheck, Crown } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8083'
}

type User = { id: string; email: string; display_name: string; status: string; platform_role: string; created_at?: string }

export function UsersPage() {
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${apiBase()}/api/v1/platform/users`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((u) => u.email.toLowerCase().includes(query.toLowerCase()) || (u.display_name && u.display_name.toLowerCase().includes(query.toLowerCase())))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><UsersIcon className="h-5 w-5 text-signal" /> Platform Users</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">All identities — platform admins and tenant members.</p>
        </div>
        <Badge variant="soft">{items.length} Total</Badge>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-line">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email or name…" className="h-8 w-full rounded-xl border border-line bg-surface-2 pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none" />
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-ink text-mist px-2.5 py-1 font-mono text-xs"><Crown className="h-3 w-3" /> RBAC</span>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-ink-soft">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-line"><UsersIcon className="h-5 w-5 text-ink-soft" /></div>
            <p className="mt-3 font-display text-sm font-semibold text-ink">No users yet</p>
            <p className="mt-1 font-mono text-xs text-ink-soft">Users appear after signup or admin provisioning.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Display Name</th>
                  <th className="px-4 py-2.5 font-medium">Platform Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-ink">{u.email}</td>
                    <td className="px-4 py-3 text-ink-soft">{u.display_name || '—'}</td>
                    <td className="px-4 py-3">{u.platform_role ? <Badge variant="signal" className="text-[10px]">{u.platform_role}</Badge> : <span className="font-mono text-xs text-ink-soft">—</span>}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium border ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}><ShieldCheck className="h-3 w-3" /> {u.status}</span></td>
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
