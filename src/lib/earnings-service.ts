/**
 * Earnings Transcript Service (Frontend)
 * Calls the secure Azure Function backend
 * 
 * Sources:
 * - SEC EDGAR: US company filings (free)
 * - JSE SENS: South African company announcements (free)
 * - Yahoo Finance: Global earnings data (free)
 * - Alpha Vantage: Earnings data API (free tier)
 */

export interface EarningsTranscript {
  id: string
  companyName: string
  ticker?: string
  quarter: string
  year: number
  date: string
  source: 'sec-edgar' | 'jse-sens' | 'yahoo-finance' | 'alpha-vantage' | 'manual'
  url?: string
  summary?: string
}

export interface CompanyInsight {
  id: string
  category: 'strategic-priority' | 'pain-point' | 'investment' | 'opportunity' | 'risk' | 'trend'
  title: string
  description: string
  quote?: string
  source: string
  relevanceScore: number
}

export interface EarningsSearchResult {
  transcripts: EarningsTranscript[]
  sources: {
    secEdgar: boolean
    jseSens: boolean
    yahooFinance: boolean
    alphaVantage: boolean
  }
}

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

/**
 * Search for earnings transcripts across multiple sources
 */
export async function searchEarningsTranscripts(
  companyName: string,
  options?: {
    ticker?: string
    region?: 'US' | 'ZA' | 'EU' | 'GLOBAL'
  }
): Promise<EarningsSearchResult> {
  const { ticker, region = 'GLOBAL' } = options || {}

  try {
    const response = await fetch(`${API_ENDPOINT}/earnings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, ticker, region }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Search failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Earnings search error:', error)
    throw error
  }
}

/**
 * Analyze transcript summaries with AI to extract insights
 */
export async function analyzeTranscriptsWithAI(
  companyName: string,
  transcripts: EarningsTranscript[]
): Promise<CompanyInsight[]> {
  const contentToAnalyze = transcripts
    .filter(t => t.summary)
    .map(t => `${t.quarter} ${t.year} (${t.source}): ${t.summary}`)
    .join('\n\n')

  if (!contentToAnalyze) {
    return []
  }

  try {
    const prompt = `Analyze these earnings call summaries for ${companyName} and extract key business insights.

EARNINGS DATA:
${contentToAnalyze}

Extract 3-6 key insights in these categories:
- strategic-priority: What leadership says is important
- pain-point: Challenges or problems mentioned
- investment: Where they're spending money
- opportunity: Growth areas or new markets
- risk: Concerns or threats mentioned
- trend: Industry or market trends discussed

Return a JSON object with an "insights" array. Each insight should have:
- category: one of the categories above
- title: short title (5-10 words)
- description: 1-2 sentence explanation
- relevanceScore: 1-10 how relevant for AI/digital transformation

Focus on insights relevant for digital transformation, AI adoption, and innovation opportunities.

Return ONLY valid JSON.`

    const result = await window.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)

    return (parsed.insights || []).map((insight: any, idx: number) => ({
      id: `insight-${Date.now()}-${idx}`,
      category: insight.category || 'opportunity',
      title: insight.title,
      description: insight.description,
      quote: insight.quote,
      source: companyName,
      relevanceScore: insight.relevanceScore || 5,
    }))
  } catch (error) {
    console.error('AI analysis error:', error)
    return []
  }
}

/**
 * Get regional display name
 */
export function getRegionLabel(region: string): string {
  const labels: Record<string, string> = {
    US: 'United States',
    ZA: 'South Africa',
    EU: 'Europe',
    GLOBAL: 'Global',
  }
  return labels[region] || region
}

/**
 * Get source display info
 */
export function getSourceInfo(source: EarningsTranscript['source']): { label: string; color: string; icon?: string } {
  const info: Record<string, { label: string; color: string; icon?: string }> = {
    'sec-edgar': { label: 'SEC EDGAR', color: 'bg-blue-100 text-blue-800', icon: '🇺🇸' },
    'jse-sens': { label: 'JSE SENS', color: 'bg-green-100 text-green-800', icon: '🇿🇦' },
    'yahoo-finance': { label: 'Yahoo Finance', color: 'bg-purple-100 text-purple-800', icon: '📊' },
    'alpha-vantage': { label: 'Alpha Vantage', color: 'bg-indigo-100 text-indigo-800', icon: '📈' },
    'manual': { label: 'Search Link', color: 'bg-gray-100 text-gray-800', icon: '🔗' },
  }
  return info[source] || { label: source, color: 'bg-gray-100 text-gray-800' }
}
