import { Select } from '../ui/Input'
import { Alert } from '../ui/Alert'
import { Input, TextArea } from '../ui/Input'
import {
  CONTRIBUTION_TYPES,
  PAYMENT_METHODS,
  isPledgeType,
} from '../../utils/contributions'
import { formatCurrency } from '../../utils/format'

/**
 * Contribution form.
 *
 * The target amount field only appears for goal-based types (pledge,
 * fundraising, building fund, missions) - that is the whole point of the
 * "pay bit by bit until the target is complete" workflow.
 */
export function ContributionForm({ register, errors, watch, members, idPrefix = 'contribution' }) {
  const type = watch('type')
  const memberId = watch('memberId')
  const target = watch('targetAmount')
  const isGoal = isPledgeType(type)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form className="space-y-5" id={`${idPrefix}-form`} noValidate>
      {Object.keys(errors).length > 0 ? (
        <Alert tone="danger" title="Please fix the highlighted fields">
          Some details are missing or invalid.
        </Alert>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
          Who and what
        </legend>

        <Select
          label="Member"
          required
          error={errors.memberId?.message}
          {...register('memberId')}
        >
          <option value="">Select a member…</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName} ({member.id})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Contribution type" required error={errors.type?.message} {...register('type')}>
            <option value="">Select type…</option>
            {CONTRIBUTION_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          <Select
            label="Payment method"
            required
            error={errors.method?.message}
            {...register('method')}
          >
            <option value="">Select method…</option>
            {PAYMENT_METHODS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label={isGoal ? 'Campaign / purpose' : 'Description'}
          placeholder={
            isGoal ? 'e.g. New Sanctuary Project' : 'e.g. Sunday Service Offering'
          }
          required
          error={errors.description?.message}
          {...register('description')}
        />
      </fieldset>

      {/* ---- Goal configuration ---- */}
      <fieldset className="space-y-4 border-t border-ink-100 pt-4">
        <legend className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
          Amount
        </legend>

        {isGoal ? (
          <>
            <Input
              label="Target amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              placeholder="e.g. 4000"
              required
              error={errors.targetAmount?.message}
              hint="The member pays towards this in installments until it is fully settled."
              {...register('targetAmount')}
            />

            <Input
              label="First installment (optional)"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="e.g. 500"
              error={errors.firstPayment?.message}
              hint="Leave blank if nothing has been paid yet."
              {...register('firstPayment')}
            />

            {Number(target) > 0 ? (
              <p className="rounded-xl bg-navy-50 px-3.5 py-2.5 text-xs text-church-800">
                Target set at <strong>{formatCurrency(Number(target))}</strong>. The admin
                dashboard will track the balance remaining after each payment.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Input
              label="Amount received"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="e.g. 250"
              required
              error={errors.firstPayment?.message}
              hint={`${type || 'This type'} has no target - it is settled as soon as the amount is recorded.`}
              {...register('firstPayment')}
            />
            <input type="hidden" value="" {...register('targetAmount')} />
          </>
        )}

        <Input
          label="Date received"
          type="date"
          required
          max={today}
          error={errors.date?.message}
          {...register('date')}
        />

        <TextArea
          label="Note"
          placeholder="Anything worth remembering about this gift…"
          error={errors.note?.message}
          {...register('note')}
        />

        {memberId ? null : (
          <p className="text-xs text-ink-400">
            Tip: pick the member first so the record is attributed correctly.
          </p>
        )}
      </fieldset>
    </form>
  )
}
