import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { Sparkle, FileText, FloppyDisk, ArrowClockwise, ClipboardText } from '@phosphor-icons/react'
import { generateEngagementCloseout, type EngagementCloseout } from '@/lib/openai-service'
import { closeoutToMarkdown } from '@/lib/engagement/format'
import { downloadDocxFromMarkdown, downloadMarkdown, artifactFilename } from '@/lib/engagement/exports'
import type { EngagementArtifact } from '@/lib/types'
import type { EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'

interface CloseoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

export function CloseoutDialog({ open, onOpenChange, context, onSaveArtifact }: CloseoutDialogProps) {
  const [transcript, setTranscript] = useState(context.defaultTranscript ?? '')
  const [generating, setGenerating] = useState(false)
  const [closeout, setCloseout] = useState<EngagementCloseout | null>(null)
  const [markdown, setMarkdown] = useState('')

  const customer = context.customerName || 'Customer'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await generateEngagementCloseout({
        customerName: context.customerName,
        industry: context.industry,
        engagementType: context.engagementType,
        stakeholders: context.stakeholders,
        useCases: context.useCases,
        transcript: transcript.trim() || undefined,
      })
      setCloseout(result)
      setMarkdown(closeoutToMarkdown(result, context.customerName))
    } catch {
      toast.error('Could not generate the closeout. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!markdown.trim()) return
    onSaveArtifact({
      id: `closeout-${Date.now()}`,
      kind: 'closeout',
      title: `Closeout — ${customer}`,
      markdown,
      data: closeout ?? undefined,
      generatedAt: Date.now(),
      source: 'ai',
    })
    toast.success('Closeout saved to the engagement')
    onOpenChange(false)
  }

  const reset = () => { setCloseout(null); setMarkdown('') }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardText size={20} weight="duotone" /> Closeout / Debrief <AIBadge />
          </DialogTitle>
          <DialogDescription>
            Summarize the engagement for {customer} — decisions, action items, risks, and next steps — then edit and export.
          </DialogDescription>
        </DialogHeader>

        {!closeout ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="closeout-transcript">Session notes / transcript</Label>
              <Textarea
                id="closeout-transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste the session notes or transcript. The closeout is grounded ONLY in this text plus the use cases in scope — it won't invent commitments."
                rows={8}
              />
            </div>
            <InlineDisclaimer icon="info" text="AI-generated from your notes. Review for accuracy before distributing." />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="closeout-markdown">Closeout (editable Markdown)</Label>
            <Textarea
              id="closeout-markdown"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={16}
              className="font-mono text-sm"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!closeout ? (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Sparkle size={16} weight={generating ? 'regular' : 'fill'} />
              {generating ? 'Generating…' : 'Generate closeout'}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <Button variant="ghost" onClick={reset} className="gap-2"><ArrowClockwise size={16} /> Start over</Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadMarkdown(markdown, artifactFilename(customer, 'closeout', 'md'))}>
                  <FileText size={16} /> .md
                </Button>
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadDocxFromMarkdown(markdown, artifactFilename(customer, 'closeout', 'docx'), `Closeout — ${customer}`)}>
                  <FileText size={16} weight="fill" /> .docx
                </Button>
                <Button onClick={handleSave} className="gap-2"><FloppyDisk size={16} /> Save</Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
