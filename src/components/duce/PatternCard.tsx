import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Plus } from '@phosphor-icons/react'
import type { ArchitecturePattern, PatternRecommendation } from '@/lib/duce-types'
import { PATTERN_CATEGORY_LABELS } from '@/lib/architecture-patterns'
import { AIFitChip } from './AIFitChip'

interface PatternCardProps {
  pattern: ArchitecturePattern
  selected?: boolean
  onToggle?: (id: string) => void
  recommendation?: PatternRecommendation
  compact?: boolean
}

export function PatternCard({ pattern, selected, onToggle, recommendation, compact }: PatternCardProps) {
  return (
    <Card className={`transition-colors ${selected ? 'border-primary ring-1 ring-primary/40' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base leading-snug">{pattern.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="secondary" className="text-[10px]">
                {PATTERN_CATEGORY_LABELS[pattern.category] ?? pattern.category}
              </Badge>
              {pattern.surfaces.map((s) => (
                <Badge key={s} variant="outline" className="text-[10px]">
                  {s}
                </Badge>
              ))}
              {pattern.aiFit.map((f) => (
                <AIFitChip key={f} fit={f} />
              ))}
              {recommendation && (
                <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30" variant="outline">
                  Match {recommendation.score}
                </Badge>
              )}
            </div>
          </div>
          {onToggle && (
            <Button
              size="sm"
              variant={selected ? 'default' : 'outline'}
              onClick={() => onToggle(pattern.id)}
            >
              {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <p className="text-sm text-muted-foreground">{pattern.summary}</p>
        {!compact && (
          <>
            <div className="text-xs">
              <div className="font-semibold mb-0.5">When to use</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {pattern.whenToUse.slice(0, 3).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="text-xs">
              <div className="font-semibold mb-0.5">Components</div>
              <div className="flex flex-wrap gap-1">
                {pattern.components.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px] font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            {pattern.effortWeeksRange && (
              <div className="text-xs text-muted-foreground">
                Indicative effort: <strong>{pattern.effortWeeksRange[0]}–{pattern.effortWeeksRange[1]} weeks</strong>
              </div>
            )}
            {recommendation?.matchedSignals.length ? (
              <div className="text-xs">
                <div className="font-semibold mb-0.5 text-primary">Why recommended</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {recommendation.matchedSignals.slice(0, 4).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {recommendation?.cautions.length ? (
              <div className="text-xs">
                <div className="font-semibold mb-0.5 text-amber-600 dark:text-amber-400">Cautions</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {recommendation.cautions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
