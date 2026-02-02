import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CustomerJourneyView } from '@/components/CustomerJourneyView'
import { TreeStructure, Sparkle, Info, Lightning, Lightbulb, Package, ArrowRight } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { generateCustomerJourney } from '@/lib/openai-service'
import type { UseCase, CustomerJourney, DiscoverySession } from '@/lib/types'
import { generateDefaultJourneyMilestones, calculateJourneyDuration } from '@/lib/types'

interface CustomerJourneyToolProps {
  session: DiscoverySession | null
  useCases?: UseCase[]
  onJourneyUpdate?: (useCaseId: string, journey: CustomerJourney) => void
}

const ENGAGEMENT_EXPLANATIONS = {
  'business-envisioning': {
    icon: <Lightbulb size={16} weight="duotone" className="text-purple-500" />,
    title: 'Business Envisioning',
    reason: 'Always included as the first step to discover prioritized use cases through human-centered design thinking and ensure stakeholder alignment.',
  },
  'solution-envisioning': {
    icon: <TreeStructure size={16} weight="duotone" className="text-blue-500" />,
    title: 'Solution Envisioning',
    reason: 'Included for medium+ complexity projects to establish strategic direction and map Microsoft capabilities to business requirements.',
  },
  'architecture-design': {
    icon: <Package size={16} weight="duotone" className="text-teal-500" />,
    title: 'Architecture Design',
    reason: 'Included for high complexity projects to synthesize requirements, define scope, and align to reference architectures.',
  },
  'rapid-prototype': {
    icon: <Lightning size={16} weight="duotone" className="text-orange-500" />,
    title: 'Rapid Prototype',
    reason: 'Always included as the final step to demonstrate key technical capabilities and accelerate go/no-go decisions.',
  },
}

export function CustomerJourneyTool({ session, useCases = [], onJourneyUpdate }: CustomerJourneyToolProps) {
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)

  const selectedUseCase = useCases.find((uc: UseCase) => uc.id === selectedUseCaseId)
  const existingJourney = selectedUseCase?.customerJourney

  // Determine complexity based on use case data
  const getComplexity = useCallback((uc: UseCase): 'low' | 'medium' | 'high' | 'very-high' => {
    const effortWeeks = uc.rice?.effort || 4
    if (effortWeeks > 16) return 'very-high'
    if (effortWeeks > 8) return 'high'
    if (effortWeeks > 4) return 'medium'
    return 'low'
  }, [])

  // Get recommended phases based on complexity
  const getRecommendedPhases = useCallback((complexity: 'low' | 'medium' | 'high' | 'very-high') => {
    const phases: Array<keyof typeof ENGAGEMENT_EXPLANATIONS> = ['business-envisioning']
    if (complexity !== 'low') phases.push('solution-envisioning')
    if (complexity === 'high' || complexity === 'very-high') phases.push('architecture-design')
    phases.push('rapid-prototype')
    return phases
  }, [])

  const handleGenerateJourney = async () => {
    if (!selectedUseCase || !session) return

    setIsGenerating(true)
    try {
      const complexity = getComplexity(selectedUseCase)
      
      const generated = await generateCustomerJourney(
        { id: selectedUseCase.id, title: selectedUseCase.title, description: selectedUseCase.description },
        {
          complexity,
          industry: session.industry,
          customerName: session.customerName,
        }
      )

      const journey: CustomerJourney = {
        useCaseId: selectedUseCase.id,
        title: generated.title,
        journeyNotes: generated.journeyNotes,
        milestones: generated.milestones.map((m, idx) => ({
          id: `${selectedUseCase.id}-m${idx + 1}`,
          order: idx + 1,
          title: m.title,
          description: m.description,
          engagement: m.engagement,
          duration: m.duration,
          deliverables: m.deliverables,
          dependencies: m.dependencies,
          isComplete: false,
          discoveryContext: m.discoveryContext,
        })),
        nextSteps: generated.nextSteps?.map((s, idx) => ({
          id: `${selectedUseCase.id}-step${idx + 1}`,
          action: s.action,
          owner: s.owner,
          targetDate: s.targetDate,
          isComplete: false,
        })),
        totalDuration: generated.totalDuration,
        createdAt: Date.now(),
        generatedBy: 'ai',
        editHistory: [],
        discoveryInsights: generated.discoveryInsights,
      }

      onJourneyUpdate?.(selectedUseCase.id, journey)
      toast.success('Customer journey generated successfully!')
    } catch (error) {
      console.error('Failed to generate journey:', error)
      // Fallback to default journey
      const complexity = getComplexity(selectedUseCase)
      const milestones = generateDefaultJourneyMilestones(selectedUseCase.id, complexity)
      const journey: CustomerJourney = {
        useCaseId: selectedUseCase.id,
        title: `${selectedUseCase.title} Implementation Journey`,
        milestones,
        totalDuration: calculateJourneyDuration(milestones),
        createdAt: Date.now(),
        generatedBy: 'ai',
        editHistory: [],
      }
      onJourneyUpdate?.(selectedUseCase.id, journey)
      toast.warning('Generated default journey (AI unavailable)')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleJourneyUpdate = (journey: CustomerJourney) => {
    if (selectedUseCaseId) {
      onJourneyUpdate?.(selectedUseCaseId, journey)
    }
  }

  if (!session || useCases.length === 0) {
    return (
      <Card className="border-2 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreeStructure size={24} weight="duotone" className="text-primary" />
            Customer Journey Builder
          </CardTitle>
          <CardDescription>
            Generate Innovation Hub engagement roadmaps for your use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info size={16} />
            <AlertTitle>No Use Cases Available</AlertTitle>
            <AlertDescription>
              Complete a discovery session first to create use cases, then return here to build customer journeys.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const complexity = selectedUseCase ? getComplexity(selectedUseCase) : 'medium'
  const recommendedPhases = getRecommendedPhases(complexity)

  return (
    <Card className="border-2 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreeStructure size={24} weight="duotone" className="text-primary" />
          Customer Journey Builder
        </CardTitle>
        <CardDescription>
          Generate Innovation Hub engagement roadmaps for your use cases. Each journey is tailored based on project complexity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Explainer Section */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <Info size={16} className="text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">How Journey Steps Are Selected</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400 space-y-2 mt-2">
                  <p className="text-sm">
                    Journey phases are recommended based on <strong>project complexity</strong> (derived from effort estimates):
                  </p>
                  <ul className="text-xs space-y-1 mt-2">
                    <li><Badge variant="outline" className="mr-2">Low</Badge>Business Envisioning → Rapid Prototype (2 phases)</li>
                    <li><Badge variant="outline" className="mr-2">Medium</Badge>+ Solution Envisioning (3 phases)</li>
                    <li><Badge variant="outline" className="mr-2">High+</Badge>+ Architecture Design (4 phases)</li>
                  </ul>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                  >
                    Hide explanation
                  </button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {!showExplanation && (
          <button
            onClick={() => setShowExplanation(true)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Info size={12} /> How are journey steps selected?
          </button>
        )}

        {/* Use Case Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Use Case</label>
          <Select value={selectedUseCaseId} onValueChange={setSelectedUseCaseId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a use case to build a journey..." />
            </SelectTrigger>
            <SelectContent>
              {useCases.map((uc: UseCase) => (
                <SelectItem key={uc.id} value={uc.id}>
                  <div className="flex items-center gap-2">
                    {uc.title}
                    {uc.customerJourney && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                        Has Journey
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Use Case Details */}
        {selectedUseCase && (
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">{selectedUseCase.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{selectedUseCase.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Complexity: {complexity}
                </Badge>
                {selectedUseCase.rice?.effort && (
                  <Badge variant="outline">
                    Effort: {selectedUseCase.rice.effort} weeks
                  </Badge>
                )}
              </div>
            </div>

            {/* Recommended Phases */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommended Engagement Phases</h4>
              <div className="space-y-2">
                {recommendedPhases.map((phase, idx) => {
                  const info = ENGAGEMENT_EXPLANATIONS[phase]
                  return (
                    <div key={phase} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <span className="text-xs font-medium text-muted-foreground w-4">{idx + 1}.</span>
                        {info.icon}
                        <span className="text-sm font-medium">{info.title}</span>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground mt-1 shrink-0" />
                      <p className="text-xs text-muted-foreground">{info.reason}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateJourney}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Sparkle size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : existingJourney ? (
                  <>
                    <Sparkle size={16} weight="fill" />
                    Regenerate Journey
                  </>
                ) : (
                  <>
                    <Sparkle size={16} weight="fill" />
                    Generate Journey
                  </>
                )}
              </Button>
            </div>

            {/* Display Existing Journey */}
            {existingJourney && (
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-3">Current Journey</h4>
                <CustomerJourneyView
                  journey={existingJourney}
                  onUpdate={handleJourneyUpdate}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CustomerJourneyTool
