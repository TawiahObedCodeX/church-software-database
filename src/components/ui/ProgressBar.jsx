import { cn } from '../../lib/cn'
import { formatPercent } from '../../utils/format'

/**
 * Horizontal progress meter for a goal-based contribution.
 * Default tone shifts navy -> jade as the target is met; callers can
 * force a tone (the follow-up list uses `ember` to read as a warning).
 */
export function ProgressBar({ value, showLabel = false, size = 'md', tone, className }) {
  const percent = Math.max(0, Math.min(Number(value) || 0, 100))
  const resolved = tone ?? (percent >= 100 ? 'jade' : 'navy')

  const fills = {
    navy: 'bg-navy-600',
    jade: 'bg-jade-600',
    ember: 'bg-ember-500',
    amber: 'bg-amber-500',
  }

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn('w-full overflow-hidden rounded-full bg-ink-100', heights[size])}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            fills[resolved],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {showLabel ? (
        <span className="tabular w-10 shrink-0 text-right text-xs font-medium text-ink-600">
          {formatPercent(percent, 0)}
        </span>
      ) : null}
    </div>
  )
}
