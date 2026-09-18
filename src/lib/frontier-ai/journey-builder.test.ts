import { describe, expect, it } from 'vitest'
import type {
  AccountCustomerJourney,
  Customer,
  DiscoverySession,
  FrontierReadinessAssessment,
  UseCase,
} from '../types'
import {
  buildAccountCustomerJourney,
  collectCustomerJourneySources,
  getCustomerSafeJourney,
  validateCustomerJourney,
} from './journey-builder'

function session(id: string, customerId: string): DiscoverySession {
  return {
    id,
    customerId,
    customerName: customerId === 'customer-1' ? 'Contoso' : 'Fabrikam',
    name: `Discovery ${id}`,
    innovationHubLocation: 'Johannesburg',
    solutionEngineer: 'Engineer',
    accountTeamRep: 'Account lead',
    primaryStakeholder: 'Sponsor',
    responses: [],
    createdAt: 1,
  }
}

function useCase(id: string, discoverySessionId: string, title: string, description: string): UseCase {
  return {
    id,
    discoverySessionId,
    title,
    description,
    impact: 8,
    feasibility: 7,
    rice: { reach: 100, impact: 3, confidence: 80, effort: 4 },
    createdAt: 1,
  }
}

const customer: Customer = {
  id: 'customer-1',
  name: 'Contoso',
  innovationHubSPOC: 'Hub lead',
  createdAt: 1,
}

const readiness: FrontierReadinessAssessment = {
  ratings: {
    ai_platform: 2,
    database_platform: 1,
    application_platform: 1,
    secure_the_solution: 2,
    secure_the_user: 2,
    m365_copilot: 1,
    copilot_chat: 1,
    copilot_studio: 2,
    github_copilot: 0,
  },
  evidence: {},
  assessedAt: 100,
}

const sessions = [session('session-1', 'customer-1'), session('session-2', 'customer-1'), session('session-3', 'customer-2')]
const useCases = [
  useCase('data-use-case', 'session-1', 'Ground service knowledge with Fabric', 'Unify governed data for grounded answers.'),
  useCase('agent-use-case', 'session-2', 'Frontline support agent', 'Use Copilot Studio to assist field teams.'),
  useCase('other-use-case', 'session-3', 'Unrelated scenario', 'Belongs to another customer.'),
]

describe('collectCustomerJourneySources', () => {
  it('aggregates every session and use case for the selected customer only', () => {
    const result = collectCustomerJourneySources(customer.id, sessions, useCases)

    expect(result.sessions.map((item) => item.id)).toEqual(['session-1', 'session-2'])
    expect(result.useCases.map((item) => item.id)).toEqual(['data-use-case', 'agent-use-case'])
    expect(result.selection).toEqual({
      sessionIds: ['session-1', 'session-2'],
      useCaseIds: ['data-use-case', 'agent-use-case'],
    })
  })

  it('honors an explicit empty source selection', () => {
    const result = collectCustomerJourneySources(customer.id, sessions, useCases, {
      sessionIds: [],
      useCaseIds: [],
    })

    expect(result.sessions).toEqual([])
    expect(result.useCases).toEqual([])
    expect(result.selection).toEqual({ sessionIds: [], useCaseIds: [] })
  })
})

describe('buildAccountCustomerJourney', () => {
  it('builds a complete account journey with deterministic use-case suggestions', () => {
    const journey = buildAccountCustomerJourney({
      customer,
      sessions,
      useCases,
      readiness,
      now: 1_000,
    })

    const steps = journey.workstreams.flatMap((workstream) => workstream.steps)
    const dataReadiness = steps.find((step) => step.offeringId === '13')
    const workflowDiscovery = steps.find((step) => step.offeringId === '02')

    expect(journey.customerId).toBe(customer.id)
    expect(journey.sources.sessionIds).toEqual(['session-1', 'session-2'])
    expect(dataReadiness?.linkedUseCaseIds).toContain('data-use-case')
    expect(workflowDiscovery?.linkedUseCaseIds).toContain('agent-use-case')
    expect(steps.filter((step) => step.publicationStatus === 'published').every((step) => step.sourceSessionIds.length > 0)).toBe(true)
    expect(steps.filter((step) => step.publicationStatus === 'published').every((step) => (
      step.customerValue.trim().length > 0
      && (step.linkedUseCaseIds.length > 0 || step.customerContext.trim().length > 0)
    ))).toBe(true)
  })

  it('preserves tailored fields while recomputing maturity and statuses', () => {
    const initial = buildAccountCustomerJourney({ customer, sessions, useCases, readiness, now: 1_000 })
    const edited: AccountCustomerJourney = {
      ...initial,
      workstreams: initial.workstreams.map((workstream) => ({
        ...workstream,
        steps: workstream.steps.map((step) => step.offeringId === '13'
          ? { ...step, customerValue: 'Contoso-specific value', owner: 'Data platform lead' }
          : step),
      })),
    }
    const refreshed = buildAccountCustomerJourney({
      customer,
      sessions,
      useCases,
      readiness: {
        ...readiness,
        ratings: { ...readiness.ratings, ai_platform: 3, database_platform: 3 },
      },
      existingJourney: edited,
      now: 2_000,
    })
    const refreshedStep = refreshed.workstreams.flatMap((workstream) => workstream.steps)
      .find((step) => step.offeringId === '13')

    expect(refreshed.maturity.stage).toBe('Scaling')
    expect(refreshedStep?.customerValue).toBe('Contoso-specific value')
    expect(refreshedStep?.owner).toBe('Data platform lead')
    expect(refreshed.updatedAt).toBe(2_000)
  })

  it('removes linked use cases that are excluded from refreshed sources', () => {
    const initial = buildAccountCustomerJourney({ customer, sessions, useCases, readiness, now: 1_000 })
    const refreshed = buildAccountCustomerJourney({
      customer,
      sessions,
      useCases,
      readiness,
      selection: { sessionIds: ['session-1'], useCaseIds: ['data-use-case'] },
      existingJourney: initial,
      now: 2_000,
    })
    const linkedIds = refreshed.workstreams.flatMap((workstream) => workstream.steps)
      .flatMap((step) => step.linkedUseCaseIds)

    expect(linkedIds).not.toContain('agent-use-case')
  })

  it('projects a customer-safe journey without draft offerings', () => {
    const journey = buildAccountCustomerJourney({ customer, sessions, useCases, readiness, now: 1_000 })
    const visible = getCustomerSafeJourney(journey)
    const visibleSteps = visible.workstreams.flatMap((workstream) => workstream.steps)

    expect(visibleSteps.some((step) => step.offeringId === '15')).toBe(false)
    expect(JSON.stringify(visible)).not.toMatch(/internalEffortTier|ACR|MAU|MACC/)
  })

  it('rejects published steps that lack value or customer context', () => {
    const journey = buildAccountCustomerJourney({ customer, sessions, useCases, readiness, now: 1_000 })
    const invalid: AccountCustomerJourney = {
      ...journey,
      workstreams: journey.workstreams.map((workstream, workstreamIndex) => ({
        ...workstream,
        steps: workstream.steps.map((step, stepIndex) => workstreamIndex === 0 && stepIndex === 0
          ? { ...step, customerValue: '', customerContext: '', linkedUseCaseIds: [] }
          : step),
      })),
    }

    expect(validateCustomerJourney(invalid)).toEqual({
      valid: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ offeringId: '01', field: 'customerValue' }),
        expect.objectContaining({ offeringId: '01', field: 'customerContext' }),
      ]),
    })
  })
})