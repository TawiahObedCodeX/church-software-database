/**
 * CSV helpers.
 *
 * Everything here is browser-only: we build a CSV string in memory and
 * hand it to the user as a Blob download. No backend required.
 *
 * Two things matter for the "opens correctly in Excel" requirement:
 *  1. A UTF-8 BOM (EF BB BF) so Excel detects the encoding instead of
 *     mangling non-ASCII names.
 *  2. Values are escaped per RFC 4180 - wrap in quotes and double any
 *     embedded quote whenever the value contains a comma, quote, or
 *     newline.
 */

import { formatCurrency, formatDate } from './format'
import {
  getContributionProgress,
  getMemberFinancials,
  monthKeyOf,
  toISODate,
} from './contributions'

const BOM = '\uFEFF'

/** Escape a single cell for safe CSV embedding. */
export function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** Turn a header row + data rows into a CSV string (no BOM). */
export function toCSV(headers, rows) {
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','))
  }
  return lines.join('\r\n')
}

/** Trigger a browser download for arbitrary text content. */
export function downloadText(filename, content, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Stamp filenames so repeated exports never collide. */
function stamp() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Flat member roster - one row per member with their money position.
 * This is the "who is in the church and how are they doing" report.
 */
export function exportMembersToCSV(members, contributions) {
  const headers = [
    'Member ID',
    'Full Name',
    'Phone',
    'Email',
    'Gender',
    'Category',
    'Address',
    'Join Date',
    'Status',
    'Total Paid',
    'Total Pledged',
    'Outstanding',
    'Completion %',
    'Contributions',
  ]

  const rows = members.map((member) => {
    const fin = getMemberFinancials(contributions, member.id)
    return [
      member.id,
      member.fullName,
      member.phone,
      member.email,
      member.gender,
      member.category,
      member.address,
      member.joinDate,
      member.status,
      fin.paid,
      fin.pledged,
      fin.outstanding,
      fin.completionRate,
      fin.contributions,
    ]
  })

  downloadText(`lakeside-members-${stamp()}.csv`, BOM + toCSV(headers, rows))
  return rows.length
}

/**
 * One row per contribution, with the goal progress folded in.
 * This is the primary accounting report.
 */
export function exportContributionsToCSV(contributions, members) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const headers = [
    'Contribution ID',
    'Member ID',
    'Member Name',
    'Type',
    'Description',
    'Payment Method',
    'Date',
    'Target Amount',
    'Amount Paid',
    'Outstanding',
    'Progress %',
    'Status',
    'Installments',
    'Recorded By',
  ]

  const rows = contributions.map((contribution) => {
    const progress = getContributionProgress(contribution)
    const member = byId.get(contribution.memberId)

    return [
      contribution.id,
      contribution.memberId,
      member?.fullName ?? 'Unknown',
      contribution.type,
      contribution.description,
      contribution.method,
      contribution.date,
      progress.target ?? '',
      progress.paid,
      progress.outstanding ?? '',
      Math.round(progress.progress),
      progress.status,
      contribution.payments?.length ?? 0,
      contribution.recordedBy ?? '',
    ]
  })

  downloadText(`lakeside-contributions-${stamp()}.csv`, BOM + toCSV(headers, rows))
  return rows.length
}

/**
 * One row per individual payment (installment ledger).
 * Answers "when did member X pay, how much, and how?".
 */
export function exportPaymentsToCSV(contributions, members) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const headers = [
    'Payment ID',
    'Contribution ID',
    'Member ID',
    'Member Name',
    'Contribution Type',
    'Payment Date',
    'Month Paid',
    'Time Paid',
    'Amount',
    'Method',
    'Reference',
    'Note',
  ]

  const rows = []
  for (const contribution of contributions) {
    const member = byId.get(contribution.memberId)
    for (const payment of contribution.payments ?? []) {
      /* Prefer the full timestamp; fall back to the legacy date-only field. */
      const moment = new Date(payment.timestamp ?? payment.date)
      const valid = !Number.isNaN(moment.getTime())

      rows.push([
        payment.id,
        contribution.id,
        contribution.memberId,
        member?.fullName ?? 'Unknown',
        contribution.type,
        payment.date ?? (valid ? toISODate(moment) : ''),
        valid ? monthKeyOf(moment) : '',
        valid
          ? moment.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : '',
        payment.amount,
        payment.method ?? contribution.method,
        payment.reference ?? '',
        payment.note ?? '',
      ])
    }
  }

  /* Newest first. Column 5 is Payment Date, column 7 the time. */
  rows.sort((a, b) => {
    if (a[5] !== b[5]) return a[5] < b[5] ? 1 : -1
    return String(a[7]) < String(b[7]) ? 1 : -1
  })

  downloadText(`lakeside-payments-${stamp()}.csv`, BOM + toCSV(headers, rows))
  return rows.length
}

/**
 * Goal-based contributions only - the "pledge tracker" report.
 * Sorted by outstanding balance so the admin sees arrears first.
 */
export function exportPledgesToCSV(contributions, members) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const headers = [
    'Contribution ID',
    'Member Name',
    'Campaign',
    'Target',
    'Paid',
    'Outstanding',
    'Progress %',
    'Status',
    'Last Payment',
  ]

  const rows = contributions
    .map((contribution) => ({ contribution, progress: getContributionProgress(contribution) }))
    .filter(({ progress }) => progress.isGoal)
    .map(({ contribution, progress }) => {
      const payments = contribution.payments ?? []
      /* Latest by exact time, so same-day installments resolve correctly. */
      const last = payments.length
        ? [...payments].sort((a, b) => {
            const left = new Date(a.timestamp ?? a.date).getTime() || 0
            const right = new Date(b.timestamp ?? b.date).getTime() || 0
            return right - left
          })[0]
        : null

      return [
        contribution.id,
        byId.get(contribution.memberId)?.fullName ?? 'Unknown',
        contribution.description,
        progress.target,
        progress.paid,
        progress.outstanding,
        Math.round(progress.progress),
        progress.status,
        last ? formatDate(last.timestamp ?? last.date) : 'No payments yet',
      ]
    })
    .sort((a, b) => b[5] - a[5])

  downloadText(`lakeside-pledges-${stamp()}.csv`, BOM + toCSV(headers, rows))
  return rows.length
}

/**
 * Human-readable summary sheet: totals, averages and a per-campaign
 * breakdown. Mirrors what the dashboard shows on screen.
 */
export function exportSummaryToCSV(summary, campaignRows) {
  const B = '\uFEFF'
  const lines = []

  lines.push(toCSV(['Lakeside Baptist Church - Contribution Summary'], []))
  lines.push(toCSV(['Generated', new Date().toLocaleString('en-GB')], []))
  lines.push('')

  lines.push(toCSV(['Metric', 'Value'], [
    ['Total Members', summary.totalMembers],
    ['Active Members', summary.activeMembers],
    ['Total Contributions Recorded', summary.totalContributions],
    ['Total Received', formatCurrency(summary.totalReceived)],
    ['Total Pledged', formatCurrency(summary.totalPledged)],
    ['Total Outstanding', formatCurrency(summary.totalOutstanding)],
    ['Collection Rate', `${summary.collectionRate}%`],
    ['Pledges Completed', summary.completedPledges],
    ['Pledges In Progress', summary.activePledges],
    ['Average Gift', formatCurrency(summary.averageGift)],
  ]))

  lines.push('')
  lines.push(',')
  lines.push(toCSV(['Campaign', 'Target', 'Received', 'Outstanding', 'Progress %'], []))
  lines.push(
    toCSV(
      ['Campaign', 'Target', 'Received', 'Outstanding', 'Progress %'],
      campaignRows.map((c) => [c.name, c.target, c.received, c.outstanding, c.progress]),
    ),
  )

  lines.push('')
  lines.push(',')
  lines.push(toCSV(['Recent Activity'], []))
  lines.push(toCSV(['Date', 'Member', 'Type', 'Amount', 'Method'], []))
  lines.push(
    toCSV(
      ['Date', 'Member', 'Type', 'Amount', 'Method'],
      (summary.recent ?? []).map((r) => [
        formatDate(r.date),
        r.memberName,
        r.type,
        r.amount,
        r.method,
      ]),
    ),
  )

  downloadText(`lakeside-summary-${stamp()}.csv`, B + lines.join('\r\n'))
  return true
}
