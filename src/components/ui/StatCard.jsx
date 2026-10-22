import { cn } from '../../lib/cn'
import { formatCurrency, formatNumber } from '../../utils/format'

/**
 * Summary tile used across the dashboard and detail views.
 *
 * Spacing note: a single consistent padding scale (p-4 sm:p-5) and a
 * fixed-height value row keep every tile the same height, so a row of
 * cards lines up regardless of how long the hint text is.
 */
export function StatCard({
  label,
  value,
  money = false,
  hint,
  icon: Icon,
  tone = 'navy',
  trend,
  className,
}) {
  const tones = {
    navy: 'bg-navy-50 text-navy-600',
    jade: 'bg-jade-50 text-jade-600',
    ember: 'bg-ember-50 text-ember-500',
    amber: 'bg-amber-50 text-amber-600',
    lake: 'bg-lake-100 text-lake-600',
  }

  const display = money
    ? formatCurrency(value)
    : typeof value === 'number'
      ? formatNumber(value)
      : value

  return (
    <div
      className={cn(
        'animate-rise flex flex-col rounded-card border border-ink-200/70 bg-white p-4 shadow-card sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{label}</p>
        {Icon ? (
          <span
            className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tones[tone])}
            aria-hidden="true"
          >
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </div>

      <p className="tabular mt-3 text-2xl font-semibold text-ink-900 sm:text-[1.75rem]">
        {display}
      </p>

      {/* mt-auto keeps the footer text bottom-aligned across a row. */}
      <div className="mt-auto pt-2">
        {hint ? <p className="text-xs text-ink-500">{hint}</p> : null}

        {trend ? (
          <p
            className={cn(
              'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
              trend.direction === 'down' ? 'text-ember-600' : 'text-jade-600',
            )}
          >
            {trend.direction === 'down' ? '▼' : '▲'} {trend.value}
            <span className="font-normal text-ink-400">{trend.label}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
