/**
 * Business-function / department taxonomy — the second Discovery dimension
 * alongside Industry.
 *
 * `Industry` (in types.ts) says WHAT the company does; `BusinessFunction` says
 * WHICH part of the organisation a use case serves (Finance, HR, Risk
 * Assurance, Procurement, …). This module owns the labels, the grouped
 * taxonomy, and the per-function playbook metadata (typical personas, common
 * pain points, relevant KPIs, regulatory hot-spots) that enriches use-case
 * generation. The union TYPES live in types.ts (mirroring the Industry pattern)
 * so this module can depend on types.ts without a circular import.
 */

import type { BusinessFunction, BusinessFunctionGroup } from '@/lib/types'

export interface BusinessFunctionMeta {
  id: BusinessFunction
  label: string
  group: BusinessFunctionGroup
  description: string
  /** Typical stakeholders / roles in this function. */
  personas: string[]
  /** Recurring pain points AI is well-suited to address. */
  painPoints: string[]
  /** KPIs this function is measured on. */
  kpis: string[]
  /** Regulatory frameworks frequently in scope (optional). */
  regulatory?: string[]
}

/** Ordered group labels (drives the grouped selector; enterprise-wide first). */
export const businessFunctionGroupLabels: Record<BusinessFunctionGroup, string> = {
  'enterprise-wide': 'Enterprise-wide',
  'finance-accounting': 'Finance & Accounting',
  'people-hr': 'People & HR',
  'risk-legal-governance': 'Risk, Audit, Legal & Governance',
  'sales-marketing-customer': 'Sales, Marketing & Customer',
  'operations-supply-chain': 'Operations & Supply Chain',
  'technology-data': 'Technology & Data',
  'corporate-strategy': 'Corporate & Strategy',
}

/** Display order for the groups. */
export const BUSINESS_FUNCTION_GROUP_ORDER: BusinessFunctionGroup[] = [
  'enterprise-wide',
  'finance-accounting',
  'people-hr',
  'risk-legal-governance',
  'sales-marketing-customer',
  'operations-supply-chain',
  'technology-data',
  'corporate-strategy',
]

export const BUSINESS_FUNCTIONS: BusinessFunctionMeta[] = [
  // ── Enterprise-wide ──────────────────────────────────────────────────────────
  {
    id: 'cross-functional',
    label: 'Cross-functional / Enterprise-wide',
    group: 'enterprise-wide',
    description: 'Spans multiple departments or the whole organisation.',
    personas: ['Executive Sponsor', 'Transformation Lead', 'Cross-functional Team'],
    painPoints: ['Enterprise-wide manual processes', 'Knowledge silos', 'Inconsistent data', 'Scaling AI safely'],
    kpis: ['Productivity uplift', 'Adoption rate', 'Cost-to-serve', 'Cycle time'],
  },

  // ── Finance & Accounting ────────────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance & Accounting',
    group: 'finance-accounting',
    description: 'CFO office: financial control, reporting and stewardship.',
    personas: ['CFO', 'Finance Director', 'Financial Controller'],
    painPoints: ['Slow month-end close', 'Manual reconciliations', 'Fragmented reporting', 'Limited real-time visibility'],
    kpis: ['Month-end close days', 'Forecast accuracy', 'Cost-to-serve', 'Working capital'],
  },
  {
    id: 'accounting-controllership',
    label: 'Accounting & Controllership',
    group: 'finance-accounting',
    description: 'General ledger, close, and statutory accounting.',
    personas: ['Controller', 'Accounting Manager', 'GL Accountant'],
    painPoints: ['Manual journal entries', 'Reconciliation backlog', 'Audit-trail gaps', 'Intercompany complexity'],
    kpis: ['Close cycle time', 'Reconciliation exceptions', 'Audit adjustments', 'Journal automation %'],
  },
  {
    id: 'fp-and-a',
    label: 'Financial Planning & Analysis',
    group: 'finance-accounting',
    description: 'Budgeting, forecasting and business partnering.',
    personas: ['FP&A Lead', 'Business Finance Partner', 'Budget Analyst'],
    painPoints: ['Spreadsheet-bound models', 'Slow scenario planning', 'Weak driver-based forecasting'],
    kpis: ['Forecast accuracy', 'Budget cycle time', 'Variance explained', 'Planning cycles/yr'],
  },
  {
    id: 'treasury',
    label: 'Treasury & Cash Management',
    group: 'finance-accounting',
    description: 'Liquidity, funding and financial-risk management.',
    personas: ['Treasurer', 'Cash Manager', 'Treasury Analyst'],
    painPoints: ['Poor cash visibility', 'Manual liquidity forecasting', 'FX exposure', 'Bank-fee leakage'],
    kpis: ['Cash forecast accuracy', 'Days cash on hand', 'Idle cash', 'FX hedge coverage'],
  },
  {
    id: 'tax',
    label: 'Tax',
    group: 'finance-accounting',
    description: 'Direct/indirect tax, provisioning and transfer pricing.',
    personas: ['Head of Tax', 'Tax Manager', 'Transfer Pricing Lead'],
    painPoints: ['Manual tax provisioning', 'Compliance deadlines', 'Multi-jurisdiction complexity', 'Data gathering'],
    kpis: ['Effective tax rate', 'Filing timeliness', 'Tax adjustments', 'Provision cycle time'],
    regulatory: ['OECD BEPS', 'Local tax codes', 'VAT/GST'],
  },
  {
    id: 'accounts-payable',
    label: 'Accounts Payable (P2P)',
    group: 'finance-accounting',
    description: 'Invoice processing and supplier payments.',
    personas: ['AP Manager', 'Procure-to-Pay Lead', 'AP Clerk'],
    painPoints: ['Manual invoice processing', 'Exception handling', 'Duplicate payments', 'Missed early-pay discounts'],
    kpis: ['Cost per invoice', 'Touchless invoice %', 'Days payable outstanding', 'On-time payment %'],
  },
  {
    id: 'accounts-receivable',
    label: 'Accounts Receivable (O2C)',
    group: 'finance-accounting',
    description: 'Billing, collections and cash application.',
    personas: ['AR Manager', 'Credit Controller', 'Collections Analyst'],
    painPoints: ['Late payments', 'Manual cash application', 'Dispute backlog', 'DSO pressure'],
    kpis: ['Days sales outstanding', 'Cash-application automation %', 'Bad-debt %', 'Collection effectiveness'],
  },
  {
    id: 'investor-relations',
    label: 'Investor Relations',
    group: 'finance-accounting',
    description: 'Market communication and analyst engagement.',
    personas: ['Head of IR', 'IR Manager', 'CFO'],
    painPoints: ['Manual earnings prep', 'Scattered analyst Q&A', 'Sentiment tracking', 'Disclosure consistency'],
    kpis: ['Analyst coverage', 'Consensus accuracy', 'Disclosure timeliness', 'Engagement reach'],
  },

  // ── People & HR ──────────────────────────────────────────────────────────────
  {
    id: 'human-resources',
    label: 'Human Resources',
    group: 'people-hr',
    description: 'People strategy, partnering and core HR.',
    personas: ['CHRO', 'HR Director', 'HR Business Partner'],
    painPoints: ['Fragmented people data', 'Manual processes', 'Slow service', 'Weak workforce insight'],
    kpis: ['Time-to-hire', 'Attrition', 'eNPS', 'HR cost per employee'],
  },
  {
    id: 'talent-acquisition',
    label: 'Talent Acquisition',
    group: 'people-hr',
    description: 'Sourcing, screening and hiring.',
    personas: ['Head of TA', 'Recruiter', 'Sourcer'],
    painPoints: ['Slow screening', 'High cost-per-hire', 'Candidate drop-off', 'Scheduling overhead'],
    kpis: ['Time-to-fill', 'Cost-per-hire', 'Offer acceptance %', 'Quality of hire'],
  },
  {
    id: 'learning-development',
    label: 'Learning & Development',
    group: 'people-hr',
    description: 'Capability building and upskilling.',
    personas: ['L&D Lead', 'Capability Manager', 'Instructional Designer'],
    painPoints: ['Low engagement', 'Manual content creation', 'Skills-gap blind spots'],
    kpis: ['Course completion', 'Skills coverage', 'Time-to-competency', 'Training ROI'],
  },
  {
    id: 'compensation-payroll',
    label: 'Compensation, Benefits & Payroll',
    group: 'people-hr',
    description: 'Reward, benefits administration and payroll.',
    personas: ['Reward Lead', 'Payroll Manager', 'Benefits Analyst'],
    painPoints: ['Payroll errors', 'Manual comp reviews', 'Compliance risk', 'High query volume'],
    kpis: ['Payroll accuracy', 'On-time pay-run %', 'Query resolution time', 'Pay-equity gap'],
    regulatory: ['Payroll tax', 'Labour law'],
  },
  {
    id: 'hr-operations',
    label: 'HR Operations / Shared Services',
    group: 'people-hr',
    description: 'Employee services, onboarding and HRIS.',
    personas: ['HR Ops Manager', 'HRIS Analyst', 'Employee Services Lead'],
    painPoints: ['High ticket volume', 'Manual onboarding', 'Policy lookup', 'Data quality'],
    kpis: ['Case resolution time', 'Self-service rate', 'Onboarding cycle time', 'Data accuracy'],
  },

  // ── Risk, Audit, Legal & Governance ──────────────────────────────────────────
  {
    id: 'risk-management',
    label: 'Enterprise Risk Management',
    group: 'risk-legal-governance',
    description: 'Risk identification, controls and monitoring.',
    personas: ['CRO', 'Risk Manager', 'Operational Risk Analyst'],
    painPoints: ['Manual risk registers', 'Fragmented controls', 'Slow issue detection', 'Weak KRIs'],
    kpis: ['Open risk exposure', 'Control coverage', 'Issue closure time', 'KRI breaches'],
  },
  {
    id: 'internal-audit',
    label: 'Internal Audit & Assurance',
    group: 'risk-legal-governance',
    description: 'Independent assurance and control testing.',
    personas: ['Head of Internal Audit', 'Audit Manager', 'Auditor'],
    painPoints: ['Manual control testing', 'Sampling limits', 'Slow fieldwork', 'Evidence gathering'],
    kpis: ['Audit cycle time', 'Control testing coverage', 'Findings closed on time', 'Repeat findings'],
  },
  {
    id: 'legal',
    label: 'Legal',
    group: 'risk-legal-governance',
    description: 'Contracts, advisory and dispute management.',
    personas: ['General Counsel', 'Legal Counsel', 'Contract Manager'],
    painPoints: ['Contract review backlog', 'Manual clause checks', 'Slow turnaround', 'Knowledge silos'],
    kpis: ['Contract cycle time', 'Self-serve legal %', 'Matter cost', 'Backlog'],
  },
  {
    id: 'compliance',
    label: 'Compliance & Regulatory Affairs',
    group: 'risk-legal-governance',
    description: 'Regulatory change, monitoring and attestation.',
    personas: ['Chief Compliance Officer', 'Compliance Manager', 'Regulatory Analyst'],
    painPoints: ['Regulatory change tracking', 'Manual monitoring', 'Policy mapping', 'Attestations'],
    kpis: ['Obligations covered', 'Attestation rate', 'Compliance breaches', 'Remediation time'],
    regulatory: ['Industry regulators', 'Conduct rules'],
  },
  {
    id: 'corporate-governance',
    label: 'Corporate Governance / Company Secretary',
    group: 'risk-legal-governance',
    description: 'Board support, entity management and disclosure.',
    personas: ['Company Secretary', 'Governance Officer', 'Board Coordinator'],
    painPoints: ['Manual board packs', 'Entity management', 'Minute-taking', 'Disclosure tracking'],
    kpis: ['Board pack prep time', 'Filing timeliness', 'Action-item closure', 'Entity compliance %'],
  },
  {
    id: 'data-privacy',
    label: 'Data Privacy',
    group: 'risk-legal-governance',
    description: 'Privacy programme, DSARs and consent.',
    personas: ['DPO', 'Privacy Counsel', 'Privacy Analyst'],
    painPoints: ['DSAR handling', 'Data-mapping gaps', 'Consent management', 'Breach response'],
    kpis: ['DSAR turnaround', 'RoPA coverage', 'Consent capture %', 'Breach response time'],
    regulatory: ['GDPR', 'POPIA', 'CCPA'],
  },
  {
    id: 'fraud-financial-crime',
    label: 'Fraud & Financial Crime (AML)',
    group: 'risk-legal-governance',
    description: 'AML, KYC, sanctions and fraud detection.',
    personas: ['Head of Financial Crime', 'AML Analyst', 'Fraud Investigator'],
    painPoints: ['High false positives', 'Manual alert triage', 'KYC backlog', 'Evolving typologies'],
    kpis: ['False-positive rate', 'Alert clearance time', 'SAR quality', 'KYC cycle time'],
    regulatory: ['AML/CFT', 'KYC', 'Sanctions'],
  },

  // ── Sales, Marketing & Customer ──────────────────────────────────────────────
  {
    id: 'sales',
    label: 'Sales / Commercial',
    group: 'sales-marketing-customer',
    description: 'Revenue generation and account management.',
    personas: ['CRO', 'Sales Director', 'Account Executive'],
    painPoints: ['Low selling time', 'Weak pipeline hygiene', 'Inconsistent forecasting', 'Slow proposals'],
    kpis: ['Win rate', 'Pipeline coverage', 'Sales cycle length', 'Quota attainment'],
  },
  {
    id: 'sales-operations',
    label: 'Sales Operations / RevOps',
    group: 'sales-marketing-customer',
    description: 'CRM, territory, forecasting and enablement.',
    personas: ['Sales Ops Lead', 'RevOps Manager', 'CRM Admin'],
    painPoints: ['Messy CRM data', 'Manual reporting', 'Territory/quota friction', 'Forecast variance'],
    kpis: ['Forecast accuracy', 'CRM data quality', 'Ramp time', 'Lead response time'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    group: 'sales-marketing-customer',
    description: 'Brand, demand generation and content.',
    personas: ['CMO', 'Demand Gen Lead', 'Content Manager'],
    painPoints: ['Content bottlenecks', 'Attribution gaps', 'Personalisation at scale', 'MQL quality'],
    kpis: ['CAC', 'MQL-to-SQL %', 'Campaign ROI', 'Content velocity'],
  },
  {
    id: 'customer-success',
    label: 'Customer Success',
    group: 'sales-marketing-customer',
    description: 'Adoption, retention and renewals.',
    personas: ['Head of CS', 'Customer Success Manager', 'Renewals Manager'],
    painPoints: ['Reactive churn', 'Manual health scoring', 'Onboarding delays', 'QBR prep'],
    kpis: ['Net revenue retention', 'Churn', 'Time-to-value', 'Health-score coverage'],
  },
  {
    id: 'customer-service',
    label: 'Customer Service / Contact Centre',
    group: 'sales-marketing-customer',
    description: 'Support, service and customer experience.',
    personas: ['Head of CX', 'Contact Centre Manager', 'Support Agent'],
    painPoints: ['High handle time', 'Repetitive queries', 'Agent ramp', 'Inconsistent answers'],
    kpis: ['CSAT', 'First-contact resolution', 'Average handle time', 'Deflection rate'],
  },
  {
    id: 'product-management',
    label: 'Product Management',
    group: 'sales-marketing-customer',
    description: 'Product strategy, discovery and roadmap.',
    personas: ['CPO', 'Product Manager', 'Product Owner'],
    painPoints: ['Feedback overload', 'Roadmap prioritisation', 'Slow discovery', 'Weak usage insight'],
    kpis: ['Feature adoption', 'Time-to-market', 'Roadmap throughput', 'Retention'],
  },

  // ── Operations & Supply Chain ────────────────────────────────────────────────
  {
    id: 'operations',
    label: 'Operations',
    group: 'operations-supply-chain',
    description: 'Service delivery and process excellence.',
    personas: ['COO', 'Operations Director', 'Process Excellence Lead'],
    painPoints: ['Process variability', 'Manual handoffs', 'Limited visibility', 'SLA misses'],
    kpis: ['Cycle time', 'Cost per transaction', 'SLA attainment', 'Throughput'],
  },
  {
    id: 'supply-chain',
    label: 'Supply Chain & Logistics',
    group: 'operations-supply-chain',
    description: 'Planning, inventory and distribution.',
    personas: ['Supply Chain Director', 'Demand Planner', 'Logistics Manager'],
    painPoints: ['Demand volatility', 'Stockouts/overstock', 'Fragmented visibility', 'Manual planning'],
    kpis: ['Forecast accuracy', 'On-time-in-full', 'Inventory turns', 'Logistics cost'],
  },
  {
    id: 'procurement',
    label: 'Procurement & Sourcing',
    group: 'operations-supply-chain',
    description: 'Sourcing, supplier and contract management.',
    personas: ['CPO', 'Category Manager', 'Sourcing Lead'],
    painPoints: ['Maverick spend', 'Slow sourcing', 'Supplier risk', 'Manual contract checks'],
    kpis: ['Savings realised', 'Spend under management', 'Sourcing cycle time', 'Supplier risk score'],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing / Production',
    group: 'operations-supply-chain',
    description: 'Production, plant operations and engineering.',
    personas: ['Plant Manager', 'Production Lead', 'Process Engineer'],
    painPoints: ['Unplanned downtime', 'Quality defects', 'OEE losses', 'Manual scheduling'],
    kpis: ['OEE', 'Downtime', 'Scrap rate', 'Yield'],
    regulatory: ['ISO 9001', 'Safety standards'],
  },
  {
    id: 'quality',
    label: 'Quality Management',
    group: 'operations-supply-chain',
    description: 'Quality assurance, inspection and CAPA.',
    personas: ['Quality Director', 'QA Manager', 'Quality Engineer'],
    painPoints: ['Manual inspections', 'NCR backlog', 'Root-cause delays', 'Audit prep'],
    kpis: ['Defect rate', 'First-pass yield', 'NCR closure time', 'Cost of quality'],
    regulatory: ['ISO 9001', 'GMP'],
  },
  {
    id: 'field-service',
    label: 'Field Service / Maintenance',
    group: 'operations-supply-chain',
    description: 'Asset maintenance and field operations.',
    personas: ['Field Service Manager', 'Maintenance Lead', 'Dispatcher'],
    painPoints: ['Reactive maintenance', 'Scheduling inefficiency', 'Excess truck rolls', 'Parts availability'],
    kpis: ['First-time fix rate', 'Mean time to repair', 'Asset uptime', 'Technician utilisation'],
  },

  // ── Technology & Data ────────────────────────────────────────────────────────
  {
    id: 'it',
    label: 'IT / Technology',
    group: 'technology-data',
    description: 'Infrastructure, applications and IT delivery.',
    personas: ['CIO', 'IT Director', 'Infrastructure Lead'],
    painPoints: ['Legacy estate', 'Manual operations', 'Shadow IT', 'Slow delivery'],
    kpis: ['System availability', 'Change success rate', 'IT cost ratio', 'Incident MTTR'],
  },
  {
    id: 'software-engineering',
    label: 'Software Engineering',
    group: 'technology-data',
    description: 'Software delivery, DevOps and platforms.',
    personas: ['VP Engineering', 'Engineering Manager', 'Developer'],
    painPoints: ['Slow release cycles', 'Tech debt', 'Manual testing', 'On-call load'],
    kpis: ['Lead time for changes', 'Deployment frequency', 'Change failure rate', 'MTTR'],
  },
  {
    id: 'data-analytics',
    label: 'Data & Analytics / BI',
    group: 'technology-data',
    description: 'Data platform, BI and data science.',
    personas: ['CDO', 'Analytics Lead', 'Data Scientist'],
    painPoints: ['Data silos', 'Poor data quality', 'Slow self-serve', 'Model-ops gaps'],
    kpis: ['Data quality score', 'Time-to-insight', 'Self-serve adoption', 'Models in production'],
  },
  {
    id: 'information-security',
    label: 'Information Security (CISO)',
    group: 'technology-data',
    description: 'Cyber defence, detection and response.',
    personas: ['CISO', 'Security Architect', 'SOC Analyst'],
    painPoints: ['Alert fatigue', 'Slow triage', 'Vulnerability backlog', 'Phishing exposure'],
    kpis: ['Mean time to detect', 'Mean time to respond', 'Patch SLA', 'Phishing failure rate'],
    regulatory: ['ISO 27001', 'NIST CSF', 'SOC 2'],
  },
  {
    id: 'enterprise-architecture',
    label: 'Enterprise Architecture',
    group: 'technology-data',
    description: 'Standards, rationalisation and integration.',
    personas: ['Chief Architect', 'Enterprise Architect', 'Solution Architect'],
    painPoints: ['Undocumented estate', 'Redundant applications', 'Standards drift', 'Integration sprawl'],
    kpis: ['Application rationalisation', 'Standards compliance', 'Tech-debt index', 'Reuse rate'],
  },
  {
    id: 'it-service-management',
    label: 'IT Service Management / Service Desk',
    group: 'technology-data',
    description: 'Service desk, incident and request management.',
    personas: ['Service Desk Manager', 'ITSM Lead', 'Support Analyst'],
    painPoints: ['High ticket volume', 'Repetitive requests', 'Slow resolution', 'Knowledge gaps'],
    kpis: ['First-contact resolution', 'Ticket deflection', 'MTTR', 'CSAT'],
  },

  // ── Corporate & Strategy ─────────────────────────────────────────────────────
  {
    id: 'executive-leadership',
    label: 'Executive / C-Suite',
    group: 'corporate-strategy',
    description: 'Enterprise leadership and decision-making.',
    personas: ['CEO', 'Chief of Staff', 'Executive Team'],
    painPoints: ['Fragmented reporting', 'Slow decisions', 'Weak signal-to-noise', 'Prioritisation'],
    kpis: ['Strategic initiative progress', 'Decision cycle time', 'OKR attainment', 'Enterprise value'],
  },
  {
    id: 'corporate-strategy',
    label: 'Corporate Strategy',
    group: 'corporate-strategy',
    description: 'Strategy, corporate development and M&A.',
    personas: ['Chief Strategy Officer', 'Strategy Director', 'Corp Dev Lead'],
    painPoints: ['Slow market analysis', 'Manual research', 'Scenario modelling', 'M&A diligence'],
    kpis: ['Initiative ROI', 'Time-to-insight', 'Strategy execution rate', 'Market share'],
  },
  {
    id: 'transformation-pmo',
    label: 'Transformation / PMO',
    group: 'corporate-strategy',
    description: 'Programme delivery and benefits realisation.',
    personas: ['Transformation Director', 'PMO Lead', 'Programme Manager'],
    painPoints: ['Status-report overhead', 'Benefit leakage', 'Dependency risk', 'Resource conflicts'],
    kpis: ['On-time delivery', 'Benefits realised', 'Budget variance', 'Portfolio health'],
  },
  {
    id: 'corporate-communications',
    label: 'Corporate Communications / PR',
    group: 'corporate-strategy',
    description: 'External/internal communications and PR.',
    personas: ['Head of Comms', 'PR Manager', 'Internal Comms Lead'],
    painPoints: ['Content production load', 'Message consistency', 'Media monitoring', 'Crisis response'],
    kpis: ['Share of voice', 'Sentiment', 'Engagement', 'Response time'],
  },
  {
    id: 'facilities-realestate',
    label: 'Facilities & Real Estate',
    group: 'corporate-strategy',
    description: 'Workplace, facilities and real-estate management.',
    personas: ['Head of Facilities', 'Workplace Manager', 'Real Estate Lead'],
    painPoints: ['Space utilisation', 'Energy cost', 'Reactive maintenance', 'Work-order backlog'],
    kpis: ['Space utilisation', 'Energy cost per m²', 'Work-order cycle time', 'Occupancy'],
  },
  {
    id: 'ehs-sustainability',
    label: 'EH&S / Sustainability (ESG)',
    group: 'corporate-strategy',
    description: 'Health, safety, environment and ESG reporting.',
    personas: ['Head of Sustainability', 'EHS Manager', 'ESG Analyst'],
    painPoints: ['Manual ESG data collection', 'Reporting complexity', 'Incident tracking', 'Scope-3 gaps'],
    kpis: ['Emissions intensity', 'Incident rate', 'ESG disclosure coverage', 'Energy efficiency'],
    regulatory: ['CSRD', 'GHG Protocol', 'OHS'],
  },
  {
    id: 'research-development',
    label: 'R&D / Innovation',
    group: 'corporate-strategy',
    description: 'Research, product innovation and IP.',
    personas: ['Head of R&D', 'Research Lead', 'Innovation Manager'],
    painPoints: ['Long discovery cycles', 'Literature overload', 'IP management', 'Experiment tracking'],
    kpis: ['Time-to-prototype', 'Idea-to-launch', 'R&D ROI', 'Patents filed'],
  },
]

/** id -> label map, derived from the metadata. */
export const businessFunctionLabels = BUSINESS_FUNCTIONS.reduce(
  (acc, f) => {
    acc[f.id] = f.label
    return acc
  },
  {} as Record<BusinessFunction, string>,
)

/** All function ids (handy for prompt enumeration / validation). */
export const BUSINESS_FUNCTION_IDS = BUSINESS_FUNCTIONS.map((f) => f.id)

export function getBusinessFunctionMeta(id: BusinessFunction): BusinessFunctionMeta | undefined {
  return BUSINESS_FUNCTIONS.find((f) => f.id === id)
}

export function businessFunctionLabel(id: BusinessFunction): string {
  return businessFunctionLabels[id] ?? id
}

/** Functions grouped for a grouped <Select> (enterprise-wide first). */
export function groupedBusinessFunctions(): {
  group: BusinessFunctionGroup
  label: string
  functions: BusinessFunctionMeta[]
}[] {
  return BUSINESS_FUNCTION_GROUP_ORDER.map((group) => ({
    group,
    label: businessFunctionGroupLabels[group],
    functions: BUSINESS_FUNCTIONS.filter((f) => f.group === group),
  })).filter((g) => g.functions.length > 0)
}

/**
 * Build the prompt context block for the selected business function(s).
 * Always instructs the model to tag each use case with a canonical function id,
 * so even enterprise-wide sessions yield department-labelled use cases.
 */
export function buildBusinessFunctionContext(
  functions: BusinessFunction[] | undefined,
  businessUnitLabel?: string,
): string {
  const selected = (functions ?? []).filter((f) => f !== 'cross-functional')
  const buLine = businessUnitLabel?.trim()
    ? `\nBusiness unit / division: ${businessUnitLabel.trim()}.`
    : ''
  const validValues = `Valid businessFunction values: ${BUSINESS_FUNCTION_IDS.join(', ')}.`

  if (selected.length === 0) {
    return (
      `\n\nBUSINESS FUNCTION CONTEXT: This is an enterprise-wide engagement. Generate use cases across multiple departments` +
      ` and tag EACH use case with the single business function it primarily serves.${buLine}\n${validValues}`
    )
  }

  const blocks = selected
    .map((id) => getBusinessFunctionMeta(id))
    .filter((m): m is BusinessFunctionMeta => !!m)
    .map(
      (m) =>
        `- ${m.label} (${m.id}) — stakeholders: ${m.personas.join(', ')}. ` +
        `Common pain points: ${m.painPoints.join('; ')}. ` +
        `Relevant KPIs: ${m.kpis.join('; ')}.` +
        (m.regulatory?.length ? ` Regulatory: ${m.regulatory.join(', ')}.` : ''),
    )
    .join('\n')

  return (
    `\n\nBUSINESS FUNCTION CONTEXT: Focus on the following department(s) and tailor use cases to their workflows, ` +
    `stakeholders, and KPIs:\n${blocks}${buLine}\n` +
    `Tag EACH use case with the single business function it primarily serves. ${validValues}`
  )
}
