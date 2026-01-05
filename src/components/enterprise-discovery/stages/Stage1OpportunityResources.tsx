import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurrencyInput } from '@/components/ui/currency-input'
import { 
  Loader2, Sparkles, CheckCircle2, XCircle, CalendarIcon, Plus, Mic, Check, Clock, SkipForward 
} from 'lucide-react'
import { format } from 'date-fns'
import { VoiceInputField } from '../VoiceInputField'
import { TabCompletionIndicator } from '../TabCompletionIndicator'
import { SkipForNowButton } from '../SkipForNowButton'
import { calculateTotalCOI } from '@/lib/financial-calculations'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import type { 
  OpportunityResourcesStageData, 
  OpportunityStageData,
  ResourcesStageData,
  ProblemCategory, 
  AffectedArea, 
  TimelineExpectation, 
  SCQStatus,
  BudgetStatus,
  BudgetRange,
  CapacityLevel,
  DataAvailability,
  DiscoveryType,
  TabCompletionStatus,
  PROGRESSIVE_DISCLOSURE,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Stage1OpportunityResourcesProps {
  initialData?: OpportunityResourcesStageData
  discoveryType: DiscoveryType
  onComplete: (data: OpportunityResourcesStageData) => void
  onBack?: () => void
  isLiveMode?: boolean
}

// Default empty opportunity data
const defaultOpportunityData: OpportunityStageData = {
  problemStatement: '',
  problemCategory: 'efficiency',
  affectedArea: 'process',
  desiredOutcome: '',
  successMetrics: [''],
  timelineExpectation: '3-6-months',
  coi: {
    directCosts: { oneTime: 0, recurring: 0 },
    opportunityCosts: { oneTime: 0, recurring: 0 },
    riskCosts: { oneTime: 0, oneTimeProbability: 50, recurring: 0, recurringProbability: 50 },
    totalAnnual: 0,
  },
  scq: { situation: '', complication: '', question: '', status: 'pending' },
}

// Default empty resources data
const defaultResourcesData: ResourcesStageData = {
  budgetStatus: 'unknown',
  budgetRange: 'unknown',
  roiExpectation: '',
  budgetOwner: '',
  executiveSponsor: '',
  projectLead: '',
  teamCapacity: 'unknown',
  changeReadiness: 'unknown',
  existingPlatforms: [''],
  dataAvailability: 'unknown',
  integrationRequirements: [''],
  technicalDebtConcerns: '',
  targetStart: null,
  targetCompletion: null,
  competingPriorities: [''],
  hardDependencies: [''],
  scq: { situation: '', complication: '', question: '', status: 'pending' },
}

// Tab definitions
const ALL_TABS = [
  { id: 'current-state', label: 'Current State', group: 'opportunity' },
  { id: 'desired-state', label: 'Desired State', group: 'opportunity' },
  { id: 'coi', label: 'Cost of Inaction', group: 'opportunity' },
  { id: 'financial', label: 'Financial', group: 'resources' },
  { id: 'human', label: 'Human', group: 'resources' },
  { id: 'technical', label: 'Technical', group: 'resources' },
  { id: 'temporal', label: 'Temporal', group: 'resources' },
  { id: 'scq', label: 'SCQ Confirmation', group: 'confirmation' },
]

export function Stage1OpportunityResources({ 
  initialData, 
  discoveryType,
  onComplete, 
  onBack, 
  isLiveMode = false 
}: Stage1OpportunityResourcesProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  
  // Get progressive disclosure config
  const disclosure = useMemo(() => {
    // Import PROGRESSIVE_DISCLOSURE from types
    const config: Record<DiscoveryType, { showProblemStatement: boolean; showFullCOI: boolean; showBudgetDetails: boolean; showCompetitiveAnalysis: boolean; prefillFromExisting: boolean; focusOnRelationship: boolean; showMACCFields: boolean }> = {
      'new-opportunity': {
        showProblemStatement: true,
        showFullCOI: true,
        showBudgetDetails: true,
        showCompetitiveAnalysis: true,
        prefillFromExisting: false,
        focusOnRelationship: false,
        showMACCFields: false,
      },
      'expansion': {
        showProblemStatement: false,
        showFullCOI: true,
        showBudgetDetails: true,
        showCompetitiveAnalysis: false,
        prefillFromExisting: true,
        focusOnRelationship: false,
        showMACCFields: false,
      },
      'renewal': {
        showProblemStatement: false,
        showFullCOI: false,
        showBudgetDetails: false,
        showCompetitiveAnalysis: true,
        prefillFromExisting: true,
        focusOnRelationship: true,
        showMACCFields: false,
      },
      'macc': {
        showProblemStatement: true,
        showFullCOI: true,
        showBudgetDetails: true,
        showCompetitiveAnalysis: false,
        prefillFromExisting: false,
        focusOnRelationship: false,
        showMACCFields: true,
      },
    }
    return config[discoveryType] || config['new-opportunity']
  }, [discoveryType])

  // Tab completion tracking
  const [tabCompletion, setTabCompletion] = useState<Record<string, TabCompletionStatus>>(
    initialData?.tabCompletion || {}
  )
  const [activeTab, setActiveTab] = useState('current-state')

  // Opportunity state (Stage 1)
  const [problemStatement, setProblemStatement] = useState(initialData?.opportunity?.problemStatement || '')
  const [problemCategory, setProblemCategory] = useState<ProblemCategory>(
    initialData?.opportunity?.problemCategory || 'efficiency'
  )
  const [affectedArea, setAffectedArea] = useState<AffectedArea>(
    initialData?.opportunity?.affectedArea || 'process'
  )
  const [desiredOutcome, setDesiredOutcome] = useState(initialData?.opportunity?.desiredOutcome || '')
  const [successMetrics, setSuccessMetrics] = useState<string[]>(
    initialData?.opportunity?.successMetrics || ['']
  )
  const [timelineExpectation, setTimelineExpectation] = useState<TimelineExpectation>(
    initialData?.opportunity?.timelineExpectation || '3-6-months'
  )
  const [coi, setCoi] = useState(
    initialData?.opportunity?.coi || defaultOpportunityData.coi
  )
  
  // Resources state (Stage 2)
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>(
    initialData?.resources?.budgetStatus || 'unknown'
  )
  const [budgetRange, setBudgetRange] = useState<BudgetRange>(
    initialData?.resources?.budgetRange || 'unknown'
  )
  const [roiExpectation, setRoiExpectation] = useState(initialData?.resources?.roiExpectation || '')
  const [budgetOwner, setBudgetOwner] = useState(initialData?.resources?.budgetOwner || '')
  const [executiveSponsor, setExecutiveSponsor] = useState(initialData?.resources?.executiveSponsor || '')
  const [projectLead, setProjectLead] = useState(initialData?.resources?.projectLead || '')
  const [teamCapacity, setTeamCapacity] = useState<CapacityLevel>(
    initialData?.resources?.teamCapacity || 'unknown'
  )
  const [changeReadiness, setChangeReadiness] = useState<CapacityLevel>(
    initialData?.resources?.changeReadiness || 'unknown'
  )
  const [existingPlatforms, setExistingPlatforms] = useState<string[]>(
    initialData?.resources?.existingPlatforms || ['']
  )
  const [dataAvailability, setDataAvailability] = useState<DataAvailability>(
    initialData?.resources?.dataAvailability || 'unknown'
  )
  const [integrationRequirements, setIntegrationRequirements] = useState<string[]>(
    initialData?.resources?.integrationRequirements || ['']
  )
  const [technicalDebtConcerns, setTechnicalDebtConcerns] = useState(
    initialData?.resources?.technicalDebtConcerns || ''
  )
  const [targetStart, setTargetStart] = useState<Date | null>(
    initialData?.resources?.targetStart ? new Date(initialData.resources.targetStart) : null
  )
  const [targetCompletion, setTargetCompletion] = useState<Date | null>(
    initialData?.resources?.targetCompletion ? new Date(initialData.resources.targetCompletion) : null
  )
  const [competingPriorities, setCompetingPriorities] = useState<string[]>(
    initialData?.resources?.competingPriorities || ['']
  )
  const [hardDependencies, setHardDependencies] = useState<string[]>(
    initialData?.resources?.hardDependencies || ['']
  )

  // Combined SCQ (single SCQ for the merged stage)
  const [scq, setScq] = useState(
    initialData?.opportunity?.scq || defaultOpportunityData.scq
  )
  const [isGeneratingSCQ, setIsGeneratingSCQ] = useState(false)

  const totalCOI = calculateTotalCOI(coi)

  // Tab completion logic
  const updateTabCompletion = useCallback((tabId: string, status: TabCompletionStatus) => {
    setTabCompletion(prev => ({ ...prev, [tabId]: status }))
  }, [])

  const markTabSkipped = useCallback((tabId: string) => {
    updateTabCompletion(tabId, 'skipped')
  }, [updateTabCompletion])

  // Check if tab is complete based on its fields
  const getTabStatus = useCallback((tabId: string): TabCompletionStatus => {
    if (tabCompletion[tabId] === 'skipped') return 'skipped'
    
    switch (tabId) {
      case 'current-state':
        return problemStatement.trim() ? 'complete' : 'not-started'
      case 'desired-state':
        return desiredOutcome.trim() && successMetrics.some(m => m.trim()) ? 'complete' : 'not-started'
      case 'coi':
        return totalCOI > 0 ? 'complete' : 'not-started'
      case 'financial':
        return budgetStatus !== 'unknown' || budgetRange !== 'unknown' ? 'complete' : 'not-started'
      case 'human':
        return executiveSponsor.trim() || projectLead.trim() ? 'complete' : 'not-started'
      case 'technical':
        return existingPlatforms.some(p => p.trim()) || dataAvailability !== 'unknown' ? 'complete' : 'not-started'
      case 'temporal':
        return targetStart !== null || targetCompletion !== null ? 'complete' : 'not-started'
      case 'scq':
        return scq.status === 'confirmed' || scq.status === 'adjusted' ? 'complete' : 
               scq.situation.trim() ? 'pending' : 'not-started'
      default:
        return tabCompletion[tabId] || 'not-started'
    }
  }, [tabCompletion, problemStatement, desiredOutcome, successMetrics, totalCOI, budgetStatus, budgetRange, executiveSponsor, projectLead, existingPlatforms, dataAvailability, targetStart, targetCompletion, scq])

  // Get visible tabs based on discovery type
  const visibleTabs = useMemo(() => {
    let tabs = [...ALL_TABS]
    
    // For renewal, hide COI tab (simplified)
    if (!disclosure.showFullCOI) {
      tabs = tabs.filter(t => t.id !== 'coi')
    }
    
    // For renewal, hide budget details
    if (!disclosure.showBudgetDetails) {
      tabs = tabs.filter(t => t.id !== 'financial')
    }
    
    return tabs.map(tab => ({
      ...tab,
      status: getTabStatus(tab.id),
    }))
  }, [disclosure, getTabStatus])

  // Success metrics helpers
  const updateSuccessMetric = (index: number, value: string) => {
    const updated = [...successMetrics]
    updated[index] = value
    setSuccessMetrics(updated)
  }

  const addSuccessMetric = () => {
    setSuccessMetrics([...successMetrics, ''])
  }

  const removeSuccessMetric = (index: number) => {
    if (successMetrics.length > 1) {
      setSuccessMetrics(successMetrics.filter((_, i) => i !== index))
    }
  }

  // SCQ generation
  const generateSCQ = async () => {
    if (typeof window.llm !== 'function') {
      alert('AI service is not available. Please check your connection and try again, or enter SCQ manually.')
      return
    }
    
    setIsGeneratingSCQ(true)
    try {
      const prompt = `You are a business discovery consultant. Generate a concise SCQ (Situation-Complication-Question) framework based on the following:

**Discovery Type**: ${discoveryType}
**Problem Statement**: ${problemStatement || 'Not specified'}
**Problem Category**: ${problemCategory}
**Affected Area**: ${affectedArea}
**Desired Outcome**: ${desiredOutcome}
**Annual Cost of Inaction**: £${totalCOI.toLocaleString()}
**Budget Range**: ${budgetRange}
**Team Capacity**: ${teamCapacity}
**Executive Sponsor**: ${executiveSponsor || 'TBD'}

Generate a professional SCQ in the following format:
- Situation: A 1-2 sentence summary of the current state
- Complication: A 1-2 sentence statement of the problem and its cost/impact
- Question: A clear strategic question that frames the next steps

Return ONLY a JSON object with keys: situation, complication, question`

      const response = await window.llm(prompt, 'gpt-4o-mini', true)
      const parsed = JSON.parse(response)

      setScq({
        situation: parsed.situation || '',
        complication: parsed.complication || '',
        question: parsed.question || '',
        status: 'pending',
      })
    } catch (error) {
      console.error('Failed to generate SCQ:', error)
      alert('Failed to generate SCQ. Please try again or enter manually.')
    } finally {
      setIsGeneratingSCQ(false)
    }
  }

  const handleSubmit = () => {
    const opportunityData: OpportunityStageData = {
      problemStatement,
      problemCategory,
      affectedArea,
      desiredOutcome,
      successMetrics: successMetrics.filter(m => m.trim() !== ''),
      timelineExpectation,
      coi: { ...coi, totalAnnual: totalCOI },
      scq,
    }

    const resourcesData: ResourcesStageData = {
      budgetStatus,
      budgetRange,
      roiExpectation,
      budgetOwner,
      executiveSponsor,
      projectLead,
      teamCapacity,
      changeReadiness,
      existingPlatforms: existingPlatforms.filter(p => p.trim() !== ''),
      dataAvailability,
      integrationRequirements: integrationRequirements.filter(r => r.trim() !== ''),
      technicalDebtConcerns,
      targetStart: targetStart?.getTime() || null,
      targetCompletion: targetCompletion?.getTime() || null,
      competingPriorities: competingPriorities.filter(p => p.trim() !== ''),
      hardDependencies: hardDependencies.filter(d => d.trim() !== ''),
      scq, // Use same SCQ
    }

    const data: OpportunityResourcesStageData = {
      opportunity: opportunityData,
      resources: resourcesData,
      tabCompletion: visibleTabs.reduce((acc, tab) => {
        acc[tab.id] = getTabStatus(tab.id)
        return acc
      }, {} as Record<string, TabCompletionStatus>),
    }

    onComplete(data)
  }

  // Allow proceeding if SCQ is confirmed/adjusted OR if user has skipped it
  const isValid = 
    scq.status === 'confirmed' || 
    scq.status === 'adjusted' || 
    tabCompletion['scq'] === 'skipped'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">
            Stage 1: OPPORTUNITY & RESOURCES
          </h2>
          <Badge variant="outline" className="capitalize">{discoveryType.replace('-', ' ')}</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Understand the problem, quantify what's at stake, and assess available resources
        </p>
      </div>

      {/* Tab completion indicator */}
      <TabCompletionIndicator 
        tabs={visibleTabs}
        currentTab={activeTab}
        onTabClick={setActiveTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={cn(
          'grid w-full',
          visibleTabs.length <= 6 ? `grid-cols-${visibleTabs.length}` : 'grid-cols-4 md:grid-cols-8'
        )}>
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="relative">
              {tab.label}
              {tab.status === 'complete' && (
                <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Current State Tab */}
        <TabsContent value="current-state" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Current State</CardTitle>
                <CardDescription>
                  {disclosure.showProblemStatement 
                    ? 'Use funneling questions: Broad → Probe → Confirm'
                    : 'Describe the current situation for this expansion/renewal'
                  }
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('current-state')}
                sectionName="Current State"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {disclosure.showProblemStatement && (
                <div className="space-y-2">
                  <Label htmlFor="problem-statement">
                    Problem Statement <span className="text-destructive">*</span>
                  </Label>
                  {isLiveMode ? (
                    <VoiceInputField
                      value={problemStatement}
                      onChange={setProblemStatement}
                      placeholder="What's driving this conversation today? Tell me more about the core issue..."
                      rows={4}
                    />
                  ) : (
                    <Textarea
                      id="problem-statement"
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="What's driving this conversation today? Tell me more about the core issue..."
                      rows={4}
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="problem-category">Problem Category</Label>
                  <Select value={problemCategory} onValueChange={(v) => setProblemCategory(v as ProblemCategory)}>
                    <SelectTrigger id="problem-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efficiency">Efficiency</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="risk">Risk</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affected-area">Affected Area</Label>
                  <Select value={affectedArea} onValueChange={(v) => setAffectedArea(v as AffectedArea)}>
                    <SelectTrigger id="affected-area">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="process">Process</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="multiple">Multiple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Desired State Tab */}
        <TabsContent value="desired-state" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Desired State</CardTitle>
                <CardDescription>
                  If we fast-forward 12-18 months and this is solved, what's different?
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('desired-state')}
                sectionName="Desired State"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="desired-outcome">
                  Desired Outcome <span className="text-destructive">*</span>
                </Label>
                {isLiveMode ? (
                  <VoiceInputField
                    value={desiredOutcome}
                    onChange={setDesiredOutcome}
                    placeholder="Describe what success looks like..."
                    rows={4}
                  />
                ) : (
                  <Textarea
                    id="desired-outcome"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="Describe what success looks like..."
                    rows={4}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline Expectation</Label>
                <Select value={timelineExpectation} onValueChange={(v) => setTimelineExpectation(v as TimelineExpectation)}>
                  <SelectTrigger id="timeline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<3-months">&lt; 3 months</SelectItem>
                    <SelectItem value="3-6-months">3-6 months</SelectItem>
                    <SelectItem value="6-12-months">6-12 months</SelectItem>
                    <SelectItem value="12+-months">12+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Success Metrics <span className="text-destructive">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSuccessMetric}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Metric
                  </Button>
                </div>
                {successMetrics.map((metric, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={metric}
                      onChange={(e) => updateSuccessMetric(index, e.target.value)}
                      placeholder="How would you measure success?"
                    />
                    {successMetrics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSuccessMetric(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost of Inaction Tab - only shown for certain discovery types */}
        {disclosure.showFullCOI && (
          <TabsContent value="coi" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cost of Inaction (COI) — 4 Boxes</CardTitle>
                  <CardDescription>
                    Quantify the financial impact of not solving this problem
                  </CardDescription>
                </div>
                <SkipForNowButton 
                  onSkip={() => markTabSkipped('coi')}
                  sectionName="Cost of Inaction"
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Direct Costs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Direct Costs (Money Out)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CurrencyInput
                        label="One-Time"
                        value={coi.directCosts.oneTime}
                        onChange={(v) => setCoi({ ...coi, directCosts: { ...coi.directCosts, oneTime: v } })}
                      />
                      <CurrencyInput
                        label="Recurring (per month)"
                        value={coi.directCosts.recurring}
                        onChange={(v) => setCoi({ ...coi, directCosts: { ...coi.directCosts, recurring: v } })}
                      />
                    </CardContent>
                  </Card>

                  {/* Opportunity Costs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Opportunity Costs (Money Lost)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CurrencyInput
                        label="One-Time"
                        value={coi.opportunityCosts.oneTime}
                        onChange={(v) => setCoi({ ...coi, opportunityCosts: { ...coi.opportunityCosts, oneTime: v } })}
                      />
                      <CurrencyInput
                        label="Recurring (per month)"
                        value={coi.opportunityCosts.recurring}
                        onChange={(v) => setCoi({ ...coi, opportunityCosts: { ...coi.opportunityCosts, recurring: v } })}
                      />
                    </CardContent>
                  </Card>

                  {/* Risk Costs */}
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">Risk Costs (Exposure)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <CurrencyInput
                          label="One-Time Risk Exposure"
                          value={coi.riskCosts.oneTime}
                          onChange={(v) => setCoi({ ...coi, riskCosts: { ...coi.riskCosts, oneTime: v } })}
                        />
                        <div className="space-y-2">
                          <Label>Probability (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={coi.riskCosts.oneTimeProbability}
                            onChange={(e) => setCoi({ ...coi, riskCosts: { ...coi.riskCosts, oneTimeProbability: Number(e.target.value) } })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <CurrencyInput
                          label="Recurring Risk (per month)"
                          value={coi.riskCosts.recurring}
                          onChange={(v) => setCoi({ ...coi, riskCosts: { ...coi.riskCosts, recurring: v } })}
                        />
                        <div className="space-y-2">
                          <Label>Probability (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={coi.riskCosts.recurringProbability}
                            onChange={(e) => setCoi({ ...coi, riskCosts: { ...coi.riskCosts, recurringProbability: Number(e.target.value) } })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Total */}
                <Alert>
                  <AlertDescription className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Annual Cost of Inaction:</span>
                    <span className="text-2xl">£{totalCOI.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Financial Resources Tab */}
        {disclosure.showBudgetDetails && (
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Financial Resources</CardTitle>
                  <CardDescription>Budget and investment expectations</CardDescription>
                </div>
                <SkipForNowButton 
                  onSkip={() => markTabSkipped('financial')}
                  sectionName="Financial Resources"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Budget Status</Label>
                    <Select value={budgetStatus} onValueChange={(v) => setBudgetStatus(v as BudgetStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allocated">Allocated</SelectItem>
                        <SelectItem value="accessible">Accessible</SelectItem>
                        <SelectItem value="needs-case">Needs Case</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Range</Label>
                    <Select value={budgetRange} onValueChange={(v) => setBudgetRange(v as BudgetRange)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<50k">&lt; £50K</SelectItem>
                        <SelectItem value="50-150k">£50-150K</SelectItem>
                        <SelectItem value="150-500k">£150-500K</SelectItem>
                        <SelectItem value="500k-1m">£500K-1M</SelectItem>
                        <SelectItem value=">1m">&gt; £1M</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ROI Expectation</Label>
                  <Input
                    value={roiExpectation}
                    onChange={(e) => setRoiExpectation(e.target.value)}
                    placeholder="e.g., 3x, 150%, 12 months payback"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget Owner</Label>
                  <Input
                    value={budgetOwner}
                    onChange={(e) => setBudgetOwner(e.target.value)}
                    placeholder="Name / Role"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Human Resources Tab */}
        <TabsContent value="human" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Human Resources</CardTitle>
                <CardDescription>Key people and organizational capacity</CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('human')}
                sectionName="Human Resources"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Executive Sponsor</Label>
                  <Input
                    value={executiveSponsor}
                    onChange={(e) => setExecutiveSponsor(e.target.value)}
                    placeholder="Name / Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Lead</Label>
                  <Input
                    value={projectLead}
                    onChange={(e) => setProjectLead(e.target.value)}
                    placeholder="Name / Role"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Team Capacity</Label>
                  <Select value={teamCapacity} onValueChange={(v) => setTeamCapacity(v as CapacityLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Change Readiness</Label>
                  <Select value={changeReadiness} onValueChange={(v) => setChangeReadiness(v as CapacityLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Resources Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Technical Resources</CardTitle>
                <CardDescription>Existing systems and technical readiness</CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('technical')}
                sectionName="Technical Resources"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Existing Platforms</Label>
                {existingPlatforms.map((platform, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={platform}
                      onChange={(e) => {
                        const updated = [...existingPlatforms]
                        updated[i] = e.target.value
                        setExistingPlatforms(updated)
                      }}
                      placeholder="System name"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExistingPlatforms([...existingPlatforms, ''])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Platform
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Data Availability</Label>
                <Select value={dataAvailability} onValueChange={(v) => setDataAvailability(v as DataAvailability)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="needs-work">Needs Work</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Technical Debt Concerns</Label>
                <Textarea
                  value={technicalDebtConcerns}
                  onChange={(e) => setTechnicalDebtConcerns(e.target.value)}
                  placeholder="Describe any technical debt concerns..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporal Resources Tab */}
        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Temporal Resources</CardTitle>
                <CardDescription>Timeline and scheduling constraints</CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('temporal')}
                sectionName="Temporal Resources"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetStart ? format(targetStart, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={targetStart || undefined} onSelect={(d) => setTargetStart(d ?? null)} required={false} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Target Completion</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetCompletion ? format(targetCompletion, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={targetCompletion || undefined}
                        onSelect={(d) => setTargetCompletion(d ?? null)}
                        required={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCQ Confirmation Tab */}
        <TabsContent value="scq" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>SCQ Confirmation</CardTitle>
                <CardDescription>
                  Situation-Complication-Question framework to confirm understanding
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <SkipForNowButton 
                  onSkip={() => markTabSkipped('scq')}
                  sectionName="SCQ Confirmation"
                />
                {isAIFeatureEnabled('enableSCQGeneration') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSCQ}
                    disabled={isGeneratingSCQ}
                  >
                    {isGeneratingSCQ ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Auto-Generate SCQ
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="situation">Situation</Label>
                  {isLiveMode ? (
                    <VoiceInputField
                      value={scq.situation}
                      onChange={(v) => setScq({ ...scq, situation: v })}
                      placeholder="Summary of the current state..."
                      rows={2}
                    />
                  ) : (
                    <Textarea
                      id="situation"
                      value={scq.situation}
                      onChange={(e) => setScq({ ...scq, situation: e.target.value })}
                      placeholder="Summary of the current state..."
                      rows={2}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complication">Complication</Label>
                  {isLiveMode ? (
                    <VoiceInputField
                      value={scq.complication}
                      onChange={(v) => setScq({ ...scq, complication: v })}
                      placeholder="The problem and its impact..."
                      rows={2}
                    />
                  ) : (
                    <Textarea
                      id="complication"
                      value={scq.complication}
                      onChange={(e) => setScq({ ...scq, complication: e.target.value })}
                      placeholder="The problem and its impact..."
                      rows={2}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  {isLiveMode ? (
                    <VoiceInputField
                      value={scq.question}
                      onChange={(v) => setScq({ ...scq, question: v })}
                      placeholder="Strategic question framing next steps..."
                      rows={2}
                    />
                  ) : (
                    <Textarea
                      id="question"
                      value={scq.question}
                      onChange={(e) => setScq({ ...scq, question: e.target.value })}
                      placeholder="Strategic question framing next steps..."
                      rows={2}
                    />
                  )}
                </div>
              </div>

              {(scq.situation || scq.complication || scq.question) && (
                <div className="space-y-3">
                  <Label>Confirm SCQ Status</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={scq.status === 'confirmed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScq({ ...scq, status: 'confirmed' })}
                      className={cn(scq.status === 'confirmed' && 'bg-green-600 hover:bg-green-700')}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Confirmed
                    </Button>
                    <Button
                      variant={scq.status === 'adjusted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScq({ ...scq, status: 'adjusted' })}
                      className={cn(scq.status === 'adjusted' && 'bg-blue-600 hover:bg-blue-700')}
                    >
                      Adjusted
                    </Button>
                    <Button
                      variant={scq.status === 'rejected' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setScq({ ...scq, status: 'rejected' })}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rejected
                    </Button>
                  </div>
                  {scq.status === 'rejected' && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        SCQ rejected. Please adjust or regenerate before proceeding.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {tabCompletion['scq'] === 'skipped' && (
                <Alert>
                  <SkipForward className="h-4 w-4" />
                  <AlertDescription>
                    SCQ confirmation skipped. You can return to complete this section later.
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
          Back to Stage 0
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid && scq.status === 'rejected'} 
          className="bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Continue to Stage 2
        </Button>
      </div>
    </div>
  )
}
