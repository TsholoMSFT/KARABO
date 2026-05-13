import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash } from '@phosphor-icons/react'
import type { ProcessStep, ProcessFrequency } from '@/lib/duce-types'

interface ProcessMappingTableProps {
  steps: ProcessStep[]
  onChange: (next: ProcessStep[]) => void
}

const FREQ: ProcessFrequency[] = ['continuous', 'hourly', 'daily', 'weekly', 'monthly', 'ad-hoc']

const newStep = (): ProcessStep => ({
  id: `ps-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  task: '',
  frequency: 'daily',
})

export function ProcessMappingTable({ steps, onChange }: ProcessMappingTableProps) {
  const update = (id: string, patch: Partial<ProcessStep>) =>
    onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const remove = (id: string) => onChange(steps.filter((s) => s.id !== id))
  const add = () => onChange([...steps, newStep()])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current-State Process Map</CardTitle>
        <CardDescription>
          Map the steps of the target business process. Pain points and frequencies feed problem quantification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Pain</TableHead>
                <TableHead>Freq.</TableHead>
                <TableHead>Min/exec</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <Input value={s.task} onChange={(e) => update(s.id, { task: e.target.value })} placeholder="Task" />
                  </TableCell>
                  <TableCell>
                    <Input value={s.owner ?? ''} onChange={(e) => update(s.id, { owner: e.target.value })} placeholder="Role" />
                  </TableCell>
                  <TableCell>
                    <Input value={s.system ?? ''} onChange={(e) => update(s.id, { system: e.target.value })} placeholder="System" />
                  </TableCell>
                  <TableCell>
                    <Input value={s.painPoint ?? ''} onChange={(e) => update(s.id, { painPoint: e.target.value })} placeholder="Pain point" />
                  </TableCell>
                  <TableCell>
                    <Select value={s.frequency ?? 'daily'} onValueChange={(v) => update(s.id, { frequency: v as ProcessFrequency })}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQ.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={s.durationMinutes ?? ''}
                      onChange={(e) => update(s.id, { durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button onClick={add} variant="outline" className="w-full mt-3">
          <Plus className="h-4 w-4 mr-1" /> Add step
        </Button>
      </CardContent>
    </Card>
  )
}
