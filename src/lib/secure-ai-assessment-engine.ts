/**
 * Secure AI Assessment engine (Focus 3) — aggregates the existing AI-governance,
 * regulatory-compliance and data-sovereignty assessments into a single, ownable,
 * versioned "Customer Secure AI Assessment" posture that the ATS can share with
 * the v-team and REFRESH over time (the version / refreshedFrom chain).
 *
 * Pure & deterministic. Persistence lives in `use-secure-ai-assessments.ts`.
 */
import { AI_GOVERNANCE_MATURITY_CONFIG } from './types'
import type { AIRiskLevel } from './types'
import type {
  SecureAIAssessment,
  SecureAIAssessmentInput,
  SecureAIDimensionScore,
  SecureAIRemediation,
  SecurePostureBand,
} from './fy27-types'

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_REFRESH_DAYS = 90

const BASE_WEIGHTS: Record<SecureAIDimensionScore['key'], number> = {
  'ai-governance': 0.35,
  'regulatory-compliance': 0.30,
  'data-sovereignty': 0.20,
  'responsible-ai': 0.15,
}

const RISK_SCORE: Record<AIRiskLevel, number> = {
  minimal: 100,
  limited: 75,
  high: 40,
  unacceptable: 0,
}

const GATE_SCORE: Record<'blocked' | 'warning' | 'clear', number> = {
  clear: 100,
  warning: 55,
  blocked: 15,
}

export function bandForPosture(score: number): SecurePostureBand {
  if (score < 30) return 'critical'
  if (score < 50) return 'at-risk'
  if (score < 70) return 'developing'
  if (score < 85) return 'strong'
  return 'leading'
}

function impactToPriority(impact: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
  return impact
}

/** Build the (present-only) dimension scores from whatever inputs are supplied. */
function buildDimensions(input: SecureAIAssessmentInput): SecureAIDimensionScore[] {
  const dims: SecureAIDimensionScore[] = []

  // ── AI governance ──────────────────────────────────────────────────────
  if (input.governance) {
    const score = Math.round((input.governance.overallMaturity / 5) * 100)
    dims.push({
      key: 'ai-governance',
      label: 'AI Governance',
      score,
      weight: BASE_WEIGHTS['ai-governance'],
      band: bandForPosture(score),
      summary: `Overall governance maturity ${input.governance.overallMaturity.toFixed(1)}/5 (${input.governance.overallMaturityLabel}).`,
      gaps: input.governance.gaps.slice(0, 5).map((g) => g.gap),
    })

    // ── Responsible AI (derived from governance ethics + privacy dims) ────
    const ethics = input.governance.dimensionScores['ethics-fairness']
    const privacy = input.governance.dimensionScores['security-privacy']
    if (ethics && privacy) {
      const ethicsVal = AI_GOVERNANCE_MATURITY_CONFIG[ethics].numericValue
      const privacyVal = AI_GOVERNANCE_MATURITY_CONFIG[privacy].numericValue
      const raiScore = Math.round(((ethicsVal + privacyVal) / 2 / 5) * 100)
      dims.push({
        key: 'responsible-ai',
        label: 'Responsible AI',
        score: raiScore,
        weight: BASE_WEIGHTS['responsible-ai'],
        band: bandForPosture(raiScore),
        summary: `Ethics/fairness = ${ethics}, security/privacy = ${privacy}.`,
        gaps: raiScore < 70 ? ['Strengthen fairness testing, human oversight and privacy controls.'] : [],
      })
    }
  }

  // ── Regulatory compliance (worst-case across use-case assessments) ──────
  if (input.regulatory && input.regulatory.length > 0) {
    let worst = 100
    const gaps: string[] = []
    for (const r of input.regulatory) {
      const combined = Math.min(GATE_SCORE[r.gateStatus], RISK_SCORE[r.overallRisk])
      worst = Math.min(worst, combined)
      if (r.gateStatus !== 'clear') {
        gaps.push(`Regulatory gate: ${r.gateStatus} (risk: ${r.overallRisk}).`)
      }
    }
    dims.push({
      key: 'regulatory-compliance',
      label: 'Regulatory Compliance',
      score: worst,
      weight: BASE_WEIGHTS['regulatory-compliance'],
      band: bandForPosture(worst),
      summary: `Worst-case regulatory gate across ${input.regulatory.length} assessed use case(s).`,
      gaps: gaps.slice(0, 5),
    })
  }

  // ── Data sovereignty ────────────────────────────────────────────────────
  if (input.sovereign) {
    const score = Math.round(input.sovereign.readinessScore)
    dims.push({
      key: 'data-sovereignty',
      label: 'Data Sovereignty',
      score,
      weight: BASE_WEIGHTS['data-sovereignty'],
      band: bandForPosture(score),
      summary: `Sovereign-cloud readiness ${score}/100 (${input.sovereign.mandateLevel} mandate).`,
      gaps: input.sovereign.gaps.slice(0, 5).map((g) => g.description),
    })
  }

  return dims
}

function buildRemediations(input: SecureAIAssessmentInput): SecureAIRemediation[] {
  const rems: SecureAIRemediation[] = []

  if (input.governance) {
    for (const g of input.governance.gaps.filter((x) => x.impact !== 'low').slice(0, 4)) {
      rems.push({
        id: genId('rem'),
        title: `Close ${g.dimension} gap`,
        dimension: 'ai-governance',
        priority: impactToPriority(g.impact),
        effort: 'medium',
        recommendation: g.gap,
      })
    }
  }
  if (input.sovereign) {
    for (const g of input.sovereign.gaps.filter((x) => x.impact !== 'low').slice(0, 3)) {
      rems.push({
        id: genId('rem'),
        title: `Sovereignty: ${g.dimension}`,
        dimension: 'data-sovereignty',
        priority: impactToPriority(g.impact),
        effort: 'medium',
        recommendation: g.recommendation,
      })
    }
  }
  if (input.regulatory?.some((r) => r.gateStatus === 'blocked')) {
    rems.push({
      id: genId('rem'),
      title: 'Resolve blocking regulatory gate',
      dimension: 'regulatory-compliance',
      priority: 'high',
      effort: 'high',
      recommendation: 'Address the blocking regulatory finding(s) before progressing the opportunity.',
    })
  } else if (input.regulatory?.some((r) => r.gateStatus === 'warning')) {
    rems.push({
      id: genId('rem'),
      title: 'Clear regulatory warnings',
      dimension: 'regulatory-compliance',
      priority: 'medium',
      effort: 'medium',
      recommendation: 'Review and remediate the regulatory warnings raised during the compliance review.',
    })
  }

  return rems
}

export interface BuildSecureAIOptions {
  now?: number
  version?: number
  refreshedFromId?: string
  status?: SecureAIAssessment['status']
  refreshDays?: number
}

export function buildSecureAIAssessment(
  input: SecureAIAssessmentInput,
  options: BuildSecureAIOptions = {},
): SecureAIAssessment {
  const now = options.now ?? Date.now()
  const dimensions = buildDimensions(input)

  // Renormalize weights across the dimensions that actually have data.
  const totalWeight = dimensions.reduce((acc, d) => acc + d.weight, 0)
  const postureScore = totalWeight > 0
    ? Math.round(dimensions.reduce((acc, d) => acc + d.score * (d.weight / totalWeight), 0))
    : 0

  return {
    id: genId('sai'),
    accountId: input.accountId,
    customerId: input.customerId,
    sessionId: input.sessionId,
    customerName: input.customerName,
    version: options.version ?? 1,
    status: options.status ?? 'active',
    postureScore,
    postureBand: bandForPosture(postureScore),
    dimensions,
    remediations: buildRemediations(input),
    assessmentDate: now,
    refreshedFromId: options.refreshedFromId,
    nextRefreshDue: now + (options.refreshDays ?? DEFAULT_REFRESH_DAYS) * MS_PER_DAY,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Refresh an existing assessment: produce a new active version linked to the
 * previous one. The caller is responsible for marking the previous assessment
 * `superseded` in its store.
 */
export function refreshSecureAIAssessment(
  previous: SecureAIAssessment,
  input: SecureAIAssessmentInput,
  options: BuildSecureAIOptions = {},
): SecureAIAssessment {
  return buildSecureAIAssessment(input, {
    ...options,
    version: previous.version + 1,
    refreshedFromId: previous.id,
    status: 'active',
  })
}

/** True when the assessment is past its recommended refresh date. */
export function isRefreshOverdue(a: Pick<SecureAIAssessment, 'nextRefreshDue'>, now = Date.now()): boolean {
  return typeof a.nextRefreshDue === 'number' && a.nextRefreshDue < now
}
