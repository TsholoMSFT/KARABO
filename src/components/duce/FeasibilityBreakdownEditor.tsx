import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FeasibilityBreakdown } from '@/lib/duce-types'

interface FeasibilityBreakdownEditorProps {
  value: FeasibilityBreakdown
  onChange: (next: FeasibilityBreakdown) => void
  disabled?: boolean
}

const FIELDS: { key: keyof Omit<FeasibilityBreakdown, 'notes'>; label: string; lowLabel: string; highLabel: string }[] = [
  { key: 'dataReadiness', label: 'Data Readiness', lowLabel: 'No data', highLabel: 'Production-grade' },
  { key: 'technicalComplexity', label: 'Technical Complexity', lowLabel: 'Trivial', highLabel: 'Bleeding edge' },
  { key: 'integrationRisk', label: 'Integration Risk', lowLabel: 'Isolated', highLabel: 'Many critical deps' },
  { key: 'changeReadiness', label: 'Change Readiness', lowLabel: 'Resistant', highLabel: 'Eager' },
]

export function FeasibilityBreakdownEditor({ value, onChange, disabled }: FeasibilityBreakdownEditorProps) {
  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{f.label}</Label>
            <span className="text-xs font-mono text-muted-foreground">{value[f.key]} / 5</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[value[f.key]]}
            onValueChange={(v) => onChange({ ...value, [f.key]: v[0] })}
            disabled={disabled}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{f.lowLabel}</span>
            <span>{f.highLabel}</span>
          </div>
        </div>
      ))}
      <div className="space-y-1.5">
        <Label className="text-sm">Notes</Label>
        <Textarea
          rows={2}
          value={value.notes ?? ''}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Specific feasibility concerns or mitigations…"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
