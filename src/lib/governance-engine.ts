/**
 * AI Governance Engine — deterministic scoring & assessment
 *
 * Follows the same pattern as regulatory-engine.ts:
 * - Pure keyword-based matching (no AI calls — eliminates hallucination)
 * - Returns typed assessment objects consumed by the UI
 * - Separated from AI-generated recommendations (which live in openai-service.ts)
 *
 * Dimensions aligned with Microsoft Responsible AI Standard + NIST AI RMF Govern function.
 */

import type {
  AIGovernanceDimension,
  AIGovernanceMaturityLevel,
  AIGovernanceAssessment,
  GovernanceGap,
  GovernanceRecommendation,
  ResponsibleAIPrinciple,
  ResponsibleAIImpact,
  RAIPrincipleAssessment,
  AIRiskLevel,
} from './types'
import {
  AI_GOVERNANCE_MATURITY_CONFIG,
} from './types'

// ============================================================================
// DIMENSION ASSESSMENT CRITERIA
// ============================================================================

interface DimensionCriteria {
  dimension: AIGovernanceDimension
  /** Target maturity that qualifies as "ready for AI deployment" */
  targetLevel: AIGovernanceMaturityLevel
  /** Gap descriptions keyed by current maturity level */
  gapDescriptions: Record<AIGovernanceMaturityLevel, string>
  /** Deterministic recommendations keyed by maturity level */
  recommendations: Record<AIGovernanceMaturityLevel, string[]>
  /** Related reference frameworks */
  referenceFrameworks: string[]
}

const DIMENSION_CRITERIA: Record<AIGovernanceDimension, DimensionCriteria> = {
  'ai-strategy': {
    dimension: 'ai-strategy',
    targetLevel: 'defined',
    gapDescriptions: {
      'ad-hoc': 'No formal AI strategy exists — AI initiatives are fragmented and lack executive sponsorship',
      'developing': 'Emerging AI vision but no documented roadmap or investment priorities',
      'defined': 'Documented AI strategy with roadmap, but not yet fully operationalized',
      'managed': 'AI strategy is actively measured and adjusted based on outcomes',
      'optimized': 'AI strategy is industry-leading with continuous innovation cycles',
    },
    recommendations: {
      'ad-hoc': [
        'Establish executive AI sponsorship at C-suite level',
        'Conduct an organization-wide AI readiness assessment',
        'Define an initial AI vision statement aligned to business strategy',
        'Identify 2-3 high-value AI pilot opportunities',
      ],
      'developing': [
        'Document a formal AI roadmap with milestones and investment allocation',
        'Establish an AI Center of Excellence (CoE) or governance committee',
        'Define AI success metrics tied to business KPIs',
      ],
      'defined': [
        'Operationalize the AI roadmap with quarterly reviews',
        'Establish cross-functional AI portfolio management',
        'Implement AI investment ROI tracking',
      ],
      'managed': [
        'Benchmark AI maturity against industry leaders',
        'Establish AI innovation lab for emerging capabilities (agentic AI, multi-modal)',
      ],
      'optimized': [
        'Share best practices through industry leadership and publications',
        'Explore frontier AI capabilities and strategic partnerships',
      ],
    },
    referenceFrameworks: ['NIST AI RMF — GOVERN function', 'ISO 42001 — AI Management System'],
  },
  'data-governance': {
    dimension: 'data-governance',
    targetLevel: 'defined',
    gapDescriptions: {
      'ad-hoc': 'Data is siloed with no governance framework — data quality and lineage are unknown',
      'developing': 'Basic data cataloging exists but access controls and quality checks are inconsistent',
      'defined': 'Formal data governance framework with cataloging, quality standards, and access controls',
      'managed': 'Data governance is measured, with automated quality monitoring and compliance reporting',
      'optimized': 'Self-service data platform with automated governance, lineage tracking, and AI-ready datasets',
    },
    recommendations: {
      'ad-hoc': [
        'Implement a data catalog to inventory critical data assets',
        'Define data ownership and stewardship roles',
        'Establish data classification standards (public, internal, confidential, PII)',
        'Conduct a data quality baseline assessment',
      ],
      'developing': [
        'Implement automated data quality monitoring and alerting',
        'Establish data access review processes and RBAC policies',
        'Create data lineage documentation for AI training datasets',
      ],
      'defined': [
        'Automate data governance policies using tools like Microsoft Purview',
        'Implement data mesh or data product thinking for AI-ready data',
        'Establish AI-specific data handling guidelines (training data, evaluation data)',
      ],
      'managed': [
        'Implement automated data drift detection for AI training pipelines',
        'Establish synthetic data generation capabilities for privacy-preserving AI development',
      ],
      'optimized': [
        'Implement federated data governance across organizational boundaries',
        'Contribute to open data standards and industry data sharing initiatives',
      ],
    },
    referenceFrameworks: ['GDPR', 'POPIA', 'Microsoft Purview Governance', 'NIST AI RMF — MAP function'],
  },
  'model-lifecycle': {
    dimension: 'model-lifecycle',
    targetLevel: 'defined',
    gapDescriptions: {
      'ad-hoc': 'No model lifecycle management — models are developed ad-hoc with no versioning or documentation',
      'developing': 'Some model tracking exists but documentation, testing, and deployment processes are informal',
      'defined': 'Formal MLOps pipeline with model versioning, testing, documentation (model cards), and deployment gates',
      'managed': 'Comprehensive MLOps with automated testing, monitoring, and model performance tracking',
      'optimized': 'Fully automated model lifecycle with continuous training, A/B testing, and automated retirement',
    },
    recommendations: {
      'ad-hoc': [
        'Implement model versioning using tools like Azure ML Model Registry',
        'Create model card templates documenting purpose, training data, limitations, and intended use',
        'Establish basic model testing requirements (accuracy, latency, edge cases)',
        'Define model approval workflow before production deployment',
      ],
      'developing': [
        'Implement automated model testing pipelines (unit tests, integration tests, bias tests)',
        'Establish model documentation standards aligned with EU AI Act Art. 11',
        'Create model performance baselines and degradation thresholds',
      ],
      'defined': [
        'Implement automated model monitoring and drift detection in production',
        'Establish model retirement and replacement policies',
        'Implement A/B testing framework for model updates',
      ],
      'managed': [
        'Implement continuous training pipelines with automated retraining triggers',
        'Establish cross-model dependency tracking and impact analysis',
      ],
      'optimized': [
        'Implement automated model fairness and explainability reporting',
        'Contribute to open-source MLOps tooling and standards',
      ],
    },
    referenceFrameworks: ['ISO 42001 — AI System Lifecycle', 'EU AI Act Art. 11 — Technical Documentation', 'NIST AI RMF — MANAGE function'],
  },
  'ethics-fairness': {
    dimension: 'ethics-fairness',
    targetLevel: 'defined',
    gapDescriptions: {
      'ad-hoc': 'No ethics or fairness processes — potential for unchecked bias in AI systems',
      'developing': 'Awareness of AI ethics exists but no formal bias testing, impact assessments, or ethics review',
      'defined': 'Formal Responsible AI Impact Assessment process with bias testing and ethics board review',
      'managed': 'Systematic fairness measurement with automated bias detection and remediation workflows',
      'optimized': 'Industry-leading responsible AI practice with proactive fairness engineering and community engagement',
    },
    recommendations: {
      'ad-hoc': [
        'Establish an AI Ethics Board or Responsible AI committee',
        'Adopt Microsoft Responsible AI Standard as baseline framework',
        'Conduct initial Responsible AI Impact Assessments for existing AI systems',
        'Train development teams on AI ethics and bias awareness',
      ],
      'developing': [
        'Implement bias testing in model evaluation pipelines (demographic parity, equalized odds)',
        'Create Responsible AI Impact Assessment templates for new AI projects',
        'Establish fairness metrics and monitoring for production AI systems',
      ],
      'defined': [
        'Automate fairness testing in CI/CD pipelines',
        'Implement counterfactual fairness analysis for high-stakes decisions',
        'Establish community feedback mechanisms for AI system impacts',
      ],
      'managed': [
        'Publish transparency reports on AI system fairness metrics',
        'Implement intersectional fairness analysis across protected attributes',
      ],
      'optimized': [
        'Lead industry working groups on AI fairness standards',
        'Pioneer novel fairness methods and share openly',
      ],
    },
    referenceFrameworks: ['Microsoft Responsible AI Standard', 'UNESCO AI Ethics Recommendation', 'OECD AI Principles'],
  },
  'security-privacy': {
    dimension: 'security-privacy',
    targetLevel: 'defined',
    gapDescriptions: {
      'ad-hoc': 'AI systems lack dedicated security assessment — standard IT security does not address AI-specific threats',
      'developing': 'Basic security applied to AI systems but no AI-specific threat modeling or adversarial testing',
      'defined': 'AI-specific security framework with threat modeling, red-teaming, and privacy-preserving techniques',
      'managed': 'Comprehensive AI security with automated adversarial testing and privacy compliance monitoring',
      'optimized': 'Zero-trust AI infrastructure with continuous adversarial monitoring and differential privacy at scale',
    },
    recommendations: {
      'ad-hoc': [
        'Conduct AI-specific threat modeling (prompt injection, data poisoning, model extraction)',
        'Implement input validation and output filtering for AI systems',
        'Assess PII handling in AI training data and implement data minimization',
        'Establish AI-specific incident response procedures',
      ],
      'developing': [
        'Implement adversarial testing (red-teaming) for AI applications',
        'Deploy content safety filters (Azure AI Content Safety or equivalent)',
        'Implement differential privacy or federated learning for sensitive data',
      ],
      'defined': [
        'Automate adversarial testing in deployment pipelines',
        'Implement AI-aware data loss prevention (DLP) policies',
        'Establish AI supply chain security (model provenance, dependency scanning)',
      ],
      'managed': [
        'Deploy continuous AI security monitoring with automated threat detection',
        'Implement homomorphic encryption or secure enclaves for sensitive AI workloads',
      ],
      'optimized': [
        'Pioneer AI security standards and participate in responsible disclosure programs',
        'Implement automated AI red-teaming at scale',
      ],
    },
    referenceFrameworks: ['NIST AI RMF — MANAGE: Security', 'ISO 27001 + AI controls', 'EU AI Act Art. 15 — Robustness'],
  },
  'monitoring-accountability': {
    dimension: 'monitoring-accountability',
    targetLevel: 'defined',
    gapDescriptions: {
      'ad-hoc': 'No production monitoring for AI systems — no audit trails, no incident tracking, no human oversight',
      'developing': 'Basic logging exists but no systematic monitoring of model performance, drift, or decision quality',
      'defined': 'Formal monitoring framework with dashboards, alerting, audit trails, and human-in-the-loop escalation',
      'managed': 'Comprehensive observability with automated drift detection, incident correlation, and accountability reporting',
      'optimized': 'Full AI observability platform with predictive monitoring and automated governance compliance',
    },
    recommendations: {
      'ad-hoc': [
        'Implement logging and audit trails for all AI system decisions',
        'Define human-in-the-loop escalation paths for high-stakes AI outputs',
        'Establish AI incident classification and response procedures',
        'Create an AI system registry documenting all deployed AI applications',
      ],
      'developing': [
        'Implement model performance monitoring dashboards (accuracy, latency, throughput)',
        'Establish data drift detection and alerting for production models',
        'Create accountability RACI matrix for AI system governance',
      ],
      'defined': [
        'Automate compliance reporting for AI governance frameworks',
        'Implement AI decision explanation and contestability mechanisms',
        'Establish regular AI system audits (internal and external)',
      ],
      'managed': [
        'Deploy predictive monitoring to anticipate model degradation before impact',
        'Implement automated governance compliance checking in CI/CD',
      ],
      'optimized': [
        'Implement AI observability platform with cross-system correlation',
        'Contribute to industry monitoring standards and frameworks',
      ],
    },
    referenceFrameworks: ['EU AI Act Art. 9 — Risk Management', 'EU AI Act Art. 14 — Human Oversight', 'NIST AI RMF — MEASURE function'],
  },
}

// ============================================================================
// RESPONSIBLE AI IMPACT ASSESSMENT (RAIA) KEYWORDS
// ============================================================================

/** Keywords that indicate decisions about people (triggering deeper RAIA) */
const PEOPLE_DECISION_KEYWORDS = [
  'hiring', 'recruitment', 'employee', 'staff', 'hr ', 'human resources',
  'credit', 'loan', 'mortgage', 'insurance', 'underwriting', 'scoring',
  'sentencing', 'parole', 'bail', 'criminal', 'justice', 'law enforcement',
  'medical', 'diagnosis', 'treatment', 'patient', 'health',
  'admission', 'student', 'grading', 'education',
  'benefits', 'welfare', 'social services', 'housing',
  'immigration', 'visa', 'border',
  'performance review', 'promotion', 'compensation',
  'facial recognition', 'biometric', 'surveillance',
]

/** Keywords that suggest protected class implications */
const PROTECTED_CLASS_INDICATORS: Record<string, string[]> = {
  'race/ethnicity': ['demographic', 'racial', 'ethnicity', 'minority', 'diversity'],
  'gender': ['gender', 'sex', 'male', 'female', 'transgender', 'nonbinary'],
  'age': ['age', 'elderly', 'senior', 'youth', 'minor'],
  'disability': ['disability', 'accessible', 'impairment', 'assistive'],
  'religion': ['religion', 'faith', 'belief'],
  'socioeconomic': ['income', 'poverty', 'socioeconomic', 'wealth'],
  'geographic': ['rural', 'urban', 'regional', 'underserved'],
  'language': ['language', 'multilingual', 'non-english', 'translation'],
}

/** Per-principle risk keywords */
const PRINCIPLE_RISK_KEYWORDS: Record<ResponsibleAIPrinciple, {
  highRisk: string[]
  limitedRisk: string[]
}> = {
  'fairness': {
    highRisk: ['hiring', 'credit scoring', 'sentencing', 'insurance pricing', 'loan approval', 'admission', 'promotion', 'performance', 'recruitment'],
    limitedRisk: ['recommendation', 'ranking', 'matching', 'filtering', 'personalization', 'targeting'],
  },
  'reliability-safety': {
    highRisk: ['autonomous', 'safety-critical', 'medical device', 'self-driving', 'industrial control', 'infrastructure', 'life-threatening', 'surgical'],
    limitedRisk: ['real-time', 'latency-sensitive', 'high-availability', 'mission-critical', 'production line'],
  },
  'privacy-security': {
    highRisk: ['pii', 'biometric', 'health record', 'financial data', 'children', 'surveillance', 'behavioral tracking', 'location tracking'],
    limitedRisk: ['user data', 'analytics', 'telemetry', 'cookies', 'profiling', 'segmentation'],
  },
  'inclusiveness': {
    highRisk: ['disability', 'accessibility', 'language barrier', 'elderly', 'low literacy', 'rural', 'underserved'],
    limitedRisk: ['multilingual', 'diverse', 'cross-cultural', 'global deployment'],
  },
  'transparency': {
    highRisk: ['automated decision', 'black box', 'no explanation', 'opaque', 'unilateral decision'],
    limitedRisk: ['ai-generated', 'recommendation', 'suggestion', 'prediction', 'classification'],
  },
  'accountability': {
    highRisk: ['no human review', 'fully autonomous', 'irreversible', 'binding decision', 'legal consequence'],
    limitedRisk: ['advisory', 'suggestion', 'support tool', 'augmentation', 'copilot'],
  },
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Assess overall AI governance maturity from dimension scores
 */
export function assessGovernanceMaturity(
  dimensionScores: Record<AIGovernanceDimension, AIGovernanceMaturityLevel>
): AIGovernanceAssessment {
  const dimensions = Object.keys(DIMENSION_CRITERIA) as AIGovernanceDimension[]

  // Calculate overall numeric maturity
  const total = dimensions.reduce((sum, dim) => {
    return sum + AI_GOVERNANCE_MATURITY_CONFIG[dimensionScores[dim]].numericValue
  }, 0)
  const overallMaturity = Math.round((total / dimensions.length) * 10) / 10

  // Determine label from average
  const overallMaturityLabel = getMaturityLabelFromNumeric(overallMaturity)

  // Identify gaps (any dimension below target)
  const gaps: GovernanceGap[] = []
  for (const dim of dimensions) {
    const criteria = DIMENSION_CRITERIA[dim]
    const currentNumeric = AI_GOVERNANCE_MATURITY_CONFIG[dimensionScores[dim]].numericValue
    const targetNumeric = AI_GOVERNANCE_MATURITY_CONFIG[criteria.targetLevel].numericValue
    if (currentNumeric < targetNumeric) {
      const gapSize = targetNumeric - currentNumeric
      gaps.push({
        dimension: dim,
        currentLevel: dimensionScores[dim],
        targetLevel: criteria.targetLevel,
        gap: criteria.gapDescriptions[dimensionScores[dim]],
        impact: gapSize >= 2 ? 'high' : gapSize >= 1 ? 'medium' : 'low',
      })
    }
  }

  // Sort gaps by impact (high first)
  gaps.sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return order[a.impact] - order[b.impact]
  })

  // Generate deterministic recommendations
  const recommendations: GovernanceRecommendation[] = []
  let recId = 0
  for (const dim of dimensions) {
    const criteria = DIMENSION_CRITERIA[dim]
    const level = dimensionScores[dim]
    const recs = criteria.recommendations[level]
    for (const action of recs) {
      recId++
      const currentNumeric = AI_GOVERNANCE_MATURITY_CONFIG[level].numericValue
      const targetNumeric = AI_GOVERNANCE_MATURITY_CONFIG[criteria.targetLevel].numericValue
      const gapSize = targetNumeric - currentNumeric
      recommendations.push({
        id: `gov-rec-${recId}`,
        dimension: dim,
        priority: gapSize >= 2 ? 'critical' : gapSize >= 1 ? 'recommended' : 'optional',
        action,
        rationale: criteria.gapDescriptions[level],
        timeframe: gapSize >= 2 ? 'short-term' : gapSize >= 1 ? 'medium-term' : 'long-term',
        referenceFramework: criteria.referenceFrameworks[0],
      })
    }
  }

  return {
    dimensionScores,
    overallMaturity,
    overallMaturityLabel,
    gaps,
    recommendations,
    assessedAt: Date.now(),
  }
}

/**
 * Assess Responsible AI Impact for a single use case (deterministic)
 */
export function assessResponsibleAIImpact(
  useCase: { title: string; description: string },
  _governanceMaturity?: number
): ResponsibleAIImpact {
  const text = `${useCase.title} ${useCase.description}`.toLowerCase()

  // Check if the use case involves decisions about people
  const involvesDecisionsAboutPeople = PEOPLE_DECISION_KEYWORDS.some(kw =>
    text.includes(kw)
  )

  // Detect potential protected classes affected
  const protectedClassesAffected: string[] = []
  for (const [classLabel, keywords] of Object.entries(PROTECTED_CLASS_INDICATORS)) {
    if (keywords.some(kw => text.includes(kw))) {
      protectedClassesAffected.push(classLabel)
    }
  }

  // Assess each principle
  const principleAssessments: RAIPrincipleAssessment[] = []
  const principles = Object.keys(PRINCIPLE_RISK_KEYWORDS) as ResponsibleAIPrinciple[]

  for (const principle of principles) {
    const { highRisk, limitedRisk } = PRINCIPLE_RISK_KEYWORDS[principle]
    const isHigh = highRisk.some(kw => text.includes(kw))
    const isLimited = limitedRisk.some(kw => text.includes(kw))

    let risk: AIRiskLevel = 'minimal'
    let reason = 'No significant risk indicators detected for this principle'

    if (isHigh) {
      risk = 'high'
      const matchedKeywords = highRisk.filter(kw => text.includes(kw))
      reason = `High-risk indicators detected: ${matchedKeywords.slice(0, 3).join(', ')}`
    } else if (isLimited) {
      risk = 'limited'
      const matchedKeywords = limitedRisk.filter(kw => text.includes(kw))
      reason = `Limited transparency/governance obligations: ${matchedKeywords.slice(0, 3).join(', ')}`
    }

    // Modulate if people decisions are involved
    if (involvesDecisionsAboutPeople && risk === 'minimal' && ['fairness', 'accountability'].includes(principle)) {
      risk = 'limited'
      reason = 'Involves decisions affecting people — baseline governance obligations apply'
    }

    const mitigations: string[] = []
    if (risk === 'high' || risk === 'limited') {
      mitigations.push(...getMitigationsForPrinciple(principle, risk))
    }

    principleAssessments.push({ principle, risk, reason, mitigations })
  }

  // Overall risk = highest across principles
  const riskOrder: AIRiskLevel[] = ['unacceptable', 'high', 'limited', 'minimal']
  const overallRisk = riskOrder.find(level =>
    principleAssessments.some(pa => pa.risk === level)
  ) || 'minimal'

  // Determine requirements
  const hasHighRisk = principleAssessments.some(pa => pa.risk === 'high')
  const humanOversightRequired = hasHighRisk || involvesDecisionsAboutPeople
  const modelDocumentationRequired = hasHighRisk

  // Fairness metrics
  const fairnessMetricsRecommended: string[] = []
  if (involvesDecisionsAboutPeople || principleAssessments.find(pa => pa.principle === 'fairness')?.risk === 'high') {
    fairnessMetricsRecommended.push(
      'Demographic Parity',
      'Equalized Odds',
      'Predictive Parity',
    )
    if (protectedClassesAffected.length > 0) {
      fairnessMetricsRecommended.push('Intersectional Fairness Analysis')
    }
  }

  return {
    overallRisk,
    principleAssessments,
    involvesDecisionsAboutPeople,
    protectedClassesAffected: protectedClassesAffected.length > 0 ? protectedClassesAffected : undefined,
    fairnessMetricsRecommended: fairnessMetricsRecommended.length > 0 ? fairnessMetricsRecommended : undefined,
    humanOversightRequired,
    modelDocumentationRequired,
    assessedAt: Date.now(),
  }
}

/**
 * Batch-assess RAIA for all use cases
 */
export function assessPortfolioRAIA(
  useCases: Array<{ id: string; title: string; description: string }>,
  governanceMaturity?: number
): Map<string, ResponsibleAIImpact> {
  const results = new Map<string, ResponsibleAIImpact>()
  for (const uc of useCases) {
    results.set(uc.id, assessResponsibleAIImpact(uc, governanceMaturity))
  }
  return results
}

/**
 * Get the dimension criteria (exposed for reference in UI)
 */
export function getDimensionCriteria(dimension: AIGovernanceDimension): DimensionCriteria {
  return DIMENSION_CRITERIA[dimension]
}

/**
 * Get all dimension criteria
 */
export function getAllDimensionCriteria(): DimensionCriteria[] {
  return Object.values(DIMENSION_CRITERIA)
}

// ============================================================================
// HELPERS
// ============================================================================

function getMaturityLabelFromNumeric(value: number): AIGovernanceMaturityLevel {
  if (value >= 4.5) return 'optimized'
  if (value >= 3.5) return 'managed'
  if (value >= 2.5) return 'defined'
  if (value >= 1.5) return 'developing'
  return 'ad-hoc'
}

function getMitigationsForPrinciple(principle: ResponsibleAIPrinciple, risk: AIRiskLevel): string[] {
  const mitigations: Record<ResponsibleAIPrinciple, Record<string, string[]>> = {
    'fairness': {
      'high': ['Conduct bias audit on training data', 'Implement fairness metrics (demographic parity, equalized odds)', 'Establish human review for high-stakes decisions', 'Document potential bias sources and mitigation steps'],
      'limited': ['Include diverse test data in evaluation', 'Monitor output distributions across demographic groups'],
    },
    'reliability-safety': {
      'high': ['Implement comprehensive failure mode analysis', 'Establish safety testing protocols and thresholds', 'Define fallback mechanisms and circuit breakers', 'Conduct adversarial stress testing'],
      'limited': ['Implement monitoring and alerting for anomalous behavior', 'Establish SLA targets and degradation procedures'],
    },
    'privacy-security': {
      'high': ['Conduct Data Protection Impact Assessment (DPIA)', 'Implement data minimization and purpose limitation', 'Apply differential privacy or anonymization techniques', 'Establish data breach response procedures'],
      'limited': ['Review data handling against privacy regulations', 'Document data flows and retention policies'],
    },
    'inclusiveness': {
      'high': ['Conduct accessibility audit (WCAG compliance)', 'Test with diverse user groups including underserved populations', 'Provide alternative access channels', 'Implement multi-language support'],
      'limited': ['Consider accessibility in design', 'Test with representative user samples'],
    },
    'transparency': {
      'high': ['Implement model explainability (SHAP, LIME)', 'Provide clear AI disclosure to affected individuals', 'Document model limitations and intended use', 'Create user-facing explanation interfaces'],
      'limited': ['Label AI-generated content clearly', 'Provide high-level explanation of AI processing'],
    },
    'accountability': {
      'high': ['Establish human-in-the-loop review for high-impact decisions', 'Create appeal/contestation mechanism', 'Maintain comprehensive audit logs', 'Define clear ownership and responsibility (RACI)'],
      'limited': ['Document decision-making roles and escalation paths', 'Implement audit logging for AI outputs'],
    },
  }
  return mitigations[principle]?.[risk] ?? []
}
