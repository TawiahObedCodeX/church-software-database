import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency, formatDate, formatMonthLabel } from '../../utils/format'

/** Tooltip in the app's own language, showing the running total at a point. */
function PaceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-pop">
      <p className="text-xs font-semibold text-ink-700">
        {point.timestamp ? formatDate(point.date) : point.label}
      </p>

      <p className="tabular mt-1.5 flex items-center gap-2 text-xs text-ink-600">
        <span className="size-2 rounded-full bg-navy-600" aria-hidden="true" />
        Paid that day
        <span className="font-medium text-ink-900">{formatCurrency(point.amount)}</span>
      </p>

      <p className="tabular mt-1 flex items-center gap-2 text-xs text-ink-600">
        <span className="size-2 rounded-full bg-ember-500" aria-hidden="true" />
        Running total
        <span className="font-medium text-ink-900">{formatCurrency(point.cumulative)}</span>
      </p>

      {point.remaining > 0 ? (
        <p className="tabular mt-1 text-xs text-ink-500">
          {formatCurrency(point.remaining)} still to go
        </p>
      ) : null}
    </div>
  )
}

/**
 * Progress graph for ONE goal-based contribution.
 *
 * The area is the running total of everything paid so far; the dashed
 * red line is the target. Where the area meets the line, the pledge is
 * settled - so the admin reads the whole story at a glance.
 */
export function PledgeProgressChart({ timeline, target }) {
  if (!timeline?.length) return null

  const last = timeline[timeline.length - 1]
  const settled = target > 0 && last.cumulative >= target

  /* Extend the series one point past the last payment so the curve ends
     at a visible value rather than being clipped at the chart edge. */
  const data = timeline.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }))

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
            Payment progress
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">
            Running total across {timeline.length} payment
            {timeline.length === 1 ? '' : 's'}
          </p>
        </div>

        <span
          className={
            settled
              ? 'tabular rounded-lg bg-jade-50 px-2.5 py-1 text-xs font-semibold text-jade-700'
              : 'tabular rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700'
          }
        >
          {last.progress}% paid
        </span>
      </div>

      <div className="mt-3 h-44 w-full sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="pledgePaceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563a8" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#2563a8" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#dde1e6" vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626c7a', fontSize: 11 }}
              dy={6}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626c7a', fontSize: 11 }}
              tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
              width={48}
            />

            <Tooltip content={<PaceTooltip />} cursor={{ stroke: '#7fabdd', strokeWidth: 1 }} />

            {/* The target is the bar the member is being measured against. */}
            {target > 0 ? (
              <ReferenceLine
                y={target}
                stroke="#e50406"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Target ${formatCurrency(target, { compact: true })}`,
                  position: 'insideTopRight',
                  fill: '#c50305',
                  fontSize: 11,
                }}
              />
            ) : null}

            <Area
              type="monotone"
              dataKey="cumulative"
              name="Running total"
              stroke="#1b4d88"
              strokeWidth={2.5}
              fill="url(#pledgePaceFill)"
              dot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: '#1b4d88' }}
              activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#fff', fill: '#1b4d88' }}
            />

            <Line
              type="monotone"
              dataKey="amount"
              name="Paid that day"
              stroke="#e50406"
              strokeWidth={1.5}
              strokeOpacity={0.5}
              dot={{ r: 2, fill: '#e50406', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] text-ink-400">
        Payments span {formatMonthLabel(timeline[0].monthKey)} to{' '}
        {formatMonthLabel(last.monthKey)}.
      </p>
    </div>
  )
}
