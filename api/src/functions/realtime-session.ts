import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { makeCorsHeaders } from '../lib/xml-utils'
import { getBearerToken } from '../lib/iq-credential'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

type RealtimeMode = 'whisper' | 'translate'

interface RealtimeSessionRequest {
  mode?: RealtimeMode
  language?: string
  instructions?: string
}

/**
 * Mints a short-lived Entra ID bearer token + WSS URL so the browser can
 * connect directly to Azure OpenAI Realtime. This avoids streaming audio
 * through Functions (cheaper, lower latency).
 *
 * Security: the returned token is a 5-min AAD access token scoped to
 * Cognitive Services. Treat as a per-session secret. Always over HTTPS/WSS.
 */
async function realtimeSessionHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }
  if (req.method !== 'POST') {
    return {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Method not allowed' },
    }
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  if (!endpoint) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'AZURE_OPENAI_ENDPOINT not configured' },
    }
  }

  let body: RealtimeSessionRequest = {}
  try {
    if (req.body) body = ((await req.json()) as RealtimeSessionRequest) || {}
  } catch {
    // Tolerate empty/invalid body — treat as defaults
    body = {}
  }

  const mode: RealtimeMode = body.mode === 'translate' ? 'translate' : 'whisper'
  const deployment =
    mode === 'translate'
      ? process.env.AZURE_OPENAI_DEPLOYMENT_TRANSLATE || 'gpt-realtime-translate'
      : process.env.AZURE_OPENAI_DEPLOYMENT_WHISPER || 'gpt-realtime-whisper'
  const apiVersion = process.env.AZURE_OPENAI_REALTIME_API_VERSION || '2024-10-01-preview'

  const token = await getBearerToken('https://cognitiveservices.azure.com/.default')
  if (!token) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        error: 'Could not acquire Entra ID token',
        detail: 'Realtime requires Entra ID auth. Run `az login` locally or assign a managed identity to the Function App.',
      },
    }
  }

  // Build the WSS URL — strip protocol, swap https → wss, drop trailing slash.
  const host = endpoint.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  const wssUrl = `wss://${host}/openai/realtime?api-version=${apiVersion}&deployment=${encodeURIComponent(deployment)}`

  // AAD tokens are typically 60-90 min, but we expose a conservative 5-min
  // expiry hint so clients renew often.
  const expiresAt = Date.now() + 5 * 60 * 1000

  context.log(`Realtime session: mode=${mode} deployment=${deployment}`)

  return {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    jsonBody: {
      token,
      expiresAt,
      wssUrl,
      mode,
      deployment,
      apiVersion,
      language: body.language || null,
      instructions: body.instructions || null,
    },
  }
}

app.http('realtime-session', {
  route: 'realtime-session',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: realtimeSessionHandler,
})
