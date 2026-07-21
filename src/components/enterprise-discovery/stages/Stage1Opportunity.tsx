import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, CheckCircle2, XCircle, Edit, Mic, Info, Target } from 'lucide-react'
import { VoiceInputField } from '../VoiceInputField'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import type { OpportunityStageData, ProblemCategory, AffectedArea, TimelineExpectation, SCQStatus, BusinessEnvisioningData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Stage1OpportunityProps {
  initialData?: OpportunityStageData
  businessEnvisioning?: BusinessEnvisioningData
  onComplete: (data: OpportunityStageData) => void
  onBack?: () => void
  isLiveMode?: boolean
}

export function Stage1Opportunity({ initialData, businessEnvisioning, onComplete, onBack, isLiveMode = false }: Stage1OpportunityProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  
  // Check if we have Business Envisioning data to pre-populate
  const hasBusinessEnvisioningData = businessEnvisioning && (
    (businessEnvisioning.strategicPriorities && businessEnvisioning.strategicPriorities.length > 0) ||
    (businessEnvisioning.businessOutcomes && businessEnvisioning.businessOutcomes.length > 0) ||
    (businessEnvisioning.businessProcesses && businessEnvisioning.businessProcesses.length > 0)
  )
  
  // Helper to derive problem statement from Business Envisioning
  const deriveProblemStatement = (): string => {
    if (!businessEnvisioning) return ''
    const parts: string[] = []
    
    // From strategic priorities
    if (businessEnvisioning.strategicPriorities && businessEnvisioning.strategicPriorities.length > 0) {
      const topPriority = businessEnvisioning.strategicPriorities[0]
      parts.push(`Strategic Priority: ${topPriority.priority}`)
      if (topPriority.sourceDetail) {
        parts.push(`Context: ${topPriority.sourceDetail}`)
      }
    }
    
    // From business processes - look for pain points
    if (businessEnvisioning.businessProcesses && businessEnvisioning.businessProcesses.length > 0) {
      const painPoints: string[] = []
      businessEnvisioning.businessProcesses.forEach(process => {
        process.steps?.forEach(step => {
          step.painPoints?.forEach(pp => {
            painPoints.push(pp.description)
          })
        })
      })
      if (painPoints.length > 0) {
        parts.push(`Key Pain Points: ${painPoints.slice(0, 3).join('; ')}`)
      }
    }
    
    return parts.join('\n\n')
  }
  
  // Helper to derive success metrics from Business Envisioning outcomes
  const deriveSuccessMetrics = (): string[] => {
    if (!businessEnvisioning?.businessOutcomes || businessEnvisioning.businessOutcomes.length === 0) {
      return ['']
    }
    return businessEnvisioning.businessOutcomes.slice(0, 5).map(outcome => {
      const metric = outcome.metric || outcome.outcome
      if (outcome.targetValue && outcome.timeframe) {
        return `${metric}: Achieve ${outcome.targetValue} by ${outcome.timeframe}`
      }
      return metric
    })
  }
  
  // Helper to derive desired outcome from Business Envisioning
  const deriveDesiredOutcome = (): string => {
    if (!businessEnvisioning) return ''
    const parts: string[] = []
    
    if (businessEnvisioning.businessOutcomes && businessEnvisioning.businessOutcomes.length > 0) {
      const outcomes = businessEnvisioning.businessOutcomes.slice(0, 3).map(o => o.outcome)
      parts.push(`Target Outcomes: ${outcomes.join('; ')}`)
    }
    
    // From current state assessment
    if (businessEnvisioning.currentState?.aiMaturity) {
      parts.push(`AI Readiness: Currently at ${businessEnvisioning.currentState.aiMaturity.currentUsage} AI usage`)
    }
    
    return parts.join('\n\n')
  }
  
  // 1A: Current State
  const [problemStatement, setProblemStatement] = useState(initialData?.problemStatement || '')
  const [problemCategory, setProblemCategory] = useState<ProblemCategory>(initialData?.problemCategory || 'efficiency')
  const [affectedArea, setAffectedArea] = useState<AffectedArea>(initialData?.affectedArea || 'process')

  // 1B: Desired State
  const [desiredOutcome, setDesiredOutcome] = useState(initialData?.desiredOutcome || '')
  const [successMetrics, setSuccessMetrics] = useState<string[]>(initialData?.successMetrics || [''])
  const [timelineExpectation, setTimelineExpectation] = useState<TimelineExpectation>(initialData?.timelineExpectation || '3-6-months')

  const coi = initialData?.coi || {
    directCosts: { oneTime: 0, recurring: 0 },
    opportunityCosts: { oneTime: 0, recurring: 0 },
    riskCosts: { oneTime: 0, oneTimeProbability: 50, recurring: 0, recurringProbability: 50 },
    totalAnnual: 0,
  }

  // 1D: SCQ
  const [scq, setScq] = useState(
    initialData?.scq || {
      situation: '',
      complication: '',
      question: '',
      status: 'pending' as SCQStatus,
    }
  )
  const [isGeneratingSCQ, setIsGeneratingSCQ] = useState(false)
  
  // Track if we've shown the pre-population prompt
  const [showPrePopulatePrompt, setShowPrePopulatePrompt] = useState(hasBusinessEnvisioningData && !initialData)
  
  // Pre-populate from Business Envisioning if available
  const handlePrePopulate = () => {
    if (!businessEnvisioning) return
    
    const derivedProblem = deriveProblemStatement()
    const derivedOutcome = deriveDesiredOutcome()
    const derivedMetrics = deriveSuccessMetrics()
    
    if (derivedProblem) setProblemStatement(derivedProblem)
    if (derivedOutcome) setDesiredOutcome(derivedOutcome)
    if (derivedMetrics.length > 0 && derivedMetrics[0] !== '') setSuccessMetrics(derivedMetrics)
    
    setShowPrePopulatePrompt(false)
  }

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

  const generateSCQ = async () => {
    if (typeof window.llm !== 'function') {
      alert('AI service is not available. Please check your connection and try again, or enter SCQ manually.')
      return
    }
    
    setIsGeneratingSCQ(true)
    try {
      const prompt = `You are a business discovery consultant. Generate a concise SCQ (Situation-Complication-Question) framework based on the following:

**Problem Statement**: ${problemStatement}
**Problem Category**: ${problemCategory}
**Affected Area**: ${affectedArea}
**Desired Outcome**: ${desiredOutcome}

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
    const data: OpportunityStageData = {
      problemStatement,
      problemCategory,
      affectedArea,
      desiredOutcome,
      successMetrics: successMetrics.filter(m => m.trim() !== ''),
      timelineExpectation,
      coi: { ...coi },
      scq,
    }
    onComplete(data)
  }

  const isValid =
    problemStatement.trim() !== '' &&
    desiredOutcome.trim() !== '' &&
    successMetrics.some(m => m.trim() !== '') &&
    scq.status !== 'pending' &&
    scq.status !== 'rejected'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 1: OPPORTUNITY</h2>
        <p className="text-muted-foreground mt-2">
          Understand the problem and quantify what's at stake
        </p>
      </div>

      {/* Business Envisioning Pre-Population Prompt */}
      {showPrePopulatePrompt && businessEnvisioning && (
        <Alert className="bg-purple-500/10 border-purple-500/30">
          <Target className="h-4 w-4 text-purple-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-purple-600">Business Envisioning Data Available</span>
              <p className="text-sm text-muted-foreground mt-1">
                Pre-populate fields with strategic priorities and business outcomes from your previous discovery session?
              </p>
              {businessEnvisioning.strategicPriorities && businessEnvisioning.strategicPriorities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {businessEnvisioning.strategicPriorities.slice(0, 3).map((sp, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                      {sp.priority}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => setShowPrePopulatePrompt(false)}>
                Skip
              </Button>
              <Button size="sm" onClick={handlePrePopulate} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Sparkles className="mr-1 h-3 w-3" />
                Pre-Populate
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Business Envisioning Context Card (collapsed view after pre-population or skip) */}
      {hasBusinessEnvisioningData && !showPrePopulatePrompt && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md cursor-help">
                <Target className="h-3 w-3 text-purple-600" />
                <span>Linked to Business Envisioning</span>
                {businessEnvisioning?.strategicPriorities && businessEnvisioning.strategicPriorities.length > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/10 text-purple-600 border-purple-500/30">
                    {businessEnvisioning.strategicPriorities.length} priorities
                  </Badge>
                )}
                {businessEnvisioning?.businessOutcomes && businessEnvisioning.businessOutcomes.length > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
                    {businessEnvisioning.businessOutcomes.length} outcomes
                  </Badge>
                )}
                <Info className="h-3 w-3 ml-auto" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-md">
              <div className="space-y-2">
                <p className="font-medium">Business Envisioning Context</p>
                {businessEnvisioning?.strategicPriorities?.slice(0, 2).map((sp, idx) => (
                  <p key={idx} className="text-xs">• {sp.priority}</p>
                ))}
                {businessEnvisioning?.businessOutcomes?.slice(0, 2).map((bo, idx) => (
                  <p key={idx} className="text-xs">• {bo.outcome}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Tabs defaultValue="current-state" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current-state">Current State</TabsTrigger>
          <TabsTrigger value="desired-state">Desired State</TabsTrigger>
          <TabsTrigger value="scq">SCQ Confirmation</TabsTrigger>
        </TabsList>

        {/* 1A: Current State */}
        <TabsContent value="current-state" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1A: Current State</CardTitle>
              <CardDescription>
                Use funneling questions: Broad → Probe → Confirm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <p className="text-xs text-muted-foreground">
                  Guide: Start broad, probe deeper, then confirm the core issue
                  {isLiveMode && <Badge variant="outline" className="ml-2 text-xs"><Mic className="w-3 h-3 mr-1" />Voice enabled</Badge>}
                </p>
              </div>

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

        {/* 1B: Desired State */}
        <TabsContent value="desired-state" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1B: Desired State</CardTitle>
              <CardDescription>
                If we fast-forward 12-18 months and this is solved, what's different?
              </CardDescription>
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
                  <Label>
                    Success Metrics <span className="text-destructive">*</span>
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSuccessMetric}>
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

        {/* 1C: SCQ Confirmation */}
        <TabsContent value="scq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                1C: SCQ Confirmation
                {isAIFeatureEnabled('enableSCQGeneration') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSCQ}
                    disabled={isGeneratingSCQ || !problemStatement || !desiredOutcome}
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
              </CardTitle>
              <CardDescription>
                Situation-Complication-Question framework to confirm understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="situation">Situation</Label>
                    {scq.situation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setScq({ ...scq, status: 'pending' })}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
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

              {scq.situation && scq.complication && scq.question && (
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
                        Cannot proceed with rejected SCQ. Please adjust or regenerate.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
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
        <Button onClick={handleSubmit} disabled={!isValid} className="bg-[#0078D4] hover:bg-[#106EBE] text-white">
          Continue to Stage 2
        </Button>
      </div>
    </div>
  )
}
