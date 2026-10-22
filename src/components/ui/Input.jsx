import { Search } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Shared form input. Falls back to a plain input when no icon is given. */
export function Input({ label, error, hint, icon: Icon, className, id, ...props }) {
  const inputId = id ?? props.name

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
          {label}
          {props.required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        ) : null}

        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-xs transition',
            'placeholder:text-ink-400',
            'focus:border-church-500 focus:ring-2 focus:ring-church-500/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
            Icon && 'pl-9.5',
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-ink-200',
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

/** Textarea variant sharing the Input styling. */
export function TextArea({ label, error, hint, className, id, ...props }) {
  const inputId = id ?? props.name

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
          {label}
        </label>
      ) : null}

      <textarea
        id={inputId}
        rows={3}
        className={cn(
          'w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-xs transition',
          'placeholder:text-ink-400 focus:border-church-500 focus:ring-2 focus:ring-church-500/20 focus:outline-none',
          error ? 'border-rose-400' : 'border-ink-200',
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />

      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

/** Styled native select - keeps a real <select> for accessibility. */
export function Select({ label, error, hint, options = [], className, id, children, ...props }) {
  const inputId = id ?? props.name

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
          {label}
          {props.required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}

      <select
        id={inputId}
        className={cn(
          'w-full appearance-none rounded-xl border bg-white bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat px-3.5 py-2.5 pr-10 text-sm text-ink-900 shadow-xs transition',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          'focus:border-church-500 focus:ring-2 focus:ring-church-500/20 focus:outline-none',
          error ? 'border-rose-400' : 'border-ink-200',
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children ??
          options.map((option) => {
            const value = typeof option === 'string' ? option : option.value
            const labelText = typeof option === 'string' ? option : option.label
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            )
          })}
      </select>

      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

/** Search box used in table toolbars. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pr-3.5 pl-9.5 text-sm shadow-xs transition placeholder:text-ink-400 focus:border-church-500 focus:ring-2 focus:ring-church-500/20 focus:outline-none"
      />
    </div>
  )
}
