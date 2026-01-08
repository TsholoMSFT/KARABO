import { useState, useEffect, useRef } from 'react'
import { DiscoverySession, UseCase, AIRegulationsInfo, CybersecurityInfo, EarningsInsight, StrategicAlignmentInfo, UseCaseBusinessProcess, UseCaseMicrosoftSolution, UseCaseAgenticOpportunity, ImplementationComplexityInfo } from '@/lib/types'
import { useDiscovery } from '@/hooks/use-discovery'
import { discoveryQuestions, getQuestionsForIndustry, industryLabels } from '@/lib/discovery-questions'
import { getRegulationsForIndustry, getSecurityRequirementsForIndustry, getRegulationsForJurisdiction, getFallbackUseCasesForIndustry } from '@/lib/demo-data'
import { 
  searchEarningsTranscripts, 
  analyzeTranscriptsWithAI, 
  CompanyInsight, 
  getSourceInfo, 
  EarningsSearchResult,
  fetchFinancialStatements,
  fetchCompanyNews,
  fetchIndustryResearch,
  FinancialMetrics,
  NewsSearchResult,
  IndustryResearchResult
} from '@/lib/earnings-service'
import { EnhancedDiscoveryWorkflow } from '@/components/EnhancedDiscoveryWorkflow'
import { NavigationHeader } from '@/components/NavigationHeader'
import { QuickCOICalculator } from '@/components/QuickCOICalculator'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, ArrowClockwise, Warning, ChartLineUp, Database, CheckCircle, CurrencyDollar, Newspaper, Books, CaretDown, CaretUp, Quotes } from '@phosphor-icons/react'
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
  // Innovation Hub Methodology additions
  strategicAlignment?: StrategicAlignmentInfo
  businessProcesses?: (UseCaseBusinessProcess & { processData?: any })[]
  microsoftSolutions?: UseCaseMicrosoftSolution[]
  referenceArchitecture?: string
  agenticOpportunities?: UseCaseAgenticOpportunity[]
  implementationComplexity?: ImplementationComplexityInfo
}

export function DiscoveryResults({ session, onCreateUseCases, onBack }: DiscoveryResultsProps) {
  const { addSession, updateSession } = useDiscovery()
  const [isGenerating, setIsGenerating] = useState(true)
  const [generationPhase, setGenerationPhase] = useState<'analyzing' | 'fetching-earnings' | 'generating'>('analyzing')
  const [suggestedUseCases, setSuggestedUseCases] = useState<SuggestedUseCase[]>([])
  const [earningsInsights, setEarningsInsights] = useState<EarningsInsight[]>([])
  const [earningsDataSources, setEarningsDataSources] = useState<EarningsSearchResult['sources'] | null>(null)
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null)
  const [newsArticles, setNewsArticles] = useState<NewsSearchResult | null>(null)
  const [industryInsights, setIndustryInsights] = useState<IndustryResearchResult | null>(null)
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<'no-responses' | 'api-error' | 'empty-result' | null>(null)
  const [usedEarningsData, setUsedEarningsData] = useState(false)
  const [showAllInsights, setShowAllInsights] = useState(false)
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
      dataSources: ['fallback'] as ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery' | 'ai-generated' | 'manual' | 'fallback')[],
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
    setFallbackReason(null)
    
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

      // Check if we have any meaningful responses
      const hasResponses = session.responses.length > 0 && 
        session.responses.some(r => r.answer && r.answer.trim().length > 0)
      const hasCompanyInsights = session.companyInsights && session.companyInsights.length > 0
      const hasStockTicker = !!session.stockTicker

      // If no responses, no company insights, and no stock ticker, use fallback immediately
      if (!hasResponses && !hasCompanyInsights && !hasStockTicker) {
        console.log('No discovery data available, loading fallback')
        setFallbackReason('no-responses')
        loadFallbackUseCases()
        setIsGenerating(false)
        return
      }

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

      // Fetch all data sources (earnings, financials, news, industry research)
      const dataSources: ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery')[] = ['discovery']
      let earningsContext = ''
      let financialsContext = ''
      let newsContext = ''
      let industryResearchContext = ''
      let companyResearchContext = ''
      let fetchedInsights: EarningsInsight[] = []
      let hasTickerWarning = false

      // Add company research insights from discovery session if available
      if (session.companyInsights && session.companyInsights.length > 0) {
        dataSources.push('discovery')
        const insightsByCategory: Record<string, typeof session.companyInsights> = {}
        session.companyInsights.forEach(i => {
          if (!insightsByCategory[i.category]) {
            insightsByCategory[i.category] = []
          }
          insightsByCategory[i.category].push(i)
        })
        
        companyResearchContext = `\n\nCOMPANY RESEARCH INSIGHTS (from pasted documents, news, or RSS feeds):
${Object.entries(insightsByCategory).map(([cat, items]) => 
  `${cat.toUpperCase()}:
${items.map(i => `- ${i.title}: ${i.summary}
  AI Relevance: ${i.relevanceToAI}
  Potential Use Cases: ${i.potentialUseCases.join(', ')}`).join('\n')}`
).join('\n\n')}

IMPORTANT: Use these company research insights to inform your use case suggestions. Address the company's stated initiatives, solve their pain points, and leverage identified opportunities.`

        toast.success(`Using ${session.companyInsights.length} company research insights`)
      }
      
      if (session.stockTicker) {
        setGenerationPhase('fetching-earnings')
        try {
          // Determine region based on ticker format
          const region: 'US' | 'ZA' | 'EU' | 'GLOBAL' = 
            session.stockTicker.includes('.JO') || session.stockTicker.includes('.JSE') ? 'ZA' :
            session.stockTicker.includes('.L') || session.stockTicker.includes('.DE') || session.stockTicker.includes('.PA') ? 'EU' :
            session.stockTicker.match(/^[A-Z]{1,5}$/) ? 'US' : 'GLOBAL'
          
          // Fetch all data sources in parallel
          const [earningsResult, financialsResult, newsResult] = await Promise.allSettled([
            searchEarningsTranscripts(session.customerName, { ticker: session.stockTicker, region }),
            fetchFinancialStatements(session.stockTicker),
            fetchCompanyNews(session.customerName, session.stockTicker),
          ])
          
          // Process earnings transcripts
          if (earningsResult.status === 'fulfilled' && earningsResult.value.transcripts.length > 0) {
            setEarningsDataSources(earningsResult.value.sources)
            
            // Analyze transcripts with AI
            const insights = await analyzeTranscriptsWithAI(session.customerName, earningsResult.value.transcripts)
            
            if (insights.length > 0) {
              dataSources.push('earnings')
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
              
              earningsContext = `\n\nEARNINGS CALL INSIGHTS (from recent earnings transcripts):
${Object.entries(insightsByCategory).map(([cat, items]) => 
  `${cat.toUpperCase().replace('-', ' ')}:
${items.map(i => `- ${i.title}: ${i.description}${i.quote ? ` ("${i.quote}")` : ''}`).join('\n')}`
).join('\n\n')}

IMPORTANT: Use these earnings insights to inform your use case suggestions. Address the company's stated strategic priorities, help solve their pain points, and align with their investment areas.`

              toast.success(`Found ${fetchedInsights.length} insights from ${earningsResult.value.transcripts.length} earnings transcripts`)
            }
          }
          
          // Process financial statements
          if (financialsResult.status === 'fulfilled' && financialsResult.value.statements.length > 0) {
            dataSources.push('financials')
            const financials = financialsResult.value
            setFinancialMetrics(financials)
            
            const statements = financials.statements[0]
            financialsContext = `\n\nFINANCIAL STATEMENTS & METRICS:
${financials.summary}

Key Financial Data:
- Revenue: ${statements.revenue ? `$${(statements.revenue / 1e9).toFixed(2)}B` : 'N/A'}
- Net Income: ${statements.netIncome ? `$${(statements.netIncome / 1e9).toFixed(2)}B` : 'N/A'}
- Total Assets: ${statements.totalAssets ? `$${(statements.totalAssets / 1e9).toFixed(2)}B` : 'N/A'}

IMPORTANT: Use these financial metrics to inform use cases about cost savings, revenue growth opportunities, and ROI potential. Consider the company's financial scale when sizing opportunities.`

            toast.success('Loaded financial statements')
          }
          
          // Process company news
          if (newsResult.status === 'fulfilled' && newsResult.value.articles.length > 0) {
            dataSources.push('news')
            const news = newsResult.value
            setNewsArticles(news)
            
            const recentNews = news.articles.slice(0, 8)
            newsContext = `\n\nRECENT COMPANY NEWS (${recentNews.length} articles):
${recentNews.map(a => `- ${a.title} (${a.source}, ${a.sentiment})`).join('\n')}

IMPORTANT: Consider these recent developments, announcements, and market sentiment when suggesting use cases. Align with current business initiatives and market conditions.`

            toast.success(`Found ${news.articles.length} recent news articles`)
          }
        } catch (error) {
          console.warn('Could not fetch financial data:', error)
          // Continue without financial data
        }
      } else {
        hasTickerWarning = true
      }
      
      // Fetch industry research (always, doesn't require ticker)
      if (session.industry && session.industry !== 'general') {
        try {
          const industryResult = await fetchIndustryResearch(session.industry, session.customerName)
          if (industryResult.insights.length > 0) {
            dataSources.push('industry-research')
            setIndustryInsights(industryResult)
            
            industryResearchContext = `\n\nINDUSTRY STANDARDS, TRENDS & REGULATIONS:
${industryResult.insights.map(i => `- [${i.category.toUpperCase()}] ${i.title}: ${i.description} (Source: ${i.source})`).join('\n')}

IMPORTANT: Ensure use cases align with industry standards and address key trends. Consider regulatory compliance requirements.`

            toast.success(`Found ${industryResult.insights.length} industry insights`)
          }
        } catch (error) {
          console.warn('Could not fetch industry research:', error)
        }
      }
      
      // Show warning if no ticker provided
      if (hasTickerWarning) {
        toast.warning('No stock ticker provided', {
          description: 'Use cases will be generated from discovery responses and industry research only. Add a ticker for comprehensive financial analysis.',
          duration: 5000,
        })
      }

      setGenerationPhase('generating')

      const useCasesPromptText = `You are an innovation consultant at Microsoft using the Innovation Hub Methodology to help identify high-value use cases for Microsoft technologies and AI solutions.

DISCOVERY SESSION CONTEXT:
Customer: ${session.customerName}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}
Location: ${session.innovationHubLocation}
Primary Jurisdiction: ${jurisdiction}
${session.stockTicker ? `Stock Ticker: ${session.stockTicker} (Public Company)` : ''}

DISCOVERY RESPONSES:
${responsesText}${industryContext}${earningsContext}${financialsContext}${newsContext}${industryResearchContext}${companyResearchContext}

TASK: Using the Microsoft Innovation Hub Methodology, analyze ALL available data sources to suggest 5-8 high-value use cases. For each use case, apply both Business Envisioning (the WHY and HOW) and Solution Envisioning (the WHAT and WITH WHAT).

DATA SOURCES AVAILABLE:
${dataSources.map(ds => `- ${ds.toUpperCase()}`).join('\n')}

=== BUSINESS ENVISIONING (Phase 1) ===

For each use case, extract:

1. STRATEGIC ALIGNMENT (The "Why"):
   - Which strategic priority does this address? (e.g., "Digital Transformation", "Cost Optimization", "Growth")
   - Source of the priority (earnings-call, annual-report, discovery-session, industry-research)
   - Alignment score (1-10)
   - Brief rationale explaining WHY this supports the company's strategy

2. BUSINESS PROCESS MAPPING (The "How"):
   - Which business process does this improve?
   - Key steps in that process (3-5 steps with name and description)
   - Current pain points in the process
   - Where AI can intervene (which steps)
   - Expected cycle time or efficiency improvement

=== SOLUTION ENVISIONING (Phase 2) ===

For each use case, provide:

3. MICROSOFT SOLUTION RECOMMENDATIONS:
   - Primary product family: azure-ai, azure-data, power-platform, microsoft-365, dynamics-365, microsoft-fabric, microsoft-security
   - Specific services to use (e.g., ["azure-openai", "azure-ai-search", "copilot-studio"])
   - Role of each product family: primary, supporting, or integration
   - Reference architecture pattern if applicable (conversational-ai, document-processing, predictive-analytics, process-automation, agentic-ai, etc.)

4. AGENTIC AI OPPORTUNITIES:
   - If this use case could benefit from autonomous AI agents, describe:
     - Agent type: task-agent, orchestrator-agent, specialist-agent, assistant-agent
     - Key capabilities: reasoning, planning, tool-use, memory, multi-step-execution, human-in-loop
     - Human oversight level: none, approval, review, supervision
     - Automation level: assisted, semi-autonomous, autonomous
     - Tools/APIs the agent would use

5. IMPLEMENTATION COMPLEXITY:
   - Level: low, medium, high, very-high
   - Key complexity factors (e.g., "Multiple integrations", "Custom ML models", "Legacy system migration")
   - Estimated duration (e.g., "3-6 months")
   - Estimated team size (e.g., "5-8 people")
   - Key risks

=== COMPLIANCE & SECURITY ===

6. AI Regulations & Compliance:
   - applicableFrameworks: array of relevant regulation codes (gdpr, popia, hipaa, sox, msha, eu-ai-act, iso-42001, ms-responsible-ai)
   - riskClassification: EU AI Act risk level (minimal, limited, high, unacceptable)
   - complianceNotes: brief note on key compliance considerations
   - jurisdictions: array of applicable jurisdictions (e.g., ["South Africa", "European Union"])

7. Cybersecurity:
   - securityRequirements: array of required controls (encryption-at-rest, access-control, audit-logging, mfa-required)
   - dataClassification: data sensitivity level (public, internal, confidential, pii, operational)
   - securityNotes: brief note on key security considerations

=== OUTPUT FORMAT ===

Return a valid JSON object with structure:
{
  "useCases": [
    {
      "title": "string (max 60 chars, specific and compelling)",
      "description": "string (2-3 sentences explaining the opportunity)",
      "rationale": "string (1-2 sentences referencing specific data sources)",
      "strategicAlignment": {
        "primaryPriority": "string",
        "linkedPriorities": ["string"],
        "source": "earnings-call | annual-report | discovery-session | industry-research",
        "alignmentScore": 1-10,
        "alignmentRationale": "string"
      },
      "businessProcess": {
        "processName": "string",
        "category": "core | support | management",
        "steps": [
          {
            "order": 1,
            "name": "string",
            "description": "string",
            "painPoint": "string (optional)",
            "aiOpportunity": {
              "interventionType": "automate | augment | analyze | generate",
              "description": "string"
            }
          }
        ],
        "currentPainPoints": ["string"],
        "expectedImprovement": "string"
      },
      "microsoftSolutions": [
        {
          "productFamily": "azure-ai | power-platform | microsoft-365 | dynamics-365 | azure-data | microsoft-fabric | microsoft-security",
          "services": ["string"],
          "role": "primary | supporting | integration",
          "justification": "string"
        }
      ],
      "referenceArchitecture": "conversational-ai | document-processing | predictive-analytics | process-automation | agentic-ai | knowledge-mining | customer-360 | (optional)",
      "agenticOpportunity": {
        "hasOpportunity": true | false,
        "title": "string (if hasOpportunity)",
        "description": "string (if hasOpportunity)",
        "agentType": "task-agent | orchestrator-agent | specialist-agent | assistant-agent",
        "capabilities": ["reasoning", "planning", "tool-use", "memory", "multi-step-execution", "human-in-loop"],
        "humanOversight": "none | approval | review | supervision",
        "automationLevel": "assisted | semi-autonomous | autonomous",
        "tools": ["string"]
      },
      "implementationComplexity": {
        "level": "low | medium | high | very-high",
        "factors": ["string"],
        "estimatedDuration": "string",
        "estimatedTeamSize": "string",
        "keyRisks": ["string"]
      },
      "aiRegulations": {
        "applicableFrameworks": ["string"],
        "riskClassification": "minimal | limited | high",
        "complianceNotes": "string",
        "jurisdictions": ["string"]
      },
      "cybersecurity": {
        "securityRequirements": ["string"],
        "dataClassification": "public | internal | confidential | pii | operational",
        "securityNotes": "string"
      }
    }
  ]
}

GUIDELINES:
- Focus on practical, implementable solutions that address their stated challenges
- ALWAYS recommend specific Microsoft products - consider Azure AI, Microsoft 365 Copilot, Power Platform, Azure OpenAI Service, Dynamics 365, Microsoft Fabric
- Prioritize use cases with clear business value and strategic alignment
- Ensure diversity in the types of solutions (don't suggest 5 variations of the same thing)
- For safety-critical AI (affecting workers, health, critical infrastructure), classify as "high" risk
- Identify agentic AI opportunities where autonomous reasoning and multi-step execution can add value
${earningsContext ? '- PRIORITIZE use cases that directly address strategic priorities, pain points, or investment areas from earnings calls' : ''}`

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
          // Innovation Hub Methodology additions
          strategicAlignment: uc.strategicAlignment ? {
            primaryPriority: uc.strategicAlignment.primaryPriority,
            linkedPriorities: uc.strategicAlignment.linkedPriorities,
            alignmentScore: uc.strategicAlignment.alignmentScore,
            alignmentRationale: uc.strategicAlignment.alignmentRationale,
          } : undefined,
          businessProcesses: uc.businessProcess ? [{
            processId: `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            processName: uc.businessProcess.processName,
            affectedSteps: uc.businessProcess.steps?.map((s: any) => s.name) || [],
            currentPainPoints: uc.businessProcess.currentPainPoints || [],
            proposedImprovement: uc.businessProcess.expectedImprovement || '',
            processData: uc.businessProcess, // Keep full process data for visualization
          }] : undefined,
          microsoftSolutions: uc.microsoftSolutions || undefined,
          referenceArchitecture: uc.referenceArchitecture || undefined,
          agenticOpportunities: uc.agenticOpportunity?.hasOpportunity ? [{
            id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: uc.agenticOpportunity.title,
            description: uc.agenticOpportunity.description,
            agentType: uc.agenticOpportunity.agentType,
            capabilities: uc.agenticOpportunity.capabilities || [],
            humanOversight: uc.agenticOpportunity.humanOversight || 'review',
            automationLevel: uc.agenticOpportunity.automationLevel || 'assisted',
            tools: uc.agenticOpportunity.tools || [],
          }] : undefined,
          implementationComplexity: uc.implementationComplexity || undefined,
        }))
        setSuggestedUseCases(useCases)
        toast.success(`Generated ${useCases.length} use cases with Microsoft solution recommendations!`)
      }
      
      const useCaseData = useCases.map((uc: SuggestedUseCase) => ({
        title: uc.title,
        description: uc.description,
        rationale: uc.rationale,
        aiRegulations: uc.aiRegulations,
        cybersecurity: uc.cybersecurity,
        dataSources: [...dataSources, 'ai-generated'] as ('earnings' | 'financials' | 'news' | 'industry-research' | 'discovery' | 'ai-generated' | 'manual' | 'fallback')[],
        // Innovation Hub Methodology additions
        strategicAlignment: uc.strategicAlignment,
        businessProcesses: uc.businessProcesses,
        microsoftSolutions: uc.microsoftSolutions,
        referenceArchitecture: uc.referenceArchitecture,
        agenticOpportunities: uc.agenticOpportunities,
        implementationComplexity: uc.implementationComplexity,
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
        setFallbackReason('empty-result')
        loadFallbackUseCases()
      }
    } catch (error) {
      console.error('Error generating use cases:', error)
      
      // Show error message and load fallback use cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setFallbackReason('api-error')
      
      if (errorMessage.includes('Azure Functions') || errorMessage.includes('API') || errorMessage.includes('fetch') || errorMessage.includes('No AI models')) {
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
    setFallbackReason(null)
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
                      <p className="text-xs text-muted-foreground">
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
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {fallbackReason === 'no-responses' 
                          ? 'No discovery responses provided. Complete the discovery questions or add company research to generate personalized AI use cases.'
                          : fallbackReason === 'api-error'
                          ? 'AI service was unavailable. These are curated samples that can be edited.'
                          : fallbackReason === 'empty-result'
                          ? 'AI could not generate use cases from the provided data. These are curated samples.'
                          : 'AI generation was unavailable. These are curated samples that can be edited.'
                        }
                      </p>
                      <Button 
                        onClick={handleRetryGeneration} 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        disabled={isGenerating}
                      >
                        <ArrowClockwise size={14} className={isGenerating ? 'animate-spin' : ''} />
                        {isGenerating ? 'Generating...' : 'Retry AI Generation'}
                      </Button>
                    </div>
                  )}
                  {usedEarningsData && (earningsInsights.length > 0 || financialMetrics || newsArticles || industryInsights) && (
                    <div className="mt-4 space-y-3 max-w-lg mx-auto">
                      <div className="p-4 bg-primary/5 rounded-lg text-left">
                        <div className="flex items-start gap-3 mb-3">
                          <Database size={20} className="text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-primary mb-1">
                              How Comprehensive Data Enriches Use Cases
                            </p>
                            <p className="text-xs text-muted-foreground">
                              We analyzed multiple data sources including earnings transcripts, financial statements, recent news, and industry research
                              to identify the company's strategic priorities, pain points, and investment areas. This comprehensive intelligence ensures 
                              our AI-generated use cases directly address their stated business goals and challenges.
                            </p>
                          </div>
                        </div>
                        
                        {/* Data Sources Overview */}
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          <p className="text-xs font-medium text-foreground mb-2">Data Sources Used:</p>
                          
                          {earningsInsights.length > 0 && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
                                <CheckCircle size={12} weight="fill" />
                                Earnings Transcripts
                              </Badge>
                              <span className="text-muted-foreground">{earningsInsights.length} insights from recent calls</span>
                            </div>
                          )}
                          
                          {financialMetrics && financialMetrics.statements.length > 0 && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                                <CheckCircle size={12} weight="fill" />
                                Financial Statements
                              </Badge>
                              <span className="text-muted-foreground">Income statement, balance sheet, metrics</span>
                            </div>
                          )}
                          
                          {newsArticles && newsArticles.articles.length > 0 && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/30">
                                <CheckCircle size={12} weight="fill" />
                                Company News
                              </Badge>
                              <span className="text-muted-foreground">{newsArticles.articles.length} recent articles with sentiment analysis</span>
                            </div>
                          )}
                          
                          {industryInsights && industryInsights.insights.length > 0 && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="gap-1 bg-purple-500/10 text-purple-600 border-purple-500/30">
                                <CheckCircle size={12} weight="fill" />
                                Industry Research
                              </Badge>
                              <span className="text-muted-foreground">{industryInsights.insights.length} insights on trends & standards</span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2 text-xs">
                            <Badge variant="outline" className="gap-1 bg-gray-500/10 text-gray-300 border-gray-500/30">
                              <CheckCircle size={12} weight="fill" />
                              Discovery Session
                            </Badge>
                            <span className="text-muted-foreground">{session.responses.length} Q&A responses</span>
                          </div>
                        </div>
                        
                        {earningsDataSources && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium text-foreground mb-2">Financial Data Sources:</p>
                            <div className="flex flex-wrap gap-2">
                              {earningsDataSources.secEdgar && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <CheckCircle size={12} weight="fill" />
                                  SEC EDGAR
                                </Badge>
                              )}
                              {earningsDataSources.jseSens && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <CheckCircle size={12} weight="fill" />
                                  JSE SENS
                                </Badge>
                              )}
                              {earningsDataSources.yahooFinance && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <CheckCircle size={12} weight="fill" />
                                  Yahoo Finance
                                </Badge>
                              )}
                              {earningsDataSources.alphaVantage && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <CheckCircle size={12} weight="fill" />
                                  Alpha Vantage
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Key Insights Section - Expandable */}
                      {earningsInsights.length > 0 && (
                        <div className="p-3 bg-accent/30 rounded-lg text-left">
                          <button 
                            onClick={() => setShowAllInsights(!showAllInsights)}
                            className="w-full flex items-center justify-between text-xs font-medium text-foreground mb-2 hover:text-primary transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Quotes size={14} weight="fill" className="text-primary" />
                              Key Insights from Earnings ({earningsInsights.length})
                            </span>
                            {showAllInsights ? <CaretUp size={14} /> : <CaretDown size={14} />}
                          </button>
                          
                          <div className="space-y-3">
                            {(showAllInsights ? earningsInsights : earningsInsights.slice(0, 3)).map((insight) => (
                              <div key={insight.id} className="bg-background/50 rounded-md p-2.5 border border-border/50">
                                <div className="flex items-start gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] shrink-0 ${
                                      insight.category === 'strategic-priority' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                      insight.category === 'pain-point' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                      insight.category === 'opportunity' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                      insight.category === 'investment' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                      insight.category === 'risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                      'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                    }`}
                                  >
                                    {insight.category.replace('-', ' ')}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground">{insight.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                                    {insight.quote && (
                                      <blockquote className="mt-2 pl-2 border-l-2 border-primary/50 text-xs text-muted-foreground italic">
                                        "{insight.quote}"
                                      </blockquote>
                                    )}
                                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                                      Source: {insight.source} • Relevance: {insight.relevanceScore}/10
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {!showAllInsights && earningsInsights.length > 3 && (
                            <button 
                              onClick={() => setShowAllInsights(true)}
                              className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              Show {earningsInsights.length - 3} more insights
                              <CaretDown size={12} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quick Financial Quantification */}
                      <div className="mt-4">
                        <QuickCOICalculator 
                          variant="compact"
                          customerName={session.customerName}
                          opportunityTitle={session.name}
                        />
                      </div>
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
