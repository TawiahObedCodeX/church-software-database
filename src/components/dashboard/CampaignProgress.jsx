import { Target, TrendingUp } from 'lucide-react'
import { ProgressBar } from '../ui/ProgressBar'
import { EmptyState } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { formatCurrency, formatDate, formatPercent } from '../../utils/format'

/**
 * Campaign rollup: how far along each goal-based fund is.
 * This is the "fundraising / building fund tracker" the admin watches.
 */
export function CampaignProgress({ campaigns }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        icon={Target}
        title="No campaigns yet"
        description="Create a pledge, fundraising or building fund contribution with a target to track progress here."
      />
    )
  }

  return (
    <ul className="space-y-4">
      {campaigns.map((campaign) => (
        <li key={campaign.id} className="rounded-xl border border-ink-100 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{campaign.name}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {campaign.contributorCount} contributor
                {campaign.contributorCount === 1 ? '' : 's'} &middot; started{' '}
                {formatDate(campaign.startDate)}
              </p>
            </div>

            <Badge variant={campaign.type} size="sm">
              {campaign.type}
            </Badge>
          </div>

          <div className="mt-3">
            <ProgressBar value={campaign.progress} showLabel size="lg" />
          </div>

          <dl className="tabular mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="text-ink-400">Target</dt>
              <dd className="font-semibold text-ink-800">{formatCurrency(campaign.target)}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Received</dt>
              <dd className="font-semibold text-jade-600">{formatCurrency(campaign.received)}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Outstanding</dt>
              <dd className="font-semibold text-amber-600">
                {formatCurrency(campaign.outstanding)}
              </dd>
            </div>
          </dl>

          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-500">
            <TrendingUp className="size-3.5 text-church-500" aria-hidden="true" />
            {campaign.completed} of {campaign.total} pledges fully settled (
            {formatPercent(campaign.progress, 0)})
          </p>
        </li>
      ))}
    </ul>
  )
}
