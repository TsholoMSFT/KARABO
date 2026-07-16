/**
 * Regulatory Compliance Engine
 * 
 * Pure-logic module for assessing AI use case risk against global regulatory frameworks.
 * Deterministic checks — no AI calls. Used alongside AI-enriched assessments for defense-in-depth.
 * 
 * Coverage: EU AI Act, NIST AI RMF, POPIA, GDPR, AU AI Ethics, Brazil LGPD,
 * Singapore AI Governance, UK AI Regulation, Canada AIDA, and 20+ additional frameworks.
 */

import type {
  AIRegulationFramework,
  AIRiskLevel,
  UseCase,
  Industry,
  FrameworkAssessment,
  RemediationOption,
  RegulatoryAssessment,
  ComplianceEnforcement,
} from './types'

// Defined here (not in demo-data) to avoid circular dependency
export const INDUSTRY_REGULATIONS: Record<Industry, AIRegulationFramework[]> = {
  general: ['gdpr', 'iso-42001', 'oecd-ai-principles'],
  healthcare: ['hipaa', 'gdpr', 'eu-ai-act', 'iso-42001'],
  'financial-services': ['sox', 'glba', 'pci-dss', 'gdpr', 'eu-ai-act'],
  manufacturing: ['osha', 'epa', 'iso-42001', 'gdpr'],
  retail: ['pci-dss', 'gdpr', 'ccpa', 'popia'],
  government: ['nist-ai-rmf', 'white-house-eo', 'gdpr', 'popia'],
  education: ['ferpa', 'gdpr', 'popia', 'iso-42001'],
  energy: ['nerc-cip', 'epa', 'osha', 'iso-42001'],
  'mining-resources': ['osha', 'epa', 'iso-42001', 'popia', 'gdpr', 'eu-ai-act'],
  telecommunications: ['gdpr', 'ccpa', 'popia', 'iso-42001'],
  'technology-software': ['gdpr', 'ccpa', 'iso-42001', 'ms-responsible-ai', 'ms-copilot-governance'],
}

// ============================================================================
// GLOBAL REGULATION REGISTRY
// ============================================================================

export interface RegulationDetail {
  code: AIRegulationFramework
  displayName: string
  shortName: string
  jurisdiction: string
  url: string
  effectiveDate?: string
  /** High-risk categories or keywords that trigger escalation under this framework */
  highRiskKeywords: string[]
  /** Unacceptable / banned use case keywords */
  unacceptableKeywords: string[]
  /** Default risk level when framework applies but no specific trigger matches */
  defaultRisk: AIRiskLevel
  /**
   * Broad topic keywords that indicate the framework is contextually relevant.
   * When present AND defaultRisk !== 'minimal', the framework only triggers at
   * its baseline level if at least one baseline keyword matches the use case.
   * Omit to always apply when the framework is in scope.
   */
  baselineKeywords?: string[]
  /** Remediation templates keyed by risk level */
  remediationTemplates: Partial<Record<AIRiskLevel, string[]>>
}

export const REGULATION_REGISTRY: Record<string, RegulationDetail> = {
  // ── International / Global ─────────────────────────────────────────
  'oecd-ai-principles': {
    code: 'oecd-ai-principles',
    displayName: 'OECD AI Principles',
    shortName: 'OECD',
    jurisdiction: 'International',
    url: 'https://oecd.ai/en/ai-principles',
    highRiskKeywords: ['autonomous decision', 'social scoring', 'critical infrastructure'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Implement human oversight mechanisms', 'Conduct impact assessment per OECD guidelines'],
      limited: ['Document AI system transparency measures'],
    },
  },
  'unesco-ai-ethics': {
    code: 'unesco-ai-ethics',
    displayName: 'UNESCO Recommendation on AI Ethics',
    shortName: 'UNESCO',
    jurisdiction: 'International',
    url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
    highRiskKeywords: ['surveillance', 'social scoring', 'lethal autonomous'],
    unacceptableKeywords: ['mass surveillance', 'lethal autonomous weapons'],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Conduct ethical impact assessment', 'Ensure proportionality and non-discrimination'],
      unacceptable: ['This use case is prohibited under UNESCO AI Ethics recommendations'],
    },
  },
  'iso-42001': {
    code: 'iso-42001',
    displayName: 'ISO/IEC 42001 AI Management System',
    shortName: 'ISO 42001',
    jurisdiction: 'International',
    url: 'https://www.iso.org/standard/81230.html',
    highRiskKeywords: ['autonomous', 'safety-critical', 'medical device'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Implement AI Management System per ISO 42001', 'Conduct risk assessment and document controls'],
      limited: ['Document AI system lifecycle processes'],
    },
  },

  // ── European Union ─────────────────────────────────────────────────
  'eu-ai-act': {
    code: 'eu-ai-act',
    displayName: 'EU Artificial Intelligence Act',
    shortName: 'EU AI Act',
    jurisdiction: 'European Union',
    url: 'https://artificialintelligenceact.eu/',
    effectiveDate: '2024-08-01',
    highRiskKeywords: [
      'biometric', 'credit scoring', 'recruitment', 'hiring', 'education admission',
      'law enforcement', 'migration', 'asylum', 'democratic process',
      'critical infrastructure', 'medical device', 'safety component',
      'employment', 'worker management', 'access to services',
    ],
    unacceptableKeywords: [
      'social scoring', 'real-time biometric identification public',
      'emotion recognition workplace', 'emotion recognition education',
      'subliminal manipulation', 'exploit vulnerabilities',
      'biometric categorisation sensitive',
    ],
    baselineKeywords: ['ai', 'automat', 'machine learning', 'model', 'algorithm', 'predict', 'classify', 'decision', 'chatbot', 'generation'],
    defaultRisk: 'limited',
    remediationTemplates: {
      unacceptable: [
        'This use case is PROHIBITED under EU AI Act Art. 5',
        'Redesign to remove prohibited AI practices',
        'Consult legal counsel specialising in EU AI Act compliance',
      ],
      high: [
        'Conduct conformity assessment (EU AI Act Art. 43)',
        'Implement human oversight mechanism (Art. 14)',
        'Register in EU AI Database (Art. 49)',
        'Establish quality management system (Art. 17)',
        'Maintain technical documentation (Art. 11)',
        'Implement risk management system (Art. 9)',
        'Ensure data governance for training data (Art. 10)',
      ],
      limited: [
        'Implement transparency obligations (Art. 50)',
        'Notify users they are interacting with AI',
        'Label AI-generated content appropriately',
      ],
    },
  },
  'gdpr': {
    displayName: 'General Data Protection Regulation',
    shortName: 'GDPR',
    jurisdiction: 'European Union',
    url: 'https://gdpr.eu/',
    effectiveDate: '2018-05-25',
    highRiskKeywords: [
      'personal data', 'profiling', 'automated decision', 'biometric',
      'health data', 'genetic data', 'children', 'large scale monitoring',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'personal', 'user', 'customer', 'patient', 'employee', 'consent', 'privacy', 'record', 'profile', 'track'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct Data Protection Impact Assessment (DPIA)',
        'Implement Art. 22 safeguards for automated decision-making',
        'Ensure lawful basis for processing (Art. 6)',
        'Implement right to explanation for automated decisions',
      ],
      limited: [
        'Ensure privacy notice covers AI processing',
        'Implement data minimisation principles',
      ],
    },
  },

  // ── United States ──────────────────────────────────────────────────
  'nist-ai-rmf': {
    code: 'nist-ai-rmf',
    displayName: 'NIST AI Risk Management Framework',
    shortName: 'NIST AI RMF',
    jurisdiction: 'United States',
    url: 'https://www.nist.gov/artificial-intelligence/ai-risk-management-framework',
    highRiskKeywords: [
      'safety-critical', 'autonomous', 'consequential decision',
      'critical infrastructure', 'financial decision', 'healthcare decision',
    ],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: [
        'Map AI risks using NIST AI RMF GOVERN function',
        'Measure AI system performance using NIST MEASURE function',
        'Implement NIST MANAGE controls for identified risks',
        'Conduct third-party AI audit',
      ],
      limited: ['Document AI system characteristics per NIST MAP function'],
    },
  },
  'white-house-eo': {
    code: 'white-house-eo',
    displayName: 'US Executive Order on AI Safety',
    shortName: 'US EO 14110',
    jurisdiction: 'United States',
    url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/',
    effectiveDate: '2023-10-30',
    highRiskKeywords: ['dual-use foundation model', 'critical infrastructure', 'biosecurity', 'cybersecurity'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Report foundation model training to US government if applicable', 'Implement safety testing per EO requirements'],
    },
  },
  'ccpa': {
    code: 'ccpa',
    displayName: 'California Consumer Privacy Act',
    shortName: 'CCPA/CPRA',
    jurisdiction: 'United States',
    url: 'https://oag.ca.gov/privacy/ccpa',
    highRiskKeywords: ['consumer profiling', 'automated decision', 'personal information', 'behavioral advertising'],
    unacceptableKeywords: [],
    baselineKeywords: ['consumer', 'personal', 'data', 'privacy', 'user', 'customer', 'profile', 'advertising', 'tracking'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: ['Implement opt-out mechanism for automated decision-making', 'Conduct risk assessment for profiling activities'],
      limited: ['Update privacy policy to disclose AI use'],
    },
  },
  'hipaa': {
    code: 'hipaa',
    displayName: 'HIPAA',
    shortName: 'HIPAA',
    jurisdiction: 'United States',
    url: 'https://www.hhs.gov/hipaa/',
    highRiskKeywords: ['patient data', 'health records', 'diagnosis', 'treatment recommendation', 'medical decision'],
    unacceptableKeywords: [],
    baselineKeywords: ['health', 'patient', 'medical', 'clinical', 'hospital', 'pharmacy', 'diagnosis', 'treatment', 'care', 'wellness'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: [
        'Ensure BAA (Business Associate Agreement) covers AI vendor',
        'Implement minimum necessary standard for PHI',
        'Conduct security risk assessment per HIPAA Security Rule',
        'Ensure AI system audit trail for PHI access',
      ],
    },
  },
  'sox': {
    code: 'sox',
    displayName: 'Sarbanes-Oxley Act',
    shortName: 'SOX',
    jurisdiction: 'United States',
    url: 'https://www.sec.gov/about/laws/soa2002.pdf',
    highRiskKeywords: ['financial reporting', 'audit', 'internal controls', 'accounting'],
    unacceptableKeywords: [],
    baselineKeywords: ['financ', 'accounting', 'audit', 'reporting', 'revenue', 'compliance', 'earnings', 'sox', 'ledger'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Implement IT general controls (ITGC) for AI system', 'Ensure AI-generated financial data is auditable', 'Document AI model governance for SOX compliance'],
    },
  },
  'ferpa': {
    code: 'ferpa',
    displayName: 'Family Educational Rights and Privacy Act',
    shortName: 'FERPA',
    jurisdiction: 'United States',
    url: 'https://studentprivacy.ed.gov/',
    highRiskKeywords: ['student records', 'education data', 'academic assessment', 'student profiling'],
    unacceptableKeywords: [],
    baselineKeywords: ['student', 'education', 'school', 'university', 'academic', 'learning', 'grade', 'enrollment', 'campus'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Ensure AI system does not disclose education records without consent', 'Implement access controls per FERPA requirements'],
    },
  },
  'glba': {
    code: 'glba',
    displayName: 'Gramm-Leach-Bliley Act',
    shortName: 'GLBA',
    jurisdiction: 'United States',
    url: 'https://www.ftc.gov/legal-library/browse/statutes/gramm-leach-bliley-act',
    highRiskKeywords: ['financial data', 'customer financial information', 'banking'],
    unacceptableKeywords: [],
    baselineKeywords: ['financ', 'bank', 'loan', 'credit', 'insurance', 'mortgage', 'deposit', 'account', 'investment'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Implement Safeguards Rule for AI system processing financial data', 'Ensure AI vendor agreements include GLBA protections'],
    },
  },

  // ── African Union & Africa ─────────────────────────────────────────
  'au-ai-strategy': {
    code: 'au-ai-strategy',
    displayName: 'African Union AI Continental Strategy',
    shortName: 'AU AI Strategy',
    jurisdiction: 'African Union',
    url: 'https://au.int/en/documents/20240201/continental-artificial-intelligence-strategy',
    highRiskKeywords: ['surveillance', 'social scoring', 'automated governance'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Align with AU principles of inclusive AI', 'Conduct community impact assessment'],
    },
  },
  'au-data-policy': {
    code: 'au-data-policy',
    displayName: 'AU Data Policy Framework',
    shortName: 'AU Data Policy',
    jurisdiction: 'African Union',
    url: 'https://au.int/en/documents/data-policy-framework',
    highRiskKeywords: ['cross-border data', 'data sovereignty'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Ensure data sovereignty requirements are met', 'Implement data localisation where required'],
    },
  },
  'smart-africa': {
    code: 'smart-africa',
    displayName: 'Smart Africa Alliance AI Blueprint',
    shortName: 'Smart Africa',
    jurisdiction: 'African Union',
    url: 'https://smartafrica.org/',
    highRiskKeywords: ['public service automation', 'citizen scoring'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {},
  },

  // ── South Africa ───────────────────────────────────────────────────
  'sa-ai-policy-draft': {
    code: 'sa-ai-policy-draft',
    displayName: 'South Africa Draft National AI Policy Framework',
    shortName: 'SA AI Policy',
    jurisdiction: 'South Africa',
    url: 'https://www.dcdt.gov.za/',
    highRiskKeywords: [
      'automated decision', 'profiling', 'biometric', 'surveillance',
      'credit scoring', 'employment decision', 'public service',
    ],
    unacceptableKeywords: ['social scoring', 'mass surveillance'],
    baselineKeywords: ['ai', 'automat', 'machine learning', 'algorithm', 'predict', 'decision', 'data', 'digital', 'model'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct AI Impact Assessment per SA AI Policy Framework',
        'Implement human oversight for consequential decisions',
        'Ensure alignment with SA Bill of Rights (Chapter 2)',
        'Register high-risk AI system with designated authority',
      ],
      unacceptable: [
        'This use case conflicts with SA constitutional protections',
        'Consult with DCDT on permissibility',
      ],
      limited: ['Implement transparency requirements per SA AI Policy'],
    },
  },
  'popia': {
    code: 'popia',
    displayName: 'Protection of Personal Information Act',
    shortName: 'POPIA',
    jurisdiction: 'South Africa',
    url: 'https://popia.co.za/',
    effectiveDate: '2021-07-01',
    highRiskKeywords: [
      'personal information', 'special personal information', 'children data',
      'automated decision', 'direct marketing', 'profiling',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'personal', 'customer', 'employee', 'user', 'consent', 'privacy', 'information', 'record', 'profile'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct POPIA compliance assessment',
        'Appoint Information Officer',
        'Implement Sec. 71 safeguards for automated decisions',
        'Ensure lawful basis for processing (Sec. 11)',
        'Register with Information Regulator if processing special personal info',
      ],
      limited: ['Update PAIA manual to include AI processing', 'Implement data subject rights mechanisms'],
    },
  },
  'ecta': {
    code: 'ecta',
    displayName: 'Electronic Communications and Transactions Act',
    shortName: 'ECTA',
    jurisdiction: 'South Africa',
    url: 'https://www.gov.za/documents/electronic-communications-and-transactions-act',
    highRiskKeywords: ['electronic transaction', 'digital signature', 'automated transaction'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {},
  },
  'dmre': {
    code: 'dmre',
    displayName: 'Dept of Mineral Resources & Energy',
    shortName: 'DMRE',
    jurisdiction: 'South Africa',
    url: 'https://www.dmre.gov.za/',
    highRiskKeywords: ['mining automation', 'underground operation', 'mineral processing', 'mine safety'],
    unacceptableKeywords: [],
    baselineKeywords: ['mining', 'mine', 'mineral', 'energy', 'drill', 'underground', 'pit', 'ore', 'shaft'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: ['Comply with Mine Health and Safety Act requirements', 'Implement safety case for AI in mining operations'],
    },
  },
  'sahpra': {
    code: 'sahpra',
    displayName: 'SA Health Products Regulatory Authority',
    shortName: 'SAHPRA',
    jurisdiction: 'South Africa',
    url: 'https://www.sahpra.org.za/',
    highRiskKeywords: ['medical device', 'diagnostic', 'health product', 'clinical decision'],
    unacceptableKeywords: [],
    baselineKeywords: ['health', 'medical', 'clinical', 'patient', 'diagnostic', 'pharma', 'drug', 'device', 'treatment', 'hospital'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Register AI-based medical device with SAHPRA', 'Conduct clinical validation study'],
    },
  },

  // ── Australia ──────────────────────────────────────────────────────
  'au-ai-ethics-framework': {
    code: 'au-ai-ethics-framework',
    displayName: 'Australia AI Ethics Framework',
    shortName: 'AU AI Ethics',
    jurisdiction: 'Australia',
    url: 'https://www.industry.gov.au/publications/australias-artificial-intelligence-ethics-framework',
    highRiskKeywords: [
      'automated decision', 'consequential decision', 'profiling',
      'biometric', 'critical infrastructure', 'public safety',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['ai', 'automat', 'machine learning', 'algorithm', 'decision', 'data', 'predict'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Apply 8 AI Ethics Principles (human rights, wellbeing, transparency, etc.)',
        'Conduct algorithmic impact assessment',
        'Implement contestability and accountability mechanisms',
        'Ensure reliability and safety testing',
      ],
      limited: ['Document AI system per transparency principle', 'Implement fairness testing'],
    },
  },

  // ── Brazil ──────────────────────────────────────────────────────
  'brazil-lgpd': {
    code: 'brazil-lgpd',
    displayName: 'Lei Geral de Proteção de Dados',
    shortName: 'LGPD',
    jurisdiction: 'Brazil',
    url: 'https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd',
    effectiveDate: '2020-09-18',
    highRiskKeywords: ['personal data', 'automated decision', 'profiling', 'sensitive data'],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'personal', 'customer', 'user', 'privacy', 'consent', 'profile'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct LGPD impact assessment for AI processing',
        'Implement right to review automated decisions (Art. 20)',
        'Ensure Data Protection Officer appointment',
      ],
    },
  },
  'brazil-ai-bill': {
    code: 'brazil-ai-bill',
    displayName: 'Brazil AI Regulation Bill (PL 2338/2023)',
    shortName: 'Brazil AI Bill',
    jurisdiction: 'Brazil',
    url: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2356570',
    highRiskKeywords: ['biometric', 'credit scoring', 'judicial decision', 'law enforcement', 'healthcare decision'],
    unacceptableKeywords: ['social scoring', 'subliminal manipulation'],
    baselineKeywords: ['ai', 'automat', 'machine learning', 'algorithm', 'decision', 'predict', 'model'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: ['Conduct algorithmic impact assessment', 'Implement human oversight for high-risk AI'],
      unacceptable: ['This use case may be prohibited under Brazil AI Bill'],
    },
  },

  // ── Singapore ──────────────────────────────────────────────────────
  'singapore-ai-governance': {
    code: 'singapore-ai-governance',
    displayName: 'Singapore Model AI Governance Framework',
    shortName: 'SG AI Governance',
    jurisdiction: 'Singapore',
    url: 'https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework',
    highRiskKeywords: ['autonomous decision', 'consequential decision', 'financial decision', 'healthcare'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: [
        'Apply Singapore Model AI Governance Framework',
        'Implement A.I. Verify testing framework',
        'Conduct algorithmic transparency assessment',
      ],
      limited: ['Document AI governance measures following SG framework'],
    },
  },

  // ── United Kingdom ────────────────────────────────────────────────
  'uk-ai-regulation': {
    code: 'uk-ai-regulation',
    displayName: 'UK Pro-innovation AI Regulation',
    shortName: 'UK AI Reg',
    jurisdiction: 'United Kingdom',
    url: 'https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach',
    highRiskKeywords: ['consequential decision', 'public safety', 'critical infrastructure'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: [
        'Apply UK 5 cross-sector principles (safety, transparency, fairness, accountability, contestability)',
        'Engage relevant UK sectoral regulator',
      ],
      limited: ['Document AI system per UK transparency expectations'],
    },
  },

  // ── Canada ─────────────────────────────────────────────────────────
  'canada-aida': {
    code: 'canada-aida',
    displayName: 'Artificial Intelligence and Data Act (AIDA)',
    shortName: 'Canada AIDA',
    jurisdiction: 'Canada',
    url: 'https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act',
    highRiskKeywords: ['biometric', 'employment', 'financial service', 'healthcare', 'critical infrastructure'],
    unacceptableKeywords: [],
    baselineKeywords: ['ai', 'automat', 'machine learning', 'algorithm', 'decision', 'predict'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct impact assessment per AIDA (high-impact system)',
        'Implement mitigation measures for identified risks',
        'Maintain records per AIDA requirements',
      ],
    },
  },

  // ── Japan ──────────────────────────────────────────────────────────
  'japan-ai-strategy': {
    code: 'japan-ai-strategy',
    displayName: 'Japan AI Strategy & Social Principles',
    shortName: 'Japan AI',
    jurisdiction: 'Japan',
    url: 'https://www.cas.go.jp/jp/seisaku/jinkouchinou/english.html',
    highRiskKeywords: ['autonomous decision', 'safety-critical'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Align with Japan Social Principles of Human-Centric AI', 'Implement safety and fairness testing'],
    },
  },

  // ── India ──────────────────────────────────────────────────────────
  'india-dpdp': {
    code: 'india-dpdp',
    displayName: 'Digital Personal Data Protection Act',
    shortName: 'India DPDP',
    jurisdiction: 'India',
    url: 'https://www.meity.gov.in/data-protection-framework',
    effectiveDate: '2023-08-11',
    highRiskKeywords: ['personal data', 'automated decision', 'children data', 'significant decision'],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'personal', 'customer', 'user', 'privacy', 'consent', 'citizen'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Implement consent mechanisms per DPDP Act',
        'Appoint Data Protection Officer for Significant Data Fiduciary',
        'Conduct Data Protection Impact Assessment',
      ],
    },
  },

  // ── UAE ─────────────────────────────────────────────────────────────
  'uae-ai-strategy': {
    code: 'uae-ai-strategy',
    displayName: 'UAE National AI Strategy 2031',
    shortName: 'UAE AI',
    jurisdiction: 'UAE',
    url: 'https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/strategies-plans-and-visions/science-and-technology/national-strategy-for-artificial-intelligence-2031',
    highRiskKeywords: ['government service', 'critical infrastructure', 'healthcare'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: ['Align with UAE AI Ethics Guidelines', 'Engage UAE AI Office for high-impact deployments'],
    },
  },

  // ── Kenya ──────────────────────────────────────────────────────────
  'kenya-dpa': {
    code: 'kenya-dpa',
    displayName: 'Kenya Data Protection Act',
    shortName: 'Kenya DPA',
    jurisdiction: 'Kenya',
    url: 'https://www.odpc.go.ke/',
    effectiveDate: '2019-11-25',
    highRiskKeywords: ['personal data', 'automated decision', 'profiling', 'financial data'],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'personal', 'customer', 'user', 'privacy', 'consent'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct DPIA for AI processing personal data',
        'Implement data subject rights mechanisms',
      ],
    },
  },

  // ── Nigeria ────────────────────────────────────────────────────────
  'nigeria-ndpr': {
    code: 'nigeria-ndpr',
    displayName: 'Nigeria Data Protection Regulation',
    shortName: 'NDPR',
    jurisdiction: 'Nigeria',
    url: 'https://ndpc.gov.ng/',
    effectiveDate: '2019-01-25',
    highRiskKeywords: ['personal data', 'automated decision', 'profiling'],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'personal', 'customer', 'user', 'privacy', 'consent'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Implement lawful basis for AI data processing',
      ],
    },
  },

  // ── China ──────────────────────────────────────────────────────────
  'china-ai-regulations': {
    code: 'china-ai-regulations',
    displayName: 'China AI Regulations',
    shortName: 'China AI',
    jurisdiction: 'China',
    url: 'https://www.cac.gov.cn/',
    highRiskKeywords: [
      'generative ai', 'deep synthesis', 'recommendation algorithm',
      'public opinion', 'content generation',
    ],
    unacceptableKeywords: ['undermine state security', 'subvert state power'],
    baselineKeywords: ['generative', 'content', 'algorithm', 'recommendation', 'synthesis', 'deepfake', 'ai'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Register generative AI service with CAC',
        'Implement content review mechanisms',
        'Conduct algorithm filing per Chinese regulations',
        'Implement real-name verification for users',
      ],
      unacceptable: ['This use case is prohibited under Chinese AI regulations'],
    },
  },

  // ── Industry-Specific ─────────────────────────────────────────────
  // ── EU Sector-Specific ─────────────────────────────────────────────
  'dora': {
    code: 'dora',
    displayName: 'Digital Operational Resilience Act',
    shortName: 'DORA',
    jurisdiction: 'European Union',
    url: 'https://www.digital-operational-resilience-act.com/',
    effectiveDate: '2025-01-17',
    highRiskKeywords: [
      'ict risk', 'third-party risk', 'digital resilience', 'cyber incident',
      'financial entity', 'outsourcing', 'cloud service', 'payment system',
      'trading', 'banking system', 'settlement', 'custody',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['financ', 'bank', 'payment', 'trading', 'insurance', 'investment', 'settlement', 'ict', 'outsourc'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: [
        'Implement ICT risk management framework per DORA Art. 5-16',
        'Establish ICT incident reporting process (Art. 17-23)',
        'Conduct digital operational resilience testing (Art. 24-27)',
        'Manage ICT third-party risk (Art. 28-44)',
        'Register critical third-party providers with ESAs',
      ],
    },
  },
  'nis2': {
    code: 'nis2',
    displayName: 'NIS2 Directive (Network and Information Security)',
    shortName: 'NIS2',
    jurisdiction: 'European Union',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/nis2-directive',
    effectiveDate: '2024-10-18',
    highRiskKeywords: [
      'critical infrastructure', 'essential service', 'digital infrastructure',
      'energy', 'transport', 'health', 'water supply', 'dns', 'cloud computing',
      'data centre', 'content delivery', 'managed service', 'managed security',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['infrastructure', 'energy', 'transport', 'health', 'water', 'cloud', 'dns', 'data centre', 'network', 'security'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: [
        'Implement cybersecurity risk management measures per NIS2 Art. 21',
        'Establish incident reporting within 24h/72h timelines (Art. 23)',
        'Ensure supply chain security assessment',
        'Implement multi-factor authentication and encryption',
        'Register with national CSIRT as essential/important entity',
      ],
    },
  },

  // ── US Sector-Specific ─────────────────────────────────────────────
  'fedramp': {
    code: 'fedramp',
    displayName: 'Federal Risk and Authorization Management Program',
    shortName: 'FedRAMP',
    jurisdiction: 'United States',
    url: 'https://www.fedramp.gov/',
    highRiskKeywords: [
      'federal', 'government cloud', 'federal agency', 'dod', 'department of defense',
      'public sector cloud', 'government data', 'federal information',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['federal', 'government', 'public sector', 'agency', 'dod', 'department', 'state'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: [
        'Achieve FedRAMP Authorization (Low/Moderate/High baseline)',
        'Implement NIST SP 800-53 controls',
        'Use FedRAMP-authorized cloud services',
        'Complete System Security Plan (SSP) and POA&M',
        'Engage 3PAO for independent assessment',
      ],
    },
  },
  'finra': {
    code: 'finra',
    displayName: 'Financial Industry Regulatory Authority',
    shortName: 'FINRA',
    jurisdiction: 'United States',
    url: 'https://www.finra.org/',
    highRiskKeywords: [
      'broker-dealer', 'securities', 'trading', 'investment advice',
      'market manipulation', 'algorithmic trading', 'customer suitability',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['securities', 'trading', 'broker', 'investment', 'market', 'portfolio', 'stock', 'fund'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: [
        'Ensure AI systems comply with FINRA Rules 3110 (Supervision)',
        'Implement model governance per FINRA guidance on AI',
        'Document AI decision-making for regulatory examination',
        'Maintain books and records per SEC Rule 17a-4',
      ],
    },
  },
  'cpra': {
    code: 'cpra',
    displayName: 'California Privacy Rights Act',
    shortName: 'CPRA',
    jurisdiction: 'United States',
    url: 'https://cppa.ca.gov/',
    effectiveDate: '2023-01-01',
    highRiskKeywords: [
      'automated decision', 'profiling', 'consumer data', 'personal information',
      'behavioral advertising', 'sensitive personal information', 'opt-out',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['consumer', 'personal', 'data', 'privacy', 'user', 'customer', 'advertising', 'tracking'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Conduct CPRA risk assessment for automated decision-making',
        'Implement opt-out mechanism for automated decisions',
        'Provide right to access logic of automated processing',
        'Limit use of sensitive personal information',
      ],
      limited: ['Update privacy policy to disclose AI processing per CPRA'],
    },
  },
  'fda-samd': {
    code: 'fda-samd',
    displayName: 'FDA Software as a Medical Device',
    shortName: 'FDA SaMD',
    jurisdiction: 'United States',
    url: 'https://www.fda.gov/medical-devices/digital-health-center-excellence/software-medical-device-samd',
    highRiskKeywords: [
      'medical device', 'clinical decision', 'diagnosis', 'treatment recommendation',
      'patient monitoring', 'health screening', 'radiological', 'pathology',
      'software as medical device', 'samd',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['medical', 'health', 'clinical', 'patient', 'diagnosis', 'treatment', 'radiology', 'pathology', 'device'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: [
        'Classify SaMD per FDA risk framework (Class I/II/III)',
        'Submit 510(k) or De Novo classification request',
        'Implement Good Machine Learning Practice (GMLP)',
        'Establish predetermined change control plan',
        'Maintain Quality Management System per 21 CFR Part 820',
      ],
    },
  },

  // ── International Standards ────────────────────────────────────────
  'soc2': {
    code: 'soc2',
    displayName: 'SOC 2 Type II',
    shortName: 'SOC 2',
    jurisdiction: 'International',
    url: 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2',
    highRiskKeywords: [
      'customer data', 'saas', 'cloud service', 'data processing',
      'service organization', 'trust services', 'third-party vendor',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['data', 'cloud', 'saas', 'service', 'customer', 'platform', 'vendor', 'process'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Obtain SOC 2 Type II report covering AI systems',
        'Implement Trust Services Criteria (Security, Availability, Confidentiality)',
        'Establish continuous monitoring and evidence collection',
        'Engage independent CPA firm for SOC 2 audit',
      ],
      limited: ['Document AI controls within SOC 2 framework'],
    },
  },
  'iso-27001': {
    code: 'iso-27001',
    displayName: 'ISO/IEC 27001 Information Security Management',
    shortName: 'ISO 27001',
    jurisdiction: 'International',
    url: 'https://www.iso.org/standard/27001',
    highRiskKeywords: [
      'information security', 'data protection', 'access control', 'encryption',
      'security management', 'risk assessment', 'security incident',
    ],
    unacceptableKeywords: [],
    baselineKeywords: ['security', 'data', 'access', 'encrypt', 'protect', 'information', 'system', 'cloud', 'risk'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: [
        'Extend ISMS scope to cover AI systems per ISO 27001:2022',
        'Apply Annex A controls relevant to AI (A.8 Technology, A.5 Organizational)',
        'Conduct AI-specific information security risk assessment',
        'Achieve ISO 27001 certification covering AI processes',
      ],
      limited: ['Document AI system within ISMS Statement of Applicability'],
    },
  },

  'msha': {
    code: 'msha',
    displayName: 'Mine Safety and Health Administration',
    shortName: 'MSHA',
    jurisdiction: 'United States',
    url: 'https://www.msha.gov/',
    highRiskKeywords: ['mine safety', 'underground', 'mining automation', 'hazard detection'],
    unacceptableKeywords: [],
    baselineKeywords: ['mine', 'mining', 'underground', 'excavat', 'drill', 'ore', 'safety'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Ensure AI system meets MSHA safety standards', 'Conduct safety validation for mining AI'],
    },
  },
  'epa': {
    code: 'epa',
    displayName: 'Environmental Protection Agency',
    shortName: 'EPA',
    jurisdiction: 'United States',
    url: 'https://www.epa.gov/',
    highRiskKeywords: ['environmental monitoring', 'emissions', 'pollution', 'hazardous waste'],
    unacceptableKeywords: [],
    baselineKeywords: ['environment', 'emission', 'pollution', 'waste', 'water', 'air quality', 'climate'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: ['Ensure AI monitoring meets EPA reporting standards'],
    },
  },
  'osha': {
    code: 'osha',
    displayName: 'Occupational Safety and Health Administration',
    shortName: 'OSHA',
    jurisdiction: 'United States',
    url: 'https://www.osha.gov/',
    highRiskKeywords: ['workplace safety', 'worker monitoring', 'hazard detection', 'safety automation'],
    unacceptableKeywords: [],
    baselineKeywords: ['safety', 'worker', 'workplace', 'hazard', 'occupational', 'incident', 'injury'],
    defaultRisk: 'limited',
    remediationTemplates: {
      high: ['Validate AI safety system meets OSHA standards', 'Implement fail-safe mechanisms'],
    },
  },
  'nerc-cip': {
    code: 'nerc-cip',
    displayName: 'NERC Critical Infrastructure Protection',
    shortName: 'NERC CIP',
    jurisdiction: 'United States',
    url: 'https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx',
    highRiskKeywords: ['power grid', 'energy infrastructure', 'bulk electric system', 'SCADA'],
    unacceptableKeywords: [],
    baselineKeywords: ['power', 'grid', 'energy', 'electric', 'utility', 'substation', 'scada'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Ensure AI system meets NERC CIP cybersecurity requirements', 'Conduct BES Cyber System categorisation'],
    },
  },
  'pci-dss': {
    code: 'pci-dss',
    displayName: 'Payment Card Industry Data Security Standard',
    shortName: 'PCI DSS',
    jurisdiction: 'International',
    url: 'https://www.pcisecuritystandards.org/',
    highRiskKeywords: ['payment processing', 'cardholder data', 'transaction', 'card data'],
    unacceptableKeywords: [],
    baselineKeywords: ['payment', 'card', 'transaction', 'checkout', 'merchant', 'pos', 'credit card'],
    defaultRisk: 'high',
    remediationTemplates: {
      high: ['Ensure AI system processing payment data meets PCI DSS v4.0', 'Implement network segmentation for AI components'],
    },
  },

  // ── Microsoft & Technology ─────────────────────────────────────────
  'ms-responsible-ai': {
    code: 'ms-responsible-ai',
    displayName: 'Microsoft Responsible AI Standard v2',
    shortName: 'MS RAI',
    jurisdiction: 'International',
    url: 'https://www.microsoft.com/en-us/ai/responsible-ai',
    highRiskKeywords: ['facial recognition', 'consequential decision', 'content generation'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      high: [
        'Complete Microsoft Responsible AI Impact Assessment',
        'Implement fairness, reliability, safety, privacy, inclusiveness, transparency, accountability controls',
      ],
    },
  },
  'ms-ai-principles': {
    code: 'ms-ai-principles',
    displayName: 'Microsoft AI Principles',
    shortName: 'MS AI Principles',
    jurisdiction: 'International',
    url: 'https://www.microsoft.com/en-us/ai/our-approach',
    highRiskKeywords: [],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {},
  },
  'ms-copilot-governance': {
    code: 'ms-copilot-governance',
    displayName: 'Microsoft Copilot Governance',
    shortName: 'MS Copilot Gov',
    jurisdiction: 'International',
    url: 'https://learn.microsoft.com/en-us/copilot/',
    highRiskKeywords: ['copilot', 'generative ai', 'content generation'],
    unacceptableKeywords: [],
    defaultRisk: 'minimal',
    remediationTemplates: {
      limited: ['Implement Copilot governance policies', 'Configure data loss prevention for AI-generated content'],
    },
  },
}
// ============================================================================
// COMPREHENSIVE JURISDICTION → FRAMEWORK MAPPING
// ============================================================================

export const JURISDICTION_FRAMEWORK_MAP: Record<string, {
  frameworks: AIRegulationFramework[]
  enforcementLevel: 'mandatory' | 'voluntary' | 'draft'
}> = {
  'South Africa': {
    frameworks: ['popia', 'sa-ai-policy-draft', 'ecta', 'dmre', 'sahpra', 'au-ai-strategy', 'au-data-policy'],
    enforcementLevel: 'mandatory',
  },
  'European Union': {
    frameworks: ['gdpr', 'eu-ai-act', 'dora', 'nis2'],
    enforcementLevel: 'mandatory',
  },
  'United States': {
    frameworks: ['nist-ai-rmf', 'white-house-eo', 'ccpa', 'cpra', 'hipaa', 'sox', 'ferpa', 'glba', 'fedramp', 'finra', 'fda-samd', 'msha', 'osha', 'epa'],
    enforcementLevel: 'mandatory',
  },
  'United Kingdom': {
    frameworks: ['gdpr', 'uk-ai-regulation'],
    enforcementLevel: 'mandatory',
  },
  'Australia': {
    frameworks: ['au-ai-ethics-framework'],
    enforcementLevel: 'voluntary',
  },
  'Canada': {
    frameworks: ['canada-aida'],
    enforcementLevel: 'draft',
  },
  'Brazil': {
    frameworks: ['brazil-lgpd', 'brazil-ai-bill'],
    enforcementLevel: 'mandatory',
  },
  'Singapore': {
    frameworks: ['singapore-ai-governance'],
    enforcementLevel: 'voluntary',
  },
  'Japan': {
    frameworks: ['japan-ai-strategy'],
    enforcementLevel: 'voluntary',
  },
  'India': {
    frameworks: ['india-dpdp'],
    enforcementLevel: 'mandatory',
  },
  'UAE': {
    frameworks: ['uae-ai-strategy'],
    enforcementLevel: 'voluntary',
  },
  'Kenya': {
    frameworks: ['kenya-dpa'],
    enforcementLevel: 'mandatory',
  },
  'Nigeria': {
    frameworks: ['nigeria-ndpr'],
    enforcementLevel: 'mandatory',
  },
  'China': {
    frameworks: ['china-ai-regulations'],
    enforcementLevel: 'mandatory',
  },
  'African Union': {
    frameworks: ['au-ai-strategy', 'au-data-policy', 'smart-africa'],
    enforcementLevel: 'voluntary',
  },
}

// ============================================================================
// JURISDICTION DETECTION (from location strings)
// ============================================================================

const LOCATION_JURISDICTION_MAP: Array<{ patterns: RegExp[]; jurisdictions: string[] }> = [
  { patterns: [/johannesburg/i, /cape town/i, /durban/i, /pretoria/i, /south africa/i, /\.za$/i], jurisdictions: ['South Africa', 'African Union'] },
  { patterns: [/nairobi/i, /kenya/i], jurisdictions: ['Kenya', 'African Union'] },
  { patterns: [/lagos/i, /abuja/i, /nigeria/i], jurisdictions: ['Nigeria', 'African Union'] },
  { patterns: [/cairo/i, /egypt/i], jurisdictions: ['African Union'] },
  { patterns: [/london/i, /manchester/i, /birmingham/i, /united kingdom/i, /\buk\b/i], jurisdictions: ['United Kingdom'] },
  { patterns: [/amsterdam/i, /berlin/i, /paris/i, /munich/i, /milan/i, /copenhagen/i, /stockholm/i, /zurich/i, /dublin/i, /european union/i, /\beu\b/i], jurisdictions: ['European Union'] },
  { patterns: [/new york/i, /san francisco/i, /seattle/i, /redmond/i, /chicago/i, /boston/i, /atlanta/i, /houston/i, /los angeles/i, /miami/i, /washington/i, /\busa\b/i, /united states/i], jurisdictions: ['United States'] },
  { patterns: [/sydney/i, /melbourne/i, /australia/i], jurisdictions: ['Australia'] },
  { patterns: [/toronto/i, /vancouver/i, /canada/i], jurisdictions: ['Canada'] },
  { patterns: [/são paulo/i, /sao paulo/i, /brazil/i, /brasil/i], jurisdictions: ['Brazil'] },
  { patterns: [/singapore/i], jurisdictions: ['Singapore'] },
  { patterns: [/tokyo/i, /japan/i], jurisdictions: ['Japan'] },
  { patterns: [/bengaluru/i, /bangalore/i, /mumbai/i, /delhi/i, /india/i], jurisdictions: ['India'] },
  { patterns: [/dubai/i, /abu dhabi/i, /\buae\b/i], jurisdictions: ['UAE'] },
  { patterns: [/beijing/i, /shanghai/i, /china/i], jurisdictions: ['China'] },
  { patterns: [/seoul/i, /south korea/i, /korea/i], jurisdictions: [] }, // No specific framework yet
  { patterns: [/mexico city/i, /mexico/i], jurisdictions: [] },
  { patterns: [/moscow/i, /russia/i], jurisdictions: [] },
]

/**
 * Detect applicable jurisdictions from a location string.
 * Returns multiple jurisdictions when applicable (e.g., South Africa → ['South Africa', 'African Union']).
 */
export function detectJurisdictions(location: string): string[] {
  if (!location) return ['International']

  const matched = new Set<string>()
  for (const mapping of LOCATION_JURISDICTION_MAP) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(location)) {
        mapping.jurisdictions.forEach(j => matched.add(j))
        break
      }
    }
  }

  // Always include International frameworks
  if (matched.size === 0) {
    return ['International']
  }

  return Array.from(matched)
}

/**
 * Get all applicable frameworks for jurisdictions + industry
 */
export function getApplicableFrameworks(
  jurisdictions: string[],
  industry?: Industry
): AIRegulationFramework[] {
  const frameworks = new Set<AIRegulationFramework>()

  // Jurisdiction-based frameworks
  for (const j of jurisdictions) {
    const mapping = JURISDICTION_FRAMEWORK_MAP[j]
    if (mapping) {
      mapping.frameworks.forEach(f => frameworks.add(f))
    }
  }

  // Industry-based (universal)
  if (industry) {
    const industryRegs: AIRegulationFramework[] = INDUSTRY_REGULATIONS[industry] || INDUSTRY_REGULATIONS.general || []
    industryRegs.forEach((f: AIRegulationFramework) => frameworks.add(f))
  }

  // Always include MS Responsible AI, OECD, SOC 2, and ISO 27001 as baseline
  frameworks.add('ms-responsible-ai')
  frameworks.add('oecd-ai-principles')
  frameworks.add('soc2')
  frameworks.add('iso-27001')

  return Array.from(frameworks)
}

// ============================================================================
// RISK ASSESSMENT ENGINE
// ============================================================================

const RISK_SEVERITY: Record<AIRiskLevel, number> = {
  unacceptable: 4,
  high: 3,
  limited: 2,
  minimal: 1,
}

/**
 * Word-boundary keyword match — prevents partial-word false positives.
 * E.g., "credit scoring" matches "credit scoring system" but not "discrediting".
 */
function keywordMatches(text: string, keyword: string): boolean {
  // Escape regex special characters in keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\b${escaped}\\b`, 'i')
  return pattern.test(text)
}

/**
 * Industry-specific risk modulation.
 * Adjusts risk level down when the use case context indicates a legitimate,
 * safety-oriented use within that industry (e.g., mining + biometric for safety).
 */
const INDUSTRY_RISK_REDUCTIONS: Record<string, Array<{ keywords: string[]; targetIndustries: string[]; reduceFrom: AIRiskLevel; reduceTo: AIRiskLevel; reason: string }>> = {
  'biometric': [{
    keywords: ['safety', 'mine safety', 'worker safety', 'personal protective', 'ppe'],
    targetIndustries: ['mining', 'manufacturing', 'energy', 'construction'],
    reduceFrom: 'high',
    reduceTo: 'limited',
    reason: 'Biometric use for workplace safety in industrial settings',
  }],
  'worker management': [{
    keywords: ['safety compliance', 'training', 'certification', 'health and safety'],
    targetIndustries: ['mining', 'manufacturing', 'energy', 'construction'],
    reduceFrom: 'high',
    reduceTo: 'limited',
    reason: 'Worker management for health & safety compliance',
  }],
  'monitoring': [{
    keywords: ['environmental', 'emissions', 'pollution', 'air quality', 'water quality'],
    targetIndustries: ['mining', 'energy', 'manufacturing'],
    reduceFrom: 'high',
    reduceTo: 'limited',
    reason: 'Environmental monitoring for regulatory compliance',
  }],
}

function applyIndustryModulation(
  assessment: FrameworkAssessment,
  text: string,
  industry?: string
): FrameworkAssessment {
  if (!industry || assessment.risk === 'unacceptable' || assessment.risk === 'minimal') return assessment

  for (const [trigger, reductions] of Object.entries(INDUSTRY_RISK_REDUCTIONS)) {
    if (!keywordMatches(text, trigger)) continue
    for (const rule of reductions) {
      if (
        rule.targetIndustries.includes(industry) &&
        assessment.risk === rule.reduceFrom &&
        rule.keywords.some(kw => keywordMatches(text, kw))
      ) {
        return {
          ...assessment,
          risk: rule.reduceTo,
          reason: `${assessment.reason} [Adjusted: ${rule.reason}]`,
        }
      }
    }
  }
  return assessment
}

/**
 * Assess a single use case against a single regulation framework.
 * Returns the risk level and reason based on word-boundary keyword matching.
 */
function assessAgainstFramework(
  useCase: UseCase,
  detail: RegulationDetail
): FrameworkAssessment | null {
  const text = `${useCase.title} ${useCase.description} ${useCase.kpis?.join(' ') || ''}`.toLowerCase()

  // Check unacceptable keywords first
  for (const keyword of detail.unacceptableKeywords) {
    if (keywordMatches(text, keyword)) {
      return {
        framework: detail.code,
        risk: 'unacceptable',
        reason: `Contains prohibited practice under ${detail.displayName}: "${keyword}"`,
        articles: detail.code === 'eu-ai-act' ? ['Art. 5'] : undefined,
      }
    }
  }

  // Check high-risk keywords
  const matchedHighRisk = detail.highRiskKeywords.filter(kw => keywordMatches(text, kw))
  if (matchedHighRisk.length > 0) {
    return {
      framework: detail.code,
      risk: 'high',
      reason: `Matches high-risk indicators under ${detail.displayName}: ${matchedHighRisk.slice(0, 3).join(', ')}`,
      articles: detail.code === 'eu-ai-act' ? ['Art. 6', 'Annex III'] : undefined,
    }
  }

  // Apply default risk only when the use case is contextually relevant to this framework.
  // If baselineKeywords are defined, at least one must match; otherwise always apply.
  if (detail.defaultRisk !== 'minimal') {
    const baselineRelevant = !detail.baselineKeywords
      || detail.baselineKeywords.some(kw => keywordMatches(text, kw))

    if (!baselineRelevant) return null

    return {
      framework: detail.code,
      risk: detail.defaultRisk,
      reason: `${detail.displayName} applies with baseline requirements`,
    }
  }

  return null
}

/**
 * Build remediation options from framework assessment results.
 */
function buildRemediations(
  assessments: FrameworkAssessment[]
): RemediationOption[] {
  const remediations: RemediationOption[] = []
  let idCounter = 1

  for (const assessment of assessments) {
    const detail = REGULATION_REGISTRY[assessment.framework]
    if (!detail) continue

    const templates = detail.remediationTemplates[assessment.risk] || []
    for (const template of templates) {
      remediations.push({
        id: `rem-${idCounter++}`,
        framework: assessment.framework,
        action: template,
        priority: assessment.risk === 'unacceptable' ? 'critical' : assessment.risk === 'high' ? 'recommended' : 'optional',
        description: `${detail.displayName}: ${template}`,
      })
    }
  }

  return remediations
}

/**
 * Determine overall gate status based on assessments and enforcement mode.
 */
function determineGateStatus(
  overallRisk: AIRiskLevel,
  enforcement: ComplianceEnforcement
): { gateStatus: 'blocked' | 'warning' | 'clear'; signOffRequired: boolean } {
  if (enforcement === 'strict') {
    if (overallRisk === 'unacceptable') {
      return { gateStatus: 'blocked', signOffRequired: true }
    }
    if (overallRisk === 'high') {
      return { gateStatus: 'warning', signOffRequired: true }
    }
  }

  // Advisory mode or lower risk
  if (overallRisk === 'unacceptable' || overallRisk === 'high') {
    return { gateStatus: 'warning', signOffRequired: false }
  }

  return { gateStatus: 'clear', signOffRequired: false }
}

/**
 * Main assessment function — assess a use case against all applicable frameworks
 * for the given jurisdictions and industry.
 * 
 * This is a pure, deterministic check (no AI calls). Fast and reliable.
 */
export function assessUseCaseRisk(
  useCase: UseCase,
  jurisdictions: string[],
  industry?: Industry,
  enforcement: ComplianceEnforcement = 'advisory'
): RegulatoryAssessment {
  const applicableFrameworks = getApplicableFrameworks(jurisdictions, industry)

  const frameworkAssessments: FrameworkAssessment[] = []

  const useCaseText = `${useCase.title} ${useCase.description} ${useCase.kpis?.join(' ') || ''}`.toLowerCase()

  for (const frameworkCode of applicableFrameworks) {
    const detail = REGULATION_REGISTRY[frameworkCode]
    if (!detail) continue

    const assessment = assessAgainstFramework(useCase, detail)
    if (assessment) {
      frameworkAssessments.push(applyIndustryModulation(assessment, useCaseText, industry))
    }
  }

  // Determine overall risk (highest severity across all frameworks)
  let overallRisk: AIRiskLevel = 'minimal'
  for (const a of frameworkAssessments) {
    if (RISK_SEVERITY[a.risk] > RISK_SEVERITY[overallRisk]) {
      overallRisk = a.risk
    }
  }

  // Also consider existing AI regulation info on the use case
  if (useCase.aiRegulations?.riskClassification) {
    if (RISK_SEVERITY[useCase.aiRegulations.riskClassification] > RISK_SEVERITY[overallRisk]) {
      overallRisk = useCase.aiRegulations.riskClassification
    }
  }

  const remediations = buildRemediations(frameworkAssessments)
  const { gateStatus, signOffRequired } = determineGateStatus(overallRisk, enforcement)

  return {
    overallRisk,
    frameworkAssessments,
    remediations,
    gateStatus,
    signOffRequired,
    assessedAt: Date.now(),
  }
}

/**
 * Batch-assess a portfolio of use cases. 
 * Returns the same array with regulatoryAssessment populated.
 */
export function assessPortfolio(
  useCases: UseCase[],
  jurisdictions: string[],
  industry?: Industry,
  enforcement: ComplianceEnforcement = 'advisory'
): UseCase[] {
  return useCases.map(uc => ({
    ...uc,
    regulatoryAssessment: assessUseCaseRisk(uc, jurisdictions, industry, enforcement),
    // Also auto-populate aiRegulations if empty
    aiRegulations: uc.aiRegulations || {
      applicableFrameworks: getApplicableFrameworks(jurisdictions, industry),
      riskClassification: assessUseCaseRisk(uc, jurisdictions, industry, enforcement).overallRisk,
      jurisdictions,
    },
  }))
}

/**
 * Get remediation options for a specific framework and risk level.
 */
export function getRemediationOptions(
  framework: AIRegulationFramework,
  riskLevel: AIRiskLevel
): string[] {
  const detail = REGULATION_REGISTRY[framework]
  if (!detail) return []
  return detail.remediationTemplates[riskLevel] || []
}

/**
 * Get display info for a regulation framework.
 */
export function getRegulationDisplayInfo(framework: AIRegulationFramework): {
  displayName: string
  shortName: string
  jurisdiction: string
  url: string
} {
  const detail = REGULATION_REGISTRY[framework]
  if (!detail) {
    return { displayName: framework, shortName: framework, jurisdiction: 'Unknown', url: '' }
  }
  return {
    displayName: detail.displayName,
    shortName: detail.shortName,
    jurisdiction: detail.jurisdiction,
    url: detail.url,
  }
}

/**
 * Risk level display configuration.
 */
export const RISK_LEVEL_CONFIG: Record<AIRiskLevel, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  icon: string
}> = {
  unacceptable: {
    label: 'Unacceptable',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-300 dark:border-red-800',
    description: 'Prohibited — requires fundamental redesign',
    icon: '🚫',
  },
  high: {
    label: 'High Risk',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-300 dark:border-amber-800',
    description: 'Requires conformity assessment and ongoing monitoring',
    icon: '⚠️',
  },
  limited: {
    label: 'Limited Risk',
    color: 'text-yellow-700 dark:text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-300 dark:border-yellow-800',
    description: 'Transparency obligations apply',
    icon: '📋',
  },
  minimal: {
    label: 'Minimal Risk',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-300 dark:border-green-800',
    description: 'No specific regulatory requirements',
    icon: '✅',
  },
}

