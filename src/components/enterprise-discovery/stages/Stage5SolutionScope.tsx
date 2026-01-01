/**
 * Stage 5: Solution Scope
 * 
 * Orchestrates 3 sub-steps for comprehensive financial impact mapping:
 * - 5a: Revenue Impact (5 drivers with metric chain inputs)
 * - 5b: Cost Impact (5 drivers with FTE equivalents)
 * - 5c: Balance Sheet & Cash Flow (4 drivers + Metric Hierarchy)
 * 
 * Auto-populates baseline values from Stage 1 COI.
 */

import { useState, useMemo } from 'react'
import { Stage5aRevenueImpact } from './Stage5aRevenueImpact'
import { Stage5bCostImpact } from './Stage5bCostImpact'
import { Stage5cBalanceSheet } from './Stage5cBalanceSheet'
import type {
  SolutionScopeStageData,
  CostOfInaction,
  RevenueImpactDriver,
  CostImpactDriver,
  BalanceSheetCashFlowDriver,
  MetricHierarchy,
} from '@/lib/types'
import { coiToValueDrivers, createEmptyMetricHierarchy } from '@/lib/financial-mapping'

interface Stage5SolutionScopeProps {
  initialData: SolutionScopeStageData | null
  coiData?: CostOfInaction | null // From Stage 1 for auto-population
  onComplete: (data: SolutionScopeStageData) => void
  onBack: () => void
  isLiveMode?: boolean
}

type SubStep = 'revenue' | 'cost' | 'balance-sheet'

// Create default stage data
function createDefaultStageData(): SolutionScopeStageData {
  return {
    currentSubStep: 'revenue',
    
    // Legacy scope definition (kept minimal - can be expanded)
    inScope: [],
    outOfScope: [],
    mvpDefinition: '',
    phases: [],
    
    // Legacy value drivers (populated from COI for backwards compatibility)
    valueDrivers: [],
    
    // New detailed impact sections
    revenueImpact: {
      drivers: [],
      totalAnnualRevenue: 0,
      sourceFromCOI: false,
    },
    costImpact: {
      drivers: [],
      totalAnnualSavings: 0,
      totalFTEEquivalent: 0,
      sourceFromCOI: false,
    },
    balanceSheetCashFlow: {
      drivers: [],
      totalWorkingCapitalImpact: 0,
      totalCashFlowImpact: 0,
    },
    
    // Metric hierarchy
    metricHierarchy: createEmptyMetricHierarchy(),
    
    // Totals
    totalAnnualValue: 0,
    riskAdjustedValue: 0,
    paybackPeriod: 0,
    
    // Success metrics & risks (kept minimal - can be expanded)
    successMetrics: [],
    risks: [],
  }
}

export function Stage5SolutionScope({
  initialData,
  coiData,
  onComplete,
  onBack,
  isLiveMode = false,
}: Stage5SolutionScopeProps) {
  // Current sub-step
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>(
    (initialData?.currentSubStep as SubStep) || 'revenue'
  )
  
  // Accumulated data from each sub-step
  const [revenueData, setRevenueData] = useState<{
    drivers: RevenueImpactDriver[]
    totalAnnualRevenue: number
    sourceFromCOI: boolean
  }>(initialData?.revenueImpact || {
    drivers: [],
    totalAnnualRevenue: 0,
    sourceFromCOI: false,
  })
  
  const [costData, setCostData] = useState<{
    drivers: CostImpactDriver[]
    totalAnnualSavings: number
    totalFTEEquivalent: number
    sourceFromCOI: boolean
  }>(initialData?.costImpact || {
    drivers: [],
    totalAnnualSavings: 0,
    totalFTEEquivalent: 0,
    sourceFromCOI: false,
  })
  
  const [balanceSheetData, setBalanceSheetData] = useState<{
    drivers: BalanceSheetCashFlowDriver[]
    totalWorkingCapitalImpact: number
    totalCashFlowImpact: number
    metricHierarchy: MetricHierarchy
  }>({
    drivers: initialData?.balanceSheetCashFlow?.drivers || [],
    totalWorkingCapitalImpact: initialData?.balanceSheetCashFlow?.totalWorkingCapitalImpact || 0,
    totalCashFlowImpact: initialData?.balanceSheetCashFlow?.totalCashFlowImpact || 0,
    metricHierarchy: initialData?.metricHierarchy || createEmptyMetricHierarchy(),
  })
  
  // Calculate totals
  const totalAnnualValue = useMemo(() => {
    return revenueData.totalAnnualRevenue + costData.totalAnnualSavings
  }, [revenueData.totalAnnualRevenue, costData.totalAnnualSavings])
  
  // Generate legacy value drivers from COI for backwards compatibility
  const legacyValueDrivers = useMemo(() => {
    if (coiData) {
      return coiToValueDrivers(coiData)
    }
    return initialData?.valueDrivers || []
  }, [coiData, initialData?.valueDrivers])
  
  // Handle sub-step completions
  const handleRevenueComplete = (data: typeof revenueData) => {
    setRevenueData(data)
    setCurrentSubStep('cost')
  }
  
  const handleCostComplete = (data: typeof costData) => {
    setCostData(data)
    setCurrentSubStep('balance-sheet')
  }
  
  const handleBalanceSheetComplete = (data: {
    drivers: BalanceSheetCashFlowDriver[]
    totalWorkingCapitalImpact: number
    totalCashFlowImpact: number
    metricHierarchy: MetricHierarchy
  }) => {
    setBalanceSheetData(data)
    
    // Compile final stage data
    const finalData: SolutionScopeStageData = {
      currentSubStep: 'summary',
      
      // Legacy fields
      inScope: initialData?.inScope || [],
      outOfScope: initialData?.outOfScope || [],
      mvpDefinition: initialData?.mvpDefinition || '',
      phases: initialData?.phases || [],
      valueDrivers: legacyValueDrivers,
      
      // New detailed sections
      revenueImpact: revenueData,
      costImpact: costData,
      balanceSheetCashFlow: {
        drivers: data.drivers,
        totalWorkingCapitalImpact: data.totalWorkingCapitalImpact,
        totalCashFlowImpact: data.totalCashFlowImpact,
      },
      metricHierarchy: data.metricHierarchy,
      
      // Calculated totals
      totalAnnualValue: revenueData.totalAnnualRevenue + costData.totalAnnualSavings,
      riskAdjustedValue: (revenueData.totalAnnualRevenue + costData.totalAnnualSavings) * 0.8,
      paybackPeriod: 0, // Will be calculated in Stage 8 with investment data
      
      // Keep existing success metrics and risks
      successMetrics: initialData?.successMetrics || [],
      risks: initialData?.risks || [],
    }
    
    onComplete(finalData)
  }
  
  // Handle back navigation within sub-steps
  const handleRevenueBack = () => {
    onBack() // Go back to Stage 4
  }
  
  const handleCostBack = () => {
    setCurrentSubStep('revenue')
  }
  
  const handleBalanceSheetBack = () => {
    setCurrentSubStep('cost')
  }
  
  // Render current sub-step
  switch (currentSubStep) {
    case 'revenue':
      return (
        <Stage5aRevenueImpact
          initialData={revenueData.drivers.length > 0 ? revenueData : undefined}
          coiData={coiData || undefined}
          onComplete={handleRevenueComplete}
          onBack={handleRevenueBack}
        />
      )
    
    case 'cost':
      return (
        <Stage5bCostImpact
          initialData={costData.drivers.length > 0 ? costData : undefined}
          coiData={coiData || undefined}
          onComplete={handleCostComplete}
          onBack={handleCostBack}
        />
      )
    
    case 'balance-sheet':
      return (
        <Stage5cBalanceSheet
          initialData={balanceSheetData.drivers.length > 0 ? balanceSheetData : undefined}
          revenueTotal={revenueData.totalAnnualRevenue}
          costTotal={costData.totalAnnualSavings}
          onComplete={handleBalanceSheetComplete}
          onBack={handleBalanceSheetBack}
        />
      )
    
    default:
      return null
  }
}
