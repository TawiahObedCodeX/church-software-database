import { Link } from 'react-router-dom'
import { Banknote, Eye, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { EmptyState } from '../ui/Alert'
import { formatCurrency, formatDate } from '../../utils/format'
import { getContributionProgress } from '../../utils/contributions'

/**
 * Contribution ledger.
 *
 * `hideMemberColumn` is used on the member profile, where every row
 * obviously belongs to the same person.
 */
export function ContributionTable({
  contributions,
  members,
  hideMemberColumn = false,
  onEdit,
  onDelete,
  onRecordPayment,
  onViewPayments,
}) {
  const byId = new Map(members.map((member) => [member.id, member]))

  if (!contributions.length) {
    return (
      <EmptyState
        icon={Banknote}
        title="No contributions recorded"
        description="Record an offering, tithe, donation or pledge to see it here."
      />
    )
  }

  return (
    <div className="scrollbar-slim -mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <caption className="sr-only">Contribution records with pledge progress</caption>

        <thead>
          <tr className="border-b border-ink-200 text-left">
            {!hideMemberColumn ? <Th>Member</Th> : null}
            <Th>Type / Purpose</Th>
            <Th className="text-right">Target</Th>
            <Th className="text-right">Paid</Th>
            <Th className="text-right">Outstanding</Th>
            <Th className="w-40">Progress</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-ink-100">
          {contributions.map((contribution) => {
            const progress = getContributionProgress(contribution)
            const member = byId.get(contribution.memberId)

            return (
              <tr key={contribution.id} className="transition hover:bg-ink-50/70">
                {!hideMemberColumn ? (
                  <td className="px-4 py-3">
                    <Link
                      to={`/members/${contribution.memberId}`}
                      className="font-medium text-ink-900 hover:text-navy-700 hover:underline"
                    >
                      {member?.fullName ?? 'Unknown member'}
                    </Link>
                    <p className="text-xs text-ink-400">{contribution.memberId}</p>
                  </td>
                ) : null}

                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{contribution.description}</p>
                  <p className="text-xs text-ink-400">
                    {contribution.id} &middot; {formatDate(contribution.date)} &middot;{' '}
                    {contribution.payments?.length ?? 0} payment
                    {(contribution.payments?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </td>

                <td className="tabular px-4 py-3 text-right text-ink-700">
                  {progress.isGoal ? (
                    formatCurrency(progress.target)
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>

                <td className="tabular px-4 py-3 text-right font-medium text-jade-600">
                  {formatCurrency(progress.paid)}
                </td>

                <td className="tabular px-4 py-3 text-right font-medium">
                  {progress.isGoal && progress.outstanding > 0 ? (
                    <span className="text-amber-600">{formatCurrency(progress.outstanding)}</span>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {progress.isGoal ? (
                    <ProgressBar value={progress.progress} showLabel size="sm" />
                  ) : (
                    <span className="text-xs text-ink-400">One-off gift</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <Badge variant={progress.status} size="sm" dot>
                    {progress.status}
                  </Badge>
                  <p className="mt-1 text-[11px] text-ink-400">{contribution.type}</p>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewPayments(contribution)}
                      aria-label={`View payments for ${contribution.description}`}
                      title="Payment history"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRecordPayment(contribution)}
                      disabled={progress.isSettled}
                      title={
                        progress.isSettled
                          ? 'This contribution is fully settled'
                          : 'Record another installment'
                      }
                    >
                      Pay
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(contribution)}
                      aria-label={`Edit ${contribution.description}`}
                      title="Edit contribution"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>

                    <Button
                      variant="danger-ghost"
                      size="icon"
                      onClick={() => onDelete(contribution)}
                      aria-label={`Delete ${contribution.description}`}
                      title="Delete contribution"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, className }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold tracking-wide text-ink-500 uppercase ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
