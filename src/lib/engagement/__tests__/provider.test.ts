import { describe, it, expect } from 'vitest'
import { computePortfolioRollup, parseCsv, importCEHubEngagements } from '../provider'
import type { Account, UseCase } from '@/lib/types'

const acct = (over: Partial<Account>): Account =>
  ({
    id: 'a',
    name: 'A',
    team: [],
    sessionIds: [],
    workloadIds: [],
    healthRating: 'healthy',
    createdAt: 1,
    ...over,
  } as unknown as Account)

const macc = (totalAmount: number, remainingBalance: number, currentACR: number) =>
  ({ totalAmount, remainingBalance, currentACR, startDate: 0, endDate: 0, lastUpdated: 0 })

describe('engagement provider — portfolio rollup', () => {
  it('aggregates MACC totals + consumed % and flags at-risk accounts', () => {
    const accounts = [
      acct({ id: '1', name: 'Contoso', healthRating: 'healthy', maccCommitment: macc(1_000_000, 600_000, 50_000) }),
      acct({ id: '2', name: 'Fabrikam', healthRating: 'at-risk', maccCommitment: macc(500_000, 450_000, 10_000) }),
    ]
    const r = computePortfolioRollup({ accounts })
    expect(r.maccTotalUSD).toBe(1_500_000)
    expect(r.maccRemainingUSD).toBe(1_050_000)
    expect(r.maccConsumedPct).toBe(30) // (1.5M - 1.05M) / 1.5M
    expect(r.currentACRMonthlyUSD).toBe(60_000)
    expect(r.accountCount).toBe(2)
    expect(r.accountsByHealth.healthy).toBe(1)
    expect(r.atRiskAccounts.map((a) => a.name)).toContain('Fabrikam')
  })

  it('risk-adjusts pipeline value from use cases (de-inflated below headline)', () => {
    const useCases = [
      { id: 'u1', title: 'x', description: '', impact: 5, feasibility: 5, createdAt: 1, expectedValue: { totalAnnualValue: 1_000_000, confidence: 'high' } },
    ] as unknown as UseCase[]
    const r = computePortfolioRollup({ useCases })
    expect(r.useCaseCount).toBe(1)
    expect(r.pipelineAnnualValueUSD).toBeGreaterThan(0)
    expect(r.pipelineAnnualValueUSD).toBeLessThan(1_000_000)
  })

  it('counts engagements by status and type', () => {
    const engagements = [
      { id: 'e1', customerName: 'C', type: 'discovery', status: 'completed', createdAt: 1 },
      { id: 'e2', customerName: 'C', type: 'discovery', status: 'planned', createdAt: 2 },
      { id: 'e3', customerName: 'C', type: 'executive-briefing', status: 'planned', createdAt: 3 },
    ] as unknown as Parameters<typeof computePortfolioRollup>[0]['engagements']
    const r = computePortfolioRollup({ engagements })
    expect(r.totalEngagements).toBe(3)
    expect(r.engagementsByType.discovery).toBe(2)
    expect(r.engagementsByStatus.planned).toBe(2)
  })

  it('adds imported ACR to the consumption signal', () => {
    const r = computePortfolioRollup({
      imported: [
        { acrMonthlyUSD: 5_000, raw: {} },
        { acrMonthlyUSD: 2_500, raw: {} },
      ],
    })
    expect(r.currentACRMonthlyUSD).toBe(7_500)
    expect(r.importedEngagementCount).toBe(2)
  })
})

describe('CEHub CSV import', () => {
  it('parses quoted CSV with embedded commas and maps common columns', () => {
    const csv =
      'Account,Engagement Type,Status,ACR\n' +
      '"Contoso, Inc.",Discovery,Completed,"$12,500"\n' +
      'Fabrikam,Briefing,Planned,5000'
    const rows = importCEHubEngagements(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].customerName).toBe('Contoso, Inc.')
    expect(rows[0].engagementType).toBe('Discovery')
    expect(rows[0].status).toBe('Completed')
    expect(rows[0].acrMonthlyUSD).toBe(12_500)
    expect(rows[1].acrMonthlyUSD).toBe(5_000)
  })

  it('parseCsv ignores blank trailing rows', () => {
    const rows = parseCsv('A,B\n1,2\n\n')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ A: '1', B: '2' })
  })
})
