import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SkipForward } from 'lucide-react'

interface SkipForNowButtonProps {
  onSkip: () => void
  sectionName?: string
  disabled?: boolean
}

export function SkipForNowButton({ onSkip, sectionName, disabled = false }: SkipForNowButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkip}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <SkipForward className="h-4 w-4" />
            Skip for Now
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            {sectionName 
              ? `Skip "${sectionName}" and complete it later. You can return to this section before finalizing.`
              : 'Skip this section and complete it later. You can return before finalizing.'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
