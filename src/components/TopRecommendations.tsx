import { UseCase } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, TrendUp, Lightning } from '@phosphor-icons/react'
import { calculateRICEScore, getQuadrant } from '@/lib/scoring'
import { motion } from 'framer-motion'

interface TopRecommendationsProps {
  topUseCases: UseCase[]
  scoringMethod: 'impact-feasibility' | 'rice'
  onSelectUseCase: (id: string) => void
}

export function TopRecommendations({
  topUseCases,
  scoringMethod,
  onSelectUseCase,
}: TopRecommendationsProps) {
  if (topUseCases.length === 0) return null

  return (
    <motion.div
      key={scoringMethod}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="p-6 bg-gradient-to-br from-accent/10 via-background to-background border-accent/30">
        <div className="flex items-center gap-2 mb-4">
          <Sparkle size={24} weight="fill" className="text-accent" />
          <h2 className="text-xl font-bold text-foreground">Top Recommendations</h2>
        </div>
        <div className="space-y-3">
          {topUseCases.map((useCase, index) => {
            const score =
              scoringMethod === 'rice'
                ? calculateRICEScore(useCase)
                : useCase.impact * useCase.feasibility
            const quadrant = getQuadrant(useCase.impact, useCase.feasibility)
            const isQuickWin = quadrant === 'Quick Wins'

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
                        {scoringMethod === 'rice' ? 'RICE' : 'Score'}:
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
