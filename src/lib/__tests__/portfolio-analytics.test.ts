import { describe, it, expect } from 'vitest'
import {
  type PortfolioAsset,
  assetMetrics,
  portfolioNAV,
  herfindahl,
  allocateCapital,
  vintageCohorts,
  portfolioAttribution,
  portfolioMetrics,
  monteCarloNPV,
  DEFAULT_RETURN_CONFIDENCE,
} from '../portfolio-analytics'

const OPTS = { discountRate: 0.1, projectionYears: 3 }

function asset(over: Partial<PortfolioAsset> = {}): PortfolioAsset {
  return {
    id: over.id ?? 'a1',
    name: over.name ?? 'Asset',
    investedCapital: over.investedCapital ?? 100_000,
    annualReturn: over.annualReturn ?? 60_000,
    returnBasis: over.returnBasis ?? 'projected',
    ...over,
  }
}

describe('assetMetrics', () => {
  it('computes NPV, PI and IRR consistently (PV = NPV + invested)', () => {
    const m = assetMetrics(asset({ investedCapital: 100_000, annualReturn: 60_000 }), OPTS)
    // PV of 60k/yr for 3yr @10% ≈ 149,211
    expect(m.pvOfBenefits).toBeCloseTo(149_211, -2)
    expect(m.npv).toBeCloseTo(m.pvOfBenefits - 100_000, 6)
    expect(m.profitabilityIndex).toBeCloseTo(m.pvOfBenefits / 100_000, 6)
    expect(m.profitabilityIndex).toBeGreaterThan(1) // value-creating
    expect(m.irr).toBeGreaterThan(10) // beats the discount rate
  })

  it('applies the success-probability haircut to the return', () => {
    const full = assetMetrics(asset({ successProbability: 1 }), OPTS)
    const half = assetMetrics(asset({ successProbability: 0.5 }), OPTS)
    expect(half.riskAdjustedReturn).toBeCloseTo(full.riskAdjustedReturn * 0.5, 6)
    expect(half.npv).toBeLessThan(full.npv)
  })

  it('defaults confidence by provenance', () => {
    expect(assetMetrics(asset({ returnBasis: 'measured' }), OPTS).confidence).toBe(
      DEFAULT_RETURN_CONFIDENCE.measured,
    )
    expect(assetMetrics(asset({ returnBasis: 'projected' }), OPTS).confidence).toBe(
      DEFAULT_RETURN_CONFIDENCE.projected,
    )
  })

  it('EVA = return − capital × WACC', () => {
    const m = assetMetrics(asset({ investedCapital: 100_000, annualReturn: 60_000 }), {
      ...OPTS,
      wacc: 0.1,
    })
    expect(m.eva).toBeCloseTo(60_000 - 100_000 * 0.1, 6)
  })
})

describe('portfolioNAV', () => {
  it('nets PV of benefits against remaining commitment', () => {
    const a = asset({ annualReturn: 60_000, remainingCommitment: 20_000 })
    const nav = portfolioNAV([a], OPTS)
    const m = assetMetrics(a, OPTS)
    expect(nav).toBeCloseTo(m.pvOfBenefits - 20_000, 6)
  })
})

describe('herfindahl', () => {
  it('is 1 for a single asset and 1/n for equal split', () => {
    expect(herfindahl([100])).toBeCloseTo(1, 6)
    expect(herfindahl([50, 50])).toBeCloseTo(0.5, 6)
    expect(herfindahl([25, 25, 25, 25])).toBeCloseTo(0.25, 6)
  })
  it('handles empty / zero gracefully', () => {
    expect(herfindahl([])).toBe(0)
    expect(herfindahl([0, 0])).toBe(0)
  })
})

describe('allocateCapital', () => {
  it('funds highest-PI assets first and respects the budget', () => {
    const assets: PortfolioAsset[] = [
      asset({ id: 'low', investedCapital: 100_000, annualReturn: 45_000 }),  // PI ~1.12
      asset({ id: 'high', investedCapital: 100_000, annualReturn: 90_000 }), // PI ~2.24
      asset({ id: 'mid', investedCapital: 100_000, annualReturn: 60_000 }),  // PI ~1.49
    ]
    const alloc = allocateCapital(assets, 200_000, OPTS)
    expect(alloc.fundedIds).toEqual(['high', 'mid'])
    expect(alloc.capitalDeployed).toBe(200_000)
    expect(alloc.capitalRemaining).toBe(0)
    expect(alloc.deferredIds).toContain('low')
  })

  it('excludes value-destroying assets (PI <= 1)', () => {
    const assets: PortfolioAsset[] = [
      asset({ id: 'good', investedCapital: 100_000, annualReturn: 60_000 }),
      asset({ id: 'bad', investedCapital: 100_000, annualReturn: 10_000 }), // PI < 1
    ]
    const alloc = allocateCapital(assets, 1_000_000, OPTS)
    expect(alloc.fundedIds).toEqual(['good'])
  })
})

describe('vintageCohorts', () => {
  it('groups by vintage and computes cohort MOIC/IRR', () => {
    const assets: PortfolioAsset[] = [
      asset({ id: '1', vintage: 'FY24', investedCapital: 100_000, annualReturn: 80_000 }),
      asset({ id: '2', vintage: 'FY24', investedCapital: 100_000, annualReturn: 40_000 }),
      asset({ id: '3', vintage: 'FY25', investedCapital: 100_000, annualReturn: 60_000 }),
    ]
    const cohorts = vintageCohorts(assets, OPTS)
    expect(cohorts.map((c) => c.vintage)).toEqual(['FY24', 'FY25'])
    const fy24 = cohorts.find((c) => c.vintage === 'FY24')!
    expect(fy24.assetCount).toBe(2)
    expect(fy24.investedCapital).toBe(200_000)
    expect(fy24.annualReturn).toBe(120_000)
    // gross multiple: (120k × 3) / 200k = 1.8
    expect(fy24.moic).toBeCloseTo(1.8, 6)
  })
})

describe('portfolioAttribution', () => {
  it('shares sum to 1 and are sorted descending', () => {
    const assets: PortfolioAsset[] = [
      asset({ id: 'a', annualReturn: 30_000 }),
      asset({ id: 'b', annualReturn: 70_000 }),
    ]
    const attr = portfolioAttribution(assets)
    expect(attr[0].id).toBe('b')
    expect(attr.reduce((s, e) => s + e.share, 0)).toBeCloseTo(1, 6)
    expect(attr.find((e) => e.id === 'b')!.share).toBeCloseTo(0.7, 6)
  })
})

describe('portfolioMetrics', () => {
  it('rolls up invested, return, concentration and blended confidence', () => {
    const assets: PortfolioAsset[] = [
      asset({ id: 'a', investedCapital: 100_000, annualReturn: 60_000, returnBasis: 'measured' }),
      asset({ id: 'b', investedCapital: 50_000, annualReturn: 40_000, returnBasis: 'projected' }),
    ]
    const pm = portfolioMetrics(assets, OPTS)
    expect(pm.assetCount).toBe(2)
    expect(pm.totalInvested).toBe(150_000)
    expect(pm.totalAnnualReturn).toBe(100_000)
    expect(pm.concentrationByValue).toBeGreaterThan(0.25)
    expect(pm.concentrationByValue).toBeLessThanOrEqual(1)
    // blended confidence between the two provenance defaults
    expect(pm.blendedConfidence).toBeGreaterThan(DEFAULT_RETURN_CONFIDENCE.projected)
    expect(pm.blendedConfidence).toBeLessThan(DEFAULT_RETURN_CONFIDENCE.measured)
  })
})

describe('monteCarloNPV', () => {
  it('is deterministic for a fixed seed and ordered p10 < p50 < p90', () => {
    const a = asset({ investedCapital: 100_000, annualReturn: 60_000, returnStdDev: 20_000 })
    const r1 = monteCarloNPV(a, { ...OPTS, runs: 3000, seed: 42 })
    const r2 = monteCarloNPV(a, { ...OPTS, runs: 3000, seed: 42 })
    expect(r1.p50).toBe(r2.p50) // deterministic
    expect(r1.p10).toBeLessThan(r1.p50)
    expect(r1.p50).toBeLessThan(r1.p90)
    expect(r1.probabilityPositive).toBeGreaterThan(0.5) // mostly value-creating
  })

  it('collapses to a point estimate when there is no variance', () => {
    const a = asset({ investedCapital: 100_000, annualReturn: 60_000 }) // no stdDev
    const r = monteCarloNPV(a, { ...OPTS, runs: 500, seed: 7 })
    expect(r.p10).toBeCloseTo(r.p90, 6)
    expect(r.meanNPV).toBeCloseTo(assetMetrics(a, OPTS).npv, 4)
  })
})
