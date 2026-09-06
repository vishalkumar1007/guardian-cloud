import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAdminData } from '../../../hooks/useAdminData'
import { adminService } from '../../../services/adminService'
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog'
import { ThemeAppearanceSettings } from './ThemeAppearanceSettings'
import { cn } from '../../../lib/utils'

export function SettingsPages() {
  const { section = 'general' } = useParams<{ section?: string }>()

  if (section === 'appearance' || section === 'theme') {
    return <ThemeAppearanceSettings />
  }

  const settings = useAdminData(() => adminService.getSettings())

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [dangerConfirmOpen, setDangerConfirmOpen] = useState(false)

  // Local form state
  const [portalName, setPortalName] = useState(settings.general.portalName)
  const [supportEmail, setSupportEmail] = useState(settings.general.supportEmail)
  const [mfaEnforced, setMfaEnforced] = useState(settings.security.mfaEnforcedForAdmins)
  const [sessionTimeout, setSessionTimeout] = useState(settings.security.sessionTimeoutMinutes)
  const [ssoEnabled, setSsoEnabled] = useState(settings.authentication.ssoEnabled)
  const [samlSsoUrl, setSamlSsoUrl] = useState(settings.authentication.samlSsoUrl)
  const [slackWebhook, setSlackWebhook] = useState(settings.notifications.slackWebhookUrl)
  const [evidenceBucket, setEvidenceBucket] = useState(settings.storage.evidenceBucket)
  const [auditRetention, setAuditRetention] = useState(settings.retention.auditRetentionDays)
  const [splunkEnabled, setSplunkEnabled] = useState(settings.integrations.splunkExportEnabled)
  const [defaultDevices, setDefaultDevices] = useState(settings.defaults.defaultDeviceLimit)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (section === 'general') {
      adminService.updateSettings('general', { portalName, supportEmail })
    } else if (section === 'security') {
      adminService.updateSettings('security', { mfaEnforcedForAdmins: mfaEnforced, sessionTimeoutMinutes: sessionTimeout })
    } else if (section === 'authentication') {
      adminService.updateSettings('authentication', { ssoEnabled, samlSsoUrl })
    } else if (section === 'notifications') {
      adminService.updateSettings('notifications', { slackWebhookUrl: slackWebhook })
    } else if (section === 'storage') {
      adminService.updateSettings('storage', { evidenceBucket })
    } else if (section === 'retention') {
      adminService.updateSettings('retention', { auditRetentionDays: auditRetention })
    } else if (section === 'integrations') {
      adminService.updateSettings('integrations', { splunkExportEnabled: splunkEnabled })
    } else if (section === 'defaults') {
      adminService.updateSettings('defaults', { defaultDeviceLimit: defaultDevices })
    }

    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  function handleTriggerDangerousAction() {
    setDangerConfirmOpen(true)
  }

  function handleConfirmDangerousAction(reason: string) {
    alert(`Dangerous setting confirmed: ${reason}`)
    setDangerConfirmOpen(false)
  }

  return (
    <div className="space-y-5 font-mono text-xs max-w-2xl">
      {savedSuccess && (
        <div className="p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Platform settings successfully saved and applied to all clusters.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-5 rounded-2xl border border-line bg-surface space-y-5 shadow-xl">
        {/* Section: General */}
        {section === 'general' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">General Platform Settings</h3>
              <p className="text-ink-soft text-xs mt-0.5">Control plane branding, alert contacts, and multi-tenant scoping.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Control Plane Portal Name</label>
              <input
                value={portalName}
                onChange={(e) => setPortalName(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Central Support Email</label>
              <input
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>
          </div>
        )}

        {/* Section: Security */}
        {section === 'security' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Security & Access Policy</h3>
              <p className="text-ink-soft text-xs mt-0.5">MFA enforcement for Guardian operators, idle timeouts, and IP restrictions.</p>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
              <div>
                <span className="font-semibold text-ink block">Enforce Hardware WebAuthn MFA for All Admins</span>
                <span className="text-[11px] text-ink-soft">Disallows password-only and SMS authenticators</span>
              </div>
              <input
                type="checkbox"
                checked={mfaEnforced}
                onChange={(e) => setMfaEnforced(e.target.checked)}
                className="rounded text-signal bg-surface-2 border-line"
              />
            </label>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Inactivity Session Timeout (Minutes)</label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>

            <div className="pt-2 border-t border-line/80">
              <button
                type="button"
                onClick={handleTriggerDangerousAction}
                className="px-3 py-1.5 rounded-lg border border-rose-900 bg-rose-950/30 text-rose-400 hover:bg-rose-950/60"
              >
                Flush All Active Platform Sessions (Dangerous)
              </button>
            </div>
          </div>
        )}

        {/* Section: Authentication */}
        {section === 'authentication' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">SAML 2.0 / OIDC Authentication</h3>
              <p className="text-ink-soft text-xs mt-0.5">Single Sign-On federation and SCIM directory synchronization.</p>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
              <div>
                <span className="font-semibold text-ink block">Enable SAML 2.0 SSO Federation</span>
                <span className="text-[11px] text-ink-soft">Allows internal staff to sign in via Okta / Azure AD</span>
              </div>
              <input
                type="checkbox"
                checked={ssoEnabled}
                onChange={(e) => setSsoEnabled(e.target.checked)}
                className="rounded text-signal bg-surface-2 border-line"
              />
            </label>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">IdP SSO Target URL</label>
              <input
                value={samlSsoUrl}
                onChange={(e) => setSamlSsoUrl(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>
          </div>
        )}

        {/* Section: Notifications */}
        {section === 'notifications' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Alert Dispatch & Notification Relays</h3>
              <p className="text-ink-soft text-xs mt-0.5">Webhook targets, PagerDuty escalation keys, and Slack channel hooks.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Slack Incident Webhook URL</label>
              <input
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>
          </div>
        )}

        {/* Section: Storage */}
        {section === 'storage' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Forensic Evidence & Storage Vault</h3>
              <p className="text-ink-soft text-xs mt-0.5">S3 WORM compliance buckets and BYOK encryption configuration.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">S3 Evidence Bucket Name</label>
              <input
                value={evidenceBucket}
                onChange={(e) => setEvidenceBucket(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>
          </div>
        )}

        {/* Section: Retention */}
        {section === 'retention' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Statutory Data Retention Windows</h3>
              <p className="text-ink-soft text-xs mt-0.5">Immutable audit log expiration and automated purge lifecycles.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Audit Log Retention (Days)</label>
              <input
                type="number"
                value={auditRetention}
                onChange={(e) => setAuditRetention(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
              <span className="text-ink-soft text-[10px]">Current: 2555 days (7 years SOC2/ISO standard)</span>
            </div>
          </div>
        )}

        {/* Section: Integrations */}
        {section === 'integrations' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">SIEM & Threat Intel Integrations</h3>
              <p className="text-ink-soft text-xs mt-0.5">Stream normalized telemetry to external SOC tools.</p>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 cursor-pointer">
              <div>
                <span className="font-semibold text-ink block">Splunk HEC Real-time Event Streaming</span>
                <span className="text-[11px] text-ink-soft">Direct streaming via TLS port 8088</span>
              </div>
              <input
                type="checkbox"
                checked={splunkEnabled}
                onChange={(e) => setSplunkEnabled(e.target.checked)}
                className="rounded text-signal bg-surface-2 border-line"
              />
            </label>
          </div>
        )}

        {/* Section: Defaults */}
        {section === 'defaults' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">New Organization Defaults</h3>
              <p className="text-ink-soft text-xs mt-0.5">Default quotas applied to newly onboarded customer tenants.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold block">Default Initial Device Quota</label>
              <input
                type="number"
                value={defaultDevices}
                onChange={(e) => setDefaultDevices(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-surface-2 p-2.5 text-ink"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-signal hover:bg-signal/90 px-3.5 py-2 text-white shadow-sm transition-colors"
          >
            <Save className="h-3.5 w-3.5" /> Save Configuration
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={dangerConfirmOpen}
        title="Flush All Active Operator Sessions"
        description="This will immediately invalidate all active administrative access tokens."
        consequences={[
          'All Guardian internal staff will be logged out',
          'Active CLI and browser sessions terminated',
          'Requires hardware MFA re-authentication',
        ]}
        confirmLabel="Flush Sessions"
        variant="danger"
        onConfirm={handleConfirmDangerousAction}
        onCancel={() => setDangerConfirmOpen(false)}
      />
    </div>
  )
}
