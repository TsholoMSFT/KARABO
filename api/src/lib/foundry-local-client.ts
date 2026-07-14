import { AITask, getOutputTokenLimit } from './ai-cost-controls'

export interface FoundryLocalStatus {
  configured: boolean
  enabledForRuntime: boolean
  model: string
}

export interface FoundryLocalChatRequest {
  prompt: string
  task: AITask
  expectJson: boolean
  systemPrompt?: string
}

export interface FoundryLocalChatResponse {
  content: string
  model: string
  source: 'foundry-local'
  usage?: unknown
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV?.toLowerCase() === 'production' ||
    process.env.AZURE_FUNCTIONS_ENVIRONMENT?.toLowerCase() === 'production'
}

function getLoopbackBaseUrl(): string | null {
  const raw = process.env.FOUNDRY_LOCAL_ENDPOINT?.trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
    return url.protocol === 'http:' && isLoopback ? url.toString().replace(/\/$/, '') : null
  } catch {
    return null
  }
}

export function getFoundryLocalStatus(): FoundryLocalStatus {
  const configured = Boolean(getLoopbackBaseUrl())
  const explicitlyEnabled = process.env.FOUNDRY_LOCAL_ENABLED?.toLowerCase() === 'true'
  return {
    configured,
    enabledForRuntime: explicitlyEnabled && configured && !isProductionRuntime(),
    model: process.env.FOUNDRY_LOCAL_MODEL?.trim() || 'phi-4-mini-instruct',
  }
}

export async function tryFoundryLocalChat(
  request: FoundryLocalChatRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<FoundryLocalChatResponse | null> {
  const status = getFoundryLocalStatus()
  const baseUrl = getLoopbackBaseUrl()
  if (!status.enabledForRuntime || !baseUrl) return null

  const timeoutValue = Number(process.env.FOUNDRY_LOCAL_TIMEOUT_MS)
  const timeoutMs = Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : 8_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const messages: Array<{ role: 'system' | 'user'; content: string }> = []
  if (request.systemPrompt) messages.push({ role: 'system', content: request.systemPrompt })
  if (request.expectJson) {
    messages.push({
      role: 'system',
      content: 'Return only one valid JSON value. Do not include markdown fences or explanatory text.',
    })
  }
  messages.push({ role: 'user', content: request.prompt })

  try {
    const response = await fetchImpl(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: status.model,
        messages,
        max_tokens: getOutputTokenLimit(request.task),
        temperature: 0.7,
      }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Foundry Local returned ${response.status}`)

    const data = await response.json() as {
      model?: string
      choices?: Array<{ message?: { content?: string } }>
      usage?: unknown
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error('Foundry Local returned no content')
    if (request.expectJson) JSON.parse(content)

    return {
      content,
      model: data.model || status.model,
      source: 'foundry-local',
      usage: data.usage,
    }
  } finally {
    clearTimeout(timeout)
  }
}