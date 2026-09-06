import React, { useState } from 'react'
import { Save, CheckCircle2, Building2, Globe, Timer, Scale, ShieldCheck, Link2, Mail, Phone, FileText } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'

export function GeneralSaaSForm() {
  const settings = useAdminData(() => adminService.getSettings())
  const g = settings.general
  const [saved, setSaved] = useState(false)

  const [portalName, setPortalName] = useState(g.portalName)
  const [companyLegalName, setCompanyLegalName] = useState(g.companyLegalName)
  const [domainPrimary, setDomainPrimary] = useState(g.domainPrimary)
  const [platformUrl, setPlatformUrl] = useState(g.platformUrl)
  const [logoUrl, setLogoUrl] = useState(g.logoUrl)
  const [faviconUrl, setFaviconUrl] = useState(g.faviconUrl)
  const [supportEmail, setSupportEmail] = useState(g.supportEmail)
  const [supportPhone, setSupportPhone] = useState(g.supportPhone)
  const [incidentAlertEmail, setIncidentAlertEmail] = useState(g.incidentAlertEmail)
  const [statusPageUrl, setStatusPageUrl] = useState(g.statusPageUrl)
  const [legalFooter, setLegalFooter] = useState(g.legalFooter)
  const [termsUrl, setTermsUrl] = useState(g.termsUrl)
  const [privacyUrl, setPrivacyUrl] = useState(g.privacyUrl)
  const [defaultLocale, setDefaultLocale] = useState(g.defaultLocale)
  const [defaultTimezone, setDefaultTimezone] = useState(g.defaultTimezone)
  const [dateFormat, setDateFormat] = useState(g.dateFormat)
  const [businessHours, setBusinessHours] = useState(g.businessHours)
  const [dataResidencyRegion, setDataResidencyRegion] = useState(g.dataResidencyRegion)
  const [trialDurationDays, setTrialDurationDays] = useState(g.trialDurationDays)
  const [trialAutoConvert, setTrialAutoConvert] = useState(g.trialAutoConvert)
  const [allowTrialAutoEnroll, setAllowTrialAutoEnroll] = useState(g.allowTrialAutoEnroll)
  const [maintenanceNoticeLeadHours, setMaintenanceNoticeLeadHours] = useState(g.maintenanceNoticeLeadHours)
  const [enforceStrictTenancy, setEnforceStrictTenancy] = useState(g.enforceStrictTenancy)
  const [enforceSsoForAdmins, setEnforceSsoForAdmins] = useState(g.enforceSsoForAdmins)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    adminService.updateSettings('general', {
      portalName, companyLegalName, domainPrimary, platformUrl, logoUrl, faviconUrl,
      supportEmail, supportPhone, incidentAlertEmail, statusPageUrl, legalFooter, termsUrl, privacyUrl,
      defaultLocale, defaultTimezone, dateFormat, businessHours, dataResidencyRegion,
      trialDurationDays, trialAutoConvert, allowTrialAutoEnroll, maintenanceNoticeLeadHours,
      enforceStrictTenancy, enforceSsoForAdmins,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5 font-mono text-xs max-w-4xl">
      {saved && (
        <div className="p-3 rounded-xl border border-signal/30 bg-signal/10 text-signal flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-signal" />
          <span>Guardian general settings saved — applied to all clusters (mock).</span>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-signal/10 border border-signal/20 flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-signal" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold text-ink">Guardian SaaS — General</h3>
          <p className="text-ink-soft text-xs mt-0.5 font-sans">Guardian company identity, locale and regional defaults, trial lifecycle, and legal posture. No tenant billing — that lives under Plans & Subscriptions.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-signal" />
            <h4 className="font-display text-sm font-bold text-ink">Brand & Identity</h4>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-line text-ink-soft">Guardian company only</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Portal Display Name</label>
              <input value={portalName} onChange={(e) => setPortalName(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" placeholder="Guardian SaaS Control Plane" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Company Legal Name</label>
              <input value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" placeholder="Guardian Security Inc." />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Primary Domain</label>
              <input value={domainPrimary} onChange={(e) => setDomainPrimary(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" placeholder="guardian.security" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Platform URL</label>
              <input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" placeholder="https://control.guardian.security" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Logo URL</label>
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" placeholder="https://.../logo.svg (leave blank for default mark)" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Favicon URL</label>
              <input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" placeholder="https://.../favicon.ico" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-signal" />
            <h4 className="font-display text-sm font-bold text-ink">Locale & Region</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Default Locale</label>
              <select value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink">
                <option value="en-US">en-US</option>
                <option value="en-GB">en-GB</option>
                <option value="ja-JP">ja-JP</option>
                <option value="de-DE">de-DE</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Default Timezone</label>
              <select value={defaultTimezone} onChange={(e) => setDefaultTimezone(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink">
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Date Format</label>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink">
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Business Hours</label>
              <input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Data Residency Region</label>
              <select value={dataResidencyRegion} onChange={(e) => setDataResidencyRegion(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink">
                <option value="us-east-1">us-east-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-west-1">eu-west-1</option>
                <option value="ap-southeast-1">ap-southeast-1</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-signal" />
            <h4 className="font-display text-sm font-bold text-ink">Trial & Lifecycle Rules</h4>
            <span className="text-[10px] text-ink-soft ml-auto">Mock — writes to audit log</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Trial Duration (days)</label>
              <input type="number" value={trialDurationDays} onChange={(e) => setTrialDurationDays(Number(e.target.value))} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Maintenance Notice Lead (hours)</label>
              <input type="number" value={maintenanceNoticeLeadHours} onChange={(e) => setMaintenanceNoticeLeadHours(Number(e.target.value))} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={allowTrialAutoEnroll} onChange={(e) => setAllowTrialAutoEnroll(e.target.checked)} className="rounded" />
                <span className="text-ink">Allow trial auto-enroll</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={trialAutoConvert} onChange={(e) => setTrialAutoConvert(e.target.checked)} className="rounded" />
                <span className="text-ink">Auto-convert trial → active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-signal" />
            <h4 className="font-display text-sm font-bold text-ink">Contact & Legal</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink-soft" /> Support Email</label>
              <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink-soft" /> Support Phone</label>
              <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink-soft" /> Incident Alert Email</label>
              <input value={incidentAlertEmail} onChange={(e) => setIncidentAlertEmail(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5 text-ink-soft" /> Status Page URL</label>
              <input value={statusPageUrl} onChange={(e) => setStatusPageUrl(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Terms URL</label>
              <input value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Privacy URL</label>
              <input value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-ink font-semibold block flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-ink-soft" /> Legal Footer</label>
            <textarea value={legalFooter} onChange={(e) => setLegalFooter(e.target.value)} rows={2} className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink" />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-signal" />
            <h4 className="font-display text-sm font-bold text-ink">Enforcement Posture</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
              <div>
                <span className="font-semibold text-ink block">Strict tenancy isolation</span>
                <span className="text-[11px] text-ink-soft">Blocks cross-tenant data access at middleware layer</span>
              </div>
              <input type="checkbox" checked={enforceStrictTenancy} onChange={(e) => setEnforceStrictTenancy(e.target.checked)} className="rounded" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
              <div>
                <span className="font-semibold text-ink block">Enforce SSO for all admins</span>
                <span className="text-[11px] text-ink-soft">Require SAML SSO; disable password fallback</span>
              </div>
              <input type="checkbox" checked={enforceSsoForAdmins} onChange={(e) => setEnforceSsoForAdmins(e.target.checked)} className="rounded" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-signal hover:bg-signal/90 px-4 py-2 text-white shadow-sm">
            <Save className="h-3.5 w-3.5" /> Save General
          </button>
        </div>
      </form>
    </div>
  )
}
