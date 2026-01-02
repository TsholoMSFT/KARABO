import { useState, useEffect } from 'react'
import { DiscoveryResponse, DiscoverySession, Industry, DiscoveryQuestion } from '@/lib/types'
import { SessionMetadata } from '@/components/SessionMetadataForm'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import { discoveryQuestions, getQuestionsForIndustry, industryLabels } from '@/lib/discovery-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, ArrowRight, Sparkle, MagnifyingGlass, Buildings, Hospital, Bank, Factory, ShoppingCart, Bank as GovIcon, GraduationCap, Lightning, Broadcast, Microphone, Lightbulb } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface DiscoveryWizardProps {
  sessionMetadata: SessionMetadata
  onComplete: (session: DiscoverySession) => void
  onCancel: () => void
  onSwitchToLive?: (sessionName: string, industry: Industry, responses: DiscoveryResponse[]) => void
  initialSessionName?: string
  initialIndustry?: Industry
  initialResponses?: DiscoveryResponse[]
}

type WizardStep = 'name' | 'industry' | 'questions'

const industryIcons: Record<Industry, React.ReactNode> = {
  general: <Buildings size={32} weight="duotone" />,
  healthcare: <Hospital size={32} weight="duotone" />,
  'financial-services': <Bank size={32} weight="duotone" />,
  manufacturing: <Factory size={32} weight="duotone" />,
  retail: <ShoppingCart size={32} weight="duotone" />,
  government: <GovIcon size={32} weight="duotone" />,
  education: <GraduationCap size={32} weight="duotone" />,
  energy: <Lightning size={32} weight="duotone" />,
  telecommunications: <Broadcast size={32} weight="duotone" />,
}

export function DiscoveryWizard({ 
  sessionMetadata,
  onComplete, 
  onCancel, 
  onSwitchToLive,
  initialSessionName,
  initialIndustry,
  initialResponses 
}: DiscoveryWizardProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  const [wizardStep, setWizardStep] = useState<WizardStep>(
    initialSessionName ? (initialIndustry ? 'questions' : 'industry') : 'name'
  )
  const [sessionName, setSessionName] = useState(initialSessionName || '')
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(initialIndustry || null)
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<DiscoveryResponse[]>(initialResponses || [])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<string>('')
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<DiscoveryQuestion[]>([])
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false)
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)

  const baseQuestions = selectedIndustry ? getQuestionsForIndustry(selectedIndustry) : discoveryQuestions.filter((q) => !q.industries)
  const allQuestions = [...baseQuestions, ...followUpQuestions]
  const questions = allQuestions
  const progress = wizardStep === 'questions' ? ((currentStep + 1) / questions.length) * 100 : 0
  const currentQuestion = wizardStep === 'questions' ? questions[currentStep] : null
  const isLastBaseQuestion = currentQuestion && currentStep === baseQuestions.length - 1
  const isLastQuestion = currentQuestion && currentStep === questions.length - 1

  useEffect(() => {
    if (currentQuestion && wizardStep === 'questions') {
      const existingResponse = responses.find((r) => r.questionId === currentQuestion.id)
      setCurrentAnswer(existingResponse?.answer || '')
      setShowAiSuggestion(false)
      setAiSuggestion('')
    }
  }, [currentStep, currentQuestion, wizardStep])

  const generateAiSuggestion = async () => {
    if (!currentQuestion) return

    setIsGeneratingSuggestion(true)
    setShowAiSuggestion(true)

    try {
      const contextText = responses.length > 0
        ? `Previous responses from this session:\n${responses.map(r => {
            const q = questions.find(q => q.id === r.questionId)
            return `Q: ${q?.question}\nA: ${r.answer}`
          }).join('\n\n')}\n\n`
        : ''

      const promptText = `You are an innovation consultant helping someone think through a discovery question.

${contextText}Current Question: ${currentQuestion.question}

Customer Context:
- Company: ${sessionMetadata.customerName}
- Industry: ${selectedIndustry ? industryLabels[selectedIndustry] : 'General'}

Provide 2-3 thoughtful prompts or examples (bullet points) to help them think about how to answer this question effectively. Focus on:
1. Key areas they should consider
2. Common challenges or opportunities in this area
3. Specific examples relevant to their industry

Keep it brief, actionable, and thought-provoking. Do not answer the question for them - just help them think through it.`

      const suggestion = await window.llm(promptText, 'gpt-4o-mini')
      setAiSuggestion(suggestion)
    } catch (error) {
      console.error('Error generating suggestion:', error)
      toast.error('Failed to generate suggestion')
      setShowAiSuggestion(false)
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }

  const generateFollowUpQuestions = async (currentQuestionData: DiscoveryQuestion, answer: string) => {
    if (!answer.trim()) return []

    setIsGeneratingFollowUp(true)

    try {
      const contextText = responses.length > 0
        ? `Previous discussion:\n${responses.map(r => {
            const q = baseQuestions.find(q => q.id === r.questionId)
            return `Q: ${q?.question}\nA: ${r.answer}`
          }).join('\n\n')}\n\n`
        : ''

      const industry = selectedIndustry ? industryLabels[selectedIndustry] : 'General'
      
      const promptText = `You are an innovation consultant conducting a discovery session. Based on the customer's answer, generate 1-2 intelligent follow-up questions that will help uncover deeper insights and potential use cases.

${contextText}Current Question: ${currentQuestionData.question}
Customer's Answer: ${answer}

Customer Context:
- Company: ${sessionMetadata.customerName}
- Industry: ${industry}

Generate 1-2 targeted follow-up questions that:
1. Dig deeper into specific aspects mentioned in their answer
2. Uncover quantifiable metrics or pain points
3. Explore the business impact or technical constraints
4. Help identify concrete automation or innovation opportunities

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "questions": [
    {
      "question": "The follow-up question text",
      "category": "business|technical|users|challenges",
      "placeholder": "Example placeholder text for the answer"
    }
  ]
}

Keep questions conversational, specific to their answer, and focused on discovering valuable use cases.`

      const result = await window.llm(promptText, 'gpt-4o-mini', true)
      const parsed = JSON.parse(result)
      
      const followUps: DiscoveryQuestion[] = parsed.questions.map((q: any, idx: number) => ({
        id: `followup-${currentQuestionData.id}-${Date.now()}-${idx}`,
        question: q.question,
        category: q.category || 'business',
        placeholder: q.placeholder,
        isFollowUp: true,
        parentQuestionId: currentQuestionData.id,
      }))

      return followUps
    } catch (error) {
      console.error('Error generating follow-up questions:', error)
      return []
    } finally {
      setIsGeneratingFollowUp(false)
    }
  }

  const handleNameNext = () => {
    if (!sessionName.trim()) return
    setWizardStep('industry')
  }

  const handleIndustrySelect = (industry: Industry) => {
    setSelectedIndustry(industry)
    setWizardStep('questions')
  }

  const handleNext = async () => {
    if (!currentQuestion) return

    const filteredResponses = responses.filter((r) => r.questionId !== currentQuestion.id)
    const updatedResponses = currentAnswer.trim()
      ? [...filteredResponses, {
          questionId: currentQuestion.id,
          answer: currentAnswer.trim(),
        }]
      : filteredResponses
    
    setResponses(updatedResponses)

    if (isLastQuestion) {
      const customerId = `customer-${sessionMetadata.customerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const session: DiscoverySession = {
        id: `discovery-${Date.now()}`,
        customerId,
        customerName: sessionMetadata.customerName,
        innovationHubSPOC: sessionMetadata.innovationHubSPOC,
        name: sessionName,
        industry: selectedIndustry || 'general',
        innovationHubLocation: sessionMetadata.innovationHubLocation,
        solutionEngineer: sessionMetadata.solutionEngineer,
        accountTeamRep: sessionMetadata.accountTeamRep,
        primaryStakeholder: sessionMetadata.primaryStakeholder,
        stockTicker: sessionMetadata.stockTicker || undefined,
        responses: updatedResponses,
        createdAt: Date.now(),
        completedAt: Date.now(),
      }
      onComplete(session)
    } else {
      if (isLastBaseQuestion && currentAnswer.trim() && !currentQuestion.isFollowUp && isAIFeatureEnabled('enableFollowUpQuestions')) {
        setShowFollowUpPrompt(true)
      } else {
        setCurrentStep(currentStep + 1)
        const nextQuestion = questions[currentStep + 1]
        const nextResponse = updatedResponses.find((r) => r.questionId === nextQuestion.id)
        setCurrentAnswer(nextResponse?.answer || '')
      }
    }
  }

  const handleGenerateFollowUps = async () => {
    if (!currentQuestion || !currentAnswer.trim()) return
    
    const newFollowUps = await generateFollowUpQuestions(currentQuestion, currentAnswer)
    
    if (newFollowUps.length > 0) {
      setFollowUpQuestions(prev => [...prev, ...newFollowUps])
      toast.success(`Generated ${newFollowUps.length} follow-up question${newFollowUps.length > 1 ? 's' : ''}`)
      setShowFollowUpPrompt(false)
      setCurrentStep(currentStep + 1)
      setCurrentAnswer('')
    } else {
      toast.error('Could not generate follow-up questions')
      handleSkipFollowUps()
    }
  }

  const handleSkipFollowUps = () => {
    setShowFollowUpPrompt(false)
    if (currentStep + 1 < questions.length) {
      setCurrentStep(currentStep + 1)
      const nextQuestion = questions[currentStep + 1]
      const nextResponse = responses.find((r) => r.questionId === nextQuestion.id)
      setCurrentAnswer(nextResponse?.answer || '')
    } else {
      const customerId = `customer-${sessionMetadata.customerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const session: DiscoverySession = {
        id: `discovery-${Date.now()}`,
        customerId,
        customerName: sessionMetadata.customerName,
        innovationHubSPOC: sessionMetadata.innovationHubSPOC,
        name: sessionName,
        industry: selectedIndustry || 'general',
        innovationHubLocation: sessionMetadata.innovationHubLocation,
        solutionEngineer: sessionMetadata.solutionEngineer,
        accountTeamRep: sessionMetadata.accountTeamRep,
        primaryStakeholder: sessionMetadata.primaryStakeholder,
        stockTicker: sessionMetadata.stockTicker || undefined,
        responses: responses,
        createdAt: Date.now(),
        completedAt: Date.now(),
      }
      onComplete(session)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      const prevQuestion = questions[currentStep - 1]
      const prevResponse = responses.find((r) => r.questionId === prevQuestion.id)
      setCurrentAnswer(prevResponse?.answer || '')
    } else if (wizardStep === 'questions') {
      setWizardStep('industry')
      setCurrentStep(0)
      setResponses([])
      setCurrentAnswer('')
    } else if (wizardStep === 'industry') {
      setWizardStep('name')
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'business':
        return 'bg-primary text-primary-foreground'
      case 'technical':
        return 'bg-secondary text-secondary-foreground'
      case 'users':
        return 'bg-accent text-accent-foreground'
      case 'challenges':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (wizardStep === 'name') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-2">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <MagnifyingGlass size={28} weight="bold" className="text-primary" />
                <CardTitle className="text-2xl">New Discovery Session</CardTitle>
              </div>
              <CardDescription className="text-base">
                Give your discovery session a meaningful name to help identify it later
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-name" className="text-base">
                  Session Name
                </Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Q1 2024 Customer Discovery, Manufacturing Assessment"
                  className="text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sessionName.trim()) {
                      handleNameNext()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a name that will help you identify this session when comparing with others
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {onSwitchToLive && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (sessionName.trim()) {
                        onSwitchToLive(sessionName, selectedIndustry || 'general', responses)
                      }
                    }}
                    className="gap-2"
                  >
                    <Microphone size={18} weight="fill" />
                    Switch to Live
                  </Button>
                )}
                <Button onClick={handleNameNext} disabled={!sessionName.trim()} className="gap-2">
                  Continue
                  <ArrowRight size={18} />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (wizardStep === 'industry') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl"
        >
          <Card className="border-2">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <MagnifyingGlass size={28} weight="bold" className="text-primary" />
                <CardTitle className="text-2xl">Select Your Industry</CardTitle>
              </div>
              <CardDescription className="text-base">
                Choose your industry to get tailored discovery questions that match your specific needs
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(industryLabels) as Industry[]).map((industry) => (
                  <motion.button
                    key={industry}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleIndustrySelect(industry)}
                    className="group relative p-6 rounded-lg border-2 border-border hover:border-primary transition-all bg-card hover:bg-muted/50 text-left"
                  >
                    <div className="flex flex-col items-start gap-3">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {industryIcons[industry]}
                      </div>
                      <h3 className="font-semibold text-foreground text-base leading-tight">
                        {industryLabels[industry]}
                      </h3>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>

            <CardFooter className="border-t pt-6 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
              </div>
              {onSwitchToLive && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (sessionName.trim()) {
                      onSwitchToLive(sessionName, selectedIndustry || 'general', responses)
                    }
                  }}
                  className="gap-2"
                >
                  <Microphone size={18} weight="fill" />
                  Switch to Live
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-2">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MagnifyingGlass size={28} weight="bold" className="text-primary" />
                <div className="flex flex-col">
                  <CardTitle className="text-2xl">Discovery Process</CardTitle>
                  {selectedIndustry && (
                    <Badge variant="outline" className="w-fit mt-1">
                      {industryLabels[selectedIndustry]}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                Question {currentStep + 1} of {questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <CardDescription className="text-base">
              Help us understand your needs to identify potential use cases
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {showFollowUpPrompt ? (
                <motion.div
                  key="followup-prompt"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <Alert className="bg-primary/10 border-primary/30">
                    <Sparkle size={20} weight="fill" className="text-primary" />
                    <AlertDescription className="text-base">
                      <p className="font-semibold text-foreground mb-2">
                        Great answer! Would you like AI-generated follow-up questions?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Based on your response, I can generate 1-2 targeted follow-up questions to dig deeper and uncover more valuable insights.
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleGenerateFollowUps}
                      disabled={isGeneratingFollowUp}
                      className="gap-2"
                      size="lg"
                    >
                      <Sparkle size={18} weight="fill" />
                      {isGeneratingFollowUp ? 'Generating Questions...' : 'Yes, Generate Follow-ups'}
                    </Button>
                    <Button
                      onClick={handleSkipFollowUps}
                      variant="outline"
                      size="lg"
                      disabled={isGeneratingFollowUp}
                    >
                      No, Continue to Next Question
                    </Button>
                  </div>

                  {isGeneratingFollowUp && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Analyzing your answer and generating intelligent follow-up questions...
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <Badge className={getCategoryColor(currentQuestion.category)}>
                      {currentQuestion.category}
                    </Badge>
                    {currentQuestion.industries && (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                        Industry-Specific
                      </Badge>
                    )}
                    {currentQuestion.isFollowUp && (
                      <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/40">
                        <Sparkle size={12} weight="fill" className="mr-1" />
                        AI Follow-up
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground leading-relaxed">
                      {currentQuestion.question}
                    </h3>
                    <Textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="min-h-[180px] resize-none text-base"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Optional: You can skip questions and come back later
                      </p>
                      {isAIFeatureEnabled('enableAIInsights') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateAiSuggestion}
                          disabled={isGeneratingSuggestion}
                          className="gap-2 text-xs"
                        >
                          <Sparkle size={14} weight="fill" className="text-primary" />
                          {isGeneratingSuggestion ? 'Thinking...' : 'Need help?'}
                        </Button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showAiSuggestion && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <Alert className="bg-primary/5 border-primary/20 mt-3">
                            <Lightbulb size={18} weight="fill" className="text-primary" />
                            <AlertDescription className="text-sm">
                              {isGeneratingSuggestion ? (
                                <span className="text-muted-foreground italic">Generating suggestions...</span>
                              ) : (
                                <div className="text-foreground whitespace-pre-wrap">{aiSuggestion}</div>
                              )}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {!showFollowUpPrompt && (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
              )}
            </div>
            {!showFollowUpPrompt && (
              <div className="flex gap-2">
                {onSwitchToLive && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (sessionName.trim() && selectedIndustry) {
                        const filteredResponses = responses.filter((r) => r.questionId !== currentQuestion?.id)
                        const updatedResponses = currentAnswer.trim() && currentQuestion
                          ? [...filteredResponses, {
                              questionId: currentQuestion.id,
                              answer: currentAnswer.trim(),
                            }]
                          : filteredResponses
                        onSwitchToLive(sessionName, selectedIndustry, updatedResponses)
                      }
                    }}
                    className="gap-2"
                  >
                    <Microphone size={18} weight="fill" />
                    Switch to Live
                  </Button>
                )}
                <Button onClick={handleNext} className="gap-2">
                  {isLastQuestion ? (
                    <>
                      <Sparkle size={18} weight="fill" />
                      Generate Use Cases
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
