import { cn } from '../../lib/cn'

/** Base shimmer block. Everything else in this file is composed from it. */
export function Skeleton({ className, style }) {
  return <div className={cn('skeleton h-4 w-full', className)} style={style} aria-hidden="true" />
}

/** Circular skeleton for avatars. */
export function SkeletonCircle({ className }) {
  return <div className={cn('skeleton rounded-full', className)} aria-hidden="true" />
}

/**
 * KPI tile skeleton — mirrors StatCard's exact box model so swapping
 * between them causes no layout shift.
 */
export function SkeletonStatCard() {
  return (
    <div className="rounded-card border border-ink-200/70 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  )
}

/** Standard panel skeleton with a title row and body rows. */
export function SkeletonCard({ rows = 4, className, showHeader = true }) {
  return (
    <div className={cn('rounded-card border border-ink-200/70 bg-white shadow-card', className)}>
      {showHeader ? (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ) : null}

      <div className="space-y-3 px-4 pb-5 sm:px-5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <SkeletonCircle className="size-9 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Chart skeleton with a plausible bar silhouette. */
export function SkeletonChart({ className, bars = 12 }) {
  const heights = [45, 62, 38, 74, 55, 84, 48, 68, 42, 78, 58, 88]

  return (
    <div className={cn('px-4 pb-5 sm:px-5', className)}>
      <div className="flex h-56 items-end gap-2 sm:h-64">
        {Array.from({ length: bars }, (_, index) => (
          <Skeleton
            key={index}
            className="flex-1 rounded-t-md"
            style={{ height: `${heights[index % heights.length]}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

/** Table skeleton that keeps the real column rhythm. */
export function SkeletonTable({ rows = 6, columns = 6 }) {
  const widths = ['w-40', 'w-28', 'w-16', 'w-20', 'w-24', 'w-16', 'w-20']

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="flex gap-4 border-b border-ink-200 pb-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className={cn('h-3', widths[index % widths.length])} />
        ))}
      </div>

      <div className="divide-y divide-ink-100">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 py-3.5">
            {Array.from({ length: columns }, (_, colIndex) => (
              <div
                key={colIndex}
                className={cn(
                  'min-w-0',
                  colIndex === 0 ? 'flex flex-[2] items-center gap-3' : 'flex-1',
                )}
              >
                {colIndex === 0 ? (
                  <>
                    <SkeletonCircle className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </>
                ) : (
                  <Skeleton className={cn('h-3.5', widths[colIndex % widths.length])} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Campaign / pledge card skeleton. */
export function SkeletonCampaign({ className }) {
  return (
    <div className={cn('rounded-xl border border-ink-100 p-3.5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full-page skeleton. Each page picks the variant that matches its
 * real layout so the transition into content is seamless.
 */
export function PageSkeleton({ variant = 'dashboard' }) {
  if (variant === 'table') {
    return (
      <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading records…</span>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonStatCard key={index} />
          ))}
        </div>

        <div className="rounded-card border border-ink-200/70 bg-white shadow-card">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:px-5 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-10 rounded-xl xl:col-span-2" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>

          <SkeletonTable rows={6} columns={6} />
        </div>
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading member profile…</span>

        <Skeleton className="h-8 w-32 rounded-xl" />

        <div className="rounded-card border border-ink-200/70 bg-white shadow-card">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
            <Skeleton className="size-16 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-3.5 w-64" />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-9" />
                ))}
              </div>
            </div>
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonStatCard key={index} />
          ))}
        </div>

        <div className="rounded-card border border-ink-200/70 bg-white shadow-card">
          <div className="px-4 pt-4 pb-3 sm:px-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <div className="space-y-3 px-4 pb-5 sm:px-5">
            <SkeletonCampaign />
            <SkeletonCampaign />
          </div>
        </div>
      </div>
    )
  }

  /* dashboard */
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard…</span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-card border border-ink-200/70 bg-white shadow-card xl:col-span-2">
          <div className="flex items-start justify-between px-4 pt-4 pb-3 sm:px-5">
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-56" />
            </div>
            <Skeleton className="h-7 w-32 rounded-lg" />
          </div>
          <SkeletonChart />
        </div>

        <div className="rounded-card border border-ink-200/70 bg-white shadow-card">
          <div className="px-4 pt-4 pb-3 sm:px-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-44" />
          </div>
          <div className="flex flex-col items-center gap-4 px-4 pb-5 sm:px-5">
            <SkeletonCircle className="size-40" />
            <div className="w-full space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-3.5" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-ink-200/70 bg-white shadow-card">
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
        <div className="space-y-3 px-4 pb-5 sm:px-5">
          <SkeletonCampaign />
          <SkeletonCampaign />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SkeletonCard rows={5} />
        <SkeletonCard rows={5} />
      </div>
    </div>
  )
}
