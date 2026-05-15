import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { makeCorsHeaders } from '../lib/xml-utils'
import { getAoaiAuthHeaders } from '../lib/iq-credential'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

interface EmbeddingsBody {
  input?: string | string[]
}

interface AoaiEmbeddingsResponse {
  data: Array<{ embedding: number[]; index: number }>
  model?: string
  usage?: { prompt_tokens: number; total_tokens: number }
}

async function embeddingsHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'
  const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION || '2024-10-21'

  if (!endpoint) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'AZURE_OPENAI_ENDPOINT not configured' },
    }
  }

  const authHeaders = await getAoaiAuthHeaders(apiKey)
  if (!authHeaders) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'No auth available (set AZURE_OPENAI_AUTH_TYPE=entra-id with az login, or supply AZURE_OPENAI_API_KEY)' },
    }
  }

  let body: EmbeddingsBody
  try {
    body = (await req.json()) as EmbeddingsBody
  } catch {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'Invalid JSON' } }
  }

  const input = body.input
  if (!input || (Array.isArray(input) && input.length === 0)) {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'input required' } }
  }

  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ input }),
    })
    if (!r.ok) {
      const text = await r.text()
      return {
        status: r.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { error: 'Embeddings call failed', detail: text },
      }
    }
    const data = (await r.json()) as AoaiEmbeddingsResponse
    const vectors = data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { vectors, model: data.model, usage: data.usage },
    }
  } catch (err) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Embeddings request failed', detail: err instanceof Error ? err.message : String(err) },
    }
  }
}

app.http('embeddings', {
  route: 'embeddings',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: embeddingsHandler,
})
