import { cn } from '../../lib/cn'

/** Button variants shared across the app. `as` lets it render an <a>. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className,
  as: Component = 'button',
  ...props
}) {
  const variants = {
    /* Brand blue — the default action colour. */
    primary:
      'bg-navy-700 text-white shadow-sm hover:bg-navy-800 active:bg-navy-900 disabled:bg-navy-300',
    secondary:
      'bg-white text-ink-700 border border-ink-200 shadow-xs hover:bg-ink-50 active:bg-ink-100',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',

    /* Red is reserved for destructive / critical actions. */
    danger: 'bg-ember-500 text-white shadow-sm hover:bg-ember-600 active:bg-ember-700',
    'danger-ghost': 'text-ember-600 hover:bg-ember-50',

    /* Soft brand tint. */
    outline: 'border border-navy-200 bg-navy-50 text-navy-700 hover:bg-navy-100',

    /* For use on the navy header. */
    header: 'bg-white text-navy-800 shadow-sm hover:bg-navy-50 active:bg-navy-100',
    'header-ghost': 'border border-white/25 text-white hover:bg-white/10',

    success: 'bg-jade-600 text-white shadow-sm hover:bg-jade-700',
  }

  const sizes = {
    sm: 'gap-1.5 px-3 py-1.5 text-xs',
    md: 'gap-2 px-4 py-2.5 text-sm',
    lg: 'gap-2 px-5 py-3 text-base',
    icon: 'size-9 justify-center',
  }

  return (
    <Component
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-xl font-medium transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {children}
      {IconRight ? <IconRight className="size-4 shrink-0" aria-hidden="true" /> : null}
    </Component>
  )
}
