import { describe, it, expect } from 'vitest'
import { formatFinancialSummary, assembleSourceText } from '../company-data-service'

describe('company-data-service: formatFinancialSummary', () => {
  it('renders a compact summary with humanised figures', () => {
    const summary = formatFinancialSummary({
      ticker: 'MTN.JO',
      region: 'ZA',
      companyName: 'MTN Group',
      sector: 'Communication Services',
      industry: 'Telecom',
      revenueUSD: 12_300_000_000,
      marketCapUSD: 9_800_000_000,
      employees: 17500,
      fiscalYearEnd: '1231',
    })!
    expect(summary).toContain('MTN Group')
    expect(summary).toContain('Revenue: $12.3B')
    expect(summary).toContain('Market cap: $9.8B')
    expect(summary).toContain('Employees: 17,500')
  })

  it('returns undefined for a null snapshot', () => {
    expect(formatFinancialSummary(null)).toBeUndefined()
  })
})

describe('company-data-service: assembleSourceText', () => {
  it('combines news and earnings into labelled blocks', () => {
    const text = assembleSourceText(
      [{ title: 'Margins under pressure', description: 'Costs rose', link: '', pubDate: '' }],
      [{ id: 'e1', companyName: 'MTN', quarter: 'H1', year: 2026, date: '', source: 'jse-sens', summary: 'Interim results' }],
    )
    expect(text).toContain('RECENT NEWS:')
    expect(text).toContain('Margins under pressure')
    expect(text).toContain('EARNINGS / RESULTS:')
    expect(text).toContain('H1 2026')
  })

  it('returns an empty string when there is nothing to assemble', () => {
    expect(assembleSourceText([], [])).toBe('')
  })
})
