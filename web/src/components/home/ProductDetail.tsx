import { motion, useReducedMotion } from 'motion/react'
import { Eye, Radio, Lock, Sparkles, Monitor, CircleDot, Apple, Laptop } from 'lucide-react'

const FEATURES = [
  { icon: Eye, label: 'Presence', title: 'Know every device', copy: 'Online & offline — last-seen truth.' },
  { icon: Radio, label: 'Signals', title: 'Every heartbeat', copy: 'Filtered by tone.' },
  { icon: Lock, label: 'Protect', title: 'Lock instantly', copy: 'Queued even offline.' },
]

const DEVICES = [
  { label: 'Studio', sub: 'macOS · 14.6', letter: 'S', online: true },
  { label: 'Travel', sub: 'Windows 11', letter: 'T', online: false },
  { label: 'Lab', sub: 'Linux · 6.8', letter: 'L', online: true },
]

const SIGNALS = [
  { code: 'DEVICE_ONLINE', tone: 'signal' as const, when: '2m ago', dev: 'Studio' },
  { code: 'HEARTBEAT', tone: 'soft' as const, when: '4m ago', dev: 'Lab' },
  { code: 'DEVICE_OFFLINE', tone: 'alert' as const, when: '1h ago', dev: 'Travel' },
  { code: 'POLICY_SYNC', tone: 'soft' as const, when: '3h ago', dev: 'Studio' },
]

export function ProductDetail() {
  const reduce = useReducedMotion()
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
      <div className="relative order-2 lg:order-1">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <div className="ml-2 flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-spine-pulse" />
              <span className="font-mono text-[11px] font-medium text-ink-soft">guardian — watchline live</span>
            </div>
            <span className="ml-auto hidden rounded-full bg-signal px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white sm:inline-flex">Live</span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-signal-soft text-signal">
                  <CircleDot className="h-3.5 w-3.5" />
                </span>
                <h4 className="font-display text-sm font-semibold tracking-tight text-ink">Devices on spine</h4>
              </div>
              <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-medium text-ink-soft">3 enrolled · 2 online</span>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-3">
                {DEVICES.map((d) => (
                  <div key={d.label} className={`flex flex-col items-center rounded-xl border bg-surface px-2.5 py-4 text-center ${d.online ? 'border-signal/15' : 'border-line opacity-90'}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${d.online ? 'bg-signal text-mist-deep' : 'bg-surface-2 text-ink-soft'}`}>{d.letter}</span>
                    <p className="mt-2.5 font-display text-xs font-semibold tracking-tight text-ink">{d.label}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-line bg-mist px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                      {d.label === 'Studio' ? <Apple className="h-3 w-3" /> : d.label === 'Travel' ? <Laptop className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                      {d.sub}
                    </span>
                    <span className={`mt-2 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${d.online ? 'bg-signal text-mist-deep' : 'bg-mist text-ink-soft'}`}>{d.online ? 'Online' : 'Offline'}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center font-mono text-[10px] tracking-wide text-ink-soft">spine — presence synced</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <div className="flex items-center justify-between bg-surface-2 px-3.5 py-2.5">
                <p className="font-display text-xs font-semibold tracking-tight text-ink">Signal ribbon</p>
                <span className="font-mono text-[10px] text-ink-soft">last 4 events</span>
              </div>
              <ul className="divide-y divide-line bg-surface">
                {SIGNALS.map((s) => (
                  <li key={s.code} className="flex items-center gap-2.5 px-3.5 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide ${s.tone === 'signal' ? 'bg-signal-soft text-signal' : s.tone === 'alert' ? 'bg-alert/10 text-alert' : 'bg-mist text-ink-soft'}`}>{s.code}</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-soft">{s.dev} · {s.when}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-signal/15 bg-signal-soft/30 p-3 text-center">
                <p className="font-display text-lg font-bold tracking-tight text-signal">98.2%</p>
                <p className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-soft">Presence</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3 text-center">
                <p className="font-display text-lg font-bold tracking-tight text-ink">12</p>
                <p className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-soft">Signals / day</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3 text-center">
                <p className="font-display text-lg font-bold tracking-tight text-ink">&lt; 4s</p>
                <p className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-soft">Lock queue</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="order-1 lg:order-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-ink-soft">
          <Sparkles className="h-3.5 w-3.5 text-signal" /> Product detail
        </p>
        <h3 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-ink md:text-[26px]">
          One watchline. <span className="text-signal">Every surface</span> you care about.
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">Same spine, ribbon and protect primitives — themed by your cloud so light and dark feel native.</p>
        <div className="mt-7 space-y-4">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface">
                <f.icon className="h-4 w-4 text-signal" />
              </span>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-signal">{f.label}</p>
                <p className="mt-0.5 font-display text-[14px] font-semibold tracking-tight text-ink">{f.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{f.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
