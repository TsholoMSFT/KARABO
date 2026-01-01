import type {
  CostOfInaction,
  ValueDriver,
  PLImpactSummary,
  InvestmentAnalysis,
  SensitivityScenario,
} from './types'

/**
 * Calculate total annual Cost of Inaction (COI)
 */
export function calculateTotalCOI(coi: CostOfInaction): number {
  const directAnnual = coi.directCosts.recurring * 12
  const opportunityAnnual = coi.opportunityCosts.recurring * 12
  const riskAnnual =
    coi.riskCosts.recurring * 12 * (coi.riskCosts.recurringProbability / 100)

  return (
    coi.directCosts.oneTime +
    coi.opportunityCosts.oneTime +
    coi.riskCosts.oneTime * (coi.riskCosts.oneTimeProbability / 100) +
    directAnnual +
    opportunityAnnual +
    riskAnnual
  )
}

/**
 * Calculate total annual value from value drivers
 */
export function calculateTotalAnnualValue(valueDrivers: ValueDriver[]): number {
  return valueDrivers.reduce((total, driver) => {
    let annualValue = driver.value

    // Convert to annual
    if (driver.period === 'month') {
      annualValue *= 12
    } else if (driver.period === 'quarter') {
      annualValue *= 4
    }
    // one-time and year stay as-is

    return total + annualValue
  }, 0)
}

/**
 * Calculate risk-adjusted value (conservative 80% adjustment)
 */
export function calculateRiskAdjustedValue(totalAnnualValue: number): number {
  return totalAnnualValue * 0.8
}

/**
 * Calculate payback period in months
 * @param investment - Total upfront investment
 * @param annualBenefit - Total annual benefit
 * @returns Payback period in months
 */
export function calculatePaybackPeriod(
  investment: number,
  annualBenefit: number
): number {
  if (annualBenefit <= 0) return Infinity
  return (investment / annualBenefit) * 12
}

/**
 * Calculate Net Present Value (NPV)
 * @param investment - Initial investment (negative)
 * @param annualBenefit - Annual benefit for 3 years
 * @param discountRate - Discount rate (e.g., 0.10 for 10%)
 * @returns NPV
 */
export function calculateNPV(
  investment: number,
  annualBenefit: number,
  discountRate: number = 0.1
): number {
  let npv = -investment

  for (let year = 1; year <= 3; year++) {
    npv += annualBenefit / Math.pow(1 + discountRate, year)
  }

  return npv
}

/**
 * Calculate Internal Rate of Return (IRR) - Simplified approximation
 * Uses iterative approach to find the rate where NPV = 0
 * @param investment - Initial investment
 * @param annualBenefit - Annual benefit for 3 years
 * @returns IRR as percentage
 */
export function calculateIRR(
  investment: number,
  annualBenefit: number
): number {
  if (investment <= 0 || annualBenefit <= 0) return 0

  // Binary search for IRR
  let low = 0
  let high = 1 // Start with 100% max
  let irr = 0.1

  for (let i = 0; i < 100; i++) {
    irr = (low + high) / 2
    const npv = calculateNPV(investment, annualBenefit, irr)

    if (Math.abs(npv) < 0.01) break // Close enough

    if (npv > 0) {
      low = irr
    } else {
      high = irr
    }
  }

  return irr * 100 // Return as percentage
}

/**
 * Calculate 3-year ROI
 * @param investment - Total investment
 * @param annualBenefit - Annual benefit
 * @returns ROI as percentage
 */
export function calculateROI(
  investment: number,
  annualBenefit: number
): number {
  if (investment <= 0) return 0
  const totalBenefit = annualBenefit * 3
  return ((totalBenefit - investment) / investment) * 100
}

/**
 * Calculate P&L Impact Summary
 * Simplified model: assumes benefits flow to operating income
 */
export function calculatePLImpact(
  annualBenefit: number,
  investment: number
): PLImpactSummary {
  // Simplified model: 
  // - Year 1: Full investment in OPEX, 50% of benefits realized
  // - Year 2: Full benefits, no additional investment
  // - Year 3: Full benefits, no additional investment

  const year1Benefit = annualBenefit * 0.5
  const year2Benefit = annualBenefit
  const year3Benefit = annualBenefit

  return {
    year1: {
      revenueImpact: year1Benefit * 0.6, // 60% flows to revenue
      cogsImpact: year1Benefit * 0.1, // 10% COGS reduction
      grossMarginImpact: year1Benefit * 0.7,
      opexImpact: year1Benefit * 0.3 - investment, // 30% opex savings minus investment
      ebitImpact: year1Benefit - investment,
    },
    year2: {
      revenueImpact: year2Benefit * 0.6,
      cogsImpact: year2Benefit * 0.1,
      grossMarginImpact: year2Benefit * 0.7,
      opexImpact: year2Benefit * 0.3,
      ebitImpact: year2Benefit,
    },
    year3: {
      revenueImpact: year3Benefit * 0.6,
      cogsImpact: year3Benefit * 0.1,
      grossMarginImpact: year3Benefit * 0.7,
      opexImpact: year3Benefit * 0.3,
      ebitImpact: year3Benefit,
    },
    total: {
      revenueImpact: (year1Benefit + year2Benefit + year3Benefit) * 0.6,
      cogsImpact: (year1Benefit + year2Benefit + year3Benefit) * 0.1,
      grossMarginImpact: (year1Benefit + year2Benefit + year3Benefit) * 0.7,
      opexImpact: (year1Benefit + year2Benefit + year3Benefit) * 0.3 - investment,
      ebitImpact: year1Benefit + year2Benefit + year3Benefit - investment,
    },
  }
}

/**
 * Generate full investment analysis
 */
export function generateInvestmentAnalysis(
  investment: number,
  annualBenefit: number
): InvestmentAnalysis {
  return {
    totalInvestmentYear1: investment,
    totalAnnualBenefit: annualBenefit,
    simplePaybackMonths: calculatePaybackPeriod(investment, annualBenefit),
    roi3Year: calculateROI(investment, annualBenefit),
    npv10Percent: calculateNPV(investment, annualBenefit, 0.1),
    irr: calculateIRR(investment, annualBenefit),
  }
}

/**
 * Generate sensitivity analysis (70%, 100%, 130% scenarios)
 */
export function generateSensitivityAnalysis(
  investment: number,
  annualBenefit: number
): SensitivityScenario {
  const conservative = {
    annualBenefit: annualBenefit * 0.7,
    paybackMonths: calculatePaybackPeriod(investment, annualBenefit * 0.7),
    roi3Year: calculateROI(investment, annualBenefit * 0.7),
    npv: calculateNPV(investment, annualBenefit * 0.7, 0.1),
  }

  const base = {
    annualBenefit: annualBenefit,
    paybackMonths: calculatePaybackPeriod(investment, annualBenefit),
    roi3Year: calculateROI(investment, annualBenefit),
    npv: calculateNPV(investment, annualBenefit, 0.1),
  }

  const optimistic = {
    annualBenefit: annualBenefit * 1.3,
    paybackMonths: calculatePaybackPeriod(investment, annualBenefit * 1.3),
    roi3Year: calculateROI(investment, annualBenefit * 1.3),
    npv: calculateNPV(investment, annualBenefit * 1.3, 0.1),
  }

  return { conservative, base, optimistic }
}

/**
 * Format currency with locale support
 */
export function formatCurrency(
  amount: number,
  currency: 'GBP' | 'USD' | 'EUR' = 'GBP'
): string {
  const locale = currency === 'GBP' ? 'en-GB' : currency === 'EUR' ? 'de-DE' : 'en-US'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format months to readable string
 */
export function formatMonths(months: number): string {
  if (!isFinite(months)) return 'N/A'
  if (months < 12) return `${Math.round(months)} months`
  const years = Math.floor(months / 12)
  const remainingMonths = Math.round(months % 12)
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
  return `${years}y ${remainingMonths}m`
}
