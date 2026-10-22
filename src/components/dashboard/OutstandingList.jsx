import { Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { ProgressBar } from '../ui/ProgressBar'
import { EmptyState } from '../ui/Alert'
import { formatCurrency } from '../../utils/format'

/**
 * Members with the largest unpaid pledge balance — the follow-up list.
 *
 * Spacing note: the name + progress block and the money block are laid
 * out as a two-column grid with a gap, so the amount stays aligned even
 * when a member has a very long name.
 */
export function OutstandingList({ rows }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Everyone is up to date"
        description="No member currently has an unpaid pledge balance."
      />
    )
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      <ul className="divide-y divide-ink-100">
        {rows.map(({ member, fin }) => (
          <li key={member.id} className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ember-50 text-xs font-semibold text-ember-600">
              {member.fullName
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                to={`/members/${member.id}`}
                className="block truncate text-sm font-medium text-ink-900 transition hover:text-navy-700 hover:underline"
              >
                {member.fullName}
              </Link>
              <div className="mt-2 flex items-center gap-2.5">
                <ProgressBar
                  value={fin.completionRate}
                  size="sm"
                  tone="ember"
                  className="max-w-40 flex-1"
                />
                <span className="tabular shrink-0 text-[11px] text-ink-400">
                  {fin.completionRate}%
                </span>
              </div>
            </div>

            {/* Fixed-width money column keeps the figures aligned. */}
            <div className="w-24 shrink-0 text-right sm:w-28">
              <p className="tabular text-sm font-semibold text-ember-600">
                {formatCurrency(fin.outstanding)}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-400">outstanding</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-500">
        {rows.length} member{rows.length === 1 ? '' : 's'} need{rows.length === 1 ? 's' : ''}{' '}
        follow-up on pledge balances.
      </p>
    </div>
  )
}
