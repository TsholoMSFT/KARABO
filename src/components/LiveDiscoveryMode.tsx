import { useState, useEffect, useCallback, useRef } from 'react'
import { DiscoveryResponse, DiscoverySession, Industry, DiscoveryQuestion } from '@/lib/types'
import { SessionMetadata } from '@/components/SessionMetadataForm'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import { getQuestionsForIndustry, industryLabels } from '@/lib/discovery-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Microphone, 
  MicrophoneSlash, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  WarningCircle,
  Sparkle,
  Keyboard,
  Lightbulb,
  SpinnerGap,
  Warning
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface LiveDiscoveryModeProps {
  sessionMetadata: SessionMetadata
  onComplete: (session: DiscoverySession) => void
  onCancel: () => void
  onSwitchToStandard?: (sessionName: string, industry: Industry, responses: DiscoveryResponse[]) => void
  sessionName: string
  selectedIndustry: Industry
  initialResponses?: DiscoveryResponse[]
}

export function LiveDiscoveryMode({
  sessionMetadata,
  onComplete,
  onCancel,
  onSwitchToStandard,
  sessionName,
  selectedIndustry,
  initialResponses,
}: LiveDiscoveryModeProps) {
  const { isAIFeatureEnabled } = useDiscoverySettings()
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<DiscoveryResponse[]>(initialResponses || [])
  const [manualOverride, setManualOverride] = useState<string>('')
  const [useManualInput, setUseManualInput] = useState(false)
  const [aiInsight, setAiInsight] = useState<string>('')
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [showAiInsight, setShowAiInsight] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<DiscoveryQuestion[]>([])
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false)
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  const [speechFailCount, setSpeechFailCount] = useState(0)
  const hasAutoStartedRef = useRef(false)
  const maxSpeechFailures = 3

  // Memoize callback to prevent hook recreation
  const handleTranscriptUpdate = useCallback((fullTranscript: string) => {
    if (fullTranscript.length > 20) {
      setManualOverride(fullTranscript)
    }
  }, [])

  const handleSpeechError = useCallback((errorMessage: string) => {
    console.error('[LiveDiscovery] Speech error:', errorMessage)
    toast.error(errorMessage, { duration: 4000 })
    
    setSpeechFailCount(prev => {
      const newCount = prev + 1
      if (newCount >= maxSpeechFailures) {
        toast.info('Switching to text input after multiple failures', { duration: 3000 })
        setUseManualInput(true)
      }
      return newCount
    })
  }, [])

  const { 
    isListening, 
    isSupported, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening, 
    resetTranscript,
    error: speechError,
    isStarting,
    retryCount
  } = useSpeechRecognition({
    onTranscriptUpdate: handleTranscriptUpdate,
    onError: handleSpeechError,
  })

  const questions = getQuestionsForIndustry(selectedIndustry)
  const baseQuestions = getQuestionsForIndustry(selectedIndustry)
  const allQuestions = [...baseQuestions, ...followUpQuestions]
  const questionsToUse = allQuestions
  const progress = ((currentStep + 1) / questionsToUse.length) * 100
  const currentQuestion = questionsToUse[currentStep]
  const isLastBaseQuestion = currentStep === baseQuestions.length - 1
  const isLastQuestion = currentStep === questionsToUse.length - 1

  const displayText = useManualInput ? manualOverride : (transcript || interimTranscript)
  const fullTranscript = useManualInput ? manualOverride : transcript

  useEffect(() => {
    const existingResponse = responses.find((r) => r.questionId === currentQuestion.id)
    if (existingResponse) {
      setManualOverride(existingResponse.answer)
      setUseManualInput(true)
      if (isListening) {
        stopListening()
      }
    } else {
      setManualOverride('')
      setUseManualInput(false)
    }
    setShowAiInsight(false)
    setAiInsight('')
    setShowFollowUpPrompt(false)
  }, [currentStep, currentQuestion.id, isListening, stopListening])

  const generateAiInsight = async () => {
    if (!fullTranscript.trim()) {
      toast.error('Please provide an answer first')
      return
    }

    setIsGeneratingInsight(true)
    setShowAiInsight(true)

    try {
      const contextText = responses.length > 0
        ? `Previous responses:\n${responses.map(r => `Q: ${baseQuestions.find(q => q.id === r.questionId)?.question}\nA: ${r.answer}`).join('\n\n')}\n\n`
        : ''

      const promptText = `You are an innovation consultant providing real-time insights during a discovery session.

${contextText}Current Question: ${currentQuestion.question}
Current Answer: ${fullTranscript}

Industry Context: ${industryLabels[selectedIndustry]}

Provide a brief, actionable insight (2-3 sentences) that:
1. Identifies a key opportunity or challenge based on this answer
2. Suggests a potential area to explore further
3. Connects to Microsoft innovation or technology capabilities when relevant

Be conversational, insightful, and focused on helping them discover valuable use cases.`

      const insight = await window.llm(promptText, 'gpt-4o-mini')
      setAiInsight(insight)
    } catch (error) {
      console.error('Error generating insight:', error)
      toast.error('Failed to generate insight')
      setShowAiInsight(false)
    } finally {
      setIsGeneratingInsight(false)
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

      const industry = industryLabels[selectedIndustry]
      
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

  const handleNext = async () => {
    if (!fullTranscript.trim()) {
      toast.error('Please provide an answer before continuing')
      return
    }

    const updatedResponses = [
      ...responses.filter((r) => r.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        answer: fullTranscript.trim(),
      }
    ]
    setResponses(updatedResponses)

    if (isLastQuestion) {
      const customerId = `customer-${sessionMetadata.customerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const session: DiscoverySession = {
        id: `discovery-${Date.now()}`,
        customerId,
        customerName: sessionMetadata.customerName,
        innovationHubSPOC: sessionMetadata.innovationHubSPOC,
        name: sessionName,
        industry: selectedIndustry,
        innovationHubLocation: sessionMetadata.innovationHubLocation,
        solutionEngineer: sessionMetadata.solutionEngineer,
        accountTeamRep: sessionMetadata.accountTeamRep,
        primaryStakeholder: sessionMetadata.primaryStakeholder,
        responses: updatedResponses,
        createdAt: Date.now(),
        completedAt: Date.now(),
      }
      onComplete(session)
    } else {
      if (isLastBaseQuestion && fullTranscript.trim() && !currentQuestion.isFollowUp && isAIFeatureEnabled('enableFollowUpQuestions')) {
        setShowFollowUpPrompt(true)
      } else {
        setCurrentStep(currentStep + 1)
        resetTranscript()
        setManualOverride('')
        setUseManualInput(false)
      }
    }
  }

  const handleGenerateFollowUps = async () => {
    if (!currentQuestion || !fullTranscript.trim()) return
    
    const newFollowUps = await generateFollowUpQuestions(currentQuestion, fullTranscript)
    
    if (newFollowUps.length > 0) {
      setFollowUpQuestions(prev => [...prev, ...newFollowUps])
      toast.success(`Generated ${newFollowUps.length} follow-up question${newFollowUps.length > 1 ? 's' : ''}`)
      setShowFollowUpPrompt(false)
      setCurrentStep(currentStep + 1)
      resetTranscript()
      setManualOverride('')
      setUseManualInput(false)
    } else {
      toast.error('Could not generate follow-up questions')
      handleSkipFollowUps()
    }
  }

  const handleSkipFollowUps = () => {
    setShowFollowUpPrompt(false)
    if (currentStep + 1 < questionsToUse.length) {
      setCurrentStep(currentStep + 1)
      resetTranscript()
      setManualOverride('')
      setUseManualInput(false)
    } else {
      const customerId = `customer-${sessionMetadata.customerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      const session: DiscoverySession = {
        id: `discovery-${Date.now()}`,
        customerId,
        customerName: sessionMetadata.customerName,
        innovationHubSPOC: sessionMetadata.innovationHubSPOC,
        name: sessionName,
        industry: selectedIndustry,
        innovationHubLocation: sessionMetadata.innovationHubLocation,
        solutionEngineer: sessionMetadata.solutionEngineer,
        accountTeamRep: sessionMetadata.accountTeamRep,
        primaryStakeholder: sessionMetadata.primaryStakeholder,
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
      const prevQuestion = questionsToUse[currentStep - 1]
      const prevResponse = responses.find((r) => r.questionId === prevQuestion.id)
      setManualOverride(prevResponse?.answer || '')
      resetTranscript()
      setUseManualInput(true)
    }
  }

  // Auto-start listening on first question only once
  useEffect(() => {
    if (
      !isListening && 
      !isStarting && 
      currentStep === 0 && 
      !useManualInput && 
      isSupported && 
      !hasAutoStartedRef.current &&
      speechFailCount < maxSpeechFailures
    ) {
      hasAutoStartedRef.current = true
      const timer = setTimeout(() => {
        startListening()
      }, 800) // Slightly longer delay for browser readiness
      return () => clearTimeout(timer)
    }
  }, [currentStep, isListening, isStarting, useManualInput, isSupported, startListening, speechFailCount])

  // Reset auto-start flag when moving to new questions
  useEffect(() => {
    if (currentStep > 0) {
      hasAutoStartedRef.current = false
    }
  }, [currentStep])

  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [isListening, stopListening])

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl"
        >
          <Card className="border-2 border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <WarningCircle size={28} weight="bold" className="text-destructive" />
                <CardTitle className="text-2xl">Speech Recognition Not Supported</CardTitle>
              </div>
              <CardDescription className="text-base mt-2">
                Your browser doesn't support the Web Speech API. Please use Chrome, Edge, or Safari instead.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Go Back
              </Button>
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
                <Microphone size={28} weight="bold" className="text-primary animate-pulse" />
                <div className="flex flex-col">
                  <CardTitle className="text-2xl">Live Discovery</CardTitle>
                  <Badge variant="outline" className="w-fit mt-1">
                    {industryLabels[selectedIndustry]}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                Question {currentStep + 1} of {questionsToUse.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
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
              ) : (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentQuestion.isFollowUp && (
                    <div className="flex items-start gap-2 mb-4">
                      <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/40">
                        <Sparkle size={12} weight="fill" className="mr-1" />
                        AI Follow-up
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 leading-relaxed">
                      {currentQuestion.question}
                    </h3>

                    <div className="space-y-4">
                {/* Microphone Recording View */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <div className={`p-6 rounded-lg border-2 transition-all ${
                    isListening
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-muted bg-muted/20'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {isStarting ? (
                          <>
                            <SpinnerGap 
                              size={24} 
                              weight="bold" 
                              className="text-primary animate-spin"
                            />
                            <span className="text-sm font-medium text-primary">
                              {retryCount > 0 ? `Connecting (retry ${retryCount}/3)...` : 'Starting...'}
                            </span>
                          </>
                        ) : isListening ? (
                          <>
                            <Microphone 
                              size={24} 
                              weight="fill" 
                              className="text-primary animate-pulse"
                            />
                            <span className="text-sm font-medium text-primary">Recording...</span>
                          </>
                        ) : speechError ? (
                          <>
                            <Warning size={24} className="text-destructive" />
                            <span className="text-sm font-medium text-destructive">Error - Try again</span>
                          </>
                        ) : (
                          <>
                            <MicrophoneSlash size={24} className="text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Not recording</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isListening ? 'destructive' : 'default'}
                          onClick={isListening ? stopListening : startListening}
                          disabled={isStarting}
                          className="gap-2"
                        >
                          {isStarting ? (
                            <>
                              <SpinnerGap size={16} className="animate-spin" />
                              Connecting...
                            </>
                          ) : isListening ? (
                            <>
                              <MicrophoneSlash size={16} />
                              Stop
                            </>
                          ) : (
                            <>
                              <Microphone size={16} />
                              Start
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Transcript Display */}
                    <div className="space-y-2">
                      <div className="bg-background p-4 rounded border border-border min-h-[100px]">
                        <p className="text-foreground whitespace-pre-wrap break-words">
                          {displayText}
                          {interimTranscript && !useManualInput && (
                            <span className="text-muted-foreground italic">
                              {interimTranscript}
                            </span>
                          )}
                        </p>
                        {!displayText && (
                          <p className="text-muted-foreground text-sm italic">
                            Start speaking to fill in your answer...
                          </p>
                        )}
                      </div>

                      {displayText && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle size={16} weight="fill" />
                          Response captured
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* AI Insight */}
                {displayText && isAIFeatureEnabled('enableAIInsights') && (
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAiInsight}
                      disabled={isGeneratingInsight}
                      className="gap-2 mb-3"
                    >
                      <Sparkle size={16} weight="fill" className="text-primary" />
                      {isGeneratingInsight ? 'Analyzing...' : 'Get AI Insight'}
                    </Button>

                    <AnimatePresence>
                      {showAiInsight && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <Alert className="bg-primary/5 border-primary/20">
                            <Lightbulb size={18} weight="fill" className="text-primary" />
                            <AlertDescription className="text-sm">
                              {isGeneratingInsight ? (
                                <span className="text-muted-foreground italic">Generating insight...</span>
                              ) : (
                                <span className="text-foreground">{aiInsight}</span>
                              )}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Manual Override Option */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setUseManualInput(!useManualInput)}
                    className="text-sm text-primary hover:underline mb-2"
                  >
                    {useManualInput ? 'Switch back to voice' : 'Edit or type manually'}
                  </button>

                  {useManualInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <Textarea
                        value={manualOverride}
                        onChange={(e) => setManualOverride(e.target.value)}
                        placeholder={currentQuestion.placeholder}
                        className="min-h-[120px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Edit the captured text or type your own response
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
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
              {currentStep > 0 && !showFollowUpPrompt && (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
              )}
            </div>
            {!showFollowUpPrompt && (
              <div className="flex gap-2">
                {onSwitchToStandard && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const filteredResponses = responses.filter((r) => r.questionId !== currentQuestion.id)
                      const updatedResponses = fullTranscript.trim()
                        ? [...filteredResponses, {
                            questionId: currentQuestion.id,
                            answer: fullTranscript.trim(),
                          }]
                        : filteredResponses
                      onSwitchToStandard(sessionName, selectedIndustry, updatedResponses)
                    }}
                    className="gap-2"
                  >
                    <Keyboard size={18} weight="fill" />
                    Switch to Standard
                  </Button>
                )}
                <Button 
                  onClick={handleNext} 
                  disabled={!fullTranscript.trim()}
                  className="gap-2"
                >
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
