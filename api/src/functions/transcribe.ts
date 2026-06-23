import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { makeCorsHeaders } from '../lib/xml-utils'
import { getAoaiAuthHeaders } from '../lib/iq-credential'

const corsHeaders = makeCorsHeaders('POST, OPTIONS')

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — Azure OpenAI Whisper limit

interface TranscriptionSegment {
  id?: number
  start: number
  end: number
  text: string
  avg_logprob?: number
  no_speech_prob?: number
}

interface AoaiTranscriptionResponse {
  text: string
  language?: string
  duration?: number
  segments?: TranscriptionSegment[]
}

async function transcribeHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders }
  if (req.method !== 'POST') {
    return {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Method not allowed' },
    }
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_WHISPER || 'gpt-realtime-whisper'
  const apiVersion = process.env.AZURE_OPENAI_TRANSCRIBE_API_VERSION || '2024-10-21'

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

  let form: Awaited<ReturnType<typeof req.formData>>
  try {
    form = await req.formData()
  } catch (err) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid multipart/form-data', detail: err instanceof Error ? err.message : String(err) },
    }
  }

  const file = form.get('file') as any
  if (!file || typeof file.arrayBuffer !== 'function') {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: "Missing 'file' in multipart/form-data" },
    }
  }

  const size = typeof file.size === 'number' ? file.size : undefined
  if (typeof size === 'number' && size > MAX_BYTES) {
    return {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'File too large', detail: `Max ${Math.round(MAX_BYTES / 1024 / 1024)} MB per file.` },
    }
  }

  const language = (form.get('language') as string | null) || undefined
  const prompt = (form.get('prompt') as string | null) || undefined

  // Rebuild the multipart body for the upstream call (we own the boundary).
  const upstream = new FormData()
  upstream.append('file', file, file.name || 'audio.webm')
  upstream.append('response_format', 'verbose_json')
  upstream.append('timestamp_granularities[]', 'segment')
  if (language) upstream.append('language', language)
  if (prompt) upstream.append('prompt', prompt)

  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/audio/transcriptions?api-version=${apiVersion}`

  try {
    context.log(`Transcribe: deployment=${deployment} bytes=${size ?? 'unknown'} lang=${language ?? 'auto'}`)
    const r = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders }, // do NOT set Content-Type — fetch sets multipart boundary
      body: upstream,
    })
    if (!r.ok) {
      const text = await r.text()
      context.warn(`Transcribe failed: ${r.status} ${text.slice(0, 500)}`)
      return {
        status: r.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { error: 'Transcription failed', detail: text },
      }
    }
    const data = (await r.json()) as AoaiTranscriptionResponse
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: (data.segments || []).map((s) => ({ start: s.start, end: s.end, text: s.text })),
      },
    }
  } catch (err) {
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { error: 'Transcribe request failed', detail: err instanceof Error ? err.message : String(err) },
    }
  }
}

app.http('transcribe', {
  route: 'transcribe',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: transcribeHandler,
})
