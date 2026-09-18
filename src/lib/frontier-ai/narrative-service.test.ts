import { describe, expect, it } from 'vitest'
import type { Customer, FrontierReadinessAssessment } from '../types'
import { buildAccountCustomerJourney } from './journey-builder'
import { applyAccountJourneyNarrative } from './narrative-service'

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

describe('applyAccountJourneyNarrative', () => {
  it('updates narrative fields while preserving deterministic structure', () => {
    const journey = buildAccountCustomerJourney({ customer, sessions: [], useCases: [], readiness, now: 100 })
    const beforeStructure = journey.workstreams.map((workstream) => workstream.steps.map((step) => ({
      offeringId: step.offeringId,
      order: step.order,
      status: step.recommendationStatus,
      duration: step.duration,
      deliveryStage: step.deliveryStage,
    })))
    const updated = applyAccountJourneyNarrative(journey, {
      ambition: 'Use trusted AI to redesign priority customer and employee journeys.',
      steps: [{
        offeringId: '01',
        customerValue: 'Align leaders on the few AI bets that can materially improve service delivery.',
        customerContext: 'Apply the discussion to Contoso service and employee experience priorities.',
        whyNow: 'Contoso is exploring AI and needs an agreed ambition before committing delivery capacity.',
        outcomes: ['Three executive-sponsored AI bets are agreed.'],
        successCriteria: ['Each bet has an accountable executive and next decision date.'],
      }],
    }, 200)

    expect(updated.ambition).toContain('trusted AI')
    expect(updated.generatedBy).toBe('ai-assisted')
    expect(updated.revision).toBe(journey.revision + 1)
    expect(updated.updatedAt).toBe(200)
    expect(updated.workstreams.map((workstream) => workstream.steps.map((step) => ({
      offeringId: step.offeringId,
      order: step.order,
      status: step.recommendationStatus,
      duration: step.duration,
      deliveryStage: step.deliveryStage,
    })))).toEqual(beforeStructure)
    expect(updated.workstreams.flatMap((workstream) => workstream.steps)
      .find((step) => step.offeringId === '01')?.customerValue).toContain('Align leaders')
  })

  it('rejects unknown and draft offering IDs', () => {
    const journey = buildAccountCustomerJourney({ customer, sessions: [], useCases: [], readiness, now: 100 })
    const narrative = (offeringId: string) => ({
      ambition: 'A customer-safe ambition.',
      steps: [{
        offeringId,
        customerValue: 'Customer value.',
        customerContext: 'Customer context.',
        whyNow: 'Reason for timing.',
        outcomes: ['Outcome.'],
        successCriteria: ['Success criterion.'],
      }],
    })

    expect(() => applyAccountJourneyNarrative(journey, narrative('99'))).toThrow('Invalid account journey narrative')
    expect(() => applyAccountJourneyNarrative(journey, narrative('15'))).toThrow('Invalid account journey narrative')
  })

  it('rejects structural fields outside the narrative contract', () => {
    const journey = buildAccountCustomerJourney({ customer, sessions: [], useCases: [], readiness, now: 100 })

    expect(() => applyAccountJourneyNarrative(journey, {
      ambition: 'A customer-safe ambition.',
      steps: [{
        offeringId: '01',
        customerValue: 'Customer value.',
        customerContext: 'Customer context.',
        whyNow: 'Reason for timing.',
        outcomes: ['Outcome.'],
        successCriteria: ['Success criterion.'],
        recommendationStatus: 'later',
      }],
    })).toThrow('Invalid account journey narrative')
  })
})