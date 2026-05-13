import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash, TrendUp } from '@phosphor-icons/react'
import { useMemo } from 'react'
import type { QuantifiedProblem } from '@/lib/duce-types'
import { rankProblems, computeProblemAnnualImpact } from '@/lib/decision-engine'

interface ProblemQuantificationStepProps {
  problems: QuantifiedProblem[]
  onChange: (next: QuantifiedProblem[]) => void
}

const newProblem = (): QuantifiedProblem => ({
  id: `prb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  problem: '',
  occurrencesPerMonth: 1,
  severity: 'medium',
})

const fmtUSD = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`

export function ProblemQuantificationStep({ problems, onChange }: ProblemQuantificationStepProps) {
  const ranked = useMemo(() => rankProblems(problems), [problems])
  const totalAnnualImpact = useMemo(
    () => ranked.reduce((sum, p) => sum + (p.computedAnnualImpact ?? 0), 0),
    [ranked]
  )

  const update = (id: string, patch: Partial<QuantifiedProblem>) =>
    onChange(problems.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => onChange(problems.filter((p) => p.id !== id))
  const add = () => onChange([...problems, newProblem()])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Quantified Problems</CardTitle>
            <CardDescription>
              Capture pain points with cost and time impact. Items rank by computed annualised impact.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendUp className="h-3.5 w-3.5" />
            Total: {fmtUSD(totalAnnualImpact)} / yr
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranked.map((p, idx) => {
          const impact = p.computedAnnualImpact ?? computeProblemAnnualImpact(p)
          return (
            <div key={p.id} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">#{idx + 1}</Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {fmtUSD(impact)} / yr
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                rows={2}
                value={p.problem}
                onChange={(e) => update(p.id, { problem: e.target.value })}
                placeholder="Describe the problem (e.g. Manual reconciliation of trade exceptions)"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Hrs / occurrence</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.25}
                    value={p.timeImpactHrsPerOccurrence ?? ''}
                    onChange={(e) =>
                      update(p.id, { timeImpactHrsPerOccurrence: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">$ / occurrence</label>
                  <Input
                    type="number"
                    min={0}
                    value={p.costPerOccurrence ?? ''}
                    onChange={(e) =>
                      update(p.id, { costPerOccurrence: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Per month</label>
                  <Input
                    type="number"
                    min={0}
                    value={p.occurrencesPerMonth ?? ''}
                    onChange={(e) =>
                      update(p.id, { occurrencesPerMonth: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Severity</label>
                  <Select
                    value={p.severity ?? 'medium'}
                    onValueChange={(v) => update(p.id, { severity: v as QuantifiedProblem['severity'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="serious">Serious</SelectItem>
                      <SelectItem value="deal-breaker">Deal-breaker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )
        })}
        <Button onClick={add} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add problem
        </Button>
      </CardContent>
    </Card>
  )
}
