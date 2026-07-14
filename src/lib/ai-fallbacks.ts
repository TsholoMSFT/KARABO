/**
 * AI Fallback Utilities
 * Provides graceful degradation when AI services are unavailable
 * Used across all Discovery steps for consistent error handling
 */

import { toast } from 'sonner'
import type { ReferenceArchitecturePattern } from './microsoft-solutions'
import type { Industry } from './types'

export interface FallbackFollowupEmail {
  subject: string
  bodyHtml: string
  bodyText: string
  bullets: string[]
  callToAction: string
}

export interface FallbackFollowupEmailContext {
  customerName?: string
  engagementType?: string
  audience?: string
  senderName?: string
  highlights?: string[]
  useCases?: Array<{ title: string; description?: string }>
}

export interface FallbackEngagementCloseout {
  summary: string
  decisions: string[]
  actionItems: Array<{ action: string; owner?: string; due?: string }>
  risks: string[]
  nextSteps: string[]
  sentiment: 'neutral'
}

export function createFallbackEngagementCloseout(ctx: {
  customerName?: string
  engagementType?: string
  useCases?: Array<{ title: string; description?: string }>
}): FallbackEngagementCloseout {
  const customerName = ctx.customerName?.trim() || 'the customer'
  const engagementLabel = ctx.engagementType?.trim() || 'engagement session'
  const useCaseTitles = (ctx.useCases || [])
    .map((useCase) => useCase.title.trim())
    .filter(Boolean)
    .slice(0, 5)
  const scope = useCaseTitles.length
    ? ` The recorded scope includes ${useCaseTitles.join(', ')}.`
    : ''

  return {
    summary: `A ${engagementLabel} was held with ${customerName}.${scope} Review the session notes before distributing this draft.`,
    decisions: ['No decisions were automatically extracted; confirm decisions from the session notes.'],
    actionItems: [
      { action: 'Review and confirm the session summary, decisions, risks, and owners', owner: 'Microsoft & Customer' },
    ],
    risks: ['Risks were not automatically extracted; validate risks with the engagement stakeholders.'],
    nextSteps: [
      'Confirm priorities and success measures with the customer',
      'Assign owners and due dates to agreed actions',
    ],
    sentiment: 'neutral',
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function createFallbackFollowupEmail(ctx: FallbackFollowupEmailContext): FallbackFollowupEmail {
  const customerName = ctx.customerName?.trim() || 'your team'
  const engagementLabel = ctx.engagementType?.trim() || 'our recent session'
  const suppliedHighlights = (ctx.highlights || []).map((item) => item.trim()).filter(Boolean)
  const useCaseHighlights = (ctx.useCases || [])
    .map((useCase) => useCase.title.trim())
    .filter(Boolean)
    .map((title) => `Explore next steps for ${title}`)
  const bullets = [...suppliedHighlights, ...useCaseHighlights].slice(0, 5)
  if (bullets.length === 0) {
    bullets.push('Confirm the priority outcomes and success measures discussed during the session')
  }

  const callToAction = ctx.audience?.toLowerCase().includes('technical')
    ? 'Please share suitable times for a technical follow-up to validate scope, dependencies, and owners.'
    : 'Please share suitable times for a follow-up to confirm priorities, owners, and next steps.'
  const greeting = `Hello ${customerName} team,`
  const opening = `Thank you for the time and perspectives shared during ${engagementLabel}. We captured the following priorities for confirmation:`
  const closing = ctx.senderName?.trim() ? `Regards,\n${ctx.senderName.trim()}` : 'Regards,'
  const bodyText = [
    greeting,
    '',
    opening,
    '',
    ...bullets.map((bullet) => `- ${bullet}`),
    '',
    callToAction,
    '',
    closing,
  ].join('\n')

  return {
    subject: `Follow-up: ${customerName} ${engagementLabel}`,
    bodyText,
    bodyHtml: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(opening)}</p>`,
      `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`,
      `<p>${escapeHtml(callToAction)}</p>`,
      `<p>${escapeHtml(closing).replace(/\n/g, '<br>')}</p>`,
    ].join(''),
    bullets,
    callToAction,
  }
}

export interface AICallOptions {
  retries?: number
  retryDelayMs?: number
  showToast?: boolean
  toastMessage?: string
  fallbackToastMessage?: string
}

export interface AICallResult<T> {
  result: T
  usedFallback: boolean
  error?: Error
  attempts: number
}

/**
 * Wrap an AI call with retry logic and fallback handling
 * @param aiCall - The async function that makes the AI call
 * @param fallback - Value to return if AI fails (or function that generates it)
 * @param options - Configuration options for retries and toasts
 */
export async function withAIFallback<T>(
  aiCall: () => Promise<T>,
  fallback: T | (() => T),
  options: AICallOptions = {}
): Promise<AICallResult<T>> {
  const { 
    retries = 2, 
    retryDelayMs = 1000,
    showToast = true, 
    toastMessage = 'AI service temporarily unavailable',
    fallbackToastMessage = 'Using manual mode'
  } = options
  
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await aiCall()
      return { result, usedFallback: false, attempts: attempt }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`AI call failed (attempt ${attempt}/${retries}):`, error)
      
      if (attempt < retries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt))
      }
    }
  }
  
  // All retries failed - use fallback
  if (showToast) {
    toast.warning(toastMessage, { description: fallbackToastMessage })
  }
  
  const fallbackResult = typeof fallback === 'function' ? (fallback as () => T)() : fallback
  return { 
    result: fallbackResult, 
    usedFallback: true, 
    error: lastError, 
    attempts: retries 
  }
}

/**
 * Get default architecture suggestion based on industry
 * Used when AI cannot suggest an architecture
 */
export function getDefaultArchitectureForIndustry(industry?: Industry): ReferenceArchitecturePattern {
  const industryDefaults: Partial<Record<Industry, ReferenceArchitecturePattern>> = {
    'telecommunications': 'customer-360',
    'financial-services': 'fraud-detection',
    'healthcare': 'document-processing',
    'retail': 'predictive-analytics',
    'manufacturing': 'iot-telemetry',
    'government': 'knowledge-mining',
    'education': 'conversational-ai',
    'energy': 'digital-twin',
    'mining-resources': 'iot-telemetry',
  }
  
  return industryDefaults[industry || 'general'] || 'process-automation'
}

/**
 * Get fallback architectures ranked by relevance for an industry
 */
export function getFallbackArchitecturesForIndustry(industry?: Industry): ReferenceArchitecturePattern[] {
  const commonPatterns: ReferenceArchitecturePattern[] = [
    'process-automation',
    'conversational-ai',
    'document-processing',
    'knowledge-mining',
  ]
  
  const industrySpecific: Partial<Record<Industry, ReferenceArchitecturePattern[]>> = {
    'telecommunications': ['customer-360', 'predictive-analytics', 'conversational-ai'],
    'financial-services': ['fraud-detection', 'document-processing', 'customer-360'],
    'healthcare': ['document-processing', 'knowledge-mining', 'predictive-analytics'],
    'retail': ['predictive-analytics', 'customer-360', 'supply-chain-optimization'],
    'manufacturing': ['iot-telemetry', 'digital-twin', 'predictive-analytics'],
    'government': ['knowledge-mining', 'document-processing', 'process-automation'],
    'education': ['conversational-ai', 'knowledge-mining', 'content-generation'],
    'energy': ['digital-twin', 'iot-telemetry', 'predictive-analytics'],
    'mining-resources': ['iot-telemetry', 'digital-twin', 'predictive-analytics'],
  }
  
  const specific = industrySpecific[industry || 'general'] || []
  
  // Combine industry-specific first, then common patterns (deduped)
  return [...new Set([...specific, ...commonPatterns])]
}

/**
 * Check if AI services are available
 * Performs a lightweight health check
 */
export async function checkAIAvailability(timeoutMs: number = 5000): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.llm) {
      return false
    }
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      const response = await window.llm('Reply with just: OK', 'gpt-4o-mini', false)
      clearTimeout(timeout)
      return response.toLowerCase().includes('ok')
    } catch (error) {
      clearTimeout(timeout)
      return false
    }
  } catch {
    return false
  }
}

/**
 * Create a fallback executive summary when AI generation fails
 */
export function createFallbackExecutiveSummary(params: {
  customerName: string
  useCaseCount: number
  totalValue?: number
  industry?: Industry
}): string {
  const { customerName, useCaseCount, totalValue, industry } = params
  
  const valueText = totalValue 
    ? `with an estimated annual value of R${(totalValue / 1000000).toFixed(1)}M` 
    : ''
  
  return `# Executive Summary

## Discovery Session: ${customerName}

This discovery session identified **${useCaseCount} high-value AI use cases** ${valueText} across ${industry || 'multiple business areas'}.

### Key Findings

The discovery process revealed significant opportunities for AI-driven transformation. Each use case has been evaluated for business impact, technical feasibility, and strategic alignment with Microsoft solutions.

### Recommended Next Steps

1. **Prioritize Quick Wins**: Focus on use cases with high impact and medium-to-low complexity
2. **Build Foundation**: Establish data infrastructure for AI readiness
3. **Pilot Program**: Select 2-3 use cases for initial pilot implementation
4. **Scale Strategy**: Develop a roadmap for enterprise-wide AI adoption

### Microsoft Solutions

The recommended solutions leverage the Microsoft Cloud platform, including Azure AI services, Microsoft 365 Copilot, and Power Platform capabilities tailored to your industry requirements.

---
*Note: This summary was generated using fallback mode. Please review and customize as needed.*`
}

/**
 * Create fallback COI (Cost of Inaction) estimate
 */
export function createFallbackCOIEstimate(params: {
  useCaseTitle: string
  industry?: Industry
}): {
  directCosts: number
  opportunityCosts: number
  riskCosts: number
  totalAnnualCOI: number
  assumptions: string[]
  confidence: 'low' | 'medium' | 'high'
} {
  // Industry baseline multipliers
  const industryMultipliers: Partial<Record<Industry, number>> = {
    'financial-services': 1.5,
    'telecommunications': 1.3,
    'healthcare': 1.2,
    'retail': 1.0,
    'manufacturing': 1.1,
    'mining-resources': 1.3,
    'energy': 1.4,
  }
  
  const multiplier = industryMultipliers[params.industry || 'general'] || 1.0
  const baseValue = 500000 * multiplier
  
  return {
    directCosts: Math.round(baseValue * 0.4),
    opportunityCosts: Math.round(baseValue * 0.4),
    riskCosts: Math.round(baseValue * 0.2),
    totalAnnualCOI: Math.round(baseValue),
    assumptions: [
      'Baseline estimate - requires validation with stakeholders',
      'Industry average benchmarks applied',
      'AI estimation unavailable - manual review recommended',
    ],
    confidence: 'low',
  }
}

/**
 * Create fallback effort estimate
 */
export function createFallbackEffortEstimate(complexity: 'low' | 'medium' | 'high' | 'very-high'): {
  effortWeeks: number
  teamSize: string
  reasoning: string
} {
  const estimates = {
    'low': { effortWeeks: 4, teamSize: '2-3', reasoning: 'Standard implementation with existing components' },
    'medium': { effortWeeks: 8, teamSize: '3-5', reasoning: 'Moderate customization and integration required' },
    'high': { effortWeeks: 16, teamSize: '5-8', reasoning: 'Significant development and integration effort' },
    'very-high': { effortWeeks: 24, teamSize: '8-12', reasoning: 'Complex enterprise implementation' },
  }
  
  return {
    ...estimates[complexity],
    reasoning: estimates[complexity].reasoning + ' (fallback estimate - AI unavailable)',
  }
}

// Note: window.llm is declared in openai-service.ts

export default {
  withAIFallback,
  getDefaultArchitectureForIndustry,
  getFallbackArchitecturesForIndustry,
  checkAIAvailability,
  createFallbackExecutiveSummary,
  createFallbackCOIEstimate,
  createFallbackEffortEstimate,
  createFallbackFollowupEmail,
  createFallbackEngagementCloseout,
}
