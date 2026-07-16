import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { VoiceInputField } from '@/components/VoiceInputField'
import { AgendaTableEditor } from '@/components/engagement/AgendaTableEditor'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { Sparkle, FileText, FloppyDisk, ArrowClockwise } from '@phosphor-icons/react'
import { generateEngagementAgenda, type EngagementAgenda } from '@/lib/openai-service'
import { agendaToMarkdown } from '@/lib/engagement/format'
import { downloadDocxFromMarkdown, downloadMarkdown, artifactFilename } from '@/lib/engagement/exports'
import type { EngagementArtifact } from '@/lib/types'

export interface EngagementToolContext {
  customerName?: string
  industry?: string
  engagementType?: string
  useCases?: Array<{ title: string; description?: string }>
  defaultTranscript?: string
  stakeholders?: string[]
}

interface AgendaBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

export function AgendaBuilderDialog({ open, onOpenChange, context, onSaveArtifact }: AgendaBuilderDialogProps) {
  const [transcript, setTranscript] = useState(context.defaultTranscript ?? '')
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [generating, setGenerating] = useState(false)
  const [agenda, setAgenda] = useState<EngagementAgenda | null>(null)

  const customer = context.customerName || 'Customer'
  const markdown = agenda ? agendaToMarkdown(agenda, context.customerName) : ''

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await generateEngagementAgenda({
        customerName: context.customerName,
        industry: context.industry,
        engagementType: context.engagementType,
        stakeholders: context.stakeholders,
        useCases: context.useCases,
        transcript: transcript.trim() || undefined,
        durationMinutes,
      })
      setAgenda(result)
    } catch {
      toast.error('Could not generate the agenda. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!markdown.trim()) return
    onSaveArtifact({
      id: `agenda-${Date.now()}`,
      kind: 'agenda',
      title: agenda?.title || `Agenda — ${customer}`,
      markdown,
      data: agenda ?? undefined,
      generatedAt: Date.now(),
      source: 'ai',
    })
    toast.success('Agenda saved to the engagement')
    onOpenChange(false)
  }

  const reset = () => {
    setAgenda(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Agenda Builder <AIBadge />
          </DialogTitle>
          <DialogDescription>
            Generate a time-boxed session agenda for {customer} from your planning notes or transcript, then edit and export it.
          </DialogDescription>
        </DialogHeader>

        {!agenda ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agenda-duration">Target duration (minutes)</Label>
              <Input
                id="agenda-duration"
                type="number"
                min={15}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value) || 90))}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <VoiceInputField
                label="Planning notes / transcript (optional)"
                value={transcript}
                onChange={setTranscript}
                placeholder="Paste planning-call notes, qualification details, or a transcript — or dictate with the mic. The agenda is grounded in this text plus the use cases in scope."
                rows={8}
              />
            </div>
            <InlineDisclaimer icon="info" text="The agenda is AI-generated from the context you provide. Review and edit before sharing with the customer." />
          </div>
        ) : (
          <div className="space-y-5">
            {agenda.objectives.length > 0 && (
              <div>
                <Label>Objectives</Label>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {agenda.objectives.map((objective, index) => <li key={index}>{objective}</li>)}
                </ul>
              </div>
            )}
            <div>
              <Label>Agenda</Label>
              <div className="mt-2">
                <AgendaTableEditor
                  items={agenda.items}
                  onChange={(items) => setAgenda({ ...agenda, items })}
                />
              </div>
            </div>
            {agenda.nextSteps.length > 0 && (
              <div>
                <Label>Next steps</Label>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {agenda.nextSteps.map((step, index) => <li key={index}>{step}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!agenda ? (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Sparkle size={16} weight={generating ? 'regular' : 'fill'} />
              {generating ? 'Generating…' : 'Generate agenda'}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <Button variant="ghost" onClick={reset} className="gap-2">
                <ArrowClockwise size={16} /> Start over
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadMarkdown(markdown, artifactFilename(customer, 'agenda', 'md'))}
                >
                  <FileText size={16} /> .md
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadDocxFromMarkdown(markdown, artifactFilename(customer, 'agenda', 'docx'), agenda.title)}
                >
                  <FileText size={16} weight="fill" /> .docx
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <FloppyDisk size={16} /> Save
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
