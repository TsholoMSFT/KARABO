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
  stockTicker?: string
  createdAt: number
  updatedAt?: number
}

// ============================================================================
// AI REGULATIONS & CYBERSECURITY TYPES
// ============================================================================

// Note: Full policy details are in ai-policies.ts
export type AIRegulationFramework = 
  // International/Global
  | 'oecd-ai-principles'      // OECD AI Principles
  | 'unesco-ai-ethics'        // UNESCO Recommendation on AI Ethics
  | 'iso-42001'               // ISO/IEC 42001 AI Management System
  
  // European Union
  | 'eu-ai-act'               // EU AI Act (2024)
  | 'gdpr'                    // General Data Protection Regulation
  
  // United States
  | 'nist-ai-rmf'             // NIST AI Risk Management Framework
  | 'white-house-eo'          // US Executive Order on AI (Oct 2023)
  | 'ccpa'                    // California Consumer Privacy Act
  | 'hipaa'                   // HIPAA (healthcare)
  | 'sox'                     // Sarbanes-Oxley (financial)
  | 'ferpa'                   // Education records
  | 'glba'                    // Gramm-Leach-Bliley (financial)
  
  // African Union & Africa
  | 'au-ai-strategy'          // African Union AI Continental Strategy
  | 'au-data-policy'          // AU Data Policy Framework
  | 'smart-africa'            // Smart Africa Alliance AI Blueprint
  
  // South Africa
  | 'sa-ai-policy-draft'      // South Africa Draft National AI Policy
  | 'popia'                   // Protection of Personal Information Act
  | 'ecta'                    // Electronic Communications and Transactions Act
  | 'dmre'                    // Dept of Mineral Resources (mining)
  | 'sahpra'                  // SA Health Products Regulatory Authority
  
  // Industry-Specific
  | 'msha'                    // Mine Safety and Health (mining)
  | 'epa'                     // Environmental Protection
  | 'osha'                    // Occupational Safety
  | 'nerc-cip'                // Energy sector cybersecurity
  | 'pci-dss'                 // Payment Card Industry
  
  // Microsoft & Technology
  | 'ms-responsible-ai'       // Microsoft Responsible AI Standard
  | 'ms-ai-principles'        // Microsoft AI Principles
  | 'ms-copilot-governance'   // Microsoft Copilot Governance
  
  | 'other'

export type AIRiskLevel = 
  | 'unacceptable'        // Banned under EU AI Act
  | 'high'                // Requires conformity assessment
  | 'limited'             // Transparency obligations
  | 'minimal'             // No specific requirements

export type SecurityRequirement =
  | 'encryption-at-rest'
  | 'encryption-in-transit'
  | 'access-control'
  | 'audit-logging'
  | 'penetration-testing'
  | 'vulnerability-scanning'
  | 'data-masking'
  | 'mfa-required'
  | 'soc2-compliance'
  | 'iso27001'
  | 'zero-trust'
  | 'air-gapped'
  | 'on-premises-only'
  | 'scada-protection'    // Industrial control systems

export type ThreatCategory =
  | 'data-breach'
  | 'prompt-injection'
  | 'model-poisoning'
  | 'adversarial-attacks'
  | 'data-exfiltration'
  | 'insider-threat'
  | 'supply-chain'
  | 'denial-of-service'
  | 'ot-it-convergence'   // Operational Technology risks
  | 'scada-attack'        // Industrial control system attacks

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'highly-confidential'
  | 'pii'
  | 'phi'                 // Protected Health Information
  | 'financial'
  | 'operational'         // Operational/industrial data

export interface AIRegulationsInfo {
  applicableFrameworks: AIRegulationFramework[]
  riskClassification?: AIRiskLevel
  complianceNotes?: string
  jurisdictions?: string[]  // e.g., ['South Africa', 'EU', 'USA']
}

export interface CybersecurityInfo {
  securityRequirements: SecurityRequirement[]
  threatCategories?: ThreatCategory[]
  dataClassification?: DataClassification
  securityNotes?: string
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
  // AI Regulations & Cybersecurity (footnote-level considerations)
  aiRegulations?: AIRegulationsInfo
  cybersecurity?: CybersecurityInfo
  // Data sources that informed this use case
  dataSources?: ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery')[]
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
  stockTicker?: string // For public companies - enables earnings/financial analysis
  executiveSummary?: string
  responses: DiscoveryResponse[]
  suggestedUseCases?: SuggestedUseCaseData[]
  earningsInsights?: EarningsInsight[] // AI-extracted insights from earnings calls
  createdAt: number
  completedAt?: number
  sessionDate?: number
}

// Earnings/Financial data insights
export interface EarningsInsight {
  id: string
  category: 'strategic-priority' | 'pain-point' | 'investment' | 'opportunity' | 'risk' | 'trend'
  title: string
  description: string
  quote?: string
  source: string
  relevanceScore: number
}

export interface SuggestedUseCaseData {
  title: string
  description: string
  rationale: string
}

// ============================================================================
// ENTERPRISE DISCOVERY TYPES
// ============================================================================

export type DiscoveryType = 'new-opportunity' | 'expansion' | 'renewal' | 'macc'
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
  sourceStage?: string // e.g., 'Stage 1 COI' for auto-populated drivers
  isFromCOI?: boolean // Indicates if this driver was auto-populated from COI
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

// ============================================================================
// DETAILED FINANCIAL IMPACT TYPES (Three-Statement Model)
// ============================================================================

// Revenue Impact Mapping - 5 drivers with metric chain inputs
export type RevenueDriverType = 'customer-acquisition' | 'margin-improvement' | 'sales-cycle' | 'churn-reduction' | 'upsell-crosssell'

export interface RevenueImpactDriver {
  id: string
  type: RevenueDriverType
  enabled: boolean
  
  // Metric chain inputs (vary by driver type)
  inputs: {
    // Customer Acquisition: Leads × Conversion × Deal Size
    leads?: number
    conversionRate?: number // percentage
    avgDealSize?: number
    
    // Margin Improvement: Price × Volume - Discount
    priceIncrease?: number // percentage
    volume?: number
    discountReduction?: number // percentage
    
    // Sales Cycle: Pipeline × Win Rate × (365 ÷ Cycle Days)
    pipelineValue?: number
    winRate?: number // percentage
    currentCycleDays?: number
    newCycleDays?: number
    
    // Churn Reduction: Customers × (1 - Churn) × LTV
    customerCount?: number
    currentChurnRate?: number // percentage
    newChurnRate?: number // percentage
    customerLTV?: number
    
    // Upsell/Cross-sell: Customers × Expansion Rate × ARPU
    existingCustomers?: number
    expansionRate?: number // percentage
    arpu?: number
  }
  
  // Auto-calculated output
  calculatedAnnualValue: number
  plLine: 'revenue' // Always maps to Revenue line
  notes?: string
}

// Cost Impact Mapping - 5 drivers with FTE tracking
export type CostDriverType = 'labour-efficiency' | 'error-reduction' | 'infrastructure' | 'vendor-consolidation' | 'automation'

export interface CostImpactDriver {
  id: string
  type: CostDriverType
  enabled: boolean
  
  // Metric chain inputs
  inputs: {
    // Labour Efficiency: Hours × Loaded Cost × Volume
    hoursSavedPerTask?: number
    fullyLoadedHourlyCost?: number
    tasksPerMonth?: number
    
    // Error Reduction: Error Rate × Volume × Cost per Error
    currentErrorRate?: number // percentage
    newErrorRate?: number // percentage
    transactionVolume?: number
    costPerError?: number
    
    // Infrastructure: Current - Future Spend
    currentMonthlySpend?: number
    futureMonthlySpend?: number
    
    // Vendor Consolidation: Current - Consolidated
    vendorCount?: number
    costPerVendor?: number
    consolidatedCost?: number
    
    // Automation: Manual Cost - Automated Cost
    manualCostPerProcess?: number
    automatedCostPerProcess?: number
    processVolume?: number
  }
  
  // Auto-calculated outputs
  calculatedAnnualValue: number
  fteEquivalent: number // Show FTE equivalent for transparency
  plLine: 'cogs' | 'opex' // Maps to COGS or OpEx
  notes?: string
}

// Balance Sheet & Cash Flow Impact
export type BalanceSheetDriverType = 'collections' | 'inventory' | 'capex-avoidance' | 'risk-provision'

export interface BalanceSheetCashFlowDriver {
  id: string
  type: BalanceSheetDriverType
  enabled: boolean
  
  inputs: {
    // Faster Collections (DSO Reduction)
    currentDSO?: number // Days Sales Outstanding
    newDSO?: number
    dailyRevenue?: number
    
    // Inventory Optimisation (DIO Reduction)
    currentDIO?: number // Days Inventory Outstanding
    newDIO?: number
    dailyCOGS?: number
    
    // CapEx Avoidance
    avoidedCapEx?: number
    alternativeOpEx?: number // If shifting to cloud/subscription
    
    // Risk Provision Release
    currentProvision?: number
    riskReductionPercent?: number // percentage
  }
  
  calculatedValue: number
  cashFlowImpact: number
  statementLine: 'working-capital' | 'cash-operating' | 'cash-investing' | 'balance-sheet'
  notes?: string
}

// Metric Hierarchy - Strategic → Financial → Operational → Activity
export type MetricLevel = 'strategic' | 'financial' | 'operational' | 'activity'

export interface MetricHierarchyItem {
  id: string
  level: MetricLevel
  name: string
  linkedToId?: string // Links to parent metric at higher level
}

export interface MetricHierarchy {
  strategicOutcome: string // e.g., "Shareholder Value", "Revenue Growth"
  financialMetrics: string[] // e.g., ["Revenue by Segment", "Gross Margin %"]
  operationalMetrics: string[] // e.g., ["Cycle Time", "Error Rate"]
  activityMetrics: string[] // e.g., ["Documents Processed", "Cases Resolved"]
}

// Extended Solution Scope Stage Data with sub-steps
export interface SolutionScopeStageData {
  // Current sub-step (5a, 5b, 5c)
  currentSubStep: 'overview' | 'revenue' | 'cost' | 'balance-sheet' | 'summary'
  
  // 5A: Scope Definition (kept from original)
  inScope: string[]
  outOfScope: string[]
  mvpDefinition: string
  phases: Phase[]
  
  // 5B: Value Driver Tree (legacy - kept for compatibility)
  valueDrivers: ValueDriver[]
  
  // NEW: Detailed Revenue Impact (Stage 5a)
  revenueImpact: {
    drivers: RevenueImpactDriver[]
    totalAnnualRevenue: number
    sourceFromCOI: boolean // If opportunity costs were auto-populated
  }
  
  // NEW: Detailed Cost Impact (Stage 5b)
  costImpact: {
    drivers: CostImpactDriver[]
    totalAnnualSavings: number
    totalFTEEquivalent: number
    sourceFromCOI: boolean // If direct costs were auto-populated
  }
  
  // NEW: Balance Sheet & Cash Flow Impact (Stage 5c)
  balanceSheetCashFlow: {
    drivers: BalanceSheetCashFlowDriver[]
    totalWorkingCapitalImpact: number
    totalCashFlowImpact: number
  }
  
  // NEW: Metric Hierarchy
  metricHierarchy: MetricHierarchy
  
  // Aggregated values (auto-calculated)
  totalAnnualValue: number
  riskAdjustedValue: number
  paybackPeriod: number // Months
  
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
  
  // NEW: Three-Statement Financial Model
  threeStatementModel: {
    incomeStatement: {
      revenue: { year1: number; year2: number; year3: number }
      cogs: { year1: number; year2: number; year3: number }
      grossProfit: { year1: number; year2: number; year3: number }
      opex: {
        salesMarketing: { year1: number; year2: number; year3: number }
        rAndD: { year1: number; year2: number; year3: number }
        gAndA: { year1: number; year2: number; year3: number }
        total: { year1: number; year2: number; year3: number }
      }
      ebit: { year1: number; year2: number; year3: number }
    }
    balanceSheet: {
      workingCapitalChange: number
      inventoryReduction: number
      receivablesReduction: number
      capexAvoided: number
    }
    cashFlow: {
      operatingCashFlow: { year1: number; year2: number; year3: number }
      investingCashFlow: { year1: number; year2: number; year3: number }
      netCashFlow: { year1: number; year2: number; year3: number }
    }
  }
  
  // NEW: Metric Hierarchy Summary (pulled from Stage 5)
  metricHierarchy: MetricHierarchy
  
  // NEW: Value Driver Summary by P&L Line
  valueDriversByPLLine: {
    revenue: Array<{ driver: string; annualValue: number }>
    cogs: Array<{ driver: string; annualValue: number }>
    opex: Array<{ driver: string; annualValue: number }>
    balanceSheet: Array<{ driver: string; value: number }>
  }
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
  
  // Session state
  isLiveMode?: boolean // Voice input enabled
  isPaused?: boolean
  pausedAt?: number
  lastSavedAt?: number
  
  createdAt: number
  completedAt?: number
}
