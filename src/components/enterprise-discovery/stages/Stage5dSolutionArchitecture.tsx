/**
 * Stage 5d: Solution Architecture
 * Maps use cases to Microsoft reference architectures and solutions
 * Includes AI-powered suggestions with manual fallback
 * 
 * Retrieves use cases from session state (Stage 4 Prioritise or earlier discovery)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ThreadlightPasteCard } from '@/components/ThreadlightPasteCard'
import { buildThreadlightByopPasteText, buildThreadlightProcessAnalysis, makeThreadlightShortName } from '@/lib/threadlight-export'
import {
  REFERENCE_ARCHITECTURES,
  type ReferenceArchitecturePattern,
  type MicrosoftSolutionMapping,
} from '@/lib/microsoft-solutions'
import type { Industry, UseCaseBusinessProcess } from '@/lib/types'
import {
  ArrowLeft,
  ArrowRight,
  Graph,
  Sparkle,
  Warning,
  CheckCircle,
  Lightning,
  Info,
  ListBullets,
} from '@phosphor-icons/react'

// Type for architecture mapping per use case
export interface UseCaseArchitectureMapping {
  useCaseId: string
  useCaseTitle: string
  useCaseDescription: string
  referenceArchitecture?: ReferenceArchitecturePattern
  microsoftSolutions: MicrosoftSolutionMapping[]
  businessProcesses: UseCaseBusinessProcess[]
  isManuallySelected: boolean
  aiGenerationFailed?: boolean
}

export interface SolutionArchitectureData {
  useCaseMappings: UseCaseArchitectureMapping[]
  completedAt?: number
}

// Use case input - can come from Stage 4 or be manually defined
export interface UseCaseInput {
  id: string
  title: string
  description: string
  priority?: number
}

interface Stage5dSolutionArchitectureProps {
  initialData?: SolutionArchitectureData
  useCases: UseCaseInput[]
  industry?: Industry
  clientName?: string
  onComplete: (data: SolutionArchitectureData) => void
  onBack: () => void
}

export function Stage5dSolutionArchitecture({
  initialData,
  useCases,
  industry,
  clientName,
  onComplete,
  onBack,
}: Stage5dSolutionArchitectureProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mappings, setMappings] = useState<UseCaseArchitectureMapping[]>(() => {
    // Initialize from existing data or create new mappings
    if (initialData?.useCaseMappings && initialData.useCaseMappings.length > 0) {
      return initialData.useCaseMappings
    }
    return useCases.map(uc => ({
      useCaseId: uc.id,
      useCaseTitle: uc.title,
      useCaseDescription: uc.description,
      microsoftSolutions: [],
      businessProcesses: [],
      isManuallySelected: false,
    }))
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showManualSelector, setShowManualSelector] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)

  // Check AI availability on mount
  useEffect(() => {
    checkAIAvailability()
  }, [])

  const checkAIAvailability = async () => {
    try {
      if (!window.llm) {
        setAiAvailable(false)
        return
      }
      // Quick test call
      const response = await window.llm('Reply with just: OK', 'gpt-4o-mini', false)
      setAiAvailable(response.includes('OK'))
    } catch {
      setAiAvailable(false)
    }
  }

  const currentMapping = mappings[currentIndex]
  const progress = useCases.length > 0 ? ((currentIndex + 1) / useCases.length) * 100 : 0
  const mappedCount = mappings.filter(m => m.referenceArchitecture).length
  const allMapped = mappings.length > 0 && mappings.every(m => m.referenceArchitecture)

  // No use cases case
  if (useCases.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Warning size={24} weight="duotone" className="text-amber-600" />
              </div>
              <div>
                <CardTitle>No Use Cases Available</CardTitle>
                <CardDescription>
                  Use cases need to be defined before mapping solution architectures
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info size={16} />
              <AlertDescription>
                Please complete the earlier stages to define and prioritize use cases before proceeding
                with solution architecture mapping.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // AI-powered architecture suggestion
  const generateArchitecture = async () => {
    if (!aiAvailable) {
      toast.error('AI service unavailable', { description: 'Please select architecture manually' })
      setShowManualSelector(true)
      return
    }

    setIsGenerating(true)
    try {
      const prompt = `Analyze this use case and suggest the best Microsoft reference architecture pattern.

Client: ${clientName || 'Enterprise Client'}
Industry: ${industry || 'general'}

Use Case: ${currentMapping.useCaseTitle}
Description: ${currentMapping.useCaseDescription}

Available reference architecture patterns:
${Object.entries(REFERENCE_ARCHITECTURES).map(([key, arch]) => `- ${key}: ${arch.label} - ${arch.description}`).join('\n')}

Select the BEST matching pattern and respond with ONLY a valid JSON object (no markdown):
{
  "pattern": "<pattern-id from the list above>",
  "reasoning": "<one sentence explaining why this pattern fits>",
  "primaryServices": ["<service1>", "<service2>"],
  "businessProcess": {
    "processName": "<name of business process being improved>",
    "category": "<category>",
    "currentPainPoints": ["<pain point 1>", "<pain point 2>"],
    "expectedImprovement": "<what improvement AI brings>"
  }
}`

      const response = await window.llm!(prompt, 'gpt-4o-mini', true)
      const suggestion = JSON.parse(response)
      
      if (suggestion.pattern && REFERENCE_ARCHITECTURES[suggestion.pattern as ReferenceArchitecturePattern]) {
        const arch = REFERENCE_ARCHITECTURES[suggestion.pattern as ReferenceArchitecturePattern]
        
        // Build business processes from suggestion (using UseCaseBusinessProcess format)
        const businessProcesses: UseCaseBusinessProcess[] = suggestion.businessProcess ? [{
          processId: `proc-${Date.now()}`,
          processName: suggestion.businessProcess.processName || 'AI-Enhanced Process',
          currentPainPoints: suggestion.businessProcess.currentPainPoints || [],
          proposedImprovement: suggestion.businessProcess.expectedImprovement || `${arch.label} implementation`,
        }] : []
        
        updateMapping(currentIndex, {
          referenceArchitecture: suggestion.pattern,
          microsoftSolutions: arch.primaryProducts.map((family, idx) => ({
            productFamily: family,
            services: suggestion.primaryServices?.filter((s: string) => 
              arch.typicalServices.includes(s)
            ) || arch.typicalServices.slice(0, 3),
            role: idx === 0 ? 'primary' : 'supporting' as const,
            justification: suggestion.reasoning,
          })),
          businessProcesses,
          isManuallySelected: false,
          aiGenerationFailed: false,
        })
        
        toast.success('Architecture suggested!', { description: arch.label })
      } else {
        throw new Error('Invalid pattern returned from AI')
      }
    } catch (error) {
      console.error('AI architecture generation failed:', error)
      toast.error('AI suggestion failed', { description: 'Please select manually' })
      updateMapping(currentIndex, { aiGenerationFailed: true })
      setShowManualSelector(true)
      setAiAvailable(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateMapping = (index: number, updates: Partial<UseCaseArchitectureMapping>) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, ...updates } : m))
  }

  const handleManualSelect = (pattern: ReferenceArchitecturePattern, solutions: MicrosoftSolutionMapping[]) => {
    const arch = REFERENCE_ARCHITECTURES[pattern]
    updateMapping(currentIndex, {
      referenceArchitecture: pattern,
      microsoftSolutions: solutions.length > 0 ? solutions : arch.primaryProducts.map((family, idx) => ({
        productFamily: family,
        services: arch.typicalServices.slice(0, 3),
        role: idx === 0 ? 'primary' : 'supporting' as const,
        justification: 'Manually selected during discovery',
      })),
      isManuallySelected: true,
      aiGenerationFailed: false,
    })
    setShowManualSelector(false)
    toast.success('Architecture selected!')
  }

  const handleNext = () => {
    if (currentIndex < useCases.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowManualSelector(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowManualSelector(false)
    }
  }

  const handleComplete = () => {
    onComplete({
      useCaseMappings: mappings,
      completedAt: Date.now(),
    })
  }

  const jumpToUseCase = (index: number) => {
    setCurrentIndex(index)
    setShowManualSelector(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Graph size={24} weight="duotone" className="text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Stage 5d: Solution Architecture</CardTitle>
              <CardDescription>
                Map use cases to Microsoft reference architectures and solutions
              </CardDescription>
            </div>
            {!aiAvailable && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                <Warning size={12} className="mr-1" />
                AI Unavailable
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress: {currentIndex + 1} of {useCases.length} use cases</span>
              <span className="text-muted-foreground">{mappedCount} of {useCases.length} mapped</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Use Case List - Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ListBullets size={18} />
              <CardTitle className="text-base">Use Cases</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {mappings.map((m, idx) => (
                <div
                  key={m.useCaseId}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    idx === currentIndex 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'hover:bg-accent border-2 border-transparent'
                  }`}
                  onClick={() => jumpToUseCase(idx)}
                >
                  <div className="flex items-start gap-2">
                    {m.referenceArchitecture ? (
                      <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    ) : m.aiGenerationFailed ? (
                      <Warning size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.useCaseTitle}</p>
                      {m.referenceArchitecture && (
                        <p className="text-xs text-muted-foreground truncate">
                          {REFERENCE_ARCHITECTURES[m.referenceArchitecture]?.label}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Use Case - Main Area */}
        <Card className="lg:col-span-2 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Use Case {currentIndex + 1} of {useCases.length}</Badge>
              {currentMapping.isManuallySelected && (
                <Badge variant="outline" className="text-xs">Manually selected</Badge>
              )}
            </div>
            <CardTitle className="mt-2">{currentMapping.useCaseTitle}</CardTitle>
            <CardDescription>{currentMapping.useCaseDescription}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Threadlight Integration */}
            <motion.div 
              key="threadlight" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="space-y-4"
            >
              <ThreadlightPasteCard
                wizardUrl="https://aka.ms/threadlight"
                industryLabel={industry}
                industryValue={industry}
                shortName={makeThreadlightShortName(currentMapping.useCaseTitle)}
                processAnalysis={buildThreadlightProcessAnalysis(
                  currentMapping.businessProcesses.map(bp => ({
                    processName: bp.processName,
                    affectedSteps: [],
                    currentPainPoints: bp.currentPainPoints || [],
                    proposedImprovement: bp.proposedImprovement,
                  }))
                )}
                pasteText={buildThreadlightByopPasteText({
                  title: currentMapping.useCaseTitle,
                  description: currentMapping.useCaseDescription,
                  industry: industry,
                  businessProcesses: currentMapping.businessProcesses.map(bp => ({
                    processName: bp.processName,
                    affectedSteps: [],
                    currentPainPoints: bp.currentPainPoints || [],
                    proposedImprovement: bp.proposedImprovement,
                  })),
                  microsoftSolutions: currentMapping.microsoftSolutions.map(s => ({
                    productFamily: s.productFamily,
                    services: s.services,
                  })),
                })}
                title="Export to Threadlight"
                description="Copy the details below and paste into Threadlight's BYOP wizard for professional architecture diagrams and process flows."
              />
              
              {/* Business Process Summary */}
              {currentMapping.businessProcesses.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Business Processes</h4>
                    <div className="space-y-2">
                      {currentMapping.businessProcesses.map((process, idx) => (
                        <div key={process.processId || `proc-${idx}`} className="p-3 border rounded-lg bg-accent/10">
                          <p className="font-medium text-sm">{process.processName}</p>
                          {process.proposedImprovement && (
                            <p className="text-xs text-muted-foreground mt-1">{process.proposedImprovement}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Button 
              variant="outline" 
              onClick={currentIndex === 0 ? onBack : handlePrevious}
            >
              <ArrowLeft size={16} className="mr-2" />
              {currentIndex === 0 ? 'Back to 5c' : 'Previous'}
            </Button>
            
            {currentIndex < useCases.length - 1 ? (
              <Button 
                onClick={handleNext}
              >
                Next Use Case
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={!allMapped}
                className="gap-2"
              >
                <CheckCircle size={16} />
                Complete Stage 5
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Skip option for partial completion */}
      {!allMapped && mappedCount > 0 && (
        <Alert>
          <Info size={16} />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have mapped {mappedCount} of {useCases.length} use cases. 
              You can complete now and add remaining architectures later.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleComplete}
              className="ml-4"
            >
              Complete with {mappedCount} mapped
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
  )
}

export default Stage5dSolutionArchitecture
