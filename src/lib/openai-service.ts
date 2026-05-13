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

import type { EntityType } from './types'
import type {
  AIGovernanceDimension,
  AIGovernanceMaturityLevel,
  GovernanceActionPlan,
  GovernanceRecommendation,
  GovernanceGap,
} from './types'
import { AI_GOVERNANCE_DIMENSION_LABELS, AI_GOVERNANCE_MATURITY_CONFIG } from './types'

// API endpoint for the Azure Function proxy (never call AI services directly from the browser)
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

// All AI calls route through the serverside proxy — no keys in the browser.
// The VITE_AZURE_OPENAI_* / VITE_OPENAI_* env vars have been intentionally removed
// to prevent accidental key exposure in the client bundle.

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
function getCacheKey(prompt: string, model: string, expectJson: boolean, systemPrompt?: string): string {
  // Simple hash function for cache key
  const input = `${model}:${expectJson}:${systemPrompt || ''}:${prompt}`
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
  | 'journey'         // Customer journey generation → GPT-4o-mini
  | 'governance'      // AI governance recommendations → GPT-4o-mini
  | 'business-case'   // Per-use-case business case markdown → GPT-4o-mini
  | 'cost-optimization' // SKU swap suggestions → GPT-4o-mini
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
    journey: 'gpt-4o-mini',
    governance: 'gpt-4o-mini',
    'business-case': 'gpt-4o-mini',
    'cost-optimization': 'gpt-4o-mini',
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
 * Supports optional cloudEnvironment for sovereign cloud routing.
 */
async function callViaProxy(
  prompt: string,
  model: ModelType = 'phi-4-mini-instruct',
  expectJson: boolean = false,
  systemPrompt?: string,
  cloudEnvironment?: string
): Promise<string> {
  const requestBody: Record<string, unknown> = { prompt, model, expectJson }
  if (systemPrompt) requestBody.systemPrompt = systemPrompt
  if (cloudEnvironment) requestBody.cloudEnvironment = cloudEnvironment

  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential back-off: 1s, 2s
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        console.log(`[AI] Retry ${attempt}/${maxRetries} for ${model}...`)
      }

      const response = await fetch(`${API_ENDPOINT}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const rawText = await response.text()
      let data: ProxyResponse | null = null
      try {
        data = rawText ? (JSON.parse(rawText) as ProxyResponse) : null
      } catch {
        data = null
      }

      if (!response.ok || data?.error) {
        const details = data?.details || (rawText && rawText.length < 500 ? rawText : '')
        const errMsg = data?.error || `API error: ${response.status}${details ? ` (${details})` : ''}`
        // Retry on 5xx errors only
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(errMsg)
          continue
        }
        throw new Error(errMsg)
      }

      if (!data?.content) {
        if (attempt < maxRetries) {
          lastError = new Error('Empty response from AI proxy')
          continue
        }
        throw new Error('Empty response from AI proxy')
      }

      return data.content
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt >= maxRetries) throw lastError
    }
  }

  throw lastError || new Error('AI call failed after retries')
}

/**
 * Call AI - routes all requests through the secure Azure Function proxy.
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
  const cacheKey = getCacheKey(prompt, model, expectJson, systemPrompt)
  const cached = getFromCache(cacheKey)
  if (cached) {
    cacheHits++
    return cached
  }
  cacheMisses++

  try {
    console.log(`Using proxy API at ${API_ENDPOINT} (${model})`)
    const result = await callViaProxy(prompt, model, expectJson, systemPrompt)

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
  context?: { industry?: string; companyName?: string; annualRevenue?: number; entityType?: EntityType }
): Promise<COIEstimate> {
  // Entity type context for appropriate language
  const entityContext = context?.entityType === 'government'
    ? '\nORGANIZATION TYPE: Government/Public Sector\n- Use "budget efficiency" and "taxpayer value" instead of revenue/profit\n- Consider public service delivery impact\n- Include regulatory compliance costs'
    : context?.entityType === 'non-profit'
    ? '\nORGANIZATION TYPE: Non-Profit\n- Focus on "mission impact" and "donor efficiency"\n- Consider program effectiveness metrics\n- Include fundraising/grant efficiency'
    : context?.entityType === 'private-company'
    ? '\nORGANIZATION TYPE: Private Company (no public financials)\n- Focus on competitive advantage and operational efficiency\n- No public stock/P-E metrics available'
    : ''

  const prompt = `You are a financial analyst specializing in business case development and cost-benefit analysis.

USE CASE TO ANALYZE:
Title: ${useCase.title}
Problem Statement: ${useCase.description}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.companyName ? `Company: ${context.companyName}` : ''}
${context?.annualRevenue ? `Approx Annual Revenue: $${context.annualRevenue.toLocaleString()}` : ''}${entityContext}

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
  context?: { industry?: string; complexity?: string; entityType?: EntityType }
): Promise<EffortEstimate> {
  // Entity type adjustments
  const entityContext = context?.entityType === 'government'
    ? '\n\nGOVERNMENT CONTEXT: Factor in procurement cycles, FedRAMP/compliance requirements, and multi-stakeholder approval processes.'
    : context?.entityType === 'non-profit'
    ? '\n\nNON-PROFIT CONTEXT: Consider limited IT resources and budget constraints typical of non-profits.'
    : ''

  const prompt = `You are an expert software development estimator for Microsoft AI and cloud solutions.

USE CASE TO ESTIMATE:
Title: ${useCase.title}
Description: ${useCase.description}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.complexity ? `Known Complexity: ${context.complexity}` : ''}${entityContext}

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

// ============================================================================
// ROI ESTIMATION
// ============================================================================

export interface ROIEstimate {
  implementationCost: number
  expectedAnnualBenefit: number
  roiPercentage: number
  paybackMonths: number
  threeYearValue: number
  assumptions: string[]
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Estimate ROI for a use case based on COI data and effort estimates
 */
export async function estimateROI(
  useCase: { title: string; description: string },
  context?: {
    industry?: string
    entityType?: EntityType
    companyName?: string
    coiEstimate?: number
    effortWeeks?: number
  }
): Promise<ROIEstimate> {
  // Entity type context
  const entityContext = context?.entityType === 'government'
    ? '\nORGANIZATION TYPE: Government/Public Sector\n- Express benefits in terms of "budget savings," "taxpayer value," and "service efficiency"\n- Focus on cost avoidance and operational efficiency metrics\n- Implementation costs should include FedRAMP/compliance overhead'
    : context?.entityType === 'non-profit'
    ? '\nORGANIZATION TYPE: Non-Profit\n- Express benefits as "mission impact" and "donor efficiency"\n- Focus on program effectiveness and administrative cost reduction\n- Consider grant funding cycles in payback period'
    : context?.entityType === 'private-company'
    ? '\nORGANIZATION TYPE: Private Company\n- Focus on competitive advantage and market positioning\n- No public financials - use industry benchmarks'
    : ''

  const prompt = `You are a financial analyst estimating Return on Investment for technology investments.

USE CASE:
Title: ${useCase.title}
Description: ${useCase.description}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.companyName ? `Company: ${context.companyName}` : ''}
${context?.coiEstimate ? `Estimated Annual Cost of Inaction (COI): $${context.coiEstimate.toLocaleString()}` : ''}
${context?.effortWeeks ? `Estimated Implementation Effort: ${context.effortWeeks} person-weeks` : ''}${entityContext}

TASK: Estimate the ROI for implementing this use case.

CALCULATION APPROACH:
1. **Implementation Cost**: Based on effort weeks × $2,500/week blended rate + 30% for infrastructure/licensing
2. **Expected Annual Benefit**: Percentage of COI captured (typically 40-80% depending on solution maturity) + any new value creation
3. **ROI Percentage**: ((Annual Benefit - (Implementation Cost ÷ 3)) / (Implementation Cost ÷ 3)) × 100
4. **Payback Period**: Implementation Cost / Monthly Benefit
5. **3-Year Value**: (Annual Benefit × 3) - Implementation Cost

Return a JSON object:
{
  "implementationCost": <total USD including labor, infrastructure, licensing>,
  "expectedAnnualBenefit": <annual USD value/savings>,
  "roiPercentage": <percentage, can exceed 100>,
  "paybackMonths": <months to break even>,
  "threeYearValue": <net value over 3 years>,
  "assumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "reasoning": "<2-3 sentences explaining the ROI calculation>",
  "confidence": "high" | "medium" | "low"
}

Be realistic. If COI data is provided, use it as the primary benefit driver.`

  try {
    const result = await callOpenAI(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)
    
    return {
      implementationCost: Math.max(0, parsed.implementationCost || 0),
      expectedAnnualBenefit: Math.max(0, parsed.expectedAnnualBenefit || 0),
      roiPercentage: parsed.roiPercentage || 0,
      paybackMonths: Math.max(0, parsed.paybackMonths || 12),
      threeYearValue: parsed.threeYearValue || 0,
      assumptions: parsed.assumptions || ['Based on industry benchmarks'],
      reasoning: parsed.reasoning || 'Estimated based on typical ROI patterns.',
      confidence: parsed.confidence || 'medium',
    }
  } catch (error) {
    console.error('ROI estimation failed:', error)
    return {
      implementationCost: 0,
      expectedAnnualBenefit: 0,
      roiPercentage: 0,
      paybackMonths: 0,
      threeYearValue: 0,
      assumptions: ['AI estimation unavailable - please calculate manually'],
      reasoning: 'Unable to estimate. Please provide your own assessment.',
      confidence: 'low',
    }
  }
}

// ============================================================================
// CUSTOMER JOURNEY GENERATION
// ============================================================================

export interface GeneratedJourneyMilestone {
  title: string
  description: string
  engagement: 'business-envisioning' | 'solution-envisioning' | 'architecture-design' | 'rapid-prototype'
  duration: string
  deliverables: string[]
  dependencies: string[]
  discoveryContext?: string  // Context from discovery insights
}

export interface GeneratedJourneyNextStep {
  action: string
  owner?: string
  targetDate?: string
}

export interface GeneratedJourney {
  title: string
  journeyNotes: string
  milestones: GeneratedJourneyMilestone[]
  nextSteps: GeneratedJourneyNextStep[]
  totalDuration: string
  reasoning: string
  discoveryInsights?: {
    painPoints?: string[]
    stakeholders?: string[]
    constraints?: string[]
    opportunities?: string[]
  }
}

/**
 * Generate a customer journey / engagement roadmap for a use case
 * Uses Innovation Hub engagement types to create a structured implementation path
 */
export async function generateCustomerJourney(
  useCase: { id: string; title: string; description: string },
  context?: {
    complexity?: 'low' | 'medium' | 'high' | 'very-high'
    industry?: string
    entityType?: EntityType
    existingMicrosoftProducts?: string[]
    customerName?: string
    discoveryNotes?: string
    painPoints?: string[]
    stakeholders?: string[]
    constraints?: string[]
  }
): Promise<GeneratedJourney> {
  const complexityLevel = context?.complexity || 'medium'
  
  // Entity type context for appropriate language
  const entityContext = context?.entityType === 'government'
    ? '\nORGANIZATION TYPE: Government/Public Sector\n- Use procurement-friendly language\n- Reference compliance requirements (FedRAMP, etc.)\n- Include stakeholder review/approval milestones'
    : context?.entityType === 'non-profit'
    ? '\nORGANIZATION TYPE: Non-Profit\n- Consider limited IT resources\n- Reference grant/funding alignment'
    : ''

  const prompt = `You are a Microsoft Innovation Hub expert creating a customer engagement roadmap.

USE CASE:
Title: ${useCase.title}
Description: ${useCase.description}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.customerName ? `Customer: ${context.customerName}` : ''}
${context?.existingMicrosoftProducts?.length ? `Existing Microsoft Products: ${context.existingMicrosoftProducts.join(', ')}` : ''}
Complexity Level: ${complexityLevel}${entityContext}
${context?.discoveryNotes ? `\nDISCOVERY NOTES:\n${context.discoveryNotes}` : ''}
${context?.painPoints?.length ? `\nIDENTIFIED PAIN POINTS:\n${context.painPoints.map(p => `- ${p}`).join('\n')}` : ''}
${context?.stakeholders?.length ? `\nKEY STAKEHOLDERS:\n${context.stakeholders.map(s => `- ${s}`).join('\n')}` : ''}
${context?.constraints?.length ? `\nCONSTRAINTS:\n${context.constraints.map(c => `- ${c}`).join('\n')}` : ''}

INNOVATION HUB ENGAGEMENT TYPES (use these exactly):

1. "business-envisioning"
   - Purpose: Discover prioritized use cases through human-centered design thinking
   - Typical duration: 1-2 weeks
   - Outcomes: Use case prioritization, stakeholder alignment, opportunity assessment

2. "solution-envisioning"
   - Purpose: Strategic business and technical discussion to agree on direction
   - Typical duration: 1-2 weeks
   - Outcomes: Technical direction document, solution concept, Microsoft capabilities mapping

3. "architecture-design"
   - Purpose: Synthesize requirements and align to reference architectures
   - Typical duration: 2-3 weeks
   - Outcomes: Reference architecture alignment, scope definition, integration requirements

4. "rapid-prototype"
   - Purpose: Demonstrate key technical capabilities to accelerate decisions
   - Typical duration: 2-4 weeks
   - Outcomes: POC demo, technical validation, go/no-go recommendation

TASK: Create a customer journey with milestones for implementing this use case.

GUIDELINES:
- For LOW complexity: Skip solution-envisioning, go straight from business-envisioning to rapid-prototype
- For MEDIUM complexity: Include all 4 phases with standard durations
- For HIGH/VERY-HIGH complexity: Include all 4 phases with extended durations, more detailed deliverables
- Each milestone should have 3-5 specific deliverables relevant to the use case
- Dependencies should reference previous milestone titles
- Durations should be realistic ranges (e.g., "2-3 weeks")
- Use any discovery insights provided to tailor the journey
- Include 3-5 actionable next steps

Return a JSON object:
{
  "title": "<Descriptive journey title for this use case, e.g., 'AI-Powered Customer Service Transformation Journey'>",
  "journeyNotes": "<2-3 sentences providing overall context, key considerations, and strategic approach based on discovery insights>",
  "milestones": [
    {
      "title": "<specific milestone title for this use case>",
      "description": "<1-2 sentence description specific to the use case>",
      "engagement": "<one of: business-envisioning, solution-envisioning, architecture-design, rapid-prototype>",
      "duration": "<X-Y weeks>",
      "deliverables": ["<specific deliverable 1>", "<specific deliverable 2>", ...],
      "dependencies": ["<title of prerequisite milestone>" or empty array for first],
      "discoveryContext": "<optional: specific insight from discovery that applies to this milestone>"
    }
  ],
  "nextSteps": [
    {
      "action": "<specific action item, e.g., 'Schedule stakeholder alignment meeting'>",
      "owner": "<optional: suggested role, e.g., 'Project Sponsor'>",
      "targetDate": "<optional: relative timing, e.g., 'Within 1 week'>"
    }
  ],
  "discoveryInsights": {
    "painPoints": ["<pain point extracted from discovery>"],
    "stakeholders": ["<key stakeholder role>"],
    "constraints": ["<identified constraint>"],
    "opportunities": ["<identified opportunity>"]
  },
  "totalDuration": "<X-Y weeks total>",
  "reasoning": "<1-2 sentences explaining why this journey structure fits the use case>"
}

Make deliverables specific to the use case, not generic.`

  try {
    const result = await callAIForTask('journey', prompt, { expectJson: true })
    const parsed = JSON.parse(result)
    
    // Validate and normalize the response
    const validEngagements = ['business-envisioning', 'solution-envisioning', 'architecture-design', 'rapid-prototype']
    
    const milestones: GeneratedJourneyMilestone[] = (parsed.milestones || []).map((m: any) => ({
      title: String(m.title || 'Milestone'),
      description: String(m.description || ''),
      engagement: validEngagements.includes(m.engagement) ? m.engagement : 'business-envisioning',
      duration: String(m.duration || '1-2 weeks'),
      deliverables: Array.isArray(m.deliverables) ? m.deliverables.map(String) : [],
      dependencies: Array.isArray(m.dependencies) ? m.dependencies.map(String) : [],
      discoveryContext: m.discoveryContext ? String(m.discoveryContext) : undefined
    }))
    
    // Parse next steps
    const nextSteps: GeneratedJourneyNextStep[] = (parsed.nextSteps || []).map((s: any) => ({
      action: String(s.action || ''),
      owner: s.owner ? String(s.owner) : undefined,
      targetDate: s.targetDate ? String(s.targetDate) : undefined
    })).filter((s: GeneratedJourneyNextStep) => s.action)
    
    // Parse discovery insights
    const discoveryInsights = parsed.discoveryInsights ? {
      painPoints: Array.isArray(parsed.discoveryInsights.painPoints) ? parsed.discoveryInsights.painPoints.map(String) : undefined,
      stakeholders: Array.isArray(parsed.discoveryInsights.stakeholders) ? parsed.discoveryInsights.stakeholders.map(String) : undefined,
      constraints: Array.isArray(parsed.discoveryInsights.constraints) ? parsed.discoveryInsights.constraints.map(String) : undefined,
      opportunities: Array.isArray(parsed.discoveryInsights.opportunities) ? parsed.discoveryInsights.opportunities.map(String) : undefined
    } : undefined
    
    return {
      title: String(parsed.title || `${useCase.title} Implementation Journey`),
      journeyNotes: String(parsed.journeyNotes || ''),
      milestones,
      nextSteps,
      totalDuration: String(parsed.totalDuration || 'TBD'),
      reasoning: String(parsed.reasoning || ''),
      discoveryInsights
    }
  } catch (error) {
    console.error('Customer journey generation failed:', error)
    // Return a default journey based on complexity
    return getDefaultJourney(complexityLevel, useCase.title)
  }
}

/**
 * Get a default journey structure based on complexity
 */
function getDefaultJourney(complexity: 'low' | 'medium' | 'high' | 'very-high', useCaseTitle?: string): GeneratedJourney {
  const milestones: GeneratedJourneyMilestone[] = [
    {
      title: 'Business Discovery Workshop',
      description: 'Explore opportunities and define use case priorities through design thinking.',
      engagement: 'business-envisioning',
      duration: '1-2 weeks',
      deliverables: ['Use case prioritization matrix', 'Stakeholder alignment document', 'Opportunity assessment'],
      dependencies: []
    }
  ]
  
  if (complexity !== 'low') {
    milestones.push({
      title: 'Solution Direction Workshop',
      description: 'Align on technical approach and Microsoft solution capabilities.',
      engagement: 'solution-envisioning',
      duration: '1-2 weeks',
      deliverables: ['Technical direction document', 'Solution concept diagram', 'Microsoft capabilities mapping'],
      dependencies: ['Business Discovery Workshop']
    })
  }
  
  if (complexity === 'high' || complexity === 'very-high') {
    milestones.push({
      title: 'Architecture Design Sprint',
      description: 'Define detailed architecture and integration requirements.',
      engagement: 'architecture-design',
      duration: complexity === 'very-high' ? '3-4 weeks' : '2-3 weeks',
      deliverables: ['Reference architecture alignment', 'Integration specifications', 'Cost estimation', 'Risk assessment'],
      dependencies: ['Solution Direction Workshop']
    })
  }
  
  milestones.push({
    title: 'Rapid Prototype Development',
    description: 'Build and demonstrate key technical capabilities.',
    engagement: 'rapid-prototype',
    duration: complexity === 'very-high' ? '3-6 weeks' : '2-4 weeks',
    deliverables: ['Proof of concept demo', 'Technical validation report', 'Go/No-Go recommendation'],
    dependencies: [milestones[milestones.length - 1].title]
  })
  
  // Calculate total duration
  let minWeeks = 0, maxWeeks = 0
  for (const m of milestones) {
    const match = m.duration.match(/(\d+)(?:\s*-\s*(\d+))?\s*week/i)
    if (match) {
      minWeeks += parseInt(match[1], 10)
      maxWeeks += parseInt(match[2] || match[1], 10)
    }
  }
  
  // Default next steps
  const nextSteps: GeneratedJourneyNextStep[] = [
    { action: 'Schedule kickoff meeting with key stakeholders', owner: 'Project Lead' },
    { action: 'Identify and confirm project sponsor', owner: 'Account Team' },
    { action: 'Gather existing documentation and system access', owner: 'Customer IT' }
  ]
  
  return {
    title: useCaseTitle ? `${useCaseTitle} Implementation Journey` : 'Customer Implementation Journey',
    journeyNotes: 'This journey follows the standard Innovation Hub engagement model. Adjust durations and deliverables based on specific customer context and constraints.',
    milestones,
    nextSteps,
    totalDuration: minWeeks === maxWeeks ? `${minWeeks} weeks` : `${minWeeks}-${maxWeeks} weeks`,
    reasoning: 'Default journey based on use case complexity assessment.'
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
  generateCustomerJourney,
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
    estimateROI: typeof estimateROI
    generateSuccessMetrics: typeof generateSuccessMetrics
    clearAICache: typeof clearAICache
    getAICacheStats: typeof getCacheStats
  }
}

if (typeof window !== 'undefined') {
  window.llm = callOpenAI
  window.llmForTask = callAIForTask
  window.estimateEffort = estimateEffort
  window.estimateCOI = estimateCOI
  window.estimateROI = estimateROI
  window.generateSuccessMetrics = generateSuccessMetrics
  window.clearAICache = clearAICache
  window.getAICacheStats = getCacheStats
}

// ============================================================================
// SUCCESS METRICS GENERATOR
// ============================================================================

export interface SuccessMetric {
  name: string
  description: string
  measurementMethod: string
  targetValue: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  category: 'efficiency' | 'quality' | 'financial' | 'satisfaction' | 'adoption'
}

export interface SuccessMetricsResult {
  metrics: SuccessMetric[]
  baselineSuggestions: string[]
  measurementPlan: string
  generatedAt: number
}

/**
 * Generate success metrics (KPIs) for a use case
 */
export async function generateSuccessMetrics(
  useCase: { title: string; description: string; category?: string },
  context?: {
    industry?: string
    coiEstimate?: number
    entityType?: EntityType
  }
): Promise<SuccessMetricsResult> {
  const entityContext = context?.entityType 
    ? context.entityType === 'government' 
      ? 'This is a government agency - focus on citizen outcomes, budget efficiency, and compliance metrics.'
      : context.entityType === 'non-profit'
      ? 'This is a non-profit - focus on mission impact, donor efficiency, and program effectiveness.'
      : ''
    : ''

  const prompt = `Generate success metrics (KPIs) for measuring the success of this AI use case implementation.

USE CASE:
Title: ${useCase.title}
Description: ${useCase.description}
Category: ${useCase.category || 'General'}
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.coiEstimate ? `Estimated Annual Impact: $${context.coiEstimate.toLocaleString()}` : ''}
${entityContext}

Generate 4-6 specific, measurable KPIs that would demonstrate the success of this initiative.

Return valid JSON matching this structure:
{
  "metrics": [
    {
      "name": "Short metric name (e.g., 'Time to Resolution')",
      "description": "What this metric measures",
      "measurementMethod": "How to measure/collect this data",
      "targetValue": "Specific target (e.g., '50% reduction', '<2 hours', '>90%')",
      "frequency": "daily|weekly|monthly|quarterly",
      "category": "efficiency|quality|financial|satisfaction|adoption"
    }
  ],
  "baselineSuggestions": [
    "Suggestion for measuring current state before implementation"
  ],
  "measurementPlan": "Brief paragraph on how to track these metrics over time"
}

Focus on metrics that are:
1. Specific and measurable
2. Relevant to the use case outcomes
3. Achievable within 6-12 months
4. Tied to business value`

  try {
    const response = await callAIForTask('analysis', prompt, {
      systemPrompt: 'You are a business analyst expert at defining KPIs and success metrics for technology initiatives. Return only valid JSON.',
      expectJson: true,
    })

    const result = JSON.parse(response)
    return {
      metrics: result.metrics || [],
      baselineSuggestions: result.baselineSuggestions || [],
      measurementPlan: result.measurementPlan || '',
      generatedAt: Date.now(),
    }
  } catch (error) {
    console.error('Failed to generate success metrics:', error)
    // Return default metrics based on category
    return {
      metrics: [
        {
          name: 'Time Savings',
          description: 'Reduction in time spent on manual tasks',
          measurementMethod: 'Compare time logs before and after implementation',
          targetValue: '40% reduction',
          frequency: 'monthly',
          category: 'efficiency',
        },
        {
          name: 'User Adoption Rate',
          description: 'Percentage of target users actively using the solution',
          measurementMethod: 'Track unique active users vs. total eligible users',
          targetValue: '>80% adoption within 3 months',
          frequency: 'weekly',
          category: 'adoption',
        },
        {
          name: 'Error Rate Reduction',
          description: 'Decrease in errors or exceptions',
          measurementMethod: 'Compare error logs before and after',
          targetValue: '50% reduction',
          frequency: 'monthly',
          category: 'quality',
        },
        {
          name: 'Cost Savings Realized',
          description: 'Actual cost savings from efficiency gains',
          measurementMethod: 'Track labor hours saved × hourly cost',
          targetValue: `$${((context?.coiEstimate || 100000) * 0.3).toLocaleString()} annually`,
          frequency: 'quarterly',
          category: 'financial',
        },
      ],
      baselineSuggestions: [
        'Measure current process time for key workflows',
        'Document current error rates and exceptions',
        'Survey current user satisfaction levels',
      ],
      measurementPlan: 'Establish baseline metrics 2-4 weeks before go-live. Track weekly during initial rollout, then monthly for ongoing monitoring.',
      generatedAt: Date.now(),
    }
  }
}

// ============================================================================
// AI GOVERNANCE ACTION PLAN GENERATION
// ============================================================================

export interface GovernanceActionPlanInput {
  dimensionScores: Record<AIGovernanceDimension, AIGovernanceMaturityLevel>
  overallMaturity: number
  gaps: GovernanceGap[]
  entityType?: EntityType
  industry?: string
  useCaseTitles?: string[]
}

/**
 * Generate an AI-powered governance action plan from governance assessment data.
 * Falls back to deterministic recommendations if AI is unavailable.
 */
export async function generateGovernanceActionPlan(
  input: GovernanceActionPlanInput
): Promise<GovernanceActionPlan> {
  const dimensionSummary = Object.entries(input.dimensionScores)
    .map(([dim, level]) => `- ${AI_GOVERNANCE_DIMENSION_LABELS[dim as AIGovernanceDimension]}: ${AI_GOVERNANCE_MATURITY_CONFIG[level].label} (${AI_GOVERNANCE_MATURITY_CONFIG[level].numericValue}/5)`)
    .join('\n')

  const gapSummary = input.gaps.length > 0
    ? input.gaps.map(g => `- ${AI_GOVERNANCE_DIMENSION_LABELS[g.dimension]}: ${g.gap} [Impact: ${g.impact}]`).join('\n')
    : 'No critical gaps identified.'

  const useCaseContext = input.useCaseTitles && input.useCaseTitles.length > 0
    ? `\nPLANNED AI USE CASES:\n${input.useCaseTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : ''

  const prompt = `You are a senior AI governance advisor specializing in Microsoft Responsible AI Standard and NIST AI RMF.

ORGANIZATION CONTEXT:
${input.entityType ? `Organization type: ${input.entityType}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}
Overall AI Governance Maturity: ${input.overallMaturity.toFixed(1)}/5

DIMENSION SCORES:
${dimensionSummary}

IDENTIFIED GAPS:
${gapSummary}
${useCaseContext}

TASK: Create a prioritized AI Governance Action Plan with concrete, actionable recommendations organized by timeframe.

For each recommendation, provide:
- dimension: The governance dimension it addresses (use exact keys: ai-strategy, data-governance, model-lifecycle, ethics-fairness, security-privacy, monitoring-accountability)
- priority: "critical" | "recommended" | "optional"
- action: A clear, specific action (1-2 sentences)
- rationale: Why this matters for the organization
- timeframe: "short-term" | "medium-term" | "long-term"

Also provide an overall readiness statement (2-3 sentences) summarizing the organization's AI governance posture and top priorities.

Return a JSON object:
{
  "shortTerm": [{ "dimension": "...", "priority": "...", "action": "...", "rationale": "...", "timeframe": "short-term" }],
  "mediumTerm": [{ "dimension": "...", "priority": "...", "action": "...", "rationale": "...", "timeframe": "medium-term" }],
  "longTerm": [{ "dimension": "...", "priority": "...", "action": "...", "rationale": "...", "timeframe": "long-term" }],
  "overallReadinessStatement": "..."
}

RULES:
- Include 3-5 short-term actions (0-3 months), 3-4 medium-term (3-12 months), 2-3 long-term (12+ months)
- Prioritize gaps with "high" impact first
- Be specific to the organization type and industry
- Reference Microsoft Responsible AI Standard, NIST AI RMF, ISO 42001, or EU AI Act where relevant
- For each action, use clear imperative language ("Establish...", "Implement...", "Document...")`

  try {
    const raw = await callAIForTask('governance', prompt, { expectJson: true })
    const parsed = JSON.parse(raw)
    let recId = 0
    const mapRec = (r: Record<string, string>): GovernanceRecommendation => {
      recId++
      return {
        id: `gov-ai-${recId}`,
        dimension: (r.dimension || 'ai-strategy') as AIGovernanceDimension,
        priority: (r.priority || 'recommended') as GovernanceRecommendation['priority'],
        action: r.action || '',
        rationale: r.rationale || '',
        timeframe: (r.timeframe || 'medium-term') as GovernanceRecommendation['timeframe'],
      }
    }

    return {
      shortTerm: (parsed.shortTerm || []).map(mapRec),
      mediumTerm: (parsed.mediumTerm || []).map(mapRec),
      longTerm: (parsed.longTerm || []).map(mapRec),
      overallReadinessStatement: parsed.overallReadinessStatement || 'Assessment complete. Review recommendations for next steps.',
      generatedAt: Date.now(),
    }
  } catch (error) {
    console.error('[AI Governance] Action plan generation failed, using fallback:', error)
    return createFallbackActionPlan(input)
  }
}

/** Deterministic fallback when AI is unavailable */
function createFallbackActionPlan(input: GovernanceActionPlanInput): GovernanceActionPlan {
  const { gaps } = input
  let recId = 0
  const highGaps = gaps.filter(g => g.impact === 'high')
  const mediumGaps = gaps.filter(g => g.impact === 'medium')

  const shortTerm: GovernanceRecommendation[] = highGaps.slice(0, 4).map(g => {
    recId++
    return {
      id: `gov-fb-${recId}`,
      dimension: g.dimension,
      priority: 'critical' as const,
      action: `Address critical gap in ${AI_GOVERNANCE_DIMENSION_LABELS[g.dimension]}: ${g.gap}`,
      rationale: `Current level (${AI_GOVERNANCE_MATURITY_CONFIG[g.currentLevel].label}) is significantly below target (${AI_GOVERNANCE_MATURITY_CONFIG[g.targetLevel].label})`,
      timeframe: 'short-term' as const,
    }
  })

  const mediumTerm: GovernanceRecommendation[] = mediumGaps.slice(0, 3).map(g => {
    recId++
    return {
      id: `gov-fb-${recId}`,
      dimension: g.dimension,
      priority: 'recommended' as const,
      action: `Improve ${AI_GOVERNANCE_DIMENSION_LABELS[g.dimension]} from ${AI_GOVERNANCE_MATURITY_CONFIG[g.currentLevel].label} to ${AI_GOVERNANCE_MATURITY_CONFIG[g.targetLevel].label}`,
      rationale: g.gap,
      timeframe: 'medium-term' as const,
    }
  })

  const longTerm: GovernanceRecommendation[] = [{
    id: `gov-fb-${++recId}`,
    dimension: 'ai-strategy' as const,
    priority: 'optional' as const,
    action: 'Establish continuous AI governance maturity improvement process with annual reassessment',
    rationale: 'Ongoing governance maturity enables sustainable AI adoption at scale',
    timeframe: 'long-term' as const,
  }]

  const maturityLabel = input.overallMaturity >= 3.5 ? 'strong'
    : input.overallMaturity >= 2.5 ? 'developing'
    : 'early-stage'

  return {
    shortTerm,
    mediumTerm,
    longTerm,
    overallReadinessStatement: `The organization has a ${maturityLabel} AI governance posture (${input.overallMaturity.toFixed(1)}/5). ${highGaps.length > 0 ? `Priority attention needed in ${highGaps.map(g => AI_GOVERNANCE_DIMENSION_LABELS[g.dimension]).join(', ')}.` : 'No critical gaps identified \u2014 focus on continuous improvement.'}`,
    generatedAt: Date.now(),
  }
}
