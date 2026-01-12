/**
 * Stage 8: Communicate
 * 
 * Generates financial outputs and executive summary:
 * - Three-Statement Financial Model (P&L, Balance Sheet, Cash Flow)
 * - Investment Analysis (NPV, IRR, Payback)
 * - Sensitivity Analysis (Conservative/Base/Optimistic)
 * - Metric Hierarchy Visualization
 * - Executive Summary
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  TrendingUp,
  Calculator,
  BarChart3,
  Layers,
  Download,
  CheckCircle,
  ArrowLeft,
  DollarSign,
  Clock,
  Percent,
  PiggyBank,
} from 'lucide-react'
import { FinancialStatementView } from '../FinancialStatementView'
import { MetricHierarchyView } from '../MetricHierarchyView'
import { cn } from '@/lib/utils'
import type {
  CommunicateStageData,
  SolutionScopeStageData,
  ResourcesStageData,
  MetricHierarchy,
  CostOfInaction,
} from '@/lib/types'
import {
  calculatePLImpact,
  generateInvestmentAnalysis,
  generateSensitivityAnalysis,
  formatCurrency,
  formatPercentage,
  formatMonths,
} from '@/lib/financial-calculations'
import { mapToIncomeStatement, createEmptyMetricHierarchy } from '@/lib/financial-mapping'
import { ThreadlightPasteCard } from '@/components/ThreadlightPasteCard'
import { buildThreadlightByopPasteText, buildThreadlightProcessAnalysis, makeThreadlightShortName } from '@/lib/threadlight-export'

interface Stage8CommunicateProps {
  initialData: CommunicateStageData | null
  solutionScopeData: SolutionScopeStageData | null // From Stage 5
  resourcesData: ResourcesStageData | null // From Stage 2 for budget info
  coiData?: CostOfInaction | null // From Stage 1 for fallback
  onComplete: (data: CommunicateStageData) => void
  onBack: () => void
  isLiveMode?: boolean
}

// Estimate investment from budget range
function estimateInvestmentFromBudget(budgetRange: string): number {
  const estimates: Record<string, number> = {
    '<50k': 35000,
    '50-150k': 100000,
    '150-500k': 325000,
    '500k-1m': 750000,
    '>1m': 1500000,
    'unknown': 100000,
  }
  return estimates[budgetRange] || 100000
}

// Get value drivers by P&L line
function getValueDriversByPLLine(solutionData: SolutionScopeStageData | null) {
  if (!solutionData) {
    return {
      revenue: [],
      cogs: [],
      opex: [],
      balanceSheet: [],
    }
  }
  
  const revenue: Array<{ driver: string; annualValue: number }> = []
  const cogs: Array<{ driver: string; annualValue: number }> = []
  const opex: Array<{ driver: string; annualValue: number }> = []
  const balanceSheet: Array<{ driver: string; value: number }> = []
  
  // Revenue drivers
  solutionData.revenueImpact?.drivers
    ?.filter(d => d.enabled && d.calculatedAnnualValue > 0)
    ?.forEach(d => {
      revenue.push({
        driver: d.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        annualValue: d.calculatedAnnualValue,
      })
    })
  
  // Cost drivers
  solutionData.costImpact?.drivers
    ?.filter(d => d.enabled && d.calculatedAnnualValue > 0)
    ?.forEach(d => {
      const target = d.plLine === 'cogs' ? cogs : opex
      target.push({
        driver: d.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        annualValue: d.calculatedAnnualValue,
      })
    })
  
  // Balance sheet drivers
  solutionData.balanceSheetCashFlow?.drivers
    ?.filter(d => d.enabled && d.calculatedValue > 0)
    ?.forEach(d => {
      balanceSheet.push({
        driver: d.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: d.calculatedValue,
      })
    })
  
  return { revenue, cogs, opex, balanceSheet }
}

export function Stage8Communicate({
  initialData,
  solutionScopeData,
  resourcesData,
  coiData,
  onComplete,
  onBack,
  isLiveMode = false,
}: Stage8CommunicateProps) {
  // Investment amount (can be edited by user)
  const [investment, setInvestment] = useState(() => {
    if (resourcesData?.budgetRange) {
      return estimateInvestmentFromBudget(resourcesData.budgetRange)
    }
    return 100000
  })
  
  // Calculate annual benefit from Stage 5 data, with fallback to Stage 1 COI
  const annualBenefit = useMemo(() => {
    // First try to get from Stage 5 solution scope data
    if (solutionScopeData) {
      const fromSolutionScope = (
        (solutionScopeData.revenueImpact?.totalAnnualRevenue || 0) +
        (solutionScopeData.costImpact?.totalAnnualSavings || 0)
      )
      if (fromSolutionScope > 0) return fromSolutionScope
    }
    
    // Fallback to Stage 1 COI data
    if (coiData) {
      const directAnnual = (coiData.directCosts?.oneTime || 0) + (coiData.directCosts?.recurring || 0) * 12
      const opportunityAnnual = (coiData.opportunityCosts?.oneTime || 0) + (coiData.opportunityCosts?.recurring || 0) * 12
      const riskAnnual = (
        ((coiData.riskCosts?.oneTime || 0) * (coiData.riskCosts?.oneTimeProbability || 0) / 100) +
        ((coiData.riskCosts?.recurring || 0) * (coiData.riskCosts?.recurringProbability || 0) / 100 * 12)
      )
      const coiTotal = directAnnual + opportunityAnnual + riskAnnual
      if (coiTotal > 0) return coiTotal
      if (coiData.totalAnnual && coiData.totalAnnual > 0) return coiData.totalAnnual
    }
    
    return 0
  }, [solutionScopeData, coiData])
  
  // Generate all financial outputs
  const financialOutputs = useMemo(() => {
    const plImpact = calculatePLImpact(annualBenefit, investment)
    const investmentAnalysis = generateInvestmentAnalysis(investment, annualBenefit)
    const sensitivityAnalysis = generateSensitivityAnalysis(investment, annualBenefit)
    
    // Three-statement model
    const revenueImpact = solutionScopeData?.revenueImpact?.totalAnnualRevenue || 0
    const cogsImpact = solutionScopeData?.costImpact?.drivers
      ?.filter(d => d.enabled && d.plLine === 'cogs')
      ?.reduce((sum, d) => sum + d.calculatedAnnualValue, 0) || 0
    const opexImpact = solutionScopeData?.costImpact?.drivers
      ?.filter(d => d.enabled && d.plLine === 'opex')
      ?.reduce((sum, d) => sum + d.calculatedAnnualValue, 0) || 0
    const workingCapitalImpact = solutionScopeData?.balanceSheetCashFlow?.totalWorkingCapitalImpact || 0
    const cashFlowImpact = solutionScopeData?.balanceSheetCashFlow?.totalCashFlowImpact || 0
    
    const threeStatementModel = {
      incomeStatement: {
        revenue: { year1: revenueImpact * 0.5, year2: revenueImpact, year3: revenueImpact },
        cogs: { year1: cogsImpact * 0.5, year2: cogsImpact, year3: cogsImpact },
        grossProfit: { 
          year1: (revenueImpact + cogsImpact) * 0.5, 
          year2: revenueImpact + cogsImpact, 
          year3: revenueImpact + cogsImpact 
        },
        opex: {
          salesMarketing: { year1: 0, year2: 0, year3: 0 },
          rAndD: { year1: 0, year2: 0, year3: 0 },
          gAndA: { year1: opexImpact * 0.5, year2: opexImpact, year3: opexImpact },
          total: { year1: opexImpact * 0.5 - investment, year2: opexImpact, year3: opexImpact },
        },
        ebit: { 
          year1: annualBenefit * 0.5 - investment, 
          year2: annualBenefit, 
          year3: annualBenefit 
        },
      },
      balanceSheet: {
        workingCapitalChange: workingCapitalImpact,
        inventoryReduction: solutionScopeData?.balanceSheetCashFlow?.drivers
          ?.find(d => d.type === 'inventory')?.calculatedValue || 0,
        receivablesReduction: solutionScopeData?.balanceSheetCashFlow?.drivers
          ?.find(d => d.type === 'collections')?.calculatedValue || 0,
        capexAvoided: solutionScopeData?.balanceSheetCashFlow?.drivers
          ?.find(d => d.type === 'capex-avoidance')?.calculatedValue || 0,
      },
      cashFlow: {
        operatingCashFlow: { 
          year1: annualBenefit * 0.5 + workingCapitalImpact, 
          year2: annualBenefit, 
          year3: annualBenefit 
        },
        investingCashFlow: { year1: -investment, year2: 0, year3: 0 },
        netCashFlow: { 
          year1: annualBenefit * 0.5 + workingCapitalImpact - investment, 
          year2: annualBenefit, 
          year3: annualBenefit 
        },
      },
    }
    
    const valueDriversByPLLine = getValueDriversByPLLine(solutionScopeData)
    const metricHierarchy = solutionScopeData?.metricHierarchy || createEmptyMetricHierarchy()
    
    return {
      plImpact,
      investmentAnalysis,
      sensitivityAnalysis,
      threeStatementModel,
      valueDriversByPLLine,
      metricHierarchy,
    }
  }, [annualBenefit, investment, solutionScopeData])
  
  const handleComplete = () => {
    const data: CommunicateStageData = {
      plImpact: financialOutputs.plImpact,
      investmentAnalysis: financialOutputs.investmentAnalysis,
      sensitivityAnalysis: financialOutputs.sensitivityAnalysis,
      threeStatementModel: financialOutputs.threeStatementModel,
      metricHierarchy: financialOutputs.metricHierarchy,
      valueDriversByPLLine: financialOutputs.valueDriversByPLLine,
    }
    onComplete(data)
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4] flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Stage 8: COMMUNICATE
        </h2>
        <p className="text-muted-foreground mt-2">
          Financial outputs and executive summary for stakeholder communication
        </p>
      </div>
      
      {/* Investment Input */}
      <Card className="border-[#0078D4]/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Investment Amount
          </CardTitle>
          <CardDescription>
            Estimated from Stage 2 budget range. Adjust if needed for accurate calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="investment">Total Year 1 Investment</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="investment"
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(parseFloat(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Budget Range: <Badge variant="outline">{resourcesData?.budgetRange || 'Unknown'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Executive Summary KPIs */}
      <Card className="bg-gradient-to-r from-[#0078D4]/5 to-transparent border-2 border-[#0078D4]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#0078D4]" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Annual Benefit */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Annual Benefit</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(annualBenefit, 'USD')}
              </p>
            </div>
            
            {/* Payback Period */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Payback Period</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatMonths(financialOutputs.investmentAnalysis.simplePaybackMonths)}
              </p>
            </div>
            
            {/* 3-Year ROI */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Percent className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">3-Year ROI</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercentage(financialOutputs.investmentAnalysis.roi3Year)}
              </p>
            </div>
            
            {/* NPV */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-[#0078D4]/10 rounded-full">
                  <Calculator className="h-6 w-6 text-[#0078D4]" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">NPV (10%)</p>
              <p className="text-2xl font-bold text-[#0078D4]">
                {formatCurrency(financialOutputs.investmentAnalysis.npv10Percent, 'USD')}
              </p>
            </div>
          </div>
          
          {/* IRR */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
            <span className="text-sm text-muted-foreground">Internal Rate of Return (IRR): </span>
            <span className="font-bold text-[#0078D4]">
              {formatPercentage(financialOutputs.investmentAnalysis.irr)}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statements" className="gap-2">
            <FileText className="h-4 w-4" />
            Financial Statements
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Sensitivity Analysis
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <Layers className="h-4 w-4" />
            Metric Hierarchy
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>
        
        {/* Financial Statements Tab */}
        <TabsContent value="statements">
          <FinancialStatementView
            data={{
              plImpact: financialOutputs.plImpact,
              investmentAnalysis: financialOutputs.investmentAnalysis,
              sensitivityAnalysis: financialOutputs.sensitivityAnalysis,
              threeStatementModel: financialOutputs.threeStatementModel,
              metricHierarchy: financialOutputs.metricHierarchy,
              valueDriversByPLLine: financialOutputs.valueDriversByPLLine,
            }}
          />
        </TabsContent>
        
        {/* Sensitivity Analysis Tab */}
        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
              <CardDescription>
                Three scenarios showing impact of benefit realization variations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Conservative */}
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-orange-700 flex items-center justify-between">
                      Conservative
                      <Badge variant="outline" className="bg-orange-100">70%</Badge>
                    </CardTitle>
                    <CardDescription>Lower bound estimate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Benefit</span>
                      <span className="font-mono">{formatCurrency(financialOutputs.sensitivityAnalysis.conservative.annualBenefit, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payback</span>
                      <span className="font-mono">{formatMonths(financialOutputs.sensitivityAnalysis.conservative.paybackMonths)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">3-Year ROI</span>
                      <span className="font-mono">{formatPercentage(financialOutputs.sensitivityAnalysis.conservative.roi3Year)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">NPV</span>
                      <span className="font-mono">{formatCurrency(financialOutputs.sensitivityAnalysis.conservative.npv, 'USD')}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Base Case */}
                <Card className="border-[#0078D4] bg-[#0078D4]/5 border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[#0078D4] flex items-center justify-between">
                      Base Case
                      <Badge className="bg-[#0078D4]">100%</Badge>
                    </CardTitle>
                    <CardDescription>Expected outcome</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Benefit</span>
                      <span className="font-mono font-bold">{formatCurrency(financialOutputs.sensitivityAnalysis.base.annualBenefit, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payback</span>
                      <span className="font-mono font-bold">{formatMonths(financialOutputs.sensitivityAnalysis.base.paybackMonths)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">3-Year ROI</span>
                      <span className="font-mono font-bold">{formatPercentage(financialOutputs.sensitivityAnalysis.base.roi3Year)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">NPV</span>
                      <span className="font-mono font-bold">{formatCurrency(financialOutputs.sensitivityAnalysis.base.npv, 'USD')}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Optimistic */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-green-700 flex items-center justify-between">
                      Optimistic
                      <Badge variant="outline" className="bg-green-100">130%</Badge>
                    </CardTitle>
                    <CardDescription>Upper bound estimate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Benefit</span>
                      <span className="font-mono">{formatCurrency(financialOutputs.sensitivityAnalysis.optimistic.annualBenefit, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payback</span>
                      <span className="font-mono">{formatMonths(financialOutputs.sensitivityAnalysis.optimistic.paybackMonths)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">3-Year ROI</span>
                      <span className="font-mono">{formatPercentage(financialOutputs.sensitivityAnalysis.optimistic.roi3Year)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">NPV</span>
                      <span className="font-mono">{formatCurrency(financialOutputs.sensitivityAnalysis.optimistic.npv, 'USD')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Metric Hierarchy Tab */}
        <TabsContent value="hierarchy">
          <MetricHierarchyView data={financialOutputs.metricHierarchy} />
        </TabsContent>
        
        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Discovery Summary</CardTitle>
              <CardDescription>
                Key findings from the enterprise discovery process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Value Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Value Composition</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#0078D4]/5 rounded-lg border border-[#0078D4]/20">
                    <p className="text-sm text-muted-foreground">Revenue Impact</p>
                    <p className="text-xl font-bold text-[#0078D4]">
                      {formatCurrency(solutionScopeData?.revenueImpact?.totalAnnualRevenue || 0, 'USD')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {solutionScopeData?.revenueImpact?.drivers?.filter(d => d.enabled).length || 0} active drivers
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground">Cost Savings</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(solutionScopeData?.costImpact?.totalAnnualSavings || 0, 'USD')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(solutionScopeData?.costImpact?.totalFTEEquivalent || 0).toFixed(1)} FTE equivalent
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-muted-foreground">Working Capital</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(solutionScopeData?.balanceSheetCashFlow?.totalCashFlowImpact || 0, 'USD')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      One-time release
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Metric Hierarchy Summary */}
              <div>
                <h4 className="font-semibold mb-3">Metric Hierarchy</h4>
                <MetricHierarchyView data={financialOutputs.metricHierarchy} compact />
              </div>
              
              <Separator />
              
              {/* Investment Recommendation */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Investment Recommendation</h4>
                <p className="text-sm text-muted-foreground">
                  Based on a {formatCurrency(investment, 'USD')} investment with 
                  {' '}{formatCurrency(annualBenefit, 'USD')} annual benefit:
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Payback achieved in {formatMonths(financialOutputs.investmentAnalysis.simplePaybackMonths)}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    3-Year ROI of {formatPercentage(financialOutputs.investmentAnalysis.roi3Year)}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Positive NPV of {formatCurrency(financialOutputs.investmentAnalysis.npv10Percent, 'USD')} at 10% discount rate
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Threadlight BYOP Output</h4>
                <ThreadlightPasteCard
                  industryLabel="<USER_SELECT_IN_WIZARD>"
                  industryValue="<USER_SELECT_IN_WIZARD>"
                  shortName={makeThreadlightShortName('Enterprise Discovery')}
                  topScoredLabel="Top value drivers"
                  topScoredItems={[
                    ...financialOutputs.valueDriversByPLLine.revenue.map((d) => ({
                      title: `${d.driver} (Revenue)` ,
                      scoreLabel: 'Annual',
                      scoreValue: d.annualValue,
                    })),
                    ...financialOutputs.valueDriversByPLLine.opex.map((d) => ({
                      title: `${d.driver} (OPEX)` ,
                      scoreLabel: 'Annual',
                      scoreValue: d.annualValue,
                    })),
                  ].slice(0, 3)}
                  processAnalysis={buildThreadlightProcessAnalysis({
                    customerName: '<CUSTOMER>',
                    opportunityName: 'Enterprise Discovery',
                    industryLabel: '<USER_SELECT_IN_WIZARD>',
                    processCandidates: [
                      ...financialOutputs.valueDriversByPLLine.revenue.map((d) => `- ${d.driver} (Revenue)`),
                      ...financialOutputs.valueDriversByPLLine.opex.map((d) => `- ${d.driver} (OPEX)`),
                      ...financialOutputs.valueDriversByPLLine.cogs.map((d) => `- ${d.driver} (COGS)`),
                    ].slice(0, 8).join('\n'),
                    processNotes: 'Use enterprise discovery outputs as the source of truth; replace placeholders with Stage 1 narrative if available.',
                    constraints: '<USER_INPUT>',
                  })}
                  pasteText={buildThreadlightByopPasteText({
                    customerName: '<CUSTOMER>',
                    opportunityName: 'Enterprise Discovery',
                    industryLabel: '<USER_SELECT_IN_WIZARD>',
                    processCandidates: [
                      ...financialOutputs.valueDriversByPLLine.revenue.map((d) => `- ${d.driver} (Revenue)`),
                      ...financialOutputs.valueDriversByPLLine.opex.map((d) => `- ${d.driver} (OPEX)`),
                      ...financialOutputs.valueDriversByPLLine.cogs.map((d) => `- ${d.driver} (COGS)`),
                    ].slice(0, 8).join('\n'),
                    processNotes: 'Use enterprise discovery outputs as the source of truth; replace placeholders with Stage 1 narrative if available.',
                    constraints: '<USER_INPUT>',
                    financials: {
                      annualCOI: (coiData?.totalAnnual || 0) > 0 ? coiData?.totalAnnual : undefined,
                      annualValue: annualBenefit > 0 ? annualBenefit : undefined,
                      implementationCost: investment,
                      paybackMonths: financialOutputs.investmentAnalysis.simplePaybackMonths,
                      roi3YearPercent: financialOutputs.investmentAnalysis.roi3Year,
                    },
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Note: Stage 8 currently doesn’t receive Stage 1 narrative fields (problem/outcome/metrics), so this block includes placeholders.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Stage 7
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button
            onClick={handleComplete}
            className="gap-2 bg-[#0078D4] hover:bg-[#106EBE] text-white"
          >
            <CheckCircle className="h-4 w-4" />
            Complete Discovery
          </Button>
        </div>
      </div>
    </div>
  )
}
