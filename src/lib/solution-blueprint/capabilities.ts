import type { CapabilityDef, CapabilityId, BlueprintLayer } from './types'

export const CAPABILITIES: CapabilityDef[] = [
  // ── App & AI ────────────────────────────────────────────────
  { id: 'llm-hosting', name: 'LLM hosting', layer: 'app-ai', description: 'Hosted large language models for generation, reasoning, and chat.' },
  { id: 'agent-orchestration', name: 'Agent orchestration', layer: 'app-ai', description: 'Frameworks to orchestrate tools, memory, and multi-step agent workflows.' },
  { id: 'embeddings', name: 'Embeddings', layer: 'app-ai', description: 'Vector embedding generation for semantic search and RAG.' },
  { id: 'speech-to-text', name: 'Speech to text', layer: 'app-ai', description: 'Real-time and batch transcription.' },
  { id: 'text-to-speech', name: 'Text to speech', layer: 'app-ai', description: 'Neural voice synthesis.' },
  { id: 'vision-ocr', name: 'Vision / OCR', layer: 'app-ai', description: 'Image understanding and optical character recognition.' },
  { id: 'document-intelligence', name: 'Document intelligence', layer: 'app-ai', description: 'Structured extraction from forms, invoices, and contracts.' },
  { id: 'content-safety', name: 'Content safety', layer: 'app-ai', description: 'Harm category detection and policy enforcement on AI input/output.' },
  { id: 'ai-gateway', name: 'AI gateway', layer: 'app-ai', description: 'Centralized routing, throttling, observability, and policy enforcement for AI calls.' },
  { id: 'app-hosting-web', name: 'Web app hosting', layer: 'app-ai', description: 'PaaS web app hosting with autoscale and TLS.' },
  { id: 'app-hosting-container', name: 'Container hosting', layer: 'app-ai', description: 'Container runtime (managed or Kubernetes-based).' },
  { id: 'app-hosting-serverless', name: 'Serverless functions', layer: 'app-ai', description: 'Event-driven serverless compute with pay-per-execution billing.' },
  { id: 'workflow-orchestration', name: 'Workflow orchestration', layer: 'app-ai', description: 'Low-code or code workflow engine for long-running business processes.' },
  { id: 'integration-connectors', name: 'Integration connectors', layer: 'app-ai', description: 'Pre-built connectors to SaaS and line-of-business systems.' },
  { id: 'event-streaming', name: 'Event streaming', layer: 'app-ai', description: 'High-throughput event ingestion for telemetry and IoT.' },
  { id: 'messaging-queue', name: 'Messaging / queue', layer: 'app-ai', description: 'Asynchronous message delivery with ordering / DLQ.' },
  { id: 'api-management', name: 'API management', layer: 'app-ai', description: 'API gateway with auth, throttling, versioning, and developer portal.' },
  { id: 'ux-surface-teams', name: 'Microsoft Teams surface', layer: 'app-ai', description: 'Teams app, bot, message extension, or tab.' },
  { id: 'ux-surface-copilot', name: 'Microsoft 365 Copilot surface', layer: 'app-ai', description: 'Declarative or custom-engine agent surfaced inside Microsoft 365 Copilot.' },
  { id: 'ux-surface-power-platform', name: 'Power Platform surface', layer: 'app-ai', description: 'Power Apps / Power Automate / Copilot Studio surface.' },

  // ── Data ────────────────────────────────────────────────────
  { id: 'relational-db', name: 'Relational database', layer: 'data', description: 'Transactional SQL store.' },
  { id: 'nosql-db', name: 'NoSQL document store', layer: 'data', description: 'Flexible-schema document / key-value database.' },
  { id: 'vector-store', name: 'Vector store', layer: 'data', description: 'Vector index for similarity search and RAG.' },
  { id: 'search-index', name: 'Search index', layer: 'data', description: 'Full-text + semantic + hybrid search.' },
  { id: 'analytical-store', name: 'Analytical store / warehouse', layer: 'data', description: 'Columnar warehouse for BI and analytics workloads.' },
  { id: 'lakehouse', name: 'Lakehouse', layer: 'data', description: 'Unified storage + analytics combining lake and warehouse semantics.' },
  { id: 'data-pipeline', name: 'Data pipeline / ETL', layer: 'data', description: 'Batch / streaming pipelines for data movement and transformation.' },
  { id: 'data-governance', name: 'Data governance', layer: 'data', description: 'Catalog, lineage, classification, and data quality.' },
  { id: 'object-storage', name: 'Object storage', layer: 'data', description: 'Blob / object storage for unstructured data.' },

  // ── Infrastructure ──────────────────────────────────────────
  { id: 'private-networking', name: 'Private networking', layer: 'infrastructure', description: 'VNet, private endpoints, and hub-spoke topology.' },
  { id: 'cdn-edge', name: 'CDN / edge delivery', layer: 'infrastructure', description: 'Global content delivery and edge caching.' },
  { id: 'kubernetes-platform', name: 'Kubernetes platform', layer: 'infrastructure', description: 'Managed Kubernetes for containerized workloads.' },
  { id: 'iac-pipeline', name: 'IaC pipeline', layer: 'infrastructure', description: 'Declarative infrastructure (Bicep / Terraform / Pulumi) with CI/CD.' },
  { id: 'observability-logs', name: 'Logs', layer: 'infrastructure', description: 'Centralized log aggregation and querying.' },
  { id: 'observability-metrics', name: 'Metrics', layer: 'infrastructure', description: 'Time-series metrics and dashboards.' },
  { id: 'observability-traces', name: 'Distributed traces', layer: 'infrastructure', description: 'End-to-end request tracing across services.' },

  // ── Identity ────────────────────────────────────────────────
  { id: 'workforce-identity', name: 'Workforce identity', layer: 'identity', description: 'Employee SSO, MFA, and conditional access.' },
  { id: 'consumer-identity', name: 'Consumer identity', layer: 'identity', description: 'External / B2C identity with social and local accounts.' },
  { id: 'managed-identity', name: 'Managed identity', layer: 'identity', description: 'Workload identity for service-to-service auth without secrets.' },
  { id: 'agent-identity', name: 'Agent identity', layer: 'identity', description: 'First-class identity for autonomous agents (Entra Agent ID).' },
  { id: 'privileged-access-mgmt', name: 'Privileged access management', layer: 'identity', description: 'Just-in-time elevation for sensitive roles.' },

  // ── Security ────────────────────────────────────────────────
  { id: 'secrets-mgmt', name: 'Secrets management', layer: 'security', description: 'Centralized secret vaulting with rotation.' },
  { id: 'key-mgmt-cmk', name: 'Customer-managed keys', layer: 'security', description: 'Customer-controlled encryption keys (HSM-backed).' },
  { id: 'waf', name: 'Web application firewall', layer: 'security', description: 'L7 protection against OWASP Top 10.' },
  { id: 'ddos-protection', name: 'DDoS protection', layer: 'security', description: 'Network-layer DDoS mitigation.' },
  { id: 'siem', name: 'SIEM', layer: 'security', description: 'Security event correlation, hunting, and incident response.' },
  { id: 'cloud-posture-mgmt', name: 'Cloud posture management', layer: 'security', description: 'CSPM with misconfiguration detection and recommendations.' },
  { id: 'dlp', name: 'Data loss prevention', layer: 'security', description: 'Detect and prevent exfiltration of sensitive data.' },
  { id: 'data-classification', name: 'Data classification', layer: 'security', description: 'Automated labeling of sensitive data classes.' },
  { id: 'jailbreak-detection', name: 'Prompt-injection / jailbreak detection', layer: 'security', description: 'Defenses against prompt injection and jailbreak attempts on LLM apps.' },

  // ── Operations ──────────────────────────────────────────────
  { id: 'cost-mgmt', name: 'Cost management', layer: 'operations', description: 'Spend visibility, budgets, anomaly detection.' },
  { id: 'capacity-mgmt', name: 'Capacity management', layer: 'operations', description: 'Quota tracking and capacity reservations.' },
  { id: 'responsible-ai-evals', name: 'Responsible AI evals', layer: 'operations', description: 'Quality, safety, and groundedness evaluations for AI apps.' },
  { id: 'backup-dr', name: 'Backup & DR', layer: 'operations', description: 'Backup, restore, and disaster recovery.' },
]

export const CAPABILITY_BY_ID: Record<CapabilityId, CapabilityDef> = CAPABILITIES.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<CapabilityId, CapabilityDef>,
)

export function capabilitiesForLayer(layer: BlueprintLayer): CapabilityDef[] {
  return CAPABILITIES.filter((c) => c.layer === layer)
}
