import { cn } from '../../lib/cn'

/** Capitalise a class-friendly variant name, e.g. "partially paid". */
function slug(value) {
  return String(value).toLowerCase().replace(/\s+/g, '-')
}

/**
 * Status / category pill.
 * Colour is chosen from the label itself so any status string works.
 */
export function Badge({ children, variant, size = 'md', className, dot = false }) {
  const key = slug(variant ?? children)

  const tone = {
    /* contribution + member statuses */
    active: 'bg-jade-50 text-jade-700 ring-jade-200',
    completed: 'bg-jade-50 text-jade-700 ring-jade-200',
    'partially-paid': 'bg-amber-50 text-amber-700 ring-amber-500/30',
    pending: 'bg-ink-100 text-ink-600 ring-ink-200',
    inactive: 'bg-ember-50 text-ember-600 ring-ember-200',

    /* member categories */
    leader: 'bg-navy-100 text-navy-800 ring-navy-200',
    worker: 'bg-lake-100 text-lake-600 ring-lake-300/50',
    youth: 'bg-amber-50 text-amber-700 ring-amber-500/30',
    'new-convert': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    visitor: 'bg-ink-100 text-ink-600 ring-ink-200',
    member: 'bg-ink-100 text-ink-600 ring-ink-200',

    /* contribution types */
    offering: 'bg-navy-50 text-navy-700 ring-navy-200',
    tithe: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    pledge: 'bg-lake-100 text-lake-600 ring-lake-300/50',
    donation: 'bg-ember-50 text-ember-600 ring-ember-200',
    fundraising: 'bg-violet-50 text-violet-700 ring-violet-200',
    'building-fund': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    missions: 'bg-sky-50 text-sky-700 ring-sky-200',
    welfare: 'bg-lime-50 text-lime-700 ring-lime-200',
  }[key] ?? 'bg-ink-100 text-ink-600 ring-ink-200'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tone,
        className,
      )}
    >
      {dot ? (
        <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  )
}
