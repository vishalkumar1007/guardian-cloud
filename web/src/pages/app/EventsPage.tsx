import { useMemo, useState } from 'react'
import { MOCK_EVENTS } from '../../data/mock'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'

export function EventsPage() {
  const [filter, setFilter] = useState('all')
  const events = useMemo(() => {
    if (filter === 'all') return MOCK_EVENTS
    return MOCK_EVENTS.filter((e) => e.tone === filter)
  }, [filter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Events</h1>
        <p className="mt-1 text-ink-soft">A reliable security timeline — not a firehose.</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="signal">Signal</TabsTrigger>
          <TabsTrigger value="alert">Alert</TabsTrigger>
          <TabsTrigger value="soft">Soft</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="space-y-2">
        {events.map((ev) => (
          <li key={ev.id} className="rounded-xl border border-line bg-surface/60 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={ev.tone === 'alert' ? 'alert' : ev.tone === 'signal' ? 'signal' : 'soft'}>
                  {ev.code}
                </Badge>
                <span className="text-sm font-medium text-ink">{ev.deviceName}</span>
              </div>
              <span className="font-mono text-[11px] text-ink-soft">{ev.when}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{ev.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
