import { useState, useEffect } from 'react'
import { UseCase, DiscoverySession } from '@/lib/types'
import { industryLabels } from '@/lib/discovery-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ArrowRight, ArrowLeft, CheckCircle, Sparkle, ChartScatter, ListNumbers, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface WorkflowUseCase {
  id: string
  title: string
  description: string
  rationale?: string
  selected: boolean
  impact?: number
  feasibility?: number
  rice?: {
    reach: number
    users: number
    period: string
    impact: number
    confidence: number
    effort: number
  }
}

interface EnhancedDiscoveryWorkflowProps {
  session: DiscoverySession
  initialUseCases: Array<{ title: string; description: string; rationale: string }>
  onComplete: (useCases: Partial<UseCase>[], executiveSummary: string) => void
  onCancel: () => void
}

type WorkflowStep = 'review-add' | 'select' | 'impact-feasibility' | 'rice' | 'summary' | 'save-confirm'

export function EnhancedDiscoveryWorkflow({
  session,
  initialUseCases,
  onComplete,
  onCancel
}: EnhancedDiscoveryWorkflowProps) {
  const [step, setStep] = useState<WorkflowStep>('review-add')
  const [useCases, setUseCases] = useState<WorkflowUseCase[]>(
    initialUseCases.map((uc, idx) => ({
      id: `uc-${Date.now()}-${idx}`,
      title: uc.title,
      description: uc.description,
      rationale: uc.rationale,
      selected: true,
    }))
  )
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0)
  const [newUseCaseTitle, setNewUseCaseTitle] = useState('')
  const [newUseCaseDescription, setNewUseCaseDescription] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [executiveSummary, setExecutiveSummary] = useState('')

  const selectedUseCases = useCases.filter(uc => uc.selected)
  const currentUseCase = step === 'impact-feasibility' || step === 'rice' 
    ? selectedUseCases[currentUseCaseIndex] 
    : null

  const handleAddUseCase = () => {
    if (!newUseCaseTitle.trim() || !newUseCaseDescription.trim()) {
      toast.error('Please provide both title and description')
      return
    }

    const newUseCase: WorkflowUseCase = {
      id: `uc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newUseCaseTitle.trim(),
      description: newUseCaseDescription.trim(),
      selected: true,
    }

    setUseCases([...useCases, newUseCase])
    setNewUseCaseTitle('')
    setNewUseCaseDescription('')
    toast.success('Use case added!')
  }

  const handleRemoveUseCase = (id: string) => {
    setUseCases(useCases.filter(uc => uc.id !== id))
    toast.success('Use case removed')
  }

  const handleToggleSelection = (id: string) => {
    setUseCases(useCases.map(uc => 
      uc.id === id ? { ...uc, selected: !uc.selected } : uc
    ))
  }

  const handleNextFromReviewAdd = () => {
    if (useCases.length === 0) {
      toast.error('Please add at least one use case')
      return
    }
    setStep('select')
  }

  const handleNextFromSelect = () => {
    if (selectedUseCases.length === 0) {
      toast.error('Please select at least one use case to continue')
      return
    }
    setCurrentUseCaseIndex(0)
    setStep('impact-feasibility')
  }

  const handleSaveImpactFeasibility = (impact: number, feasibility: number) => {
    const updatedUseCases = useCases.map(uc =>
      uc.id === currentUseCase?.id ? { ...uc, impact, feasibility } : uc
    )
    setUseCases(updatedUseCases)

    if (currentUseCaseIndex < selectedUseCases.length - 1) {
      setCurrentUseCaseIndex(currentUseCaseIndex + 1)
    } else {
      setCurrentUseCaseIndex(0)
      setStep('rice')
    }
  }

  const handleSaveRice = (rice: WorkflowUseCase['rice']) => {
    const updatedUseCases = useCases.map(uc =>
      uc.id === currentUseCase?.id ? { ...uc, rice } : uc
    )
    setUseCases(updatedUseCases)

    if (currentUseCaseIndex < selectedUseCases.length - 1) {
      setCurrentUseCaseIndex(currentUseCaseIndex + 1)
    } else {
      handleCompleteDiscovery()
    }
  }

  const handleCompleteDiscovery = async () => {
    setIsGeneratingSummary(true)
    setStep('summary')

    try {
      const useCasesList = selectedUseCases.map((uc, idx) => {
        const impactFeasibilityScore = ((uc.impact || 5) + (uc.feasibility || 5)) / 2
        const riceScore = uc.rice 
          ? ((uc.rice.reach * uc.rice.impact * (uc.rice.confidence / 100)) / uc.rice.effort).toFixed(1)
          : 'N/A'
        return `${idx + 1}. ${uc.title}
   Description: ${uc.description}
   Impact Score: ${uc.impact}/10
   Feasibility Score: ${uc.feasibility}/10
   RICE Score: ${riceScore}`
      }).join('\n\n')
      
      const summaryPromptText = `You are a senior innovation consultant at Microsoft creating an executive summary for a discovery session.

SESSION DETAILS:
Customer: ${session.customerName}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}
Session Name: ${session.name}
Innovation Hub Location: ${session.innovationHubLocation}
Solution Engineer: ${session.solutionEngineer}
Primary Stakeholder: ${session.primaryStakeholder}

USE CASES IDENTIFIED AND SCORED:
${useCasesList}

TASK: Create a compelling executive summary (3-4 well-structured paragraphs) that:

1. OPENING - Provide context about the discovery session and the customer's strategic objectives
2. KEY FINDINGS - Summarize the most significant business challenges, opportunities, and insights discovered
3. RECOMMENDATIONS - Highlight the prioritized use cases and their potential business impact (reference specific scores where relevant)
4. NEXT STEPS - Suggest strategic actions and implementation approach

STYLE GUIDELINES:
- Write in a professional, confident tone suitable for executive leadership
- Use business-focused language emphasizing ROI, efficiency gains, and strategic value
- Be specific but concise - every sentence should add value
- Connect use cases to Microsoft's innovation capabilities and the customer's industry context
- Include quantitative references from the scoring where appropriate
- Make it compelling and action-oriented

Write the executive summary now:`

      const summary = await window.llm(summaryPromptText, 'gpt-4o')
      setExecutiveSummary(summary)
      toast.success('Executive summary generated!')
      setStep('save-confirm')
    } catch (error) {
      console.error('Error generating summary:', error)
      const fallbackSummary = `Executive Summary

Discovery Session completed for ${session.customerName} in the ${session.industry || 'general'} sector. Through comprehensive evaluation, we identified ${selectedUseCases.length} high-potential use cases for digital transformation and innovation.

The use cases were assessed using both Impact/Feasibility and RICE scoring methodologies to ensure a balanced perspective on value and implementation complexity. This dual-lens approach enables strategic prioritization aligned with organizational capabilities and goals.

The identified opportunities span multiple areas and represent significant potential for operational improvement, efficiency gains, and competitive advantage through the adoption of Microsoft's innovation technologies.

Next steps include detailed technical assessment, stakeholder alignment workshops, and development of an implementation roadmap for the highest-priority use cases.`
      
      setExecutiveSummary(fallbackSummary)
      toast.warning('Generated fallback summary due to AI service issue')
      setStep('save-confirm')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleFinish = () => {
    const finalUseCases: Partial<UseCase>[] = selectedUseCases.map(uc => ({
      title: uc.title,
      description: uc.description,
      impact: uc.impact || 5,
      feasibility: uc.feasibility || 5,
      rice: uc.rice || {
        reach: 100,
        users: 100,
        period: 'quarter',
        impact: 1,
        confidence: 50,
        effort: 1,
      },
      kpis: [],
    }))

    onComplete(finalUseCases, executiveSummary)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {step === 'review-add' && (
            <motion.div
              key="review-add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle size={24} weight="duotone" className="text-primary" />
                    Review & Add Use Cases
                  </CardTitle>
                  <CardDescription>
                    Review the suggested use cases and add any additional ones you'd like to explore
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Suggested Use Cases</h3>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {useCases.map((uc) => (
                          <Card key={uc.id} className="p-4 bg-muted/30">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1">{uc.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{uc.description}</p>
                                {uc.rationale && (
                                  <p className="text-xs text-muted-foreground italic">Why: {uc.rationale}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUseCase(uc.id)}
                              >
                                <X size={18} />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Add New Use Case</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="new-title">Title</Label>
                        <Input
                          id="new-title"
                          value={newUseCaseTitle}
                          onChange={(e) => setNewUseCaseTitle(e.target.value)}
                          placeholder="Enter use case title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-description">Description</Label>
                        <Textarea
                          id="new-description"
                          value={newUseCaseDescription}
                          onChange={(e) => setNewUseCaseDescription(e.target.value)}
                          placeholder="Describe the use case and its potential impact"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleAddUseCase} variant="outline" className="gap-2 w-full">
                        <Plus size={18} weight="bold" />
                        Add Use Case
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextFromReviewAdd} className="gap-2">
                    Next: Select Use Cases
                    <ArrowRight size={18} weight="bold" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Select Use Cases to Score</CardTitle>
                  <CardDescription>
                    Choose which use cases you want to evaluate with Impact/Feasibility and RICE scoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {useCases.map((uc) => (
                        <Card
                          key={uc.id}
                          className={`p-4 cursor-pointer transition-all ${
                            uc.selected ? 'bg-primary/10 border-primary' : 'bg-muted/30'
                          }`}
                          onClick={() => handleToggleSelection(uc.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={uc.selected}
                              onCheckedChange={() => handleToggleSelection(uc.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">{uc.title}</h4>
                              <p className="text-sm text-muted-foreground">{uc.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>{selectedUseCases.length}</strong> use case{selectedUseCases.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('review-add')}>
                    <ArrowLeft size={18} weight="bold" className="mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNextFromSelect} className="gap-2" disabled={selectedUseCases.length === 0}>
                    Next: Impact & Feasibility
                    <ArrowRight size={18} weight="bold" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 'impact-feasibility' && currentUseCase && (
            <ImpactFeasibilityStep
              useCase={currentUseCase}
              currentIndex={currentUseCaseIndex}
              totalCount={selectedUseCases.length}
              onSave={handleSaveImpactFeasibility}
              onBack={() => {
                if (currentUseCaseIndex > 0) {
                  setCurrentUseCaseIndex(currentUseCaseIndex - 1)
                } else {
                  setStep('select')
                }
              }}
            />
          )}

          {step === 'rice' && currentUseCase && (
            <RiceStep
              useCase={currentUseCase}
              currentIndex={currentUseCaseIndex}
              totalCount={selectedUseCases.length}
              onSave={handleSaveRice}
              onBack={() => {
                if (currentUseCaseIndex > 0) {
                  setCurrentUseCaseIndex(currentUseCaseIndex - 1)
                } else {
                  setCurrentUseCaseIndex(selectedUseCases.length - 1)
                  setStep('impact-feasibility')
                }
              }}
            />
          )}

          {step === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-2">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Sparkle size={40} weight="duotone" className="text-primary animate-pulse" />
                  </div>
                  <CardTitle className="text-2xl">Generating Summary</CardTitle>
                  <CardDescription>
                    Creating executive summary for your discovery session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Analyzing your responses and scoring data...</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'save-confirm' && (
            <motion.div
              key="save-confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-2 border-primary">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle size={40} weight="duotone" className="text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Discovery Complete!</CardTitle>
                  <CardDescription>
                    Review your results and save the session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Session Details</h3>
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-semibold text-foreground">{session.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session:</span>
                        <span className="font-semibold text-foreground">{session.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Industry:</span>
                        <span className="font-semibold text-foreground">{session.industry || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Use Cases:</span>
                        <span className="font-semibold text-foreground">{selectedUseCases.length}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Executive Summary</h3>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{executiveSummary}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Scored Use Cases ({selectedUseCases.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedUseCases.map((uc, idx) => (
                        <Card key={uc.id} className="p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm">{uc.title}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <Badge variant="outline">Impact: {uc.impact}/10</Badge>
                              <Badge variant="outline">Feasibility: {uc.feasibility}/10</Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Cancel & Discard
                  </Button>
                  <Button onClick={handleFinish} className="flex-1 gap-2">
                    <CheckCircle size={20} weight="bold" />
                    Save Session & View Dashboard
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ImpactFeasibilityStepProps {
  useCase: WorkflowUseCase
  currentIndex: number
  totalCount: number
  onSave: (impact: number, feasibility: number) => void
  onBack: () => void
}

function ImpactFeasibilityStep({ useCase, currentIndex, totalCount, onSave, onBack }: ImpactFeasibilityStepProps) {
  const [impact, setImpact] = useState(useCase.impact || 5)
  const [feasibility, setFeasibility] = useState(useCase.feasibility || 5)

  return (
    <motion.div
      key={`if-${useCase.id}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              Use Case {currentIndex + 1} of {totalCount}
            </Badge>
            <ChartScatter size={24} weight="duotone" className="text-primary" />
          </div>
          <CardTitle>Impact & Feasibility Assessment</CardTitle>
          <CardDescription>Score the potential impact and implementation feasibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
            <p className="text-sm text-muted-foreground">{useCase.description}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Impact Score</Label>
                <span className="text-2xl font-bold text-primary">{impact}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How significant will the business impact be? (1 = Low impact, 10 = Transformative)
              </p>
              <Slider
                value={[impact]}
                onValueChange={(val) => setImpact(val[0])}
                min={1}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Impact</span>
                <span>High Impact</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Feasibility Score</Label>
                <span className="text-2xl font-bold text-secondary">{feasibility}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How easy is it to implement? (1 = Very difficult, 10 = Very easy)
              </p>
              <Slider
                value={[feasibility]}
                onValueChange={(val) => setFeasibility(val[0])}
                min={1}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Difficult</span>
                <span>Easy</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={18} weight="bold" className="mr-2" />
            Back
          </Button>
          <Button onClick={() => onSave(impact, feasibility)} className="gap-2">
            {currentIndex < totalCount - 1 ? 'Next Use Case' : 'Next: RICE Scoring'}
            <ArrowRight size={18} weight="bold" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

interface RiceStepProps {
  useCase: WorkflowUseCase
  currentIndex: number
  totalCount: number
  onSave: (rice: WorkflowUseCase['rice']) => void
  onBack: () => void
}

function RiceStep({ useCase, currentIndex, totalCount, onSave, onBack }: RiceStepProps) {
  const [users, setUsers] = useState(useCase.rice?.users || 100)
  const [period, setPeriod] = useState(useCase.rice?.period || 'quarter')
  const [impactMultiplier, setImpactMultiplier] = useState(useCase.rice?.impact || 1)
  const [confidence, setConfidence] = useState(useCase.rice?.confidence || 50)
  const [effort, setEffort] = useState(useCase.rice?.effort || 1)

  const reach = users / (period === 'month' ? 1 : period === 'quarter' ? 3 : 12)
  const riceScore = (reach * impactMultiplier * (confidence / 100)) / effort

  const handleSave = () => {
    onSave({
      reach,
      users,
      period,
      impact: impactMultiplier,
      confidence,
      effort,
    })
  }

  return (
    <motion.div
      key={`rice-${useCase.id}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              Use Case {currentIndex + 1} of {totalCount}
            </Badge>
            <ListNumbers size={24} weight="duotone" className="text-primary" />
          </div>
          <CardTitle>RICE Scoring</CardTitle>
          <CardDescription>Calculate the RICE score for detailed prioritization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
            <p className="text-sm text-muted-foreground">{useCase.description}</p>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">RICE Score</span>
              <span className="text-3xl font-bold text-primary">{riceScore.toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              (Reach × Impact × Confidence) ÷ Effort
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Number of Users (per time period)</Label>
              <Input
                type="number"
                value={users}
                onChange={(e) => setUsers(Number(e.target.value))}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                How many users will benefit from this use case?
              </p>
            </div>

            <div className="space-y-3">
              <Label>Time Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Per Month</SelectItem>
                  <SelectItem value="quarter">Per Quarter</SelectItem>
                  <SelectItem value="year">Per Year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reach: {reach.toFixed(0)} users/month
              </p>
            </div>

            <div className="space-y-3">
              <Label>Impact Multiplier</Label>
              <Select value={String(impactMultiplier)} onValueChange={(val) => setImpactMultiplier(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3x - Massive</SelectItem>
                  <SelectItem value="2">2x - High</SelectItem>
                  <SelectItem value="1">1x - Medium</SelectItem>
                  <SelectItem value="0.5">0.5x - Low</SelectItem>
                  <SelectItem value="0.25">0.25x - Minimal</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How much will this impact each user?
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Confidence (%)</Label>
                <span className="text-lg font-semibold text-foreground">{confidence}%</span>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={(val) => setConfidence(val[0])}
                min={0}
                max={100}
                step={10}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                How confident are you in these estimates?
              </p>
            </div>

            <div className="space-y-3">
              <Label>Effort (Person-Weeks)</Label>
              <Input
                type="number"
                value={effort}
                onChange={(e) => setEffort(Number(e.target.value))}
                min={0.5}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Total development time to implement this solution
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={18} weight="bold" className="mr-2" />
            Back
          </Button>
          <Button onClick={handleSave} className="gap-2">
            {currentIndex < totalCount - 1 ? 'Next Use Case' : 'Complete Discovery'}
            <ArrowRight size={18} weight="bold" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
