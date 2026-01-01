import { KPI } from './types'

export const AVAILABLE_KPIS: KPI[] = [
  {
    id: 'avg-review-time',
    name: 'Average Review Time',
    category: 'efficiency',
    description: 'Mean time to complete review processes',
  },
  {
    id: 'sla-compliance',
    name: 'SLA Compliance',
    category: 'compliance',
    description: 'Percentage of tasks meeting service level agreements',
  },
  {
    id: 'risks-flagged',
    name: 'Risks Flagged',
    category: 'quality',
    description: 'Number of potential risks identified and escalated',
  },
  {
    id: 'response-time',
    name: 'Response Time',
    category: 'performance',
    description: 'Time to first response or action',
  },
  {
    id: 'counsel-workload',
    name: 'Counsel Workload',
    category: 'workload',
    description: 'Volume of active cases per legal counsel',
  },
  {
    id: 'relevance-score',
    name: 'Relevance Score',
    category: 'quality',
    description: 'Accuracy and relevance of recommendations or outputs',
  },
  {
    id: 'accuracy-score',
    name: 'Accuracy Score',
    category: 'quality',
    description: 'Correctness of automated decisions or classifications',
  },
  {
    id: 'throughput',
    name: 'Throughput',
    category: 'efficiency',
    description: 'Number of items processed per time period',
  },
  {
    id: 'error-rate',
    name: 'Error Rate',
    category: 'quality',
    description: 'Percentage of errors or rejections',
  },
  {
    id: 'time-to-resolution',
    name: 'Time to Resolution',
    category: 'performance',
    description: 'Duration from issue creation to closure',
  },
  {
    id: 'user-satisfaction',
    name: 'User Satisfaction',
    category: 'quality',
    description: 'Customer or stakeholder satisfaction ratings',
  },
  {
    id: 'cost-per-transaction',
    name: 'Cost per Transaction',
    category: 'efficiency',
    description: 'Average cost to process a single transaction',
  },
  {
    id: 'automation-rate',
    name: 'Automation Rate',
    category: 'efficiency',
    description: 'Percentage of tasks completed without manual intervention',
  },
  {
    id: 'backlog-size',
    name: 'Backlog Size',
    category: 'workload',
    description: 'Number of pending items awaiting action',
  },
  {
    id: 'compliance-violations',
    name: 'Compliance Violations',
    category: 'compliance',
    description: 'Count of regulatory or policy breaches detected',
  },
  {
    id: 'escalation-rate',
    name: 'Escalation Rate',
    category: 'workload',
    description: 'Percentage of cases requiring higher-level review',
  },
  {
    id: 'first-contact-resolution',
    name: 'First Contact Resolution',
    category: 'performance',
    description: 'Issues resolved on initial interaction',
  },
  {
    id: 'processing-time',
    name: 'Processing Time',
    category: 'performance',
    description: 'Time required to complete standard workflows',
  },
]

export function getKPIById(id: string): KPI | undefined {
  return AVAILABLE_KPIS.find((kpi) => kpi.id === id)
}

export function getKPIsByCategory(category: KPI['category']): KPI[] {
  return AVAILABLE_KPIS.filter((kpi) => kpi.category === category)
}

export const KPI_CATEGORIES = [
  { value: 'efficiency', label: 'Efficiency', color: 'oklch(0.58 0.18 195)' },
  { value: 'quality', label: 'Quality', color: 'oklch(0.65 0.20 310)' },
  { value: 'performance', label: 'Performance', color: 'oklch(0.60 0.18 250)' },
  { value: 'compliance', label: 'Compliance', color: 'oklch(0.62 0.18 280)' },
  { value: 'workload', label: 'Workload', color: 'oklch(0.70 0.15 270)' },
] as const
