/**
 * ProcessFlowDiagram Component
 * Visual flow diagram for business process steps with pain points and AI intervention indicators
 */

import { cn } from '@/lib/utils'
import { ProcessStep, UseCaseBusinessProcess } from '@/lib/types'
import { 
  ArrowRight, 
  Lightning, 
  Warning,
  Robot,
  Sparkle,
  CheckCircle,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProcessFlowDiagramProps {
  process: UseCaseBusinessProcess & { processData?: any }
  className?: string
  compact?: boolean
}

interface ProcessStepData {
  order: number
  name: string
  description?: string
  painPoint?: string
  aiOpportunity?: {
    interventionType: 'automate' | 'augment' | 'analyze' | 'generate'
    description: string
  }
}

const INTERVENTION_COLORS: Record<string, string> = {
  automate: 'bg-purple-100 text-purple-700 border-purple-200',
  augment: 'bg-blue-100 text-blue-700 border-blue-200',
  analyze: 'bg-green-100 text-green-700 border-green-200',
  generate: 'bg-orange-100 text-orange-700 border-orange-200',
}

const INTERVENTION_LABELS: Record<string, string> = {
  automate: 'Automate',
  augment: 'Augment',
  analyze: 'Analyze',
  generate: 'Generate',
}

const INTERVENTION_ICONS: Record<string, React.ReactNode> = {
  automate: <Robot size={12} weight="fill" />,
  augment: <Sparkle size={12} weight="fill" />,
  analyze: <Lightning size={12} weight="fill" />,
  generate: <Sparkle size={12} weight="fill" />,
}

export function ProcessFlowDiagram({ process, className, compact = false }: ProcessFlowDiagramProps) {
  const [expanded, setExpanded] = useState(!compact)
  
  // Extract steps from processData if available, otherwise create from affectedSteps
  const steps: ProcessStepData[] = process.processData?.steps || 
    process.affectedSteps?.map((name, index) => ({
      order: index + 1,
      name,
      description: undefined,
      painPoint: process.currentPainPoints?.[index],
      aiOpportunity: undefined,
    })) || []

  if (steps.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Lightning size={16} weight="fill" className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{process.processName}</p>
            <p className="text-xs text-muted-foreground">
              {steps.length} steps • {process.currentPainPoints?.length || 0} pain points
            </p>
          </div>
        </div>
        {expanded ? (
          <CaretUp size={16} className="text-muted-foreground" />
        ) : (
          <CaretDown size={16} className="text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Process Flow */}
            <div className="flex flex-wrap items-start gap-2 p-3 bg-background rounded-lg border">
              {steps.map((step, index) => (
                <div key={step.order} className="flex items-center">
                  {/* Step Box */}
                  <div className="relative group">
                    <div 
                      className={cn(
                        'p-3 rounded-lg border-2 min-w-[120px] max-w-[160px] transition-all',
                        step.painPoint 
                          ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' 
                          : 'border-border bg-card',
                        step.aiOpportunity && 'ring-2 ring-primary/30'
                      )}
                    >
                      {/* Step Number */}
                      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                        {step.order}
                      </div>

                      {/* Step Name */}
                      <p className="text-sm font-medium text-center mb-1">{step.name}</p>

                      {/* Pain Point Indicator */}
                      {step.painPoint && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Warning size={12} weight="fill" className="text-amber-500" />
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">Pain Point</span>
                        </div>
                      )}

                      {/* AI Intervention Badge */}
                      {step.aiOpportunity && (
                        <div className="mt-2 flex justify-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-[10px] gap-1',
                              INTERVENTION_COLORS[step.aiOpportunity.interventionType]
                            )}
                          >
                            {INTERVENTION_ICONS[step.aiOpportunity.interventionType]}
                            {INTERVENTION_LABELS[step.aiOpportunity.interventionType]}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Hover Tooltip */}
                    {(step.description || step.painPoint || step.aiOpportunity) && (
                      <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                        {step.description && (
                          <p className="text-xs mb-2">{step.description}</p>
                        )}
                        {step.painPoint && (
                          <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-2">
                            <Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
                            <span>{step.painPoint}</span>
                          </div>
                        )}
                        {step.aiOpportunity && (
                          <div className="flex items-start gap-1.5 text-xs text-primary">
                            <Sparkle size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
                            <span>{step.aiOpportunity.description}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Arrow between steps */}
                  {index < steps.length - 1 && (
                    <ArrowRight size={20} weight="bold" className="text-muted-foreground mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              {process.currentPainPoints && process.currentPainPoints.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Warning size={14} weight="fill" className="text-amber-500" />
                  <span>{process.currentPainPoints.length} pain points identified</span>
                </div>
              )}
              {steps.filter(s => s.aiOpportunity).length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Sparkle size={14} weight="fill" className="text-primary" />
                  <span>{steps.filter(s => s.aiOpportunity).length} AI intervention opportunities</span>
                </div>
              )}
              {process.proposedImprovement && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="fill" className="text-green-500" />
                  <span>{process.proposedImprovement}</span>
                </div>
              )}
            </div>

            {/* Expected Improvement */}
            {process.expectedCycleTimeReduction && (
              <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                    Expected: {process.expectedCycleTimeReduction}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact inline version for use in cards
export function ProcessFlowInline({ process }: { process: UseCaseBusinessProcess }) {
  const stepCount = process.affectedSteps?.length || 0
  const painPointCount = process.currentPainPoints?.length || 0

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="gap-1">
        <Lightning size={12} weight="fill" />
        {process.processName}
      </Badge>
      <span className="text-muted-foreground">
        {stepCount} steps
        {painPointCount > 0 && (
          <span className="text-amber-600 ml-2">
            <Warning size={10} weight="fill" className="inline mr-0.5" />
            {painPointCount} pain points
          </span>
        )}
      </span>
    </div>
  )
}
