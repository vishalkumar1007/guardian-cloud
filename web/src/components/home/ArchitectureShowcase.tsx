import {
  Server,
  Laptop,
  Radio,
  Lock,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Database,
  Terminal,
  Sparkles,
} from 'lucide-react'
import { GuardianMark } from '../GuardianMark'

export function ArchitectureShowcase() {
  return (
    <div className="w-full">
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-9 shadow-sm relative overflow-hidden text-left">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-signal/5 blur-3xl" />

        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* Left: Cloud Control Plane (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-line bg-surface-2/70 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-soft text-signal border border-signal/20">
                  <Server className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">Cloud Control Plane</h4>
                  <p className="font-mono text-[10px] text-ink-soft">Postgres 16 · Redis · Goose v10</p>
                </div>
              </div>
              <span className="rounded-full bg-signal-soft text-signal px-2 py-0.5 font-mono text-[9px] font-bold">
                Portals & Auth
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <Radio className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Heartbeat Telemetry Ingestion</p>
                  <p className="text-[10px] text-ink-soft truncate">Sub-second presence graph & offline alert trigger</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <Sparkles className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">AI Threat Triage Radar</p>
                  <p className="text-[10px] text-ink-soft truncate">Deterministic scoring on incoming security events</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <KeyRound className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Signed Ed25519 Policy Engine</p>
                  <p className="text-[10px] text-ink-soft truncate">Cryptographically sealed remote lockdown orders</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <Database className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Append-Only Audit Ledger</p>
                  <p className="text-[10px] text-ink-soft truncate">SOC 2 compliant immutable event trail</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Bridge: The Cryptographic Watchline (1 col) */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0">
            <div className="hidden lg:flex flex-col items-center gap-2">
              <span className="h-10 w-px bg-gradient-to-b from-transparent via-signal/40 to-signal" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-signal/30 bg-signal-soft text-signal shadow-sm animate-pulse">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span className="h-10 w-px bg-gradient-to-b from-signal via-signal/40 to-transparent" />
            </div>
            <div className="lg:hidden flex items-center gap-2 py-1 font-mono text-[10px] text-signal font-semibold">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Bilateral TLS 1.3 Cryptographic Spine</span>
            </div>
          </div>

          {/* Right: Native Edge Rust Agent (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-line bg-surface-2/70 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-mist border border-ink">
                  <Laptop className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">Native Rust Core Agent</h4>
                  <p className="font-mono text-[10px] text-ink-soft">macOS · Windows 11 · Linux</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-mono text-[9px] font-bold">
                Silicon Co-Processor
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <Cpu className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Hardware Enclave Key Sealing</p>
                  <p className="text-[10px] text-ink-soft truncate">Apple Secure Enclave & TPM 2.0 direct integration</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <Lock className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Air-Gapped Policy Cache</p>
                  <p className="text-[10px] text-ink-soft truncate">Executes emergency lock even if Wi-Fi is cut</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <ShieldCheck className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Silent Camera Tripwire Sensor</p>
                  <p className="text-[10px] text-ink-soft truncate">Invisible photo capture on 3 consecutive PIN fails</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
                <Terminal className="h-3.5 w-3.5 text-signal shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-[11px]">Instant RAM Key Shredder</p>
                  <p className="text-[10px] text-ink-soft truncate">Wipes FileVault SSD keys in &lt;50 milliseconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footnote Bar */}
        <div className="mt-8 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-ink-soft">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-signal" />
            <span>Zero-Knowledge: Private keys never touch cloud control plane</span>
          </div>
          <div className="text-ink font-semibold">
            Binary Verification: <code className="text-signal">Rust v1.4.2</code>
          </div>
        </div>
      </div>
    </div>
  )
}
