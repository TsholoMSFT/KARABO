import { UseCase } from '@/lib/types'
import { getQuadrant, getScoreColor } from '@/lib/scoring'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { CaretDown, CaretUp } from '@phosphor-icons/react'

interface PrioritizationMatrixProps {
  useCases: UseCase[]
  selectedId?: string
  onSelectUseCase: (id: string) => void
  showDescription: boolean
  onToggleDescription: () => void
}

export function PrioritizationMatrix({
  useCases,
  selectedId,
  onSelectUseCase,
  showDescription,
  onToggleDescription,
}: PrioritizationMatrixProps) {
  const size = 400
  const padding = 40

  const scaleX = (feasibility: number) => padding + ((feasibility - 1) / 9) * (size - padding * 2)
  const scaleY = (impact: number) => size - padding - ((impact - 1) / 9) * (size - padding * 2)

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-2xl mx-auto">
        <svg
          width="100%"
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="bg-card rounded-lg border border-border shadow-sm"
        >
          <rect x={padding} y={padding} width={size / 2 - padding} height={size / 2 - padding} fill="oklch(0.65 0.20 310)" opacity="0.25" />
          <rect x={size / 2} y={padding} width={size / 2 - padding} height={size / 2 - padding} fill="oklch(0.58 0.18 195)" opacity="0.35" />
          <rect x={padding} y={size / 2} width={size / 2 - padding} height={size / 2 - padding} fill="oklch(0.90 0.08 27)" opacity="0.15" />
          <rect x={size / 2} y={size / 2} width={size / 2 - padding} height={size / 2 - padding} fill="oklch(0.70 0.15 270)" opacity="0.2" />

          <text
            x={size / 4 + padding / 2}
            y={size / 4 + padding / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-medium font-[Space_Grotesk]"
          >
            Strategic Bets
          </text>
          <text
            x={(size * 3) / 4 - padding / 2}
            y={size / 4 + padding / 2}
            textAnchor="middle"
            className="fill-accent-foreground text-xs font-semibold font-[Space_Grotesk]"
          >
            Quick Wins
          </text>
          <text
            x={size / 4 + padding / 2}
            y={(size * 3) / 4 - padding / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-medium font-[Space_Grotesk]"
          >
            Time Sinks
          </text>
          <text
            x={(size * 3) / 4 - padding / 2}
            y={(size * 3) / 4 - padding / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-medium font-[Space_Grotesk]"
          >
            Fill-ins
          </text>

          <line
            x1={size / 2}
            y1={padding}
            x2={size / 2}
            y2={size - padding}
            stroke="oklch(0.85 0.01 240)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1={padding}
            y1={size / 2}
            x2={size - padding}
            y2={size / 2}
            stroke="oklch(0.85 0.01 240)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          <line x1={padding} y1={size - padding} x2={size - padding} y2={size - padding} stroke="oklch(0.40 0.01 240)" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={size - padding} stroke="oklch(0.40 0.01 240)" strokeWidth="2" />

          <text
            x={size / 2}
            y={size - 10}
            textAnchor="middle"
            className="fill-foreground text-xs font-semibold font-[Space_Grotesk]"
          >
            Feasibility
          </text>
          <text
            x={20}
            y={size / 2}
            textAnchor="middle"
            className="fill-foreground text-xs font-semibold font-[Space_Grotesk]"
            transform={`rotate(-90, 20, ${size / 2})`}
          >
            Impact
          </text>

          {useCases.map((useCase) => {
            const cx = scaleX(useCase.feasibility)
            const cy = scaleY(useCase.impact)
            const isSelected = useCase.id === selectedId

            return (
              <motion.g
                key={useCase.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 10 : 8}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelectUseCase(useCase.id)}
                  initial={false}
                  animate={{
                    fill: getScoreColor(useCase.impact, useCase.feasibility),
                    stroke: isSelected ? 'oklch(0.65 0.20 310)' : 'white',
                    strokeWidth: isSelected ? 3 : 2,
                    cx,
                    cy,
                  }}
                  whileHover={{ scale: 1.3 }}
                  transition={{ 
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    fill: { duration: 0.3 }
                  }}
                  style={{ filter: isSelected ? 'drop-shadow(0 0 8px oklch(0.65 0.20 310 / 0.5))' : 'none' }}
                />
                <title>{useCase.title}</title>
              </motion.g>
            )
          })}
        </svg>
      </div>

      <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
        <button
          onClick={onToggleDescription}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">Understanding the Quadrants</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {showDescription ? 'Click to hide quadrant details' : 'Click to learn about each quadrant'}
            </p>
          </div>
          {showDescription ? (
            <CaretUp size={20} className="text-foreground flex-shrink-0" />
          ) : (
            <CaretDown size={20} className="text-foreground flex-shrink-0" />
          )}
        </button>
        
        <AnimatePresence>
          {showDescription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-sm mt-0.5 flex-shrink-0 bg-[oklch(0.58_0.18_195_/_0.35)]" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">Quick Wins (Top Right)</p>
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">High impact, high feasibility.</span> These are your best opportunities - 
                        they deliver significant value and are relatively easy to implement. Start here to build momentum 
                        and demonstrate quick ROI.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-sm mt-0.5 flex-shrink-0 bg-[oklch(0.65_0.20_310_/_0.25)]" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">Strategic Bets (Top Left)</p>
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">High impact, lower feasibility.</span> Game-changing opportunities 
                        that require significant investment or face technical challenges. Tackle these after Quick Wins when you have 
                        resources and stakeholder buy-in.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-sm mt-0.5 flex-shrink-0 bg-[oklch(0.70_0.15_270_/_0.2)]" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">Fill-ins (Bottom Right)</p>
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Lower impact, high feasibility.</span> Low-hanging fruit that's 
                        easy to implement but won't move the needle much. Good for filling spare capacity or building team skills, 
                        but don't let these distract from higher-impact work.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-sm bg-destructive/20 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">Time Sinks (Bottom Left)</p>
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Lower impact, lower feasibility.</span> Difficult to implement 
                        with minimal payoff. Avoid these entirely unless there's a compelling reason. These drain resources without 
                        delivering meaningful results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
