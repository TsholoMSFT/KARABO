/**
 * Solution Blueprint — types
 *
 * Captures a customer's existing technology estate and produces dual-path
 * solution blueprints for a given use case:
 *   - Path A: Best-fit (greenfield optimal stack)
 *   - Path B: Estate-optimized (maximizes reuse of what they already own)
 */

export type BlueprintLayer =
  | 'app-ai'        // App & AI layer
  | 'data'          // Data layer
  | 'infrastructure'// Compute / hosting / DevOps / observability
  | 'identity'      // Identity & access
  | 'security'      // Cybersecurity controls
  | 'operations'    // FinOps / SRE / responsible AI ops

export const BLUEPRINT_LAYER_LABELS: Record<BlueprintLayer, string> = {
  'app-ai': 'Application & AI',
  data: 'Data',
  infrastructure: 'Infrastructure & Platform',
  identity: 'Identity & Access',
  security: 'Cybersecurity',
  operations: 'Operations & FinOps',
}

/**
 * Capability — atomic unit of "what a service provides".
 * A service offers >= 1 capability; an archetype requires >= 1 capability.
 * The recommender matches required capabilities to services, preferring
 * customer-owned ones in the estate-optimized path.
 */
export type CapabilityId =
  // App & AI
  | 'llm-hosting'
  | 'agent-orchestration'
  | 'embeddings'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'vision-ocr'
  | 'document-intelligence'
  | 'content-safety'
  | 'ai-gateway'
  | 'app-hosting-web'
  | 'app-hosting-container'
  | 'app-hosting-serverless'
  | 'workflow-orchestration'
  | 'integration-connectors'
  | 'event-streaming'
  | 'messaging-queue'
  | 'api-management'
  | 'ux-surface-teams'
  | 'ux-surface-copilot'
  | 'ux-surface-power-platform'

  // Data
  | 'relational-db'
  | 'nosql-db'
  | 'vector-store'
  | 'search-index'
  | 'analytical-store'
  | 'lakehouse'
  | 'data-pipeline'
  | 'data-governance'
  | 'object-storage'

  // Infrastructure
  | 'private-networking'
  | 'cdn-edge'
  | 'kubernetes-platform'
  | 'iac-pipeline'
  | 'observability-logs'
  | 'observability-metrics'
  | 'observability-traces'

  // Identity
  | 'workforce-identity'
  | 'consumer-identity'
  | 'managed-identity'
  | 'agent-identity'
  | 'privileged-access-mgmt'

  // Security
  | 'secrets-mgmt'
  | 'key-mgmt-cmk'
  | 'waf'
  | 'ddos-protection'
  | 'siem'
  | 'cloud-posture-mgmt'
  | 'dlp'
  | 'data-classification'
  | 'jailbreak-detection'

  // Operations
  | 'cost-mgmt'
  | 'capacity-mgmt'
  | 'responsible-ai-evals'
  | 'backup-dr'

export interface CapabilityDef {
  id: CapabilityId
  name: string
  layer: BlueprintLayer
  description: string
}

/**
 * A service offered by a vendor. Tagged with the capabilities it provides
 * and the regions / sovereignty profiles it supports (lightweight in v1).
 */
export type ServiceVendor = 'azure' | 'microsoft-365' | 'aws' | 'gcp' | 'oracle' | 'sap' | 'salesforce' | 'snowflake' | 'databricks' | 'servicenow' | 'on-prem' | 'other'

export interface ServiceDef {
  id: string
  name: string
  vendor: ServiceVendor
  layer: BlueprintLayer
  capabilities: CapabilityId[]
  /** Higher = preferred when multiple services satisfy the same capability (best-fit ranking). */
  fitScore: number
  /** Sovereignty support — coarse flag used for filtering. */
  sovereignReady?: boolean
  /** Short rationale shown to the user. */
  rationale?: string
  /** Docs link / learn-more URL (optional). */
  docsUrl?: string
}

/**
 * Use-case archetype — required capabilities + suggested risks/controls.
 */
export interface ArchetypeDef {
  id: string
  name: string
  description: string
  /** Capabilities the archetype REQUIRES — every one must be filled in any blueprint. */
  requiredCapabilities: CapabilityId[]
  /** Capabilities that are recommended but optional. */
  recommendedCapabilities?: CapabilityId[]
  /** Common security/compliance risks the user should consider. */
  risks: string[]
  /** Typical KPIs this archetype can move. */
  typicalKpis?: string[]
  /** Indicative monthly cost band in USD for a small pilot. */
  pilotCostBandUsd?: { min: number; max: number }
}

// ────────────────────────────────────────────────────────────────────────────
// Customer estate
// ────────────────────────────────────────────────────────────────────────────

/**
 * The customer's existing technology footprint. Persisted per customer and
 * shared across all use cases in the engagement.
 */
export interface TechnologyEstate {
  /** Stable id (uuid) */
  id: string
  /** The customer this estate belongs to (Customer.id from types.ts) */
  customerId: string
  /** Display name — usually the customer name */
  customerName: string
  updatedAt: number

  // Cloud footprint
  primaryCloud: 'azure' | 'aws' | 'gcp' | 'on-prem' | 'multi' | 'unknown'
  hasAzure: boolean
  hasAws: boolean
  hasGcp: boolean
  hasOnPrem: boolean
  azureRegions?: string[]
  sovereigntyRequired: boolean
  sovereignProfile?: string // e.g. "EU Sovereign", "US Gov", "South Africa"

  // Service inventory — service ids the customer already owns / runs.
  ownedServiceIds: string[]

  // Identity / security posture
  identityProvider: 'entra-id' | 'okta' | 'ping' | 'ad-fs' | 'mixed' | 'other' | 'unknown'
  hasManagedIdentity: boolean
  hasDefenderForCloud: boolean
  hasSentinel: boolean
  hasPurview: boolean
  hasKeyVault: boolean
  hasPrivateEndpoints: boolean

  // DevOps
  cicdPlatform: 'github-actions' | 'azure-devops' | 'gitlab' | 'jenkins' | 'mixed' | 'none' | 'unknown'
  iacPlatform: 'bicep' | 'terraform' | 'arm' | 'pulumi' | 'none' | 'unknown'

  // Constraints
  approvedVendors?: ServiceVendor[]
  blockedVendors?: ServiceVendor[]
  notes?: string
}

export const EMPTY_ESTATE: Omit<TechnologyEstate, 'id' | 'customerId' | 'customerName' | 'updatedAt'> = {
  primaryCloud: 'unknown',
  hasAzure: false,
  hasAws: false,
  hasGcp: false,
  hasOnPrem: false,
  azureRegions: [],
  sovereigntyRequired: false,
  ownedServiceIds: [],
  identityProvider: 'unknown',
  hasManagedIdentity: false,
  hasDefenderForCloud: false,
  hasSentinel: false,
  hasPurview: false,
  hasKeyVault: false,
  hasPrivateEndpoints: false,
  cicdPlatform: 'unknown',
  iacPlatform: 'unknown',
  notes: '',
}

// ────────────────────────────────────────────────────────────────────────────
// Use case input + blueprint output
// ────────────────────────────────────────────────────────────────────────────

export interface UseCaseInput {
  /** Free-text name (e.g., "Claims triage copilot"). */
  name: string
  /** Short description / business problem. */
  description: string
  /** Selected archetype id (optional — if omitted, the user gets a freeform stack). */
  archetypeId?: string
  /** Extra capabilities the user explicitly wants. */
  extraCapabilities?: CapabilityId[]
  /** Sovereignty / residency override for this specific use case. */
  sovereigntyRequired?: boolean
  /** Back-link to the originating discovered UseCase.id (if any). */
  sourceUseCaseId?: string
}

/** A single resolved component in a blueprint — capability + chosen service. */
export interface BlueprintComponent {
  capability: CapabilityId
  capabilityName: string
  layer: BlueprintLayer
  service: ServiceDef | null
  /** True if the chosen service was already in the customer estate. */
  reused: boolean
  /** True if no acceptable service was found for this capability. */
  gap: boolean
  rationale: string
  /**
   * LGROLNP outcome contract: ties this component to a measurable KPI.
   * Captured manually post-generation; lets exec summary + exports answer
   * "why does this service exist in the blueprint?".
   */
  kpiImpact?: {
    /** KPI id from src/lib/kpis (or freeform string for unlisted KPIs). */
    kpiId: string
    /** Expected % movement on the KPI. Negative = reduction (e.g. cycle time). */
    deltaPct?: number
    /** How the delta will be measured (telemetry source, query, baseline). */
    measurementMethod?: string
    /** Time to first observable impact, in months. */
    timeToValueMonths?: number
  }
}

export type BlueprintPathKind = 'best-fit' | 'estate-optimized'

export interface Blueprint {
  pathKind: BlueprintPathKind
  components: BlueprintComponent[]
  /** Fraction (0-1) of components reused from the estate. */
  reuseRatio: number
  /** Count of capability gaps (no service available). */
  gapCount: number
  /** Net-new services that must be procured / provisioned. */
  netNewServiceIds: string[]
}

export interface BlueprintDelta {
  /** Capabilities where Path A and Path B chose different services. */
  swaps: Array<{
    capability: CapabilityId
    capabilityName: string
    layer: BlueprintLayer
    bestFit: ServiceDef | null
    estateOptimized: ServiceDef | null
  }>
  /** Capability-coverage difference (best-fit fitScore avg minus estate-opt avg). */
  fitScoreDelta: number
  reuseRatioDelta: number
}

export interface BlueprintResult {
  useCase: UseCaseInput
  archetype: ArchetypeDef | null
  bestFit: Blueprint
  estateOptimized: Blueprint
  delta: BlueprintDelta
  generatedAt: number
}
