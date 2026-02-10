import { CompanyInsight } from './company-research-service'

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
  
  // EU Sector-Specific
  | 'dora'                    // Digital Operational Resilience Act (EU financial)
  | 'nis2'                    // NIS2 Directive (EU critical infrastructure)

  // US Sector-Specific
  | 'fedramp'                 // FedRAMP (US federal cloud)
  | 'finra'                   // Financial Industry Regulatory Authority
  | 'cpra'                    // California Privacy Rights Act (supersedes CCPA)
  | 'fda-samd'                // FDA Software as Medical Device

  // International Standards
  | 'soc2'                    // SOC 2 Type II
  | 'iso-27001'               // ISO/IEC 27001 Information Security

  // Industry-Specific
  | 'msha'                    // Mine Safety and Health (mining)
  | 'epa'                     // Environmental Protection
  | 'osha'                    // Occupational Safety
  | 'nerc-cip'                // Energy sector cybersecurity
  | 'pci-dss'                 // Payment Card Industry
  
  // Australia
  | 'au-ai-ethics-framework'  // Australia AI Ethics Framework
  
  // Brazil
  | 'brazil-lgpd'             // Lei Geral de Proteção de Dados
  | 'brazil-ai-bill'          // Brazil AI Regulation Bill
  
  // Singapore
  | 'singapore-ai-governance' // Singapore Model AI Governance Framework
  
  // United Kingdom
  | 'uk-ai-regulation'        // UK Pro-innovation AI Regulation
  
  // Canada
  | 'canada-aida'             // Artificial Intelligence and Data Act
  
  // Japan
  | 'japan-ai-strategy'       // Japan AI Strategy
  
  // India
  | 'india-dpdp'              // Digital Personal Data Protection Act
  
  // UAE
  | 'uae-ai-strategy'         // UAE National AI Strategy 2031
  
  // Kenya
  | 'kenya-dpa'               // Kenya Data Protection Act
  
  // Nigeria
  | 'nigeria-ndpr'            // Nigeria Data Protection Regulation
  
  // China
  | 'china-ai-regulations'    // China AI Regulations (Deep Synthesis / Generative AI)
  
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

// ============================================================================
// ENTITY TYPE - For public vs private vs government organizations
// ============================================================================

export type EntityType = 
  | 'public-company'      // Publicly traded company with stock ticker
  | 'private-company'     // Private company (no stock ticker)
  | 'government'          // Government / Public Sector agency
  | 'non-profit'          // Non-profit organization

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  'public-company': 'Public Company',
  'private-company': 'Private Company',
  'government': 'Government / Public Sector',
  'non-profit': 'Non-Profit Organization',
}

export const ENTITY_TYPE_DESCRIPTIONS: Record<EntityType, string> = {
  'public-company': 'Publicly traded on stock exchanges (NYSE, NASDAQ, JSE, etc.)',
  'private-company': 'Privately held company, not publicly traded',
  'government': 'Government department, agency, or public sector organization',
  'non-profit': 'Non-profit, NGO, or charitable organization',
}

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

// ============================================================================
// REGULATORY STAGE-GATE TYPES
// ============================================================================

/** Enforcement mode for compliance gating — configurable per session */
export type ComplianceEnforcement = 'strict' | 'advisory'

/** Per-framework risk assessment result */
export interface FrameworkAssessment {
  framework: AIRegulationFramework
  risk: AIRiskLevel
  reason: string
  articles?: string[]     // e.g., ["Art. 5(1)(a)", "Art. 6"]
}

/** A concrete remediation action to reduce risk */
export interface RemediationOption {
  id: string
  framework: AIRegulationFramework
  action: string
  priority: 'critical' | 'recommended' | 'optional'
  description: string
  acknowledged?: boolean  // User has reviewed / accepted this remediation
  acknowledgedAt?: number
  acknowledgedBy?: string
}

/** Aggregate regulatory assessment attached to a use case */
export interface RegulatoryAssessment {
  overallRisk: AIRiskLevel
  frameworkAssessments: FrameworkAssessment[]
  remediations: RemediationOption[]
  gateStatus: 'blocked' | 'warning' | 'clear'
  signOffRequired: boolean
  signedOff?: boolean
  signedOffBy?: string
  signedOffAt?: number
  overrideJustification?: string  // If facilitator overrides risk
  assessedAt: number
}

/** A regulatory news item from the regulatory-feeds endpoint */
export interface RegulatoryNewsItem {
  id: string
  title: string
  description: string
  source: string
  publishedDate: string
  jurisdiction: string
  url: string
  relevanceScore?: number
}

/** A violation / enforcement case ranked by AI for similarity */
export interface ViolationCase {
  id: string
  headline: string
  jurisdiction: string
  framework: string
  penaltyAmount?: string
  date: string
  relevanceSummary: string
  lessonsLearned: string
  sourceUrl: string
  severity: 'major' | 'moderate' | 'minor'
}

/** Manual financial context for non-public entities */
export interface ManualFinancialContext {
  annualRevenue?: number        // Or annual budget for government
  employeeCount?: number
  itBudget?: number
  keyFinancialMetrics?: string  // Freeform text
  financialSource?: 'manual' | 'document-extraction' | 'industry-benchmark'
}

/** Industry benchmark data (used as fallback when no financials available) */
export interface IndustryBenchmark {
  industry: Industry
  revenuePerEmployee?: { min: number; median: number; max: number }
  itSpendPercent?: { min: number; median: number; max: number }
  operationalCostPercent?: number
  source: string
  year: number
}

// ============================================================================
// COST OF INACTION (COI) TYPES
// ============================================================================

export interface UseCaseCOI {
  directCosts: number           // Current spending on workarounds
  opportunityCosts: number      // Lost revenue/market share
  riskCosts: number             // Potential fines/compliance issues
  totalAnnualCOI: number        // Sum of all costs
  notes?: string                // Calculation assumptions
  calculatedAt?: number         // Timestamp
}

export interface UseCaseExpectedValue {
  revenueImpact?: number        // Annual revenue improvement
  costSavings?: number          // Annual cost reduction
  riskMitigation?: number       // Risk-adjusted value avoided
  totalAnnualValue: number      // Total expected value
  implementationCost?: number   // One-time implementation cost
  paybackMonths?: number        // Payback period in months
  threeYearROI?: number         // 3-year ROI percentage
  notes?: string                // Calculation assumptions / derived notes (editable)
}

export interface UseCase {
  id: string
  discoverySessionId?: string
  title: string
  description: string
  // Ownership / accountability
  customerAccountable?: string
  microsoftAccountable?: string
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
  // Regulatory stage-gate assessment (populated by regulatory engine)
  regulatoryAssessment?: RegulatoryAssessment
  // Data sources that informed this use case
  dataSources?: ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery' | 'ai-generated' | 'manual' | 'fallback')[]
  // AI-powered effort estimation (cached)
  aiEffortEstimate?: {
    effortWeeks: number
    reasoning: string
    estimatedAt: number
  }
  // Financial quantification (optional)
  costOfInaction?: UseCaseCOI
  expectedValue?: UseCaseExpectedValue
  // Contextual data from discovery
  earningsContext?: string[]    // Key earnings insights relevant to this use case
  industryContext?: string[]    // Industry trends/standards addressed
  createdAt: number
  
  // ============================================================================
  // INNOVATION HUB METHODOLOGY ADDITIONS
  // ============================================================================
  
  // Strategic alignment (Business Envisioning)
  strategicAlignment?: StrategicAlignmentInfo
  
  // Business process mapping (Business Envisioning)
  businessProcesses?: UseCaseBusinessProcess[]
  
  // Microsoft solution recommendations (Solution Envisioning)
  microsoftSolutions?: UseCaseMicrosoftSolution[]
  // Quick Discovery solution mapping (name/play only)
  solutionPlays?: string[]
  referenceArchitecture?: string  // Reference architecture pattern ID
  
  // Agentic AI opportunities (Solution Envisioning)
  agenticOpportunities?: UseCaseAgenticOpportunity[]
  
  // Implementation complexity (Solution Envisioning)
  implementationComplexity?: ImplementationComplexityInfo

  // Customer Journey / Engagement Roadmap
  customerJourney?: CustomerJourney

  // Apps That Matter (ATM) Qualification Score (computed, not persisted)
  atmScore?: ATMScore
}

// ============================================================================
// APPS THAT MATTER (ATM) QUALIFICATION SCORING
// ============================================================================

/**
 * ATM Qualification Tier — maps to Microsoft's FY26 "Apps That Matter" initiative.
 * 
 * NOTE: This is KARABO's quantified interpretation of ATM's qualitative checklist.
 * The official ATM criteria are pass/fail; this model provides a numerical assessment 
 * to help systematically strengthen opportunities before tagging them as ATM in pipeline.
 */
export type ATMTier = 'platinum' | 'gold' | 'silver' | 'not-qualified' | 'insufficient-data'

/**
 * The three ATM pillars for multi-pillar assessment.
 * ATM defines qualifying opportunities should span AI + Apps + Data.
 */
export type ATMPillar = 'ai' | 'apps' | 'data'

export const ATM_PILLAR_LABELS: Record<ATMPillar, string> = {
  ai: 'AI',
  apps: 'Apps',
  data: 'Data',
}

export const ATM_TIER_CONFIG: Record<ATMTier, {
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  minScore: number
}> = {
  'platinum': {
    label: 'Platinum',
    description: 'Fully ATM-qualified — ready for pipeline tagging',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    icon: '✦',
    minScore: 80,
  },
  'gold': {
    label: 'Gold',
    description: 'Strong ATM candidate — minor gaps to address',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    icon: '◆',
    minScore: 60,
  },
  'silver': {
    label: 'Silver',
    description: 'Promising but needs development in 1-2 dimensions',
    color: 'text-slate-300',
    bgColor: 'bg-slate-400/15',
    borderColor: 'border-slate-400/40',
    icon: '●',
    minScore: 40,
  },
  'not-qualified': {
    label: 'Not Yet Qualified',
    description: 'Significant gaps — review recommendations to elevate',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted',
    icon: '○',
    minScore: 0,
  },
  'insufficient-data': {
    label: 'Insufficient Data',
    description: 'Complete more assessments to receive an ATM qualification',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-muted',
    icon: '…',
    minScore: 0,
  },
}

/**
 * Status of a single scoring component — distinguishes "scored low" from "not assessed"
 */
export type ATMComponentStatus = 'scored' | 'partial' | 'not-assessed'

/**
 * A single component within a dimension's scoring breakdown
 */
export interface ATMComponentScore {
  name: string
  maxPoints: number
  earnedPoints: number
  status: ATMComponentStatus
  explanation: string           // Human-readable explanation of how points were earned
  sourceFields: string[]        // Which data fields contributed (for transparency)
  recommendation?: string       // If not full points, what to do (actionable)
}

/**
 * Score for a single ATM dimension (e.g., Business Impact)
 */
export interface ATMDimensionScore {
  dimension: ATMDimension
  label: string
  weight: number                // 0-1, sums to 1.0 across all dimensions
  rawScore: number              // 0-100 (normalised against assessed components)
  componentsAssessed: number
  componentsTotal: number
  components: ATMComponentScore[]
  topRecommendation?: string    // Single most impactful action for this dimension
}

export type ATMDimension = 
  | 'business-impact'
  | 'innovation-agentic'
  | 'enterprise-grade'
  | 'multi-pillar'
  | 'repeatability'

export const ATM_DIMENSION_LABELS: Record<ATMDimension, string> = {
  'business-impact': 'Business Impact',
  'innovation-agentic': 'Innovation & Agentic',
  'enterprise-grade': 'Enterprise-Grade',
  'multi-pillar': 'Multi-Pillar',
  'repeatability': 'Repeatability',
}

export const ATM_DIMENSION_DESCRIPTIONS: Record<ATMDimension, string> = {
  'business-impact': 'Solves real business problems with measurable value',
  'innovation-agentic': 'Leverages agentic AI — autonomous, reasoning, adaptive',
  'enterprise-grade': 'Production-ready with security, compliance, governance',
  'multi-pillar': 'Spans AI + Apps + Data pillars for bigger, stickier deals',
  'repeatability': 'Built on proven blueprints and solution patterns',
}

/**
 * Complete ATM qualification score for a use case
 */
export interface ATMScore {
  compositeScore: number        // 0-100 weighted average
  tier: ATMTier
  confidence: number            // 0-100% — how many components have data
  dimensions: ATMDimensionScore[]
  pillarsCovered: ATMPillar[]   // Which of the 3 pillars are present
  gapRecommendations: ATMGapRecommendation[]   // Ordered by impact
  calculatedAt: number          // Timestamp
}

/**
 * A single actionable recommendation to improve the ATM score
 */
export interface ATMGapRecommendation {
  dimension: ATMDimension
  action: string                // Human-readable action, e.g. "Complete the regulatory assessment"
  potentialPointsGain: number   // How many composite points this could add
  priority: 'high' | 'medium' | 'low'
}

// ============================================================================
// CUSTOMER JOURNEY / ENGAGEMENT ROADMAP TYPES (Innovation Hub)
// ============================================================================

/**
 * Innovation Hub engagement types representing the structured approach to
 * moving from discovery to implementation.
 */
export type InnovationHubEngagement =
  | 'business-envisioning'     // Discover prioritized use cases through design thinking
  | 'solution-envisioning'     // Agree on technical direction and goals alignment
  | 'architecture-design'      // Synthesize requirements and align to reference architectures
  | 'rapid-prototype'          // Validate capabilities and accelerate decision making

/**
 * Default deliverables for each Innovation Hub engagement type
 */
export const ENGAGEMENT_DEFAULTS: Record<InnovationHubEngagement, {
  title: string
  description: string
  defaultDuration: string
  defaultDeliverables: string[]
  insightPrompts: string[]
  keyQuestions: string[]
  successMetrics: string[]
}> = {
  'business-envisioning': {
    title: 'Business Envisioning',
    description: 'Discover prioritized use cases through human-centered design thinking. Explore opportunities, challenges, and define next steps.',
    defaultDuration: '1-2 weeks',
    defaultDeliverables: [
      'Use case prioritization matrix',
      'Stakeholder alignment document',
      'Design thinking workshop outputs',
      'Opportunity assessment'
    ],
    insightPrompts: [
      'What pain points were identified during discovery?',
      'Which stakeholders need to be involved?',
      'What are the primary business drivers?'
    ],
    keyQuestions: [
      'Who are the key decision makers and influencers?',
      'What does success look like for this initiative?',
      'What constraints or blockers exist?'
    ],
    successMetrics: [
      'Stakeholder alignment achieved',
      'Use cases prioritized with clear rationale',
      'Next steps agreed upon'
    ]
  },
  'solution-envisioning': {
    title: 'Solution Envisioning',
    description: 'A strategic business and technical discussion to understand goals, offer insights, and envision the solution with Microsoft and partner capabilities.',
    defaultDuration: '1-2 weeks',
    defaultDeliverables: [
      'Technical direction document',
      'Solution concept diagram',
      'Microsoft capabilities mapping',
      'Partner ecosystem assessment'
    ],
    insightPrompts: [
      'What current systems need to integrate?',
      'What technical debt or constraints exist?',
      'What is the current technology maturity level?'
    ],
    keyQuestions: [
      'What Microsoft technologies are already in use?',
      'Are there specific compliance or security requirements?',
      'What is the timeline expectation?'
    ],
    successMetrics: [
      'Technical feasibility validated',
      'Solution architecture agreed',
      'Microsoft capabilities mapped to requirements'
    ]
  },
  'architecture-design': {
    title: 'Architecture Design',
    description: 'Synthesize business and technical requirements for initial scope and alignment to reference architectures to drive next steps.',
    defaultDuration: '2-3 weeks',
    defaultDeliverables: [
      'Reference architecture alignment',
      'Scope definition document',
      'Integration requirements',
      'Technical feasibility assessment',
      'Cost estimation'
    ],
    insightPrompts: [
      'What are the integration points identified?',
      'What data flows need to be considered?',
      'What are the scalability requirements?'
    ],
    keyQuestions: [
      'What reference architectures apply?',
      'What is the expected load/scale?',
      'What are the DR/HA requirements?'
    ],
    successMetrics: [
      'Architecture aligned to reference patterns',
      'Scope clearly defined and agreed',
      'Cost estimation provided'
    ]
  },
  'rapid-prototype': {
    title: 'Rapid Prototype',
    description: 'Demonstrate key technical capabilities of a solution and address challenges to accelerate decision making.',
    defaultDuration: '2-4 weeks',
    defaultDeliverables: [
      'Proof of concept demo',
      'Technical validation report',
      'Performance benchmarks',
      'Risk assessment',
      'Go/No-Go recommendation'
    ],
    insightPrompts: [
      'What are the highest risk technical unknowns?',
      'What needs to be proven to stakeholders?',
      'What integration challenges were flagged?'
    ],
    keyQuestions: [
      'What are the POC success criteria?',
      'Who needs to see the demo?',
      'What is the go/no-go decision framework?'
    ],
    successMetrics: [
      'Technical capabilities validated',
      'Stakeholder demo completed',
      'Go/No-Go decision made'
    ]
  }
}

/**
 * A single milestone in the customer journey roadmap
 */
export interface CustomerJourneyMilestone {
  id: string
  order: number
  title: string
  description: string
  engagement: InnovationHubEngagement
  duration: string                        // e.g., "1-2 weeks"
  deliverables: string[]
  dependencies: string[]                  // IDs of prerequisite milestones
  isComplete: boolean
  completedAt?: number
  notes?: string
  discoveryContext?: string               // Context from discovery insights
}

/**
 * A next step action item for the journey
 */
export interface JourneyNextStep {
  id: string
  action: string
  owner?: string                          // Optional assignee
  targetDate?: string                     // Optional target date (ISO string)
  isComplete: boolean
  completedAt?: number
}

/**
 * Edit history entry for undo functionality
 */
export interface JourneyEdit {
  id: string
  timestamp: number
  action: 'reorder' | 'duration' | 'deliverables' | 'notes' | 'complete' | 'reset' | 'title' | 'journeyNotes' | 'nextSteps'
  previousState: CustomerJourneyMilestone[]
  previousJourneyState?: Partial<CustomerJourney>  // For title/notes/nextSteps undo
  description: string
}

/**
 * Complete customer journey / engagement roadmap for a use case
 */
export interface CustomerJourney {
  useCaseId: string
  title?: string                          // Journey title
  journeyNotes?: string                   // Overall journey notes/context
  nextSteps?: JourneyNextStep[]           // Action items with optional owner/date
  milestones: CustomerJourneyMilestone[]
  totalDuration: string                   // e.g., "6-11 weeks"
  createdAt: number
  updatedAt?: number
  generatedBy: 'ai' | 'manual'
  editHistory: JourneyEdit[]              // For undo capability
  discoveryInsights?: {                   // Context from discovery session
    painPoints?: string[]
    stakeholders?: string[]
    constraints?: string[]
    opportunities?: string[]
  }
}

/**
 * Helper to calculate total duration from milestones
 */
export function calculateJourneyDuration(milestones: CustomerJourneyMilestone[]): string {
  let minWeeks = 0
  let maxWeeks = 0

  for (const m of milestones) {
    const match = m.duration.match(/(\d+)(?:\s*-\s*(\d+))?\s*week/i)
    if (match) {
      minWeeks += parseInt(match[1], 10)
      maxWeeks += parseInt(match[2] || match[1], 10)
    }
  }

  if (minWeeks === maxWeeks) {
    return `${minWeeks} weeks`
  }
  return `${minWeeks}-${maxWeeks} weeks`
}

/**
 * Generate default journey milestones based on implementation complexity
 */
export function generateDefaultJourneyMilestones(
  useCaseId: string,
  complexity: 'low' | 'medium' | 'high' | 'very-high' = 'medium'
): CustomerJourneyMilestone[] {
  const milestones: CustomerJourneyMilestone[] = []
  let order = 1

  // All journeys start with Business Envisioning
  milestones.push({
    id: `${useCaseId}-m${order}`,
    order: order++,
    title: ENGAGEMENT_DEFAULTS['business-envisioning'].title,
    description: ENGAGEMENT_DEFAULTS['business-envisioning'].description,
    engagement: 'business-envisioning',
    duration: ENGAGEMENT_DEFAULTS['business-envisioning'].defaultDuration,
    deliverables: [...ENGAGEMENT_DEFAULTS['business-envisioning'].defaultDeliverables],
    dependencies: [],
    isComplete: false
  })

  // Solution Envisioning for medium+ complexity
  if (complexity !== 'low') {
    milestones.push({
      id: `${useCaseId}-m${order}`,
      order: order++,
      title: ENGAGEMENT_DEFAULTS['solution-envisioning'].title,
      description: ENGAGEMENT_DEFAULTS['solution-envisioning'].description,
      engagement: 'solution-envisioning',
      duration: ENGAGEMENT_DEFAULTS['solution-envisioning'].defaultDuration,
      deliverables: [...ENGAGEMENT_DEFAULTS['solution-envisioning'].defaultDeliverables],
      dependencies: [`${useCaseId}-m1`],
      isComplete: false
    })
  }

  // Architecture Design for high+ complexity
  if (complexity === 'high' || complexity === 'very-high') {
    milestones.push({
      id: `${useCaseId}-m${order}`,
      order: order++,
      title: ENGAGEMENT_DEFAULTS['architecture-design'].title,
      description: ENGAGEMENT_DEFAULTS['architecture-design'].description,
      engagement: 'architecture-design',
      duration: ENGAGEMENT_DEFAULTS['architecture-design'].defaultDuration,
      deliverables: [...ENGAGEMENT_DEFAULTS['architecture-design'].defaultDeliverables],
      dependencies: [milestones[milestones.length - 1].id],
      isComplete: false
    })
  }

  // Rapid Prototype for all
  milestones.push({
    id: `${useCaseId}-m${order}`,
    order: order++,
    title: ENGAGEMENT_DEFAULTS['rapid-prototype'].title,
    description: ENGAGEMENT_DEFAULTS['rapid-prototype'].description,
    engagement: 'rapid-prototype',
    duration: complexity === 'very-high' ? '3-6 weeks' : ENGAGEMENT_DEFAULTS['rapid-prototype'].defaultDuration,
    deliverables: [...ENGAGEMENT_DEFAULTS['rapid-prototype'].defaultDeliverables],
    dependencies: [milestones[milestones.length - 1].id],
    isComplete: false
  })

  return milestones
}

// ============================================================================
// BUSINESS ENVISIONING TYPES (Innovation Hub Methodology Phase 1)
// ============================================================================

export type StrategicPrioritySource = 
  | 'earnings-call'
  | 'annual-report'
  | 'press-release'
  | 'stakeholder-interview'
  | 'discovery-session'
  | 'industry-research'

export interface StrategicPriority {
  id: string
  priority: string                      // e.g., "Digital Transformation", "Cost Optimization"
  source: StrategicPrioritySource
  sourceDetail?: string                 // e.g., "Q3 2024 Earnings Call"
  relevanceScore?: number               // 1-10
  linkedOutcomes?: string[]             // IDs of linked business outcomes
}

export interface BusinessOutcome {
  id: string
  category: 'revenue' | 'cost' | 'risk' | 'experience' | 'compliance' | 'efficiency'
  outcome: string                       // e.g., "Increase customer retention by 15%"
  metric: string                        // e.g., "Customer retention rate"
  currentValue?: string                 // e.g., "72%"
  targetValue?: string                  // e.g., "83%"
  timeframe?: string                    // e.g., "12 months"
  owner?: string
}

export interface ProcessPainPoint {
  id: string
  description: string
  impact: 'high' | 'medium' | 'low'
  isAIOpportunity: boolean              // Can AI address this pain point?
  aiInterventionType?: string           // e.g., "Automation", "Prediction", "Generation"
}

export interface ProcessStep {
  id: string
  order: number
  name: string
  description?: string
  owner?: string
  systems?: string[]                    // Systems involved in this step
  inputs?: string[]
  outputs?: string[]
  duration?: string                     // e.g., "2-3 hours"
  painPoints?: ProcessPainPoint[]
  aiOpportunity?: {
    description: string
    interventionType: 'automate' | 'augment' | 'analyze' | 'generate'
    potentialImpact: 'high' | 'medium' | 'low'
  }
}

export interface BusinessProcess {
  id: string
  name: string                          // e.g., "Invoice Processing"
  category: 'core' | 'support' | 'management'
  steps: ProcessStep[]
  owner?: string
  frequency?: string                    // e.g., "Daily", "Weekly"
  volumePerPeriod?: number              // e.g., 500 invoices/month
  currentCycleTime?: string             // e.g., "3-5 days"
  targetCycleTime?: string              // e.g., "< 1 day"
  totalPainPoints?: number
  totalAIOpportunities?: number
}

export type TechStackMaturity = 'legacy' | 'modernizing' | 'modern' | 'cloud-native'
export type DataMaturity = 'siloed' | 'integrated' | 'governed' | 'ai-ready'
export type CloudReadiness = 'on-premises' | 'hybrid' | 'cloud-first' | 'cloud-native'

export interface CurrentStateAssessment {
  // Technology landscape
  techStack: {
    maturity: TechStackMaturity
    keyPlatforms: string[]              // e.g., ["SAP", "Salesforce", "Custom ERP"]
    integrationChallenges?: string[]
  }
  
  // Data readiness
  data: {
    maturity: DataMaturity
    keyDataSources?: string[]
    dataQualityConcerns?: string[]
    governanceInPlace: boolean
  }
  
  // Cloud & infrastructure
  infrastructure: {
    cloudReadiness: CloudReadiness
    existingAzureServices?: string[]
    existingMicrosoftProducts?: string[]
  }
  
  // AI/ML maturity
  aiMaturity: {
    currentUsage: 'none' | 'experimental' | 'pilot' | 'production'
    existingAITools?: string[]
    aiGovernance: boolean
    aiSkillsGap?: 'significant' | 'moderate' | 'minimal'
  }
}

// Strategic alignment info attached to use cases
export interface StrategicAlignmentInfo {
  primaryPriority?: string              // Main strategic priority this addresses
  linkedPriorities?: string[]           // Additional linked priorities
  alignmentScore?: number               // 1-10 how well it aligns
  alignmentRationale?: string           // Why this use case supports strategy
}

// Business process info attached to use cases
export interface UseCaseBusinessProcess {
  processId: string
  processName: string
  affectedSteps?: string[]              // Step IDs or names
  currentPainPoints?: string[]
  proposedImprovement: string
  expectedCycleTimeReduction?: string
}

// ============================================================================
// SOLUTION ENVISIONING TYPES (Innovation Hub Methodology Phase 2)
// ============================================================================

export type MicrosoftProductFamily = 
  | 'azure-ai'
  | 'azure-data'
  | 'azure-infrastructure'
  | 'power-platform'
  | 'microsoft-365'
  | 'dynamics-365'
  | 'microsoft-fabric'
  | 'microsoft-security'

export type SolutionRole = 'primary' | 'supporting' | 'integration'

export interface UseCaseMicrosoftSolution {
  productFamily: MicrosoftProductFamily
  services: string[]                    // e.g., ["azure-openai", "azure-ai-search"]
  role: SolutionRole
  justification?: string                // Why this solution is recommended
}

export type AgentCapability = 
  | 'reasoning'
  | 'planning'
  | 'tool-use'
  | 'memory'
  | 'multi-step-execution'
  | 'human-in-loop'
  | 'autonomous-decision'

export interface UseCaseAgenticOpportunity {
  id: string
  title: string
  description: string
  agentType: 'task-agent' | 'orchestrator-agent' | 'specialist-agent' | 'assistant-agent'
  capabilities: AgentCapability[]
  humanOversight: 'none' | 'approval' | 'review' | 'supervision'
  automationLevel: 'assisted' | 'semi-autonomous' | 'autonomous'
  tools?: string[]                      // Tools the agent would use
}

export interface ImplementationComplexityInfo {
  level: 'low' | 'medium' | 'high' | 'very-high'
  factors: string[]                     // e.g., ["Multiple integrations", "Custom ML models"]
  estimatedDuration?: string            // e.g., "3-6 months"
  estimatedTeamSize?: string            // e.g., "5-8 people"
  keyRisks?: string[]
}

// ============================================================================
// EXTENDED DISCOVERY SESSION (with Business Envisioning)
// ============================================================================

export interface BusinessEnvisioningData {
  // Strategic context (the "Why")
  strategicPriorities: StrategicPriority[]
  businessOutcomes: BusinessOutcome[]
  
  // Process mapping (the "How")
  businessProcesses: BusinessProcess[]
  
  // Current state (Foundation)
  currentState?: CurrentStateAssessment
  
  // Completion tracking
  completedSections?: {
    strategicPriorities: boolean
    businessOutcomes: boolean
    businessProcesses: boolean
    currentState: boolean
  }
}

export type ScoringMethod = 'impact-feasibility' | 'rice' | 'financial-impact'

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
  | 'technology-software'

export type DiscoverySessionCreationSource =
  | 'discovery'
  | 'skip-to-use-cases'
  | 'notes-analysis'
  | 'ai-assessment'
  | 'demo'

export interface DiscoveryQuestion {
  id: string
  question: string
  category: 'business' | 'technical' | 'users' | 'challenges'
  placeholder?: string
  industries?: Industry[]
  isFollowUp?: boolean
  parentQuestionId?: string
  inputType?: 'text' | 'ranking'
  rankingItems?: string[]
}

export interface DiscoveryResponse {
  questionId: string
  answer: string
  followUpQuestions?: DiscoveryQuestion[]
  ranking?: Record<string, number>
  comment?: string
}

export interface DiscoverySession {
  id: string
  customerId: string
  customerName: string
  innovationHubSPOC?: string
  name: string
  industry?: Industry
  isDemo?: boolean  // Flag to identify demo sessions
  innovationHubLocation: string
  solutionEngineer: string
  accountTeamRep: string
  primaryStakeholder: string
  stockTicker?: string // For public companies - enables earnings/financial analysis
  entityType?: EntityType // Type of organization (public, private, government, non-profit)
  complianceEnforcement?: ComplianceEnforcement // Strict or advisory gate mode
  manualFinancials?: ManualFinancialContext     // Manual financial data for non-public entities
  executiveSummary?: string
  creationSource?: DiscoverySessionCreationSource
  responses: DiscoveryResponse[]
  suggestedUseCases?: SuggestedUseCaseData[]
  earningsInsights?: EarningsInsight[] // AI-extracted insights from earnings calls
  companyInsights?: CompanyInsight[] // AI-extracted insights from company research (news, docs, etc.)
  companyResearchSummary?: string // AI-generated summary of company research insights
  
  // ============================================================================
  // INNOVATION HUB METHODOLOGY: BUSINESS ENVISIONING DATA
  // ============================================================================
  businessEnvisioning?: BusinessEnvisioningData
  
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

export interface SourceTextHighlight {
  text: string
  startIndex: number
  endIndex: number
  confidence: number
}

export interface SuggestedUseCaseData {
  title: string
  description: string
  rationale: string
  sourceTexts?: SourceTextHighlight[]
  dataSources?: ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery' | 'ai-generated' | 'manual' | 'fallback')[]
  strategicAlignment?: StrategicAlignmentInfo
  businessProcesses?: UseCaseBusinessProcess[]
  microsoftSolutions?: UseCaseMicrosoftSolution[]
  solutionPlays?: string[]
  referenceArchitecture?: string
  agenticOpportunities?: UseCaseAgenticOpportunity[]
  implementationComplexity?: ImplementationComplexityInfo
  aiRegulations?: AIRegulationsInfo
  cybersecurity?: CybersecurityInfo
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
  // Current sub-step (5a, 5b, 5c, 5d)
  currentSubStep: 'overview' | 'revenue' | 'cost' | 'balance-sheet' | 'architecture' | 'summary'
  
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
  
  // 5E: Solution Architecture (Stage 5d sub-step)
  solutionArchitecture?: {
    useCaseMappings: Array<{
      useCaseId: string
      useCaseTitle: string
      useCaseDescription: string
      referenceArchitecture?: string // ReferenceArchitecturePattern
      microsoftSolutions: Array<{
        productFamily: string
        services: string[]
        role: 'primary' | 'supporting' | 'integration'
        justification?: string
      }>
      businessProcesses: BusinessProcess[]
      isManuallySelected: boolean
      aiGenerationFailed?: boolean
    }>
    completedAt?: number
  }
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

// ============================================================================
// MVP 5-STAGE ENTERPRISE DISCOVERY TYPES
// ============================================================================

export type TabCompletionStatus = 'complete' | 'pending' | 'skipped' | 'not-started'

// Merged Opportunity + Resources Stage Data (MVP Stage 1)
export interface OpportunityResourcesStageData {
  // From Stage 1: Opportunity
  opportunity: OpportunityStageData
  // From Stage 2: Resources
  resources: ResourcesStageData
  // Tab completion tracking
  tabCompletion: Record<string, TabCompletionStatus>
}

// Merged Commit + Communicate Stage Data (MVP Stage 4)
export interface CommitCommunicateStageData {
  // From Stage 7: Commit
  commit: CommitStageData
  // From Stage 8: Communicate
  communicate: CommunicateStageData
  // AI-generated executive summary
  executiveSummary: string
  // Tab completion tracking
  tabCompletion: Record<string, TabCompletionStatus>
}

// Progressive disclosure config per discovery type
export interface ProgressiveDisclosureConfig {
  showProblemStatement: boolean
  showFullCOI: boolean
  showBudgetDetails: boolean
  showCompetitiveAnalysis: boolean
  prefillFromExisting: boolean
  focusOnRelationship: boolean
  showMACCFields: boolean
}

export const PROGRESSIVE_DISCLOSURE: Record<DiscoveryType, ProgressiveDisclosureConfig> = {
  'new-opportunity': {
    showProblemStatement: true,
    showFullCOI: true,
    showBudgetDetails: true,
    showCompetitiveAnalysis: true,
    prefillFromExisting: false,
    focusOnRelationship: false,
    showMACCFields: false,
  },
  'expansion': {
    showProblemStatement: false,
    showFullCOI: true,
    showBudgetDetails: true,
    showCompetitiveAnalysis: false,
    prefillFromExisting: true,
    focusOnRelationship: false,
    showMACCFields: false,
  },
  'renewal': {
    showProblemStatement: false,
    showFullCOI: false,
    showBudgetDetails: false,
    showCompetitiveAnalysis: true,
    prefillFromExisting: true,
    focusOnRelationship: true,
    showMACCFields: false,
  },
  'macc': {
    showProblemStatement: true,
    showFullCOI: true,
    showBudgetDetails: true,
    showCompetitiveAnalysis: false,
    prefillFromExisting: false,
    focusOnRelationship: false,
    showMACCFields: true,
  },
}

// MVP 5-Stage Session (new format)
export interface EnterpriseDiscoverySessionMVP {
  id: string
  version: 'mvp-5-stage' // Identifies new format
  
  // Stage 0: START
  clientName: string
  industry?: string // For AI suggestions
  attendees: Array<{ name: string; role: string }>
  sessionDate: number
  discoveryType: DiscoveryType
  
  // Stage data (5 stages: 0-4)
  currentStageId: number // 0-4
  stages: {
    0: { status: StageStatus; completedAt?: number; data: null }
    1: { status: StageStatus; completedAt?: number; data: OpportunityResourcesStageData | null }
    2: { status: StageStatus; completedAt?: number; data: DecisionProcessStageData | null }
    3: { status: StageStatus; completedAt?: number; data: SolutionScopeStageData | null }
    4: { status: StageStatus; completedAt?: number; data: CommitCommunicateStageData | null }
  }
  
  // Global yellow lights (accessible from any stage)
  allYellowLights: YellowLight[]
  
  // Session state
  isLiveMode?: boolean
  isPaused?: boolean
  pausedAt?: number
  lastSavedAt?: number
  
  createdAt: number
  completedAt?: number
}

// Migration utility: Convert legacy 9-stage session to MVP 5-stage
export function migrateToMVPSession(legacy: EnterpriseDiscoverySession): EnterpriseDiscoverySessionMVP {
  // Map legacy stage IDs to MVP stage IDs
  const legacyToMVPStageMap: Record<number, number> = {
    0: 0, // START -> START
    1: 1, // OPPORTUNITY -> OPPORTUNITY+RESOURCES
    2: 1, // RESOURCES -> OPPORTUNITY+RESOURCES
    3: 2, // DECISION PROCESS -> DECISION PROCESS
    4: 2, // PRIORITISE -> (merged into DECISION PROCESS)
    5: 3, // SOLUTION SCOPE -> SOLUTION SCOPE
    6: 3, // VALIDATE -> (merged into SOLUTION SCOPE)
    7: 4, // COMMIT -> COMMIT+COMMUNICATE
    8: 4, // COMMUNICATE -> COMMIT+COMMUNICATE
  }
  
  const mvpCurrentStage = legacyToMVPStageMap[legacy.currentStageId] ?? 0
  
  // Merge opportunity + resources
  const opportunityResourcesData: OpportunityResourcesStageData | null = 
    (legacy.stages[1].data || legacy.stages[2].data) ? {
      opportunity: legacy.stages[1].data || {
        problemStatement: '',
        problemCategory: 'efficiency',
        affectedArea: 'process',
        desiredOutcome: '',
        successMetrics: [],
        timelineExpectation: '3-6-months',
        coi: { directCosts: { oneTime: 0, recurring: 0 }, opportunityCosts: { oneTime: 0, recurring: 0 }, riskCosts: { oneTime: 0, oneTimeProbability: 50, recurring: 0, recurringProbability: 50 }, totalAnnual: 0 },
        scq: { situation: '', complication: '', question: '', status: 'pending' },
      },
      resources: legacy.stages[2].data || {
        budgetStatus: 'unknown',
        budgetRange: 'unknown',
        roiExpectation: '',
        budgetOwner: '',
        executiveSponsor: '',
        projectLead: '',
        teamCapacity: 'unknown',
        changeReadiness: 'unknown',
        existingPlatforms: [],
        dataAvailability: 'unknown',
        integrationRequirements: [],
        technicalDebtConcerns: '',
        targetStart: null,
        targetCompletion: null,
        competingPriorities: [],
        hardDependencies: [],
        scq: { situation: '', complication: '', question: '', status: 'pending' },
      },
      tabCompletion: {},
    } : null
  
  // Merge commit + communicate
  const commitCommunicateData: CommitCommunicateStageData | null =
    (legacy.stages[7].data || legacy.stages[8].data) ? {
      commit: legacy.stages[7].data || {
        trustIndicators: { sharingRealNumbers: 'no', sharingRealConcerns: 'no', believeWeCanDeliver: 'no' },
        engagementIndicators: { accessToDecisionMakers: 'none', responsiveness: 'low', clientInvestingResources: 'no' },
        fitIndicators: { strategicFit: 'low', canDeliver: 'no', commercialViability: 'poor' },
        yellowLights: [],
        decision: 'pause',
      },
      communicate: legacy.stages[8].data || {
        plImpact: { year1: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 }, year2: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 }, year3: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 }, total: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 } },
        investmentAnalysis: { totalInvestmentYear1: 0, totalAnnualBenefit: 0, simplePaybackMonths: 0, roi3Year: 0, npv10Percent: 0, irr: 0 },
        sensitivityAnalysis: { conservative: { annualBenefit: 0, paybackMonths: 0, roi3Year: 0, npv: 0 }, base: { annualBenefit: 0, paybackMonths: 0, roi3Year: 0, npv: 0 }, optimistic: { annualBenefit: 0, paybackMonths: 0, roi3Year: 0, npv: 0 } },
        threeStatementModel: { incomeStatement: { revenue: { year1: 0, year2: 0, year3: 0 }, cogs: { year1: 0, year2: 0, year3: 0 }, grossProfit: { year1: 0, year2: 0, year3: 0 }, opex: { salesMarketing: { year1: 0, year2: 0, year3: 0 }, rAndD: { year1: 0, year2: 0, year3: 0 }, gAndA: { year1: 0, year2: 0, year3: 0 }, total: { year1: 0, year2: 0, year3: 0 } }, ebit: { year1: 0, year2: 0, year3: 0 } }, balanceSheet: { workingCapitalChange: 0, inventoryReduction: 0, receivablesReduction: 0, capexAvoided: 0 }, cashFlow: { operatingCashFlow: { year1: 0, year2: 0, year3: 0 }, investingCashFlow: { year1: 0, year2: 0, year3: 0 }, netCashFlow: { year1: 0, year2: 0, year3: 0 } } },
        metricHierarchy: { strategicOutcome: '', financialMetrics: [], operationalMetrics: [], activityMetrics: [] },
        valueDriversByPLLine: { revenue: [], cogs: [], opex: [], balanceSheet: [] },
      },
      executiveSummary: '',
      tabCompletion: {},
    } : null
  
  return {
    id: legacy.id,
    version: 'mvp-5-stage',
    clientName: legacy.clientName,
    industry: undefined,
    attendees: legacy.attendees,
    sessionDate: legacy.sessionDate,
    discoveryType: legacy.discoveryType,
    currentStageId: mvpCurrentStage,
    stages: {
      0: { status: legacy.stages[0].status, completedAt: legacy.stages[0].completedAt, data: null },
      1: { 
        status: legacy.stages[1].status === 'completed' && legacy.stages[2].status === 'completed' ? 'completed' : 
               legacy.stages[1].status === 'in-progress' || legacy.stages[2].status === 'in-progress' ? 'in-progress' : 'not-started',
        completedAt: legacy.stages[2].completedAt,
        data: opportunityResourcesData,
      },
      2: { status: legacy.stages[3].status, completedAt: legacy.stages[3].completedAt, data: legacy.stages[3].data },
      3: { status: legacy.stages[5].status, completedAt: legacy.stages[5].completedAt, data: legacy.stages[5].data },
      4: { 
        status: legacy.stages[7].status === 'completed' && legacy.stages[8].status === 'completed' ? 'completed' :
               legacy.stages[7].status === 'in-progress' || legacy.stages[8].status === 'in-progress' ? 'in-progress' : 'not-started',
        completedAt: legacy.stages[8].completedAt,
        data: commitCommunicateData,
      },
    },
    allYellowLights: legacy.allYellowLights,
    isLiveMode: legacy.isLiveMode,
    isPaused: legacy.isPaused,
    pausedAt: legacy.pausedAt,
    lastSavedAt: legacy.lastSavedAt,
    createdAt: legacy.createdAt,
    completedAt: legacy.completedAt,
  }
}

// Type guard to check if session is MVP format
export function isMVPSession(session: EnterpriseDiscoverySession | EnterpriseDiscoverySessionMVP): session is EnterpriseDiscoverySessionMVP {
  return 'version' in session && session.version === 'mvp-5-stage'
}

// ============================================================================
// LEGACY 9-STAGE ENTERPRISE DISCOVERY SESSION (DEPRECATED)
// ============================================================================

/**
 * @deprecated Use EnterpriseDiscoverySessionMVP instead. 
 * This interface is kept for backward compatibility and migration.
 */
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
  isDemo?: boolean // Flag to identify demo sessions
  
  createdAt: number
  completedAt?: number
}
