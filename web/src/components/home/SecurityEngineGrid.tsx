import { useState } from 'react'
import {
  Cpu,
  Camera,
  KeyRound,
  Radio,
  Sparkles,
  Database,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const PILLARS = [
  {
    icon: Cpu,
    tag: 'SILICON ROOT-OF-TRUST',
    title: 'Apple Secure Enclave & TPM 2.0',
    description:
      'Master encryption keys are bound directly into the cryptographic co-processor. Keys never touch RAM or SSD storage, rendering memory extraction attacks completely impossible.',
    stat: '100% Hardware Isolated',
    statLabel: 'Zero Key Leakage',
    accent: 'signal',
  },
  {
    icon: Camera,
    tag: 'INTELLIGENT TRIPWIRE',
    title: 'Silent Biometric Snapshot',
    description:
      'Automatically triggers on 3 consecutive failed local PIN or passcode attempts. Captures intruder image silently, seals it with the owner Ed25519 key, and relays it via push.',
    stat: 'Sub-Second Capture',
    statLabel: 'Sealed with Ed25519',
    accent: 'alert',
  },
  {
    icon: KeyRound,
    tag: 'AIR-GAPPED DEFENSE',
    title: 'Zero-Network Emergency Lock',
    description:
      'Pre-signed emergency lockdown directives are stored in the local policy cache. The kernel can execute full FileVault SSD key deletion even when a thief severs Wi-Fi and Bluetooth.',
    stat: 'Air-Gap Verified',
    statLabel: 'Pre-Signed Directives',
    accent: 'signal',
  },
  {
    icon: Radio,
    tag: 'PRESENCE SPINE',
    title: 'Real-Time TLS 1.3 Heartbeat',
    description:
      'The Rust daemon streams continuous cryptographic proof-of-presence every 30 seconds. Disconnections trigger instant status transitions across the personal and org portals.',
    stat: '<0.1% CPU Overhead',
    statLabel: '18 MB RSS Memory',
    accent: 'signal',
  },
  {
    icon: Sparkles,
    tag: 'DETERMINISTIC RADAR',
    title: 'AI Security Triage & Scoring',
    description:
      'Deterministic anomaly analysis scans incoming security events for geofence displacement, rapid physical tampering, and debugger injection without hallucination risks.',
    stat: '0-100 Risk Scoring',
    statLabel: 'Automated Triage',
    accent: 'signal',
  },
  {
    icon: Database,
    tag: 'TAMPER-PROOF LEDGER',
    title: 'Cryptographic Audit Trail',
    description:
      'Every administrative policy change, device lock command, and recovery action is cryptographically signed and stored in an immutable, append-only PostgreSQL ledger.',
    stat: 'SOC 2 Type II Ready',
    statLabel: 'Cryptographically Sealed',
    accent: 'signal',
  },
]

export function SecurityEngineGrid() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PILLARS.map((p, idx) => {
          const Icon = p.icon
          const isHovered = hoveredIdx === idx
          return (
            <div
              key={p.title}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={cn(
                'group relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 transition-all duration-300 text-left',
                p.accent === 'alert'
                  ? 'border-line bg-surface hover:border-alert/30 hover:shadow-[0_16px_40px_rgba(239,68,68,0.08)]'
                  : 'border-line bg-surface hover:border-signal/30 hover:shadow-[0_16px_40px_rgba(15,118,110,0.08)]',
              )}
            >
              {/* Subtle top ambient glow */}
              <div
                className={cn(
                  'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300',
                  p.accent === 'alert' ? 'bg-alert/10' : 'bg-signal/10',
                  isHovered ? 'opacity-100' : 'opacity-0',
                )}
              />

              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                      p.accent === 'alert'
                        ? 'border-alert/20 bg-alert/10 text-alert group-hover:bg-alert group-hover:text-white'
                        : 'border-signal/20 bg-signal-soft text-signal group-hover:bg-signal group-hover:text-white',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-soft">
                    {p.tag}
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-base font-bold tracking-tight text-ink group-hover:text-signal transition-colors">
                    {p.title}
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-ink-soft">
                    {p.description}
                  </p>
                </div>
              </div>

              {/* Bottom Stat Footer */}
              <div className="relative mt-6 pt-4 border-t border-line flex items-center justify-between">
                <div>
                  <p className="font-display text-xs font-bold text-ink">{p.stat}</p>
                  <p className="font-mono text-[10px] text-ink-soft mt-0.5">{p.statLabel}</p>
                </div>
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                  )}
                >
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
