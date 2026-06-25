import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { Sparkle, FileText, FloppyDisk, ArrowClockwise, Path } from '@phosphor-icons/react'
import { generateCustomerJourney, type GeneratedJourney } from '@/lib/openai-service'
import { journeyToMarkdown } from '@/lib/engagement/format'
import { downloadDocxFromMarkdown, downloadMarkdown, artifactFilename } from '@/lib/engagement/exports'
import type { EngagementArtifact } from '@/lib/types'
import type { EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'

interface JourneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

export function JourneyDialog({ open, onOpenChange, context, onSaveArtifact }: JourneyDialogProps) {
  const useCases = context.useCases ?? []
  const [ucIdx, setUcIdx] = useState('0')
  const [focusTitle, setFocusTitle] = useState('')
  const [notes, setNotes] = useState(context.defaultTranscript ?? '')
  const [generating, setGenerating] = useState(false)
  const [journey, setJourney] = useState<GeneratedJourney | null>(null)
  const [markdown, setMarkdown] = useState('')

  const customer = context.customerName || 'Customer'

  const handleGenerate = async () => {
    const uc = useCases[Number(ucIdx)]
    const title = uc?.title || focusTitle.trim()
    if (!title) { toast.info('Pick a use case or enter a focus area'); return }
    setGenerating(true)
    try {
      const result = await generateCustomerJourney(
        { id: `journey-${Date.now()}`, title, description: uc?.description || title },
        { industry: context.industry, customerName: context.customerName, discoveryNotes: notes.trim() || undefined },
      )
      setJourney(result)
      setMarkdown(journeyToMarkdown(result, context.customerName))
    } catch {
      toast.error('Could not generate the journey. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!markdown.trim()) return
    onSaveArtifact({
      id: `journey-${Date.now()}`,
      kind: 'journey',
      title: journey?.title || `Journey — ${customer}`,
      markdown,
      data: journey ?? undefined,
      generatedAt: Date.now(),
      source: 'ai',
    })
    toast.success('Journey saved to the engagement')
    onOpenChange(false)
  }

  const reset = () => { setJourney(null); setMarkdown('') }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Path size={20} weight="duotone" /> Customer Journey <AIBadge />
          </DialogTitle>
          <DialogDescription>
            Build a phased engagement roadmap for {customer} (business envisioning → solution → architecture → prototype).
          </DialogDescription>
        </DialogHeader>

        {!journey ? (
          <div className="space-y-4">
            {useCases.length > 0 ? (
              <div className="space-y-2">
                <Label>Build the journey around</Label>
                <Select value={ucIdx} onValueChange={setUcIdx}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {useCases.map((u, i) => <SelectItem key={i} value={String(i)}>{u.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="journey-focus">Focus area</Label>
                <Input id="journey-focus" value={focusTitle} onChange={(e) => setFocusTitle(e.target.value)} placeholder="e.g. Customer service automation" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="journey-notes">Discovery notes (optional)</Label>
              <Textarea id="journey-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
                placeholder="Pain points, stakeholders, constraints — used to ground the roadmap." />
            </div>
            <InlineDisclaimer icon="info" text="AI-generated roadmap. Review milestones and durations before sharing." />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="journey-markdown">Journey (editable Markdown)</Label>
            <Textarea id="journey-markdown" value={markdown} onChange={(e) => setMarkdown(e.target.value)} rows={16} className="font-mono text-sm" />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!journey ? (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Sparkle size={16} weight={generating ? 'regular' : 'fill'} />
              {generating ? 'Generating…' : 'Generate journey'}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <Button variant="ghost" onClick={reset} className="gap-2"><ArrowClockwise size={16} /> Start over</Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => downloadMarkdown(markdown, artifactFilename(customer, 'journey', 'md'))}>
                  <FileText size={16} /> .md
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => downloadDocxFromMarkdown(markdown, artifactFilename(customer, 'journey', 'docx'), journey.title)}>
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
