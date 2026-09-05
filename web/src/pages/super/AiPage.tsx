import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ShieldAlert, Cpu, Sparkles, Send, CheckCircle2, Filter } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

const AI_RISK_TREND = [
  { time: '00:00', risk: 14, anomalies: 1 },
  { time: '04:00', risk: 18, anomalies: 2 },
  { time: '08:00', risk: 42, anomalies: 5 },
  { time: '12:00', risk: 68, anomalies: 8 },
  { time: '16:00', risk: 35, anomalies: 3 },
  { time: '20:00', risk: 22, anomalies: 2 },
  { time: '23:59', risk: 16, anomalies: 1 },
]

const ANOMALY_EVENTS = [
  {
    id: 'anom-901',
    timestamp: '2 mins ago',
    type: 'ENCLAVE_KEY_EXPORT_ATTEMPT',
    device: 'MacBook Pro 16" (#ENG-04)',
    tenant: 'Apex Cyber Corp (Org)',
    riskScore: 92,
    severity: 'CRITICAL',
    summary: 'Direct hardware enclave read intercepted without user presence biometric signal.',
    recommendedAction: 'SEAL_FILEVAULT_IMMEDIATE',
  },
  {
    id: 'anom-902',
    timestamp: '14 mins ago',
    type: 'RAPID_GEO_VELOCITY',
    device: 'ThinkPad X1 (#EXEC-02)',
    tenant: 'Northwind Global',
    riskScore: 78,
    severity: 'HIGH',
    summary: 'Beacon hopped from London to Singapore in 18 minutes (impossible ground velocity).',
    recommendedAction: 'REQUIRE_MFA_CHALLENGE',
  },
  {
    id: 'anom-903',
    timestamp: '45 mins ago',
    type: 'REPEATED_PIN_TAMPER',
    device: 'MacBook Air M2 (#DESK-19)',
    tenant: 'Studio Personal',
    riskScore: 64,
    severity: 'MEDIUM',
    summary: '5 sequential incorrect local PINs entered within 40 seconds; silent camera snapshot queued.',
    recommendedAction: 'DISPATCH_MOBILE_PUSH',
  },
]

export function AiPage() {
  const [triageStatus, setTriageStatus] = useState<Record<string, string>>({})
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL')

  function handleTriage(id: string) {
    setTriageStatus((prev) => ({ ...prev, [id]: 'TRIAGING' }))
    setTimeout(() => {
      setTriageStatus((prev) => ({ ...prev, [id]: 'COMPLETED' }))
    }, 1200)
  }

  const filtered = ANOMALY_EVENTS.filter((e) => {
    if (activeFilter === 'ALL') return true
    return e.severity === activeFilter
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              AI Security Triage & Anomaly Radar
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-mono font-bold text-signal border border-signal/30">
              <Sparkles className="h-3 w-3" />
              Active Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Continuous anomaly detection on security_events stream with zero-trust mitigation recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="soft" className="font-mono text-xs">
            Model: Guardian-Sec-v1 (Deterministic)
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Fleet Anomaly Rate</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">0.08%</p>
          <p className="mt-1 font-mono text-[10px] text-emerald-500 font-semibold">↓ 0.02% from yesterday</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-alert">Critical Tripwires</p>
          <p className="mt-1 font-display text-2xl font-bold text-alert">1 Active</p>
          <p className="mt-1 font-mono text-[10px] text-alert font-semibold">Enclave containment ready</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Average Triage Latency</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">48 ms</p>
          <p className="mt-1 font-mono text-[10px] text-signal font-semibold">Zero-lag stream pipeline</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Automated Policy Matches</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">100%</p>
          <p className="mt-1 font-mono text-[10px] text-ink-soft">142 rules evaluated</p>
        </div>
      </div>

      {/* Risk Score AreaChart */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-signal" />
            <h3 className="font-display text-sm font-bold text-ink">Fleet Risk Score Trend (24h)</h3>
          </div>
          <span className="font-mono text-[11px] text-ink-soft">Aggregate Security Index</span>
        </div>
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={AI_RISK_TREND}>
              <CartesianGrid stroke="var(--g-line)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--g-ink-soft)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{
                  background: 'var(--g-surface)',
                  borderColor: 'var(--g-line)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--g-ink)',
                }}
              />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="var(--g-signal)"
                fill="color-mix(in srgb, var(--g-signal) 18%, transparent)"
                strokeWidth={2}
                name="Risk Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Anomalies Table */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-alert" />
              Incoming Security Event Anomalies
            </h3>
            <p className="font-mono text-[11px] text-ink-soft">
              Real-time feed processed by deterministic AI rules
            </p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Filter className="h-3 w-3 text-ink-soft" />
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${activeFilter === 'ALL' ? 'bg-ink text-mist' : 'text-ink-soft hover:bg-surface-2'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${activeFilter === 'CRITICAL' ? 'bg-red-500 text-white' : 'text-ink-soft hover:bg-surface-2'}`}
            >
              Critical
            </button>
            <button
              onClick={() => setActiveFilter('HIGH')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${activeFilter === 'HIGH' ? 'bg-amber-500 text-white' : 'text-ink-soft hover:bg-surface-2'}`}
            >
              High
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((item) => {
            const status = triageStatus[item.id]
            return (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border border-line bg-surface-2/60 transition-colors hover:border-signal/30"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-ink">{item.type}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      Score: {item.riskScore} · {item.severity}
                    </span>
                    <span className="font-mono text-[10px] text-ink-soft">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">{item.summary}</p>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-ink-soft">
                    <span>Target: <strong className="text-ink">{item.device}</strong></span>
                    <span>Tenant: <strong className="text-ink">{item.tenant}</strong></span>
                    <span className="text-signal font-semibold">Recommended: {item.recommendedAction}</span>
                  </div>
                </div>

                <div className="shrink-0 pt-2 md:pt-0">
                  {status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-mono font-bold text-emerald-500 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Triaged & Sealed
                    </span>
                  ) : status === 'TRIAGING' ? (
                    <Button disabled variant="outline" size="sm" className="rounded-full font-mono text-xs">
                      <span className="h-3 w-3 rounded-full bg-signal animate-spin mr-1.5" />
                      Synthesizing Triage…
                    </Button>
                  ) : (
                    <Button
                      variant="signal"
                      size="sm"
                      onClick={() => handleTriage(item.id)}
                      className="rounded-full font-mono text-xs gap-1.5 shadow-sm"
                    >
                      <Send className="h-3 w-3" />
                      Send to AI Triage
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
