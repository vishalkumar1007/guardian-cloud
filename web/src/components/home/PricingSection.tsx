import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Shield,
  Building2,
  Crown,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Zap,
} from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState<boolean>(true)

  const TIERS = [
    {
      id: 'personal_basic',
      name: 'Personal Basic',
      icon: User,
      monthlyPrice: 9,
      annualPrice: 7,
      period: '/ month',
      badge: 'INDIVIDUAL',
      description: 'Essential presence spine and offline alerting for your everyday machines.',
      deviceLimit: 'Up to 3 devices',
      features: [
        'Presence spine over TLS 1.3',
        'Offline disconnect alerts via push',
        'Single-owner isolated tenant',
        'Append-only personal audit trail',
        'Zero-knowledge Ed25519 pairing',
      ],
      cta: 'Start Personal Basic',
      to: '/signup',
      featured: false,
    },
    {
      id: 'personal_advanced',
      name: 'Personal Advanced',
      icon: Shield,
      monthlyPrice: 19,
      annualPrice: 15,
      period: '/ month',
      badge: 'MOST POPULAR',
      description: 'Maximum anti-theft defense with silent camera tripwire and air-gapped lockdown.',
      deviceLimit: 'Up to 5 devices',
      features: [
        'Everything in Basic, plus:',
        'Silent Biometric Camera Tripwire (3 PIN fails)',
        '1-Click Hardware Lockdown from iPhone',
        'Air-Gapped Offline Lockdown Policy Cache',
        'Encrypted Cellular GPS Tracking Beacon',
        'Priority Emergency Recovery SLA',
      ],
      cta: 'Get Advanced Security',
      to: '/signup',
      featured: true,
    },
    {
      id: 'enterprise_basic',
      name: 'Enterprise Basic',
      icon: Building2,
      monthlyPrice: 12,
      annualPrice: 10,
      period: '/ seat / mo',
      badge: 'ORGANIZATION',
      description: 'Cryptographic fleet governance, role hierarchy, and signed policy deployment.',
      deviceLimit: 'Unlimited endpoints',
      features: [
        '6 Hierarchical Roles (Owner to Member)',
        'Cryptographically Signed Ed25519 Policies',
        'Department Fleet Groups & BYOD Isolation',
        'Instant Fleet-Wide Quarantine in <2s',
        'Centralized Seat Billing & Quotas',
      ],
      cta: 'Deploy Organization',
      to: '/signup',
      featured: false,
    },
    {
      id: 'enterprise_full',
      name: 'Enterprise Full',
      icon: Crown,
      monthlyPrice: null,
      annualPrice: null,
      period: 'Custom pricing',
      badge: 'SCALE & COMPLIANCE',
      description: 'Deterministic AI threat triage, Okta/Azure SSO, and dedicated compliance SLAs.',
      deviceLimit: 'Custom seat quotas',
      features: [
        'Everything in Enterprise Basic, plus:',
        'Okta & Azure AD Single Sign-On (SAML + SCIM)',
        'Deterministic AI Threat Radar & Scoring',
        'Automated SOC 2 / ISO 27001 Evidence Export',
        '99.99% Uptime SLA & 15-min Security Response',
        'Dedicated Enterprise Solution Architect',
      ],
      cta: 'Contact Enterprise Sales',
      to: '/signup',
      featured: false,
    },
  ]

  return (
    <div className="w-full">
      {/* Monthly / Annual Billing Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1 text-xs font-semibold shadow-sm">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-all duration-200',
              !isAnnual ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all duration-200',
              isAnnual ? 'bg-signal text-mist-deep shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            <span>Annual Billing</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-bold uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {TIERS.map((tier) => {
          const Icon = tier.icon
          const price = isAnnual ? tier.annualPrice : tier.monthlyPrice
          return (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 transition-all duration-300 text-left',
                tier.featured
                  ? 'border-signal bg-surface shadow-[0_20px_50px_rgba(15,118,110,0.14)] ring-1 ring-signal'
                  : 'border-line bg-surface hover:border-signal/30 hover:shadow-lg',
              )}
            >
              {/* Featured Badge */}
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-signal px-3.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Most Popular</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl border',
                      tier.featured
                        ? 'bg-signal border-signal text-white shadow-sm'
                        : 'bg-surface-2 border-line text-ink',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-signal">
                    {tier.badge}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold tracking-tight text-ink mt-4">
                  {tier.name}
                </h3>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed min-h-[36px]">
                  {tier.description}
                </p>

                {/* Price Display */}
                <div className="mt-5 pt-4 border-t border-line">
                  {price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                        ${price}
                      </span>
                      <span className="font-mono text-xs text-ink-soft">{tier.period}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-2xl sm:text-3xl font-bold text-ink">
                        Custom
                      </span>
                      <span className="font-mono text-xs text-ink-soft">· Annual agreement</span>
                    </div>
                  )}
                  <p className="font-mono text-[11px] text-signal font-semibold mt-1">
                    {tier.deviceLimit}
                  </p>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-2.5">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-ink">
                      <Check className="h-4 w-4 shrink-0 text-signal mt-0.5" />
                      <span className={cn(fIdx === 0 && tier.featured ? 'font-semibold text-signal' : 'text-ink-soft')}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-line">
                <Button
                  asChild
                  variant={tier.featured ? 'signal' : 'outline'}
                  size="default"
                  className="w-full rounded-full font-medium"
                >
                  <Link to={tier.to} className="flex items-center justify-center gap-1.5">
                    <span>{tier.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enterprise Trust Certifications Ribbon */}
      <div className="mt-12 rounded-2xl border border-line bg-surface-2 p-4 sm:p-5 flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-ink-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-signal" />
          <span>SOC 2 Type II Certified</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-signal" />
          <span>Zero-Knowledge Encryption</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-signal" />
          <span>Air-Gapped Offline Protection</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-signal" />
          <span>GDPR & HIPAA Ready</span>
        </div>
      </div>
    </div>
  )
}
