import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { Sparkle, FileText, FloppyDisk, ArrowClockwise, TreeStructure, Code } from '@phosphor-icons/react'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import { generateArchitectureDiagram, type ArchitectureDiagram } from '@/lib/openai-service'
import { diagramToMarkdown } from '@/lib/engagement/format'
import { downloadMarkdown, downloadText, artifactFilename } from '@/lib/engagement/exports'
import type { EngagementArtifact } from '@/lib/types'
import type { EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'

interface ArchitectureDiagramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

type DiagramStyle = 'flowchart' | 'sequence' | 'c4'
const STYLES: Array<{ value: DiagramStyle; label: string }> = [
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'c4', label: 'C4 Context' },
]

export function ArchitectureDiagramDialog({ open, onOpenChange, context, onSaveArtifact }: ArchitectureDiagramDialogProps) {
  const [transcript, setTranscript] = useState(context.defaultTranscript ?? '')
  const [style, setStyle] = useState<DiagramStyle>('flowchart')
  const [generating, setGenerating] = useState(false)
  const [diagram, setDiagram] = useState<ArchitectureDiagram | null>(null)
  const [mermaidSrc, setMermaidSrc] = useState('')

  const customer = context.customerName || 'Customer'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await generateArchitectureDiagram({
        customerName: context.customerName,
        industry: context.industry,
        engagementType: context.engagementType,
        useCases: context.useCases,
        transcript: transcript.trim() || undefined,
        style,
      })
      setDiagram(result)
      setMermaidSrc(result.mermaid)
    } catch {
      toast.error('Could not generate the diagram. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!mermaidSrc.trim()) return
    const finalDiagram: ArchitectureDiagram = {
      title: diagram?.title || `Architecture — ${customer}`,
      mermaid: mermaidSrc,
      explanation: diagram?.explanation,
    }
    onSaveArtifact({
      id: `diagram-${Date.now()}`,
      kind: 'diagram',
      title: finalDiagram.title,
      markdown: diagramToMarkdown(finalDiagram),
      data: finalDiagram,
      generatedAt: Date.now(),
      source: 'ai',
    })
    toast.success('Diagram saved to the engagement')
    onOpenChange(false)
  }

  const reset = () => { setDiagram(null); setMermaidSrc('') }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TreeStructure size={20} weight="duotone" /> Architecture Diagram <AIBadge />
          </DialogTitle>
          <DialogDescription>
            Generate a Mermaid architecture diagram for {customer} from your notes, then edit the source and preview it live.
          </DialogDescription>
        </DialogHeader>

        {!diagram ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diagram style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as DiagramStyle)}>
                <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagram-transcript">Solution notes / requirements (optional)</Label>
              <Textarea
                id="diagram-transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Describe the components, data flows, and Azure services involved. The diagram is grounded in this text plus the use cases in scope."
                rows={7}
              />
            </div>
            <InlineDisclaimer icon="info" text="AI-generated diagram. Validate the architecture before sharing." />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diagram-src">Mermaid source (editable)</Label>
              <Textarea
                id="diagram-src"
                value={mermaidSrc}
                onChange={(e) => setMermaidSrc(e.target.value)}
                rows={16}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md border p-3 bg-white overflow-auto min-h-[200px]">
                <MermaidDiagram code={mermaidSrc} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!diagram ? (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Sparkle size={16} weight={generating ? 'regular' : 'fill'} />
              {generating ? 'Generating…' : 'Generate diagram'}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <Button variant="ghost" onClick={reset} className="gap-2"><ArrowClockwise size={16} /> Start over</Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadText(mermaidSrc, artifactFilename(customer, 'diagram', 'mmd'))}>
                  <Code size={16} /> .mmd
                </Button>
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadMarkdown(diagramToMarkdown({ title: diagram.title, mermaid: mermaidSrc, explanation: diagram.explanation }), artifactFilename(customer, 'diagram', 'md'))}>
                  <FileText size={16} /> .md
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
