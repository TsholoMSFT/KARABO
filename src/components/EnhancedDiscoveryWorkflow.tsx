import { useState, useEffect, useCallback, useMemo } from 'react'
import { UseCase, DiscoverySession, type UseCaseCOI, type UseCaseExpectedValue } from '@/lib/types'
import { useDiscovery } from '@/hooks/use-discovery'
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
import { QuickCOICalculator } from '@/components/QuickCOICalculator'
import { QuickROICalculator, type ROIInputs, type ROIResult } from '@/components/QuickROICalculator'
import { Plus, ArrowRight, ArrowLeft, CheckCircle, Sparkle, ChartScatter, ListNumbers, X, FlowArrow, TreeStructure } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram'
import { ProcessFlowDiagram } from '@/components/ProcessFlowDiagram'
import { REFERENCE_ARCHITECTURES, PRODUCT_FAMILY_LABELS, COMPLEXITY_INDICATORS, type ReferenceArchitecturePattern } from '@/lib/microsoft-solutions'
import { fetchFinancialStatements } from '@/lib/earnings-service'
import { ThreadlightPasteCard } from '@/components/ThreadlightPasteCard'
import { buildThreadlightByopPasteText, buildThreadlightProcessAnalysis, makeThreadlightShortName } from '@/lib/threadlight-export'

interface WorkflowUseCase {
  id: string
  title: string
  description: string
  rationale?: string
  selected: boolean
  impact?: number
  feasibility?: number
  dataSources?: ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery' | 'ai-generated' | 'manual' | 'fallback')[]
  aiEffortEstimate?: {
    effortWeeks: number
    reasoning: string
    estimatedAt: number
  }
  coiEstimate?: {
    directCosts: number
    opportunityCosts: number
    riskCosts: number
    totalAnnualCOI: number
    assumptions: string[]
    reasoning: string
    confidence: 'high' | 'medium' | 'low'
    suggestedRICE: {
      impactMultiplier: 0.25 | 0.5 | 1 | 2 | 3
      impactReason: string
      confidenceBoost: number
      confidenceReason: string
    }
    estimatedAt: number
  }
  manualCOI?: UseCaseCOI
  manualExpectedValue?: UseCaseExpectedValue
  rice?: {
    reach: number
    users: number
    period: string
    impact: number
    confidence: number
    effort: number
  }
  // Diagram-related fields
  referenceArchitecture?: ReferenceArchitecturePattern
  businessProcesses?: Array<{
    processId: string
    processName: string
    affectedSteps?: string[]
    currentPainPoints?: string[]
    proposedImprovement: string
    expectedCycleTimeReduction?: string
  }>
  microsoftSolutions?: Array<{
    productFamily: string
    services: string[]
    role: 'primary' | 'supporting' | 'integration'
    justification?: string
  }>
}

function calculateWorkflowRICEScore(useCase: WorkflowUseCase): number {
  const rice = useCase.rice
  if (!rice) return 0
  const reach = rice.reach || 0
  const impact = rice.impact || 0
  const confidence = rice.confidence || 0
  const effort = rice.effort || 0
  if (effort <= 0) return 0
  return (reach * impact * (confidence / 100)) / Math.max(effort, 0.1)
}

function calculateWorkflowIFScore(useCase: WorkflowUseCase): number {
  return (useCase.impact || 0) * (useCase.feasibility || 0)
}

interface EnhancedDiscoveryWorkflowProps {
  session: DiscoverySession
  initialUseCases: Array<{ 
    title: string
    description: string
    rationale: string
    dataSources?: ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery' | 'ai-generated' | 'manual' | 'fallback')[]
    referenceArchitecture?: string
    businessProcesses?: Array<{
      processId: string
      processName: string
      affectedSteps?: string[]
      currentPainPoints?: string[]
      proposedImprovement: string
      expectedCycleTimeReduction?: string
    }>
    microsoftSolutions?: Array<{
      productFamily: string
      services: string[]
      role: 'primary' | 'supporting' | 'integration'
      justification?: string
    }>
  }>
  onComplete: (useCases: Partial<UseCase>[], executiveSummary: string) => void
  onCancel: () => void
}

type WorkflowStep = 'review-add' | 'select' | 'impact-feasibility' | 'rice' | 'diagrams' | 'summary' | 'save-confirm'

export function EnhancedDiscoveryWorkflow({
  session,
  initialUseCases,
  onComplete,
  onCancel
}: EnhancedDiscoveryWorkflowProps) {
  const { updateSession } = useDiscovery()
  const [step, setStep] = useState<WorkflowStep>('review-add')
  const [useCases, setUseCases] = useState<WorkflowUseCase[]>(
    initialUseCases.map((uc, idx) => ({
      id: `uc-${Date.now()}-${idx}`,
      title: uc.title,
      description: uc.description,
      rationale: uc.rationale,
      selected: true,
      dataSources: uc.dataSources || ['discovery'],
      referenceArchitecture: uc.referenceArchitecture && REFERENCE_ARCHITECTURES[uc.referenceArchitecture as ReferenceArchitecturePattern]
        ? (uc.referenceArchitecture as ReferenceArchitecturePattern)
        : undefined,
      businessProcesses: uc.businessProcesses,
      microsoftSolutions: uc.microsoftSolutions,
    }))
  )
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0)
  const [newUseCaseTitle, setNewUseCaseTitle] = useState('')
  const [newUseCaseDescription, setNewUseCaseDescription] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [annualRevenue, setAnnualRevenue] = useState<number | undefined>(undefined)
  const [financialTargetUseCaseId, setFinancialTargetUseCaseId] = useState<string | null>(null)

  // Pull financial scale forward (optional) so COI estimation can be better grounded.
  useEffect(() => {
    const ticker = session.stockTicker?.trim()
    if (!ticker) {
      setAnnualRevenue(undefined)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const financials = await fetchFinancialStatements(ticker)
        const revenue = financials.statements?.[0]?.revenue
        if (!cancelled) {
          setAnnualRevenue(typeof revenue === 'number' && Number.isFinite(revenue) ? revenue : undefined)
        }
      } catch {
        if (!cancelled) {
          setAnnualRevenue(undefined)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [session.stockTicker])

  const selectedUseCases = useCases.filter(uc => uc.selected)
  const currentUseCase = step === 'impact-feasibility' || step === 'rice' || step === 'diagrams'
    ? selectedUseCases[currentUseCaseIndex] 
    : null

  const topRankedUseCases = useMemo(() => {
    const ranked = [...selectedUseCases].sort((a, b) => {
      const scoreA = calculateWorkflowRICEScore(a) || calculateWorkflowIFScore(a)
      const scoreB = calculateWorkflowRICEScore(b) || calculateWorkflowIFScore(b)
      if (scoreB === scoreA) return a.id.localeCompare(b.id)
      return scoreB - scoreA
    })
    return ranked
  }, [selectedUseCases])

  const topScoredUseCase = topRankedUseCases[0] || null

  useEffect(() => {
    if (!financialTargetUseCaseId && topScoredUseCase?.id) {
      setFinancialTargetUseCaseId(topScoredUseCase.id)
    }
  }, [financialTargetUseCaseId, topScoredUseCase?.id])

  const financialTargetUseCase = selectedUseCases.find((uc) => uc.id === financialTargetUseCaseId) || topScoredUseCase

  // Auto-save progress to session storage
  const saveProgress = useCallback(() => {
    const progressData = useCases.map(uc => ({
      title: uc.title,
      description: uc.description,
      rationale: uc.rationale,
      dataSources: uc.dataSources,
      aiEffortEstimate: uc.aiEffortEstimate,
    }))
    
    updateSession(session.id, {
      suggestedUseCases: progressData,
    })
    
    setLastSaved(new Date())
  }, [useCases, session.id, updateSession])

  // Auto-save on step transitions
  useEffect(() => {
    // Save whenever step changes (except initial load)
    if (step !== 'review-add') {
      saveProgress()
    }
  }, [step])

  // Auto-save when use cases change (debounced via step transitions)
  const handleStepWithSave = (newStep: WorkflowStep) => {
    saveProgress()
    setStep(newStep)
  }

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
      dataSources: ['manual'],
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
    handleStepWithSave('select')
  }

  const handleNextFromSelect = () => {
    if (selectedUseCases.length === 0) {
      toast.error('Please select at least one use case to continue')
      return
    }
    setCurrentUseCaseIndex(0)
    handleStepWithSave('impact-feasibility')
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
      handleStepWithSave('rice')
    }
  }

  const handleSaveRice = (
    rice: WorkflowUseCase['rice'], 
    aiEffortEstimate?: WorkflowUseCase['aiEffortEstimate'],
    coiEstimate?: WorkflowUseCase['coiEstimate']
  ) => {
    const updatedUseCases = useCases.map(uc =>
      uc.id === currentUseCase?.id ? { ...uc, rice, aiEffortEstimate, coiEstimate } : uc
    )
    setUseCases(updatedUseCases)

    if (currentUseCaseIndex < selectedUseCases.length - 1) {
      setCurrentUseCaseIndex(currentUseCaseIndex + 1)
    } else {
      // Move to diagrams step after all RICE scoring is complete
      setCurrentUseCaseIndex(0)
      handleStepWithSave('diagrams')
    }
  }

  const handleDiagramsNext = () => {
    if (currentUseCaseIndex < selectedUseCases.length - 1) {
      setCurrentUseCaseIndex(currentUseCaseIndex + 1)
    } else {
      // All diagrams reviewed, generate summary
      handleCompleteDiscovery()
    }
  }

  const handleDiagramsBack = () => {
    if (currentUseCaseIndex > 0) {
      setCurrentUseCaseIndex(currentUseCaseIndex - 1)
    } else {
      // Go back to last RICE scoring
      setCurrentUseCaseIndex(selectedUseCases.length - 1)
      setStep('rice')
    }
  }

  const handleRequestDifferentArchitecture = (useCaseId: string, feedback: string) => {
    console.log(`Architecture feedback for ${useCaseId}:`, feedback)
    toast.info('Architecture feedback recorded. Will be reviewed during solution design.')
  }

  const handleRegenerateArchitecture = async (useCaseId: string) => {
    // Find the use case and try to regenerate its architecture with AI
    const useCase = selectedUseCases.find(uc => uc.id === useCaseId)
    if (!useCase) return

    try {
      const availablePatterns = Object.entries(REFERENCE_ARCHITECTURES)
        .map(([key, arch]) => `- ${key}: ${arch.label} - ${arch.description}`)
        .join('\n')

      const prompt = `Analyze this use case and suggest the BEST Microsoft reference architecture pattern from the list.

Use Case: ${useCase.title}
Description: ${useCase.description}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}

Available reference architecture patterns:
${availablePatterns}

Return ONLY the pattern id (the key before the colon), nothing else.`

  const response = await window.llm(prompt, 'gpt-4o-mini', false)

      const patternMatch = response.trim().match(/[\w-]+/)?.[0] as ReferenceArchitecturePattern | undefined
      if (patternMatch && REFERENCE_ARCHITECTURES[patternMatch]) {
        const updatedUseCases = selectedUseCases.map(uc => 
          uc.id === useCaseId 
            ? { ...uc, referenceArchitecture: patternMatch }
            : uc
        )
        setSelectedUseCases(updatedUseCases)
        return
      }
      throw new Error('Could not parse architecture response')
    } catch (error) {
      console.error('Architecture regeneration failed:', error)
      throw error // Let the component show manual selector
    }
  }

  const handleManualSelectArchitecture = (useCaseId: string, pattern: ReferenceArchitecturePattern) => {
    const updatedUseCases = selectedUseCases.map(uc => 
      uc.id === useCaseId 
        ? { ...uc, referenceArchitecture: pattern }
        : uc
    )
    setSelectedUseCases(updatedUseCases)
  }

  const handleCompleteDiscovery = async () => {
    setIsGeneratingSummary(true)
    handleStepWithSave('summary')

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

      const summary = await window.llm(summaryPromptText, 'gpt-4o-mini')
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
      dataSources: uc.dataSources || ['discovery'], // Preserve data sources
      aiEffortEstimate: uc.aiEffortEstimate,
      rice: uc.rice || {
        reach: 100,
        users: 100,
        period: 'quarter',
        impact: 1,
        confidence: 50,
        effort: 1,
      },
      kpis: [],
      businessProcesses: uc.businessProcesses?.map((p) => ({
        process: p.processName,
        category: 'operational',
        currentState: (p.currentPainPoints || []).join('; '),
        painPoints: p.currentPainPoints || [],
        desiredState: p.proposedImprovement,
        aiIntervention: '',
      })),
      microsoftSolutions: uc.microsoftSolutions,
      referenceArchitecture: uc.referenceArchitecture,
      costOfInaction: uc.manualCOI
        ? { ...uc.manualCOI }
        : (uc.coiEstimate
          ? {
              directCosts: uc.coiEstimate.directCosts,
              opportunityCosts: uc.coiEstimate.opportunityCosts,
              riskCosts: uc.coiEstimate.riskCosts,
              totalAnnualCOI: uc.coiEstimate.totalAnnualCOI,
              notes: [
                uc.coiEstimate.reasoning ? `Reasoning: ${uc.coiEstimate.reasoning}` : '',
                Array.isArray(uc.coiEstimate.assumptions) && uc.coiEstimate.assumptions.length > 0
                  ? `Assumptions: ${uc.coiEstimate.assumptions.join(' | ')}`
                  : '',
              ].filter(Boolean).join('\n'),
              calculatedAt: uc.coiEstimate.estimatedAt,
            }
          : undefined),
      expectedValue: uc.manualExpectedValue ? { ...uc.manualExpectedValue } : undefined,
    }))

    onComplete(finalUseCases, executiveSummary)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="flex items-center justify-end mb-4 text-xs text-muted-foreground">
            <CheckCircle size={12} className="mr-1 text-green-500" />
            Progress saved at {lastSaved.toLocaleTimeString()}
          </div>
        )}
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
              context={{
                industry: session.industry ? industryLabels[session.industry] : undefined,
                companyName: session.customerName,
                annualRevenue
              }}
            />
          )}

          {step === 'diagrams' && currentUseCase && (
            <DiagramsStep
              useCase={currentUseCase}
              currentIndex={currentUseCaseIndex}
              totalCount={selectedUseCases.length}
              industry={session.industry}
              onNext={handleDiagramsNext}
              onBack={handleDiagramsBack}
              onRequestDifferentArchitecture={handleRequestDifferentArchitecture}
              onRegenerateArchitecture={handleRegenerateArchitecture}
              onManualSelectArchitecture={handleManualSelectArchitecture}
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
                      {topRankedUseCases.map((uc) => (
                        <Card key={uc.id} className="p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm">{uc.title}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <Badge variant="outline">Impact: {uc.impact}/10</Badge>
                              <Badge variant="outline">Feasibility: {uc.feasibility}/10</Badge>
                              <Badge variant="secondary">
                                RICE: {calculateWorkflowRICEScore(uc).toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Threadlight BYOP paste output */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Threadlight BYOP Output</h3>
                    <ThreadlightPasteCard
                      industryLabel={session.industry ? industryLabels[session.industry] : undefined}
                      industryValue={session.industry ? industryLabels[session.industry] : undefined}
                      shortName={makeThreadlightShortName(topScoredUseCase?.title || session.name || 'Discovery')}
                      topScoredItems={topRankedUseCases.slice(0, 3).map((uc) => ({
                        title: uc.title,
                        scoreLabel: 'RICE',
                        scoreValue: calculateWorkflowRICEScore(uc),
                      }))}
                      processAnalysis={buildThreadlightProcessAnalysis({
                        customerName: session.customerName,
                        opportunityName: session.name,
                        industryLabel: session.industry ? industryLabels[session.industry] : undefined,
                        executiveSummary,
                        topItems: topRankedUseCases.slice(0, 5).map((uc) => ({
                          title: uc.title,
                          description: uc.description,
                          scoreLabel: 'RICE',
                          scoreValue: calculateWorkflowRICEScore(uc),
                        })),
                      })}
                      pasteText={buildThreadlightByopPasteText({
                        customerName: session.customerName,
                        opportunityName: session.name,
                        industryLabel: session.industry ? industryLabels[session.industry] : undefined,
                        executiveSummary,
                        topItems: topRankedUseCases.slice(0, 5).map((uc) => ({
                          title: uc.title,
                          description: uc.description,
                          scoreLabel: 'RICE',
                          scoreValue: calculateWorkflowRICEScore(uc),
                        })),
                        financials: {
                          annualCOI: (topScoredUseCase?.manualCOI?.totalAnnualCOI) || (topScoredUseCase?.coiEstimate?.totalAnnualCOI),
                          annualValue: topScoredUseCase?.manualExpectedValue?.totalAnnualValue,
                          implementationCost: topScoredUseCase?.manualExpectedValue?.implementationCost,
                          paybackMonths: topScoredUseCase?.manualExpectedValue?.paybackMonths,
                          roi3YearPercent: topScoredUseCase?.manualExpectedValue?.threeYearROI,
                        },
                      })}
                    />
                  </div>

                  {/* Financial Quantification (Optional) - COI + ROI for a selected use case */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Financial Quantification (Optional)</h3>
                    <div className="space-y-2">
                      <Label>Apply COI/ROI to use case</Label>
                      <Select
                        value={financialTargetUseCase?.id || ''}
                        onValueChange={(v) => setFinancialTargetUseCaseId(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a use case" />
                        </SelectTrigger>
                        <SelectContent>
                          {topRankedUseCases.map((uc) => (
                            <SelectItem key={uc.id} value={uc.id}>
                              {uc.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Tip: Default is the top-scored use case.
                      </p>
                    </div>

                    <QuickCOICalculator
                      variant="compact"
                      customerName={session.customerName}
                      opportunityTitle={financialTargetUseCase?.title || session.name}
                      initialValues={financialTargetUseCase?.manualCOI ? {
                        directCosts: financialTargetUseCase.manualCOI.directCosts,
                        opportunityCosts: financialTargetUseCase.manualCOI.opportunityCosts,
                        riskCosts: financialTargetUseCase.manualCOI.riskCosts,
                        notes: financialTargetUseCase.manualCOI.notes || '',
                      } : undefined}
                      onSave={(values) => {
                        if (!financialTargetUseCase) return
                        const next: UseCaseCOI = {
                          directCosts: values.directCosts,
                          opportunityCosts: values.opportunityCosts,
                          riskCosts: values.riskCosts,
                          totalAnnualCOI: values.totalCOI,
                          notes: values.notes,
                          calculatedAt: Date.now(),
                        }

                        setUseCases((prev) => prev.map((u) => (u.id === financialTargetUseCase.id ? { ...u, manualCOI: next } : u)))
                      }}
                      autoContext={{
                        industry: session.industry ? industryLabels[session.industry] : undefined,
                        companyName: session.customerName,
                        annualRevenue,
                      }}
                    />

                    <QuickROICalculator
                      currency="USD"
                      initialValues={financialTargetUseCase?.manualExpectedValue ? {
                        revenueImpact: financialTargetUseCase.manualExpectedValue.revenueImpact || 0,
                        costSavings: financialTargetUseCase.manualExpectedValue.costSavings || 0,
                        riskMitigation: financialTargetUseCase.manualExpectedValue.riskMitigation || 0,
                        implementationCost: financialTargetUseCase.manualExpectedValue.implementationCost || 0,
                      } : undefined}
                      onSave={(inputs: ROIInputs, result: ROIResult) => {
                        if (!financialTargetUseCase) return
                        const next: UseCaseExpectedValue = {
                          revenueImpact: inputs.revenueImpact,
                          costSavings: inputs.costSavings,
                          riskMitigation: inputs.riskMitigation,
                          totalAnnualValue: result.totalAnnualValue,
                          implementationCost: inputs.implementationCost,
                          paybackMonths: Number.isFinite(result.paybackMonths) ? result.paybackMonths : undefined,
                          threeYearROI: Number.isFinite(result.roi3YearPercent) ? result.roi3YearPercent : undefined,
                        }
                        setUseCases((prev) => prev.map((u) => (u.id === financialTargetUseCase.id ? { ...u, manualExpectedValue: next } : u)))
                      }}
                    />
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
  onSave: (rice: WorkflowUseCase['rice'], aiEffortEstimate?: WorkflowUseCase['aiEffortEstimate'], coiEstimate?: WorkflowUseCase['coiEstimate']) => void
  onBack: () => void
  context?: { industry?: string; companyName?: string; annualRevenue?: number }
}

interface COIEstimateResult {
  directCosts: number
  opportunityCosts: number
  riskCosts: number
  totalAnnualCOI: number
  assumptions: string[]
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
  suggestedRICE: {
    impactMultiplier: 0.25 | 0.5 | 1 | 2 | 3
    impactReason: string
    confidenceBoost: number
    confidenceReason: string
  }
}

function RiceStep({ useCase, currentIndex, totalCount, onSave, onBack, context }: RiceStepProps) {
  const [users, setUsers] = useState(useCase.rice?.users || 100)
  const [period, setPeriod] = useState(useCase.rice?.period || 'quarter')
  const [impactMultiplier, setImpactMultiplier] = useState(useCase.rice?.impact || 1)
  const [confidence, setConfidence] = useState(useCase.rice?.confidence || 50)
  const [effort, setEffort] = useState(useCase.rice?.effort || useCase.aiEffortEstimate?.effortWeeks || 1)
  
  // AI effort estimation state
  const [isEstimating, setIsEstimating] = useState(false)
  const [aiEstimate, setAiEstimate] = useState<{ effortWeeks: number; reasoning: string } | null>(
    useCase.aiEffortEstimate || null
  )
  const [hasOverridden, setHasOverridden] = useState(false)

  // COI estimation state
  const [isEstimatingCOI, setIsEstimatingCOI] = useState(false)
  const [coiEstimate, setCoiEstimate] = useState<COIEstimateResult | null>(useCase.coiEstimate || null)
  const [hasOverriddenImpact, setHasOverriddenImpact] = useState(false)
  const [hasOverriddenConfidence, setHasOverriddenConfidence] = useState(false)
  const [showCOIDetails, setShowCOIDetails] = useState(false)

  // Auto-run AI estimation when entering the step (if not already cached)
  useEffect(() => {
    const runEstimation = async () => {
      // Effort estimation
      if (useCase.aiEffortEstimate) {
        setAiEstimate(useCase.aiEffortEstimate)
        if (!hasOverridden) {
          setEffort(useCase.aiEffortEstimate.effortWeeks)
        }
      } else {
        setIsEstimating(true)
        try {
          if (typeof window.estimateEffort === 'function') {
            const result = await window.estimateEffort(
              { title: useCase.title, description: useCase.description },
              { complexity: useCase.impact ? (useCase.impact >= 7 ? 'high' : useCase.impact >= 4 ? 'medium' : 'low') : undefined }
            )
            setAiEstimate(result)
            if (!hasOverridden) {
              setEffort(result.effortWeeks)
            }
          }
        } catch (error) {
          console.error('AI effort estimation failed:', error)
        } finally {
          setIsEstimating(false)
        }
      }

      // COI estimation
      if (useCase.coiEstimate) {
        setCoiEstimate(useCase.coiEstimate)
        if (!hasOverriddenImpact) {
          setImpactMultiplier(useCase.coiEstimate.suggestedRICE.impactMultiplier)
        }
        if (!hasOverriddenConfidence && useCase.coiEstimate.suggestedRICE.confidenceBoost > 0) {
          setConfidence(prev => Math.min(100, prev + useCase.coiEstimate!.suggestedRICE.confidenceBoost))
        }
      } else {
        setIsEstimatingCOI(true)
        try {
          if (typeof window.estimateCOI === 'function') {
            const result = await window.estimateCOI(
              { title: useCase.title, description: useCase.description },
              { industry: context?.industry, companyName: context?.companyName, annualRevenue: context?.annualRevenue }
            )
            setCoiEstimate(result)
            if (!hasOverriddenImpact) {
              setImpactMultiplier(result.suggestedRICE.impactMultiplier)
            }
            if (!hasOverriddenConfidence && result.suggestedRICE.confidenceBoost > 0) {
              setConfidence(prev => Math.min(100, prev + result.suggestedRICE.confidenceBoost))
            }
          }
        } catch (error) {
          console.error('AI COI estimation failed:', error)
        } finally {
          setIsEstimatingCOI(false)
        }
      }
    }
    
    runEstimation()
  }, [useCase.id])

  const reach = users / (period === 'month' ? 1 : period === 'quarter' ? 3 : 12)
  const riceScore = (reach * impactMultiplier * (confidence / 100)) / effort

  const handleEffortChange = (value: number) => {
    setEffort(value)
    setHasOverridden(true)
  }

  const handleImpactChange = (value: string) => {
    setImpactMultiplier(Number(value) as 0.25 | 0.5 | 1 | 2 | 3)
    setHasOverriddenImpact(true)
  }

  const handleConfidenceChange = (value: number) => {
    setConfidence(value)
    setHasOverriddenConfidence(true)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const handleSave = () => {
    onSave(
      {
        reach,
        users,
        period,
        impact: impactMultiplier,
        confidence,
        effort,
      },
      aiEstimate ? { ...aiEstimate, estimatedAt: Date.now() } : undefined,
      coiEstimate ? { ...coiEstimate, estimatedAt: Date.now() } : undefined
    )
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
              <div className="flex items-center gap-2">
                <Label>Impact Multiplier</Label>
                {isEstimatingCOI && (
                  <Badge variant="outline" className="text-xs animate-pulse bg-green-500/10 text-green-600 border-green-500/30">
                    <Sparkle size={12} className="mr-1" weight="fill" />
                    Calculating COI...
                  </Badge>
                )}
                {coiEstimate && !isEstimatingCOI && !hasOverriddenImpact && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    <Sparkle size={12} className="mr-1" weight="fill" />
                    COI-Informed
                  </Badge>
                )}
                {hasOverriddenImpact && (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Manual Override
                  </Badge>
                )}
              </div>
              <Select value={String(impactMultiplier)} onValueChange={handleImpactChange}>
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

            {/* COI Estimation Panel */}
            {(coiEstimate || isEstimatingCOI) && (
              <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkle size={16} className="text-green-600" weight="fill" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Cost of Inaction (COI) Estimate
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCOIDetails(!showCOIDetails)}
                    className="text-xs"
                  >
                    {showCOIDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>

                {isEstimatingCOI ? (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Calculating cost of inaction based on industry and use case context...
                  </p>
                ) : coiEstimate && (
                  <>
                    {/* COI Summary */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground">Direct Costs</p>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(coiEstimate.directCosts)}</p>
                      </div>
                      <div className="p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground">Opportunity</p>
                        <p className="text-sm font-semibold text-orange-600">{formatCurrency(coiEstimate.opportunityCosts)}</p>
                      </div>
                      <div className="p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground">Risk Costs</p>
                        <p className="text-sm font-semibold text-yellow-600">{formatCurrency(coiEstimate.riskCosts)}</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-red-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Annual Cost of Inaction</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(coiEstimate.totalAnnualCOI)}/year</p>
                      <Badge variant="outline" className={`mt-1 ${
                        coiEstimate.confidence === 'high' ? 'bg-green-500/10 text-green-600' :
                        coiEstimate.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {coiEstimate.confidence} confidence
                      </Badge>
                    </div>

                    {/* COI Details (collapsible) */}
                    {showCOIDetails && (
                      <div className="space-y-3 pt-2 border-t border-green-500/20">
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Reasoning</p>
                          <p className="text-xs text-muted-foreground">{coiEstimate.reasoning}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Assumptions</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {coiEstimate.assumptions.map((assumption, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500">•</span>
                                {assumption}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">RICE Suggestions</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Suggested Impact:</span>
                              <span className="font-semibold">{coiEstimate.suggestedRICE.impactMultiplier}x</span>
                            </div>
                            <p className="text-muted-foreground text-[11px]">{coiEstimate.suggestedRICE.impactReason}</p>
                            {coiEstimate.suggestedRICE.confidenceBoost > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span>Confidence Boost:</span>
                                  <span className="font-semibold text-green-600">+{coiEstimate.suggestedRICE.confidenceBoost}%</span>
                                </div>
                                <p className="text-muted-foreground text-[11px]">{coiEstimate.suggestedRICE.confidenceReason}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {(hasOverriddenImpact || hasOverriddenConfidence) && (
                          <button
                            onClick={() => {
                              if (coiEstimate) {
                                setImpactMultiplier(coiEstimate.suggestedRICE.impactMultiplier)
                                setHasOverriddenImpact(false)
                                if (coiEstimate.suggestedRICE.confidenceBoost > 0) {
                                  setConfidence(prev => Math.min(100, prev + coiEstimate.suggestedRICE.confidenceBoost))
                                  setHasOverriddenConfidence(false)
                                }
                              }
                            }}
                            className="text-xs text-green-600 hover:text-green-700 underline"
                          >
                            Apply COI suggestions to RICE
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Confidence (%)</Label>
                  {coiEstimate && !hasOverriddenConfidence && coiEstimate.suggestedRICE.confidenceBoost > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      <Sparkle size={12} className="mr-1" weight="fill" />
                      +{coiEstimate.suggestedRICE.confidenceBoost}% COI boost
                    </Badge>
                  )}
                </div>
                <span className="text-lg font-semibold text-foreground">{confidence}%</span>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={(val) => handleConfidenceChange(val[0])}
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
              <div className="flex items-center gap-2">
                <Label>Effort (Person-Weeks)</Label>
                {isEstimating && (
                  <Badge variant="outline" className="text-xs animate-pulse bg-primary/10 text-primary border-primary/30">
                    <Sparkle size={12} className="mr-1" weight="fill" />
                    AI Estimating...
                  </Badge>
                )}
                {aiEstimate && !isEstimating && !hasOverridden && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    <Sparkle size={12} className="mr-1" weight="fill" />
                    AI Suggested
                  </Badge>
                )}
                {hasOverridden && (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Manual Override
                  </Badge>
                )}
              </div>
              <Input
                type="number"
                value={effort}
                onChange={(e) => handleEffortChange(Number(e.target.value))}
                min={0.5}
                step={0.5}
                disabled={isEstimating}
              />
              <p className="text-xs text-muted-foreground">
                Total development time to implement this solution
              </p>
              
              {/* AI Reasoning Display */}
              {aiEstimate && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkle size={14} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">
                        AI Estimate: {aiEstimate.effortWeeks} person-weeks
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {aiEstimate.reasoning}
                      </p>
                      {hasOverridden && effort !== aiEstimate.effortWeeks && (
                        <button
                          onClick={() => {
                            setEffort(aiEstimate.effortWeeks)
                            setHasOverridden(false)
                          }}
                          className="text-xs text-primary hover:text-primary/90 underline mt-2"
                        >
                          Use AI suggestion
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={18} weight="bold" className="mr-2" />
            Back
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={isEstimating}>
            {currentIndex < totalCount - 1 ? 'Next Use Case' : 'Review Diagrams'}
            <ArrowRight size={18} weight="bold" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// DIAGRAMS STEP - Review Architecture & Process Flow Diagrams
// ============================================================================

interface DiagramsStepProps {
  useCase: WorkflowUseCase
  currentIndex: number
  totalCount: number
  industry?: string
  onNext: () => void
  onBack: () => void
  onRequestDifferentArchitecture?: (useCaseId: string, feedback: string) => void
  onRegenerateArchitecture?: (useCaseId: string) => Promise<void>
  onManualSelectArchitecture?: (useCaseId: string, pattern: ReferenceArchitecturePattern) => void
}

function DiagramsStep({ 
  useCase, 
  currentIndex, 
  totalCount,
  industry,
  onNext, 
  onBack,
  onRequestDifferentArchitecture,
  onRegenerateArchitecture,
  onManualSelectArchitecture,
}: DiagramsStepProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showManualSelector, setShowManualSelector] = useState(false)
  const hasArchitecture = useCase.referenceArchitecture
  const hasProcessFlow = useCase.businessProcesses && useCase.businessProcesses.length > 0

  const handleRegenerate = async () => {
    if (onRegenerateArchitecture) {
      setIsRegenerating(true)
      try {
        await onRegenerateArchitecture(useCase.id)
        toast.success('Architecture regenerated!')
      } catch (error) {
        console.error('Regeneration failed:', error)
        toast.error('AI regeneration failed', { description: 'You can select an architecture manually' })
        setShowManualSelector(true)
      } finally {
        setIsRegenerating(false)
      }
    }
  }

  return (
    <motion.div
      key={`diagrams-${useCase.id}`}
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
            <TreeStructure size={24} weight="duotone" className="text-primary" />
          </div>
          <CardTitle>Solution Architecture & Process Flow</CardTitle>
          <CardDescription>
            Review the recommended Microsoft architecture and business process improvements
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Use Case Context */}
          <div className="p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
            <p className="text-sm text-muted-foreground">{useCase.description}</p>
          </div>

          {/* Reference Architecture Diagram */}
          {hasArchitecture ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TreeStructure size={16} weight="duotone" />
                Recommended Reference Architecture
              </h4>
              <ArchitectureDiagram
                pattern={useCase.referenceArchitecture!}
                showLearnLink={true}
                onRequestDifferent={(feedback) => {
                  onRequestDifferentArchitecture?.(useCase.id, feedback)
                }}
              />
              {/* Regenerate/Change Actions */}
              <div className="flex gap-2 pt-2">
                {onRegenerateArchitecture && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="gap-2"
                  >
                    {isRegenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkle size={14} />
                        </motion.div>
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkle size={14} />
                        Regenerate with AI
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowManualSelector(!showManualSelector)}
                >
                  {showManualSelector ? 'Hide Options' : 'Change Architecture'}
                </Button>
              </div>
              
              {/* Inline Manual Selection */}
              <AnimatePresence>
                {showManualSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2"
                  >
                    <ManualArchitectureSelectorInline
                      currentPattern={useCase.referenceArchitecture}
                      industry={industry}
                      onSelect={(pattern) => {
                        onManualSelectArchitecture?.(useCase.id, pattern)
                        setShowManualSelector(false)
                        toast.success('Architecture updated!')
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
              <TreeStructure size={40} className="mx-auto text-amber-500" />
              <div>
                <p className="font-medium text-foreground">No Architecture Assigned</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI generation may have failed. Select an architecture manually or try regenerating.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                {onRegenerateArchitecture && (
                  <Button 
                    variant="outline" 
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="gap-2"
                  >
                    {isRegenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkle size={16} />
                        </motion.div>
                        Trying AI...
                      </>
                    ) : (
                      <>
                        <Sparkle size={16} />
                        Try AI Suggestion
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={() => setShowManualSelector(true)}>
                  Select Manually
                </Button>
              </div>
              
              {/* Manual Selection for missing architecture */}
              <AnimatePresence>
                {showManualSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4"
                  >
                    <ManualArchitectureSelectorInline
                      industry={industry}
                      onSelect={(pattern) => {
                        onManualSelectArchitecture?.(useCase.id, pattern)
                        setShowManualSelector(false)
                        toast.success('Architecture assigned!')
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Process Flow Diagram */}
          {hasProcessFlow ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FlowArrow size={16} weight="duotone" />
                Business Process Flow
              </h4>
              {useCase.businessProcesses!.map((process, idx) => (
                <ProcessFlowDiagram 
                  key={process.processId || idx}
                  process={process as any}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
              <FlowArrow size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No business process flow has been mapped for this use case.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Process flows are generated during discovery analysis.
              </p>
            </div>
          )}

          {/* Microsoft Solutions Summary */}
          {useCase.microsoftSolutions && useCase.microsoftSolutions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Microsoft Solutions</h4>
              <div className="flex flex-wrap gap-2">
                {useCase.microsoftSolutions.map((solution, idx) => (
                  <Badge 
                    key={idx}
                    variant="outline"
                    className="text-xs"
                  >
                    {solution.productFamily}: {solution.services.join(', ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <Button onClick={onNext}>
            {currentIndex < totalCount - 1 ? 'Next Use Case' : 'Generate Summary'}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Inline architecture selector component for DiagramsStep
function ManualArchitectureSelectorInline({ 
  currentPattern, 
  industry,
  onSelect 
}: { 
  currentPattern?: ReferenceArchitecturePattern
  industry?: string
  onSelect: (pattern: ReferenceArchitecturePattern) => void 
}) {
  const allPatterns = Object.keys(REFERENCE_ARCHITECTURES) as ReferenceArchitecturePattern[]
  const recommendedPatterns = industry 
    ? allPatterns.filter(p => REFERENCE_ARCHITECTURES[p].industries.includes(industry))
    : allPatterns

  return (
    <div className="border rounded-lg p-4 bg-card">
      <h5 className="font-medium text-sm mb-3">Select Reference Architecture</h5>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {recommendedPatterns.map(pattern => {
            const arch = REFERENCE_ARCHITECTURES[pattern]
            const complexity = COMPLEXITY_INDICATORS[arch.complexity]
            const isSelected = currentPattern === pattern
            
            return (
              <div
                key={pattern}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => onSelect(pattern)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{arch.label}</span>
                  {isSelected && <CheckCircle size={16} className="text-primary" weight="fill" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{arch.description}</p>
                <div className="flex gap-1 mt-2">
                  {arch.primaryProducts.slice(0, 2).map((p: string) => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {PRODUCT_FAMILY_LABELS[p]}
                    </Badge>
                  ))}
                  <Badge variant="outline" className={`text-xs ${complexity.color}`}>
                    {complexity.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
