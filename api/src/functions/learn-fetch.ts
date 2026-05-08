import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { makeCorsHeaders } from '../lib/xml-utils'
import { learnFetch } from '../lib/learn-mcp-client'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

interface FetchBody {
  url?: string
}

/**
 * Dedicated Learn page fetcher. Backed by the Learn MCP `microsoft_docs_fetch`
 * tool — returns the page in markdown form. Frontend uses this to expand a
 * snippet inline ("Read full page").
 *
 * The combined `/api/learn-search` endpoint also accepts `{ url }` for
 * backward compatibility; this route is the predictable surface to call
 * when you already know the URL.
 */
async function learnFetchHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }

  let body: FetchBody = {}
  try {
    body = (await req.json()) as FetchBody
  } catch {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid JSON body' },
    }
  }

  const url = body.url?.trim()
  if (!url) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Missing "url"' },
    }
  }

  // Lock the surface to learn.microsoft.com to prevent it being used as an
  // open redirector / SSRF helper. The MCP tool itself should also enforce
  // this, but we belt-and-brace at the edge.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid URL' },
    }
  }
  if (parsed.protocol !== 'https:' || !/(^|\.)learn\.microsoft\.com$/.test(parsed.hostname)) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Only learn.microsoft.com URLs are allowed' },
    }
  }

  try {
    const text = await learnFetch(parsed.toString())
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { url: parsed.toString(), text },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    context.log('learn-fetch error:', message)
    return {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Learn fetch failed', detail: message },
    }
  }
}

app.http('learn-fetch', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'learn-fetch',
  handler: learnFetchHandler,
})
