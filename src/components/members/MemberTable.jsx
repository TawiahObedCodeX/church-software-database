import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2, UserPlus } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/Alert'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * Member roster table.
 *
 * Horizontally scrollable on small screens rather than collapsing into
 * cards, so the numeric columns stay comparable row to row.
 */
export function MemberTable({ members, onEdit, onDelete, onAdd }) {
  if (!members.length) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No members found"
        description="Try a different search term, or register the first member of the church."
        action={
          <Button icon={UserPlus} onClick={onAdd}>
            Register member
          </Button>
        }
      />
    )
  }

  return (
    <div className="scrollbar-slim -mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-215 border-collapse text-sm">
        <caption className="sr-only">
          Registered church members with their giving summary
        </caption>

        <thead>
          <tr className="border-b border-ink-200 text-left">
            <Th>Member</Th>
            <Th>Contact</Th>
            <Th>Category</Th>
            <Th className="text-right">Paid</Th>
            <Th className="text-right">Outstanding</Th>
            <Th className="w-40">Progress</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-ink-100">
          {members.map((member) => {
            const fin = member.financials

            return (
              <tr key={member.id} className="transition hover:bg-ink-50/70">
                <td className="px-4 py-3">
                  <Link
                    to={`/members/${member.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-semibold text-navy-700">
                      {member.fullName
                        .split(' ')
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink-900 group-hover:text-navy-700 group-hover:underline">
                        {member.fullName}
                      </span>
                      <span className="block text-xs text-ink-400">
                        {member.id} &middot; joined {formatDate(member.joinDate)}
                      </span>
                    </span>
                  </Link>
                </td>

                <td className="px-4 py-3">
                  <span className="block text-ink-700">{member.phone}</span>
                  <span className="block text-xs text-ink-400">{member.email}</span>
                </td>

                <td className="px-4 py-3">
                  <Badge variant={member.category} size="sm">
                    {member.category}
                  </Badge>
                </td>

                <td className="tabular px-4 py-3 text-right font-medium text-jade-600">
                  {formatCurrency(fin.paid)}
                </td>

                <td className="tabular px-4 py-3 text-right font-medium">
                  {fin.outstanding > 0 ? (
                    <span className="text-amber-600">{formatCurrency(fin.outstanding)}</span>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {fin.pledged > 0 ? (
                    <ProgressBar value={fin.completionRate} showLabel size="sm" />
                  ) : (
                    <span className="text-xs text-ink-400">No pledge</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <Badge variant={member.status} size="sm" dot>
                    {member.status}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      as={Link}
                      to={`/members/${member.id}`}
                      variant="ghost"
                      size="icon"
                      aria-label={`View ${member.fullName}`}
                      title="View profile"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(member)}
                      aria-label={`Edit ${member.fullName}`}
                      title="Edit member"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>

                    <Button
                      variant="danger-ghost"
                      size="icon"
                      onClick={() => onDelete(member)}
                      aria-label={`Delete ${member.fullName}`}
                      title="Delete member"
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
