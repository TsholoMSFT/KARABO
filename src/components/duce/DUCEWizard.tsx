import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CheckCircle,
  Compass,
  FlowArrow,
  Gauge,
  House,
  Lightbulb,
  ListChecks,
  Plus,
  Stack,
  Trash,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import type { UseCase, Industry, BusinessFunction } from '@/lib/types'
import type {
  AIFitCategory,
  DecisionContext,
  DecisionLogEntry,
  DUCEDisposition,
  FeasibilityBreakdown,
  RoadmapPlacement,
} from '@/lib/duce-types'
import { useDUCESession } from '@/hooks/use-duce-session'
import { useUserMode } from '@/hooks/use-user-mode'
import {
  classifyAIFit,
  recommendDisposition,
  validateEngagement,
  placeOnRoadmap,
  DISPOSITION_LABELS,
  DISPOSITION_COLORS,
} from '@/lib/decision-engine'

import { UserModeToggle } from './UserModeToggle'
import { StrategicObjectivesForm } from './StrategicObjectivesForm'
import { groupedBusinessFunctions, businessFunctionLabel } from '@/lib/business-functions'
import { ProcessMappingTable } from './ProcessMappingTable'
import { ProblemQuantificationStep } from './ProblemQuantificationStep'
import { FeasibilityBreakdownEditor } from './FeasibilityBreakdownEditor'
import { AIFitChip } from './AIFitChip'
import { PatternLibrary } from './PatternLibrary'
import { RoadmapTimeline } from './RoadmapTimeline'
import { EarlyEngagementValidator } from './EarlyEngagementValidator'
import { DecisionLog } from './DecisionLog'
import { CoLeadTAPanel } from './CoLeadTAPanel'
import { KnowledgeOutputCard } from './KnowledgeOutputCard'

// ============================================================================
// DUCE Wizard — six-step orchestrator implementing PRD §6 + TA §6
// ============================================================================

export interface DUCEWizardProps {
  sessionId: string
  customerName?: string
  industry?: Industry
  primaryStakeholder?: string
  useCases: UseCase[]
  onUseCasesChange: (next: UseCase[]) => void
  onExit: () => void
}

const STEPS: { id: DUCEStepId; label: string; icon: React.ReactNode }[] = [
  { id: 'strategy', label: 'Strategy', icon: <Compass className="h-4 w-4" /> },
  { id: 'process', label: 'Process', icon: <FlowArrow className="h-4 w-4" /> },
  { id: 'problems', label: 'Problems', icon: <Gauge className="h-4 w-4" /> },
  { id: 'use-cases', label: 'Use Cases', icon: <Lightbulb className="h-4 w-4" /> },
  { id: 'deep-dive', label: 'Deep Dive', icon: <Stack className="h-4 w-4" /> },
  { id: 'output', label: 'Output', icon: <ListChecks className="h-4 w-4" /> },
]

type DUCEStepId = 'strategy' | 'process' | 'problems' | 'use-cases' | 'deep-dive' | 'output'

const newUseCase = (): UseCase => ({
  id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  description: '',
  impact: 5,
  feasibility: 5,
  rice: { reach: 100, impact: 2, confidence: 0.7, effort: 4 },
  createdAt: Date.now(),
})

const defaultBreakdown: FeasibilityBreakdown = {
  dataReadiness: 3,
  technicalComplexity: 3,
  integrationRisk: 3,
  changeReadiness: 3,
}

export function DUCEWizard({
  sessionId,
  customerName,
  industry,
  primaryStakeholder,
  useCases,
  onUseCasesChange,
  onExit,
}: DUCEWizardProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEPS[stepIdx].id
  const { isFacilitator } = useUserMode()
  const { data, update } = useDUCESession(sessionId)

  // Hydrate decisionContext from session-level signals on first interaction
  const ctx: DecisionContext = useMemo(
    () => ({
      industry: industry ?? data.decisionContext.industry,
      ...data.decisionContext,
    }),
    [industry, data.decisionContext]
  )

  const validation = useMemo(
    () =>
      validateEngagement({
        objectives: data.objectives,
        processSteps: data.processSteps,
        problems: data.problems,
        context: ctx,
        hasComplianceReview: !!useCases.find((u) => u.regulatoryAssessment),
        hasPrimaryStakeholder: !!primaryStakeholder,
        hasIndustry: !!industry,
      }),
    [data.objectives, data.processSteps, data.problems, ctx, useCases, primaryStakeholder, industry]
  )

  const goNext = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
  const goPrev = () => setStepIdx((i) => Math.max(0, i - 1))

  const setObjectives = (objectives: typeof data.objectives) => update({ objectives })
  const setProcessSteps = (processSteps: typeof data.processSteps) => update({ processSteps })
  const setProblems = (problems: typeof data.problems) => update({ problems })
  const setCoLeads = (coLeadInputs: typeof data.coLeadInputs) => update({ coLeadInputs })

  const setContext = (patch: Partial<DecisionContext>) =>
    update({ decisionContext: { ...data.decisionContext, ...patch } })

  const setSelectedPatterns = (selectedPatternIds: string[]) => update({ selectedPatternIds })
  const togglePattern = (id: string) => {
    const next = data.selectedPatternIds.includes(id)
      ? data.selectedPatternIds.filter((x) => x !== id)
      : [...data.selectedPatternIds, id]
    setSelectedPatterns(next)
  }

  // ---- Use case helpers ----
  const updateUseCase = (id: string, patch: Partial<UseCase>) =>
    onUseCasesChange(useCases.map((u) => (u.id === id ? { ...u, ...patch } : u)))

  const removeUseCase = (id: string) => {
    onUseCasesChange(useCases.filter((u) => u.id !== id))
    const next = { ...data.feasibilityBreakdowns }
    delete next[id]
    update({ feasibilityBreakdowns: next })
  }

  const addUseCase = () => {
    const uc: UseCase = { ...newUseCase(), businessFunction: ctx.businessFunctions?.[0] }
    onUseCasesChange([...useCases, uc])
  }

  const setFeasBreakdown = (useCaseId: string, breakdown: FeasibilityBreakdown) =>
    update({
      feasibilityBreakdowns: { ...data.feasibilityBreakdowns, [useCaseId]: breakdown },
    })

  const setAIFit = (useCaseId: string, fit: AIFitCategory) =>
    update({ aiFitAssignments: { ...data.aiFitAssignments, [useCaseId]: fit } })

  const setFinalDisposition = (useCaseId: string, disposition: DUCEDisposition, overridden: boolean, systemRec?: DUCEDisposition) => {
    const uc = useCases.find((u) => u.id === useCaseId)
    update({
      finalDispositions: { ...data.finalDispositions, [useCaseId]: disposition },
      decisionLog: [
        ...data.decisionLog,
        {
          id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          useCaseId,
          decision: `Disposition for "${uc?.title ?? useCaseId}": ${DISPOSITION_LABELS[disposition]}`,
          rationale: overridden
            ? `Facilitator override of system recommendation (${systemRec ? DISPOSITION_LABELS[systemRec] : 'n/a'}).`
            : 'System recommendation accepted.',
          systemRecommendation: systemRec,
          finalDisposition: disposition,
          overridden,
        } as DecisionLogEntry,
      ],
    })
  }

  // ---- Roadmap auto-derivation ----
  const roadmap: RoadmapPlacement[] = useMemo(
    () => useCases.map((uc) => placeOnRoadmap(uc, data.finalDispositions[uc.id])),
    [useCases, data.finalDispositions]
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onExit}>
              <CaretLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold leading-tight">DUCE — Innovation Hub Engine</h1>
              <p className="text-xs text-muted-foreground">
                {customerName ?? 'Engagement'}
                {industry ? ` · ${industry}` : ''}
                {ctx.businessFunctions?.[0] ? ` · ${businessFunctionLabel(ctx.businessFunctions[0])}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={
                validation.overall === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : validation.overall === 'needs-attention'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }
            >
              {validation.overall === 'ready'
                ? 'Ready'
                : validation.overall === 'needs-attention'
                ? 'Needs attention'
                : 'Blocked'}
            </Badge>
            <UserModeToggle />
          </div>
        </div>
        {/* Step rail */}
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const active = i === stepIdx
              const done = i < stepIdx
              return (
                <button
                  key={s.id}
                  onClick={() => setStepIdx(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : done
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {done ? <CheckCircle className="h-3.5 w-3.5" weight="fill" /> : s.icon}
                  <span className="font-medium">
                    {i + 1}. {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {step === 'strategy' && (
            <>
              <StrategicObjectivesForm
                objectives={data.objectives}
                onChange={setObjectives}
                participantMode={!isFacilitator}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Context</CardTitle>
                  <CardDescription>Drives pattern recommendations and validation rules.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data residency</Label>
                    <Select
                      value={ctx.dataResidency ?? ''}
                      onValueChange={(v) => setContext({ dataResidency: v as DecisionContext['dataResidency'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sovereign-required">Sovereign required</SelectItem>
                        <SelectItem value="preferred">In-region preferred</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Scale profile</Label>
                    <Select
                      value={ctx.scaleProfile ?? ''}
                      onValueChange={(v) => setContext({ scaleProfile: v as DecisionContext['scaleProfile'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pilot">Pilot</SelectItem>
                        <SelectItem value="department">Departmental</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Business function</Label>
                    <Select
                      value={ctx.businessFunctions?.[0] ?? ''}
                      onValueChange={(v) => setContext({ businessFunctions: v ? [v as BusinessFunction] : undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Enterprise-wide (all functions)" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedBusinessFunctions().map((g) => (
                          <SelectGroup key={g.group}>
                            <SelectLabel>{g.label}</SelectLabel>
                            {g.functions.map((f) => (
                              <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-md border p-2.5 bg-card">
                    <span className="text-sm">Real-time / streaming</span>
                    <Switch checked={!!ctx.realTime} onCheckedChange={(v) => setContext({ realTime: v })} />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-md border p-2.5 bg-card">
                    <span className="text-sm">External users involved</span>
                    <Switch
                      checked={!!ctx.externalUsers}
                      onCheckedChange={(v) => setContext({ externalUsers: v })}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-md border p-2.5 bg-card">
                    <span className="text-sm">Regulated industry</span>
                    <Switch checked={!!ctx.regulated} onCheckedChange={(v) => setContext({ regulated: v })} />
                  </label>
                </CardContent>
              </Card>
              {isFacilitator && <EarlyEngagementValidator result={validation} />}
            </>
          )}

          {step === 'process' && <ProcessMappingTable steps={data.processSteps} onChange={setProcessSteps} />}

          {step === 'problems' && (
            <ProblemQuantificationStep problems={data.problems} onChange={setProblems} />
          )}

          {step === 'use-cases' && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Candidate Use Cases</CardTitle>
                    <CardDescription>
                      Capture candidate AI / automation use cases. Score impact and feasibility for the decision engine.
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{useCases.length} use case{useCases.length === 1 ? '' : 's'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {useCases.map((uc, idx) => {
                  const fit = data.aiFitAssignments[uc.id] ?? classifyAIFit(uc)
                  return (
                    <div key={uc.id} className="rounded-lg border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">#{idx + 1}</Badge>
                          <AIFitChip fit={fit} />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeUseCase(uc.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={uc.title}
                        onChange={(e) => updateUseCase(uc.id, { title: e.target.value })}
                        placeholder="Use case title"
                      />
                      <Textarea
                        rows={2}
                        value={uc.description}
                        onChange={(e) => updateUseCase(uc.id, { description: e.target.value })}
                        placeholder="Brief description of the opportunity"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs">Impact</Label>
                            <span className="text-xs font-mono">{uc.impact}/10</span>
                          </div>
                          <Slider
                            min={1}
                            max={10}
                            value={[uc.impact]}
                            onValueChange={(v) => updateUseCase(uc.id, { impact: v[0] })}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs">Feasibility</Label>
                            <span className="text-xs font-mono">{uc.feasibility}/10</span>
                          </div>
                          <Slider
                            min={1}
                            max={10}
                            value={[uc.feasibility]}
                            onValueChange={(v) => updateUseCase(uc.id, { feasibility: v[0] })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">AI Fit</Label>
                        <Select value={fit} onValueChange={(v) => setAIFit(uc.id, v as AIFitCategory)}>
                          <SelectTrigger className="w-48 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automation">Automation</SelectItem>
                            <SelectItem value="copilot">Copilot</SelectItem>
                            <SelectItem value="predictive">Predictive AI</SelectItem>
                            <SelectItem value="agentic">Agentic Workflows</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-[10px] text-muted-foreground">
                          (auto-classified from title & description)
                        </span>
                      </div>
                    </div>
                  )
                })}
                <Button onClick={addUseCase} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-1" /> Add use case
                </Button>
                {useCases.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No use cases yet. Add candidates derived from quantified problems and objectives.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {step === 'deep-dive' && (
            <Tabs defaultValue="dispositions">
              <TabsList>
                <TabsTrigger value="dispositions">Dispositions</TabsTrigger>
                <TabsTrigger value="patterns">Pattern Library</TabsTrigger>
                <TabsTrigger value="co-leads">Co-Lead TAs</TabsTrigger>
              </TabsList>

              <TabsContent value="dispositions" className="space-y-3 mt-3">
                {useCases.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-sm text-muted-foreground">
                      Add use cases in Step 4 to see disposition recommendations.
                    </CardContent>
                  </Card>
                )}
                {useCases.map((uc) => {
                  const breakdown = data.feasibilityBreakdowns[uc.id] ?? defaultBreakdown
                  const rec = recommendDisposition(uc, breakdown)
                  const final = data.finalDispositions[uc.id] ?? rec.disposition
                  const overridden = final !== rec.disposition
                  return (
                    <Card key={uc.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{uc.title || '(untitled use case)'}</CardTitle>
                            <CardDescription className="text-xs">{uc.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={`text-[10px] ${DISPOSITION_COLORS[rec.disposition]}`}>
                              System: {DISPOSITION_LABELS[rec.disposition]}
                            </Badge>
                            {overridden && (
                              <Badge variant="outline" className={`text-[10px] ${DISPOSITION_COLORS[final]}`}>
                                Final: {DISPOSITION_LABELS[final]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-md bg-muted/30 p-2 text-xs space-y-1">
                          <div>
                            <strong>Rationale:</strong> {rec.rationale}
                          </div>
                          <div className="text-muted-foreground">
                            Triggered: {rec.triggeredRules.join(', ')} · Impact {rec.impact} · Feas avg{' '}
                            {rec.feasibilityAvg?.toFixed(2)}
                          </div>
                        </div>
                        {isFacilitator && (
                          <>
                            <Separator />
                            <FeasibilityBreakdownEditor
                              value={breakdown}
                              onChange={(b) => setFeasBreakdown(uc.id, b)}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <Label className="text-xs">Final disposition</Label>
                              <Select
                                value={final}
                                onValueChange={(v) => setFinalDisposition(uc.id, v as DUCEDisposition, v !== rec.disposition, rec.disposition)}
                              >
                                <SelectTrigger className="w-44 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pursue">Pursue</SelectItem>
                                  <SelectItem value="refine">Refine</SelectItem>
                                  <SelectItem value="defer">Defer</SelectItem>
                                  <SelectItem value="no-go">No-Go</SelectItem>
                                </SelectContent>
                              </Select>
                              {overridden && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300">
                                  Override
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </TabsContent>

              <TabsContent value="patterns" className="mt-3">
                <PatternLibrary
                  selectedIds={data.selectedPatternIds}
                  onToggle={togglePattern}
                  context={ctx}
                />
              </TabsContent>

              <TabsContent value="co-leads" className="mt-3">
                <CoLeadTAPanel inputs={data.coLeadInputs} onChange={setCoLeads} />
              </TabsContent>
            </Tabs>
          )}

          {step === 'output' && (
            <div className="space-y-4">
              <RoadmapTimeline useCases={useCases} dispositions={data.finalDispositions} placements={roadmap} />
              <KnowledgeOutputCard
                duce={data}
                onSnapshot={(snapshot) => {
                  update({ knowledgeOutput: snapshot })
                  toast.success('Knowledge output snapshot saved to session')
                }}
              />
              <DecisionLog entries={data.decisionLog} />
              <EarlyEngagementValidator result={validation} />
            </div>
          )}
        </motion.div>

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={goPrev} disabled={stepIdx === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            Step {stepIdx + 1} of {STEPS.length}
          </div>
          {stepIdx === STEPS.length - 1 ? (
            <Button onClick={onExit}>
              <House className="h-4 w-4 mr-1" /> Finish & Return
            </Button>
          ) : (
            <Button onClick={goNext}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
