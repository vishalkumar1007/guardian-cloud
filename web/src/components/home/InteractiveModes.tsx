import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  User,
  Building2,
  ShieldAlert,
  Lock,
  Camera,
  MapPin,
  KeyRound,
  Server,
  Radio,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Fingerprint,
} from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export function InteractiveModes() {
  const [activeTab, setActiveTab] = useState<'personal' | 'enterprise'>('personal')

  return (
    <div className="w-full">
      {/* Interactive Segmented Switcher */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200',
              activeTab === 'personal'
                ? 'bg-signal text-mist-deep shadow-md shadow-signal/25'
                : 'text-ink-soft hover:text-ink hover:bg-surface/60',
            )}
          >
            <User className="h-3.5 w-3.5" />
            <span>Personal Security</span>
            <span className="hidden sm:inline-block rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">Individuals</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enterprise')}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200',
              activeTab === 'enterprise'
                ? 'bg-signal text-mist-deep shadow-md shadow-signal/25'
                : 'text-ink-soft hover:text-ink hover:bg-surface/60',
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Enterprise Fleet</span>
            <span className="hidden sm:inline-block rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">Organizations</span>
          </button>
        </div>
      </div>

      {/* Main Container with AnimatePresence */}
      <AnimatePresence mode="wait">
        {activeTab === 'personal' ? (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left: Value Proposition & Vectors (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 sm:p-9 shadow-sm relative overflow-hidden">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-signal/10 blur-3xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal-soft text-signal border border-signal/20 shadow-sm">
                    <User className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-[0.16em] text-signal">Personal Watchline</span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink mt-0.5">
                      Sovereign protection for your personal laptops & phone
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm text-ink-soft leading-relaxed">
                  Single-owner isolation with zero enterprise backdoors. The same cryptographic policy engine used by Fortune 500 fleets, delivered as automated, zero-maintenance templates for your everyday hardware.
                </p>

                {/* 4 Vectors */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-alert text-mist-deep shrink-0">
                        <Camera className="h-3 w-3" />
                      </span>
                      <span>Biometric Camera Tripwire</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Silent snapshot triggers on 3 failed local PINs, encrypted with your Ed25519 key and pushed to your iPhone.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-signal text-mist-deep shrink-0">
                        <Lock className="h-3 w-3" />
                      </span>
                      <span>1-Click Phone Lockdown</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Lock your Mac from iOS companion. Instantly seals Secure Enclave and FileVault SSD encryption keys.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink text-mist shrink-0">
                        <KeyRound className="h-3 w-3" />
                      </span>
                      <span>Air-Gapped Offline Lock</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Pre-signed emergency lockdown instructions execute locally even if a thief immediately disables Wi-Fi.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                        <MapPin className="h-3 w-3" />
                      </span>
                      <span>Cellular GPS Beacon</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Encrypted location telemetry streams continuously to your phone when an unverified access event is logged.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-8 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 font-mono text-xs text-ink">
                  <span className="font-bold text-signal text-base sm:text-lg">$9</span>
                  <span className="text-ink-soft">/ month · Up to 3 personal devices</span>
                </div>
                <Button asChild variant="signal" size="sm" className="rounded-full px-5">
                  <Link to="/signup" className="flex items-center gap-1.5">
                    <span>Start Personal Plan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Live Interactive Mock Card (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-line bg-surface-2 p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
                    <span className="font-mono text-xs font-bold text-ink">Alex's Personal Vault</span>
                  </div>
                  <span className="rounded-full bg-signal-soft border border-signal/20 px-2 py-0.5 font-mono text-[10px] font-bold text-signal">
                    Status: Guarded
                  </span>
                </div>

                {/* Device 1 Card */}
                <div className="rounded-2xl border border-signal/20 bg-surface p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display text-sm font-bold text-ink">MacBook Pro 16″ (Studio)</h4>
                      <p className="font-mono text-[10px] text-ink-soft mt-0.5">macOS Sequoia · M3 Max</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-semibold">
                      Enclave OK
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] pt-1">
                    <div className="rounded-xl border border-line bg-surface-2 p-2">
                      <p className="text-[9px] text-ink-soft">Heartbeat</p>
                      <p className="font-bold text-signal mt-0.5">14s ago</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-2">
                      <p className="text-[9px] text-ink-soft">Disk Sealing</p>
                      <p className="font-bold text-ink mt-0.5">FileVault 2</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-2">
                      <p className="text-[9px] text-ink-soft">Tripwire</p>
                      <p className="font-bold text-emerald-500 mt-0.5">Armed</p>
                    </div>
                  </div>
                </div>

                {/* Device 2 Card */}
                <div className="rounded-2xl border border-line bg-surface p-3.5 flex items-center justify-between">
                  <div>
                    <h5 className="font-display text-xs font-semibold text-ink">iPhone 16 Pro (Alex)</h5>
                    <p className="font-mono text-[10px] text-ink-soft">Companion Remote · Standby</p>
                  </div>
                  <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-ink-soft">
                    Paired
                  </span>
                </div>

                {/* Live Stream Log */}
                <div className="rounded-2xl border border-line bg-surface p-3 space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5 text-signal font-semibold">
                    <Radio className="h-3 w-3 animate-pulse" /> Live Telemetry Log
                  </div>
                  <div className="text-ink-soft truncate">04:15:22 — Ed25519 signature verified on Studio</div>
                  <div className="text-ink-soft truncate">04:14:52 — No unauthorized motion detected</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line text-center font-mono text-[11px] text-ink-soft">
                Zero-Knowledge · Private keys never leave your devices
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="enterprise"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left: Enterprise Features (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 sm:p-9 shadow-sm relative overflow-hidden">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-signal/10 blur-3xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-mist border border-ink shadow-sm">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-[0.16em] text-signal">Organization Tenant</span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink mt-0.5">
                      Enterprise fleet governance & continuous zero-trust compliance
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm text-ink-soft leading-relaxed">
                  Strict cryptographic boundary isolation with 6 hierarchical organizational roles, fleet BYOD groups, signed Ed25519 policy deployment, and automated SOC 2 / ISO 27001 audit verification.
                </p>

                {/* 4 Enterprise Pillars */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-signal text-mist-deep shrink-0">
                        <Users className="h-3 w-3" />
                      </span>
                      <span>6 Hierarchical Roles</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Owner, Org Admin, SecOps, Compliance Auditor, IT Manager, and Member with granular cryptographic capability grants.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink text-mist shrink-0">
                        <Fingerprint className="h-3 w-3" />
                      </span>
                      <span>Signed Policy Cache</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Every lockdown rule and encryption threshold is digitally signed; agents refuse any unsigned policy updates.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-alert text-mist-deep shrink-0">
                        <ShieldAlert className="h-3 w-3" />
                      </span>
                      <span>Instant Fleet Quarantine</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      SecOps can isolate compromised employee hardware globally in sub-second roundtrip times via TLS 1.3 heartbeat socket.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                    <div className="flex items-center gap-2 text-ink font-display text-xs font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                      <span>Okta & Azure AD SSO</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                      Automated SCIM user provisioning, SAML 2.0 authentication, and automatic deprovisioning on employee offboarding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-8 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 font-mono text-xs text-ink">
                  <span className="font-bold text-signal text-base sm:text-lg">$12</span>
                  <span className="text-ink-soft">/ seat / month · Enterprise Basic</span>
                </div>
                <Button asChild variant="signal" size="sm" className="rounded-full px-5">
                  <Link to="/signup" className="flex items-center gap-1.5">
                    <span>Deploy Organization</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Fleet Telemetry Console (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-line bg-surface-2 p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-signal" />
                    <span className="font-mono text-xs font-bold text-ink">Fleet Command Console</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    42/42 Guarded
                  </span>
                </div>

                {/* Fleet Overview Stats */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="rounded-xl border border-line bg-surface p-2.5">
                    <p className="text-[9px] text-ink-soft uppercase">Compliance</p>
                    <p className="font-display text-base font-bold text-emerald-500 mt-0.5">99.8%</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-2.5">
                    <p className="text-[9px] text-ink-soft uppercase">Enclave OK</p>
                    <p className="font-display text-base font-bold text-ink mt-0.5">42 Nodes</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-2.5">
                    <p className="text-[9px] text-ink-soft uppercase">Anomalies</p>
                    <p className="font-display text-base font-bold text-signal mt-0.5">0 Active</p>
                  </div>
                </div>

                {/* Department Node Groups Table */}
                <div className="rounded-2xl border border-line bg-surface p-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-line pb-1.5 text-[10px] uppercase text-ink-soft">
                    <span>Fleet Group</span>
                    <span>Policy Cache</span>
                    <span>Status</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink font-medium">Engineering (18 M3)</span>
                    <span className="text-ink-soft">FileVault + Enclave</span>
                    <span className="text-emerald-500 font-bold">100% OK</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink font-medium">Exec Laptops (8 ThinkPad)</span>
                    <span className="text-ink-soft">BitLocker + TPM 2</span>
                    <span className="text-emerald-500 font-bold">100% OK</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink font-medium">Sales Fleet (16 MacBook)</span>
                    <span className="text-ink-soft">Signed Zero-Trust</span>
                    <span className="text-emerald-500 font-bold">100% OK</span>
                  </div>
                </div>

                {/* Cryptographic Proof Banner */}
                <div className="rounded-2xl border border-signal/20 bg-signal-soft/30 p-3 flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-signal font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> SOC 2 Evidence Pipeline
                  </span>
                  <span className="text-ink font-bold">Auditable · Live</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line text-center font-mono text-[11px] text-ink-soft">
                Enterprise SLA · 99.99% Availability Guarantee
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
