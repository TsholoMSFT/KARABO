import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Customer, FrontierReadinessAssessment } from '@/lib/types'
import { buildAccountCustomerJourney } from '@/lib/frontier-ai/journey-builder'
import {
  ACCOUNT_CUSTOMER_JOURNEYS_STORAGE_KEY,
  useAccountCustomerJourney,
} from './use-account-customer-journey'

const customer: Customer = {
  id: 'customer-1',
  name: 'Contoso',
  innovationHubSPOC: 'Hub lead',
  createdAt: 1,
}

const readiness: FrontierReadinessAssessment = {
  ratings: {
    ai_platform: 0,
    database_platform: 0,
    application_platform: 0,
    secure_the_solution: 0,
    secure_the_user: 0,
    m365_copilot: 0,
    copilot_chat: 0,
    copilot_studio: 0,
    github_copilot: 0,
  },
  evidence: {},
  assessedAt: 1,
}

describe('useAccountCustomerJourney', () => {
  beforeEach(() => localStorage.clear())

  it('persists and restores a journey by customer id', () => {
    const journey = buildAccountCustomerJourney({
      customer,
      sessions: [],
      useCases: [],
      readiness,
      now: 100,
    })
    const { result, unmount } = renderHook(() => useAccountCustomerJourney(customer.id))

    act(() => result.current.saveJourney(journey))

    expect(result.current.journey).toEqual(journey)
    expect(JSON.parse(localStorage.getItem(ACCOUNT_CUSTOMER_JOURNEYS_STORAGE_KEY) || '{}'))
      .toEqual({ [customer.id]: journey })

    unmount()
    const restored = renderHook(() => useAccountCustomerJourney(customer.id))
    expect(restored.result.current.journey).toEqual(journey)
  })

  it('supports functional updates and deletion without affecting other customers', () => {
    const first = buildAccountCustomerJourney({ customer, sessions: [], useCases: [], readiness, now: 100 })
    const secondCustomer = { ...customer, id: 'customer-2', name: 'Fabrikam' }
    const second = buildAccountCustomerJourney({ customer: secondCustomer, sessions: [], useCases: [], readiness, now: 100 })
    const firstHook = renderHook(() => useAccountCustomerJourney(customer.id))
    const secondHook = renderHook(() => useAccountCustomerJourney(secondCustomer.id))

    act(() => firstHook.result.current.saveJourney(first))
    act(() => secondHook.result.current.saveJourney(second))
    act(() => firstHook.result.current.updateJourney((current) => current
      ? { ...current, ambition: 'Tailored ambition' }
      : current))

    expect(firstHook.result.current.journey?.ambition).toBe('Tailored ambition')
    expect(secondHook.result.current.journey?.customerName).toBe('Fabrikam')

    act(() => firstHook.result.current.deleteJourney())
    expect(firstHook.result.current.journey).toBeNull()
    expect(secondHook.result.current.journey?.customerName).toBe('Fabrikam')
  })
})