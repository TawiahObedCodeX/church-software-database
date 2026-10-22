import { Link } from 'react-router-dom'
import { ArrowRight, Inbox } from 'lucide-react'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/Alert'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * Latest individual payments across all contributions.
 *
 * Spacing note: each row is a padded block rather than a bare list item,
 * and the amount column gets a fixed width so the figures line up
 * vertically instead of drifting with name length.
 */
export function RecentContributions({ payments }) {
  if (!payments.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No payments recorded yet"
        description="Record a member's first contribution and it will show up here."
      />
    )
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      <ul className="divide-y divide-ink-100">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-semibold text-navy-700">
              {payment.memberName
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                to={`/members/${payment.memberId}`}
                className="block truncate text-sm font-medium text-ink-900 transition hover:text-navy-700 hover:underline"
              >
                {payment.memberName}
              </Link>
              <p className="mt-0.5 truncate text-xs text-ink-500">
                {payment.type} &middot; {formatDate(payment.date)}
              </p>
            </div>

            {/* Fixed-width money column keeps amounts aligned. */}
            <div className="w-24 shrink-0 text-right sm:w-28">
              <p className="tabular text-sm font-semibold text-jade-700">
                +{formatCurrency(payment.amount)}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-ink-400">{payment.method}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-ink-100 pt-4">
        <Button as={Link} to="/contributions" variant="ghost" size="sm" iconRight={ArrowRight}>
          View all contributions
        </Button>
      </div>
    </div>
  )
}
