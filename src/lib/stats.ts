/**
 * Minimal, dependency-free statistics used by the causal-inference engine.
 *
 * Everything here is deterministic and pure so it can be unit-tested and run in
 * the browser without pulling in a stats library. The numerically delicate
 * pieces (incomplete beta for Student-t p-values, OLS via the normal equations)
 * follow the standard Numerical Recipes formulations.
 */

// ── Descriptive ────────────────────────────────────────────────────────────────

export function sum(xs: number[]): number {
  let s = 0
  for (const x of xs) s += x
  return s
}

export function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : NaN
}

/** Variance. Sample (n-1) by default; pass `false` for the population (n) form. */
export function variance(xs: number[], sample = true): number {
  const n = xs.length
  if (n < (sample ? 2 : 1)) return NaN
  const m = mean(xs)
  let s = 0
  for (const x of xs) s += (x - m) * (x - m)
  return s / (n - (sample ? 1 : 0))
}

export function std(xs: number[], sample = true): number {
  return Math.sqrt(variance(xs, sample))
}

/** Ordinary-least-squares slope of `ys` against its own index 0..n-1. */
export function trendSlope(ys: number[]): number {
  const n = ys.length
  if (n < 2) return NaN
  const xbar = (n - 1) / 2
  const ybar = mean(ys)
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xbar) * (ys[i] - ybar)
    den += (i - xbar) * (i - xbar)
  }
  return den === 0 ? NaN : num / den
}

// ── Distributions ──────────────────────────────────────────────────────────────

/** Error function (Abramowitz & Stegun 7.1.26), |error| < 1.5e-7. */
export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x))
  return x >= 0 ? y : -y
}

/** Standard-normal CDF. */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

/** Two-sided p-value from a z-statistic. */
export function twoSidedPFromZ(z: number): number {
  return 2 * (1 - normalCdf(Math.abs(z)))
}

/** log Gamma (Lanczos approximation). */
function gammaln(xx: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ]
  let x = xx
  let y = xx
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) {
    y++
    ser += cof[j] / y
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

/** Continued fraction for the incomplete beta (Numerical Recipes `betacf`). */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200
  const EPS = 3e-12
  const FPMIN = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

/** Regularized incomplete beta function I_x(a, b). */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
  )
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a
  return 1 - (bt * betacf(b, a, 1 - x)) / b
}

/** Two-sided p-value for a Student-t statistic with `df` degrees of freedom. */
export function studentTTwoSidedP(t: number, df: number): number {
  if (!isFinite(t)) return 0
  if (df <= 0) return NaN
  return regularizedIncompleteBeta(df / (df + t * t), df / 2, 0.5)
}

// ── Linear algebra (small dense matrices) ───────────────────────────────────────

function transpose(M: number[][]): number[][] {
  return M[0].map((_, j) => M.map((row) => row[j]))
}

function matMul(A: number[][], B: number[][]): number[][] {
  const Bt = transpose(B)
  return A.map((row) => Bt.map((col) => row.reduce((s, v, i) => s + v * col[i], 0)))
}

function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, x, i) => s + x * v[i], 0))
}

/** Invert a square matrix via Gauss-Jordan with partial pivoting. */
function invert(M: number[][]): number[][] {
  const n = M.length
  const A = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r
    }
    if (Math.abs(A[piv][col]) < 1e-12) throw new Error('Singular matrix in OLS')
    ;[A[col], A[piv]] = [A[piv], A[col]]
    const d = A[col][col]
    for (let j = 0; j < 2 * n; j++) A[col][j] /= d
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = A[r][col]
      for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[col][j]
    }
  }
  return A.map((row) => row.slice(n))
}

export interface OLSResult {
  /** [intercept, b1, b2, ...]. */
  coefficients: number[]
  standardErrors: number[]
  tStats: number[]
  pValues: number[]
  residualStdError: number
  rSquared: number
  /** Residual degrees of freedom (n - k). */
  df: number
  n: number
  /** Predict for a row of predictors (without the intercept term). */
  predict: (x: number[]) => number
}

/**
 * Ordinary least squares. `X` is a matrix of predictor rows WITHOUT an intercept
 * column (one is added automatically). Solves the normal equations.
 */
export function ols(X: number[][], y: number[]): OLSResult {
  const n = X.length
  if (n === 0) throw new Error('OLS requires at least one observation')
  const Xi = X.map((row) => [1, ...row])
  const k = Xi[0].length
  const Xt = transpose(Xi)
  const XtXinv = invert(matMul(Xt, Xi))
  const beta = matVec(XtXinv, matVec(Xt, y))
  const yhat = Xi.map((row) => row.reduce((s, xj, j) => s + xj * beta[j], 0))
  const resid = y.map((yi, i) => yi - yhat[i])
  const dof = n - k
  const ssRes = resid.reduce((s, r) => s + r * r, 0)
  const sigma2 = dof > 0 ? ssRes / dof : 0
  const se = beta.map((_, j) => Math.sqrt(Math.max(0, sigma2 * XtXinv[j][j])))
  const tStats = beta.map((b, j) => (se[j] > 0 ? b / se[j] : b === 0 ? 0 : Infinity))
  const pValues = tStats.map((t) => (dof > 0 ? studentTTwoSidedP(t, dof) : NaN))
  const ybar = mean(y)
  const ssTot = y.reduce((s, yi) => s + (yi - ybar) * (yi - ybar), 0)
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 1
  return {
    coefficients: beta,
    standardErrors: se,
    tStats,
    pValues,
    residualStdError: Math.sqrt(sigma2),
    rSquared,
    df: dof,
    n,
    predict: (x: number[]) => [1, ...x].reduce((s, xj, j) => s + xj * beta[j], 0),
  }
}
