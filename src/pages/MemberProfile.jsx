import { useMemo, useState } from 'react'
import { Navigate, Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  Download,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Receipt,
  Trash2,
} from 'lucide-react'
import { useChurch, useMember } from '../context/churchStore'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { Card, CardHeader } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Alert } from '../components/ui/Alert'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/Alert'
import { PageSkeleton } from '../components/ui/Skeleton'
import { ContributionTable } from '../components/contributions/ContributionTable'
import { PaymentForm } from '../components/contributions/PaymentForm'
import {
  MemberGivingChart,
  MemberGoalChart,
} from '../components/members/MemberProgressCharts'
import { formatCurrency, formatDate, formatDateTime } from '../utils/format'
import { downloadText, toCSV } from '../utils/csvUtils'
import {
  getContributionProgress,
  getMemberGoalPosition,
  getMemberMonthlyGiving,
  getMemberTimeline,
  round2,
} from '../utils/contributions'

export function MemberProfile() {
  const { memberId } = useParams()
  const member = useMember(memberId)
  const { contributions, addPayment, deletePayment } = useChurch()
  const loading = useSimulatedLoading(450, [memberId])

  /* Which pledge the admin is recording a payment against. */
  const [payTarget, setPayTarget] = useState(null)
  const [flash, setFlash] = useState(null)

  const own = useMemo(
    () => contributions.filter((contribution) => contribution.memberId === memberId),
    [contributions, memberId],
  )

  const goals = useMemo(
    () => own.filter((contribution) => getContributionProgress(contribution).isGoal),
    [own],
  )

  /* Everything the profile charts plot. */
  const timeline = useMemo(() => getMemberTimeline(own), [own])
  const monthly = useMemo(() => getMemberMonthlyGiving(own), [own])
  const goalPosition = useMemo(() => getMemberGoalPosition(own), [own])

  /** Single-member statement, opens straight in Excel. */
  function exportStatement() {
    const headers = [
      'Contribution ID',
      'Type',
      'Campaign',
      'Date',
      'Target',
      'Paid',
      'Outstanding',
      'Progress %',
      'Status',
    ]

    const body = own.map((contribution) => {
      const progress = getContributionProgress(contribution)
      return [
        contribution.id,
        contribution.type,
        contribution.description,
        contribution.date,
        progress.target ?? '',
        progress.paid,
        progress.outstanding ?? '',
        Math.round(progress.progress),
        progress.status,
      ]
    })

    const title = `Lakeside Baptist Church - Statement for ${member.fullName} (${member.id})`
    const content = `\uFEFF${toCSV([title], [])}\r\n${toCSV(headers, body)}`
    downloadText(`statement-${member.id}-${new Date().toISOString().slice(0, 10)}.csv`, content)
  }

  /**
   * Record an installment from the member's own profile.
   *
   * The store caps the amount at the outstanding balance, so an
   * accidental overpayment is trimmed rather than accepted. Either way
   * the profile and the dashboard recalculate immediately.
   */
  function onRecordPayment(values) {
    if (!payTarget) return

    const progress = getContributionProgress(payTarget)
    const requested = round2(Number(values.amount))
    const capped = progress.isGoal ? round2(Math.min(requested, progress.outstanding)) : requested

    const result = addPayment(payTarget.id, { ...values, amount: capped })
    setPayTarget(null)

    if (typeof result === 'string') {
      setFlash({ tone: 'warning', message: result })
      return
    }

    const adjusted = progress.isGoal && requested > capped
    setFlash({
      tone: adjusted ? 'warning' : 'success',
      message: adjusted
        ? `${formatCurrency(capped)} recorded — capped at the balance, so ${payTarget.description} is now fully settled.`
        : `${formatCurrency(capped)} recorded towards ${payTarget.description}.`,
    })
  }

  function onDeletePayment(contribution, paymentId) {
    deletePayment(contribution.id, paymentId)
    setFlash({ tone: 'success', message: 'That installment was removed.' })
  }

  // Unknown id (e.g. right after deleting) -> back to the roster.
  if (!member) return <Navigate to="/members" replace />

  if (loading) return <PageSkeleton variant="profile" />

  const { financials } = member

  return (
    <div className="space-y-5 sm:space-y-6">
      <Button as={Link} to="/members" variant="ghost" size="sm" icon={ArrowLeft}>
        Back to members
      </Button>

      {flash ? (
        <Alert tone={flash.tone} onDismiss={() => setFlash(null)}>
          {flash.message}
        </Alert>
      ) : null}

      {/* ---------- Identity header ---------- */}
      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-navy-700 text-xl font-semibold text-white shadow-pop">
            {member.fullName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-ink-900">{member.fullName}</h2>
              <Badge variant={member.status} size="sm" dot>
                {member.status}
              </Badge>
              <Badge variant={member.category} size="sm">
                {member.category}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-ink-500">
              {member.id} &middot; joined {formatDate(member.joinDate)} &middot; {member.gender}
            </p>

            <dl className="mt-4 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-3">
              <Detail icon={Phone} label="Phone" value={member.phone} />
              <Detail icon={Mail} label="Email" value={member.email} />
              <Detail icon={MapPin} label="Address" value={member.address || 'Not provided'} />
            </dl>

            {member.notes ? (
              <p className="mt-4 rounded-xl bg-ink-50 px-3.5 py-2.5 text-xs text-ink-600">
                {member.notes}
              </p>
            ) : null}
          </div>

          <Button variant="secondary" size="sm" icon={Download} onClick={exportStatement}>
            Statement CSV
          </Button>
        </div>
      </Card>

      {/* ---------- Money position ---------- */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Paid"
          value={financials.paid}
          money
          icon={Receipt}
          tone="jade"
          hint={`${own.length} contribution${own.length === 1 ? '' : 's'}`}
        />
        <StatCard label="Total Pledged" value={financials.pledged} money tone="navy" />
        <StatCard
          label="Outstanding"
          value={financials.outstanding}
          money
          tone="amber"
          hint={financials.outstanding > 0 ? 'Still to be paid' : 'Nothing owed'}
        />
        <StatCard
          label="Pledge Completion"
          value={`${financials.completionRate}%`}
          tone="lake"
          hint={`${financials.completedGoals} settled · ${financials.activeGoals} in progress`}
        />
      </section>

      {/* ---------- How far this member has come ---------- */}
      <Card>
        <CardHeader
          title="Giving Track Record"
          subtitle={`Everything ${member.fullName.split(' ')[0]} has given, month by month`}
        />
        {monthly.length ? (
          <MemberGivingChart monthly={monthly} />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No giving recorded yet"
            description="Once a payment is recorded for this member, their track record appears here."
          />
        )}
      </Card>

      {/* ---------- Overall pledge position ---------- */}
      {goalPosition.pledged > 0 ? (
        <Card>
          <CardHeader
            title="Pledge Position"
            subtitle="How much of everything pledged has been cleared"
            action={
              <span
                className={
                  goalPosition.outstanding === 0
                    ? 'tabular rounded-lg bg-jade-50 px-2.5 py-1 text-xs font-semibold text-jade-700'
                    : 'tabular rounded-lg bg-ember-50 px-2.5 py-1 text-xs font-semibold text-ember-600'
                }
              >
                {goalPosition.percent}% cleared
              </span>
            }
          />
          <MemberGoalChart timeline={timeline} position={goalPosition} />
        </Card>
      ) : null}

      {/* ---------- Per-contribution progress ---------- */}
      <Card>
        <CardHeader
          title="Pledge & Goal Progress"
          subtitle="How much has been paid towards each target"
        />

        <div className="space-y-3 px-4 pb-5 sm:px-5">
          {goals.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No goal-based contributions"
              description="This member's giving is all one-off (offerings, tithes, donations)."
            />
          ) : (
            goals.map((contribution) => {
              const progress = getContributionProgress(contribution)
              const isOpen = progress.outstanding > 0

              return (
                <div key={contribution.id} className="rounded-xl border border-ink-100 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {contribution.description}
                      </p>
                      <p className="text-xs text-ink-500">
                        {contribution.id} &middot; {contribution.payments.length} installment
                        {contribution.payments.length === 1 ? '' : 's'} &middot; started{' '}
                        {formatDate(contribution.date)}
                      </p>
                    </div>
                    <Badge variant={progress.status} size="sm" dot>
                      {progress.status}
                    </Badge>
                  </div>

                  <ProgressBar value={progress.progress} showLabel size="lg" className="mt-3" />

                  <dl className="tabular mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-ink-400">Target</dt>
                      <dd className="font-semibold text-ink-800">
                        {formatCurrency(progress.target)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Paid</dt>
                      <dd className="font-semibold text-jade-600">
                        {formatCurrency(progress.paid)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Remaining</dt>
                      <dd className="font-semibold text-amber-600">
                        {formatCurrency(progress.outstanding)}
                      </dd>
                    </div>
                  </dl>

                  {/* Still owing: let the admin take the next installment
                      right here, without leaving the member's page. */}
                  {isOpen ? (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-xl bg-navy-50/70 px-3 py-2.5">
                      <p className="min-w-0 flex-1 text-xs text-navy-800">
                        <CalendarClock
                          className="mr-1.5 -mt-0.5 inline size-3.5"
                          aria-hidden="true"
                        />
                        <strong>{formatCurrency(progress.outstanding)}</strong> still to pay — the
                        member can settle it in as many installments as they need.
                      </p>
                      <Button
                        size="sm"
                        icon={PlusCircle}
                        onClick={() => setPayTarget(contribution)}
                      >
                        Record payment
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3.5 rounded-xl bg-jade-50/70 px-3 py-2.5 text-xs text-jade-700">
                      This pledge is fully paid. No further installment is needed.
                    </p>
                  )}

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-navy-700 hover:underline">
                      View {contribution.payments.length} payment
                      {contribution.payments.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="mt-2 divide-y divide-ink-100">
                      {[...contribution.payments]
                        .sort((a, b) => {
                          const left = new Date(a.timestamp ?? a.date).getTime() || 0
                          const right = new Date(b.timestamp ?? b.date).getTime() || 0
                          return right - left
                        })
                        .map((payment) => (
                          <li
                            key={payment.id}
                            className="flex items-center justify-between gap-3 py-1.5 text-xs"
                          >
                            <span className="min-w-0 flex-1 truncate text-ink-500">
                              {formatDateTime(payment.timestamp ?? payment.date)} &middot;{' '}
                              {payment.method}
                            </span>
                            <span className="tabular shrink-0 font-medium text-ink-800">
                              {formatCurrency(payment.amount)}
                            </span>
                            <Button
                              variant="danger-ghost"
                              size="icon"
                              onClick={() => onDeletePayment(contribution, payment.id)}
                              aria-label={`Remove payment of ${formatCurrency(payment.amount)}`}
                              title="Remove this payment"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </Button>
                          </li>
                        ))}
                    </ul>
                  </details>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* ---------- Full history ---------- */}
      <Card>
        <CardHeader
          title="Giving History"
          subtitle="Every contribution recorded for this member"
        />
        <ContributionTable contributions={own} members={[member]} hideMemberColumn />
      </Card>

      {/* ---------- Record an installment (stay on the profile) ---------- */}
      <Modal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title="Record Payment"
        description={
          payTarget
            ? `${member.fullName} — ${payTarget.description}`
            : 'Add another installment towards this pledge.'
        }
      >
        {payTarget ? (
          <PaymentForm
            contribution={payTarget}
            onSubmit={onRecordPayment}
            onDeletePayment={(paymentId) => onDeletePayment(payTarget, paymentId)}
          />
        ) : null}
      </Modal>
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-ink-400">{label}</dt>
        <dd className="truncate text-ink-700">{value}</dd>
      </div>
    </div>
  )
}
