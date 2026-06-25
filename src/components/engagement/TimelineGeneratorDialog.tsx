import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { Sparkle, FileText, FloppyDisk, ArrowClockwise, ListChecks, Table } from '@phosphor-icons/react'
import { generateEngagementTimeline, type EngagementTimelineItem } from '@/lib/openai-service'
import {
  DEFAULT_TIMELINE_TEMPLATE, anchorTimeline, timelineToPlannerCsv, anchoredTimelineToMarkdown,
} from '@/lib/engagement/timeline'
import { downloadCsv, downloadMarkdown, artifactFilename } from '@/lib/engagement/exports'
import type { EngagementArtifact } from '@/lib/types'
import type { EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'

interface TimelineGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  engagementDate?: number
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

function toDateInput(ts?: number): string {
  const d = ts ? new Date(ts) : new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tLabel(offset: number): string {
  return offset === 0 ? 'T' : offset > 0 ? `T+${offset}` : `T${offset}`
}

export function TimelineGeneratorDialog({ open, onOpenChange, context, engagementDate, onSaveArtifact }: TimelineGeneratorDialogProps) {
  const [dateStr, setDateStr] = useState(toDateInput(engagementDate))
  const [transcript, setTranscript] = useState(context.defaultTranscript ?? '')
  const [items, setItems] = useState<EngagementTimelineItem[] | null>(null)
  const [generating, setGenerating] = useState(false)

  const customer = context.customerName || 'Customer'
  const anchorDate = useMemo(() => new Date(`${dateStr}T00:00:00`), [dateStr])
  const tasks = useMemo(() => (items ? anchorTimeline(items, anchorDate) : []), [items, anchorDate])

  const handleAI = async () => {
    setGenerating(true)
    try {
      const result = await generateEngagementTimeline({
        customerName: context.customerName,
        industry: context.industry,
        engagementType: context.engagementType,
        useCases: context.useCases,
        transcript: transcript.trim() || undefined,
      })
      setItems(result.items.length ? result.items : DEFAULT_TIMELINE_TEMPLATE)
      if (!result.items.length) toast.info('Used the standard template (no AI items returned).')
    } catch {
      setItems(DEFAULT_TIMELINE_TEMPLATE)
      toast.error('AI unavailable — used the standard template.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!tasks.length) return
    onSaveArtifact({
      id: `timeline-${Date.now()}`,
      kind: 'timeline',
      title: `Timeline — ${customer}`,
      markdown: anchoredTimelineToMarkdown(tasks, customer),
      data: tasks,
      generatedAt: Date.now(),
      source: 'ai',
    })
    toast.success('Timeline saved to the engagement')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks size={20} weight="duotone" /> Task Timeline <AIBadge />
          </DialogTitle>
          <DialogDescription>
            A business-day plan (T-28 → T+3) for {customer}, anchored to the engagement date and exportable as a Microsoft Planner CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="timeline-date">Engagement date</Label>
              <Input id="timeline-date" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="w-48" />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setItems(DEFAULT_TIMELINE_TEMPLATE)}>
              <Table size={16} /> Use standard template
            </Button>
            <Button className="gap-2" onClick={handleAI} disabled={generating}>
              <Sparkle size={16} weight={generating ? 'regular' : 'fill'} />
              {generating ? 'Generating…' : 'Generate with AI'}
            </Button>
          </div>

          {!items && (
            <div className="space-y-2">
              <Label htmlFor="timeline-scope">Scope notes (optional, used by AI)</Label>
              <Textarea
                id="timeline-scope"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Any scope specifics that should shape the task plan."
                rows={4}
              />
              <InlineDisclaimer icon="info" text="Pick the standard template or generate a tailored plan, then export to Planner." />
            </div>
          )}

          {tasks.length > 0 && (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 w-16">When</th>
                    <th className="text-left px-3 py-2 w-28">Date</th>
                    <th className="text-left px-3 py-2 w-28">Bucket</th>
                    <th className="text-left px-3 py-2">Task</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-3 py-2 font-medium tabular-nums">{tLabel(t.offsetDays)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{t.bucket || 'Task'}</Badge></td>
                      <td className="px-3 py-2">
                        {t.title}
                        {t.owner && <span className="text-xs text-muted-foreground"> · {t.owner}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {tasks.length > 0 ? (
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <Button variant="ghost" className="gap-2" onClick={() => setItems(null)}><ArrowClockwise size={16} /> Start over</Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadCsv(timelineToPlannerCsv(tasks), artifactFilename(customer, 'timeline', 'csv'))}>
                  <Table size={16} /> Planner .csv
                </Button>
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadMarkdown(anchoredTimelineToMarkdown(tasks, customer), artifactFilename(customer, 'timeline', 'md'))}>
                  <FileText size={16} /> .md
                </Button>
                <Button onClick={handleSave} className="gap-2"><FloppyDisk size={16} /> Save</Button>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Choose a template or generate a plan to continue.</span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
