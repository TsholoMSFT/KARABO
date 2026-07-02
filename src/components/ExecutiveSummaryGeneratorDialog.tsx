import { useEffect, useMemo, useState } from 'react'
import type { DiscoverySession, UseCase } from '@/lib/types'
import { industryLabels } from '@/lib/discovery-questions'
import { extractTextFromAttachments, type AttachmentTextResult } from '@/lib/attachment-text'
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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InlineDisclaimer } from '@/components/Disclaimer'
import { AIDataDisclosure } from '@/components/AIDataDisclosure'

export type ExecutiveSummaryPreset = 'standard' | 'stakeholder-email' | 'meeting-notes'

const PRESET_LABELS: Record<ExecutiveSummaryPreset, string> = {
  standard: 'Standard Summary',
  'stakeholder-email': 'Stakeholder Email',
  'meeting-notes': 'Meeting Notes',
}

const PRESET_DESCRIPTIONS: Record<ExecutiveSummaryPreset, string> = {
  standard: 'Structured executive summary with headings, findings, and next steps',
  'stakeholder-email': 'Crisp email format for C-suite or sponsors — easy to skim',
  'meeting-notes': 'Structured notes with bullets and assigned action items',
}

interface ExecutiveSummaryGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: DiscoverySession
  useCases: UseCase[]
  onSaveSummary: (summary: string) => void
  /** Optional Markdown annex appended to the saved summary (e.g. Solution Paths). */
  blueprintAnnex?: string
}

function getIndustryLabel(session: DiscoverySession): string {
  if (!session.industry) return 'General'
  return industryLabels[session.industry] || 'General'
}

function buildPrompt(params: {
  preset: ExecutiveSummaryPreset
  session: DiscoverySession
  useCases: UseCase[]
  pastedText: string
  attachmentsText: string
}): string {
  const { preset, session, useCases, pastedText, attachmentsText } = params

  const useCaseBullets = useCases
    .slice(0, 12)
    .map((uc, idx) => `${idx + 1}. ${uc.title}${uc.description ? ` — ${uc.description}` : ''}`)
    .join('\n')

  const presetInstructions: Record<ExecutiveSummaryPreset, string> = {
    standard:
      'Write a concise executive summary with headings, key findings, prioritized opportunities, and next steps.',
    'stakeholder-email':
      'Write this as an email to executive stakeholders. Keep it crisp, action-oriented, and easy to skim.',
    'meeting-notes':
      'Write this as structured meeting notes with sections, bullets, and clearly assigned next steps.',
  }

  return `You are a senior innovation consultant at Microsoft.

TASK
Create an Executive Summary for a customer discovery session.
IMPORTANT: Always include a clear \"Next Steps\" section (bulleted) at the end.

FORMAT
- Use Markdown.
- Prefer short sections and bullets over long paragraphs.

SESSION
Customer: ${session.customerName}
Industry: ${getIndustryLabel(session)}
Session Name: ${session.name}

EXISTING USE CASES (if any)
${useCaseBullets || '(none yet)'}

INPUT: PASTED NOTES / TRANSCRIPT
${pastedText?.trim() || '(none)'}

INPUT: ATTACHMENTS (extracted text)
${attachmentsText?.trim() || '(none)'}

STYLE GUIDELINES
- Be professional and executive-ready
- Keep assumptions explicit when details are missing
- Tie recommendations to practical Microsoft solution paths (without deep product lists)

PRESET
${PRESET_LABELS[preset]}: ${presetInstructions[preset]}

Now write the Executive Summary.`
}

function buildFallbackSummary(params: {
  session: DiscoverySession
  useCases: UseCase[]
  pastedText: string
}): string {
  const { session, useCases, pastedText } = params

  const topUseCases = useCases.slice(0, 6)
  const useCaseList = topUseCases.length
    ? topUseCases.map((uc) => `- ${uc.title}`).join('\n')
    : '- (No use cases captured yet)'

  const contextSnippet = pastedText.trim()
    ? pastedText.trim().slice(0, 800) + (pastedText.trim().length > 800 ? '…' : '')
    : 'No notes were provided.'

  return `# Executive Summary

## Context
This summary captures the current discovery context for **${session.customerName}** (${getIndustryLabel(session)}).

## What We Heard
${contextSnippet}

## Candidate Use Cases
${useCaseList}

## Next Steps
- Confirm stakeholders and success criteria (KPIs) for the top 3 use cases
- Validate data availability, security/compliance constraints, and integration touchpoints
- Prioritize quick wins vs. foundational capabilities, then define a 30/60/90-day plan

---
*Note: This is a fallback summary (AI generation unavailable). Please review and refine.*`
}

export function ExecutiveSummaryGeneratorDialog({
  open,
  onOpenChange,
  session,
  useCases,
  onSaveSummary,
  blueprintAnnex,
}: ExecutiveSummaryGeneratorDialogProps) {
  const [preset, setPreset] = useState<ExecutiveSummaryPreset>('standard')
  const [pastedText, setPastedText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [attachmentResults, setAttachmentResults] = useState<AttachmentTextResult[]>([])
  const [attachmentsCombinedText, setAttachmentsCombinedText] = useState('')

  useEffect(() => {
    if (!open) return
    // reset per-open to keep it demo-friendly and avoid leaking state
    setPreset('standard')
    setPastedText('')
    setAttachmentResults([])
    setAttachmentsCombinedText('')
    setIsExtracting(false)
    setIsGenerating(false)
  }, [open])

  const attachmentsSummary = useMemo(() => {
    const withText = attachmentResults.filter((r) => r.text && r.text.trim())
    const warnings = attachmentResults.flatMap((r) => r.warnings)
    return {
      fileCount: attachmentResults.length,
      extractedCount: withText.length,
      warningCount: warnings.length,
      warnings,
    }
  }, [attachmentResults])

  const handleFilesSelected = async (selected: FileList | null) => {
    const nextFiles = selected ? Array.from(selected) : []

    if (nextFiles.length === 0) {
      setAttachmentResults([])
      setAttachmentsCombinedText('')
      return
    }

    setIsExtracting(true)
    try {
      const { results, combinedText, warnings } = await extractTextFromAttachments(nextFiles)
      setAttachmentResults(results)
      setAttachmentsCombinedText(combinedText)

      if (warnings.length > 0) {
        toast.info('Some attachments need attention', {
          description: `${warnings.slice(0, 2).join(' • ')}${warnings.length > 2 ? ' • …' : ''}`,
        })
      } else {
        toast.success('Attachments processed')
      }
    } catch (err) {
      toast.error('Failed to process attachments', {
        description: err instanceof Error ? err.message : String(err),
      })
      setAttachmentResults([])
      setAttachmentsCombinedText('')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGenerate = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      const prompt = buildPrompt({
        preset,
        session,
        useCases,
        pastedText,
        attachmentsText: attachmentsCombinedText,
      })

      if (typeof window === 'undefined' || !window.llm) {
        throw new Error('AI is not available in this environment.')
      }

      const summary = await window.llm(prompt, 'gpt-4o-mini')
      onSaveSummary(blueprintAnnex ? `${summary}${blueprintAnnex}` : summary)
      toast.success('Executive summary saved')
      onOpenChange(false)
    } catch (err) {
      const fallback = buildFallbackSummary({ session, useCases, pastedText })
      onSaveSummary(blueprintAnnex ? `${fallback}${blueprintAnnex}` : fallback)
      toast.warning('Saved a fallback summary', {
        description: err instanceof Error ? err.message : String(err),
      })
      onOpenChange(false)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Executive Summary</DialogTitle>
          <DialogDescription>
            For skip-created sessions, paste notes or attach documents. The output always includes Next Steps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(['standard', 'stakeholder-email', 'meeting-notes'] as ExecutiveSummaryPreset[]).map((p) => (
              <Button
                key={p}
                type="button"
                variant={preset === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset(p)}
                title={PRESET_DESCRIPTIONS[p]}
              >
                {PRESET_LABELS[p]}
              </Button>
            ))}
          </div>
          {PRESET_DESCRIPTIONS[preset] && (
            <p className="text-xs text-muted-foreground">{PRESET_DESCRIPTIONS[preset]}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="exec-summary-paste">Paste notes / transcript (optional)</Label>
            <Textarea
              id="exec-summary-paste"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste discovery transcript, meeting notes, or context..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exec-summary-files">Attach documents (optional)</Label>
            <Input
              id="exec-summary-files"
              type="file"
              multiple
              onChange={(e) => void handleFilesSelected(e.target.files)}
              accept=".pdf,.docx,.xlsx,.xls,.txt,.md,image/*"
            />
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <Badge variant="secondary">PDF</Badge>
              <Badge variant="secondary">Word</Badge>
              <Badge variant="secondary">Excel</Badge>
              <Badge variant="secondary">Images (OCR via API)</Badge>
              {isExtracting && <span>Processing…</span>}
            </div>

            {attachmentsSummary.fileCount > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Attachments</div>
                  <div className="text-xs text-muted-foreground">
                    {attachmentsSummary.extractedCount}/{attachmentsSummary.fileCount} extracted
                    {attachmentsSummary.warningCount > 0 ? ` • ${attachmentsSummary.warningCount} warning(s)` : ''}
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  {attachmentResults.map((r) => (
                    <div key={r.fileName} className="flex items-center justify-between gap-3">
                      <div className="text-xs truncate">{r.fileName}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                        {r.warnings.length > 0 && (
                          <Badge variant="destructive" className="text-[10px]">warn</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <AIDataDisclosure
            fields={['customer name', 'industry', 'session name', 'use cases (up to 12)', 'pasted notes', 'attachment text']}
            model="gpt-4o-mini"
            note="Your inputs are sent to generate the executive summary. No data is stored beyond this request."
          />
          <InlineDisclaimer
            text="The generated summary is AI-produced. Review and edit before sharing with stakeholders."
            icon="ai"
          />
          <div className="flex justify-end gap-2 w-full">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isGenerating || isExtracting}
            className="gap-2"
          >
            {isGenerating ? 'Generating…' : 'Generate & Save'}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
