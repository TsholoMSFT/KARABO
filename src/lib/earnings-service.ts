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

/**
 * Ticker lookup result
 */
export interface TickerLookupResult {
  ticker: string
  name: string
  exchange?: string
  region?: string
  source:
    | 'yahoo'
    | 'alpha-vantage'
    | 'openfigi'
    | 'wikidata'
    | 'tradingview'
    | 'sec-edgar'
    | 'stooq'
    | 'curated'
    | 'ai-guess'
  confidence: 'high' | 'medium' | 'low'
  score?: number
}

export type TickerSourceStatus = 'ok' | 'empty' | 'error' | 'rate-limited' | 'skipped'
export type TickerDiagnostics = Partial<Record<
  'curated' | 'openfigi' | 'wikidata' | 'tradingview' | 'yahoo' | 'sec-edgar' | 'stooq' | 'alpha-vantage' | 'ai',
  TickerSourceStatus
>>

export interface TickerLookupResponse {
  tickers: TickerLookupResult[]
  diagnostics: TickerDiagnostics
  cached?: boolean
  /** High-level outcome so the UI can tell "no match" apart from "backend down". */
  status?: 'ok' | 'empty' | 'unreachable' | 'error'
  /** Human-readable explanation for non-ok statuses. */
  message?: string
}

/**
 * Lookup ticker symbol from company name using a fan-out across multiple
 * free sources (curated overrides, OpenFIGI, Wikidata, TradingView, Yahoo,
 * SEC EDGAR, Stooq, Alpha Vantage). Returns both the ranked tickers and a
 * per-source diagnostics map for the UI to surface.
 */
export async function lookupTickerSymbol(companyName: string): Promise<TickerLookupResponse> {
  if (!companyName || companyName.trim().length < 2) {
    return { tickers: [], diagnostics: {}, status: 'empty' }
  }

  // Cold-start tolerance: SWA can drop the first call to a freshly-deployed
  // function with a 502/503 or socket reset. Retry once with a short backoff
  // so the user never sees a transient cold-start error.
  const attempt = async (): Promise<TickerLookupResponse> => {
    const response = await fetch(`${API_ENDPOINT}/earnings/ticker-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const err: any = new Error(error.error || `Ticker lookup failed: ${response.status}`)
      err.status = response.status
      throw err
    }
    const result = await response.json()
    const tickers = (result.tickers || []) as TickerLookupResult[]
    return {
      tickers,
      diagnostics: result.diagnostics || {},
      cached: !!result.cached,
      status: tickers.length > 0 ? 'ok' : 'empty',
    }
  }

  const isRetryable = (e: any) =>
    !e?.status || e.status === 0 || e.status === 408 || e.status === 502 || e.status === 503 || e.status === 504

  // Turn a thrown fetch/HTTP error into a UI-friendly status + message so the
  // form can tell "no match" apart from "the backend is unreachable".
  const classify = (e: any): Pick<TickerLookupResponse, 'status' | 'message'> => {
    if (!e?.status) {
      return { status: 'unreachable', message: 'Could not reach the research backend. Is the API running on :7071?' }
    }
    if (e.status === 404) {
      return { status: 'unreachable', message: 'Ticker lookup endpoint not found — the backend may be offline or not deployed.' }
    }
    return { status: 'error', message: e?.message || `Ticker lookup failed (HTTP ${e.status}).` }
  }

  try {
    return await attempt()
  } catch (firstErr: any) {
    if (!isRetryable(firstErr)) {
      console.error('Ticker lookup error:', firstErr)
      return { tickers: [], diagnostics: {}, ...classify(firstErr) }
    }
    await new Promise((r) => setTimeout(r, 1500))
    try {
      return await attempt()
    } catch (secondErr) {
      console.error('Ticker lookup error (after retry):', secondErr)
      return { tickers: [], diagnostics: {}, ...classify(secondErr) }
    }
  }
}

/**
 * Financial Statements interfaces
 */
export interface FinancialStatement {
  ticker: string
  fiscalYear: number
  quarter?: string
  revenue?: number
  netIncome?: number
  totalAssets?: number
  totalLiabilities?: number
  cashFlow?: number
  eps?: number
  peRatio?: number
  source: 'alpha-vantage' | 'yahoo-finance'
}

export interface FinancialMetrics {
  statements: FinancialStatement[]
  summary: string
}

/**
 * News Articles interfaces
 */
export interface NewsArticle {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  summary?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface NewsSearchResult {
  articles: NewsArticle[]
  summary: string
}

/**
 * Industry Research interfaces
 */
export interface IndustryInsight {
  id: string
  category: 'trend' | 'standard' | 'benchmark' | 'regulation'
  title: string
  description: string
  source: string
  relevanceScore: number
}

export interface IndustryResearchResult {
  insights: IndustryInsight[]
  summary: string
}

/**
 * Fetch financial statements from Alpha Vantage
 */
export async function fetchFinancialStatements(ticker: string): Promise<FinancialMetrics> {
  if (!ticker || ticker.trim().length === 0) {
    return { statements: [], summary: '' }
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/earnings/financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Financial fetch failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Financial statements error:', error)
    return { statements: [], summary: '' }
  }
}

/**
 * Fetch company news from Alpha Vantage News API
 */
export async function fetchCompanyNews(companyName: string, ticker?: string): Promise<NewsSearchResult> {
  if (!companyName || companyName.trim().length === 0) {
    return { articles: [], summary: '' }
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/earnings/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, ticker }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `News fetch failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('News fetch error:', error)
    return { articles: [], summary: '' }
  }
}

/**
 * Fetch industry research, trends, and standards
 */
export async function fetchIndustryResearch(industry: string, companyName: string): Promise<IndustryResearchResult> {
  if (!industry || industry.trim().length === 0) {
    return { insights: [], summary: '' }
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/earnings/industry-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, companyName }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Industry research failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Industry research error:', error)
    return { insights: [], summary: '' }
  }
}
