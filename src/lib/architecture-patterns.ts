import type { ArchitecturePattern } from './duce-types'

// Curated starter Pattern Library encoding common Hub delivery shapes.
// Patterns are intentionally generic and platform-spanning; teams should
// fork or extend per engagement rather than mutate in place.
export const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
  {
    id: 'rag-enterprise-knowledge',
    name: 'Enterprise RAG over SharePoint + ADLS',
    category: 'rag-knowledge',
    surfaces: ['azure', 'm365'],
    summary:
      'Retrieval-augmented chat over enterprise unstructured content using Azure AI Search with vector + hybrid retrieval, fronted by an Azure-hosted chat app and grounded answers with citations.',
    whenToUse: [
      'Knowledge search across SharePoint, OneDrive, file shares',
      'Need for cited, auditable answers',
      'Mixed structured + unstructured corpus',
    ],
    whenNotToUse: [
      'Pure transactional automation',
      'No tolerance for any latency in answer generation',
    ],
    components: [
      'Azure AI Search (hybrid + semantic)',
      'Azure OpenAI (chat + embeddings)',
      'Azure Functions / Container Apps (orchestration)',
      'Entra ID for per-user data trimming',
      'Azure Storage / SharePoint connectors',
    ],
    aiFit: ['copilot'],
    effortWeeksRange: [4, 10],
    governanceNotes: [
      'Apply per-user ACL trimming at retrieval, not at prompt time',
      'Log prompts + completions to immutable storage for audit',
    ],
    referenceLinks: [
      {
        label: 'Azure RAG accelerator',
        url: 'https://github.com/Azure-Samples/azure-search-openai-demo',
      },
    ],
  },
  {
    id: 'copilot-studio-ds-agent',
    name: 'Copilot Studio + Dataverse Customer Service Agent',
    category: 'low-code',
    surfaces: ['power-platform', 'm365'],
    summary:
      'Low-code conversational agent built in Copilot Studio with Dataverse-grounded knowledge and Power Automate actions for ticket creation, escalation, and CRM lookups.',
    whenToUse: [
      'High-volume Tier-1 support deflection',
      'Existing Dynamics or Dataverse footprint',
      'Need rapid deployment with minimal pro-code',
    ],
    components: [
      'Copilot Studio',
      'Dataverse',
      'Power Automate flows',
      'Microsoft Teams / web chat channels',
    ],
    aiFit: ['copilot', 'agentic'],
    effortWeeksRange: [3, 8],
    governanceNotes: [
      'Use environment strategy: dev / test / prod with solution layering',
      'Apply DLP policies to flows touching customer data',
    ],
  },
  {
    id: 'agentic-multi-tool-orchestrator',
    name: 'Agentic Workflow with Microsoft Foundry Agent Framework',
    category: 'agentic',
    surfaces: ['azure', 'm365'],
    summary:
      'Multi-step agent that plans, calls tools, and produces artefacts, hosted as an Azure Function with Foundry Agents SDK. Tools integrate Microsoft Graph, line-of-business APIs, and enterprise search.',
    whenToUse: [
      'Multi-step workflows requiring planning + tool use',
      'Cross-system orchestration (Graph + LOB)',
      'Need for human approval gates between steps',
    ],
    whenNotToUse: ['Single-turn Q&A — use RAG pattern instead'],
    components: [
      'Microsoft Foundry Agents SDK',
      'Azure Functions / Container Apps',
      'Azure AI Search (knowledge tool)',
      'Microsoft Graph (productivity tools)',
      'Application Insights for trace collection',
    ],
    aiFit: ['agentic'],
    effortWeeksRange: [6, 14],
    governanceNotes: [
      'Sandbox tool execution; no shell access from agent runtime',
      'Trace every tool call to App Insights for audit',
    ],
  },
  {
    id: 'fabric-realtime-analytics',
    name: 'Microsoft Fabric Real-Time Analytics + Power BI',
    category: 'analytics',
    surfaces: ['fabric'],
    summary:
      'Streaming ingest via Eventstream into KQL database, with Power BI Direct Lake semantic model for sub-second dashboards. Optional ML scoring via Fabric Data Science.',
    whenToUse: [
      'Operational dashboards refreshed in seconds',
      'IoT or telemetry workloads',
      'Need to retire siloed Synapse + ADX + ADF stack',
    ],
    components: [
      'Fabric Eventstream',
      'Fabric KQL database',
      'OneLake',
      'Power BI Direct Lake',
      'Optional: Data Activator alerts',
    ],
    aiFit: ['predictive', 'automation'],
    effortWeeksRange: [4, 12],
    governanceNotes: [
      'Use OneLake security and workspace roles consistently',
      'Treat Direct Lake semantic models as production artefacts (CI/CD)',
    ],
  },
  {
    id: 'power-pages-intake-fabric',
    name: 'Power Pages Intake to Fabric Insights',
    category: 'app-modernization',
    surfaces: ['power-platform', 'fabric', 'azure'],
    summary:
      'External-facing intake form on Power Pages, persisted to Dataverse, mirrored into Fabric for analytics and AI scoring. Notifications via Power Automate.',
    whenToUse: [
      'External users submitting structured intake (citizen, partner, customer)',
      'Need analytics + AI scoring on submitted records',
      'Low-code preferred for the front door',
    ],
    components: [
      'Power Pages',
      'Dataverse',
      'Power Automate',
      'Fabric Lakehouse + Notebook scoring',
      'Azure AI Foundry endpoint (optional model)',
    ],
    aiFit: ['copilot', 'predictive'],
    effortWeeksRange: [4, 10],
    governanceNotes: [
      'Apply CAPTCHA + rate limiting on Power Pages forms',
      'Mirror PII fields with column-level security in Fabric',
    ],
  },
  {
    id: 'predictive-maintenance-iot',
    name: 'Predictive Maintenance on IoT Telemetry',
    category: 'analytics',
    surfaces: ['azure', 'fabric'],
    summary:
      'IoT Hub ingest then Fabric Eventstream then KQL anomaly detection then Azure ML scoring then alerts via Logic Apps and Teams adaptive cards.',
    whenToUse: [
      'Heavy assets with sensor telemetry',
      'Mining, manufacturing, energy operations',
      'Existing OEE or condition-monitoring pain',
    ],
    components: [
      'Azure IoT Hub',
      'Fabric Eventstream + KQL',
      'Azure ML',
      'Logic Apps',
      'Power BI / Teams notifications',
    ],
    aiFit: ['predictive'],
    industries: ['mining-resources', 'manufacturing', 'energy'],
    effortWeeksRange: [8, 16],
    governanceNotes: [
      'Isolate OT network with Purdue model boundaries',
      'No control commands from AI — recommendations only initially',
    ],
  },
  {
    id: 'secure-foundation-landing-zone',
    name: 'Azure Secure Landing Zone',
    category: 'security-governance',
    surfaces: ['azure'],
    summary:
      'Hub-spoke landing zone with Entra ID, Defender for Cloud, Policy + Initiatives, Private Link, and centralized logging — prerequisite for any production AI workload.',
    whenToUse: [
      'No existing landing zone or non-compliant subscription posture',
      'Regulated industries (financial services, healthcare, government)',
      'Sovereign cloud / data residency requirements',
    ],
    components: [
      'Entra ID + PIM',
      'Azure Policy + Initiatives',
      'Defender for Cloud',
      'Private Link, NSGs, Azure Firewall',
      'Centralized Log Analytics + Sentinel',
    ],
    aiFit: ['automation'],
    effortWeeksRange: [6, 12],
    governanceNotes: [
      'Enforce policy as code via Bicep / Terraform',
      'Treat landing zone changes as gated PRs',
    ],
  },
  {
    id: 'doc-intel-finance-automation',
    name: 'Document Intelligence for Finance Operations',
    category: 'integration',
    surfaces: ['azure', 'power-platform'],
    summary:
      'Invoices, POs, statements processed by Azure AI Document Intelligence, validated, then routed via Power Automate into ERP (SAP, D365 F&O) with human-in-the-loop exception queues.',
    whenToUse: [
      'High-volume invoice or statement processing',
      'Existing manual AP / AR workflows',
      'ERP that supports API-based posting',
    ],
    components: [
      'Azure AI Document Intelligence',
      'Power Automate',
      'Dataverse exception queue',
      'SAP / D365 F&O connector',
      'Application Insights monitoring',
    ],
    aiFit: ['automation', 'copilot'],
    effortWeeksRange: [6, 12],
    governanceNotes: [
      'Maintain confidence threshold; below threshold then human review',
      'Retain originals + extracted JSON for audit',
    ],
  },
]

export function getPatternById(id: string): ArchitecturePattern | undefined {
  return ARCHITECTURE_PATTERNS.find((p) => p.id === id)
}

export const PATTERN_CATEGORY_LABELS: Record<string, string> = {
  'data-platform': 'Data Platform',
  'rag-knowledge': 'RAG & Knowledge',
  agentic: 'Agentic',
  'app-modernization': 'App Modernization',
  integration: 'Integration',
  analytics: 'Analytics',
  'low-code': 'Low-Code',
  'security-governance': 'Security & Governance',
}
