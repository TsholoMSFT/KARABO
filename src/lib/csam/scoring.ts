/**
 * CSAM cockpit scoring engine (Sections 1, 5, 7 + the Value Leakage Waterfall).
 *
 * Deterministic, explainable scoring derived from the data in a
 * CsamCustomerProfile. Every score is "higher is better" (0-100) so the
 * traffic-light colouring is consistent, and every score carries a confidence
 * band reflecting how much evidence backed it.
 */
import {
  ADOPTION_STAGE_ORDER,
  ADOPTION_STAGE_LABELS,
  COCKPIT_SCORE_LABELS,
  type AdoptionStage,
  type CockpitScore,
  type CockpitScoreId,
  type CsamConfidence,
  type CsamCustomerProfile,
  type CsamUseCase,
  type PrioritisationCategory,
  type PrioritisedUseCase,
  type ScoreDimension,
} from './types'
import {
  confidenceFromCoverage,
  scoreToColorState,
  weakestConfidence,
} from './guardrails'

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0)

/** 0-100 maturity value for an adoption stage along the value-leakage path. */
export function adoptionStageValue(stage: AdoptionStage): number {
  const idx = ADOPTION_STAGE_ORDER.indexOf(stage)
  if (idx < 0) return 0
  return Math.round((idx / (ADOPTION_STAGE_ORDER.length - 1)) * 100)
}

// ----------------------------------------------------------------------------
// SECTION 1 — the five executive scores
// ----------------------------------------------------------------------------

function build(
  id: CockpitScoreId,
  score: number,
  confidence: CsamConfidence,
  dimensions: ScoreDimension[],
  rationale: string,
): CockpitScore {
  return {
    id,
    label: COCKPIT_SCORE_LABELS[id],
    score: Math.round(clamp(score)),
    colorState: scoreToColorState(score, confidence),
    confidence,
    dimensions,
    rationale,
  }
}

export function computeValueRealisationScore(p: CsamCustomerProfile): CockpitScore {
  const dims: ScoreDimension[] = p.useCases.map((uc) => ({
    id: uc.id,
    label: uc.name,
    score: adoptionStageValue(uc.adoptionStage),
    note: ADOPTION_STAGE_LABELS[uc.adoptionStage],
  }))
  const stageScore = avg(dims.map((d) => d.score))
  // Usage adoption gap drags realisation down.
  const gaps = p.usageSignals.map((u) => u.adoptionGapPct).filter((g): g is number => typeof g === 'number')
  const gapPenalty = gaps.length ? avg(gaps) * 0.4 : 0
  const score = clamp(stageScore - gapPenalty)
  const confidence = confidenceFromCoverage(dims.length + gaps.length, p.useCases.length + p.investments.length)
  return build(
    'value-realisation',
    score,
    confidence,
    dims,
    'Average position of each use case along the purchase\u2192executive-value path, less the measured usage gap.',
  )
}

const COLOR_TO_SCORE = { green: 100, amber: 60, red: 25, grey: 50 } as const
const RISK_WEIGHT = { low: 1, medium: 1.5, high: 2.5, critical: 4 } as const

export function computeHealthScore(p: CsamCustomerProfile): CockpitScore {
  const dims: ScoreDimension[] = p.healthSignals.map((h) => ({
    id: h.id,
    label: h.dimension,
    score: COLOR_TO_SCORE[h.status],
    note: h.riskLevel,
  }))
  // Risk-weighted average so critical dimensions dominate.
  let weighted = 0
  let weight = 0
  for (const h of p.healthSignals) {
    const w = RISK_WEIGHT[h.riskLevel]
    weighted += COLOR_TO_SCORE[h.status] * w
    weight += w
  }
  const score = weight ? weighted / weight : 0
  const confidence = confidenceFromCoverage(p.healthSignals.length, 8)
  return build(
    'health',
    score,
    confidence,
    dims,
    'Risk-weighted average of resiliency, security, incident-readiness and operational health signals.',
  )
}

export function computeAdoptionMaturityScore(p: CsamCustomerProfile): CockpitScore {
  const factorScores: number[] = []
  const dims: ScoreDimension[] = []
  for (const d of p.adoption) {
    for (const [factor, value] of Object.entries(d.scores)) {
      if (typeof value === 'number') {
        factorScores.push(value)
        dims.push({ id: `${d.id}-${factor}`, label: factor, score: value })
      }
    }
  }
  const blockerPenalty = avg(p.adoption.map((d) => d.blockers.length)) * 6
  const score = clamp(avg(factorScores) - blockerPenalty)
  const confidence = confidenceFromCoverage(factorScores.length, p.useCases.length * 4 || 4)
  return build(
    'adoption-maturity',
    score,
    confidence,
    dims,
    'Average behavioural-readiness (ADKAR + trust/friction/incentives) less a penalty for active blockers.',
  )
}

const VALIDATION_SCORE = { 'customer-validated': 100, 'in-validation': 60, 'hypothesis': 30 } as const

export function computeFinancialImpactConfidence(p: CsamCustomerProfile): CockpitScore {
  const dims: ScoreDimension[] = p.financialImpacts.map((f) => ({
    id: f.id,
    label: f.lineItem,
    score: VALIDATION_SCORE[f.validationStatus],
    note: f.validationStatus,
  }))
  const score = avg(dims.map((d) => d.score))
  const confidence = confidenceFromCoverage(p.financialImpacts.length, 6)
  return build(
    'financial-impact-confidence',
    score,
    confidence,
    dims,
    'How much of the mapped financial impact is customer-validated vs. still a hypothesis to test.',
  )
}

export function computeRiskToValueScore(p: CsamCustomerProfile): CockpitScore {
  // Higher = safer (lower risk to value), to keep colours consistent.
  const health = computeHealthScore(p).score
  const adoption = computeAdoptionMaturityScore(p).score
  const renewal = p.renewalSignal ? COLOR_TO_SCORE[p.renewalSignal] : 50
  const criticalCount = p.healthSignals.filter((h) => h.riskLevel === 'critical').length
  const criticalPenalty = criticalCount * 10
  const score = clamp(health * 0.4 + adoption * 0.35 + renewal * 0.25 - criticalPenalty)
  const confidence = weakestConfidence([
    computeHealthScore(p).confidence,
    computeAdoptionMaturityScore(p).confidence,
  ])
  return build(
    'risk-to-value',
    score,
    confidence,
    [
      { id: 'health', label: 'Health', score: Math.round(health) },
      { id: 'adoption', label: 'Adoption', score: Math.round(adoption) },
      { id: 'renewal', label: 'Renewal signal', score: renewal },
    ],
    'Composite value-protection score (higher = lower risk to value): health + adoption + renewal, less critical risks.',
  )
}

export function computeAllScores(p: CsamCustomerProfile): CockpitScore[] {
  return [
    computeValueRealisationScore(p),
    computeHealthScore(p),
    computeAdoptionMaturityScore(p),
    computeFinancialImpactConfidence(p),
    computeRiskToValueScore(p),
  ]
}

// ----------------------------------------------------------------------------
// VALUE LEAKAGE WATERFALL — % of use cases reaching each successive stage
// ----------------------------------------------------------------------------

export interface ValueLeakageStage {
  stage: AdoptionStage
  label: string
  reachedPct: number
  dropoffPct: number
}

export function valueLeakageStages(p: CsamCustomerProfile): ValueLeakageStage[] {
  const total = p.useCases.length
  let prev = 100
  return ADOPTION_STAGE_ORDER.map((stage, i) => {
    const reached = total
      ? Math.round(
          (p.useCases.filter((uc) => ADOPTION_STAGE_ORDER.indexOf(uc.adoptionStage) >= i).length / total) * 100,
        )
      : 0
    const dropoff = Math.max(0, prev - reached)
    prev = reached
    return { stage, label: ADOPTION_STAGE_LABELS[stage], reachedPct: reached, dropoffPct: dropoff }
  })
}

/** The single biggest value-leakage point (largest drop-off between stages). */
export function biggestLeakStage(p: CsamCustomerProfile): ValueLeakageStage | null {
  const stages = valueLeakageStages(p)
  let worst: ValueLeakageStage | null = null
  for (const s of stages) {
    if (!worst || s.dropoffPct > worst.dropoffPct) worst = s
  }
  return worst && worst.dropoffPct > 0 ? worst : null
}

// ----------------------------------------------------------------------------
// SECTION 7 — use-case prioritisation
// ----------------------------------------------------------------------------

export function prioritiseUseCases(p: CsamCustomerProfile): PrioritisedUseCase[] {
  return p.useCases
    .map((uc) => classifyUseCase(uc, p))
    .sort((a, b) => b.score - a.score)
}

function classifyUseCase(uc: CsamUseCase, p: CsamCustomerProfile): PrioritisedUseCase {
  const stageIdx = ADOPTION_STAGE_ORDER.indexOf(uc.adoptionStage)
  const usage = p.usageSignals.find((u) => u.investmentId === uc.linkedInvestmentId)
  const gap = usage?.adoptionGapPct ?? 0
  const investment = p.investments.find((i) => i.id === uc.linkedInvestmentId)
  const value = investment?.committedValueUSD ?? 0
  const hasRedHealthDep = (uc.healthDependencies ?? []).some((dim) =>
    p.healthSignals.some((h) => h.dimension === dim && (h.status === 'red' || h.riskLevel === 'critical')),
  )
  const hasBlockers = (uc.behaviouralBarriers ?? []).length > 0

  let category: PrioritisationCategory
  let rationale: string

  if (hasRedHealthDep) {
    category = 'health-remediation'
    rationale = 'A critical health dependency is putting realised value at risk; stabilise before scaling.'
  } else if (stageIdx >= ADOPTION_STAGE_ORDER.indexOf('financial-validated')) {
    category = 'expansion'
    rationale = 'Value is proven and validated \u2014 strong candidate to expand or replicate.'
  } else if (gap >= 40 || (hasBlockers && stageIdx <= ADOPTION_STAGE_ORDER.indexOf('activated'))) {
    category = 'adoption-recovery'
    rationale = 'Significant adoption gap with behavioural blockers \u2014 unlock value already paid for.'
  } else if (stageIdx >= ADOPTION_STAGE_ORDER.indexOf('embedded') && gap < 25) {
    category = 'quick-win'
    rationale = 'Already embedded with a small remaining gap \u2014 a fast push closes the loop to KPI/financial proof.'
  } else if (value >= 250_000 && stageIdx <= ADOPTION_STAGE_ORDER.indexOf('activated')) {
    category = 'strategic-bet'
    rationale = 'High committed value but early on the realisation path \u2014 worth a structured value plan.'
  } else if (stageIdx < 0) {
    category = 'deprioritise'
    rationale = 'Insufficient evidence to act \u2014 gather usage/health signals first.'
  } else {
    category = 'strategic-bet'
    rationale = 'Mid-path use case \u2014 progress with a value hypothesis and CSDR checkpoint.'
  }

  // Score blends remaining value-at-stake (gap), committed value and urgency.
  const valueScore = value > 0 ? clamp(Math.log10(value + 1) * 12) : 20
  const urgency = hasRedHealthDep ? 30 : 0
  const score = clamp(gap * 0.5 + valueScore + urgency)
  const confidence = usage?.confidence ?? 'low'
  return { useCase: uc, category, score: Math.round(score), confidence, rationale }
}

// ----------------------------------------------------------------------------
// SECTION 1 — top gaps / actions / conversation starters
// ----------------------------------------------------------------------------

export function topValueGaps(p: CsamCustomerProfile, limit = 3): string[] {
  const gaps: { text: string; weight: number }[] = []
  for (const uc of p.useCases) {
    const usage = p.usageSignals.find((u) => u.investmentId === uc.linkedInvestmentId)
    const gap = usage?.adoptionGapPct ?? 0
    if (gap >= 25) {
      gaps.push({
        text: `${uc.name}: ~${Math.round(gap)}% adoption gap vs. the investment thesis (${ADOPTION_STAGE_LABELS[uc.adoptionStage]}).`,
        weight: gap,
      })
    }
  }
  for (const h of p.healthSignals) {
    if (h.status === 'red' || h.riskLevel === 'critical') {
      gaps.push({ text: `${h.dimension}: ${h.businessImpact ?? 'health risk to value'}.`, weight: 80 })
    }
  }
  return gaps.sort((a, b) => b.weight - a.weight).slice(0, limit).map((g) => g.text)
}

export function topConversationStarters(p: CsamCustomerProfile, limit = 3): string[] {
  const starters: string[] = []
  const vr = computeValueRealisationScore(p)
  if (vr.colorState !== 'green') {
    starters.push('Where do you feel you are getting the most \u2014 and least \u2014 value from your current Microsoft investments?')
  }
  const leak = biggestLeakStage(p)
  if (leak) {
    starters.push(`Adoption appears to stall around "${leak.label}". What would make this stick in the flow of work?`)
  }
  const validated = p.financialImpacts.some((f) => f.validationStatus === 'customer-validated')
  if (!validated) {
    starters.push('Which business or financial metric would you most want this investment to move \u2014 and how do you measure it today?')
  }
  while (starters.length < limit) {
    starters.push('What would "great" look like for this investment at our next executive review?')
    break
  }
  return starters.slice(0, limit)
}
