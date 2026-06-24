/**
 * Causal-inference engine.
 *
 * Two responsibilities:
 *  1. `recommendMethods` — a deterministic decision tree that, given the design
 *     a CSAM actually has (control group? pre-period? instrument? single unit?),
 *     ranks the credible causal methods with plain-English rationale and caveats.
 *  2. Estimators — turn observed data into a *measured* effect with a standard
 *     error, confidence interval and p-value. The measured effect is what lets a
 *     portfolio asset graduate from `returnBasis: 'projected'` to `'measured'`.
 *
 * First slice covers the ~80% of real engagements: randomized diff-in-means,
 * difference-in-differences (2x2 and panel regression), interrupted time series,
 * a parallel-trends diagnostic, and a naive before/after with heavy caveats. The
 * recommender additionally points to synthetic control, IV/2SLS and propensity
 * methods when the design calls for them (estimators for those land later).
 */

import { mean, variance, ols, studentTTwoSidedP, trendSlope } from '@/lib/stats'

// ── Method taxonomy ─────────────────────────────────────────────────────────────

export type CausalMethod =
  | 'rct'
  | 'did'
  | 'event-study'
  | 'its'
  | 'synthetic-control'
  | 'iv-2sls'
  | 'psm'
  | 'pre-post'

export type Confidence = 'high' | 'medium' | 'low'

/** What the engagement actually has available to identify a causal effect. */
export interface CausalDesign {
  /** Treatment (e.g. who got the licence) was randomly assigned. */
  randomized?: boolean
  /** A comparison group that did not receive the treatment exists. */
  hasControlGroup?: boolean
  /** At least one period of outcome data before go-live exists. */
  hasPrePeriod?: boolean
  /** Count of pre-treatment time points (overrides hasPrePeriod when given). */
  prePeriods?: number
  /** Count of post-treatment time points. */
  postPeriods?: number
  /** Repeated observations over both units and time. */
  panel?: boolean
  /** Units adopted at different times. */
  staggeredAdoption?: boolean
  /** Exactly one treated unit (e.g. one business unit switched on Fabric). */
  singleTreatedUnit?: boolean
  /** Number of untreated comparison units available as donors. */
  donorPoolSize?: number
  /** A valid instrument for adoption is available. */
  hasInstrument?: boolean
  /** Adoption is self-selected / correlated with the outcome. */
  endogeneityRisk?: boolean
  /** The main confounders are measured. */
  confoundersObserved?: boolean
}

export interface MethodRecommendation {
  method: CausalMethod
  label: string
  confidence: Confidence
  rationale: string
  requires: string[]
  caveats: string[]
  /** 1 = best fit for the stated design. */
  rank: number
}

/**
 * Rank the credible causal methods for a given design. Always returns at least
 * one option (falls back to naive before/after with loud caveats).
 */
export function recommendMethods(design: CausalDesign): MethodRecommendation[] {
  const recs: Omit<MethodRecommendation, 'rank'>[] = []

  const pre = design.prePeriods ?? (design.hasPrePeriod ? 1 : 0)
  const post = design.postPeriods ?? 1
  const hasControl = design.hasControlGroup ?? false
  const multiPeriod = pre >= 2 || post >= 2 || !!design.panel

  if (design.randomized && (design.hasControlGroup ?? true)) {
    recs.push({
      method: 'rct',
      label: 'Randomized comparison (difference in means)',
      confidence: 'high',
      rationale:
        'Treatment was randomized, so a straight comparison of treated vs control outcomes is unbiased — the gold standard.',
      requires: ['Outcomes for a treated group and a randomized control group'],
      caveats: ['Confirm randomization balance and that there was no spillover between arms.'],
    })
  }

  if (hasControl && pre >= 1) {
    if (multiPeriod) {
      recs.push({
        method: 'event-study',
        label: 'Event-study / dynamic difference-in-differences',
        confidence: 'high',
        rationale:
          'A comparison group plus several periods lets you trace the effect period-by-period and explicitly test pre-trends.',
        requires: ['Panel of treated + control units across multiple periods'],
        caveats: [
          'Validate flat pre-treatment effects (parallel trends).',
          ...(design.staggeredAdoption
            ? ['Rollout timing differs — use a staggered-adoption-robust estimator to avoid bias.']
            : []),
        ],
      })
    }
    recs.push({
      method: 'did',
      label: 'Difference-in-differences',
      confidence: multiPeriod ? 'high' : 'medium',
      rationale:
        'With a control group and a pre-period, DiD differences out fixed gaps between groups and shocks common to both.',
      requires: ['Treated + control outcomes, before and after go-live'],
      caveats: [
        'Hinges on the parallel-trends assumption.',
        ...(multiPeriod ? [] : ['Only two periods — parallel trends cannot be tested; gather more pre-periods.']),
      ],
    })
  }

  if (design.singleTreatedUnit && (design.donorPoolSize ?? 0) >= 2) {
    recs.push({
      method: 'synthetic-control',
      label: 'Synthetic control',
      confidence: (design.donorPoolSize ?? 0) >= 5 ? 'high' : 'medium',
      rationale:
        'A single treated unit with a pool of untreated units can be matched by a weighted "synthetic" twin built from the donors.',
      requires: ['One treated unit + several donor units with a good pre-period fit'],
      caveats: [
        'Needs a long, well-fitting pre-period.',
        'Inference is via placebo/permutation tests, not classical p-values.',
      ],
    })
  }

  if (!hasControl && pre + post >= 6) {
    recs.push({
      method: 'its',
      label: 'Interrupted time series (segmented regression)',
      confidence: 'medium',
      rationale:
        'No control group, but enough points before and after to model the trend and detect a level/slope break at go-live.',
      requires: ['A single series with roughly 3+ points before and after the intervention'],
      caveats: [
        'Assumes no other change coincided with go-live.',
        'Model autocorrelation/seasonality for trustworthy standard errors.',
      ],
    })
  }

  if (design.endogeneityRisk && design.hasInstrument) {
    recs.push({
      method: 'iv-2sls',
      label: 'Instrumental variables (2SLS)',
      confidence: 'medium',
      rationale:
        'Adoption looks self-selected, so naive comparisons are biased. A valid instrument isolates exogenous variation in adoption.',
      requires: ['An instrument that drives adoption but does not affect the outcome directly'],
      caveats: ['Instrument exclusion is untestable and assumption-heavy.', 'Weak instruments bias the estimate.'],
    })
  }

  if (!hasControl && design.confoundersObserved && pre === 0) {
    recs.push({
      method: 'psm',
      label: 'Propensity matching / regression adjustment',
      confidence: 'medium',
      rationale:
        'No pre-period or control arm, but the main confounders are measured — so you can match or adjust adopters to comparable non-adopters.',
      requires: ['Unit-level outcomes plus the observed confounders'],
      caveats: ['Controls only for observed confounders — hidden selection remains.'],
    })
  }

  if (recs.length === 0) {
    recs.push({
      method: 'pre-post',
      label: 'Before / after (naive)',
      confidence: 'low',
      rationale:
        'No control group, instrument, or sufficient time series — only a simple before/after comparison is possible.',
      requires: ['Outcome before and after go-live'],
      caveats: [
        'Cannot separate the intervention from seasonality or secular trends.',
        'Treat as indicative only; strengthen the design (add a control or more pre-periods).',
      ],
    })
  }

  return recs.map((r, i) => ({ ...r, rank: i + 1 }))
}

// ── Estimators ──────────────────────────────────────────────────────────────────

export interface EffectEstimate {
  method: CausalMethod
  /** Causal effect in outcome units (e.g. $/yr, points, %). */
  estimate: number
  standardError?: number
  ciLow?: number
  ciHigh?: number
  pValue?: number
  /** estimate relative to the counterfactual baseline (0..). */
  relativeEffect?: number
  diagnostics?: Record<string, number>
  caveats: string[]
}

const Z95 = 1.959963984540054

/** Randomized / A-B test: difference in means with a Welch t-test. */
export function differenceInMeans(treatment: number[], control: number[]): EffectEstimate {
  const mT = mean(treatment)
  const mC = mean(control)
  const vT = variance(treatment)
  const vC = variance(control)
  const nT = treatment.length
  const nC = control.length
  const estimate = mT - mC
  const seSq = vT / nT + vC / nC
  const se = Math.sqrt(seSq)
  const df =
    seSq * seSq /
    ((vT / nT) ** 2 / Math.max(1, nT - 1) + (vC / nC) ** 2 / Math.max(1, nC - 1))
  const t = se > 0 ? estimate / se : 0
  return {
    method: 'rct',
    estimate,
    standardError: se,
    ciLow: estimate - Z95 * se,
    ciHigh: estimate + Z95 * se,
    pValue: studentTTwoSidedP(t, df),
    relativeEffect: mC !== 0 ? estimate / mC : undefined,
    diagnostics: { meanTreated: mT, meanControl: mC, df },
    caveats: ['Valid only if assignment was truly random and arms did not contaminate each other.'],
  }
}

/** Difference-in-differences from four cell means (2x2). Point estimate only. */
export function didTwoByTwo(
  treatedPre: number,
  treatedPost: number,
  controlPre: number,
  controlPost: number,
): EffectEstimate {
  const treatedDelta = treatedPost - treatedPre
  const controlDelta = controlPost - controlPre
  const estimate = treatedDelta - controlDelta
  const counterfactualPost = treatedPre + controlDelta
  return {
    method: 'did',
    estimate,
    relativeEffect: counterfactualPost !== 0 ? estimate / counterfactualPost : undefined,
    diagnostics: { treatedDelta, controlDelta, counterfactualPost },
    caveats: [
      '2x2 point estimate — supply unit-level panel data for standard errors and inference.',
      'Assumes parallel trends: absent treatment, treated and control would have moved together.',
    ],
  }
}

export interface DidObservation {
  /** 1 if the unit is in the treated group. */
  treated: 0 | 1
  /** 1 if the observation is in the post-treatment period. */
  post: 0 | 1
  outcome: number
}

/**
 * Panel difference-in-differences via OLS: outcome ~ treated + post + treated*post.
 * The interaction coefficient is the ATT, with a standard error and p-value.
 */
export function differenceInDifferences(obs: DidObservation[]): EffectEstimate {
  const X = obs.map((o) => [o.treated, o.post, o.treated * o.post])
  const y = obs.map((o) => o.outcome)
  const r = ols(X, y)
  // coefficients: [intercept, treated, post, interaction]
  const estimate = r.coefficients[3]
  const se = r.standardErrors[3]
  return {
    method: 'did',
    estimate,
    standardError: se,
    ciLow: estimate - Z95 * se,
    ciHigh: estimate + Z95 * se,
    pValue: r.pValues[3],
    diagnostics: {
      baseline: r.coefficients[0],
      groupGap: r.coefficients[1],
      timeShock: r.coefficients[2],
      rSquared: r.rSquared,
    },
    caveats: [
      'Identifies the ATT under parallel trends.',
      'Cluster standard errors by unit when you have many periods (not applied here).',
    ],
  }
}

export interface ParallelTrendsResult {
  treatedSlope: number
  controlSlope: number
  slopeGap: number
  /** True when pre-period slopes are within `tolerance` of each other. */
  passes: boolean
  note: string
}

/** Diagnostic for DiD: compare pre-period slopes of treated vs control. */
export function parallelTrendsCheck(
  treatedPre: number[],
  controlPre: number[],
  tolerance = 0.1,
): ParallelTrendsResult {
  const treatedSlope = trendSlope(treatedPre)
  const controlSlope = trendSlope(controlPre)
  const slopeGap = treatedSlope - controlSlope
  const denom = Math.max(Math.abs(controlSlope), 1e-9)
  const passes = Math.abs(slopeGap) / denom <= tolerance
  return {
    treatedSlope,
    controlSlope,
    slopeGap,
    passes,
    note: passes
      ? 'Pre-trends are close — the parallel-trends assumption is plausible.'
      : 'Pre-trends diverge — DiD may be biased; consider synthetic control or add controls.',
  }
}

/**
 * Interrupted time series via segmented regression.
 * Model: y = b0 + b1·t + b2·post + b3·timeSincePost
 *   b2 = immediate level change, b3 = change in slope after the intervention.
 * `estimate` is the average effect across the post period vs the extrapolated
 * pre-trend counterfactual.
 */
export function interruptedTimeSeries(series: number[], interventionIndex: number): EffectEstimate {
  const n = series.length
  const X = series.map((_, t) => {
    const post = t >= interventionIndex ? 1 : 0
    const timeSince = t >= interventionIndex ? t - interventionIndex + 1 : 0
    return [t, post, timeSince]
  })
  const r = ols(X, series)
  const [b0, b1, levelChange, slopeChange] = r.coefficients
  const effects: number[] = []
  const counterfactual: number[] = []
  for (let t = interventionIndex; t < n; t++) {
    effects.push(levelChange + slopeChange * (t - interventionIndex + 1))
    counterfactual.push(b0 + b1 * t)
  }
  const estimate = mean(effects)
  const cfMean = mean(counterfactual)
  const se = r.standardErrors[1] // SE of the level-change term
  return {
    method: 'its',
    estimate,
    standardError: se,
    ciLow: estimate - Z95 * se,
    ciHigh: estimate + Z95 * se,
    pValue: r.pValues[1],
    relativeEffect: cfMean !== 0 ? estimate / cfMean : undefined,
    diagnostics: { levelChange, slopeChange, preTrend: b1, rSquared: r.rSquared },
    caveats: [
      'Single-group ITS: assumes no co-intervention coincided with go-live.',
      'Assumes the pre-trend would have continued; autocorrelation is not modeled.',
    ],
  }
}

/** Naive before/after — provided for completeness, with loud caveats. */
export function prePost(pre: number[], post: number[]): EffectEstimate {
  const mPre = mean(pre)
  const mPost = mean(post)
  const estimate = mPost - mPre
  const se = Math.sqrt(variance(pre) / pre.length + variance(post) / post.length)
  const t = se > 0 ? estimate / se : 0
  const df = pre.length + post.length - 2
  return {
    method: 'pre-post',
    estimate,
    standardError: se,
    ciLow: estimate - Z95 * se,
    ciHigh: estimate + Z95 * se,
    pValue: df > 0 ? studentTTwoSidedP(t, df) : undefined,
    relativeEffect: mPre !== 0 ? estimate / mPre : undefined,
    diagnostics: { meanPre: mPre, meanPost: mPost },
    caveats: [
      'No control or counterfactual — cannot rule out seasonality or secular trends.',
      'Treat strictly as indicative; do not attribute the full change to the intervention.',
    ],
  }
}
