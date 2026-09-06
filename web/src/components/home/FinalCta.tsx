import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Lock,
  Zap,
} from 'lucide-react'
import { Button } from '../ui/button'

export function FinalCta() {
  const [copied, setCopied] = useState<boolean>(false)
  const installCmd = 'curl -fsSL https://get.guardian.security | sh'

  function copyCommand() {
    navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-12 lg:p-16 text-center shadow-lg">
        {/* Glow ambient background elements */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-signal/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-signal/15 blur-3xl" />

        <div className="relative mx-auto max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal-soft px-3.5 py-1 font-mono text-[11px] font-semibold text-signal shadow-sm">
            <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
            <span>CONTINUOUS SECURITY WATCHLINE // ACTIVE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink leading-tight">
            Put your hardware on the watchline today.
          </h2>

          <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-xl mx-auto">
            Zero-knowledge device pairing in under 90 seconds. Protect your personal laptop with silent camera tripwires or orchestrate an entire company fleet.
          </p>

          {/* Quick CLI Install Box */}
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-[#070b13] p-2 sm:p-2.5 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 pl-2 overflow-x-auto no-scrollbar">
              <Terminal className="h-4 w-4 text-signal shrink-0" />
              <code className="text-emerald-400 font-semibold">{installCmd}</code>
            </div>
            <button
              type="button"
              onClick={copyCommand}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 text-xs font-mono transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-300">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="signal" size="lg" className="rounded-full px-7">
              <Link to="/signup" className="flex items-center gap-2">
                <span>Create Personal Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7">
              <Link to="/login">Sign in to Console</Link>
            </Button>
          </div>

          {/* Micro Trust Proofs */}
          <div className="pt-6 border-t border-line flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-ink-soft">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-signal" /> Apple Secure Enclave & TPM 2.0
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-signal" /> Zero-Knowledge Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-signal" /> Air-Gapped Lockdown Defense
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
