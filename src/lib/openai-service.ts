/**
 * AI Service
 * Provides AI integration via secure Azure Function proxy
 * Supports Azure OpenAI (direct or via proxy) and direct OpenAI API (for local dev)
 */

// API endpoint for the Azure Function proxy
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

// Azure OpenAI configuration (for local development)
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY

// Fallback to direct OpenAI for local development only
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_ORG_ID = import.meta.env.VITE_OPENAI_ORG_ID

// Determine which API to use
const USE_AZURE_DIRECT = !!AZURE_OPENAI_ENDPOINT && !!AZURE_OPENAI_API_KEY
const USE_OPENAI_DIRECT = !!OPENAI_API_KEY && !USE_AZURE_DIRECT
const USE_PROXY = !USE_AZURE_DIRECT && !USE_OPENAI_DIRECT

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
 * Call Azure OpenAI directly (for local development)
 */
async function callAzureOpenAI(
  prompt: string,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    throw new Error('Azure OpenAI not configured. Please add VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY to your .env file.')
  }

  const deploymentName = model // deployment name matches model name
  const apiVersion = '2024-02-15-preview'
  const url = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`

  const requestBody: any = {
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  }

  if (expectJson) {
    requestBody.response_format = { type: 'json_object' }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Azure OpenAI API error: ${response.status} ${response.statusText}. ${
        errorData.error?.message || ''
      }`
    )
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content in Azure OpenAI response')
  }

  return content
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
 * Priority: Azure OpenAI Direct > OpenAI Direct > Proxy
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
    if (USE_AZURE_DIRECT) {
      console.log('Using Azure OpenAI direct API')
      return await callAzureOpenAI(prompt, model, expectJson)
    } else if (USE_OPENAI_DIRECT) {
      console.log('Using OpenAI direct API')
      return await callDirectOpenAI(prompt, model, expectJson)
    } else {
      console.log('Using proxy API at', API_ENDPOINT)
      return await callViaProxy(prompt, model, expectJson)
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
