import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  consequences?: string[]
  confirmLabel?: string
  cancelLabel?: string
  requireReason?: boolean
  reasonPlaceholder?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  consequences = [],
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  requireReason = true,
  reasonPlaceholder = 'Mandatory reason for platform audit compliance…',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (requireReason && reason.trim().length < 6) {
      setError('Please provide a justification (min 6 characters) for platform audit logging.')
      return
    }
    onConfirm(reason)
    setReason('')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                variant === 'danger' && 'border-rose-900/60 bg-rose-950/40 text-rose-400',
                variant === 'warning' && 'border-amber-900/60 bg-amber-950/40 text-amber-400',
                variant === 'default' && 'border-line bg-surface-2 text-ink',
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
              {description && <p className="text-xs text-ink-soft mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink-soft hover:text-ink transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {consequences.length > 0 && (
          <div className="rounded-xl border border-line/80 bg-surface-2/60 p-3 space-y-1.5 text-xs text-ink">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft font-semibold block">
              This action will:
            </span>
            <ul className="list-disc list-inside space-y-1 text-ink-soft">
              {consequences.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {requireReason && (
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
                Reason / Justification <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError('')
                }}
                placeholder={reasonPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-line bg-surface-2 p-3 text-xs text-ink placeholder:text-zinc-600 focus:border-signal/80 focus:outline-none"
              />
              {error && <p className="text-[11px] text-rose-400 font-mono">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/80">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-xs font-medium text-ink hover:bg-surface-2 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold text-ink transition-colors shadow-sm',
                variant === 'danger' && 'bg-rose-600 hover:bg-rose-500',
                variant === 'warning' && 'bg-signal hover:bg-signal/90 text-black',
                variant === 'default' && 'bg-signal hover:bg-signal/90',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
