/**
 * Minimal MCP-over-HTTP client for the Microsoft Learn MCP server.
 *
 * Avoids pulling in `@modelcontextprotocol/sdk` to keep the Functions
 * cold-start small. Uses JSON-RPC 2.0 directly per the streamable-HTTP
 * MCP transport. Adds a tiny LRU cache, a 5s per-request timeout, and a
 * naive circuit breaker so the front-end never hangs.
 */

interface RpcResult<T> {
  jsonrpc: '2.0'
  id: number | string
  result?: T
  error?: { code: number; message: string }
}

const LEARN_ENDPOINT = process.env.LEARN_MCP_ENDPOINT?.trim() || 'https://learn.microsoft.com/api/mcp'
const REQUEST_TIMEOUT_MS = 5000
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6h
const CACHE_MAX_ENTRIES = 200

// ── Cache ─────────────────────────────────────────────────────────
interface CacheEntry<T> { value: T; expiresAt: number }
const cache = new Map<string, CacheEntry<unknown>>()

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (entry.expiresAt < Date.now()) {
    cache.delete(key)
    return undefined
  }
  // LRU touch
  cache.delete(key)
  cache.set(key, entry)
  return entry.value
}

function cacheSet<T>(key: string, value: T): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ── Circuit breaker ──────────────────────────────────────────────
let consecutiveFailures = 0
let openUntil = 0
const FAIL_THRESHOLD = 3
const COOLDOWN_MS = 60_000

function breakerOpen(): boolean {
  return Date.now() < openUntil
}

function recordSuccess(): void {
  consecutiveFailures = 0
  openUntil = 0
}

function recordFailure(): void {
  consecutiveFailures += 1
  if (consecutiveFailures >= FAIL_THRESHOLD) openUntil = Date.now() + COOLDOWN_MS
}

// ── RPC ──────────────────────────────────────────────────────────
let nextId = 1

async function rpc<T>(method: string, params: unknown): Promise<T> {
  if (breakerOpen()) throw new Error('learn-mcp: circuit open')

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(LEARN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      recordFailure()
      throw new Error(`learn-mcp: HTTP ${res.status}`)
    }
    const body = (await res.json()) as RpcResult<T>
    if (body.error) {
      recordFailure()
      throw new Error(`learn-mcp: ${body.error.message}`)
    }
    recordSuccess()
    return body.result as T
  } finally {
    clearTimeout(timer)
  }
}

// ── Tool wrappers ────────────────────────────────────────────────

export interface LearnSnippet {
  title: string
  url: string
  excerpt: string
}

interface ToolCallResult {
  content?: Array<{ type: string; text?: string }>
  isError?: boolean
}

/** Search Microsoft Learn docs via the `microsoft_docs_search` MCP tool. */
export async function learnSearch(query: string, top = 5): Promise<LearnSnippet[]> {
  const key = `search:${top}:${query}`
  const cached = cacheGet<LearnSnippet[]>(key)
  if (cached) return cached

  const result = await rpc<ToolCallResult>('tools/call', {
    name: 'microsoft_docs_search',
    arguments: { question: query },
  })

  const snippets = parseSnippets(result, top)
  cacheSet(key, snippets)
  return snippets
}

/** Fetch full doc content via the `microsoft_docs_fetch` MCP tool. */
export async function learnFetch(url: string): Promise<string> {
  const key = `fetch:${url}`
  const cached = cacheGet<string>(key)
  if (cached) return cached

  const result = await rpc<ToolCallResult>('tools/call', {
    name: 'microsoft_docs_fetch',
    arguments: { url },
  })

  const text = (result.content ?? []).map(c => c.text ?? '').join('\n').trim()
  cacheSet(key, text)
  return text
}

// ── Parsing ──────────────────────────────────────────────────────

function parseSnippets(result: ToolCallResult, top: number): LearnSnippet[] {
  const out: LearnSnippet[] = []
  for (const part of result.content ?? []) {
    if (part.type !== 'text' || !part.text) continue
    // Each text part may be a stringified JSON array of { title, url, content }.
    try {
      const parsed = JSON.parse(part.text)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item?.title === 'string' && typeof item?.url === 'string') {
            out.push({
              title: item.title,
              url: item.url,
              excerpt: typeof item.content === 'string' ? item.content.slice(0, 600) : '',
            })
          }
        }
        continue
      }
    } catch {
      // Fallback: treat as plain text snippet.
    }
    out.push({ title: 'Microsoft Learn', url: '', excerpt: part.text.slice(0, 600) })
  }
  return out.slice(0, top)
}
