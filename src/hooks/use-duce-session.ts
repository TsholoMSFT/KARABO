import { useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'
import type { DUCESessionData } from '@/lib/duce-types'
import { emptyDUCESession } from '@/lib/duce-types'

const STORAGE_KEY = 'duce-sessions'

type DuceMap = Record<string, DUCESessionData>

/**
 * DUCE session storage — keyed by underlying DiscoverySession id.
 * Stored separately from the legacy DiscoverySession shape so existing
 * components and exports remain unaffected.
 */
export function useDUCESession(sessionId: string | undefined) {
  const [map, setMap] = useLocalStorage<DuceMap>(STORAGE_KEY, {})

  const data: DUCESessionData = sessionId
    ? (map?.[sessionId] ?? emptyDUCESession(sessionId))
    : emptyDUCESession('__pending__')

  const update = useCallback(
    (updates: Partial<DUCESessionData> | ((prev: DUCESessionData) => Partial<DUCESessionData>)) => {
      if (!sessionId) return
      setMap((prev) => {
        const current = prev?.[sessionId] ?? emptyDUCESession(sessionId)
        const patch = typeof updates === 'function' ? updates(current) : updates
        const next: DUCESessionData = { ...current, ...patch, updatedAt: Date.now() }
        return { ...(prev ?? {}), [sessionId]: next }
      })
    },
    [sessionId, setMap]
  )

  const reset = useCallback(() => {
    if (!sessionId) return
    setMap((prev) => {
      const next = { ...(prev ?? {}) }
      delete next[sessionId]
      return next
    })
  }, [sessionId, setMap])

  return { data, update, reset }
}
