import { getServiceLabel } from '@/lib/microsoft-solutions'

export type ServiceTier =
  | 'ingestion'
  | 'processing'
  | 'intelligence'
  | 'storage'
  | 'presentation'
  | 'integration'

export const SERVICE_TIER_ORDER: ServiceTier[] = [
  'ingestion',
  'processing',
  'intelligence',
  'storage',
  'presentation',
  'integration',
]

export const SERVICE_TIER_LABELS: Record<ServiceTier, string> = {
  ingestion: 'Data Ingestion',
  processing: 'Processing',
  intelligence: 'AI/ML',
  storage: 'Data Storage',
  presentation: 'Presentation',
  integration: 'Integration',
}

// Map services to tiers for diagram layout
export const SERVICE_TIER_MAPPING: Record<string, ServiceTier> = {
  'azure-iot-hub': 'ingestion',
  'azure-event-hubs': 'ingestion',
  'azure-data-factory': 'ingestion',
  'power-automate': 'ingestion',
  'azure-functions': 'processing',
  'azure-logic-apps': 'processing',
  'azure-stream-analytics': 'processing',
  'azure-databricks': 'processing',
  'azure-container-apps': 'processing',
  'azure-kubernetes': 'processing',
  'azure-openai': 'intelligence',
  'azure-ai-search': 'intelligence',
  'azure-ai-vision': 'intelligence',
  'azure-ai-speech': 'intelligence',
  'azure-ai-language': 'intelligence',
  'azure-ai-document-intelligence': 'intelligence',
  'azure-machine-learning': 'intelligence',
  'azure-ai-studio': 'intelligence',
  'azure-ai-content-safety': 'intelligence',
  'azure-bot-service': 'intelligence',
  'azure-digital-twins': 'intelligence',
  'copilot-studio': 'intelligence',
  'github-copilot': 'intelligence',
  'azure-sql': 'storage',
  'azure-cosmos-db': 'storage',
  'azure-synapse': 'storage',
  'azure-data-lake': 'storage',
  'dataverse': 'storage',
  'sharepoint': 'storage',
  'fabric-data-warehouse': 'storage',
  'fabric-lakehouse': 'storage',
  'fabric-data-science': 'storage',
  'power-bi': 'presentation',
  'power-apps': 'presentation',
  'power-pages': 'presentation',
  'm365-copilot': 'presentation',
  'copilot-for-sales': 'presentation',
  'copilot-for-service': 'presentation',
  'copilot-for-finance': 'presentation',
  'teams': 'presentation',
  'outlook': 'presentation',
  'azure-api-management': 'integration',
  'd365-sales': 'integration',
  'd365-customer-service': 'integration',
  'd365-field-service': 'integration',
  'd365-finance': 'integration',
  'd365-supply-chain': 'integration',
  'd365-commerce': 'integration',
  'd365-business-central': 'integration',
  'd365-customer-insights': 'integration',
  'azure-purview': 'integration',
  'entra-id': 'integration',
  'microsoft-defender': 'integration',
  'microsoft-sentinel': 'integration',
  'purview-compliance': 'integration',
  'intune': 'integration',
  'viva': 'integration',
}

export interface ArchitectureDiagramSpecV1 {
  version: 1
  direction: 'LR' | 'TB'
  title?: string
  groups: Array<{ id: string; label: string; order: number }>
  nodes: Array<{ id: string; label: string; groupId?: string; kind?: 'anchor' | 'service' }>
  edges: Array<{ from: string; to: string; kind?: 'solid' | 'dashed'; label?: string }>
}

function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '_')
}

export function buildReferenceArchitectureDiagramSpec(params: {
  title?: string
  services: string[]
  direction?: 'LR' | 'TB'
}): ArchitectureDiagramSpecV1 {
  const direction = params.direction ?? 'LR'
  const uniqueServices = Array.from(new Set(params.services.filter(Boolean)))

  const grouped: Record<ServiceTier, string[]> = {
    ingestion: [],
    processing: [],
    intelligence: [],
    storage: [],
    presentation: [],
    integration: [],
  }

  for (const serviceId of uniqueServices) {
    const tier = SERVICE_TIER_MAPPING[serviceId] ?? 'integration'
    grouped[tier].push(serviceId)
  }

  const groups = SERVICE_TIER_ORDER.map((tier, order) => ({
    id: tier,
    label: SERVICE_TIER_LABELS[tier],
    order,
  })).filter((g) => grouped[g.id as ServiceTier].length > 0)

  const nodes: ArchitectureDiagramSpecV1['nodes'] = []
  const edges: ArchitectureDiagramSpecV1['edges'] = []

  // Tier anchors (one per group)
  for (const group of groups) {
    nodes.push({
      id: `${group.id}_anchor`,
      label: group.label,
      groupId: group.id,
      kind: 'anchor',
    })
  }

  // Service nodes (within group) + dashed edges from anchor
  for (const group of groups) {
    const tier = group.id as ServiceTier
    const services = grouped[tier]
    for (const serviceId of services) {
      const nodeId = `svc_${safeId(serviceId)}`
      nodes.push({
        id: nodeId,
        label: getServiceLabel(serviceId),
        groupId: group.id,
        kind: 'service',
      })
      edges.push({
        from: `${group.id}_anchor`,
        to: nodeId,
        kind: 'dashed',
      })
    }
  }

  // Main flow between tier anchors (exclude integration from the backbone; connect it lightly)
  const backbone = groups
    .map((g) => g.id)
    .filter((id) => id !== 'integration')

  for (let i = 0; i < backbone.length - 1; i++) {
    edges.push({
      from: `${backbone[i]}_anchor`,
      to: `${backbone[i + 1]}_anchor`,
      kind: 'solid',
    })
  }

  // Integration connects to all other anchors (dashed)
  if (groups.some((g) => g.id === 'integration')) {
    for (const g of groups) {
      if (g.id === 'integration') continue
      edges.push({
        from: `integration_anchor`,
        to: `${g.id}_anchor`,
        kind: 'dashed',
      })
    }
  }

  return {
    version: 1,
    direction,
    title: params.title,
    groups,
    nodes,
    edges,
  }
}
