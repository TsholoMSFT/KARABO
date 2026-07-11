/**
 * Roadmap tab (Focus 1) — multi-horizon transformation roadmap tying objectives
 * to the prioritised use-case pipeline.
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash, MapTrifold } from '@phosphor-icons/react'
import {
  buildDefaultRoadmap,
  createEmptyRoadmap,
  createRoadmapObjective,
  updatePhase,
} from '@/lib/roadmap-engine'
import { ROADMAP_HORIZON_LABELS } from '@/lib/fy27-types'
import type { TransformationRoadmap } from '@/lib/fy27-types'
import type { UseCase } from '@/lib/types'

export interface RoadmapTabProps {
  customerName: string
  accountId: string
  orderedUseCases: UseCase[]
  roadmap?: TransformationRoadmap
  onUpsert: (r: TransformationRoadmap) => void
}

export function RoadmapTab({ customerName, accountId, orderedUseCases, roadmap, onUpsert }: RoadmapTabProps) {
  if (!roadmap) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <MapTrifold className="mx-auto text-4xl text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No transformation roadmap yet. Generate a starter roadmap from the prioritised
            pipeline, or start from an empty three-horizon plan.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => onUpsert(buildDefaultRoadmap(customerName, orderedUseCases, accountId))}
              disabled={orderedUseCases.length === 0}
            >
              Generate from pipeline
            </Button>
            <Button variant="outline" onClick={() => onUpsert(createEmptyRoadmap(customerName, accountId))}>
              Create empty
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const addObjective = (phaseId: string, title: string) => {
    if (!title.trim()) return
    onUpsert(updatePhase(roadmap, phaseId, (p) => ({ ...p, objectives: [...p.objectives, createRoadmapObjective(title.trim())] })))
  }

  const removeObjective = (phaseId: string, objId: string) => {
    onUpsert(updatePhase(roadmap, phaseId, (p) => ({ ...p, objectives: p.objectives.filter((o) => o.id !== objId) })))
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roadmap.phases.map((phase) => (
        <Card key={phase.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{phase.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{ROADMAP_HORIZON_LABELS[phase.horizon]}</p>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            <div className="space-y-1.5">
              {phase.objectives.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No objectives yet.</p>
              )}
              {phase.objectives.map((o) => (
                <div key={o.id} className="flex items-start justify-between gap-2 rounded-md border px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{o.title}</p>
                    {o.linkedUseCaseIds.length > 0 && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">{o.linkedUseCaseIds.length} use case(s)</Badge>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeObjective(phase.id, o.id)}>
                    <Trash className="text-xs" />
                  </Button>
                </div>
              ))}
            </div>
            <ObjectiveAdder onAdd={(title) => addObjective(phase.id, title)} />
            {phase.milestones.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-medium text-muted-foreground mb-1">Milestones</div>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                  {phase.milestones.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ObjectiveAdder({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-1.5">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(value); setValue('') } }}
        placeholder="Add objective"
        className="h-8 text-xs"
      />
      <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => { onAdd(value); setValue('') }}>
        <Plus />
      </Button>
    </div>
  )
}
