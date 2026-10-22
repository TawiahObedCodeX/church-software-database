import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarClock, Trash2 } from 'lucide-react'
import { Input, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { ProgressBar } from '../ui/ProgressBar'
import { PledgeProgressChart } from './PledgeProgressChart'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format'
import {
  PAYMENT_METHODS,
  getContributionProgress,
  getPaymentTimeline,
  toISODate,
} from '../../utils/contributions'

/**
 * Record one installment against a contribution.
 *
 * For goal-based types the amount is capped at the outstanding balance so
 * a member can never pay more than the target, and a quick-fill button
 * lets the admin settle the remainder in one click.
 */
export function PaymentForm({
  contribution,
  onSubmit,
  onDeletePayment,
  submitting = false,
  idPrefix = 'payment',
}) {
  const progress = contribution ? getContributionProgress(contribution) : null
  const today = toISODate()
  const cap = progress?.isGoal && progress.outstanding > 0 ? progress.outstanding : null

  /* Running-total timeline powering the progress graph. Only meaningful
     for goal-based contributions, which are the ones paid in installments. */
  const timeline = useMemo(
    () => (contribution?.id ? getPaymentTimeline(contribution) : []),
    [contribution],
  )

  const schema = z.object({
    amount: z.coerce
      .number({ message: 'Enter a valid amount' })
      .positive('Amount must be greater than zero')
      .refine((value) => value <= 100000000, 'That amount looks too large'),
    date: z.string().min(1, 'Select the payment date'),
    method: z.enum(PAYMENT_METHODS, { message: 'Select a payment method' }),
    reference: z.string().trim().max(40, 'Reference is too long').optional().or(z.literal('')),
    note: z.string().trim().max(200, 'Note is too long').optional().or(z.literal('')),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', date: today, method: contribution?.method ?? '', reference: '', note: '' },
  })

  /* Reset the form whenever a different contribution is targeted. */
  useEffect(() => {
    reset({
      amount: '',
      date: today,
      method: contribution?.method ?? '',
      reference: '',
      note: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contribution?.id])

  if (!contribution || !progress) return null

  return (
    <div className="space-y-5">
      {/* ---- Current position ---- */}
      <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {contribution.description}
            </p>
            <p className="text-xs text-ink-500">
              {contribution.type} &middot; {contribution.id}
            </p>
          </div>
          {progress.isGoal ? (
            <span className="tabular rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-ink-200 ring-inset">
              {Math.round(progress.progress)}% complete
            </span>
          ) : null}
        </div>

        <ProgressBar value={progress.progress} size="md" className="mt-3" />

        <dl className="tabular mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-ink-400">Paid so far</dt>
            <dd className="font-semibold text-jade-600">{formatCurrency(progress.paid)}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Target</dt>
            <dd className="font-semibold text-ink-800">
              {progress.isGoal ? formatCurrency(progress.target) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Remaining</dt>
            <dd className="font-semibold text-amber-600">
              {progress.isGoal ? formatCurrency(progress.outstanding) : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {progress.isSettled ? (
        <Alert tone="success" title="This contribution is fully settled">
          No further payment is needed. You can still review the history below.
        </Alert>
      ) : (
        <div className="rounded-xl border border-navy-100 bg-navy-50/60 px-3.5 py-2.5">
          <p className="text-xs text-navy-800">
            <CalendarClock className="mr-1.5 -mt-0.5 inline size-3.5" aria-hidden="true" />
            Part-paid pledges stay open, so{' '}
            <strong>{formatCurrency(progress.outstanding)}</strong> can still be paid down in as
            many installments as the member needs.
          </p>
        </div>
      )}

      {/* ---- Progress graph for this pledge ---- */}
      {progress.isGoal && timeline.length ? (
        <PledgeProgressChart timeline={timeline} target={progress.target} />
      ) : null}

      {/* ---- New installment ---- */}
      <form id={`${idPrefix}-form`} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount received"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="e.g. 500"
            required
            error={errors.amount?.message}
            hint={
              cap
                ? `Maximum ${formatCurrency(cap)} to complete this target.`
                : undefined
            }
            {...register('amount')}
          />

          <Input
            label="Date received"
            type="date"
            required
            max={today}
            error={errors.date?.message}
            {...register('date')}
          />
        </div>

        {cap ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue('amount', String(cap), { shouldValidate: true })}
          >
            Fill remaining {formatCurrency(cap)}
          </Button>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Payment method" required error={errors.method?.message} {...register('method')}>
            <option value="">Select method…</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>

          <Input
            label="Reference (optional)"
            placeholder="e.g. MM-4402"
            error={errors.reference?.message}
            {...register('reference')}
          />
        </div>

        <Input
          label="Note (optional)"
          placeholder="e.g. Second installment after harvest"
          error={errors.note?.message}
          {...register('note')}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Saving…' : 'Record payment'}
        </Button>
      </form>

      {/* ---- Existing installments ---- */}
      {contribution.payments?.length ? (
        <div className="border-t border-ink-100 pt-4">
          <h3 className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
            Payment history ({contribution.payments.length})
          </h3>

          <ul className="mt-2 divide-y divide-ink-100">
            {[...contribution.payments]
              /* Newest first, using the exact time so same-day entries sort right. */
              .sort((a, b) => {
                const left = new Date(a.timestamp ?? a.date).getTime() || 0
                const right = new Date(b.timestamp ?? b.date).getTime() || 0
                return right - left
              })
              .map((payment) => (
                <li key={payment.id} className="flex items-start gap-3 py-3">
                  {/* Date block: the day is the anchor, month + time sit under it. */}
                  <div className="w-14 shrink-0 text-center">
                    <p className="tabular text-lg leading-none font-semibold text-ink-900">
                      {new Date(payment.timestamp ?? payment.date).getDate() || '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                      {formatDate(payment.date, { withYear: false })}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="tabular text-sm font-semibold text-ink-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {formatDateTime(payment.timestamp ?? payment.date)} &middot;{' '}
                      {payment.method ?? contribution.method}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-400">
                      {payment.id}
                      {payment.reference ? ` · ${payment.reference}` : ''}
                      {payment.note ? ` · ${payment.note}` : ''}
                    </p>
                  </div>

                  {onDeletePayment ? (
                    <Button
                      variant="danger-ghost"
                      size="icon"
                      onClick={() => onDeletePayment(payment.id)}
                      aria-label={`Remove payment of ${formatCurrency(payment.amount)}`}
                      title="Remove this payment"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <p className="border-t border-ink-100 pt-4 text-xs text-ink-400">
          No installments recorded yet.
        </p>
      )}
    </div>
  )
}
