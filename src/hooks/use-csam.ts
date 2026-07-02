import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from './use-local-storage'
import { setManualProfiles } from '@/lib/csam/data-provider'
import { DEMO_CSAM_PROFILES } from '@/lib/csam/demo-scenarios'
import type { ActionPlan, CsamCustomerProfile, ValueHypothesis } from '@/lib/csam/types'

/**
 * Persistent store for CSAM cockpit customer profiles plus the action plans and
 * value hypotheses generated against them. Mirrors use-discovery / use-engagements.
 *
 * When demo mode is on, the four sample scenarios are merged in (read-only)
 * alongside any manually-entered profiles.
 */
export function useCsam(isDemoMode = false) {
  const [stored, setStored] = useLocalStorage<CsamCustomerProfile[]>('csam-profiles', [])

  // Keep the manual provider in sync so the data-provider seam can serve them.
  useEffect(() => {
    setManualProfiles(stored || [])
  }, [stored])

  const profiles = useMemo<CsamCustomerProfile[]>(() => {
    const manual = stored || []
    if (!isDemoMode) return manual
    const manualIds = new Set(manual.map((p) => p.customerId))
    return [...manual, ...DEMO_CSAM_PROFILES.filter((p) => !manualIds.has(p.customerId))]
  }, [stored, isDemoMode])

  const getProfile = useCallback(
    (customerId: string): CsamCustomerProfile | undefined => profiles.find((p) => p.customerId === customerId),
    [profiles],
  )

  const upsertProfile = useCallback(
    (profile: CsamCustomerProfile) =>
      setStored((prev) => {
        const list = prev || []
        const exists = list.some((p) => p.customerId === profile.customerId)
        const next = { ...profile, source: 'manual' as const, lastUpdated: Date.now() }
        return exists ? list.map((p) => (p.customerId === profile.customerId ? next : p)) : [...list, next]
      }),
    [setStored],
  )

  const deleteProfile = useCallback(
    (customerId: string) => setStored((prev) => (prev || []).filter((p) => p.customerId !== customerId)),
    [setStored],
  )

  /** Save generated actions onto a profile (manual profiles only). */
  const saveActions = useCallback(
    (customerId: string, actions: ActionPlan[]) =>
      setStored((prev) =>
        (prev || []).map((p) => (p.customerId === customerId ? { ...p, actions, lastUpdated: Date.now() } : p)),
      ),
    [setStored],
  )

  const saveHypothesis = useCallback(
    (customerId: string, hypothesis: ValueHypothesis) =>
      setStored((prev) =>
        (prev || []).map((p) =>
          p.customerId === customerId
            ? { ...p, hypotheses: [...(p.hypotheses ?? []), hypothesis], lastUpdated: Date.now() }
            : p,
        ),
      ),
    [setStored],
  )

  return {
    profiles,
    getProfile,
    upsertProfile,
    deleteProfile,
    saveActions,
    saveHypothesis,
    hasManual: (stored || []).length > 0,
  }
}

/** Convenience hook for a single selected customer. */
export function useCsamSelection(isDemoMode = false) {
  const csam = useCsam(isDemoMode)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? csam.getProfile(selectedId) ?? null : null
  return { ...csam, selectedId, setSelectedId, selected }
}
