import { useState, useEffect, useRef } from 'react'
import { DiscoverySession, UseCase, AIRegulationsInfo, CybersecurityInfo, EarningsInsight } from '@/lib/types'
import { useDiscovery } from '@/hooks/use-discovery'
import { discoveryQuestions, getQuestionsForIndustry, industryLabels } from '@/lib/discovery-questions'
import { getRegulationsForIndustry, getSecurityRequirementsForIndustry, getRegulationsForJurisdiction, getFallbackUseCasesForIndustry } from '@/lib/demo-data'
import { searchEarningsTranscripts, analyzeTranscriptsWithAI, CompanyInsight } from '@/lib/earnings-service'
import { EnhancedDiscoveryWorkflow } from '@/components/EnhancedDiscoveryWorkflow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkle, ArrowClockwise, Warning, ChartLineUp } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface DiscoveryResultsProps {
  session: DiscoverySession
  onCreateUseCases: (useCases: Partial<UseCase>[], executiveSummary: string) => void
  onBack: () => void
}

interface SuggestedUseCase {
  title: string
  description: string
  rationale: string
  selected: boolean
  aiRegulations?: AIRegulationsInfo
  cybersecurity?: CybersecurityInfo
}

export function DiscoveryResults({ session, onCreateUseCases, onBack }: DiscoveryResultsProps) {
  const { addSession, updateSession } = useDiscovery()
  const [isGenerating, setIsGenerating] = useState(true)
  const [generationPhase, setGenerationPhase] = useState<'analyzing' | 'fetching-earnings' | 'generating'>('analyzing')
  const [suggestedUseCases, setSuggestedUseCases] = useState<SuggestedUseCase[]>([])
  const [earningsInsights, setEarningsInsights] = useState<EarningsInsight[]>([])
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [usedEarningsData, setUsedEarningsData] = useState(false)
  const generationAttemptedRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate generation attempts
    if (!generationAttemptedRef.current) {
      generationAttemptedRef.current = true
      generateUseCases()
    }
  }, [])

  // Load fallback use cases for the industry
  const loadFallbackUseCases = () => {
    const industry = session.industry || 'general'
    const fallbackCases = getFallbackUseCasesForIndustry(industry)
    
    const useCases: SuggestedUseCase[] = fallbackCases.map((fc) => ({
      title: fc.title,
      description: fc.description,
      rationale: fc.rationale,
      selected: true,
      aiRegulations: fc.aiRegulations,
      cybersecurity: fc.cybersecurity,
    }))
    
    setSuggestedUseCases(useCases)
    setUsedFallback(true)
    
    const useCaseData = useCases.map((uc) => ({
      title: uc.title,
      description: uc.description,
      rationale: uc.rationale,
      aiRegulations: uc.aiRegulations,
      cybersecurity: uc.cybersecurity,
    }))
    
    updateSession(session.id, {
      suggestedUseCases: useCaseData,
    })
    
    toast.info(`Showing ${useCases.length} sample use cases for ${industryLabels[industry] || 'your industry'}`, {
      description: 'AI generation unavailable. These are curated samples you can customize.',
    })
  }

  const generateUseCases = async () => {
    setIsGenerating(true)
    setGenerationPhase('analyzing')
    
    try {
      const allQuestions = session.industry 
        ? getQuestionsForIndustry(session.industry) 
        : discoveryQuestions.filter((q) => !q.industries)

      const responsesText = session.responses
        .map((r) => {
          const question = allQuestions.find((q) => q.id === r.questionId)
          return `Q: ${question?.question}\nA: ${r.answer}`
        })
        .join('\n\n')

      const industryContext = session.industry && session.industry !== 'general'
        ? `\n\nINDUSTRY CONTEXT: The organization operates in the ${industryLabels[session.industry]} sector. Tailor your suggestions to be relevant to this industry's specific challenges and opportunities.`
        : ''

      // Determine jurisdiction from location
      const jurisdiction = session.innovationHubLocation?.toLowerCase().includes('johannesburg') ||
        session.innovationHubLocation?.toLowerCase().includes('south africa') ||
        session.innovationHubLocation?.toLowerCase().includes('cape town')
        ? 'South Africa'
        : session.innovationHubLocation?.toLowerCase().includes('london') || session.innovationHubLocation?.toLowerCase().includes('uk')
        ? 'United Kingdom'
        : session.innovationHubLocation?.toLowerCase().includes('europe') || session.innovationHubLocation?.toLowerCase().includes('eu')
        ? 'European Union'
        : 'United States'

      // Fetch earnings data if stock ticker is provided
      let earningsContext = ''
      let fetchedInsights: EarningsInsight[] = []
      
      if (session.stockTicker) {
        setGenerationPhase('fetching-earnings')
        try {
          // Determine region based on ticker format
          const region: 'US' | 'ZA' | 'EU' | 'GLOBAL' = 
            session.stockTicker.includes('.JO') || session.stockTicker.includes('.JSE') ? 'ZA' :
            session.stockTicker.includes('.L') || session.stockTicker.includes('.DE') || session.stockTicker.includes('.PA') ? 'EU' :
            session.stockTicker.match(/^[A-Z]{1,5}$/) ? 'US' : 'GLOBAL'
          
          const earningsResult = await searchEarningsTranscripts(session.customerName, {
            ticker: session.stockTicker,
            region,
          })
          
          if (earningsResult.transcripts.length > 0) {
            // Analyze transcripts with AI
            const insights = await analyzeTranscriptsWithAI(session.customerName, earningsResult.transcripts)
            
            if (insights.length > 0) {
              fetchedInsights = insights.map((i: CompanyInsight): EarningsInsight => ({
                id: i.id,
                category: i.category,
                title: i.title,
                description: i.description,
                quote: i.quote,
                source: i.source,
                relevanceScore: i.relevanceScore,
              }))
              setEarningsInsights(fetchedInsights)
              setUsedEarningsData(true)
              
              // Build earnings context for the prompt
              const insightsByCategory: Record<string, EarningsInsight[]> = {}
              fetchedInsights.forEach(i => {
                if (!insightsByCategory[i.category]) {
                  insightsByCategory[i.category] = []
                }
                insightsByCategory[i.category].push(i)
              })
              
              earningsContext = `\n\nEARNINGS CALL & FINANCIAL INSIGHTS (from recent earnings transcripts):
${Object.entries(insightsByCategory).map(([cat, items]) => 
  `${cat.toUpperCase().replace('-', ' ')}:
${items.map(i => `- ${i.title}: ${i.description}${i.quote ? ` ("${i.quote}")` : ''}`).join('\n')}`
).join('\n\n')}

IMPORTANT: Use these earnings insights to inform your use case suggestions. Address the company's stated strategic priorities, help solve their pain points, and align with their investment areas.`

              toast.success(`Found ${fetchedInsights.length} insights from ${earningsResult.transcripts.length} earnings transcripts`)
            }
          }
        } catch (earningsError) {
          console.warn('Could not fetch earnings data:', earningsError)
          // Continue without earnings data
        }
      }

      setGenerationPhase('generating')

      const useCasesPromptText = `You are an innovation consultant at Microsoft helping identify potential use cases for Microsoft technologies and AI solutions.

DISCOVERY SESSION CONTEXT:
Customer: ${session.customerName}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}
Location: ${session.innovationHubLocation}
Primary Jurisdiction: ${jurisdiction}
${session.stockTicker ? `Stock Ticker: ${session.stockTicker} (Public Company)` : ''}

DISCOVERY RESPONSES:
${responsesText}${industryContext}${earningsContext}

TASK: Analyze the responses${earningsContext ? ' and earnings insights' : ''} to suggest 5-8 high-value use cases that could benefit from AI, automation, or digital transformation using Microsoft technologies.

For each use case, provide:
1. A clear, actionable title (max 60 characters) - make it specific and compelling
2. A detailed description explaining the opportunity and potential solution (2-3 sentences)
3. A brief rationale explaining why this makes sense based on their specific responses${earningsContext ? ' and earnings data' : ''} (1 sentence referencing their pain points or goals)
4. AI Regulations & Compliance considerations:
   - applicableFrameworks: array of relevant regulation codes (e.g., "gdpr", "popia", "hipaa", "sox", "msha", "osha", "eu-ai-act", "iso-42001")
   - riskClassification: EU AI Act risk level ("minimal", "limited", "high", or "unacceptable")
   - complianceNotes: brief note on key compliance considerations
   - jurisdictions: array of applicable jurisdictions (e.g., ["South Africa", "European Union"])
5. Cybersecurity considerations:
   - securityRequirements: array of required controls (e.g., "encryption-at-rest", "access-control", "audit-logging", "scada-protection", "mfa-required")
   - dataClassification: data sensitivity level ("public", "internal", "confidential", "pii", "operational")
   - securityNotes: brief note on key security considerations

INDUSTRY-SPECIFIC REGULATIONS TO CONSIDER:
- Healthcare: HIPAA, GDPR
- Financial Services: SOX, GLBA, PCI-DSS, GDPR
- Mining/Energy: MSHA, OSHA, EPA, environmental regulations
- South Africa: POPIA, DMRE (for mining)
- European operations: GDPR, EU AI Act
- US operations: CCPA, NIST AI RMF

GUIDELINES:
- Focus on practical, implementable solutions that address their stated challenges
- Consider Azure AI, Microsoft 365 Copilot, Power Platform, Azure OpenAI Service, and other Microsoft innovations
- Prioritize use cases with clear business value and feasibility
- Ensure diversity in the types of solutions (don't suggest 5 variations of the same thing)
- For safety-critical AI (affecting workers, health, critical infrastructure), classify as "high" risk
${earningsContext ? '- PRIORITIZE use cases that directly address strategic priorities, pain points, or investment areas from earnings calls' : ''}

Return the result as a valid JSON object with a single property called "useCases" that contains an array of use case objects. Each use case should have "title", "description", "rationale", "aiRegulations", and "cybersecurity" properties.`

      const useCasesResult = await window.llm(useCasesPromptText, 'gpt-4o-mini', true)
      const parsed = JSON.parse(useCasesResult)

      // Get default regulations based on industry and jurisdiction for fallback
      const defaultRegulations = session.industry 
        ? getRegulationsForIndustry(session.industry) 
        : []
      const jurisdictionRegs = getRegulationsForJurisdiction(jurisdiction)
      const defaultSecurityReqs = session.industry 
        ? getSecurityRequirementsForIndustry(session.industry) 
        : []

      let useCases: SuggestedUseCase[] = []
      if (parsed.useCases && Array.isArray(parsed.useCases)) {
        useCases = parsed.useCases.map((uc: any) => ({
          title: uc.title,
          description: uc.description,
          rationale: uc.rationale,
          selected: true,
          aiRegulations: uc.aiRegulations || {
            applicableFrameworks: [...new Set([...defaultRegulations, ...jurisdictionRegs])],
            riskClassification: 'minimal',
            jurisdictions: [jurisdiction],
          },
          cybersecurity: uc.cybersecurity || {
            securityRequirements: defaultSecurityReqs,
            dataClassification: 'internal',
          },
        }))
        setSuggestedUseCases(useCases)
        toast.success(`Generated ${useCases.length} use cases from your discovery session!`)
      }
      
      const useCaseData = useCases.map((uc: SuggestedUseCase) => ({
        title: uc.title,
        description: uc.description,
        rationale: uc.rationale,
        aiRegulations: uc.aiRegulations,
        cybersecurity: uc.cybersecurity,
      }))
      
      updateSession(session.id, {
        suggestedUseCases: useCaseData,
        earningsInsights: fetchedInsights.length > 0 ? fetchedInsights : undefined,
      })
      
      addSession({
        ...session,
        suggestedUseCases: useCaseData,
        earningsInsights: fetchedInsights.length > 0 ? fetchedInsights : undefined,
      })
      
      // Check if AI returned empty results
      if (useCases.length === 0) {
        console.warn('AI returned empty use cases, loading fallback')
        loadFallbackUseCases()
      }
    } catch (error) {
      console.error('Error generating use cases:', error)
      
      // Show error message and load fallback use cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('Azure Functions') || errorMessage.includes('API') || errorMessage.includes('fetch')) {
        toast.error('AI service unavailable', {
          description: 'Loading sample use cases instead. You can retry once the service is available.',
        })
      } else {
        toast.error('Failed to generate use cases', {
          description: 'Loading sample use cases for your industry.',
        })
      }
      
      // Load fallback use cases
      loadFallbackUseCases()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetryGeneration = async () => {
    setUsedFallback(false)
    setUsedEarningsData(false)
    setSuggestedUseCases([])
    setEarningsInsights([])
    await generateUseCases()
  }

  const handleStartWorkflow = () => {
    setShowWorkflow(true)
  }

  const handleWorkflowComplete = (useCases: Partial<UseCase>[], executiveSummary: string) => {
    updateSession(session.id, {
      executiveSummary,
      completedAt: Date.now(),
    })
    onCreateUseCases(useCases, executiveSummary)
  }

  if (showWorkflow) {
    return (
      <EnhancedDiscoveryWorkflow
        session={session}
        initialUseCases={suggestedUseCases}
        onComplete={handleWorkflowComplete}
        onCancel={onBack}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {isGenerating ? (
            <Card className="border-2">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    {generationPhase === 'fetching-earnings' ? (
                      <ChartLineUp size={48} weight="fill" className="text-primary" />
                    ) : (
                      <Sparkle size={48} weight="fill" className="text-primary" />
                    )}
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {generationPhase === 'analyzing' && 'Analyzing Your Responses'}
                      {generationPhase === 'fetching-earnings' && 'Fetching Financial Intelligence'}
                      {generationPhase === 'generating' && 'Generating Use Cases'}
                    </h3>
                    <p className="text-muted-foreground">
                      {generationPhase === 'analyzing' && 'Processing discovery session data...'}
                      {generationPhase === 'fetching-earnings' && `Retrieving earnings transcripts for ${session.stockTicker}...`}
                      {generationPhase === 'generating' && 'Creating AI-powered recommendations...'}
                    </p>
                    {session.stockTicker && generationPhase === 'analyzing' && (
                      <p className="text-xs text-muted-foreground/70">
                        Will also analyze earnings calls for {session.stockTicker}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardContent className="py-12 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  {usedFallback ? (
                    <Warning size={40} weight="duotone" className="text-amber-500" />
                  ) : usedEarningsData ? (
                    <ChartLineUp size={40} weight="duotone" className="text-primary" />
                  ) : (
                    <Sparkle size={40} weight="duotone" className="text-primary" />
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {suggestedUseCases.length} Use Cases {usedFallback ? 'Available' : 'Identified'}
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {usedFallback ? (
                      <>Sample use cases for {industryLabels[session.industry || 'general']}. You can customize these during the scoring workflow.</>
                    ) : usedEarningsData ? (
                      <>AI-generated use cases informed by {earningsInsights.length} insights from earnings transcripts</>
                    ) : (
                      <>Ready to review, score, and prioritize these opportunities through our guided workflow</>
                    )}
                  </p>
                  {usedFallback && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      AI generation was unavailable. These are curated samples that can be edited.
                    </p>
                  )}
                  {usedEarningsData && earningsInsights.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg text-left max-w-md mx-auto">
                      <p className="text-xs font-medium text-primary mb-2">Key Insights from Earnings Calls:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {earningsInsights.slice(0, 3).map((insight) => (
                          <li key={insight.id} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{insight.title}</span>
                          </li>
                        ))}
                        {earningsInsights.length > 3 && (
                          <li className="text-muted-foreground/70">+{earningsInsights.length - 3} more insights</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button variant="outline" onClick={onBack}>
                    Cancel
                  </Button>
                  {usedFallback && (
                    <Button variant="outline" onClick={handleRetryGeneration} className="gap-2">
                      <ArrowClockwise size={18} />
                      Retry AI Generation
                    </Button>
                  )}
                  <Button onClick={handleStartWorkflow} size="lg" className="gap-2">
                    Start Scoring Workflow
                    <Sparkle size={20} weight="bold" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
