import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { Button } from '../components/ui/button'
import { MacBookProductStage } from '../components/mac/MacBookProductStage'
import { SentinelMeshBg } from '../components/home/SentinelMeshBg'
import { WhatIsSection } from '../components/home/PortalsSection'
import { InteractiveModes } from '../components/home/InteractiveModes'
import { PortalExplorer } from '../components/home/PortalExplorer'
import { SecurityEngineGrid } from '../components/home/SecurityEngineGrid'
import { LifecycleStepper } from '../components/home/LifecycleStepper'
import { ArchitectureShowcase } from '../components/home/ArchitectureShowcase'
import { PricingSection } from '../components/home/PricingSection'
import { SecurityFaq } from '../components/home/SecurityFaq'
import { FinalCta } from '../components/home/FinalCta'

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 24])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.98])

  return (
    <div>
      {/* 1. HERO & DUAL-SCREEN LIVE SHOWCASE */}
      <div ref={heroRef} className="g-hero-wrap">
        <SentinelMeshBg />
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
            <div className="mb-[80px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-signal" />
                Interactive Tour
              </span>
              <span className="opacity-30">—</span>
              <span className="truncate">What Is Guardian · Tools · How It Works</span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-signal/15 bg-signal-soft px-2 py-0.5 text-[9px] font-semibold tracking-wide text-signal normal-case">Live preview</span>
            </div>
            <MacBookProductStage hero />
          </div>
        </section>
      </div>

      {/* 2. WHAT IS GUARDIAN */}
      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="What is Guardian"
            title="Independent. Not an add-on."
            desc="Admin, tenant model and infra are separate from Aetherion. One promise: protect the person, the org, the device."
          />
          <div className="mt-10 lg:mt-12">
            <WhatIsSection />
          </div>
        </div>
      </section>

      {/* 3. WHO IS IT FOR: PERSONAL VS ENTERPRISE MATRIX */}
      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="Dual-Persona Architecture"
            title="Two modes. One sovereign watchline."
            desc="Choose between personal single-owner vaults for creators & individuals, or centralized organizational fleet governance."
          />
          <div className="mt-10 lg:mt-12">
            <InteractiveModes />
          </div>
        </div>
      </section>

      {/* 4. THE 5 ISOLATED PORTALS ECOSYSTEM */}
      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="Zero-Trust Ecosystem"
            title="Five isolated portals. One watchline."
            desc="Explore the cryptographic boundaries separating personal vaults, enterprise fleets, root control planes, and edge daemons."
          />
          <div className="mt-10 lg:mt-12">
            <PortalExplorer />
          </div>
        </div>
      </section>

      {/* 5. DEFENSE-IN-DEPTH: 6 ZERO-TRUST PILLARS */}
      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="Cryptographic Foundation"
            title="Six layers of zero-trust hardware defense."
            desc="From silicon-level Secure Enclave binding to silent camera tripwires and deterministic AI threat triage."
          />
          <div className="mt-10 lg:mt-12">
            <SecurityEngineGrid />
          </div>
        </div>
      </section>

      {/* 6. THREAT CONTAINMENT LIFECYCLE (4-STAGE WORKFLOW) */}
      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="Security Lifecycle"
            title="From enclave pairing to emergency lockdown."
            desc="Trace the real-time telemetry events of an authorized machine from initial handshake to air-gapped containment."
          />
          <div className="mt-10 lg:mt-12">
            <LifecycleStepper />
          </div>
        </div>
      </section>

      {/* 7. HARDWARE TOPOLOGY: CLOUD COMMAND VS DESKTOP TRUTH */}
      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="Hardware Architecture"
            title="Cloud command. Desktop truth."
            desc="Bilateral TLS 1.3 heartbeat connects central PostgreSQL telemetry to native edge Rust daemons running on bare silicon."
          />
          <div className="mt-10 lg:mt-12">
            <ArchitectureShowcase />
          </div>
        </div>
      </section>

      {/* 8. PLANS & TRANSPARENT PRICING */}
      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            tag="Plans & Licensing"
            title="Transparent pricing for individuals and fleets."
            desc="Start with Personal Basic for everyday laptops, or deploy enterprise-wide governance with dedicated compliance SLAs."
          />
          <div className="mt-10 lg:mt-12">
            <PricingSection />
          </div>
        </div>
      </section>

      {/* 9. SECURITY & CRYPTOGRAPHIC FAQ */}
      <section className="g-section g-section-muted">
        <div className="mx-auto max-w-4xl">
          <SectionHead
            tag="Technical FAQ"
            title="Frequently asked security questions."
            desc="Everything you need to know about air-gapped lockdowns, camera tripwires, and zero-knowledge encryption."
          />
          <div className="mt-10 lg:mt-12">
            <SecurityFaq />
          </div>
        </div>
      </section>

      {/* 10. FINAL CYBER COMMAND CTA */}
      <section className="g-section">
        <div className="mx-auto max-w-6xl">
          <FinalCta />
        </div>
      </section>
    </div>
  )
}

function SectionHead({ tag, title, desc }: { tag: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-[620px] text-center">
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-signal shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-signal" /> {tag}
      </p>
      <h2 className="mt-3.5 font-display text-[24px] font-bold leading-tight tracking-tight text-ink sm:text-[28px] md:text-[32px]">
        {title}
      </h2>
      {desc ? <p className="mx-auto mt-2.5 max-w-[540px] text-sm leading-relaxed text-ink-soft">{desc}</p> : null}
    </div>
  )
}
