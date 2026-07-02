import { UseCase } from '@/lib/types'
import { getQuadrant, getScoreColor } from '@/lib/scoring'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CaretDown, CaretUp, TreeStructure, Warning } from '@phosphor-icons/react'
import { useState } from 'react'

/** Optional blueprint-derived signals keyed by `UseCase.id`. */
export interface BlueprintSignal {
  /** 0–1. Fraction of components reused from the customer estate. */
  reuseRatio: number
  /** Number of capability gaps in the chosen blueprint. */
  gapCount: number
}

interface PrioritizationMatrixProps {
  useCases: UseCase[]
  selectedId?: string
  onSelectUseCase: (id: string) => void
  showDescription: boolean
  onToggleDescription: () => void
  /** Optional per-use-case blueprint signals (reuse %, gap count). */
  blueprintSignals?: Map<string, BlueprintSignal>
}

export function PrioritizationMatrix({
  useCases,
  selectedId,
  onSelectUseCase,
  showDescription,
  onToggleDescription,
  blueprintSignals,
}: PrioritizationMatrixProps) {
  const size = 400
  const padding = 40
  const [feasibilityAdjusted, setFeasibilityAdjusted] = useState(false)

  const scaleX = (feasibility: number) => padding + ((feasibility - 1) / 9) * (size - padding * 2)
  const scaleY = (impact: number) => size - padding - ((impact - 1) / 9) * (size - padding * 2)

  /**
   * Effective feasibility: when the toggle is on, reusing existing estate
   * services boosts feasibility by up to +2 (full reuse) and unresolved
   * capability gaps subtract 0.5 each (capped at -2).
   */
  const effectiveFeasibility = (uc: UseCase): number => {
    if (!feasibilityAdjusted) return uc.feasibility
    const sig = blueprintSignals?.get(uc.id)
    if (!sig) return uc.feasibility
    const reuseBoost = sig.reuseRatio * 2
    const gapPenalty = Math.min(sig.gapCount * 0.5, 2)
    return Math.max(1, Math.min(10, uc.feasibility + reuseBoost - gapPenalty))
  }

  const hasAnySignals = !!blueprintSignals && blueprintSignals.size > 0

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
            const fx = effectiveFeasibility(useCase)
            const cx = scaleX(fx)
            const cy = scaleY(useCase.impact)
            if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null
            const isSelected = useCase.id === selectedId
            const sig = blueprintSignals?.get(useCase.id)
            const tooltipExtra = sig
              ? `\nBlueprint: ${Math.round(sig.reuseRatio * 100)}% reuse · ${sig.gapCount} gap${sig.gapCount === 1 ? '' : 's'}${
                  feasibilityAdjusted ? `\nFeasibility adjusted: ${useCase.feasibility} → ${fx.toFixed(1)}` : ''
                }`
              : ''

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
                    fill: getScoreColor(useCase.impact, fx),
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
                    fill: { duration: 0.3 },
                  }}
                  style={{ filter: isSelected ? 'drop-shadow(0 0 8px oklch(0.65 0.20 310 / 0.5))' : 'none' }}
                />
                {sig && sig.gapCount > 0 && (
                  <circle cx={cx + 7} cy={cy - 7} r={3} fill="oklch(0.65 0.22 25)" stroke="white" strokeWidth={1} pointerEvents="none" />
                )}
                <title>{`${useCase.title}\nImpact: ${useCase.impact}/10 · Feasibility: ${useCase.feasibility}/10\nScore: ${useCase.impact * useCase.feasibility} · Quadrant: ${getQuadrant(useCase.impact, fx)}${tooltipExtra}`}</title>
              </motion.g>
            )
          })}
        </svg>
      </div>

      {hasAnySignals && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="feas-adjust" checked={feasibilityAdjusted} onCheckedChange={setFeasibilityAdjusted} />
              <Label htmlFor="feas-adjust" className="cursor-pointer">
                Feasibility-adjusted by blueprint
              </Label>
            </div>
            <Badge variant="outline" className="gap-1">
              <TreeStructure size={12} />
              {blueprintSignals!.size} with blueprint
            </Badge>
            {Array.from(blueprintSignals!.values()).some(s => s.gapCount > 0) && (
              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                <Warning size={12} />
                gaps present
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Dot color legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground px-1">
        <span className="font-medium text-foreground/70">Dot color (Impact × Feasibility):</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[oklch(0.58_0.18_195)]" />
          ≥ 70 (Strong)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[oklch(0.60_0.18_250)]" />
          40–69 (Moderate)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[oklch(0.65_0.20_310)]" />
          20–39 (Low)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[oklch(0.55_0.15_270)]" />
          &lt; 20 (Minimal)
        </span>
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
