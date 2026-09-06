import React from 'react'
import { cn } from '../../lib/utils'
import type { RiskLevel } from '../../types/admin'

interface RiskBadgeProps {
  level: RiskLevel
  score?: number
  className?: string
}

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  let color = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
  if (level === 'MEDIUM') color = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
  if (level === 'HIGH') color = 'text-signal bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40'
  if (level === 'CRITICAL') color = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/50'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border uppercase tracking-wider',
        color,
        className,
      )}
    >
      {score !== undefined && <span className="opacity-75">{score} / 100 •</span>}
      <span>{level}</span>
    </span>
  )
}
