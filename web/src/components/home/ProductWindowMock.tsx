import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { GuardianMark } from '../GuardianMark'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { SIGNAL_SERIES } from '../../data/mock'

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'devices', label: 'Devices' },
  { id: 'signals', label: 'Signals' },
  { id: 'protect', label: 'Protect' },
]

export function ProductWindowMock({ className }: { className?: string }) {
  const [active, setActive] = useState('overview')

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={cn('mx-auto w-full max-w-5xl', className)}
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_100px_-40px_color-mix(in_srgb,var(--g-signal)_40%,#000)]">
        {/* mac traffic lights */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-full border border-line bg-mist/40 px-3 py-1.5">
            <GuardianMark className="h-3.5 w-3.5 text-signal" />
            <span className="font-mono text-[10px] text-ink-soft">guardian.app / watchline</span>
          </div>
        </div>

        <div className="grid min-h-[340px] md:grid-cols-[200px_1fr]">
          <aside className="hidden border-r border-line bg-mist-deep/40 p-3 md:block">
            <p className="px-2 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">Personal</p>
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={cn(
                  'mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition',
                  active === item.id
                    ? 'bg-surface-2 text-ink shadow-[inset_0_0_0_1px_var(--g-line)]'
                    : 'text-ink-soft hover:bg-surface/60 hover:text-ink',
                )}
              >
                {item.label}
              </button>
            ))}
          </aside>

          <div className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Site overview</h3>
                <p className="font-mono text-[11px] text-ink-soft">watchline · live</p>
              </div>
              <Badge variant="signal">
                <span className="h-1.5 w-1.5 animate-spine-pulse rounded-full bg-signal" />
                2 online
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-mist/30 p-4">
                <p className="text-xs text-ink-soft">Presence score</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-display text-3xl font-bold text-ink">98.2%</span>
                  <span className="mb-1 text-xs font-medium text-signal">+1.4%</span>
                </div>
                <div className="mt-3 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SIGNAL_SERIES}>
                      <defs>
                        <linearGradient id="visFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--g-signal)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--g-signal)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" hide />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--g-surface)',
                          border: '1px solid var(--g-line)',
                          borderRadius: 10,
                          fontSize: 11,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="signals"
                        stroke="var(--g-signal)"
                        fill="url(#visFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-mist/30 p-4">
                <p className="text-xs text-ink-soft">Signal stream</p>
                <p className="mt-1 font-display text-3xl font-bold text-ink">24</p>
                <ul className="mt-3 space-y-2">
                  {['DEVICE_ONLINE', 'HEARTBEAT', 'POLICY_SYNC'].map((code) => (
                    <li key={code} className="flex items-center gap-2 text-xs text-ink-soft">
                      <span className="h-2 w-2 rounded-full border border-signal bg-signal/30" />
                      <span className="font-mono tracking-wide text-ink">{code}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
