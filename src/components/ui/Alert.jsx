import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Inline status banner. `tone` drives colour + icon. */
export function Alert({ tone = 'info', title, children, onDismiss, className }) {
  const tones = {
    info: { wrap: 'bg-sky-50 text-sky-800 ring-sky-200', Icon: Info },
    success: { wrap: 'bg-emerald-50 text-emerald-800 ring-emerald-200', Icon: CheckCircle2 },
    warning: { wrap: 'bg-amber-50 text-amber-800 ring-amber-200', Icon: AlertTriangle },
    danger: { wrap: 'bg-rose-50 text-rose-800 ring-rose-200', Icon: XCircle },
  }

  const { wrap, Icon } = tones[tone] ?? tones.info

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm ring-1 ring-inset', wrap, className)}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 cursor-pointer text-xs font-medium underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}

/** Centred empty state with optional call to action. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {Icon ? (
        <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-church-500" aria-hidden="true">
          <Icon className="size-6" />
        </span>
      ) : null}
      <h3 className="mt-4 text-sm font-semibold text-ink-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
