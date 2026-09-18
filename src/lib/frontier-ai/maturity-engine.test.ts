import { describe, expect, it } from 'vitest'
import {
  FRONTIER_OFFERINGS,
  FRONTIER_WORKSTREAM_SEQUENCES,
  type FrontierReadinessRatings,
} from './catalog'
import {
  buildFrontierRoadmap,
  computeFrontierMaturity,
  getCustomerVisibleRoadmap,
} from './maturity-engine'

function ratings(overrides: Partial<FrontierReadinessRatings> = {}): FrontierReadinessRatings {
  return {
    ai_platform: 0,
    database_platform: 0,
    application_platform: 0,
    secure_the_solution: 0,
    secure_the_user: 0,
    m365_copilot: 0,
    copilot_chat: 0,
    copilot_studio: 0,
    github_copilot: 0,
    ...overrides,
  }
}

describe('computeFrontierMaturity', () => {
  it('classifies an all-zero assessment as Exploring', () => {
    expect(computeFrontierMaturity(ratings())).toMatchObject({
      stage: 'Exploring',
      pillarsAtThreshold: 0,
      aiPillarsAtThreshold: 0,
    })
  })

  it('classifies activity below threshold as Planning', () => {
    expect(computeFrontierMaturity(ratings({ database_platform: 2 })).stage).toBe('Planning')
  })

  it('classifies one threshold pillar as Implementing', () => {
    expect(computeFrontierMaturity(ratings({ database_platform: 3 })).stage).toBe('Implementing')
  })

  it('keeps two non-AI threshold pillars at Implementing', () => {
    expect(computeFrontierMaturity(ratings({
      database_platform: 3,
      application_platform: 4,
    })).stage).toBe('Implementing')
  })

  it('classifies two threshold pillars including an AI pillar as Scaling', () => {
    expect(computeFrontierMaturity(ratings({
      ai_platform: 3,
      database_platform: 3,
    })).stage).toBe('Scaling')
  })

  it('classifies seven threshold pillars as Realizing regardless of AI count', () => {
    expect(computeFrontierMaturity(ratings({
      ai_platform: 3,
      database_platform: 3,
      application_platform: 3,
      secure_the_solution: 3,
      secure_the_user: 3,
      m365_copilot: 3,
      copilot_chat: 3,
    })).stage).toBe('Realizing')
  })
})

describe('buildFrontierRoadmap', () => {
  it('preserves the exact source ordering for all three workstreams', () => {
    const roadmap = buildFrontierRoadmap(ratings())

    expect(roadmap.workstreams.map((workstream) => workstream.offeringIds)).toEqual([
      FRONTIER_WORKSTREAM_SEQUENCES.shared,
      FRONTIER_WORKSTREAM_SEQUENCES.trusted,
      FRONTIER_WORKSTREAM_SEQUENCES.agentify,
    ])
  })

  it('uses the source entry indexes for an Implementing customer', () => {
    const roadmap = buildFrontierRoadmap(ratings({ database_platform: 3 }))
    const [shared, trusted, agentify] = roadmap.workstreams

    expect(shared.steps.map((step) => step.status)).toEqual([
      'assumed-in-place', 'assumed-in-place', 'start-now', 'next', 'later',
    ])
    expect(trusted.steps.map((step) => step.status)).toEqual([
      'revisit-gap', 'revisit-gap', 'start-now', 'next', 'later', 'later',
    ])
    expect(agentify.steps.map((step) => step.status)).toEqual([
      'revisit-gap', 'start-now', 'next', 'later',
    ])
  })

  it('marks completed-position offerings for revisit when linked pillars are weak', () => {
    const roadmap = buildFrontierRoadmap(ratings({
      ai_platform: 3,
      database_platform: 3,
    }))
    const trusted = roadmap.workstreams.find((workstream) => workstream.id === 'trusted')

    expect(trusted?.steps.find((step) => step.offeringId === '12')?.status).toBe('revisit-gap')
    expect(trusted?.steps.find((step) => step.offeringId === '08')?.status).toBe('start-now')
  })

  it('returns the four weakest pillar gaps with mapped offerings', () => {
    const roadmap = buildFrontierRoadmap(ratings({ ai_platform: 2, database_platform: 1 }))

    expect(roadmap.priorityGaps).toHaveLength(4)
    expect(roadmap.priorityGaps[0]).toMatchObject({
      pillarId: 'application_platform',
      rating: 0,
      offeringIds: ['12'],
    })
    expect(roadmap.priorityGaps.every((gap) => gap.offeringIds.length > 0)).toBe(true)
  })

  it('adds the source governance warning without changing sequence order', () => {
    const input = ratings({
      ai_platform: 3,
      database_platform: 3,
      secure_the_solution: 2,
      secure_the_user: 2,
    })
    const roadmap = buildFrontierRoadmap(input)

    expect(roadmap.maturity.stage).toBe('Scaling')
    expect(roadmap.warnings).toContainEqual(expect.objectContaining({ offeringId: '08' }))
    expect(roadmap.workstreams.find((workstream) => workstream.id === 'trusted')?.offeringIds)
      .toEqual(FRONTIER_WORKSTREAM_SEQUENCES.trusted)
  })

  it('keeps offering 15 in source calculations but removes it from customer output', () => {
    expect(FRONTIER_OFFERINGS['15'].publicationStatus).toBe('draft')

    const internal = buildFrontierRoadmap(ratings())
    const customerVisible = getCustomerVisibleRoadmap(internal)
    const internalAgentify = internal.workstreams.find((workstream) => workstream.id === 'agentify')
    const visibleAgentify = customerVisible.workstreams.find((workstream) => workstream.id === 'agentify')

    expect(internalAgentify?.offeringIds).toContain('15')
    expect(visibleAgentify?.offeringIds).not.toContain('15')
    expect(visibleAgentify?.steps.some((step) => step.offeringId === '15')).toBe(false)
  })
})