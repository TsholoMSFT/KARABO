/**
 * Deployment Model Decision Engine
 *
 * Deterministic module that maps customer constraints (connectivity, data classification,
 * latency, regulatory frameworks, infrastructure) to a recommended deployment model.
 *
 * Covers: Azure Public, Azure Government (IL4/IL5+), Azure Local, Azure Arc,
 * Foundry Local, disconnected/air-gapped, private cloud, and hybrid topologies.
 *
 * No AI calls — follows the same pattern as governance-engine.ts and regulatory-engine.ts.
 */

import type {
  DeploymentModel,
  DeploymentConstraints,
  DeploymentRecommendation,
  SovereignCloudEnvironment,
  SovereignServiceCheck,
  SovereignCloudGap,
  FoundryLocalCapability,
  DiscoverySession,
} from './types'

// ============================================================================
// FOUNDRY LOCAL MODEL CATALOG
// ============================================================================

export const FOUNDRY_LOCAL_MODELS: FoundryLocalCapability[] = [
  {
    modelName: 'Phi-4',
    modelFamily: 'Phi',
    supportedTasks: ['chat', 'completion', 'reasoning'],
    minGPUMemoryGB: 16,
    onnxSupported: true,
    quantizationOptions: ['INT4', 'INT8', 'FP16'],
    maxContextTokens: 16384,
  },
  {
    modelName: 'Phi-3.5-mini-instruct',
    modelFamily: 'Phi',
    supportedTasks: ['chat', 'completion'],
    minGPUMemoryGB: 8,
    onnxSupported: true,
    quantizationOptions: ['INT4', 'INT8', 'FP16'],
    maxContextTokens: 128000,
  },
  {
    modelName: 'Phi-3.5-vision-instruct',
    modelFamily: 'Phi',
    supportedTasks: ['chat', 'vision', 'completion'],
    minGPUMemoryGB: 16,
    onnxSupported: true,
    quantizationOptions: ['INT4', 'FP16'],
    maxContextTokens: 128000,
  },
  {
    modelName: 'Mistral-7B-Instruct',
    modelFamily: 'Mistral',
    supportedTasks: ['chat', 'completion'],
    minGPUMemoryGB: 16,
    onnxSupported: true,
    quantizationOptions: ['INT4', 'INT8', 'FP16'],
    maxContextTokens: 32768,
  },
  {
    modelName: 'Phi-4-mini',
    modelFamily: 'Phi',
    supportedTasks: ['chat', 'completion', 'reasoning'],
    minGPUMemoryGB: 8,
    onnxSupported: true,
    quantizationOptions: ['INT4', 'INT8'],
    maxContextTokens: 8192,
  },
]

// ============================================================================
// SERVICE AVAILABILITY PER DEPLOYMENT MODEL
// ============================================================================

interface ServiceCatalog {
  services: SovereignServiceCheck[]
}

const SERVICE_AVAILABILITY: Record<DeploymentModel, ServiceCatalog> = {
  'public-cloud': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: true, availableModels: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'gpt-4.1'], limitations: undefined },
      { service: 'Azure AI Search', availableInCloud: true, limitations: undefined },
      { service: 'Azure AI Document Intelligence', availableInCloud: true, limitations: undefined },
      { service: 'Azure AI Speech', availableInCloud: true, limitations: undefined },
      { service: 'Azure AI Vision', availableInCloud: true, limitations: undefined },
      { service: 'Azure Machine Learning', availableInCloud: true, limitations: undefined },
      { service: 'Azure Cosmos DB', availableInCloud: true, limitations: undefined },
      { service: 'Azure Kubernetes Service', availableInCloud: true, limitations: undefined },
    ],
  },
  'sovereign-cloud': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: true, availableModels: ['gpt-4o', 'gpt-4o-mini'], limitations: 'Model availability varies by sovereign environment' },
      { service: 'Azure AI Search', availableInCloud: true, limitations: 'Limited regions' },
      { service: 'Azure AI Document Intelligence', availableInCloud: true, limitations: 'Limited regions' },
      { service: 'Azure AI Speech', availableInCloud: true, limitations: 'Limited voices/languages' },
      { service: 'Azure AI Vision', availableInCloud: true, limitations: 'Limited features' },
      { service: 'Azure Machine Learning', availableInCloud: true, limitations: 'Limited compute options' },
      { service: 'Azure Cosmos DB', availableInCloud: true, limitations: undefined },
      { service: 'Azure Kubernetes Service', availableInCloud: true, limitations: undefined },
    ],
  },
  'azure-local': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: false, limitations: 'Not available on Azure Local — use Foundry Local for on-prem inference' },
      { service: 'Azure AI Search', availableInCloud: false, limitations: 'Not available on Azure Local — use self-hosted search (Elasticsearch, Solr)' },
      { service: 'Azure AI Document Intelligence', availableInCloud: false, limitations: 'Not available on Azure Local' },
      { service: 'Azure AI Speech', availableInCloud: false, limitations: 'Not available on Azure Local' },
      { service: 'Azure Kubernetes Service', availableInCloud: true, limitations: 'AKS on Azure Local — supports containerized workloads' },
      { service: 'Azure Arc', availableInCloud: true, limitations: 'Arc agents manage Azure Local nodes' },
      { service: 'Azure Virtual Machines', availableInCloud: true, limitations: 'VM workloads on Azure Local hardware' },
      { service: 'Azure Storage', availableInCloud: true, limitations: 'Local storage on Azure Local nodes' },
    ],
  },
  'azure-arc': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: false, limitations: 'Not directly on Arc — route via Azure or pair with Foundry Local' },
      { service: 'Azure Kubernetes Service', availableInCloud: true, limitations: 'AKS on Arc-enabled Kubernetes' },
      { service: 'Azure Arc-enabled Servers', availableInCloud: true, limitations: undefined },
      { service: 'Azure Arc-enabled Data Services', availableInCloud: true, limitations: 'SQL Managed Instance, PostgreSQL' },
      { service: 'Azure Policy', availableInCloud: true, limitations: 'Policy enforcement on Arc-managed resources' },
      { service: 'Azure Monitor', availableInCloud: true, limitations: 'Monitoring via Arc agents' },
      { service: 'Microsoft Defender for Cloud', availableInCloud: true, limitations: 'Security posture on Arc resources' },
      { service: 'Azure Machine Learning', availableInCloud: false, limitations: 'Training requires cloud — inference can run on Arc-enabled K8s' },
    ],
  },
  'disconnected': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: false, limitations: 'Not available — air-gapped; use Foundry Local or self-hosted models' },
      { service: 'Azure AI Search', availableInCloud: false, limitations: 'Not available — use self-hosted search' },
      { service: 'Azure AI Document Intelligence', availableInCloud: false, limitations: 'Not available — use open-source OCR (Tesseract, PaddleOCR)' },
      { service: 'Azure Kubernetes Service', availableInCloud: false, limitations: 'Disconnected K8s clusters require manual image management' },
      { service: 'Foundry Local', availableInCloud: true, limitations: 'On-prem AI inference — limited model catalog (Phi, Mistral)' },
      { service: 'Azure Local (disconnected)', availableInCloud: true, limitations: 'Azure Local in disconnected mode — manual updates via USB/media' },
      { service: 'Storage', availableInCloud: true, limitations: 'Local storage only — no cloud sync' },
      { service: 'Identity', availableInCloud: false, limitations: 'No Entra ID — requires local AD or certificate-based auth' },
    ],
  },
  'foundry-local': {
    services: [
      { service: 'Foundry Local Runtime', availableInCloud: true, limitations: undefined },
      { service: 'AI Model Inference', availableInCloud: true, availableModels: ['Phi-4', 'Phi-3.5-mini', 'Phi-3.5-vision', 'Mistral-7B'], limitations: 'SLM catalog — no GPT-4o or large models' },
      { service: 'ONNX Runtime', availableInCloud: true, limitations: 'Optimized INT4/INT8 quantization' },
      { service: 'Embeddings (local)', availableInCloud: true, limitations: 'Local embedding models only' },
      { service: 'Azure OpenAI', availableInCloud: false, limitations: 'Not available — Foundry Local uses local SLMs' },
      { service: 'Azure AI Search', availableInCloud: false, limitations: 'Not available — pair with local vector DB (Chroma, Qdrant)' },
      { service: 'Azure AI Document Intelligence', availableInCloud: false, limitations: 'Not available locally' },
      { service: 'Azure Monitor', availableInCloud: false, limitations: 'Local telemetry only' },
    ],
  },
  'private-cloud': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: false, limitations: 'Not available on private cloud — use self-hosted models or Foundry Local' },
      { service: 'Azure AI Search', availableInCloud: false, limitations: 'Not available — use Elasticsearch or Solr' },
      { service: 'Kubernetes', availableInCloud: true, limitations: 'Self-managed K8s (not AKS)' },
      { service: 'Virtual Machines', availableInCloud: true, limitations: 'VMware, Hyper-V, or KVM' },
      { service: 'Storage', availableInCloud: true, limitations: 'SAN, NAS, or software-defined storage' },
      { service: 'Open-source AI', availableInCloud: true, limitations: 'Self-hosted LLMs (Llama, Mistral, Phi via ONNX/vLLM)' },
      { service: 'Azure Arc', availableInCloud: true, limitations: 'Arc can manage private cloud resources if connectivity exists' },
      { service: 'Identity', availableInCloud: true, limitations: 'On-prem AD or Entra ID with hybrid connectivity' },
    ],
  },
  'hybrid': {
    services: [
      { service: 'Azure OpenAI', availableInCloud: true, limitations: 'Cloud-side inference — route via private endpoints' },
      { service: 'Azure AI Search', availableInCloud: true, limitations: 'Cloud-side — on-prem data synced via indexers' },
      { service: 'Azure Arc', availableInCloud: true, limitations: 'Control plane for on-prem resources' },
      { service: 'Azure Kubernetes Service', availableInCloud: true, limitations: 'AKS in cloud + Arc-enabled K8s on-prem' },
      { service: 'Foundry Local', availableInCloud: true, limitations: 'On-prem inference for latency-sensitive workloads' },
      { service: 'Azure Local', availableInCloud: true, limitations: 'On-prem Azure infra connected to cloud via Arc' },
      { service: 'ExpressRoute / VPN', availableInCloud: true, limitations: 'Hybrid connectivity backbone' },
      { service: 'Azure Monitor', availableInCloud: true, limitations: 'Unified monitoring across cloud and on-prem' },
    ],
  },
}

// ============================================================================
// ARCHITECTURE PATTERNS
// ============================================================================

interface ArchitecturePattern {
  name: string
  description: string
  applicableModels: DeploymentModel[]
}

const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
  {
    name: 'Hub-Spoke with Azure Local Spokes',
    description: 'Central Azure hub for management and updates; Azure Local nodes at each site as spokes running AKS and Foundry Local workloads, managed via Arc',
    applicableModels: ['azure-local', 'hybrid'],
  },
  {
    name: 'Arc-Managed Multi-Site',
    description: 'Azure Arc as unified control plane managing heterogeneous on-prem, edge, and multi-cloud resources with consistent policy and monitoring',
    applicableModels: ['azure-arc', 'hybrid'],
  },
  {
    name: 'Fully Disconnected Enclave',
    description: 'Air-gapped Azure Local cluster with Foundry Local for AI inference; manual update cadence via secure media; local AD for identity',
    applicableModels: ['disconnected'],
  },
  {
    name: 'Sovereign Cloud Landing Zone',
    description: 'Azure Government or EU Data Boundary with Enterprise Scale Landing Zone (ESLZ); private endpoints; sovereign identity boundary',
    applicableModels: ['sovereign-cloud'],
  },
  {
    name: 'Edge AI with Cloud Sync',
    description: 'Foundry Local at edge sites for real-time inference; results synced to cloud for aggregation, monitoring, and model updates',
    applicableModels: ['foundry-local', 'hybrid'],
  },
  {
    name: 'Cloud-Native Public',
    description: 'Standard Azure public cloud architecture with PaaS services, managed identities, and global availability',
    applicableModels: ['public-cloud'],
  },
  {
    name: 'Private Cloud with Arc Overlay',
    description: 'Existing VMware/Hyper-V private cloud managed via Azure Arc for policy, monitoring, and gradual cloud adoption',
    applicableModels: ['private-cloud', 'azure-arc', 'hybrid'],
  },
  {
    name: 'Hybrid AI Pipeline',
    description: 'Training in Azure public cloud; inference on-prem via Foundry Local or AKS on Azure Local; models deployed via Arc-enabled ML',
    applicableModels: ['hybrid', 'foundry-local', 'azure-local'],
  },
]

// ============================================================================
// DECISION TREE
// ============================================================================

/**
 * Main entry point — assess deployment model from a discovery session.
 * Extracts constraints from session data and delegates to the decision tree.
 */
export function assessDeploymentModel(session: DiscoverySession): DeploymentRecommendation {
  // Extract or build constraints from session data
  const constraints = extractConstraintsFromSession(session)
  return assessDeploymentModelFromConstraints(constraints)
}

/**
 * Extract deployment constraints from session responses and existing assessments.
 */
export function extractConstraintsFromSession(session: DiscoverySession): DeploymentConstraints {
  const existing = session.sovereignCloudTrackAssessment?.deploymentConstraints
  if (existing) return existing

  // Build from session metadata and sovereign cloud assessment
  const sca = session.sovereignCloudAssessment
  const isGov = session.entityType === 'government' ||
    session.industry === 'government'

  return {
    connectivity: 'always-on',
    dataClassification: sca?.mandateLevel === 'required' ? 'confidential' : 'internal',
    latencyRequirements: 'tolerant',
    regulatoryFrameworks: sca?.dataResidency?.triggeringFrameworks || [],
    physicalLocation: undefined,
    edgeRequirements: undefined,
    aiWorkloadType: 'inference-only',
    existingInfrastructure: undefined,
    isGovernmentWorkload: isGov,
    governmentClassificationLevel: isGov ? 'unclassified' : undefined,
    requiresFoundryLocal: false,
    requiresAzureArc: false,
    hybridAcceptable: true,
  }
}

/**
 * Core decision tree — maps constraints to deployment recommendation.
 */
export function assessDeploymentModelFromConstraints(
  constraints: DeploymentConstraints
): DeploymentRecommendation {
  const {
    connectivity,
    dataClassification,
    latencyRequirements,
    isGovernmentWorkload,
    governmentClassificationLevel,
    requiresFoundryLocal,
    requiresAzureArc,
    hybridAcceptable,
    existingInfrastructure,
  } = constraints

  // ── Priority 1: Air-gapped / disconnected ──
  if (connectivity === 'air-gapped') {
    return buildRecommendation(
      'disconnected',
      'disconnected',
      constraints,
      'Air-gapped connectivity requires a fully disconnected deployment. Azure Local provides on-premises infrastructure; Foundry Local enables AI inference without cloud dependency. Updates are applied via secure offline media.',
    )
  }

  // ── Priority 2: Government + high classification ──
  if (isGovernmentWorkload) {
    const ilLevel = governmentClassificationLevel?.toUpperCase() || ''

    if (ilLevel === 'IL6' || ilLevel === 'IL5' || dataClassification === 'top-secret') {
      return buildRecommendation(
        'disconnected',
        'azure-government-dod',
        constraints,
        `Government workload at ${ilLevel || 'Top Secret'} classification requires Azure Government DoD (IL5/IL6) or fully disconnected deployment. Air-gapped Azure Local with Foundry Local recommended for highest classification levels.`,
      )
    }

    if (ilLevel === 'IL4' || dataClassification === 'restricted') {
      return buildRecommendation(
        'sovereign-cloud',
        'azure-government',
        constraints,
        'Government workload at IL4/Restricted classification — Azure Government provides FedRAMP High authorized environment with appropriate service availability.',
      )
    }

    // Government but unclassified / lower classification
    return buildRecommendation(
      'sovereign-cloud',
      'azure-government',
      constraints,
      'Government workload — Azure Government recommended for FedRAMP compliance, data residency, and sovereign identity boundary even for unclassified data.',
    )
  }

  // ── Priority 3: Explicit Foundry Local requirement ──
  if (requiresFoundryLocal) {
    if (hybridAcceptable) {
      return buildRecommendation(
        'hybrid',
        undefined,
        constraints,
        'Foundry Local required for on-premises AI inference. Hybrid architecture enables cloud services for training, search, and monitoring while running inference locally via Foundry Local on Azure Local or bare metal.',
      )
    }
    return buildRecommendation(
      'foundry-local',
      'foundry-local',
      constraints,
      'Foundry Local for fully on-premises AI inference — limited to SLM catalog (Phi, Mistral). No cloud dependency for inference; pair with local vector DB for RAG scenarios.',
    )
  }

  // ── Priority 4: Latency-sensitive with on-prem infrastructure ──
  if (latencyRequirements === 'real-time' && hasOnPremInfra(existingInfrastructure)) {
    if (requiresAzureArc || hybridAcceptable) {
      return buildRecommendation(
        'hybrid',
        undefined,
        constraints,
        'Real-time latency requirements with existing on-premises infrastructure — Azure Local or Arc-enabled Kubernetes for edge inference, connected to cloud via Arc for management and model updates.',
      )
    }
    return buildRecommendation(
      'azure-local',
      'azure-local',
      constraints,
      'Real-time latency + on-premises infrastructure — Azure Local provides Azure-consistent experience on customer hardware for latency-sensitive AI workloads.',
    )
  }

  // ── Priority 5: Intermittent connectivity ──
  if (connectivity === 'intermittent') {
    return buildRecommendation(
      'hybrid',
      undefined,
      constraints,
      'Intermittent connectivity requires hybrid architecture — Azure Local or Arc-enabled infrastructure operates independently during disconnection and syncs when online. Foundry Local enables AI inference during offline periods.',
    )
  }

  // ── Priority 6: Strict data residency without on-prem ──
  if (dataClassification === 'confidential' || dataClassification === 'restricted') {
    const cloudEnv = mapConstraintsToSovereignCloud(constraints)
    if (cloudEnv && cloudEnv !== 'azure-public') {
      return buildRecommendation(
        'sovereign-cloud',
        cloudEnv,
        constraints,
        `Data classification (${dataClassification}) and regulatory requirements mandate a sovereign cloud environment — ${cloudEnv} ensures data residency and compliance.`,
      )
    }
  }

  // ── Priority 7: Explicit Azure Arc requirement ──
  if (requiresAzureArc) {
    return buildRecommendation(
      'azure-arc',
      'azure-arc',
      constraints,
      'Azure Arc as unified control plane for managing on-premises, multi-cloud, and edge resources with consistent Azure policy, monitoring, and security.',
    )
  }

  // ── Priority 8: Existing on-prem infra (non-Azure) ──
  if (hasOnPremInfra(existingInfrastructure) && hybridAcceptable) {
    return buildRecommendation(
      'hybrid',
      undefined,
      constraints,
      'Existing on-premises infrastructure detected — hybrid deployment via Azure Arc provides unified management while preserving current investments. Gradual migration path to Azure public cloud.',
    )
  }

  // ── Default: Public cloud ──
  return buildRecommendation(
    'public-cloud',
    'azure-public',
    constraints,
    'Standard Azure public cloud deployment — full service catalog, global availability, PaaS-first architecture with managed identities and private endpoints.',
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hasOnPremInfra(existing?: string): boolean {
  if (!existing) return false
  const lower = existing.toLowerCase()
  return ['azure local', 'azure stack', 'hci', 'vmware', 'vsphere', 'hyper-v',
    'bare metal', 'on-prem', 'on-premises', 'datacenter', 'data center',
    'openstack', 'nutanix'].some((kw) => lower.includes(kw))
}

function mapConstraintsToSovereignCloud(
  constraints: DeploymentConstraints
): SovereignCloudEnvironment | undefined {
  const frameworks = constraints.regulatoryFrameworks.map((f) => f.toLowerCase())
  const location = constraints.physicalLocation?.toLowerCase() || ''

  if (frameworks.includes('fedramp') || frameworks.includes('itar') || location.includes('united states')) {
    return 'azure-government'
  }
  if (location.includes('china')) {
    return 'azure-china-21vianet'
  }
  if (frameworks.includes('gdpr') || frameworks.includes('eu-ai-act') ||
      location.includes('europe') || location.includes('eu')) {
    return 'azure-eu-boundary'
  }
  // No specific sovereign match
  return undefined
}

function selectArchitecturePattern(model: DeploymentModel): string {
  const match = ARCHITECTURE_PATTERNS.find((p) => p.applicableModels.includes(model))
  return match?.name || 'Cloud-Native Public'
}

function identifyGaps(
  model: DeploymentModel,
  constraints: DeploymentConstraints
): SovereignCloudGap[] {
  const gaps: SovereignCloudGap[] = []
  const svcCatalog = SERVICE_AVAILABILITY[model]

  // Check for AI service gaps
  const openai = svcCatalog.services.find((s) => s.service === 'Azure OpenAI')
  if (openai && !openai.availableInCloud) {
    gaps.push({
      id: `gap-${model}-openai`,
      dimension: 'service-availability',
      description: 'Azure OpenAI is not available in this deployment model',
      impact: 'high',
      recommendation: model === 'disconnected' || model === 'azure-local' || model === 'foundry-local'
        ? 'Use Foundry Local with Phi-4 or Mistral-7B for on-premises AI inference. For RAG, pair with local vector DB (Chroma, Qdrant).'
        : 'Route AI requests to Azure public cloud via private endpoints or ExpressRoute.',
    })
  }

  // Check for identity gaps in disconnected
  if (model === 'disconnected') {
    gaps.push({
      id: 'gap-disconnected-identity',
      dimension: 'auth-model',
      description: 'Entra ID is not available in air-gapped environments',
      impact: 'high',
      recommendation: 'Deploy on-premises Active Directory or certificate-based authentication. Plan identity sync strategy for when connectivity is restored.',
    })
    gaps.push({
      id: 'gap-disconnected-updates',
      dimension: 'operations',
      description: 'Software updates require manual offline delivery',
      impact: 'medium',
      recommendation: 'Establish a secure media transfer process for OS patches, container images, and AI model updates. Define update cadence (e.g., monthly secure USB delivery).',
    })
  }

  // Check for Azure Local hardware requirements
  if (model === 'azure-local') {
    gaps.push({
      id: 'gap-azlocal-hardware',
      dimension: 'infrastructure',
      description: 'Azure Local requires validated hardware (Azure Local Integrated System or validated nodes)',
      impact: 'medium',
      recommendation: 'Review Azure Local hardware catalog for validated partners (Dell, Lenovo, HPE, DataON). Ensure GPU availability for Foundry Local workloads.',
    })
  }

  // Check for Foundry Local model limitations
  if (model === 'foundry-local' || model === 'disconnected' ||
     (model === 'hybrid' && constraints.requiresFoundryLocal)) {
    gaps.push({
      id: 'gap-foundrylocal-catalog',
      dimension: 'ai-capabilities',
      description: 'Foundry Local supports only small language models (SLMs) — no GPT-4o or large reasoning models',
      impact: 'medium',
      recommendation: `Available models: ${FOUNDRY_LOCAL_MODELS.map((m) => m.modelName).join(', ')}. For workloads requiring large models, consider hybrid architecture with cloud-based inference for complex tasks.`,
    })
  }

  // Check for Arc connectivity requirements
  if (model === 'azure-arc' && constraints.connectivity === 'intermittent') {
    gaps.push({
      id: 'gap-arc-connectivity',
      dimension: 'connectivity',
      description: 'Azure Arc agents require periodic connectivity to Azure for policy refresh and telemetry sync',
      impact: 'medium',
      recommendation: 'Arc agents can tolerate up to 30 days disconnected. Ensure periodic connectivity windows for policy sync, monitoring data upload, and certificate renewal.',
    })
  }

  // Check for data residency in hybrid
  if (model === 'hybrid' && (constraints.dataClassification === 'confidential' || constraints.dataClassification === 'restricted')) {
    gaps.push({
      id: 'gap-hybrid-residency',
      dimension: 'data-residency',
      description: 'Hybrid deployments require careful data flow mapping to ensure sensitive data stays within required boundaries',
      impact: 'high',
      recommendation: 'Implement data classification and DLP policies. Ensure AI prompts containing sensitive data are processed locally (Foundry Local) and only aggregated/anonymized results flow to cloud.',
    })
  }

  return gaps
}

function calculateReadinessScore(
  model: DeploymentModel,
  constraints: DeploymentConstraints,
  gaps: SovereignCloudGap[]
): number {
  let score = 100

  // Deduct per gap by impact
  for (const gap of gaps) {
    switch (gap.impact) {
      case 'high': score -= 15; break
      case 'medium': score -= 8; break
      case 'low': score -= 3; break
    }
  }

  // Bonus for well-matched constraints
  if (model === 'public-cloud' && constraints.connectivity === 'always-on' &&
      constraints.dataClassification === 'internal') {
    score = Math.min(100, score + 10)
  }

  // Penalty for mismatch indicators
  if (model === 'disconnected' && !hasOnPremInfra(constraints.existingInfrastructure)) {
    score -= 10 // No existing on-prem infra for a disconnected model
  }

  return Math.max(0, Math.min(100, score))
}

function buildRecommendation(
  primaryModel: DeploymentModel,
  cloudEnv: SovereignCloudEnvironment | undefined,
  constraints: DeploymentConstraints,
  rationale: string,
): DeploymentRecommendation {
  const svcCatalog = SERVICE_AVAILABILITY[primaryModel]
  const gaps = identifyGaps(primaryModel, constraints)
  const readinessScore = calculateReadinessScore(primaryModel, constraints, gaps)

  // Determine fallback model
  let fallbackModel: DeploymentModel | undefined
  if (primaryModel === 'disconnected') fallbackModel = 'azure-local'
  else if (primaryModel === 'azure-local') fallbackModel = 'hybrid'
  else if (primaryModel === 'foundry-local') fallbackModel = 'hybrid'
  else if (primaryModel === 'sovereign-cloud') fallbackModel = 'public-cloud'
  else if (primaryModel === 'private-cloud') fallbackModel = 'azure-arc'

  // Select Foundry Local capabilities if relevant
  const foundryLocalCapabilities = (
    primaryModel === 'disconnected' ||
    primaryModel === 'foundry-local' ||
    primaryModel === 'azure-local' ||
    (primaryModel === 'hybrid' && constraints.requiresFoundryLocal)
  ) ? FOUNDRY_LOCAL_MODELS : undefined

  return {
    primaryModel,
    primaryCloudEnvironment: cloudEnv,
    fallbackModel,
    rationale,
    architecturePattern: selectArchitecturePattern(primaryModel),
    serviceAvailability: svcCatalog.services,
    gaps,
    foundryLocalCapabilities,
    readinessScore,
  }
}

// ============================================================================
// PUBLIC UTILITY FUNCTIONS
// ============================================================================

/**
 * Get service availability for a specific deployment model.
 */
export function getServiceAvailabilityByModel(model: DeploymentModel): SovereignServiceCheck[] {
  return SERVICE_AVAILABILITY[model]?.services || []
}

/**
 * Get all architecture patterns applicable to a deployment model.
 */
export function getArchitecturePatternsForModel(model: DeploymentModel): ArchitecturePattern[] {
  return ARCHITECTURE_PATTERNS.filter((p) => p.applicableModels.includes(model))
}

/**
 * Get Foundry Local models that meet minimum GPU memory constraint.
 */
export function getFoundryLocalModelsForGPU(gpuMemoryGB: number): FoundryLocalCapability[] {
  return FOUNDRY_LOCAL_MODELS.filter((m) => m.minGPUMemoryGB <= gpuMemoryGB)
}

/**
 * Check if a deployment model supports internet-dependent services.
 */
export function modelRequiresConnectivity(model: DeploymentModel): boolean {
  return !['disconnected', 'foundry-local', 'private-cloud'].includes(model)
}
