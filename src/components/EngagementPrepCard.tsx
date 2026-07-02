/**
 * EngagementPrepCard — consultant-only "Engagement Prep" surface shown inside the
 * Discovery results, after use cases are generated. Reuses the existing engagement
 * builders (Agenda, Architecture Diagram, Follow-up Email), seeded with the session
 * context (customer, industry, generated use cases, and the discovery Q&A transcript).
 *
 * Generated artifacts are persisted to a discovery-linked Engagement via useEngagements.
 */
import { useEffect, useMemo, useState } from 'react'
import { CalendarBlank, EnvelopeSimple, TreeStructure } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AgendaBuilderDialog, type EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'
import { ArchitectureDiagramDialog } from '@/components/engagement/ArchitectureDiagramDialog'
import { FollowupEmailDialog } from '@/components/engagement/FollowupEmailDialog'
import { useEngagements } from '@/hooks/use-engagements'
import { industryLabels } from '@/lib/discovery-questions'
import type { Industry } from '@/lib/types'

type Tool = 'agenda' | 'diagram' | 'email' | null

interface EngagementPrepCardProps {
  sessionId: string
  customerName?: string
  industry?: Industry
  stakeholders?: string[]
  useCases: Array<{ title: string; description?: string }>
  transcript?: string
}

export function EngagementPrepCard({
  sessionId,
  customerName,
  industry,
  stakeholders,
  useCases,
  transcript,
}: EngagementPrepCardProps) {
  const { engagements, addEngagement, saveArtifact } = useEngagements()
  const [activeTool, setActiveTool] = useState<Tool>(null)
  const [engagementId, setEngagementId] = useState<string | null>(null)

  // Ensure a discovery-linked engagement exists to hold generated artifacts.
  useEffect(() => {
    const existing = engagements.find((e) => e.sessionId === sessionId)
    if (existing) {
      setEngagementId(existing.id)
      return
    }
    const id = `eng-${Date.now()}`
    addEngagement({
      id,
      customerName: customerName || 'Customer',
      sessionId,
      type: 'discovery',
      status: 'planned',
      industry,
      stakeholders,
      createdAt: Date.now(),
      artifacts: [],
    })
    setEngagementId(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toolContext: EngagementToolContext = useMemo(
    () => ({
      customerName,
      industry: industry ? industryLabels[industry] : undefined,
      engagementType: 'Discovery',
      useCases,
      stakeholders,
      defaultTranscript: transcript,
    }),
    [customerName, industry, useCases, stakeholders, transcript],
  )

  const artifacts = engagements.find((e) => e.id === engagementId)?.artifacts ?? []
  const onSaveArtifact = (artifact: Parameters<typeof saveArtifact>[1]) => {
    if (engagementId) saveArtifact(engagementId, artifact)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Engagement prep</CardTitle>
        <CardDescription>
          Turn this discovery into ready-to-use engagement assets — grounded in the customer's answers and the use cases
          above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setActiveTool('agenda')}>
            <CalendarBlank size={18} className="mr-2" />
            Build agenda
          </Button>
          <Button variant="outline" onClick={() => setActiveTool('diagram')}>
            <TreeStructure size={18} className="mr-2" />
            Architecture diagram
          </Button>
          <Button variant="outline" onClick={() => setActiveTool('email')}>
            <EnvelopeSimple size={18} className="mr-2" />
            Follow-up email
          </Button>
        </div>

        {artifacts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Saved:</span>
            {artifacts.map((a) => (
              <Badge key={a.id} variant="secondary">
                {a.kind} · {a.title}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <AgendaBuilderDialog
        open={activeTool === 'agenda'}
        onOpenChange={(o) => setActiveTool(o ? 'agenda' : null)}
        context={toolContext}
        onSaveArtifact={onSaveArtifact}
      />
      <ArchitectureDiagramDialog
        open={activeTool === 'diagram'}
        onOpenChange={(o) => setActiveTool(o ? 'diagram' : null)}
        context={toolContext}
        onSaveArtifact={onSaveArtifact}
      />
      <FollowupEmailDialog
        open={activeTool === 'email'}
        onOpenChange={(o) => setActiveTool(o ? 'email' : null)}
        context={toolContext}
        onSaveArtifact={onSaveArtifact}
      />
    </Card>
  )
}
