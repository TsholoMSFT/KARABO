import type { UseCase, ScoringMethod } from './types'

export function calculateRICEScore(useCase: UseCase): number {
  if (!useCase.rice) return 0
  const { reach, impact, confidence, effort } = useCase.rice
  if (!effort) return 0
  return (reach * impact * (confidence / 100)) / Math.max(effort, 0.1)
}

export function calculateFinancialImpactScore(useCase: UseCase): number {
  const annualValue = useCase.expectedValue?.totalAnnualValue || 0
  const annualCOI = useCase.costOfInaction?.totalAnnualCOI || 0
  // Use the higher of Value vs COI as the primary “financial impact” signal.
  return Math.max(annualValue, annualCOI)
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
      if (scoreB === scoreA) return a.createdAt - b.createdAt
      return scoreB - scoreA
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
