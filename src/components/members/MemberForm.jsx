import { Alert } from '../ui/Alert'
import { Input, Select, TextArea } from '../ui/Input'
import { MEMBER_CATEGORIES, MEMBER_STATUSES } from '../../utils/contributions'
import { formatDate } from '../../utils/format'

/**
 * Member form driven by the parent's useForm instance.
 *
 * Kept presentational: it receives `register`, `errors` and `mode` so the
 * same component serves both "register" and "edit".
 */
export function MemberForm({ register, errors, mode = 'create', idPrefix = 'member' }) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form className="space-y-5" id={`${idPrefix}-form`} noValidate>
      {Object.keys(errors).length > 0 ? (
        <Alert tone="danger" title="Please fix the highlighted fields">
          Some details are missing or invalid.
        </Alert>
      ) : null}

      {/* ---- Personal details ---- */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
          Personal details
        </legend>

        <Input
          label="Full name"
          placeholder="e.g. Kwame Mensah"
          required
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone number"
            type="tel"
            placeholder="+233 24 000 0000"
            required
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Email address"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Gender" required error={errors.gender?.message} {...register('gender')}>
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>

          <Select
            label="Category"
            required
            error={errors.category?.message}
            {...register('category')}
          >
            <option value="">Select…</option>
            {MEMBER_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

          <Input
            label="Join date"
            type="date"
            required
            max={today}
            error={errors.joinDate?.message}
            {...register('joinDate')}
          />
        </div>

        <Input
          label="Home address"
          placeholder="e.g. 12 Ring Road, Accra"
          error={errors.address?.message}
          {...register('address')}
        />
      </fieldset>

      {/* ---- Record keeping ---- */}
      <fieldset className="space-y-4 border-t border-ink-100 pt-4">
        <legend className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
          Record keeping
        </legend>

        <Select label="Status" error={errors.status?.message} {...register('status')}>
          {MEMBER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        <TextArea
          label="Notes"
          placeholder="Ministry involvement, pastoral notes…"
          error={errors.notes?.message}
          {...register('notes')}
        />

        {mode === 'edit' ? (
          <p className="text-xs text-ink-500">
            Registered on {formatDate(new Date())} &middot; changing the status to Inactive keeps
            their giving history.
          </p>
        ) : null}
      </fieldset>
    </form>
  )
}
