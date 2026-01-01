import { Check, Circle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { StageStatus } from '@/lib/types'

interface Stage {
  id: number
  name: string
  status: StageStatus
}

interface StageNavigatorProps {
  stages: Stage[]
  currentStageId: number
  onStageClick: (stageId: number) => void
}

const stageNames = [
  'START',
  'OPPORTUNITY',
  'RESOURCES',
  'DECISION PROCESS',
  'PRIORITISE',
  'SOLUTION SCOPE',
  'VALIDATE',
  'COMMIT',
  'COMMUNICATE',
]

export function StageNavigator({ stages, currentStageId, onStageClick }: StageNavigatorProps) {
  const progress = (stages.filter(s => s.status === 'completed').length / stages.length) * 100

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Discovery Progress</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-9 gap-1">
        {stages.map((stage) => {
          const isCompleted = stage.status === 'completed'
          const isCurrent = stage.id === currentStageId
          const isLocked = stage.status === 'not-started' && stage.id > currentStageId + 1
          const canClick = isCompleted || isCurrent || stage.id <= currentStageId

          return (
            <button
              key={stage.id}
              onClick={() => canClick && onStageClick(stage.id)}
              disabled={!canClick}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                isCurrent && 'border-primary bg-primary/10',
                isCompleted && 'border-green-500 bg-green-50',
                !isCurrent && !isCompleted && canClick && 'border-muted hover:border-primary/50',
                isLocked && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-green-500 text-white',
                  !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : stage.id}
              </div>
              <span className={cn('text-xs font-medium text-center leading-tight', isCurrent && 'text-primary')}>
                {stageNames[stage.id]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
