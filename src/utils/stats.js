/**
 * Derivation layer: turns the raw member/contribution lists into every
 * number the dashboard, tables and CSV exports need.
 *
 * Pure functions only - no React, no side effects - so they are cheap to
 * call inside useMemo.
 */

import {
  CONTRIBUTION_TYPES,
  PLEDGE_TYPES,
  getContributionProgress,
  getMemberFinancials,
  monthKeyOf,
  round2,
  toISODate,
} from './contributions'
import { formatMonthShort } from './format'

const MONTHS_BACK = 6

/** Top-line numbers for the dashboard stat cards. */
export function getSummary(members, contributions) {
  let totalReceived = 0
  let totalPledged = 0
  let totalOutstanding = 0
  let completedPledges = 0
  let activePledges = 0
  let pendingPledges = 0
  let paymentCount = 0
  let oneOffReceived = 0
  // Money that belongs to a goal: a target exists and can be outstanding.
  let goalReceived = 0
  let goalPledged = 0

  for (const contribution of contributions) {
    const progress = getContributionProgress(contribution)
    totalReceived = round2(totalReceived + progress.paid)

    if (progress.isGoal) {
      goalReceived = round2(goalReceived + progress.paid)
      goalPledged = round2(goalPledged + (progress.target || 0))
      totalPledged = round2(totalPledged + (progress.target || 0))
      totalOutstanding = round2(totalOutstanding + (progress.outstanding || 0))

      if (progress.status === 'Completed') completedPledges += 1
      else if (progress.status === 'Partially Paid') activePledges += 1
      else pendingPledges += 1
    } else {
      oneOffReceived = round2(oneOffReceived + progress.paid)
    }

    paymentCount += contribution.payments?.length ?? 0
  }

  /* Collection rate compares money received against money pledged, so it
     must only use goal-based figures - otherwise one-off offerings would
     inflate it above 100%. */
  const collectionRate = goalPledged > 0 ? Math.round((goalReceived / goalPledged) * 100) : 0

  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'Active').length,
    totalContributions: contributions.length,
    totalReceived,
    totalPledged,
    totalOutstanding,
    goalReceived,
    goalPledged,
    oneOffReceived,
    collectionRate,
    completedPledges,
    activePledges,
    pendingPledges,
    paymentCount,
    averageGift: paymentCount > 0 ? round2(totalReceived / paymentCount) : 0,
  }
}

/**
 * Income per month for the last MONTHS_BACK months, split into received
 * vs outstanding so the dashboard can show a stacked bar chart.
 *
 * Months with no activity are still emitted with zeros so the chart axis
 * stays continuous.
 */
export function getMonthlyTrend(contributions, months = MONTHS_BACK) {
  const now = new Date()
  const buckets = new Map()

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, {
      key,
      label: formatMonthShort(date),
      received: 0,
      pledged: 0,
      paymentCount: 0,
    })
  }

  for (const contribution of contributions) {
    for (const payment of contribution.payments ?? []) {
      const key = monthKeyOf(payment.timestamp ?? payment.date)
      const bucket = buckets.get(key)
      if (!bucket) continue
      bucket.received = round2(bucket.received + (Number(payment.amount) || 0))
      bucket.paymentCount += 1
    }

    if (contribution.date) {
      const key = toISODate(contribution.date).slice(0, 7)
      const bucket = buckets.get(key)
      const progress = getContributionProgress(contribution)
      if (bucket && progress.isGoal) {
        bucket.pledged = round2(bucket.pledged + (progress.target || 0))
      }
    }
  }

  return [...buckets.values()].map((b) => ({
    ...b,
    received: round2(b.received),
  }))
}

/** Totals grouped by contribution type - feeds the donut chart. */
export function getTypeBreakdown(contributions) {
  const totals = new Map(CONTRIBUTION_TYPES.map((type) => [type, 0]))

  for (const contribution of contributions) {
    const { paid } = getContributionProgress(contribution)
    totals.set(contribution.type, round2((totals.get(contribution.type) ?? 0) + paid))
  }

  const rows = [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)

  const total = rows.reduce((sum, row) => sum + row.value, 0)

  return rows.map((row) => ({
    ...row,
    share: total > 0 ? Math.round((row.value / total) * 100) : 0,
  }))
}

/**
 * Campaign-level rollup for pledges / fundraising / building fund.
 * The admin uses this to see "how far along is each project".
 */
export function getCampaignProgress(contributions, members) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const campaigns = new Map()

  for (const contribution of contributions) {
    const progress = getContributionProgress(contribution)
    if (!progress.isGoal) continue

    const key = contribution.description || contribution.type
    const existing = campaigns.get(key) ?? {
      id: key,
      name: key,
      type: contribution.type,
      target: 0,
      received: 0,
      outstanding: 0,
      contributors: new Set(),
      completed: 0,
      total: 0,
      startDate: contribution.date,
    }

    existing.target = round2(existing.target + (progress.target || 0))
    existing.received = round2(existing.received + progress.paid)
    existing.outstanding = round2(existing.outstanding + (progress.outstanding || 0))
    existing.total += 1
    if (progress.status === 'Completed') existing.completed += 1
    if (progress.paid > 0) existing.contributors.add(contribution.memberId)
    if (contribution.date < existing.startDate) existing.startDate = contribution.date

    campaigns.set(key, existing)
  }

  return [...campaigns.values()]
    .map((campaign) => ({
      ...campaign,
      contributorCount: campaign.contributors.size,
      memberNames: [...campaign.contributors]
        .map((id) => byId.get(id)?.fullName)
        .filter(Boolean),
      progress:
        campaign.target > 0
          ? Math.min(Math.round((campaign.received / campaign.target) * 100), 100)
          : 0,
    }))
    .sort((a, b) => b.target - a.target)
}

/**
 * The most recent individual payments across all contributions - the
 * dashboard activity feed.
 */
export function getRecentPayments(contributions, members, limit = 6) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const rows = []

  for (const contribution of contributions) {
    for (const payment of contribution.payments ?? []) {
      rows.push({
        id: payment.id,
        date: payment.date,
        amount: Number(payment.amount) || 0,
        method: payment.method ?? contribution.method,
        type: contribution.type,
        description: contribution.description,
        memberId: contribution.memberId,
        memberName: byId.get(contribution.memberId)?.fullName ?? 'Unknown member',
      })
    }
  }

  return rows
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
}

/**
 * Members ranked by outstanding balance - "who owes the most".
 * Only counts members who actually have an open pledge.
 */
export function getOutstandingMembers(members, contributions, limit = 5) {
  return members
    .map((member) => ({ member, fin: getMemberFinancials(contributions, member.id) }))
    .filter(({ fin }) => fin.outstanding > 0)
    .sort((a, b) => b.fin.outstanding - a.fin.outstanding)
    .slice(0, limit)
}

/**
 * Portfolio-wide collection pace.
 *
 * Answers "are we closing the gap on what was pledged?" by building a
 * cumulative series of money collected over time, with the total pledged
 * drawn as a flat reference line. Watching the collected line climb
 * towards the pledged line is the whole point of the admin dashboard.
 *
 * Uses the last N months that actually contain payments, so the chart is
 * never padded with empty history. Falls back to a single point when
 * there are no payments yet.
 *
 * @param {Array} contributions
 * @param {number} months how many recent months to include
 */
export function getCollectionPace(contributions, months = MONTHS_BACK) {
  const now = new Date()

  /* Total pledged across every goal-based contribution. */
  let totalPledged = 0
  for (const contribution of contributions) {
    const progress = getContributionProgress(contribution)
    if (progress.isGoal) totalPledged = round2(totalPledged + (progress.target || 0))
  }

  /* Collect every pledge payment into its month bucket.
     Deliberately goal-based only: this chart is "how much of what was
     pledged has been collected", so counting one-off giving (offerings,
     tithes) would push the collected line past the pledged ceiling and
     make the percentages meaningless. */
  const paidByMonth = new Map()
  let allTimePaid = 0

  for (const contribution of contributions) {
    if (!getContributionProgress(contribution).isGoal) continue

    for (const payment of contribution.payments ?? []) {
      const key = monthKeyOf(payment.timestamp ?? payment.date)
      if (!key) continue
      const amount = Number(payment.amount) || 0
      allTimePaid = round2(allTimePaid + amount)
      paidByMonth.set(key, round2((paidByMonth.get(key) ?? 0) + amount))
    }
  }

  const keys = [...paidByMonth.keys()].sort()

  /* Nothing paid yet: a single flat point keeps the chart from collapsing. */
  if (!keys.length) {
    const label = formatMonthShort(now)
    return {
      totalPledged,
      totalReceived: 0,
      points: [{ key: '', label, collected: 0, pledged: totalPledged, gap: totalPledged }],
    }
  }

  /* Walk a continuous month range from the earliest payment to *now*, so
     quiet months still show as flat stretches rather than being skipped. */
  const [firstYear, firstMonth] = keys[0].split('-').map(Number)
  const start = new Date(firstYear, firstMonth - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  const points = []
  let running = 0
  const cursor = new Date(start)

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const inMonth = paidByMonth.get(key) ?? 0

    /* Anything paid before the window is carried in as the opening balance. */
    if (key === keys[0]) running = 0
    running = round2(running + inMonth)

    points.push({
      key,
      label: formatMonthShort(cursor),
      collected: running,
      pledged: totalPledged,
      gap: round2(Math.max(totalPledged - running, 0)),
      monthAmount: inMonth,
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  /* Keep the chart readable - trim to the most recent `months`. */
  return {
    totalPledged,
    totalReceived: allTimePaid,
    points: points.slice(-months),
  }
}

/** Everything the dashboard needs, computed in one pass. */
export function getDashboardData(members, contributions) {
  return {
    summary: getSummary(members, contributions),
    trend: getMonthlyTrend(contributions),
    breakdown: getTypeBreakdown(contributions),
    campaigns: getCampaignProgress(contributions, members),
    recent: getRecentPayments(contributions, members),
    topOutstanding: getOutstandingMembers(members, contributions),
    pace: getCollectionPace(contributions),
  }
}

/** How many members have at least one unsettled pledge. */
export function getMembersInArrears(members, contributions) {
  return members.filter((member) => getMemberFinancials(contributions, member.id).outstanding > 0)
    .length
}

export { PLEDGE_TYPES }
