import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Button = forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
        {
          'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)] shadow-lg hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] active:scale-[0.98]': variant === 'default',
          'glass border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-2)]': variant === 'ghost',
          'border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-2)]': variant === 'outline',
          'text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border border-transparent hover:border-[var(--color-error)]/30': variant === 'destructive',
        },
        {
          'h-9 px-4 py-2 text-sm': size === 'default',
          'h-8 px-3 text-xs': size === 'sm',
          'h-11 px-6 text-base': size === 'lg',
          'h-9 w-9 p-0': size === 'icon',
        },
        className
      )}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button }
