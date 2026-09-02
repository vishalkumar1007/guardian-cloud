import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'

const INVOICES = [
  { id: 'inv_01', when: '1 Sep 2026', amount: '$9.00', status: 'Paid' },
  { id: 'inv_02', when: '1 Aug 2026', amount: '$9.00', status: 'Paid' },
  { id: 'inv_03', when: '1 Jul 2026', amount: '$9.00', status: 'Paid' },
]

export function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-ink-soft">Personal Basic plan, invoices, and device limit.</p>
      </div>

      <div className="rounded-xl border border-line bg-surface/60 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Current plan</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">Personal Basic</p>
            <p className="mt-1 text-sm text-ink-soft">Up to 3 devices · $9 / month</p>
          </div>
          <Badge variant="signal">Active</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Manage payment
          </Button>
          <Button variant="ghost" size="sm">
            Change plan
          </Button>
        </div>
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Device limit</p>
        <p className="mt-2 font-display text-xl font-bold text-ink">2 of 3 used</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist-deep">
          <div className="h-full w-2/3 rounded-full bg-signal" />
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Invoices</p>
        <ul className="divide-y divide-line border-t border-line">
          {INVOICES.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono text-ink-soft">{inv.id}</span>
              <span className="text-ink-soft">{inv.when}</span>
              <span className="font-medium text-ink">{inv.amount}</span>
              <Badge variant="soft">{inv.status}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
