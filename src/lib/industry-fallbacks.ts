import type { AIRegulationFramework, DataClassification, Industry, SecurityRequirement } from './types'
import { INDUSTRY_REGULATIONS, JURISDICTION_FRAMEWORK_MAP } from './regulatory-engine'

export interface FallbackUseCase {
  title: string
  description: string
  rationale: string
  aiRegulations: {
    applicableFrameworks: AIRegulationFramework[]
    riskClassification: 'minimal' | 'limited' | 'high' | 'unacceptable'
    jurisdictions: string[]
  }
  cybersecurity: {
    securityRequirements: SecurityRequirement[]
    dataClassification: DataClassification
  }
}

const INDUSTRY_SECURITY_REQUIREMENTS: Record<Industry, SecurityRequirement[]> = {
  general: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging'],
  healthcare: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'data-masking', 'mfa-required'],
  'financial-services': ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'soc2-compliance', 'penetration-testing'],
  manufacturing: ['encryption-at-rest', 'access-control', 'audit-logging', 'scada-protection'],
  retail: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required'],
  government: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'zero-trust'],
  education: ['encryption-at-rest', 'access-control', 'audit-logging', 'data-masking'],
  energy: ['encryption-at-rest', 'access-control', 'audit-logging', 'scada-protection', 'air-gapped', 'iso27001'],
  'mining-resources': ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'scada-protection', 'air-gapped', 'iso27001', 'mfa-required'],
  telecommunications: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'soc2-compliance'],
  'technology-software': ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'vulnerability-scanning', 'penetration-testing', 'soc2-compliance', 'zero-trust'],
}

const INDUSTRY_OPPORTUNITIES: Record<Industry, Array<[string, string]>> = {
  general: [['Intelligent Document Processing', 'Automate document classification, extraction, and routing to reduce manual handling.'], ['Employee Knowledge Assistant', 'Help employees find trusted information and complete routine knowledge work faster.']],
  healthcare: [['Clinical Documentation Assistant', 'Reduce clinical administration while preserving review, privacy, and audit controls.'], ['Patient Flow Optimization', 'Predict demand and improve scheduling, bed allocation, and care coordination.']],
  'financial-services': [['Fraud Detection and Investigation', 'Prioritize suspicious activity using explainable risk signals and investigator review.'], ['Customer Onboarding Automation', 'Accelerate document verification and case routing while maintaining compliance controls.']],
  manufacturing: [['Predictive Maintenance', 'Predict equipment failure and schedule maintenance before unplanned downtime.'], ['Visual Quality Inspection', 'Detect production defects using computer vision with human quality review.']],
  retail: [['Demand and Inventory Forecasting', 'Improve replenishment decisions using demand, promotion, and supply signals.'], ['Customer Service Assistant', 'Resolve common customer requests with grounded answers and clear escalation.']],
  government: [['Citizen Service Assistant', 'Improve access to public-service information with traceable sources and assisted handoff.'], ['Case and Document Triage', 'Classify incoming cases and route them to the appropriate public-service team.']],
  education: [['Student Support Assistant', 'Give students grounded answers and route complex support needs to staff.'], ['Retention Risk Insights', 'Identify engagement patterns so advisors can offer timely, human-led support.']],
  energy: [['Asset Failure Prediction', 'Predict failures across critical assets and prioritize maintenance interventions.'], ['Energy Demand Forecasting', 'Improve generation and load planning with explainable demand forecasts.']],
  'mining-resources': [['Predictive Mine Maintenance', 'Predict mobile and fixed-plant failures to reduce unplanned production loss.'], ['Safety Event Intelligence', 'Identify leading safety indicators from operational observations and incident data.']],
  telecommunications: [['Network Incident Prediction', 'Detect degradation early and prioritize network operations response.'], ['Service Support Assistant', 'Ground support answers in product and network knowledge with clear escalation.']],
  'technology-software': [['Engineering Knowledge Assistant', 'Help delivery teams find architecture, product, and operational guidance.'], ['Customer Churn Prediction', 'Identify adoption and engagement signals for proactive customer success action.']],
}

export function getRegulationsForIndustry(industry: Industry): AIRegulationFramework[] {
  return INDUSTRY_REGULATIONS[industry] || INDUSTRY_REGULATIONS.general
}

export function getRegulationsForJurisdiction(jurisdiction: string): AIRegulationFramework[] {
  return JURISDICTION_FRAMEWORK_MAP[jurisdiction]?.frameworks || []
}

export function getSecurityRequirementsForIndustry(industry: Industry): SecurityRequirement[] {
  return INDUSTRY_SECURITY_REQUIREMENTS[industry] || INDUSTRY_SECURITY_REQUIREMENTS.general
}

export function getFallbackUseCasesForIndustry(industry: Industry): FallbackUseCase[] {
  const regulations = getRegulationsForIndustry(industry)
  const securityRequirements = getSecurityRequirementsForIndustry(industry)
  return (INDUSTRY_OPPORTUNITIES[industry] || INDUSTRY_OPPORTUNITIES.general).map(([title, description]) => ({
    title,
    description,
    rationale: 'A practical starting point derived from common industry priorities. Validate value, feasibility, and ownership with customer stakeholders.',
    aiRegulations: {
      applicableFrameworks: regulations,
      riskClassification: industry === 'healthcare' || industry === 'financial-services' ? 'high' : 'limited',
      jurisdictions: [],
    },
    cybersecurity: {
      securityRequirements,
      dataClassification: industry === 'healthcare' ? 'phi' : industry === 'financial-services' ? 'financial' : 'internal',
    },
  }))
}
