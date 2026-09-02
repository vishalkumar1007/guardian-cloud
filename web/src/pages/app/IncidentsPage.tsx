import { useState } from 'react'
import { MOCK_INCIDENTS } from '../../data/mock'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

const severityVariant = {
  LOW: 'soft',
  MEDIUM: 'default',
  HIGH: 'alert',
  CRITICAL: 'alert',
} as const

export function IncidentsPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const active = MOCK_INCIDENTS.find((i) => i.id === openId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Incidents</h1>
        <p className="mt-1 text-ink-soft">Severity-ranked cases with a clear recovery path.</p>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {MOCK_INCIDENTS.map((inc) => (
          <li key={inc.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-bold text-ink">{inc.title}</p>
                <Badge variant={severityVariant[inc.severity]}>{inc.severity}</Badge>
                <Badge variant="soft">{inc.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {inc.deviceName} · opened {inc.openedAt}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpenId(inc.id)}>
              Timeline
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!active} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>{active?.summary}</DialogDescription>
          </DialogHeader>
          <ol className="mt-2 space-y-3 border-l border-line pl-4">
            <li className="text-sm text-ink-soft">
              <span className="font-mono text-[10px] uppercase text-signal">Detected</span>
              <p className="text-ink">{active?.openedAt}</p>
            </li>
            <li className="text-sm text-ink-soft">
              <span className="font-mono text-[10px] uppercase text-signal">Status</span>
              <p className="text-ink">{active?.status}</p>
            </li>
            <li className="text-sm text-ink-soft">
              <span className="font-mono text-[10px] uppercase text-signal">Next</span>
              <p className="text-ink">Confirm location or start recovery from Recovery.</p>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  )
}
