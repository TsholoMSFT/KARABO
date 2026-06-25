import { describe, it, expect } from 'vitest'
import {
  confidenceFactor,
  riskAdjustedAnnualValue,
  conservativeBenefitFromCOI,
  rampedPresentValue,
  rampedHorizonValue,
  valueRange,
} from '../value-credibility'
import {
  calculateStrategicScore,
  calculateFinancialImpactScore,
  calculateBlendedScore,
  getRankedUseCases,
} from '../scoring'
import type { UseCase } from '../types'

function uc(over: Partial<UseCase> = {}): UseCase {
  return {
    id: 'uc',
    title: 'UC',
    description: '',
    impact: 5,
    feasibility: 5,
    rice: { reach: 100, impact: 2, confidence: 50, effort: 2 },
    createdAt: 1,
    ...over,
  }
}

describe('value-credibility', () => {
  it('confidence factor increases with confidence; defaults to low', () => {
    expect(confidenceFactor('low')).toBeLessThan(confidenceFactor('medium'))
    expect(confidenceFactor('medium')).toBeLessThan(confidenceFactor('high'))
    expect(confidenceFactor(undefined)).toBe(confidenceFactor('low'))
  })

  it('risk-adjusted value shrinks low-confidence estimates and floors at 0', () => {
    expect(riskAdjustedAnnualValue(1_000_000, 'low')).toBeLessThan(riskAdjustedAnnualValue(1_000_000, 'high'))
    expect(riskAdjustedAnnualValue(1_000_000, 'high')).toBeCloseTo(900_000, 0)
    expect(riskAdjustedAnnualValue(-5, 'high')).toBe(0)
  })

  it('conservative COI capture is a small share of COI', () => {
    expect(conservativeBenefitFromCOI(1_000_000)).toBeCloseTo(200_000, 0)
  })

  it('ramped PV is less than a flat full-benefit PV but positive', () => {
    const annual = 100_000
    const flat = [1, 2, 3].reduce((s, y) => s + annual / Math.pow(1.1, y), 0)
    expect(rampedPresentValue(annual)).toBeLessThan(flat)
    expect(rampedPresentValue(annual)).toBeGreaterThan(0)
  })

  it('ramped horizon value is less than annual*years', () => {
    expect(rampedHorizonValue(100_000, 3)).toBeLessThan(300_000)
    expect(rampedHorizonValue(100_000, 3)).toBeCloseTo(180_000, 0) // (.3+.6+.9)*100k
  })

  it('value range is ordered, smaller and wider at low confidence', () => {
    const hi = valueRange(1_000_000, 'high')
    const lo = valueRange(1_000_000, 'low')
    expect(hi.low).toBeLessThanOrEqual(hi.base)
    expect(hi.base).toBeLessThanOrEqual(hi.high)
    expect(lo.base).toBeLessThan(hi.base)
    expect(lo.high - lo.low).toBeGreaterThan(hi.high - hi.low)
  })
})

describe('scoring — de-inflated and not dropped on unverifiable numbers', () => {
  it('strategic score has no money in it', () => {
    const strong = uc({ impact: 9, feasibility: 8, kpis: ['a', 'b'] })
    const weak = uc({ impact: 3, feasibility: 3 })
    expect(calculateStrategicScore(strong)).toBeGreaterThan(calculateStrategicScore(weak))
  })

  it('financial-impact is de-inflated by confidence', () => {
    const lowConf = uc({ expectedValue: { totalAnnualValue: 1_000_000, confidence: 'low' } })
    const highConf = uc({ expectedValue: { totalAnnualValue: 1_000_000, confidence: 'high' } })
    expect(calculateFinancialImpactScore(lowConf)).toBeLessThan(calculateFinancialImpactScore(highConf))
  })

  it('blended ranking keeps a strong-but-unquantified use case on top', () => {
    const strongNoMoney = uc({ id: 'strong', impact: 9, feasibility: 9 })
    const weakBigUnverified = uc({
      id: 'weak',
      impact: 2,
      feasibility: 2,
      expectedValue: { totalAnnualValue: 5_000_000, confidence: 'low' },
    })
    const byBlended = [weakBigUnverified, strongNoMoney].sort(
      (x, y) => calculateBlendedScore(y) - calculateBlendedScore(x),
    )
    expect(byBlended[0].id).toBe('strong')
  })

  it('financial-impact ties fall back to strategic merit, not arbitrary order', () => {
    const aStrong = uc({ id: 'a', impact: 9, feasibility: 9, createdAt: 5 })
    const bWeak = uc({ id: 'b', impact: 2, feasibility: 2, createdAt: 1 })
    // Neither has financials -> both score 0 -> tie -> strategic decides.
    const ranked = getRankedUseCases([bWeak, aStrong], 'financial-impact')
    expect(ranked[0].id).toBe('a')
  })
})
