/**
 * Company data orchestration — fans out across the existing free-source Azure
 * Functions (company-financials, rss-feeds, earnings/search) to assemble the
 * source text + financial summary that feed the theme engine. Lets the Pipeline
 * Plan populate a company row without manual pasting.
 *
 * Pure formatting helpers are exported for unit testing; the fetch orchestration
 * degrades gracefully (each source is best-effort).
 */
import { fetchRSSFromBlobStorage, type RSSFeedItem } from './company-research-service'
import { searchEarningsTranscripts, type EarningsTranscript } from './earnings-service'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api'

export interface FinancialsSnapshot {
  ticker: string
  region: string
  companyName?: string
  industry?: string
  sector?: string
  country?: string
  marketCapUSD?: number
  revenueUSD?: number
  employees?: number
  fiscalYearEnd?: string
  description?: string
  website?: string
  sources?: { name: string; url?: string }[]
}

export interface GatheredCompanyData {
  financialSummary?: string
  sourceText: string
  sources: string[]
}

export async function fetchFinancialsSnapshot(
  ticker: string,
  region = 'GLOBAL',
): Promise<FinancialsSnapshot | null> {
  try {
    const res = await fetch(
      `${API_ENDPOINT}/company-financials?ticker=${encodeURIComponent(ticker)}&region=${encodeURIComponent(region)}`,
    )
    if (!res.ok) return null
    return (await res.json()) as FinancialsSnapshot
  } catch {
    return null
  }
}

function fmtUSD(n?: number): string | undefined {
  if (n == null || !Number.isFinite(n)) return undefined
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/** Pure: render a financial snapshot into a compact prompt-friendly summary. */
export function formatFinancialSummary(s: FinancialsSnapshot | null): string | undefined {
  if (!s) return undefined
  const parts: string[] = []
  if (s.companyName) parts.push(`Company: ${s.companyName}`)
  const sectorIndustry = [s.sector, s.industry].filter(Boolean).join(' / ')
  if (sectorIndustry) parts.push(`Sector/Industry: ${sectorIndustry}`)
  const rev = fmtUSD(s.revenueUSD)
  if (rev) parts.push(`Revenue: ${rev}`)
  const cap = fmtUSD(s.marketCapUSD)
  if (cap) parts.push(`Market cap: ${cap}`)
  if (s.employees) parts.push(`Employees: ${s.employees.toLocaleString('en-US')}`)
  if (s.fiscalYearEnd) parts.push(`Fiscal year end: ${s.fiscalYearEnd}`)
  if (s.description) parts.push(`Profile: ${s.description.slice(0, 600)}`)
  return parts.length ? parts.join('\n') : undefined
}

/** Pure: assemble news + earnings into a single source-text block for the model. */
export function assembleSourceText(news: RSSFeedItem[], earnings: EarningsTranscript[]): string {
  const blocks: string[] = []
  if (news.length) {
    blocks.push(
      'RECENT NEWS:\n' +
        news.slice(0, 15).map((n) => `- ${n.title}${n.description ? `: ${n.description}` : ''}`).join('\n'),
    )
  }
  if (earnings.length) {
    blocks.push(
      'EARNINGS / RESULTS:\n' +
        earnings.slice(0, 10).map((e) => `- ${e.quarter} ${e.year} (${e.source}): ${e.summary ?? e.url ?? ''}`).join('\n'),
    )
  }
  return blocks.join('\n\n')
}

/**
 * Gather everything we can for a company from free sources. Best-effort: any
 * source that fails is simply omitted.
 */
export async function gatherCompanyData(input: {
  companyName: string
  ticker?: string
  region?: 'US' | 'ZA' | 'EU' | 'GLOBAL'
}): Promise<GatheredCompanyData> {
  const region = input.region ?? 'GLOBAL'
  const [snapshot, news, earnings] = await Promise.all([
    input.ticker ? fetchFinancialsSnapshot(input.ticker, region) : Promise.resolve(null),
    fetchRSSFromBlobStorage(API_ENDPOINT, input.companyName).then((r) => r.items).catch(() => [] as RSSFeedItem[]),
    searchEarningsTranscripts(input.companyName, { ticker: input.ticker, region })
      .then((r) => r.transcripts)
      .catch(() => [] as EarningsTranscript[]),
  ])

  const sources: string[] = []
  if (snapshot) sources.push('company-financials')
  if (news.length) sources.push('news-rss')
  if (earnings.length) sources.push('earnings')

  return {
    financialSummary: formatFinancialSummary(snapshot),
    sourceText: assembleSourceText(news, earnings),
    sources,
  }
}
