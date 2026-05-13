import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AI_FIT_DESCRIPTIONS, AI_FIT_LABELS, type AIFitCategory } from '@/lib/duce-types'

const COLORS: Record<AIFitCategory, string> = {
  automation: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  copilot: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  predictive: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  agentic: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
}

interface AIFitChipProps {
  fit: AIFitCategory
  size?: 'sm' | 'md'
  className?: string
}

export function AIFitChip({ fit, size = 'sm', className = '' }: AIFitChipProps) {
  const cls = size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${cls} border ${COLORS[fit]} cursor-help select-none ${className}`}>
            {AI_FIT_LABELS[fit]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{AI_FIT_DESCRIPTIONS[fit]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
