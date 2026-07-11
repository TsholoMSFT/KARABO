import { describe, it, expect } from 'vitest'
import type { UseCase, MACCCommitment, AIGovernanceAssessment, AIGovernanceDimension } from './types'
import {
  createBlocker,
  isBlockerOverdue,
  needsEscalation,
  resolveBlocker,
  summarizeBlockers,
} from './blocker-engine'
import { buildConsumptionPlan, isConsumptionOnTrack } from './consumption-planning-engine'
import type { ConsumptionDataPoint } from './fy27-types'
import {
  buildSecureAIAssessment,
  refreshSecureAIAssessment,
  isRefreshOverdue,
  bandForPosture,
} from './secure-ai-assessment-engine'
import {
  relationshipHealth,
  influenceQuadrant,
  createRelationship,
  createInteraction,
  deriveLastContact,
} from './relationship-engine'
import { buildDefaultRoadmap, createEmptyRoadmap, summarizeRoadmap } from './roadmap-engine'
import { computeFy27Scorecard, bandForFocus } from './fy27-alignment-engine'
import type { Fy27AlignmentSignals } from './fy27-types'

const DAY = 24 * 60 * 60 * 1000

// ── Blocker engine ─────────────────────────────────────────────────────────

describe('blocker-engine', () => {
  it('flags a critical, overdue, open blocker for escalation', () => {
    const now = Date.now()
    const b = createBlocker({ title: 'x', priority: 'critical', targetResolutionDate: now - DAY })
    expect(isBlockerOverdue(b, now)).toBe(true)
    expect(needsEscalation(b, now)).toBe(true)
  })

  it('does not escalate resolved or on-time blockers', () => {
    const now = Date.now()
    const onTime = createBlocker({ title: 'x', priority: 'critical', targetResolutionDate: now + DAY })
    expect(needsEscalation(onTime, now)).toBe(false)
    const resolved = resolveBlocker(createBlocker({ title: 'y', priority: 'high', targetResolutionDate: now - DAY }))
    expect(needsEscalation(resolved, now)).toBe(false)
    expect(isBlockerOverdue(resolved, now)).toBe(false)
  })

  it('summarizes counts', () => {
    const now = Date.now()
    const s = summarizeBlockers(
      [
        createBlocker({ title: 'a', priority: 'critical', targetResolutionDate: now - DAY }),
        resolveBlocker(createBlocker({ title: 'b', priority: 'low' })),
      ],
      now,
    )
    expect(s.total).toBe(2)
    expect(s.open).toBe(1)
    expect(s.resolved).toBe(1)
    expect(s.overdue).toBe(1)
    expect(s.needingEscalation).toBe(1)
  })
})

// ── Consumption planning ────────────────────────────────────────────────────

function commitment(overrides: Partial<MACCCommitment> = {}): MACCCommitment {
  const now = Date.now()
  return {
    totalAmount: 1_000_000,
    startDate: now - 90 * DAY,
    endDate: now + 365 * DAY,
    remainingBalance: 1_000_000,
    currentACR: 40_000,
    lastUpdated: now,
    ...overrides,
  }
}

describe('consumption-planning-engine', () => {
  const history: ConsumptionDataPoint[] = [
    { period: 'm1', acr: 30_000 },
    { period: 'm2', acr: 40_000 },
    { period: 'm3', acr: 50_000 },
  ]

  it('computes burn rate and current ACR', () => {
    const plan = buildConsumptionPlan('acct', history, commitment())
    expect(plan.burnRatePerMonth).toBe(40_000)
    expect(plan.currentMonthlyACR).toBe(50_000)
    expect(plan.forecast.length).toBe(6)
    expect(plan.projectedExhaustionDate).toBeGreaterThan(Date.now())
  })

  it('raises a critical alert when exhaustion is imminent', () => {
    const plan = buildConsumptionPlan('acct', [{ period: 'm1', acr: 100_000 }], commitment({ remainingBalance: 150_000 }))
    expect(plan.alerts.some((a) => a.severity === 'critical')).toBe(true)
    expect(isConsumptionOnTrack(plan)).toBe(false)
  })

  it('warns on projected under-consumption', () => {
    const plan = buildConsumptionPlan('acct', [{ period: 'm1', acr: 1_000 }], commitment({ remainingBalance: 1_000_000 }))
    expect(plan.alerts.some((a) => a.severity === 'warning')).toBe(true)
  })

  it('emits an info alert when there is no commitment', () => {
    const plan = buildConsumptionPlan('acct', history, undefined)
    expect(plan.alerts.some((a) => a.severity === 'info')).toBe(true)
  })
})

// ── Secure AI Assessment ────────────────────────────────────────────────────

function governance(level: AIGovernanceAssessment['overallMaturityLabel'] = 'managed'): AIGovernanceAssessment {
  const dims: AIGovernanceDimension[] = [
    'ai-strategy', 'data-governance', 'model-lifecycle', 'ethics-fairness', 'security-privacy', 'monitoring-accountability',
  ]
  const dimensionScores = Object.fromEntries(dims.map((d) => [d, level])) as AIGovernanceAssessment['dimensionScores']
  return {
    dimensionScores,
    overallMaturity: 4,
    overallMaturityLabel: level,
    gaps: [],
    recommendations: [],
    assessedAt: Date.now(),
  }
}

describe('secure-ai-assessment-engine', () => {
  it('aggregates governance into a posture score', () => {
    const a = buildSecureAIAssessment({ customerName: 'Contoso', governance: governance() })
    // managed = 4/5 -> 80 for both governance and responsible-ai dims
    expect(a.postureScore).toBe(80)
    expect(a.postureBand).toBe('strong')
    expect(a.dimensions.length).toBe(2)
  })

  it('refreshes into a linked new version', () => {
    const v1 = buildSecureAIAssessment({ customerName: 'Contoso', governance: governance() })
    const v2 = refreshSecureAIAssessment(v1, { customerName: 'Contoso', governance: governance() })
    expect(v2.version).toBe(2)
    expect(v2.refreshedFromId).toBe(v1.id)
    expect(v2.status).toBe('active')
  })

  it('detects overdue refresh', () => {
    const a = buildSecureAIAssessment({ customerName: 'Contoso', governance: governance() })
    expect(isRefreshOverdue(a, a.assessmentDate)).toBe(false)
    expect(isRefreshOverdue(a, (a.nextRefreshDue ?? 0) + 1)).toBe(true)
  })

  it('maps posture bands', () => {
    expect(bandForPosture(10)).toBe('critical')
    expect(bandForPosture(90)).toBe('leading')
  })
})

// ── Relationship engine ─────────────────────────────────────────────────────

describe('relationship-engine', () => {
  it('bands relationship health by recency', () => {
    const now = Date.now()
    expect(relationshipHealth(now - 10 * DAY, 'supportive', now)).toBe('strong')
    expect(relationshipHealth(now - 120 * DAY, 'supportive', now)).toBe('stale')
    expect(relationshipHealth(undefined, 'supportive', now)).toBe('none')
  })

  it('caps opposed contacts at at-risk', () => {
    const now = Date.now()
    expect(relationshipHealth(now - 5 * DAY, 'opposed', now)).toBe('at-risk')
  })

  it('maps influence quadrants', () => {
    expect(influenceQuadrant(8, 8)).toBe('manage-closely')
    expect(influenceQuadrant(8, 2)).toBe('keep-satisfied')
    expect(influenceQuadrant(2, 8)).toBe('keep-informed')
    expect(influenceQuadrant(2, 2)).toBe('monitor')
  })

  it('derives last contact from interactions', () => {
    const rel = createRelationship({ name: 'Jane', role: 'CFO', stakeholderType: 'economic-buyer', disposition: 'neutral' })
    const older = createInteraction({ type: 'call', summary: 'a', stakeholderId: rel.id, date: 1_000 })
    const newer = createInteraction({ type: 'meeting', summary: 'b', stakeholderId: rel.id, date: 5_000 })
    expect(deriveLastContact(rel, [older, newer])).toBe(5_000)
  })
})

// ── Roadmap engine ──────────────────────────────────────────────────────────

describe('roadmap-engine', () => {
  const uc = (id: string, title: string) => ({ id, title } as UseCase)

  it('splits ordered use cases across three horizons', () => {
    const roadmap = buildDefaultRoadmap('Contoso', [uc('1', 'A'), uc('2', 'B'), uc('3', 'C')])
    expect(roadmap.phases.length).toBe(3)
    const summary = summarizeRoadmap(roadmap)
    expect(summary.objectiveCount).toBe(3)
    expect(summary.linkedUseCaseCount).toBe(3)
  })

  it('creates an empty three-horizon roadmap', () => {
    const roadmap = createEmptyRoadmap('Contoso')
    expect(roadmap.phases.length).toBe(3)
    expect(summarizeRoadmap(roadmap).objectiveCount).toBe(0)
  })
})

// ── FY27 alignment engine ───────────────────────────────────────────────────

describe('fy27-alignment-engine', () => {
  const baseSignals: Fy27AlignmentSignals = {
    hasBusinessEnvisioning: false,
    hasCompanyResearch: false,
    roadmapPhaseCount: 0,
    trackedRelationships: 0,
    staleRelationships: 0,
    interactionsLast90Days: 0,
    hasSecureAIAssessment: false,
    secureAIRefreshOverdue: false,
    totalUseCases: 0,
    qualifiedOpportunities: 0,
    opportunitiesStage2Plus: 0,
    hasMaccCommitment: false,
    openBlockers: 0,
    overdueBlockers: 0,
  }

  it('produces six focus scores within range', () => {
    const card = computeFy27Scorecard(baseSignals)
    expect(card.focusScores.length).toBe(6)
    for (const f of card.focusScores) {
      expect(f.score).toBeGreaterThanOrEqual(0)
      expect(f.score).toBeLessThanOrEqual(100)
    }
    expect(card.overallScore).toBeGreaterThanOrEqual(0)
    expect(card.overallScore).toBeLessThanOrEqual(100)
  })

  it('rewards a well-covered account with a higher overall score', () => {
    const strong: Fy27AlignmentSignals = {
      ...baseSignals,
      hasBusinessEnvisioning: true,
      hasCompanyResearch: true,
      roadmapPhaseCount: 3,
      trackedRelationships: 5,
      interactionsLast90Days: 4,
      hasSecureAIAssessment: true,
      secureAIPostureScore: 85,
      totalUseCases: 10,
      qualifiedOpportunities: 3,
      opportunitiesStage2Plus: 2,
      hasMaccCommitment: true,
      consumptionOnTrack: true,
    }
    expect(computeFy27Scorecard(strong).overallScore).toBeGreaterThan(computeFy27Scorecard(baseSignals).overallScore)
  })

  it('maps focus bands', () => {
    expect(bandForFocus(80)).toBe('strong')
    expect(bandForFocus(10)).toBe('weak')
  })
})
