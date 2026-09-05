import { Badge } from '../../components/ui/badge'

interface SuperPlaceholderPageProps {
  title: string
  subtitle: string
  tag: string
  metricTitle?: string
  metricValue?: string
}

export function SuperPlaceholderPage({
  title,
  subtitle,
  tag,
  metricTitle = 'Status',
  metricValue = 'Active & Guarded',
}: SuperPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">{title}</h1>
            <Badge variant="signal" className="font-mono text-xs">{tag}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{metricTitle}</p>
          <p className="mt-1 font-display text-xl font-bold text-ink">{metricValue}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Control Plane</p>
          <p className="mt-1 font-display text-xl font-bold text-signal">Isolated Super-Admin</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Integrity Policy</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-500">Enforced</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-8 text-center space-y-2">
        <p className="font-display text-base font-semibold text-ink">Module Operational</p>
        <p className="font-mono text-xs text-ink-soft max-w-md mx-auto">
          Connected to Guardian Cloud control plane. Phase 1 bootstrap and zero-trust schema verified.
        </p>
      </div>
    </div>
  )
}
