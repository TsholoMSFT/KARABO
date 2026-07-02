import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, Plus, Trash2, Check, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { StakeholderGrid } from '../StakeholderGrid'
import { TabCompletionIndicator } from '../TabCompletionIndicator'
import { SkipForNowButton } from '../SkipForNowButton'
import { VoiceInputField } from '../VoiceInputField'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import type { 
  DecisionProcessStageData, 
  Stakeholder, 
  ApprovalStage,
  DecisionStyle,
  CompetitivePosition,
  TabCompletionStatus,
  OpportunityResourcesStageData,
} from '@/lib/types'

interface Stage2DecisionProcessProps {
  initialData?: DecisionProcessStageData
  previousStageData?: OpportunityResourcesStageData
  onComplete: (data: DecisionProcessStageData) => void
  onBack?: () => void
  isLiveMode?: boolean
}

// Tab definitions
const TABS = [
  { id: 'stakeholder-map', label: 'Stakeholder Map' },
  { id: 'evaluation-criteria', label: 'Evaluation Criteria' },
  { id: 'process-mechanics', label: 'Process Mechanics' },
]

export function Stage2DecisionProcess({ 
  initialData, 
  previousStageData,
  onComplete, 
  onBack, 
  isLiveMode = false 
}: Stage2DecisionProcessProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('stakeholder-map')
  const [tabCompletion, setTabCompletion] = useState<Record<string, TabCompletionStatus>>({})

  // 3A: Stakeholder Map
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(
    initialData?.stakeholders || []
  )
  const [isAISuggesting, setIsAISuggesting] = useState(false)

  // 3B: Evaluation Criteria
  const [formalCriteria, setFormalCriteria] = useState<Array<{ criterion: string; weighting?: number }>>(
    initialData?.formalCriteria || [{ criterion: '', weighting: 1 }]
  )
  const [informalCriteria, setInformalCriteria] = useState<string[]>(
    initialData?.informalCriteria || ['']
  )
  const [competition, setCompetition] = useState(initialData?.competition || '')
  const [competitivePosition, setCompetitivePosition] = useState<CompetitivePosition>(
    initialData?.competitivePosition || 'unknown'
  )

  // 3C: Process Mechanics
  const [decisionStyle, setDecisionStyle] = useState<DecisionStyle>(
    initialData?.decisionStyle || 'single-decision-maker'
  )
  const [approvalStages, setApprovalStages] = useState<ApprovalStage[]>(
    initialData?.approvalStages || []
  )
  const [decisionTimeline, setDecisionTimeline] = useState<Date | null>(
    initialData?.decisionTimeline ? new Date(initialData.decisionTimeline) : null
  )
  const [procurementInvolvement, setProcurementInvolvement] = useState<boolean | null>(
    initialData?.procurementInvolvement ?? null
  )

  // Tab completion tracking
  const markTabSkipped = useCallback((tabId: string) => {
    setTabCompletion(prev => ({ ...prev, [tabId]: 'skipped' }))
  }, [])

  const getTabStatus = useCallback((tabId: string): TabCompletionStatus => {
    if (tabCompletion[tabId] === 'skipped') return 'skipped'
    
    switch (tabId) {
      case 'stakeholder-map':
        return stakeholders.length > 0 ? 'complete' : 'not-started'
      case 'evaluation-criteria':
        return formalCriteria.some(c => c.criterion.trim()) || competition.trim() ? 'complete' : 'not-started'
      case 'process-mechanics':
        return decisionStyle !== 'single-decision-maker' || approvalStages.length > 0 || decisionTimeline !== null ? 'complete' : 'not-started'
      default:
        return tabCompletion[tabId] || 'not-started'
    }
  }, [tabCompletion, stakeholders, formalCriteria, competition, decisionStyle, approvalStages, decisionTimeline])

  const visibleTabs = useMemo(() => {
    return TABS.map(tab => ({
      ...tab,
      status: getTabStatus(tab.id),
    }))
  }, [getTabStatus])

  // AI-assisted stakeholder suggestion
  const suggestStakeholders = async () => {
    if (!isAIFeatureEnabled('enableStakeholderSuggestions')) {
      return
    }

    if (typeof window.llm !== 'function') {
      alert('AI service is not available. Please check your connection.')
      return
    }

    setIsAISuggesting(true)
    try {
      const context = {
        problemStatement: previousStageData?.opportunity?.problemStatement || '',
        problemCategory: previousStageData?.opportunity?.problemCategory || '',
        affectedArea: previousStageData?.opportunity?.affectedArea || '',
        executiveSponsor: previousStageData?.resources?.executiveSponsor || '',
        projectLead: previousStageData?.resources?.projectLead || '',
        budgetOwner: previousStageData?.resources?.budgetOwner || '',
        budgetRange: previousStageData?.resources?.budgetRange || '',
      }

      const prompt = `You are a B2B enterprise sales strategist. Based on the following discovery context, suggest 3-5 key stakeholders that would typically be involved in a decision of this type.

**Context:**
- Problem Statement: ${context.problemStatement || 'Not specified'}
- Problem Category: ${context.problemCategory}
- Affected Area: ${context.affectedArea}
- Known Executive Sponsor: ${context.executiveSponsor || 'TBD'}
- Known Project Lead: ${context.projectLead || 'TBD'}
- Budget Range: ${context.budgetRange}

For each stakeholder, provide:
- name: Their likely role/title (we'll ask the customer for actual names)
- role: Department or function
- type: One of [economic-buyer, technical-evaluator, user-buyer, influencer, blocker]
- disposition: One of [champion, supportive, neutral, skeptical, opposed, unknown]
- accessLevel: One of [direct, indirect, none]
- keyConcern: Their likely primary concern or priority

Return ONLY a JSON array of stakeholder objects with these fields.`

      const response = await window.llm(prompt, 'gpt-4o-mini', true)
      const suggested = JSON.parse(response)

      if (Array.isArray(suggested)) {
        const newStakeholders: Stakeholder[] = suggested.map((s: Stakeholder, index: number) => ({
          id: `ai-stakeholder-${Date.now()}-${index}`,
          name: s.name || '',
          role: s.role || '',
          type: s.type || 'influencer',
          disposition: s.disposition || 'unknown',
          accessLevel: s.accessLevel || 'indirect',
          keyConcern: s.keyConcern || '',
        }))
        setStakeholders([...stakeholders, ...newStakeholders])
      }
    } catch (error) {
      console.error('Failed to suggest stakeholders:', error)
      alert('Failed to generate stakeholder suggestions. Please try again.')
    } finally {
      setIsAISuggesting(false)
    }
  }

  // Stakeholder handlers
  const handleAddStakeholder = (stakeholder: Stakeholder) => {
    setStakeholders([...stakeholders, stakeholder])
  }

  const handleUpdateStakeholder = (id: string, updates: Partial<Stakeholder>) => {
    setStakeholders(stakeholders.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleRemoveStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter(s => s.id !== id))
  }

  // Formal criteria handlers
  const addFormalCriterion = () => {
    setFormalCriteria([...formalCriteria, { criterion: '', weighting: 1 }])
  }

  const updateFormalCriterion = (index: number, updates: Partial<{ criterion: string; weighting: number }>) => {
    setFormalCriteria(formalCriteria.map((c, i) => i === index ? { ...c, ...updates } : c))
  }

  const removeFormalCriterion = (index: number) => {
    if (formalCriteria.length > 1) {
      setFormalCriteria(formalCriteria.filter((_, i) => i !== index))
    }
  }

  // Informal criteria handlers
  const updateInformalCriterion = (index: number, value: string) => {
    const updated = [...informalCriteria]
    updated[index] = value
    setInformalCriteria(updated)
  }

  const addInformalCriterion = () => {
    setInformalCriteria([...informalCriteria, ''])
  }

  // Approval stage handlers
  const addApprovalStage = () => {
    setApprovalStages([...approvalStages, {
      id: `approval-${Date.now()}`,
      stage: '',
      approver: '',
      expectedDate: null,
    }])
  }

  const updateApprovalStage = (id: string, updates: Partial<ApprovalStage>) => {
    setApprovalStages(approvalStages.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeApprovalStage = (id: string) => {
    setApprovalStages(approvalStages.filter(s => s.id !== id))
  }

  const handleSubmit = () => {
    const data: DecisionProcessStageData = {
      stakeholders,
      formalCriteria: formalCriteria.filter(c => c.criterion.trim()),
      informalCriteria: informalCriteria.filter(c => c.trim()),
      competition,
      competitivePosition,
      decisionStyle,
      approvalStages,
      decisionTimeline: decisionTimeline?.getTime() || null,
      procurementInvolvement,
    }
    onComplete(data)
  }

  // Check if we have minimum viable data
  const isValid = stakeholders.length > 0 || 
    tabCompletion['stakeholder-map'] === 'skipped'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">
          Stage 2: DECISION PROCESS
        </h2>
        <p className="text-muted-foreground mt-2">
          Map the decision-making landscape: who's involved, what criteria matter, and how decisions get made
        </p>
      </div>

      {/* Tab completion indicator */}
      <TabCompletionIndicator 
        tabs={visibleTabs}
        currentTab={activeTab}
        onTabClick={setActiveTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="relative">
              {tab.label}
              {tab.status === 'complete' && (
                <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Stakeholder Map Tab */}
        <TabsContent value="stakeholder-map" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stakeholder Map</CardTitle>
                <CardDescription>
                  Identify all key players in the decision. Who influences, decides, and could block?
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('stakeholder-map')}
                sectionName="Stakeholder Map"
              />
            </CardHeader>
            <CardContent>
              <StakeholderGrid
                stakeholders={stakeholders}
                onAdd={handleAddStakeholder}
                onUpdate={handleUpdateStakeholder}
                onRemove={handleRemoveStakeholder}
                onAISuggest={suggestStakeholders}
                isAISuggesting={isAISuggesting}
              />
              
              {isAIFeatureEnabled('enableStakeholderSuggestions') && stakeholders.length === 0 && (
                <Alert className="mt-4">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Click "AI Suggest" to get stakeholder recommendations based on your discovery context.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluation Criteria Tab */}
        <TabsContent value="evaluation-criteria" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Evaluation Criteria</CardTitle>
                <CardDescription>
                  What factors will influence the decision? Both formal RFP criteria and informal preferences.
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('evaluation-criteria')}
                sectionName="Evaluation Criteria"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formal Criteria with Weighting */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Formal Criteria</Label>
                  <Button variant="outline" size="sm" onClick={addFormalCriterion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Criterion
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Documented requirements from RFP, evaluation matrix, or stated needs
                </p>
                {formalCriteria.map((item, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <Input
                      value={item.criterion}
                      onChange={(e) => updateFormalCriterion(index, { criterion: e.target.value })}
                      placeholder="e.g., Integration with existing ERP, Security compliance"
                      className="flex-1"
                    />
                    <div className="w-32 flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Weight:</Label>
                      <Slider
                        value={[item.weighting || 1]}
                        onValueChange={([v]) => updateFormalCriterion(index, { weighting: v })}
                        min={1}
                        max={5}
                        step={1}
                        className="w-20"
                      />
                      <span className="text-xs font-mono w-4">{item.weighting || 1}</span>
                    </div>
                    {formalCriteria.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFormalCriterion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Informal Criteria */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Informal Criteria</Label>
                  <Button variant="outline" size="sm" onClick={addInformalCriterion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unstated preferences, political considerations, personal priorities
                </p>
                {informalCriteria.map((criterion, index) => (
                  <Input
                    key={index}
                    value={criterion}
                    onChange={(e) => updateInformalCriterion(index, e.target.value)}
                    placeholder="e.g., Vendor relationship, Risk aversion, Personal career impact"
                  />
                ))}
              </div>

              {/* Competition */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Competitive Landscape</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Known Competition</Label>
                    {isLiveMode ? (
                      <VoiceInputField
                        value={competition}
                        onChange={setCompetition}
                        placeholder="Who else is being considered?"
                        rows={2}
                      />
                    ) : (
                      <Textarea
                        value={competition}
                        onChange={(e) => setCompetition(e.target.value)}
                        placeholder="Who else is being considered?"
                        rows={2}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Competitive Position</Label>
                    <Select value={competitivePosition} onValueChange={(v) => setCompetitivePosition(v as CompetitivePosition)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preferred">Preferred</SelectItem>
                        <SelectItem value="equal">Equal</SelectItem>
                        <SelectItem value="behind">Behind</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Mechanics Tab */}
        <TabsContent value="process-mechanics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Process Mechanics</CardTitle>
                <CardDescription>
                  How decisions are made, who approves, and when
                </CardDescription>
              </div>
              <SkipForNowButton 
                onSkip={() => markTabSkipped('process-mechanics')}
                sectionName="Process Mechanics"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision Style */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Decision Style</Label>
                  <Select value={decisionStyle} onValueChange={(v) => setDecisionStyle(v as DecisionStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-decision-maker">Single Decision Maker</SelectItem>
                      <SelectItem value="consensus">Consensus</SelectItem>
                      <SelectItem value="committee">Committee / Board</SelectItem>
                      <SelectItem value="procurement">Formal Procurement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Decision Timeline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {decisionTimeline ? format(decisionTimeline, 'PPP') : 'Expected decision date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={decisionTimeline || undefined}
                        onSelect={(d) => setDecisionTimeline(d ?? null)}
                        required={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Procurement Involvement */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Procurement Involvement</Label>
                  <p className="text-sm text-muted-foreground">
                    Will formal procurement be involved in this decision?
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant={procurementInvolvement === true ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProcurementInvolvement(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={procurementInvolvement === false ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProcurementInvolvement(false)}
                  >
                    No
                  </Button>
                  <Button
                    variant={procurementInvolvement === null ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setProcurementInvolvement(null)}
                  >
                    Unknown
                  </Button>
                </div>
              </div>

              {/* Approval Stages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Approval Stages</Label>
                  <Button variant="outline" size="sm" onClick={addApprovalStage}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stage
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Map the approval chain from initial recommendation to final sign-off
                </p>
                
                {approvalStages.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                    <p className="text-sm">No approval stages defined.</p>
                    <p className="text-xs mt-1">Add stages to map the decision journey.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvalStages.map((stage, index) => (
                      <div key={stage.id} className="flex gap-3 items-center p-3 border rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {index + 1}.
                        </span>
                        <Input
                          value={stage.stage}
                          onChange={(e) => updateApprovalStage(stage.id, { stage: e.target.value })}
                          placeholder="Stage name (e.g., Technical Review)"
                          className="flex-1"
                        />
                        <Input
                          value={stage.approver}
                          onChange={(e) => updateApprovalStage(stage.id, { approver: e.target.value })}
                          placeholder="Approver"
                          className="w-40"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-32">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {stage.expectedDate ? format(new Date(stage.expectedDate), 'MMM d') : 'Date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={stage.expectedDate ? new Date(stage.expectedDate) : undefined}
                              onSelect={(date) => updateApprovalStage(stage.id, { expectedDate: date?.getTime() || null })}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeApprovalStage(stage.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Stage 1
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid}
          className="bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Continue to Stage 3
        </Button>
      </div>
    </div>
  )
}
