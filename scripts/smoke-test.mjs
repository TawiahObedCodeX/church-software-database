/**
 * Smoke test for the calculation + CSV layer.
 *
 * Run with: node scripts/smoke-test.mjs
 * Kept dependency-free so it can run in CI without a test framework.
 */

import assert from 'node:assert/strict'
import { seedMembers, seedContributions } from '../src/data/mockData.js'
import {
  getContributionProgress,
  getMemberFinancials,
  getMemberGoalPosition,
  getMemberMonthlyGiving,
  getMemberTimeline,
  getPaymentTimeline,
  sumPayments,
  isPledgeType,
  monthKeyOf,
  toISODate,
  toPaymentTimestamp,
} from '../src/utils/contributions.js'
import {
  getSummary,
  getTypeBreakdown,
  getCampaignProgress,
  getMonthlyTrend,
  getCollectionPace,
} from '../src/utils/stats.js'
import { escapeCell, toCSV } from '../src/utils/csvUtils.js'

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ok  ${name}`)
  } catch (error) {
    console.error(`FAIL  ${name}\n      ${error.message}`)
    process.exitCode = 1
  }
}

console.log('\nContribution math')

test('one-off offering is settled once paid', () => {
  const offering = seedContributions.find((c) => c.type === 'Offering')
  const progress = getContributionProgress(offering)
  assert.equal(progress.isGoal, false)
  assert.equal(progress.status, 'Completed')
  assert.ok(progress.paid > 0)
})

test('goal types are detected', () => {
  assert.equal(isPledgeType('Fundraising'), true)
  assert.equal(isPledgeType('Building Fund'), true)
  assert.equal(isPledgeType('Offering'), false)
  assert.equal(isPledgeType('Tithe'), false)
})

test('sumPayments adds installments exactly', () => {
  const payments = [{ amount: 0.1 }, { amount: 0.2 }]
  assert.equal(sumPayments(payments), 0.3)
})

test('fully paid pledge reports zero outstanding and Completed', () => {
  // CON-004: 1500 target, one 1500 payment.
  const completed = seedContributions.find((c) => c.id === 'CON-004')
  const progress = getContributionProgress(completed)
  assert.equal(progress.target, 1500)
  assert.equal(progress.paid, 1500)
  assert.equal(progress.outstanding, 0)
  assert.equal(progress.status, 'Completed')
  assert.equal(progress.progress, 100)
  assert.equal(progress.isSettled, true)
})

test('partially paid pledge reports the correct balance', () => {
  // CON-005: 1200 target, one 300 payment -> 900 outstanding.
  const partial = seedContributions.find((c) => c.id === 'CON-005')
  const progress = getContributionProgress(partial)
  assert.equal(progress.target, 1200)
  assert.equal(progress.paid, 300)
  assert.equal(progress.outstanding, 900)
  assert.equal(progress.status, 'Partially Paid')
  assert.equal(Math.round(progress.progress), 25)
})

test('a pledge with no payments is Pending', () => {
  const progress = getContributionProgress({
    type: 'Pledge',
    targetAmount: 500,
    payments: [],
  })
  assert.equal(progress.status, 'Pending')
  assert.equal(progress.outstanding, 500)
  assert.equal(progress.isSettled, false)
})

test('progress never exceeds 100 even if overpaid', () => {
  const progress = getContributionProgress({
    type: 'Pledge',
    targetAmount: 100,
    payments: [{ amount: 250 }],
  })
  assert.equal(progress.progress, 100)
  assert.equal(progress.outstanding, 0)
})

console.log('\nMember rollup')

test('member financials match their contributions', () => {
  // MEM-001: CON-001 building fund (4000, fully paid) + CON-012 pledge
  // (6000 target, 5000 paid) + CON-023 tithe (900).
  const fin = getMemberFinancials(seedContributions, 'MEM-001')
  assert.equal(fin.pledged, 10000)
  assert.equal(fin.paid, 9900)
  assert.equal(fin.outstanding, 1000)
  assert.equal(fin.completedGoals, 1)
  assert.equal(fin.activeGoals, 1)
  assert.equal(fin.completionRate, 99)
})

test('a member with no contributions has clean zeroes', () => {
  const fin = getMemberFinancials(seedContributions, 'MEM-999')
  assert.equal(fin.paid, 0)
  assert.equal(fin.outstanding, 0)
  assert.equal(fin.contributions, 0)
  assert.equal(fin.completionRate, 100)
})

console.log('\nDashboard aggregates')

const summary = getSummary(seedMembers, seedContributions)
const breakdown = getTypeBreakdown(seedContributions)
const campaigns = getCampaignProgress(seedContributions, seedMembers)
const trend = getMonthlyTrend(seedContributions)

test('outstanding equals goal money pledged minus goal money received', () => {
  assert.equal(
    summary.totalOutstanding,
    Math.round((summary.goalPledged - summary.goalReceived) * 100) / 100,
    'outstanding should equal pledged minus received for goal-based contributions',
  )
})

test('received splits cleanly into goal-based and one-off', () => {
  assert.equal(
    Math.round((summary.goalReceived + summary.oneOffReceived) * 100) / 100,
    summary.totalReceived,
    'goalReceived + oneOffReceived should equal totalReceived',
  )
  assert.ok(summary.oneOffReceived > 0, 'seed data should include one-off giving')
})

test('collection rate reflects pledges only and never exceeds 100', () => {
  assert.ok(summary.collectionRate > 0)
  assert.ok(summary.collectionRate <= 100, `collection rate was ${summary.collectionRate}%`)
  assert.equal(summary.collectionRate, Math.round((summary.goalReceived / summary.goalPledged) * 100))
})

test('breakdown totals equal total received', () => {
  const flat = breakdown.reduce((sum, row) => sum + row.value, 0)
  assert.equal(Math.round(flat * 100) / 100, summary.totalReceived)
})

test('breakdown shares are sorted and sum to ~100', () => {
  const shareTotal = breakdown.reduce((sum, row) => sum + row.share, 0)
  assert.ok(shareTotal >= 99 && shareTotal <= 101, `shares summed to ${shareTotal}`)
  for (let i = 1; i < breakdown.length; i += 1) {
    assert.ok(breakdown[i - 1].value >= breakdown[i].value, 'not sorted descending')
  }
})

test('campaign aggregates only goal-based contributions', () => {
  assert.ok(campaigns.length > 0)
  const names = campaigns.map((c) => c.name)
  assert.ok(names.includes('New Sanctuary Project'))
  assert.ok(!names.includes('Sunday Service Offering'), 'one-off gift leaked into campaigns')
})

test('trend always returns 6 continuous months', () => {
  assert.equal(trend.length, 6)
  for (const month of trend) {
    assert.ok(month.label, 'month is missing a label')
    assert.ok(month.received >= 0)
  }
})

console.log('\nPayment timestamps + progress timeline')

test('a recorded payment keeps the chosen date and gains a time', () => {
  const when = new Date('2026-10-24T14:32:00')
  const stamp = toPaymentTimestamp('2026-10-24', when)
  assert.equal(toISODate(stamp), '2026-10-24', 'calendar date must be preserved')
  assert.equal(new Date(stamp).getHours(), 14)
  assert.equal(new Date(stamp).getMinutes(), 32)
})

test('a back-dated payment still reports the month it was paid in', () => {
  const when = new Date('2026-10-24T14:32:00')
  const stamp = toPaymentTimestamp('2026-03-09', when)
  assert.equal(toISODate(stamp), '2026-03-09')
  assert.equal(monthKeyOf(stamp), '2026-03')
})

test('a future-dated payment is anchored to noon so it is never after now', () => {
  const when = new Date('2026-10-24T08:00:00')
  const stamp = toPaymentTimestamp('2026-12-25', when)
  assert.equal(toISODate(stamp), '2026-12-25')
  assert.ok(new Date(stamp).getHours() <= 12)
})

test('every seeded payment carries a timestamp', () => {
  const all = seedContributions.flatMap((c) => c.payments ?? [])
  assert.ok(all.length > 0, 'seed data should contain payments')
  for (const payment of all) {
    assert.ok(payment.timestamp, `payment ${payment.id} is missing a timestamp`)
    assert.ok(!Number.isNaN(new Date(payment.timestamp).getTime()), 'timestamp is unparseable')
  }
})

test('timeline cumulative total equals the amount paid', () => {
  for (const contribution of seedContributions) {
    const timeline = getPaymentTimeline(contribution)
    const { paid } = getContributionProgress(contribution)
    if (!timeline.length) {
      assert.equal(paid, 0)
      continue
    }
    assert.equal(timeline[timeline.length - 1].cumulative, paid)
  }
})

test('timeline is ordered oldest-first and climbs monotonically', () => {
  const partial = seedContributions.find((c) => (c.payments ?? []).length >= 2)
  const timeline = getPaymentTimeline(partial)
  assert.ok(timeline.length >= 2)

  for (let i = 1; i < timeline.length; i += 1) {
    assert.ok(timeline[i].cumulative >= timeline[i - 1].cumulative, 'cumulative went backwards')
    assert.ok(timeline[i].date >= timeline[i - 1].date, 'timeline is not oldest-first')
  }
  assert.equal(timeline[0].cumulative, timeline[0].amount)
})

test('timeline progress never exceeds 100 and tracks the target', () => {
  const goal = seedContributions.find((c) => {
    const progress = getContributionProgress(c)
    return progress.isGoal && (c.payments ?? []).length > 0
  })
  const timeline = getPaymentTimeline(goal)
  const { target } = getContributionProgress(goal)

  for (const point of timeline) {
    assert.ok(point.progress >= 0 && point.progress <= 100, `progress was ${point.progress}`)
    assert.equal(point.target, target)
    assert.ok(point.remaining >= 0)
  }
  assert.equal(timeline[timeline.length - 1].remaining, Math.max(target - timeline[timeline.length - 1].cumulative, 0))
})

test('timeline of a pledge with no payments is empty', () => {
  assert.deepEqual(getPaymentTimeline({ type: 'Pledge', targetAmount: 500, payments: [] }), [])
})

console.log('\nMember track record (profile charts)')

const mem001 = seedContributions.filter((c) => c.memberId === 'MEM-001')
const timeline = getMemberTimeline(mem001)
const monthly = getMemberMonthlyGiving(mem001)
const position = getMemberGoalPosition(mem001)

test('member timeline merges every contribution into one series', () => {
  const paymentCount = mem001.reduce((sum, c) => sum + (c.payments ?? []).length, 0)
  assert.equal(timeline.length, paymentCount)
  assert.ok(timeline.length > 0)
})

test('member timeline is oldest-first and climbs monotonically', () => {
  for (let i = 1; i < timeline.length; i += 1) {
    assert.ok(timeline[i].cumulative >= timeline[i - 1].cumulative, 'cumulative went backwards')
    assert.ok(timeline[i].date >= timeline[i - 1].date, 'not oldest-first')
  }
  assert.equal(timeline[0].cumulative, timeline[0].amount)
})

test('member timeline cumulative equals everything the member paid', () => {
  const fin = getMemberFinancials(seedContributions, 'MEM-001')
  assert.equal(timeline[timeline.length - 1].cumulative, fin.paid)
})

test('member pledge cumulative counts pledges only, never one-off giving', () => {
  const fin = getMemberFinancials(seedContributions, 'MEM-001')
  const last = timeline[timeline.length - 1]
  assert.equal(last.pledgeCumulative, fin.paid - 900, 'the 900 tithe should be excluded')
  assert.ok(last.pledgeCumulative < last.cumulative, 'one-off giving should sit outside the pledge line')
})

test('member monthly giving buckets sum to the member total', () => {
  const total = monthly.reduce((sum, month) => sum + month.total, 0)
  const fin = getMemberFinancials(seedContributions, 'MEM-001')
  assert.equal(Math.round(total * 100) / 100, fin.paid)
})

test('member monthly buckets are continuous with no skipped months', () => {
  assert.ok(monthly.length >= 2)
  for (let i = 1; i < monthly.length; i += 1) {
    const [py, pm] = monthly[i - 1].key.split('-').map(Number)
    const [cy, cm] = monthly[i].key.split('-').map(Number)
    const gap = (cy - py) * 12 + (cm - pm)
    assert.equal(gap, 1, `gap of ${gap} months between ${monthly[i - 1].key} and ${monthly[i].key}`)
  }
})

test('member monthly buckets split pledge and one-off giving', () => {
  for (const month of monthly) {
    assert.equal(
      Math.round((month.pledge + month.oneOff) * 100) / 100,
      month.total,
      `pledge + oneOff should equal total for ${month.key}`,
    )
  }
})

test('member goal position matches the member financials', () => {
  const fin = getMemberFinancials(seedContributions, 'MEM-001')
  assert.equal(position.pledged, fin.pledged)
  assert.equal(position.paid, fin.pledged - fin.outstanding)
  assert.equal(position.outstanding, fin.outstanding)
  assert.equal(position.openGoals, fin.activeGoals)
  assert.equal(position.settledGoals, fin.completedGoals)
})

test('member goal position percent is bounded and matches outstanding', () => {
  assert.ok(position.percent >= 0 && position.percent <= 100, `percent was ${position.percent}`)
  if (position.outstanding === 0) assert.equal(position.percent, 100)
})

test('member with no giving returns empty series and a settled position', () => {
  assert.deepEqual(getMemberTimeline([]), [])
  assert.deepEqual(getMemberMonthlyGiving([]), [])
  const empty = getMemberGoalPosition([])
  assert.equal(empty.pledged, 0)
  assert.equal(empty.outstanding, 0)
  assert.equal(empty.percent, 100)
})

console.log('\nCollection pace')
const pace = getCollectionPace(seedContributions)

test('pace pledges match the summary goal total', () => {
  assert.equal(pace.totalPledged, summary.totalPledged)
})

test('pace collected matches the summary goal received', () => {
  assert.equal(pace.totalReceived, summary.goalReceived)
})

test('pace is cumulative, bounded and ends at the total received', () => {
  assert.ok(pace.points.length > 0)
  for (let i = 1; i < pace.points.length; i += 1) {
    assert.ok(pace.points[i].collected >= pace.points[i - 1].collected, 'collected went backwards')
  }
  assert.equal(pace.points[pace.points.length - 1].collected, pace.totalReceived)
})

test('pace pledged line is flat and never below collected', () => {
  for (const point of pace.points) {
    assert.equal(point.pledged, pace.totalPledged)
    assert.ok(point.collected <= point.pledged + 0.001, 'collected overtook pledged')
    assert.equal(point.gap, Math.round(Math.max(pace.totalPledged - point.collected, 0) * 100) / 100)
  }
})

test('pace handles an empty ledger without throwing', () => {
  const empty = getCollectionPace([])
  assert.equal(empty.totalPledged, 0)
  assert.equal(empty.points.length, 1)
  assert.equal(empty.points[0].collected, 0)
})

console.log('\nCSV encoding (Excel compatibility)')

test('cell with comma is quoted', () => {
  assert.equal(escapeCell('Mensah, Kwame'), '"Mensah, Kwame"')
})

test('cell with quote doubles the quote', () => {
  assert.equal(escapeCell('He said "hi"'), '"He said ""hi"""')
})

test('cell with newline is quoted', () => {
  assert.equal(escapeCell('line1\nline2'), '"line1\nline2"')
})

test('plain cell is left alone', () => {
  assert.equal(escapeCell('Offering'), 'Offering')
})

test('null and undefined become empty cells', () => {
  assert.equal(escapeCell(null), '')
  assert.equal(escapeCell(undefined), '')
})

test('rows use CRLF line endings', () => {
  const csv = toCSV(['a', 'b'], [[1, 2]])
  assert.equal(csv, 'a,b\r\n1,2')
})

test('CSV header count matches every row width', () => {
  const headers = ['id', 'name', 'amount']
  const rows = [['1', 'A, B', 10]]
  const lines = toCSV(headers, rows).split('\r\n')
  assert.equal(lines.length, 2)
  assert.equal(lines[0].split(',').length, 3)
})

console.log(`\n${passed} checks passed${process.exitCode ? ' (with failures)' : ''}\n`)
