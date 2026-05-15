import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { AzureKeyCredential, SearchClient } from '@azure/search-documents'
import { makeCorsHeaders } from '../lib/xml-utils'
import { getAoaiAuthHeaders } from '../lib/iq-credential'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

interface KnowledgeDoc {
  id: string
  title?: string
  content?: string
  source?: string
  category?: string
  url?: string
  embedding?: number[]
}

interface SearchBody {
  query?: string
  top?: number
  category?: string
}

let cachedClient: SearchClient<KnowledgeDoc> | null = null
function getClient(): SearchClient<KnowledgeDoc> | null {
  if (cachedClient) return cachedClient
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT
  const key = process.env.AZURE_SEARCH_KEY
  const index = process.env.AZURE_SEARCH_INDEX || 'karabo-knowledge'
  if (!endpoint || !key) return null
  cachedClient = new SearchClient<KnowledgeDoc>(endpoint, index, new AzureKeyCredential(key))
  return cachedClient
}

async function embedQuery(text: string): Promise<number[] | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'
  const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION || '2024-10-21'
  if (!endpoint) return null
  const authHeaders = await getAoaiAuthHeaders(apiKey)
  if (!authHeaders) return null
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ input: text }),
  })
  if (!r.ok) return null
  const data = (await r.json()) as { data: Array<{ embedding: number[] }> }
  return data.data?.[0]?.embedding ?? null
}

async function searchKnowledgeHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }

  const client = getClient()
  if (!client) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'AZURE_SEARCH_ENDPOINT / AZURE_SEARCH_KEY not configured' },
    }
  }

  let body: SearchBody = {}
  try {
    body = (await req.json()) as SearchBody
  } catch {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'Invalid JSON' } }
  }

  const query = (body.query || '').trim()
  if (!query) {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'query required' } }
  }
  const top = Math.min(Math.max(body.top ?? 5, 1), 20)

  try {
    const vector = await embedQuery(query)
    const filter = body.category ? `category eq '${body.category.replace(/'/g, "''")}'` : undefined

    const results = await client.search(query, {
      top,
      filter,
      vectorSearchOptions: vector
        ? { queries: [{ kind: 'vector', vector, kNearestNeighborsCount: top, fields: ['embedding'] }] }
        : undefined,
      select: ['id', 'title', 'content', 'source', 'category', 'url'],
    })

    const items: Array<KnowledgeDoc & { score?: number }> = []
    for await (const r of results.results) {
      items.push({ ...(r.document as KnowledgeDoc), score: r.score })
    }

    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { items, count: items.length, vector: !!vector },
    }
  } catch (err) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Search failed', detail: err instanceof Error ? err.message : String(err) },
    }
  }
}

app.http('searchKnowledge', {
  route: 'search-knowledge',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: searchKnowledgeHandler,
})
