import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-5 pb-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('font-semibold text-[var(--color-text)] leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 pt-0', className)} {...props}>
      {children}
    </div>
  )
}
