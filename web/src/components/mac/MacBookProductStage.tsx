import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { GuardianMark } from '../GuardianMark'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { SIGNAL_SERIES } from '../../data/mock'
import { useTheme } from '../../theme/useTheme'

type Device = {
  id: string
  label: string
  online: boolean
  status: 'guarded' | 'lost' | 'ok'
}

type Signal = {
  id: string
  code: string
  tone: 'signal' | 'alert' | 'soft'
  when: string
  device: string
}

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'signals', label: 'Signals' },
  { id: 'protect', label: 'Protect' },
] as const

type ViewId = (typeof VIEWS)[number]['id']

const INITIAL_DEVICES: Device[] = [
  { id: 'mac', label: 'Studio', online: true, status: 'guarded' },
  { id: 'win', label: 'Travel', online: false, status: 'ok' },
  { id: 'linux', label: 'Lab', online: true, status: 'ok' },
]

const INITIAL_SIGNALS: Signal[] = [
  { id: 's1', code: 'DEVICE_ONLINE', tone: 'signal', when: '2m ago', device: 'Studio' },
  { id: 's2', code: 'HEARTBEAT', tone: 'soft', when: '4m ago', device: 'Lab' },
  { id: 's3', code: 'DEVICE_OFFLINE', tone: 'alert', when: '1h ago', device: 'Travel' },
  { id: 's4', code: 'POLICY_SYNC', tone: 'soft', when: '3h ago', device: 'Studio' },
]

type MacBookProductStageProps = {
  className?: string
  hero?: boolean
}

export function MacBookProductStage({ className, hero = false }: MacBookProductStageProps) {
  const { isDark } = useTheme()
  const [view, setView] = useState<ViewId>('overview')
  const [devices, setDevices] = useState(INITIAL_DEVICES)
  const [signals, setSignals] = useState(INITIAL_SIGNALS)
  const [selectedId, setSelectedId] = useState<string | null>('mac')
  const [filter, setFilter] = useState<'all' | 'signal' | 'alert' | 'soft'>('all')
  const [toast, setToast] = useState<string | null>(null)

  const onlineCount = devices.filter((d) => d.online).length
  const selected = devices.find((d) => d.id === selectedId) ?? devices[0]
  const filteredSignals = useMemo(() => {
    if (filter === 'all') return signals
    return signals.filter((s) => s.tone === filter)
  }, [signals, filter])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  function lockDevice(id: string) {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'lost', online: false } : d)),
    )
    setSignals((prev) => [
      {
        id: `s-${Date.now()}`,
        code: 'LOCK_QUEUED',
        tone: 'alert',
        when: 'now',
        device: devices.find((d) => d.id === id)?.label ?? 'Device',
      },
      ...prev,
    ])
    flash('Protect command queued — lock pending')
    setView('protect')
  }

  function markGuarded(id: string) {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'guarded', online: true } : d)),
    )
    flash('Device marked guarded')
  }

  function toggleOnline(id: string) {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const online = !d.online
        return { ...d, online, status: online ? d.status : d.status }
      }),
    )
    const d = devices.find((x) => x.id === id)
    if (!d) return
    const goingOnline = !d.online
    setSignals((prev) => [
      {
        id: `s-${Date.now()}`,
        code: goingOnline ? 'DEVICE_ONLINE' : 'DEVICE_OFFLINE',
        tone: goingOnline ? 'signal' : 'alert',
        when: 'now',
        device: d.label,
      },
      ...prev,
    ])
    flash(goingOnline ? `${d.label} rejoined spine` : `${d.label} left watchline`)
  }

  const motionProps = hero
    ? {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      }

  return (
    <motion.div {...motionProps} className={cn('mx-auto w-full max-w-6xl', className)}>
      <div className="relative mx-auto w-full">
        <div
          className={cn(
            'overflow-hidden rounded-[20px] border p-[8px] md:rounded-[22px] md:p-[10px]',
            isDark
              ? 'border-white/10 bg-[#0b0e1a] shadow-[0_32px_80px_rgba(0,0,0,0.55)]'
              : 'border-[rgba(11,18,32,0.08)] bg-surface shadow-[0_20px_60px_rgba(11,18,32,0.12)]',
          )}
        >
          <div className={cn('relative overflow-hidden rounded-[14px] border bg-mist-deep md:rounded-[16px]', isDark ? 'border-white/10' : 'border-line')}>
            <div className={cn('absolute left-1/2 top-0 z-20 h-4 w-20 -translate-x-1/2 rounded-b-xl', isDark ? 'bg-black/60' : 'bg-[#2a2e38]')}>
              <span className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/25" />
            </div>

            <div className="relative flex min-h-[360px] flex-col bg-mist md:min-h-[520px]">
              <div className="flex items-center gap-2 border-b border-line bg-surface/85 px-3 py-2.5 md:px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset]" />
                <div className="ml-2 flex flex-1 items-center gap-2 rounded-lg border border-line bg-mist/50 px-2.5 py-1.5 backdrop-blur">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-signal text-white shrink-0">
                    <GuardianMark className="h-3 w-3" />
                  </span>
                  <span className="truncate font-mono text-[10px] font-medium tracking-wide text-ink md:text-[11px]">app.guardian</span>
                  <span className="hidden sm:inline font-mono text-[10px] text-ink-soft">/</span>
                  <span className="hidden sm:inline truncate font-mono text-[10px] text-ink-soft">personal / watchline</span>
                  <span className="ml-auto hidden items-center gap-1 rounded-full bg-signal-soft/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-signal sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal animate-spine-pulse" /> Live
                  </span>
                </div>
              </div>

              <div className="grid flex-1 md:grid-cols-[12.5rem_1fr]">
                <aside className="hidden border-r border-line bg-surface/55 p-3 md:flex md:flex-col">
                  <div className="mb-4 flex items-center gap-2 px-1">
                    <GuardianMark className="h-6 w-6 text-signal" />
                    <div>
                      <p className="font-display text-sm font-bold text-ink">Guardian</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-ink-soft">Personal</p>
                    </div>
                  </div>
                  {VIEWS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={cn(
                        'mb-0.5 flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium transition',
                        view === item.id
                          ? 'bg-surface-2 text-ink'
                          : 'text-ink-soft hover:bg-mist/50 hover:text-ink',
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="mt-auto border-t border-line pt-4">
                    <p className="mb-3 px-1 font-mono text-[9px] uppercase tracking-wider text-ink-soft">Spine</p>
                    <div className="relative mx-auto flex h-32 w-10 flex-col items-center justify-between py-1">
                      <div className="absolute inset-y-2 w-px bg-gradient-to-b from-signal via-line to-transparent" />
                      {devices.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          title={`${n.label} — click to select`}
                          onClick={() => {
                            setSelectedId(n.id)
                            setView('protect')
                          }}
                          className={cn(
                            'relative z-10 h-3 w-3 rounded-full border-2 border-mist transition hover:scale-110',
                            n.online ? 'bg-signal animate-spine-pulse' : 'bg-ink-soft/35',
                            selectedId === n.id && 'ring-2 ring-signal/50',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="relative flex flex-col p-3 md:p-5">
                  <div className="mb-3 flex gap-1 md:hidden">
                    {VIEWS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setView(item.id)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-[11px] font-medium',
                          view === item.id ? 'bg-ink text-mist' : 'bg-surface text-ink-soft',
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="flex-1"
                    >
                      {view === 'overview' ? (
                        <OverviewScreen
                          onlineCount={onlineCount}
                          total={devices.length}
                          devices={devices}
                          onSelect={(id) => {
                            setSelectedId(id)
                            setView('protect')
                          }}
                          onToggleOnline={toggleOnline}
                        />
                      ) : null}
                      {view === 'signals' ? (
                        <SignalsScreen
                          signals={filteredSignals}
                          filter={filter}
                          onFilter={setFilter}
                        />
                      ) : null}
                      {view === 'protect' ? (
                        <ProtectScreen
                          devices={devices}
                          selected={selected}
                          onSelect={setSelectedId}
                          onLock={lockDevice}
                          onGuard={markGuarded}
                          onToggleOnline={toggleOnline}
                        />
                      ) : null}
                    </motion.div>
                  </AnimatePresence>

                  {toast ? (
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg border border-signal/30 bg-surface/95 px-3 py-2 text-center text-xs text-signal shadow-lg backdrop-blur md:left-auto md:right-5 md:w-auto">
                      {toast}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={cn('mx-auto h-1.5 w-[94%]', isDark ? 'bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a]' : 'bg-gradient-to-b from-[#c8d2e0] to-[#a8b5c8]')} />
        <div className={cn('mx-auto h-3 w-full max-w-[102%] rounded-b-2xl', isDark ? 'bg-gradient-to-b from-[#333] via-[#222]/40 to-transparent' : 'bg-gradient-to-b from-[#c8d2e0] via-[#b0becf]/40 to-transparent')} />
      </div>
    </motion.div>
  )
}

function OverviewScreen({
  onlineCount,
  total,
  devices,
  onSelect,
  onToggleOnline,
}: {
  onlineCount: number
  total: number
  devices: Device[]
  onSelect: (id: string) => void
  onToggleOnline: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-ink md:text-xl">Watchline overview</h3>
          <p className="font-mono text-[10px] text-ink-soft">presence · live</p>
        </div>
        <Badge variant="signal">
          <span className="h-1.5 w-1.5 animate-spine-pulse rounded-full bg-signal" />
          {onlineCount} of {total} online
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface/70 p-4">
          <p className="text-[11px] text-ink-soft">Presence score</p>
          <div className="mt-0.5 flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-ink">98.2%</span>
            <span className="mb-1 text-[11px] font-medium text-signal">+1.4%</span>
          </div>
          <div className="mt-3 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SIGNAL_SERIES}>
                <defs>
                  <linearGradient id="macVisFill2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--g-signal)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--g-signal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--g-surface)',
                    border: '1px solid var(--g-line)',
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                />
                <Area type="monotone" dataKey="signals" stroke="var(--g-signal)" fill="url(#macVisFill2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface/70 p-4">
          <p className="text-[11px] text-ink-soft">Devices on spine</p>
          <p className="mt-1 text-[10px] text-ink-soft">Click a device · double-click toggles online</p>
          <ul className="mt-3 space-y-1">
            {devices.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onSelect(n.id)}
                  onDoubleClick={() => onToggleOnline(n.id)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition hover:bg-mist/40"
                >
                  <span className="font-medium text-ink">{n.label}</span>
                  <span className={n.online ? 'text-signal' : 'text-ink-soft'}>
                    {n.online ? 'Online' : 'Offline'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function SignalsScreen({
  signals,
  filter,
  onFilter,
}: {
  signals: Signal[]
  filter: 'all' | 'signal' | 'alert' | 'soft'
  onFilter: (f: 'all' | 'signal' | 'alert' | 'soft') => void
}) {
  const chips = [
    { id: 'all' as const, label: 'All' },
    { id: 'signal' as const, label: 'Signal' },
    { id: 'alert' as const, label: 'Alert' },
    { id: 'soft' as const, label: 'Soft' },
  ]
  return (
    <div>
      <h3 className="font-display text-lg font-bold text-ink md:text-xl">Signal ribbon</h3>
      <p className="mt-1 text-sm text-ink-soft">Filter the live timeline.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onFilter(c.id)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium transition',
              filter === c.id ? 'bg-ink text-mist' : 'border border-line bg-surface text-ink-soft hover:text-ink',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {signals.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Badge variant={item.tone === 'alert' ? 'alert' : item.tone === 'signal' ? 'signal' : 'soft'}>
                {item.code}
              </Badge>
              <span className="text-xs text-ink-soft">{item.device}</span>
            </div>
            <span className="font-mono text-[10px] text-ink-soft">{item.when}</span>
          </li>
        ))}
        {signals.length === 0 ? (
          <li className="py-6 text-center text-sm text-ink-soft">No signals for this filter.</li>
        ) : null}
      </ul>
    </div>
  )
}

function ProtectScreen({
  devices,
  selected,
  onSelect,
  onLock,
  onGuard,
  onToggleOnline,
}: {
  devices: Device[]
  selected: Device
  onSelect: (id: string) => void
  onLock: (id: string) => void
  onGuard: (id: string) => void
  onToggleOnline: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold text-ink md:text-xl">Protect posture</h3>
        <p className="mt-1 text-sm text-ink-soft">Select a device and run protect actions.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition',
              selected.id === d.id
                ? 'border-signal bg-signal/15 text-signal'
                : 'border-line bg-surface text-ink-soft hover:text-ink',
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-line bg-surface/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-base font-bold text-ink">{selected.label}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              {selected.online ? 'Online' : 'Offline'} · {selected.status}
            </p>
          </div>
          <Badge variant={selected.status === 'lost' ? 'alert' : selected.status === 'guarded' ? 'signal' : 'soft'}>
            {selected.status.toUpperCase()}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="alert" onClick={() => onLock(selected.id)}>
            Lock / mark lost
          </Button>
          <Button type="button" size="sm" variant="signal" onClick={() => onGuard(selected.id)}>
            Mark guarded
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onToggleOnline(selected.id)}>
            Toggle online
          </Button>
        </div>
      </div>
    </div>
  )
}
