/**
 * Architecture Layers, Principles, and CAF Configuration
 *
 * Codifies the 5-layer Conceptual Reference Architecture, 8 architectural
 * principles, 7 CAF capability pillars, deployment channels, and interop
 * protocols — all derived from the enterprise AI architecture slides.
 */

import type {
  ArchitectureLayer,
  ArchitecturePrinciple,
  CAFCapability,
  CAFLifecycleStage,
  DeploymentChannel,
  InteropProtocol,
} from './types'

// ============================================================================
// 5-LAYER CONCEPTUAL REFERENCE ARCHITECTURE
// ============================================================================

export interface ArchitectureLayerInfo {
  id: ArchitectureLayer
  label: string
  description: string
  responsibilities: string[]
  principlesApplied: ArchitecturePrinciple[]
  /** Service IDs that naturally belong in this layer */
  typicalServices: string[]
  order: number // 0 = top layer (engagement), 4 = bottom layer (LZ capabilities)
  color: string // Tailwind bg class for the layer band
}

export const ARCHITECTURE_LAYERS: Record<ArchitectureLayer, ArchitectureLayerInfo> = {
  'engagement': {
    id: 'engagement',
    label: 'AI Engagement Layer',
    description: 'Provides user-facing interfaces for GenAI use cases, BI visualization, and workflow automation.',
    responsibilities: [
      'Gen AI & Analytics Use Case Development',
      'Visualization & BI',
      'Automation & Workflow',
    ],
    principlesApplied: ['availability', 'scalability', 'security-compliance', 'interoperability'],
    typicalServices: [
      'azure-bot-service', 'power-bi', 'app-service', 'm365-copilot',
      'power-apps', 'azure-app-service',
    ],
    order: 0,
    color: 'bg-amber-500/15 border-amber-500/30',
  },
  'enterprise-capabilities': {
    id: 'enterprise-capabilities',
    label: 'AI Enterprise Capabilities',
    description: 'Acts as the orchestration layer for Conversational AI, AI Agents, and automation workflows. Ensures interoperability and modular integration with enterprise systems.',
    responsibilities: [
      'Conversational AI',
      'AI Agents',
      'Agent Protocols (MCP, A2A)',
      'Automation Workflows',
    ],
    principlesApplied: ['availability', 'security-compliance', 'interoperability', 'cloud-native'],
    typicalServices: [
      'azure-openai', 'copilot-studio', 'azure-bot-service',
      'azure-functions', 'azure-logic-apps', 'azure-container-apps',
    ],
    order: 1,
    color: 'bg-orange-500/15 border-orange-500/30',
  },
  'foundry-ai-services': {
    id: 'foundry-ai-services',
    label: 'Foundry Models & AI Services',
    description: 'Core AI engine for building, hosting, and managing models. Includes pre-trained models, custom model hosting, and AI pipelines for business accelerators.',
    responsibilities: [
      'Build Models',
      'Pre-trained Models',
      'Business Capability Accelerators',
      'Host Custom Models',
      'Define AI Pipelines',
    ],
    principlesApplied: ['data-resilience', 'scalability', 'security-compliance', 'cost-optimization'],
    typicalServices: [
      'azure-ai-foundry', 'azure-openai', 'azure-machine-learning',
      'azure-ai-search', 'azure-ai-document-intelligence', 'azure-ai-content-safety',
      'azure-ai-vision', 'azure-ai-speech', 'azure-ai-language',
    ],
    order: 2,
    color: 'bg-yellow-500/15 border-yellow-500/30',
  },
  'ai-landing-zone': {
    id: 'ai-landing-zone',
    label: 'AI Landing Zone',
    description: 'Foundation for deploying AI workloads securely and at scale. Provides R&D sandbox, analytics tools, and integration with enterprise landing zone governance.',
    responsibilities: [
      'AI/Gen AI Landing Zone',
      'R&D Sandbox Environment',
      'Analytics & Visualization Tools',
    ],
    principlesApplied: ['scalability', 'cloud-native', 'cost-optimization', 'observability'],
    typicalServices: [
      'azure-cosmos-db', 'azure-storage', 'azure-sql', 'azure-redis',
      'azure-key-vault', 'entra-id', 'fabric-data-science',
      'azure-databricks', 'sharepoint',
    ],
    order: 3,
    color: 'bg-yellow-600/15 border-yellow-600/30',
  },
  'lz-capabilities': {
    id: 'lz-capabilities',
    label: 'Other Landing Zone Capabilities',
    description: 'Supports operational excellence with LLMOps, DevOps, monitoring, and logging. Ensures observability, compliance, and lifecycle management for AI solutions.',
    responsibilities: [
      'LLMOps & DevOps',
      'Monitoring',
      'Logging',
    ],
    principlesApplied: ['observability', 'security-compliance', 'cost-optimization', 'interoperability'],
    typicalServices: [
      'azure-monitor', 'log-analytics', 'application-insights',
      'azure-devops', 'github-copilot',
    ],
    order: 4,
    color: 'bg-stone-500/15 border-stone-500/30',
  },
}

/** Ordered array of layers from top (engagement) to bottom (LZ capabilities) */
export const ARCHITECTURE_LAYERS_ORDERED = Object.values(ARCHITECTURE_LAYERS)
  .sort((a, b) => a.order - b.order)

/**
 * Look up which layer a service naturally belongs to.
 * Returns the first matching layer, or undefined.
 */
export function getServiceLayer(serviceId: string): ArchitectureLayer | undefined {
  for (const layer of ARCHITECTURE_LAYERS_ORDERED) {
    if (layer.typicalServices.includes(serviceId)) return layer.id
  }
  return undefined
}

// ============================================================================
// 8 ARCHITECTURAL PRINCIPLES
// ============================================================================

export interface ArchitecturePrincipleInfo {
  id: ArchitecturePrinciple
  label: string
  description: string
  aiArchitectureMeaning: string
  componentsMapped: string[]
  icon: string
}

export const ARCHITECTURE_PRINCIPLES: Record<ArchitecturePrinciple, ArchitecturePrincipleInfo> = {
  'availability': {
    id: 'availability',
    label: 'Availability',
    description: 'Ensure high uptime and redundancy',
    aiArchitectureMeaning: 'AI services (Conversational AI, Agents) must remain accessible for real-time workflows and GenAI use cases without disruption.',
    componentsMapped: ['azure-app-service', 'azure-bot-service', 'azure-container-apps', 'azure-ai-foundry'],
    icon: '🟢',
  },
  'data-resilience': {
    id: 'data-resilience',
    label: 'Data Resilience',
    description: 'Protect data integrity and enable recovery',
    aiArchitectureMeaning: 'Pre-trained models, pipelines, and business accelerators need backup and failover to avoid loss during R&D or production.',
    componentsMapped: ['azure-key-vault', 'azure-ai-content-safety', 'azure-cosmos-db'],
    icon: '🛡️',
  },
  'cloud-native': {
    id: 'cloud-native',
    label: 'Leverage Cloud-Native / Managed Services',
    description: 'Reduce operational overhead using managed services',
    aiArchitectureMeaning: 'Use managed AI services for hosting models, analytics, and automation workflows to accelerate deployment and reduce complexity.',
    componentsMapped: ['azure-ai-foundry', 'copilot-studio', 'azure-ai-content-safety', 'log-analytics', 'power-bi'],
    icon: '☁️',
  },
  'scalability': {
    id: 'scalability',
    label: 'Scalability & Capacity',
    description: 'Elastic scaling for variable workloads',
    aiArchitectureMeaning: 'AI Landing Zone and model hosting must scale dynamically for training, inference, and analytics workloads.',
    componentsMapped: ['azure-kubernetes', 'azure-app-service', 'azure-container-apps'],
    icon: '📈',
  },
  'observability': {
    id: 'observability',
    label: 'Observability & Monitoring',
    description: 'End-to-end visibility for performance and reliability',
    aiArchitectureMeaning: 'Enable monitoring across AI pipelines, LLMOps, and R&D environments for proactive issue detection and optimization.',
    componentsMapped: ['azure-monitor', 'log-analytics', 'power-bi'],
    icon: '🔍',
  },
  'security-compliance': {
    id: 'security-compliance',
    label: 'Security & Compliance',
    description: 'Enforce identity and access control',
    aiArchitectureMeaning: 'Secure sensitive AI models, data pipelines, and agent protocols to meet compliance and governance standards.',
    componentsMapped: ['azure-key-vault', 'entra-id'],
    icon: '🔒',
  },
  'interoperability': {
    id: 'interoperability',
    label: 'Interoperability',
    description: 'Enable modular integration across layers',
    aiArchitectureMeaning: 'Ensure AI agents, workflows, and engagement layers can integrate seamlessly with enterprise systems and APIs.',
    componentsMapped: ['azure-functions', 'azure-logic-apps', 'azure-api-management'],
    icon: '🔗',
  },
  'cost-optimization': {
    id: 'cost-optimization',
    label: 'Cost Optimization',
    description: 'Optimize cost for predictable and burst workloads',
    aiArchitectureMeaning: 'Balance cost for AI experimentation (sandbox) and production workloads using pay-as-you-go and reserved capacity.',
    componentsMapped: ['azure-kubernetes', 'azure-functions', 'azure-container-apps'],
    icon: '💰',
  },
}

// ============================================================================
// 7 CAF CAPABILITY PILLARS
// ============================================================================

export interface CAFCapabilityInfo {
  id: CAFCapability
  label: string
  subCapabilities: string[]
  lifecyclePhases: CAFLifecycleStage[]
  icon: string
}

export const CAF_CAPABILITIES: Record<CAFCapability, CAFCapabilityInfo> = {
  'strategy-governance': {
    id: 'strategy-governance',
    label: 'Cloud Strategy & Governance',
    subCapabilities: [
      'Cloud Strategy',
      'Cloud Governance',
      'Vendor and Partner Ecosystem',
      'Cloud Financial Management',
      'Cloud Demand Management',
      'Talent Enablement',
    ],
    lifecyclePhases: ['plan'],
    icon: '🎯',
  },
  'architecture': {
    id: 'architecture',
    label: 'Cloud Architecture',
    subCapabilities: [
      'Cloud Reference Architecture',
      'Cloud Architecture Patterns',
      'MVP / Innovation Enablement',
      'Landing Zone',
    ],
    lifecyclePhases: ['design'],
    icon: '🏗️',
  },
  'data-handling': {
    id: 'data-handling',
    label: 'Data Handling & Engineering',
    subCapabilities: [
      'Data Inventory, Classification & Tagging',
      'Data Privacy, Residency & Sovereignty',
      'Data Quality',
      'Data Engineering',
      'Data Migration Factory',
    ],
    lifecyclePhases: ['design', 'develop-implement'],
    icon: '📊',
  },
  'technology-engineering': {
    id: 'technology-engineering',
    label: 'Cloud Technology Engineering',
    subCapabilities: [
      'DevOps',
      'APIs & Integration',
      'Application Migration Factory',
      'Cloud Services Automation & Orchestration',
      'Cloud Platform Management',
    ],
    lifecyclePhases: ['develop-implement'],
    icon: '⚙️',
  },
  'security': {
    id: 'security',
    label: 'Cloud Security',
    subCapabilities: [
      'IAM',
      'Data Security',
      'Application Security',
      'Infrastructure Security',
      'Cloud Security Posture Management',
      'Monitoring & IR',
      'Security Governance',
    ],
    lifecyclePhases: ['develop-implement', 'operate'],
    icon: '🔐',
  },
  'operations': {
    id: 'operations',
    label: 'Cloud Operations',
    subCapabilities: [
      'Cloud Provisioning',
      'IT Service Management',
      'Business Continuity Management',
      'CSP SLA Management',
      'Cloud Metrics & Reporting',
    ],
    lifecyclePhases: ['operate'],
    icon: '🔧',
  },
  'risk-management': {
    id: 'risk-management',
    label: 'Cloud Risk Management',
    subCapabilities: [
      'Cloud Risk Appetite',
      'Cloud Risk Management',
      'Cloud Compliance Management',
      'Cloud Risk Assurance',
    ],
    lifecyclePhases: ['govern-assure'],
    icon: '⚖️',
  },
}

export const CAF_LIFECYCLE_LABELS: Record<CAFLifecycleStage, string> = {
  'plan': 'Plan',
  'design': 'Design',
  'develop-implement': 'Develop & Implement',
  'operate': 'Operate',
  'govern-assure': 'Govern & Assure',
}

// ============================================================================
// DEPLOYMENT CHANNELS
// ============================================================================

export interface DeploymentChannelInfo {
  id: DeploymentChannel
  label: string
  description: string
  icon: string
}

export const DEPLOYMENT_CHANNELS: Record<DeploymentChannel, DeploymentChannelInfo> = {
  'copilot': {
    id: 'copilot',
    label: 'Microsoft Copilot',
    description: 'Chatbot and conversational interface via Microsoft Copilot',
    icon: '🤖',
  },
  'teams': {
    id: 'teams',
    label: 'Microsoft Teams',
    description: 'Collaboration channel for AI-assisted workflows',
    icon: '💬',
  },
  'outlook': {
    id: 'outlook',
    label: 'Outlook',
    description: 'Email-based AI interaction',
    icon: '📧',
  },
  'app-service': {
    id: 'app-service',
    label: 'App Service / Web Portal',
    description: 'Web portals and custom app interfaces',
    icon: '🌐',
  },
  'power-bi': {
    id: 'power-bi',
    label: 'Power BI',
    description: 'BI dashboards and embedded analytics',
    icon: '📊',
  },
  'bot-service': {
    id: 'bot-service',
    label: 'Azure Bot Service',
    description: 'Multi-channel bot framework',
    icon: '🗨️',
  },
  'custom-app': {
    id: 'custom-app',
    label: 'Custom Application',
    description: 'Bespoke application interface',
    icon: '📱',
  },
}

// ============================================================================
// INTEROPERABILITY PROTOCOLS
// ============================================================================

export interface InteropProtocolInfo {
  id: InteropProtocol
  label: string
  description: string
  purpose: string
  icon: string
}

export const INTEROP_PROTOCOLS: Record<InteropProtocol, InteropProtocolInfo> = {
  'mcp': {
    id: 'mcp',
    label: 'MCP (Model Context Protocol)',
    description: 'Enables model-to-resource communication and integration',
    purpose: 'Connect AI models to external tools, databases, and APIs through a standardized protocol',
    icon: '🔌',
  },
  'a2a': {
    id: 'a2a',
    label: 'A2A (Agent-to-Agent)',
    description: 'Supports communication between AI agents',
    purpose: 'Enable multi-agent coordination, task delegation, and inter-agent messaging',
    icon: '🔄',
  },
  'openapi': {
    id: 'openapi',
    label: 'OpenAPI',
    description: 'Integration via OpenAPI specs for external systems',
    purpose: 'Standard REST API integration for enterprise systems and third-party services',
    icon: '📋',
  },
  'graphql': {
    id: 'graphql',
    label: 'GraphQL',
    description: 'Flexible query language for APIs',
    purpose: 'Efficient data retrieval with client-driven queries and real-time subscriptions',
    icon: '◈',
  },
  'grpc': {
    id: 'grpc',
    label: 'gRPC',
    description: 'High-performance RPC framework',
    purpose: 'Low-latency inter-service communication for microservice and agent architectures',
    icon: '⚡',
  },
}

// ============================================================================
// SECURITY CONSIDERATIONS (AI Engagement Layer)
// ============================================================================

export const AI_ENGAGEMENT_SECURITY = {
  considerations: [
    'RBAC, Conditional Access, OAuth2 for APIs',
    'Key Vault for secrets',
    'Data encryption (at rest/in transit)',
    'ESLZ Policy driven compliance',
    'Defender for Cloud for threat protection',
  ],
  eslzIntegration: [
    'Hub-Spoke network model — engagement layer in the spoke',
    'Private Endpoints for all services',
  ],
  connectivity: [
    'VNET integration for App Service, AKS',
    'NSG rules and Firewall for secure traffic',
    'S2S/ExpressRoute for hybrid connectivity',
  ],
} as const

// ============================================================================
// DECISION MATRIX — TOOL DEPLOYMENT MODEL
// ============================================================================

export type ToolDeploymentModel = 'centralized' | 'decentralized'
export type ToolBoundedness = 'csp-proprietary' | 'csp-marketplace' | 'non-csp-bounded'

export interface DecisionMatrixEntry {
  service: string
  deploymentModel: ToolDeploymentModel
  boundedness: ToolBoundedness
  managed: boolean
  notes?: string
}

export const DECISION_MATRIX_TOOLS: DecisionMatrixEntry[] = [
  // CSP Provided / Centralized
  { service: 'azure-bot-service', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'power-bi', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'app-service', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'm365-copilot', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'azure-ai-foundry', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'copilot-studio', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'azure-ai-content-safety', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  { service: 'azure-ai-search', deploymentModel: 'centralized', boundedness: 'csp-proprietary', managed: true },
  // CSP Native / Decentralized
  { service: 'azure-monitor', deploymentModel: 'decentralized', boundedness: 'csp-proprietary', managed: true, notes: 'ESLZ native' },
  { service: 'log-analytics', deploymentModel: 'decentralized', boundedness: 'csp-proprietary', managed: true, notes: 'ESLZ native' },
  { service: 'application-insights', deploymentModel: 'decentralized', boundedness: 'csp-proprietary', managed: true, notes: 'ESLZ native' },
  // CSP Marketplace (ISV) / Centralized
  { service: 'openai-gpt', deploymentModel: 'centralized', boundedness: 'csp-marketplace', managed: false, notes: 'Non-CSP bounded' },
  { service: 'anthropic-claude', deploymentModel: 'centralized', boundedness: 'csp-marketplace', managed: false, notes: 'Non-CSP bounded' },
  { service: 'huggingface-models', deploymentModel: 'centralized', boundedness: 'csp-marketplace', managed: false, notes: 'Non-CSP bounded' },
]

// ============================================================================
// DATA & AI FOUNDATION PILLAR SCOPE
// ============================================================================

export const FOUNDATION_PILLAR_SCOPE = {
  aiFoundation: {
    label: 'AI Foundation',
    areas: ['AI Use Cases (RFP)', 'Engagement Layer', 'AI Enterprise Capability', 'AI Orchestration'],
  },
  dataFoundation: {
    label: 'Data Foundation',
    areas: [
      'Data Storage & Management', 'Data Ingestion & Integration', 'Data Processing & Analytics',
      'Performance & Scalability', 'Data Collaboration', 'Cost Management & Monitoring', 'Disaster Recovery',
    ],
  },
  governance: {
    label: 'Governance & Responsible AI',
    areas: ['Data Stewardship', 'Data Quality', 'Metadata', 'Policies & Controls', 'Cloud Readiness', 'AI Enablement'],
  },
} as const
