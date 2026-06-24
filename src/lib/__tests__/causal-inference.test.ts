import { describe, it, expect } from 'vitest'
import { ols, studentTTwoSidedP, trendSlope, mean } from '../stats'
import {
  recommendMethods,
  differenceInMeans,
  didTwoByTwo,
  differenceInDifferences,
  parallelTrendsCheck,
  interruptedTimeSeries,
  prePost,
  type DidObservation,
} from '../causal-inference'

describe('stats: OLS', () => {
  it('recovers a known linear relationship y = 3 + 2x', () => {
    const X = [[0], [1], [2], [3], [4], [5]]
    const y = X.map(([x]) => 3 + 2 * x)
    const r = ols(X, y)
    expect(r.coefficients[0]).toBeCloseTo(3, 8)
    expect(r.coefficients[1]).toBeCloseTo(2, 8)
    expect(r.rSquared).toBeCloseTo(1, 8)
    expect(r.predict([10])).toBeCloseTo(23, 8)
  })

  it('recovers a two-predictor plane', () => {
    const rows = [
      [1, 1],
      [2, 1],
      [3, 2],
      [4, 3],
      [5, 5],
      [6, 8],
    ]
    const y = rows.map(([a, b]) => 1 + 2 * a + 3 * b)
    const r = ols(rows, y)
    expect(r.coefficients[0]).toBeCloseTo(1, 6)
    expect(r.coefficients[1]).toBeCloseTo(2, 6)
    expect(r.coefficients[2]).toBeCloseTo(3, 6)
  })
})

describe('stats: Student-t p-value', () => {
  it('is ~1 at t=0 and ~0 for large t', () => {
    expect(studentTTwoSidedP(0, 10)).toBeCloseTo(1, 6)
    expect(studentTTwoSidedP(50, 10)).toBeLessThan(1e-6)
  })

  it('matches the textbook value for t=2.0, df=10 (~0.0734)', () => {
    expect(studentTTwoSidedP(2.0, 10)).toBeCloseTo(0.0734, 3)
  })

  it('trendSlope recovers a known slope', () => {
    expect(trendSlope([10, 12, 14, 16])).toBeCloseTo(2, 8)
  })
})

describe('differenceInMeans (RCT)', () => {
  it('estimates a positive treatment effect with a small p-value', () => {
    const treatment = [12, 13, 11, 14, 12, 13]
    const control = [9, 10, 8, 11, 9, 10]
    const r = differenceInMeans(treatment, control)
    expect(r.estimate).toBeCloseTo(mean(treatment) - mean(control), 8)
    expect(r.estimate).toBeGreaterThan(0)
    expect(r.pValue!).toBeLessThan(0.01)
    expect(r.ciLow!).toBeLessThan(r.estimate)
    expect(r.ciHigh!).toBeGreaterThan(r.estimate)
  })
})

describe('difference-in-differences', () => {
  it('2x2 returns the exact ATT', () => {
    // treated rises 10->20 (+10); control rises 10->12 (+2); ATT = 8
    const r = didTwoByTwo(10, 20, 10, 12)
    expect(r.estimate).toBeCloseTo(8, 10)
    expect(r.diagnostics!.counterfactualPost).toBeCloseTo(12, 10)
  })

  it('panel regression recovers the interaction (ATT) with inference', () => {
    // control: pre 5, post 7 (time shock +2); treated: pre 5, post 15 (ATT +8)
    const cell = (treated: 0 | 1, post: 0 | 1, outcome: number, n = 5): DidObservation[] =>
      Array.from({ length: n }, () => ({ treated, post, outcome }))
    const obs: DidObservation[] = [
      ...cell(0, 0, 5),
      ...cell(0, 1, 7),
      ...cell(1, 0, 5),
      ...cell(1, 1, 15),
    ]
    const r = differenceInDifferences(obs)
    expect(r.estimate).toBeCloseTo(8, 6)
    expect(r.diagnostics!.timeShock).toBeCloseTo(2, 6)
    expect(r.pValue!).toBeLessThan(1e-6)
  })

  it('parallelTrendsCheck passes for matching slopes, fails for diverging ones', () => {
    expect(parallelTrendsCheck([1, 2, 3, 4], [10, 11, 12, 13]).passes).toBe(true)
    expect(parallelTrendsCheck([1, 3, 5, 7], [10, 11, 12, 13]).passes).toBe(false)
  })
})

describe('interrupted time series', () => {
  it('detects a pure level jump with no slope change', () => {
    // pre-trend slope 2, intercept 10; +15 level shift from t=6 onward
    const series = Array.from({ length: 12 }, (_, t) => 10 + 2 * t + (t >= 6 ? 15 : 0))
    const r = interruptedTimeSeries(series, 6)
    expect(r.diagnostics!.levelChange).toBeCloseTo(15, 6)
    expect(r.diagnostics!.slopeChange).toBeCloseTo(0, 6)
    expect(r.diagnostics!.preTrend).toBeCloseTo(2, 6)
    expect(r.estimate).toBeCloseTo(15, 6)
  })

  it('detects a slope change', () => {
    // pre slope 1; post adds +3 per period (slope change +3), no level jump
    const series = Array.from({ length: 12 }, (_, t) => 5 + 1 * t + (t >= 6 ? 3 * (t - 6 + 1) : 0))
    const r = interruptedTimeSeries(series, 6)
    expect(r.diagnostics!.slopeChange).toBeCloseTo(3, 6)
    expect(r.diagnostics!.levelChange).toBeCloseTo(0, 6)
  })
})

describe('prePost (naive)', () => {
  it('computes the raw before/after change and warns', () => {
    const r = prePost([10, 11, 9, 10], [18, 19, 17, 18])
    expect(r.estimate).toBeCloseTo(8, 8)
    expect(r.caveats.join(' ')).toMatch(/indicative|seasonality|secular/i)
  })
})

describe('recommendMethods', () => {
  it('prefers RCT when randomized', () => {
    const recs = recommendMethods({ randomized: true, hasControlGroup: true })
    expect(recs[0].method).toBe('rct')
    expect(recs[0].confidence).toBe('high')
  })

  it('recommends event-study + DiD with control group and multiple periods', () => {
    const recs = recommendMethods({ hasControlGroup: true, hasPrePeriod: true, prePeriods: 4, panel: true })
    const methods = recs.map((r) => r.method)
    expect(methods).toContain('event-study')
    expect(methods).toContain('did')
  })

  it('recommends plain DiD with a control group and a single pre-period', () => {
    const recs = recommendMethods({ hasControlGroup: true, hasPrePeriod: true })
    expect(recs[0].method).toBe('did')
    expect(recs[0].caveats.join(' ')).toMatch(/parallel/i)
  })

  it('recommends synthetic control for one treated unit + donor pool', () => {
    const recs = recommendMethods({ singleTreatedUnit: true, donorPoolSize: 8 })
    expect(recs[0].method).toBe('synthetic-control')
    expect(recs[0].confidence).toBe('high')
  })

  it('recommends ITS when there is no control but a long series', () => {
    const recs = recommendMethods({ hasControlGroup: false, prePeriods: 6, postPeriods: 6 })
    expect(recs.map((r) => r.method)).toContain('its')
  })

  it('recommends IV/2SLS under endogeneity with an instrument', () => {
    const recs = recommendMethods({ endogeneityRisk: true, hasInstrument: true })
    expect(recs.map((r) => r.method)).toContain('iv-2sls')
  })

  it('falls back to naive before/after with low confidence', () => {
    const recs = recommendMethods({})
    expect(recs).toHaveLength(1)
    expect(recs[0].method).toBe('pre-post')
    expect(recs[0].confidence).toBe('low')
  })

  it('ranks recommendations starting at 1', () => {
    const recs = recommendMethods({ hasControlGroup: true, hasPrePeriod: true, prePeriods: 3, panel: true })
    expect(recs[0].rank).toBe(1)
    expect(recs.map((r) => r.rank)).toEqual(recs.map((_, i) => i + 1))
  })
})
