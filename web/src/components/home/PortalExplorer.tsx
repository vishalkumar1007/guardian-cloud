import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  User,
  Building2,
  ShieldCheck,
  LifeBuoy,
  Laptop,
  ArrowRight,
  ShieldAlert,
  Lock,
  Camera,
  Cpu,
  Server,
  Activity,
  Key,
  Database,
  Radio,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface PortalItem {
  id: string
  name: string
  route: string
  tag: string
  icon: typeof User
  audience: string
  headline: string
  description: string
  isolationGuarantee: string
  capabilities: string[]
  mockType: 'personal' | 'org' | 'super' | 'recover' | 'agent'
}

const PORTALS: PortalItem[] = [
  {
    id: 'personal',
    name: 'Personal Portal',
    route: '/devices · /events · /recovery',
    tag: 'Single-Owner Tenant',
    icon: User,
    audience: 'Individuals & Creators',
    headline: 'Real-Time Device Radar & Biometric Tripwire Feed',
    description:
      'Manage personal laptops and phones on a unified timeline. View silent camera tripwire snapshots, track location displacement, and issue emergency hardware lockouts.',
    isolationGuarantee: 'Strict cryptographic separation. No enterprise admin or organization can inspect personal evidence.',
    capabilities: ['Face & Camera Tripwire Captures', 'Instant Remote Lock / Wipe', 'Cellular GPS Geofencing', 'Zero-Knowledge Backup Key'],
    mockType: 'personal',
  },
  {
    id: 'org',
    name: 'Organization Portal',
    route: '/employees · /policies · /incidents',
    tag: 'Enterprise Tenant',
    icon: Building2,
    audience: 'IT & Security Teams',
    headline: 'Fleet Governance, 6-Role Hierarchy & Policy Engine',
    description:
      'Orchestrate hundreds of company endpoints across macOS, Windows, and Linux. Deploy cryptographically signed policies and review continuous zero-trust compliance telemetry.',
    isolationGuarantee: 'Multi-tenant database schema isolation with signed Ed25519 policy deployment tokens.',
    capabilities: ['6 Hierarchical Roles (Owner to Member)', 'Cryptographically Signed Policies', 'Fleet-Wide Quarantine in <2s', 'SOC 2 & ISO 27001 Audit Trail'],
    mockType: 'org',
  },
  {
    id: 'super',
    name: 'Super Admin Console',
    route: '/super/overview · /super/ai',
    tag: 'Cluster Control-Plane',
    icon: ShieldCheck,
    audience: 'Platform Infrastructure Admins',
    headline: 'Cluster-Level Operations & AI Threat Triage Radar',
    description:
      'Root governance plane protected by Argon2id master credentials and permanent first-run setup locking. Features deterministic anomaly scoring on raw security event streams.',
    isolationGuarantee: 'Physically & logically isolated from customer tenant databases. Access is strictly audited and sealed.',
    capabilities: ['Permanent First-Run Setup Lock (410 Gone)', 'Deterministic AI Security Triage', 'Database & Redis Health Telemetry', 'Cluster Tenant & Plan Quotas'],
    mockType: 'super',
  },
  {
    id: 'recover',
    name: 'Emergency Recovery',
    route: '/report · /status · /challenge',
    tag: 'Zero-Auth Flow',
    icon: LifeBuoy,
    audience: 'Stolen or Lost Devices',
    headline: 'Public Cryptographic Challenge & Lockdown Verification',
    description:
      'A dedicated portal accessible from any browser without requiring existing session tokens. Enables legitimate owners to initiate freeze protocols when credentials are unavailable.',
    isolationGuarantee: 'Rate-limited challenge-response proofs protect against unauthorized denial-of-service.',
    capabilities: ['No Prior Login Required', 'Cryptographic Proof Challenge', 'Emergency Enclave Freeze', 'Lost Device Location Beacon'],
    mockType: 'recover',
  },
  {
    id: 'agent',
    name: 'Native Rust Agent',
    route: 'macOS · Windows · Linux',
    tag: 'Hardware Core',
    icon: Laptop,
    audience: 'Operating System Silicon',
    headline: 'Apple Secure Enclave & TPM 2.0 Direct Integration',
    description:
      'Ultra-lightweight native Rust daemon consuming <0.1% CPU and 18 MB RAM. Runs in userland with isolated kernel helper to guard FileVault and BitLocker keys.',
    isolationGuarantee: 'Memory-safe Rust codebase with zero dynamic scripting dependencies.',
    capabilities: ['Sub-second Heartbeat Spine', 'Local Offline Policy Cache', 'Secure Enclave Key Wrapping', 'Silent Camera Sensor Tripwire'],
    mockType: 'agent',
  },
]

export function PortalExplorer() {
  const [activePortalId, setActivePortalId] = useState<string>('personal')
  const activePortal = PORTALS.find((p) => p.id === activePortalId) || PORTALS[0]

  return (
    <div className="w-full">
      {/* 5 Portals Horizontal Switcher */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 pt-1 px-1 gap-2 no-scrollbar">
        {PORTALS.map((portal) => {
          const Icon = portal.icon
          const isSelected = portal.id === activePortalId
          return (
            <button
              key={portal.id}
              type="button"
              onClick={() => setActivePortalId(portal.id)}
              className={cn(
                'group flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200',
                isSelected
                  ? 'bg-signal text-mist-deep shadow-md shadow-signal/25'
                  : 'border border-line bg-surface text-ink-soft hover:text-ink hover:border-signal/30',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{portal.name}</span>
            </button>
          )
        })}
      </div>

      {/* Main Interactive Stage */}
      <div className="mt-6 rounded-3xl border border-line bg-surface p-6 sm:p-9 shadow-sm relative overflow-hidden">
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-signal/10 blur-3xl" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Portal Overview & Guarantees (5 cols) */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-signal-soft border border-signal/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-signal">
                  {activePortal.tag}
                </span>
                <span className="font-mono text-[11px] text-ink-soft">· {activePortal.audience}</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-ink mt-2">
                {activePortal.headline}
              </h3>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                {activePortal.description}
              </p>
            </div>

            {/* Isolation Badge Callout */}
            <div className="rounded-2xl border border-line bg-surface-2/60 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-ink font-display text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                <span>Zero-Trust Boundary Guarantee</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {activePortal.isolationGuarantee}
              </p>
            </div>

            {/* Key Capabilities */}
            <div className="space-y-2 pt-1">
              <p className="font-mono text-[10px] uppercase font-bold text-ink-soft tracking-wider">
                Cryptographic Capabilities
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePortal.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-2 text-xs font-medium text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                    <span className="truncate">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-block font-mono text-xs text-ink-soft border-t border-line pt-3 w-full">
                Active routes: <code className="text-ink font-semibold">{activePortal.route}</code>
              </span>
            </div>
          </div>

          {/* Right Column: Live Mock Window Preview (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-surface-2 shadow-[0_16px_48px_rgba(0,0,0,0.1)] overflow-hidden">
              {/* Browser Window Header */}
              <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1 text-center font-mono text-[11px] text-ink-soft">
                  <Lock className="h-3 w-3 text-signal" />
                  <span className="truncate text-ink font-medium">https://guardian.security{activePortal.id === 'super' ? '/super/ai' : activePortal.id === 'recover' ? '/recover/status' : activePortal.id === 'org' ? '/org/devices' : '/personal'}</span>
                </div>
              </div>

              {/* Dynamic Preview Body based on mockType */}
              <div className="p-5 sm:p-6 bg-surface min-h-[340px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activePortal.mockType === 'personal' && (
                    <motion.div
                      key="mock-personal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 text-left"
                    >
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <p className="font-display text-sm font-bold text-ink">Personal Threat Feed</p>
                          <p className="font-mono text-[10px] text-ink-soft">Alex's Sovereign Workspace</p>
                        </div>
                        <span className="rounded-full bg-signal-soft text-signal px-2.5 py-0.5 font-mono text-[10px] font-bold">
                          All Devices Online
                        </span>
                      </div>

                      {/* Camera Tripwire Alert Card */}
                      <div className="rounded-xl border border-alert/30 bg-alert/5 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-alert">
                            <Camera className="h-3.5 w-3.5" /> Recent Tripwire Trigger
                          </span>
                          <span className="font-mono text-[10px] text-ink-soft">3m ago</span>
                        </div>
                        <p className="text-xs text-ink-soft">
                          Unauthorized login attempt detected on Studio MacBook. Silent snapshot captured & encrypted with owner key.
                        </p>
                        <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                          <span className="text-alert font-bold">PIN: 3 Failed Attempts</span>
                          <span className="text-signal font-semibold">Pushed to iPhone · OK</span>
                        </div>
                      </div>

                      {/* Device Quick Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-line bg-surface-2 p-3">
                          <p className="font-mono text-[10px] text-ink-soft">Studio MacBook Pro</p>
                          <p className="font-display text-sm font-bold text-ink mt-0.5">Enclave Guarded</p>
                          <p className="font-mono text-[10px] text-emerald-500 font-semibold mt-1">● Heartbeat 12s</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface-2 p-3">
                          <p className="font-mono text-[10px] text-ink-soft">iPhone Companion</p>
                          <p className="font-display text-sm font-bold text-ink mt-0.5">Push Remote Ready</p>
                          <p className="font-mono text-[10px] text-signal font-semibold mt-1">● Standby Mode</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activePortal.mockType === 'org' && (
                    <motion.div
                      key="mock-org"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 text-left"
                    >
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <p className="font-display text-sm font-bold text-ink">Acme Corp Fleet Command</p>
                          <p className="font-mono text-[10px] text-ink-soft">Enterprise Tier · 42 Endpoints</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 font-mono text-[10px] font-bold">
                          SOC 2 Type II: Compliant
                        </span>
                      </div>

                      {/* Fleet Compliance Overview */}
                      <div className="grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                          <p className="text-[9px] text-ink-soft uppercase">Enclave Sealed</p>
                          <p className="font-display text-base font-bold text-ink mt-0.5">100%</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                          <p className="text-[9px] text-ink-soft uppercase">Signed Policies</p>
                          <p className="font-display text-base font-bold text-signal mt-0.5">v3.4.1</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                          <p className="text-[9px] text-ink-soft uppercase">Isolated BYOD</p>
                          <p className="font-display text-base font-bold text-emerald-500 mt-0.5">14 Nodes</p>
                        </div>
                      </div>

                      {/* Role-Based Hierarchy Table */}
                      <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs font-mono space-y-1.5">
                        <div className="flex justify-between border-b border-line pb-1 text-[10px] text-ink-soft uppercase">
                          <span>Team / Dept</span>
                          <span>Assigned Role</span>
                          <span>Enclave State</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-ink font-medium">SecOps Team</span>
                          <span className="text-signal">Admin / Auditor</span>
                          <span className="text-emerald-500 font-bold">Enforced</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-ink font-medium">Core Engineering</span>
                          <span className="text-ink-soft">Member / BYOD</span>
                          <span className="text-emerald-500 font-bold">Enforced</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activePortal.mockType === 'super' && (
                    <motion.div
                      key="mock-super"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 text-left"
                    >
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <p className="font-display text-sm font-bold text-ink">Root Cluster Control-Plane</p>
                          <p className="font-mono text-[10px] text-ink-soft">Argon2id Sealed · Singleton Lock</p>
                        </div>
                        <span className="rounded-full bg-signal text-mist-deep px-2.5 py-0.5 font-mono text-[10px] font-bold">
                          HTTP 410 Locked
                        </span>
                      </div>

                      {/* AI Triage Banner */}
                      <div className="rounded-xl border border-signal/20 bg-signal-soft/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-signal">
                            <Sparkles className="h-3.5 w-3.5" /> AI Threat Triage Engine
                          </span>
                          <span className="font-mono text-[10px] text-ink font-semibold">Model: Guardian-Sec-v1</span>
                        </div>
                        <p className="text-xs text-ink-soft">
                          Fleet risk score: <strong className="text-ink">18/100 (Nominal)</strong>. Continuous pattern recognition on silent camera events & heartbeat intervals.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                          <p className="text-[10px] text-ink-soft">Active Tenants</p>
                          <p className="font-display text-sm font-bold text-ink mt-0.5">128 Organizations</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                          <p className="text-[10px] text-ink-soft">Goose Migrations</p>
                          <p className="font-display text-sm font-bold text-emerald-500 mt-0.5">v10 Applied (OK)</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activePortal.mockType === 'recover' && (
                    <motion.div
                      key="mock-recover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 text-left"
                    >
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <p className="font-display text-sm font-bold text-ink">Zero-Auth Lost Device Portal</p>
                          <p className="font-mono text-[10px] text-ink-soft">No Password Needed · Cryptographic Proof</p>
                        </div>
                        <span className="rounded-full bg-alert text-mist-deep px-2.5 py-0.5 font-mono text-[10px] font-bold">
                          Emergency Mode
                        </span>
                      </div>

                      <div className="rounded-xl border border-line bg-surface-2 p-4 text-center space-y-2">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-alert text-mist-deep">
                          <Lock className="h-5 w-5" />
                        </div>
                        <p className="font-display text-sm font-bold text-ink">Initiate Hardware Lockdown</p>
                        <p className="text-xs text-ink-soft max-w-sm mx-auto">
                          Enter your device serial number or secondary recovery challenge key to instantly wipe FileVault SSD keys.
                        </p>
                        <div className="pt-2">
                          <span className="inline-block rounded-lg border border-line bg-surface px-4 py-2 font-mono text-xs text-ink-soft">
                            Challenge: <code className="text-ink font-bold">GRD-RCV-9082-KEY</code>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activePortal.mockType === 'agent' && (
                    <motion.div
                      key="mock-agent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 text-left font-mono"
                    >
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <p className="font-display text-sm font-bold text-ink">Guardian Core Rust Daemon</p>
                          <p className="text-[10px] text-ink-soft">PID: 4921 · Apple Silicon M3</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                          Kernel Binding OK
                        </span>
                      </div>

                      {/* Terminal Telemetry Box */}
                      <div className="rounded-xl border border-line bg-[#070b13] p-3 text-[11px] text-slate-300 space-y-1 font-mono">
                        <div className="text-slate-500">// Real-time Rust Daemon Output</div>
                        <div className="text-emerald-400">✓ Secure Enclave Key Handle verified: [Ed25519-SE]</div>
                        <div>→ Heartbeat socket TLS 1.3 connected to gateway</div>
                        <div className="text-signal">→ Camera tripwire listener armed: 3 retry threshold</div>
                        <div className="text-slate-400">→ CPU 0.08% · RSS 17.8 MB · 0 leaks</div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-ink-soft border-t border-line pt-2">
                        <span>Binary Hash: <code className="text-ink font-bold">sha256:7f4a...92b1</code></span>
                        <span className="text-emerald-500 font-bold">Active</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-ink-soft">
                  <span>Isolated Boundary Protocol</span>
                  <span className="font-mono text-signal font-semibold">100% Zero-Knowledge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
