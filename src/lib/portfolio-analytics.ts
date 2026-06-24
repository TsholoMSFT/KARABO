/**
 * Portfolio & Investment Analysis engine.
 *
 * Treats a customer's Microsoft estate as an INVESTMENT PORTFOLIO: every use
 * case / workload / licence is an *asset* with invested capital (implementation
 * + consumed ACR), a *return* (the benefit it produces), risk, and a vintage.
 *
 * This module provides the deterministic, finance-grade measures a CSAM/CFO uses
 * to value, rank, allocate and attribute across that portfolio:
 *   • per-asset:  NPV, Profitability Index (PI), IRR, EVA, gross value multiple (MOIC)
 *   • portfolio:  Portfolio NAV, weighted IRR, MOIC, Herfindahl concentration,
 *                 vintage cohorts (PE-style MOIC/IRR + J-curve), value attribution
 *   • allocation: capital-rationing optimiser (PI-ranked selection under a budget)
 *   • risk:       Monte-Carlo risk-adjusted NPV bands (seedable → deterministic)
 *
 * The "return" (`annualReturn`) is meant to be supplied by the value-realisation
 * layer — ideally a *causally-measured* benefit, otherwise a *projected* one. Its
 * provenance is carried on each asset via `returnBasis` so the UI can flag
 * confidence. Reuses the canonical NPV/IRR from `financial-calculations.ts`.
 *
 * Deferred by design (later phase): Markowitz efficient frontier, real options.
 */

import {
  calculateNPV,
  calculateIRR,
  DEFAULT_ASSUMPTIONS,
} from './financial-calculations'

// ── Inputs ────────────────────────────────────────────────────────────────────

/** Where an asset's `annualReturn` came from — drives the confidence flag. */
export type ReturnBasis = 'measured' | 'projected'

/** Default confidence weight (0..1) applied by provenance when none is supplied. */
export const DEFAULT_RETURN_CONFIDENCE: Record<ReturnBasis, number> = {
  measured: 0.9,
  projected: 0.5,
}

/**
 * One investment in the portfolio (a use case, workload, or licence line).
 * All monetary fields are in a single currency (USD by convention).
 */
export interface PortfolioAsset {
  id: string
  name: string
  /** Grouping label, e.g. "Fabric", "Copilot Studio", or a solution area. */
  category?: string
  /** Cohort label for vintage analysis, e.g. "FY24" or "FY25 H1". */
  vintage?: string
  /** Go-live timestamp (optional; enables J-curve / age calculations). */
  goLiveAt?: number
  /** Capital deployed: one-time implementation + ACR/run-cost consumed to date. */
  investedCapital: number
  /** Annual benefit produced (measured or projected). */
  annualReturn: number
  /** Provenance of `annualReturn`. */
  returnBasis: ReturnBasis
  /** Confidence weight 0..1 (defaults by basis); informational, not an NPV haircut. */
  returnConfidence?: number
  /** Absolute USD standard deviation of `annualReturn` (for Monte Carlo). */
  returnStdDev?: number
  /** Probability of success 0..1 applied as a risk haircut to the return. */
  successProbability?: number
  /** Remaining cost/commitment attributable to this asset (run-cost, MACC share). */
  remainingCommitment?: number
  /** Benefit already banked to date (for MOIC / DPI-style multiples). */
  realizedToDate?: number
}

export interface PortfolioOptions {
  /** Discount rate (e.g. 0.10). Defaults to the app's financial assumptions. */
  discountRate?: number
  /** Projection horizon in years. Defaults to the app's financial assumptions. */
  projectionYears?: number
  /** Weighted average cost of capital for EVA. Defaults to the discount rate. */
  wacc?: number
}

// ── Outputs ───────────────────────────────────────────────────────────────────

export interface AssetMetrics {
  id: string
  name: string
  investedCapital: number
  annualReturn: number
  /** annualReturn after the success-probability haircut. */
  riskAdjustedReturn: number
  returnBasis: ReturnBasis
  confidence: number
  npv: number
  /** Present value of the benefit stream (= npv + investedCapital). */
  pvOfBenefits: number
  /** PV(benefits) / investedCapital. >1 creates value; the budget-ranking metric. */
  profitabilityIndex: number
  /** IRR as a percentage. */
  irr: number
  /** Economic Value Added: riskAdjustedReturn − investedCapital × WACC (annual). */
  eva: number
  /** Gross value multiple over the horizon: total value / invested capital. */
  moic: number
}

export interface VintageCohort {
  vintage: string
  assetCount: number
  investedCapital: number
  annualReturn: number
  moic: number
  irr: number
}

export interface AttributionEntry {
  id: string
  name: string
  /** Absolute annual-value contribution. */
  contribution: number
  /** Share of total portfolio annual value (0..1). */
  share: number
}

export interface PortfolioMetrics {
  assetCount: number
  totalInvested: number
  totalAnnualReturn: number
  /** Portfolio Net Asset Value (see `portfolioNAV`). */
  nav: number
  /** IRR computed on the aggregate invested vs aggregate return (percentage). */
  weightedIRR: number
  /** Aggregate gross value multiple. */
  portfolioMOIC: number
  /** Herfindahl concentration of annual value (1/n … 1; higher = concentrated). */
  concentrationByValue: number
  /** Herfindahl concentration of invested capital. */
  concentrationByInvestment: number
  /** Value-weighted blended confidence (0..1). */
  blendedConfidence: number
  perAsset: AssetMetrics[]
  vintages: VintageCohort[]
  attribution: AttributionEntry[]
}

export interface CapitalAllocation {
  budget: number
  fundedIds: string[]
  deferredIds: string[]
  capitalDeployed: number
  capitalRemaining: number
  /** Total NPV captured by the funded set. */
  fundedNPV: number
}

export interface MonteCarloResult {
  runs: number
  meanNPV: number
  p10: number
  p50: number
  p90: number
  /** Probability the NPV is positive (0..1). */
  probabilityPositive: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveOpts(opts?: PortfolioOptions) {
  const discountRate = opts?.discountRate ?? DEFAULT_ASSUMPTIONS.discountRate
  const projectionYears = opts?.projectionYears ?? DEFAULT_ASSUMPTIONS.projectionYears
  const wacc = opts?.wacc ?? discountRate
  return { discountRate, projectionYears, wacc }
}

function riskAdjustedReturn(asset: PortfolioAsset): number {
  const p = asset.successProbability ?? 1
  return asset.annualReturn * Math.max(0, Math.min(1, p))
}

function confidenceOf(asset: PortfolioAsset): number {
  return asset.returnConfidence ?? DEFAULT_RETURN_CONFIDENCE[asset.returnBasis]
}

/** Present value of a level annual benefit over `years` at `rate` (reuses calculateNPV). */
function presentValueOfBenefits(annual: number, rate: number, years: number): number {
  // calculateNPV(investment=0, ...) returns Σ benefit/(1+r)^y.
  return calculateNPV(0, annual, rate, { ...DEFAULT_ASSUMPTIONS, projectionYears: years })
}

// ── Per-asset measures ────────────────────────────────────────────────────────

export function assetMetrics(asset: PortfolioAsset, opts?: PortfolioOptions): AssetMetrics {
  const { discountRate, projectionYears, wacc } = resolveOpts(opts)
  const radj = riskAdjustedReturn(asset)
  const pvOfBenefits = presentValueOfBenefits(radj, discountRate, projectionYears)
  const npv = pvOfBenefits - asset.investedCapital
  const profitabilityIndex = asset.investedCapital > 0 ? pvOfBenefits / asset.investedCapital : Infinity
  const irr = calculateIRR(asset.investedCapital, radj)
  const eva = radj - asset.investedCapital * wacc
  const totalValue = (asset.realizedToDate ?? 0) + radj * projectionYears
  const moic = asset.investedCapital > 0 ? totalValue / asset.investedCapital : Infinity

  return {
    id: asset.id,
    name: asset.name,
    investedCapital: asset.investedCapital,
    annualReturn: asset.annualReturn,
    riskAdjustedReturn: radj,
    returnBasis: asset.returnBasis,
    confidence: confidenceOf(asset),
    npv,
    pvOfBenefits,
    profitabilityIndex,
    irr,
    eva,
    moic,
  }
}

// ── Portfolio NAV ─────────────────────────────────────────────────────────────

/**
 * Portfolio Net Asset Value — the estate's net worth to the customer, mark-to-model:
 *   NAV = Σ [ PV(remaining expected benefits) − remaining commitment ]
 * Forward-looking; banked (`realizedToDate`) value is excluded by design.
 */
export function portfolioNAV(assets: PortfolioAsset[], opts?: PortfolioOptions): number {
  const { discountRate, projectionYears } = resolveOpts(opts)
  return assets.reduce((nav, a) => {
    const pv = presentValueOfBenefits(riskAdjustedReturn(a), discountRate, projectionYears)
    return nav + pv - (a.remainingCommitment ?? 0)
  }, 0)
}

// ── Concentration ─────────────────────────────────────────────────────────────

/** Herfindahl–Hirschman index of a set of non-negative values (1/n … 1). */
export function herfindahl(values: number[]): number {
  const positive = values.map((v) => Math.max(0, v))
  const total = positive.reduce((s, v) => s + v, 0)
  if (total <= 0) return 0
  return positive.reduce((s, v) => s + (v / total) ** 2, 0)
}

// ── Capital rationing (budget-constrained selection) ──────────────────────────

/**
 * Capital-rationing optimiser: rank by Profitability Index (the textbook metric
 * under a hard budget) and fund greedily until the budget is exhausted.
 */
export function allocateCapital(
  assets: PortfolioAsset[],
  budget: number,
  opts?: PortfolioOptions,
): CapitalAllocation {
  const ranked = assets
    .map((a) => ({ a, m: assetMetrics(a, opts) }))
    .filter(({ m }) => m.profitabilityIndex > 1) // only value-creating investments
    .sort((x, y) => y.m.profitabilityIndex - x.m.profitabilityIndex)

  const fundedIds: string[] = []
  let capitalDeployed = 0
  let fundedNPV = 0
  for (const { a, m } of ranked) {
    if (capitalDeployed + a.investedCapital <= budget) {
      fundedIds.push(a.id)
      capitalDeployed += a.investedCapital
      fundedNPV += m.npv
    }
  }
  const fundedSet = new Set(fundedIds)
  return {
    budget,
    fundedIds,
    deferredIds: assets.filter((a) => !fundedSet.has(a.id)).map((a) => a.id),
    capitalDeployed,
    capitalRemaining: budget - capitalDeployed,
    fundedNPV,
  }
}

// ── Vintage cohorts (PE-style) ────────────────────────────────────────────────

export function vintageCohorts(assets: PortfolioAsset[], opts?: PortfolioOptions): VintageCohort[] {
  const { projectionYears } = resolveOpts(opts)
  const groups = new Map<string, PortfolioAsset[]>()
  for (const a of assets) {
    const key = a.vintage ?? 'Unassigned'
    const arr = groups.get(key) ?? []
    arr.push(a)
    groups.set(key, arr)
  }

  return [...groups.entries()]
    .map(([vintage, group]) => {
      const investedCapital = group.reduce((s, a) => s + a.investedCapital, 0)
      const annualReturn = group.reduce((s, a) => s + riskAdjustedReturn(a), 0)
      const realized = group.reduce((s, a) => s + (a.realizedToDate ?? 0), 0)
      const totalValue = realized + annualReturn * projectionYears
      return {
        vintage,
        assetCount: group.length,
        investedCapital,
        annualReturn,
        moic: investedCapital > 0 ? totalValue / investedCapital : 0,
        irr: calculateIRR(investedCapital, annualReturn),
      }
    })
    .sort((a, b) => a.vintage.localeCompare(b.vintage))
}

// ── Value attribution ─────────────────────────────────────────────────────────

/** Decompose total portfolio annual value into per-asset contributions and shares. */
export function portfolioAttribution(assets: PortfolioAsset[]): AttributionEntry[] {
  const contributions = assets.map((a) => ({ a, contribution: riskAdjustedReturn(a) }))
  const total = contributions.reduce((s, c) => s + c.contribution, 0)
  return contributions
    .map(({ a, contribution }) => ({
      id: a.id,
      name: a.name,
      contribution,
      share: total > 0 ? contribution / total : 0,
    }))
    .sort((x, y) => y.contribution - x.contribution)
}

// ── Portfolio roll-up ─────────────────────────────────────────────────────────

export function portfolioMetrics(assets: PortfolioAsset[], opts?: PortfolioOptions): PortfolioMetrics {
  const { projectionYears } = resolveOpts(opts)
  const perAsset = assets.map((a) => assetMetrics(a, opts))
  const totalInvested = assets.reduce((s, a) => s + a.investedCapital, 0)
  const totalAnnualReturn = assets.reduce((s, a) => s + riskAdjustedReturn(a), 0)
  const totalRealized = assets.reduce((s, a) => s + (a.realizedToDate ?? 0), 0)
  const totalValue = totalRealized + totalAnnualReturn * projectionYears

  const weightedConfidenceNum = assets.reduce(
    (s, a) => s + confidenceOf(a) * riskAdjustedReturn(a),
    0,
  )

  return {
    assetCount: assets.length,
    totalInvested,
    totalAnnualReturn,
    nav: portfolioNAV(assets, opts),
    weightedIRR: calculateIRR(totalInvested, totalAnnualReturn),
    portfolioMOIC: totalInvested > 0 ? totalValue / totalInvested : 0,
    concentrationByValue: herfindahl(assets.map((a) => riskAdjustedReturn(a))),
    concentrationByInvestment: herfindahl(assets.map((a) => a.investedCapital)),
    blendedConfidence: totalAnnualReturn > 0 ? weightedConfidenceNum / totalAnnualReturn : 0,
    perAsset,
    vintages: vintageCohorts(assets, opts),
    attribution: portfolioAttribution(assets),
  }
}

// ── Monte-Carlo risk-adjusted NPV ─────────────────────────────────────────────

/** Seedable PRNG (mulberry32) for deterministic, testable simulations. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Draw from a normal distribution via Box–Muller. */
function sampleNormal(rng: () => number, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-12)
  const u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + sd * z
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/**
 * Monte-Carlo NPV: the annual return is uncertain (`returnStdDev`); simulate the
 * NPV distribution and report the p10/p50/p90 band + probability of a positive NPV.
 */
export function monteCarloNPV(
  asset: PortfolioAsset,
  opts?: PortfolioOptions & { runs?: number; seed?: number },
): MonteCarloResult {
  const { discountRate, projectionYears } = resolveOpts(opts)
  const runs = Math.max(1, opts?.runs ?? 2000)
  const rng = mulberry32(opts?.seed ?? 1)
  const mean = riskAdjustedReturn(asset)
  const sd = asset.returnStdDev ?? 0

  const results: number[] = new Array(runs)
  let positive = 0
  let sum = 0
  for (let i = 0; i < runs; i++) {
    const drawnReturn = sd > 0 ? sampleNormal(rng, mean, sd) : mean
    const npv = presentValueOfBenefits(drawnReturn, discountRate, projectionYears) - asset.investedCapital
    results[i] = npv
    sum += npv
    if (npv > 0) positive++
  }
  results.sort((a, b) => a - b)

  return {
    runs,
    meanNPV: sum / runs,
    p10: percentile(results, 0.1),
    p50: percentile(results, 0.5),
    p90: percentile(results, 0.9),
    probabilityPositive: positive / runs,
  }
}
