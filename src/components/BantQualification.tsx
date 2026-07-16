import type { BantQualification, QualificationSignalStatus } from '@/lib/types'
import { BANT_DIMENSIONS, createEmptyBantQualification, summarizeBant, type BantDimension } from '@/lib/qualification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface BantQualificationProps {
  value?: BantQualification
  onChange: (value: BantQualification) => void
}

const LABELS: Record<BantDimension, { label: string; prompt: string }> = {
  budget: { label: 'Budget', prompt: 'What funding is available or expected?' },
  authority: { label: 'Authority', prompt: 'Who can approve or sponsor this use case?' },
  need: { label: 'Need', prompt: 'What evidence confirms the business need?' },
  timeline: { label: 'Timeline', prompt: 'What event or date drives delivery?' },
}

const STATUS_LABELS: Record<QualificationSignalStatus, string> = {
  unknown: 'Unknown',
  weak: 'Weak',
  confirmed: 'Confirmed',
}

export function BantQualificationEditor({ value, onChange }: BantQualificationProps) {
  const qualification = value ?? createEmptyBantQualification()
  const summary = summarizeBant(qualification)

  const updateDimension = (
    dimension: BantDimension,
    updates: Partial<BantQualification[BantDimension]>,
  ) => {
    onChange({
      ...qualification,
      [dimension]: { ...qualification[dimension], ...updates },
      updatedAt: Date.now(),
    })
  }

  return (
    <section className="space-y-4" aria-labelledby="bant-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="bant-heading" className="text-sm font-medium">BANT qualification</h3>
          <p className="text-xs text-muted-foreground">Advisory signals only. Missing evidence never blocks progress.</p>
        </div>
        <Badge variant={summary.indication === 'ready' ? 'default' : 'outline'}>
          {summary.confirmed}/4 confirmed
        </Badge>
      </div>

      <div className="space-y-4">
        {BANT_DIMENSIONS.map((dimension) => {
          const signal = qualification[dimension]
          return (
            <div key={dimension} className="grid gap-2 rounded-md border p-3 md:grid-cols-[110px_1fr]">
              <div>
                <Label className="font-medium">{LABELS[dimension].label}</Label>
                <p className="text-[11px] text-muted-foreground mt-1">{LABELS[dimension].prompt}</p>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1" role="group" aria-label={`${LABELS[dimension].label} status`}>
                  {(Object.keys(STATUS_LABELS) as QualificationSignalStatus[]).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={signal.status === status}
                      onClick={() => updateDimension(dimension, { status })}
                      className={cn(
                        'h-8 text-xs',
                        signal.status === status && status === 'confirmed' && 'border-emerald-500 bg-emerald-500/10 text-emerald-700',
                        signal.status === status && status === 'weak' && 'border-amber-500 bg-amber-500/10 text-amber-700',
                        signal.status === status && status === 'unknown' && 'bg-muted',
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
                <Input
                  value={signal.evidence ?? ''}
                  onChange={(event) => updateDimension(dimension, { evidence: event.target.value || undefined })}
                  placeholder="Evidence or next validation step"
                  aria-label={`${LABELS[dimension].label} evidence`}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}