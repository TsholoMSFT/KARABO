/**
 * Financial Assumptions — central, editable defaults for all financial models.
 *
 * Every hard-coded constant that was previously buried inside
 * `financial-calculations.ts` is now surfaced here so that:
 *   1. The UI can display them to the user (transparency).
 *   2. Users can override them at runtime (editability).
 *   3. There is a single source of truth for auditing.
 */

// ============================================================================
// INTERFACE
// ============================================================================

export interface FinancialAssumptions {
  /** Discount rate used for NPV calculations (e.g. 0.10 = 10%) */
  discountRate: number
  /** Projection horizon in years (default 3) */
  projectionYears: number
  /** Year-1 benefit realization factor (e.g. 0.5 = 50% of full benefits in Y1) */
  year1RealizationFactor: number
  /** Share of annual benefit that flows to revenue line (e.g. 0.6 = 60%) */
  revenueAllocation: number
  /** Share of annual benefit from COGS reduction (e.g. 0.1 = 10%) */
  cogsAllocation: number
  /** Share of annual benefit from OpEx savings (e.g. 0.3 = 30%) */
  opexAllocation: number
  /** Risk-adjustment factor applied to total value (e.g. 0.8 = 80%) */
  riskAdjustmentFactor: number
  /** Sensitivity scenario multipliers [conservative, base, optimistic] */
  sensitivityMultipliers: [number, number, number]
  /** Default cost per person-week in USD */
  costPerPersonWeek: number
  /** Complexity-to-effort mapping in weeks */
  complexityEffortWeeks: { low: number; medium: number; high: number; veryHigh: number }
  /** Fallback baseline value when no revenue data is available */
  fallbackBaselineValue: number
  /** Default value split: [revenue %, cost savings %, risk mitigation %] – should sum to 1 */
  valueSplit: [number, number, number]
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_ASSUMPTIONS: FinancialAssumptions = {
  discountRate: 0.10,
  projectionYears: 3,
  year1RealizationFactor: 0.50,
  revenueAllocation: 0.60,
  cogsAllocation: 0.10,
  opexAllocation: 0.30,
  riskAdjustmentFactor: 0.80,
  sensitivityMultipliers: [0.70, 1.00, 1.30],
  costPerPersonWeek: 8_000,
  complexityEffortWeeks: { low: 4, medium: 8, high: 16, veryHigh: 24 },
  fallbackBaselineValue: 500_000,
  valueSplit: [0.40, 0.40, 0.20],
}

// ============================================================================
// LABELS — human-readable names for each assumption (used in the UI)
// ============================================================================

export const ASSUMPTION_LABELS: Record<keyof FinancialAssumptions, string> = {
  discountRate: 'Discount rate (NPV)',
  projectionYears: 'Projection horizon (years)',
  year1RealizationFactor: 'Year-1 benefit realization',
  revenueAllocation: 'Revenue allocation',
  cogsAllocation: 'COGS reduction share',
  opexAllocation: 'OpEx savings share',
  riskAdjustmentFactor: 'Risk-adjustment factor',
  sensitivityMultipliers: 'Sensitivity scenarios',
  costPerPersonWeek: 'Cost per person-week (USD)',
  complexityEffortWeeks: 'Complexity → effort (weeks)',
  fallbackBaselineValue: 'Fallback baseline value',
  valueSplit: 'Value split (Rev / Cost / Risk)',
}

export const ASSUMPTION_DESCRIPTIONS: Record<keyof FinancialAssumptions, string> = {
  discountRate: 'The rate used to discount future cash flows to their present value. Higher rates reflect greater uncertainty.',
  projectionYears: 'Number of years to model — ROI, NPV, and P&L are projected over this period.',
  year1RealizationFactor: 'Fraction of full annual benefit realized in Year 1 (ramp-up period).',
  revenueAllocation: 'Portion of total benefit attributed to top-line revenue improvement.',
  cogsAllocation: 'Portion of total benefit attributed to reduction in cost of goods sold.',
  opexAllocation: 'Portion of total benefit attributed to operating expense savings.',
  riskAdjustmentFactor: 'Conservative haircut applied to total estimated value to account for execution risk.',
  sensitivityMultipliers: 'Multipliers for Conservative / Base / Optimistic benefit scenarios.',
  costPerPersonWeek: 'Blended cost per week used when converting effort estimates to dollar costs.',
  complexityEffortWeeks: 'Mapping from implementation complexity level to estimated person-weeks.',
  fallbackBaselineValue: 'Default annual value used when no company revenue data is available.',
  valueSplit: 'How estimated value is split across Revenue Impact, Cost Savings, and Risk Mitigation when only a total is known.',
}

/**
 * Helper: format an assumption value for display.
 */
export function formatAssumptionValue(key: keyof FinancialAssumptions, value: unknown): string {
  switch (key) {
    case 'discountRate':
    case 'year1RealizationFactor':
    case 'revenueAllocation':
    case 'cogsAllocation':
    case 'opexAllocation':
    case 'riskAdjustmentFactor':
      return `${((value as number) * 100).toFixed(0)}%`
    case 'costPerPersonWeek':
    case 'fallbackBaselineValue':
      return `$${(value as number).toLocaleString()}`
    case 'projectionYears':
      return `${value} years`
    case 'sensitivityMultipliers': {
      const [c, b, o] = value as [number, number, number]
      return `${(c * 100).toFixed(0)}% / ${(b * 100).toFixed(0)}% / ${(o * 100).toFixed(0)}%`
    }
    case 'complexityEffortWeeks': {
      const w = value as { low: number; medium: number; high: number; veryHigh: number }
      return `${w.low} / ${w.medium} / ${w.high} / ${w.veryHigh} wks`
    }
    case 'valueSplit': {
      const [r, c2, rm] = value as [number, number, number]
      return `${(r * 100).toFixed(0)}% / ${(c2 * 100).toFixed(0)}% / ${(rm * 100).toFixed(0)}%`
    }
    default:
      return String(value)
  }
}
