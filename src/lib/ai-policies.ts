/**
 * AI Policy Framework Reference Data
 * 
 * This file contains comprehensive information about AI regulations, policies,
 * and guidelines from various jurisdictions and organizations.
 * 
 * DISCLAIMER: This information is provided for educational and planning purposes only.
 * It does not constitute legal advice. Organizations should consult with qualified
 * legal professionals for specific compliance requirements.
 */

// ============================================================================
// EXPANDED AI REGULATION FRAMEWORK TYPES
// ============================================================================

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

export type PolicyJurisdiction = 
  | 'global'
  | 'africa'
  | 'african-union'
  | 'south-africa'
  | 'european-union'
  | 'united-states'
  | 'united-kingdom'
  | 'asia-pacific'

export type PolicyStatus = 
  | 'enacted'           // Fully in force
  | 'partially-enacted' // Some provisions active
  | 'draft'             // Published draft, not yet enacted
  | 'proposed'          // Under development
  | 'voluntary'         // Voluntary guidelines

export type PolicyCategory =
  | 'regulation'        // Legally binding regulation
  | 'legislation'       // Law/Act
  | 'standard'          // Industry standard (ISO, etc.)
  | 'guideline'         // Non-binding guidance
  | 'framework'         // Risk/governance framework
  | 'strategy'          // National/regional strategy
  | 'corporate'         // Corporate policy

// ============================================================================
// POLICY DETAILS INTERFACE
// ============================================================================

export interface AIPolicyDetails {
  id: AIRegulationFramework
  name: string
  shortName: string
  description: string
  jurisdiction: PolicyJurisdiction
  status: PolicyStatus
  category: PolicyCategory
  effectiveDate?: string
  keyRequirements: string[]
  applicableSectors?: string[]
  riskClassifications?: string[]
  penaltiesOrEnforcement?: string
  complianceActions?: string[]
  officialUrl?: string
  lastUpdated: string
}

// ============================================================================
// COMPREHENSIVE POLICY DATABASE
// ============================================================================

export const AI_POLICIES: Record<AIRegulationFramework, AIPolicyDetails> = {
  // ============ INTERNATIONAL/GLOBAL ============
  'oecd-ai-principles': {
    id: 'oecd-ai-principles',
    name: 'OECD Principles on Artificial Intelligence',
    shortName: 'OECD AI Principles',
    description: 'First intergovernmental standard on AI, adopted by 46 countries. Establishes core principles for trustworthy AI including transparency, accountability, and human-centered values.',
    jurisdiction: 'global',
    status: 'voluntary',
    category: 'guideline',
    effectiveDate: '2019-05-22',
    keyRequirements: [
      'AI should benefit people and the planet',
      'AI systems should be transparent and explainable',
      'AI actors should be accountable for proper functioning',
      'AI systems should be robust, secure, and safe',
      'Human oversight must be maintained'
    ],
    applicableSectors: ['All sectors'],
    officialUrl: 'https://oecd.ai/en/ai-principles',
    lastUpdated: '2024-05-01'
  },

  'unesco-ai-ethics': {
    id: 'unesco-ai-ethics',
    name: 'UNESCO Recommendation on the Ethics of AI',
    shortName: 'UNESCO AI Ethics',
    description: 'First global normative instrument on AI ethics, adopted by 193 member states. Provides a comprehensive framework for ethical AI development and governance.',
    jurisdiction: 'global',
    status: 'voluntary',
    category: 'guideline',
    effectiveDate: '2021-11-23',
    keyRequirements: [
      'Proportionality and do no harm',
      'Safety and security throughout lifecycle',
      'Right to privacy and data protection',
      'Human oversight and determination',
      'Transparency and explainability',
      'Responsibility and accountability',
      'Inclusiveness and diversity'
    ],
    officialUrl: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
    lastUpdated: '2024-01-01'
  },

  'iso-42001': {
    id: 'iso-42001',
    name: 'ISO/IEC 42001 AI Management System',
    shortName: 'ISO 42001',
    description: 'International standard specifying requirements for establishing, implementing, maintaining, and continually improving an AI Management System (AIMS).',
    jurisdiction: 'global',
    status: 'enacted',
    category: 'standard',
    effectiveDate: '2023-12-18',
    keyRequirements: [
      'Establish AI policy and objectives',
      'Risk assessment and treatment for AI systems',
      'Data quality and governance requirements',
      'Transparency and explainability measures',
      'Human oversight mechanisms',
      'Continuous monitoring and improvement'
    ],
    complianceActions: [
      'Conduct AI risk assessment',
      'Establish AI governance committee',
      'Implement AI lifecycle documentation',
      'Deploy monitoring and audit processes'
    ],
    officialUrl: 'https://www.iso.org/standard/81230.html',
    lastUpdated: '2024-06-01'
  },

  // ============ AFRICAN UNION & AFRICA ============
  'au-ai-strategy': {
    id: 'au-ai-strategy',
    name: 'African Union Continental AI Strategy',
    shortName: 'AU AI Strategy',
    description: 'Africa\'s comprehensive continental strategy for AI development, aiming to position Africa as a global player in AI while ensuring ethical, inclusive, and sustainable development aligned with Agenda 2063.',
    jurisdiction: 'african-union',
    status: 'enacted',
    category: 'strategy',
    effectiveDate: '2024-02-01',
    keyRequirements: [
      'AI development aligned with African values and Ubuntu philosophy',
      'Data sovereignty and protection of African data',
      'Capacity building and skills development across the continent',
      'Inclusive AI that addresses gender and regional disparities',
      'Cross-border data governance frameworks',
      'AI for sustainable development and climate action',
      'Local AI ecosystem development and innovation hubs'
    ],
    applicableSectors: ['Agriculture', 'Healthcare', 'Education', 'Finance', 'Mining', 'Manufacturing'],
    complianceActions: [
      'Align AI initiatives with AU strategy pillars',
      'Consider pan-African data governance requirements',
      'Support local AI capacity building',
      'Ensure inclusivity in AI deployment'
    ],
    officialUrl: 'https://au.int/en/documents/artificial-intelligence',
    lastUpdated: '2024-02-01'
  },

  'au-data-policy': {
    id: 'au-data-policy',
    name: 'African Union Data Policy Framework',
    shortName: 'AU Data Policy',
    description: 'Continental framework for data governance, emphasizing data sovereignty, cross-border data flows, and the protection of African data resources.',
    jurisdiction: 'african-union',
    status: 'enacted',
    category: 'framework',
    effectiveDate: '2022-02-01',
    keyRequirements: [
      'Data sovereignty for African nations',
      'Harmonized data protection across member states',
      'Framework for cross-border data transfers',
      'Open data initiatives with appropriate safeguards',
      'Capacity for data centers within Africa',
      'Protection against data colonialism'
    ],
    complianceActions: [
      'Assess data storage and processing locations',
      'Implement data localization where required',
      'Establish cross-border data transfer agreements'
    ],
    lastUpdated: '2024-01-01'
  },

  'smart-africa': {
    id: 'smart-africa',
    name: 'Smart Africa Alliance AI Blueprint',
    shortName: 'Smart Africa AI',
    description: 'Pan-African initiative for responsible AI adoption, focusing on infrastructure development, skills building, and harmonized regulatory approaches.',
    jurisdiction: 'africa',
    status: 'voluntary',
    category: 'framework',
    effectiveDate: '2021-05-01',
    keyRequirements: [
      'Harmonized AI regulations across member countries',
      'Shared infrastructure and computing resources',
      'Pan-African data exchange frameworks',
      'AI for SDGs and continental development goals',
      'Youth and gender inclusion in AI'
    ],
    officialUrl: 'https://smartafrica.org/',
    lastUpdated: '2024-01-01'
  },

  // ============ SOUTH AFRICA ============
  'sa-ai-policy-draft': {
    id: 'sa-ai-policy-draft',
    name: 'South Africa National AI Policy Framework (Draft)',
    shortName: 'SA AI Policy',
    description: 'South Africa\'s draft national AI policy establishing governance framework for AI development and deployment, emphasizing human-centric AI, ethics, and inclusive development.',
    jurisdiction: 'south-africa',
    status: 'draft',
    category: 'strategy',
    effectiveDate: '2024-03-01',
    keyRequirements: [
      'Human-centric AI development and deployment',
      'AI ethics aligned with Constitutional values',
      'Transparency and explainability requirements',
      'Protection of fundamental rights',
      'Addressing historical inequalities through AI',
      'Data governance aligned with POPIA',
      'Skills development and job transition support',
      'Public sector AI governance framework',
      'AI in critical infrastructure safeguards'
    ],
    applicableSectors: ['All sectors', 'Public sector priority'],
    riskClassifications: [
      'Unacceptable risk: AI violating Constitutional rights',
      'High risk: AI in justice, healthcare, employment',
      'Medium risk: AI affecting public services',
      'Low risk: General-purpose AI applications'
    ],
    complianceActions: [
      'Conduct AI impact assessments',
      'Ensure POPIA compliance for AI data processing',
      'Implement transparency measures',
      'Establish human oversight mechanisms',
      'Consider B-BBEE implications in AI deployment'
    ],
    officialUrl: 'https://www.dcdt.gov.za/',
    lastUpdated: '2024-03-01'
  },

  'popia': {
    id: 'popia',
    name: 'Protection of Personal Information Act',
    shortName: 'POPIA',
    description: 'South Africa\'s comprehensive data protection legislation, governing the processing of personal information and establishing rights for data subjects.',
    jurisdiction: 'south-africa',
    status: 'enacted',
    category: 'legislation',
    effectiveDate: '2021-07-01',
    keyRequirements: [
      'Lawful basis for processing personal information',
      'Purpose specification and limitation',
      'Information quality and accuracy',
      'Openness about processing activities',
      'Security safeguards for personal information',
      'Data subject participation rights',
      'Cross-border transfer restrictions',
      'Automated decision-making transparency'
    ],
    penaltiesOrEnforcement: 'Fines up to R10 million; criminal penalties up to 10 years imprisonment; civil liability',
    complianceActions: [
      'Appoint Information Officer',
      'Register with Information Regulator',
      'Implement PAIA compliance',
      'Conduct Privacy Impact Assessments',
      'Ensure lawful basis for AI training data'
    ],
    officialUrl: 'https://popia.co.za/',
    lastUpdated: '2024-01-01'
  },

  'ecta': {
    id: 'ecta',
    name: 'Electronic Communications and Transactions Act',
    shortName: 'ECTA',
    description: 'South African legislation governing electronic transactions, digital signatures, and aspects of cybersecurity relevant to AI systems.',
    jurisdiction: 'south-africa',
    status: 'enacted',
    category: 'legislation',
    effectiveDate: '2002-08-30',
    keyRequirements: [
      'Legal recognition of electronic transactions',
      'Cybercrime provisions applicable to AI',
      'Consumer protection in electronic commerce',
      'Critical database protection'
    ],
    lastUpdated: '2024-01-01'
  },

  'dmre': {
    id: 'dmre',
    name: 'Department of Mineral Resources Regulations',
    shortName: 'DMRE Regulations',
    description: 'South African mining sector regulations with implications for AI in mining operations, safety, and environmental monitoring.',
    jurisdiction: 'south-africa',
    status: 'enacted',
    category: 'regulation',
    keyRequirements: [
      'Mine Health and Safety compliance',
      'Environmental impact management',
      'Community consultation requirements',
      'B-BBEE compliance in procurement'
    ],
    applicableSectors: ['Mining', 'Resources'],
    lastUpdated: '2024-01-01'
  },

  'sahpra': {
    id: 'sahpra',
    name: 'South African Health Products Regulatory Authority',
    shortName: 'SAHPRA',
    description: 'Regulatory authority for health products including AI/ML-based medical devices and diagnostic systems.',
    jurisdiction: 'south-africa',
    status: 'enacted',
    category: 'regulation',
    keyRequirements: [
      'Registration of AI medical devices',
      'Clinical validation requirements',
      'Post-market surveillance',
      'Adverse event reporting'
    ],
    applicableSectors: ['Healthcare', 'Medical devices'],
    lastUpdated: '2024-01-01'
  },

  // ============ EUROPEAN UNION ============
  'eu-ai-act': {
    id: 'eu-ai-act',
    name: 'European Union Artificial Intelligence Act',
    shortName: 'EU AI Act',
    description: 'World\'s first comprehensive AI regulation, establishing a risk-based framework for AI systems with mandatory requirements based on risk levels.',
    jurisdiction: 'european-union',
    status: 'enacted',
    category: 'regulation',
    effectiveDate: '2024-08-01',
    keyRequirements: [
      'Risk-based classification of AI systems',
      'Prohibited AI practices (social scoring, manipulative AI)',
      'High-risk AI: conformity assessments, documentation, transparency',
      'General-purpose AI: transparency and copyright obligations',
      'Right to explanation for AI decisions',
      'Human oversight requirements',
      'Fundamental rights impact assessments'
    ],
    riskClassifications: [
      'Unacceptable: Banned (social scoring, real-time biometric identification)',
      'High-risk: Strict requirements (healthcare, employment, law enforcement)',
      'Limited: Transparency obligations (chatbots, deepfakes)',
      'Minimal: No specific requirements'
    ],
    penaltiesOrEnforcement: 'Up to €35 million or 7% of global annual turnover for prohibited practices; €15 million or 3% for other violations',
    complianceActions: [
      'Classify all AI systems by risk level',
      'Conduct conformity assessments for high-risk AI',
      'Implement technical documentation',
      'Establish quality management systems',
      'Register high-risk AI in EU database'
    ],
    officialUrl: 'https://artificialintelligenceact.eu/',
    lastUpdated: '2024-08-01'
  },

  'gdpr': {
    id: 'gdpr',
    name: 'General Data Protection Regulation',
    shortName: 'GDPR',
    description: 'EU\'s comprehensive data protection regulation with significant implications for AI systems processing personal data.',
    jurisdiction: 'european-union',
    status: 'enacted',
    category: 'regulation',
    effectiveDate: '2018-05-25',
    keyRequirements: [
      'Lawful basis for processing (consent, legitimate interest)',
      'Data minimization and purpose limitation',
      'Right to explanation for automated decisions (Art. 22)',
      'Data Protection Impact Assessments for high-risk processing',
      'Privacy by design and default',
      'Cross-border transfer mechanisms'
    ],
    penaltiesOrEnforcement: 'Up to €20 million or 4% of global annual turnover',
    complianceActions: [
      'Conduct DPIA for AI systems',
      'Implement Art. 22 safeguards for automated decisions',
      'Ensure lawful basis for AI training data',
      'Enable data subject rights'
    ],
    officialUrl: 'https://gdpr.eu/',
    lastUpdated: '2024-01-01'
  },

  // ============ UNITED STATES ============
  'nist-ai-rmf': {
    id: 'nist-ai-rmf',
    name: 'NIST AI Risk Management Framework',
    shortName: 'NIST AI RMF',
    description: 'Voluntary framework providing guidance for managing AI risks throughout the AI lifecycle, organized around Govern, Map, Measure, and Manage functions.',
    jurisdiction: 'united-states',
    status: 'voluntary',
    category: 'framework',
    effectiveDate: '2023-01-26',
    keyRequirements: [
      'GOVERN: Establish AI governance structures and culture',
      'MAP: Identify and document AI risks in context',
      'MEASURE: Analyze and assess AI risks',
      'MANAGE: Prioritize and respond to AI risks'
    ],
    complianceActions: [
      'Establish AI governance committee',
      'Conduct AI risk mapping exercises',
      'Implement risk measurement metrics',
      'Deploy risk mitigation strategies'
    ],
    officialUrl: 'https://www.nist.gov/itl/ai-risk-management-framework',
    lastUpdated: '2024-04-01'
  },

  'white-house-eo': {
    id: 'white-house-eo',
    name: 'Executive Order on Safe, Secure, and Trustworthy AI',
    shortName: 'US AI Executive Order',
    description: 'Presidential executive order establishing new standards for AI safety, security, and trustworthiness, with requirements for federal agencies and guidelines for private sector.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'regulation',
    effectiveDate: '2023-10-30',
    keyRequirements: [
      'Safety testing and red-teaming for advanced AI',
      'Reporting requirements for dual-use foundation models',
      'Cybersecurity standards for AI',
      'AI workforce and immigration policies',
      'Consumer protection from AI fraud',
      'Equity and civil rights in AI'
    ],
    applicableSectors: ['Federal government', 'Critical infrastructure', 'Healthcare', 'Finance'],
    officialUrl: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/',
    lastUpdated: '2024-01-01'
  },

  'ccpa': {
    id: 'ccpa',
    name: 'California Consumer Privacy Act',
    shortName: 'CCPA/CPRA',
    description: 'California privacy law with implications for AI systems processing consumer data, including automated decision-making provisions.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'legislation',
    effectiveDate: '2020-01-01',
    keyRequirements: [
      'Opt-out rights for automated decision-making',
      'Transparency about profiling',
      'Right to access information about automated decisions',
      'Data minimization requirements'
    ],
    penaltiesOrEnforcement: 'Up to $7,500 per intentional violation',
    lastUpdated: '2024-01-01'
  },

  'hipaa': {
    id: 'hipaa',
    name: 'Health Insurance Portability and Accountability Act',
    shortName: 'HIPAA',
    description: 'US healthcare privacy law with specific implications for AI in healthcare settings.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'legislation',
    effectiveDate: '1996-08-21',
    keyRequirements: [
      'Protected Health Information safeguards',
      'Business Associate Agreements for AI vendors',
      'Minimum necessary standard for data use',
      'Patient rights to access and amend'
    ],
    applicableSectors: ['Healthcare'],
    lastUpdated: '2024-01-01'
  },

  'sox': {
    id: 'sox',
    name: 'Sarbanes-Oxley Act',
    shortName: 'SOX',
    description: 'US financial regulation with implications for AI in financial reporting and internal controls.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'legislation',
    effectiveDate: '2002-07-30',
    keyRequirements: [
      'Internal controls over financial AI systems',
      'Audit trail requirements',
      'CEO/CFO certification of AI-generated reports'
    ],
    applicableSectors: ['Finance', 'Public companies'],
    lastUpdated: '2024-01-01'
  },

  'ferpa': {
    id: 'ferpa',
    name: 'Family Educational Rights and Privacy Act',
    shortName: 'FERPA',
    description: 'US education privacy law affecting AI in educational settings.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'legislation',
    applicableSectors: ['Education'],
    keyRequirements: [
      'Student data protection in AI systems',
      'Parental consent requirements',
      'Limitations on AI-based profiling'
    ],
    lastUpdated: '2024-01-01'
  },

  'glba': {
    id: 'glba',
    name: 'Gramm-Leach-Bliley Act',
    shortName: 'GLBA',
    description: 'US financial privacy law affecting AI in financial services.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'legislation',
    applicableSectors: ['Finance'],
    keyRequirements: [
      'Financial privacy notices for AI processing',
      'Safeguards for customer information',
      'Opt-out rights for information sharing'
    ],
    lastUpdated: '2024-01-01'
  },

  // ============ INDUSTRY-SPECIFIC ============
  'msha': {
    id: 'msha',
    name: 'Mine Safety and Health Administration',
    shortName: 'MSHA',
    description: 'US mining safety regulations with implications for AI in mining operations.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'regulation',
    applicableSectors: ['Mining'],
    keyRequirements: [
      'Safety systems validation requirements',
      'Worker training for AI systems',
      'Incident reporting for AI failures'
    ],
    lastUpdated: '2024-01-01'
  },

  'epa': {
    id: 'epa',
    name: 'Environmental Protection Agency Regulations',
    shortName: 'EPA',
    description: 'US environmental regulations affecting AI in environmental monitoring and compliance.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'regulation',
    applicableSectors: ['Environmental', 'Manufacturing', 'Mining'],
    keyRequirements: [
      'Environmental monitoring accuracy standards',
      'Reporting requirements for AI systems',
      'Validation of AI environmental models'
    ],
    lastUpdated: '2024-01-01'
  },

  'osha': {
    id: 'osha',
    name: 'Occupational Safety and Health Administration',
    shortName: 'OSHA',
    description: 'US workplace safety regulations with implications for AI in occupational settings.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'regulation',
    keyRequirements: [
      'Worker safety in AI-automated environments',
      'Training requirements for AI systems',
      'Hazard communication for AI risks'
    ],
    lastUpdated: '2024-01-01'
  },

  'nerc-cip': {
    id: 'nerc-cip',
    name: 'NERC Critical Infrastructure Protection',
    shortName: 'NERC CIP',
    description: 'Cybersecurity standards for the bulk electric system with implications for AI in energy infrastructure.',
    jurisdiction: 'united-states',
    status: 'enacted',
    category: 'standard',
    applicableSectors: ['Energy', 'Utilities'],
    keyRequirements: [
      'Cybersecurity controls for AI in grid systems',
      'Access management for AI systems',
      'Incident response for AI failures'
    ],
    lastUpdated: '2024-01-01'
  },

  'pci-dss': {
    id: 'pci-dss',
    name: 'Payment Card Industry Data Security Standard',
    shortName: 'PCI DSS',
    description: 'Payment card security standard with requirements for AI processing payment data.',
    jurisdiction: 'global',
    status: 'enacted',
    category: 'standard',
    applicableSectors: ['Finance', 'Retail', 'E-commerce'],
    keyRequirements: [
      'Encryption for cardholder data in AI systems',
      'Access controls and authentication',
      'Logging and monitoring of AI transactions',
      'Vulnerability management for AI'
    ],
    lastUpdated: '2024-01-01'
  },

  // ============ MICROSOFT & TECHNOLOGY ============
  'ms-responsible-ai': {
    id: 'ms-responsible-ai',
    name: 'Microsoft Responsible AI Standard v2',
    shortName: 'MS RAI Standard',
    description: 'Microsoft\'s internal standard for developing and deploying AI systems responsibly, applicable to all Microsoft products and recommended for partners.',
    jurisdiction: 'global',
    status: 'enacted',
    category: 'corporate',
    effectiveDate: '2022-06-01',
    keyRequirements: [
      'Accountability: Clear roles and human oversight',
      'Transparency: Explainability and documentation',
      'Fairness: Bias assessment and mitigation',
      'Reliability & Safety: Testing and monitoring',
      'Privacy & Security: Data protection measures',
      'Inclusiveness: Accessible and inclusive design'
    ],
    complianceActions: [
      'Complete Responsible AI Impact Assessment',
      'Engage Responsible AI review for sensitive uses',
      'Implement fairness testing',
      'Deploy transparency mechanisms',
      'Establish incident response procedures'
    ],
    officialUrl: 'https://www.microsoft.com/en-us/ai/responsible-ai',
    lastUpdated: '2024-01-01'
  },

  'ms-ai-principles': {
    id: 'ms-ai-principles',
    name: 'Microsoft AI Principles',
    shortName: 'MS AI Principles',
    description: 'Microsoft\'s six core principles guiding AI development and deployment: Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, and Accountability.',
    jurisdiction: 'global',
    status: 'voluntary',
    category: 'guideline',
    keyRequirements: [
      'Fairness: AI systems should treat all people fairly',
      'Reliability & Safety: AI systems should perform reliably and safely',
      'Privacy & Security: AI systems should be secure and respect privacy',
      'Inclusiveness: AI systems should empower everyone',
      'Transparency: AI systems should be understandable',
      'Accountability: People should be accountable for AI systems'
    ],
    officialUrl: 'https://www.microsoft.com/en-us/ai/our-approach',
    lastUpdated: '2024-01-01'
  },

  'ms-copilot-governance': {
    id: 'ms-copilot-governance',
    name: 'Microsoft Copilot Governance Framework',
    shortName: 'Copilot Governance',
    description: 'Guidelines for governing Microsoft Copilot and AI assistant deployments in enterprise environments.',
    jurisdiction: 'global',
    status: 'voluntary',
    category: 'framework',
    keyRequirements: [
      'Data classification and access controls',
      'User training and acceptable use policies',
      'Monitoring and audit logging',
      'Sensitive content filters',
      'Integration with existing governance'
    ],
    complianceActions: [
      'Establish Copilot governance committee',
      'Define acceptable use policies',
      'Configure data access and sharing controls',
      'Implement user training programs'
    ],
    officialUrl: 'https://learn.microsoft.com/en-us/copilot/',
    lastUpdated: '2024-01-01'
  },

  'other': {
    id: 'other',
    name: 'Other Regulations',
    shortName: 'Other',
    description: 'Other applicable regulations not specifically listed.',
    jurisdiction: 'global',
    status: 'voluntary',
    category: 'guideline',
    keyRequirements: [],
    lastUpdated: '2024-01-01'
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPoliciesByJurisdiction(jurisdiction: PolicyJurisdiction): AIPolicyDetails[] {
  return Object.values(AI_POLICIES).filter(p => p.jurisdiction === jurisdiction)
}

export function getPoliciesBySector(sector: string): AIPolicyDetails[] {
  return Object.values(AI_POLICIES).filter(
    p => !p.applicableSectors || p.applicableSectors.includes('All sectors') || p.applicableSectors.includes(sector)
  )
}

export function getEnactedPolicies(): AIPolicyDetails[] {
  return Object.values(AI_POLICIES).filter(p => p.status === 'enacted' || p.status === 'partially-enacted')
}

export function getAfricanPolicies(): AIPolicyDetails[] {
  return Object.values(AI_POLICIES).filter(
    p => p.jurisdiction === 'africa' || p.jurisdiction === 'african-union' || p.jurisdiction === 'south-africa'
  )
}

export function getMicrosoftPolicies(): AIPolicyDetails[] {
  return Object.values(AI_POLICIES).filter(
    p => p.id.startsWith('ms-')
  )
}

export function getPolicyById(id: AIRegulationFramework): AIPolicyDetails | undefined {
  return AI_POLICIES[id]
}

// ============================================================================
// DISCLAIMERS
// ============================================================================

export const DISCLAIMERS = {
  general: {
    title: 'Important Disclaimer',
    text: `This assessment report is generated using AI-powered analysis tools provided by Microsoft Innovation Hub. The recommendations, insights, and analyses contained herein are intended for informational and planning purposes only and should not be construed as professional advice.

Organizations are advised to conduct their own due diligence and consult with appropriate professionals (legal, technical, financial, regulatory) before making any decisions based on this report.`
  },
  
  aiGenerated: {
    title: 'AI-Generated Content Notice',
    text: `Portions of this report, including executive summaries, use case rationales, and recommendations, have been generated using artificial intelligence (specifically OpenAI GPT-4). While every effort has been made to ensure accuracy, AI-generated content may contain errors or omissions.

All AI-generated content should be reviewed and validated by qualified personnel before use in decision-making processes.`
  },
  
  notLegalAdvice: {
    title: 'Not Legal or Regulatory Advice',
    text: `The regulatory and compliance information presented in this report is provided for educational purposes only and does not constitute legal advice. Regulatory requirements vary by jurisdiction and industry, and are subject to change.

Organizations should consult with qualified legal professionals and regulatory experts to ensure compliance with applicable laws and regulations.`
  },
  
  notFinancialAdvice: {
    title: 'Not Financial Advice',
    text: `Any financial projections, ROI estimates, cost savings, or business case information in this report are illustrative only and based on assumptions that may not apply to your specific situation.

This report does not constitute financial advice. Organizations should conduct their own financial analysis and consult with qualified financial professionals.`
  },
  
  confidentiality: {
    title: 'Confidentiality',
    text: `This report may contain confidential business information. Distribution should be limited to authorized personnel only. Microsoft Innovation Hub is not responsible for any unauthorized disclosure or use of this information.`
  },
  
  microsoftPosition: {
    title: 'Microsoft Position',
    text: `This assessment is provided as part of Microsoft's Innovation Hub engagement activities. The views and recommendations expressed do not necessarily reflect the official position of Microsoft Corporation.

Microsoft makes no warranties, express or implied, regarding the accuracy, completeness, or suitability of the information provided.`
  },

  southAfrica: {
    title: 'South Africa Specific Notice',
    text: `For deployments in South Africa, organizations must ensure compliance with the Protection of Personal Information Act (POPIA), the Electronic Communications and Transactions Act (ECTA), and other applicable legislation.

The South African Draft National AI Policy provides guidance on AI governance that organizations should consider. AI systems processing personal information must comply with POPIA requirements including purpose specification, data minimization, and data subject rights.`
  },

  africaRegion: {
    title: 'Africa Region Notice',
    text: `AI deployments across African jurisdictions should consider the African Union Continental AI Strategy and relevant national policies. Data sovereignty, cross-border data transfer, and local capacity building are key considerations.

Organizations should engage with local regulators and stakeholders to ensure responsible AI deployment that aligns with African values and development priorities.`
  }
}

export type DisclaimerKey = keyof typeof DISCLAIMERS

export function getDisclaimersByContext(context: {
  hasAIContent?: boolean
  hasFinancials?: boolean
  jurisdictions?: PolicyJurisdiction[]
}): Array<{ key: DisclaimerKey; disclaimer: typeof DISCLAIMERS[DisclaimerKey] }> {
  const result: Array<{ key: DisclaimerKey; disclaimer: typeof DISCLAIMERS[DisclaimerKey] }> = []
  
  // Always include general disclaimer
  result.push({ key: 'general', disclaimer: DISCLAIMERS.general })
  
  // AI content disclaimer
  if (context.hasAIContent) {
    result.push({ key: 'aiGenerated', disclaimer: DISCLAIMERS.aiGenerated })
  }
  
  // Financial disclaimer
  if (context.hasFinancials) {
    result.push({ key: 'notFinancialAdvice', disclaimer: DISCLAIMERS.notFinancialAdvice })
  }
  
  // Jurisdiction-specific
  if (context.jurisdictions?.includes('south-africa')) {
    result.push({ key: 'southAfrica', disclaimer: DISCLAIMERS.southAfrica })
  }
  if (context.jurisdictions?.includes('africa') || context.jurisdictions?.includes('african-union')) {
    result.push({ key: 'africaRegion', disclaimer: DISCLAIMERS.africaRegion })
  }
  
  // Always include not legal advice and Microsoft position
  result.push({ key: 'notLegalAdvice', disclaimer: DISCLAIMERS.notLegalAdvice })
  result.push({ key: 'microsoftPosition', disclaimer: DISCLAIMERS.microsoftPosition })
  
  return result
}
