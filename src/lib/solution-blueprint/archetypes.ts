import type { ArchetypeDef } from './types'

/**
 * Common use-case archetypes seen in Innovation Hub envisioning. Each
 * archetype declares the capabilities it requires; the recommender then
 * resolves those capabilities to specific services for both blueprint paths.
 */
export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'rag-knowledge-assistant',
    name: 'RAG Knowledge Assistant',
    description:
      'Conversational assistant grounded in enterprise documents, policies, or product knowledge using retrieval-augmented generation.',
    requiredCapabilities: [
      'llm-hosting',
      'embeddings',
      'vector-store',
      'search-index',
      'object-storage',
      'app-hosting-container',
      'workforce-identity',
      'managed-identity',
      'secrets-mgmt',
      'content-safety',
      'observability-logs',
    ],
    recommendedCapabilities: ['ai-gateway', 'jailbreak-detection', 'private-networking', 'responsible-ai-evals', 'ux-surface-teams'],
    risks: [
      'Prompt injection from ingested documents',
      'Sensitive data exposure via grounding sources',
      'Hallucinations on out-of-scope queries',
      'Permissions leakage if document ACLs are not honored at retrieval',
    ],
    typicalKpis: ['Time to answer', 'Deflection rate', 'CSAT', 'Knowledge worker productivity'],
    pilotCostBandUsd: { min: 3000, max: 12000 },
  },
  {
    id: 'agentic-process-automation',
    name: 'Agentic Process Automation',
    description:
      'Multi-step agent that takes actions across systems (CRM, ERP, ticketing) to complete a business process end-to-end.',
    requiredCapabilities: [
      'llm-hosting',
      'agent-orchestration',
      'integration-connectors',
      'workflow-orchestration',
      'app-hosting-container',
      'agent-identity',
      'managed-identity',
      'secrets-mgmt',
      'content-safety',
      'observability-traces',
      'observability-logs',
    ],
    recommendedCapabilities: ['ai-gateway', 'jailbreak-detection', 'responsible-ai-evals', 'private-networking'],
    risks: [
      'Unauthorized actions via tool misuse',
      'Cascading failures across integrated systems',
      'Auditability of autonomous decisions',
      'Identity sprawl if agents share credentials',
    ],
    typicalKpis: ['Cycle time', 'Process cost', 'Error rate', 'Throughput'],
    pilotCostBandUsd: { min: 8000, max: 25000 },
  },
  {
    id: 'document-intelligence',
    name: 'Document Intelligence Pipeline',
    description:
      'Extract structured data from forms, invoices, contracts, or claims and route into downstream systems.',
    requiredCapabilities: [
      'document-intelligence',
      'object-storage',
      'app-hosting-serverless',
      'messaging-queue',
      'relational-db',
      'managed-identity',
      'secrets-mgmt',
      'observability-logs',
    ],
    recommendedCapabilities: ['data-classification', 'private-networking', 'workflow-orchestration'],
    risks: [
      'PII handling and residency',
      'Extraction accuracy on low-quality scans',
      'Compliance with retention policies',
    ],
    typicalKpis: ['Documents processed/day', 'Straight-through processing rate', 'Cost per document'],
    pilotCostBandUsd: { min: 2500, max: 10000 },
  },
  {
    id: 'contact-center-copilot',
    name: 'Contact Center Copilot',
    description:
      'Real-time agent assist with transcription, summarization, knowledge lookup, and after-call work automation.',
    requiredCapabilities: [
      'speech-to-text',
      'llm-hosting',
      'search-index',
      'embeddings',
      'app-hosting-container',
      'event-streaming',
      'workforce-identity',
      'managed-identity',
      'content-safety',
      'observability-logs',
    ],
    recommendedCapabilities: ['ai-gateway', 'text-to-speech', 'responsible-ai-evals', 'jailbreak-detection'],
    risks: [
      'Real-time latency budgets',
      'Call recording compliance',
      'Bias in agent suggestions',
    ],
    typicalKpis: ['Average handle time', 'First-call resolution', 'CSAT', 'After-call work time'],
    pilotCostBandUsd: { min: 6000, max: 20000 },
  },
  {
    id: 'm365-copilot-extension',
    name: 'Microsoft 365 Copilot Extension',
    description:
      'Declarative or custom-engine agent that surfaces enterprise capabilities inside Microsoft 365 Copilot or Teams.',
    requiredCapabilities: [
      'ux-surface-copilot',
      'ux-surface-teams',
      'llm-hosting',
      'app-hosting-serverless',
      'workforce-identity',
      'managed-identity',
      'secrets-mgmt',
      'observability-logs',
    ],
    recommendedCapabilities: ['integration-connectors', 'search-index', 'content-safety'],
    risks: [
      'Tenant data boundary management',
      'Permissions model in M365',
      'App lifecycle and version compatibility',
    ],
    typicalKpis: ['Active users', 'Tasks completed in Copilot', 'Time saved per user'],
    pilotCostBandUsd: { min: 4000, max: 15000 },
  },
  {
    id: 'predictive-analytics',
    name: 'Predictive Analytics Workload',
    description:
      'ML-driven forecasting, anomaly detection, or scoring on operational / business data.',
    requiredCapabilities: [
      'lakehouse',
      'data-pipeline',
      'analytical-store',
      'app-hosting-container',
      'managed-identity',
      'observability-logs',
      'observability-metrics',
    ],
    recommendedCapabilities: ['data-governance', 'private-networking', 'cost-mgmt'],
    risks: [
      'Model drift and retraining cadence',
      'Data quality and lineage',
      'Bias and fairness in scoring',
    ],
    typicalKpis: ['Forecast MAPE', 'Anomalies detected', 'Decision latency'],
    pilotCostBandUsd: { min: 5000, max: 18000 },
  },
  {
    id: 'computer-vision-quality',
    name: 'Computer Vision Quality / Safety',
    description:
      'Image / video analytics for defect detection, safety compliance, or asset inspection (often edge + cloud).',
    requiredCapabilities: [
      'vision-ocr',
      'object-storage',
      'event-streaming',
      'app-hosting-container',
      'managed-identity',
      'observability-logs',
    ],
    recommendedCapabilities: ['private-networking', 'data-governance', 'backup-dr'],
    risks: [
      'False positives / negatives in safety contexts',
      'Edge connectivity and offline operation',
      'Privacy if cameras capture personnel',
    ],
    typicalKpis: ['Defect catch rate', 'False-positive rate', 'Inspection throughput'],
    pilotCostBandUsd: { min: 7000, max: 22000 },
  },
  {
    id: 'event-driven-integration',
    name: 'Event-Driven Integration',
    description:
      'Stream business events between systems with transformations, enrichment, and reliable delivery.',
    requiredCapabilities: [
      'event-streaming',
      'messaging-queue',
      'app-hosting-serverless',
      'integration-connectors',
      'managed-identity',
      'secrets-mgmt',
      'observability-logs',
    ],
    recommendedCapabilities: ['private-networking', 'api-management', 'observability-traces'],
    risks: [
      'Message ordering and duplication',
      'Backpressure and DLQ handling',
      'Schema evolution',
    ],
    typicalKpis: ['Event throughput', 'End-to-end latency', 'Delivery success rate'],
    pilotCostBandUsd: { min: 2000, max: 8000 },
  },
]

export const ARCHETYPE_BY_ID: Record<string, ArchetypeDef> = ARCHETYPES.reduce(
  (acc, a) => {
    acc[a.id] = a
    return acc
  },
  {} as Record<string, ArchetypeDef>,
)
