import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { makeCorsHeaders } from '../lib/xml-utils'
import { getAoaiAuthHeaders } from '../lib/iq-credential'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792' | '512x512' | '256x256'
type ImageStyle = 'natural' | 'vivid'
type ImageQuality = 'standard' | 'hd'

interface ImageRequest {
  prompt?: string
  size?: ImageSize
  style?: ImageStyle
  quality?: ImageQuality
  n?: number
}

interface AoaiImageResponse {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

async function imageHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_IMAGE || 'gpt-image-2'
  const apiVersion = process.env.AZURE_OPENAI_IMAGE_API_VERSION || '2024-10-01-preview'

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

  let body: ImageRequest
  try {
    body = (await req.json()) as ImageRequest
  } catch {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'Invalid JSON' } }
  }

  const prompt = (body.prompt || '').trim()
  if (!prompt) {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'prompt is required' } }
  }
  if (prompt.length > 4000) {
    return { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, jsonBody: { error: 'prompt too long (max 4000 chars)' } }
  }

  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`

  const payload: Record<string, unknown> = {
    prompt,
    size: body.size || '1024x1024',
    n: Math.min(Math.max(body.n || 1, 1), 4),
  }
  if (body.style) payload.style = body.style
  if (body.quality) payload.quality = body.quality

  try {
    context.log(`Image generation: deployment=${deployment} size=${payload.size} promptLen=${prompt.length}`)
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    })
    if (!r.ok) {
      const text = await r.text()
      context.warn(`Image gen failed: ${r.status} ${text.slice(0, 500)}`)
      return {
        status: r.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { error: 'Image generation failed', detail: text },
      }
    }
    const data = (await r.json()) as AoaiImageResponse
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        created: data.created,
        images: data.data.map((d) => ({
          b64: d.b64_json,
          url: d.url,
          revisedPrompt: d.revised_prompt,
        })),
      },
    }
  } catch (err) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Image generation request failed', detail: err instanceof Error ? err.message : String(err) },
    }
  }
}

app.http('image', {
  route: 'image',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: imageHandler,
})
