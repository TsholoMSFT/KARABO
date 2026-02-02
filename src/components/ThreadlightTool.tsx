/**
 * ThreadlightTool Component
 * 
 * A standalone tool for exporting use cases to Threadlight.
 * Lives in the Tools tab instead of the workflow steps.
 * Users can select any use case from the current session and export.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { TreeStructure, FlowArrow, Lightning, Sparkle, Info, ArrowSquareOut } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThreadlightPasteCard } from '@/components/ThreadlightPasteCard'
import { buildThreadlightByopPasteText, buildThreadlightProcessAnalysis, makeThreadlightShortName } from '@/lib/threadlight-export'
import type { UseCase } from '@/lib/types'

const DEFAULT_THREADLIGHT_URL = 'https://aka.ms/threadlight'

interface ThreadlightToolProps {
  useCases: UseCase[]
  customerName?: string
  industry?: string
  threadlightUrl?: string
}

export function ThreadlightTool({
  useCases,
  customerName,
  industry,
  threadlightUrl = DEFAULT_THREADLIGHT_URL,
}: ThreadlightToolProps) {
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string>('')
  const [showExplanation, setShowExplanation] = useState(true)

  const selectedUseCase = useCases.find(uc => uc.id === selectedUseCaseId)

  // Build Threadlight export data
  const shortName = useMemo(() => {
    if (!selectedUseCase) return ''
    return makeThreadlightShortName(selectedUseCase.title)
  }, [selectedUseCase])
  
  const processAnalysis = useMemo(() => {
    if (!selectedUseCase?.businessProcesses?.length) return ''
    const processCandidates = selectedUseCase.businessProcesses
      .map(bp => bp.processName)
      .join(', ')
    const processNotes = selectedUseCase.businessProcesses
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
  }, [selectedUseCase])

  const pasteText = useMemo(() => {
    if (!selectedUseCase) return ''
    
    const processCandidates = selectedUseCase.businessProcesses
      ?.map(bp => bp.processName)
      .join(', ') || ''
    const processNotes = selectedUseCase.businessProcesses
      ?.map(bp => {
        const parts = [`Process: ${bp.processName}`]
        if (bp.proposedImprovement) parts.push(`  Improvement: ${bp.proposedImprovement}`)
        return parts.join('\n')
      })
      .join('\n\n') || ''
    
    const executiveSummary = [
      selectedUseCase.title,
      selectedUseCase.description,
      selectedUseCase.microsoftSolutions?.map(s => `${s.productFamily}: ${s.services.join(', ')}`).join('; ') || '',
    ].filter(Boolean).join('\n\n')

    return buildThreadlightByopPasteText({
      customerName,
      industryLabel: industry,
      opportunityName: selectedUseCase.title,
      processCandidates,
      processNotes,
      executiveSummary,
      financials: {
        annualCOI: selectedUseCase.costOfInaction?.totalAnnualCOI,
        annualValue: selectedUseCase.expectedValue?.totalAnnualValue,
        implementationCost: selectedUseCase.expectedValue?.implementationCost,
        paybackMonths: selectedUseCase.expectedValue?.paybackMonths,
        roi3YearPercent: selectedUseCase.expectedValue?.threeYearROI,
      },
    })
  }, [selectedUseCase, industry, customerName])

  if (useCases.length === 0) {
    return (
      <Card className="border-2 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreeStructure size={24} weight="duotone" className="text-primary" />
            Threadlight Export
          </CardTitle>
          <CardDescription>
            Export use cases to Threadlight for professional architecture diagrams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Use Cases Available</AlertTitle>
            <AlertDescription>
              Complete a discovery session first to create use cases, then return here to export to Threadlight.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreeStructure size={24} weight="duotone" className="text-primary" />
          Threadlight Export
        </CardTitle>
        <CardDescription>
          Export use cases to Threadlight for professional architecture diagrams and process flows
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
              <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                <Sparkle className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-800 dark:text-purple-300">What is Threadlight?</AlertTitle>
                <AlertDescription className="text-purple-700 dark:text-purple-400 space-y-2 mt-2">
                  <p className="text-sm">
                    <strong>Threadlight</strong> is Microsoft's tool for creating professional architecture diagrams and process flows.
                  </p>
                  <ul className="text-xs space-y-1 mt-2">
                    <li className="flex items-center gap-2">
                      <TreeStructure size={12} weight="fill" className="text-purple-500" />
                      Generate Azure reference architecture diagrams
                    </li>
                    <li className="flex items-center gap-2">
                      <FlowArrow size={12} weight="fill" className="text-purple-500" />
                      Create business process flow visualizations
                    </li>
                    <li className="flex items-center gap-2">
                      <Lightning size={12} weight="fill" className="text-purple-500" />
                      Auto-populate with your discovery data via BYOP
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="text-xs text-purple-600 hover:text-purple-800 underline mt-2"
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
            <Info size={12} /> What is Threadlight?
          </button>
        )}

        {/* Use Case Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Use Case to Export</label>
          <Select value={selectedUseCaseId} onValueChange={setSelectedUseCaseId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a use case to export..." />
            </SelectTrigger>
            <SelectContent>
              {useCases.map(uc => (
                <SelectItem key={uc.id} value={uc.id}>
                  <div className="flex items-center gap-2">
                    {uc.title}
                    {uc.businessProcesses && uc.businessProcesses.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                        {uc.businessProcesses.length} processes
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
              <div className="flex flex-wrap gap-2">
                {selectedUseCase.microsoftSolutions && selectedUseCase.microsoftSolutions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedUseCase.microsoftSolutions.length} Microsoft Solutions
                  </Badge>
                )}
                {selectedUseCase.businessProcesses && selectedUseCase.businessProcesses.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedUseCase.businessProcesses.length} Business Processes
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Threadlight Export Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                  <Sparkle size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Export to Threadlight</h4>
                  <p className="text-xs text-muted-foreground">
                    Copy data for BYOP (Bring Your Own Process) wizard
                  </p>
                </div>
              </div>

              <ThreadlightPasteCard
                wizardUrl={threadlightUrl}
                industryLabel={industry}
                industryValue={industry}
                shortName={shortName}
                processAnalysis={processAnalysis}
                pasteText={pasteText}
                title="Threadlight BYOP Data"
                description="Copy and paste into Threadlight's BYOP wizard"
              />
            </div>

            {/* Summary Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <TreeStructure size={20} weight="duotone" className="text-primary" />
                  <h4 className="font-medium text-sm">What You'll Get</h4>
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
                    Integration flow diagrams
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <FlowArrow size={20} weight="duotone" className="text-primary" />
                  <h4 className="font-medium text-sm">Process Flows</h4>
                </div>
                {selectedUseCase.businessProcesses && selectedUseCase.businessProcesses.length > 0 ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {selectedUseCase.businessProcesses.slice(0, 3).map((process, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Lightning size={14} weight="fill" className="text-green-500" />
                        {process.processName}
                      </li>
                    ))}
                    {selectedUseCase.businessProcesses.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{selectedUseCase.businessProcesses.length - 3} more
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Process flows will be designed in Threadlight
                  </p>
                )}
              </div>
            </div>

            {/* Open Threadlight Button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(threadlightUrl, '_blank')}
              >
                Open Threadlight
                <ArrowSquareOut size={16} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ThreadlightTool
