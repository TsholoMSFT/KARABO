/**
 * OpenAI API Service
 * Provides direct OpenAI API integration for LLM calls
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_ORG_ID = import.meta.env.VITE_OPENAI_ORG_ID

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Call OpenAI's Chat Completion API
 * @param prompt - The user prompt
 * @param model - Model to use (gpt-4o or gpt-4o-mini)
 * @param expectJson - Whether to expect JSON response
 * @returns The completion text or parsed JSON
 */
export async function callOpenAI(
  prompt: string,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
  }

  const messages: OpenAIMessage[] = [
    {
      role: 'user',
      content: prompt,
    },
  ]

  const requestBody: any = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  }

  if (expectJson) {
    requestBody.response_format = { type: 'json_object' }
  }

  try {
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

    const data: OpenAIChatResponse = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    return content
  } catch (error) {
    console.error('OpenAI API call failed:', error)
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
