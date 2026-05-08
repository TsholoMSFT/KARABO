import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { makeCorsHeaders } from '../lib/xml-utils'
import { learnSearch, learnFetch } from '../lib/learn-mcp-client'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

interface SearchBody {
  query?: string
  top?: number
  url?: string
}

async function learnSearchHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }

  let body: SearchBody = {}
  try {
    body = (await req.json()) as SearchBody
  } catch {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid JSON body' },
    }
  }

  try {
    if (body.url) {
      const text = await learnFetch(body.url)
      return {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { url: body.url, text },
      }
    }

    const query = body.query?.trim()
    if (!query) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { error: 'Missing "query" or "url"' },
      }
    }
    const top = Math.min(Math.max(body.top ?? 5, 1), 10)
    const snippets = await learnSearch(query, top)
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { query, snippets },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    context.log('learn-search error:', message)
    return {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Learn lookup failed', detail: message },
    }
  }
}

app.http('learn-search', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'learn-search',
  handler: learnSearchHandler,
})
