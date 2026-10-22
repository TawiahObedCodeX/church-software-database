import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../../utils/format'

/** Custom tooltip so the chart speaks the same language as the rest of the UI. */
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-semibold text-ink-700">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="tabular mt-1 flex items-center gap-2 text-xs text-ink-600">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.name}:{' '}
          <span className="font-medium text-ink-900">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Income trend over the last 6 months, in the church's navy blue.
 * An area chart is used because the church cares about the shape of
 * giving over time rather than comparing discrete bars.
 */
export function IncomeTrendChart({ data }) {
  const hasData = data.some((month) => month.received > 0)

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563a8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563a8" stopOpacity={0.02} />
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
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#7fabdd', strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="received"
              name="Received"
              stroke="#1b4d88"
              strokeWidth={2.5}
              fill="url(#incomeFill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
              dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#1b4d88' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!hasData ? (
        <p className="mt-2 text-center text-xs text-ink-400">
          No payments recorded in the last 6 months yet.
        </p>
      ) : null}
    </div>
  )
}
