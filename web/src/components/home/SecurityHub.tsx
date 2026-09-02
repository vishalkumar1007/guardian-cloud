import { motion } from 'motion/react'
import {
  IconAuditDoc,
  IconCloudLock,
  IconDataBlocks,
  IconLockAuth,
  IconMonitorScan,
  IconSecureCode,
  IconShieldCheck,
} from '../icons/SecurityIcons'

const SPOKES = [
  { Icon: IconSecureCode, label: 'Secure agent', angle: -90 },
  { Icon: IconCloudLock, label: 'Cloud control', angle: -30 },
  { Icon: IconDataBlocks, label: 'Device spine', angle: 30 },
  { Icon: IconAuditDoc, label: 'Audit trail', angle: 90 },
  { Icon: IconLockAuth, label: 'Identity', angle: 150 },
  { Icon: IconMonitorScan, label: 'Threat scan', angle: 210 },
]

export function SecurityHub() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" aria-hidden>
        {SPOKES.map((s) => {
          const rad = ((s.angle - 90) * Math.PI) / 180
          const x2 = 200 + Math.cos(rad) * 130
          const y2 = 200 + Math.sin(rad) * 130
          return (
            <line
              key={s.label}
              x1="200"
              y1="200"
              x2={x2}
              y2={y2}
              stroke="var(--g-alert)"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
          )
        })}
        <circle cx="200" cy="200" r="54" fill="color-mix(in srgb, var(--g-alert) 18%, transparent)" />
      </svg>

      <motion.div
        className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface shadow-[0_0_48px_color-mix(in_srgb,var(--g-alert)_35%,transparent)]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <IconShieldCheck className="h-16 w-16" title="Guardian protect core" />
      </motion.div>

      {SPOKES.map((s, i) => {
        const rad = ((s.angle - 90) * Math.PI) / 180
        const x = 50 + Math.cos(rad) * 38
        const y = 50 + Math.sin(rad) * 38
        return (
          <motion.div
            key={s.label}
            className="absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line bg-surface/90 backdrop-blur-md"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i, duration: 0.45 }}
          >
            <s.Icon className="h-9 w-9" />
            <span className="mt-1 max-w-[4.5rem] truncate text-center font-mono text-[8px] uppercase tracking-wider text-ink-soft">
              {s.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
