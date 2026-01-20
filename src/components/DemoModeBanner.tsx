import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Play, X, Info, HardHat, ShoppingCart, Bank } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

export type DemoIndustry = 'mining' | 'retail' | 'financial'

interface DemoModeBannerProps {
  demoIndustry: DemoIndustry
  onExitDemo: () => void
}

const industryConfig: Record<DemoIndustry, {
  name: string
  icon: React.ReactNode
  color: string
}> = {
  mining: {
    name: 'Zava Mining',
    icon: <HardHat size={18} weight="duotone" />,
    color: 'text-amber-600',
  },
  retail: {
    name: 'MegaMart Retail',
    icon: <ShoppingCart size={18} weight="duotone" />,
    color: 'text-green-600',
  },
  financial: {
    name: 'Contoso Financial',
    icon: <Bank size={18} weight="duotone" />,
    color: 'text-blue-600',
  },
}

export function DemoModeBanner({ demoIndustry, onExitDemo }: DemoModeBannerProps) {
  const config = industryConfig[demoIndustry]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-brand-orange/10 via-brand-orange/5 to-brand-orange/10 border-b border-brand-orange/30 shadow-sm backdrop-blur-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Left side - Demo indicator */}
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className="bg-brand-orange/10 text-brand-orange border-brand-orange/30 gap-1.5 font-medium"
            >
              <Play size={14} weight="fill" />
              Demo Mode
            </Badge>
            
            <div className="flex items-center gap-2">
              <span className={config.color}>{config.icon}</span>
              <span className="text-sm font-medium text-foreground">
                {config.name}
              </span>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="About demo mode"
                  >
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px]">
                  <p className="text-sm">
                    <strong>Demo Mode</strong> pre-fills forms with sample data from {config.name}. 
                    You can edit any values. Changes are not saved after you exit demo mode.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right side - Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitDemo}
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X size={16} />
            Exit Demo
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
