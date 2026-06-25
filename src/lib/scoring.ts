import type { UseCase, ScoringMethod } from './types'
import { riskAdjustedAnnualValue, type ValueConfidence } from './value-credibility'

export function calculateRICEScore(useCase: UseCase): number {
  if (!useCase.rice) return 0
  const { reach, impact, confidence, effort } = useCase.rice
  if (!effort) return 0
  return (reach * impact * (confidence / 100)) / Math.max(effort, 0.1)
}

/** Confidence-weighted (risk-adjusted) financial signal: higher of Value vs COI, de-inflated by confidence. */
export function calculateRiskAdjustedFinancial(useCase: UseCase): number {
  const annualValue = useCase.expectedValue?.totalAnnualValue || 0
  const annualCOI = useCase.costOfInaction?.totalAnnualCOI || 0
  const base = Math.max(annualValue, annualCOI)
  const confidence = (useCase.expectedValue?.confidence ?? useCase.costOfInaction?.confidence) as ValueConfidence | undefined
  return riskAdjustedAnnualValue(base, confidence)
}

/**
 * Strategic merit on a 0..~100 scale with NO money in it, so a strong use case
 * with hard-to-verify financials is never dropped on numbers alone.
 */
export function calculateStrategicScore(useCase: UseCase): number {
  const impact = useCase.impact ?? 5            // 1..10
  const feasibility = useCase.feasibility ?? 5  // 1..10
  const align = useCase.strategicAlignment?.alignmentScore ?? 5 // 1..10
  const kpiCoverage = Math.min(useCase.kpis?.length ?? 0, 5) / 5 // 0..1
  return impact * 4 + feasibility * 3 + align * 2 + kpiCoverage * 10
}

/**
 * Blended ranking signal: strategic merit plus a log-scaled, risk-adjusted
 * financial nudge. A huge (often over-stated) number can't dominate, and a use
 * case with no verifiable value still ranks on strategic merit.
 */
export function calculateBlendedScore(useCase: UseCase): number {
  const strategic = calculateStrategicScore(useCase)
  const financial = calculateRiskAdjustedFinancial(useCase)
  const financialPoints = financial > 0 ? Math.min(40, Math.log10(financial + 1) * 6) : 0
  return strategic + financialPoints
}

export function calculateFinancialImpactScore(useCase: UseCase): number {
  // De-inflated: confidence-weighted instead of the raw (often over-stated) figure.
  return calculateRiskAdjustedFinancial(useCase)
}

export function getRankedUseCases(
  useCases: UseCase[],
  method: ScoringMethod
): UseCase[] {
  if (method === 'impact-feasibility') {
    return [...useCases].sort((a, b) => {
      const scoreA = a.impact * a.feasibility
      const scoreB = b.impact * b.feasibility
      if (scoreB === scoreA) return a.createdAt - b.createdAt
      return scoreB - scoreA
    })
  }

  if (method === 'financial-impact') {
    return [...useCases].sort((a, b) => {
      const scoreA = calculateFinancialImpactScore(a)
      const scoreB = calculateFinancialImpactScore(b)
      if (scoreB !== scoreA) return scoreB - scoreA
      // Tie (e.g. both unverified / zero) -> fall back to strategic merit, then recency.
      const stratB = calculateStrategicScore(b)
      const stratA = calculateStrategicScore(a)
      if (stratB !== stratA) return stratB - stratA
      return a.createdAt - b.createdAt
    })
  }

  return [...useCases].sort((a, b) => {
    const scoreA = calculateRICEScore(a)
    const scoreB = calculateRICEScore(b)
    if (scoreB === scoreA) return a.createdAt - b.createdAt
    return scoreB - scoreA
  })
}

export function getTopUseCases(
  useCases: UseCase[],
  method: ScoringMethod,
  count: number = 5
): UseCase[] {
  return getRankedUseCases(useCases, method).slice(0, count)
}

export function getQuadrant(impact: number, feasibility: number): string {
  const midPoint = 5.5
  if (impact >= midPoint && feasibility >= midPoint) return 'Quick Wins'
  if (impact >= midPoint && feasibility < midPoint) return 'Strategic Bets'
  if (impact < midPoint && feasibility >= midPoint) return 'Fill-ins'
  return 'Time Sinks'
}

export function getScoreColor(impact: number, feasibility: number): string {
  const score = impact * feasibility
  if (score >= 70) return 'oklch(0.58 0.18 195)'
  if (score >= 40) return 'oklch(0.60 0.18 250)'
  if (score >= 20) return 'oklch(0.65 0.20 310)'
  return 'oklch(0.55 0.15 270)'
}
