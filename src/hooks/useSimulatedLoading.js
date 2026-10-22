import { useEffect, useMemo, useState } from 'react'

/**
 * Simulates the initial data fetch so the skeleton loaders are visible.
 *
 * There is no backend in this demo, so without this the data would be
 * ready on the very first render and the skeletons would flash for a
 * single frame. This keeps them on screen just long enough to be a real
 * loading state.
 *
 * The state is keyed on the dependency values, so when they change (e.g.
 * navigating to a different member) the component re-mounts its loading
 * state without a synchronous setState inside the effect.
 *
 * When a real API is added, replace the timer with the actual request —
 * the `loading` contract stays the same.
 *
 * @param {number} delay  milliseconds to stay in the loading state
 * @param {Array} deps    re-run the load when these change (e.g. route id)
 */
export function useSimulatedLoading(delay = 550, deps = []) {
  // A stable string that changes whenever any dependency changes.
  const key = useMemo(() => deps.map((value) => String(value)).join('|'), [deps])
  const [settledKey, setSettledKey] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledKey(key), delay)
    return () => window.clearTimeout(timer)
  }, [delay, key])

  return settledKey !== key
}
