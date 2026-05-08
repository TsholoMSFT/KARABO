/**
 * Shared edge model — single source of truth for inter-component edges
 * used by BOTH the Mermaid renderer and the React Flow renderer.
 *
 * Edges are derived deterministically from a BlueprintResult so the two
 * views never drift apart.
 */

import type { Blueprint, BlueprintComponent, BlueprintLayer, CapabilityId } from '@/lib/solution-blueprint/types'

export type DiagramEdgeKind = 'control' | 'data' | 'auth' | 'observe'

export interface DiagramEdge {
  id: string
  fromCapability: CapabilityId
  toCapability: CapabilityId
  kind: DiagramEdgeKind
  label?: string
}

/**
 * Layer ordering used to drive default edges (down-stack flow).
 * UX/Engagement → App/AI → Data → Infra; Identity & Security cross-cut
 * into App/AI; Operations observes everything.
 */
const LAYER_ORDER: BlueprintLayer[] = ['app-ai', 'data', 'infrastructure', 'identity', 'security', 'operations']

/** Capability sets that anchor the well-known edges. */
const UX_CAPABILITIES: CapabilityId[] = ['ux-surface-teams', 'ux-surface-copilot', 'ux-surface-power-platform']
const HOSTING_CAPABILITIES: CapabilityId[] = ['app-hosting-web', 'app-hosting-container', 'app-hosting-serverless']
const AI_CORE_CAPABILITIES: CapabilityId[] = ['llm-hosting', 'agent-orchestration', 'embeddings']
const DATA_STORE_CAPABILITIES: CapabilityId[] = ['relational-db', 'nosql-db', 'vector-store', 'search-index', 'lakehouse', 'analytical-store', 'object-storage']
const IDENTITY_CAPABILITIES: CapabilityId[] = ['workforce-identity', 'consumer-identity', 'managed-identity', 'agent-identity']
const SECURITY_CAPABILITIES: CapabilityId[] = ['secrets-mgmt', 'key-mgmt-cmk', 'waf', 'jailbreak-detection', 'content-safety']
const OBS_CAPABILITIES: CapabilityId[] = ['observability-logs', 'observability-metrics', 'observability-traces']
const GATEWAY_CAPABILITIES: CapabilityId[] = ['ai-gateway', 'api-management']

export function deriveEdges(blueprint: Blueprint): DiagramEdge[] {
  const present = new Set(blueprint.components.map(c => c.capability))
  const has = (id: CapabilityId) => present.has(id)
  const edges: DiagramEdge[] = []
  let counter = 0
  const push = (e: Omit<DiagramEdge, 'id'>) => edges.push({ ...e, id: `e${counter++}` })

  const firstPresent = (cands: CapabilityId[]) => cands.find(has)

  const ux = firstPresent(UX_CAPABILITIES)
  const gateway = firstPresent(GATEWAY_CAPABILITIES)
  const host = firstPresent(HOSTING_CAPABILITIES)
  const aiCore = firstPresent(AI_CORE_CAPABILITIES)
  const identity = firstPresent(IDENTITY_CAPABILITIES)

  // 1) UX → gateway → host → ai core
  if (ux && gateway) push({ fromCapability: ux, toCapability: gateway, kind: 'control', label: 'request' })
  if (gateway && host) push({ fromCapability: gateway, toCapability: host, kind: 'control' })
  if (!gateway && ux && host) push({ fromCapability: ux, toCapability: host, kind: 'control', label: 'request' })
  if (host && aiCore) push({ fromCapability: host, toCapability: aiCore, kind: 'control', label: 'invoke' })

  // 2) AI core → vector / search / data
  for (const cap of DATA_STORE_CAPABILITIES) {
    if (aiCore && has(cap)) push({ fromCapability: aiCore, toCapability: cap, kind: 'data', label: cap === 'vector-store' || cap === 'search-index' ? 'retrieve' : 'read' })
  }

  // 3) Workflow / events
  if (has('workflow-orchestration') && aiCore) push({ fromCapability: 'workflow-orchestration', toCapability: aiCore, kind: 'control', label: 'orchestrate' })
  if (has('event-streaming') && has('workflow-orchestration')) push({ fromCapability: 'event-streaming', toCapability: 'workflow-orchestration', kind: 'data', label: 'events' })
  if (has('messaging-queue') && aiCore) push({ fromCapability: 'messaging-queue', toCapability: aiCore, kind: 'data' })

  // 4) Identity → host / ai core / agents
  if (identity && host) push({ fromCapability: identity, toCapability: host, kind: 'auth' })
  if (has('agent-identity') && has('agent-orchestration')) push({ fromCapability: 'agent-identity', toCapability: 'agent-orchestration', kind: 'auth' })

  // 5) Security cross-cut → ai core, gateway
  for (const sec of SECURITY_CAPABILITIES) {
    if (!has(sec)) continue
    if (sec === 'content-safety' || sec === 'jailbreak-detection') {
      if (gateway) push({ fromCapability: sec, toCapability: gateway, kind: 'control', label: 'guardrail' })
      else if (aiCore) push({ fromCapability: sec, toCapability: aiCore, kind: 'control', label: 'guardrail' })
    } else if (sec === 'waf') {
      if (gateway) push({ fromCapability: sec, toCapability: gateway, kind: 'control' })
    } else if ((sec === 'secrets-mgmt' || sec === 'key-mgmt-cmk') && host) {
      push({ fromCapability: sec, toCapability: host, kind: 'auth', label: 'secrets' })
    }
  }

  // 6) Observability watches host + ai core
  for (const obs of OBS_CAPABILITIES) {
    if (!has(obs)) continue
    if (host) push({ fromCapability: obs, toCapability: host, kind: 'observe' })
    if (aiCore) push({ fromCapability: obs, toCapability: aiCore, kind: 'observe' })
  }

  return edges
}

export function componentByCapability(blueprint: Blueprint): Map<CapabilityId, BlueprintComponent> {
  const m = new Map<CapabilityId, BlueprintComponent>()
  for (const c of blueprint.components) m.set(c.capability, c)
  return m
}

export { LAYER_ORDER }
