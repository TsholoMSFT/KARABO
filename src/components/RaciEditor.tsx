import type { CustomerStakeholder, RaciAssignment, RaciRole } from '@/lib/types'
import { validateRaci } from '@/lib/qualification'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RaciEditorProps {
  stakeholders: CustomerStakeholder[]
  value: RaciAssignment[]
  onChange: (assignments: RaciAssignment[]) => void
}

const ROLE_LABELS: Record<RaciRole, string> = {
  responsible: 'Responsible',
  accountable: 'Accountable',
  consulted: 'Consulted',
  informed: 'Informed',
}

export function RaciEditor({ stakeholders, value, onChange }: RaciEditorProps) {
  const validation = validateRaci(value)

  const assign = (stakeholderId: string, selectedRole: string) => {
    let next = value.filter((assignment) => assignment.stakeholderId !== stakeholderId)
    if (selectedRole === 'unassigned') {
      onChange(next)
      return
    }

    const role = selectedRole as RaciRole
    if (role === 'accountable') {
      next = next.filter((assignment) => assignment.role !== 'accountable')
    }
    onChange([...next, { stakeholderId, role }])
  }

  return (
    <section className="space-y-3" aria-labelledby="raci-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="raci-heading" className="text-sm font-medium">RACI ownership</h3>
          <p className="text-xs text-muted-foreground">Assign delivery roles from the customer stakeholder map.</p>
        </div>
        <Badge variant="outline">{value.length} assigned</Badge>
      </div>

      {stakeholders.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Add customer stakeholders before assigning RACI roles.
        </p>
      ) : (
        <div className="divide-y rounded-md border">
          {stakeholders.map((stakeholder) => {
            const assignment = value.find((item) => item.stakeholderId === stakeholder.id)
            return (
              <div key={stakeholder.id} className="grid items-center gap-2 p-3 sm:grid-cols-[1fr_220px]">
                <div>
                  <Label>{stakeholder.name}</Label>
                  <p className="text-xs text-muted-foreground">{stakeholder.role}{stakeholder.department ? ` · ${stakeholder.department}` : ''}</p>
                </div>
                <Select value={assignment?.role ?? 'unassigned'} onValueChange={(role) => assign(stakeholder.id, role)}>
                  <SelectTrigger aria-label={`RACI role for ${stakeholder.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Not assigned</SelectItem>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => <SelectItem key={role} value={role}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="text-xs text-amber-700 dark:text-amber-300">
          {validation.warnings.join(' ')} These are advisory and do not block saving.
        </div>
      )}
    </section>
  )
}