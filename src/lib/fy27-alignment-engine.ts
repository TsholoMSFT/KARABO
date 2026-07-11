/**
 * FY27 alignment engine (capstone) — turns a bundle of account signals into the
 * six-focus ATS FY27 alignment scorecard used by the leadership cockpit / export.
 * Pure & deterministic.
 */
import type {
  Fy27AlignmentScorecard,
  Fy27AlignmentSignals,
  Fy27FocusScore,
  Fy27FocusId,
  Fy27Band,
} from './fy27-types'
import { FY27_FOCUS_LABELS } from './fy27-types'

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function bandForFocus(score: number): Fy27Band {
  if (score >= 75) return 'strong'
  if (score >= 55) return 'moderate'
  if (score >= 35) return 'partial'
  return 'weak'
}

function scoreUnderstandDocument(s: Fy27AlignmentSignals): Fy27FocusScore {
  let score = 40
  const signals: string[] = []
  const gaps: string[] = []
  if (s.hasBusinessEnvisioning) { score += 25; signals.push('Business envisioning captured') }
  else gaps.push('Capture business objectives / envisioning')
  if (s.hasCompanyResearch) { score += 20; signals.push('Company research on file') }
  else gaps.push('Add company research (earnings / financials / news)')
  if (s.roadmapPhaseCount > 0) { score += 15; signals.push(`Transformation roadmap (${s.roadmapPhaseCount} phases)`) }
  else gaps.push('Build a transformation roadmap')
  return focus('understand-document', clamp(score), signals, gaps)
}

function scoreGrowRelationships(s: Fy27AlignmentSignals): Fy27FocusScore {
  const rel = Math.min(40, s.trackedRelationships * 8)
  const recency = Math.min(35, s.interactionsLast90Days * 7)
  const freshness = s.trackedRelationships > 0
    ? Math.round(25 * (1 - s.staleRelationships / s.trackedRelationships))
    : 0
  const signals: string[] = []
  const gaps: string[] = []
  if (s.trackedRelationships > 0) signals.push(`${s.trackedRelationships} decision-maker relationship(s) tracked`)
  else gaps.push('Map key decision makers')
  if (s.interactionsLast90Days > 0) signals.push(`${s.interactionsLast90Days} interaction(s) in last 90 days`)
  else gaps.push('Log recent stakeholder interactions')
  if (s.staleRelationships > 0) gaps.push(`${s.staleRelationships} relationship(s) going stale`)
  return focus('grow-relationships', clamp(rel + recency + freshness), signals, gaps)
}

function scoreSecureAI(s: Fy27AlignmentSignals): Fy27FocusScore {
  const signals: string[] = []
  const gaps: string[] = []
  let score: number
  if (!s.hasSecureAIAssessment) {
    score = 15
    gaps.push('Create a Customer Secure AI Assessment')
  } else {
    score = 50 + Math.round((s.secureAIPostureScore ?? 0) * 0.4)
    signals.push(`Secure AI Assessment posture ${s.secureAIPostureScore ?? 0}/100`)
    if (s.secureAIRefreshOverdue) { score -= 15; gaps.push('Refresh the Secure AI Assessment (overdue)') }
    else signals.push('Assessment within refresh window')
  }
  return focus('secure-ai-assessment', clamp(score), signals, gaps)
}

function scoreRobustPipeline(s: Fy27AlignmentSignals): Fy27FocusScore {
  const base = Math.min(50, s.totalUseCases * 5)
  const progressed = Math.min(50, s.opportunitiesStage2Plus * 15)
  const signals: string[] = []
  const gaps: string[] = []
  if (s.totalUseCases > 0) signals.push(`${s.totalUseCases} use case(s) in pipeline`)
  else gaps.push('Generate a use-case pipeline')
  if (s.opportunitiesStage2Plus > 0) signals.push(`${s.opportunitiesStage2Plus} opportunity(ies) past Stage 1`)
  else gaps.push('Progress qualified opportunities beyond Stage 1')
  return focus('robust-pipeline', clamp(base + progressed), signals, gaps)
}

function scoreQualifyOrchestrate(s: Fy27AlignmentSignals): Fy27FocusScore {
  const qualified = Math.min(70, s.qualifiedOpportunities * 25)
  const progressed = s.opportunitiesStage2Plus > 0 ? 30 : 0
  const signals: string[] = []
  const gaps: string[] = []
  if (s.qualifiedOpportunities > 0) signals.push(`${s.qualifiedOpportunities} Stage 1+ opportunity(ies)`)
  else gaps.push('Qualify new Stage 1 opportunities')
  if (progressed) signals.push('Opportunities orchestrated beyond qualification')
  else gaps.push('Advance opportunities through MCEM with owners assigned')
  return focus('qualify-orchestrate', clamp(qualified + progressed), signals, gaps)
}

function scoreMaccConsumption(s: Fy27AlignmentSignals): Fy27FocusScore {
  let score = 0
  const signals: string[] = []
  const gaps: string[] = []
  if (s.hasMaccCommitment) { score += 35; signals.push('MACC commitment tracked') }
  else gaps.push('Add MACC commitment tracking')
  if (s.consumptionOnTrack === true) { score += 30; signals.push('Consumption on track') }
  else if (s.consumptionOnTrack === false) gaps.push('Consumption off track — plan expansion / acceleration')
  const blockerScore = s.openBlockers === 0
    ? 35
    : Math.max(0, 35 - s.openBlockers * 7 - s.overdueBlockers * 5)
  score += blockerScore
  if (s.openBlockers === 0) signals.push('No open blockers')
  else gaps.push(`${s.openBlockers} open blocker(s)${s.overdueBlockers ? `, ${s.overdueBlockers} overdue` : ''}`)
  return focus('macc-consumption', clamp(score), signals, gaps)
}

function focus(id: Fy27FocusId, score: number, signals: string[], gaps: string[]): Fy27FocusScore {
  return { id, label: FY27_FOCUS_LABELS[id], score, band: bandForFocus(score), signals, gaps }
}

export function computeFy27Scorecard(
  signals: Fy27AlignmentSignals,
  now = Date.now(),
): Fy27AlignmentScorecard {
  const focusScores: Fy27FocusScore[] = [
    scoreUnderstandDocument(signals),
    scoreGrowRelationships(signals),
    scoreSecureAI(signals),
    scoreRobustPipeline(signals),
    scoreQualifyOrchestrate(signals),
    scoreMaccConsumption(signals),
  ]
  const overallScore = clamp(
    focusScores.reduce((acc, f) => acc + f.score, 0) / focusScores.length,
  )
  return {
    accountId: signals.accountId,
    customerName: signals.customerName,
    overallScore,
    overallBand: bandForFocus(overallScore),
    focusScores,
    generatedAt: now,
  }
}
