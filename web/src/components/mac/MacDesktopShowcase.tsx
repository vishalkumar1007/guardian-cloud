import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GuardianMark } from '../GuardianMark'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

const NODES = [
  { id: 'mac', label: 'Studio', online: true },
  { id: 'win', label: 'Travel', online: false },
  { id: 'linux', label: 'Lab', online: true },
]

const VIEWS = [
  { id: 'presence', label: 'Presence' },
  { id: 'signals', label: 'Signals' },
  { id: 'protect', label: 'Protect' },
] as const

type ViewId = (typeof VIEWS)[number]['id']

const RIBBON = [
  { code: 'DEVICE_ONLINE', tone: 'signal' as const },
  { code: 'HEARTBEAT', tone: 'soft' as const },
  { code: 'DEVICE_OFFLINE', tone: 'alert' as const },
]

type MacDesktopShowcaseProps = {
  className?: string
  compact?: boolean
}

export function MacDesktopShowcase({ className, compact }: MacDesktopShowcaseProps) {
  const [view, setView] = useState<ViewId>('presence')

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={cn('mx-auto w-full max-w-4xl', className)}
    >
      <div className="group relative mx-auto w-full transition duration-500 hover:-translate-y-1">
        <div className="overflow-hidden rounded-[1.35rem] border border-ink/25 bg-ink p-[0.65rem] shadow-[0_48px_90px_-42px_color-mix(in_srgb,var(--g-signal)_45%,rgba(11,18,32,0.65))] transition duration-500 group-hover:shadow-[0_56px_100px_-40px_color-mix(in_srgb,var(--g-signal)_55%,rgba(11,18,32,0.7))]">
          <div className="relative overflow-hidden rounded-[0.85rem] border border-white/10 bg-mist-deep">
            <div className="absolute left-1/2 top-0 z-20 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-ink/20">
              <span className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink-soft/50" />
            </div>

            <div className={cn('relative', compact ? 'min-h-[280px] md:min-h-[320px]' : 'min-h-[320px] md:min-h-[400px]')}>
              <div className="flex items-center justify-between border-b border-line bg-surface/70 px-4 py-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <GuardianMark className="h-4 w-4 text-signal" />
                  <span className="font-display text-xs font-bold tracking-tight text-ink">Guardian</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                  <span className="hidden sm:inline">Desktop agent</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-spine-pulse rounded-full bg-signal" />
                    Live
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-[7.5rem_1fr]">
                <aside className="hidden flex-col border-r border-line bg-surface/40 py-3 md:flex">
                  <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">Views</p>
                  {VIEWS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={cn(
                        'mx-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition',
                        view === item.id
                          ? 'bg-ink text-mist'
                          : 'text-ink-soft hover:bg-surface hover:text-ink',
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="mt-auto flex flex-col items-center gap-3 border-t border-line px-2 py-4">
                    <div className="relative flex h-28 w-full flex-col items-center justify-between">
                      <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-signal via-line to-line" />
                      {NODES.map((node) => (
                        <span
                          key={node.id}
                          title={node.label}
                          className={cn(
                            'relative z-10 block h-2.5 w-2.5 rounded-full border-2 border-mist bg-white',
                            node.online ? 'border-signal bg-signal animate-spine-pulse' : 'border-ink-soft/40',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="space-y-3 p-4 md:p-5">
                  <div className="flex gap-1 md:hidden">
                    {VIEWS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setView(item.id)}
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-medium',
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      {view === 'presence' ? <PresenceView /> : null}
                      {view === 'signals' ? <SignalsView /> : null}
                      {view === 'protect' ? <ProtectView /> : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto h-2 w-[92%] rounded-b-sm bg-gradient-to-b from-ink/40 to-ink/20" />
        <div className="mx-auto h-3 w-full max-w-[105%] rounded-b-[1.5rem] bg-gradient-to-b from-ink/25 via-ink/15 to-transparent" />
      </div>
    </motion.div>
  )
}

function PresenceView() {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Spine</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">Device presence</p>
      <p className="mt-1 text-sm text-ink-soft">Two online. One waiting to rejoin the watchline.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {NODES.map((node) => (
          <div key={node.id} className="border-t border-line pt-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ink-soft">{node.label}</p>
            <p className="mt-1 text-xs font-semibold text-ink">{node.online ? 'Online' : 'Offline'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalsView() {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Ribbon</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">Live signals</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {RIBBON.map((item) => (
          <Badge
            key={item.code}
            variant={item.tone === 'alert' ? 'alert' : item.tone === 'signal' ? 'signal' : 'soft'}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                item.tone === 'alert' ? 'bg-alert' : item.tone === 'signal' ? 'bg-signal' : 'bg-ink-soft/40',
              )}
            />
            {item.code}
          </Badge>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        A quiet timeline of security truth — heartbeats, offline gaps, and protect events.
      </p>
    </div>
  )
}

function ProtectView() {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Recovery</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">Protect posture</p>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-ink-soft">Travel Win</span>
          <Badge variant="alert">LOST · LOCK QUEUED</Badge>
        </li>
        <li className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-ink-soft">Studio Mac</span>
          <Badge variant="signal">GUARDED</Badge>
        </li>
        <li className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-ink-soft">Trusted face</span>
          <Badge variant="soft">2 ENROLLED</Badge>
        </li>
      </ul>
    </div>
  )
}
