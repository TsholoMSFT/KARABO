/**
 * Industry Benchmark Data
 * 
 * Provides financial benchmarks per industry for COI/ROI estimation
 * when no manual financials or ticker data is available.
 * All figures are approximate industry medians as of 2025.
 */

import type { Industry, IndustryBenchmark } from './types'

export const INDUSTRY_BENCHMARKS: Record<Industry, IndustryBenchmark> = {
  general: {
    industry: 'general',
    revenuePerEmployee: { min: 150_000, median: 250_000, max: 500_000 },
    itSpendPercent: { min: 3, median: 5, max: 8 },
    operationalCostPercent: 65,
    source: 'Gartner / Deloitte industry averages 2025',
    year: 2025,
  },
  healthcare: {
    industry: 'healthcare',
    revenuePerEmployee: { min: 100_000, median: 200_000, max: 400_000 },
    itSpendPercent: { min: 4, median: 6, max: 10 },
    operationalCostPercent: 70,
    source: 'HIMSS / Deloitte Healthcare IT benchmarks 2025',
    year: 2025,
  },
  'financial-services': {
    industry: 'financial-services',
    revenuePerEmployee: { min: 200_000, median: 400_000, max: 1_000_000 },
    itSpendPercent: { min: 7, median: 10, max: 15 },
    operationalCostPercent: 55,
    source: 'McKinsey / BCG Financial Services benchmarks 2025',
    year: 2025,
  },
  manufacturing: {
    industry: 'manufacturing',
    revenuePerEmployee: { min: 150_000, median: 300_000, max: 600_000 },
    itSpendPercent: { min: 2, median: 3.5, max: 6 },
    operationalCostPercent: 75,
    source: 'Deloitte / IndustryWeek Manufacturing benchmarks 2025',
    year: 2025,
  },
  retail: {
    industry: 'retail',
    revenuePerEmployee: { min: 100_000, median: 200_000, max: 500_000 },
    itSpendPercent: { min: 2, median: 4, max: 7 },
    operationalCostPercent: 72,
    source: 'NRF / Deloitte Retail benchmarks 2025',
    year: 2025,
  },
  government: {
    industry: 'government',
    revenuePerEmployee: { min: 80_000, median: 120_000, max: 200_000 },
    itSpendPercent: { min: 5, median: 7, max: 12 },
    operationalCostPercent: 80,
    source: 'Gartner Government IT benchmarks 2025',
    year: 2025,
  },
  education: {
    industry: 'education',
    revenuePerEmployee: { min: 60_000, median: 100_000, max: 180_000 },
    itSpendPercent: { min: 4, median: 6, max: 9 },
    operationalCostPercent: 78,
    source: 'EDUCAUSE / Gartner Education benchmarks 2025',
    year: 2025,
  },
  energy: {
    industry: 'energy',
    revenuePerEmployee: { min: 300_000, median: 600_000, max: 2_000_000 },
    itSpendPercent: { min: 2, median: 3, max: 5 },
    operationalCostPercent: 60,
    source: 'EY / Deloitte Energy & Resources benchmarks 2025',
    year: 2025,
  },
  telecommunications: {
    industry: 'telecommunications',
    revenuePerEmployee: { min: 200_000, median: 350_000, max: 700_000 },
    itSpendPercent: { min: 5, median: 8, max: 12 },
    operationalCostPercent: 62,
    source: 'TM Forum / Analysys Mason Telco benchmarks 2025',
    year: 2025,
  },
  'technology-software': {
    industry: 'technology-software',
    revenuePerEmployee: { min: 200_000, median: 400_000, max: 1_200_000 },
    itSpendPercent: { min: 10, median: 15, max: 25 },
    operationalCostPercent: 55,
    source: 'KeyBanc / Bessemer SaaS benchmarks 2025',
    year: 2025,
  },
}

/**
 * Get the industry benchmark for a given industry.
 * Falls back to 'general' if the industry isn't found.
 */
export function getIndustryBenchmark(industry?: Industry): IndustryBenchmark {
  if (!industry) return INDUSTRY_BENCHMARKS.general
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.general
}

/**
 * Estimate annual revenue from employee count using industry benchmarks.
 */
export function estimateRevenueFromHeadcount(
  employeeCount: number,
  industry?: Industry
): { estimated: number; range: { min: number; max: number }; source: string } {
  const benchmark = getIndustryBenchmark(industry)
  const rpe = benchmark.revenuePerEmployee || INDUSTRY_BENCHMARKS.general.revenuePerEmployee!

  return {
    estimated: employeeCount * rpe.median,
    range: {
      min: employeeCount * rpe.min,
      max: employeeCount * rpe.max,
    },
    source: benchmark.source,
  }
}

/**
 * Estimate IT budget from revenue or employee count.
 */
export function estimateITBudget(
  annualRevenue: number,
  industry?: Industry
): { estimated: number; range: { min: number; max: number }; source: string } {
  const benchmark = getIndustryBenchmark(industry)
  const itPct = benchmark.itSpendPercent || INDUSTRY_BENCHMARKS.general.itSpendPercent!

  return {
    estimated: annualRevenue * (itPct.median / 100),
    range: {
      min: annualRevenue * (itPct.min / 100),
      max: annualRevenue * (itPct.max / 100),
    },
    source: benchmark.source,
  }
}

/**
 * Resolve the best available financial context.
 * Priority: manual input → industry benchmark estimation.
 * Returns a resolved annual revenue figure with source annotation.
 */
export function resolveFinancialContext(options: {
  manualRevenue?: number
  manualEmployeeCount?: number
  industry?: Industry
}): { annualRevenue: number | undefined; source: 'manual' | 'industry-benchmark' | 'none'; disclaimer?: string } {
  // 1. Direct manual revenue
  if (options.manualRevenue && options.manualRevenue > 0) {
    return { annualRevenue: options.manualRevenue, source: 'manual' }
  }

  // 2. Estimate from employee count
  if (options.manualEmployeeCount && options.manualEmployeeCount > 0) {
    const estimate = estimateRevenueFromHeadcount(options.manualEmployeeCount, options.industry)
    return {
      annualRevenue: estimate.estimated,
      source: 'industry-benchmark',
      disclaimer: `Estimated from ${options.manualEmployeeCount} employees using ${estimate.source} (range: $${(estimate.range.min / 1e6).toFixed(0)}M – $${(estimate.range.max / 1e6).toFixed(0)}M)`,
    }
  }

  // 3. No data available
  return { annualRevenue: undefined, source: 'none' }
}
