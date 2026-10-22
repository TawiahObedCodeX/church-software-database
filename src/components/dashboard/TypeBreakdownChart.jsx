import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../utils/format'

/**
 * Blue-led palette so the charts read as part of the church's identity.
 * Red is included but last, since it should be an accent rather than a
 * dominant colour.
 */
const COLORS = [
  '#1b4d88',
  '#2563a8',
  '#4a83c6',
  '#7fabdd',
  '#0284c7',
  '#0ea5e9',
  '#7dd3fc',
  '#e50406',
]

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-semibold text-ink-700">{item.name}</p>
      <p className="tabular mt-0.5 text-xs text-ink-600">
        {formatCurrency(item.value)} &middot; {item.payload.share}% of total
      </p>
    </div>
  )
}

/**
 * Giving split by contribution type.
 * The legend is rendered manually as a list so it stays readable on
 * narrow screens instead of squeezing inside the chart.
 */
export function TypeBreakdownChart({ data }) {
  const total = data.reduce((sum, row) => sum + row.value, 0)

  return (
    <div className="space-y-4 px-4 pb-5 sm:px-5">
      <div className="h-48 w-full sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
            <Legend content={() => null} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Manual legend / breakdown list */}
      <ul className="space-y-2.5">
        {data.map((row, index) => (
          <li key={row.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-ink-600">{row.name}</span>
            <span className="tabular shrink-0 font-medium text-ink-900">
              {formatCurrency(row.value)}
            </span>
            <span className="tabular w-10 shrink-0 text-right text-xs text-ink-400">
              {row.share}%
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-ink-100 pt-3 text-xs text-ink-500">
        Total received: <span className="font-semibold text-ink-800">{formatCurrency(total)}</span>
      </p>
    </div>
  )
}
