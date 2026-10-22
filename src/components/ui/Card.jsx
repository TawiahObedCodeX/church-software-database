import { cn } from '../../lib/cn'

/**
 * Surface container used for every panel in the app.
 *
 * Padding is deliberately NOT applied here — panels that need slack use
 * <CardBody>, and list panels apply their own px/pb so the last row's
 * spacing can be controlled independently of the header.
 */
export function Card({ children, className, as: Component = 'section' }) {
  return (
    <Component
      className={cn(
        'animate-rise overflow-hidden rounded-card border border-ink-200/70 bg-white shadow-card',
        className,
      )}
    >
      {children}
    </Component>
  )
}

/** Card title row with optional right-hand action. */
export function CardHeader({ title, subtitle, action, className, bordered = false }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5',
        bordered && 'border-b border-ink-100',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink-900 sm:text-base">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-500 sm:text-sm">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** Padded card body. Use when content needs breathing room. */
export function CardBody({ children, className }) {
  return <div className={cn('px-4 pb-5 sm:px-5', className)}>{children}</div>
}
