/**
 * MCEM pipeline engine — the behaviour behind the funnel.
 *
 * Pure, deterministic functions (no I/O, no React) so they are trivial to test
 * and safe to call from anywhere. See `mcem.ts` for the types and metadata.
 *
 * The funnel:
 *   candidate -> validated -> promoted (Opportunity) -> ... -> handed-off
 */

import type { UseCase } from './types'
import {
  type McemStage,
  type Opportunity,
  type OpportunityStatus,
  type SalesRole,
  type StageGateResult,
  type StageTransition,
  type HandoffPackage,
  type HandoffChecklistItem,
  type UseCasePipelineStatus,
  type GateRequirement,
  MCEM_STAGES,
  isUseCaseSurviving,
} from './mcem'

// ============================================================================
// IDS
// ============================================================================

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================================
// FUNNEL STATUS DERIVATION
// ============================================================================

/**
 * Derive where a use case sits in the funnel.
 *
 * - promoted: already part of an Opportunity being worked
 * - parked:   deferred or no-go'd
 * - validated: customer confirmed the problem and it survives
 * - candidate: generated, not yet validated
 */
export function getUseCasePipelineStatus(
  uc: Pick<UseCase, 'id' | 'disposition' | 'problemConfirmed'>,
  opportunities: Pick<Opportunity, 'useCaseIds'>[] = [],
): UseCasePipelineStatus {
  if (opportunities.some((o) => o.useCaseIds.includes(uc.id))) return 'promoted'
  if (!isUseCaseSurviving(uc)) return 'parked'
  if (uc.problemConfirmed) return 'validated'
  return 'candidate'
}

/** Aggregate funnel counts for a pipeline board / portfolio view. */
export interface PipelineSummary {
  total: number
  candidate: number
  validated: number
  promoted: number
  parked: number
  /** Opportunity counts per MCEM stage. */
  byStage: Record<McemStage, number>
}

export function summarizePipeline(
  useCases: Pick<UseCase, 'id' | 'disposition' | 'problemConfirmed'>[],
  opportunities: Pick<Opportunity, 'useCaseIds' | 'stage' | 'status'>[],
): PipelineSummary {
  const summary: PipelineSummary = {
    total: useCases.length,
    candidate: 0,
    validated: 0,
    promoted: 0,
    parked: 0,
    byStage: { 1: 0, 2: 0, 3: 0, 4: 0 },
  }
  for (const uc of useCases) {
    summary[getUseCasePipelineStatus(uc, opportunities)]++
  }
  for (const opp of opportunities) {
    if (opp.status !== 'closed-lost') summary.byStage[opp.stage]++
  }
  return summary
}

// ============================================================================
// PROMOTION — surviving use cases become an Opportunity
// ============================================================================

export interface PromoteOptions {
  customerId: string
  discoverySessionId?: string
  /** Defaults to the first use case's title. */
  name?: string
  /** Role performing the promotion (defaults to ATU — the account team). */
  byRole?: SalesRole
  by?: string
}

/**
 * Promote one or more validated use cases into a new Opportunity at Stage 1.
 * Throws if no surviving use cases are supplied — you cannot work a dead lead.
 */
export function promoteUseCasesToOpportunity(
  useCases: UseCase[],
  opts: PromoteOptions,
): Opportunity {
  const surviving = useCases.filter(isUseCaseSurviving)
  if (surviving.length === 0) {
    throw new Error('Cannot promote: no surviving (pursued) use cases provided.')
  }
  const now = Date.now()
  const initialTransition: StageTransition = {
    id: genId('xtn'),
    from: null,
    to: 1,
    at: now,
    byRole: opts.byRole ?? 'ATU',
    by: opts.by,
    note: 'Promoted from validated use case(s).',
  }
  return {
    id: genId('opp'),
    customerId: opts.customerId,
    discoverySessionId: opts.discoverySessionId,
    name: opts.name ?? surviving[0].title,
    useCaseIds: surviving.map((uc) => uc.id),
    stage: 1,
    status: 'qualifying',
    owningRole: MCEM_STAGES[1].owningRole,
    owner: opts.by,
    history: [initialTransition],
    createdAt: now,
    updatedAt: now,
  }
}

// ============================================================================
// STAGE GATES
// ============================================================================

/** Default opportunity status for a given stage (before any handoff acceptance). */
export function statusForStage(stage: McemStage): OpportunityStatus {
  switch (stage) {
    case 1:
      return 'qualifying'
    case 2:
      return 'designing'
    case 3:
      return 'proving'
    case 4:
      return 'handoff-ready'
  }
}

function every<T>(items: T[], pred: (item: T) => boolean): boolean {
  // An empty set should NOT satisfy a gate — there is nothing to qualify.
  return items.length > 0 && items.every(pred)
}

function hasSolutionScope(uc: UseCase): boolean {
  return Boolean(
    uc.microsoftSolutions?.length ||
      uc.solutionPlays?.length ||
      uc.solutionBlueprint?.archetypeId,
  )
}

/**
 * Evaluate the gate for an opportunity's CURRENT stage. The requirements are
 * grounded in real `UseCase` data so "handoff readiness" reflects actual work
 * done, not a checkbox someone ticked.
 */
export function evaluateStageGate(
  opportunity: Pick<Opportunity, 'stage' | 'useCaseIds' | 'handoff'>,
  allUseCases: UseCase[],
): StageGateResult {
  const ucs = allUseCases.filter((uc) => opportunity.useCaseIds.includes(uc.id))
  const stage = opportunity.stage
  let requirements: GateRequirement[]

  switch (stage) {
    case 1:
      requirements = [
        {
          id: 'problem-confirmed',
          label: 'Problem confirmed with the customer',
          met: every(ucs, (uc) => uc.problemConfirmed === true),
          hint: 'Validate the problem statement in the customer’s own words.',
        },
        {
          id: 'initial-priority',
          label: 'Initial prioritization (impact & feasibility)',
          met: every(ucs, (uc) => uc.impact > 0 && uc.feasibility > 0),
          hint: 'Score impact and feasibility for each use case.',
        },
      ]
      break
    case 2:
      requirements = [
        {
          id: 'solution-scope',
          label: 'Solution mapped (Microsoft solutions or blueprint)',
          met: every(ucs, hasSolutionScope),
          hint: 'Map Microsoft solutions, solution plays, or a solution blueprint.',
        },
        {
          id: 'compliance-reviewed',
          label: 'Compliance & governance reviewed',
          met: every(ucs, (uc) => Boolean(uc.regulatoryAssessment)),
          hint: 'Run the governance / compliance review for each use case.',
        },
      ]
      break
    case 3:
      requirements = [
        {
          id: 'coi',
          label: 'Cost of inaction quantified',
          met: every(ucs, (uc) => Boolean(uc.costOfInaction)),
          hint: 'Capture the cost of inaction (COI).',
        },
        {
          id: 'expected-value',
          label: 'Expected value quantified',
          met: every(ucs, (uc) => Boolean(uc.expectedValue)),
          hint: 'Capture the expected value / ROI.',
        },
        {
          id: 'business-case',
          label: 'Business case prepared',
          met: every(ucs, (uc) => Boolean(uc.businessCase?.markdown)),
          hint: 'Generate the executive business case.',
        },
      ]
      break
    case 4:
      requirements = [
        {
          id: 'handshake-prepared',
          label: 'Handshake package prepared',
          met: Boolean(opportunity.handoff),
          hint: 'Prepare the CSU handshake package.',
        },
        {
          id: 'checklist-complete',
          label: 'Handshake checklist complete',
          met: Boolean(
            opportunity.handoff && opportunity.handoff.checklist.every((i) => i.done),
          ),
          hint: 'Complete every item on the handshake checklist.',
        },
        {
          id: 'csa-accepted',
          label: 'CSA has accepted the handshake',
          met: Boolean(opportunity.handoff?.acceptedAt && opportunity.handoff?.csaName),
          hint: 'Record CSA acceptance to complete the handshake.',
        },
      ]
      break
  }

  const metCount = requirements.filter((r) => r.met).length
  return {
    stage,
    requirements,
    ready: metCount === requirements.length,
    completion: requirements.length === 0 ? 1 : metCount / requirements.length,
  }
}

/** True when the opportunity's current-stage gate is met and there is a next stage. */
export function canAdvanceStage(
  opportunity: Pick<Opportunity, 'stage' | 'useCaseIds' | 'handoff'>,
  allUseCases: UseCase[],
): boolean {
  if (opportunity.stage >= 4) return false
  return evaluateStageGate(opportunity, allUseCases).ready
}

// ============================================================================
// TRANSITIONS
// ============================================================================

export interface AdvanceOptions {
  byRole?: SalesRole
  by?: string
  note?: string
  /** Skip the gate check (e.g. an explicit manager override). */
  force?: boolean
}

/**
 * Advance an opportunity to the next MCEM stage. Pure: returns a NEW opportunity
 * and never mutates the input. Throws if the gate is not met (unless forced) or
 * the opportunity is already at Stage 4.
 */
export function advanceStage(
  opportunity: Opportunity,
  allUseCases: UseCase[],
  opts: AdvanceOptions = {},
): Opportunity {
  if (opportunity.stage >= 4) {
    throw new Error('Opportunity is already at the final stage (handshake).')
  }
  if (!opts.force && !canAdvanceStage(opportunity, allUseCases)) {
    throw new Error('Stage gate not met. Resolve outstanding requirements or force the advance.')
  }
  const now = Date.now()
  const to = (opportunity.stage + 1) as McemStage
  const transition: StageTransition = {
    id: genId('xtn'),
    from: opportunity.stage,
    to,
    at: now,
    byRole: opts.byRole ?? MCEM_STAGES[to].owningRole,
    by: opts.by,
    note: opts.note,
  }
  return {
    ...opportunity,
    stage: to,
    status: statusForStage(to),
    owningRole: MCEM_STAGES[to].owningRole,
    history: [...opportunity.history, transition],
    updatedAt: now,
  }
}

/** Mark an opportunity closed-lost, preserving the audit trail. */
export function closeOpportunity(
  opportunity: Opportunity,
  opts: { byRole?: SalesRole; by?: string; note?: string } = {},
): Opportunity {
  const now = Date.now()
  return {
    ...opportunity,
    status: 'closed-lost',
    history: [
      ...opportunity.history,
      {
        id: genId('xtn'),
        from: opportunity.stage,
        to: opportunity.stage,
        at: now,
        byRole: opts.byRole ?? opportunity.owningRole,
        by: opts.by,
        note: opts.note ?? 'Closed (lost).',
      },
    ],
    updatedAt: now,
  }
}

// ============================================================================
// STAGE 4 — HANDSHAKE TO CSU
// ============================================================================

/**
 * Build the default Stage 4 handshake checklist, pre-ticking items the captured
 * data already satisfies so the account team only confirms what is genuinely done.
 */
export function buildHandoffChecklist(
  opportunity: Pick<Opportunity, 'useCaseIds'>,
  allUseCases: UseCase[],
): HandoffChecklistItem[] {
  const ucs = allUseCases.filter((uc) => opportunity.useCaseIds.includes(uc.id))
  return [
    {
      id: 'validated',
      label: 'Validated use case(s) with a customer-confirmed problem',
      done: every(ucs, (uc) => uc.problemConfirmed === true),
    },
    {
      id: 'solution',
      label: 'Solution scope / blueprint documented',
      done: every(ucs, hasSolutionScope),
    },
    {
      id: 'value',
      label: 'Business case & expected value captured',
      done: every(ucs, (uc) => Boolean(uc.expectedValue) && Boolean(uc.businessCase?.markdown)),
    },
    {
      id: 'governance',
      label: 'Compliance & governance reviewed',
      done: every(ucs, (uc) => Boolean(uc.regulatoryAssessment)),
    },
    {
      id: 'owner',
      label: 'Receiving CSA identified',
      done: false,
    },
  ]
}

/**
 * Prepare (or refresh) the handshake package for a Stage 4 opportunity.
 * Returns a NEW opportunity with status 'handoff-ready'.
 */
export function prepareHandoff(
  opportunity: Opportunity,
  allUseCases: UseCase[],
  opts: { preparedBy?: string; summary?: string; csaName?: string } = {},
): Opportunity {
  if (opportunity.stage !== 4) {
    throw new Error('Handshake can only be prepared at Stage 4.')
  }
  const now = Date.now()
  const checklist = buildHandoffChecklist(opportunity, allUseCases)
  if (opts.csaName) {
    const ownerItem = checklist.find((i) => i.id === 'owner')
    if (ownerItem) ownerItem.done = true
  }
  const handoff: HandoffPackage = {
    preparedAt: now,
    preparedBy: opts.preparedBy,
    summary: opts.summary,
    csaName: opts.csaName,
    checklist,
  }
  return { ...opportunity, handoff, status: 'handoff-ready', updatedAt: now }
}

/**
 * Record CSU (CSA) acceptance of the handshake. Returns a NEW opportunity with
 * status 'handed-off'. Throws if no handshake package has been prepared.
 */
export function acceptHandoff(
  opportunity: Opportunity,
  csaName: string,
  opts: { by?: string; note?: string } = {},
): Opportunity {
  if (!opportunity.handoff) {
    throw new Error('No handshake package prepared to accept.')
  }
  const now = Date.now()
  return {
    ...opportunity,
    status: 'handed-off',
    handoff: {
      ...opportunity.handoff,
      csaName,
      acceptedAt: now,
      acceptedBy: opts.by ?? csaName,
    },
    history: [
      ...opportunity.history,
      {
        id: genId('xtn'),
        from: 4,
        to: 4,
        at: now,
        byRole: 'CSU',
        by: opts.by ?? csaName,
        note: opts.note ?? `Handshake accepted by ${csaName}.`,
      },
    ],
    updatedAt: now,
  }
}
