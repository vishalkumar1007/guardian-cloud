import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldAlert,
  Navigation,
  Building2,
  Laptop,
  Play,
  Pause,
  Lock,
  Camera,
  KeyRound,
  Radio,
  Server,
  Fingerprint,
  Zap,
  Check,
  ShieldCheck,
  Monitor,
} from 'lucide-react'
import { GuardianMark } from '../GuardianMark'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { PhoneMockup } from './PhoneMockup'

interface ModeConfig {
  id: number
  title: string
  subtitle: string
  icon: typeof ShieldAlert
  tag: string
  macHeadline: string
}

const MODES: ModeConfig[] = [
  { id: 1, title: 'Physical Tamper', subtitle: 'Intruder Detection', icon: ShieldAlert, tag: 'MODE 01 · Sentinel Tripwire', macHeadline: 'Unauthorized Access Triggered' },
  { id: 2, title: 'Anti-Theft & Geo', subtitle: 'Real-Time Beacon', icon: Navigation, tag: 'MODE 02 · Hardware Lockdown', macHeadline: 'Hardware Input Disabled · Enclave Keys Sealed' },
  { id: 3, title: 'Enterprise Fleet', subtitle: 'Zero-Trust Command', icon: Building2, tag: 'MODE 03 · Enterprise Radar', macHeadline: 'Fleet Management · 42 Endpoints Guarded' },
  { id: 4, title: 'Desktop Sentinel', subtitle: 'Daemon & Config', icon: Laptop, tag: 'MODE 04 · Live Configuration', macHeadline: 'Interactive Daemon Controls' },
]

export function MacBookProductStage({ className }: { className?: string; hero?: boolean }) {
  const [activeMode, setActiveMode] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [enclaveEnabled, setEnclaveEnabled] = useState<boolean>(true)
  const [fileVaultSealing, setFileVaultSealing] = useState<boolean>(true)
  const [cadence, setCadence] = useState<number>(30)
  const [isAuditing, setIsAuditing] = useState<boolean>(false)
  const [auditComplete, setAuditComplete] = useState<boolean>(false)
  const [phoneNotificationMsg, setPhoneNotificationMsg] = useState<string>('')
  const [lastPingFromMac, setLastPingFromMac] = useState<number>(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = window.setInterval(() => {
      setActiveMode((prev) => (prev < 4 ? prev + 1 : 1))
    }, 7000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  function selectMode(m: number) {
    setActiveMode(m)
    setIsPlaying(false)
  }

  function handlePhoneAction(action: string) {
    if (action === 'lock') setPhoneNotificationMsg('Lockdown enforced from phone')
    else if (action === 'erase') setPhoneNotificationMsg('Wipe command received via cellular')
    else if (action === 'approve') setPhoneNotificationMsg('Hardware key approved')
    else if (action === 'phone_ping') {
      setPhoneNotificationMsg('TLS 1.3 ping from iPhone')
      setTimeout(() => setPhoneNotificationMsg(''), 3000)
    }
  }

  function handleRunScan() {
    setIsAuditing(true)
    setAuditComplete(false)
    setTimeout(() => {
      setIsAuditing(false)
      setAuditComplete(true)
      setLastPingFromMac(Date.now())
      setTimeout(() => setAuditComplete(false), 3500)
    }, 1200)
  }

  const currentMode = MODES[activeMode - 1]

  return (
    <div className={cn('mx-auto w-full max-w-6xl', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_302px] xl:grid-cols-[1fr_322px] items-center gap-6 xl:gap-8 pt-2 sm:pt-4">
        <div className="relative mx-auto w-full min-w-0">
          <div className="relative w-full rounded-[22px] border-[2px] bg-gradient-to-b from-[#e8ecf3] via-[#dde3ed] to-[#cbd5e1] p-[8px] shadow-[0_28px_80px_rgba(15,16,32,0.22),0_12px_32px_rgba(15,16,32,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] dark:from-[#1e2635] dark:via-[#18202f] dark:to-[#0f1419] dark:border-[#2a3441] dark:shadow-[0_36px_96px_rgba(0,0,0,0.6),0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] border-[#d1d5db]">
            <div className="pointer-events-none absolute inset-[8px] rounded-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
            <div className="relative overflow-hidden rounded-[14px] border-[7px] border-white bg-white shadow-[inset_0_0_20px_rgba(0,0,0,0.08)] dark:border-black dark:bg-black dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.07] rounded-[7px]" />
              <div className="absolute left-1/2 top-0 z-30 flex h-[18px] w-[92px] -translate-x-1/2 items-center justify-center gap-1.5 rounded-b-[9px] bg-black shadow-[0_1px_4px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                <span className={cn('h-[7px] w-[7px] rounded-full ring-1 ring-white/10', activeMode === 1 ? 'bg-alert animate-pulse shadow-[0_0_8px_var(--g-alert)]' : 'bg-[#0a84ff] shadow-[0_0_8px_#0a84ff]')} />
                <span className="h-1 w-1 rounded-full bg-white/15" />
                <span className="h-[5px] w-[5px] rounded-full bg-white/10" />
              </div>

              <div className="relative flex aspect-[3456/2234] max-h-[560px] min-h-[480px] w-full flex-col overflow-hidden bg-surface text-ink">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-2 px-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="hidden sm:flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-black/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-black/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-black/10" />
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
                      <GuardianMark className="h-3 w-3 shrink-0 text-signal" />
                      <span className="truncate font-mono text-[11px] font-medium text-ink">Guardian Sentinel</span>
                      <span className="hidden sm:inline shrink-0 font-mono text-[10px] text-ink-soft">· Daemon active</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {phoneNotificationMsg ? (
                      <span className="hidden sm:inline-flex max-w-[18ch] truncate rounded-full border border-signal/20 bg-signal-soft px-2 py-0.5 font-mono text-[10px] font-medium text-signal" title={phoneNotificationMsg}>
                        {phoneNotificationMsg}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-signal px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 min-w-0">
                  <p className="min-w-0 truncate font-display text-xs font-semibold tracking-tight text-ink">{currentMode.macHeadline}</p>
                  <span className="hidden sm:inline-flex shrink-0 font-mono text-[10px] text-ink-soft">{activeMode === 4 ? 'Click controls below' : 'macOS · Secure Enclave'}</span>
                </div>

                <div className="relative flex flex-1 overflow-hidden bg-surface min-h-0">
                  <AnimatePresence mode="wait">
                    {activeMode === 1 && (
                      <motion.div key="mac-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-mist via-surface to-mist-deep" />
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, var(--g-ink) 1px, transparent 0)`, backgroundSize: '18px 18px' }} />
                        <div className="relative flex h-full flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="relative">
                              <div className="absolute -inset-3 rounded-[28px] bg-signal/10 blur-xl" />
                              <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[20px] bg-surface border border-line shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                                <span className="font-display text-lg font-bold tracking-tight text-ink">AM</span>
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-alert text-mist-deep shadow-sm ring-2 ring-surface"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /></span>
                              </div>
                            </div>
                            <p className="mt-3 font-display text-[15px] font-semibold tracking-tight text-ink">Alex Morgan</p>
                            <p className="font-mono text-[11px] text-ink-soft">MacBook Pro 16″ · Studio — macOS 14.6</p>
                            <div className="mt-5 w-full max-w-[280px]">
                              <div className="flex items-center gap-2 rounded-full border border-line bg-surface/80 backdrop-blur px-3 py-2 shadow-sm">
                                <Lock className="h-3.5 w-3.5 text-ink-soft" />
                                <span className="flex-1 text-left font-mono text-[13px] tracking-[0.18em] text-ink">••••••••</span>
                                <span className="h-6 w-6 rounded-full bg-ink flex items-center justify-center"><span className="text-[10px] text-mist">↩</span></span>
                              </div>
                              <div className="mt-2 flex items-center justify-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-alert animate-pulse" />
                                <p className="font-mono text-[11px] font-medium text-alert">3 failed attempts — 60s lockout</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-3 rounded-2xl border border-alert/20 bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-alert text-mist-deep shadow-sm"><Camera className="h-4 w-4" /></span>
                              <div className="min-w-0 flex-1">
                                <p className="font-display text-xs font-semibold leading-none text-ink flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-alert animate-pulse" /> Sentinel Tripwire</p>
                                <p className="mt-1 font-mono text-[11px] leading-tight text-ink-soft line-clamp-1">Silently captured — Ed25519 sealed → iPhone</p>
                              </div>
                              <Badge variant="alert" className="shrink-0 text-[10px]">Evidence</Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeMode === 2 && (
                      <motion.div key="mac-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0 bg-surface">
                        <div className="absolute inset-0 bg-gradient-to-br from-mist via-surface to-mist-deep opacity-60" />
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)`, backgroundSize: '22px 22px' }} />
                        <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-alert text-mist-deep shadow-[0_8px_24px_rgba(239,68,68,0.25)]"><Lock className="h-6 w-6" /></div>
                          <h3 className="mt-3 font-display text-[15px] font-bold uppercase tracking-[0.04em] text-ink">This Mac is Locked</h3>
                          <p className="mt-1.5 max-w-[32ch] text-xs leading-relaxed text-ink-soft">Hardware input disabled. Storage keys sealed with FileVault & Secure Enclave. Location beacon active.</p>
                          <div className="mt-5 w-full max-w-[300px] rounded-2xl border border-line bg-surface-2 p-3 text-left shadow-sm">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Owner Contact</p>
                            <p className="mt-1 font-mono text-xs font-medium text-ink">alex@guardian.app · +1 (555) 019-2834</p>
                            <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-soft">Message: Please return to Apple Store SoHo. Reward offered.</p>
                          </div>
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-signal/15 bg-signal-soft px-3 py-1.5 font-mono text-[11px] font-medium text-signal">
                            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Beacon transmitting to iPhone
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeMode === 3 && (
                      <motion.div key="mac-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0 flex">
                        <div className="hidden sm:flex w-[148px] shrink-0 flex-col border-r border-line bg-surface-2 p-3 gap-1">
                          <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Guardian</p>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 rounded-lg bg-ink text-mist px-2.5 py-2 text-xs font-medium"><Building2 className="h-3.5 w-3.5" /> Fleet</div>
                            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-soft"><ShieldCheck className="h-3.5 w-3.5" /> Policies</div>
                            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-soft"><Radio className="h-3.5 w-3.5" /> Events</div>
                            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-soft"><Server className="h-3.5 w-3.5" /> Devices</div>
                          </div>
                          <div className="mt-auto rounded-xl border border-line bg-surface p-2.5">
                            <p className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">Coverage</p>
                            <p className="font-display text-lg font-bold leading-none text-ink mt-1">99.8%</p>
                            <div className="mt-1.5 h-1 rounded-full bg-line overflow-hidden"><span className="block h-full w-[99%] bg-signal" /></div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 bg-surface">
                          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                            <p className="font-display text-xs font-semibold text-ink">Fleet · 42 endpoints</p>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-signal/15 bg-signal-soft px-2 py-0.5 font-mono text-[10px] font-medium text-signal"><span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Live sync</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 p-3">
                            <div className="rounded-xl border border-line bg-surface-2 p-2.5 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-ink-soft">Total</p><p className="font-display text-base font-bold text-ink mt-1">42</p><p className="font-mono text-[9px] text-ink-soft">M3 Max</p></div>
                            <div className="rounded-xl border border-signal/15 bg-signal-soft/40 p-2.5 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-signal">Guarded</p><p className="font-display text-base font-bold text-signal mt-1">41</p><p className="font-mono text-[9px] text-ink-soft">online</p></div>
                            <div className="rounded-xl border border-alert/15 bg-alert/10 p-2.5 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-alert">Flagged</p><p className="font-display text-base font-bold text-alert mt-1">1</p><p className="font-mono text-[9px] text-alert">review</p></div>
                            <div className="rounded-xl border border-line bg-surface-2 p-2.5 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-ink-soft">Risk</p><p className="font-display text-base font-bold text-ink mt-1">Low</p><p className="font-mono text-[9px] text-signal">Zero-trust</p></div>
                          </div>
                          <div className="flex-1 overflow-hidden px-3 pb-3">
                            <div className="rounded-xl border border-line overflow-hidden">
                              <div className="grid grid-cols-[1fr_auto] gap-2 bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-ink-soft border-b border-line"><span>Department · Policy</span><span>Status</span></div>
                              <div className="divide-y divide-line bg-surface font-mono text-xs">
                                <div className="flex items-center justify-between px-3 py-2.5"><span className="flex items-center gap-2 font-medium text-ink truncate"><span className="h-6 w-6 rounded-md bg-ink text-mist flex items-center justify-center"><Server className="h-3 w-3" /></span> Engineering — 18 M3 Max</span><Badge variant="signal" className="text-[10px]">OK</Badge></div>
                                <div className="flex items-center justify-between px-3 py-2.5"><span className="flex items-center gap-2 font-medium text-ink truncate"><span className="h-6 w-6 rounded-md bg-surface-2 border border-line flex items-center justify-center"><Server className="h-3 w-3 text-ink-soft" /></span> Executive — 8 ThinkPad</span><Badge variant="signal" className="text-[10px]">OK</Badge></div>
                                <div className="flex items-center justify-between px-3 py-2.5 bg-amber-500/[0.04]"><span className="flex items-center gap-2 font-medium text-ink truncate"><span className="h-6 w-6 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center"><Server className="h-3 w-3" /></span> Sales — 16 MacBook</span><Badge variant="alert" className="text-[10px]">Review</Badge></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeMode === 4 && (
                      <motion.div key="mac-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0 flex">
                        <div className="hidden sm:flex w-[132px] shrink-0 flex-col gap-1 border-r border-line bg-surface-2 p-2.5">
                          <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Settings</p>
                          <div className="rounded-lg bg-surface border border-line px-2.5 py-2 text-xs font-medium text-ink flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-signal" /> Security</div>
                          <div className="rounded-lg px-2.5 py-2 text-xs text-ink-soft flex items-center gap-2"><Monitor className="h-3.5 w-3.5" /> General</div>
                          <div className="rounded-lg px-2.5 py-2 text-xs text-ink-soft flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> Network</div>
                          <div className="mt-auto flex items-center gap-2 rounded-full border border-signal/15 bg-signal-soft px-2.5 py-1.5 font-mono text-[11px] font-medium text-signal"><span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Live</div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 bg-surface p-3 gap-2.5 overflow-hidden">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-mist"><GuardianMark className="h-4 w-4" /></span>
                            <div className="min-w-0"><p className="font-display text-xs font-semibold leading-none text-ink">Guardian Core Agent</p><p className="font-mono text-[11px] leading-none text-ink-soft mt-1">Rust Daemon v1.4.2 · PID 4921</p></div>
                            <span className="ml-auto hidden sm:inline-flex rounded-full bg-signal px-2 py-1 font-mono text-[10px] font-bold text-white">Enclave</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-signal/15 bg-signal-soft/20 p-2 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-signal">CPU</p><p className="font-display text-sm font-bold text-signal mt-0.5">0.1%</p><p className="font-mono text-[9px] text-ink-soft">2 cores</p></div>
                            <div className="rounded-xl border border-line bg-surface-2 p-2 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-ink-soft">MEM</p><p className="font-display text-sm font-bold text-ink mt-0.5">18 MB</p><p className="font-mono text-[9px] text-ink-soft">Resident</p></div>
                            <div className="rounded-xl border border-line bg-surface-2 p-2 text-center"><p className="font-mono text-[9px] uppercase tracking-wide text-ink-soft">Beat</p><p className="font-display text-sm font-bold text-ink mt-0.5">{cadence}s</p><p className="font-mono text-[9px] text-ink-soft">TLS 1.3</p></div>
                          </div>
                          <div className="space-y-1.5 flex-1 min-h-0">
                            <button type="button" onClick={() => setEnclaveEnabled(!enclaveEnabled)} className={cn('flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left', enclaveEnabled ? 'border-signal/20 bg-signal-soft/20' : 'border-line bg-surface-2')}>
                              <span className="flex items-center gap-2 font-mono text-xs font-medium text-ink"><Fingerprint className="h-4 w-4 text-signal" /> Secure Enclave</span><span className={cn('rounded-full px-2 py-1 font-mono text-[11px] font-bold', enclaveEnabled ? 'bg-signal text-mist' : 'bg-surface border border-line text-ink-soft')}>{enclaveEnabled ? 'Enabled' : 'Paused'}</span>
                            </button>
                            <button type="button" onClick={() => setFileVaultSealing(!fileVaultSealing)} className={cn('flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left', fileVaultSealing ? 'border-signal/20 bg-signal-soft/20' : 'border-line bg-surface-2')}>
                              <span className="flex items-center gap-2 font-mono text-xs font-medium text-ink"><KeyRound className="h-4 w-4 text-signal" /> FileVault</span><span className={cn('rounded-full px-2 py-1 font-mono text-[11px] font-bold', fileVaultSealing ? 'bg-signal text-mist' : 'bg-surface border border-line text-ink-soft')}>{fileVaultSealing ? 'Enforced' : 'Off'}</span>
                            </button>
                            <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                              <span className="flex items-center gap-1.5 font-mono text-xs font-medium text-ink"><Radio className="h-3.5 w-3.5 text-signal" /> Heartbeat</span>
                              <span className="flex gap-1">{[15,30,60].map((sec) => (<button key={sec} type="button" onClick={() => setCadence(sec)} className={cn('rounded-full px-2.5 py-1 font-mono text-xs font-semibold', cadence === sec ? 'bg-ink text-mist' : 'bg-surface border border-line text-ink-soft')}>{sec}s</button>))}</span>
                            </div>
                          </div>
                          <Button type="button" variant={auditComplete ? 'signal' : 'outline'} size="sm" onClick={handleRunScan} disabled={isAuditing} className="w-full gap-1.5 rounded-full font-mono text-xs h-8 shrink-0">
                            {isAuditing ? <><Zap className="h-3.5 w-3.5 animate-spin" /> Auditing kernel…</> : auditComplete ? <><Check className="h-3.5 w-3.5" /> 42 checks passed</> : <><ShieldCheck className="h-3.5 w-3.5" /> Run integrity audit</>}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto w-full">
            <div className="mx-auto h-[5px] w-20 -translate-y-0.5 rounded-b-[4px] border-x border-b border-[#d1d5db] dark:border-[#2a3441] bg-gradient-to-b from-[#e8ecf3] to-[#cbd5e1] dark:from-[#1e2635] dark:to-[#0f1419] shadow-inner" />
            <div className="mx-auto h-[10px] w-[96%] rounded-b-[10px] border-x border-b border-[#d1d5db] dark:border-[#2a3441] bg-gradient-to-b from-[#dde3ed] to-[#cbd5e1] dark:from-[#18202f] dark:to-[#0f1419] shadow-[0_4px_12px_rgba(0,0,0,0.12)]" />
            <div className="mx-auto h-5 w-full max-w-[104%] rounded-b-[18px] bg-gradient-to-b from-ink/10 via-ink/[0.04] to-transparent blur-[1px]" />
            <div className="mx-auto -mt-1 flex w-[88%] justify-between px-2">
              <span className="h-[2px] w-12 rounded-full bg-black/10 dark:bg-white/5" />
              <span className="h-[2px] w-12 rounded-full bg-black/10 dark:bg-white/5" />
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PhoneMockup mode={activeMode} onActionTrigger={handlePhoneAction} lastPingFromMac={lastPingFromMac} />
        </div>
      </div>

      <div className="mt-12 sm:mt-14 mx-auto max-w-3xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[var(--g-card-shadow)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-w-0">
            {MODES.map((m) => {
              const Icon = m.icon
              const isSelected = activeMode === m.id
              return (
                <button key={m.id} type="button" onClick={() => selectMode(m.id)} className={cn('group flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all min-w-0 border', isSelected ? 'bg-surface border-signal/20 text-ink shadow-sm' : 'border-transparent bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink hover:border-line')}>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', isSelected ? 'bg-signal border-signal text-white' : 'bg-surface-2 border-line text-ink-soft group-hover:border-signal/20')}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xs font-semibold leading-none truncate">{m.title}</span>
                    <span className={cn('block mt-0.5 font-mono text-[10px] leading-none truncate', isSelected ? 'text-signal' : 'text-ink-soft')}>{m.subtitle}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-2 sm:border-l sm:border-line sm:pl-3 sm:ml-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)} className="h-7 shrink-0 rounded-full px-3 text-xs font-medium border-line bg-surface">
              {isPlaying ? <><Pause className="h-3 w-3 text-signal" /> Pause</> : <><Play className="h-3 w-3 text-signal" /> Play</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
