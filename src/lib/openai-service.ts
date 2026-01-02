/**
 * AI Service
 * Provides AI integration via secure Azure Function proxy
 * Supports both Azure OpenAI (via proxy) and direct OpenAI API (for local dev)
 */

// API endpoint for the Azure Function proxy
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

// Fallback to direct OpenAI for local development only
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_ORG_ID = import.meta.env.VITE_OPENAI_ORG_ID

// Determine if we should use proxy or direct API
const USE_PROXY = !OPENAI_API_KEY || import.meta.env.PROD

interface ProxyResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
  details?: string
}

/**
 * Call AI via secure Azure Function proxy
 */
async function callViaProxy(
  prompt: string,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  const response = await fetch(`${API_ENDPOINT}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model, expectJson }),
  })

  const data: ProxyResponse = await response.json()

  if (!response.ok || data.error) {
    throw new Error(data.error || `API error: ${response.status}`)
  }

  return data.content
}

/**
 * Call OpenAI directly (for local development only)
 */
async function callDirectOpenAI(
  prompt: string,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
  }

  const requestBody: any = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  }

  if (expectJson) {
    requestBody.response_format = { type: 'json_object' }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      ...(OPENAI_ORG_ID ? { 'OpenAI-Organization': OPENAI_ORG_ID } : {}),
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}. ${
        errorData.error?.message || ''
      }`
    )
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  return content
}

/**
 * Call AI - automatically uses proxy in production, direct API in development
 * @param prompt - The user prompt
 * @param model - Model to use (gpt-4o or gpt-4o-mini)
 * @param expectJson - Whether to expect JSON response
 * @returns The completion text
 */
export async function callOpenAI(
  prompt: string,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  try {
    if (USE_PROXY) {
      return await callViaProxy(prompt, model, expectJson)
    } else {
      return await callDirectOpenAI(prompt, model, expectJson)
    }
  } catch (error) {
    console.error('AI call failed:', error)
    throw error
  }
}

/**
 * Global LLM API - provides window.llm() for AI calls throughout the application
 */
export const llmAPI = {
  llm: callOpenAI,
}

// Make it available on window for global access
declare global {
  interface Window {
    llm: typeof callOpenAI
  }
}

if (typeof window !== 'undefined') {
  window.llm = callOpenAI
}
