/**
 * Value credibility helpers.
 *
 * Fixes two problems with the COI/ROI model:
 *  1. Overstatement — benefits were assumed flat-from-year-1 and "optimistic".
 *     Here value RAMPS over the horizon and is weighted by a confidence factor,
 *     so a hard-to-verify estimate is explicitly smaller (not inflated).
 *  2. Use cases being discarded for unverifiable numbers — value carries a
 *     provenance basis and a confidence band, and a conservative range is led by
 *     the low figure. Ranking can fall back to strategic merit (see scoring.ts)
 *     so a strong use case with soft numbers is not dropped.
 */

import { DEFAULT_ASSUMPTIONS } from './financial-assumptions'

export type ValueConfidence = 'low' | 'medium' | 'high'
export type ValueBasis = 'estimated' | 'benchmarked' | 'customer-validated'

/** Multiplier applied to a benefit by how trustworthy it is. */
export const CONFIDENCE_FACTORS: Record<ValueConfidence, number> = {
  low: 0.4,
  medium: 0.7,
  high: 0.9,
}

/** Benefit ramp by year — most value is NOT realised in year 1. */
export const REALIZATION_CURVE = [0.3, 0.6, 0.9, 1.0, 1.0]

/** Conservative share of Cost-of-Inaction a solution actually captures [low, high]. */
export const CONSERVATIVE_CAPTURE_BAND: [number, number] = [0.2, 0.4]

/** Provenance lifts the confidence floor: estimated < benchmarked < customer-validated. */
export const BASIS_CONFIDENCE_FLOOR: Record<ValueBasis, ValueConfidence> = {
  estimated: 'low',
  benchmarked: 'medium',
  'customer-validated': 'high',
}

export const VALUE_BASIS_LABEL: Record<ValueBasis, string> = {
  estimated: 'Estimated',
  benchmarked: 'Benchmarked',
  'customer-validated': 'Customer-validated',
}

export function confidenceFactor(confidence?: ValueConfidence): number {
  return CONFIDENCE_FACTORS[confidence ?? 'low']
}

export function confidenceFromBasis(basis?: ValueBasis): ValueConfidence {
  return basis ? BASIS_CONFIDENCE_FLOOR[basis] : 'low'
}

/** Risk-adjusted (confidence-weighted) annual value — the honest headline figure. */
export function riskAdjustedAnnualValue(baseAnnual: number, confidence?: ValueConfidence): number {
  return Math.max(0, baseAnnual) * confidenceFactor(confidence)
}

/** Conservative annual benefit captured from a Cost-of-Inaction figure (default = low band). */
export function conservativeBenefitFromCOI(
  annualCOI: number,
  captureRate: number = CONSERVATIVE_CAPTURE_BAND[0],
): number {
  return Math.max(0, annualCOI) * captureRate
}

/**
 * Present value of a benefit stream that RAMPS over the horizon (year-1 is not
 * full) and is discounted. Replaces the flat-from-year-1 assumption that
 * overstated multi-year value.
 */
export function rampedPresentValue(
  annualBenefit: number,
  opts: { discountRate?: number; years?: number; curve?: number[] } = {},
): number {
  const rate = opts.discountRate ?? DEFAULT_ASSUMPTIONS.discountRate
  const years = opts.years ?? DEFAULT_ASSUMPTIONS.projectionYears
  const curve = opts.curve ?? REALIZATION_CURVE
  let pv = 0
  for (let y = 1; y <= years; y++) {
    const factor = curve[Math.min(y - 1, curve.length - 1)]
    pv += (annualBenefit * factor) / Math.pow(1 + rate, y)
  }
  return pv
}

/** Total (undiscounted) benefit over the horizon, ramped — a conservative "N-year value". */
export function rampedHorizonValue(
  annualBenefit: number,
  years: number = DEFAULT_ASSUMPTIONS.projectionYears,
  curve: number[] = REALIZATION_CURVE,
): number {
  let total = 0
  for (let y = 1; y <= years; y++) {
    total += annualBenefit * curve[Math.min(y - 1, curve.length - 1)]
  }
  return total
}

export interface ValueRange {
  low: number
  base: number
  high: number
}

/**
 * A confidence-aware range from a base figure. `base` is the risk-adjusted
 * central estimate; `low` (conservative) should be led with. The band widens as
 * confidence drops.
 */
export function valueRange(base: number, confidence?: ValueConfidence): ValueRange {
  const safe = Math.max(0, base)
  const central = riskAdjustedAnnualValue(safe, confidence)
  const spread = confidence === 'high' ? 0.15 : confidence === 'medium' ? 0.3 : 0.5
  return {
    low: Math.max(0, central * (1 - spread)),
    base: central,
    high: safe * (1 + spread),
  }
}
