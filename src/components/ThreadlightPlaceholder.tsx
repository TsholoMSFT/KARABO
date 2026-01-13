/**
 * ThreadlightPlaceholder Component
 * 
 * Replaces the in-app diagramming features with a handoff to Threadlight.
 * Threadlight handles architecture diagrams, process flows, and solution design
 * significantly better than the built-in Mermaid-based diagrams.
 * 
 * Reuses ThreadlightPasteCard for the copy/paste functionality.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TreeStructure, FlowArrow, Lightning, Sparkle, ArrowRight, ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ThreadlightPasteCard } from '@/components/ThreadlightPasteCard'
import { buildThreadlightByopPasteText, buildThreadlightProcessAnalysis, makeThreadlightShortName } from '@/lib/threadlight-export'

// Configurable Threadlight URL - can be overridden via props or environment
const DEFAULT_THREADLIGHT_URL = 'https://threadlight.ai/wizard/byop'

interface ThreadlightPlaceholderProps {
  useCase: {
    id: string
    title: string
    description: string
    businessProcesses?: Array<{
      processId: string
      processName: string
      affectedSteps?: string[]
      currentPainPoints?: string[]
      proposedImprovement: string
    }>
    microsoftSolutions?: Array<{
      productFamily: string
      services: string[]
    }>
  }
  industry?: string
  currentIndex: number
  totalCount: number
  onNext: () => void
  onBack: () => void
  colorScheme?: 'primary' | 'green' | 'orange'
  threadlightUrl?: string
}

export function ThreadlightPlaceholder({
  useCase,
  industry,
  currentIndex,
  totalCount,
  onNext,
  onBack,
  colorScheme = 'primary',
  threadlightUrl = DEFAULT_THREADLIGHT_URL,
}: ThreadlightPlaceholderProps) {
  // Build Threadlight export data
  const shortName = useMemo(() => makeThreadlightShortName(useCase.title), [useCase.title])
  
  const processAnalysis = useMemo(() => {
    if (!useCase.businessProcesses?.length) return ''
    // Build process candidates and notes from business processes
    const processCandidates = useCase.businessProcesses
      .map(bp => bp.processName)
      .join(', ')
    const processNotes = useCase.businessProcesses
      .map(bp => {
        const parts = [`Process: ${bp.processName}`]
        if (bp.affectedSteps?.length) parts.push(`  Steps: ${bp.affectedSteps.join(', ')}`)
        if (bp.currentPainPoints?.length) parts.push(`  Pain Points: ${bp.currentPainPoints.join(', ')}`)
        if (bp.proposedImprovement) parts.push(`  Improvement: ${bp.proposedImprovement}`)
        return parts.join('\n')
      })
      .join('\n\n')
    return buildThreadlightProcessAnalysis({
      processCandidates,
      processNotes,
    })
  }, [useCase.businessProcesses])

  const pasteText = useMemo(() => {
    // Build processCandidates and processNotes from business processes
    const processCandidates = useCase.businessProcesses
      ?.map(bp => bp.processName)
      .join(', ') || ''
    const processNotes = useCase.businessProcesses
      ?.map(bp => {
        const parts = [`Process: ${bp.processName}`]
        if (bp.proposedImprovement) parts.push(`  Improvement: ${bp.proposedImprovement}`)
        return parts.join('\n')
      })
      .join('\n\n') || ''
    
    const executiveSummary = [
      useCase.title,
      useCase.description,
      useCase.microsoftSolutions?.map(s => `${s.productFamily}: ${s.services.join(', ')}`).join('; ') || '',
    ].filter(Boolean).join('\n\n')

    return buildThreadlightByopPasteText({
      industryLabel: industry,
      opportunityName: useCase.title,
      processCandidates,
      processNotes,
      executiveSummary,
    })
  }, [useCase, industry])

  const colorClasses = {
    primary: { icon: 'text-primary', card: 'border-primary/20' },
    green: { icon: 'text-brand-green', card: 'border-brand-green/20' },
    orange: { icon: 'text-brand-orange', card: 'border-brand-orange/20' },
  }
  const colors = colorClasses[colorScheme]

  return (
    <motion.div
      key={`threadlight-${useCase.id}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className={`border-2 ${colors.card}`}>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">Use Case {currentIndex + 1} of {totalCount}</Badge>
            <TreeStructure size={24} weight="duotone" className={colors.icon} />
          </div>
          <CardTitle>Solution Architecture & Process Design</CardTitle>
          <CardDescription>Export to Threadlight for professional architecture diagrams and process flows</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Use Case Context */}
          <div className="p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
            <p className="text-sm text-muted-foreground">{useCase.description}</p>
          </div>

          {/* Threadlight Integration - Reusing ThreadlightPasteCard */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                  <Sparkle size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Threadlight Integration</h4>
                  <p className="text-xs text-muted-foreground">
                    Professional architecture & process flow diagrams
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={threadlightUrl} target="_blank" rel="noreferrer">
                  Open Wizard
                  <ArrowSquareOut size={16} />
                </a>
              </Button>
            </div>

            <ThreadlightPasteCard
              wizardUrl={threadlightUrl}
              industryLabel={industry}
              industryValue={industry}
              shortName={shortName}
              processAnalysis={processAnalysis}
              pasteText={pasteText}
              title="Export to Threadlight"
              description="Copy the details below and paste into Threadlight's BYOP wizard for professional diagrams."
            />
          </div>

          {/* Summary Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <TreeStructure size={20} weight="duotone" className={colors.icon} />
                <h4 className="font-medium text-sm">Architecture Design</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Lightning size={14} weight="fill" className="text-amber-500" />
                  Reference architecture patterns
                </li>
                <li className="flex items-center gap-2">
                  <Lightning size={14} weight="fill" className="text-amber-500" />
                  Azure service topology
                </li>
                <li className="flex items-center gap-2">
                  <Lightning size={14} weight="fill" className="text-amber-500" />
                  Integration flows
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <FlowArrow size={20} weight="duotone" className={colors.icon} />
                <h4 className="font-medium text-sm">Process Flows</h4>
              </div>
              {useCase.businessProcesses && useCase.businessProcesses.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {useCase.businessProcesses.slice(0, 3).map((process, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Lightning size={14} weight="fill" className="text-green-500" />
                      {process.processName}
                    </li>
                  ))}
                  {useCase.businessProcesses.length > 3 && (
                    <li className="text-xs">+{useCase.businessProcesses.length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Process flows will be designed in Threadlight
                </p>
              )}
            </div>
          </div>

          {/* Microsoft Solutions Summary */}
          {useCase.microsoftSolutions && useCase.microsoftSolutions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Microsoft Solutions</h4>
              <div className="flex flex-wrap gap-2">
                {useCase.microsoftSolutions.map((solution, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
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
            {currentIndex < totalCount - 1 ? 'Next Use Case' : 'Generate Customer Journeys'}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default ThreadlightPlaceholder
