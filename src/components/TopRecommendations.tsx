import type { UseCase, ScoringMethod } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, TrendUp, Lightning, Calculator, CurrencyDollar } from '@phosphor-icons/react'
import { calculateFinancialImpactScore, calculateRICEScore, getQuadrant } from '@/lib/scoring'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface TopRecommendationsProps {
  topUseCases: UseCase[]
  scoringMethod: ScoringMethod
  onSelectUseCase: (id: string) => void
}

export function TopRecommendations({
  topUseCases,
  scoringMethod,
  onSelectUseCase,
}: TopRecommendationsProps) {
  // Calculate aggregate financial impact
  const financialSummary = useMemo(() => {
    const withCOI = topUseCases.filter(uc => uc.costOfInaction?.totalAnnualCOI)
    const withEV = topUseCases.filter(uc => uc.expectedValue?.totalAnnualValue)
    const totalCOI = withCOI.reduce((sum, uc) => sum + (uc.costOfInaction?.totalAnnualCOI || 0), 0)
    const totalEV = withEV.reduce((sum, uc) => sum + (uc.expectedValue?.totalAnnualValue || 0), 0)
    return { totalCOI, totalEV, hasCOI: totalCOI > 0, hasEV: totalEV > 0 }
  }, [topUseCases])

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  if (topUseCases.length === 0) return null

  return (
    <motion.div
      key={scoringMethod}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="p-6 bg-gradient-to-br from-accent/10 via-background to-background border-accent/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-accent" />
            <h2 className="text-xl font-bold text-foreground">Top Recommendations</h2>
          </div>
          
          {/* Financial Impact Summary */}
          {(financialSummary.hasCOI || financialSummary.hasEV) && (
            <div className="flex items-center gap-3">
              {financialSummary.hasCOI && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                  <Calculator size={14} className="text-red-500" />
                  <span className="text-xs text-muted-foreground">COI:</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(financialSummary.totalCOI)}/yr</span>
                </div>
              )}
              {financialSummary.hasEV && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                  <TrendUp size={14} className="text-green-500" />
                  <span className="text-xs text-muted-foreground">Value:</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(financialSummary.totalEV)}/yr</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {topUseCases.map((useCase, index) => {
            const score = scoringMethod === 'rice'
              ? calculateRICEScore(useCase)
              : scoringMethod === 'impact-feasibility'
                ? useCase.impact * useCase.feasibility
                : calculateFinancialImpactScore(useCase)

            const quadrant = getQuadrant(useCase.impact, useCase.feasibility)
            const isQuickWin = quadrant === 'Quick Wins'
            const scoreLabel = scoringMethod === 'rice' ? 'RICE' : scoringMethod === 'impact-feasibility' ? 'Score' : 'Impact'

            return (
              <motion.div
                key={useCase.id}
                layoutId={`top-${useCase.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  layout: { type: 'spring', stiffness: 350, damping: 35, mass: 0.8 },
                  default: { delay: index * 0.08, duration: 0.4 }
                }}
                onClick={() => onSelectUseCase(useCase.id)}
                className="cursor-pointer"
              >
                <motion.div
                  animate={{
                    borderColor: 'oklch(0.40 0.02 240)',
                  }}
                  whileHover={{
                    borderColor: 'oklch(0.70 0.22 330 / 0.5)',
                    scale: 1.02,
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:shadow-md"
                >
                <motion.div 
                  className="flex-shrink-0"
                  key={`rank-badge-${index}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 20,
                    delay: index * 0.05
                  }}
                >
                  <Badge className="bg-primary text-primary-foreground font-bold text-base w-8 h-8 flex items-center justify-center rounded-full">
                    {index + 1}
                  </Badge>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{useCase.title}</h3>
                    {isQuickWin && scoringMethod === 'impact-feasibility' && (
                      <Lightning size={16} weight="fill" className="text-accent flex-shrink-0" />
                    )}
                  </div>
                  {useCase.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {useCase.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendUp size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {scoreLabel}:
                      </span>
                      <motion.span
                        key={`top-score-${useCase.id}-${score}-${scoringMethod}`}
                        initial={{ scale: 1.2, color: 'oklch(0.58 0.18 195)' }}
                        animate={{ scale: 1, color: 'oklch(0.65 0.20 310)' }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index * 0.05,
                          scale: { type: 'spring', stiffness: 300, damping: 20 }
                        }}
                        className="font-bold tabular-nums"
                      >
                        {score.toFixed(1)}
                      </motion.span>
                    </div>
                    {scoringMethod === 'impact-feasibility' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Badge variant="outline" className="text-xs">
                          {quadrant}
                        </Badge>
                      </motion.div>
                    )}
                    {/* Per use case financial indicators */}
                    {useCase.costOfInaction?.totalAnnualCOI && (
                      <div className="flex items-center gap-1">
                        <Calculator size={12} className="text-red-500" />
                        <span className="text-red-600 font-medium tabular-nums">
                          {formatCurrency(useCase.costOfInaction.totalAnnualCOI)}
                        </span>
                      </div>
                    )}
                    {useCase.expectedValue?.totalAnnualValue && (
                      <div className="flex items-center gap-1">
                        <CurrencyDollar size={12} className="text-green-500" />
                        <span className="text-green-600 font-medium tabular-nums">
                          {formatCurrency(useCase.expectedValue.totalAnnualValue)}
                        </span>
                        {useCase.expectedValue.paybackMonths && (
                          <span className="text-muted-foreground">
                            ({useCase.expectedValue.paybackMonths}mo)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}
