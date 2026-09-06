import React from 'react'
import { Shield, Activity, Smartphone, Bell, Check, X } from 'lucide-react'
import { GuardianMark } from '../GuardianMark'
import { type ThemeTokens } from '../../theme/tokens'

export function SuperadminPreview({ draft }: { draft: ThemeTokens }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <h3 className="font-display text-sm font-bold text-ink">Live Superadmin Canvas — real shell, data, forms</h3>
        <p className="text-ink-soft text-xs font-sans">Colors, fonts, radius, atmosphere reflect draft instantly. Superadmin preview = whole-app preview.</p>
      </div>

      <div className="rounded-2xl border border-line overflow-hidden shadow-2xl" style={{ background: draft.mist, color: draft.ink, borderRadius: draft.radiusLg, fontFamily: draft.fontBody }}>
        <div className="h-10 flex items-center justify-between px-4 border-b" style={{ background: draft.mistDeep, borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
          <span className="flex items-center gap-2 font-bold text-xs" style={{ fontFamily: draft.fontDisplay, color: draft.ink }}><span style={{ color: draft.signal }}><GuardianMark className="h-4 w-4" /></span> Guardian <span className="opacity-60">Super Admin</span></span>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono border" style={{ background: draft.signalSoft, color: draft.signal, borderRadius: draft.radiusSm }}>LIVE</span>
        </div>
        <div className="grid grid-cols-[160px_1fr] min-h-[360px]">
          <div className="border-r p-3 space-y-3 hidden sm:block" style={{ background: draft.mistDeep, borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: draft.inkSoft }}>Superadmin</div>
            {['Overview', 'Enterprise', 'User Billing', 'Platform Ops'].map((l, i) => (
              <div key={l} className="text-xs px-2 py-1.5 rounded" style={{ background: i === 0 ? draft.signal : 'transparent', color: i === 0 ? 'white' : draft.inkSoft, borderRadius: draft.radiusSm }}>{l}</div>
            ))}
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><div className="font-bold" style={{ fontFamily: draft.fontDisplay, color: draft.ink }}>Command Center</div><div className="text-xs" style={{ color: draft.inkSoft }}>Fleet & risk posture</div></div>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 text-xs font-semibold text-white" style={{ background: draft.signal, borderRadius: draft.radius }}>Quarantine</span>
                <span className="px-3 py-1.5 text-xs border" style={{ background: draft.mistDeep, color: draft.ink, borderRadius: draft.radius, borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>Export</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'Fleet Threat', v: 'ELEVATED (68)', c: draft.signal, i: Shield },
                { k: 'Alerts 24h', v: '14 Critical', c: draft.alert, i: Activity },
                { k: 'Devices', v: '8,421 Online', c: draft.signal, i: Smartphone },
              ].map((x) => (
                <div key={x.k} className="p-3 border" style={{ background: draft.mistDeep, borderRadius: draft.radius, borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                  <div className="text-[11px]" style={{ color: draft.inkSoft }}>{x.k}</div>
                  <div className="font-bold flex items-center gap-1.5 text-sm" style={{ color: x.c }}><x.i className="h-4 w-4" />{x.v}</div>
                </div>
              ))}
            </div>

            <div className="border rounded overflow-hidden" style={{ borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: draft.radius }}>
              <div className="px-3 py-2 text-xs font-semibold flex items-center justify-between" style={{ background: draft.mistDeep, color: draft.ink }}>Recent events <Bell className="h-3.5 w-3.5" style={{ color: draft.inkSoft }} /></div>
              <div className="divide-y text-xs" style={{ borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                {['Blocked beacon — QUARANTINED', 'Sinkholed DNS — FLAGGED', 'MFA reset — SUCCESS'].map((t) => (
                  <div key={t} className="px-3 py-2 flex items-center justify-between" style={{ background: draft.mist }}><span style={{ color: draft.ink }}>{t}</span><Check className="h-3 w-3" style={{ color: draft.signal }} /></div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input placeholder="Search tenants…" className="flex-1 px-3 py-2 text-xs border" style={{ background: draft.mistDeep, color: draft.ink, borderRadius: draft.radius, borderColor: draft.colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
              <button className="px-3 py-2 text-xs font-semibold text-white" style={{ background: draft.alert, borderRadius: draft.radius }}>Block</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
