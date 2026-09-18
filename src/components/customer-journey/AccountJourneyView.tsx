import { useState } from 'react'
import type { AccountCustomerJourney, AccountJourneyNextStep, AccountJourneyStep, DiscoverySession, UseCase } from '@/lib/types'
import { getCustomerSafeJourney } from '@/lib/frontier-ai/journey-builder'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  CheckCircle,
  ClipboardText,
  Circle,
  Clock,
  Eye,
  Link,
  Pencil,
  Plus,
  Target,
  User,
  Users,
  Warning,
  Trash,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AccountJourneyViewProps {
  journey: AccountCustomerJourney
  sessions: DiscoverySession[]
  useCases: UseCase[]
  onUpdate?: (journey: AccountCustomerJourney) => void
  presentation?: boolean
}

const STATUS_LABELS: Record<AccountJourneyStep['recommendationStatus'], string> = {
  'start-now': 'Start now',
  next: 'Next',
  later: 'Later',
  'assumed-in-place': 'Assumed in place',
  'revisit-gap': 'Revisit gap',
}

const STATUS_STYLES: Record<AccountJourneyStep['recommendationStatus'], string> = {
  'start-now': 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200',
  next: 'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200',
  later: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200',
  'assumed-in-place': 'border-slate-300 bg-background text-muted-foreground dark:border-slate-600',
  'revisit-gap': 'border-red-400 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200',
}

const WORKSTREAM_STYLES = {
  shared: { border: 'border-slate-400 dark:border-slate-500', text: 'text-slate-700 dark:text-slate-200' },
  trusted: { border: 'border-sky-500', text: 'text-sky-700 dark:text-sky-300' },
  agentify: { border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
} as const

function listValue(value: string[]): string {
  return value.join('\n')
}

function parseList(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

export function AccountJourneyView({
  journey,
  sessions,
  useCases,
  onUpdate,
  presentation = false,
}: AccountJourneyViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newNextStep, setNewNextStep] = useState('')
  const visibleJourney = getCustomerSafeJourney(journey)
  const canEdit = !!onUpdate && !presentation

  const updateStep = (offeringId: AccountJourneyStep['offeringId'], updates: Partial<AccountJourneyStep>) => {
    if (!onUpdate) return
    onUpdate({
      ...journey,
      workstreams: journey.workstreams.map((workstream) => ({
        ...workstream,
        steps: workstream.steps.map((step) => step.offeringId === offeringId ? { ...step, ...updates } : step),
      })),
      updatedAt: Date.now(),
    })
  }

  const updateJourney = (updates: Partial<AccountCustomerJourney>) => {
    if (!onUpdate) return
    onUpdate({ ...journey, ...updates, updatedAt: Date.now() })
  }

  const toggleUseCase = (step: AccountJourneyStep, useCaseId: string, checked: boolean) => {
    const linkedUseCaseIds = checked
      ? [...new Set([...step.linkedUseCaseIds, useCaseId])]
      : step.linkedUseCaseIds.filter((id) => id !== useCaseId)
    const sourceSessionIds = [...new Set(
      useCases
        .filter((useCase) => linkedUseCaseIds.includes(useCase.id))
        .map((useCase) => useCase.discoverySessionId)
        .filter((id): id is string => !!id),
    )]
    updateStep(step.offeringId, { linkedUseCaseIds, sourceSessionIds })
  }

  const updateNextStep = (stepId: string, updates: Partial<AccountJourneyNextStep>) => {
    updateJourney({
      nextSteps: journey.nextSteps.map((step) => step.id === stepId ? {
        ...step,
        ...updates,
        completedAt: updates.isComplete && !step.isComplete ? Date.now() : step.completedAt,
      } : step),
    })
  }

  const addNextStep = () => {
    const action = newNextStep.trim()
    if (!action) return
    updateJourney({
      nextSteps: [...journey.nextSteps, {
        id: `${journey.customerId}-next-${Date.now()}`,
        action,
        isComplete: false,
      }],
    })
    setNewNextStep('')
  }

  const toggleComplete = (step: AccountJourneyStep) => {
    updateStep(step.offeringId, {
      isComplete: !step.isComplete,
      completedAt: !step.isComplete ? Date.now() : undefined,
    })
  }

  return (
    <div className={cn('space-y-7', presentation && 'print:space-y-5')}>
      <section className="border-y border-border bg-muted/25 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{visibleJourney.customerName} · Frontier AI journey</p>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Input value={journey.title} onChange={(event) => updateJourney({ title: event.target.value })} className="text-xl font-bold" />
                <Textarea value={journey.ambition} onChange={(event) => updateJourney({ ambition: event.target.value })} rows={3} className="text-sm" />
              </div>
            ) : (
              <>
                <h2 className="mt-1 text-3xl font-bold">{visibleJourney.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{visibleJourney.ambition}</p>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="px-3 py-1.5">{visibleJourney.maturity.stage}</Badge>
            <Badge variant="outline" className="px-3 py-1.5">
              {visibleJourney.maturity.pillarsAtThreshold}/9 pillars at implementation
            </Badge>
            {canEdit && (
              <Button variant={isEditing ? 'default' : 'outline'} size="sm" onClick={() => setIsEditing((value) => !value)}>
                {isEditing ? <Eye size={15} /> : <Pencil size={15} />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
            )}
          </div>
        </div>
      </section>

      {visibleJourney.warnings.length > 0 && (
        <section className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          {visibleJourney.warnings.map((warning) => (
            <p key={warning.id} className="flex items-start gap-2 text-sm">
              <Warning size={18} weight="fill" className="mt-0.5 shrink-0" />
              {warning.message}
            </p>
          ))}
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {visibleJourney.workstreams.map((workstream) => {
          const style = WORKSTREAM_STYLES[workstream.id]
          return (
            <section key={workstream.id} className="min-w-0">
              <div className={cn('mb-4 border-t-4 pt-3', style.border)}>
                <h3 className={cn('text-lg font-bold', style.text)}>{workstream.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {workstream.steps.filter((step) => step.isComplete).length}/{workstream.steps.length} engagements complete
                </p>
              </div>

              <div className="space-y-4">
                {workstream.steps.map((step, index) => {
                  const linkedUseCases = useCases.filter((useCase) => step.linkedUseCaseIds.includes(useCase.id))
                  const sourceSessions = sessions.filter((session) => step.sourceSessionIds.includes(session.id))
                  return (
                    <div key={step.offeringId} className="relative pl-6">
                      {index < workstream.steps.length - 1 && (
                        <span className="absolute left-[7px] top-8 h-[calc(100%+1rem)] w-px bg-border" />
                      )}
                      <span className={cn(
                        'absolute left-0 top-5 flex size-4 items-center justify-center rounded-full border-2 bg-background',
                        step.isComplete ? 'border-emerald-600 bg-emerald-600 text-white' : style.border,
                      )}>
                        {step.isComplete && <CheckCircle size={11} weight="fill" />}
                      </span>

                      <Card className={cn('rounded-md border-l-4 shadow-sm', style.border, step.isComplete && 'opacity-70')}>
                        <CardHeader className="space-y-3 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className={cn('rounded-sm text-[10px]', STATUS_STYLES[step.recommendationStatus])}>
                                  {STATUS_LABELS[step.recommendationStatus]}
                                </Badge>
                                <Badge variant="secondary" className="rounded-sm text-[10px]">{step.deliveryStage}</Badge>
                              </div>
                              <CardTitle className="text-base leading-snug">{step.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="shrink-0 gap-1 rounded-sm text-[10px]">
                                <Clock size={11} /> {step.duration}
                              </Badge>
                              {canEdit && (
                                <Checkbox checked={step.isComplete} onCheckedChange={() => toggleComplete(step)} aria-label={`Complete ${step.title}`} />
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-0">
                          <div>
                            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                              <Target size={13} /> Customer value
                            </p>
                            {isEditing ? (
                              <Textarea value={step.customerValue} onChange={(event) => updateStep(step.offeringId, { customerValue: event.target.value })} rows={3} className="text-sm" />
                            ) : (
                              <p className="text-sm leading-5">{step.customerValue}</p>
                            )}
                          </div>

                          <div>
                            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-sky-700 dark:text-sky-300">
                              <Link size={13} /> Applied context
                            </p>
                            {isEditing ? (
                              <Textarea value={step.customerContext} onChange={(event) => updateStep(step.offeringId, { customerContext: event.target.value })} rows={3} className="text-sm" />
                            ) : (
                              <p className="text-sm leading-5 text-muted-foreground">{step.customerContext}</p>
                            )}
                            {linkedUseCases.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {linkedUseCases.map((useCase) => <Badge key={useCase.id} variant="secondary" className="rounded-sm text-[10px]">{useCase.title}</Badge>)}
                              </div>
                            )}
                            {sourceSessions.length > 0 && (
                              <p className="mt-2 text-[11px] text-muted-foreground">
                                Grounded in {sourceSessions.map((session) => session.name).join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="border-l-2 border-amber-400 pl-3">
                            <p className="text-[11px] font-bold uppercase text-amber-800 dark:text-amber-300">Why now</p>
                            {isEditing ? (
                              <Textarea value={step.whyNow} onChange={(event) => updateStep(step.offeringId, { whyNow: event.target.value })} rows={3} className="mt-1 text-sm" />
                            ) : (
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.whyNow}</p>
                            )}
                          </div>

                          <Accordion type="single" collapsible>
                            <AccordionItem value="details" className="border-t border-b-0">
                              <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">Engagement detail</AccordionTrigger>
                              <AccordionContent className="space-y-4">
                                {isEditing && (
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-1 text-xs"><Link size={12} /> Linked use cases</Label>
                                    <div className="max-h-40 space-y-2 overflow-y-auto border p-2">
                                      {useCases.map((useCase) => (
                                        <label key={useCase.id} className="flex items-start gap-2 text-xs">
                                          <Checkbox
                                            checked={step.linkedUseCaseIds.includes(useCase.id)}
                                            onCheckedChange={(checked) => toggleUseCase(step, useCase.id, !!checked)}
                                          />
                                          <span>{useCase.title}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <EditableList label="Prerequisites" icon={<CheckCircle size={13} />} values={step.prerequisites} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { prerequisites: values })} />
                                <EditableList label="Participants" icon={<Users size={13} />} values={step.participants} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { participants: values })} />
                                <EditableList label="Customer commitments" icon={<Users size={13} />} values={step.customerCommitments} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { customerCommitments: values })} />
                                <EditableList label="Activities" icon={<ClipboardText size={13} />} values={step.focusAreas} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { focusAreas: values })} />
                                <EditableList label="Deliverables" icon={<Circle size={7} weight="fill" />} values={step.deliverables} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { deliverables: values })} />
                                <EditableList label="Outcomes" icon={<Target size={13} />} values={step.outcomes} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { outcomes: values })} />
                                <EditableList label="Success criteria" icon={<CheckCircle size={13} />} values={step.successCriteria} editing={isEditing} onChange={(values) => updateStep(step.offeringId, { successCriteria: values })} />

                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <Label className="mb-1 flex items-center gap-1 text-xs"><User size={12} /> Owner</Label>
                                    {isEditing
                                      ? <Input value={step.owner ?? ''} onChange={(event) => updateStep(step.offeringId, { owner: event.target.value })} className="h-8 text-xs" />
                                      : <p className="text-xs text-muted-foreground">{step.owner || 'To agree'}</p>}
                                  </div>
                                  <div>
                                    <Label className="mb-1 flex items-center gap-1 text-xs"><Clock size={12} /> Target timing</Label>
                                    {isEditing
                                      ? <Input value={step.targetTiming ?? ''} onChange={(event) => updateStep(step.offeringId, { targetTiming: event.target.value })} placeholder="e.g. FY27 Q1" className="h-8 text-xs" />
                                      : <p className="text-xs text-muted-foreground">{step.targetTiming || 'To agree'}</p>}
                                  </div>
                                </div>
                                <div>
                                  <Label className="mb-1 flex items-center gap-1 text-xs"><Pencil size={12} /> Notes</Label>
                                  {isEditing
                                    ? <Textarea value={step.notes ?? ''} onChange={(event) => updateStep(step.offeringId, { notes: event.target.value })} rows={3} className="text-xs" />
                                    : <p className="text-xs text-muted-foreground">{step.notes || 'No additional notes.'}</p>}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <section className="border-t border-border pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Mutual next steps</h3>
            <p className="text-xs text-muted-foreground">Actions jointly agreed to move the journey forward.</p>
          </div>
          <Badge variant="outline">
            {visibleJourney.nextSteps.filter((step) => step.isComplete).length}/{visibleJourney.nextSteps.length} complete
          </Badge>
        </div>
        <div className="space-y-2">
          {visibleJourney.nextSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-3 border-t py-3 first:border-0">
              {canEdit && <Checkbox checked={step.isComplete} onCheckedChange={(checked) => updateNextStep(step.id, { isComplete: !!checked })} />}
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <Input value={step.action} onChange={(event) => updateNextStep(step.id, { action: event.target.value })} className="h-8 text-sm" />
                ) : (
                  <p className={cn('text-sm', step.isComplete && 'text-muted-foreground line-through')}>{step.action}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Input value={step.owner ?? ''} onChange={(event) => updateNextStep(step.id, { owner: event.target.value })} placeholder="Owner" className="h-7 w-40 text-xs" />
                      <Input type="date" value={step.targetDate ?? ''} onChange={(event) => updateNextStep(step.id, { targetDate: event.target.value })} className="h-7 w-40 text-xs" />
                    </>
                  ) : (
                    <>
                      {step.owner && <span className="text-xs text-muted-foreground">Owner: {step.owner}</span>}
                      {step.targetDate && <span className="text-xs text-muted-foreground">Target: {new Date(step.targetDate).toLocaleDateString()}</span>}
                    </>
                  )}
                </div>
              </div>
              {isEditing && (
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => updateJourney({ nextSteps: journey.nextSteps.filter((item) => item.id !== step.id) })}>
                  <Trash size={14} />
                </Button>
              )}
            </div>
          ))}
          {isEditing && (
            <div className="flex gap-2 pt-2">
              <Input value={newNextStep} onChange={(event) => setNewNextStep(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addNextStep()} placeholder="Add a mutual next step" />
              <Button variant="outline" onClick={addNextStep} disabled={!newNextStep.trim()}><Plus size={15} /> Add</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function EditableList({
  label,
  icon,
  values,
  editing,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  values: string[]
  editing: boolean
  onChange: (values: string[]) => void
}) {
  return (
    <div>
      <Label className="mb-1 flex items-center gap-1.5 text-xs font-semibold">{icon}{label}</Label>
      {editing ? (
        <Textarea value={listValue(values)} onChange={(event) => onChange(parseList(event.target.value))} rows={4} className="text-xs" />
      ) : (
        <ul className="space-y-1">
          {values.map((value) => <li key={value} className="flex items-start gap-2 text-xs text-muted-foreground"><Circle size={6} weight="fill" className="mt-1.5 shrink-0" />{value}</li>)}
        </ul>
      )}
    </div>
  )
}

export default AccountJourneyView