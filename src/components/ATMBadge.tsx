/**
 * ATMBadge — Compact tier badge for use case cards
 * 
 * Shows the ATM qualification tier with score and confidence indicator.
 * Designed to sit alongside existing badges (data source, regulatory risk).
 */

import { ATMScore, ATM_TIER_CONFIG } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ATMBadgeProps {
  atmScore: ATMScore
  size?: 'sm' | 'md'
  showScore?: boolean
  className?: string
}

export function ATMBadge({ atmScore, size = 'sm', showScore = true, className = '' }: ATMBadgeProps) {
  const tier = ATM_TIER_CONFIG[atmScore.tier]
  const isInsufficient = atmScore.tier === 'insufficient-data'

  const badgeClasses = size === 'sm'
    ? `text-[10px] px-1.5 py-0 border ${tier.borderColor} ${tier.bgColor} ${tier.color}`
    : `text-xs px-2 py-0.5 border ${tier.borderColor} ${tier.bgColor} ${tier.color}`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${badgeClasses} cursor-help select-none ${className}`}
          >
            <span className="mr-1">{tier.icon}</span>
            {isInsufficient ? (
              'ATM: Incomplete'
            ) : (
              <>
                ATM: {tier.label}
                {showScore && (
                  <span className="ml-1 opacity-70">
                    {Math.round(atmScore.compositeScore)}
                  </span>
                )}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs p-3 space-y-2"
        >
          <div className="font-semibold text-sm">{tier.label}</div>
          <p className="text-xs text-muted-foreground">{tier.description}</p>

          {!isInsufficient && (
            <>
              {/* Dimension mini-bars */}
              <div className="space-y-1 pt-1">
                {atmScore.dimensions.map((dim) => (
                  <div key={dim.dimension} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-24 truncate">
                      {dim.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${dim.normalizedScore}%`,
                          backgroundColor: getBarColor(dim.normalizedScore),
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right">
                      {Math.round(dim.normalizedScore)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pillar coverage */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">Pillars:</span>
                {(['ai', 'apps', 'data'] as const).map((p) => (
                  <span
                    key={p}
                    className={`text-[10px] px-1 rounded ${
                      atmScore.pillarsCovered.includes(p)
                        ? 'bg-accent/20 text-accent-foreground font-medium'
                        : 'text-muted-foreground/50 line-through'
                    }`}
                  >
                    {p.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Confidence note */}
              <p className="text-[10px] text-muted-foreground/70 italic pt-0.5">
                Confidence: {Math.round(atmScore.confidence * 100)}% of components assessed
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Map score 0-100 to a color for the mini-bars */
function getBarColor(score: number): string {
  if (score >= 80) return 'oklch(0.72 0.18 295)'  // purple
  if (score >= 60) return 'oklch(0.75 0.16 80)'   // amber
  if (score >= 40) return 'oklch(0.65 0.08 250)'  // slate-blue
  return 'oklch(0.55 0.06 250)'                    // muted
}
