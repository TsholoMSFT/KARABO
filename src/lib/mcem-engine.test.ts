import { describe, it, expect } from 'vitest'
import type { UseCase } from './types'
import {
  getUseCasePipelineStatus,
  summarizePipeline,
  promoteUseCasesToOpportunity,
  evaluateStageGate,
  canAdvanceStage,
  advanceStage,
  closeOpportunity,
  prepareHandoff,
  acceptHandoff,
  buildHandoffChecklist,
  recommendedNextAction,
  getOpportunityUseCases,
} from './mcem-engine'
import type { Opportunity } from './mcem'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let seq = 0
function makeUseCase(overrides: Partial<UseCase> = {}): UseCase {
  seq += 1
  return {
    id: `uc-${seq}`,
    title: `Use case ${seq}`,
    description: 'desc',
    impact: 5,
    feasibility: 5,
    rice: { reach: 100, impact: 1, confidence: 50, effort: 1 },
    createdAt: Date.now(),
    ...overrides,
  }
}

/** A use case that has cleared every gate up to Stage 4. */
function fullyQualifiedUseCase(overrides: Partial<UseCase> = {}): UseCase {
  return makeUseCase({
    problemConfirmed: true,
    problemStatement: 'Customer problem',
    microsoftSolutions: [{ name: 'Azure AI', role: 'primary' } as never],
    regulatoryAssessment: { frameworks: [] } as never,
    costOfInaction: { directCosts: { oneTime: 0, recurring: 0 } } as never,
    expectedValue: { revenueImpact: { oneTime: 0, recurring: 0 } } as never,
    businessCase: { markdown: '# Case', generatedAt: Date.now() },
    ...overrides,
  })
}

function promote(useCases: UseCase[]): Opportunity {
  return promoteUseCasesToOpportunity(useCases, { customerId: 'cust-1' })
}

// ---------------------------------------------------------------------------
// Funnel status
// ---------------------------------------------------------------------------

describe('getUseCasePipelineStatus', () => {
  it('treats a freshly generated use case as a candidate', () => {
    expect(getUseCasePipelineStatus(makeUseCase(), [])).toBe('candidate')
  })

  it('marks a confirmed-problem use case as validated', () => {
    expect(getUseCasePipelineStatus(makeUseCase({ problemConfirmed: true }), [])).toBe('validated')
  })

  it('parks deferred and no-go use cases', () => {
    expect(getUseCasePipelineStatus(makeUseCase({ disposition: 'defer' }), [])).toBe('parked')
    expect(getUseCasePipelineStatus(makeUseCase({ disposition: 'no-go' }), [])).toBe('parked')
  })

  it('marks a use case inside an opportunity as promoted (overrides other states)', () => {
    const uc = makeUseCase({ problemConfirmed: true })
    const opp = promote([uc])
    expect(getUseCasePipelineStatus(uc, [opp])).toBe('promoted')
  })
})

describe('summarizePipeline', () => {
  it('counts the funnel and opportunities per stage', () => {
    const candidate = makeUseCase()
    const validated = makeUseCase({ problemConfirmed: true })
    const parked = makeUseCase({ disposition: 'no-go' })
    const promoted = makeUseCase({ problemConfirmed: true })
    const opp = promote([promoted])

    const summary = summarizePipeline([candidate, validated, parked, promoted], [opp])
    expect(summary.total).toBe(4)
    expect(summary.candidate).toBe(1)
    expect(summary.validated).toBe(1)
    expect(summary.parked).toBe(1)
    expect(summary.promoted).toBe(1)
    expect(summary.byStage[1]).toBe(1)
    expect(summary.byStage[4]).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Promotion
// ---------------------------------------------------------------------------

describe('promoteUseCasesToOpportunity', () => {
  it('creates a Stage 1 opportunity owned by the ATU with an initial transition', () => {
    const uc = makeUseCase({ problemConfirmed: true, title: 'Fraud detection' })
    const opp = promote([uc])
    expect(opp.stage).toBe(1)
    expect(opp.status).toBe('qualifying')
    expect(opp.owningRole).toBe('ATU')
    expect(opp.name).toBe('Fraud detection')
    expect(opp.useCaseIds).toEqual([uc.id])
    expect(opp.history).toHaveLength(1)
    expect(opp.history[0].from).toBeNull()
    expect(opp.history[0].to).toBe(1)
  })

  it('drops parked use cases and only promotes survivors', () => {
    const survivor = makeUseCase({ problemConfirmed: true })
    const dead = makeUseCase({ disposition: 'no-go' })
    const opp = promoteUseCasesToOpportunity([survivor, dead], { customerId: 'c' })
    expect(opp.useCaseIds).toEqual([survivor.id])
  })

  it('throws when nothing survives', () => {
    const dead = makeUseCase({ disposition: 'defer' })
    expect(() => promoteUseCasesToOpportunity([dead], { customerId: 'c' })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Stage gates + transitions
// ---------------------------------------------------------------------------

describe('evaluateStageGate / advanceStage', () => {
  it('blocks Stage 1 until the problem is confirmed and scored', () => {
    const uc = makeUseCase({ problemConfirmed: false })
    const opp = promoteUseCasesToOpportunity([uc], { customerId: 'c' })
    const gate = evaluateStageGate(opp, [uc])
    expect(gate.ready).toBe(false)
    expect(canAdvanceStage(opp, [uc])).toBe(false)
    expect(() => advanceStage(opp, [uc])).toThrow()
  })

  it('clears Stage 1 when validated and scored, advancing to designing', () => {
    const uc = makeUseCase({ problemConfirmed: true, impact: 8, feasibility: 6 })
    const opp = promote([uc])
    expect(canAdvanceStage(opp, [uc])).toBe(true)
    const next = advanceStage(opp, [uc], { by: 'SE Sam' })
    expect(next.stage).toBe(2)
    expect(next.status).toBe('designing')
    expect(next.owningRole).toBe('STU')
    expect(next.history).toHaveLength(2)
    // input is not mutated
    expect(opp.stage).toBe(1)
  })

  it('allows a forced advance even when the gate is not met', () => {
    const uc = makeUseCase({ problemConfirmed: false })
    const opp = promote([uc])
    const next = advanceStage(opp, [uc], { force: true })
    expect(next.stage).toBe(2)
  })

  it('enforces the Stage 2 solution + compliance gate', () => {
    const uc = fullyQualifiedUseCase()
    let opp = promote([uc])
    opp = advanceStage(opp, [uc]) // -> stage 2
    expect(evaluateStageGate(opp, [uc]).ready).toBe(true)

    const noScope = fullyQualifiedUseCase({ microsoftSolutions: undefined, solutionPlays: undefined })
    let opp2 = promote([noScope])
    opp2 = advanceStage(opp2, [noScope]) // -> stage 2
    expect(evaluateStageGate(opp2, [noScope]).ready).toBe(false)
  })

  it('walks a fully-qualified use case from Stage 1 to Stage 4', () => {
    const uc = fullyQualifiedUseCase()
    let opp = promote([uc])
    opp = advanceStage(opp, [uc]) // 2
    opp = advanceStage(opp, [uc]) // 3
    expect(evaluateStageGate(opp, [uc]).ready).toBe(true)
    opp = advanceStage(opp, [uc]) // 4
    expect(opp.stage).toBe(4)
    expect(opp.status).toBe('handoff-ready')
    expect(opp.owningRole).toBe('CSU')
  })

  it('refuses to advance past Stage 4', () => {
    const uc = fullyQualifiedUseCase()
    let opp = promote([uc])
    opp = advanceStage(opp, [uc])
    opp = advanceStage(opp, [uc])
    opp = advanceStage(opp, [uc])
    expect(canAdvanceStage(opp, [uc])).toBe(false)
    expect(() => advanceStage(opp, [uc])).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Stage 4 handshake
// ---------------------------------------------------------------------------

describe('handshake to CSU', () => {
  function atStage4(uc: UseCase): Opportunity {
    let opp = promote([uc])
    opp = advanceStage(opp, [uc])
    opp = advanceStage(opp, [uc])
    opp = advanceStage(opp, [uc])
    return opp
  }

  it('builds a checklist that reflects captured data', () => {
    const uc = fullyQualifiedUseCase()
    const opp = atStage4(uc)
    const checklist = buildHandoffChecklist(opp, [uc])
    expect(checklist.find((i) => i.id === 'validated')?.done).toBe(true)
    expect(checklist.find((i) => i.id === 'owner')?.done).toBe(false)
  })

  it('is not handoff-complete until prepared, checked, and accepted', () => {
    const uc = fullyQualifiedUseCase()
    let opp = atStage4(uc)
    expect(evaluateStageGate(opp, [uc]).ready).toBe(false) // nothing prepared yet

    opp = prepareHandoff(opp, [uc], { csaName: 'CSA Casey' })
    expect(opp.status).toBe('handoff-ready')
    // 'owner' item ticked because a CSA was named; remaining items already done
    const gateAfterPrepare = evaluateStageGate(opp, [uc])
    expect(gateAfterPrepare.requirements.find((r) => r.id === 'csa-accepted')?.met).toBe(false)

    opp = acceptHandoff(opp, 'CSA Casey', { by: 'CSA Casey' })
    expect(opp.status).toBe('handed-off')
    expect(evaluateStageGate(opp, [uc]).ready).toBe(true)
    expect(opp.handoff?.acceptedAt).toBeTruthy()
  })

  it('cannot prepare a handshake before Stage 4', () => {
    const uc = fullyQualifiedUseCase()
    const opp = promote([uc])
    expect(() => prepareHandoff(opp, [uc])).toThrow()
  })

  it('cannot accept a handshake that was never prepared', () => {
    const uc = fullyQualifiedUseCase()
    const opp = atStage4(uc)
    expect(() => acceptHandoff(opp, 'CSA Casey')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('closeOpportunity', () => {
  it('marks closed-lost and records the reason', () => {
    const uc = makeUseCase({ problemConfirmed: true })
    const opp = promote([uc])
    const closed = closeOpportunity(opp, { note: 'Budget cut' })
    expect(closed.status).toBe('closed-lost')
    expect(closed.history[closed.history.length - 1]?.note).toBe('Budget cut')
  })
})

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

describe('getOpportunityUseCases', () => {
  it('resolves the use-case objects backing an opportunity', () => {
    const a = makeUseCase({ problemConfirmed: true })
    const b = makeUseCase({ problemConfirmed: true })
    const opp = promoteUseCasesToOpportunity([a, b], { customerId: 'c' })
    const resolved = getOpportunityUseCases(opp, [a, b, makeUseCase()])
    expect(resolved.map((u) => u.id).sort()).toEqual([a.id, b.id].sort())
  })
})

describe('recommendedNextAction', () => {
  it('surfaces the first unmet gate requirement', () => {
    const uc = makeUseCase({ problemConfirmed: false })
    const opp = promote([uc])
    expect(recommendedNextAction(opp, [uc])).toMatch(/problem statement/i)
  })

  it('prompts to advance when the gate is clear', () => {
    const uc = makeUseCase({ problemConfirmed: true, impact: 7, feasibility: 6 })
    const opp = promote([uc])
    expect(recommendedNextAction(opp, [uc])).toMatch(/advance to stage 2/i)
  })

  it('reports a handed-off opportunity as done', () => {
    const uc = fullyQualifiedUseCase()
    let opp = promote([uc])
    opp = advanceStage(opp, [uc])
    opp = advanceStage(opp, [uc])
    opp = advanceStage(opp, [uc])
    opp = prepareHandoff(opp, [uc], { csaName: 'CSA Casey' })
    opp = acceptHandoff(opp, 'CSA Casey')
    expect(recommendedNextAction(opp, [uc])).toMatch(/done/i)
  })
})
