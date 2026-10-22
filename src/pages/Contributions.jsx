import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Coins, HandCoins, Plus, Target, TrendingUp } from 'lucide-react'
import { useChurch } from '../context/churchStore'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Alert } from '../components/ui/Alert'
import { SearchInput, Select } from '../components/ui/Input'
import { StatCard } from '../components/ui/StatCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PageSkeleton } from '../components/ui/Skeleton'
import { ContributionForm } from '../components/contributions/ContributionForm'
import { ContributionTable } from '../components/contributions/ContributionTable'
import { PaymentForm } from '../components/contributions/PaymentForm'
import { ExportButton } from '../components/contributions/ExportButton'
import {
  CONTRIBUTION_TYPES,
  PAYMENT_METHODS,
  getContributionProgress,
  isPledgeType,
  round2,
} from '../utils/contributions'
import { formatCurrency, formatDate, formatPercent } from '../utils/format'
import {
  exportContributionsToCSV,
  exportPaymentsToCSV,
  exportPledgesToCSV,
  exportSummaryToCSV,
} from '../utils/csvUtils'
import { PLEDGE_TYPES } from '../utils/contributions'

/** Validation for creating / editing a contribution. */
const contributionSchema = z
  .object({
    memberId: z.string().min(1, 'Select the member giving'),
    type: z.enum(CONTRIBUTION_TYPES, { message: 'Select a contribution type' }),
    description: z.string().trim().min(3, 'Describe what this contribution is for').max(120),
    method: z.enum(PAYMENT_METHODS, { message: 'Select a payment method' }),
    targetAmount: z.union([z.coerce.number(), z.literal(''), z.null()]).optional(),
    firstPayment: z.union([z.coerce.number(), z.literal(''), z.null()]).optional(),
    date: z.string().min(1, 'Select the date'),
    note: z.string().trim().max(200).optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    const goal = isPledgeType(values.type)
    const target = Number(values.targetAmount)
    const first = Number(values.firstPayment)

    if (goal) {
      if (!values.targetAmount || Number.isNaN(target) || target <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetAmount'],
          message: 'Goal-based contributions need a target amount',
        })
      }
      if (values.firstPayment && !Number.isNaN(first) && first > target) {
        ctx.addIssue({
          code: 'custom',
          path: ['firstPayment'],
          message: 'First installment cannot exceed the target',
        })
      }
    } else if (!values.firstPayment || Number.isNaN(first) || first <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['firstPayment'],
        message: 'Enter the amount received',
      })
    }
  })

const BLANK_CONTRIBUTION = {
  memberId: '',
  type: '',
  description: '',
  method: '',
  targetAmount: '',
  firstPayment: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

const TABS = [
  { id: 'all', label: 'All contributions' },
  { id: 'pledges', label: 'Pledges & campaigns' },
]

export function Contributions() {
  const {
    members,
    contributions,
    dashboard,
    addContribution,
    updateContribution,
    deleteContribution,
    addPayment,
    deletePayment,
  } = useChurch()
  const loading = useSimulatedLoading(550)

  /* Tab state lives in the URL so the dashboard quick-action can link
     straight to the pledges view. */
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'pledges' ? 'pledges' : 'all'
  const setTab = (next) => setParams(next === 'all' ? {} : { tab: next })

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [payTarget, setPayTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [flash, setFlash] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(contributionSchema), defaultValues: BLANK_CONTRIBUTION })

  const memberName = useMemo(
    () => new Map(members.map((member) => [member.id, member.fullName])),
    [members],
  )

  /* ---------------- Filtering ---------------- */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return contributions
      .filter((contribution) => {
        const progress = getContributionProgress(contribution)
        const matchesTab = tab === 'all' || progress.isGoal
        const matchesType = !typeFilter || contribution.type === typeFilter
        const matchesStatus = !statusFilter || progress.status === statusFilter

        const haystack = [
          contribution.id,
          contribution.description,
          contribution.type,
          memberName.get(contribution.memberId),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return matchesTab && matchesType && matchesStatus && (!needle || haystack.includes(needle))
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }, [contributions, tab, typeFilter, statusFilter, query, memberName])

  /* ---------------- Figures ---------------- */
  const figures = useMemo(() => {
    return contributions.reduce(
      (acc, contribution) => {
        const progress = getContributionProgress(contribution)
        acc.received = round2(acc.received + progress.paid)
        if (progress.isGoal) {
          acc.pledged = round2(acc.pledged + (progress.target || 0))
          acc.outstanding = round2(acc.outstanding + (progress.outstanding || 0))
          if (progress.status === 'Completed') acc.settled += 1
          else if (progress.status === 'Partially Paid') acc.inProgress += 1
          else acc.notStarted += 1
        }
        return acc
      },
      { received: 0, pledged: 0, outstanding: 0, settled: 0, inProgress: 0, notStarted: 0 },
    )
  }, [contributions])

  /* ---------------- Handlers ---------------- */
  function openCreate() {
    setEditing(null)
    reset(BLANK_CONTRIBUTION)
    setFormOpen(true)
  }

  function openEdit(contribution) {
    setEditing(contribution)
    reset({
      memberId: contribution.memberId,
      type: contribution.type,
      description: contribution.description,
      method: contribution.method,
      targetAmount: contribution.targetAmount ?? '',
      firstPayment: '',
      date: contribution.date,
      note: contribution.note ?? '',
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    reset(BLANK_CONTRIBUTION)
  }

  function onSubmit(values) {
    const goal = isPledgeType(values.type)
    const first = Number(values.firstPayment) || 0

    /* Only the amount/date/method are decided here - the store assigns
       ids and references so this stays a pure event handler. */
    const initialPayments =
      !editing && first > 0
        ? [
            {
              amount: round2(first),
              date: values.date,
              method: values.method,
              note: '',
            },
          ]
        : []

    const payload = {
      memberId: values.memberId,
      type: values.type,
      description: values.description,
      method: values.method,
      date: values.date,
      note: values.note ?? '',
      targetAmount: goal ? round2(Number(values.targetAmount)) : null,
      ...(editing ? {} : { payments: initialPayments }),
    }

    if (editing) {
      updateContribution(editing.id, payload)
      setFlash({ tone: 'success', message: `${values.description} was updated.` })
    } else {
      const created = addContribution(payload)
      setFlash({
        tone: 'success',
        message: goal
          ? `Pledge "${values.description}" created with a ${formatCurrency(payload.targetAmount)} target.`
          : `${values.description} of ${formatCurrency(first)} recorded for ${memberName.get(values.memberId)}.`,
      })
      void created
    }
    closeForm()
  }

  function onRecordPayment(values) {
    const progress = getContributionProgress(payTarget)
    const requested = round2(Number(values.amount))
    const capped = progress.isGoal ? round2(Math.min(requested, progress.outstanding)) : requested

    const result = addPayment(payTarget.id, { ...values, amount: capped })

    /* The store returns the created payment, or a string explaining why
       it was refused. Either way the admin gets one clear message. */
    if (typeof result === 'string') {
      setFlash({ tone: 'warning', message: result })
      setPayTarget(null)
      return
    }

    const who = memberName.get(payTarget.memberId)
    const adjusted = progress.isGoal && requested > capped

    setPayTarget(null)
    setFlash({
      tone: adjusted ? 'warning' : 'success',
      message: adjusted
        ? `${formatCurrency(capped)} recorded for ${who} — the balance was settled exactly, so no overpayment was accepted.`
        : `${formatCurrency(capped)} recorded for ${who}. The pledge now stands at ${formatCurrency(
            round2(progress.paid + capped),
          )} of ${formatCurrency(progress.target)}.`,
    })
  }

  function confirmDelete() {
    deleteContribution(pendingDelete.id)
    setPendingDelete(null)
    setFlash({ tone: 'success', message: `${pendingDelete.description} was deleted.` })
  }

  const exportOptions = [
    {
      label: 'Full contribution ledger',
      hint: 'Every contribution with targets and balances',
      run: () => exportContributionsToCSV(contributions, members),
    },
    {
      label: 'Installment / payment log',
      hint: 'One row per individual payment received',
      run: () => exportPaymentsToCSV(contributions, members),
    },
    {
      label: 'Pledge tracker',
      hint: 'Outstanding pledge balances, largest first',
      run: () => exportPledgesToCSV(contributions, members),
    },
    {
      label: 'Church summary report',
      hint: 'Totals plus a per-campaign breakdown',
      run: () =>
        exportSummaryToCSV(dashboard.summary, dashboard.campaigns) && contributions.length,
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      {loading ? (
        <PageSkeleton variant="table" />
      ) : (
        <>
          {flash ? (
            <Alert tone={flash.tone} onDismiss={() => setFlash(null)}>
              {flash.message}
            </Alert>
          ) : null}

          {/* ---------- Summary ---------- */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Received"
              value={figures.received}
              money
              icon={HandCoins}
              tone="jade"
              hint="All contribution types"
            />
            <StatCard
              label="Pledged"
              value={figures.pledged}
              money
              icon={Target}
              tone="navy"
              hint={`${PLEDGE_TYPES.length} goal-based categories`}
            />
            <StatCard
              label="Outstanding"
              value={figures.outstanding}
              money
              icon={Coins}
              tone="amber"
              hint={`${figures.inProgress} pledge${figures.inProgress === 1 ? '' : 's'} in progress`}
            />
            <StatCard
              label="Pledges Settled"
              value={figures.settled}
              icon={TrendingUp}
              tone="lake"
              hint={`${figures.notStarted} not started yet`}
            />
          </section>

          {/* ---------- Tabs ---------- */}
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-200">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={
                  tab === item.id
                    ? '-mb-px cursor-pointer border-b-2 border-navy-600 px-3 py-2.5 text-sm font-semibold text-navy-700'
                    : '-mb-px cursor-pointer border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:text-ink-800'
                }
              >
                {item.label}
              </button>
            ))}
          </div>

      {/* ---------- Pledges overview (goal-based only) ---------- */}
      {tab === 'pledges' ? (
        <Card>
          <CardHeader
            title="Campaign Progress"
            subtitle="How far along each target is, aggregated across members"
          />
          <div className="space-y-3 px-4 pb-5 sm:px-5">
            {dashboard.campaigns.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">
                No goal-based contributions yet.
              </p>
            ) : (
              dashboard.campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-xl border border-ink-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{campaign.name}</p>
                      <p className="text-xs text-ink-500">
                        {campaign.contributorCount} contributor
                        {campaign.contributorCount === 1 ? '' : 's'} &middot;{' '}
                        {campaign.completed}/{campaign.total} settled &middot; started{' '}
                        {formatDate(campaign.startDate)}
                      </p>
                    </div>
                    <span className="tabular rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700">
                      {formatPercent(campaign.progress, 0)}
                    </span>
                  </div>

                  <ProgressBar value={campaign.progress} size="lg" className="mt-3" />

                  <dl className="tabular mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-ink-400">Target</dt>
                      <dd className="font-semibold text-ink-800">
                        {formatCurrency(campaign.target)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Received</dt>
                      <dd className="font-semibold text-jade-600">
                        {formatCurrency(campaign.received)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Outstanding</dt>
                      <dd className="font-semibold text-amber-600">
                        {formatCurrency(campaign.outstanding)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      {/* ---------- Ledger ---------- */}
      <Card>
        <CardHeader
          title={tab === 'pledges' ? 'Pledge Records' : 'Contribution Ledger'}
          subtitle={`${visible.length} record${visible.length === 1 ? '' : 's'} shown`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <ExportButton options={exportOptions} />
              <Button size="sm" icon={Plus} onClick={openCreate}>
                New
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:px-5 md:grid-cols-2 xl:grid-cols-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search member, purpose or ID…"
            className="xl:col-span-2"
          />

          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by contribution type"
          >
            <option value="">All types</option>
            {CONTRIBUTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All status</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Completed">Completed</option>
          </Select>
        </div>

        <ContributionTable
          contributions={visible}
          members={members}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          onRecordPayment={setPayTarget}
          onViewPayments={setViewTarget}
        />
      </Card>
        </>
      )}

      {/* ---------- Create / edit contribution ---------- */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Edit ${editing.description}` : 'Record a Contribution'}
        description={
          editing
            ? 'Update the details of this contribution record.'
            : 'Log an offering, tithe, donation, or set up a pledge with a target.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="contribution-form"
              icon={editing ? undefined : Plus}
            >
              {editing ? 'Save changes' : 'Save contribution'}
            </Button>
          </>
        }
      >
        <form id="contribution-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <ContributionForm
            register={register}
            errors={errors}
            watch={watch}
            members={members}
            idPrefix="contribution"
          />
        </form>
      </Modal>

      {/* ---------- Record an installment ---------- */}
      <Modal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title="Record Payment"
        description="Add another installment towards this contribution."
      >
        <PaymentForm
          contribution={payTarget}
          onSubmit={onRecordPayment}
          onDeletePayment={(paymentId) => {
            deletePayment(payTarget.id, paymentId)
            setFlash({ tone: 'success', message: 'That installment was removed.' })
          }}
        />
      </Modal>

      {/* ---------- Read-only payment history ---------- */}
      <Modal
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `${viewTarget.description} — payments` : 'Payments'}
        description="Every installment recorded against this contribution."
      >
        {viewTarget ? (
          <PaymentForm
            contribution={viewTarget}
            onSubmit={() => {}}
            onDeletePayment={(paymentId) => {
              deletePayment(viewTarget.id, paymentId)
              setFlash({ tone: 'success', message: 'That installment was removed.' })
            }}
          />
        ) : null}
      </Modal>

      {/* ---------- Delete confirmation ---------- */}
      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title="Delete contribution?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep record
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <Alert tone="warning" title="Payment history will be lost">
          <strong>{pendingDelete?.description}</strong> and its{' '}
          {pendingDelete?.payments?.length ?? 0} recorded payment(s) will be permanently removed.
        </Alert>
      </Modal>
    </div>
  )
}
