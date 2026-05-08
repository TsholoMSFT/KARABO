/**
 * Front-end shim for the `/api/learn-search` Functions endpoint.
 *
 * Returns sanitized snippets/documents from Microsoft Learn via the
 * backend MCP proxy. Fails *silently* (returns []/'') on network or
 * server errors so callers can render a graceful "no docs available"
 * state without breaking the UI.
 */

export interface LearnSnippet {
  title: string
  url: string
  excerpt: string
}

export interface LearnDocument {
  url: string
  text: string
}

const API_BASE = '/api'

function sanitize(s: string): string {
  // Strip embedded HTML to prevent any chance of injection in tooltips.
  return s.replace(/<[^>]+>/g, '').slice(0, 1200)
}

export async function searchLearn(query: string, top = 5): Promise<LearnSnippet[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(`${API_BASE}/learn-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top }),
    })
    if (!res.ok) return []
    const body = (await res.json()) as { snippets?: LearnSnippet[] }
    return (body.snippets ?? []).map(s => ({
      title: sanitize(s.title || 'Microsoft Learn'),
      url: s.url || '',
      excerpt: sanitize(s.excerpt || ''),
    }))
  } catch {
    return []
  }
}

export async function fetchLearn(url: string): Promise<LearnDocument | null> {
  if (!url.trim()) return null
  try {
    const res = await fetch(`${API_BASE}/learn-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { url?: string; text?: string }
    return { url: body.url ?? url, text: sanitize(body.text ?? '') }
  } catch {
    return null
  }
}
