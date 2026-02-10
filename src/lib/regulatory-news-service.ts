/**
 * Regulatory News Service (Frontend)
 * 
 * Fetches regulatory news, policy updates, and enforcement actions
 * from the regulatory-feeds Azure Function endpoint.
 * 
 * Also provides AI-powered similarity ranking of violation cases
 * against a specific use case for the Regulatory Awareness Panel.
 */

import type { RegulatoryNewsItem, ViolationCase, UseCase } from './types'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

/**
 * Fetch regulatory news from the backend.
 * Uses cached Logic App data from Blob Storage with live Google News RSS fallback.
 */
export async function fetchRegulatoryNews(
  jurisdictions: string[],
  industry?: string,
  query?: string
): Promise<RegulatoryNewsItem[]> {
  try {
    const params = new URLSearchParams()
    if (jurisdictions.length > 0) {
      params.set('jurisdictions', jurisdictions.join(','))
    }
    if (industry) params.set('industry', industry)
    if (query) params.set('query', query)

    const response = await fetch(`${API_ENDPOINT}/regulatory-feeds?${params.toString()}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Regulatory feeds failed: ${response.status}`)
    }

    const result = await response.json()
    return (result.items || []).map((item: any, idx: number) => ({
      id: item.id || `reg-news-${Date.now()}-${idx}`,
      title: item.title || 'Untitled',
      description: item.description || '',
      source: item.source || 'Unknown',
      publishedDate: item.pubDate || item.publishedDate || new Date().toISOString(),
      jurisdiction: item.jurisdiction || jurisdictions[0] || 'International',
      url: item.link || item.url || '',
      relevanceScore: item.relevanceScore,
    }))
  } catch (error) {
    console.error('Regulatory news fetch error:', error)
    return []
  }
}

/**
 * Find violation cases similar to a specific use case.
 * Fetches regulatory news, then uses AI to rank by relevance and extract structured data.
 */
export async function findSimilarViolations(
  useCase: UseCase,
  jurisdictions: string[],
  industry?: string
): Promise<ViolationCase[]> {
  try {
    // Build search terms from use case content
    const searchTerms = [
      'AI regulation violation',
      'AI enforcement action',
      'AI compliance penalty',
      ...(useCase.aiRegulations?.applicableFrameworks?.slice(0, 3) || []).map(f => `"${f}" enforcement`),
    ].join(' OR ')

    // Fetch relevant regulatory news
    const newsItems = await fetchRegulatoryNews(jurisdictions, industry, searchTerms)

    if (newsItems.length === 0) {
      return []
    }

    // Use AI to rank items by similarity to the use case
    const newsContext = newsItems.slice(0, 15).map(item =>
      `[${item.jurisdiction}] ${item.title}: ${item.description?.slice(0, 200)}`
    ).join('\n')

    const prompt = `You are a regulatory compliance expert. Given this AI use case and recent regulatory news, identify the most relevant enforcement actions, violations, or policy updates.

USE CASE:
Title: ${useCase.title}
Description: ${useCase.description}
Risk Level: ${useCase.regulatoryAssessment?.overallRisk || useCase.aiRegulations?.riskClassification || 'unknown'}
Frameworks: ${useCase.aiRegulations?.applicableFrameworks?.join(', ') || 'none specified'}

RECENT REGULATORY NEWS:
${newsContext}

Return a JSON object with a "violations" array (max 5 items, ranked by relevance). Each item:
{
  "headline": "short headline",
  "jurisdiction": "country/region",
  "framework": "regulation name",
  "penaltyAmount": "$X million" or null,
  "date": "YYYY-MM-DD" or approximate,
  "relevanceSummary": "1 sentence explaining why this is relevant to the use case",
  "lessonsLearned": "1 sentence key takeaway",
  "sourceUrl": "URL if available",
  "severity": "major" | "moderate" | "minor"
}

Return ONLY valid JSON.`

    const result = await window.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)

    return (parsed.violations || []).map((v: any, idx: number) => ({
      id: `violation-${Date.now()}-${idx}`,
      headline: v.headline || 'Unknown',
      jurisdiction: v.jurisdiction || 'Unknown',
      framework: v.framework || 'Unknown',
      penaltyAmount: v.penaltyAmount || undefined,
      date: v.date || new Date().toISOString().slice(0, 10),
      relevanceSummary: v.relevanceSummary || '',
      lessonsLearned: v.lessonsLearned || '',
      sourceUrl: v.sourceUrl || '',
      severity: v.severity || 'minor',
    }))
  } catch (error) {
    console.error('Find similar violations error:', error)
    return []
  }
}

/**
 * Format regulatory news into context string for AI prompts.
 */
export function formatRegulatoryContext(items: RegulatoryNewsItem[]): string {
  if (items.length === 0) return ''

  return items.slice(0, 10).map(item =>
    `- [${item.jurisdiction}] ${item.title} (${item.publishedDate?.slice(0, 10) || 'recent'}): ${item.description?.slice(0, 150) || ''}`
  ).join('\n')
}
