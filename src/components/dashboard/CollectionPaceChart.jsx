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
import { formatCurrency, formatMonthLabel } from '../../utils/format'

function PaceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const percent =
    point.pledged > 0 ? Math.round((point.collected / point.pledged) * 100) : 0

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-pop">
      <p className="text-xs font-semibold text-ink-700">{formatMonthLabel(point.key)}</p>

      <p className="tabular mt-1.5 text-xs text-ink-600">
        Collected to date{' '}
        <span className="font-medium text-ink-900">{formatCurrency(point.collected)}</span>
      </p>
      <p className="tabular mt-0.5 text-xs text-ink-600">
        Pledged{' '}
        <span className="font-medium text-ink-900">{formatCurrency(point.pledged)}</span>
      </p>
      <p className="tabular mt-1.5 border-t border-ink-100 pt-1.5 text-xs text-ink-500">
        {percent}% collected &middot; {formatCurrency(point.gap)} outstanding
      </p>
      {point.monthAmount > 0 ? (
        <p className="tabular mt-0.5 text-xs text-jade-700">
          +{formatCurrency(point.monthAmount)} this month
        </p>
      ) : null}
    </div>
  )
}

/**
 * "Are we closing the gap?" - cumulative money collected against the
 * total that was pledged, across the whole church.
 *
 * Distinct from the Giving Trend chart above it: that one shows discrete
 * monthly income, this one shows the running position against the goal.
 */
export function CollectionPaceChart({ pace }) {
  const { points, totalPledged, totalReceived } = pace

  const percent = totalPledged > 0 ? Math.round((totalReceived / totalPledged) * 100) : 0

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Headline position */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3.5 py-3">
          <p className="text-[11px] font-medium tracking-wide text-ink-500 uppercase">Pledged</p>
          <p className="tabular mt-1 text-lg font-semibold text-ink-900">
            {formatCurrency(totalPledged)}
          </p>
        </div>

        <div className="rounded-xl border border-ink-100 bg-jade-50/60 px-3.5 py-3">
          <p className="text-[11px] font-medium tracking-wide text-jade-700 uppercase">
            Collected
          </p>
          <p className="tabular mt-1 text-lg font-semibold text-jade-700">
            {formatCurrency(totalReceived)}
          </p>
        </div>

        <div className="rounded-xl border border-ink-100 bg-ember-50/60 px-3.5 py-3">
          <p className="text-[11px] font-medium tracking-wide text-ember-600 uppercase">
            Outstanding
          </p>
          <p className="tabular mt-1 text-lg font-semibold text-ember-600">
            {formatCurrency(Math.max(totalPledged - totalReceived, 0))}
          </p>
        </div>
      </div>

      {/* One shared progress meter for the whole church. */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>{percent}% of everything pledged has been collected</span>
          <span className="tabular">{totalPledged > 0 ? '' : 'No pledges yet'}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy-600 to-jade-600 transition-[width] duration-700 ease-out"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="collectionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1b4d88" stopOpacity={0.36} />
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

            <Tooltip content={<PaceTooltip />} cursor={{ stroke: '#7fabdd', strokeWidth: 1 }} />

            {/* The pledge ceiling - the line the church wants to reach. */}
            {totalPledged > 0 ? (
              <ReferenceLine
                y={totalPledged}
                stroke="#e50406"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Pledged ${formatCurrency(totalPledged, { compact: true })}`,
                  position: 'insideTopRight',
                  fill: '#c50305',
                  fontSize: 11,
                }}
              />
            ) : null}

            <Area
              type="monotone"
              dataKey="collected"
              name="Collected to date"
              stroke="#1b4d88"
              strokeWidth={2.5}
              fill="url(#collectionFill)"
              dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#1b4d88' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />

            <Line
              type="monotone"
              dataKey="pledged"
              name="Pledged"
              stroke="#e50406"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-xs text-ink-400">
        Pledge payments accumulated each month. One-off giving (offerings, tithes, donations) is
        excluded so the line measures progress against what was pledged.
      </p>
    </div>
  )
}
