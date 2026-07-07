import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-[var(--color-accent)]/20 text-[var(--color-accent-2)] border border-[var(--color-accent)]/30': variant === 'default',
          'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30': variant === 'success',
          'bg-[var(--color-error)]/15 text-[var(--color-error)] border border-[var(--color-error)]/30': variant === 'error',
          'bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)]': variant === 'muted',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
