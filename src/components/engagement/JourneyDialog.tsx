import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, FloppyDisk, Path } from '@phosphor-icons/react'
import { accountJourneyToMarkdown } from '@/lib/engagement/format'
import { downloadDocxFromMarkdown, downloadMarkdown, artifactFilename } from '@/lib/engagement/exports'
import { getCustomerSafeJourney } from '@/lib/frontier-ai/journey-builder'
import type { AccountCustomerJourney, EngagementArtifact, UseCase } from '@/lib/types'
import type { EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'

interface JourneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: EngagementToolContext
  journey: AccountCustomerJourney | null
  useCases: UseCase[]
  onOpenAccountJourney?: () => void
  onSaveArtifact: (artifact: EngagementArtifact) => void
}

export function JourneyDialog({
  open,
  onOpenChange,
  context,
  journey,
  useCases,
  onOpenAccountJourney,
  onSaveArtifact,
}: JourneyDialogProps) {
  const customer = context.customerName || journey?.customerName || 'Customer'
  const markdown = journey ? accountJourneyToMarkdown(journey, useCases) : ''

  const handleSave = () => {
    if (!journey || !markdown) return
    const safeJourney = getCustomerSafeJourney(journey)
    onSaveArtifact({
      id: `journey-${journey.id}`,
      kind: 'journey',
      title: journey.title,
      markdown,
      data: safeJourney,
      generatedAt: Date.now(),
      source: 'manual',
    })
    toast.success('Account journey snapshot saved to the engagement')
    onOpenChange(false)
  }

  const openCanonicalJourney = () => {
    onOpenChange(false)
    onOpenAccountJourney?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Path size={20} weight="duotone" /> Frontier AI Account Journey
          </DialogTitle>
          <DialogDescription>
            Save the current customer-safe roadmap for {customer} as an engagement artifact.
          </DialogDescription>
        </DialogHeader>

        {journey ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
              <Badge>{journey.maturity.stage}</Badge>
              <Badge variant="outline">{journey.maturity.pillarsAtThreshold}/9 pillars at implementation</Badge>
              <span className="text-xs text-muted-foreground">Updated {new Date(journey.updatedAt).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-journey-markdown">Journey snapshot</Label>
              <Textarea id="account-journey-markdown" value={markdown} readOnly rows={18} className="font-mono text-xs" />
            </div>
          </div>
        ) : (
          <div className="border-y border-border py-12 text-center">
            <Path size={32} className="mx-auto text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No account journey has been created</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Complete the account readiness assessment and review the roadmap before attaching a snapshot to this engagement.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {journey ? (
            <div className="flex w-full flex-wrap justify-between gap-2">
              {onOpenAccountJourney && <Button variant="ghost" onClick={openCanonicalJourney}>Edit account journey</Button>}
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => downloadMarkdown(markdown, artifactFilename(customer, 'frontier-ai-journey', 'md'))}>
                  <FileText size={16} /> Markdown
                </Button>
                <Button variant="outline" onClick={() => void downloadDocxFromMarkdown(markdown, artifactFilename(customer, 'frontier-ai-journey', 'docx'), journey.title)}>
                  <FileText size={16} weight="fill" /> Word
                </Button>
                <Button onClick={handleSave}><FloppyDisk size={16} /> Save snapshot</Button>
              </div>
            </div>
          ) : onOpenAccountJourney && <Button onClick={openCanonicalJourney}><Path size={16} /> Open account journey</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
