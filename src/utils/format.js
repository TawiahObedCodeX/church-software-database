import { CURRENCY } from './contributions'

/** Format a number as currency, e.g. 1250 -> "GH₵1,250.00". */
export function formatCurrency(value, { compact = false } = {}) {
  const amount = Number(value) || 0

  if (compact && Math.abs(amount) >= 1000) {
    return `${CURRENCY.symbol}${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
  }

  return `${CURRENCY.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Format a plain count, e.g. 1234 -> "1,234". */
export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('en-US')
}

/** Percentage with a single decimal, e.g. 66.66 -> "66.7%". */
export function formatPercent(value, digits = 1) {
  return `${(Number(value) || 0).toFixed(digits)}%`
}

/** "2026-10-22" -> "22 Oct 2026". */
export function formatDate(value, { withYear = true } = {}) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

/** Short month label for chart axes, e.g. "Oct". */
export function formatMonthShort(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { month: 'short' })
}

/** "2026-10" -> "October 2026". */
export function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(date.getTime())) return monthKey
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** Truncate long strings so table cells stay on one line. */
export function truncate(value, max = 32) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Initials for avatars, e.g. "Kwame Mensah" -> "KM". */
export function initialsOf(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** "2026-10-22" -> "22 Oct 2026 at 09:30". */
export function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${formatDate(date)} at ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}
