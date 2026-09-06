import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  KeyRound,
  Radio,
  Camera,
  Lock,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface StepItem {
  num: string
  title: string
  shortLabel: string
  icon: typeof KeyRound
  summary: string
  details: string[]
  logs: { text: string; tone?: 'signal' | 'alert' | 'default' }[]
}

const STEPS: StepItem[] = [
  {
    num: '01',
    title: 'Hardware Enclave Enrollment',
    shortLabel: 'Pairing',
    icon: KeyRound,
    summary:
      'Ephemeral 90-second token cryptographically binds the Apple Secure Enclave or TPM 2.0 to your isolated tenant database.',
    details: [
      'Zero-touch CLI command or single-click installer',
      'Ed25519 device keypair generated inside silicon',
      'Private key permanently sealed in hardware memory',
    ],
    logs: [
      { text: '$ guardian enroll --token grdtkn_902a... --tenant personal', tone: 'default' },
      { text: '✓ Hardware Secure Enclave detected (M3 Max co-processor)', tone: 'signal' },
      { text: '✓ Ed25519 public key registered in isolated tenant', tone: 'signal' },
      { text: '✓ Device status: GUARDED & ONLINE', tone: 'signal' },
    ],
  },
  {
    num: '02',
    title: 'Continuous Presence & Sensor Telemetry',
    shortLabel: 'Watchline',
    icon: Radio,
    summary:
      'Ultra-light Rust daemon monitors FileVault disk encryption, peripheral tampering, and location displacement every 30s.',
    details: [
      '<0.1% CPU consumption with zero battery drain',
      'TLS 1.3 mutual handshake over heartbeat socket',
      'Pre-signed offline lockdown policies cached in kernel',
    ],
    logs: [
      { text: '[04:20:01] TLS 1.3 heartbeat pulse transmitted (latency: 18ms)', tone: 'default' },
      { text: '[04:20:01] FileVault SSD volume status: ENCRYPTED & SEALED', tone: 'signal' },
      { text: '[04:20:01] USB & Thunderbolt bus: Authorized peripherals only', tone: 'signal' },
      { text: '[04:20:01] Tamper sensor: Zero unauthorized physical displacement', tone: 'default' },
    ],
  },
  {
    num: '03',
    title: 'Silent Biometric Tripwire Activation',
    shortLabel: 'Intrusion Alert',
    icon: Camera,
    summary:
      '3 consecutive failed PIN attempts trigger an invisible front camera photo, encrypted with the owner public key and relayed to phone.',
    details: [
      'Zero on-screen indicator or flash to prevent intruder alert',
      'Sealed with recipient Ed25519 key prior to transmission',
      'Instant push alert delivered to companion iPhone',
    ],
    logs: [
      { text: '[04:22:15] Security Warning: PIN failure 3/3 on Alex MacBook', tone: 'alert' },
      { text: '[04:22:15] Silent camera sensor tripwire activated', tone: 'alert' },
      { text: '[04:22:16] Intruder snapshot captured & sealed with Ed25519', tone: 'signal' },
      { text: '[04:22:16] Push alert dispatched to paired iPhone 16 Pro', tone: 'signal' },
    ],
  },
  {
    num: '04',
    title: 'Instant Hardware Lockdown & Recovery',
    shortLabel: 'Lockdown',
    icon: Lock,
    summary:
      '1-click from phone or offline policy timeout wipes FileVault keys from RAM, locks display, and broadcasts emergency GPS beacon.',
    details: [
      'Air-gapped execution even if Wi-Fi and Bluetooth are severed',
      'SSD storage permanently unreadable without owner recovery key',
      'Transmits cellular beacon for rapid device recovery',
    ],
    logs: [
      { text: '[04:23:02] Command received: EMERGENCY HARDWARE LOCKDOWN', tone: 'alert' },
      { text: '✓ Secure Enclave FileVault master encryption keys wiped', tone: 'signal' },
      { text: '✓ Keyboard, trackpad, and display hardware inputs disabled', tone: 'signal' },
      { text: '✓ Cellular GPS beacon transmitting live location: 37.7749° N', tone: 'signal' },
    ],
  },
]

export function LifecycleStepper() {
  const [activeStep, setActiveStep] = useState<number>(0)
  const step = STEPS[activeStep]
  const Icon = step.icon

  return (
    <div className="w-full">
      {/* 4 Steps Horizontal Progress Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {STEPS.map((s, idx) => {
          const StepIcon = s.icon
          const isSelected = activeStep === idx
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={cn(
                'group relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-200',
                isSelected
                  ? 'border-signal bg-surface shadow-md shadow-signal/15 ring-1 ring-signal'
                  : 'border-line bg-surface hover:border-signal/30 hover:bg-surface-2/60',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors',
                    isSelected ? 'bg-signal text-mist-deep' : 'bg-surface-2 text-ink-soft group-hover:text-ink',
                  )}
                >
                  {s.num}
                </span>
                <span className="font-mono text-[10px] uppercase font-semibold text-ink-soft">
                  {s.shortLabel}
                </span>
              </div>
              <p className={cn('mt-3 font-display text-xs font-bold tracking-tight truncate', isSelected ? 'text-signal' : 'text-ink')}>
                {s.title}
              </p>
            </button>
          )
        })}
      </div>

      {/* Selected Step Display Card */}
      <div className="rounded-3xl border border-line bg-surface p-7 sm:p-9 shadow-sm relative overflow-hidden text-left">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-signal/10 blur-3xl" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Step Details (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-mist-deep shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-signal">
                  PHASE {step.num} // THREAT CONTAINMENT
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink mt-0.5">
                  {step.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-ink-soft leading-relaxed">
              {step.summary}
            </p>

            <div className="space-y-2.5 pt-2">
              {step.details.map((detail) => (
                <div key={detail} className="flex items-center gap-2.5 text-xs text-ink font-medium">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-soft text-signal">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : STEPS.length - 1))}
                className="rounded-full border border-line bg-surface-2 px-4 py-1.5 font-mono text-xs text-ink hover:border-signal/30 transition-colors"
              >
                ← Previous Stage
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : 0))}
                className="rounded-full bg-signal text-mist-deep px-4 py-1.5 font-mono text-xs font-semibold shadow-sm hover:bg-signal/90 transition-colors"
              >
                Next Stage →
              </button>
            </div>
          </div>

          {/* Right: Terminal Telemetry Stream (6 cols) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-line bg-[#070b13] p-5 shadow-xl font-mono text-xs overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-signal" />
                  <span>guardian-daemon // telemetry-trace</span>
                </div>
                <span className="text-emerald-400 text-[10px]">● Live Kernel Log</span>
              </div>

              {/* Log stream with AnimatePresence */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 text-[11px] leading-relaxed"
                >
                  {step.logs.map((log, lIdx) => (
                    <div
                      key={lIdx}
                      className={cn(
                        'truncate',
                        log.tone === 'alert'
                          ? 'text-red-400 font-semibold'
                          : log.tone === 'signal'
                            ? 'text-emerald-400'
                            : 'text-slate-300',
                      )}
                    >
                      {log.text}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                <span>Kernel Ring-Buffer Verified</span>
                <span>SHA-256 Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
