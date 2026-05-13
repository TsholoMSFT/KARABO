import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { DecisionLogEntry } from '@/lib/duce-types'
import { DISPOSITION_COLORS, DISPOSITION_LABELS } from '@/lib/decision-engine'

interface DecisionLogProps {
  entries: DecisionLogEntry[]
  emptyMessage?: string
}

export function DecisionLog({ entries, emptyMessage = 'No decisions logged yet.' }: DecisionLogProps) {
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Log</CardTitle>
        <CardDescription>
          Append-only audit trail of dispositions, rationale, and overrides.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <ul className="space-y-3">
              {sorted.map((e) => (
                <li key={e.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{e.decision}</div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(e.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.rationale}</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {e.systemRecommendation && (
                      <Badge variant="outline" className={`text-[10px] ${DISPOSITION_COLORS[e.systemRecommendation]}`}>
                        System: {DISPOSITION_LABELS[e.systemRecommendation]}
                      </Badge>
                    )}
                    {e.finalDisposition && (
                      <Badge variant="outline" className={`text-[10px] ${DISPOSITION_COLORS[e.finalDisposition]}`}>
                        Final: {DISPOSITION_LABELS[e.finalDisposition]}
                      </Badge>
                    )}
                    {e.overridden && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300">
                        Overridden
                      </Badge>
                    )}
                    {e.decidedBy && <span className="text-[10px] text-muted-foreground">by {e.decidedBy}</span>}
                  </div>
                  {e.evidence?.length ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Evidence ({e.evidence.length})</summary>
                      <ul className="list-disc list-inside mt-1 text-muted-foreground">
                        {e.evidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
