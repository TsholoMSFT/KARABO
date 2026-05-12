/**
 * Frontend client for the IQ family of Azure Functions:
 *  - Microsoft Graph (graph-query)
 *  - Foundry IQ      (foundry-iq)
 *  - Fabric IQ       (fabric-iq)
 *  - Work IQ         (work-iq)
 *
 * Every connector returns either { configured: true, results: [...] } or
 * { configured: false, message, requiredEnv } — UIs should handle both.
 */

export type IQSourceId = 'graph' | 'foundry' | 'fabric' | 'work'

export interface IQHit {
  id: string
  title?: string
  snippet?: string
  url?: string
  source?: string
  score?: number
  entityType?: string
  lastModified?: string
  metadata?: Record<string, any>
}

export interface IQQueryResponse {
  configured: boolean
  mode?: string
  results?: IQHit[]
  source?: string
  message?: string
  requiredEnv?: string[]
  docsUrl?: string
  fetchedAt?: string
  error?: string
  hint?: string
}

export interface IQAvailability {
  graph: boolean
  foundry: boolean
  fabric: boolean
  work: boolean
}

const API_BASE = (typeof window !== 'undefined' && (window as any).__API_BASE__) || ''

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api${path}`
  const res = await fetch(url, init)
  // Backends use status 200 with configured:false for clean unconfigured states
  if (!res.ok && res.status !== 200) throw new Error(`HTTP ${res.status} from ${path}`)
  return res.json() as Promise<T>
}

// ── Microsoft Graph ────────────────────────────────────────────────────────
export async function graphSearch(
  q: string,
  opts?: { mode?: 'search' | 'people' | 'files' | 'messages' | 'org'; top?: number; entityTypes?: string[] },
): Promise<IQQueryResponse> {
  const params = new URLSearchParams()
  params.set('mode', opts?.mode || 'search')
  if (q) params.set('q', q)
  if (opts?.top) params.set('top', String(opts.top))
  if (opts?.entityTypes?.length) params.set('entityTypes', opts.entityTypes.join(','))
  return getJson<IQQueryResponse>(`/graph-query?${params.toString()}`)
}

// ── Foundry IQ ─────────────────────────────────────────────────────────────
export async function foundryKnowledge(q: string, opts?: { index?: string; top?: number }): Promise<IQQueryResponse> {
  const params = new URLSearchParams({ mode: 'knowledge', q })
  if (opts?.index) params.set('index', opts.index)
  if (opts?.top) params.set('top', String(opts.top))
  return getJson<IQQueryResponse>(`/foundry-iq?${params.toString()}`)
}

export async function foundryAgents(): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>('/foundry-iq?mode=agents')
}

// ── Fabric IQ ──────────────────────────────────────────────────────────────
export async function fabricWorkspaces(): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>('/fabric-iq?mode=workspaces')
}

export async function fabricItems(workspaceId: string): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>(`/fabric-iq?mode=items&workspaceId=${encodeURIComponent(workspaceId)}`)
}

export async function fabricSemanticModels(workspaceId: string): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>(`/fabric-iq?mode=semantic-models&workspaceId=${encodeURIComponent(workspaceId)}`)
}

export async function fabricDax(workspaceId: string, datasetId: string, dax: string): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>(`/fabric-iq?mode=dax`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, datasetId, dax }),
  })
}

// ── Work IQ ────────────────────────────────────────────────────────────────
export async function workConnections(): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>('/work-iq?mode=connections')
}

export async function workRetrieval(q: string, opts?: { top?: number }): Promise<IQQueryResponse> {
  return getJson<IQQueryResponse>('/work-iq?mode=retrieval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, top: opts?.top || 10 }),
  })
}

// ── Aggregate availability probe ───────────────────────────────────────────
export async function probeIQAvailability(): Promise<IQAvailability> {
  const probes = await Promise.allSettled([
    getJson<IQQueryResponse>('/graph-query?mode=org&top=1'),
    getJson<IQQueryResponse>('/foundry-iq?mode=knowledge&q=ping&top=1'),
    getJson<IQQueryResponse>('/fabric-iq?mode=workspaces'),
    getJson<IQQueryResponse>('/work-iq?mode=connections'),
  ])
  const get = (i: number) => probes[i].status === 'fulfilled' && (probes[i] as any).value?.configured === true
  return {
    graph: get(0),
    foundry: get(1),
    fabric: get(2),
    work: get(3),
  }
}
