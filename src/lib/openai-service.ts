/**
 * AI Service
 * Provides AI integration via secure Azure Function proxy
 * Supports Azure OpenAI (direct or via proxy) and direct OpenAI API (for local dev)
 * 
 * Features:
 * - Response caching (5-minute TTL)
 * - Task-based model routing for cost optimization
 * - Multi-model support (GPT-4o, GPT-4o-mini, Phi-4-mini-instruct, GPT-5-nano)
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

// ============================================================================
// RESPONSE CACHING
// ============================================================================

interface CacheEntry {
  content: string
  timestamp: number
  model: string
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const responseCache = new Map<string, CacheEntry>()

/**
 * Generate a cache key from prompt and model
 */
function getCacheKey(prompt: string, model: string, expectJson: boolean): string {
  // Simple hash function for cache key
  const input = `${model}:${expectJson}:${prompt}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `cache_${hash}`
}

/**
 * Check cache for a response
 */
function getFromCache(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  
  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }
  
  console.log(`[Cache HIT] Using cached response for ${entry.model}`)
  return entry.content
}

/**
 * Store response in cache
 */
function setCache(key: string, content: string, model: string): void {
  responseCache.set(key, {
    content,
    timestamp: Date.now(),
    model,
  })
  
  // Cleanup old entries if cache is too large (max 100 entries)
  if (responseCache.size > 100) {
    const entries = Array.from(responseCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    // Remove oldest 20 entries
    entries.slice(0, 20).forEach(([key]) => responseCache.delete(key))
  }
}

/**
 * Clear the entire cache
 */
export function clearAICache(): void {
  responseCache.clear()
  console.log('[Cache] Cleared all cached responses')
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; hits: number; misses: number } {
  return {
    size: responseCache.size,
    hits: cacheHits,
    misses: cacheMisses,
  }
}

let cacheHits = 0
let cacheMisses = 0

// ============================================================================
// MODEL ROUTING
// ============================================================================

export type ModelType = 'gpt-4o' | 'gpt-4o-mini' | 'phi-4-mini-instruct' | 'gpt-5-nano'

export type AITask = 
  | 'extraction'      // Use case extraction from text → Phi-4-mini-instruct
  | 'formatting'      // JSON formatting, simple transforms → Phi-4-mini-instruct  
  | 'analysis'        // COI estimation, effort estimation → GPT-4o-mini
  | 'architecture'    // Solution architecture → GPT-4o-mini
  | 'executive'       // Executive summaries → GPT-4o (premium)
  | 'general'         // Default → Phi-4-mini-instruct

/**
 * Get the optimal model for a given task
 * Cost-optimized routing:
 * - Phi-4-mini-instruct ($0.075/1M): extraction, formatting, general
 * - GPT-5-nano ($0.14/1M): fallback for extraction
 * - GPT-4o-mini ($0.26/1M): analysis, architecture, effort
 * - GPT-4o ($2.50/1M): executive summaries (premium)
 */
export function getModelForTask(task: AITask): ModelType {
  const taskModelMap: Record<AITask, ModelType> = {
    extraction: 'phi-4-mini-instruct',
    formatting: 'phi-4-mini-instruct',
    general: 'phi-4-mini-instruct',
    analysis: 'gpt-4o-mini',
    architecture: 'gpt-4o-mini',
    executive: 'gpt-4o',
  }
  return taskModelMap[task] || 'phi-4-mini-instruct'
}

/**
 * Call AI for a specific task with automatic model selection
 */
export async function callAIForTask(
  task: AITask,
  prompt: string,
  options: { expectJson?: boolean; systemPrompt?: string } = {}
): Promise<string> {
  const model = getModelForTask(task)
  console.log(`[AI] Task: ${task} → Model: ${model}`)
  return callOpenAI(prompt, model, options.expectJson ?? false, options.systemPrompt)
}

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
  model: ModelType = 'phi-4-mini-instruct',
  expectJson: boolean = false,
  systemPrompt?: string
): Promise<string> {
  const response = await fetch(`${API_ENDPOINT}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model, expectJson, systemPrompt }),
  })

  const data: ProxyResponse = await response.json()

  if (!response.ok || data.error) {
    throw new Error(data.error || `API error: ${response.status}`)
  }

  return data.content
}

/**
 * Call Azure OpenAI directly (for local development)
 * Note: Only supports GPT models, AI Hub models use proxy
 */
async function callAzureOpenAI(
  prompt: string,
  model: ModelType = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    throw new Error('Azure OpenAI not configured. Please add VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY to your .env file.')
  }

  // For AI Hub models, fall back to proxy (can't call directly from browser)
  if (model === 'phi-4-mini-instruct' || model === 'gpt-5-nano') {
    console.log(`Model ${model} requires proxy, falling back to gpt-4o-mini for direct call`)
    model = 'gpt-4o-mini'
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
 * Note: Only supports OpenAI models, Phi/AI Hub models use proxy
 */
async function callDirectOpenAI(
  prompt: string,
  model: ModelType = 'gpt-4o-mini',
  expectJson: boolean = false
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
  }

  // For AI Hub models, fall back to gpt-4o-mini (OpenAI doesn't have Phi)
  let openaiModel = model
  if (model === 'phi-4-mini-instruct' || model === 'gpt-5-nano') {
    console.log(`Model ${model} not available on OpenAI, using gpt-4o-mini`)
    openaiModel = 'gpt-4o-mini'
  }

  const requestBody: any = {
    model: openaiModel,
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
 * Features: Response caching with 5-minute TTL
 * @param prompt - The user prompt
 * @param model - Model to use
 * @param expectJson - Whether to expect JSON response
 * @param systemPrompt - Optional system prompt for prompt caching
 * @returns The completion text
 */
export async function callOpenAI(
  prompt: string,
  model: ModelType = 'phi-4-mini-instruct',
  expectJson: boolean = false,
  systemPrompt?: string
): Promise<string> {
  // Check cache first
  const cacheKey = getCacheKey(prompt, model, expectJson)
  const cached = getFromCache(cacheKey)
  if (cached) {
    cacheHits++
    return cached
  }
  cacheMisses++

  try {
    let result: string
    
    if (USE_AZURE_DIRECT) {
      console.log(`Using Azure OpenAI direct API (${model})`)
      result = await callAzureOpenAI(prompt, model, expectJson)
    } else if (USE_OPENAI_DIRECT) {
      console.log(`Using OpenAI direct API (${model})`)
      result = await callDirectOpenAI(prompt, model, expectJson)
    } else {
      console.log(`Using proxy API at ${API_ENDPOINT} (${model})`)
      result = await callViaProxy(prompt, model, expectJson, systemPrompt)
    }

    // Cache the successful response
    setCache(cacheKey, result, model)
    return result
  } catch (error) {
    console.error('AI call failed:', error)
    throw error
  }
}

/**
 * AI Effort Estimation - estimates implementation effort in person-weeks with reasoning
 * @param useCase - The use case to estimate effort for
 * @returns Effort estimate in person-weeks with reasoning
 */
export interface EffortEstimate {
  effortWeeks: number
  reasoning: string
  breakdown?: {
    design: number
    development: number
    testing: number
    deployment: number
  }
}

export interface COIEstimate {
  directCosts: number
  opportunityCosts: number
  riskCosts: number
  totalAnnualCOI: number
  assumptions: string[]
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
  // Suggested RICE adjustments based on COI
  suggestedRICE: {
    impactMultiplier: 0.25 | 0.5 | 1 | 2 | 3
    impactReason: string
    confidenceBoost: number // 0-20% to add to user's confidence
    confidenceReason: string
  }
}

export async function estimateCOI(
  useCase: { title: string; description: string },
  context?: { industry?: string; companyName?: string; annualRevenue?: number }
): Promise<COIEstimate> {
  const prompt = `You are a financial analyst specializing in business case development and cost-benefit analysis.

USE CASE TO ANALYZE:
Title: ${useCase.title}
Problem Statement: ${useCase.description}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.companyName ? `Company: ${context.companyName}` : ''}
${context?.annualRevenue ? `Approx Annual Revenue: $${context.annualRevenue.toLocaleString()}` : ''}

TASK: Estimate the annual Cost of Inaction (COI) - what the organization loses each year by NOT solving this problem.

COST CATEGORIES:
1. **Direct Costs** - Current spending on manual workarounds, inefficient processes, extra staff
2. **Opportunity Costs** - Lost revenue, market share, competitive advantage
3. **Risk Costs** - Potential regulatory fines, security breaches, compliance failures (probability-weighted)

RICE IMPACT MAPPING (for the RICE scoring framework):
Based on totalAnnualCOI, suggest the RICE Impact multiplier:
- COI > $2M → Impact = 3 (Massive - fundamental change)
- COI $500K-$2M → Impact = 2 (High - significant improvement)  
- COI $100K-$500K → Impact = 1 (Medium - noticeable difference)
- COI $25K-$100K → Impact = 0.5 (Low - minor improvement)
- COI < $25K → Impact = 0.25 (Minimal - barely noticeable)

Also suggest a Confidence boost (0-20%) based on how well-quantified the costs are.

Return a JSON object:
{
  "directCosts": <annual USD>,
  "opportunityCosts": <annual USD>,
  "riskCosts": <annual USD, probability-weighted>,
  "totalAnnualCOI": <sum of all costs>,
  "assumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "reasoning": "<2-3 sentences explaining the estimate>",
  "confidence": "high" | "medium" | "low",
  "suggestedRICE": {
    "impactMultiplier": <0.25 | 0.5 | 1 | 2 | 3>,
    "impactReason": "<why this impact level>",
    "confidenceBoost": <0-20>,
    "confidenceReason": "<why this confidence adjustment>"
  }
}

Be realistic but optimistic. Use industry benchmarks where applicable.`

  try {
    const result = await callOpenAI(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)
    
    // Validate impact multiplier
    const validMultipliers = [0.25, 0.5, 1, 2, 3]
    const impactMultiplier = validMultipliers.includes(parsed.suggestedRICE?.impactMultiplier) 
      ? parsed.suggestedRICE.impactMultiplier 
      : 1

    return {
      directCosts: Math.max(0, parsed.directCosts || 0),
      opportunityCosts: Math.max(0, parsed.opportunityCosts || 0),
      riskCosts: Math.max(0, parsed.riskCosts || 0),
      totalAnnualCOI: Math.max(0, parsed.totalAnnualCOI || 0),
      assumptions: parsed.assumptions || ['Based on industry averages'],
      reasoning: parsed.reasoning || 'Estimated based on typical business impact.',
      confidence: parsed.confidence || 'medium',
      suggestedRICE: {
        impactMultiplier: impactMultiplier as 0.25 | 0.5 | 1 | 2 | 3,
        impactReason: parsed.suggestedRICE?.impactReason || 'Based on total COI value',
        confidenceBoost: Math.min(20, Math.max(0, parsed.suggestedRICE?.confidenceBoost || 0)),
        confidenceReason: parsed.suggestedRICE?.confidenceReason || 'Based on quantification quality',
      },
    }
  } catch (error) {
    console.error('COI estimation failed:', error)
    return {
      directCosts: 0,
      opportunityCosts: 0,
      riskCosts: 0,
      totalAnnualCOI: 0,
      assumptions: ['AI estimation unavailable - please enter manually'],
      reasoning: 'Unable to estimate. Please provide your own assessment.',
      confidence: 'low',
      suggestedRICE: {
        impactMultiplier: 1,
        impactReason: 'Default - please adjust based on your assessment',
        confidenceBoost: 0,
        confidenceReason: 'No quantified data available',
      },
    }
  }
}

export async function estimateEffort(
  useCase: { title: string; description: string },
  context?: { industry?: string; complexity?: string }
): Promise<EffortEstimate> {
  const prompt = `You are an expert software development estimator for Microsoft AI and cloud solutions.

USE CASE TO ESTIMATE:
Title: ${useCase.title}
Description: ${useCase.description}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.complexity ? `Known Complexity: ${context.complexity}` : ''}

TASK: Estimate the implementation effort in PERSON-WEEKS for this use case.

Consider:
1. Design & Architecture phase
2. Development (backend, frontend, AI/ML components)
3. Testing (unit, integration, UAT)
4. Deployment & Documentation

GUIDELINES:
- Be realistic - consider typical enterprise implementation challenges
- Account for integration complexity with existing systems
- Factor in AI/ML specific requirements (model training, evaluation, monitoring)
- Consider Microsoft-specific technologies (Azure, Power Platform, Microsoft 365)

Return a JSON object:
{
  "effortWeeks": <number between 1 and 52>,
  "reasoning": "<2-3 sentences explaining the estimate>",
  "breakdown": {
    "design": <weeks>,
    "development": <weeks>,
    "testing": <weeks>,
    "deployment": <weeks>
  }
}

Be concise but specific in reasoning.`

  try {
    const result = await callOpenAI(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)
    
    return {
      effortWeeks: Math.max(1, Math.min(52, parsed.effortWeeks || 4)),
      reasoning: parsed.reasoning || 'Estimated based on typical implementation patterns.',
      breakdown: parsed.breakdown,
    }
  } catch (error) {
    console.error('Effort estimation failed:', error)
    // Return a reasonable default
    return {
      effortWeeks: 4,
      reasoning: 'Default estimate. AI estimation unavailable - please adjust based on your assessment.',
    }
  }
}

/**
 * Global LLM API - provides window.llm() for AI calls throughout the application
 */
export const llmAPI = {
  llm: callOpenAI,
  callForTask: callAIForTask,
  estimateEffort,
  estimateCOI,
  clearCache: clearAICache,
  getCacheStats,
  getModelForTask,
}

// Make it available on window for global access
declare global {
  interface Window {
    llm: typeof callOpenAI
    llmForTask: typeof callAIForTask
    estimateEffort: typeof estimateEffort
    estimateCOI: typeof estimateCOI
    clearAICache: typeof clearAICache
    getAICacheStats: typeof getCacheStats
  }
}

if (typeof window !== 'undefined') {
  window.llm = callOpenAI
  window.llmForTask = callAIForTask
  window.estimateEffort = estimateEffort
  window.estimateCOI = estimateCOI
  window.clearAICache = clearAICache
  window.getAICacheStats = getCacheStats
}
