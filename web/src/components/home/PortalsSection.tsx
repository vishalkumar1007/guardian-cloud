import {
  Globe,
  User,
  Building2,
  ShieldCheck,
  LifeBuoy,
  Laptop,
  ArrowUpRight,
  Shield,
  Fingerprint,
  Cpu,
} from 'lucide-react'
import { Stagger, StaggerItem } from './Reveal'

const PORTALS = [
  {
    icon: Globe,
    name: 'Public Website',
    tag: 'guardian.com',
    copy: 'Marketing only. No session.',
    routes: 'Public',
    iconBg: 'bg-surface-2 text-ink border border-line',
  },
  {
    icon: User,
    name: 'Personal Portal',
    tag: 'personal',
    copy: 'One owner. Devices & recovery.',
    routes: '/devices · /events · /recovery',
    iconBg: 'bg-signal-soft text-signal border border-signal/15',
  },
  {
    icon: Building2,
    name: 'Organization Portal',
    tag: 'organization',
    copy: 'Teams, groups & policies.',
    routes: '/employees · /policies · /incidents',
    iconBg: 'bg-surface-2 text-ink border border-line',
  },
  {
    icon: ShieldCheck,
    name: 'Super Admin',
    tag: 'platform',
    copy: 'Platform ops. Isolated.',
    routes: '/organizations · /system-health',
    iconBg: 'bg-surface-2 text-ink border border-line',
  },
  {
    icon: LifeBuoy,
    name: 'Recovery Portal',
    tag: 'recover',
    copy: 'Lost device. No login needed.',
    routes: '/report · /status · /verify',
    iconBg: 'bg-surface-2 text-ink border border-line',
  },
  {
    icon: Laptop,
    name: 'Guardian Agent',
    tag: 'agent',
    copy: 'Heartbeat & policy cache.',
    routes: 'macOS · Windows · Linux',
    iconBg: 'bg-surface-2 text-ink border border-line',
  },
]

export function PortalsSection() {
  return (
    <div>
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PORTALS.map((p) => (
          <StaggerItem key={p.name}>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.iconBg}`}>
                    <p.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-ink-soft">
                    {p.tag}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[14px] font-semibold tracking-tight text-ink">{p.name}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-soft">{p.copy}</p>
                <p className="mt-4 flex items-center gap-1.5 border-t border-dashed border-line pt-3 font-mono text-[10px] tracking-wide text-ink-soft">
                  {p.routes} <ArrowUpRight className="h-3 w-3 opacity-30 group-hover:opacity-60 transition-opacity" />
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

    </div>
  )
}

export function WhatIsSection() {
  const pillars = [
    {
      k: '01',
      icon: Fingerprint,
      title: 'Protect the person',
      copy: 'Face checks & screenshots on the laptop.',
      grad: 'from-signal-soft/40 via-transparent to-transparent',
      num: 'text-signal/10',
    },
    {
      k: '02',
      icon: Building2,
      title: 'Protect the organization',
      copy: 'Fleet, roles & policies — auditable.',
      grad: 'from-signal-soft/20 via-transparent to-transparent',
      num: 'text-signal/10',
    },
    {
      k: '03',
      icon: Cpu,
      title: 'Control the device',
      copy: 'Signed policy & queued LOCK.',
      grad: 'from-signal-soft/20 via-transparent to-transparent',
      num: 'text-signal/10',
    },
  ]
  return (
    <Stagger className="grid gap-5 md:grid-cols-3">
      {pillars.map((p) => (
        <StaggerItem key={p.k}>
          <div className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${p.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative flex items-start justify-between gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2">
                <p.icon className="h-4.5 w-4.5 text-ink" />
              </span>
              <span className={`font-display text-[28px] font-bold leading-none tracking-tighter ${p.num} select-none`}>{p.k}</span>
            </div>
            <h3 className="relative mt-4 font-display text-[15px] font-semibold tracking-tight text-ink">{p.title}</h3>
            <p className="relative mt-2 text-[13px] leading-relaxed text-ink-soft">{p.copy}</p>
            <span className="relative mt-4 h-px w-8 bg-line group-hover:w-12 group-hover:bg-signal/30 transition-all" />
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

export function ModesSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-signal/7 blur-2xl" />
        <div className="relative p-7 md:p-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal text-mist-deep">
              <User className="h-4 w-4" />
            </span>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">Personal Tenant</p>
          </div>
          <h3 className="mt-4 font-display text-[18px] font-semibold tracking-tight text-ink">For the individual</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">Single-owner tenant. Same policy engine as org, delivered as simple templates.</p>
          <ul className="mt-6 space-y-2.5">
            {['Personal Owner', '3 devices on Basic', 'Events & recovery', 'Face & screenshot'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal text-mist-deep">
                  <Shield className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 font-mono text-xs font-semibold text-white shadow-sm">
            Starts at $9/mo <span className="opacity-60">· Basic</span>
          </p>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-ink/[0.06] blur-2xl" />
        <div className="relative p-7 md:p-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-mist">
              <Building2 className="h-4 w-4" />
            </span>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">Organization Tenant</p>
          </div>
          <h3 className="mt-4 font-display text-[18px] font-semibold tracking-tight text-ink">For the company</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">Six roles, groups & seat billing — employee always sees managed policies.</p>
          <ul className="mt-6 space-y-2.5">
            {['6 roles', 'Groups & BYOD', 'Signed policies', 'SSO / SCIM'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink">
                  <Building2 className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 font-mono text-xs font-semibold text-ink">
            $12 /seat/mo <span className="font-normal text-ink-soft">· Basic</span>
          </p>
        </div>
      </div>
    </div>
  )
}
