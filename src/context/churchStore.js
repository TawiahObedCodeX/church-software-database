import { createContext, useContext, useMemo } from 'react'
import { getMemberFinancials } from '../utils/contributions'

/**
 * The context object lives on its own so that:
 *  - ChurchContext.jsx only exports a component (fast-refresh friendly)
 *  - hooks can be imported without pulling the provider in
 */
export const ChurchContext = createContext(null)

/** Access the church store. Throws if used outside the provider. */
export function useChurch() {
  const context = useContext(ChurchContext)
  if (!context) {
    throw new Error('useChurch must be used inside a <ChurchProvider>')
  }
  return context
}

/** Convenience: look up one member together with their giving position. */
export function useMember(memberId) {
  const { members, contributions } = useChurch()

  return useMemo(() => {
    const member = members.find((item) => item.id === memberId)
    if (!member) return null
    return { ...member, financials: getMemberFinancials(contributions, member.id) }
  }, [members, contributions, memberId])
}
