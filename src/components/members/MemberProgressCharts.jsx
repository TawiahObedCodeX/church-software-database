import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency, formatMonthLabel } from '../../utils/format'

/** Shared tooltip shell so both charts speak the same language. */
function TooltipShell({ title, children }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-pop">
      <p className="text-xs font-semibold text-ink-700">{title}</p>
      {children}
    </div>
  )
}

function GivingTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <TooltipShell title={formatMonthLabel(point.key)}>
      <p className="tabular mt-1 text-xs text-ink-600">
        Given this month{' '}
        <span className="font-medium text-ink-900">{formatCurrency(point.total)}</span>
      </p>
      <p className="tabular mt-0.5 text-xs text-ink-500">
        {point.count} payment{point.count === 1 ? '' : 's'}
      </p>
      {point.total > 0 ? (
        <p className="tabular mt-1 border-t border-ink-100 pt-1.5 text-[11px] text-ink-500">
          Pledges {formatCurrency(point.pledge)} &middot; other {formatCurrency(point.oneOff)}
        </p>
      ) : null}
    </TooltipShell>
  )
}

function GoalTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <TooltipShell title={formatMonthLabel(point.key)}>
      <p className="tabular mt-1 text-xs text-ink-600">
        Paid towards pledges{' '}
        <span className="font-medium text-ink-900">{formatCurrency(point.paid)}</span>
      </p>
      <p className="tabular mt-0.5 text-xs text-ink-600">
        Total pledged{' '}
        <span className="font-medium text-ink-900">{formatCurrency(point.pledged)}</span>
      </p>
      <p className="tabular mt-1 border-t border-ink-100 pt-1.5 text-[11px] text-ink-500">
        {formatCurrency(point.remaining)} still to pay &middot; {point.percent}%
      </p>
    </TooltipShell>
  )
}

/**
 * "What has this member done so far?" - month-by-month giving.
 *
 * Bars are the amount given each month; the line is the running total, so
 * the member sees both their pace and the cumulative result.
 */
export function MemberGivingChart({ monthly }) {
  if (!monthly?.length) return null

  const total = monthly.reduce((sum, month) => sum + month.total, 0)

  /* Turn the monthly buckets into a cumulative series for the trend line.
     `reduce` accumulates in its own scope so nothing is mutated after render. */
  const data = monthly.reduce((acc, month) => {
    const cumulative = (acc[acc.length - 1]?.cumulative ?? 0) + month.total
    acc.push({
      ...month,
      label: formatMonthLabel(month.key).split(' ')[0].slice(0, 3),
      cumulative,
    })
    return acc
  }, [])

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-ink-500">
          Monthly giving, with the running total overlaid
        </p>
        <span className="tabular rounded-lg bg-jade-50 px-2.5 py-1 text-xs font-semibold text-jade-700">
          {formatCurrency(total)} given in total
        </span>
      </div>

      <div className="h-52 w-full sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="memberGivingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1b4d88" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#1b4d88" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#dde1e6" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626c7a', fontSize: 12 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626c7a', fontSize: 12 }}
              tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
              width={52}
            />
            <Tooltip content={<GivingTooltip />} cursor={{ fill: 'rgba(37, 99, 168, 0.06)' }} />

            <Bar dataKey="total" name="Given" radius={[5, 5, 0, 0]} maxBarSize={38}>
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  /* Quiet months fade back so the active ones stand out. */
                  fill={entry.total > 0 ? '#2563a8' : '#dde1e6'}
                />
              ))}
            </Bar>

            <Line
              type="monotone"
              dataKey="cumulative"
              name="Running total"
              stroke="#e50406"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#e50406', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#e50406' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * The member's overall pledge position: everything they promised versus
 * everything they have cleared, month by month.
 *
 * The dashed red line is the total pledged - where the blue area reaches
 * it, every pledge this member made has been settled.
 */
export function MemberGoalChart({ timeline, position }) {
  if (!timeline?.length || !position) return null

  /* One point per month, carrying the running pledge total forward. */
  const byMonth = new Map()
  for (const point of timeline) {
    if (!point.isGoal || !point.monthKey) continue
    byMonth.set(point.monthKey, point.pledgeCumulative)
  }

  /* Walk months from the member's first gift so the line is continuous. */
  const keys = [...byMonth.keys()].sort()
  if (!keys.length) return null

  const [startYear, startMonth] = keys[0].split('-').map(Number)
  const [endYear, endMonth] = keys[keys.length - 1].split('-').map(Number)

  const data = []
  let carried = 0
  const cursor = new Date(startYear, startMonth - 1, 1)
  const end = new Date(endYear, endMonth - 1, 1)

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    if (byMonth.has(key)) carried = byMonth.get(key)

    data.push({
      key,
      label: formatMonthLabel(key).split(' ')[0].slice(0, 3),
      paid: carried,
      pledged: position.pledged,
      remaining: Math.max(position.pledged - carried, 0),
      percent:
        position.pledged > 0 ? Math.min(Math.round((carried / position.pledged) * 100), 100) : 100,
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  const settled = position.outstanding === 0

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Position summary */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3.5 py-3">
          <p className="text-[11px] font-medium tracking-wide text-ink-500 uppercase">Pledged</p>
          <p className="tabular mt-1 text-lg font-semibold text-ink-900">
            {formatCurrency(position.pledged)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-jade-50/60 px-3.5 py-3">
          <p className="text-[11px] font-medium tracking-wide text-jade-700 uppercase">Cleared</p>
          <p className="tabular mt-1 text-lg font-semibold text-jade-700">
            {formatCurrency(position.paid)}
          </p>
        </div>
        <div
          className={
            settled
              ? 'rounded-xl border border-ink-100 bg-jade-50/60 px-3.5 py-3'
              : 'rounded-xl border border-ink-100 bg-ember-50/60 px-3.5 py-3'
          }
        >
          <p
            className={
              settled
                ? 'text-[11px] font-medium tracking-wide text-jade-700 uppercase'
                : 'text-[11px] font-medium tracking-wide text-ember-600 uppercase'
            }
          >
            {settled ? 'Fully paid' : 'Still to pay'}
          </p>
          <p
            className={
              settled
                ? 'tabular mt-1 text-lg font-semibold text-jade-700'
                : 'tabular mt-1 text-lg font-semibold text-ember-600'
            }
          >
            {formatCurrency(position.outstanding)}
          </p>
        </div>
      </div>

      <div className="h-52 w-full sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="memberGoalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#dde1e6" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626c7a', fontSize: 12 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626c7a', fontSize: 12 }}
              tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
              width={52}
            />
            <Tooltip content={<GoalTooltip />} cursor={{ stroke: '#7fabdd', strokeWidth: 1 }} />

            {position.pledged > 0 ? (
              <ReferenceLine
                y={position.pledged}
                stroke="#e50406"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Pledged ${formatCurrency(position.pledged, { compact: true })}`,
                  position: 'insideTopRight',
                  fill: '#c50305',
                  fontSize: 11,
                }}
              />
            ) : null}

            <Area
              type="monotone"
              dataKey="paid"
              name="Paid towards pledges"
              stroke="#047857"
              strokeWidth={2.5}
              fill="url(#memberGoalFill)"
              dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#047857' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#047857' }}
            />

            <Line
              type="monotone"
              dataKey="pledged"
              name="Total pledged"
              stroke="#e50406"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-xs text-ink-400">
        {settled
          ? 'Every pledge this member made has been fully settled.'
          : `${position.openGoals} pledge${position.openGoals === 1 ? '' : 's'} still open · ${position.settledGoals} settled`}
      </p>
    </div>
  )
}
