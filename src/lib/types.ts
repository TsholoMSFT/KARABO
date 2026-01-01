export interface KPI {
  id: string
  name: string
  category: 'efficiency' | 'quality' | 'performance' | 'compliance' | 'workload'
  description: string
}

export interface Customer {
  id: string
  name: string
  innovationHubSPOC: string
  createdAt: number
  updatedAt?: number
}

export interface UseCase {
  id: string
  discoverySessionId?: string
  title: string
  description: string
  impact: number
  feasibility: number
  rice: {
    reach: number
    users?: number
    period?: string
    impact: number
    confidence: number
    effort: number
  }
  kpis?: string[]
  createdAt: number
}

export type ScoringMethod = 'impact-feasibility' | 'rice'

export interface RICEScore {
  score: number
  useCase: UseCase
}

export interface CustomerMetadata {
  customerName: string
  innovationHubSPOC?: string
  primaryStakeholder: string
  accountTeamRep: string
  innovationHubLocation: string
  solutionEngineer: string
  executiveSummary?: string
}

export type Industry = 
  | 'general'
  | 'healthcare'
  | 'financial-services'
  | 'manufacturing'
  | 'retail'
  | 'government'
  | 'education'
  | 'energy'
  | 'telecommunications'

export interface DiscoveryQuestion {
  id: string
  question: string
  category: 'business' | 'technical' | 'users' | 'challenges'
  placeholder?: string
  industries?: Industry[]
  isFollowUp?: boolean
  parentQuestionId?: string
}

export interface DiscoveryResponse {
  questionId: string
  answer: string
  followUpQuestions?: DiscoveryQuestion[]
}

export interface DiscoverySession {
  id: string
  customerId: string
  customerName: string
  innovationHubSPOC?: string
  name: string
  industry?: Industry
  innovationHubLocation: string
  solutionEngineer: string
  accountTeamRep: string
  primaryStakeholder: string
  executiveSummary?: string
  responses: DiscoveryResponse[]
  suggestedUseCases?: SuggestedUseCaseData[]
  createdAt: number
  completedAt?: number
  sessionDate?: number
}

export interface SuggestedUseCaseData {
  title: string
  description: string
  rationale: string
}

// ============================================================================
// ENTERPRISE DISCOVERY TYPES
// ============================================================================

export type DiscoveryType = 'new-opportunity' | 'expansion' | 'renewal'
export type StageStatus = 'not-started' | 'in-progress' | 'completed'
export type SCQStatus = 'confirmed' | 'adjusted' | 'rejected' | 'pending'

// Stage 1: Opportunity Types
export interface CostOfInaction {
  directCosts: {
    oneTime: number
    recurring: number // Per month
  }
  opportunityCosts: {
    oneTime: number
    recurring: number // Per month
  }
  riskCosts: {
    oneTime: number
    oneTimeProbability: number // 0-100
    recurring: number // Per month
    recurringProbability: number // 0-100
  }
  totalAnnual: number // Auto-calculated
}

export type ProblemCategory = 'efficiency' | 'growth' | 'risk' | 'compliance' | 'experience' | 'other'
export type AffectedArea = 'process' | 'team' | 'system' | 'customer' | 'multiple'
export type TimelineExpectation = '<3-months' | '3-6-months' | '6-12-months' | '12+-months'

export interface OpportunityStageData {
  // 1A: Current State
  problemStatement: string
  problemCategory: ProblemCategory
  affectedArea: AffectedArea
  
  // 1B: Desired State
  desiredOutcome: string
  successMetrics: string[]
  timelineExpectation: TimelineExpectation
  
  // 1C: Cost of Inaction
  coi: CostOfInaction
  
  // 1D: SCQ
  scq: {
    situation: string
    complication: string
    question: string
    status: SCQStatus
  }
}

// Stage 2: Resources Types
export type BudgetStatus = 'allocated' | 'accessible' | 'needs-case' | 'unknown'
export type BudgetRange = '<50k' | '50-150k' | '150-500k' | '500k-1m' | '>1m' | 'unknown'
export type CapacityLevel = 'high' | 'medium' | 'low' | 'unknown'
export type DataAvailability = 'ready' | 'needs-work' | 'unknown'

export interface ResourcesStageData {
  // 2A: Financial
  budgetStatus: BudgetStatus
  budgetRange: BudgetRange
  roiExpectation: string
  budgetOwner: string
  
  // 2B: Human
  executiveSponsor: string
  projectLead: string
  teamCapacity: CapacityLevel
  changeReadiness: CapacityLevel
  
  // 2C: Technical
  existingPlatforms: string[]
  dataAvailability: DataAvailability
  integrationRequirements: string[]
  technicalDebtConcerns: string
  
  // 2D: Temporal
  targetStart: number | null // timestamp
  targetCompletion: number | null // timestamp
  competingPriorities: string[]
  hardDependencies: string[]
  
  // SCQ
  scq: {
    situation: string
    complication: string
    question: string
    status: SCQStatus
  }
}

// Stage 3: Decision Process Types
export type StakeholderType = 'economic-buyer' | 'technical-evaluator' | 'user-buyer' | 'influencer' | 'blocker'
export type StakeholderDisposition = 'champion' | 'supportive' | 'neutral' | 'skeptical' | 'opposed' | 'unknown'
export type AccessLevel = 'direct' | 'indirect' | 'none'
export type DecisionStyle = 'single-decision-maker' | 'consensus' | 'committee' | 'procurement'
export type CompetitivePosition = 'preferred' | 'equal' | 'behind' | 'unknown'

export interface Stakeholder {
  id: string
  name: string
  role: string
  type: StakeholderType
  disposition: StakeholderDisposition
  accessLevel: AccessLevel
  keyConcern: string
}

export interface ApprovalStage {
  id: string
  stage: string
  approver: string
  expectedDate: number | null // timestamp
}

export interface DecisionProcessStageData {
  // 3A: Stakeholder Map
  stakeholders: Stakeholder[]
  
  // 3B: Evaluation Criteria
  formalCriteria: Array<{ criterion: string; weighting?: number }>
  informalCriteria: string[]
  competition: string
  competitivePosition: CompetitivePosition
  
  // 3C: Process Mechanics
  decisionStyle: DecisionStyle
  approvalStages: ApprovalStage[]
  decisionTimeline: number | null // timestamp
  procurementInvolvement: boolean | null
}

// Stage 4: RICE Prioritisation (reuses existing RICE from UseCase)
export interface PrioritisationStageData {
  opportunities: Array<{
    id: string
    title: string
    rice: {
      reach: number
      impact: number
      confidence: number
      effort: number
      score: number
    }
  }>
  recommendedOpportunityId?: string
}

// Stage 5: Solution Scope Types
export type ValueDriverCategory = 'revenue' | 'cost' | 'risk'

export interface ValueDriver {
  id: string
  category: ValueDriverCategory
  driver: string
  value: number
  period: 'one-time' | 'month' | 'quarter' | 'year'
}

export interface Phase {
  id: string
  name: string
  duration: string
}

export interface SuccessMetric {
  id: string
  type: 'leading' | 'lagging'
  metric: string
  baseline: string
  target: string
}

export type RiskCategory = 'technical' | 'adoption' | 'organisational' | 'commercial' | 'external'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Risk {
  id: string
  description: string
  category: RiskCategory
  likelihood: RiskLevel
  impact: RiskLevel
  mitigation: string
  owner: string
}

export interface SolutionScopeStageData {
  // 5A: Scope Definition
  inScope: string[]
  outOfScope: string[]
  mvpDefinition: string
  phases: Phase[]
  
  // 5B: Value Driver Tree
  valueDrivers: ValueDriver[]
  totalAnnualValue: number // Auto-calculated
  riskAdjustedValue: number // Auto-calculated
  paybackPeriod: number // Months, auto-calculated
  
  // 5C: Success Metrics
  successMetrics: SuccessMetric[]
  
  // 5D: Risk Assessment
  risks: Risk[]
}

// Stage 6: Validation Types
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Assumption {
  id: string
  assumption: string
  basis: string
  confidence: ConfidenceLevel
  validationPlan: string
}

export interface ValidateStageData {
  assumptions: Assumption[]
  
  // Value Capture Mechanism
  valueLocation: string // P&L line, balance sheet, capacity, risk avoided
  valueValidator: string // Name/role
  reviewFrequency: string
}

// Stage 7: Commit Types
export type YesNoPartially = 'yes' | 'partially' | 'no'
export type FitLevel = 'high' | 'medium' | 'low'
export type ViabilityLevel = 'good' | 'marginal' | 'poor'
export type YellowLightSeverity = 'minor' | 'moderate' | 'serious' | 'deal-breaker'
export type CommitDecision = 'proceed' | 'refine' | 'pause' | 'walk-away'

export interface YellowLight {
  id: string
  description: string
  stageIdentified: string
  severity: YellowLightSeverity
  resolutionPlan: string
  owner: string
  dueDate: number | null // timestamp
  resolved: boolean
}

export interface CommitStageData {
  // 7A: Relationship Assessment
  trustIndicators: {
    sharingRealNumbers: YesNoPartially
    sharingRealConcerns: YesNoPartially
    believeWeCanDeliver: YesNoPartially
  }
  engagementIndicators: {
    accessToDecisionMakers: 'full' | 'limited' | 'none'
    responsiveness: 'high' | 'medium' | 'low'
    clientInvestingResources: YesNoPartially
  }
  fitIndicators: {
    strategicFit: FitLevel
    canDeliver: YesNoPartially
    commercialViability: ViabilityLevel
  }
  
  // 7B: Yellow Lights
  yellowLights: YellowLight[]
  
  // 7C: Outcome Decision
  decision: CommitDecision
}

// Stage 8: Financial Outputs Types
export interface PLImpactSummary {
  year1: {
    revenueImpact: number
    cogsImpact: number
    grossMarginImpact: number
    opexImpact: number
    ebitImpact: number
  }
  year2: {
    revenueImpact: number
    cogsImpact: number
    grossMarginImpact: number
    opexImpact: number
    ebitImpact: number
  }
  year3: {
    revenueImpact: number
    cogsImpact: number
    grossMarginImpact: number
    opexImpact: number
    ebitImpact: number
  }
  total: {
    revenueImpact: number
    cogsImpact: number
    grossMarginImpact: number
    opexImpact: number
    ebitImpact: number
  }
}

export interface InvestmentAnalysis {
  totalInvestmentYear1: number
  totalAnnualBenefit: number
  simplePaybackMonths: number
  roi3Year: number // Percentage
  npv10Percent: number
  irr: number // Percentage
}

export interface SensitivityScenario {
  conservative: {
    annualBenefit: number
    paybackMonths: number
    roi3Year: number
    npv: number
  }
  base: {
    annualBenefit: number
    paybackMonths: number
    roi3Year: number
    npv: number
  }
  optimistic: {
    annualBenefit: number
    paybackMonths: number
    roi3Year: number
    npv: number
  }
}

export interface CommunicateStageData {
  plImpact: PLImpactSummary
  investmentAnalysis: InvestmentAnalysis
  sensitivityAnalysis: SensitivityScenario
}

// Main Enterprise Discovery Session
export interface EnterpriseDiscoverySession {
  id: string
  
  // Stage 0: START
  clientName: string
  attendees: Array<{ name: string; role: string }>
  sessionDate: number
  discoveryType: DiscoveryType
  
  // Stage data
  currentStageId: number // 0-8
  stages: {
    0: { status: StageStatus; completedAt?: number; data: null }
    1: { status: StageStatus; completedAt?: number; data: OpportunityStageData | null }
    2: { status: StageStatus; completedAt?: number; data: ResourcesStageData | null }
    3: { status: StageStatus; completedAt?: number; data: DecisionProcessStageData | null }
    4: { status: StageStatus; completedAt?: number; data: PrioritisationStageData | null }
    5: { status: StageStatus; completedAt?: number; data: SolutionScopeStageData | null }
    6: { status: StageStatus; completedAt?: number; data: ValidateStageData | null }
    7: { status: StageStatus; completedAt?: number; data: CommitStageData | null }
    8: { status: StageStatus; completedAt?: number; data: CommunicateStageData | null }
  }
  
  // Global yellow lights (accessible from any stage)
  allYellowLights: YellowLight[]
  
  createdAt: number
  completedAt?: number
}
