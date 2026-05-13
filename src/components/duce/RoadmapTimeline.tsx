import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UseCase } from '@/lib/types'
import type { DUCEDisposition, RoadmapPlacement } from '@/lib/duce-types'
import { ROADMAP_LANE_LABELS } from '@/lib/duce-types'
import { placeOnRoadmap, DISPOSITION_COLORS, DISPOSITION_LABELS } from '@/lib/decision-engine'

interface RoadmapTimelineProps {
  useCases: UseCase[]
  dispositions: Record<string, DUCEDisposition>
  placements?: RoadmapPlacement[]
}

const LANE_ORDER: RoadmapPlacement['lane'][] = ['quick-wins', 'strategic-bets', 'fill-ins', 'deferred']
const LANE_BG: Record<RoadmapPlacement['lane'], string> = {
  'quick-wins': 'bg-emerald-500/5 border-emerald-500/30',
  'strategic-bets': 'bg-violet-500/5 border-violet-500/30',
  'fill-ins': 'bg-blue-500/5 border-blue-500/30',
  deferred: 'bg-slate-500/5 border-slate-500/30',
}

export function RoadmapTimeline({ useCases, dispositions, placements }: RoadmapTimelineProps) {
  const computed: RoadmapPlacement[] =
    placements && placements.length
      ? placements
      : useCases.map((uc) => placeOnRoadmap(uc, dispositions[uc.id]))

  const byLane = LANE_ORDER.map((lane) => ({
    lane,
    items: computed
      .filter((p) => p.lane === lane)
      .map((p) => ({ placement: p, useCase: useCases.find((uc) => uc.id === p.useCaseId) }))
      .filter((x) => x.useCase),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roadmap Lanes</CardTitle>
        <CardDescription>
          Auto-placement by impact / feasibility quadrant and disposition. Quick Wins → Q1, Strategic Bets → Q2, Fill-ins → Q3, Deferred → Q4.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {byLane.map(({ lane, items }) => (
            <div key={lane} className={`rounded-lg border p-3 space-y-2 ${LANE_BG[lane]}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{ROADMAP_LANE_LABELS[lane]}</h4>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              {items.length === 0 && <p className="text-xs text-muted-foreground italic">No items</p>}
              {items.map(({ placement, useCase }) => {
                const disp = dispositions[useCase!.id]
                return (
                  <div key={useCase!.id} className="rounded-md bg-card border p-2 space-y-1">
                    <div className="text-sm font-medium leading-tight">{useCase!.title}</div>
                    <div className="flex flex-wrap items-center gap-1">
                      {placement.quarter && (
                        <Badge variant="secondary" className="text-[10px]">{placement.quarter}</Badge>
                      )}
                      {disp && (
                        <Badge variant="outline" className={`text-[10px] ${DISPOSITION_COLORS[disp]}`}>
                          {DISPOSITION_LABELS[disp]}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        I{useCase!.impact}/F{useCase!.feasibility}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
