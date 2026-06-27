import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputField } from '@/components/VoiceInputField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { Sparkle, FileText, FloppyDisk, ArrowClockwise, EnvelopeSimple, Code } from '@phosphor-icons/react'
import { generateFollowupEmail, type FollowupEmail } from '@/lib/openai-service'
import { downloadMarkdown, downloadHtml, emailToOutlook, artifactFilename } from '@/lib/engagement/exports'
import type { EngagementArtifact } from '@/lib/types'
import type { EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'

interface FollowupEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

const AUDIENCES = ['Executive sponsors', 'Technical stakeholders', 'Business stakeholders', 'Mixed audience']

export function FollowupEmailDialog({ open, onOpenChange, context, onSaveArtifact }: FollowupEmailDialogProps) {
  const [transcript, setTranscript] = useState(context.defaultTranscript ?? '')
  const [audience, setAudience] = useState(AUDIENCES[0])
  const [generating, setGenerating] = useState(false)
  const [email, setEmail] = useState<FollowupEmail | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const customer = context.customerName || 'Customer'

  const buildMarkdown = () => `**Subject:** ${subject}\n\n${body}`.trim()

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await generateFollowupEmail({
        customerName: context.customerName,
        industry: context.industry,
        engagementType: context.engagementType,
        stakeholders: context.stakeholders,
        useCases: context.useCases,
        transcript: transcript.trim() || undefined,
        audience,
      })
      setEmail(result)
      setSubject(result.subject)
      setBody(result.bodyText || result.bullets.map((b) => `- ${b}`).join('\n'))
    } catch {
      toast.error('Could not generate the email. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!subject.trim() && !body.trim()) return
    onSaveArtifact({
      id: `email-${Date.now()}`,
      kind: 'email',
      title: subject || `Follow-up — ${customer}`,
      markdown: buildMarkdown(),
      data: email ?? undefined,
      generatedAt: Date.now(),
      source: 'ai',
    })
    toast.success('Email saved to the engagement')
    onOpenChange(false)
  }

  const reset = () => { setEmail(null); setSubject(''); setBody('') }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EnvelopeSimple size={20} weight="duotone" /> Follow-up Email <AIBadge />
          </DialogTitle>
          <DialogDescription>
            Draft an audience-calibrated recap email for {customer}, then edit and send via Outlook.
          </DialogDescription>
        </DialogHeader>

        {!email ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <VoiceInputField
                label="Session notes / highlights (optional)"
                value={transcript}
                onChange={setTranscript}
                placeholder="Paste session notes or key outcomes — or dictate with the mic. The email is grounded in this text plus the use cases in scope."
                rows={7}
              />
            </div>
            <InlineDisclaimer icon="info" text="AI-generated draft. Review for accuracy before sending." />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input id="email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Body (editable)</Label>
              <Textarea id="email-body" value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!email ? (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Sparkle size={16} weight={generating ? 'regular' : 'fill'} />
              {generating ? 'Generating…' : 'Generate email'}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <Button variant="ghost" onClick={reset} className="gap-2"><ArrowClockwise size={16} /> Start over</Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2"
                  onClick={() => emailToOutlook({ subject, body, isHtml: false })}>
                  <EnvelopeSimple size={16} /> Open in Outlook
                </Button>
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadHtml(email.bodyHtml || `<p>${body.replace(/\n/g, '<br/>')}</p>`, artifactFilename(customer, 'email', 'html'))}>
                  <Code size={16} /> .html
                </Button>
                <Button variant="outline" className="gap-2"
                  onClick={() => downloadMarkdown(buildMarkdown(), artifactFilename(customer, 'email', 'md'))}>
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
