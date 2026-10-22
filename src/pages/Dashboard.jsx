import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  HandCoins,
  Receipt,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useChurch } from '../context/churchStore'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { PageSkeleton } from '../components/ui/Skeleton'
import { IncomeTrendChart } from '../components/dashboard/IncomeTrendChart'
import { TypeBreakdownChart } from '../components/dashboard/TypeBreakdownChart'
import { CollectionPaceChart } from '../components/dashboard/CollectionPaceChart'
import { CampaignProgress } from '../components/dashboard/CampaignProgress'
import { RecentContributions } from '../components/dashboard/RecentContributions'
import { OutstandingList } from '../components/dashboard/OutstandingList'
import { formatCurrency, formatPercent } from '../utils/format'
import { getMembersInArrears } from '../utils/stats'

export function Dashboard() {
  const { members, contributions, dashboard } = useChurch()
  const loading = useSimulatedLoading(600)
  const { summary, trend, breakdown, campaigns, recent, topOutstanding, pace } = dashboard

  /* Month-over-month movement for the received tile. */
  const last = trend[trend.length - 1]?.received ?? 0
  const previous = trend[trend.length - 2]?.received ?? 0
  const delta = previous > 0 ? Math.round(((last - previous) / previous) * 100) : 0

  const arrears = getMembersInArrears(members, contributions)

  if (loading) return <PageSkeleton variant="dashboard" />

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ---------- KPI row ---------- */}
      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Key figures"
      >
        <StatCard
          label="Total Received"
          value={summary.totalReceived}
          money
          icon={HandCoins}
          tone="navy"
          hint={`Across ${summary.paymentCount} recorded payments`}
          trend={{
            direction: delta < 0 ? 'down' : 'up',
            value: `${Math.abs(delta)}%`,
            label: 'vs last month',
          }}
        />

        <StatCard
          label="Outstanding Pledges"
          value={summary.totalOutstanding}
          money
          icon={Target}
          tone="ember"
          hint={`${arrears} member${arrears === 1 ? '' : 's'} still paying`}
        />

        <StatCard
          label="Collection Rate"
          value={formatPercent(summary.collectionRate, 0)}
          icon={TrendingUp}
          tone="jade"
          hint={`${formatCurrency(summary.goalReceived)} of ${formatCurrency(summary.goalPledged)} pledged`}
        />

        <StatCard
          label="Members"
          value={summary.totalMembers}
          icon={Users}
          tone="lake"
          hint={`${summary.activeMembers} active · ${summary.totalContributions} contributions`}
        />
      </section>

      {/* ---------- Charts ---------- */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Giving Trend"
            subtitle="Total received per month over the last 6 months"
            action={
              <span className="tabular rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                {formatCurrency(summary.totalReceived)} all time
              </span>
            }
          />
          <IncomeTrendChart data={trend} />
        </Card>

        <Card>
          <CardHeader title="Giving by Type" subtitle="Where the money comes from" />
          <TypeBreakdownChart data={breakdown} />
        </Card>
      </section>

      {/* ---------- Collection pace (pledged vs collected) ---------- */}
      <Card>
        <CardHeader
          title="Collection Pace"
          subtitle="How much of everything pledged has been collected so far"
          action={
            <span className="tabular rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
              {formatPercent(summary.collectionRate, 0)} collected
            </span>
          }
        />
        <CollectionPaceChart pace={pace} />
      </Card>

      {/* ---------- Campaigns ---------- */}
      <Card>
        <CardHeader
          title="Campaign & Pledge Progress"
          subtitle="How far along each fundraising target is"
          action={
            <Button as={Link} to="/contributions" variant="ghost" size="sm" iconRight={ArrowRight}>
              Manage
            </Button>
          }
        />
        <CampaignProgress campaigns={campaigns} />
      </Card>

      {/* ---------- Activity + follow-up ---------- */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent Payments"
            subtitle="The latest gifts recorded"
            action={
              <Button as={Link} to="/contributions" variant="ghost" size="sm" iconRight={ArrowRight}>
                All
              </Button>
            }
          />
          <RecentContributions payments={recent} />
        </Card>

        <Card>
          <CardHeader
            title="Follow-up Needed"
            subtitle="Members with the largest unpaid balance"
            action={
              <Button as={Link} to="/members" variant="ghost" size="sm" iconRight={ArrowRight}>
                Members
              </Button>
            }
          />
          <OutstandingList rows={topOutstanding} />
        </Card>
      </section>

      {/* ---------- Quick actions ---------- */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Quick actions">
        <QuickAction
          to="/members"
          icon={UserPlus}
          title="Register a member"
          description="Capture new member details in one form."
        />
        <QuickAction
          to="/contributions"
          icon={Receipt}
          title="Record a contribution"
          description="Log an offering, tithe, donation or pledge."
        />
        <QuickAction
          to="/contributions?tab=pledges"
          icon={Building2}
          title="Track installments"
          description="See who has finished paying and who has not."
        />
      </section>

      {/* Hidden from users, read by the summary export. */}
      <span className="sr-only" data-contributions={contributions.length} />
    </div>
  )
}

function QuickAction({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3.5 rounded-card border border-ink-200/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-pop"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-600 transition group-hover:bg-navy-700 group-hover:text-white">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">{description}</p>
      </div>
    </Link>
  )
}
