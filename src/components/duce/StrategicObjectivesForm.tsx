import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash } from '@phosphor-icons/react'
import type { BusinessObjective } from '@/lib/duce-types'

interface StrategicObjectivesFormProps {
  objectives: BusinessObjective[]
  onChange: (next: BusinessObjective[]) => void
  participantMode?: boolean
}

const newObjective = (): BusinessObjective => ({
  id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  statement: '',
  horizon: 'mid',
  linkedKpiIds: [],
})

export function StrategicObjectivesForm({ objectives, onChange, participantMode }: StrategicObjectivesFormProps) {
  const update = (id: string, patch: Partial<BusinessObjective>) =>
    onChange(objectives.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  const remove = (id: string) => onChange(objectives.filter((o) => o.id !== id))
  const add = () => onChange([...objectives, newObjective()])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Strategic Business Objectives</CardTitle>
            <CardDescription>
              Capture the top 3–5 outcomes the engagement must drive toward. Bind each to a measurable KPI.
            </CardDescription>
          </div>
          <Badge variant="outline">{objectives.length} objective{objectives.length === 1 ? '' : 's'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {objectives.map((o, idx) => (
          <div key={o.id} className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Objective {idx + 1}
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(o.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              value={o.statement}
              onChange={(e) => update(o.id, { statement: e.target.value })}
              placeholder="e.g. Reduce customer onboarding time by 50% within 18 months"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={o.horizon} onValueChange={(v) => update(o.id, { horizon: v as BusinessObjective['horizon'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Time horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (&lt;12 months)</SelectItem>
                  <SelectItem value="mid">Mid (12–36 months)</SelectItem>
                  <SelectItem value="long">Long (36+ months)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={o.ownerRole ?? ''}
                onChange={(e) => update(o.id, { ownerRole: e.target.value })}
                placeholder="Accountable role (e.g. CFO)"
              />
              <Input
                value={(o.linkedKpiIds ?? []).join(', ')}
                onChange={(e) =>
                  update(o.id, {
                    linkedKpiIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="KPIs (comma-separated)"
              />
            </div>
            {!participantMode && (
              <Textarea
                rows={1}
                value={o.notes ?? ''}
                onChange={(e) => update(o.id, { notes: e.target.value })}
                placeholder="Notes / context"
                className="text-sm"
              />
            )}
          </div>
        ))}
        <Button onClick={add} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add objective
        </Button>
      </CardContent>
    </Card>
  )
}
