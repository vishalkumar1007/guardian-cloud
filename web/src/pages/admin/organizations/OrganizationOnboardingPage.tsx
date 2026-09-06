import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  User,
  CreditCard,
  Layers,
  Shield,
  Sliders,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Sparkles,
} from 'lucide-react'
import {
  organizationOnboardingSchema,
  type OrganizationOnboardingFormValues,
} from '../../../schemas/adminSchemas'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../lib/utils'

const STEPS = [
  { id: 1, name: 'Organization', icon: Building2 },
  { id: 2, name: 'Owner', icon: User },
  { id: 3, name: 'Plan', icon: CreditCard },
  { id: 4, name: 'Subscription', icon: Layers },
  { id: 5, name: 'Security', icon: Shield },
  { id: 6, name: 'Limits', icon: Sliders },
  { id: 7, name: 'Review', icon: CheckCircle2 },
  { id: 8, name: 'Activate', icon: Sparkles },
]

export function OrganizationOnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isActivated, setIsActivated] = useState(false)
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

  const form = useForm<OrganizationOnboardingFormValues>({
    resolver: zodResolver(organizationOnboardingSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      industry: 'Cybersecurity',
      region: 'us-east-1',
      ownerName: '',
      ownerEmail: '',
      ownerTitle: 'Chief Information Security Officer',
      planTier: 'ENTERPRISE',
      billingInterval: 'ANNUAL',
      seatCount: 150,
      deviceMultiplier: 2,
      enforceMfa: true,
      isolateHighRiskDevices: true,
      complianceStandard: 'SOC2',
      riskThreshold: 75,
      maxSimultaneousLogins: 3,
      apiRateLimitPerMin: 2000,
      retentionMonths: 24,
    },
  })

  const { register, watch, handleSubmit, formState: { errors, isValid } } = form
  const values = watch()

  const STEP_FIELDS: Record<number, (keyof OrganizationOnboardingFormValues)[]> = {
    1: ['name', 'slug', 'domain', 'industry', 'region'],
    2: ['ownerName', 'ownerEmail'],
    3: ['planTier', 'billingInterval'],
    4: ['seatCount', 'deviceMultiplier'],
    5: ['enforceMfa', 'isolateHighRiskDevices', 'complianceStandard', 'riskThreshold'],
    6: ['maxSimultaneousLogins', 'apiRateLimitPerMin', 'retentionMonths'],
  }

  async function handleNext() {
    if (currentStep < 7) {
      const fields = STEP_FIELDS[currentStep]
      if (fields) {
        const isStepValid = await form.trigger(fields as any)
        if (!isStepValid) return
      }
      setCurrentStep((s) => s + 1)
    }
  }

  function onSubmit(data: OrganizationOnboardingFormValues) {
    if (currentStep < 7) {
      handleNext()
      return
    }

    if (currentStep === 7) {
      // Create Organization via service
      const org = adminService.createOrganization({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        planTier: data.planTier,
        planName: `Guardian ${data.planTier.replace('_', ' ')}`,
        employeeCount: data.seatCount,
        deviceCount: data.seatCount * data.deviceMultiplier,
        industry: data.industry,
        region: data.region,
        mrr: data.planTier === 'ENTERPRISE' ? 4500 : 2500,
      })
      setCreatedOrgId(org.id)
      setIsActivated(true)
      setCurrentStep(8)
    }
  }

  function handleSaveDraft() {
    alert('Draft saved locally. You can resume onboarding anytime.')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/organizations"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-ink">Onboard New Customer Organization</h1>
            <p className="text-xs font-mono text-ink-soft">8-Step Enterprise Provisioning Wizard</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-ink hover:text-ink"
          >
            <Save className="h-3.5 w-3.5 text-ink-soft" /> Save Draft
          </button>
        </div>
      </div>

      {/* Stepper Breadcrumbs */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono text-[11px]">
        {STEPS.map((s) => {
          const isDone = currentStep > s.id
          const isCurrent = currentStep === s.id
          return (
            <button
              key={s.id}
              type="button"
              disabled={s.id > currentStep}
              onClick={() => {
                if (s.id < currentStep) setCurrentStep(s.id)
              }}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-colors',
                isDone && 'border-emerald-800/50 bg-emerald-950/20 text-emerald-400 hover:border-emerald-700 cursor-pointer',
                isCurrent && 'border-signal/80 bg-signal/10 text-signal font-semibold cursor-default',
                !isDone && !isCurrent && 'border-line bg-surface text-ink-soft opacity-60 cursor-not-allowed',
              )}
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-surface-2 border border-current text-xs">
                {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span className="truncate w-full">{s.name}</span>
            </button>
          )
        })}
      </div>

      {/* Wizard Form Container */}
      <div className="rounded-2xl border border-line/80 bg-surface/90 p-6 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 1: Organization Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Organization Legal Name *</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Acme Defense Technologies"
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-signal"
                  />
                  {errors.name && <p className="text-rose-400 text-[10px]">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Tenant Slug *</label>
                  <input
                    {...register('slug')}
                    placeholder="e.g. acme-defense"
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-signal"
                  />
                  {errors.slug && <p className="text-rose-400 text-[10px]">{errors.slug.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Corporate Domain *</label>
                  <input
                    {...register('domain')}
                    placeholder="e.g. acmedefense.com"
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-signal"
                  />
                  {errors.domain && <p className="text-rose-400 text-[10px]">{errors.domain.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Industry *</label>
                  <select
                    {...register('industry')}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  >
                    <option value="Defense & Aerospace">Defense & Aerospace</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Enterprise Tech">Enterprise Tech</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Owner */}
          {currentStep === 2 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 2: Primary Tenant Administrator</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Owner Full Name *</label>
                  <input
                    {...register('ownerName')}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-signal"
                  />
                  {errors.ownerName && <p className="text-rose-400 text-[10px]">{errors.ownerName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Corporate Email *</label>
                  <input
                    {...register('ownerEmail')}
                    placeholder="s.jenkins@acmedefense.com"
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink focus:border-signal"
                  />
                  {errors.ownerEmail && <p className="text-rose-400 text-[10px]">{errors.ownerEmail.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Official Title</label>
                  <input
                    {...register('ownerTitle')}
                    placeholder="VP of Information Security"
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {currentStep === 3 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 3: Guardian License Plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'BUSINESS', name: 'Guardian Business', price: '$18 / seat', desc: 'Up to 150 devices, basic SOC alerts' },
                  { id: 'BUSINESS_PLUS', name: 'Guardian Business Plus', price: '$28 / seat', desc: 'Up to 500 devices, SIEM streaming, SSO' },
                  { id: 'ENTERPRISE', name: 'Guardian Enterprise', price: '$45 / seat', desc: 'Unlimited devices, BYOK, 24/7 war room' },
                ].map((tier) => (
                  <label
                    key={tier.id}
                    className={cn(
                      'p-4 rounded-xl border cursor-pointer flex flex-col justify-between space-y-2',
                      values.planTier === tier.id ? 'border-signal bg-signal/10' : 'border-line bg-surface-2/50',
                    )}
                  >
                    <input
                      type="radio"
                      value={tier.id}
                      {...register('planTier')}
                      className="hidden"
                    />
                    <div>
                      <span className="font-bold text-ink block">{tier.name}</span>
                      <span className="text-signal text-[11px] font-semibold">{tier.price}</span>
                      <p className="text-ink-soft text-[10px] mt-1">{tier.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Subscription */}
          {currentStep === 4 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 4: Subscription Quotas & Billing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Initial Employee Seats *</label>
                  <input
                    type="number"
                    {...register('seatCount')}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Device Multiplier (Per Seat)</label>
                  <input
                    type="number"
                    {...register('deviceMultiplier')}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                  <span className="text-ink-soft text-[10px]">
                    Total Devices Allowed: {values.seatCount * values.deviceMultiplier}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Security Defaults */}
          {currentStep === 5 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 5: Security Policy Baseline</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enforceMfa')}
                    className="rounded text-signal bg-surface-2 border-line"
                  />
                  <div>
                    <span className="font-semibold text-ink">Enforce Hardware MFA / WebAuthn</span>
                    <p className="text-ink-soft text-[11px]">Require biometric or FIDO2 key for all tenant admin roles.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isolateHighRiskDevices')}
                    className="rounded text-signal bg-surface-2 border-line"
                  />
                  <div>
                    <span className="font-semibold text-ink">Autonomous eBPF High-Risk Isolation</span>
                    <p className="text-ink-soft text-[11px]">Automatically micro-isolate endpoints with risk score ≥ 80.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 6: Limits */}
          {currentStep === 6 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 6: Governance & Quota Limits</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Max Simultaneous Logins</label>
                  <input
                    type="number"
                    {...register('maxSimultaneousLogins')}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-ink font-semibold block">Retention Window (Months)</label>
                  <input
                    type="number"
                    {...register('retentionMonths')}
                    className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="font-display text-base font-semibold text-ink">Step 7: Review Configuration</h2>
              <div className="p-4 rounded-xl border border-line bg-surface-2/50 space-y-3">
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink-soft">Organization:</span>
                  <span className="text-ink font-bold">{values.name || 'Acme Tech'} ({values.domain})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink-soft">Primary Admin:</span>
                  <span className="text-ink">{values.ownerName} ({values.ownerEmail})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink-soft">Plan Tier:</span>
                  <span className="text-signal font-bold">{values.planTier}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink-soft">Seats & Devices:</span>
                  <span className="text-ink">{values.seatCount} seats / {values.seatCount * values.deviceMultiplier} devices</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-soft">Security Baseline:</span>
                  <span className="text-emerald-400">MFA Enforced • eBPF Quarantine Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Activation Success */}
          {currentStep === 8 && isActivated && (
            <div className="text-center py-8 space-y-4 font-mono">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Organization Activated Successfully!</h2>
                <p className="text-xs text-ink-soft mt-1">
                  Tenant has been provisioned on the Guardian Control Plane.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  to={`/admin/organizations/${createdOrgId}`}
                  className="rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white no-underline shadow-sm"
                >
                  Go to Organization Dashboard →
                </Link>
                <Link
                  to="/admin/organizations"
                  className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-xs font-medium text-ink hover:text-ink no-underline"
                >
                  All Organizations
                </Link>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          {currentStep < 8 && (
            <div className="flex items-center justify-between pt-4 border-t border-line/80 font-mono text-xs">
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-4 py-2 text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>

              {currentStep === 7 ? (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors"
                >
                  Activate Organization
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors"
                >
                  Next Step
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
