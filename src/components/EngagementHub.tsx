import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Plus, Toolbox, CalendarBlank, EnvelopeSimple, ListChecks, ClipboardText,
  TreeStructure, Path, FolderPlus, ChartBar, FileText, Trash, Sparkle,
} from '@phosphor-icons/react'
import type { Engagement, EngagementArtifactKind, EngagementType, Industry, UseCase } from '@/lib/types'
import { useEngagements } from '@/hooks/use-engagements'
import { ENGAGEMENT_TYPE_LABELS } from '@/lib/engagement/format'
import { downloadMarkdown, downloadDocxFromMarkdown, artifactFilename } from '@/lib/engagement/exports'
import { AgendaBuilderDialog, type EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'
import { FollowupEmailDialog } from '@/components/engagement/FollowupEmailDialog'
import { ArchitectureDiagramDialog } from '@/components/engagement/ArchitectureDiagramDialog'
import { TimelineGeneratorDialog } from '@/components/engagement/TimelineGeneratorDialog'
import { CloseoutDialog } from '@/components/engagement/CloseoutDialog'
import { JourneyDialog } from '@/components/engagement/JourneyDialog'
import { EngagementInitiatorDialog } from '@/components/engagement/EngagementInitiatorDialog'
import { HubInsightsPanel } from '@/components/HubInsightsPanel'

interface EngagementHubProps {
  customerName?: string
  industry?: Industry
  sessionId?: string
  useCases?: UseCase[]
  onBack: () => void
}

type ToolKind = EngagementArtifactKind | 'initiator' | 'insights'

interface ToolDef {
  kind: ToolKind
  label: string
  description: string
  icon: React.ReactNode
  status: 'ready' | 'soon'
}

const TOOLS: ToolDef[] = [
  { kind: 'agenda', label: 'Agenda Builder', description: 'Time-boxed session agenda from notes / transcript', icon: <CalendarBlank size={22} weight="duotone" />, status: 'ready' },
  { kind: 'email', label: 'Follow-up Email', description: 'Audience-calibrated recap email', icon: <EnvelopeSimple size={22} weight="duotone" />, status: 'ready' },
  { kind: 'timeline', label: 'Task Timeline', description: 'T-28 → T+3 plan, Planner-ready CSV', icon: <ListChecks size={22} weight="duotone" />, status: 'ready' },
  { kind: 'closeout', label: 'Closeout / Debrief', description: 'Decisions, actions, risks, next steps', icon: <ClipboardText size={22} weight="duotone" />, status: 'ready' },
  { kind: 'diagram', label: 'Architecture Diagram', description: 'Mermaid diagram from notes', icon: <TreeStructure size={22} weight="duotone" />, status: 'soon' },
  { kind: 'journey', label: 'Customer Journey', description: 'Promote to an engagement journey', icon: <Path size={22} weight="duotone" />, status: 'ready' },
  { kind: 'initiator', label: 'Engagement Initiator', description: 'Scaffold engagement metadata + tasks', icon: <FolderPlus size={22} weight="duotone" />, status: 'ready' },
  { kind: 'insights', label: 'Hub Insights', description: 'Portfolio rollup across accounts', icon: <ChartBar size={22} weight="duotone" />, status: 'ready' },
]

const ENGAGEMENT_TYPES = Object.keys(ENGAGEMENT_TYPE_LABELS) as EngagementType[]

/** Tools that don't operate on an already-selected engagement. */
const NO_SELECTION_TOOLS: ToolKind[] = ['initiator', 'insights']

const KIND_LABEL: Record<EngagementArtifactKind, string> = {
  agenda: 'Agenda', email: 'Email', timeline: 'Timeline', closeout: 'Closeout', diagram: 'Diagram', journey: 'Journey',
}

export function EngagementHub({ customerName, industry, sessionId, useCases, onBack }: EngagementHubProps) {
  const { engagements, addEngagement, deleteEngagement, saveArtifact, deleteArtifact } = useEngagements()

  const visibleEngagements = useMemo(
    () => engagements.filter((e) => !customerName || e.customerName === customerName),
    [engagements, customerName],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newType, setNewType] = useState<EngagementType>('discovery')
  const [newDate, setNewDate] = useState('')
  const [newStakeholders, setNewStakeholders] = useState('')
  const [activeTool, setActiveTool] = useState<ToolKind | null>(null)

  useEffect(() => {
    if (!selectedId && visibleEngagements.length > 0) setSelectedId(visibleEngagements[0].id)
  }, [visibleEngagements, selectedId])

  const selected: Engagement | null = engagements.find((e) => e.id === selectedId) ?? null

  const handleCreate = () => {
    const engagement: Engagement = {
      id: `eng-${Date.now()}`,
      customerName: (customerName || 'Customer').trim(),
      sessionId,
      type: newType,
      status: 'planned',
      engagementDate: newDate ? new Date(newDate).getTime() : undefined,
      stakeholders: newStakeholders ? newStakeholders.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      industry,
      createdAt: Date.now(),
    }
    addEngagement(engagement)
    setSelectedId(engagement.id)
    setShowNew(false)
    setNewDate('')
    setNewStakeholders('')
    toast.success('Engagement created')
  }

  const toolContext: EngagementToolContext = {
    customerName: selected?.customerName || customerName,
    industry: industry as string | undefined,
    engagementType: selected ? ENGAGEMENT_TYPE_LABELS[selected.type] : undefined,
    useCases: useCases?.map((u) => ({ title: u.title, description: u.description })),
    stakeholders: selected?.stakeholders,
  }

  const openTool = (tool: ToolDef) => {
    if (tool.status === 'soon') { toast.info(`${tool.label} is coming soon`); return }
    if (!NO_SELECTION_TOOLS.includes(tool.kind) && !selected) { toast.info('Create or select an engagement first'); return }
    setActiveTool(tool.kind)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft size={16} /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Toolbox size={24} weight="duotone" className="text-primary" /> Engagement Tools
            </h1>
            <p className="text-sm text-muted-foreground">
              {customerName ? `Engagement artifacts for ${customerName}` : 'Generate and manage engagement artifacts'}
            </p>
          </div>
        </div>
      </div>

      {/* Engagement selector / create */}
      <Card className="border-2 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Engagement</CardTitle>
              <CardDescription>Pick an engagement to attach artifacts to, or create a new one.</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowNew((v) => !v)}>
              <Plus size={16} /> New engagement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleEngagements.length > 0 && (
            <Select value={selectedId ?? ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full sm:w-[420px]">
                <SelectValue placeholder="Select an engagement" />
              </SelectTrigger>
              <SelectContent>
                {visibleEngagements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.customerName} — {ENGAGEMENT_TYPE_LABELS[e.type]}
                    {e.engagementDate ? ` (${new Date(e.engagementDate).toLocaleDateString()})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showNew && (
            <div className="grid gap-3 sm:grid-cols-3 rounded-lg border p-4 bg-muted/20">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as EngagementType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{ENGAGEMENT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="eng-date">Date</Label>
                <Input id="eng-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="eng-stake">Stakeholders (comma-separated)</Label>
                <Input id="eng-stake" value={newStakeholders} onChange={(e) => setNewStakeholders(e.target.value)} placeholder="Jane Doe, John Smith" />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button size="sm" className="gap-2" onClick={handleCreate}><Plus size={16} /> Create engagement</Button>
              </div>
            </div>
          )}

          {visibleEngagements.length === 0 && !showNew && (
            <p className="text-sm text-muted-foreground">No engagements yet — create one to start generating artifacts.</p>
          )}
        </CardContent>
      </Card>

      {/* Tools grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Generators</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <button
              key={tool.kind}
              type="button"
              onClick={() => openTool(tool)}
              disabled={tool.status === 'ready' && !selected && !NO_SELECTION_TOOLS.includes(tool.kind)}
              className="text-left rounded-lg border p-4 transition-colors hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-card"
            >
              <div className="flex items-start justify-between">
                <span className="text-primary">{tool.icon}</span>
                {tool.status === 'soon' && <Badge variant="outline" className="text-[10px]">Soon</Badge>}
              </div>
              <div className="mt-2 font-medium text-sm">{tool.label}</div>
              <div className="text-xs text-muted-foreground">{tool.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Artifacts list */}
      {selected && (
        <Card className="border-2 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FileText size={18} /> Saved artifacts</CardTitle>
            <CardDescription>
              {selected.artifacts?.length
                ? `${selected.artifacts.length} artifact${selected.artifacts.length === 1 ? '' : 's'} on this engagement`
                : 'Generated agendas, emails, timelines, and more appear here.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(selected.artifacts ?? []).length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Sparkle size={16} /> Use a generator above to create your first artifact.
              </div>
            )}
            {(selected.artifacts ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{KIND_LABEL[a.kind]}</Badge>
                    <span className="font-medium text-sm truncate">{a.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(a.generatedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="gap-1"
                    onClick={() => downloadMarkdown(a.markdown, artifactFilename(selected.customerName, a.kind, 'md'))}>
                    <FileText size={14} /> .md
                  </Button>
                  {(a.kind === 'agenda' || a.kind === 'closeout') && (
                    <Button size="sm" variant="ghost" className="gap-1"
                      onClick={() => downloadDocxFromMarkdown(a.markdown, artifactFilename(selected.customerName, a.kind, 'docx'), a.title)}>
                      <FileText size={14} weight="fill" /> .docx
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => { deleteArtifact(selected.id, a.id); toast.success('Artifact removed') }}>
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selected && visibleEngagements.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-destructive gap-2"
            onClick={() => { deleteEngagement(selected.id); setSelectedId(null); toast.success('Engagement deleted') }}>
            <Trash size={14} /> Delete this engagement
          </Button>
        </div>
      )}

      {/* Tool dialogs */}
      {selected && (
        <AgendaBuilderDialog
          open={activeTool === 'agenda'}
          onOpenChange={(o) => setActiveTool(o ? 'agenda' : null)}
          context={toolContext}
          onSaveArtifact={(artifact) => saveArtifact(selected.id, artifact)}
        />
      )}
      {selected && (
        <FollowupEmailDialog
          open={activeTool === 'email'}
          onOpenChange={(o) => setActiveTool(o ? 'email' : null)}
          context={toolContext}
          onSaveArtifact={(artifact) => saveArtifact(selected.id, artifact)}
        />
      )}
      {selected && (
        <ArchitectureDiagramDialog
          open={activeTool === 'diagram'}
          onOpenChange={(o) => setActiveTool(o ? 'diagram' : null)}
          context={toolContext}
          onSaveArtifact={(artifact) => saveArtifact(selected.id, artifact)}
        />
      )}
      {selected && (
        <TimelineGeneratorDialog
          open={activeTool === 'timeline'}
          onOpenChange={(o) => setActiveTool(o ? 'timeline' : null)}
          context={toolContext}
          engagementDate={selected.engagementDate}
          onSaveArtifact={(artifact) => saveArtifact(selected.id, artifact)}
        />
      )}
      {selected && (
        <CloseoutDialog
          open={activeTool === 'closeout'}
          onOpenChange={(o) => setActiveTool(o ? 'closeout' : null)}
          context={toolContext}
          onSaveArtifact={(artifact) => saveArtifact(selected.id, artifact)}
        />
      )}
      {selected && (
        <JourneyDialog
          open={activeTool === 'journey'}
          onOpenChange={(o) => setActiveTool(o ? 'journey' : null)}
          context={toolContext}
          onSaveArtifact={(artifact) => saveArtifact(selected.id, artifact)}
        />
      )}
      <EngagementInitiatorDialog
        open={activeTool === 'initiator'}
        onOpenChange={(o) => setActiveTool(o ? 'initiator' : null)}
        defaultCustomerName={customerName}
        sessionId={sessionId}
        industry={industry}
        onCreate={(e) => addEngagement(e)}
        onCreated={(id) => setSelectedId(id)}
      />
      <HubInsightsPanel
        open={activeTool === 'insights'}
        onOpenChange={(o) => setActiveTool(o ? 'insights' : null)}
      />
    </div>
  )
}
