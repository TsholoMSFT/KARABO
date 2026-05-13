// ============================================================================
// DUCE (Discovery & Use Case Engine) + TA Dependency Reduction additive types.
// All fields are additive to existing UseCase / DiscoverySession contracts.
// Stored as DUCESessionData under sessionId in localStorage to avoid breaking
// the legacy session shape.
// ============================================================================

export type UserMode = 'facilitator' | 'participant'

// ----------------------------------------------------------------------------
// Step 1 — Strategic Objectives
// ----------------------------------------------------------------------------
export interface BusinessObjective {
  id: string
  statement: string
  horizon: 'short' | 'mid' | 'long' // <12mo / 12-36mo / 36mo+
  ownerRole?: string
  linkedKpiIds?: string[]
  notes?: string
}

// ----------------------------------------------------------------------------
// Step 2 — Process Mapping
// ----------------------------------------------------------------------------
export type ProcessFrequency = 'continuous' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'ad-hoc'

export interface ProcessStep {
  id: string
  task: string
  owner?: string
  system?: string
  painPoint?: string
  frequency?: ProcessFrequency
  durationMinutes?: number
  notes?: string
}

// ----------------------------------------------------------------------------
// Step 3 — Problem quantification (extends existing COI with time impact)
// ----------------------------------------------------------------------------
export interface QuantifiedProblem {
  id: string
  problem: string
  linkedProcessStepIds?: string[]
  timeImpactHrsPerOccurrence?: number
  occurrencesPerMonth?: number
  costPerOccurrence?: number
  riskScore?: number // 1-5
  severity?: 'low' | 'medium' | 'serious' | 'deal-breaker'
  computedAnnualImpact?: number // derived
}

// ----------------------------------------------------------------------------
// Step 5 — Feasibility breakdown (formal 1-5 sub-scales) + AI fit taxonomy
// ----------------------------------------------------------------------------
export interface FeasibilityBreakdown {
  dataReadiness: number // 1-5
  technicalComplexity: number // 1-5 (1 = trivial, 5 = bleeding edge)
  integrationRisk: number // 1-5 (1 = isolated, 5 = many critical integrations)
  changeReadiness: number // 1-5 (1 = poor, 5 = excellent)
  notes?: string
}

export type AIFitCategory = 'automation' | 'copilot' | 'predictive' | 'agentic'

export const AI_FIT_LABELS: Record<AIFitCategory, string> = {
  automation: 'Automation',
  copilot: 'Copilot',
  predictive: 'Predictive AI',
  agentic: 'Agentic Workflows',
}

export const AI_FIT_DESCRIPTIONS: Record<AIFitCategory, string> = {
  automation: 'Rule-based or RPA-style automation of deterministic tasks',
  copilot: 'Human-in-the-loop assistance for knowledge work',
  predictive: 'Forecasting, classification, and recommendation models',
  agentic: 'Autonomous multi-step orchestration with tool use',
}

// ----------------------------------------------------------------------------
// Decision engine
// ----------------------------------------------------------------------------
export type DUCEDisposition = 'pursue' | 'refine' | 'defer' | 'no-go'

export interface DecisionRecommendation {
  disposition: DUCEDisposition
  rationale: string
  triggeredRules: string[]
  feasibilityAvg?: number
  impact?: number
}

export interface DecisionLogEntry {
  id: string
  timestamp: number
  useCaseId?: string
  decision: string
  rationale: string
  evidence?: string[]
  decidedBy?: string // facilitator name
  systemRecommendation?: DUCEDisposition
  finalDisposition?: DUCEDisposition
  overridden?: boolean
}

// ----------------------------------------------------------------------------
// Pattern Library (TA PRD §6.3)
// ----------------------------------------------------------------------------
export type PatternCategory =
  | 'data-platform'
  | 'rag-knowledge'
  | 'agentic'
  | 'app-modernization'
  | 'integration'
  | 'analytics'
  | 'low-code'
  | 'security-governance'

export type DeploymentSurface = 'azure' | 'fabric' | 'power-platform' | 'm365' | 'hybrid'

export interface ArchitecturePattern {
  id: string
  name: string
  category: PatternCategory
  surfaces: DeploymentSurface[]
  summary: string
  whenToUse: string[]
  whenNotToUse?: string[]
  components: string[]
  aiFit: AIFitCategory[]
  industries?: string[] // empty/undefined = all
  effortWeeksRange?: [number, number]
  governanceNotes?: string[]
  iacRefs?: string[]
  referenceLinks?: { label: string; url: string }[]
}

// ----------------------------------------------------------------------------
// Decision Framework Engine context (TA PRD §6.2)
// ----------------------------------------------------------------------------
export interface DecisionContext {
  industry?: string
  dataResidency?: 'sovereign-required' | 'preferred' | 'flexible'
  realTime?: boolean
  externalUsers?: boolean
  scaleProfile?: 'pilot' | 'department' | 'enterprise'
  regulated?: boolean
  preferredSurfaces?: DeploymentSurface[]
}

export interface PatternRecommendation {
  pattern: ArchitecturePattern
  score: number // 0-100
  matchedSignals: string[]
  cautions: string[]
}

// ----------------------------------------------------------------------------
// Early Engagement Validator (TA PRD §6.8)
// ----------------------------------------------------------------------------
export interface ValidationCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail?: string
}

export interface EarlyValidationResult {
  overall: 'ready' | 'needs-attention' | 'blocked'
  checks: ValidationCheck[]
  summary: string
}

// ----------------------------------------------------------------------------
// Co-Lead TA Panel (TA PRD §6.6)
// ----------------------------------------------------------------------------
export type CoLeadDomain = 'apps' | 'data' | 'ai' | 'security' | 'infra'

export const CO_LEAD_DOMAIN_LABELS: Record<CoLeadDomain, string> = {
  apps: 'Apps & Low-Code',
  data: 'Data & Analytics',
  ai: 'AI & ML',
  security: 'Security & Compliance',
  infra: 'Infrastructure & Platform',
}

export interface CoLeadInput {
  id: string
  domain: CoLeadDomain
  contributor?: string
  perspective: string
  risksFlagged?: string[]
  recommendations?: string[]
  updatedAt: number
}

// ----------------------------------------------------------------------------
// Knowledge Output (TA PRD §6.5)
// ----------------------------------------------------------------------------
export interface KnowledgeOutput {
  generatedAt: number
  architectureSummary: string
  decisionLog: DecisionLogEntry[]
  deploymentSteps: string[]
  risksAndDependencies: string[]
  selectedPatternIds: string[]
}

// ----------------------------------------------------------------------------
// Roadmap (Phase-1 §4d)
// ----------------------------------------------------------------------------
export type RoadmapLane = 'quick-wins' | 'strategic-bets' | 'fill-ins' | 'deferred'

export const ROADMAP_LANE_LABELS: Record<RoadmapLane, string> = {
  'quick-wins': 'Quick Wins',
  'strategic-bets': 'Strategic Bets',
  'fill-ins': 'Fill-ins',
  deferred: 'Deferred / Refine',
}

export interface RoadmapPlacement {
  useCaseId: string
  lane: RoadmapLane
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  rationale?: string
}

// ----------------------------------------------------------------------------
// Aggregated DUCE session payload (stored separately from legacy session)
// ----------------------------------------------------------------------------
export interface DUCESessionData {
  sessionId: string
  objectives: BusinessObjective[]
  processSteps: ProcessStep[]
  problems: QuantifiedProblem[]
  feasibilityBreakdowns: Record<string, FeasibilityBreakdown>
  aiFitAssignments: Record<string, AIFitCategory>
  systemRecommendations: Record<string, DecisionRecommendation>
  finalDispositions: Record<string, DUCEDisposition>
  selectedPatternIds: string[]
  decisionContext: DecisionContext
  coLeadInputs: CoLeadInput[]
  decisionLog: DecisionLogEntry[]
  roadmap: RoadmapPlacement[]
  knowledgeOutput?: KnowledgeOutput
  earlyValidation?: EarlyValidationResult
  updatedAt: number
}

export const emptyDUCESession = (sessionId: string): DUCESessionData => ({
  sessionId,
  objectives: [],
  processSteps: [],
  problems: [],
  feasibilityBreakdowns: {},
  aiFitAssignments: {},
  systemRecommendations: {},
  finalDispositions: {},
  selectedPatternIds: [],
  decisionContext: {},
  coLeadInputs: [],
  decisionLog: [],
  roadmap: [],
  updatedAt: Date.now(),
})
