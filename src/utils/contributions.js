/**
 * Central domain constants + pure calculation helpers.
 *
 * The whole app is frontend-only, so these functions are the "business
 * rules" layer. Keeping them pure means utils/stats.js and the export
 * utilities can reuse them without touching React.
 */

/** Pastoral / record-keeping categories a member can belong to. */
export const MEMBER_CATEGORIES = [
  'Member',
  'New Convert',
  'Youth',
  'Worker',
  'Leader',
  'Visitor',
]

/** Contribution types the church collects. */
export const CONTRIBUTION_TYPES = [
  'Offering',
  'Tithe',
  'Pledge',
  'Donation',
  'Fundraising',
  'Building Fund',
  'Missions',
  'Welfare',
]

/**
 * Contribution types that are goal-based. These support a target amount
 * and are paid in installments until the target is reached.
 */
export const PLEDGE_TYPES = ['Pledge', 'Fundraising', 'Building Fund', 'Missions']

/** How the money physically arrived. */
export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Mobile Money',
  'Cheque',
  'Card',
]

/** Lifecycle of a single contribution record. */
export const CONTRIBUTION_STATUSES = ['Pending', 'Partially Paid', 'Completed']

/** Lifecycle of a member record. */
export const MEMBER_STATUSES = ['Active', 'Inactive']

/** Currency the demo is priced in. Change here to reprice the whole UI. */
export const CURRENCY = {
  code: 'GHS',
  symbol: 'GH₵',
  label: 'Ghana Cedi',
}

/** Round to 2dp so floating point never leaks into a total. */
export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

/** True when the contribution type tracks a target + installments. */
export function isPledgeType(type) {
  return PLEDGE_TYPES.includes(type)
}

/**
 * Sum a list of payment amounts.
 * @param {Array<{amount:number}>} payments
 */
export function sumPayments(payments = []) {
  return round2(payments.reduce((total, p) => total + (Number(p?.amount) || 0), 0))
}

/**
 * Derive one contribution's money position.
 *
 * For goal-based types this answers the admin's core question:
 * "how much has this member paid so far, and what is still outstanding?"
 *
 * @param {{type:string, targetAmount?:number|null, payments?:Array<{amount:number}>}} contribution
 * @returns {{
 *   paid:number, target:number|null, outstanding:number|null,
 *   progress:number, status:string, isGoal:boolean, isSettled:boolean
 * }}
 */
export function getContributionProgress(contribution) {
  const paid = sumPayments(contribution?.payments)
  const isGoal = isPledgeType(contribution?.type)

  // Non-goal types (offering, tithe, donation) are settled as soon as
  // anything is received - there is no target to chase.
  if (!isGoal) {
    return {
      paid,
      target: null,
      outstanding: null,
      progress: paid > 0 ? 100 : 0,
      status: paid > 0 ? 'Completed' : 'Pending',
      isGoal: false,
      isSettled: paid > 0,
    }
  }

  const target = round2(Number(contribution?.targetAmount) || 0)
  const outstanding = round2(Math.max(target - paid, 0))
  const progress = target > 0 ? Math.min((paid / target) * 100, 100) : 0

  let status = 'Pending'
  if (paid > 0 && outstanding > 0) status = 'Partially Paid'
  if (paid > 0 && outstanding === 0) status = 'Completed'

  return {
    paid,
    target,
    outstanding,
    progress,
    status,
    isGoal: true,
    isSettled: paid > 0 && outstanding === 0,
  }
}

/**
 * Roll every contribution up to the member level so the admin can see
 * "who still owes what" in one row.
 *
 * @param {Array} contributions all contributions in the system
 * @param {string} memberId
 */
export function getMemberFinancials(contributions, memberId) {
  const mine = contributions.filter((c) => c.memberId === memberId)

  const totals = mine.reduce(
    (acc, contribution) => {
      const { paid, target, outstanding, isGoal } = getContributionProgress(contribution)

      acc.paid = round2(acc.paid + paid)
      if (isGoal) {
        acc.pledged = round2(acc.pledged + (target || 0))
        acc.outstanding = round2(acc.outstanding + (outstanding || 0))
        if (outstanding === 0 && paid > 0) acc.completedGoals += 1
        else if (paid > 0) acc.activeGoals += 1
        else acc.pendingGoals += 1
      }
      return acc
    },
    { paid: 0, pledged: 0, outstanding: 0, completedGoals: 0, activeGoals: 0, pendingGoals: 0 },
  )

  return {
    ...totals,
    contributions: mine.length,
    completionRate:
      totals.pledged > 0 ? Math.round((totals.paid / totals.pledged) * 100) : 100,
  }
}

/**
 * Merge one member's installments across all their contributions into a
 * single oldest-first timeline.
 *
 * This is what the member profile graph plots: "everything this member
 * has given, in the order they gave it", regardless of which campaign
 * each gift belonged to. `pledgeCumulative` climbs only with money that
 * went towards a pledge, which is what the pledged line is measured
 * against.
 *
 * @param {Array} memberContributions contributions belonging to one member
 */
export function getMemberTimeline(memberContributions = []) {
  const rows = []

  for (const contribution of memberContributions) {
    const isGoal = isPledgeType(contribution?.type)

    for (const payment of contribution?.payments ?? []) {
      rows.push({
        id: payment?.id ?? '',
        contributionId: contribution?.id ?? '',
        type: contribution?.type ?? '',
        description: contribution?.description ?? '',
        date: toISODate(payment?.timestamp ?? payment?.date),
        timestamp: payment?.timestamp ?? '',
        monthKey: monthKeyOf(payment?.timestamp ?? payment?.date),
        amount: round2(Number(payment?.amount) || 0),
        method: payment?.method ?? contribution?.method ?? '',
        isGoal,
      })
    }
  }

  rows.sort((a, b) => {
    const left = new Date(a.timestamp || a.date).getTime() || 0
    const right = new Date(b.timestamp || b.date).getTime() || 0
    if (left !== right) return left - right
    return String(a.id).localeCompare(String(b.id))
  })

  let cumulative = 0
  let pledgeCumulative = 0

  return rows.map((row) => {
    cumulative = round2(cumulative + row.amount)
    if (row.isGoal) pledgeCumulative = round2(pledgeCumulative + row.amount)

    return {
      ...row,
      cumulative,
      pledgeCumulative,
    }
  })
}

/**
 * One member's giving grouped by calendar month, oldest first.
 *
 * The profile chart uses this to show "how much did they give in each
 * month" without collapsing the whole history into a single number.
 *
 * @param {Array} memberContributions contributions belonging to one member
 * @param {number} months how many of the most recent months to keep
 */
export function getMemberMonthlyGiving(memberContributions = [], months = 12) {
  const buckets = new Map()

  for (const contribution of memberContributions) {
    for (const payment of contribution?.payments ?? []) {
      const key = monthKeyOf(payment?.timestamp ?? payment?.date)
      if (!key) continue

      const current =
        buckets.get(key) ?? { key, total: 0, count: 0, pledge: 0, oneOff: 0 }
      const amount = Number(payment?.amount) || 0

      current.total = round2(current.total + amount)
      current.count += 1
      if (isPledgeType(contribution?.type)) current.pledge = round2(current.pledge + amount)
      else current.oneOff = round2(current.oneOff + amount)

      buckets.set(key, current)
    }
  }

  const keys = [...buckets.keys()].sort()
  if (!keys.length) return []

  /* Walk a continuous range so quiet months appear as gaps rather than
     being silently skipped, which would misrepresent the member's pace. */
  const [startYear, startMonth] = keys[0].split('-').map(Number)
  const [endYear, endMonth] = keys[keys.length - 1].split('-').map(Number)

  const out = []
  const cursor = new Date(startYear, startMonth - 1, 1)
  const end = new Date(endYear, endMonth - 1, 1)

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    out.push(
      buckets.get(key) ?? { key, total: 0, count: 0, pledge: 0, oneOff: 0 },
    )
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return out.slice(-months)
}

/**
 * Roll one member's goals into a single "in progress" view: how much they
 * have pledged in total versus how much of it they have cleared.
 *
 * Used by the profile's second chart so the member sees one overall
 * position rather than having to add up several pledges themselves.
 */
export function getMemberGoalPosition(memberContributions = []) {
  let pledged = 0
  let paid = 0
  let openGoals = 0
  let settledGoals = 0

  for (const contribution of memberContributions) {
    const progress = getContributionProgress(contribution)
    if (!progress.isGoal) continue

    pledged = round2(pledged + (progress.target || 0))
    paid = round2(paid + progress.paid)

    if (progress.isSettled) settledGoals += 1
    else openGoals += 1
  }

  return {
    pledged,
    paid,
    outstanding: round2(Math.max(pledged - paid, 0)),
    openGoals,
    settledGoals,
    percent: pledged > 0 ? Math.min(Math.round((paid / pledged) * 100), 100) : 100,
  }
}

/** Normalise any free-text date into an ISO yyyy-mm-dd string. */
export function toISODate(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * Build the full ISO timestamp for a payment: the calendar date the
 * admin chose, combined with the wall-clock time it was actually entered.
 *
 * This is what lets the UI say "24 Oct 2026 at 14:32" instead of just
 * "24 Oct 2026", and lets the month/period charts group correctly even
 * when the admin back-dates an entry.
 *
 * @param {string} dateStr  yyyy-mm-dd chosen in the form
 * @param {Date}   [when]   moment of entry; defaults to now
 */
export function toPaymentTimestamp(dateStr, when = new Date()) {
  const iso = toISODate(dateStr)
  if (!iso) return when.toISOString()

  const [year, month, day] = iso.split('-').map(Number)

  /* Keep the entry's time-of-day, but pin the admin's calendar date.
     Falls back to noon if the picked date is in the future, so a
     time-only stamp can never claim to be later than "now". */
  const picked = new Date(year, month - 1, day, when.getHours(), when.getMinutes(), when.getSeconds())
  if (picked.getTime() > when.getTime()) {
    return new Date(year, month - 1, day, 12, 0, 0).toISOString()
  }
  return picked.toISOString()

}

/** "2026-10" month key used for grouping payments into periods. */
export function monthKeyOf(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Sort a list of records by a date-ish key without mutating the input. */
export function sortByDateDesc(list = [], key = 'date') {
  return [...list].sort((a, b) => (a?.[key] < b?.[key] ? 1 : a?.[key] > b?.[key] ? -1 : 0))
}

/**
 * Build the running-total timeline for one goal-based contribution.
 *
 * This is the data behind the "progress" graph in the payment modal:
 * each point is a moment money landed, and `cumulative` is how much had
 * been paid by then. The target is repeated on every point so the chart
 * can draw a flat goal line for the admin to compare against.
 *
 * Points are ordered oldest-first -- the natural reading order for a
 * progress chart -- while the raw `payments` list stays newest-first.
 *
 * @param {{type:string, targetAmount?:number|null, payments?:Array}} contribution
 * @returns {Array<{
 *   id:string, date:string, timestamp:string, monthKey:string,
 *   amount:number, cumulative:number, remaining:number,
 *   progress:number, target:number|null, method:string
 * }>}
 */
export function getPaymentTimeline(contribution) {
  const { target } = getContributionProgress(contribution)

  const ordered = [...(contribution?.payments ?? [])].sort((a, b) => {
    const left = new Date(a?.timestamp ?? a?.date).getTime() || 0
    const right = new Date(b?.timestamp ?? b?.date).getTime() || 0
    if (left !== right) return left - right
    /* Same instant (e.g. two entries in one minute): fall back to id so
       the running total stays stable across renders. */
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
  })

  let cumulative = 0
  return ordered.map((payment) => {
    const amount = round2(Number(payment?.amount) || 0)
    cumulative = round2(cumulative + amount)

    return {
      id: payment?.id ?? '',
      date: toISODate(payment?.timestamp ?? payment?.date),
      timestamp: payment?.timestamp ?? '',
      monthKey: monthKeyOf(payment?.timestamp ?? payment?.date),
      amount,
      cumulative,
      remaining: target ? round2(Math.max(target - cumulative, 0)) : 0,
      progress: target ? Math.min(Math.round((cumulative / target) * 100), 100) : 100,
      target: target || null,
      method: payment?.method ?? contribution?.method ?? '',
    }
  })
}
