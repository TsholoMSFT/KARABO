/**
 * Demo Data for Contoso Mining
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
import { JURISDICTION_FRAMEWORK_MAP } from './regulatory-engine'
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
  'technology-software': ['gdpr', 'ccpa', 'iso-42001', 'ms-responsible-ai', 'ms-copilot-governance'],
}

// Mining-specific regulations (for Contoso Mining demo)
export const MINING_REGULATIONS: AIRegulationFramework[] = [
  'msha',       // Mine Safety and Health
  'dmre',       // SA Dept of Mineral Resources
  'osha',       // Occupational Safety
  'epa',        // Environmental Protection
  'popia',      // South Africa data protection
  'iso-42001',  // AI Management
]

// Derived from the canonical JURISDICTION_FRAMEWORK_MAP in regulatory-engine.ts
export const JURISDICTION_REGULATIONS: Record<string, AIRegulationFramework[]> = Object.fromEntries(
  Object.entries(JURISDICTION_FRAMEWORK_MAP).map(([k, v]) => [k, v.frameworks])
)

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
  'technology-software': ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging', 'mfa-required', 'vulnerability-scanning', 'penetration-testing', 'soc2-compliance', 'zero-trust'],
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
// CONTOSO MINING DEMO DATA
// ============================================================================

export const DEMO_SESSION_METADATA: SessionMetadata = {
  customerName: 'Contoso Mining',
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
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Operational Excellence & Cost Optimization',
      linkedPriorities: ['Digital Transformation', 'Safety Improvement'],
      alignmentScore: 9,
      alignmentRationale: 'Directly addresses R50M annual losses from unplanned downtime, a stated strategic priority. Aligns with digital transformation goals and supports safety through preventive interventions.',
    },
    businessProcesses: [{
      processId: 'bp-maintenance-1',
      processName: 'Equipment Maintenance',
      affectedSteps: ['Inspection', 'Failure Detection', 'Work Order Creation', 'Parts Procurement'],
      currentPainPoints: ['Reactive repairs dominate', 'Manual inspections miss early warnings', 'Parts not always available'],
      proposedImprovement: 'AI predicts failures 48-72 hours in advance, enabling planned interventions',
      expectedCycleTimeReduction: 'Reduce unplanned downtime by 40%',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'azure-infrastructure', services: ['azure-iot-hub', 'azure-digital-twins'], role: 'primary', justification: 'IoT Hub ingests sensor data from equipment; Digital Twins provides virtual representation' },
      { productFamily: 'azure-ai', services: ['azure-machine-learning', 'azure-ai-studio'], role: 'primary', justification: 'ML models predict equipment failures based on sensor patterns' },
      { productFamily: 'power-platform', services: ['power-bi', 'power-automate'], role: 'supporting', justification: 'Dashboards for maintenance KPIs and automated alerting workflows' },
    ],
    referenceArchitecture: 'predictive-analytics',
    agenticOpportunities: [{
      id: 'agent-maintenance-1',
      title: 'Autonomous Maintenance Orchestrator',
      description: 'AI agent that monitors equipment health, predicts failures, automatically schedules maintenance windows, coordinates with parts inventory, and dispatches work orders to technicians',
      agentType: 'orchestrator-agent',
      capabilities: ['reasoning', 'planning', 'tool-use', 'multi-step-execution'],
      humanOversight: 'approval',
      automationLevel: 'semi-autonomous',
      tools: ['SAP PM API', 'IoT Telemetry API', 'Scheduling System', 'Parts Inventory API'],
    }],
    implementationComplexity: {
      level: 'high',
      factors: ['IoT sensor integration across 5 sites', 'SCADA/OT system connectivity', 'ML model training with historical data', 'SAP PM integration'],
      estimatedDuration: '6-9 months',
      estimatedTeamSize: '8-12 people',
      keyRisks: ['Legacy SCADA compatibility', 'Data quality from sensors', 'Change management for maintenance teams'],
    },
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
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Zero Harm Safety Target',
      linkedPriorities: ['Regulatory Compliance', 'Operational Excellence'],
      alignmentScore: 10,
      alignmentRationale: 'Core strategic imperative - achieving zero fatalities and reducing safety incidents. Addresses regulatory requirements under MHSA and DMRE.',
    },
    businessProcesses: [{
      processId: 'bp-safety-1',
      processName: 'Safety Monitoring & Response',
      affectedSteps: ['Hazard Identification', 'Risk Assessment', 'Alert & Response', 'Incident Investigation'],
      currentPainPoints: ['Manual safety checks insufficient for real-time detection', 'Paper-based reporting delays', 'Underground communication gaps'],
      proposedImprovement: 'Real-time AI monitoring with automated alerts and worker tracking',
      expectedCycleTimeReduction: 'Reduce incident response time from hours to seconds',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'azure-ai', services: ['azure-ai-vision', 'azure-openai'], role: 'primary', justification: 'Computer vision detects unsafe conditions; AI analyzes patterns for risk prediction' },
      { productFamily: 'azure-infrastructure', services: ['azure-iot-hub'], role: 'primary', justification: 'Ingests data from wearables, cameras, and environmental sensors' },
      { productFamily: 'power-platform', services: ['power-apps', 'power-automate'], role: 'supporting', justification: 'Mobile safety app for workers; automated incident workflows' },
      { productFamily: 'microsoft-365', services: ['teams'], role: 'integration', justification: 'Emergency communication and coordination' },
    ],
    referenceArchitecture: 'iot-telemetry',
    agenticOpportunities: [{
      id: 'agent-safety-1',
      title: 'Safety Guardian Agent',
      description: 'AI agent that continuously monitors all safety feeds, detects anomalies, assesses risk severity, initiates appropriate response protocols, and coordinates with emergency services',
      agentType: 'specialist-agent',
      capabilities: ['reasoning', 'multi-step-execution', 'human-in-loop'],
      humanOversight: 'supervision',
      automationLevel: 'assisted',
      tools: ['CCTV Feeds', 'Wearable APIs', 'Alert System', 'Emergency Response API'],
    }],
    implementationComplexity: {
      level: 'very-high',
      factors: ['Underground connectivity challenges', 'Integration with existing safety systems', 'Wearable device deployment', 'Real-time processing requirements', 'Regulatory approval process'],
      estimatedDuration: '12-18 months',
      estimatedTeamSize: '15-20 people',
      keyRisks: ['Underground network reliability', 'Worker adoption of wearables', 'False positive management', 'Regulatory certification'],
    },
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
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Carbon Neutrality by 2030',
      linkedPriorities: ['Regulatory Compliance', 'Operational Efficiency'],
      alignmentScore: 8,
      alignmentRationale: 'Supports sustainability targets and reduces compliance burden. Environmental reporting to DMRE is mandatory.',
    },
    businessProcesses: [{
      processId: 'bp-enviro-1',
      processName: 'Environmental Compliance Reporting',
      affectedSteps: ['Data Collection', 'Data Aggregation', 'Report Generation', 'Review & Approval', 'Submission'],
      currentPainPoints: ['Manual data gathering from multiple systems', '40 hours/month per site', 'High error rate in manual compilation'],
      proposedImprovement: 'Automated data aggregation and AI-assisted report generation',
      expectedCycleTimeReduction: 'Reduce from 40 hours to 4 hours per site (90% reduction)',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'power-platform', services: ['power-apps', 'power-automate', 'dataverse'], role: 'primary', justification: 'Low-code app for data collection; workflows for aggregation and approval' },
      { productFamily: 'azure-ai', services: ['azure-openai'], role: 'supporting', justification: 'AI generates narrative sections of compliance reports' },
      { productFamily: 'microsoft-365', services: ['m365-copilot', 'sharepoint'], role: 'supporting', justification: 'Copilot assists with report drafting; SharePoint stores documents' },
    ],
    referenceArchitecture: 'process-automation',
    agenticOpportunities: [{
      id: 'agent-enviro-1',
      title: 'Compliance Report Compiler Agent',
      description: 'AI agent that collects environmental data from all sources, validates data quality, generates draft reports, flags anomalies for review, and prepares submission packages',
      agentType: 'task-agent',
      capabilities: ['tool-use', 'multi-step-execution'],
      humanOversight: 'review',
      automationLevel: 'semi-autonomous',
      tools: ['Environmental Sensors API', 'SAP Data API', 'SharePoint API', 'DMRE Portal API'],
    }],
    implementationComplexity: {
      level: 'low',
      factors: ['Well-defined regulatory requirements', 'Existing data sources', 'Power Platform expertise available'],
      estimatedDuration: '2-3 months',
      estimatedTeamSize: '3-5 people',
      keyRisks: ['Data source access and quality', 'Regulatory template changes'],
    },
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
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Operational Excellence',
      linkedPriorities: ['Digital Transformation', 'Cost Optimization'],
      alignmentScore: 8,
      alignmentRationale: 'Addresses 15% ore extraction efficiency goal. Enables data-driven optimization of processing parameters.',
    },
    businessProcesses: [{
      processId: 'bp-processing-1',
      processName: 'Ore Processing',
      affectedSteps: ['Crushing', 'Grinding', 'Flotation', 'Recovery'],
      currentPainPoints: ['Suboptimal crusher settings', 'Trial-and-error parameter tuning', 'Recovery rate variations'],
      proposedImprovement: 'Digital twin enables what-if simulation before implementing changes',
      expectedCycleTimeReduction: 'Improve ore extraction efficiency by 15%',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'azure-infrastructure', services: ['azure-digital-twins', 'azure-iot-hub'], role: 'primary', justification: 'Digital Twins models processing plant; IoT provides real-time sensor data' },
      { productFamily: 'azure-ai', services: ['azure-machine-learning'], role: 'primary', justification: 'ML optimizes processing parameters based on simulation outcomes' },
      { productFamily: 'power-platform', services: ['power-bi'], role: 'supporting', justification: 'Visualization of twin status and optimization recommendations' },
    ],
    referenceArchitecture: 'digital-twin',
    agenticOpportunities: [{
      id: 'agent-twin-1',
      title: 'Process Optimization Agent',
      description: 'AI agent that continuously monitors processing parameters, runs simulations on digital twin, identifies optimization opportunities, and recommends settings adjustments',
      agentType: 'specialist-agent',
      capabilities: ['reasoning', 'planning', 'tool-use'],
      humanOversight: 'approval',
      automationLevel: 'semi-autonomous',
      tools: ['Digital Twin API', 'SCADA Interface', 'ML Model API'],
    }],
    implementationComplexity: {
      level: 'very-high',
      factors: ['Complex physical process modeling', 'High-fidelity twin requirements', 'SCADA integration', 'Domain expertise needed'],
      estimatedDuration: '12-18 months',
      estimatedTeamSize: '10-15 people',
      keyRisks: ['Model accuracy validation', 'Processing domain expertise', 'Legacy system integration'],
    },
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
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Digital Transformation',
      linkedPriorities: ['Operational Visibility', 'Employee Productivity'],
      alignmentScore: 7,
      alignmentRationale: 'Addresses need for real-time visibility across all 5 sites. Quick win with immediate productivity gains.',
    },
    businessProcesses: [{
      processId: 'bp-reporting-1',
      processName: 'Operational Reporting & Handover',
      affectedSteps: ['Data Gathering', 'Report Compilation', 'Shift Handover', 'Management Briefing'],
      currentPainPoints: ['Manual data gathering from multiple systems', 'Slow report compilation', 'Inconsistent handover quality'],
      proposedImprovement: 'Natural language queries and AI-generated summaries',
      expectedCycleTimeReduction: 'Reduce report preparation time by 70%',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'microsoft-365', services: ['m365-copilot', 'teams'], role: 'primary', justification: 'Copilot for natural language data queries and meeting summaries' },
      { productFamily: 'power-platform', services: ['power-bi'], role: 'primary', justification: 'Interactive dashboards with Copilot integration' },
    ],
    referenceArchitecture: 'content-generation',
    agenticOpportunities: [{
      id: 'agent-ops-1',
      title: 'Operations Briefing Assistant',
      description: 'AI assistant that monitors operations data, generates shift summaries, prepares management briefings, and answers ad-hoc data questions',
      agentType: 'assistant-agent',
      capabilities: ['tool-use', 'memory'],
      humanOversight: 'none',
      automationLevel: 'assisted',
      tools: ['Power BI API', 'SharePoint API', 'Teams API'],
    }],
    implementationComplexity: {
      level: 'low',
      factors: ['Existing Microsoft 365 environment', 'Power BI already deployed', 'Standard Copilot rollout'],
      estimatedDuration: '1-2 months',
      estimatedTeamSize: '2-3 people',
      keyRisks: ['User adoption', 'Data governance for Copilot'],
    },
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
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Carbon Neutrality by 2030',
      linkedPriorities: ['Cost Optimization', 'Sustainability Leadership'],
      alignmentScore: 9,
      alignmentRationale: 'Directly supports carbon neutrality target. Addresses R200M annual diesel cost.',
    },
    businessProcesses: [{
      processId: 'bp-fleet-1',
      processName: 'Fleet Management & Fuel Procurement',
      affectedSteps: ['Route Planning', 'Fuel Consumption Tracking', 'Fleet Scheduling', 'Infrastructure Planning'],
      currentPainPoints: ['High diesel costs (R200M/year)', 'Suboptimal route planning', 'No visibility into electrification ROI'],
      proposedImprovement: 'Analytics-driven fleet electrification roadmap',
      expectedCycleTimeReduction: 'N/A - strategic planning use case',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'azure-ai', services: ['azure-machine-learning'], role: 'primary', justification: 'Predictive models for consumption and ROI analysis' },
      { productFamily: 'azure-data', services: ['azure-synapse', 'azure-data-lake'], role: 'primary', justification: 'Data lake for fleet telemetry; Synapse for advanced analytics' },
      { productFamily: 'power-platform', services: ['power-bi'], role: 'supporting', justification: 'Executive dashboards for electrification planning' },
    ],
    referenceArchitecture: 'predictive-analytics',
    implementationComplexity: {
      level: 'medium',
      factors: ['Fleet telemetry data integration', 'Route optimization modeling', 'Infrastructure cost modeling'],
      estimatedDuration: '3-4 months',
      estimatedTeamSize: '5-7 people',
      keyRisks: ['Data quality from legacy fleet systems', 'Accuracy of charging infrastructure projections'],
    },
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
  customerId: 'demo-customer-contoso',
  customerName: 'Contoso Mining',
  innovationHubSPOC: 'Thabo Molefe',
  name: 'Contoso Mining Innovation Assessment',
  industry: 'energy',  // Mining falls under energy sector
  innovationHubLocation: 'Johannesburg',
  solutionEngineer: 'James Ndlovu',
  accountTeamRep: 'Sarah van der Merwe',
  primaryStakeholder: 'Lindiwe Nkosi (Chief Operations Officer)',
  executiveSummary: `Contoso Mining is a leading South African mining company with operations across Limpopo and Mpumalanga provinces. The discovery session revealed significant opportunities for digital transformation across safety, maintenance, and operational efficiency.

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
  isDemo: true,
  createdAt: Date.now() - 86400000, // 1 day ago
  completedAt: Date.now(),
  sessionDate: Date.now(),
}

// ============================================================================
// ENTERPRISE DISCOVERY DEMO DATA
// ============================================================================

export const DEMO_ENTERPRISE_SESSION: EnterpriseDiscoverySession = {
  id: 'demo-enterprise-1',
  clientName: 'Contoso Mining',
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
          situation: 'Contoso Mining operates 5 mine sites with aging equipment fleets averaging 8 years old, generating 500GB of sensor data daily that is currently underutilized.',
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
  isDemo: true,
  createdAt: Date.now() - 86400000,
}

// ============================================================================
// RETAIL DEMO DATA (Zava Retail)
// ============================================================================

export const DEMO_RETAIL_RESPONSES: DiscoveryResponse[] = [
  {
    questionId: 'current-landscape',
    answer: 'Zava Retail operates 150 stores across Southern Africa with a growing e-commerce platform (12% of revenue). We use SAP S/4HANA for ERP, Oracle for supply chain, and legacy POS systems. Customer data is fragmented across loyalty programs, POS, and e-commerce platforms.',
  },
  {
    questionId: 'biggest-challenges',
    answer: 'Inventory management is our biggest pain point - R200M in shrinkage annually, stockouts causing lost sales of R50M per month. Customer experience is inconsistent across channels. Manual processes in pricing and promotions take 2 weeks to execute.',
  },
  {
    questionId: 'digital-initiatives',
    answer: 'We launched click-and-collect last year and are piloting self-checkout. Exploring personalized marketing but limited by data silos. Board has approved R100M for digital transformation over 3 years.',
  },
]

export const DEMO_RETAIL_USE_CASES: UseCase[] = [
  {
    id: 'retail-uc-1',
    discoverySessionId: 'demo-retail-session-1',
    title: 'AI-Powered Demand Forecasting & Inventory Optimization',
    description: 'Deploy Azure Machine Learning to analyze sales patterns, weather, events, and social trends. Predict demand at SKU-store level with 95% accuracy, automatically triggering replenishment orders and reducing stockouts by 60%.',
    impact: 9,
    feasibility: 8,
    rice: { reach: 150, users: 150, period: 'quarter', impact: 3, confidence: 85, effort: 10 },
    kpis: ['revenue-growth', 'inventory-turnover', 'customer-satisfaction'],
    costOfInaction: {
      directCosts: 0,
      opportunityCosts: 600000000, // R50M/month stockouts = R600M/year
      riskCosts: 0,
      totalAnnualCOI: 600000000,
      notes: 'Based on current R50M monthly lost sales from stockouts; 60% reduction achievable. Source: Internal sales analytics, lost sale tracking.',
      calculatedAt: Date.now(),
    },
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Revenue Growth & Customer Satisfaction',
      linkedPriorities: ['Supply Chain Optimization', 'Working Capital Efficiency'],
      alignmentScore: 9,
      alignmentRationale: 'Directly addresses R600M annual lost sales from stockouts. Critical for competitive positioning against online retailers.',
    },
    businessProcesses: [{
      processId: 'bp-inventory-1',
      processName: 'Inventory Replenishment',
      affectedSteps: ['Demand Forecasting', 'Order Generation', 'DC Allocation', 'Store Receiving'],
      currentPainPoints: ['Inaccurate manual forecasts', 'Stockouts on fast movers', 'Overstock on slow movers'],
      proposedImprovement: 'AI-driven demand sensing with automatic replenishment triggers',
      expectedCycleTimeReduction: 'Reduce stockouts by 60%, improve inventory turns by 25%',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'azure-ai', services: ['azure-machine-learning'], role: 'primary', justification: 'ML models for demand forecasting at SKU-store level' },
      { productFamily: 'azure-data', services: ['azure-synapse', 'azure-data-lake'], role: 'primary', justification: 'Data lake for sales history; Synapse for analytics' },
      { productFamily: 'power-platform', services: ['power-bi', 'power-automate'], role: 'supporting', justification: 'Inventory dashboards and replenishment alerts' },
      { productFamily: 'dynamics-365', services: ['d365-supply-chain'], role: 'integration', justification: 'Integration with supply chain execution' },
    ],
    referenceArchitecture: 'predictive-analytics',
    agenticOpportunities: [{
      id: 'agent-inventory-1',
      title: 'Inventory Optimization Agent',
      description: 'AI agent that monitors stock levels, predicts demand, generates replenishment orders, coordinates with distribution centers, and adjusts for promotional events',
      agentType: 'orchestrator-agent',
      capabilities: ['reasoning', 'planning', 'tool-use', 'multi-step-execution'],
      humanOversight: 'approval',
      automationLevel: 'semi-autonomous',
      tools: ['Demand Forecast API', 'Inventory System API', 'Order Management API', 'Weather API'],
    }],
    implementationComplexity: {
      level: 'medium',
      factors: ['Integration with SAP/Oracle systems', 'Historical data quality', 'ML model training', 'Store-level rollout'],
      estimatedDuration: '4-6 months',
      estimatedTeamSize: '6-8 people',
      keyRisks: ['Data quality from legacy POS', 'Change management for buyers', 'ML model accuracy validation'],
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'gdpr', 'iso-42001'],
      riskClassification: 'minimal',
      complianceNotes: 'Uses aggregated sales data. No personal data in forecasting models.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging'],
      threatCategories: ['data-breach', 'data-exfiltration'],
      dataClassification: 'confidential',
      securityNotes: 'Sales and inventory data is commercially sensitive. Standard enterprise controls.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'retail-uc-2',
    discoverySessionId: 'demo-retail-session-1',
    title: 'Computer Vision for Shrinkage Prevention',
    description: 'Implement Azure AI Vision at self-checkout and high-risk areas to detect scan avoidance, suspicious behavior, and inventory discrepancies in real-time. Integrate with existing CCTV infrastructure.',
    impact: 8,
    feasibility: 7,
    rice: { reach: 150, users: 150, period: 'quarter', impact: 3, confidence: 75, effort: 14 },
    kpis: ['shrinkage-rate', 'loss-prevention-savings', 'incident-detection-rate'],
    costOfInaction: {
      directCosts: 200000000, // R200M shrinkage
      opportunityCosts: 0,
      riskCosts: 0,
      totalAnnualCOI: 200000000,
      notes: 'Current shrinkage at R200M annually; AI can reduce by ~35%. Source: Annual shrinkage audit reports.',
      calculatedAt: Date.now(),
    },
    // Innovation Hub Methodology: Business Envisioning
    strategicAlignment: {
      primaryPriority: 'Profitability & Loss Prevention',
      linkedPriorities: ['Operational Efficiency', 'Store Safety'],
      alignmentScore: 8,
      alignmentRationale: 'Addresses R200M annual shrinkage. Essential for protecting margins in competitive retail environment.',
    },
    businessProcesses: [{
      processId: 'bp-lp-1',
      processName: 'Loss Prevention',
      affectedSteps: ['Surveillance Monitoring', 'Incident Detection', 'Response & Intervention', 'Investigation'],
      currentPainPoints: ['Manual CCTV monitoring insufficient', 'Self-checkout vulnerabilities', 'Delayed incident response'],
      proposedImprovement: 'AI-powered real-time detection with automated alerts',
      expectedCycleTimeReduction: 'Reduce shrinkage by 35%',
    }],
    // Innovation Hub Methodology: Solution Envisioning
    microsoftSolutions: [
      { productFamily: 'azure-ai', services: ['azure-ai-vision', 'azure-ai-studio'], role: 'primary', justification: 'Computer vision for behavior and object detection' },
      { productFamily: 'azure-infrastructure', services: ['azure-iot-hub'], role: 'supporting', justification: 'IoT edge processing for cameras' },
      { productFamily: 'power-platform', services: ['power-apps', 'power-automate'], role: 'supporting', justification: 'Alert notifications and incident logging' },
    ],
    referenceArchitecture: 'iot-telemetry',
    agenticOpportunities: [{
      id: 'agent-lp-1',
      title: 'Loss Prevention Guardian',
      description: 'AI agent that monitors camera feeds, detects suspicious patterns, correlates with POS data, triggers alerts to security, and logs incidents for investigation',
      agentType: 'specialist-agent',
      capabilities: ['reasoning', 'tool-use', 'human-in-loop'],
      humanOversight: 'supervision',
      automationLevel: 'assisted',
      tools: ['CCTV Feed API', 'POS Transaction API', 'Alert System', 'Incident Management API'],
    }],
    implementationComplexity: {
      level: 'high',
      factors: ['CCTV infrastructure integration', 'Edge processing requirements', 'Privacy compliance', 'Staff training'],
      estimatedDuration: '6-9 months',
      estimatedTeamSize: '8-10 people',
      keyRisks: ['Camera quality and coverage', 'False positive management', 'Privacy concerns', 'Union considerations'],
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'eu-ai-act', 'gdpr', 'iso-42001'],
      riskClassification: 'high',
      complianceNotes: 'Video surveillance with AI requires POPIA compliance, signage, and data retention policies. Human review before any action.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'mfa-required', 'audit-logging'],
      threatCategories: ['data-breach', 'insider-threat', 'adversarial-attacks'],
      dataClassification: 'pii',
      securityNotes: 'Video data containing customer images requires strict access controls and retention limits.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'retail-uc-3',
    discoverySessionId: 'demo-retail-session-1',
    title: 'Personalized Customer Experience with Copilot',
    description: 'Deploy Microsoft 365 Copilot and Azure OpenAI to power personalized product recommendations, shopping assistants, and dynamic pricing. Unify customer profiles across channels for 360° view.',
    impact: 8,
    feasibility: 8,
    rice: { reach: 500000, users: 500000, period: 'quarter', impact: 2, confidence: 80, effort: 12 },
    kpis: ['customer-lifetime-value', 'conversion-rate', 'average-basket-size'],
    costOfInaction: {
      directCosts: 0,
      opportunityCosts: 180000000,
      riskCosts: 0,
      totalAnnualCOI: 180000000,
      notes: 'Personalization typically increases revenue by 10-15%; estimated R180M opportunity. Source: Industry benchmarks, competitor analysis.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'gdpr', 'ccpa', 'iso-42001'],
      riskClassification: 'limited',
      complianceNotes: 'Personalization requires explicit consent. Customers must be able to opt-out.',
      jurisdictions: ['South Africa', 'European Union'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'data-masking', 'audit-logging'],
      threatCategories: ['data-breach', 'prompt-injection', 'data-exfiltration'],
      dataClassification: 'pii',
      securityNotes: 'Customer profile data requires privacy-preserving techniques. LLM guardrails for shopping assistant.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'retail-uc-4',
    discoverySessionId: 'demo-retail-session-1',
    title: 'Automated Pricing & Promotion Engine',
    description: 'Build AI-powered dynamic pricing system that analyzes competitor prices, demand elasticity, and margins. Reduce pricing decision cycle from 2 weeks to real-time, with Copilot for merchandising team.',
    impact: 7,
    feasibility: 7,
    rice: { reach: 30, users: 30, period: 'quarter', impact: 3, confidence: 70, effort: 16 },
    kpis: ['margin-improvement', 'promotion-roi', 'competitive-price-index'],
    costOfInaction: {
      directCosts: 0,
      opportunityCosts: 120000000,
      riskCosts: 0,
      totalAnnualCOI: 120000000,
      notes: 'Slow pricing responses losing ~2% margin annually on R6B revenue. Source: Pricing team estimates, margin analysis.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['iso-42001', 'popia'],
      riskClassification: 'minimal',
      complianceNotes: 'Pricing algorithms must be auditable. No discriminatory pricing based on customer demographics.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'],
      threatCategories: ['insider-threat', 'data-exfiltration'],
      dataClassification: 'confidential',
      securityNotes: 'Pricing strategies are highly confidential. Strict access controls.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'retail-uc-5',
    discoverySessionId: 'demo-retail-session-1',
    title: 'Supply Chain Visibility & Optimization',
    description: 'Implement Azure Digital Twins for end-to-end supply chain visibility. AI-powered supplier risk monitoring, route optimization, and carbon footprint tracking for sustainability goals.',
    impact: 7,
    feasibility: 6,
    rice: { reach: 50, users: 50, period: 'quarter', impact: 2, confidence: 65, effort: 18 },
    kpis: ['supply-chain-cost', 'delivery-performance', 'carbon-footprint'],
    costOfInaction: {
      directCosts: 90000000,
      opportunityCosts: 0,
      riskCosts: 0,
      totalAnnualCOI: 90000000,
      notes: 'Supply chain inefficiencies costing ~1.5% of COGS; estimated R90M. Source: Logistics analysis, supplier performance data.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['iso-42001', 'epa'],
      riskClassification: 'minimal',
      complianceNotes: 'Supplier data sharing requires contractual agreements.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'vulnerability-scanning'],
      threatCategories: ['supply-chain', 'data-exfiltration'],
      dataClassification: 'confidential',
      securityNotes: 'Supplier integration requires secure APIs. Third-party risk assessment needed.',
    },
    createdAt: Date.now(),
  },
]

export const DEMO_RETAIL_SESSION: DiscoverySession = {
  id: 'demo-retail-session-1',
  customerId: 'demo-customer-zava',
  customerName: 'Zava Retail',
  innovationHubSPOC: 'Themba Mokoena',
  name: 'Zava Retail Digital Transformation Assessment',
  industry: 'retail',
  innovationHubLocation: 'Cape Town',
  solutionEngineer: 'Priya Naidoo',
  accountTeamRep: 'Michael du Plessis',
  primaryStakeholder: 'Naledi Khumalo (Chief Digital Officer)',
  executiveSummary: `Zava Retail is a leading Southern African retailer operating 150 stores with a growing e-commerce presence. The discovery revealed significant opportunities to leverage AI for inventory optimization, loss prevention, and customer experience.

**Key Opportunities Identified:**
1. **Demand Forecasting** - R600M annual lost sales from stockouts can be dramatically reduced with AI-powered forecasting
2. **Shrinkage Prevention** - Computer vision can help reduce R200M annual shrinkage
3. **Personalization** - Unified customer data and AI can drive 10-15% revenue uplift
4. **Pricing Agility** - Reduce pricing decisions from weeks to real-time
5. **Supply Chain** - End-to-end visibility for cost optimization and sustainability

**Regulatory Considerations:**
Retail AI applications must comply with POPIA for customer data, especially for personalization and video analytics. High-risk AI systems like surveillance require human oversight.

**Recommended Next Steps:**
- Quick win: Deploy Copilot for merchandising team
- Priority: Implement demand forecasting for top 1000 SKUs
- Phase 2: Computer vision pilot at 10 high-shrinkage stores`,
  responses: DEMO_RETAIL_RESPONSES,
  suggestedUseCases: DEMO_RETAIL_USE_CASES.map(uc => ({
    title: uc.title,
    description: uc.description,
    rationale: 'Based on discovery responses highlighting retail operational challenges.',
  })),
  stockTicker: 'MEGA.JSE',
  isDemo: true,
  createdAt: Date.now() - 86400000,
  completedAt: Date.now(),
  sessionDate: Date.now(),
}

export const DEMO_RETAIL_ENTERPRISE_SESSION: EnterpriseDiscoverySession = {
  id: 'demo-retail-enterprise-1',
  clientName: 'Zava Retail',
  attendees: [
    { name: 'Naledi Khumalo', role: 'Chief Digital Officer' },
    { name: 'David Botha', role: 'Head of Merchandising' },
    { name: 'Fatima Patel', role: 'Supply Chain Director' },
    { name: 'Trevor Moloi', role: 'CIO' },
  ],
  sessionDate: Date.now(),
  discoveryType: 'new-opportunity',
  currentStageId: 1,
  stages: {
    0: { status: 'completed', completedAt: Date.now() - 3600000, data: null },
    1: {
      status: 'in-progress',
      data: {
        problemStatement: 'R600M annual lost sales from stockouts, R200M shrinkage, and fragmented customer data across channels.',
        problemCategory: 'growth',
        affectedArea: 'multiple',
        desiredOutcome: 'Reduce stockouts by 60%, shrinkage by 35%, unified customer 360 view',
        successMetrics: ['Inventory turnover improvement', 'Shrinkage reduction %', 'Customer NPS', 'Revenue per sqm'],
        timelineExpectation: '12+-months',
        coi: {
          directCosts: { oneTime: 0, recurring: 16666667 },
          opportunityCosts: { oneTime: 0, recurring: 50000000 },
          riskCosts: { oneTime: 0, oneTimeProbability: 0, recurring: 0, recurringProbability: 0 },
          totalAnnual: 800000000,
        },
        scq: {
          situation: '150-store retailer with growing e-commerce, modern ERP, and fragmented data across POS, loyalty, and e-commerce.',
          complication: 'Stockouts and shrinkage are materially impacting revenue and margins; manual forecasting and replenishment do not scale.',
          question: 'How can we use AI to improve demand forecasting and inventory execution while keeping data governance and controls in place?',
          status: 'pending',
        },
      },
    },
    2: { status: 'not-started', data: null },
    3: { status: 'not-started', data: null },
    4: { status: 'not-started', data: null },
    5: { status: 'not-started', data: null },
    6: { status: 'not-started', data: null },
    7: { status: 'not-started', data: null },
    8: { status: 'not-started', data: null },
  },
  allYellowLights: [],
  isLiveMode: false,
  isDemo: true,
  createdAt: Date.now() - 86400000,
}

// ============================================================================
// FINANCIAL SERVICES DEMO DATA (Blue Yonder Financial)
// ============================================================================

export const DEMO_FINANCIAL_RESPONSES: DiscoveryResponse[] = [
  {
    questionId: 'current-landscape',
    answer: 'Blue Yonder Financial is a mid-tier bank with 2M retail customers and R80B in assets under management. Core banking on legacy mainframe (30 years old), with modern digital banking layer. Using Azure for some workloads but limited AI adoption.',
  },
  {
    questionId: 'biggest-challenges',
    answer: 'Fraud losses at R150M annually and growing. Customer onboarding takes 5 days on average, losing prospects to neo-banks. Manual credit decisioning is slow and inconsistent. AML compliance is resource-intensive.',
  },
  {
    questionId: 'digital-initiatives',
    answer: 'Launched mobile banking app last year (500K active users). Exploring AI for credit scoring but regulatory concerns. Board wants to reduce cost-to-income ratio from 62% to 55% over 3 years.',
  },
]

export const DEMO_FINANCIAL_USE_CASES: UseCase[] = [
  {
    id: 'fin-uc-1',
    discoverySessionId: 'demo-financial-session-1',
    title: 'AI-Powered Fraud Detection & Prevention',
    description: 'Deploy Azure Machine Learning for real-time transaction fraud detection using behavioral analytics, device fingerprinting, and network analysis. Reduce fraud losses by 70% while decreasing false positives by 50%.',
    impact: 10,
    feasibility: 8,
    rice: { reach: 2000000, users: 2000000, period: 'quarter', impact: 3, confidence: 85, effort: 12 },
    kpis: ['fraud-loss-reduction', 'false-positive-rate', 'detection-time'],
    costOfInaction: {
      directCosts: 150000000,
      opportunityCosts: 0,
      riskCosts: 0,
      totalAnnualCOI: 150000000,
      notes: 'Current R150M fraud losses; ~70% reduction achievable with AI. Source: Fraud operations quarterly reports.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'gdpr', 'glba', 'iso-42001', 'sox'],
      riskClassification: 'high',
      complianceNotes: 'Fraud models must be explainable. Decisions affecting customers require human review. SARB guidelines compliance.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'mfa-required', 'audit-logging'],
      threatCategories: ['data-breach', 'adversarial-attacks', 'model-poisoning', 'insider-threat'],
      dataClassification: 'highly-confidential',
      securityNotes: 'Transaction data requires highest security controls. Model integrity monitoring essential.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'fin-uc-2',
    discoverySessionId: 'demo-financial-session-1',
    title: 'Intelligent Document Processing for Onboarding',
    description: 'Use Azure AI Document Intelligence and OpenAI to automate KYC document verification, extract data from IDs and proof documents, and reduce customer onboarding from 5 days to same-day.',
    impact: 8,
    feasibility: 9,
    rice: { reach: 50000, users: 50000, period: 'quarter', impact: 3, confidence: 90, effort: 8 },
    kpis: ['onboarding-time', 'customer-acquisition-cost', 'document-accuracy'],
    costOfInaction: {
      directCosts: 0,
      opportunityCosts: 75000000,
      riskCosts: 0,
      totalAnnualCOI: 75000000,
      notes: 'Losing ~30% of applicants to faster neo-banks; estimated R75M in lifetime value. Source: Customer journey analytics, competitor analysis.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'gdpr', 'iso-42001', 'other'],
      riskClassification: 'limited',
      complianceNotes: 'FICA compliance mandatory. Document verification must maintain audit trail. Human review for edge cases.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'data-masking', 'audit-logging'],
      threatCategories: ['adversarial-attacks', 'data-breach'],
      dataClassification: 'pii',
      securityNotes: 'ID documents and personal data require strict handling. Temporary storage only.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'fin-uc-3',
    discoverySessionId: 'demo-financial-session-1',
    title: 'AI Credit Decisioning Engine',
    description: 'Implement explainable AI for credit scoring using alternative data sources (utility payments, rental history). Reduce manual underwriting by 80% while improving approval rates for thin-file customers.',
    impact: 9,
    feasibility: 6,
    rice: { reach: 100000, users: 100000, period: 'quarter', impact: 3, confidence: 70, effort: 18 },
    kpis: ['approval-rate', 'default-rate', 'decisioning-time', 'cost-per-decision'],
    costOfInaction: {
      directCosts: 60000000,
      opportunityCosts: 60000000,
      riskCosts: 0,
      totalAnnualCOI: 120000000,
      notes: 'Manual underwriting costs plus lost opportunity from thin-file rejections (split evenly as a placeholder). Source: Credit operations cost analysis.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'eu-ai-act', 'glba', 'iso-42001', 'other'],
      riskClassification: 'high',
      complianceNotes: 'High-risk AI under EU AI Act. NCR compliance for credit decisioning. Full explainability required. Regular bias audits mandatory.',
      jurisdictions: ['South Africa', 'European Union'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'mfa-required', 'audit-logging', 'zero-trust'],
      threatCategories: ['model-poisoning', 'data-breach', 'adversarial-attacks'],
      dataClassification: 'highly-confidential',
      securityNotes: 'Credit models require strict governance. Alternative data sources need vetting.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'fin-uc-4',
    discoverySessionId: 'demo-financial-session-1',
    title: 'Copilot for Relationship Managers',
    description: 'Deploy Microsoft 365 Copilot integrated with CRM and core banking to provide relationship managers with customer insights, next-best-action recommendations, and automated meeting preparation.',
    impact: 7,
    feasibility: 9,
    rice: { reach: 200, users: 200, period: 'quarter', impact: 2, confidence: 85, effort: 6 },
    kpis: ['relationship-manager-productivity', 'cross-sell-rate', 'customer-retention'],
    costOfInaction: {
      directCosts: 45000000,
      opportunityCosts: 0,
      riskCosts: 0,
      totalAnnualCOI: 45000000,
      notes: 'RM spending ~40% time on admin tasks; ~15% productivity gain achievable. Source: Time and motion study, RM feedback surveys.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'gdpr', 'iso-42001', 'ms-copilot-governance'],
      riskClassification: 'limited',
      complianceNotes: 'Customer data access via Copilot must respect existing permissions. No storage of customer data in Copilot.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-in-transit', 'access-control', 'data-masking', 'audit-logging'],
      threatCategories: ['prompt-injection', 'data-exfiltration', 'insider-threat'],
      dataClassification: 'confidential',
      securityNotes: 'Copilot guardrails essential. Data loss prevention policies apply.',
    },
    createdAt: Date.now(),
  },
  {
    id: 'fin-uc-5',
    discoverySessionId: 'demo-financial-session-1',
    title: 'AML Transaction Monitoring Enhancement',
    description: 'Enhance existing AML system with Azure AI to reduce false positives by 60% through behavioral profiling and network analysis. Automate SAR narrative generation with Azure OpenAI.',
    impact: 8,
    feasibility: 7,
    rice: { reach: 50, users: 50, period: 'quarter', impact: 3, confidence: 75, effort: 14 },
    kpis: ['false-positive-reduction', 'investigation-time', 'sar-filing-accuracy'],
    costOfInaction: {
      directCosts: 60000000,
      opportunityCosts: 0,
      riskCosts: 0,
      totalAnnualCOI: 60000000,
      notes: 'AML team spending ~70% time on false positives; R60M annual cost. Source: Compliance operations cost analysis.',
      calculatedAt: Date.now(),
    },
    aiRegulations: {
      applicableFrameworks: ['popia', 'glba', 'iso-42001', 'other'],
      riskClassification: 'high',
      complianceNotes: 'SARB and FIC oversight. AI cannot replace human judgment for SAR decisions. Full audit trail required.',
      jurisdictions: ['South Africa'],
    },
    cybersecurity: {
      securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'mfa-required', 'audit-logging'],
      threatCategories: ['data-breach', 'insider-threat', 'adversarial-attacks'],
      dataClassification: 'highly-confidential',
      securityNotes: 'AML data is highly sensitive. Segregated access. Audit everything.',
    },
    createdAt: Date.now(),
  },
]

export const DEMO_FINANCIAL_SESSION: DiscoverySession = {
  id: 'demo-financial-session-1',
  customerId: 'demo-customer-blueyonder',
  customerName: 'Blue Yonder Financial',
  innovationHubSPOC: 'Kagiso Mabena',
  name: 'Blue Yonder Financial AI Transformation Assessment',
  industry: 'financial-services',
  innovationHubLocation: 'Sandton',
  solutionEngineer: 'Reuben Govender',
  accountTeamRep: 'Anele Sithole',
  primaryStakeholder: 'Grace Moyo (Chief Digital & Innovation Officer)',
  executiveSummary: `Blue Yonder Financial is a mid-tier South African bank undergoing digital transformation. The discovery revealed significant opportunities to leverage AI for fraud prevention, customer onboarding, and operational efficiency.

**Key Opportunities Identified:**
1. **Fraud Prevention** - R150M annual fraud losses can be reduced by 70% with AI-powered detection
2. **Digital Onboarding** - Reduce customer onboarding from 5 days to same-day with intelligent document processing
3. **Credit Decisioning** - Explainable AI can improve approval rates while maintaining risk standards
4. **RM Productivity** - Copilot can free relationship managers from 40% administrative burden
5. **AML Efficiency** - AI can reduce false positives by 60%, saving R60M annually

**Regulatory Considerations:**
Financial services AI requires compliance with SARB, NCR, FICA, and POPIA. High-risk AI systems for credit and fraud must be explainable with human oversight. Regular bias audits are essential.

**Recommended Next Steps:**
- Quick win: Copilot for relationship managers and document processing
- Priority: Deploy fraud detection enhancement
- Phase 2: Explainable AI credit decisioning pilot`,
  responses: DEMO_FINANCIAL_RESPONSES,
  suggestedUseCases: DEMO_FINANCIAL_USE_CASES.map(uc => ({
    title: uc.title,
    description: uc.description,
    rationale: 'Based on discovery responses highlighting financial services challenges.',
  })),
  stockTicker: 'APX.JSE',
  isDemo: true,
  createdAt: Date.now() - 86400000,
  completedAt: Date.now(),
  sessionDate: Date.now(),
}

export const DEMO_FINANCIAL_ENTERPRISE_SESSION: EnterpriseDiscoverySession = {
  id: 'demo-financial-enterprise-1',
  clientName: 'Blue Yonder Financial',
  attendees: [
    { name: 'Grace Moyo', role: 'Chief Digital & Innovation Officer' },
    { name: 'Robert Steenkamp', role: 'Head of Credit Risk' },
    { name: 'Zanele Dube', role: 'Chief Compliance Officer' },
    { name: 'Pieter Jordaan', role: 'CTO' },
  ],
  sessionDate: Date.now(),
  discoveryType: 'new-opportunity',
  currentStageId: 1,
  stages: {
    0: { status: 'completed', completedAt: Date.now() - 3600000, data: null },
    1: {
      status: 'in-progress',
      data: {
        problemStatement: 'R150M annual fraud losses and 5-day onboarding cycles are driving churn and lost acquisition to neo-banks.',
        problemCategory: 'risk',
        affectedArea: 'multiple',
        desiredOutcome: 'Reduce fraud by 70%, same-day onboarding, improve cost-to-income ratio',
        successMetrics: ['Fraud loss reduction', 'Onboarding time', 'Customer acquisition cost', 'Cost-to-income ratio'],
        timelineExpectation: '12+-months',
        coi: {
          directCosts: { oneTime: 0, recurring: 12500000 },
          opportunityCosts: { oneTime: 0, recurring: 6250000 },
          riskCosts: { oneTime: 0, oneTimeProbability: 0, recurring: 0, recurringProbability: 0 },
          totalAnnual: 225000000,
        },
        scq: {
          situation: 'Mid-tier bank with legacy core systems and growing digital adoption; some Azure footprint but limited AI at scale.',
          complication: 'Fraud losses and slow onboarding create direct losses and competitive disadvantage, while regulatory expectations are increasing.',
          question: 'How do we deploy AI for fraud and onboarding with explainability, auditability, and appropriate human oversight?',
          status: 'pending',
        },
      },
    },
    2: { status: 'not-started', data: null },
    3: { status: 'not-started', data: null },
    4: { status: 'not-started', data: null },
    5: { status: 'not-started', data: null },
    6: { status: 'not-started', data: null },
    7: { status: 'not-started', data: null },
    8: { status: 'not-started', data: null },
  },
  allYellowLights: [],
  isLiveMode: false,
  isDemo: true,
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
  
  // EU Sector-Specific
  'dora': 'DORA',
  'nis2': 'NIS2 Directive',

  // US Sector-Specific
  'fedramp': 'FedRAMP',
  'finra': 'FINRA',
  'cpra': 'CPRA',
  'fda-samd': 'FDA SaMD',

  // International Standards
  'soc2': 'SOC 2',
  'iso-27001': 'ISO 27001',

  // Industry-Specific
  'msha': 'MSHA',
  'epa': 'EPA',
  'osha': 'OSHA',
  'nerc-cip': 'NERC CIP',
  'pci-dss': 'PCI DSS',
  
  // Australia
  'au-ai-ethics-framework': 'AU AI Ethics Framework',

  // Brazil
  'brazil-lgpd': 'Brazil LGPD',
  'brazil-ai-bill': 'Brazil AI Bill',

  // Singapore
  'singapore-ai-governance': 'Singapore AI Governance',

  // United Kingdom
  'uk-ai-regulation': 'UK AI Regulation',

  // Canada
  'canada-aida': 'Canada AIDA',

  // Japan
  'japan-ai-strategy': 'Japan AI Strategy',

  // India
  'india-dpdp': 'India DPDP Act',

  // UAE
  'uae-ai-strategy': 'UAE AI Strategy',

  // Kenya
  'kenya-dpa': 'Kenya DPA',

  // Nigeria
  'nigeria-ndpr': 'Nigeria NDPR',

  // China
  'china-ai-regulations': 'China AI Regulations',

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
  'technology-software': [
    {
      title: 'Developer Productivity Copilot',
      description: 'Deploy Microsoft 365 Copilot and developer copilots to accelerate code authoring, documentation, and knowledge transfer across engineering teams, improving throughput by 15-30%.',
      rationale: 'Engineering teams spend significant time on repetitive work and context switching; copilots improve velocity and quality.',
      aiRegulations: { applicableFrameworks: ['ms-copilot-governance', 'ms-responsible-ai', 'gdpr', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['access-control', 'mfa-required', 'audit-logging', 'encryption-in-transit'], dataClassification: 'internal' }
    },
    {
      title: 'AI Incident Triage & Root Cause Assistant',
      description: 'Use Azure OpenAI to summarize incidents from logs, tickets, and alerts; propose likely root causes and recommended remediation steps to reduce MTTR by 20-40%.',
      rationale: 'Fast, consistent triage reduces outage duration and improves customer experience.',
      aiRegulations: { applicableFrameworks: ['iso-42001', 'gdpr'], riskClassification: 'limited', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-control', 'audit-logging'], dataClassification: 'confidential' }
    },
    {
      title: 'Customer Support Knowledge Bot',
      description: 'Implement an AI support assistant that answers common questions from product docs and ticket history, reducing human handoffs and improving first-contact resolution.',
      rationale: 'Support organizations can deflect repetitive inquiries and respond faster with consistent answers.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'ccpa', 'iso-42001'], riskClassification: 'limited', jurisdictions: ['European Union', 'United States'] },
      cybersecurity: { securityRequirements: ['encryption-in-transit', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
    {
      title: 'Intelligent Code Review & Compliance Checks',
      description: 'Use AI to summarize pull requests, identify risky changes, enforce secure coding patterns, and generate evidence for compliance workflows without slowing delivery.',
      rationale: 'Shifts security left and reduces review bottlenecks while improving auditability.',
      aiRegulations: { applicableFrameworks: ['ms-responsible-ai', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union'] },
      cybersecurity: { securityRequirements: ['access-control', 'audit-logging', 'vulnerability-scanning', 'mfa-required'], dataClassification: 'internal' }
    },
    {
      title: 'SaaS Usage Analytics & Churn Prediction',
      description: 'Build predictive models to identify accounts at risk of churn based on product usage and engagement data, enabling proactive retention outreach.',
      rationale: 'Retention is cheaper than acquisition; early warning signals improve renewal outcomes.',
      aiRegulations: { applicableFrameworks: ['gdpr', 'ccpa', 'iso-42001'], riskClassification: 'minimal', jurisdictions: ['European Union', 'United States'] },
      cybersecurity: { securityRequirements: ['encryption-at-rest', 'access-control', 'audit-logging'], dataClassification: 'pii' }
    },
  ],
}

/**
 * Get fallback use cases for an industry when AI generation fails or returns empty
 */
export function getFallbackUseCasesForIndustry(industry: Industry): FallbackUseCase[] {
  return INDUSTRY_FALLBACK_USE_CASES[industry] || INDUSTRY_FALLBACK_USE_CASES.general
}

// ============================================================================
// DEMO MODE DATA - For Pre-filling Forms
// ============================================================================

export type DemoIndustry = 'mining' | 'retail' | 'financial'

/**
 * Demo notes for the Notes Analysis feature
 */
export const DEMO_NOTES: Record<DemoIndustry, string> = {
  mining: `Contoso Mining is a leading South African mining company operating 5 mine sites across Limpopo and Mpumalanga provinces with approximately 3,500 employees.

Current challenges:
- Equipment failures cause significant production losses - approximately R50 million annually from unplanned downtime
- Safety incidents remain a concern despite recent improvements in training programs
- Legacy systems don't integrate well, creating data silos between operations, maintenance, and safety teams
- Manual reporting processes take too long (2-3 days for equipment inspection reports) and often have errors
- Environmental compliance reporting is extremely time-consuming - about 40 hours per month per site

Technology landscape:
- SAP S/4HANA for ERP
- SCADA systems for equipment monitoring
- GIS mapping software
- Some IoT sensors on critical equipment (partial coverage)
- Microsoft 365 but not fully leveraged
- Maintenance uses mix of SAP PM and spreadsheets
- Safety reporting is still largely paper-based

Strategic goals:
- Zero fatalities (non-negotiable)
- 30% reduction in equipment downtime
- Real-time visibility into all operations
- Automated compliance reporting
- 15% improvement in ore extraction efficiency
- Carbon neutrality by 2030
- Technology leadership in African mining

Key stakeholders:
- Lindiwe Nkosi (COO) - Executive sponsor
- Sipho Mahlangu - Head of Digital Transformation
- Nomvula Dlamini - Safety Director
- Johan van Wyk - CTO

Regulatory requirements: Mine Health and Safety Act (MHSA), DMRE regulations, POPIA, environmental impact assessments. Any AI systems must be explainable for safety-critical decisions.`,

  retail: `Zava Retail operates 150 stores across Southern Africa with a growing e-commerce platform (currently 12% of revenue). Annual revenue approximately R6 billion.

Major pain points:
- Inventory management is our biggest challenge - R200M in shrinkage annually
- Stockouts causing lost sales estimated at R50M per month
- Customer experience is inconsistent across channels (in-store vs online vs mobile)
- Manual pricing and promotions processes take 2 weeks to execute across all stores
- Call centers handle 2 million calls monthly with poor first-call resolution

Current systems:
- SAP S/4HANA for ERP
- Oracle for supply chain management
- Legacy POS systems across stores (being modernized)
- Customer data fragmented across loyalty programs, POS, and e-commerce platforms
- 8 different systems that don't talk to each other well

Recent initiatives:
- Launched click-and-collect last year
- Piloting self-checkout in 20 stores
- Exploring personalized marketing but limited by data silos
- Board approved R100M for digital transformation over 3 years

Goals:
- Reduce shrinkage by 35%
- Increase self-service adoption from 23% to 60%
- Unified customer data platform for personalized offers
- Real-time inventory visibility across all stores
- Improve cost-to-income ratio

Key people:
- Naledi Khumalo (CDO) - driving digital transformation
- David Botha - Head of Merchandising
- Fatima Patel - Supply Chain Director
- Trevor Moloi - CIO`,

  financial: `Blue Yonder Financial is a mid-tier South African bank with 2 million retail customers and R80 billion in assets under management.

Critical issues:
- Fraud losses at R150M annually and growing 15% year-over-year
- Customer onboarding takes 5 days on average - losing prospects to neo-banks like TymeBank and Bank Zero
- Manual credit decisioning is slow (3-5 days) and inconsistent across branches
- AML compliance is resource-intensive - 50 analysts spending 70% of time on false positives
- Relationship managers spend 40% of time on administrative tasks instead of client engagement

Technology status:
- Core banking on legacy mainframe (30 years old)
- Modern digital banking layer for mobile and web
- Using Azure for some workloads but limited AI adoption
- Multiple disconnected systems for customer data
- Manual document processing for KYC (FICA compliance)

Digital progress:
- Launched mobile banking app last year (500K active users now)
- Exploring AI for credit scoring but concerned about regulatory implications
- Board wants to reduce cost-to-income ratio from 62% to 55% over 3 years

Regulatory environment:
- SARB oversight
- NCR compliance for credit decisions
- FICA for AML/KYC
- POPIA for data protection
- Any AI in credit must be explainable and auditable

Key stakeholders:
- Grace Moyo (CDIO) - Chief Digital & Innovation Officer
- Robert Steenkamp - Head of Credit Risk
- Zanele Dube - Chief Compliance Officer
- Pieter Jordaan - CTO`
}

/**
 * Demo process analysis data for AI Assessment Lite
 */
export const DEMO_PROCESS_ANALYSIS: Record<DemoIndustry, {
  processCandidates: string
  processNotes: string
  constraints: string
}> = {
  mining: {
    processCandidates: `Equipment maintenance scheduling and execution
Safety incident detection and response
Environmental compliance reporting
Shift handover and production reporting`,
    processNotes: `Current maintenance process is largely reactive - equipment fails, then we fix it. Maintenance technicians do scheduled inspections but often miss early warning signs because they rely on visual checks and experience rather than data.

When equipment does fail, it can take 4-8 hours just to diagnose the problem because we lack real-time sensor data integration. Parts availability is another issue - often the right parts aren't at the right site.

Safety monitoring is fragmented. Underground workers have basic tracking devices but no real-time health monitoring. CCTV coverage is about 40% of critical areas. Incident response relies on radio communication which can be unreliable underground.

Shift handovers are done verbally with paper checklists. Critical information sometimes gets lost between shifts, leading to repeated mistakes or safety near-misses.`,
    constraints: `- All AI decisions affecting safety must have human oversight and be explainable
- SCADA integration requires secure OPC-UA protocols (air-gapped for critical systems)
- Underground network connectivity is limited - need offline-capable solutions
- DMRE and MHSA compliance required for any changes to safety processes
- POPIA compliance for any employee data (biometrics, location)
- Union consultation required for significant process changes
- Some sites have 10+ year old equipment without modern sensors`
  },
  retail: {
    processCandidates: `Inventory replenishment and demand forecasting
Loss prevention and shrinkage control
Customer service and contact center operations
Pricing and promotions management`,
    processNotes: `Demand forecasting is done weekly using Excel spreadsheets and buyer intuition. Buyers look at last year's sales and adjust based on "gut feel". This leads to frequent stockouts on fast-movers and overstock on slow-movers.

Replenishment orders are generated overnight from SAP but don't account for local events, weather, or social media trends. By the time we react to a viral product on TikTok, it's too late.

Loss prevention relies on CCTV monitoring by security guards who are often distracted. Self-checkout is particularly vulnerable - we estimate 8% scan avoidance rate. Current LP analytics are retrospective (monthly shrinkage reports) not real-time.

Pricing changes require updating 150 store systems individually. A national promotion takes 2 weeks to fully roll out. Competitors can change prices in hours.

Contact center handles billing, order status, and complaints. 60% of calls are "where is my order" that could be self-service.`,
    constraints: `- POPIA compliance for customer data and video surveillance
- PCI-DSS for payment processing
- Cannot use AI for discriminatory pricing based on demographics
- Must maintain pricing consistency across channels (legal requirement)
- Legacy POS at 80 stores cannot be easily integrated
- Union agreement limits certain types of monitoring
- Multi-tenancy requirements for franchised stores`
  },
  financial: {
    processCandidates: `Fraud detection and transaction monitoring
Customer onboarding and KYC verification
Credit application and decisioning
AML alert investigation and SAR filing`,
    processNotes: `Fraud detection uses rule-based system from 2015. Rules are static and criminals adapt faster than we can update them. False positive rate is 95% - for every 100 alerts, only 5 are actual fraud. This wastes investigator time and delays legitimate transactions.

Customer onboarding requires physical document submission to a branch. Documents are scanned, emailed to back office, manually verified (often taking 24 hours), then returned. Common issues: poor scan quality, missing documents, incorrect form versions.

Credit decisioning uses traditional scorecard models. We reject many "thin file" customers (young people, immigrants) who are actually creditworthy but don't have enough history. Meanwhile, we approve some who later default because the scorecard doesn't catch certain patterns.

AML investigators spend hours on each alert writing narratives for SARs. The narrative is often copy-paste from previous cases. Some alerts sit in queue for weeks during peak periods.

Relationship managers prepare for client meetings by manually pulling data from 5 different systems into PowerPoint. This takes 2-3 hours per meeting.`,
    constraints: `- SARB approval needed for AI in credit decisioning
- All credit decisions must be explainable to customers (NCR requirement)
- FICA requires specific KYC checks and audit trails
- Fraud models must not introduce bias (fair lending)
- Data residency - customer data must stay in South Africa
- Core banking integration requires careful change management (mainframe)
- Strict SLAs on transaction processing (cannot add latency)
- Need to maintain full audit trail for regulatory examination`
  }
}

/**
 * Demo session metadata for each industry
 */
export const DEMO_SESSION_METADATA_BY_INDUSTRY: Record<DemoIndustry, SessionMetadata> = {
  mining: {
    customerName: 'Contoso Mining',
    innovationHubSPOC: 'Thabo Molefe',
    primaryStakeholder: 'Lindiwe Nkosi (Chief Operations Officer)',
    accountTeamRep: 'Sarah van der Merwe',
    innovationHubLocation: 'Johannesburg, South Africa',
    solutionEngineer: 'James Ndlovu',
    stockTicker: 'CTM.JSE',
  },
  retail: {
    customerName: 'Zava Retail',
    innovationHubSPOC: 'Themba Mokoena',
    primaryStakeholder: 'Naledi Khumalo (Chief Digital Officer)',
    accountTeamRep: 'Michael du Plessis',
    innovationHubLocation: 'Cape Town, South Africa',
    solutionEngineer: 'Priya Naidoo',
    stockTicker: 'ZVR.JSE',
  },
  financial: {
    customerName: 'Blue Yonder Financial',
    innovationHubSPOC: 'Kagiso Mabena',
    primaryStakeholder: 'Grace Moyo (Chief Digital & Innovation Officer)',
    accountTeamRep: 'Anele Sithole',
    innovationHubLocation: 'Sandton, South Africa',
    solutionEngineer: 'Reuben Govender',
    stockTicker: 'BYF.JSE',
  },
}

/**
 * Demo discovery responses by industry for Quick Discovery
 */
export const DEMO_DISCOVERY_RESPONSES_BY_INDUSTRY: Record<DemoIndustry, DiscoveryResponse[]> = {
  mining: DEMO_DISCOVERY_RESPONSES,
  retail: DEMO_RETAIL_RESPONSES,
  financial: DEMO_FINANCIAL_RESPONSES,
}

/**
 * Helper to get all demo data for a specific industry
 */
export function getDemoDataForIndustry(industry: DemoIndustry) {
  const sessionMap = {
    mining: { session: DEMO_DISCOVERY_SESSION, useCases: DEMO_USE_CASES, enterpriseSession: DEMO_ENTERPRISE_SESSION },
    retail: { session: DEMO_RETAIL_SESSION, useCases: DEMO_RETAIL_USE_CASES, enterpriseSession: DEMO_RETAIL_ENTERPRISE_SESSION },
    financial: { session: DEMO_FINANCIAL_SESSION, useCases: DEMO_FINANCIAL_USE_CASES, enterpriseSession: DEMO_FINANCIAL_ENTERPRISE_SESSION },
  }
  
  return {
    ...sessionMap[industry],
    notes: DEMO_NOTES[industry],
    processAnalysis: DEMO_PROCESS_ANALYSIS[industry],
    sessionMetadata: DEMO_SESSION_METADATA_BY_INDUSTRY[industry],
    discoveryResponses: DEMO_DISCOVERY_RESPONSES_BY_INDUSTRY[industry],
  }
}
