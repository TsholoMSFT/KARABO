import { useCallback } from 'react'
import type { AccountCustomerJourney } from '@/lib/types'
import { useLocalStorage } from './use-local-storage'

export const ACCOUNT_CUSTOMER_JOURNEYS_STORAGE_KEY = 'frontier-account-journeys'

type JourneyCollection = Record<string, AccountCustomerJourney>
type JourneyUpdater = (
  current: AccountCustomerJourney | null,
) => AccountCustomerJourney | null

export function useAccountCustomerJourney(customerId: string | null | undefined) {
  const [journeys, setJourneys] = useLocalStorage<JourneyCollection>(
    ACCOUNT_CUSTOMER_JOURNEYS_STORAGE_KEY,
    {},
  )

  const journey = customerId ? journeys[customerId] ?? null : null

  const saveJourney = useCallback((nextJourney: AccountCustomerJourney) => {
    setJourneys((current) => ({
      ...current,
      [nextJourney.customerId]: nextJourney,
    }))
  }, [setJourneys])

  const updateJourney = useCallback((updater: JourneyUpdater) => {
    if (!customerId) return
    setJourneys((current) => {
      const updated = updater(current[customerId] ?? null)
      if (!updated) {
        const { [customerId]: _removed, ...remaining } = current
        return remaining
      }
      return { ...current, [customerId]: updated }
    })
  }, [customerId, setJourneys])

  const deleteJourney = useCallback(() => {
    if (!customerId) return
    setJourneys((current) => {
      const { [customerId]: _removed, ...remaining } = current
      return remaining
    })
  }, [customerId, setJourneys])

  return {
    journey,
    saveJourney,
    updateJourney,
    deleteJourney,
  }
}