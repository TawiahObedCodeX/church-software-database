/**
 * Single source of truth for the whole demo.
 *
 * Frontend-only, so "persistence" is React state + localStorage. Every
 * mutation goes through this provider, and every derived number is
 * computed with useMemo from the raw lists.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { cloneSeed } from '../data/mockData'
import {
  getContributionProgress,
  getMemberFinancials,
  round2,
  toPaymentTimestamp,
} from '../utils/contributions'
import { getDashboardData } from '../utils/stats'
import { ChurchContext } from './churchStore'

const STORAGE_KEY = 'lakeside-baptist-console-v1'

/**
 * Backfill the `timestamp` field on payments saved before timestamps
 * existed. Older records only carry a yyyy-mm-dd `date`, so we anchor
 * them at noon on that day: the ordering stays correct and the derived
 * month still matches what the admin originally entered.
 */
function withTimestamps(contributions = []) {
  return contributions.map((contribution) => ({
    ...contribution,
    payments: (contribution.payments ?? []).map((payment) =>
      payment.timestamp
        ? payment
        : {
            ...payment,
            timestamp: payment.date
              ? new Date(`${payment.date}T12:00:00`).toISOString()
              : new Date().toISOString(),
          },
    ),
  }))
}

/** Highest numeric suffix in a list of ids like MEM-007 -> 7. */
function nextId(prefix, list) {
  const highest = list.reduce((max, item) => {
    const n = Number(String(item.id).split('-')[1])
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`
}

/** Read the saved demo state, falling back to the seed data. */
function loadInitialState() {
  if (typeof window === 'undefined') return cloneSeed()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSeed()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.members) || !Array.isArray(parsed?.contributions)) {
      return cloneSeed()
    }
    return {
      members: parsed.members,
      contributions: withTimestamps(parsed.contributions),
    }
  } catch {
    // Corrupt or unreadable storage should never break the demo.
    return cloneSeed()
  }
}

export function ChurchProvider({ children }) {
  const [state, setState] = useState(loadInitialState)

  /* Persist on every change. */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage may be full or blocked (private mode) - non-fatal.
    }
  }, [state])

  /* ---------------- Members ---------------- */

  const addMember = useCallback((values) => {
    let created = null

    setState((prev) => {
      const member = {
        id: nextId('MEM', prev.members),
        ...values,
        status: values.status || 'Active',
      }
      created = member
      return { ...prev, members: [member, ...prev.members] }
    })

    return created
  }, [])

  const updateMember = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }, [])

  /** Removing a member also removes their contribution records. */
  const deleteMember = useCallback((id) => {
    setState((prev) => ({
      members: prev.members.filter((m) => m.id !== id),
      contributions: prev.contributions.filter((c) => c.memberId !== id),
    }))
  }, [])

  /* ---------------- Contributions ---------------- */

  const addContribution = useCallback((values) => {
    let created = null

    setState((prev) => {
      const id = nextId('CON', prev.contributions)
      const stamp = Date.now().toString()

      /* Payments may arrive already formed (from the member profile) or
         as bare {amount,date,method} objects from the create form. Fill
         in whatever is missing so every installment has a stable id,
         a reference and a full timestamp. */
      const payments = (values.payments ?? []).map((payment, index) => ({
        ...payment,
        id: payment.id ?? `${id}-PAY-${String(index + 1).padStart(2, '0')}`,
        reference: payment.reference || `REF-${stamp.slice(-5)}-${index + 1}`,
        note: payment.note ?? '',
        date: payment.date ?? '',
        timestamp: payment.timestamp ?? toPaymentTimestamp(payment.date),
      }))

      const contribution = {
        ...values,
        id,
        targetAmount: values.targetAmount ? round2(values.targetAmount) : null,
        recordedBy: 'Admin',
        note: values.note ?? '',
        payments,
      }

      created = contribution
      return { ...prev, contributions: [contribution, ...prev.contributions] }
    })

    return created
  }, [])

  const updateContribution = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      contributions: prev.contributions.map((c) => {
        if (c.id !== id) return c
        const merged = { ...c, ...patch }
        merged.targetAmount = merged.targetAmount ? round2(merged.targetAmount) : null
        return merged
      }),
    }))
  }, [])

  /** Delete one contribution and its installment history. */
  const deleteContribution = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      contributions: prev.contributions.filter((c) => c.id !== id),
    }))
  }, [])

  /**
   * Record an installment against an existing contribution.
   *
   * Amounts are capped at the outstanding balance for goal-based types so
   * a member can never overpay a pledge. The cap is enforced here as well
   * as in the form, so no caller can slip past it.
   *
   * Every payment stores a full ISO `timestamp` (the chosen date plus the
   * moment of entry), which drives the "paid on" display and the progress
   * graphs.
   *
   * @returns {object|null} the created payment, or null if it was rejected
   */
  const addPayment = useCallback((contributionId, paymentValues) => {
    let created = null
    let rejection = null

    setState((prev) => {
      const contributions = prev.contributions.map((c) => {
        if (c.id !== contributionId) return c

        const payments = c.payments ?? []
        const { isGoal, outstanding } = getContributionProgress(c)

        let amount = round2(Number(paymentValues.amount) || 0)

        // Goal-based: never accept more than what is still owed.
        if (isGoal) {
          if (outstanding <= 0) {
            rejection = 'This pledge is already fully paid.'
            return c
          }
          if (amount > outstanding) amount = outstanding
        }

        if (amount <= 0) {
          rejection = 'Enter an amount greater than zero.'
          return c
        }

        const nextSeq = payments.length + 1
        const entry = {
          id: `${c.id}-PAY-${String(nextSeq).padStart(2, '0')}`,
          date: paymentValues.date ?? '',
          timestamp: paymentValues.timestamp ?? toPaymentTimestamp(paymentValues.date),
          amount,
          method: paymentValues.method,
          reference: paymentValues.reference || `REF-${Date.now().toString().slice(-6)}`,
          note: paymentValues.note ?? '',
        }

        created = entry
        return { ...c, payments: [...payments, entry] }
      })

      if (!created) return prev
      return { ...prev, contributions }
    })

    return created ?? rejection
  }, [])

  /** Undo a single installment (mis-keyed entries happen). */
  const deletePayment = useCallback((contributionId, paymentId) => {
    setState((prev) => ({
      ...prev,
      contributions: prev.contributions.map((c) =>
        c.id === contributionId
          ? { ...c, payments: (c.payments ?? []).filter((p) => p.id !== paymentId) }
          : c,
      ),
    }))
  }, [])

  /* ---------------- Reset ---------------- */

  const resetDemoData = useCallback(() => {
    setState(cloneSeed())
  }, [])

  const clearAllData = useCallback(() => {
    setState({ members: [], contributions: [] })
  }, [])

  /* ---------------- Derived ---------------- */

  const enrichedMembers = useMemo(
    () =>
      state.members.map((member) => ({
        ...member,
        financials: getMemberFinancials(state.contributions, member.id),
      })),
    [state.members, state.contributions],
  )

  const dashboard = useMemo(
    () => getDashboardData(state.members, state.contributions),
    [state.members, state.contributions],
  )

  const value = useMemo(
    () => ({
      members: state.members,
      contributions: state.contributions,
      enrichedMembers,
      dashboard,
      addMember,
      updateMember,
      deleteMember,
      addContribution,
      updateContribution,
      deleteContribution,
      addPayment,
      deletePayment,
      resetDemoData,
      clearAllData,
    }),
    [
      state.members,
      state.contributions,
      enrichedMembers,
      dashboard,
      addMember,
      updateMember,
      deleteMember,
      addContribution,
      updateContribution,
      deleteContribution,
      addPayment,
      deletePayment,
      resetDemoData,
      clearAllData,
    ],
  )

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>
}
