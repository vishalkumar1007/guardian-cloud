import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  to?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
  variant?: 'default' | 'danger' | 'warning' | 'success'
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  subtitle,
  to,
  icon: Icon,
  badge,
  variant = 'default',
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200',
        'bg-surface hover:bg-surface-2 border-line/80 hover:border-line shadow-sm hover:shadow-md',
        variant === 'danger' && 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800/60',
        variant === 'warning' && 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800/60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-soft truncate">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-ink-soft group-hover:text-signal transition-colors" />}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl font-bold tracking-tight text-ink">{value}</span>
        {badge}
      </div>

      {(change || subtitle) && (
        <div className="mt-2 flex items-center justify-between text-xs text-ink-soft font-mono">
          {change && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                trend === 'down' && 'text-rose-600 dark:text-rose-400',
                trend === 'neutral' && 'text-ink-soft',
              )}
            >
              {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
              {change}
            </span>
          )}
          {subtitle && <span className="text-ink-soft truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    )
  }

  return content
}
