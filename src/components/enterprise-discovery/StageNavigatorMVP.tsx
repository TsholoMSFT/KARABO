/**
 * MVP 5-Stage Navigator
 * 
 * A streamlined stage navigator for the consolidated 5-stage workflow.
 */

import { Check, Circle, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { StageStatus } from '@/lib/types'

interface Stage {
  id: number
  name: string
  status: StageStatus
}

interface StageNavigatorMVPProps {
  stages: Stage[]
  currentStageId: number
  onStageClick: (stageId: number) => void
}

const MVP_STAGE_NAMES = [
  'START',
  'OPPORTUNITY & RESOURCES',
  'DECISION PROCESS',
  'SOLUTION SCOPE',
  'COMMIT & COMMUNICATE',
]

const MVP_STAGE_SHORT_NAMES = [
  'Start',
  'Opportunity',
  'Decision',
  'Solution',
  'Commit',
]

const MVP_STAGE_DESCRIPTIONS = [
  'Session setup and discovery type',
  'Problem, desired outcome, COI, and resources',
  'Stakeholders, criteria, and process mechanics',
  'Value drivers, RICE scoring, and financials',
  'Relationship assessment and executive summary',
]

export function StageNavigatorMVP({ stages, currentStageId, onStageClick }: StageNavigatorMVPProps) {
  const completedStages = stages.filter(s => s.status === 'completed').length
  const progress = (completedStages / stages.length) * 100

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Discovery Progress</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
              <Sparkles className="h-2.5 w-2.5" />
              5-Stage MVP
            </span>
          </div>
          <span className="text-muted-foreground">
            {completedStages}/{stages.length} • {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-5 gap-2">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed'
            const isCurrent = stage.id === currentStageId
            const isLocked = stage.status === 'not-started' && stage.id > currentStageId + 1
            const canClick = isCompleted || isCurrent || stage.id <= currentStageId

            return (
              <Tooltip key={stage.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => canClick && onStageClick(stage.id)}
                    disabled={!canClick}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      isCurrent && 'border-[#0078D4] bg-[#0078D4]/10 shadow-md',
                      isCompleted && 'border-green-500 bg-green-50',
                      !isCurrent && !isCompleted && canClick && 'border-muted hover:border-[#0078D4]/50',
                      isLocked && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                        isCurrent && 'bg-[#0078D4] text-white shadow-sm',
                        isCompleted && 'bg-green-500 text-white',
                        !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        stage.id
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium text-center leading-tight',
                        isCurrent && 'text-[#0078D4]',
                        isCompleted && 'text-green-700'
                      )}
                    >
                      {MVP_STAGE_SHORT_NAMES[stage.id]}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{MVP_STAGE_NAMES[stage.id]}</p>
                    <p className="text-xs text-muted-foreground">{MVP_STAGE_DESCRIPTIONS[stage.id]}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
