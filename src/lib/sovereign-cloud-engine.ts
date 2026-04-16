/**
 * Sovereign Cloud Assessment Engine
 *
 * Deterministic module for assessing sovereign cloud requirements based on
 * jurisdiction, entity type, industry, and regulatory frameworks.
 * No AI calls — follows the same pattern as governance-engine.ts and regulatory-engine.ts.
 *
 * Covers: Azure Government (US), EU Data Boundary, African data sovereignty,
 * Middle East (UAE/Saudi), Azure China 21Vianet.
 */

import type {
  AIRegulationFramework,
  Industry,
  EntityType,
  SovereignCloudEnvironment,
  SovereignCloudRegion,
  SovereignCloudMandateLevel,
  SovereignCloudAssessment,
  SovereignCloudGap,
  SovereignServiceCheck,
  CrossBorderDataFlow,
  DataResidencyRequirement,
  LandingZoneReadiness,
  DiscoverySession,
} from './types'

// ============================================================================
// JURISDICTION → SOVEREIGN CLOUD MAPPING
// ============================================================================

interface JurisdictionSovereignRule {
  cloud: SovereignCloudEnvironment
  regions: SovereignCloudRegion[]
  /** Mandate when entity is government */
  governmentMandate: SovereignCloudMandateLevel
  /** Mandate for non-government entities */
  defaultMandate: SovereignCloudMandateLevel
  justification: string
  triggeringFrameworks: AIRegulationFramework[]
}

const JURISDICTION_SOVEREIGN_MAP: Record<string, JurisdictionSovereignRule> = {
  'United States': {
    cloud: 'azure-government',
    regions: ['usgovvirginia', 'usgovarizona', 'usgovtexas'],
    governmentMandate: 'required',
    defaultMandate: 'optional',
    justification: 'US government entities require FedRAMP-authorized environments per federal cloud policy',
    triggeringFrameworks: ['fedramp', 'nist-ai-rmf', 'white-house-eo'],
  },
  'European Union': {
    cloud: 'azure-eu-boundary',
    regions: ['westeurope', 'northeurope', 'germanywestcentral', 'francecentral', 'swedencentral'],
    governmentMandate: 'required',
    defaultMandate: 'recommended',
    justification: 'EU Data Boundary ensures GDPR compliance — all data processing stays within EU borders',
    triggeringFrameworks: ['gdpr', 'eu-ai-act', 'nis2'],
  },
  'South Africa': {
    cloud: 'azure-public',
    regions: ['southafricanorth', 'southafricawest'],
    governmentMandate: 'required',
    defaultMandate: 'recommended',
    justification: 'POPIA requires personal data processing within or with adequate protection — South Africa regions recommended',
    triggeringFrameworks: ['popia', 'sa-ai-policy-draft', 'au-data-policy'],
  },
  'African Union': {
    cloud: 'azure-public',
    regions: ['southafricanorth', 'southafricawest'],
    governmentMandate: 'recommended',
    defaultMandate: 'optional',
    justification: 'AU Data Policy Framework promotes African data sovereignty — prefer African data centres',
    triggeringFrameworks: ['au-data-policy', 'au-ai-strategy'],
  },
  'United Kingdom': {
    cloud: 'azure-public',
    regions: ['westeurope', 'northeurope'],
    governmentMandate: 'recommended',
    defaultMandate: 'optional',
    justification: 'UK government cloud policy recommends UK-based or allied-nation data centres',
    triggeringFrameworks: ['gdpr', 'uk-ai-regulation'],
  },
  'UAE': {
    cloud: 'azure-public',
    regions: ['uaenorth'],
    governmentMandate: 'required',
    defaultMandate: 'recommended',
    justification: 'UAE data localization requirements mandate in-country processing for government and regulated data',
    triggeringFrameworks: ['uae-ai-strategy'],
  },
  'China': {
    cloud: 'azure-china-21vianet',
    regions: ['chinanorth3', 'chinaeast3'],
    governmentMandate: 'required',
    defaultMandate: 'required',
    justification: 'China Cybersecurity Law requires data localization — Azure China operated by 21Vianet is mandatory',
    triggeringFrameworks: ['china-ai-regulations'],
  },
  'Kenya': {
    cloud: 'azure-public',
    regions: ['southafricanorth'],
    governmentMandate: 'recommended',
    defaultMandate: 'optional',
    justification: 'Kenya DPA recommends African-region processing — closest Azure region is South Africa North',
    triggeringFrameworks: ['kenya-dpa'],
  },
  'Nigeria': {
    cloud: 'azure-public',
    regions: ['southafricanorth'],
    governmentMandate: 'recommended',
    defaultMandate: 'optional',
    justification: 'NDPR recommends in-country or regionally proximate processing',
    triggeringFrameworks: ['nigeria-ndpr'],
  },
  'India': {
    cloud: 'azure-public',
    regions: [],
    governmentMandate: 'recommended',
    defaultMandate: 'optional',
    justification: 'India DPDP Act requires localization of critical personal data — India Central recommended when available',
    triggeringFrameworks: ['india-dpdp'],
  },
  'Brazil': {
    cloud: 'azure-public',
    regions: [],
    governmentMandate: 'recommended',
    defaultMandate: 'optional',
    justification: 'LGPD recommends processing in adequate jurisdictions — Brazil South recommended when available',
    triggeringFrameworks: ['brazil-lgpd'],
  },
}

// ============================================================================
// SERVICE AVAILABILITY PER SOVEREIGN CLOUD
// ============================================================================

interface ServiceAvailabilityEntry {
  service: string
  availableModels?: string[]
  limitations?: string
}

const SERVICE_AVAILABILITY: Record<SovereignCloudEnvironment, ServiceAvailabilityEntry[]> = {
  'azure-public': [
    { service: 'Azure OpenAI', availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-35-turbo', 'dall-e-3', 'whisper'], },
    { service: 'Azure AI Document Intelligence' },
    { service: 'Azure AI Search' },
    { service: 'Azure Machine Learning' },
    { service: 'Azure AI Content Safety' },
  ],
  'azure-government': [
    { service: 'Azure OpenAI', availableModels: ['gpt-4o', 'gpt-4'], limitations: 'Limited model selection; no DALL-E, no Whisper; FedRAMP High authorized' },
    { service: 'Azure AI Document Intelligence', limitations: 'Available in US Gov Virginia' },
    { service: 'Azure AI Search', limitations: 'Available in US Gov Virginia, US Gov Arizona' },
    { service: 'Azure Machine Learning', limitations: 'Available with reduced feature set' },
  ],
  'azure-government-dod': [
    { service: 'Azure OpenAI', availableModels: ['gpt-4'], limitations: 'Minimal model availability; IL5 environment; limited regions' },
    { service: 'Azure AI Search', limitations: 'Limited availability' },
  ],
  'azure-china-21vianet': [
    { service: 'Azure OpenAI', availableModels: ['gpt-4'], limitations: 'Separate model deployments via 21Vianet; limited availability' },
    { service: 'Azure AI Document Intelligence', limitations: 'Available in China North 3' },
    { service: 'Azure Machine Learning', limitations: 'Available with separate billing' },
  ],
  'azure-eu-boundary': [
    { service: 'Azure OpenAI', availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-35-turbo'], limitations: 'EU Data Boundary enforced — prompts/responses stay within EU' },
    { service: 'Azure AI Document Intelligence' },
    { service: 'Azure AI Search' },
    { service: 'Azure Machine Learning' },
    { service: 'Azure AI Content Safety' },
  ],
  'azure-local': [
    { service: 'Azure Kubernetes Service', limitations: 'AKS on Azure Local — containerized workloads' },
    { service: 'Azure Virtual Machines', limitations: 'VM workloads on Azure Local hardware' },
    { service: 'Azure Arc', limitations: 'Arc agents manage Azure Local nodes' },
  ],
  'azure-arc': [
    { service: 'Azure Arc-enabled Kubernetes', limitations: 'Arc-managed K8s clusters' },
    { service: 'Azure Arc-enabled Data Services', limitations: 'SQL MI, PostgreSQL on Arc' },
    { service: 'Azure Policy', limitations: 'Policy enforcement via Arc' },
    { service: 'Azure Monitor', limitations: 'Monitoring via Arc agents' },
  ],
  'disconnected': [
    { service: 'Foundry Local', availableModels: ['Phi-4', 'Phi-3.5-mini', 'Mistral-7B'], limitations: 'SLM catalog only — no large models; fully offline inference' },
    { service: 'Azure Local (disconnected)', limitations: 'Manual updates via secure offline media' },
  ],
  'private-cloud': [
    { service: 'Self-hosted LLMs', availableModels: ['Llama', 'Mistral', 'Phi via ONNX/vLLM'], limitations: 'Self-managed — no Azure SLA' },
    { service: 'Azure Arc', limitations: 'Arc can manage private cloud resources if connectivity exists' },
  ],
  'foundry-local': [
    { service: 'Foundry Local Runtime', availableModels: ['Phi-4', 'Phi-3.5-mini', 'Phi-3.5-vision', 'Mistral-7B'], limitations: 'SLM catalog — no GPT-4o; local inference only' },
    { service: 'ONNX Runtime', limitations: 'Optimized INT4/INT8 quantization for edge' },
  ],
}

// ============================================================================
// DATA FLOW TYPES FOR CROSS-BORDER ASSESSMENT
// ============================================================================

const AI_DATA_TYPES = ['AI prompts containing business context', 'AI model responses', 'Document extraction data']
const FINANCIAL_DATA_TYPES = ['Earnings data', 'Financial statements', 'Stock prices']
const REGULATORY_DATA_TYPES = ['Regulatory news feeds', 'Compliance assessments']

// ============================================================================
// MAIN ASSESSMENT FUNCTIONS
// ============================================================================

/**
 * Detect sovereign cloud requirement based on jurisdictions, entity type, and industry.
 */
export function detectSovereignCloudRequirement(
  jurisdictions: string[],
  entityType?: EntityType,
  industry?: Industry,
  _frameworks?: AIRegulationFramework[]
): {
  cloud: SovereignCloudEnvironment
  regions: SovereignCloudRegion[]
  mandateLevel: SovereignCloudMandateLevel
  justification: string
  triggeringFrameworks: AIRegulationFramework[]
} {
  const isGovernment = entityType === 'government' || industry === 'government'

  // Find the highest-mandate jurisdiction rule
  let bestRule: JurisdictionSovereignRule | null = null
  let bestMandate: SovereignCloudMandateLevel = 'optional'

  const mandatePriority: Record<SovereignCloudMandateLevel, number> = {
    required: 3,
    recommended: 2,
    optional: 1,
  }

  for (const jurisdiction of jurisdictions) {
    const rule = JURISDICTION_SOVEREIGN_MAP[jurisdiction]
    if (!rule) continue

    const mandate = isGovernment ? rule.governmentMandate : rule.defaultMandate
    if (mandatePriority[mandate] > mandatePriority[bestMandate]) {
      bestRule = rule
      bestMandate = mandate
    }
  }

  // DoD escalation: US government + defense-related keywords in industry
  if (isGovernment && jurisdictions.includes('United States')) {
    return {
      cloud: 'azure-government',
      regions: ['usgovvirginia', 'usgovarizona', 'usgovtexas'],
      mandateLevel: 'required',
      justification: 'US government entities require Azure Government (FedRAMP High / IL4+)',
      triggeringFrameworks: ['fedramp', 'nist-ai-rmf'],
    }
  }

  if (bestRule) {
    return {
      cloud: bestRule.cloud,
      regions: bestRule.regions,
      mandateLevel: bestMandate,
      justification: bestRule.justification,
      triggeringFrameworks: bestRule.triggeringFrameworks,
    }
  }

  // Default: Azure public with no specific region mandate
  return {
    cloud: 'azure-public',
    regions: [],
    mandateLevel: 'optional',
    justification: 'No specific sovereign cloud requirement detected — Azure Commercial is suitable',
    triggeringFrameworks: [],
  }
}

/**
 * Get service availability for a specific sovereign cloud.
 */
export function getSovereignServiceAvailability(
  cloud: SovereignCloudEnvironment,
  requiredServices: string[] = ['Azure OpenAI', 'Azure AI Document Intelligence', 'Azure AI Search']
): SovereignServiceCheck[] {
  const available = SERVICE_AVAILABILITY[cloud] || []

  return requiredServices.map(service => {
    const entry = available.find(a => a.service === service)
    return {
      service,
      availableInCloud: !!entry,
      availableModels: entry?.availableModels,
      limitations: entry?.limitations,
    }
  })
}

/**
 * Assess cross-border data flows for a session's sovereign cloud context.
 */
export function assessCrossBorderFlows(
  sourceJurisdiction: string,
  targetCloud: SovereignCloudEnvironment,
  _targetRegion?: SovereignCloudRegion
): CrossBorderDataFlow[] {
  const flows: CrossBorderDataFlow[] = []

  // AI data flows (always present — app sends prompts to Azure OpenAI)
  const aiFlow = assessSingleFlow(sourceJurisdiction, targetCloud, AI_DATA_TYPES, 'AI prompts')
  flows.push(aiFlow)

  // Financial data flows (present if earnings features used)
  const finFlow = assessSingleFlow(sourceJurisdiction, targetCloud, FINANCIAL_DATA_TYPES, 'Financial APIs')
  flows.push(finFlow)

  // Regulatory data (low sensitivity)
  flows.push({
    sourceJurisdiction,
    targetCloud,
    targetRegion: '' as SovereignCloudRegion,
    dataTypes: REGULATORY_DATA_TYPES,
    permitted: true,
    mechanism: 'Public regulatory information — no residency concern',
    risk: 'minimal',
  })

  return flows
}

function assessSingleFlow(
  sourceJurisdiction: string,
  targetCloud: SovereignCloudEnvironment,
  dataTypes: string[],
  _label: string
): CrossBorderDataFlow {
  // Same-cloud is always fine
  const rule = JURISDICTION_SOVEREIGN_MAP[sourceJurisdiction]
  if (rule && rule.cloud === targetCloud) {
    return {
      sourceJurisdiction,
      targetCloud,
      targetRegion: '' as SovereignCloudRegion,
      dataTypes,
      permitted: true,
      mechanism: 'Processing within recommended sovereign cloud',
      risk: 'minimal',
    }
  }

  // EU → non-EU boundary
  if (sourceJurisdiction === 'European Union' && targetCloud !== 'azure-eu-boundary') {
    return {
      sourceJurisdiction,
      targetCloud,
      targetRegion: '' as SovereignCloudRegion,
      dataTypes,
      permitted: false,
      mechanism: 'Requires EU Standard Contractual Clauses or adequacy decision',
      risk: 'high',
    }
  }

  // China → non-China
  if (sourceJurisdiction === 'China' && targetCloud !== 'azure-china-21vianet') {
    return {
      sourceJurisdiction,
      targetCloud,
      targetRegion: '' as SovereignCloudRegion,
      dataTypes,
      permitted: false,
      mechanism: 'China Cybersecurity Law prohibits cross-border transfer without security assessment',
      risk: 'unacceptable',
    }
  }

  // US Gov → non-Gov cloud
  if (sourceJurisdiction === 'United States' && targetCloud === 'azure-public') {
    return {
      sourceJurisdiction,
      targetCloud,
      targetRegion: '' as SovereignCloudRegion,
      dataTypes,
      permitted: true, // Allowed but not recommended for gov
      mechanism: 'Azure Commercial — FedRAMP High available for some services',
      risk: 'limited',
    }
  }

  // SA/Africa → non-SA region
  if (['South Africa', 'African Union', 'Kenya', 'Nigeria'].includes(sourceJurisdiction) && targetCloud === 'azure-public') {
    return {
      sourceJurisdiction,
      targetCloud,
      targetRegion: '' as SovereignCloudRegion,
      dataTypes,
      permitted: true,
      mechanism: 'Recommend South Africa North/West region for data proximity',
      risk: 'limited',
    }
  }

  // UAE → non-UAE
  if (sourceJurisdiction === 'UAE' && targetCloud === 'azure-public') {
    return {
      sourceJurisdiction,
      targetCloud,
      targetRegion: '' as SovereignCloudRegion,
      dataTypes,
      permitted: true,
      mechanism: 'UAE data localization — recommend UAE North region',
      risk: 'limited',
    }
  }

  // Default: permitted with minimal risk
  return {
    sourceJurisdiction,
    targetCloud,
    targetRegion: '' as SovereignCloudRegion,
    dataTypes,
    permitted: true,
    mechanism: 'No specific cross-border restriction detected',
    risk: 'minimal',
  }
}

/**
 * Identify sovereign cloud readiness gaps.
 */
function identifyGaps(
  cloud: SovereignCloudEnvironment,
  serviceChecks: SovereignServiceCheck[],
  crossBorderFlows: CrossBorderDataFlow[],
  landingZone?: LandingZoneReadiness
): SovereignCloudGap[] {
  const gaps: SovereignCloudGap[] = []
  let gapId = 1

  // Service availability gaps
  const unavailable = serviceChecks.filter(s => !s.availableInCloud)
  if (unavailable.length > 0) {
    gaps.push({
      id: `sg-${gapId++}`,
      dimension: 'service-availability',
      description: `${unavailable.map(s => s.service).join(', ')} not available in ${cloud}`,
      impact: 'high',
      recommendation: `Evaluate alternative services or consider hybrid architecture with Azure Commercial for ${unavailable.map(s => s.service).join(', ')}`,
    })
  }

  // Limited services
  const limited = serviceChecks.filter(s => s.availableInCloud && s.limitations)
  for (const svc of limited) {
    gaps.push({
      id: `sg-${gapId++}`,
      dimension: 'service-availability',
      description: `${svc.service}: ${svc.limitations}`,
      impact: 'medium',
      recommendation: `Plan for limited ${svc.service} capabilities in ${cloud}`,
    })
  }

  // Cross-border data flow gaps
  const blockedFlows = crossBorderFlows.filter(f => !f.permitted)
  for (const flow of blockedFlows) {
    gaps.push({
      id: `sg-${gapId++}`,
      dimension: 'data-residency',
      description: `Cross-border data flow blocked: ${flow.sourceJurisdiction} → ${cloud}`,
      impact: 'high',
      recommendation: flow.mechanism || 'Implement appropriate data transfer mechanism',
    })
  }

  const riskyFlows = crossBorderFlows.filter(f => f.permitted && (f.risk === 'high' || f.risk === 'limited'))
  for (const flow of riskyFlows) {
    gaps.push({
      id: `sg-${gapId++}`,
      dimension: 'data-residency',
      description: `Cross-border data flow risk (${flow.risk}): ${flow.dataTypes[0]} from ${flow.sourceJurisdiction}`,
      impact: flow.risk === 'high' ? 'high' : 'medium',
      recommendation: flow.mechanism || 'Review data transfer agreements',
    })
  }

  // Auth model gap for sovereign clouds requiring Entra ID
  if (cloud === 'azure-government' || cloud === 'azure-government-dod') {
    gaps.push({
      id: `sg-${gapId++}`,
      dimension: 'auth-model',
      description: 'Azure Government requires Entra ID (AAD) authentication — API key auth may not be supported',
      impact: 'high',
      recommendation: 'Configure managed identity or Entra ID service principal for Azure Government authentication',
    })
  }

  // Landing zone alignment
  if (landingZone) {
    if (cloud !== 'azure-public' && !landingZone.sovereignCloudRequired) {
      gaps.push({
        id: `sg-${gapId++}`,
        dimension: 'landing-zone',
        description: 'Landing zone not configured for sovereign cloud — management groups and policies may need reconfiguration',
        impact: 'medium',
        recommendation: `Update landing zone to support ${cloud} — ensure management group hierarchy, RBAC, and policy baselines align with selected cloud`,
      })
    }

    if (!landingZone.privateEndpoints && cloud !== 'azure-public') {
      gaps.push({
        id: `sg-${gapId++}`,
        dimension: 'network',
        description: 'Private endpoints not enabled — sovereign clouds typically mandate private network connectivity',
        impact: 'high',
        recommendation: 'Enable private endpoints for all AI services within the sovereign cloud environment',
      })
    }
  }

  // Endpoint routing gap (always applicable for non-public clouds)
  if (cloud !== 'azure-public') {
    gaps.push({
      id: `sg-${gapId++}`,
      dimension: 'endpoint-routing',
      description: `API endpoints must resolve to ${cloud} domain — current configuration targets Azure Commercial`,
      impact: 'high',
      recommendation: `Update AZURE_OPENAI_ENDPOINT and related environment variables to use ${cloud} endpoints`,
    })
  }

  return gaps
}

/**
 * Calculate sovereign readiness score (0-100).
 */
function calculateReadinessScore(
  gaps: SovereignCloudGap[],
  serviceChecks: SovereignServiceCheck[],
  crossBorderFlows: CrossBorderDataFlow[]
): number {
  let score = 100

  // Deduct for gaps
  for (const gap of gaps) {
    if (gap.impact === 'high') score -= 15
    else if (gap.impact === 'medium') score -= 8
    else score -= 3
  }

  // Deduct for unavailable services
  const unavailableCount = serviceChecks.filter(s => !s.availableInCloud).length
  score -= unavailableCount * 10

  // Deduct for blocked cross-border flows
  const blockedCount = crossBorderFlows.filter(f => !f.permitted).length
  score -= blockedCount * 20

  return Math.max(0, Math.min(100, score))
}

/**
 * Main assessment function — produces a complete SovereignCloudAssessment.
 *
 * This is the primary API for the ComplianceReviewStep to call.
 */
export function assessSovereignCloud(
  session: DiscoverySession,
  jurisdictions: string[],
  landingZone?: LandingZoneReadiness
): SovereignCloudAssessment {
  // 1. Detect sovereign cloud requirement
  const requirement = detectSovereignCloudRequirement(
    jurisdictions,
    session.entityType,
    session.industry
  )

  // 2. Build data residency requirement
  const dataResidency: DataResidencyRequirement = {
    requiredCloud: requirement.cloud,
    requiredRegions: requirement.regions,
    mandateLevel: requirement.mandateLevel,
    dataClassification: session.entityType === 'government' ? 'confidential' : 'internal',
    crossBorderTransferAllowed: requirement.cloud === 'azure-public',
    justification: requirement.justification,
    triggeringFrameworks: requirement.triggeringFrameworks,
  }

  // 3. Check service availability
  const serviceAvailability = getSovereignServiceAvailability(requirement.cloud)

  // 4. Assess cross-border data flows
  const primaryJurisdiction = jurisdictions[0] || 'International'
  const crossBorderFlows = assessCrossBorderFlows(
    primaryJurisdiction,
    requirement.cloud,
    requirement.regions[0]
  )

  // 5. Identify gaps
  const gaps = identifyGaps(requirement.cloud, serviceAvailability, crossBorderFlows, landingZone)

  // 6. Calculate readiness score
  const readinessScore = calculateReadinessScore(gaps, serviceAvailability, crossBorderFlows)

  return {
    cloudEnvironment: requirement.cloud,
    recommendedRegions: requirement.regions,
    mandateLevel: requirement.mandateLevel,
    dataResidency,
    serviceAvailability,
    crossBorderFlows,
    gaps,
    readinessScore,
    assessedAt: Date.now(),
  }
}
