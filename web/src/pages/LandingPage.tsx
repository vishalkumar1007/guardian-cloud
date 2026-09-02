import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { Button } from '../components/ui/button'
import { MacBookProductStage } from '../components/mac/MacBookProductStage'
import { LineGridBg } from '../components/home/LineGridBg'
import { Reveal, Stagger, StaggerItem } from '../components/home/Reveal'
import { ProductDetail } from '../components/home/ProductDetail'
import { PortalsSection, WhatIsSection, ModesSection } from '../components/home/PortalsSection'
import { PlanMatrix } from '../components/home/PlanMatrix'
import { Laptop, Eye, Shield, RotateCcw } from 'lucide-react'

const CAPABILITIES = [
  { title: 'Presence spine', copy: 'Online & offline in one line.' },
  { title: 'Signal ribbon', copy: 'Heartbeats as a timeline.' },
  { title: 'Protect & recover', copy: 'Lock and recover simply.' },
  { title: 'Personal & org', copy: 'One watchline, two modes.' },
  { title: 'Desktop agent', copy: 'macOS, Windows, Linux.' },
  { title: 'Audit ready', copy: 'Clear, auditable actions.' },
]

const STEPS = [
  { step: '01', title: 'Enroll', icon: Laptop, copy: 'Short-lived token.' },
  { step: '02', title: 'Watch', icon: Eye, copy: 'Heartbeat → Postgres.' },
  { step: '03', title: 'Protect', icon: Shield, copy: 'Policy decides.' },
  { step: '04', title: 'Recover', icon: RotateCcw, copy: 'LOCK even offline.' },
]

const FAQ = [
  { q: 'What is Guardian?', a: 'Presence, signals & recovery — isolated platform.' },
  { q: 'Which portals?', a: 'Public, Personal, Org, Admin, Recovery + Agent.' },
  { q: 'Who is it for?', a: 'Personal or org — six org roles.' },
  { q: 'Which platforms?', a: 'macOS, Windows, Linux + browser.' },
  { q: 'Is my data private?', a: 'Tenant-isolated. Evidence is private.' },
  { q: 'Can I try it?', a: 'Yes — start Personal Basic.' },
]

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 24])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.98])

  return (
    <div>
      <div ref={heroRef} className="g-hero-wrap">
        <LineGridBg />
        <div className="pointer-events-none absolute left-1/2 top-[52%] h-[360px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--g-glow)] opacity-30 blur-3xl md:h-[420px] md:w-[760px]" />
        <section className="g-landing-hero relative">
          <motion.div style={reduce ? undefined : { y, opacity }} className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <div className="mx-auto max-w-[640px] text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-signal animate-spine-pulse" /> Guardian — continuous security
              </p>
              <h1 className="mt-5 font-display text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[36px] md:text-[42px] lg:text-[48px]">
                Continuous security
                <span className="block font-display font-light tracking-[-0.02em] text-ink-soft">for every device you trust</span>
              </h1>
              <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-relaxed text-ink-soft md:text-[15px]">
                Protect the person. Protect the organization. Control the device — on one watchline.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="signal" size="lg" className="rounded-full px-7">
                  <Link to="/signup">Start watchline</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
              <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-ink-soft">AGENTS FOR macOS · WINDOWS · LINUX</p>
            </div>
          </motion.div>
        </section>
        <section className="g-laptop-stage">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Interactive preview — Overview · Signals · Protect</p>
            <MacBookProductStage hero />
          </div>
        </section>
      </div>

      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="What is Guardian" title="Independent. Not an add-on." desc="Admin, tenant model and infra are separate from Aetherion. One promise: protect the person, the org, the device." />
          <div className="mt-10 lg:mt-12">
            <WhatIsSection />
          </div>
        </div>
      </section>

      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="Who is it for" title="Two modes. One platform." />
          <div className="mt-10 lg:mt-12">
            <ModesSection />
          </div>
        </div>
      </section>

      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="Portals" title="Five portals. One watchline." desc="Plus the Agent — Rust core, OS adapters." />
          <div className="mt-10 lg:mt-12">
            <PortalsSection />
          </div>
        </div>
      </section>

      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="Platform" title="Every data domain, one language." />
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {CAPABILITIES.map((c, i) => (
              <StaggerItem key={c.title}>
                <div className="group relative flex gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-signal/15 hover:bg-surface-2/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mist text-ink-soft group-hover:bg-signal group-hover:text-white transition-colors font-mono text-xs font-bold">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold tracking-tight text-ink">{c.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{c.copy}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <ProductDetail />
        </div>
      </section>

      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="How it works" title="From enroll to recover." />
          <div className="relative mt-10 lg:mt-12">
            <div className="pointer-events-none absolute left-[18px] top-6 bottom-6 w-px bg-gradient-to-b from-signal/30 via-line to-transparent sm:hidden" />
            <div className="pointer-events-none absolute left-1/2 top-[22px] hidden h-px w-[68%] -translate-x-1/2 bg-gradient-to-r from-transparent via-signal/15 to-transparent lg:block" />
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <StaggerItem key={s.step}>
                  <div className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)]">
                    <div className="absolute right-4 top-4 font-mono text-[10px] font-bold tracking-widest text-ink-soft/40">{s.step}</div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-mist group-hover:bg-signal group-hover:text-white transition-colors">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="h-px flex-1 bg-gradient-to-r from-signal/25 to-transparent" />
                      <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                    </div>
                    <h3 className="mt-3 font-display text-sm font-semibold tracking-tight text-ink">{s.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{s.copy}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="Architecture" title="Cloud command. Desktop truth." />
          <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 lg:mt-12">
            <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-7 text-left">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-signal/7 blur-2xl" />
              <p className="inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-signal-soft px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-signal">Cloud</p>
              <h3 className="mt-3 text-left font-display text-base font-semibold tracking-tight text-ink">Guardian portals</h3>
              <p className="mt-2 text-left text-[13px] leading-relaxed text-ink-soft">One control plane.</p>
              <ul className="mt-5 grid grid-cols-1 gap-2">
                {['Watchline', 'Incidents', 'Billing'].map((t) => (
                  <li key={t} className="flex items-center justify-start gap-2.5 rounded-full border border-line bg-surface-2 px-3.5 py-2.5 text-left text-xs font-medium leading-none text-ink-soft">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" /> <span className="flex-1 text-left">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-7 text-left">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-ink/[0.04] blur-2xl" />
              <p className="inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-ink-soft">Desktop</p>
              <h3 className="mt-3 text-left font-display text-base font-semibold tracking-tight text-ink">Guardian agent</h3>
              <p className="mt-2 text-left text-[13px] leading-relaxed text-ink-soft">Offline-aware.</p>
              <ul className="mt-5 grid grid-cols-1 gap-2">
                {['Heartbeat', 'Policy cache', 'Evidence'].map((t) => (
                  <li key={t} className="flex items-center justify-start gap-2.5 rounded-full border border-line bg-surface-2 px-3.5 py-2.5 text-left text-xs font-medium leading-none text-ink-soft">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" /> <span className="flex-1 text-left">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead tag="Plans" title="Four tiers. One platform." desc="BASIC → ADVANCED · ENTERPRISE_BASIC → FULL" />
          <div className="mt-10 lg:mt-12">
            <PlanMatrix />
          </div>
        </div>
      </section>

      <section className="g-section">
        <div className="mx-auto max-w-3xl">
          <SectionHead tag="FAQ" title="Common questions" />
          <Stagger className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {FAQ.map((f) => (
              <StaggerItem key={f.q} className="p-6">
                <h3 className="font-display text-sm font-semibold tracking-tight text-ink">{f.q}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{f.a}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="g-section relative overflow-hidden bg-surface-2">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-signal/[0.06] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-xl text-center">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-spine-pulse" /> Ready when you are
            </p>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">Put your devices on the watchline.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">Create a personal tenant in seconds. Organizations start with Enterprise Basic.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="signal" size="lg" className="rounded-full">
                <Link to="/signup">Create account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

function SectionHead({ tag, title, desc }: { tag: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-[560px] text-center">
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-ink-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-signal" /> {tag}
      </p>
      <h2 className="mt-3 font-display text-[22px] font-semibold leading-tight tracking-tight text-ink md:text-[26px]">{title}</h2>
      {desc ? <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-relaxed text-ink-soft">{desc}</p> : null}
    </div>
  )
}
