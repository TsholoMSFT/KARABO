/**
 * Stage 4: Commit & Communicate (MVP Merged Stage)
 * 
 * Merges the original Stage 7 (Commit) and Stage 8 (Communicate) into a single stage:
 * - Tab 1: Relationship Assessment (Trust, Engagement, Fit indicators)
 * - Tab 2: Yellow Lights (Potential issues to flag)
 * - Tab 3: Financial Summary (Auto-generated from Stage 3 data)
 * - Tab 4: Executive Summary (AI-generated option)
 * - Tab 5: Decision (Go/No-Go/Pause)
 */

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  AlertTriangle,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Pause,
  Check,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabCompletionIndicator } from '../TabCompletionIndicator'
import { SkipForNowButton } from '../SkipForNowButton'
import { VoiceInputField } from '../VoiceInputField'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import type {
  CommitCommunicateStageData,
  CommitStageData,
  CommunicateStageData,
  SolutionScopeStageData,
  OpportunityResourcesStageData,
  YellowLight,
  YesNoPartially,
  FitLevel,
  ViabilityLevel,
  CommitDecision,
  TabCompletionStatus,
} from '@/lib/types'

interface Stage4CommitCommunicateProps {
  initialData?: CommitCommunicateStageData
  solutionScopeData?: SolutionScopeStageData
  opportunityResourcesData?: OpportunityResourcesStageData
  onComplete: (data: CommitCommunicateStageData) => void
  onBack?: () => void
  isLiveMode?: boolean
  clientName?: string
}

// Tab definitions
const TABS = [
  { id: 'relationship', label: 'Relationship' },
  { id: 'yellow-lights', label: 'Yellow Lights' },
  { id: 'financial', label: 'Financial Summary' },
  { id: 'executive', label: 'Executive Summary' },
  { id: 'decision', label: 'Decision' },
]

// Default empty Commit data
const defaultCommitData: CommitStageData = {
  trustIndicators: {
    sharingRealNumbers: 'no',
    sharingRealConcerns: 'no',
    believeWeCanDeliver: 'no',
  },
  engagementIndicators: {
    accessToDecisionMakers: 'none',
    responsiveness: 'low',
    clientInvestingResources: 'no',
  },
  fitIndicators: {
    strategicFit: 'low',
    canDeliver: 'no',
    commercialViability: 'poor',
  },
  yellowLights: [],
  decision: 'pause',
}

// Default empty Communicate data
const defaultCommunicateData: CommunicateStageData = {
  plImpact: {
    year1: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 },
    year2: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 },
    year3: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 },
    total: { revenueImpact: 0, cogsImpact: 0, grossMarginImpact: 0, opexImpact: 0, ebitImpact: 0 },
  },
  investmentAnalysis: {
    totalInvestmentYear1: 0,
    totalAnnualBenefit: 0,
    simplePaybackMonths: 0,
    roi3Year: 0,
    npv10Percent: 0,
    irr: 0,
  },
  sensitivityAnalysis: {
    conservative: { annualBenefit: 0, paybackMonths: 0, roi3Year: 0, npv: 0 },
    base: { annualBenefit: 0, paybackMonths: 0, roi3Year: 0, npv: 0 },
    optimistic: { annualBenefit: 0, paybackMonths: 0, roi3Year: 0, npv: 0 },
  },
  threeStatementModel: {
    incomeStatement: {
      revenue: { year1: 0, year2: 0, year3: 0 },
      cogs: { year1: 0, year2: 0, year3: 0 },
      grossProfit: { year1: 0, year2: 0, year3: 0 },
      opex: {
        salesMarketing: { year1: 0, year2: 0, year3: 0 },
        rAndD: { year1: 0, year2: 0, year3: 0 },
        gAndA: { year1: 0, year2: 0, year3: 0 },
        total: { year1: 0, year2: 0, year3: 0 },
      },
      ebit: { year1: 0, year2: 0, year3: 0 },
    },
    balanceSheet: {
      workingCapitalChange: 0,
      inventoryReduction: 0,
      receivablesReduction: 0,
      capexAvoided: 0,
    },
    cashFlow: {
      operatingCashFlow: { year1: 0, year2: 0, year3: 0 },
      investingCashFlow: { year1: 0, year2: 0, year3: 0 },
      netCashFlow: { year1: 0, year2: 0, year3: 0 },
    },
  },
  metricHierarchy: {
    strategicOutcome: '',
    financialMetrics: [],
    operationalMetrics: [],
    activityMetrics: [],
  },
  valueDriversByPLLine: {
    revenue: [],
    cogs: [],
    opex: [],
    balanceSheet: [],
  },
}

export function Stage4CommitCommunicate({
  initialData,
  solutionScopeData,
  opportunityResourcesData,
  onComplete,
  onBack,
  isLiveMode = false,
  clientName = 'Customer',
}: Stage4CommitCommunicateProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('relationship')
  const [tabCompletion, setTabCompletion] = useState<Record<string, TabCompletionStatus>>(
    initialData?.tabCompletion || {}
  )
  
  // Commit data state (Relationship Assessment)
  const [trustIndicators, setTrustIndicators] = useState(
    initialData?.commit?.trustIndicators || defaultCommitData.trustIndicators
  )
  const [engagementIndicators, setEngagementIndicators] = useState(
    initialData?.commit?.engagementIndicators || defaultCommitData.engagementIndicators
  )
  const [fitIndicators, setFitIndicators] = useState(
    initialData?.commit?.fitIndicators || defaultCommitData.fitIndicators
  )
  
  // Yellow lights
  const [yellowLights, setYellowLights] = useState<YellowLight[]>(
    initialData?.commit?.yellowLights || []
  )
  
  // Decision
  const [decision, setDecision] = useState<CommitDecision>(
    initialData?.commit?.decision || 'pause'
  )
  
  // Executive Summary
  const [executiveSummary, setExecutiveSummary] = useState(
    initialData?.executiveSummary || ''
  )
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  
  // Calculate totals from solution scope data
  const financialTotals = useMemo(() => {
    const revenueImpact = solutionScopeData?.revenueImpact?.totalAnnualRevenue || 0
    const costImpact = solutionScopeData?.costImpact?.totalAnnualSavings || 0
    const totalAnnualValue = solutionScopeData?.totalAnnualValue || (revenueImpact + costImpact)
    const riskAdjustedValue = solutionScopeData?.riskAdjustedValue || totalAnnualValue * 0.8
    const fteEquivalent = solutionScopeData?.costImpact?.totalFTEEquivalent || 0
    
    return {
      revenueImpact,
      costImpact,
      totalAnnualValue,
      riskAdjustedValue,
      fteEquivalent,
    }
  }, [solutionScopeData])
  
  // Tab completion logic
  const markTabSkipped = useCallback((tabId: string) => {
    setTabCompletion(prev => ({ ...prev, [tabId]: 'skipped' }))
  }, [])
  
  const getTabStatus = useCallback((tabId: string): TabCompletionStatus => {
    if (tabCompletion[tabId] === 'skipped') return 'skipped'
    
    switch (tabId) {
      case 'relationship':
        return trustIndicators.sharingRealNumbers !== 'no' || 
               engagementIndicators.accessToDecisionMakers !== 'none' 
               ? 'complete' : 'not-started'
      case 'yellow-lights':
        return yellowLights.length > 0 || tabCompletion['yellow-lights'] === 'skipped' 
               ? 'complete' : 'not-started'
      case 'financial':
        return financialTotals.totalAnnualValue > 0 ? 'complete' : 'not-started'
      case 'executive':
        return executiveSummary.trim() ? 'complete' : 'not-started'
      case 'decision':
        return decision ? 'complete' : 'not-started'
      default:
        return tabCompletion[tabId] || 'not-started'
    }
  }, [tabCompletion, trustIndicators, engagementIndicators, yellowLights, financialTotals, executiveSummary, decision])
  
  const visibleTabs = useMemo(() => 
    TABS.map(tab => ({ ...tab, status: getTabStatus(tab.id) })),
    [getTabStatus]
  )
  
  // Yellow light handlers
  const addYellowLight = () => {
    setYellowLights([...yellowLights, {
      id: `yl-${Date.now()}`,
      description: '',
      stageIdentified: 'Stage 4',
      severity: 'moderate',
      resolutionPlan: '',
      owner: '',
      dueDate: null,
      resolved: false,
    }])
  }
  
  const updateYellowLight = (id: string, updates: Partial<YellowLight>) => {
    setYellowLights(yellowLights.map(yl => yl.id === id ? { ...yl, ...updates } : yl))
  }
  
  const removeYellowLight = (id: string) => {
    setYellowLights(yellowLights.filter(yl => yl.id !== id))
  }
  
  // AI Executive Summary generation
  const generateExecutiveSummary = async () => {
    if (!isAIFeatureEnabled('enableExecutiveSummary')) return
    if (typeof window.llm !== 'function') {
      alert('AI service not available')
      return
    }
    
    setIsGeneratingSummary(true)
    try {
      const problemStatement = opportunityResourcesData?.opportunity?.problemStatement || 'Not specified'
      const desiredOutcome = opportunityResourcesData?.opportunity?.desiredOutcome || 'Not specified'
      const coiTotal = opportunityResourcesData?.opportunity?.coi?.totalAnnual || 0
      
      const prompt = `You are an executive communications expert. Generate a concise executive summary for a business case presentation.

**Client:** ${clientName}
**Problem Statement:** ${problemStatement}
**Desired Outcome:** ${desiredOutcome}
**Cost of Inaction:** £${coiTotal.toLocaleString()}/year
**Projected Value:** £${financialTotals.totalAnnualValue.toLocaleString()}/year
**Revenue Impact:** £${financialTotals.revenueImpact.toLocaleString()}/year
**Cost Savings:** £${financialTotals.costImpact.toLocaleString()}/year
**FTE Equivalent:** ${financialTotals.fteEquivalent}
**Relationship Health:** Trust: ${trustIndicators.sharingRealNumbers}, Engagement: ${engagementIndicators.accessToDecisionMakers}
**Yellow Lights:** ${yellowLights.length} flagged
**Recommendation:** ${decision === 'proceed' ? 'Proceed' : decision === 'pause' ? 'Further Discussion' : 'Not Recommended'}

Write a professional 3-4 paragraph executive summary that:
1. Summarizes the opportunity and challenge
2. Highlights the quantified business value
3. Notes any concerns or caveats
4. Provides a clear recommendation

Keep it concise and impactful. Use British English spellings.`

      const response = await window.llm(prompt, 'gpt-4o-mini', true)
      setExecutiveSummary(response)
    } catch (error) {
      console.error('Failed to generate executive summary:', error)
      alert('Failed to generate summary. Please try again.')
    } finally {
      setIsGeneratingSummary(false)
    }
  }
  
  // Handle submit
  const handleSubmit = () => {
    const commitData: CommitStageData = {
      trustIndicators,
      engagementIndicators,
      fitIndicators,
      yellowLights,
      decision,
    }
    
    // Build communicate data from solution scope
    const communicateData: CommunicateStageData = {
      ...defaultCommunicateData,
      plImpact: {
        year1: { revenueImpact: financialTotals.revenueImpact * 0.5, cogsImpact: 0, grossMarginImpact: 0, opexImpact: financialTotals.costImpact * 0.5, ebitImpact: financialTotals.totalAnnualValue * 0.5 },
        year2: { revenueImpact: financialTotals.revenueImpact, cogsImpact: 0, grossMarginImpact: 0, opexImpact: financialTotals.costImpact, ebitImpact: financialTotals.totalAnnualValue },
        year3: { revenueImpact: financialTotals.revenueImpact, cogsImpact: 0, grossMarginImpact: 0, opexImpact: financialTotals.costImpact, ebitImpact: financialTotals.totalAnnualValue },
        total: { revenueImpact: financialTotals.revenueImpact * 2.5, cogsImpact: 0, grossMarginImpact: 0, opexImpact: financialTotals.costImpact * 2.5, ebitImpact: financialTotals.totalAnnualValue * 2.5 },
      },
      investmentAnalysis: {
        totalInvestmentYear1: 0, // Would need actual investment data
        totalAnnualBenefit: financialTotals.totalAnnualValue,
        simplePaybackMonths: 0,
        roi3Year: 0,
        npv10Percent: 0,
        irr: 0,
      },
    }
    
    const data: CommitCommunicateStageData = {
      commit: commitData,
      communicate: communicateData,
      executiveSummary,
      tabCompletion: visibleTabs.reduce((acc, tab) => {
        acc[tab.id] = getTabStatus(tab.id)
        return acc
      }, {} as Record<string, TabCompletionStatus>),
    }
    
    onComplete(data)
  }
  
  const isValid = decision !== undefined
  
  // Helper for Yes/No/Partially selection
  const YesNoPartiallySelector = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: YesNoPartially
    onChange: (v: YesNoPartially) => void
    label: string 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(v) => onChange(v as YesNoPartially)}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`} className="text-sm font-normal">Yes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="partially" id={`${label}-partially`} />
          <Label htmlFor={`${label}-partially`} className="text-sm font-normal">Partially</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="text-sm font-normal">No</Label>
        </div>
      </RadioGroup>
    </div>
  )
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">
          Stage 4: COMMIT & COMMUNICATE
        </h2>
        <p className="text-muted-foreground mt-2">
          Assess relationship quality, summarise the business case, and make a decision
        </p>
      </div>
      
      {/* Tab completion indicator */}
      <TabCompletionIndicator
        tabs={visibleTabs}
        currentTab={activeTab}
        onTabClick={setActiveTab}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="relative">
              {tab.label}
              {tab.status === 'complete' && (
                <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Relationship Assessment Tab */}
        <TabsContent value="relationship" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Relationship Assessment</CardTitle>
                <CardDescription>
                  Evaluate trust, engagement, and strategic fit
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('relationship')}
                sectionName="Relationship Assessment"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trust Indicators */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0078D4]" />
                  Trust Indicators
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <YesNoPartiallySelector
                    label="Sharing real numbers?"
                    value={trustIndicators.sharingRealNumbers}
                    onChange={(v) => setTrustIndicators({ ...trustIndicators, sharingRealNumbers: v })}
                  />
                  <YesNoPartiallySelector
                    label="Sharing real concerns?"
                    value={trustIndicators.sharingRealConcerns}
                    onChange={(v) => setTrustIndicators({ ...trustIndicators, sharingRealConcerns: v })}
                  />
                  <YesNoPartiallySelector
                    label="Believe we can deliver?"
                    value={trustIndicators.believeWeCanDeliver}
                    onChange={(v) => setTrustIndicators({ ...trustIndicators, believeWeCanDeliver: v })}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Engagement Indicators */}
              <div className="space-y-4">
                <h4 className="font-medium">Engagement Indicators</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Access to Decision Makers</Label>
                    <RadioGroup
                      value={engagementIndicators.accessToDecisionMakers}
                      onValueChange={(v) => setEngagementIndicators({ ...engagementIndicators, accessToDecisionMakers: v as 'full' | 'limited' | 'none' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="full" id="access-full" />
                        <Label htmlFor="access-full" className="text-sm font-normal">Full</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="limited" id="access-limited" />
                        <Label htmlFor="access-limited" className="text-sm font-normal">Limited</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="none" id="access-none" />
                        <Label htmlFor="access-none" className="text-sm font-normal">None</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Client Responsiveness</Label>
                    <RadioGroup
                      value={engagementIndicators.responsiveness}
                      onValueChange={(v) => setEngagementIndicators({ ...engagementIndicators, responsiveness: v as 'high' | 'medium' | 'low' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="high" id="resp-high" />
                        <Label htmlFor="resp-high" className="text-sm font-normal">High</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="medium" id="resp-medium" />
                        <Label htmlFor="resp-medium" className="text-sm font-normal">Medium</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="low" id="resp-low" />
                        <Label htmlFor="resp-low" className="text-sm font-normal">Low</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <YesNoPartiallySelector
                    label="Client investing resources?"
                    value={engagementIndicators.clientInvestingResources}
                    onChange={(v) => setEngagementIndicators({ ...engagementIndicators, clientInvestingResources: v })}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Fit Indicators */}
              <div className="space-y-4">
                <h4 className="font-medium">Fit Indicators</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Strategic Fit</Label>
                    <RadioGroup
                      value={fitIndicators.strategicFit}
                      onValueChange={(v) => setFitIndicators({ ...fitIndicators, strategicFit: v as FitLevel })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="high" id="fit-high" />
                        <Label htmlFor="fit-high" className="text-sm font-normal">High</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="medium" id="fit-medium" />
                        <Label htmlFor="fit-medium" className="text-sm font-normal">Medium</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="low" id="fit-low" />
                        <Label htmlFor="fit-low" className="text-sm font-normal">Low</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <YesNoPartiallySelector
                    label="Can we deliver?"
                    value={fitIndicators.canDeliver}
                    onChange={(v) => setFitIndicators({ ...fitIndicators, canDeliver: v })}
                  />
                  <div className="space-y-2">
                    <Label className="text-sm">Commercial Viability</Label>
                    <RadioGroup
                      value={fitIndicators.commercialViability}
                      onValueChange={(v) => setFitIndicators({ ...fitIndicators, commercialViability: v as ViabilityLevel })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="strong" id="viability-strong" />
                        <Label htmlFor="viability-strong" className="text-sm font-normal">Strong</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="moderate" id="viability-moderate" />
                        <Label htmlFor="viability-moderate" className="text-sm font-normal">Moderate</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="poor" id="viability-poor" />
                        <Label htmlFor="viability-poor" className="text-sm font-normal">Poor</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Yellow Lights Tab */}
        <TabsContent value="yellow-lights" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Yellow Lights
                </CardTitle>
                <CardDescription>
                  Flag any concerns, risks, or issues that need attention
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <SkipForNowButton 
                  onSkip={() => markTabSkipped('yellow-lights')}
                  sectionName="Yellow Lights"
                />
                <Button variant="outline" size="sm" onClick={addYellowLight}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Yellow Light
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {yellowLights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No yellow lights flagged.</p>
                  <p className="text-xs mt-1">Add any concerns or risks that need attention.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {yellowLights.map((yl) => (
                    <div key={yl.id} className="flex gap-3 items-start p-3 border rounded-lg bg-amber-50/50">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={yl.description}
                          onChange={(e) => updateYellowLight(yl.id, { description: e.target.value })}
                          placeholder="Describe the concern..."
                          className="bg-white"
                        />
                        <div className="flex items-center gap-4">
                          <RadioGroup
                            value={yl.severity}
                            onValueChange={(v) => updateYellowLight(yl.id, { severity: v as 'minor' | 'moderate' | 'serious' | 'deal-breaker' })}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="minor" id={`${yl.id}-minor`} />
                              <Label htmlFor={`${yl.id}-minor`} className="text-xs">Minor</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="moderate" id={`${yl.id}-moderate`} />
                              <Label htmlFor={`${yl.id}-moderate`} className="text-xs">Moderate</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="serious" id={`${yl.id}-serious`} />
                              <Label htmlFor={`${yl.id}-serious`} className="text-xs">Serious</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="deal-breaker" id={`${yl.id}-deal-breaker`} />
                              <Label htmlFor={`${yl.id}-deal-breaker`} className="text-xs">Deal-breaker</Label>
                            </div>
                          </RadioGroup>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`${yl.id}-resolved`}
                              checked={yl.resolved}
                              onChange={(e) => updateYellowLight(yl.id, { resolved: e.target.checked })}
                              className="h-4 w-4"
                              title="Mark as resolved"
                            />
                            <Label htmlFor={`${yl.id}-resolved`} className="text-xs">Resolved</Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeYellowLight(yl.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Financial Summary Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#0078D4]" />
                  Financial Summary
                </CardTitle>
                <CardDescription>
                  Consolidated financial impact from Stage 3 data
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('financial')}
                sectionName="Financial Summary"
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-green-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground">Revenue Impact</p>
                    <p className="text-2xl font-bold text-green-600">
                      £{financialTotals.revenueImpact.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">/year</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground">Cost Savings</p>
                    <p className="text-2xl font-bold text-blue-600">
                      £{financialTotals.costImpact.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">/year</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      £{financialTotals.totalAnnualValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">/year</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground">FTE Equivalent</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {financialTotals.fteEquivalent.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">full-time</p>
                  </CardContent>
                </Card>
              </div>
              
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Financial data is automatically calculated from Stage 3: Solution Scope.
                  Detailed financial statements are available for export.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Executive Summary Tab */}
        <TabsContent value="executive" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0078D4]" />
                  Executive Summary
                </CardTitle>
                <CardDescription>
                  High-level summary for leadership presentation
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <SkipForNowButton 
                  onSkip={() => markTabSkipped('executive')}
                  sectionName="Executive Summary"
                />
                {isAIFeatureEnabled('enableExecutiveSummary') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateExecutiveSummary}
                    disabled={isGeneratingSummary}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLiveMode ? (
                <VoiceInputField
                  value={executiveSummary}
                  onChange={setExecutiveSummary}
                  placeholder="Write or dictate the executive summary..."
                  rows={12}
                />
              ) : (
                <Textarea
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  placeholder="Write the executive summary for this opportunity..."
                  rows={12}
                  className="min-h-[300px]"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Decision Tab */}
        <TabsContent value="decision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
              <CardDescription>
                Based on the discovery findings, make a recommendation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:border-green-400',
                    decision === 'proceed' && 'border-green-500 bg-green-50 ring-2 ring-green-500'
                  )}
                  onClick={() => setDecision('proceed')}
                >
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className={cn(
                      'h-12 w-12 mx-auto mb-3',
                      decision === 'proceed' ? 'text-green-600' : 'text-gray-400'
                    )} />
                    <h3 className="font-semibold text-lg">GO</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Proceed with proposal
                    </p>
                  </CardContent>
                </Card>
                
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:border-amber-400',
                    decision === 'pause' && 'border-amber-500 bg-amber-50 ring-2 ring-amber-500'
                  )}
                  onClick={() => setDecision('pause')}
                >
                  <CardContent className="pt-6 text-center">
                    <Pause className={cn(
                      'h-12 w-12 mx-auto mb-3',
                      decision === 'pause' ? 'text-amber-600' : 'text-gray-400'
                    )} />
                    <h3 className="font-semibold text-lg">PAUSE</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Need more information
                    </p>
                  </CardContent>
                </Card>
                
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:border-red-400',
                    decision === 'walk-away' && 'border-red-500 bg-red-50 ring-2 ring-red-500'
                  )}
                  onClick={() => setDecision('walk-away')}
                >
                  <CardContent className="pt-6 text-center">
                    <XCircle className={cn(
                      'h-12 w-12 mx-auto mb-3',
                      decision === 'walk-away' ? 'text-red-600' : 'text-gray-400'
                    )} />
                    <h3 className="font-semibold text-lg">NO-GO</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Not recommended
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {decision && (
                <Alert className={cn(
                  'mt-6',
                  decision === 'proceed' && 'bg-green-50 border-green-200',
                  decision === 'pause' && 'bg-amber-50 border-amber-200',
                  decision === 'walk-away' && 'bg-red-50 border-red-200'
                )}>
                  <AlertDescription>
                    {decision === 'proceed' && 'This opportunity is recommended for proposal development.'}
                    {decision === 'pause' && 'Additional discovery or clarification needed before proceeding.'}
                    {decision === 'walk-away' && 'This opportunity is not recommended to pursue at this time.'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Stage 3
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Complete Discovery
        </Button>
      </div>
    </div>
  )
}
