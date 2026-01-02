import { useState, useEffect } from 'react'
import { DiscoverySession, UseCase, AIRegulationsInfo, CybersecurityInfo } from '@/lib/types'
import { useDiscovery } from '@/hooks/use-discovery'
import { discoveryQuestions, getQuestionsForIndustry, industryLabels } from '@/lib/discovery-questions'
import { getRegulationsForIndustry, getSecurityRequirementsForIndustry, getRegulationsForJurisdiction } from '@/lib/demo-data'
import { EnhancedDiscoveryWorkflow } from '@/components/EnhancedDiscoveryWorkflow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkle } from '@phosphor-icons/react'
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
  const [suggestedUseCases, setSuggestedUseCases] = useState<SuggestedUseCase[]>([])
  const [showWorkflow, setShowWorkflow] = useState(false)

  useEffect(() => {
    generateUseCases()
  }, [])

  const generateUseCases = async () => {
    setIsGenerating(true)
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

      const useCasesPromptText = `You are an innovation consultant at Microsoft helping identify potential use cases for Microsoft technologies and AI solutions.

DISCOVERY SESSION CONTEXT:
Customer: ${session.customerName}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}
Location: ${session.innovationHubLocation}
Primary Jurisdiction: ${jurisdiction}

DISCOVERY RESPONSES:
${responsesText}${industryContext}

TASK: Analyze the responses and suggest 5-8 high-value use cases that could benefit from AI, automation, or digital transformation using Microsoft technologies.

For each use case, provide:
1. A clear, actionable title (max 60 characters) - make it specific and compelling
2. A detailed description explaining the opportunity and potential solution (2-3 sentences)
3. A brief rationale explaining why this makes sense based on their specific responses (1 sentence referencing their pain points or goals)
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
      })
      
      addSession({
        ...session,
        suggestedUseCases: useCaseData,
      })
    } catch (error) {
      console.error('Error generating use cases:', error)
      toast.error('Failed to generate use cases. Please try again.')
    } finally {
      setIsGenerating(false)
    }
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
                    <Sparkle size={48} weight="fill" className="text-primary" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Analyzing Your Responses</h3>
                    <p className="text-muted-foreground">
                      Identifying potential use cases based on your discovery session...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardContent className="py-12 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkle size={40} weight="duotone" className="text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {suggestedUseCases.length} Use Cases Identified
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ready to review, score, and prioritize these opportunities through our guided workflow
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button variant="outline" onClick={onBack}>
                    Cancel
                  </Button>
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
