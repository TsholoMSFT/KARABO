import { UseCase, RICEScore } from './types'

export function calculateRICEScore(useCase: UseCase): number {
  const { reach, impact, confidence, effort } = useCase.rice
  if (effort === 0) return 0
  return (reach * impact * (confidence / 100)) / Math.max(effort, 0.1)
}

export function getRankedUseCases(
  useCases: UseCase[],
  method: 'impact-feasibility' | 'rice'
): UseCase[] {
  if (method === 'impact-feasibility') {
    return [...useCases].sort((a, b) => {
      const scoreA = a.impact * a.feasibility
      const scoreB = b.impact * b.feasibility
      if (scoreB === scoreA) return a.createdAt - b.createdAt
      return scoreB - scoreA
    })
  } else {
    return [...useCases].sort((a, b) => {
      const scoreA = calculateRICEScore(a)
      const scoreB = calculateRICEScore(b)
      if (scoreB === scoreA) return a.createdAt - b.createdAt
      return scoreB - scoreA
    })
  }
}

export function getTopUseCases(
  useCases: UseCase[],
  method: 'impact-feasibility' | 'rice',
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
