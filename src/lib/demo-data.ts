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
  // International/Global
  'oecd-ai-principles': 'OECD AI Principles',
  'unesco-ai-ethics': 'UNESCO AI Ethics',
  'iso-42001': 'ISO 42001',
  
  // European Union
  'eu-ai-act': 'EU AI Act',
  'gdpr': 'GDPR',
  
  // United States
  'nist-ai-rmf': 'NIST AI RMF',
  'white-house-eo': 'US AI Executive Order',
  'ccpa': 'CCPA',
  'hipaa': 'HIPAA',
  'sox': 'SOX',
  'ferpa': 'FERPA',
  'glba': 'GLBA',
  
  // African Union & Africa
  'au-ai-strategy': 'AU AI Continental Strategy',
  'au-data-policy': 'AU Data Policy Framework',
  'smart-africa': 'Smart Africa AI Blueprint',
  
  // South Africa
  'sa-ai-policy-draft': 'SA AI Policy (Draft)',
  'popia': 'POPIA',
  'ecta': 'ECTA',
  'dmre': 'DMRE (SA Mining)',
  'sahpra': 'SAHPRA',
  
  // Industry-Specific
  'msha': 'MSHA',
  'epa': 'EPA',
  'osha': 'OSHA',
  'nerc-cip': 'NERC CIP',
  'pci-dss': 'PCI DSS',
  
  // Microsoft & Technology
  'ms-responsible-ai': 'MS Responsible AI',
  'ms-ai-principles': 'MS AI Principles',
  'ms-copilot-governance': 'MS Copilot Governance',
  
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

// ============================================================================
// FALLBACK SAMPLE USE CASES BY INDUSTRY
// When AI generation fails or returns empty, these provide industry-relevant samples
// ============================================================================

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
    dataClassification: string
  }
}

export const INDUSTRY_FALLBACK_USE_CASES: Record<Industry, FallbackUseCase[]> = {
  general: [
    {
      title: 'Intelligent Document Processing',
      description: 'Automate document classification, data extraction, and routing using Azure AI Document Intelligence. Reduce manual data entry by up to 80% and improve accuracy.',
      rationale: 'Document handling is a universal pain point with significant time savings potential.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'internal' }
    },
    {
      title: 'Employee Knowledge Assistant with Copilot',
      description: 'Deploy Microsoft 365 Copilot to help employees find information, draft documents, summarize meetings, and automate routine tasks across Office applications.',
      rationale: 'Knowledge workers spend 20%+ of their time searching for information.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'mfa-required', 'access-control'], dataClassification: 'internal' }
    },
    {
      title: 'AI-Powered Customer Service Bot',
      description: 'Implement an Azure OpenAI-powered chatbot to handle common customer inquiries 24/7, reducing response times and support costs by 40%.',
      rationale: 'Customer service automation delivers immediate ROI through reduced call volumes.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Predictive Analytics Dashboard',
      description: 'Build a Power BI dashboard with Azure Machine Learning integration for forecasting sales, demand, or operational metrics with 90%+ accuracy.',
      rationale: 'Data-driven decision making improves business outcomes by 5-10%.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control'], dataClassification: 'internal' }
    },
    {
      title: 'Automated Compliance Reporting',
      description: 'Use Power Automate and Azure AI to automatically generate compliance reports, track regulatory changes, and alert teams to potential issues.',
      rationale: 'Compliance reporting is time-consuming and error-prone when done manually.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'audit-logging', 'access-control'], dataClassification: 'confidential' }
    },
  ],
  healthcare: [
    {
      title: 'Clinical Documentation Assistant',
      description: 'Use Azure AI and Microsoft 365 Copilot to help clinicians create, summarize, and manage patient documentation, reducing administrative burden by 50%.',
      rationale: 'Healthcare providers spend up to 50% of their time on documentation.',
      aiRegulations: { applicableFrameworks: ['hipaa', 'gdpr', 'eu-ai-act', 'iso-42001'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'data-masking', 'mfa-required'], dataClassification: 'phi' }
    },
    {
      title: 'Patient Appointment Scheduling Bot',
      description: 'Deploy an AI-powered scheduling assistant that handles appointment booking, reminders, and rescheduling, reducing no-shows by 30%.',
      rationale: 'No-shows and scheduling inefficiencies cost healthcare providers billions annually.',
      aiRegulations: { applicableFrameworks: ['hipaa', 'gdpr'], riskClassification: 'limited', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Medical Image Analysis Assistant',
      description: 'Implement Azure AI Vision for preliminary analysis of medical images (X-rays, scans) to assist radiologists and reduce diagnosis times by 40%.',
      rationale: 'AI-assisted imaging can improve diagnostic accuracy and reduce radiologist workload.',
      aiRegulations: { applicableFrameworks: ['hipaa', 'eu-ai-act', 'iso-42001'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required'], dataClassification: 'phi' }
    },
    {
      title: 'Population Health Analytics',
      description: 'Build predictive models using Azure Machine Learning to identify at-risk patient populations and enable proactive care interventions.',
      rationale: 'Preventive care reduces costs by 25% compared to reactive treatment.',
      aiRegulations: { applicableFrameworks: ['hipaa', 'gdpr', 'eu-ai-act'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'data-masking', 'access-control', 'audit-logging'], dataClassification: 'phi' }
    },
    {
      title: 'Drug Interaction Checker',
      description: 'Implement an AI system that alerts pharmacists and physicians to potential drug interactions and contraindications in real-time.',
      rationale: 'Medication errors are a leading cause of preventable patient harm.',
      aiRegulations: { applicableFrameworks: ['hipaa', 'eu-ai-act'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'mfa-required'], dataClassification: 'phi' }
    },
  ],
  'financial-services': [
    {
      title: 'Real-Time Fraud Detection',
      description: 'Deploy Azure Machine Learning for real-time fraud detection to identify suspicious transactions, reducing fraud losses by 60%.',
      rationale: 'Financial fraud costs institutions billions annually and damages trust.',
      aiRegulations: { applicableFrameworks: ['sox', 'gdpr', 'pci-dss', 'eu-ai-act'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'soc2-compliance'], dataClassification: 'financial' }
    },
    {
      title: 'Automated KYC & Risk Assessment',
      description: 'Automate Know Your Customer and credit risk assessments using Azure AI, reducing onboarding time from days to minutes.',
      rationale: 'Manual KYC processes are slow, expensive, and create poor customer experiences.',
      aiRegulations: { applicableFrameworks: ['sox', 'glba', 'gdpr', 'eu-ai-act'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'mfa-required'], dataClassification: 'pii' }
    },
    {
      title: 'Regulatory Compliance Monitoring',
      description: 'Use Azure AI to monitor transactions and communications for regulatory compliance, automatically flagging potential violations.',
      rationale: 'Regulatory fines in financial services can reach billions of dollars.',
      aiRegulations: { applicableFrameworks: ['sox', 'glba', 'gdpr'], riskClassification: 'limited', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'audit-logging', 'access-control'], dataClassification: 'confidential' }
    },
    {
      title: 'Wealth Advisory Copilot',
      description: 'Implement Microsoft 365 Copilot for financial advisors to analyze portfolios, generate recommendations, and prepare client reports 5x faster.',
      rationale: 'Advisors spend too much time on analysis instead of client relationships.',
      aiRegulations: { applicableFrameworks: ['sox', 'gdpr'], riskClassification: 'limited', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'mfa-required', 'access-control'], dataClassification: 'financial' }
    },
    {
      title: 'Claims Processing Automation',
      description: 'Automate insurance claims intake and initial assessment using Azure Document Intelligence, reducing processing time by 70%.',
      rationale: 'Claims processing is labor-intensive and delays frustrate customers.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'sox'], riskClassification: 'limited', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
  ],
  manufacturing: [
    {
      title: 'Predictive Equipment Maintenance',
      description: 'Use Azure IoT Hub and Machine Learning to predict equipment failures before they occur, reducing unplanned downtime by 50%.',
      rationale: 'Unplanned downtime is the single largest cost in manufacturing operations.',
      aiRegulations: { applicableFrameworks: ['osha', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'scada-protection'], dataClassification: 'operational' }
    },
    {
      title: 'AI-Powered Quality Inspection',
      description: 'Deploy Azure AI Vision on production lines to automatically detect defects and quality issues with 99% accuracy.',
      rationale: 'Manual quality inspection is slow, inconsistent, and misses subtle defects.',
      aiRegulations: { applicableFrameworks: ['iso-42001', 'osha'], riskClassification: 'limited', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'operational' }
    },
    {
      title: 'Supply Chain Demand Forecasting',
      description: 'Implement AI-driven demand forecasting to reduce inventory costs by 20% and prevent stockouts.',
      rationale: 'Supply chain disruptions directly impact profitability and customer satisfaction.',
      aiRegulations: { applicableFrameworks: ['iso-42001'], riskClassification: 'minimal', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control'], dataClassification: 'internal' }
    },
    {
      title: 'Worker Safety Monitoring',
      description: 'Use computer vision and IoT sensors to monitor workplace safety, detecting PPE compliance and hazardous situations in real-time.',
      rationale: 'Workplace accidents are costly in human and financial terms.',
      aiRegulations: { applicableFrameworks: ['osha', 'eu-ai-act', 'iso-42001'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Production Schedule Optimization',
      description: 'Apply Azure AI to optimize production schedules based on orders, resources, and constraints, improving throughput by 15%.',
      rationale: 'Manual scheduling is suboptimal and cannot adapt quickly to changes.',
      aiRegulations: { applicableFrameworks: ['iso-42001'], riskClassification: 'minimal', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'internal' }
    },
  ],
  retail: [
    {
      title: 'Personalized Product Recommendations',
      description: 'Implement AI-powered product recommendations across channels to increase basket size by 25% and improve customer satisfaction.',
      rationale: 'Personalization drives significant revenue uplift and customer loyalty.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'ccpa', 'popia'], riskClassification: 'limited', jurisdictions: ['European Union', 'United States', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Inventory Demand Forecasting',
      description: 'Use Azure Machine Learning to predict demand patterns and optimize inventory levels, reducing stockouts by 40%.',
      rationale: 'Stockouts and overstock both significantly impact profitability.',
      aiRegulations: { applicableFrameworks: ['iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'internal' }
    },
    {
      title: '24/7 Customer Service Chatbot',
      description: 'Deploy an Azure OpenAI-powered chatbot to handle product inquiries, order status, and returns around the clock.',
      rationale: 'Customer service volumes spike during seasons and AI handles routine queries instantly.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'ccpa'], riskClassification: 'limited', jurisdictions: ['European Union', 'United States'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control'], dataClassification: 'pii' }
    },
    {
      title: 'Dynamic Price Optimization',
      description: 'Implement AI-driven dynamic pricing to optimize margins based on demand, competition, and inventory levels.',
      rationale: 'Static pricing leaves money on the table and fails to respond to market conditions.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'eu-ai-act'], riskClassification: 'limited', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'internal' }
    },
    {
      title: 'Loss Prevention Analytics',
      description: 'Use computer vision and transaction analytics to identify theft patterns and reduce shrinkage by 30%.',
      rationale: 'Retail shrinkage costs billions globally each year.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'popia'], riskClassification: 'limited', jurisdictions: ['European Union', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'confidential' }
    },
  ],
  government: [
    {
      title: 'Citizen Service Virtual Assistant',
      description: 'Deploy an AI assistant to help citizens navigate government services, answer questions, and complete applications online 24/7.',
      rationale: 'Citizens expect modern, accessible digital services from government.',
      aiRegulations: { applicableFrameworks: ['nist-ai-rmf', 'gdpr', 'popia', 'white-house-eo'], riskClassification: 'limited', jurisdictions: ['United States', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required'], dataClassification: 'pii' }
    },
    {
      title: 'Document Processing Automation',
      description: 'Automate processing of permit applications and license renewals using Azure AI Document Intelligence, reducing backlogs by 60%.',
      rationale: 'Document processing backlogs frustrate citizens and staff.',
      aiRegulations: { applicableFrameworks: ['nist-ai-rmf', 'gdpr', 'popia'], riskClassification: 'limited', jurisdictions: ['United States', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Public Safety Resource Optimization',
      description: 'Use predictive analytics to optimize emergency services deployment and improve response times by 20%.',
      rationale: 'Data-driven resource allocation saves lives and improves outcomes.',
      aiRegulations: { applicableFrameworks: ['nist-ai-rmf', 'eu-ai-act', 'white-house-eo'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'zero-trust'], dataClassification: 'confidential' }
    },
    {
      title: 'Benefits Fraud Detection',
      description: 'Implement AI to detect fraudulent benefit claims while maintaining fairness and reducing false positives.',
      rationale: 'Benefits fraud wastes public resources while aggressive detection harms legitimate claimants.',
      aiRegulations: { applicableFrameworks: ['nist-ai-rmf', 'gdpr', 'eu-ai-act', 'white-house-eo'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'mfa-required'], dataClassification: 'pii' }
    },
    {
      title: 'Policy Impact Analysis',
      description: 'Use Azure AI and data analytics to model and predict impacts of policy changes before implementation.',
      rationale: 'Evidence-based policymaking leads to better outcomes for citizens.',
      aiRegulations: { applicableFrameworks: ['nist-ai-rmf', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'internal' }
    },
  ],
  education: [
    {
      title: 'Personalized AI Learning Tutor',
      description: 'Deploy an AI tutor that adapts to each student\'s learning style, pace, and knowledge gaps, improving outcomes by 30%.',
      rationale: 'One-size-fits-all education fails to meet individual student needs.',
      aiRegulations: { applicableFrameworks: ['ferpa', 'gdpr', 'popia', 'eu-ai-act'], riskClassification: 'limited', jurisdictions: ['United States', 'European Union', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'data-masking', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Automated Essay Grading Assistant',
      description: 'Use Azure AI to provide initial grading and feedback on written assignments, giving teachers 40% more time for personalized instruction.',
      rationale: 'Teachers spend excessive time on routine grading instead of teaching.',
      aiRegulations: { applicableFrameworks: ['ferpa', 'gdpr', 'eu-ai-act'], riskClassification: 'limited', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control'], dataClassification: 'internal' }
    },
    {
      title: 'Student Success Early Warning',
      description: 'Implement ML-based early warning systems to identify at-risk students and enable timely interventions.',
      rationale: 'Early intervention significantly improves student retention and success.',
      aiRegulations: { applicableFrameworks: ['ferpa', 'gdpr', 'eu-ai-act'], riskClassification: 'high', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'data-masking'], dataClassification: 'pii' }
    },
    {
      title: 'Administrative Process Automation',
      description: 'Automate enrollment, scheduling, and transcript requests using Power Automate and AI, reducing admin workload by 50%.',
      rationale: 'Administrative burden diverts resources from education.',
      aiRegulations: { applicableFrameworks: ['ferpa', 'gdpr'], riskClassification: 'minimal', jurisdictions: ['United States', 'European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Research Knowledge Copilot',
      description: 'Deploy Microsoft 365 Copilot for researchers to accelerate literature review and grant writing by 60%.',
      rationale: 'Researchers spend too much time on literature review instead of research.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['access-control', 'mfa-required'], dataClassification: 'internal' }
    },
  ],
  energy: [
    {
      title: 'Predictive Grid Maintenance',
      description: 'Use Azure IoT and ML to predict failures in turbines, transformers, and grid equipment, reducing outages by 40%.',
      rationale: 'Equipment failures cause costly outages and safety risks.',
      aiRegulations: { applicableFrameworks: ['nerc-cip', 'osha', 'iso-42001'], riskClassification: 'high', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'scada-protection', 'air-gapped'], dataClassification: 'operational' }
    },
    {
      title: 'Smart Grid Load Optimization',
      description: 'Implement AI to optimize electricity distribution, balance renewable sources, and reduce transmission losses by 15%.',
      rationale: 'Grid efficiency directly impacts costs and carbon footprint.',
      aiRegulations: { applicableFrameworks: ['nerc-cip', 'iso-42001'], riskClassification: 'high', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'scada-protection', 'air-gapped', 'iso27001'], dataClassification: 'operational' }
    },
    {
      title: 'Renewable Energy Forecasting',
      description: 'Use ML to predict solar and wind generation based on weather patterns, improving grid stability and reducing backup costs.',
      rationale: 'Accurate renewable forecasting is essential for grid reliability.',
      aiRegulations: { applicableFrameworks: ['iso-42001'], riskClassification: 'limited', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'internal' }
    },
    {
      title: 'Field Worker Safety Assistant',
      description: 'Deploy mobile AI assistants for field workers with safety protocols, hazard identification, and emergency procedures.',
      rationale: 'Field work in energy is dangerous and workers need real-time support.',
      aiRegulations: { applicableFrameworks: ['osha', 'iso-42001'], riskClassification: 'high', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control', 'mfa-required'], dataClassification: 'operational' }
    },
    {
      title: 'Environmental Compliance Automation',
      description: 'Automate emissions monitoring, reporting, and compliance tracking using IoT sensors and Azure AI.',
      rationale: 'Environmental compliance is critical and manual monitoring is insufficient.',
      aiRegulations: { applicableFrameworks: ['epa', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['United States'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'operational' }
    },
  ],
  telecommunications: [
    {
      title: 'Network Anomaly Detection',
      description: 'Use Azure AI to detect network anomalies and predict outages, reducing downtime by 50% through proactive remediation.',
      rationale: 'Network downtime directly impacts revenue and customer satisfaction.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'soc2-compliance'], dataClassification: 'operational' }
    },
    {
      title: 'Customer Churn Prediction',
      description: 'Implement ML models to identify customers at risk of churning and enable proactive retention, reducing churn by 25%.',
      rationale: 'Customer acquisition costs 5-7x more than retention.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'ccpa', 'popia'], riskClassification: 'limited', jurisdictions: ['European Union', 'United States', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control'], dataClassification: 'pii' }
    },
    {
      title: 'Virtual Technical Support Agent',
      description: 'Deploy Azure OpenAI-powered support agent to handle billing, troubleshooting, and service changes, resolving 60% of issues without human intervention.',
      rationale: 'Call center volumes are high and AI can resolve many issues instantly.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'ccpa'], riskClassification: 'limited', jurisdictions: ['European Union', 'United States'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Network Capacity Planning',
      description: 'Use AI to forecast network demand and optimize infrastructure investments, avoiding over/under-provisioning.',
      rationale: 'Over-provisioning wastes capital; under-provisioning degrades service.',
      aiRegulations: { applicableFrameworks: ['iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging'], dataClassification: 'internal' }
    },
    {
      title: 'Telecom Fraud Detection',
      description: 'Implement real-time AI to detect SIM swaps, subscription fraud, and unauthorized usage, reducing fraud losses by 70%.',
      rationale: 'Telecom fraud causes significant revenue loss annually.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'popia'], riskClassification: 'limited', jurisdictions: ['European Union', 'South Africa'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging', 'mfa-required'], dataClassification: 'pii' }
    },
  ],
}

/**
 * Get fallback use cases for an industry when AI generation fails or returns empty
 */
export function getFallbackUseCasesForIndustry(industry: Industry): FallbackUseCase[] {
  return INDUSTRY_FALLBACK_USE_CASES[industry] || INDUSTRY_FALLBACK_USE_CASES.general
}
