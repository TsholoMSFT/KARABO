/**
 * Demo Data for Zava Mining
 * Pre-populated session data for demonstration purposes
 */

import { 
  DiscoverySession, 
  DiscoveryResponse, 
  UseCase, 
  Industry,
  AIRegulationFramework,
  SecurityRequirement,
  EnterpriseDiscoverySession,
  OpportunityStageData,
  ResourcesStageData
} from './types'
import { SessionMetadata } from '@/components/SessionMetadataForm'

// ============================================================================
// INDUSTRY-REGULATION MAPPING
// ============================================================================

export const INDUSTRY_REGULATIONS: Record<Industry, AIRegulationFramework[]> = {
  general: ['gdpr', 'iso-42001', 'oecd-ai-principles'],
  healthcare: ['hipaa', 'gdpr', 'eu-ai-act', 'iso-42001'],
  'financial-services': ['sox', 'glba', 'pci-dss', 'gdpr', 'eu-ai-act'],
  manufacturing: ['osha', 'epa', 'iso-42001', 'gdpr'],
  retail: ['pci-dss', 'gdpr', 'ccpa', 'popia'],
  government: ['nist-ai-rmf', 'white-house-eo', 'gdpr', 'popia'],
  education: ['ferpa', 'gdpr', 'popia', 'iso-42001'],
  energy: ['nerc-cip', 'epa', 'osha', 'iso-42001'],
  telecommunications: ['gdpr', 'ccpa', 'popia', 'iso-42001'],
}

// Mining-specific regulations (for Zava Mining demo)
export const MINING_REGULATIONS: AIRegulationFramework[] = [
  'msha',       // Mine Safety and Health
  'dmre',       // SA Dept of Mineral Resources
  'osha',       // Occupational Safety
  'epa',        // Environmental Protection
  'popia',      // South Africa data protection
  'iso-42001',  // AI Management
]

export const JURISDICTION_REGULATIONS: Record<string, AIRegulationFramework[]> = {
  'South Africa': ['popia', 'dmre'],
  'European Union': ['gdpr', 'eu-ai-act'],
  'United States': ['ccpa', 'nist-ai-rmf', 'white-house-eo', 'msha', 'osha', 'epa'],
  'United Kingdom': ['gdpr'],
  'Australia': ['gdpr'],  // Similar framework
  'Canada': ['gdpr'],     // PIPEDA similar
}

export const INDUSTRY_SECURITY_REQUIREMENTS: Record<Industry, SecurityRequirement[]> = {
  general: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging'],
  healthcare: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'data-masking', 'mfa-required'],
  'financial-services': ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'soc2-compliance', 'penetration-testing'],
  manufacturing: ['encryption-at-rest', 'access-control', 'audit-logging', 'scada-protection'],
  retail: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required'],
  government: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'zero-trust'],
  education: ['encryption-at-rest', 'access-control', 'audit-logging', 'data-masking'],
  energy: ['encryption-at-rest', 'access-control', 'audit-logging', 'scada-protection', 'air-gapped', 'iso27001'],
  telecommunications: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'soc2-compliance'],
}

// Mining-specific security requirements
export const MINING_SECURITY_REQUIREMENTS: SecurityRequirement[] = [
  'encryption-at-rest',
  'encryption-in-transit',
  'access-control',
  'audit-logging',
  'scada-protection',
  'air-gapped',
  'iso27001',
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getRegulationsForIndustry(industry: Industry): AIRegulationFramework[] {
  return INDUSTRY_REGULATIONS[industry] || INDUSTRY_REGULATIONS.general
}

export function getRegulationsForJurisdiction(jurisdiction: string): AIRegulationFramework[] {
  return JURISDICTION_REGULATIONS[jurisdiction] || []
}

export function getSecurityRequirementsForIndustry(industry: Industry): SecurityRequirement[] {
  return INDUSTRY_SECURITY_REQUIREMENTS[industry] || INDUSTRY_SECURITY_REQUIREMENTS.general
}

export function getCombinedRegulations(industry: Industry, jurisdictions: string[]): AIRegulationFramework[] {
  const industryRegs = getRegulationsForIndustry(industry)
  const jurisdictionRegs = jurisdictions.flatMap(j => getRegulationsForJurisdiction(j))
  // Combine and dedupe
  return [...new Set([...industryRegs, ...jurisdictionRegs])]
}

// ============================================================================
// ZAVA MINING DEMO DATA
// ============================================================================

export const DEMO_SESSION_METADATA: SessionMetadata = {
  customerName: 'Zava Mining',
  innovationHubSPOC: 'Thabo Molefe',
  primaryStakeholder: 'Lindiwe Nkosi (Chief Operations Officer)',
  accountTeamRep: 'Sarah van der Merwe',
  innovationHubLocation: 'Johannesburg',
  solutionEngineer: 'James Ndlovu',
}

export const DEMO_DISCOVERY_RESPONSES: DiscoveryResponse[] = [
  {
    questionId: 'q1',
    answer: 'Our primary objectives are to improve mine safety through predictive analytics, reduce unplanned equipment downtime by 40%, and optimize our ore extraction processes. We also want to achieve carbon neutrality targets by 2030 and improve operational visibility across our 5 mine sites in Limpopo and Mpumalanga provinces.',
  },
  {
    questionId: 'q2',
    answer: 'Equipment failures cause significant production losses - we lose approximately R50 million annually from unplanned downtime. Safety incidents remain a concern despite improvements. Our legacy systems don\'t integrate well, creating data silos between operations, maintenance, and safety teams. Manual reporting processes take too long and often have errors.',
  },
  {
    questionId: 'q3',
    answer: 'Mine operations managers, maintenance technicians, safety officers, and the executive leadership team. We have about 3,500 employees across sites, with 200 in management and technical roles who would directly use new digital solutions. Underground workers would benefit from improved safety systems.',
  },
  {
    questionId: 'q4',
    answer: 'We use SAP S/4HANA for ERP, have SCADA systems for equipment monitoring, GIS mapping software, and some IoT sensors on critical equipment. We have Microsoft 365 but haven\'t fully leveraged it. Our maintenance uses a mix of SAP PM and spreadsheets. Safety reporting is still largely paper-based.',
  },
  {
    questionId: 'q5',
    answer: 'Equipment inspection reports take 2-3 days to compile and distribute. Safety incident investigation and reporting can take up to 2 weeks. Production planning meetings require manual data gathering from multiple systems. Environmental compliance reporting is extremely time-consuming - about 40 hours per month per site.',
  },
  {
    questionId: 'q6',
    answer: 'We have 5 years of equipment sensor data, maintenance logs, production records, safety incident reports, geological survey data, and environmental monitoring data. Most is stored in SQL databases but not well organized. We also have drone imagery and LiDAR scans of pit areas.',
  },
  {
    questionId: 'q7',
    answer: 'Success means zero fatalities, 30% reduction in equipment downtime, real-time visibility into all operations, automated compliance reporting, and a 15% improvement in ore extraction efficiency. We want to be seen as a technology leader in African mining.',
  },
  {
    questionId: 'q8',
    answer: 'We must comply with the Mine Health and Safety Act (MHSA), Department of Mineral Resources regulations (DMRE), environmental impact assessments, POPIA for employee data, and various labour regulations. Any AI systems must be explainable for safety-critical decisions.',
  },
  // Energy/Mining specific questions
  {
    questionId: 'energy-q1',
    answer: 'Our diesel consumption for haul trucks is our biggest cost - about R200 million annually. We\'re exploring electrification of our fleet but need better energy management. Solar installations at two sites cover about 15% of surface operations power needs.',
  },
  {
    questionId: 'energy-q2',
    answer: 'SCADA systems monitor processing plants and some underground equipment. We have partial IoT coverage on haul trucks and major crushers. Real-time monitoring gaps exist in underground ventilation and water pumping systems.',
  },
  {
    questionId: 'energy-q3',
    answer: 'Reducing carbon intensity by 25% by 2028, achieving ISO 14001 certification across all sites, zero major environmental incidents, and meeting water recycling targets of 70%. We also report to CDP and various ESG frameworks.',
  },
]

export const DEMO_USE_CASES: UseCase[] = [
  {
    id: 'demo-uc-1',
    discoverySessionId: 'demo-session-1',
    title: 'Predictive Equipment Maintenance with Azure IoT',
    description: 'Deploy Azure IoT Hub and Machine Learning to analyze sensor data from haul trucks, crushers, and conveyors. Predict failures 48-72 hours in advance, enabling planned maintenance and reducing unplanned downtime by 40%.',
    impact: 9,
    feasibility: 7,
    rice: { reach: 200, users: 200, period: 'quarter', impact: 3, confidence: 80, effort: 12 },
    kpis: ['equipment-uptime', 'maintenance-cost', 'production-output'],
    aiRegulations: {
      applicableFrameworks: ['msha', 'dmre', 'iso-42001', 'popia'],
      riskClassification: 'limited',
      complianceNotes: 'Safety-critical predictions require human oversight. MSHA compliance for maintenance decisions.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'scada-protection', 'access-control', 'audit-logging'],
      threatCategories: ['ot-it-convergence', 'data-breach'],
      dataClassification: 'operational',
      securityNotes: 'OT/IT convergence requires air-gapped processing for critical systems. SCADA integration needs secure protocols.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'demo-uc-2',
    discoverySessionId: 'demo-session-1',
    title: 'AI-Powered Safety Incident Prevention',
    description: 'Use Azure AI Vision and anomaly detection to monitor underground operations, identify unsafe conditions, and alert safety officers in real-time. Integrate with wearable devices to track worker location and vitals.',
    impact: 10,
    feasibility: 6,
    rice: { reach: 3500, users: 3500, period: 'quarter', impact: 3, confidence: 70, effort: 16 },
    kpis: ['safety-incidents', 'response-time', 'compliance-rate'],
    aiRegulations: {
      applicableFrameworks: ['msha', 'dmre', 'eu-ai-act', 'popia', 'osha'],
      riskClassification: 'high',
      complianceNotes: 'High-risk AI system under EU AI Act due to worker safety implications. Requires human oversight and explainability.',
      jurisdictions: ['South Africa', 'European Union'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'mfa-required', 'audit-logging', 'air-gapped'],
      threatCategories: ['data-breach', 'insider-threat', 'ot-it-convergence'],
      dataClassification: 'pii',
      securityNotes: 'Worker location and biometric data requires strict access controls. Underground systems need reliable offline capability.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'demo-uc-3',
    discoverySessionId: 'demo-session-1',
    title: 'Automated Environmental Compliance Reporting',
    description: 'Build Power Platform solution with Copilot to automatically aggregate environmental data, generate compliance reports, and submit to DMRE. Reduce reporting time from 40 hours to 4 hours per site per month.',
    impact: 7,
    feasibility: 9,
    rice: { reach: 50, users: 50, period: 'month', impact: 2, confidence: 90, effort: 6 },
    kpis: ['processing-time', 'error-rate', 'compliance-rate'],
    aiRegulations: {
      applicableFrameworks: ['dmre', 'epa', 'iso-42001', 'popia'],
      riskClassification: 'minimal',
      complianceNotes: 'Low-risk automation. Reports require human review before submission.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'],
      threatCategories: ['data-exfiltration'],
      dataClassification: 'confidential',
      securityNotes: 'Environmental data is commercially sensitive. Standard enterprise security controls sufficient.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'demo-uc-4',
    discoverySessionId: 'demo-session-1',
    title: 'Digital Twin for Ore Processing Optimization',
    description: 'Create Azure Digital Twins model of processing plants to simulate and optimize crusher settings, conveyor speeds, and recovery rates. Target 15% improvement in ore extraction efficiency.',
    impact: 8,
    feasibility: 6,
    rice: { reach: 100, users: 100, period: 'quarter', impact: 3, confidence: 60, effort: 20 },
    kpis: ['production-output', 'resource-utilization', 'quality-metrics'],
    aiRegulations: {
      applicableFrameworks: ['iso-42001', 'dmre'],
      riskClassification: 'minimal',
      complianceNotes: 'Optimization recommendations require engineering validation before implementation.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'scada-protection'],
      threatCategories: ['ot-it-convergence', 'model-poisoning'],
      dataClassification: 'operational',
      securityNotes: 'Digital twin integration with SCADA requires secure OPC-UA protocols. Model integrity monitoring needed.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'demo-uc-5',
    discoverySessionId: 'demo-session-1',
    title: 'Copilot for Mine Operations Dashboard',
    description: 'Deploy Microsoft 365 Copilot integrated with Power BI dashboards. Enable natural language queries for production data, instant report generation, and automated meeting summaries for shift handovers.',
    impact: 6,
    feasibility: 9,
    rice: { reach: 200, users: 200, period: 'quarter', impact: 2, confidence: 85, effort: 4 },
    kpis: ['employee-productivity', 'decision-speed', 'data-accessibility'],
    aiRegulations: {
      applicableFrameworks: ['popia', 'iso-42001'],
      riskClassification: 'minimal',
      complianceNotes: 'Standard enterprise AI. Ensure data governance for sensitive operational information.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'mfa-required'],
      threatCategories: ['data-exfiltration', 'prompt-injection'],
      dataClassification: 'internal',
      securityNotes: 'Standard M365 security controls. Information barriers for sensitive data.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'demo-uc-6',
    discoverySessionId: 'demo-session-1',
    title: 'Haul Truck Fleet Electrification Analytics',
    description: 'Use Azure AI to analyze diesel consumption patterns, route optimization, and charging infrastructure requirements for transitioning to electric haul trucks. Support carbon neutrality roadmap.',
    impact: 7,
    feasibility: 7,
    rice: { reach: 150, users: 150, period: 'quarter', impact: 2, confidence: 75, effort: 10 },
    kpis: ['carbon-emissions', 'fuel-costs', 'operational-efficiency'],
    aiRegulations: {
      applicableFrameworks: ['epa', 'dmre', 'iso-42001'],
      riskClassification: 'minimal',
      complianceNotes: 'Analytics to support sustainability goals. No direct safety implications.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'],
      threatCategories: ['data-breach'],
      dataClassification: 'internal',
      securityNotes: 'Fleet data is commercially sensitive but standard security controls are sufficient.',
    },
    createdAt: Date.now(),
  },
]

export const DEMO_DISCOVERY_SESSION: DiscoverySession = {
  id: 'demo-session-1',
  customerId: 'demo-customer-zava',
  customerName: 'Zava Mining',
  innovationHubSPOC: 'Thabo Molefe',
  name: 'Zava Mining Innovation Assessment',
  industry: 'energy',  // Mining falls under energy sector
  innovationHubLocation: 'Johannesburg',
  solutionEngineer: 'James Ndlovu',
  accountTeamRep: 'Sarah van der Merwe',
  primaryStakeholder: 'Lindiwe Nkosi (Chief Operations Officer)',
  executiveSummary: `Zava Mining is a leading South African mining company with operations across Limpopo and Mpumalanga provinces. The discovery session revealed significant opportunities for digital transformation across safety, maintenance, and operational efficiency.

**Key Opportunities Identified:**
1. **Predictive Maintenance** - R50M annual losses from unplanned downtime can be significantly reduced through IoT and AI-driven predictive analytics
2. **Safety Enhancement** - AI-powered monitoring and real-time alerts can help achieve zero-harm targets
3. **Operational Visibility** - Digital twins and Copilot integration can provide real-time insights across all 5 sites
4. **Compliance Automation** - Significant time savings (90%) possible in environmental reporting
5. **Sustainability** - Analytics to support carbon neutrality by 2030 and fleet electrification

**Regulatory Considerations:**
The mining sector in South Africa requires compliance with MHSA, DMRE regulations, POPIA, and environmental legislation. Any AI systems for safety-critical decisions must be explainable and maintain human oversight.

**Recommended Next Steps:**
- Start with quick wins: Copilot deployment and environmental reporting automation
- Plan phased rollout of predictive maintenance starting with haul truck fleet
- Conduct detailed feasibility study for AI safety monitoring system`,
  responses: DEMO_DISCOVERY_RESPONSES,
  suggestedUseCases: DEMO_USE_CASES.map(uc => ({
    title: uc.title,
    description: uc.description,
    rationale: 'Based on discovery responses highlighting operational challenges and digital transformation goals.',
  })),
  createdAt: Date.now() - 86400000, // 1 day ago
  completedAt: Date.now(),
  sessionDate: Date.now(),
}

// ============================================================================
// ENTERPRISE DISCOVERY DEMO DATA
// ============================================================================

export const DEMO_ENTERPRISE_SESSION: EnterpriseDiscoverySession = {
  id: 'demo-enterprise-1',
  clientName: 'Zava Mining',
  attendees: [
    { name: 'Lindiwe Nkosi', role: 'Chief Operations Officer' },
    { name: 'Sipho Mahlangu', role: 'Head of Digital Transformation' },
    { name: 'Nomvula Dlamini', role: 'Safety Director' },
    { name: 'Johan van Wyk', role: 'Chief Technology Officer' },
  ],
  sessionDate: Date.now(),
  discoveryType: 'new-opportunity',
  currentStageId: 2,
  stages: {
    0: { status: 'completed', completedAt: Date.now() - 3600000, data: null },
    1: {
      status: 'completed',
      completedAt: Date.now() - 3000000,
      data: {
        problemStatement: 'Unplanned equipment failures cause R50 million in annual production losses, with current reactive maintenance approaches unable to prevent cascading downtime across connected systems.',
        problemCategory: 'efficiency',
        affectedArea: 'multiple',
        desiredOutcome: 'Reduce unplanned downtime by 40% through predictive maintenance capabilities, enabling planned interventions before failures occur.',
        successMetrics: [
          'Reduce unplanned downtime from 15% to 9%',
          'Achieve 48-72 hour failure prediction accuracy',
          'Reduce emergency maintenance costs by 30%',
        ],
        timelineExpectation: '6-12-months',
        coi: {
          directCosts: { oneTime: 5000000, recurring: 4000000 },
          opportunityCosts: { oneTime: 0, recurring: 2000000 },
          riskCosts: { oneTime: 10000000, oneTimeProbability: 20, recurring: 1000000, recurringProbability: 30 },
          totalAnnual: 50000000,
        },
        scq: {
          situation: 'Zava Mining operates 5 mine sites with aging equipment fleets averaging 8 years old, generating 500GB of sensor data daily that is currently underutilized.',
          complication: 'Despite this data availability, 70% of equipment failures are still detected only after they occur, and maintenance teams spend 60% of their time on reactive repairs rather than planned maintenance.',
          question: 'How can we leverage our existing sensor infrastructure with Azure IoT and AI to predict equipment failures and enable proactive maintenance interventions?',
          status: 'confirmed',
        },
      } as OpportunityStageData,
    },
    2: {
      status: 'in-progress',
      data: {
        budgetStatus: 'allocated',
        budgetRange: '500k-1m',
        roiExpectation: '200% ROI over 3 years',
        budgetOwner: 'Sipho Mahlangu',
        executiveSponsor: 'Lindiwe Nkosi',
        projectLead: 'Johan van Wyk',
        teamCapacity: 'medium',
        changeReadiness: 'high',
        existingPlatforms: ['SAP S/4HANA', 'SCADA', 'Microsoft 365', 'Azure (limited)'],
        dataAvailability: 'ready',
        integrationRequirements: ['SAP PM integration', 'SCADA data ingestion', 'Mobile app for technicians'],
        technicalDebtConcerns: 'Legacy SCADA systems on some older sites may require gateway solutions',
        targetStart: Date.now() + 2592000000, // 1 month from now
        targetCompletion: Date.now() + 31536000000, // 1 year from now
        competingPriorities: ['SAP upgrade project', 'Safety system refresh'],
        hardDependencies: ['SCADA network upgrade completion'],
        scq: {
          situation: 'Budget of R5-10M is allocated for digital transformation initiatives, with strong executive sponsorship.',
          complication: 'Competing priorities and a SAP upgrade may strain IT resources in Q2.',
          question: 'Can we structure the implementation in phases that avoid resource conflicts while delivering early value?',
          status: 'pending',
        },
      } as ResourcesStageData,
    },
    3: { status: 'not-started', data: null },
    4: { status: 'not-started', data: null },
    5: { status: 'not-started', data: null },
    6: { status: 'not-started', data: null },
    7: { status: 'not-started', data: null },
    8: { status: 'not-started', data: null },
  },
  allYellowLights: [
    {
      id: 'yl-1',
      description: 'Legacy SCADA systems at 2 sites may require significant gateway investment',
      stageIdentified: 'Stage 2: Resources',
      severity: 'moderate',
      resolutionPlan: 'Conduct technical assessment of legacy SCADA compatibility',
      owner: 'Johan van Wyk',
      dueDate: Date.now() + 1209600000, // 2 weeks
      resolved: false,
    },
  ],
  isLiveMode: false,
  createdAt: Date.now() - 86400000,
}

// ============================================================================
// REGULATION LABELS (for UI display)
// ============================================================================

export const REGULATION_LABELS: Record<AIRegulationFramework, string> = {
  'eu-ai-act': 'EU AI Act',
  'nist-ai-rmf': 'NIST AI RMF',
  'gdpr': 'GDPR',
  'hipaa': 'HIPAA',
  'sox': 'SOX',
  'ccpa': 'CCPA',
  'popia': 'POPIA',
  'iso-42001': 'ISO 42001',
  'oecd-ai-principles': 'OECD AI Principles',
  'white-house-eo': 'US AI Executive Order',
  'msha': 'MSHA',
  'dmre': 'DMRE (SA Mining)',
  'epa': 'EPA',
  'osha': 'OSHA',
  'nerc-cip': 'NERC CIP',
  'pci-dss': 'PCI DSS',
  'ferpa': 'FERPA',
  'glba': 'GLBA',
  'other': 'Other',
}

export const RISK_LEVEL_LABELS: Record<string, string> = {
  'unacceptable': 'Unacceptable Risk',
  'high': 'High Risk',
  'limited': 'Limited Risk',
  'minimal': 'Minimal Risk',
}

export const SECURITY_REQUIREMENT_LABELS: Record<SecurityRequirement, string> = {
  'encryption-at-rest': 'Encryption at Rest',
  'encryption-in-transit': 'Encryption in Transit',
  'access-control': 'Access Control',
  'audit-logging': 'Audit Logging',
  'penetration-testing': 'Penetration Testing',
  'vulnerability-scanning': 'Vulnerability Scanning',
  'data-masking': 'Data Masking',
  'mfa-required': 'MFA Required',
  'soc2-compliance': 'SOC 2 Compliance',
  'iso27001': 'ISO 27001',
  'zero-trust': 'Zero Trust',
  'air-gapped': 'Air-Gapped',
  'on-premises-only': 'On-Premises Only',
  'scada-protection': 'SCADA/ICS Protection',
}

export const DATA_CLASSIFICATION_LABELS: Record<string, string> = {
  'public': 'Public',
  'internal': 'Internal',
  'confidential': 'Confidential',
  'highly-confidential': 'Highly Confidential',
  'pii': 'PII (Personal Data)',
  'phi': 'PHI (Health Data)',
  'financial': 'Financial',
  'operational': 'Operational/Industrial',
}
