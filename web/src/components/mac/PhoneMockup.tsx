import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldAlert,
  MapPin,
  Lock,
  Radio,
  Trash2,
  Check,
  Building2,
  Bell,
  Camera,
  Send,
  Sliders,
  Battery,
  Signal,
  Wifi,
} from 'lucide-react'
import { GuardianMark } from '../GuardianMark'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export interface PhoneMockupProps {
  mode: number
  onActionTrigger?: (action: string) => void
  lastPingFromMac?: number
}

function RealisticMap() {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-line bg-surface-2">
      <svg viewBox="0 0 320 176" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="320" height="176" fill="var(--g-surface)" />
        <rect x="0" y="0" width="320" height="176" fill="color-mix(in srgb, var(--g-mist) 60%, white)" />
        <path d="M0 48 H320 M0 84 H320 M0 120 H320 M48 0 V176 M104 0 V176 M176 0 V176 M242 0 V176" stroke="color-mix(in srgb, var(--g-line) 80%, transparent)" strokeWidth="1" />
        <path d="M0 66 H320 M0 102 H320" stroke="var(--g-line)" strokeWidth="1.2" />
        <path d="M78 0 V176 M188 0 V176" stroke="var(--g-line)" strokeWidth="1.2" />
        <rect x="12" y="12" width="52" height="28" rx="3" fill="color-mix(in srgb, var(--g-surface-2) 90%, white)" stroke="var(--g-line)" strokeWidth="0.8" />
        <rect x="118" y="12" width="48" height="28" rx="3" fill="color-mix(in srgb, var(--g-surface-2) 90%, white)" stroke="var(--g-line)" strokeWidth="0.8" />
        <rect x="190" y="12" width="44" height="28" rx="3" fill="color-mix(in srgb, var(--g-surface-2) 90%, white)" stroke="var(--g-line)" strokeWidth="0.8" />
        <rect x="12" y="132" width="64" height="32" rx="3" fill="color-mix(in srgb, var(--g-surface-2) 90%, white)" stroke="var(--g-line)" strokeWidth="0.8" />
        <rect x="118" y="132" width="64" height="32" rx="3" fill="color-mix(in srgb, var(--g-surface-2) 90%, white)" stroke="var(--g-line)" strokeWidth="0.8" />
        <rect x="248" y="96" width="60" height="68" rx="6" fill="color-mix(in srgb, #22c55e 14%, transparent)" stroke="color-mix(in srgb, #22c55e 22%, transparent)" strokeWidth="1" />
        <text x="252" y="112" fontSize="7" fontFamily="ui-monospace" fill="color-mix(in srgb, #16a34a 70%, var(--g-ink-soft))" letterSpacing="0.6">WASHINGTON SQ</text>
        <text x="252" y="120" fontSize="6" fontFamily="ui-monospace" fill="var(--g-ink-soft)" opacity="0.7">PARK</text>
        <path d="M2 2 L6 2 L6 6 M314 2 L318 2 L318 6 M6 170 L2 170 L2 174 M318 170 L314 170 L314 174" stroke="var(--g-ink-soft)" strokeOpacity="0.18" strokeWidth="1.2" fill="none" />
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <span className="absolute h-14 w-14 rounded-full bg-signal/10 animate-ping" />
        <span className="absolute h-9 w-9 rounded-full bg-signal/15" />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-alert text-mist-deep shadow-lg shadow-alert/30 ring-4 ring-white">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="relative mt-1.5 rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-ink shadow-sm whitespace-nowrap">MacBook Pro 16″</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/70 to-transparent p-2.5 pt-6">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[11px] font-medium text-ink">SoHo · New York, NY</span>
          <span className="shrink-0 rounded-full bg-surface border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">±3 m</span>
        </div>
      </div>
      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-line bg-surface/90 px-2 py-1 text-[10px] font-mono font-medium text-ink shadow-sm backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Live
        <span className="text-ink-soft">· 40.7128° N, 74.0060° W</span>
      </div>
    </div>
  )
}

export function PhoneMockup({ mode, onActionTrigger, lastPingFromMac }: PhoneMockupProps) {
  const [deviceLocked, setDeviceLocked] = useState(false)
  const [eraseTriggered, setEraseTriggered] = useState(false)
  const [enterpriseApproved, setEnterpriseApproved] = useState(false)
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(true)
  const [cameraEvidenceEnabled, setCameraEvidenceEnabled] = useState(true)
  const [pingSent, setPingSent] = useState(false)

  function handleLock() {
    setDeviceLocked(true)
    onActionTrigger?.('lock')
  }
  function handleErase() {
    setEraseTriggered(true)
    onActionTrigger?.('erase')
  }
  function handleApprove() {
    setEnterpriseApproved(true)
    onActionTrigger?.('approve')
  }
  function handleSendPing() {
    setPingSent(true)
    onActionTrigger?.('phone_ping')
    setTimeout(() => setPingSent(false), 2000)
  }

  return (
    <div className="relative mx-auto w-full max-w-[302px] select-none">
      <div className="relative rounded-[54px] border-[3px] bg-[#f1f2f6] p-[10px] shadow-[0_24px_64px_rgba(15,16,32,0.18),0_8px_24px_rgba(15,16,32,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:bg-[#151a25] dark:border-[#2a3441] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6),0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] border-[#d1d5db]">
        <div className="absolute -left-[3px] top-[68px] h-[28px] w-[3px] rounded-l-[2px] bg-[#e2a63a] dark:bg-[#3a4558] shadow-sm" title="Action button" />
        <div className="absolute -left-[3px] top-[106px] h-[32px] w-[3px] rounded-l-[2px] bg-[#d1d5db] dark:bg-[#2a3441] border-y border-l border-white/20 dark:border-white/5" />
        <div className="absolute -left-[3px] top-[144px] h-[32px] w-[3px] rounded-l-[2px] bg-[#d1d5db] dark:bg-[#2a3441] border-y border-l border-white/20 dark:border-white/5" />
        <div className="absolute -right-[3px] top-[112px] h-[72px] w-[3px] rounded-r-[2px] bg-[#d1d5db] dark:bg-[#2a3441] border-y border-r border-white/20 dark:border-white/5" />
        <div className="absolute -right-[3px] top-[206px] h-[46px] w-[3px] rounded-r-[3px] bg-[#1a1f2e] dark:bg-[#0a0e1a] border border-white/10 shadow-inner flex items-center justify-center" title="Camera Control">
          <span className="h-[36px] w-[2px] rounded-full bg-white/15" />
        </div>
        <div className="pointer-events-none absolute inset-[10px] rounded-[44px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />

        <div className="relative flex h-[550px] w-full flex-col overflow-hidden rounded-[44px] border-[7px] border-white bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:border-black dark:bg-black dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="pointer-events-none absolute inset-0 rounded-[36px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-signal/5 blur-2xl" />

          <div className="relative flex h-[32px] shrink-0 items-center justify-between px-7 pt-1.5 text-[11px] font-semibold">
            <span className="font-mono text-[12px] font-semibold tracking-tight text-ink">9:41</span>
            <div className="absolute left-1/2 top-1.5 -translate-x-1/2 flex h-[22px] min-w-[92px] items-center justify-center rounded-full bg-black px-2.5 text-white shadow-sm ring-1 ring-white/10">
              {mode === 1 ? (
                <span className="flex items-center gap-1 font-mono text-[10px] font-medium"><span className="h-1.5 w-1.5 rounded-full bg-alert animate-pulse shadow-[0_0_6px_var(--g-alert)]" /> Tamper</span>
              ) : mode === 2 ? (
                <span className="flex items-center gap-1 font-mono text-[10px] font-medium"><span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse shadow-[0_0_6px_var(--g-signal)]" /> Beacon</span>
              ) : mode === 3 ? (
                <span className="flex items-center gap-1 font-mono text-[10px] font-medium"><ShieldAlert className="h-3 w-3 text-signal" /> Guard</span>
              ) : (
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0a0a0a] ring-1 ring-white/10" /><span className="h-1.5 w-1.5 rounded-full bg-[#1a1f2e]" /></span>
              )}
            </div>
            <span className="flex items-center gap-1 text-ink">
              <Signal className="h-3 w-3" /><Wifi className="h-3.5 w-3.5" /><Battery className="h-4 w-6" />
            </span>
          </div>

          <div className="relative flex flex-1 flex-col overflow-hidden p-3 min-h-0">
            <AnimatePresence mode="wait">
              {mode === 1 && (
                <motion.div key="p1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-1 flex-col justify-between min-h-0">
                  <div className="space-y-3 min-w-0">
                    <div className="text-center py-1">
                      <p className="font-display text-3xl font-light tracking-tight text-ink">09:41</p>
                      <p className="font-mono text-[11px] text-ink-soft">Tuesday · September 8</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-surface-2 p-3 shadow-sm space-y-3">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[11px] font-semibold text-ink"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-alert text-mist-deep"><GuardianMark className="h-3 w-3" /></span> <span className="truncate">Guardian Sentinel</span></span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-soft">now</span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="flex items-center gap-1.5 font-display text-xs font-semibold text-ink min-w-0"><ShieldAlert className="h-3.5 w-3.5 shrink-0 text-alert" /> <span className="truncate">Physical Tamper on MacBook Pro</span></p>
                        <p className="text-xs leading-relaxed text-ink-soft line-clamp-2">3 failed PINs. Silent snapshot sealed with owner Ed25519 key.</p>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-mist"><Camera className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-xs font-semibold text-ink">Unknown face captured</span>
                          <span className="block truncate font-mono text-[11px] text-ink-soft">Evidence encrypted · Owner only</span>
                        </span>
                        <Badge variant="alert" className="shrink-0 text-[10px]">Sealed</Badge>
                      </div>
                      {!deviceLocked ? (
                        <Button type="button" size="sm" onClick={handleLock} className="w-full rounded-full bg-alert text-mist-deep hover:bg-alert/90 gap-1.5 font-medium">
                          <Lock className="h-3.5 w-3.5" /> Lock hardware now
                        </Button>
                      ) : (
                        <span className="flex w-full items-center justify-center gap-1.5 rounded-full border border-signal/20 bg-signal-soft px-3 py-2 font-mono text-xs font-semibold text-signal"><Check className="h-3.5 w-3.5" /> Hardware locked by owner</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-center font-mono text-[11px] text-ink-soft">Swipe up to open Guardian app</p>
                </motion.div>
              )}

              {mode === 2 && (
                <motion.div key="p2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-1 flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2 shrink-0">
                    <span className="flex items-center gap-1.5 truncate font-display text-xs font-semibold text-ink"><GuardianMark className="h-3.5 w-3.5 shrink-0 text-signal" /> Live GPS Radar</span>
                    <Badge variant="alert" className="shrink-0 text-[10px]">Stolen / Lost</Badge>
                  </div>
                  <RealisticMap />
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <div className="rounded-xl border border-line bg-surface-2 p-2.5 min-w-0">
                      <p className="truncate font-mono text-[10px] uppercase tracking-wide text-ink-soft">Wi-Fi · Starbucks_Guest</p>
                      <p className="truncate font-mono text-xs font-semibold text-ink">SoHo, Manhattan</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-2.5 min-w-0">
                      <p className="truncate font-mono text-[10px] uppercase tracking-wide text-ink-soft">Battery · 84%</p>
                      <p className="truncate font-mono text-xs font-semibold text-signal">Discharging</p>
                    </div>
                  </div>
                  <div className="mt-auto shrink-0">
                    {!eraseTriggered ? (
                      <Button type="button" variant="outline" size="sm" onClick={handleErase} className="w-full rounded-full border-alert/20 text-alert hover:bg-alert hover:text-white gap-1.5 font-medium">
                        <Trash2 className="h-3.5 w-3.5" /> Initiate remote disk wipe
                      </Button>
                    ) : (
                      <span className="flex w-full items-center justify-center rounded-full border border-alert/20 bg-alert/10 px-3 py-2 text-center font-mono text-xs font-semibold text-alert">Wipe dispatched over cellular</span>
                    )}
                  </div>
                </motion.div>
              )}

              {mode === 3 && (
                <motion.div key="p3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-1 flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2 shrink-0">
                    <span className="flex items-center gap-1.5 truncate font-display text-xs font-semibold text-ink"><Building2 className="h-3.5 w-3.5 shrink-0 text-signal" /> Enterprise Guard</span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] font-medium text-signal"><span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" /> Org active</span>
                  </div>
                  <div className="rounded-xl border border-signal/20 bg-signal-soft p-3 flex items-center justify-between gap-2 min-w-0">
                    <span className="min-w-0"><span className="block font-mono text-[10px] uppercase tracking-wide text-ink-soft">Managed fleet</span><span className="block truncate font-display text-sm font-bold text-ink">42 active laptops</span></span>
                    <Badge variant="signal" className="shrink-0">99.8% Zero-trust</Badge>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 min-w-0"><span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ink truncate"><Radio className="h-3 w-3 shrink-0 text-signal" /> Hardware enrollment</span><span className="shrink-0 font-mono text-[10px] text-ink-soft">1m ago</span></div>
                    <div className="min-w-0"><p className="truncate font-mono text-xs font-semibold text-ink">MacBook M3 Max (#ENG-04)</p><p className="truncate font-mono text-[11px] text-ink-soft">Ed25519 enclave key verified</p></div>
                    {!enterpriseApproved ? (
                      <Button type="button" size="sm" onClick={handleApprove} className="w-full rounded-full bg-ink text-mist hover:bg-ink/90 gap-1.5 font-medium"><Check className="h-3.5 w-3.5" /> Approve enclave key</Button>
                    ) : (
                      <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-signal-soft border border-signal/20 px-3 py-2 font-mono text-xs font-semibold text-signal"><Check className="h-3.5 w-3.5" /> Approved & bound</span>
                    )}
                  </div>
                  <p className="mt-auto shrink-0 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-center font-mono text-[11px] text-ink-soft">Audit ledger · 142 events sealed</p>
                </motion.div>
              )}

              {mode === 4 && (
                <motion.div key="p4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-1 flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2 shrink-0">
                    <span className="flex items-center gap-1.5 truncate font-display text-xs font-semibold text-ink"><GuardianMark className="h-3.5 w-3.5 shrink-0 text-signal" /> Watchline settings</span>
                    <Badge variant="signal" className="shrink-0 text-[10px]"><Sliders className="h-3 w-3" /> Interactive</Badge>
                  </div>
                  <button type="button" onClick={() => setPushAlertsEnabled(!pushAlertsEnabled)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3 text-left hover:border-signal/20 transition-colors min-w-0">
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 truncate font-mono text-xs font-semibold text-ink"><Bell className="h-3.5 w-3.5 shrink-0 text-signal" /> Instant push alerts</span><span className="block truncate font-mono text-[11px] text-ink-soft">Notify on PIN failure</span></span>
                    <span className={cn('relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors', pushAlertsEnabled ? 'bg-signal' : 'bg-line')}><span className={cn('block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', pushAlertsEnabled ? 'translate-x-4' : 'translate-x-0')} /></span>
                  </button>
                  <button type="button" onClick={() => setCameraEvidenceEnabled(!cameraEvidenceEnabled)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3 text-left hover:border-signal/20 transition-colors min-w-0">
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 truncate font-mono text-xs font-semibold text-ink"><Camera className="h-3.5 w-3.5 shrink-0 text-signal" /> Silent camera snapshot</span><span className="block truncate font-mono text-[11px] text-ink-soft">Enclave-sealed proof</span></span>
                    <span className={cn('relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors', cameraEvidenceEnabled ? 'bg-signal' : 'bg-line')}><span className={cn('block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', cameraEvidenceEnabled ? 'translate-x-4' : 'translate-x-0')} /></span>
                  </button>
                  <Button type="button" variant="outline" size="sm" onClick={handleSendPing} className={cn('w-full rounded-full gap-1.5 font-mono text-xs border-line', pingSent && 'bg-signal text-mist-deep border-signal hover:bg-signal')}>
                    <Send className="h-3.5 w-3.5" /> {pingSent ? 'Ping sent to MacBook' : 'Ping Mac via TLS 1.3'}
                  </Button>
                  <span className="mt-auto flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-center font-mono text-[11px] text-ink-soft shrink-0">
                    <Radio className="h-3 w-3 shrink-0 text-signal animate-pulse" /> {lastPingFromMac ? 'Mac audit received (14 ms)' : '3 devices guarded & synced'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mx-auto mt-2 h-1 w-24 shrink-0 rounded-full bg-ink/25 dark:bg-white/20" />
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-black/20 dark:bg-white/10" />
            <span className="h-[2px] w-8 rounded-full bg-black/10 dark:bg-white/10" />
            <span className="h-1 w-1 rounded-full bg-black/20 dark:bg-white/10" />
          </div>
          <div className="pointer-events-none absolute bottom-[10px] left-1/2 -translate-x-1/2 flex gap-[3px]">
            <span className="h-[3px] w-[3px] rounded-full bg-black/30 dark:bg-white/20" />
            <span className="h-[3px] w-[12px] rounded-full bg-black/10 dark:bg-white/10" />
            <span className="h-[3px] w-[3px] rounded-full bg-black/30 dark:bg-white/20" />
          </div>
        </div>
        <div className="absolute -bottom-[3px] left-1/2 h-[3px] w-32 -translate-x-1/2 rounded-b-[2px] bg-black/10 dark:bg-black/40 blur-[0.5px]" />
      </div>
    </div>
  )
}
