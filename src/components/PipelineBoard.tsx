/**
 * PipelineBoard — the use-case → opportunity funnel as a board.
 *
 * This is the heart of the distilled tool: account teams generate a pipeline of
 * candidate use cases, VALIDATE them with the customer, and the survivors are
 * PROMOTED into opportunities that progress through MCEM Stage 1 → 4 (the last
 * step being the handshake to the CSU).
 *
 * Self-contained: give it the customer's use cases + an updater and it manages
 * opportunities itself via the `useOpportunities` store + the pure MCEM engine.
 */
import { useState, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  CheckCircle,
  Prohibit,
  ArrowArcLeft,
  ArrowRight,
  Handshake,
} from '@phosphor-icons/react'
import type { UseCase } from '@/lib/types'
import {
  MCEM_STAGES,
  MCEM_STAGE_ORDER,
  SALES_ROLES,
  type McemStage,
  type Opportunity,
} from '@/lib/mcem'
import {
  getUseCasePipelineStatus,
  summarizePipeline,
  evaluateStageGate,
  canAdvanceStage,
  recommendedNextAction,
} from '@/lib/mcem-engine'
import { useOpportunities } from '@/hooks/use-opportunities'

export interface PipelineBoardProps {
  /** The customer's use cases (the candidates + validated + parked pool). */
  useCases: UseCase[]
  customerId: string
  discoverySessionId?: string
  /** Persist a use-case change (validation / parking) to the parent store. */
  onUpdateUseCase: (useCase: UseCase) => void
  /** Optional current user's name, recorded on the audit trail. */
  actorName?: string
}

/** A single board column with a header, hint, count, and stacked cards. */
function Column({
  title,
  hint,
  count,
  children,
}: {
  title: string
  hint: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="w-64 shrink-0">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="secondary" className="text-[10px]">
            {count}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="space-y-2">
        {count === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center border border-dashed rounded-md">
            Empty
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function PipelineBoard({
  useCases,
  customerId,
  discoverySessionId,
  onUpdateUseCase,
  actorName,
}: PipelineBoardProps) {
  const ops = useOpportunities()
  const [csaNames, setCsaNames] = useState<Record<string, string>>({})

  const opportunities = ops.forCustomer(customerId)
  const liveOpportunities = opportunities.filter((o) => o.status !== 'closed-lost')
  const summary = summarizePipeline(useCases, opportunities)

  const byStatus = (status: 'candidate' | 'validated' | 'parked') =>
    useCases.filter((uc) => getUseCasePipelineStatus(uc, opportunities) === status)
  const candidates = byStatus('candidate')
  const validated = byStatus('validated')
  const parked = byStatus('parked')
  const stageOpps = (stage: McemStage) => liveOpportunities.filter((o) => o.stage === stage)

  // ── Use-case (funnel) actions ────────────────────────────────────────────
  const validate = (uc: UseCase) => {
    onUpdateUseCase({ ...uc, problemConfirmed: true })
    toast.success('Validated with the customer')
  }
  const park = (uc: UseCase) => {
    onUpdateUseCase({ ...uc, disposition: 'defer' })
    toast('Parked')
  }
  const reactivate = (uc: UseCase) => {
    onUpdateUseCase({ ...uc, disposition: undefined })
    toast('Reactivated')
  }
  const promote = (uc: UseCase) => {
    try {
      ops.promote([uc], { customerId, discoverySessionId, by: actorName })
      toast.success('Promoted to an opportunity')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not promote')
    }
  }

  // ── Opportunity actions ──────────────────────────────────────────────────
  const runOpp = (fn: () => void, okMsg: string) => {
    try {
      fn()
      toast.success(okMsg)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    }
  }
  const advance = (opp: Opportunity) =>
    runOpp(() => ops.advance(opp.id, useCases, { by: actorName }), 'Advanced to the next stage')
  const prepare = (opp: Opportunity) =>
    runOpp(
      () => ops.prepareForHandoff(opp.id, useCases, { preparedBy: actorName, csaName: csaNames[opp.id] }),
      'Handshake package prepared',
    )
  const accept = (opp: Opportunity) => {
    const csa = (csaNames[opp.id] ?? opp.handoff?.csaName ?? '').trim()
    if (!csa) {
      toast.error('Enter the receiving CSA name first')
      return
    }
    runOpp(() => ops.acceptHandoff(opp.id, csa, { by: actorName }), 'Handed off to the CSU')
  }
  const close = (opp: Opportunity) => runOpp(() => ops.close(opp.id, { by: actorName }), 'Opportunity closed')

  // ── Card renderers ───────────────────────────────────────────────────────
  const renderUseCaseCard = (uc: UseCase, status: 'candidate' | 'validated' | 'parked') => (
    <Card key={uc.id} className="p-0">
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium leading-snug">{uc.title}</p>
        {uc.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{uc.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {status === 'candidate' && (
            <>
              <Button size="sm" onClick={() => validate(uc)}>
                <CheckCircle /> Validate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => park(uc)}>
                <Prohibit /> Park
              </Button>
            </>
          )}
          {status === 'validated' && (
            <>
              <Button size="sm" onClick={() => promote(uc)}>
                <ArrowRight /> Promote
              </Button>
              <Button size="sm" variant="ghost" onClick={() => park(uc)}>
                <Prohibit /> Park
              </Button>
            </>
          )}
          {status === 'parked' && (
            <Button size="sm" variant="ghost" onClick={() => reactivate(uc)}>
              <ArrowArcLeft /> Reactivate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderOpportunityCard = (opp: Opportunity) => {
    const gate = evaluateStageGate(opp, useCases)
    const ready = canAdvanceStage(opp, useCases)
    const next = recommendedNextAction(opp, useCases)
    const role = SALES_ROLES[opp.owningRole]
    const isHandedOff = opp.status === 'handed-off'
    const metCount = gate.requirements.filter((r) => r.met).length

    return (
      <Card key={opp.id} className="p-0">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{opp.name}</p>
            {isHandedOff && (
              <Badge variant="default" className="bg-green-600 text-[10px]">
                Handed off
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]" title={role.name}>
              {role.role}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Gate {metCount}/{gate.requirements.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{next}</p>

          {!isHandedOff && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {opp.stage < 4 && (
                <Button
                  size="sm"
                  variant={ready ? 'default' : 'outline'}
                  disabled={!ready}
                  onClick={() => advance(opp)}
                >
                  <ArrowRight /> Advance
                </Button>
              )}
              {opp.stage === 4 && !opp.handoff && (
                <Button size="sm" onClick={() => prepare(opp)}>
                  <Handshake /> Prepare handshake
                </Button>
              )}
              {opp.stage === 4 && opp.handoff && (
                <div className="flex w-full items-center gap-1.5">
                  <Input
                    value={csaNames[opp.id] ?? opp.handoff.csaName ?? ''}
                    onChange={(e) => setCsaNames((s) => ({ ...s, [opp.id]: e.target.value }))}
                    placeholder="Receiving CSA"
                    className="h-8 text-xs"
                  />
                  <Button size="sm" onClick={() => accept(opp)}>
                    <Handshake /> Accept
                  </Button>
                </div>
              )}
              <Button size="sm" variant="ghost" onClick={() => close(opp)}>
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Use-case pipeline</span>
        <Badge variant="outline">Candidates {summary.candidate}</Badge>
        <Badge variant="outline">Validated {summary.validated}</Badge>
        <Badge variant="secondary">Opportunities {summary.promoted}</Badge>
        <Badge variant="outline">Parked {summary.parked}</Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3">
        <Column
          title="Candidates"
          hint="Generated — validate with the customer"
          count={candidates.length}
        >
          {candidates.map((uc) => renderUseCaseCard(uc, 'candidate'))}
        </Column>
        <Column
          title="Validated"
          hint="Survived — promote to an opportunity"
          count={validated.length}
        >
          {validated.map((uc) => renderUseCaseCard(uc, 'validated'))}
        </Column>
        {MCEM_STAGE_ORDER.map((stage) => (
          <Column
            key={stage}
            title={`S${stage} · ${MCEM_STAGES[stage].shortName}`}
            hint={`${MCEM_STAGES[stage].name} (${MCEM_STAGES[stage].owningRole})`}
            count={stageOpps(stage).length}
          >
            {stageOpps(stage).map(renderOpportunityCard)}
          </Column>
        ))}
        <Column title="Parked" hint="Deferred / no-go" count={parked.length}>
          {parked.map((uc) => renderUseCaseCard(uc, 'parked'))}
        </Column>
      </div>
    </div>
  )
}
