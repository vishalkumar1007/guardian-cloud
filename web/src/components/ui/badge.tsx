import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-line bg-surface text-ink',
        signal: 'border-signal/35 bg-signal-soft/40 text-signal',
        alert: 'border-alert/35 bg-alert/15 text-alert',
        soft: 'border-line bg-mist-deep/50 text-ink-soft',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
