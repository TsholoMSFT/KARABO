import { useLocalStorage } from './use-local-storage'
import type { UseCase } from '@/lib/types'
import type { Opportunity } from '@/lib/mcem'
import {
  promoteUseCasesToOpportunity,
  advanceStage,
  closeOpportunity,
  prepareHandoff,
  acceptHandoff,
  type PromoteOptions,
  type AdvanceOptions,
} from '@/lib/mcem-engine'

/**
 * Persistence + actions for the MCEM opportunity pipeline.
 *
 * Opportunities are the *surviving, validated* use cases that the subsidiary
 * actually works. This hook stores them and exposes the funnel transitions
 * (promote -> advance -> handshake -> accept) on top of the pure engine.
 */
const STORAGE_KEY = 'opportunities'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useLocalStorage<Opportunity[]>(STORAGE_KEY, [])

  const list = opportunities || []

  const upsert = (opp: Opportunity) => {
    setOpportunities((current) => {
      const arr = current || []
      const idx = arr.findIndex((o) => o.id === opp.id)
      if (idx === -1) return [...arr, opp]
      const next = arr.slice()
      next[idx] = opp
      return next
    })
  }

  const remove = (id: string) => {
    setOpportunities((current) => (current || []).filter((o) => o.id !== id))
  }

  const getById = (id: string): Opportunity | undefined => list.find((o) => o.id === id)

  const forCustomer = (customerId: string): Opportunity[] =>
    list.filter((o) => o.customerId === customerId)

  const forSession = (sessionId: string): Opportunity[] =>
    list.filter((o) => o.discoverySessionId === sessionId)

  /** True when a use case has already been promoted into an opportunity. */
  const isPromoted = (useCaseId: string): boolean =>
    list.some((o) => o.useCaseIds.includes(useCaseId))

  // ── Funnel actions (wrap the pure engine, then persist) ──────────────────

  /** Promote surviving use cases into a new Stage 1 opportunity. */
  const promote = (useCases: UseCase[], opts: PromoteOptions): Opportunity => {
    const opp = promoteUseCasesToOpportunity(useCases, opts)
    upsert(opp)
    return opp
  }

  const advance = (id: string, useCases: UseCase[], opts?: AdvanceOptions): Opportunity => {
    const opp = getById(id)
    if (!opp) throw new Error(`Opportunity ${id} not found`)
    const next = advanceStage(opp, useCases, opts)
    upsert(next)
    return next
  }

  const close = (
    id: string,
    opts?: Parameters<typeof closeOpportunity>[1],
  ): Opportunity => {
    const opp = getById(id)
    if (!opp) throw new Error(`Opportunity ${id} not found`)
    const next = closeOpportunity(opp, opts)
    upsert(next)
    return next
  }

  const prepareForHandoff = (
    id: string,
    useCases: UseCase[],
    opts?: Parameters<typeof prepareHandoff>[2],
  ): Opportunity => {
    const opp = getById(id)
    if (!opp) throw new Error(`Opportunity ${id} not found`)
    const next = prepareHandoff(opp, useCases, opts)
    upsert(next)
    return next
  }

  const accept = (
    id: string,
    csaName: string,
    opts?: Parameters<typeof acceptHandoff>[2],
  ): Opportunity => {
    const opp = getById(id)
    if (!opp) throw new Error(`Opportunity ${id} not found`)
    const next = acceptHandoff(opp, csaName, opts)
    upsert(next)
    return next
  }

  return {
    opportunities: list,
    upsert,
    remove,
    getById,
    forCustomer,
    forSession,
    isPromoted,
    promote,
    advance,
    close,
    prepareForHandoff,
    acceptHandoff: accept,
  }
}
