/**
 * Use Case Extraction from Discovery Notes
 * Extracts structured use cases from unstructured discovery notes using AI
 */

import { callAIForTask } from './openai-service'
import { Industry } from './types'
import { industryLabels } from './discovery-questions'
import { CompanyInsight } from './company-research-service'
import { parseJsonLenient } from './lenient-json'

export interface SourceTextHighlight {
  text: string
  startIndex: number
  endIndex: number
  confidence: number // 1-10 confidence this text informed the use case
}

export interface ExtractedUseCase {
  title: string
  description: string
  rationale: string
  sourceTexts?: SourceTextHighlight[]
  
  // Innovation Hub Methodology fields
  strategicAlignment?: {
    primaryPriority: string
    linkedPriorities?: string[]
    source: 'discovery-session'
    alignmentScore: number
    alignmentRationale: string
  }
  
  businessProcess?: {
    processName: string
    category: 'core' | 'support' | 'management'
    currentPainPoints: string[]
    expectedImprovement: string
  }
  
  microsoftSolutions?: Array<{
    productFamily: string
    services: string[]
    role: 'primary' | 'supporting' | 'integration'
    justification: string
  }>
  
  referenceArchitecture?: string
  
  agenticOpportunity?: {
    hasOpportunity: boolean
    title?: string
    agentType?: 'task-agent' | 'orchestrator-agent' | 'specialist-agent' | 'assistant-agent'
    capabilities?: string[]
    humanOversight?: 'none' | 'approval' | 'review' | 'supervision'
    automationLevel?: 'assisted' | 'semi-autonomous' | 'autonomous'
  }
  
  implementationComplexity?: {
    level: 'low' | 'medium' | 'high' | 'very-high'
    factors: string[]
    estimatedDuration: string
    estimatedTeamSize: string
  }
  
  aiRegulations?: {
    applicableFrameworks: string[]
    riskClassification: 'minimal' | 'limited' | 'high'
    complianceNotes: string
    jurisdictions: string[]
  }
  
  cybersecurity?: {
    securityRequirements: string[]
    dataClassification: 'public' | 'internal' | 'confidential' | 'pii'
    securityNotes: string
  }
}

interface ExtractionContext {
  customerName: string
  industry?: Industry
  location?: string
  stockTicker?: string
  companyInsights?: CompanyInsight[]
}

/**
 * Extract use cases from unstructured discovery notes
 */
export async function extractUseCasesFromNotes(
  notes: string,
  context: ExtractionContext
): Promise<ExtractedUseCase[]> {
  if (!notes.trim()) {
    throw new Error('Discovery notes cannot be empty')
  }

  const industryContext = context.industry && context.industry !== 'general'
    ? `\n\nINDUSTRY: ${industryLabels[context.industry]}`
    : ''

  const locationContext = context.location
    ? `\nLOCATION: ${context.location}`
    : ''

  // Build company insights context if available
  const insightsContext = context.companyInsights && context.companyInsights.length > 0
    ? `\n\nCOMPANY RESEARCH INSIGHTS:
${context.companyInsights.map(insight => `
- [${insight.category.toUpperCase()}] ${insight.title}
  Summary: ${insight.summary}
  AI Relevance: ${insight.relevanceToAI}
  Potential Use Cases: ${insight.potentialUseCases.join(', ')}
  Confidence: ${insight.confidence}
`).join('')}`
    : ''

  const prompt = `You are an expert innovation consultant at Microsoft using the Innovation Hub Methodology. Your task is to analyze unstructured discovery notes from a customer conversation and extract high-value use cases for Microsoft AI and cloud solutions.

CUSTOMER CONTEXT:
Customer: ${context.customerName}${industryContext}${locationContext}${insightsContext}

DISCOVERY NOTES (UNSTRUCTURED):
"""
${notes}
"""

TASK: Extract 4-8 high-value use cases from these notes. For each use case:

1. **Identify the core problem/opportunity** mentioned in the notes
2. **Extract relevant text** - Quote or reference specific sentences from the notes that informed this use case
3. **Map to Microsoft solutions** - Recommend appropriate Azure services and reference architectures
4. **Assess complexity** - Estimate implementation difficulty and risks
5. **Consider compliance** - Identify relevant AI regulations and security requirements

OUTPUT REQUIREMENTS:

For each use case, provide:
- **title**: Specific, compelling title (max 60 chars)
- **description**: Clear problem statement (2-3 sentences)
- **rationale**: Why this is valuable (reference data from notes)
- **sourceTexts**: Array of text excerpts from the original notes that informed this use case
  - Each sourceText should include: text (exact quote), startIndex (char position in notes), endIndex, confidence (1-10)
  - Extract 1-3 key excerpts per use case that show the pain point or opportunity
- **strategicAlignment**: Link to business priorities mentioned in notes
- **businessProcess**: Current workflow and pain points
- **microsoftSolutions**: Recommended Azure services (productFamily, services[], role, justification)
- **referenceArchitecture**: One of these validated patterns:
  - conversational-ai (chatbots, virtual agents, customer service automation)
  - document-processing (OCR, form recognition, document intelligence)
  - predictive-analytics (forecasting, ML models, business intelligence)
  - iot-telemetry (IoT data ingestion, real-time monitoring)
  - digital-twin (asset modeling, simulation, optimization)
  - knowledge-mining (search, content understanding, RAG)
  - process-automation (RPA, workflow automation, orchestration)
  - customer-360 (unified customer view, CRM, personalization)
  - supply-chain-optimization (logistics, inventory, demand planning)
  - fraud-detection (anomaly detection, transaction monitoring)
  - content-generation (generative AI, content creation)
  - code-assistant (developer productivity, code generation)
  - agentic-ai (autonomous agents, multi-agent orchestration)
- **agenticOpportunity**: Potential for AI agents (hasOpportunity, agentType, capabilities, automationLevel)
- **implementationComplexity**: level (low/medium/high/very-high), factors, estimatedDuration, estimatedTeamSize
- **aiRegulations**: Applicable frameworks (GDPR, POPIA, HIPAA, SOX, etc.), riskClassification
- **cybersecurity**: securityRequirements, dataClassification, securityNotes

REFERENCE ARCHITECTURE SELECTION GUIDE:
- Use "conversational-ai" for: chatbots, call center automation, virtual assistants, customer service
- Use "predictive-analytics" for: forecasting, churn prediction, demand planning, ML models
- Use "customer-360" for: unified customer data, personalization, CRM consolidation
- Use "process-automation" for: workflow automation, RPA, business process optimization
- Use "fraud-detection" for: anomaly detection, transaction monitoring, security alerts
- Use "document-processing" for: OCR, form extraction, invoice processing, document understanding
- Use "knowledge-mining" for: search, RAG, content discovery, intelligent indexing
- Use "agentic-ai" for: autonomous agents, multi-agent systems, complex orchestration

Return a JSON object with this structure:
{
  "useCases": [
    {
      "title": "string",
      "description": "string",
      "rationale": "string",
      "sourceTexts": [
        {
          "text": "exact quote from notes",
          "startIndex": 123,
          "endIndex": 234,
          "confidence": 8
        }
      ],
      "strategicAlignment": {
        "primaryPriority": "string",
        "linkedPriorities": ["string"],
        "source": "discovery-session",
        "alignmentScore": 8,
        "alignmentRationale": "string"
      },
      "businessProcess": {
        "processName": "string",
        "category": "core | support | management",
        "currentPainPoints": ["string"],
        "expectedImprovement": "string"
      },
      "microsoftSolutions": [
        {
          "productFamily": "azure-ai | power-platform | microsoft-365 | dynamics-365 | security",
          "services": ["Azure OpenAI", "Cognitive Services"],
          "role": "primary | supporting | integration",
          "justification": "string"
        }
      ],
      "referenceArchitecture": "conversational-ai | predictive-analytics | customer-360 | ...",
      "agenticOpportunity": {
        "hasOpportunity": true,
        "title": "string",
        "agentType": "task-agent | orchestrator-agent | specialist-agent | assistant-agent",
        "capabilities": ["reasoning", "planning", "tool-use"],
        "humanOversight": "none | approval | review | supervision",
        "automationLevel": "assisted | semi-autonomous | autonomous"
      },
      "implementationComplexity": {
        "level": "low | medium | high | very-high",
        "factors": ["integration complexity", "data availability"],
        "estimatedDuration": "8-12 weeks",
        "estimatedTeamSize": "3-5 people"
      },
      "aiRegulations": {
        "applicableFrameworks": ["GDPR", "POPIA"],
        "riskClassification": "minimal | limited | high",
        "complianceNotes": "string",
        "jurisdictions": ["South Africa", "EU"]
      },
      "cybersecurity": {
        "securityRequirements": ["encryption-at-rest", "access-control"],
        "dataClassification": "public | internal | confidential | pii",
        "securityNotes": "string"
      }
    }
  ]
}

CRITICAL:
- Extract sourceTexts with exact quotes and positions from the notes
- Be specific about which Microsoft solutions to use and why
- Choose the most appropriate reference architecture pattern
- Consider industry-specific regulations and security requirements
- Estimate realistic implementation complexity

Generate 4-8 use cases. Return valid JSON only.`

  try {
    // Use Phi-4-mini-instruct for extraction (71% cheaper than GPT-4o-mini)
    const result = await callAIForTask('extraction', prompt, { expectJson: true })
    const parsed = parseJsonLenient<any>(result)

    const useCases = Array.isArray(parsed)
      ? parsed
      : (parsed.useCases ?? parsed.usecases ?? parsed.use_cases)
    
    if (!useCases || !Array.isArray(useCases)) {
      throw new Error('Invalid response format: missing useCases array')
    }

    return useCases.map((uc: any) => ({
      title: uc.title || 'Untitled Use Case',
      description: uc.description || '',
      rationale: uc.rationale || '',
      sourceTexts: uc.sourceTexts || [],
      strategicAlignment: uc.strategicAlignment,
      businessProcess: uc.businessProcess,
      microsoftSolutions: uc.microsoftSolutions || [],
      referenceArchitecture: uc.referenceArchitecture,
      agenticOpportunity: uc.agenticOpportunity,
      implementationComplexity: uc.implementationComplexity,
      aiRegulations: uc.aiRegulations,
      cybersecurity: uc.cybersecurity,
    }))
  } catch (error) {
    console.error('Use case extraction failed:', error)
    throw new Error(`Failed to extract use cases: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Highlight source text in the original notes with markers
 */
export function highlightSourceText(
  originalNotes: string,
  sourceTexts: SourceTextHighlight[]
): string {
  if (!sourceTexts || sourceTexts.length === 0) return originalNotes

  // Sort by start index descending so we don't mess up indices when inserting markers
  const sorted = [...sourceTexts].sort((a, b) => b.startIndex - a.startIndex)

  let highlighted = originalNotes
  for (const source of sorted) {
    const before = highlighted.substring(0, source.startIndex)
    const text = highlighted.substring(source.startIndex, source.endIndex)
    const after = highlighted.substring(source.endIndex)
    highlighted = `${before}**${text}**${after}`
  }

  return highlighted
}
