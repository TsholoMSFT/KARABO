/**
 * Stage 3: Solution Scope (Collapsed MVP Version)
 * 
 * Consolidates the 3 sub-steps (5a Revenue, 5b Cost, 5c Balance Sheet) 
 * into a single view with expandable accordion sections.
 * 
 * Features:
 * - Single-page collapsed view with accordions
 * - Auto-populate from Stage 1 COI data
 * - Auto-calculate RICE score based on COI and estimates
 * - TabCompletionIndicator for tracking
 * - Skip for now functionality
 */

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  TrendingUp,
  PiggyBank,
  BarChart3,
  Sparkles,
  Calculator,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabCompletionIndicator } from '../TabCompletionIndicator'
import { SkipForNowButton } from '../SkipForNowButton'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import { calculateTotalCOI } from '@/lib/financial-calculations'
import type {
  SolutionScopeStageData,
  OpportunityResourcesStageData,
  RevenueImpactDriver,
  CostImpactDriver,
  BalanceSheetCashFlowDriver,
  TabCompletionStatus,
} from '@/lib/types'

interface Stage3SolutionScopeCollapsedProps {
  initialData?: SolutionScopeStageData
  previousStageData?: OpportunityResourcesStageData
  onComplete: (data: SolutionScopeStageData) => void
  onBack?: () => void
  isLiveMode?: boolean
}

// Section definitions for tab completion
const SECTIONS = [
  { id: 'revenue', label: 'Revenue Impact' },
  { id: 'cost', label: 'Cost Impact' },
  { id: 'balance-sheet', label: 'Balance Sheet' },
  { id: 'rice', label: 'RICE Score' },
]

// Simple revenue driver config for collapsed view
interface SimpleRevenueDriver {
  id: string
  name: string
  enabled: boolean
  annualValue: number
  confidence: number
}

// Simple cost driver config for collapsed view
interface SimpleCostDriver {
  id: string
  name: string
  enabled: boolean
  annualValue: number
  fteEquivalent: number
  confidence: number
}

export function Stage3SolutionScopeCollapsed({
  previousStageData,
  onComplete,
  onBack,
}: Stage3SolutionScopeCollapsedProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  
  // Section completion tracking
  const [sectionCompletion, setSectionCompletion] = useState<Record<string, TabCompletionStatus>>({})
  const [expandedSections, setExpandedSections] = useState<string[]>(['revenue'])
  
  // Get COI data from previous stage for auto-population
  const coiData = previousStageData?.opportunity?.coi
  const totalCOI = coiData ? calculateTotalCOI(coiData) : 0
  
  // Revenue impact state (simplified)
  const [revenueDrivers, setRevenueDrivers] = useState<SimpleRevenueDriver[]>([
    { id: 'customer-acquisition', name: 'Customer Acquisition', enabled: false, annualValue: 0, confidence: 50 },
    { id: 'margin-improvement', name: 'Margin Improvement', enabled: false, annualValue: 0, confidence: 50 },
    { id: 'sales-cycle', name: 'Faster Sales Cycle', enabled: false, annualValue: 0, confidence: 50 },
    { id: 'churn-reduction', name: 'Churn Reduction', enabled: false, annualValue: 0, confidence: 50 },
    { id: 'upsell', name: 'Upsell/Cross-sell', enabled: false, annualValue: 0, confidence: 50 },
  ])
  
  // Cost impact state (simplified)
  const [costDrivers, setCostDrivers] = useState<SimpleCostDriver[]>([
    { id: 'labour', name: 'Labour Efficiency', enabled: false, annualValue: 0, fteEquivalent: 0, confidence: 50 },
    { id: 'errors', name: 'Error Reduction', enabled: false, annualValue: 0, fteEquivalent: 0, confidence: 50 },
    { id: 'infrastructure', name: 'Infrastructure Savings', enabled: false, annualValue: 0, fteEquivalent: 0, confidence: 50 },
    { id: 'vendor', name: 'Vendor Consolidation', enabled: false, annualValue: 0, fteEquivalent: 0, confidence: 50 },
    { id: 'automation', name: 'Process Automation', enabled: false, annualValue: 0, fteEquivalent: 0, confidence: 50 },
  ])
  
  // Balance sheet impact
  const [workingCapitalImpact, setWorkingCapitalImpact] = useState(0)
  const [cashFlowImpact, setCashFlowImpact] = useState(0)
  
  // RICE scoring (auto-calculated with AI assistance option)
  const [rice, setRice] = useState({
    reach: 50, // Number of users/customers affected
    impact: 2, // 1-3 scale
    confidence: 50, // Percentage
    effort: 3, // Person-months
  })
  const [isCalculatingRICE, setIsCalculatingRICE] = useState(false)
  
  // Calculate totals
  const totalRevenueImpact = useMemo(() => 
    revenueDrivers.filter(d => d.enabled).reduce((sum, d) => sum + d.annualValue, 0),
    [revenueDrivers]
  )
  
  const totalCostImpact = useMemo(() =>
    costDrivers.filter(d => d.enabled).reduce((sum, d) => sum + d.annualValue, 0),
    [costDrivers]
  )
  
  const totalFTE = useMemo(() =>
    costDrivers.filter(d => d.enabled).reduce((sum, d) => sum + d.fteEquivalent, 0),
    [costDrivers]
  )
  
  const totalAnnualValue = totalRevenueImpact + totalCostImpact
  
  // RICE score calculation
  const riceScore = useMemo(() => {
    if (rice.effort === 0) return 0
    return Math.round((rice.reach * rice.impact * (rice.confidence / 100)) / rice.effort)
  }, [rice])
  
  // Section completion logic
  const getSectionStatus = useCallback((sectionId: string): TabCompletionStatus => {
    if (sectionCompletion[sectionId] === 'skipped') return 'skipped'
    
    switch (sectionId) {
      case 'revenue':
        return revenueDrivers.some(d => d.enabled && d.annualValue > 0) ? 'complete' : 'not-started'
      case 'cost':
        return costDrivers.some(d => d.enabled && d.annualValue > 0) ? 'complete' : 'not-started'
      case 'balance-sheet':
        return workingCapitalImpact !== 0 || cashFlowImpact !== 0 ? 'complete' : 'not-started'
      case 'rice':
        return rice.reach > 0 && rice.effort > 0 ? 'complete' : 'not-started'
      default:
        return 'not-started'
    }
  }, [sectionCompletion, revenueDrivers, costDrivers, workingCapitalImpact, cashFlowImpact, rice])
  
  const visibleSections = useMemo(() => 
    SECTIONS.map(s => ({ ...s, status: getSectionStatus(s.id) })),
    [getSectionStatus]
  )
  
  const markSectionSkipped = useCallback((sectionId: string) => {
    setSectionCompletion(prev => ({ ...prev, [sectionId]: 'skipped' }))
  }, [])
  
  // Auto-populate from COI
  const populateFromCOI = useCallback(() => {
    if (!coiData) return
    
    // Map COI opportunity costs to revenue drivers
    if (coiData.opportunityCosts.recurring > 0) {
      setRevenueDrivers(prev => prev.map(d => {
        if (d.id === 'customer-acquisition') {
          return { ...d, enabled: true, annualValue: coiData.opportunityCosts.recurring * 12 }
        }
        return d
      }))
    }
    
    // Map COI direct costs to cost drivers
    if (coiData.directCosts.recurring > 0) {
      setCostDrivers(prev => prev.map(d => {
        if (d.id === 'labour') {
          return { ...d, enabled: true, annualValue: coiData.directCosts.recurring * 12 }
        }
        return d
      }))
    }
  }, [coiData])
  
  // AI-assisted RICE calculation
  const calculateRICEFromCOI = async () => {
    if (!isAIFeatureEnabled('enableAutoRICEScoring')) return
    if (typeof window.llm !== 'function') {
      alert('AI service not available')
      return
    }
    
    setIsCalculatingRICE(true)
    try {
      const prompt = `You are a product management expert. Calculate RICE score components based on this discovery data:

**Total Annual Value at Risk (COI):** £${totalCOI.toLocaleString()}
**Problem Statement:** ${previousStageData?.opportunity?.problemStatement || 'Not specified'}
**Affected Area:** ${previousStageData?.opportunity?.affectedArea || 'process'}
**Timeline Expectation:** ${previousStageData?.opportunity?.timelineExpectation || '3-6 months'}
**Team Capacity:** ${previousStageData?.resources?.teamCapacity || 'unknown'}
**Identified Revenue Impact:** £${totalRevenueImpact.toLocaleString()}
**Identified Cost Impact:** £${totalCostImpact.toLocaleString()}

Calculate RICE components:
- Reach: Estimated number of users/customers impacted (0-100 scale)
- Impact: How significant is the impact? (1=Minimal, 2=Low, 3=Medium, 4=High, 5=Massive) - use 1-3 for conservative estimate
- Confidence: How confident are we in these estimates? (0-100%)
- Effort: Estimated person-months to implement (1-12)

Return ONLY a JSON object with keys: reach, impact, confidence, effort`

      const response = await window.llm(prompt, 'gpt-4o-mini', true)
      const calculated = JSON.parse(response)
      
      setRice({
        reach: Math.min(100, Math.max(0, calculated.reach || 50)),
        impact: Math.min(3, Math.max(1, calculated.impact || 2)),
        confidence: Math.min(100, Math.max(0, calculated.confidence || 50)),
        effort: Math.max(1, calculated.effort || 3),
      })
    } catch (error) {
      console.error('Failed to calculate RICE:', error)
      alert('Failed to calculate RICE score. Please enter values manually.')
    } finally {
      setIsCalculatingRICE(false)
    }
  }
  
  // Revenue driver update
  const updateRevenueDriver = (id: string, updates: Partial<SimpleRevenueDriver>) => {
    setRevenueDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }
  
  // Cost driver update  
  const updateCostDriver = (id: string, updates: Partial<SimpleCostDriver>) => {
    setCostDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }
  
  // Handle submit
  const handleSubmit = () => {
    // Convert simplified drivers to full format
    const revenueImpactDrivers: RevenueImpactDriver[] = revenueDrivers
      .filter(d => d.enabled)
      .map(d => ({
        id: d.id,
        type: d.id as any,
        enabled: true,
        inputs: {},
        calculatedAnnualValue: d.annualValue,
        plLine: 'revenue' as const,
      }))
    
    const costImpactDrivers: CostImpactDriver[] = costDrivers
      .filter(d => d.enabled)
      .map(d => ({
        id: d.id,
        type: d.id as any,
        enabled: true,
        inputs: {},
        calculatedAnnualValue: d.annualValue,
        fteEquivalent: d.fteEquivalent,
        plLine: 'opex' as const,
      }))
    
    const balanceSheetDrivers: BalanceSheetCashFlowDriver[] = []
    if (workingCapitalImpact !== 0) {
      balanceSheetDrivers.push({
        id: 'working-capital',
        type: 'collections',
        enabled: true,
        inputs: {},
        calculatedValue: workingCapitalImpact,
        cashFlowImpact: workingCapitalImpact,
        statementLine: 'working-capital',
      })
    }
    
    const data: SolutionScopeStageData = {
      currentSubStep: 'summary',
      
      // Legacy fields
      inScope: [],
      outOfScope: [],
      mvpDefinition: '',
      phases: [],
      valueDrivers: [],
      
      // New sections
      revenueImpact: {
        drivers: revenueImpactDrivers,
        totalAnnualRevenue: totalRevenueImpact,
        sourceFromCOI: true,
      },
      costImpact: {
        drivers: costImpactDrivers,
        totalAnnualSavings: totalCostImpact,
        totalFTEEquivalent: totalFTE,
        sourceFromCOI: true,
      },
      balanceSheetCashFlow: {
        drivers: balanceSheetDrivers,
        totalWorkingCapitalImpact: workingCapitalImpact,
        totalCashFlowImpact: cashFlowImpact,
      },
      metricHierarchy: {
        strategicOutcome: '',
        financialMetrics: [],
        operationalMetrics: [],
        activityMetrics: [],
      },
      
      // RICE-based totals
      totalAnnualValue,
      riskAdjustedValue: totalAnnualValue * (rice.confidence / 100),
      paybackPeriod: 0,
      
      successMetrics: [],
      risks: [],
      
      // Note: RICE scores are calculated dynamically and not stored in stage data
    }
    
    onComplete(data)
  }
  
  const isValid = (totalRevenueImpact > 0 || totalCostImpact > 0) ||
    Object.values(sectionCompletion).some(s => s === 'skipped')
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">
          Stage 3: SOLUTION SCOPE
        </h2>
        <p className="text-muted-foreground mt-2">
          Quantify the value drivers and calculate the business case
        </p>
      </div>
      
      {/* Section completion indicator */}
      <TabCompletionIndicator
        tabs={visibleSections}
        currentTab={expandedSections[0] || 'revenue'}
        onTabClick={(id) => setExpandedSections([id])}
      />
      
      {/* COI Auto-populate hint */}
      {totalCOI > 0 && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Stage 1 COI of <strong>£{totalCOI.toLocaleString()}</strong> detected.
            </span>
            <Button variant="outline" size="sm" onClick={populateFromCOI}>
              Auto-populate Value Drivers
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Revenue Impact</p>
              <p className="text-2xl font-bold text-green-600">
                £{totalRevenueImpact.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Impact</p>
              <p className="text-2xl font-bold text-blue-600">
                £{totalCostImpact.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Annual Value</p>
              <p className="text-2xl font-bold text-purple-600">
                £{totalAnnualValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RICE Score</p>
              <p className="text-2xl font-bold text-amber-600">
                {riceScore}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Accordion Sections */}
      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-4"
      >
        {/* Revenue Impact Section */}
        <AccordionItem value="revenue" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Revenue Impact</span>
              {getSectionStatus('revenue') === 'complete' && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  £{totalRevenueImpact.toLocaleString()}/year
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex justify-end mb-4">
              <SkipForNowButton 
                onSkip={() => markSectionSkipped('revenue')}
                sectionName="Revenue Impact"
              />
            </div>
            <div className="space-y-4">
              {revenueDrivers.map((driver) => (
                <div 
                  key={driver.id}
                  className={cn(
                    'p-4 border rounded-lg transition-colors',
                    driver.enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={driver.enabled}
                        onCheckedChange={(checked) => updateRevenueDriver(driver.id, { enabled: checked })}
                      />
                      <Label className="font-medium">{driver.name}</Label>
                    </div>
                    {driver.enabled && (
                      <Badge variant="outline">
                        £{driver.annualValue.toLocaleString()}/year
                      </Badge>
                    )}
                  </div>
                  {driver.enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Annual Value (£)</Label>
                        <Input
                          type="number"
                          value={driver.annualValue}
                          onChange={(e) => updateRevenueDriver(driver.id, { annualValue: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Confidence (%)</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[driver.confidence]}
                            onValueChange={([v]) => updateRevenueDriver(driver.id, { confidence: v })}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm w-10">{driver.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Cost Impact Section */}
        <AccordionItem value="cost" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <PiggyBank className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Cost Impact</span>
              {getSectionStatus('cost') === 'complete' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  £{totalCostImpact.toLocaleString()}/year ({totalFTE} FTE)
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex justify-end mb-4">
              <SkipForNowButton 
                onSkip={() => markSectionSkipped('cost')}
                sectionName="Cost Impact"
              />
            </div>
            <div className="space-y-4">
              {costDrivers.map((driver) => (
                <div 
                  key={driver.id}
                  className={cn(
                    'p-4 border rounded-lg transition-colors',
                    driver.enabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={driver.enabled}
                        onCheckedChange={(checked) => updateCostDriver(driver.id, { enabled: checked })}
                      />
                      <Label className="font-medium">{driver.name}</Label>
                    </div>
                    {driver.enabled && (
                      <Badge variant="outline">
                        £{driver.annualValue.toLocaleString()}/year
                      </Badge>
                    )}
                  </div>
                  {driver.enabled && (
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Annual Value (£)</Label>
                        <Input
                          type="number"
                          value={driver.annualValue}
                          onChange={(e) => updateCostDriver(driver.id, { annualValue: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">FTE Equivalent</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={driver.fteEquivalent}
                          onChange={(e) => updateCostDriver(driver.id, { fteEquivalent: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Confidence (%)</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[driver.confidence]}
                            onValueChange={([v]) => updateCostDriver(driver.id, { confidence: v })}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm w-10">{driver.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Balance Sheet Section */}
        <AccordionItem value="balance-sheet" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Balance Sheet & Cash Flow</span>
              {getSectionStatus('balance-sheet') === 'complete' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Configured
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex justify-end mb-4">
              <SkipForNowButton 
                onSkip={() => markSectionSkipped('balance-sheet')}
                sectionName="Balance Sheet"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Working Capital Impact (£)</Label>
                <Input
                  type="number"
                  value={workingCapitalImpact}
                  onChange={(e) => setWorkingCapitalImpact(Number(e.target.value))}
                  placeholder="Positive = improvement, Negative = consumption"
                />
                <p className="text-xs text-muted-foreground">
                  Inventory reduction, receivables improvement, etc.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Cash Flow Impact (£)</Label>
                <Input
                  type="number"
                  value={cashFlowImpact}
                  onChange={(e) => setCashFlowImpact(Number(e.target.value))}
                  placeholder="Annual cash flow benefit"
                />
                <p className="text-xs text-muted-foreground">
                  Net impact on operating cash flow
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* RICE Score Section */}
        <AccordionItem value="rice" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">RICE Score</span>
              {riceScore > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  Score: {riceScore}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                RICE = (Reach × Impact × Confidence) ÷ Effort
              </p>
              <div className="flex items-center gap-2">
                <SkipForNowButton 
                  onSkip={() => markSectionSkipped('rice')}
                  sectionName="RICE Score"
                />
                {isAIFeatureEnabled('enableAutoRICEScoring') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={calculateRICEFromCOI}
                    disabled={isCalculatingRICE}
                  >
                    {isCalculatingRICE ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Auto-Calculate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reach (0-100)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[rice.reach]}
                      onValueChange={([v]) => setRice(prev => ({ ...prev, reach: v }))}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-10">{rice.reach}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How many users/customers affected?
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Impact (1-3)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[rice.impact]}
                      onValueChange={([v]) => setRice(prev => ({ ...prev, impact: v }))}
                      min={1}
                      max={3}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-10">{rice.impact}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    1=Minimal, 2=Medium, 3=High
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Confidence (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[rice.confidence]}
                      onValueChange={([v]) => setRice(prev => ({ ...prev, confidence: v }))}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-10">{rice.confidence}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How confident are we in these estimates?
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Effort (person-months)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[rice.effort]}
                      onValueChange={([v]) => setRice(prev => ({ ...prev, effort: v }))}
                      min={1}
                      max={12}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-10">{rice.effort}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Implementation effort
                  </p>
                </div>
              </div>
            </div>
            
            {/* RICE Result */}
            <Card className="mt-6 bg-amber-50 dark:bg-amber-950">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Calculated RICE Score</p>
                <p className="text-4xl font-bold text-amber-600">{riceScore}</p>
                <p className="text-sm mt-2">
                  ({rice.reach} × {rice.impact} × {rice.confidence}%) ÷ {rice.effort}
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Stage 2
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Continue to Stage 4
        </Button>
      </div>
    </div>
  )
}
