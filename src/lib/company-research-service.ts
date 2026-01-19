/**
 * Company Research Service
 * Extracts and summarizes company information from various sources:
 * - Pasted text (news articles, website content)
 * - Uploaded documents (TXT, MD, CSV, JSON)
 * - RSS feeds (via Azure Logic Apps + Blob Storage)
 */

import { callAIForTask } from './openai-service'
import { parseJsonLenient } from './lenient-json'

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyInsight {
  id: string
  category: 'strategy' | 'financial' | 'technology' | 'market' | 'operations' | 'culture' | 'news'
  title: string
  summary: string
  relevanceToAI: string
  potentialUseCases: string[]
  source: string
  confidence: 'high' | 'medium' | 'low'
  extractedDate: string
}

export interface CompanyResearchContext {
  companyName: string
  industry?: string
  insights: CompanyInsight[]
  rawSources: CompanySource[]
  summary?: string
  lastUpdated: string
}

export interface CompanySource {
  id: string
  type: 'text' | 'url' | 'document' | 'rss'
  title: string
  content: string
  url?: string
  fileName?: string
  addedAt: string
}

export interface RSSFeedItem {
  title: string
  description: string
  link: string
  pubDate: string
}

export interface FetchRSSFromBlobStorageResult {
  items: RSSFeedItem[]
  message?: string
  blobName?: string
  lastModified?: string
  totalBlobs?: number
  diagnostics?: {
    sizeBytes?: number
    hasRss?: boolean
    hasChannel?: boolean
    hasAtomFeed?: boolean
    itemTagCount?: number
    entryTagCount?: number
  }
}

export interface RSSFeedConfig {
  name: string
  urlTemplate: string
  description: string
}

// ============================================================================
// INSIGHT EXTRACTION
// ============================================================================

/**
 * Extract business insights from text content using AI
 */
export async function extractInsightsFromText(
  content: string,
  companyName: string,
  sourceTitle: string = 'Pasted Content'
): Promise<CompanyInsight[]> {
  if (!content.trim()) {
    return []
  }

  const clipForPrompt = (text: string, maxChars: number): string => {
    const trimmed = text.trim()
    if (trimmed.length <= maxChars) return trimmed

    // Keep both the start and end to preserve context (especially for long RSS dumps).
    const head = trimmed.slice(0, Math.floor(maxChars * 0.7))
    const tail = trimmed.slice(-Math.floor(maxChars * 0.3))
    return `${head}\n\n[...truncated...]\n\n${tail}`
  }

  const getInsightsArray = (parsed: any): any[] | undefined => {
    if (Array.isArray(parsed)) return parsed
    if (!parsed || typeof parsed !== 'object') return undefined

    const directCandidates = [parsed.insights, parsed.Insights, parsed.items, parsed.results]
    for (const candidate of directCandidates) {
      if (Array.isArray(candidate)) return candidate
      if (candidate && typeof candidate === 'object') {
        const nestedCandidates = [candidate.insights, candidate.items, candidate.results, candidate.data]
        for (const nested of nestedCandidates) {
          if (Array.isArray(nested)) return nested
        }
      }
    }

    return undefined
  }

  const prompt = `You are a business analyst preparing for an AI discovery session with ${companyName}.

CONTENT TO ANALYZE:
"""
${clipForPrompt(content, 12000)}
"""

SOURCE: ${sourceTitle}

TASK: Extract key business insights that could inform AI/technology opportunities.

For each insight, identify:
1. Category (strategy, financial, technology, market, operations, culture, news)
2. A concise title (5-10 words)
3. A brief summary (2-3 sentences)
4. How this relates to AI/automation opportunities
5. 1-3 potential use cases this insight suggests
6. Confidence level in the insight (high/medium/low)

Return a JSON object:
{
  "insights": [
    {
      "category": "strategy|financial|technology|market|operations|culture|news",
      "title": "Brief insight title",
      "summary": "2-3 sentence summary",
      "relevanceToAI": "How this relates to AI opportunities",
      "potentialUseCases": ["Use case 1", "Use case 2"],
      "confidence": "high|medium|low"
    }
  ]
}

Extraction rules:
- Extract 3-8 insights when there is sufficient signal (e.g., multiple headlines, clear themes, initiatives, risks).
- Do NOT return an empty insights list unless the content genuinely contains no business-relevant information.
- If the content is mostly headlines, infer themes and summarize them as "news" or "strategy" insights.

Return valid JSON only.`

  try {
    const raw = await callAIForTask('extraction', prompt, {
      expectJson: true,
      systemPrompt: 'Return only strict JSON. No markdown. No prose outside JSON.',
    })

    const parsed = parseJsonLenient<any>(raw)

    const insightsRaw = getInsightsArray(parsed)

    if (!insightsRaw) {
      return []
    }

    return insightsRaw.map((insight: any) => {
      const potentialUseCases = Array.isArray(insight?.potentialUseCases)
        ? insight.potentialUseCases
        : typeof insight?.potentialUseCases === 'string'
          ? [insight.potentialUseCases]
          : []

      return {
      id: crypto.randomUUID(),
      category: insight.category || 'news',
      title: (insight.title || 'Untitled Insight').toString().trim(),
      summary: (insight.summary || '').toString().trim(),
      relevanceToAI: (insight.relevanceToAI || '').toString().trim(),
      potentialUseCases,
      source: sourceTitle,
      confidence: insight.confidence || 'medium',
      extractedDate: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Failed to extract insights:', error)
    throw new Error(`Failed to extract insights: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// FILE HANDLING
// ============================================================================

/**
 * Extract text from uploaded files
 * Supports: .txt, .md, .csv, .json
 * PDF/Word/Excel require Azure Document Intelligence (not implemented)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'txt':
    case 'md':
    case 'csv':
      return await file.text()
    
    case 'json':
      const jsonContent = await file.text()
      try {
        const parsed = JSON.parse(jsonContent)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return jsonContent
      }

    case 'pdf':
      throw new Error('PDF extraction requires Azure Document Intelligence. Please copy and paste the text content instead.')

    case 'docx':
    case 'doc':
      throw new Error('Word document extraction requires Azure Document Intelligence. Please copy and paste the text content instead.')

    case 'xlsx':
    case 'xls':
      throw new Error('Excel extraction requires Azure Document Intelligence. Please copy and paste the relevant data instead.')

    default:
      throw new Error(`Unsupported file type: .${extension}. Supported types: .txt, .md, .csv, .json`)
  }
}

// ============================================================================
// RESEARCH SUMMARY
// ============================================================================

/**
 * Generate a research summary for the discovery session
 */
export async function generateResearchSummary(
  companyName: string,
  insights: CompanyInsight[]
): Promise<string> {
  if (insights.length === 0) {
    return `No research data available for ${companyName}. Add company information to generate insights.`
  }

  const insightsSummary = insights
    .map(i => `- [${i.category.toUpperCase()}] ${i.title}: ${i.summary}`)
    .join('\n')

  const prompt = `You are preparing an executive briefing for an AI discovery session with ${companyName}.

EXTRACTED INSIGHTS:
${insightsSummary}

TASK: Write a concise research summary (3-4 paragraphs) that:
1. Summarizes the company's current situation and strategic priorities
2. Highlights technology and digital transformation initiatives
3. Identifies key pain points and opportunities for AI/automation
4. Suggests areas to explore during the discovery session

Write in a professional, actionable tone. Focus on insights relevant to Microsoft AI solutions.`

  try {
    const result = await callAIForTask('analysis', prompt)
    return result
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return `Research summary generation failed. ${insights.length} insights available for review.`
  }
}

// ============================================================================
// RSS FEED HANDLING
// ============================================================================

/**
 * Fetch RSS feed items from Azure Blob Storage
 * (Logic App stores fetched RSS as XML in blob storage)
 * @param apiEndpoint - Base API URL (default: '/api')
 * @param companyName - Optional company name to filter RSS feeds
 */
export async function fetchRSSFromBlobStorage(
  apiEndpoint: string = '/api',
  companyName?: string
): Promise<FetchRSSFromBlobStorageResult> {
  try {
    const url = new URL(`${apiEndpoint}/rss-feeds`, window.location.origin);
    if (companyName) {
      url.searchParams.set('company', companyName);
    }
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`)
    }

    const data = await response.json().catch(() => ({} as any))

    const items = Array.isArray(data?.items) ? (data.items as RSSFeedItem[]) : []

    return {
      items,
      message: typeof data?.message === 'string' ? data.message : undefined,
      blobName: typeof data?.blobName === 'string' ? data.blobName : undefined,
      lastModified: typeof data?.lastModified === 'string' ? data.lastModified : undefined,
      totalBlobs: typeof data?.totalBlobs === 'number' ? data.totalBlobs : undefined,
      diagnostics: data?.diagnostics && typeof data.diagnostics === 'object' ? data.diagnostics : undefined,
    }
  } catch (error) {
    console.error('Failed to fetch RSS from blob storage:', error)
    return {
      items: [],
      message: error instanceof Error ? error.message : 'Failed to fetch RSS from blob storage',
    }
  }
}

/**
 * Parse RSS XML content into feed items
 */
export function parseRSSXml(xmlContent: string): RSSFeedItem[] {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    
    // Check for parsing errors
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      console.error('RSS XML parse error:', parseError.textContent)
      return []
    }

    const items = doc.querySelectorAll('item')
    
    return Array.from(items).map(item => ({
      title: item.querySelector('title')?.textContent || 'Untitled',
      description: stripHtml(item.querySelector('description')?.textContent || ''),
      link: item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Failed to parse RSS:', error)
    return []
  }
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Convert RSS items to extractable text for insight generation
 */
export function rssItemsToText(items: RSSFeedItem[], maxItems: number = 10): string {
  return items
    .slice(0, maxItems)
    .map(item => `HEADLINE: ${item.title}\nDATE: ${item.pubDate}\nSUMMARY: ${item.description}\n`)
    .join('\n---\n')
}

// ============================================================================
// SUGGESTED RSS FEEDS
// ============================================================================

export const SUGGESTED_RSS_FEEDS: RSSFeedConfig[] = [
  {
    name: 'Google News (Company)',
    urlTemplate: 'https://news.google.com/rss/search?q={company}+when:7d&hl=en-US&gl=US&ceid=US:en',
    description: 'Google News results for the company (last 7 days)',
  },
  {
    name: 'Google News (Company + AI)',
    urlTemplate: 'https://news.google.com/rss/search?q={company}+AI+OR+artificial+intelligence&hl=en-US&gl=US&ceid=US:en',
    description: 'Company news related to AI initiatives',
  },
  {
    name: 'Google News (Company + Digital Transformation)',
    urlTemplate: 'https://news.google.com/rss/search?q={company}+digital+transformation&hl=en-US&gl=US&ceid=US:en',
    description: 'Company digital transformation news',
  },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create empty research context
 */
export function createEmptyResearchContext(companyName: string): CompanyResearchContext {
  return {
    companyName,
    insights: [],
    rawSources: [],
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: CompanyInsight['category']): string {
  const colors: Record<string, string> = {
    strategy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    financial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    market: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    operations: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    culture: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    news: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return colors[category] || colors.news
}

/**
 * Format insights for use case generation context
 */
export function formatInsightsForContext(insights: CompanyInsight[]): string {
  if (insights.length === 0) return ''
  
  return `
COMPANY RESEARCH INSIGHTS:
${insights.map(i => `
[${i.category.toUpperCase()}] ${i.title}
${i.summary}
AI Relevance: ${i.relevanceToAI}
Suggested Use Cases: ${i.potentialUseCases.join(', ')}
`).join('\n')}
`
}
