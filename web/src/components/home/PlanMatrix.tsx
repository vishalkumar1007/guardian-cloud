import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { User, Shield, Building2, Crown, Sparkles, ArrowRight, Check } from 'lucide-react'
import { Stagger, StaggerItem } from './Reveal'

const TIERS = [
  {
    tier: 'BASIC',
    name: 'Personal Basic',
    icon: User,
    price: '$9',
    period: '/mo',
    badge: 'For individuals',
    about: 'Up to 3 machines.',
    features: ['Presence & ribbon', 'Offline alerts', 'Single Owner', 'Audit trail'],
    cta: 'Start personal',
    to: '/signup',
    featured: false,
    tone: 'personal' as const,
  },
  {
    tier: 'ADVANCED',
    name: 'Personal Advanced',
    icon: Shield,
    price: '$19',
    period: '/mo',
    badge: 'Popular',
    about: 'Faces & LOCK.',
    features: ['Everything in Basic', 'Trusted faces', 'Face alerts', 'Evidence & recovery'],
    cta: 'Go advanced',
    to: '/signup',
    featured: true,
    tone: 'personal' as const,
  },
  {
    tier: 'ENTERPRISE_BASIC',
    name: 'Enterprise Basic',
    icon: Building2,
    price: '$12',
    period: '/seat/mo',
    badge: 'For companies',
    about: 'Teams & policies.',
    features: ['6 roles', 'Invite & billing', 'Inventory', 'BYOD'],
    cta: 'Start org',
    to: '/signup',
    featured: false,
    tone: 'enterprise' as const,
  },
  {
    tier: 'ENTERPRISE_FULL',
    name: 'Enterprise Full',
    icon: Crown,
    price: 'Custom',
    period: '',
    badge: 'At scale',
    about: 'SSO & compliance.',
    features: ['Everything in Basic', 'Risk scoring', 'SSO & SCIM', 'Compliance'],
    cta: 'Talk to us',
    to: '/signup',
    featured: false,
    tone: 'enterprise' as const,
  },
]

function Card({ p }: { p: (typeof TIERS)[number] }) {
  const isPersonal = p.tone === 'personal'
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border bg-surface p-6 text-left md:p-7 ${
        p.featured ? 'border-signal/20 shadow-[0_16px_40px_rgba(15,118,110,0.12)]' : 'border-line'
      }`}
    >
      {p.featured && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-signal-soft/40 to-transparent" />
      )}
      {p.featured && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-signal px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
          <Sparkles className="h-3 w-3" /> Popular
        </span>
      )}

      <div className="relative flex items-start gap-3 text-left">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${p.featured ? 'bg-signal border-signal text-white' : isPersonal ? 'bg-signal-soft border-signal/15 text-signal' : 'bg-surface-2 border-line text-ink'}`}>
          <p.icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal">{p.tier.replace('_', ' ')}</p>
          <h3 className="mt-0.5 truncate text-left font-display text-[16px] font-semibold tracking-tight text-ink">{p.name}</h3>
        </div>
      </div>

      <p className="relative mt-3 inline-flex w-fit self-start rounded-full border border-line bg-surface-2 px-2.5 py-1 text-left font-mono text-[10px] font-medium text-ink-soft">{p.badge}</p>

      <div className="relative mt-4 flex items-baseline justify-start gap-1.5 text-left">
        <span className="text-left font-display text-[30px] font-bold leading-none tracking-tight text-ink">{p.price}</span>
        <span className="text-left text-xs font-medium leading-none text-ink-soft">{p.period}</span>
      </div>
      <p className="relative mt-2 min-h-[36px] text-left text-xs leading-relaxed text-ink-soft">{p.about}</p>

      <div className="relative mt-5 h-px bg-line" />

      <ul className="relative mt-4 flex flex-1 flex-col space-y-2.5 text-left">
        {p.features.map((f) => (
          <li key={f} className="flex items-start justify-start gap-2.5 text-left text-xs leading-relaxed">
            <span className={`mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${f.startsWith('Everything') ? 'bg-signal text-mist-deep' : 'bg-surface-2 border border-line text-ink-soft'}`}>
              <Check className="h-3 w-3" />
            </span>
            <span className={`flex-1 text-left ${f.startsWith('Everything') ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{f}</span>
          </li>
        ))}
      </ul>

      <Button asChild variant={p.featured ? 'signal' : 'outline'} size="sm" className="relative mt-6 w-full rounded-full">
        <Link to={p.to} className="gap-1.5">
          {p.cta} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <p className="relative mt-2.5 text-center font-mono text-[10px] leading-none text-ink-soft">{p.tier.startsWith('ENTERPRISE') ? 'Seat or device billing' : 'Billed monthly · Cancel anytime'}</p>
    </div>
  )
}

export function PlanMatrix() {
  return (
    <div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex h-7 items-center gap-2.5 px-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal text-mist-deep">
              <User className="h-3.5 w-3.5" />
            </span>
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink leading-none">Personal</p>
            <span className="ml-auto hidden h-6 items-center rounded-full border border-signal/15 bg-signal-soft px-3 font-mono text-[10px] font-semibold tracking-wide text-signal sm:inline-flex">BASIC · ADVANCED</span>
          </div>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {TIERS.slice(0, 2).map((p) => (
              <StaggerItem key={p.tier} className="h-full">
                <Card p={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex h-7 items-center gap-2.5 px-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-mist">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink leading-none">Enterprise</p>
            <span className="ml-auto hidden h-6 items-center rounded-full border border-line bg-surface-2 px-3 font-mono text-[10px] font-semibold tracking-wide text-ink-soft sm:inline-flex">BASIC · FULL</span>
          </div>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {TIERS.slice(2, 4).map((p) => (
              <StaggerItem key={p.tier} className="h-full">
                <Card p={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-signal" />
        <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
          <code className="rounded bg-mist px-1 py-0.5 font-semibold text-ink">plans.tier</code> BASIC / ADVANCED / ENTERPRISE_BASIC / FULL — Phase 5 not sold
        </p>
      </div>
    </div>
  )
}
