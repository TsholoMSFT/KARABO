/**
 * Financial Mapping Utilities
 * 
 * This module bridges operational discovery metrics to three-statement financial impact.
 * - COI to Value Drivers conversion
 * - Revenue metric chain calculations
 * - Cost metric chain calculations with FTE equivalents
 * - Balance Sheet & Cash Flow impact calculations
 * - Statement mapping aggregation
 */

import type {
  CostOfInaction,
  ValueDriver,
  RevenueImpactDriver,
  RevenueDriverType,
  CostImpactDriver,
  CostDriverType,
  BalanceSheetCashFlowDriver,
  BalanceSheetDriverType,
  MetricHierarchy,
  SolutionScopeStageData,
} from './types'

// ============================================================================
// INDUSTRY BENCHMARK HINTS (for placeholder values)
// ============================================================================

export const INDUSTRY_BENCHMARKS = {
  conversionRates: {
    general: { min: 2, max: 5, typical: 3, hint: '2-5% typical B2B' },
    healthcare: { min: 3, max: 8, typical: 5, hint: '3-8% healthcare' },
    'financial-services': { min: 1, max: 4, typical: 2.5, hint: '1-4% financial services' },
    manufacturing: { min: 5, max: 15, typical: 10, hint: '5-15% manufacturing' },
    retail: { min: 2, max: 4, typical: 3, hint: '2-4% retail' },
  },
  churnRates: {
    general: { min: 5, max: 15, typical: 10, hint: '5-15% annual typical' },
    saas: { min: 5, max: 7, typical: 6, hint: '5-7% SaaS' },
    enterprise: { min: 3, max: 8, typical: 5, hint: '3-8% enterprise' },
  },
  fullyLoadedCosts: {
    junior: { min: 40, max: 60, typical: 50, hint: '$40-60/hr junior' },
    senior: { min: 80, max: 120, typical: 100, hint: '$80-120/hr senior' },
    specialist: { min: 120, max: 200, typical: 150, hint: '$120-200/hr specialist' },
  },
  dso: {
    general: { min: 30, max: 60, typical: 45, hint: '30-60 days typical' },
    enterprise: { min: 45, max: 90, typical: 60, hint: '45-90 days enterprise' },
  },
  annualHoursPerFTE: 1880, // 47 weeks × 40 hours
}

// ============================================================================
// COI TO VALUE DRIVERS CONVERSION
// ============================================================================

/**
 * Convert Cost of Inaction (Stage 1) to Value Drivers for Stage 5 auto-population
 * These serve as baseline values that users can edit
 */
export function coiToValueDrivers(coi: CostOfInaction): ValueDriver[] {
  const drivers: ValueDriver[] = []

  // Direct Costs → Cost savings
  if (coi.directCosts.oneTime > 0) {
    drivers.push({
      id: 'coi-direct-onetime',
      category: 'cost',
      driver: 'Direct cost savings (one-time)',
      value: coi.directCosts.oneTime,
      period: 'one-time',
      sourceStage: 'Stage 1 COI',
      isFromCOI: true,
    })
  }
  if (coi.directCosts.recurring > 0) {
    drivers.push({
      id: 'coi-direct-recurring',
      category: 'cost',
      driver: 'Direct cost savings (monthly)',
      value: coi.directCosts.recurring,
      period: 'month',
      sourceStage: 'Stage 1 COI',
      isFromCOI: true,
    })
  }

  // Opportunity Costs → Revenue opportunity (lost revenue = potential revenue gain)
  if (coi.opportunityCosts.oneTime > 0) {
    drivers.push({
      id: 'coi-opportunity-onetime',
      category: 'revenue',
      driver: 'Revenue opportunity (one-time)',
      value: coi.opportunityCosts.oneTime,
      period: 'one-time',
      sourceStage: 'Stage 1 COI',
      isFromCOI: true,
    })
  }
  if (coi.opportunityCosts.recurring > 0) {
    drivers.push({
      id: 'coi-opportunity-recurring',
      category: 'revenue',
      driver: 'Revenue opportunity (monthly)',
      value: coi.opportunityCosts.recurring,
      period: 'month',
      sourceStage: 'Stage 1 COI',
      isFromCOI: true,
    })
  }

  // Risk Costs → Risk avoided (probability-weighted)
  if (coi.riskCosts.oneTime > 0 && coi.riskCosts.oneTimeProbability > 0) {
    const riskAdjusted = coi.riskCosts.oneTime * (coi.riskCosts.oneTimeProbability / 100)
    drivers.push({
      id: 'coi-risk-onetime',
      category: 'risk',
      driver: 'Risk avoided (one-time, probability-weighted)',
      value: riskAdjusted,
      period: 'one-time',
      sourceStage: 'Stage 1 COI',
      isFromCOI: true,
    })
  }
  if (coi.riskCosts.recurring > 0 && coi.riskCosts.recurringProbability > 0) {
    const riskAdjusted = coi.riskCosts.recurring * (coi.riskCosts.recurringProbability / 100)
    drivers.push({
      id: 'coi-risk-recurring',
      category: 'risk',
      driver: 'Risk avoided (monthly, probability-weighted)',
      value: riskAdjusted,
      period: 'month',
      sourceStage: 'Stage 1 COI',
      isFromCOI: true,
    })
  }

  return drivers
}

/**
 * Map COI to pre-populated Revenue Impact Drivers
 */
export function coiToRevenueImpact(coi: CostOfInaction): Partial<RevenueImpactDriver>[] {
  const drivers: Partial<RevenueImpactDriver>[] = []
  
  const opportunityAnnual = coi.opportunityCosts.oneTime + (coi.opportunityCosts.recurring * 12)
  
  if (opportunityAnnual > 0) {
    // Suggest as customer acquisition or upsell based on magnitude
    drivers.push({
      id: 'coi-revenue-baseline',
      type: 'customer-acquisition',
      enabled: true,
      calculatedAnnualValue: opportunityAnnual,
      notes: `Baseline from Stage 1 COI opportunity costs. Review and refine metric chain inputs.`,
    })
  }
  
  return drivers
}

/**
 * Map COI to pre-populated Cost Impact Drivers
 */
export function coiToCostImpact(coi: CostOfInaction): Partial<CostImpactDriver>[] {
  const drivers: Partial<CostImpactDriver>[] = []
  
  const directAnnual = coi.directCosts.oneTime + (coi.directCosts.recurring * 12)
  
  if (directAnnual > 0) {
    // Suggest as labour efficiency or automation based on context
    drivers.push({
      id: 'coi-cost-baseline',
      type: 'labour-efficiency',
      enabled: true,
      calculatedAnnualValue: directAnnual,
      fteEquivalent: directAnnual / (INDUSTRY_BENCHMARKS.fullyLoadedCosts.senior.typical * INDUSTRY_BENCHMARKS.annualHoursPerFTE),
      notes: `Baseline from Stage 1 COI direct costs. Review and refine metric chain inputs.`,
    })
  }
  
  return drivers
}

// ============================================================================
// REVENUE IMPACT CALCULATIONS (Metric Chains)
// ============================================================================

/**
 * Calculate Customer Acquisition Revenue
 * Formula: Leads × Conversion Rate × Average Deal Size
 */
export function calculateCustomerAcquisitionRevenue(
  leads: number,
  conversionRate: number, // percentage
  avgDealSize: number
): number {
  return leads * (conversionRate / 100) * avgDealSize
}

/**
 * Calculate Margin Improvement Revenue
 * Formula: (Price Increase % × Volume) + (Discount Reduction % × Volume)
 */
export function calculateMarginImprovement(
  priceIncrease: number, // percentage
  volume: number,
  basePrice: number,
  discountReduction: number // percentage
): number {
  const priceImpact = volume * basePrice * (priceIncrease / 100)
  const discountImpact = volume * basePrice * (discountReduction / 100)
  return priceImpact + discountImpact
}

/**
 * Calculate Sales Cycle Acceleration Revenue Impact
 * Formula: Pipeline × Win Rate × (Old Cycle Days - New Cycle Days) / 365
 * This represents additional revenue from faster deal closure
 */
export function calculateSalesCycleAcceleration(
  pipelineValue: number,
  winRate: number, // percentage
  currentCycleDays: number,
  newCycleDays: number
): number {
  if (currentCycleDays <= newCycleDays) return 0
  const daysSaved = currentCycleDays - newCycleDays
  const cyclesPerYear = 365 / newCycleDays
  const additionalDeals = (daysSaved / newCycleDays) * cyclesPerYear
  return pipelineValue * (winRate / 100) * (additionalDeals / cyclesPerYear)
}

/**
 * Calculate Churn Reduction Revenue Impact
 * Formula: Customers × (Old Churn - New Churn) × LTV
 */
export function calculateChurnReduction(
  customerCount: number,
  currentChurnRate: number, // percentage annual
  newChurnRate: number, // percentage annual
  customerLTV: number
): number {
  if (currentChurnRate <= newChurnRate) return 0
  const churnReduction = (currentChurnRate - newChurnRate) / 100
  const customersSaved = customerCount * churnReduction
  return customersSaved * customerLTV
}

/**
 * Calculate Upsell/Cross-sell Revenue
 * Formula: Existing Customers × Expansion Rate × ARPU
 */
export function calculateUpsellCrosssell(
  existingCustomers: number,
  expansionRate: number, // percentage
  arpu: number
): number {
  return existingCustomers * (expansionRate / 100) * arpu
}

/**
 * Calculate all revenue drivers and return total
 */
export function calculateRevenueDriver(driver: RevenueImpactDriver): number {
  const { type, inputs } = driver
  
  switch (type) {
    case 'customer-acquisition':
      return calculateCustomerAcquisitionRevenue(
        inputs.leads || 0,
        inputs.conversionRate || 0,
        inputs.avgDealSize || 0
      )
    
    case 'margin-improvement':
      return calculateMarginImprovement(
        inputs.priceIncrease || 0,
        inputs.volume || 0,
        inputs.avgDealSize || 0,
        inputs.discountReduction || 0
      )
    
    case 'sales-cycle':
      return calculateSalesCycleAcceleration(
        inputs.pipelineValue || 0,
        inputs.winRate || 0,
        inputs.currentCycleDays || 0,
        inputs.newCycleDays || 0
      )
    
    case 'churn-reduction':
      return calculateChurnReduction(
        inputs.customerCount || 0,
        inputs.currentChurnRate || 0,
        inputs.newChurnRate || 0,
        inputs.customerLTV || 0
      )
    
    case 'upsell-crosssell':
      return calculateUpsellCrosssell(
        inputs.existingCustomers || 0,
        inputs.expansionRate || 0,
        inputs.arpu || 0
      )
    
    default:
      return 0
  }
}

// ============================================================================
// COST IMPACT CALCULATIONS (with FTE Equivalents)
// ============================================================================

/**
 * Calculate Labour Efficiency Savings
 * Formula: Hours Saved × Fully Loaded Cost × Volume
 * Returns: { value, fteEquivalent }
 */
export function calculateLabourEfficiency(
  hoursSavedPerTask: number,
  fullyLoadedHourlyCost: number,
  tasksPerMonth: number
): { annualValue: number; fteEquivalent: number } {
  const monthlyHoursSaved = hoursSavedPerTask * tasksPerMonth
  const annualHoursSaved = monthlyHoursSaved * 12
  const annualValue = annualHoursSaved * fullyLoadedHourlyCost
  const fteEquivalent = annualHoursSaved / INDUSTRY_BENCHMARKS.annualHoursPerFTE
  
  return { annualValue, fteEquivalent }
}

/**
 * Calculate Error Reduction Savings
 * Formula: (Current Error Rate - New Error Rate) × Volume × Cost per Error
 */
export function calculateErrorReduction(
  currentErrorRate: number, // percentage
  newErrorRate: number, // percentage
  transactionVolume: number,
  costPerError: number
): { annualValue: number; fteEquivalent: number } {
  const errorReduction = (currentErrorRate - newErrorRate) / 100
  const errorsSaved = transactionVolume * 12 * errorReduction
  const annualValue = errorsSaved * costPerError
  
  // Estimate FTE based on avg 2 hours per error resolution
  const hoursPerError = 2
  const fteEquivalent = (errorsSaved * hoursPerError) / INDUSTRY_BENCHMARKS.annualHoursPerFTE
  
  return { annualValue, fteEquivalent }
}

/**
 * Calculate Infrastructure Savings
 * Formula: (Current Monthly - Future Monthly) × 12
 */
export function calculateInfrastructureSavings(
  currentMonthlySpend: number,
  futureMonthlySpend: number
): { annualValue: number; fteEquivalent: number } {
  const annualValue = (currentMonthlySpend - futureMonthlySpend) * 12
  return { annualValue, fteEquivalent: 0 } // No FTE impact
}

/**
 * Calculate Vendor Consolidation Savings
 * Formula: (Vendors × Cost per Vendor) - Consolidated Cost
 */
export function calculateVendorConsolidation(
  vendorCount: number,
  costPerVendor: number,
  consolidatedCost: number
): { annualValue: number; fteEquivalent: number } {
  const currentCost = vendorCount * costPerVendor
  const annualValue = currentCost - consolidatedCost
  
  // Estimate FTE based on vendor management time (40 hrs/vendor/year)
  const hoursPerVendor = 40
  const vendorsReduced = vendorCount - 1 // Consolidating to 1
  const fteEquivalent = (vendorsReduced * hoursPerVendor) / INDUSTRY_BENCHMARKS.annualHoursPerFTE
  
  return { annualValue, fteEquivalent }
}

/**
 * Calculate Automation Savings
 * Formula: (Manual Cost - Automated Cost) × Process Volume
 */
export function calculateAutomationSavings(
  manualCostPerProcess: number,
  automatedCostPerProcess: number,
  processVolume: number
): { annualValue: number; fteEquivalent: number } {
  const savingsPerProcess = manualCostPerProcess - automatedCostPerProcess
  const annualValue = savingsPerProcess * processVolume * 12
  
  // Estimate FTE based on manual hours vs automated
  const avgHoursPerManualProcess = 0.5
  const hoursSaved = processVolume * 12 * avgHoursPerManualProcess * 0.8 // 80% automation
  const fteEquivalent = hoursSaved / INDUSTRY_BENCHMARKS.annualHoursPerFTE
  
  return { annualValue, fteEquivalent }
}

/**
 * Calculate all cost drivers and return totals
 */
export function calculateCostDriver(driver: CostImpactDriver): { annualValue: number; fteEquivalent: number } {
  const { type, inputs } = driver
  
  switch (type) {
    case 'labour-efficiency':
      return calculateLabourEfficiency(
        inputs.hoursSavedPerTask || 0,
        inputs.fullyLoadedHourlyCost || 0,
        inputs.tasksPerMonth || 0
      )
    
    case 'error-reduction':
      return calculateErrorReduction(
        inputs.currentErrorRate || 0,
        inputs.newErrorRate || 0,
        inputs.transactionVolume || 0,
        inputs.costPerError || 0
      )
    
    case 'infrastructure':
      return calculateInfrastructureSavings(
        inputs.currentMonthlySpend || 0,
        inputs.futureMonthlySpend || 0
      )
    
    case 'vendor-consolidation':
      return calculateVendorConsolidation(
        inputs.vendorCount || 0,
        inputs.costPerVendor || 0,
        inputs.consolidatedCost || 0
      )
    
    case 'automation':
      return calculateAutomationSavings(
        inputs.manualCostPerProcess || 0,
        inputs.automatedCostPerProcess || 0,
        inputs.processVolume || 0
      )
    
    default:
      return { annualValue: 0, fteEquivalent: 0 }
  }
}

// ============================================================================
// BALANCE SHEET & CASH FLOW CALCULATIONS
// ============================================================================

/**
 * Calculate DSO Reduction (Days Sales Outstanding) Impact
 * Formula: (Current DSO - New DSO) × Daily Revenue
 * Impact: One-time working capital release
 */
export function calculateDSOReduction(
  currentDSO: number,
  newDSO: number,
  dailyRevenue: number
): { workingCapitalRelease: number; cashFlowImpact: number } {
  const dsoReduction = currentDSO - newDSO
  const workingCapitalRelease = dsoReduction * dailyRevenue
  return { workingCapitalRelease, cashFlowImpact: workingCapitalRelease }
}

/**
 * Calculate Inventory Optimisation (DIO) Impact
 * Formula: (Current DIO - New DIO) × Daily COGS
 */
export function calculateInventoryOptimisation(
  currentDIO: number,
  newDIO: number,
  dailyCOGS: number
): { workingCapitalRelease: number; cashFlowImpact: number } {
  const dioReduction = currentDIO - newDIO
  const workingCapitalRelease = dioReduction * dailyCOGS
  return { workingCapitalRelease, cashFlowImpact: workingCapitalRelease }
}

/**
 * Calculate CapEx Avoidance
 * Returns both avoided CapEx and any shift to OpEx (e.g., cloud)
 */
export function calculateCapExAvoidance(
  avoidedCapEx: number,
  alternativeOpEx: number // Annual OpEx if shifting to subscription model
): { netCapExAvoidance: number; npvImpact: number } {
  // NPV of avoiding CapEx vs annual OpEx over 3 years at 10% discount
  const discountRate = 0.1
  let opExNPV = 0
  for (let year = 1; year <= 3; year++) {
    opExNPV += alternativeOpEx / Math.pow(1 + discountRate, year)
  }
  const npvImpact = avoidedCapEx - opExNPV
  return { netCapExAvoidance: avoidedCapEx, npvImpact }
}

/**
 * Calculate Risk Provision Release
 * Formula: Current Provision × Risk Reduction %
 */
export function calculateRiskProvisionRelease(
  currentProvision: number,
  riskReductionPercent: number
): number {
  return currentProvision * (riskReductionPercent / 100)
}

/**
 * Calculate all balance sheet drivers
 */
export function calculateBalanceSheetDriver(driver: BalanceSheetCashFlowDriver): { value: number; cashFlowImpact: number } {
  const { type, inputs } = driver
  
  switch (type) {
    case 'collections': {
      const result = calculateDSOReduction(
        inputs.currentDSO || 0,
        inputs.newDSO || 0,
        inputs.dailyRevenue || 0
      )
      return { value: result.workingCapitalRelease, cashFlowImpact: result.cashFlowImpact }
    }
    
    case 'inventory': {
      const result = calculateInventoryOptimisation(
        inputs.currentDIO || 0,
        inputs.newDIO || 0,
        inputs.dailyCOGS || 0
      )
      return { value: result.workingCapitalRelease, cashFlowImpact: result.cashFlowImpact }
    }
    
    case 'capex-avoidance': {
      const result = calculateCapExAvoidance(
        inputs.avoidedCapEx || 0,
        inputs.alternativeOpEx || 0
      )
      return { value: result.netCapExAvoidance, cashFlowImpact: result.netCapExAvoidance }
    }
    
    case 'risk-provision': {
      const value = calculateRiskProvisionRelease(
        inputs.currentProvision || 0,
        inputs.riskReductionPercent || 0
      )
      return { value, cashFlowImpact: 0 } // Provision release doesn't affect cash
    }
    
    default:
      return { value: 0, cashFlowImpact: 0 }
  }
}

// ============================================================================
// STATEMENT MAPPING & AGGREGATION
// ============================================================================

/**
 * Map all impact drivers to Income Statement lines
 */
export function mapToIncomeStatement(data: SolutionScopeStageData): {
  revenue: number
  cogs: number
  opex: number
} {
  let revenue = 0
  let cogs = 0
  let opex = 0
  
  // Revenue from revenue drivers
  if (data.revenueImpact?.drivers) {
    revenue = data.revenueImpact.drivers
      .filter(d => d.enabled)
      .reduce((sum, d) => sum + (d.calculatedAnnualValue || 0), 0)
  }
  
  // Cost drivers split between COGS and OpEx
  if (data.costImpact?.drivers) {
    data.costImpact.drivers
      .filter(d => d.enabled)
      .forEach(driver => {
        if (driver.plLine === 'cogs') {
          cogs += driver.calculatedAnnualValue || 0
        } else {
          opex += driver.calculatedAnnualValue || 0
        }
      })
  }
  
  return { revenue, cogs, opex }
}

/**
 * Generate three-year P&L projection from Stage 5 data
 */
export function generateThreeYearProjection(
  data: SolutionScopeStageData,
  investment: number
): {
  year1: { revenue: number; cogs: number; opex: number; ebit: number }
  year2: { revenue: number; cogs: number; opex: number; ebit: number }
  year3: { revenue: number; cogs: number; opex: number; ebit: number }
} {
  const { revenue, cogs, opex } = mapToIncomeStatement(data)
  
  // Year 1: 50% realization, full investment
  const year1 = {
    revenue: revenue * 0.5,
    cogs: cogs * 0.5,
    opex: opex * 0.5 - investment,
    ebit: (revenue - cogs - opex) * 0.5 - investment,
  }
  
  // Year 2-3: Full realization
  const year2 = {
    revenue,
    cogs,
    opex,
    ebit: revenue - cogs - opex,
  }
  
  const year3 = { ...year2 }
  
  return { year1, year2, year3 }
}

// ============================================================================
// METRIC HIERARCHY HELPERS
// ============================================================================

export const METRIC_HIERARCHY_TEMPLATES: Record<string, MetricHierarchy> = {
  'revenue-growth': {
    strategicOutcome: 'Revenue Growth & Market Share',
    financialMetrics: ['Revenue Growth Rate', 'Market Share %', 'Customer Acquisition Cost'],
    operationalMetrics: ['Lead Conversion Rate', 'Sales Cycle Days', 'Win Rate'],
    activityMetrics: ['Leads Generated', 'Demos Completed', 'Proposals Sent'],
  },
  'cost-efficiency': {
    strategicOutcome: 'Operational Excellence & Cost Leadership',
    financialMetrics: ['EBITDA Margin', 'OpEx Ratio', 'Cost per Transaction'],
    operationalMetrics: ['Process Cycle Time', 'Error Rate', 'Utilisation Rate'],
    activityMetrics: ['Transactions Processed', 'Hours per Task', 'Tickets Resolved'],
  },
  'customer-experience': {
    strategicOutcome: 'Customer Satisfaction & Retention',
    financialMetrics: ['Customer Lifetime Value', 'Churn Rate', 'Net Revenue Retention'],
    operationalMetrics: ['NPS Score', 'First Response Time', 'Resolution Rate'],
    activityMetrics: ['Support Tickets', 'Survey Responses', 'Escalations'],
  },
  'risk-management': {
    strategicOutcome: 'Risk Reduction & Compliance',
    financialMetrics: ['Provision for Losses', 'Compliance Cost', 'Insurance Premiums'],
    operationalMetrics: ['Incident Rate', 'Audit Findings', 'SLA Compliance'],
    activityMetrics: ['Audits Completed', 'Controls Tested', 'Incidents Logged'],
  },
}

/**
 * Create default empty metric hierarchy
 */
export function createEmptyMetricHierarchy(): MetricHierarchy {
  return {
    strategicOutcome: '',
    financialMetrics: [],
    operationalMetrics: [],
    activityMetrics: [],
  }
}

// ============================================================================
// DRIVER TYPE LABELS & DESCRIPTIONS
// ============================================================================

export const REVENUE_DRIVER_INFO: Record<RevenueDriverType, { label: string; description: string; plLine: string }> = {
  'customer-acquisition': {
    label: 'More Customers',
    description: 'New customer acquisition through improved lead generation and conversion',
    plLine: 'Revenue',
  },
  'margin-improvement': {
    label: 'Higher Prices/Margins',
    description: 'Improved pricing power or reduced discounting',
    plLine: 'Revenue & Gross Margin',
  },
  'sales-cycle': {
    label: 'Faster Sales Cycle',
    description: 'Accelerated deal closure enabling more revenue in same period',
    plLine: 'Revenue (timing)',
  },
  'churn-reduction': {
    label: 'Reduced Churn',
    description: 'Improved customer retention extending lifetime value',
    plLine: 'Revenue (retention)',
  },
  'upsell-crosssell': {
    label: 'Upsell/Cross-sell',
    description: 'Expansion revenue from existing customer base',
    plLine: 'Revenue',
  },
}

export const COST_DRIVER_INFO: Record<CostDriverType, { label: string; description: string; plLine: string }> = {
  'labour-efficiency': {
    label: 'Labour Efficiency',
    description: 'Time savings through process improvement or automation',
    plLine: 'COGS or OpEx',
  },
  'error-reduction': {
    label: 'Error Reduction',
    description: 'Reduced rework and correction costs from improved quality',
    plLine: 'COGS (rework) or OpEx',
  },
  'infrastructure': {
    label: 'Infrastructure Savings',
    description: 'Reduced infrastructure costs (cloud, hardware, facilities)',
    plLine: 'OpEx (cloud) or CapEx',
  },
  'vendor-consolidation': {
    label: 'Vendor Consolidation',
    description: 'Reduced vendor management costs and better pricing',
    plLine: 'OpEx',
  },
  'automation': {
    label: 'Process Automation',
    description: 'Replacement of manual processes with automated workflows',
    plLine: 'COGS or OpEx',
  },
}

export const BALANCE_SHEET_DRIVER_INFO: Record<BalanceSheetDriverType, { label: string; description: string; statementLine: string }> = {
  'collections': {
    label: 'Faster Collections',
    description: 'Reduced Days Sales Outstanding (DSO) releasing working capital',
    statementLine: 'Cash Flow (Op) / Working Capital',
  },
  'inventory': {
    label: 'Inventory Optimisation',
    description: 'Reduced inventory days freeing up cash',
    statementLine: 'Balance Sheet / Cash Flow',
  },
  'capex-avoidance': {
    label: 'CapEx Avoidance',
    description: 'Avoided capital purchases (potentially shifted to OpEx)',
    statementLine: 'Cash Flow (Inv) / Balance Sheet',
  },
  'risk-provision': {
    label: 'Risk Provision Release',
    description: 'Reduction in required provisions due to lower risk',
    statementLine: 'Balance Sheet / P&L (one-time)',
  },
}
