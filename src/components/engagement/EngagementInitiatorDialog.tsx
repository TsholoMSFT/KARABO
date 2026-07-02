import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FolderPlus, FileText } from '@phosphor-icons/react'
import type { Engagement, EngagementToolkitType, Industry } from '@/lib/types'
import { ENGAGEMENT_TYPE_LABELS } from '@/lib/engagement/format'
import { DEFAULT_TIMELINE_TEMPLATE, anchorTimeline, anchoredTimelineToMarkdown } from '@/lib/engagement/timeline'
import { downloadMarkdown, artifactFilename } from '@/lib/engagement/exports'

interface EngagementInitiatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCustomerName?: string
  sessionId?: string
  industry?: Industry
  onCreate: (engagement: Engagement) => void
  onCreated: (id: string) => void
}

const ENGAGEMENT_TYPES = Object.keys(ENGAGEMENT_TYPE_LABELS) as EngagementToolkitType[]

function toLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`)
}

export function EngagementInitiatorDialog({
  open, onOpenChange, defaultCustomerName, sessionId, industry, onCreate, onCreated,
}: EngagementInitiatorDialogProps) {
  const [customerName, setCustomerName] = useState(defaultCustomerName ?? '')
  const [type, setType] = useState<EngagementToolkitType>('discovery')
  const [date, setDate] = useState('')
  const [stakeholders, setStakeholders] = useState('')
  const [objective, setObjective] = useState('')
  const [seedTasks, setSeedTasks] = useState(true)

  const buildEngagement = (): Engagement => {
    const engagementDate = date ? toLocalDate(date).getTime() : undefined
    const tasks = seedTasks && engagementDate
      ? anchorTimeline(DEFAULT_TIMELINE_TEMPLATE, new Date(engagementDate))
      : seedTasks
        ? anchorTimeline(DEFAULT_TIMELINE_TEMPLATE, new Date())
        : undefined
    return {
      id: `eng-${Date.now()}`,
      customerName: (customerName || 'Customer').trim(),
      sessionId,
      type,
      status: 'planned',
      engagementDate,
      stakeholders: stakeholders ? stakeholders.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      industry,
      notes: objective.trim() || undefined,
      tasks,
      createdAt: Date.now(),
    }
  }

  const handleCreate = () => {
    const engagement = buildEngagement()
    onCreate(engagement)
    onCreated(engagement.id)
    toast.success(`Engagement scaffolded${engagement.tasks?.length ? ` with ${engagement.tasks.length} tasks` : ''}`)
    onOpenChange(false)
  }

  const handleExportBrief = () => {
    const e = buildEngagement()
    const lines: string[] = [`# Engagement kickoff — ${e.customerName}`, '']
    lines.push(`**Type:** ${ENGAGEMENT_TYPE_LABELS[e.type]}`)
    if (e.engagementDate) lines.push(`**Date:** ${new Date(e.engagementDate).toLocaleDateString()}`)
    if (e.stakeholders?.length) lines.push(`**Stakeholders:** ${e.stakeholders.join(', ')}`)
    if (e.notes) lines.push('', '## Objective', e.notes)
    if (e.tasks?.length) lines.push('', anchoredTimelineToMarkdown(e.tasks, e.customerName))
    downloadMarkdown(lines.join('\n'), artifactFilename(e.customerName, 'kickoff', 'md'))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus size={20} weight="duotone" /> Engagement Initiator
          </DialogTitle>
          <DialogDescription>
            Scaffold a new engagement with metadata and a seeded T-28 → T+3 task plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="init-customer">Customer</Label>
            <Input id="init-customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EngagementToolkitType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{ENGAGEMENT_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="init-date">Date</Label>
              <Input id="init-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="init-stake">Stakeholders (comma-separated)</Label>
            <Input id="init-stake" value={stakeholders} onChange={(e) => setStakeholders(e.target.value)} placeholder="Jane Doe, John Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="init-objective">Primary objective</Label>
            <Textarea id="init-objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={3}
              placeholder="What outcome should this engagement drive?" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={seedTasks} onCheckedChange={(v) => setSeedTasks(Boolean(v))} />
            Seed the standard task timeline (T-28 → T+3)
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <div className="flex flex-wrap gap-2 w-full justify-between">
            <Button variant="outline" className="gap-2" onClick={handleExportBrief}>
              <FileText size={16} /> Export kickoff brief
            </Button>
            <Button className="gap-2" onClick={handleCreate}>
              <FolderPlus size={16} /> Create engagement
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
