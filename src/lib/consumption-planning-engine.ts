/**
 * Consumption-planning engine — pure MACC burn / forecast / renewal logic (Focus 6).
 *
 * Turns trailing ACR history + the account's MACC commitment into a burn-rate,
 * a forward forecast, a projected-exhaustion date, and deterministic alerts.
 */
import type { MACCCommitment } from './types'
import type {
  ConsumptionPlan,
  ConsumptionDataPoint,
  ConsumptionAlert,
} from './fy27-types'

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_MONTH = 30 * MS_PER_DAY

export interface BuildConsumptionPlanOptions {
  /** How many trailing months to average the burn rate over. Default 3. */
  burnWindowMonths?: number
  /** How many months to project forward. Default 6. */
  forecastMonths?: number
  /** Alert if forecast over-/under-runs the commitment by this %. Default 10. */
  overconsumptionThresholdPct?: number
  now?: number
}

/** Average ACR over the trailing window (falls back to all history). */
function computeBurnRate(history: ConsumptionDataPoint[], windowMonths: number): number {
  const actuals = history.filter((h) => !h.projected)
  if (actuals.length === 0) return 0
  const window = actuals.slice(-Math.max(1, windowMonths))
  const sum = window.reduce((acc, p) => acc + p.acr, 0)
  return sum / window.length
}

function nextPeriodLabel(lastLabel: string | undefined, index: number): string {
  // Best-effort: if the label looks like "FY26-M03" or "2026-03" we still just
  // append a forward index so the forecast is readable without date parsing.
  if (!lastLabel) return `+${index}m`
  return `${lastLabel}+${index}`
}

export function buildConsumptionPlan(
  accountId: string,
  history: ConsumptionDataPoint[],
  commitment: MACCCommitment | undefined,
  options: BuildConsumptionPlanOptions = {},
): ConsumptionPlan {
  const now = options.now ?? Date.now()
  const burnWindowMonths = options.burnWindowMonths ?? 3
  const forecastMonths = options.forecastMonths ?? 6
  const overconsumptionThresholdPct = options.overconsumptionThresholdPct ?? 10

  const actuals = history.filter((h) => !h.projected)
  const burnRatePerMonth = computeBurnRate(history, burnWindowMonths)
  const currentMonthlyACR = actuals.length ? actuals[actuals.length - 1].acr : 0

  // Forward projection at a flat burn rate.
  const forecast: ConsumptionDataPoint[] = []
  const lastLabel = actuals.length ? actuals[actuals.length - 1].period : undefined
  for (let i = 1; i <= forecastMonths; i++) {
    forecast.push({ period: nextPeriodLabel(lastLabel, i), acr: burnRatePerMonth, projected: true })
  }

  const alerts: ConsumptionAlert[] = []
  let projectedExhaustionDate: number | undefined
  let renewalDate: number | undefined

  if (commitment) {
    renewalDate = commitment.endDate
    if (burnRatePerMonth > 0 && commitment.remainingBalance > 0) {
      const monthsToExhaust = commitment.remainingBalance / burnRatePerMonth
      projectedExhaustionDate = now + monthsToExhaust * MS_PER_MONTH

      const daysToExhaust = (projectedExhaustionDate - now) / MS_PER_DAY
      if (daysToExhaust <= 60) {
        alerts.push({
          id: genId('alert'),
          severity: 'critical',
          message: `MACC balance projected to exhaust in ~${Math.round(daysToExhaust)} days at current burn. Plan a renewal / expansion conversation.`,
        })
      }

      // Over-consumption: exhausts before the commitment end date.
      if (commitment.endDate && projectedExhaustionDate < commitment.endDate) {
        const overPct = ((commitment.endDate - projectedExhaustionDate) / MS_PER_MONTH) * (burnRatePerMonth / Math.max(commitment.remainingBalance, 1)) * 100
        if (daysToExhaust > 60) {
          alerts.push({
            id: genId('alert'),
            severity: 'warning',
            message: `Projected to exhaust MACC before commitment end (${Math.max(1, Math.round(overPct))}% ahead). Consider expansion.`,
          })
        }
      }

      // Under-consumption: commitment won't be consumed by the end date.
      if (commitment.endDate) {
        const monthsToEnd = Math.max(0, (commitment.endDate - now) / MS_PER_MONTH)
        const projectedSpendToEnd = burnRatePerMonth * monthsToEnd
        const threshold = commitment.remainingBalance * (1 - overconsumptionThresholdPct / 100)
        if (projectedSpendToEnd < threshold) {
          const shortfall = commitment.remainingBalance - projectedSpendToEnd
          alerts.push({
            id: genId('alert'),
            severity: 'warning',
            message: `Projected under-consumption: ~$${Math.round(shortfall).toLocaleString()} of MACC at risk of not being consumed by commitment end. Accelerate consumption plays.`,
          })
        }
      }
    } else if (burnRatePerMonth === 0) {
      alerts.push({
        id: genId('alert'),
        severity: 'info',
        message: 'No trailing consumption recorded. Add ACR history to enable burn-down forecasting.',
      })
    }
  } else {
    alerts.push({
      id: genId('alert'),
      severity: 'info',
      message: 'No MACC commitment on file for this account. Add a commitment to enable burn / renewal planning.',
    })
  }

  return {
    id: genId('cplan'),
    accountId,
    history: actuals,
    forecast,
    currentMonthlyACR,
    burnRatePerMonth,
    projectedExhaustionDate,
    renewalDate,
    overconsumptionThresholdPct,
    alerts,
    updatedAt: now,
  }
}

/** True when the plan shows healthy consumption (no warning/critical alerts). */
export function isConsumptionOnTrack(plan: Pick<ConsumptionPlan, 'alerts'>): boolean {
  return !plan.alerts.some((a) => a.severity === 'warning' || a.severity === 'critical')
}
