import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FaqItem {
  question: string
  answer: string
  tag: string
}

const FAQS: FaqItem[] = [
  {
    tag: 'OFFLINE DEFENSE',
    question: 'How does Guardian execute an emergency lockdown if the laptop is offline or without Wi-Fi?',
    answer:
      'Guardian caches pre-signed, cryptographically validated emergency lockdown directives inside the local kernel policy cache during enrollment. If an unauthorized physical trigger occurs (such as 3 consecutive failed PIN attempts or exceeding an offline heartbeat threshold), the local kernel helper immediately deletes FileVault volume encryption keys from RAM and renders all USB, trackpad, and keyboard inputs inoperable—completely air-gapped without needing internet access.',
  },
  {
    tag: 'ZERO-KNOWLEDGE PRIVACY',
    question: 'Where are silent camera tripwire snapshots stored, and can Guardian employees see them?',
    answer:
      'Snapshots are captured directly in memory and encrypted immediately with the recipient owner’s Ed25519 public key before being queued for dispatch. Neither Guardian Cloud operators, platform super-admins, nor database engineers hold the private decryption key. Only your authenticated companion device (such as your paired iPhone) holding the corresponding private key can decrypt and view the intruder evidence.',
  },
  {
    tag: 'ARCHITECTURE',
    question: 'How does Guardian’s zero-trust model differ from traditional enterprise MDM software?',
    answer:
      'Traditional enterprise MDMs grant corporate administrators pervasive surveillance capabilities, including remote desktop viewing, browsing history inspection, and unannounced file audits. Guardian enforces a strict zero-trust hardware boundary: control planes can only query signed hardware telemetry (FileVault state, Secure Enclave integrity, presence heartbeat) and issue containment directives. Personal and organization data remain strictly isolated.',
  },
  {
    tag: 'PERFORMANCE',
    question: 'What performance and battery overhead does the native Rust desktop agent introduce?',
    answer:
      'The Guardian core agent is written in pure, bare-metal Rust with zero heavyweight runtimes (no Electron, no Python, no JVM). It executes with under 0.1% CPU overhead in continuous standby and retains an active resident memory footprint of just 18 MB RSS. It has zero measurable impact on laptop battery life or heavy engineering compilation tasks.',
  },
  {
    tag: 'BYOD POLICIES',
    question: 'Can an enterprise organization wipe my personal laptop when enrolled in BYOD mode?',
    answer:
      'No. Under BYOD isolation, organizational policy enforcement is strictly sandboxed. Organization administrators can only revoke corporate certificates, clear work policy tokens, and disconnect access to enterprise portals. Personal partitions, private encryption keys, personal tripwire logs, and biometric evidence remain completely sovereign.',
  },
  {
    tag: 'CONTROL PLANE',
    question: 'How is the root Super Admin control-plane safeguarded against cluster takeover?',
    answer:
      'Guardian features a singleton first-run bootstrap ceremony: once the root platform administrator is initialized with OWASP-standard Argon2id password hashing, the bootstrap endpoint permanently shuts down and returns HTTP 410 Gone for all future requests. Super-admin access is separated from customer tenant data and protected by immutable audit logging.',
  },
]

export function SecurityFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  function toggle(idx: number) {
    setOpenIdx(openIdx === idx ? null : idx)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-3.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={faq.question}
              className={cn(
                'rounded-2xl border transition-all duration-200 overflow-hidden text-left',
                isOpen
                  ? 'border-signal/30 bg-surface shadow-md shadow-signal/5'
                  : 'border-line bg-surface hover:border-signal/20',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-signal">
                    {faq.tag}
                  </span>
                  <h4 className="font-display text-sm sm:text-base font-semibold text-ink leading-snug">
                    {faq.question}
                  </h4>
                </div>
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-soft transition-transform duration-200',
                    isOpen && 'rotate-180 bg-signal text-mist-deep border-signal',
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-5 pb-6 pt-4 sm:px-6 text-xs sm:text-[13px] leading-relaxed text-ink-soft bg-surface-2/40">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
