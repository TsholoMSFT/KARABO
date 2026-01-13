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

// ============================================================================
// ROI AUTO-POPULATION FROM USE CASE & COMPANY DATA
// ============================================================================

/**
 * Industry multipliers for value estimation
 */
export const INDUSTRY_VALUE_MULTIPLIERS: Record<string, number> = {
  'financial-services': 1.5,
  'telecommunications': 1.3,
  'healthcare': 1.2,
  'energy': 1.4,
  'manufacturing': 1.1,
  'retail': 1.0,
  'government': 0.9,
  'education': 0.8,
  'general': 1.0,
}

/**
 * Complexity to effort weeks mapping
 */
export const COMPLEXITY_EFFORT_WEEKS: Record<string, number> = {
  'low': 4,
  'medium': 8,
  'high': 16,
  'very-high': 24,
}

/**
 * Default cost per person-week (USD)
 */
export const DEFAULT_COST_PER_WEEK_USD = 8000

/**
 * Context for auto-populating ROI inputs
 */
export interface ROIAutoContext {
  // Use case data
  useCase?: {
    title?: string
    impact?: number
    feasibility?: number
    implementationComplexity?: { level: 'low' | 'medium' | 'high' | 'very-high' }
    aiEffortEstimate?: { effortWeeks: number }
    coiEstimate?: {
      directCosts?: number
      opportunityCosts?: number
      riskCosts?: number
      totalAnnualCOI?: number
    }
    manualCOI?: {
      directCosts?: number
      opportunityCosts?: number
      riskCosts?: number
      totalAnnualCOI?: number
    }
    manualExpectedValue?: {
      revenueImpact?: number
      costSavings?: number
      riskMitigation?: number
      implementationCost?: number
    }
    referenceArchitecture?: string
  }
  // Company data
  industry?: string
  companyName?: string
  annualRevenue?: number
}

/**
 * Aggregation context for multiple use cases
 */
export interface ROIAggregateContext {
  useCases: ROIAutoContext['useCase'][]
  industry?: string
  companyName?: string
  annualRevenue?: number
}

/**
 * ROI inputs structure
 */
export interface InferredROIInputs {
  revenueImpact: number
  costSavings: number
  riskMitigation: number
  implementationCost: number
  notes: string
  confidence: 'high' | 'medium' | 'low'
  sources: string[]
}

/**
 * Infer ROI inputs from a single use case and company context
 */
export function inferROIFromContext(context: ROIAutoContext): InferredROIInputs {
  const { useCase, industry, annualRevenue } = context
  const sources: string[] = []
  let confidence: 'high' | 'medium' | 'low' = 'low'

  // 1. Calculate implementation cost
  let implementationCost = 0
  if (useCase?.manualExpectedValue?.implementationCost && useCase.manualExpectedValue.implementationCost > 0) {
    implementationCost = useCase.manualExpectedValue.implementationCost
    sources.push('Implementation cost from manual input')
    confidence = 'high'
  } else if (useCase?.aiEffortEstimate?.effortWeeks && useCase.aiEffortEstimate.effortWeeks > 0) {
    implementationCost = useCase.aiEffortEstimate.effortWeeks * DEFAULT_COST_PER_WEEK_USD
    sources.push(`AI effort estimate: ${useCase.aiEffortEstimate.effortWeeks} weeks × $${DEFAULT_COST_PER_WEEK_USD.toLocaleString()}/week`)
    confidence = 'medium'
  } else if (useCase?.implementationComplexity?.level) {
    const weeks = COMPLEXITY_EFFORT_WEEKS[useCase.implementationComplexity.level] || 8
    implementationCost = weeks * DEFAULT_COST_PER_WEEK_USD
    sources.push(`Complexity (${useCase.implementationComplexity.level}): ${weeks} weeks × $${DEFAULT_COST_PER_WEEK_USD.toLocaleString()}/week`)
  } else {
    // Default medium complexity
    implementationCost = 8 * DEFAULT_COST_PER_WEEK_USD
    sources.push('Default estimate (medium complexity)')
  }

  // 2. Calculate annual value from COI or impact scoring
  let revenueImpact = 0
  let costSavings = 0
  let riskMitigation = 0

  // Priority 1: Use manual expected value if available
  if (useCase?.manualExpectedValue) {
    const ev = useCase.manualExpectedValue
    if ((ev.revenueImpact || 0) + (ev.costSavings || 0) + (ev.riskMitigation || 0) > 0) {
      revenueImpact = ev.revenueImpact || 0
      costSavings = ev.costSavings || 0
      riskMitigation = ev.riskMitigation || 0
      sources.push('Annual value from manual input')
      confidence = 'high'
    }
  }

  // Priority 2: Use manual COI if no expected value
  if (revenueImpact + costSavings + riskMitigation === 0 && useCase?.manualCOI) {
    const coi = useCase.manualCOI
    if ((coi.directCosts || 0) + (coi.opportunityCosts || 0) + (coi.riskCosts || 0) > 0) {
      revenueImpact = coi.opportunityCosts || 0
      costSavings = coi.directCosts || 0
      riskMitigation = coi.riskCosts || 0
      sources.push('Annual value derived from Cost of Inaction')
      confidence = confidence === 'low' ? 'medium' : confidence
    }
  }

  // Priority 3: Use AI COI estimate
  if (revenueImpact + costSavings + riskMitigation === 0 && useCase?.coiEstimate) {
    const coi = useCase.coiEstimate
    if ((coi.directCosts || 0) + (coi.opportunityCosts || 0) + (coi.riskCosts || 0) > 0) {
      revenueImpact = coi.opportunityCosts || 0
      costSavings = coi.directCosts || 0
      riskMitigation = coi.riskCosts || 0
      sources.push('Annual value from AI-estimated Cost of Inaction')
    }
  }

  // Priority 4: Estimate from impact score and company data
  if (revenueImpact + costSavings + riskMitigation === 0) {
    const impactScore = useCase?.impact || 5
    const industryMultiplier = INDUSTRY_VALUE_MULTIPLIERS[industry || 'general'] || 1.0

    let baseValue: number
    if (annualRevenue && annualRevenue > 0) {
      // Use 0.1% to 1% of revenue based on impact score (1-10)
      baseValue = annualRevenue * (0.001 * impactScore) * industryMultiplier
      sources.push(`Revenue-based estimate ($${(annualRevenue / 1e9).toFixed(1)}B × ${(0.1 * impactScore).toFixed(1)}%)`)
    } else {
      // Fallback baseline: $500K adjusted by industry and impact
      baseValue = 500000 * industryMultiplier * (impactScore / 5)
      sources.push(`Baseline estimate (impact ${impactScore}/10 × ${industryMultiplier}x industry)`)
    }

    revenueImpact = Math.round(baseValue * 0.4)
    costSavings = Math.round(baseValue * 0.4)
    riskMitigation = Math.round(baseValue * 0.2)
  }

  // Build notes
  const notes = [
    `Auto-populated for: ${useCase?.title || 'Use Case'}`,
    `Industry: ${industry || 'General'} | Confidence: ${confidence}`,
    '',
    'Sources:',
    ...sources.map(s => `• ${s}`),
    '',
    '⚠️ Review and adjust values based on stakeholder input.',
  ].join('\n')

  return {
    revenueImpact,
    costSavings,
    riskMitigation,
    implementationCost,
    notes,
    confidence,
    sources,
  }
}

/**
 * Aggregate ROI inputs from multiple use cases
 */
export function inferAggregateROI(context: ROIAggregateContext): InferredROIInputs {
  const { useCases, industry, companyName, annualRevenue } = context
  
  if (!useCases || useCases.length === 0) {
    return {
      revenueImpact: 0,
      costSavings: 0,
      riskMitigation: 0,
      implementationCost: 0,
      notes: 'No use cases selected for aggregation.',
      confidence: 'low',
      sources: [],
    }
  }

  // Aggregate all use cases
  const results = useCases
    .filter((uc): uc is NonNullable<typeof uc> => uc !== undefined)
    .map(uc => inferROIFromContext({ useCase: uc, industry, companyName, annualRevenue }))

  const aggregated: InferredROIInputs = {
    revenueImpact: results.reduce((sum, r) => sum + r.revenueImpact, 0),
    costSavings: results.reduce((sum, r) => sum + r.costSavings, 0),
    riskMitigation: results.reduce((sum, r) => sum + r.riskMitigation, 0),
    implementationCost: results.reduce((sum, r) => sum + r.implementationCost, 0),
    notes: '',
    confidence: 'medium',
    sources: [],
  }

  // Determine overall confidence
  const confidenceLevels = results.map(r => r.confidence)
  if (confidenceLevels.every(c => c === 'high')) {
    aggregated.confidence = 'high'
  } else if (confidenceLevels.some(c => c === 'low')) {
    aggregated.confidence = 'low'
  }

  // Build notes
  aggregated.notes = [
    `📊 Aggregated ROI for ${useCases.length} use cases`,
    companyName ? `Company: ${companyName}` : '',
    `Industry: ${industry || 'General'} | Confidence: ${aggregated.confidence}`,
    '',
    'Use cases included:',
    ...useCases.slice(0, 5).map((uc, i) => `${i + 1}. ${uc?.title || 'Unnamed'}`),
    useCases.length > 5 ? `... and ${useCases.length - 5} more` : '',
    '',
    '⚠️ Aggregated values assume sequential implementation.',
  ].filter(Boolean).join('\n')

  return aggregated
}
