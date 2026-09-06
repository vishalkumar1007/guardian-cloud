import React from 'react'
import { cn } from '../../lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
  pulse?: boolean
}

export function StatusBadge({ status, className, pulse = false }: StatusBadgeProps) {
  const norm = status?.toUpperCase() ?? ''

  let style = 'bg-surface-2/80 text-ink border-line/60'
  let dotColor = 'bg-ink-soft'

  if (['ACTIVE', 'ONLINE', 'HEALTHY', 'SUCCESS', 'RESOLVED', 'ALLOWED'].includes(norm)) {
    style = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
    dotColor = 'bg-emerald-500'
  } else if (['TRIAL', 'TRIALING', 'ROLLING_OUT', 'ACKNOWLEDGED', 'FLAGGED'].includes(norm)) {
    style = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/50'
    dotColor = 'bg-sky-500'
  } else if (['WARNING', 'MEDIUM', 'AT_RISK', 'INVESTIGATING', 'PAST_DUE', 'MODERATE'].includes(norm)) {
    style = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
    dotColor = 'bg-amber-500'
  } else if (['CRITICAL', 'HIGH', 'SUSPENDED', 'REVOKED', 'FAILURE', 'BLOCKED', 'QUARANTINED', 'OUTAGE'].includes(norm)) {
    style = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
    dotColor = 'bg-rose-500'
  } else if (['ARCHIVED', 'OFFLINE', 'CANCELED', 'DEPRECATED', 'EXPIRED'].includes(norm)) {
    style = 'bg-surface-2 text-ink-soft border-line'
    dotColor = 'bg-ink-soft'
  } else if (norm === 'LOW') {
    style = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400/90 border-emerald-200 dark:border-emerald-900/40'
    dotColor = 'bg-emerald-500'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border uppercase tracking-wider',
        style,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor, pulse && 'animate-pulse')} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}
