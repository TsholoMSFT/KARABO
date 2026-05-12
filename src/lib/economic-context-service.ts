/**
 * Frontend client for free economic / FX / company-financials Azure Functions.
 * All endpoints are GET; backend handles caching.
 */

export type EconomicRegion = 'US' | 'EU' | 'ZA' | 'GLOBAL'

export interface EconomicIndicator {
  id: string
  label: string
  value: number | null
  unit: string
  asOf: string | null
  source: string
  sourceUrl?: string
}

export interface EconomicSnapshot {
  region: EconomicRegion | string
  indicators: EconomicIndicator[]
  fetchedAt: string
  notes?: string
}

export interface FxRates {
  base: string
  date: string
  rates: Record<string, number>
  source: string
  fetchedAt: string
}

export interface CompanyFinancialsSnapshot {
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
  sources: { name: string; url?: string }[]
  fetchedAt: string
}

const API_BASE = (typeof window !== 'undefined' && (window as any).__API_BASE__) || ''

async function getJson<T>(path: string): Promise<T> {
  const url = `${API_BASE}/api${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${path}`)
  return res.json() as Promise<T>
}

export async function fetchEconomicSnapshot(
  region: EconomicRegion = 'US',
  indicators: string[] = ['gdp', 'cpi', 'unemployment', 'policy_rate'],
): Promise<EconomicSnapshot> {
  const qs = `?region=${encodeURIComponent(region)}&indicators=${encodeURIComponent(indicators.join(','))}`
  return getJson<EconomicSnapshot>(`/economic-data${qs}`)
}

export async function fetchExchangeRates(
  base = 'USD',
  symbols: string[] = ['ZAR', 'EUR', 'GBP', 'USD'],
): Promise<FxRates> {
  return getJson<FxRates>(`/exchange-rates?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols.join(','))}`)
}

export async function fetchCompanyFinancials(
  ticker: string,
  region: 'US' | 'UK' | 'EU' | 'ZA' | 'GLOBAL' = 'GLOBAL',
): Promise<CompanyFinancialsSnapshot> {
  return getJson<CompanyFinancialsSnapshot>(`/company-financials?ticker=${encodeURIComponent(ticker)}&region=${encodeURIComponent(region)}`)
}

/** Pick the best EconomicRegion bucket from a free-text region/country string. */
export function inferEconomicRegion(input?: string): EconomicRegion {
  if (!input) return 'GLOBAL'
  const s = input.toLowerCase()
  if (/(south africa|za\b|sandton|johannesburg|cape town)/.test(s)) return 'ZA'
  if (/(united states|\busa?\b|america|new york)/.test(s)) return 'US'
  if (/(europe|euro area|eu\b|germany|france|spain|italy|netherlands)/.test(s)) return 'EU'
  return 'GLOBAL'
}

/** Convenience: load region + FX in parallel. */
export async function fetchRegionalContext(region: EconomicRegion) {
  const [econ, fx] = await Promise.allSettled([
    fetchEconomicSnapshot(region),
    fetchExchangeRates('USD', ['ZAR', 'EUR', 'GBP']),
  ])
  return {
    economy: econ.status === 'fulfilled' ? econ.value : null,
    fx: fx.status === 'fulfilled' ? fx.value : null,
  }
}
