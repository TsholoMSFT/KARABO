import type { UseCase } from './types'
import type {
  ArchitecturePattern,
  DecisionContext,
  DecisionRecommendation,
  DUCEDisposition,
  EarlyValidationResult,
  FeasibilityBreakdown,
  PatternRecommendation,
  QuantifiedProblem,
  ValidationCheck,
  AIFitCategory,
  BusinessObjective,
  ProcessStep,
  RoadmapLane,
  RoadmapPlacement,
} from './duce-types'
import { ARCHITECTURE_PATTERNS } from './architecture-patterns'

// ============================================================================
// Decision Framework Engine — TA decision logic encoded as deterministic rules.
// All functions are pure to enable unit testing and reproducible audit trails.
// ============================================================================

// ----------------------------------------------------------------------------
// Disposition recommendation: Pursue / Refine / Defer / No-Go
// ----------------------------------------------------------------------------
export function recommendDisposition(
  useCase: Pick<UseCase, 'impact' | 'feasibility' | 'regulatoryAssessment'>,
  feasibilityBreakdown?: FeasibilityBreakdown
): DecisionRecommendation {
  const triggered: string[] = []
  const impact = useCase.impact ?? 0
  const feasibilityAvg = feasibilityBreakdown
    ? (feasibilityBreakdown.dataReadiness +
        (6 - feasibilityBreakdown.technicalComplexity) +
        (6 - feasibilityBreakdown.integrationRisk) +
        feasibilityBreakdown.changeReadiness) /
      4
    : useCase.feasibility / 2 // map 1-10 -> 1-5

  // Hard regulatory blocker
  const reg = useCase.regulatoryAssessment as { overallStatus?: string; overrideJustification?: string } | undefined
  if (reg?.overallStatus === 'no-go' && !reg?.overrideJustification) {
    triggered.push('REG-BLOCKER: regulatory assessment is no-go without override')
    return {
      disposition: 'no-go',
      rationale: 'Regulatory assessment blocks delivery. Provide override justification or remove from scope.',
      triggeredRules: triggered,
      feasibilityAvg,
      impact,
    }
  }

  if (impact <= 4 && feasibilityAvg <= 2.5) {
    triggered.push('LOW-IMPACT-LOW-FEASIBILITY')
    return {
      disposition: 'defer',
      rationale: 'Low business impact and low delivery feasibility — defer until conditions change.',
      triggeredRules: triggered,
      feasibilityAvg,
      impact,
    }
  }

  if (impact >= 7 && feasibilityAvg < 3) {
    triggered.push('HIGH-IMPACT-LOW-FEASIBILITY')
    return {
      disposition: 'refine',
      rationale: 'High value but feasibility blockers. Refine scope, run a spike, or address the weakest sub-factor before committing.',
      triggeredRules: triggered,
      feasibilityAvg,
      impact,
    }
  }

  if (impact >= 6 && feasibilityAvg >= 3) {
    triggered.push('STRONG-IMPACT-FEASIBILITY')
    return {
      disposition: 'pursue',
      rationale: 'Sufficient impact and feasibility to proceed to PoC scoping.',
      triggeredRules: triggered,
      feasibilityAvg,
      impact,
    }
  }

  triggered.push('MODERATE-OVERALL')
  return {
    disposition: 'refine',
    rationale: 'Moderate signals — refine scope or scoring inputs before commitment.',
    triggeredRules: triggered,
    feasibilityAvg,
    impact,
  }
}

// ----------------------------------------------------------------------------
// AI Fit classifier — deterministic keyword-based first pass.
// AI-based classifier in openai-service can override this when available.
// ----------------------------------------------------------------------------
const AGENTIC_KW = /\b(agent|agentic|autonomous|orchestrat|multi[- ]?step|tool[- ]?use|plan and execute)\b/i
const PREDICTIVE_KW = /\b(predict|forecast|classif|anomaly|recommend|model|score|churn|propensity)\b/i
const COPILOT_KW = /\b(copilot|assist|search|q&a|knowledge|chat|summari[sz]e|draft|grounding|rag)\b/i
const AUTOMATION_KW = /\b(automat|rpa|extract|invoice|form|approval|route|trigger|workflow)\b/i

export function classifyAIFit(useCase: Pick<UseCase, 'title' | 'description'>): AIFitCategory {
  const text = `${useCase.title ?? ''} ${useCase.description ?? ''}`
  if (AGENTIC_KW.test(text)) return 'agentic'
  if (PREDICTIVE_KW.test(text)) return 'predictive'
  if (COPILOT_KW.test(text)) return 'copilot'
  if (AUTOMATION_KW.test(text)) return 'automation'
  return 'copilot'
}

// ----------------------------------------------------------------------------
// Pattern recommender — scores ArchitecturePattern against DecisionContext + use case
// ----------------------------------------------------------------------------
export function recommendPatterns(
  context: DecisionContext,
  useCase?: Pick<UseCase, 'title' | 'description'>,
  aiFit?: AIFitCategory,
  topN: number = 3
): PatternRecommendation[] {
  const fit = aiFit ?? (useCase ? classifyAIFit(useCase) : undefined)

  const scored: PatternRecommendation[] = ARCHITECTURE_PATTERNS.map((pattern) => {
    const matched: string[] = []
    const cautions: string[] = []
    let score = 0

    if (fit && pattern.aiFit.includes(fit)) {
      score += 35
      matched.push(`AI fit: ${fit}`)
    }

    if (context.industry && pattern.industries?.length) {
      if (pattern.industries.includes(context.industry)) {
        score += 20
        matched.push(`Industry: ${context.industry}`)
      } else {
        score -= 10
        cautions.push(`Pattern targets ${pattern.industries.join(', ')}; not ${context.industry}`)
      }
    } else if (!pattern.industries?.length) {
      score += 5
    }

    if (context.preferredSurfaces?.length) {
      const overlap = pattern.surfaces.filter((s) => context.preferredSurfaces!.includes(s))
      if (overlap.length) {
        score += 15
        matched.push(`Surface match: ${overlap.join(', ')}`)
      }
    }

    if (context.realTime && pattern.id.includes('realtime')) {
      score += 15
      matched.push('Real-time signal matched')
    }

    if (context.dataResidency === 'sovereign-required' && !pattern.surfaces.includes('azure')) {
      score -= 15
      cautions.push('Sovereign requirement may exclude non-Azure surfaces')
    }

    if (context.regulated && pattern.id === 'secure-foundation-landing-zone') {
      score += 25
      matched.push('Regulated context — landing zone is a prerequisite')
    }

    if (useCase) {
      const text = `${useCase.title} ${useCase.description}`.toLowerCase()
      for (const comp of pattern.components) {
        const head = comp.toLowerCase().split(' ')[0]
        if (head.length > 3 && text.includes(head)) {
          score += 3
          matched.push(`Component echo: ${comp}`)
        }
      }
    }

    return { pattern, score: Math.max(0, Math.min(100, score)), matchedSignals: matched, cautions }
  })

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

// ----------------------------------------------------------------------------
// Quantified problem ranking
// ----------------------------------------------------------------------------
const TIME_VALUATION_USD_PER_HR = 80

export function computeProblemAnnualImpact(p: QuantifiedProblem): number {
  const occ = p.occurrencesPerMonth ?? 0
  const cost = p.costPerOccurrence ?? 0
  const time = p.timeImpactHrsPerOccurrence ?? 0
  return cost * occ * 12 + time * occ * 12 * TIME_VALUATION_USD_PER_HR
}

export function rankProblems(problems: QuantifiedProblem[]): QuantifiedProblem[] {
  return [...problems]
    .map((p) => ({ ...p, computedAnnualImpact: computeProblemAnnualImpact(p) }))
    .sort((a, b) => (b.computedAnnualImpact ?? 0) - (a.computedAnnualImpact ?? 0))
}

// ----------------------------------------------------------------------------
// Early Engagement Validator (TA PRD §6.8)
// ----------------------------------------------------------------------------
export function validateEngagement(input: {
  objectives: BusinessObjective[]
  processSteps: ProcessStep[]
  problems: QuantifiedProblem[]
  context: DecisionContext
  hasComplianceReview: boolean
  hasPrimaryStakeholder: boolean
  hasIndustry: boolean
}): EarlyValidationResult {
  const checks: ValidationCheck[] = []

  checks.push({
    id: 'objectives',
    label: 'At least 3 business objectives captured',
    status: input.objectives.length >= 3 ? 'pass' : input.objectives.length > 0 ? 'warn' : 'fail',
    detail: `${input.objectives.length} objective(s) recorded`,
  })

  checks.push({
    id: 'kpi-binding',
    label: 'Each objective bound to at least one KPI',
    status:
      input.objectives.length === 0
        ? 'fail'
        : input.objectives.every((o) => (o.linkedKpiIds?.length ?? 0) > 0)
        ? 'pass'
        : 'warn',
    detail: 'Bind KPIs in Step 1 to enable measurable outcomes',
  })

  checks.push({
    id: 'process-mapping',
    label: 'Process steps captured',
    status: input.processSteps.length >= 3 ? 'pass' : input.processSteps.length > 0 ? 'warn' : 'fail',
    detail: `${input.processSteps.length} step(s) — recommend at least 3`,
  })

  checks.push({
    id: 'problem-quantification',
    label: 'Quantified problems with cost or time impact',
    status:
      input.problems.length > 0 &&
      input.problems.some((p) => (p.costPerOccurrence ?? 0) > 0 || (p.timeImpactHrsPerOccurrence ?? 0) > 0)
        ? 'pass'
        : input.problems.length > 0
        ? 'warn'
        : 'fail',
    detail: 'Quantification powers business case + decision engine',
  })

  checks.push({
    id: 'stakeholder',
    label: 'Primary stakeholder identified',
    status: input.hasPrimaryStakeholder ? 'pass' : 'fail',
    detail: 'Required for accountable decision-making',
  })

  checks.push({
    id: 'industry',
    label: 'Industry selected (drives templates + regulation)',
    status: input.hasIndustry ? 'pass' : 'fail',
  })

  checks.push({
    id: 'data-residency',
    label: 'Data residency posture stated',
    status: input.context.dataResidency ? 'pass' : 'warn',
    detail: 'Affects pattern recommendations and architecture',
  })

  checks.push({
    id: 'compliance-review',
    label: 'Regulatory / compliance review performed',
    status: input.hasComplianceReview ? 'pass' : input.context.regulated ? 'fail' : 'warn',
    detail: 'Required for regulated industries before solutioning',
  })

  const failCount = checks.filter((c) => c.status === 'fail').length
  const warnCount = checks.filter((c) => c.status === 'warn').length

  const overall: EarlyValidationResult['overall'] =
    failCount > 0 ? 'blocked' : warnCount > 0 ? 'needs-attention' : 'ready'

  const summary =
    overall === 'ready'
      ? 'All readiness checks pass. Engagement is ready for solutioning.'
      : overall === 'needs-attention'
      ? `${warnCount} item(s) need attention before solutioning.`
      : `${failCount} blocker(s) must be resolved before proceeding.`

  return { overall, checks, summary }
}

// ----------------------------------------------------------------------------
// Knowledge Output generator (deterministic; no AI required)
// ----------------------------------------------------------------------------
export function generateArchitectureSummary(
  selectedPatterns: ArchitecturePattern[],
  context: DecisionContext
): string {
  if (!selectedPatterns.length) {
    return 'No architecture patterns selected. Use the Pattern Library in Step 5 (Deep Dive) to anchor the solution.'
  }
  const lines: string[] = []
  lines.push(
    `Solution composed of ${selectedPatterns.length} pattern${selectedPatterns.length > 1 ? 's' : ''}: ${selectedPatterns
      .map((p) => p.name)
      .join('; ')}.`
  )
  if (context.industry) lines.push(`Industry: ${context.industry}.`)
  if (context.dataResidency) lines.push(`Data residency: ${context.dataResidency}.`)
  if (context.scaleProfile) lines.push(`Scale: ${context.scaleProfile}.`)
  lines.push('')
  for (const p of selectedPatterns) {
    lines.push(`### ${p.name}`)
    lines.push(p.summary)
    lines.push(`Components: ${p.components.join(', ')}.`)
    if (p.governanceNotes?.length) lines.push(`Governance: ${p.governanceNotes.join('; ')}.`)
    lines.push('')
  }
  return lines.join('\n')
}

export function generateDeploymentSteps(selectedPatterns: ArchitecturePattern[]): string[] {
  const steps: string[] = [
    'Confirm Azure landing zone, identity, and policy baseline',
    'Provision shared services (logging, monitoring, key vault)',
  ]
  for (const p of selectedPatterns) {
    steps.push(`Provision ${p.name}: ${p.components.slice(0, 3).join(' + ')}`)
  }
  steps.push('Wire CI/CD with Bicep / Terraform + GitHub Actions')
  steps.push('Run integration smoke tests and security scan')
  steps.push('Hand over to operations with runbooks and dashboards')
  return steps
}

export function generateRisksAndDependencies(
  selectedPatterns: ArchitecturePattern[],
  context: DecisionContext
): string[] {
  const risks: string[] = []
  if (context.regulated)
    risks.push('Regulated context — confirm conformity assessments before production cutover')
  if (context.dataResidency === 'sovereign-required')
    risks.push('Sovereign cloud required — validate region and service availability')
  if (context.externalUsers)
    risks.push('External users — apply CIAM, rate limiting, and DDoS protection')
  for (const p of selectedPatterns) {
    if (p.governanceNotes?.length) risks.push(`${p.name}: ${p.governanceNotes[0]}`)
  }
  if (!risks.length) risks.push('No specific risks captured. Review with co-lead TAs across domains.')
  return risks
}

// ----------------------------------------------------------------------------
// Roadmap auto-placement from quadrant + AI fit
// ----------------------------------------------------------------------------
export function placeOnRoadmap(useCase: Pick<UseCase, 'id' | 'impact' | 'feasibility'>, disposition?: DUCEDisposition): RoadmapPlacement {
  if (disposition === 'defer' || disposition === 'no-go') {
    return { useCaseId: useCase.id, lane: 'deferred', quarter: 'Q4', rationale: `Disposition: ${disposition}` }
  }
  const mid = 5.5
  let lane: RoadmapLane
  let quarter: RoadmapPlacement['quarter']
  if (useCase.impact >= mid && useCase.feasibility >= mid) {
    lane = 'quick-wins'
    quarter = 'Q1'
  } else if (useCase.impact >= mid && useCase.feasibility < mid) {
    lane = 'strategic-bets'
    quarter = 'Q2'
  } else if (useCase.impact < mid && useCase.feasibility >= mid) {
    lane = 'fill-ins'
    quarter = 'Q3'
  } else {
    lane = 'deferred'
    quarter = 'Q4'
  }
  return { useCaseId: useCase.id, lane, quarter, rationale: 'Auto-placed from impact / feasibility quadrant' }
}

// ----------------------------------------------------------------------------
// Disposition labels for UI
// ----------------------------------------------------------------------------
export const DISPOSITION_LABELS: Record<DUCEDisposition, string> = {
  pursue: 'Pursue',
  refine: 'Refine',
  defer: 'Defer',
  'no-go': 'No-Go',
}

export const DISPOSITION_DESCRIPTIONS: Record<DUCEDisposition, string> = {
  pursue: 'Sufficient signals to proceed to PoC scoping',
  refine: 'Promising but needs scope, scoring, or feasibility work',
  defer: 'Park for later — revisit when conditions change',
  'no-go': 'Blocked or low value — remove from active backlog',
}

export const DISPOSITION_COLORS: Record<DUCEDisposition, string> = {
  pursue: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  refine: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  defer: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  'no-go': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
}
