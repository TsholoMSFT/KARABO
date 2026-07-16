/**
 * CSAM "Customer Value Realisation & Health Cockpit" — core data model.
 *
 * This is the post-sale (Customer Success) counterpart to the existing
 * pre-sale (Specialist) discovery flow. Where the discovery tool answers
 * "why should the customer invest?", this model answers "is the customer
 * realising value from the investment, and what must happen next?".
 *
 * All v1 data flows through the CsamDataProvider seam (see data-provider.ts):
 * Manual entry and existing services now; MSX / Graph / Fabric /
 * usage telemetry later — without reworking these types.
 */
import type { AccountSegment } from '@/lib/types'

// ============================================================================
// SHARED PRIMITIVES (see guardrails.ts for the helpers that operate on these)
// ============================================================================

/** Confidence in a score, signal, or hypothesis. */
export type CsamConfidence = 'insufficient' | 'low' | 'medium' | 'high'

/** Traffic-light state used across every score and signal. */
export type ColorState = 'green' | 'amber' | 'red' | 'grey'

/** Sensitivity classification — keeps vendor telemetry separate from customer data. */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'customer-provided'

/** Whether a financial / value claim has been validated with customer data. */
export type ValidationStatus = 'hypothesis' | 'in-validation' | 'customer-validated'

// ============================================================================
// SOLUTION AREAS (CSAM-granular — finer than the 6 specialist solution areas)
// ============================================================================

export type CsamSolutionArea =
  | 'azure-compute'
  | 'azure-data-ai'
  | 'fabric'
  | 'm365'
  | 'm365-copilot'
  | 'copilot-studio'
  | 'power-platform'
  | 'dynamics-365'
  | 'defender'
  | 'sentinel'
  | 'entra'
  | 'purview'
  | 'github-copilot'
  | 'windows-365-avd'
  | 'unified-support'
  | 'other'

export const CSAM_SOLUTION_AREA_LABELS: Record<CsamSolutionArea, string> = {
  'azure-compute': 'Azure Compute',
  'azure-data-ai': 'Azure Data & AI',
  'fabric': 'Microsoft Fabric',
  'm365': 'Microsoft 365',
  'm365-copilot': 'Microsoft 365 Copilot',
  'copilot-studio': 'Copilot Studio',
  'power-platform': 'Power Platform',
  'dynamics-365': 'Dynamics 365',
  'defender': 'Microsoft Defender',
  'sentinel': 'Microsoft Sentinel',
  'entra': 'Microsoft Entra',
  'purview': 'Microsoft Purview',
  'github-copilot': 'GitHub Copilot',
  'windows-365-avd': 'Windows 365 / AVD',
  'unified-support': 'Unified / Mission Critical',
  'other': 'Other',
}

// ============================================================================
// SECTION 2 — INVESTMENT BASELINE + USAGE SIGNALS
// ============================================================================

export type PurchaseType =
  | 'license'
  | 'subscription'
  | 'agreement'
  | 'cloud-consumption'
  | 'support'

export interface Investment {
  id: string
  customerId: string
  solutionArea: CsamSolutionArea
  product: string
  purchaseType: PurchaseType
  purchasePeriodStart?: number
  purchasePeriodEnd?: number
  committedValueUSD?: number
  intendedOutcome: string
  sponsor?: string
  businessOwner?: string
  technicalOwner?: string
  financeOwner?: string
  relatedSuccessPlan?: string
  relatedCsdrTopic?: string
  risks?: string[]
  classification?: DataClassification
}

export type UsageTrend = 'rising' | 'flat' | 'declining' | 'unknown'

export interface UsageSignal {
  id: string
  investmentId: string
  licensesPurchased?: number
  licensesAssigned?: number
  activeUsers?: number
  /** Monthly workload consumption (USD) for consumption-based investments. */
  workloadConsumptionUSD?: number
  usageTrend?: UsageTrend
  /** 0-100 — how intensively assigned users actually use the capability. */
  intensityScore?: number
  /** 0-100 — gap between expected and actual usage (derived). */
  adoptionGapPct?: number
  telemetrySource?: string
  classification?: DataClassification
  confidence: CsamConfidence
  asOf?: number
}

// ============================================================================
// VALUE LEAKAGE — the 8 stages from purchase to executive value recognition
// ============================================================================

export type AdoptionStage =
  | 'purchased'
  | 'assigned'
  | 'activated'
  | 'embedded'
  | 'behaviour-changed'
  | 'kpi-moved'
  | 'financial-validated'
  | 'exec-recognised'

export const ADOPTION_STAGE_ORDER: AdoptionStage[] = [
  'purchased',
  'assigned',
  'activated',
  'embedded',
  'behaviour-changed',
  'kpi-moved',
  'financial-validated',
  'exec-recognised',
]

export const ADOPTION_STAGE_LABELS: Record<AdoptionStage, string> = {
  'purchased': 'Purchased / committed',
  'assigned': 'Assigned / deployed',
  'activated': 'Activated / used',
  'embedded': 'Embedded in workflow',
  'behaviour-changed': 'Behaviour changed',
  'kpi-moved': 'Operational KPI moved',
  'financial-validated': 'Financial impact validated',
  'exec-recognised': 'Executive value recognised',
}

// ============================================================================
// SECTION 5 — ADOPTION & BEHAVIOURAL BARRIERS
// ============================================================================

/** ADKAR + the additional behavioural dimensions in the spec. */
export type AdoptionFactorId =
  | 'awareness'
  | 'desire'
  | 'knowledge'
  | 'ability'
  | 'reinforcement'
  | 'trust'
  | 'friction'
  | 'incentives'
  | 'workflow-integration'
  | 'executive-modelling'

export const ADOPTION_FACTOR_LABELS: Record<AdoptionFactorId, string> = {
  'awareness': 'Awareness',
  'desire': 'Desire',
  'knowledge': 'Knowledge',
  'ability': 'Ability',
  'reinforcement': 'Reinforcement',
  'trust': 'Trust',
  'friction': 'Friction',
  'incentives': 'Incentives',
  'workflow-integration': 'Workflow integration',
  'executive-modelling': 'Executive modelling',
}

export type BehaviouralBlockerId =
  | 'low-awareness'
  | 'poor-training-relevance'
  | 'weak-manager-reinforcement'
  | 'no-workflow-redesign'
  | 'tool-not-embedded'
  | 'data-trust-issue'
  | 'security-compliance-fear'
  | 'lack-exec-sponsorship'
  | 'incentives-reward-old'
  | 'perceived-productivity-tax'
  | 'change-fatigue'
  | 'unclear-wiifm'

export const BEHAVIOURAL_BLOCKER_LABELS: Record<BehaviouralBlockerId, string> = {
  'low-awareness': 'Low awareness',
  'poor-training-relevance': 'Poor training relevance',
  'weak-manager-reinforcement': 'Weak manager reinforcement',
  'no-workflow-redesign': 'No workflow redesign',
  'tool-not-embedded': 'Tool not embedded where work happens',
  'data-trust-issue': 'Data trust issue',
  'security-compliance-fear': 'Security / compliance fear',
  'lack-exec-sponsorship': 'Lack of executive sponsorship',
  'incentives-reward-old': 'Incentives reward old behaviour',
  'perceived-productivity-tax': 'Perceived productivity tax',
  'change-fatigue': 'Change fatigue',
  'unclear-wiifm': 'Unclear "what\'s in it for me"',
}

export interface BehaviouralBlockerInsight {
  blocker: BehaviouralBlockerId
  likelyRootCause: string
  evidenceToLookFor: string
  customerQuestion: string
  recommendedIntervention: string
  stakeholderOwner?: string
}

export interface AdoptionDiagnostic {
  id: string
  customerId: string
  useCaseId?: string
  /** 0-100 per behavioural factor (omit when no evidence). */
  scores: Partial<Record<AdoptionFactorId, number>>
  blockers: BehaviouralBlockerId[]
  notes?: string
}

// ============================================================================
// SECTION 3 — FINANCIAL STATEMENT IMPACT MAP
// ============================================================================

export type StatementType = 'income' | 'balance-sheet' | 'cash-flow'

export const STATEMENT_TYPE_LABELS: Record<StatementType, string> = {
  'income': 'Income Statement',
  'balance-sheet': 'Balance Sheet',
  'cash-flow': 'Cash Flow',
}

export type FinancialDirection =
  | 'increase'
  | 'decrease'
  | 'avoid'
  | 'stabilise'
  | 'accelerate'
  | 'protect'

export const FINANCIAL_DIRECTION_LABELS: Record<FinancialDirection, string> = {
  'increase': 'Increase',
  'decrease': 'Decrease',
  'avoid': 'Avoid',
  'stabilise': 'Stabilise',
  'accelerate': 'Accelerate',
  'protect': 'Protect',
}

export interface FinancialStatementLine {
  id: string
  useCaseId?: string
  statementType: StatementType
  lineItem: string
  expectedDirection: FinancialDirection
  mechanism: string
  metric?: string
  baseline?: number
  current?: number
  target?: number
  confidence: CsamConfidence
  validationStatus: ValidationStatus
  evidenceAvailable?: string
  evidenceMissing?: string
  dataOwner?: string
  validationQuestion?: string
}

// ============================================================================
// SECTION 6 — CUSTOMER HEALTH & RISK
// ============================================================================

export type HealthDimensionId =
  | 'workload-resiliency'
  | 'security-posture'
  | 'incident-readiness'
  | 'reactive-support'
  | 'open-escalations'
  | 'repeated-support-patterns'
  | 'critical-workload-coverage'
  | 'major-incident-readiness'
  | 'operational-maturity'
  | 'cost-optimisation'
  | 'performance-stability'
  | 'governance-readiness'
  | 'telemetry-completeness'

export const HEALTH_DIMENSION_LABELS: Record<HealthDimensionId, string> = {
  'workload-resiliency': 'Workload resiliency',
  'security-posture': 'Security posture',
  'incident-readiness': 'Service incident readiness',
  'reactive-support': 'Reactive support trends',
  'open-escalations': 'Open escalations',
  'repeated-support-patterns': 'Repeated support patterns',
  'critical-workload-coverage': 'Critical workload coverage',
  'major-incident-readiness': 'Major incident readiness',
  'operational-maturity': 'Operational maturity',
  'cost-optimisation': 'Cost optimisation',
  'performance-stability': 'Performance stability',
  'governance-readiness': 'Governance readiness',
  'telemetry-completeness': 'Data quality / telemetry completeness',
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface HealthSignal {
  id: string
  customerId: string
  dimension: HealthDimensionId
  workload?: string
  status: ColorState
  riskLevel: RiskLevel
  businessImpact?: string
  financialExposure?: string
  recommendation?: string
  customerOwner?: string
  microsoftOwner?: string
  reviewCadence?: string
  includeInCsdr?: boolean
}

// ============================================================================
// USE CASE (CSAM lens) — value-realisation framing of a capability
// ============================================================================

export interface CsamUseCase {
  id: string
  customerId: string
  name: string
  businessProblem: string
  persona?: string
  process?: string
  expectedOutcome?: string
  solutionArea: CsamSolutionArea
  technology?: string
  adoptionStage: AdoptionStage
  valueHypothesis?: string
  financialLineItemIds?: string[]
  behaviouralBarriers?: BehaviouralBlockerId[]
  healthDependencies?: HealthDimensionId[]
  linkedInvestmentId?: string
}

// ============================================================================
// SECTION 7 — USE-CASE VALUE PRIORITISATION
// ============================================================================

export type PrioritisationCategory =
  | 'quick-win'
  | 'strategic-bet'
  | 'health-remediation'
  | 'adoption-recovery'
  | 'expansion'
  | 'deprioritise'

export const PRIORITISATION_CATEGORY_LABELS: Record<PrioritisationCategory, string> = {
  'quick-win': 'Quick win',
  'strategic-bet': 'Strategic bet',
  'health-remediation': 'Health remediation',
  'adoption-recovery': 'Adoption recovery',
  'expansion': 'Expansion candidate',
  'deprioritise': 'Deprioritise / monitor',
}

export interface PrioritisedUseCase {
  useCase: CsamUseCase
  category: PrioritisationCategory
  score: number
  confidence: CsamConfidence
  rationale: string
}

// ============================================================================
// SECTION 9 — NEXT BEST CSAM ACTION
// ============================================================================

export type ActionTimeframe = 'now' | 'next-csdr' | 'next-quarter' | 'renewal-cycle'

export const ACTION_TIMEFRAME_LABELS: Record<ActionTimeframe, string> = {
  'now': 'Now',
  'next-csdr': 'Next CSDR',
  'next-quarter': 'Next quarter',
  'renewal-cycle': 'Renewal cycle',
}

export type ActionStatus = 'proposed' | 'accepted' | 'in-progress' | 'done' | 'dismissed'

export interface ActionPlan {
  id: string
  customerId: string
  useCaseId?: string
  recommendation: string
  why?: string
  evidence?: string
  expectedImpact?: string
  /** Financial statement line this action is expected to move. */
  financialLine?: string
  stakeholders?: string[]
  talkTrack?: string
  successMetric?: string
  timeframe: ActionTimeframe
  confidence: CsamConfidence
  owner?: string
  priority?: 'high' | 'medium' | 'low'
  status?: ActionStatus
  relatedSuccessPlan?: string
  relatedCsdr?: string
  dueDate?: number
}

// ============================================================================
// SECTION 4 — VALUE HYPOTHESIS
// ============================================================================

export interface ValueHypothesisInput {
  investment: string
  problem: string
  process: string
  persona: string
  metric: string
  financialLine: string
  usageEvidence?: string
  healthEvidence?: string
  supportPattern?: string
  behaviouralBlocker?: BehaviouralBlockerId
  estimatedValueGapUSD?: number
  unlockingAction?: string
  sponsor?: string
}

export interface ValueHypothesisOutputs {
  statement: string
  csdrNarrative: string
  behaviouralHypothesis: string
  interventionPlan: string
  plan306090: { d30: string[]; d60: string[]; d90: string[] }
}

export interface ValueHypothesis extends ValueHypothesisInput, ValueHypothesisOutputs {
  id: string
  customerId: string
  createdAt: number
}

// ============================================================================
// SECTION 1 — ACCOUNT VALUE EXECUTIVE SUMMARY SCORES
// ============================================================================

export type CockpitScoreId =
  | 'value-realisation'
  | 'health'
  | 'adoption-maturity'
  | 'financial-impact-confidence'
  | 'risk-to-value'

export const COCKPIT_SCORE_LABELS: Record<CockpitScoreId, string> = {
  'value-realisation': 'Customer Value Realisation',
  'health': 'Customer Health',
  'adoption-maturity': 'Adoption Maturity',
  'financial-impact-confidence': 'Financial Impact Confidence',
  'risk-to-value': 'Risk to Value',
}

export interface ScoreDimension {
  id: string
  label: string
  score: number
  note?: string
}

export interface CockpitScore {
  id: CockpitScoreId
  label: string
  /** 0-100, always "higher is better" so colour is consistent. */
  score: number
  colorState: ColorState
  confidence: CsamConfidence
  dimensions: ScoreDimension[]
  rationale?: string
}

// ============================================================================
// AGGREGATE — everything the cockpit needs for one customer
// ============================================================================

export interface CsamTeam {
  csam?: string
  ae?: string
  ats?: string
  specialist?: string
  csa?: string
}

export type CsamProfileSource = 'manual' | 'service' | 'msx'

export interface CsamCustomerProfile {
  customerId: string
  name: string
  industry?: string
  segment?: AccountSegment
  region?: string
  executivePriorities?: string[]
  team?: CsamTeam
  investments: Investment[]
  usageSignals: UsageSignal[]
  useCases: CsamUseCase[]
  financialImpacts: FinancialStatementLine[]
  healthSignals: HealthSignal[]
  adoption: AdoptionDiagnostic[]
  actions: ActionPlan[]
  hypotheses?: ValueHypothesis[]
  /** Renewal / expansion readiness signal. */
  renewalSignal?: ColorState
  source?: CsamProfileSource
  lastUpdated?: number
}

/** The two lenses the same account can be viewed through (Section 10). */
export type CockpitLens = 'specialist' | 'csam'
