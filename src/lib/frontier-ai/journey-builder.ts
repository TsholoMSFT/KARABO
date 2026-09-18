import type {
  AccountCustomerJourney,
  AccountJourneyStep,
  Customer,
  DiscoverySession,
  FrontierReadinessAssessment,
  JourneySourceSelection,
  UseCase,
} from '../types'
import {
  FRONTIER_CATALOG_VERSION,
  FRONTIER_OFFERINGS,
  FRONTIER_PILLARS,
  type FrontierOfferingId,
  type FrontierPillarId,
} from './catalog'
import { buildFrontierRoadmap } from './maturity-engine'

export interface CustomerJourneySources {
  sessions: DiscoverySession[]
  useCases: UseCase[]
  selection: JourneySourceSelection
}

export interface BuildAccountCustomerJourneyInput {
  customer: Customer
  sessions: DiscoverySession[]
  useCases: UseCase[]
  readiness: FrontierReadinessAssessment
  selection?: Partial<JourneySourceSelection>
  ambition?: string
  existingJourney?: AccountCustomerJourney
  now?: number
}

export interface CustomerJourneyValidationIssue {
  offeringId: FrontierOfferingId
  field: 'customerValue' | 'customerContext'
  message: string
}

export interface CustomerJourneyValidationResult {
  valid: boolean
  issues: CustomerJourneyValidationIssue[]
}

const OFFERING_KEYWORDS: Record<FrontierOfferingId, readonly string[]> = {
  '01': [],
  '02': ['agent', 'agentic', 'workflow', 'copilot', 'automation'],
  '03': [],
  '04': ['architecture', 'platform', 'foundry', 'ai-native', 'rag', 'agent'],
  '05': ['agent', 'multi-agent', 'orchestration', 'prototype'],
  '06': ['agent', 'ai', 'automation', 'copilot', 'workflow'],
  '07': [],
  '08': ['governance', 'risk', 'security', 'privacy', 'compliance', 'responsible', 'regulation'],
  '09': [],
  '10': [],
  '11': ['employee', 'productivity', 'm365', 'microsoft 365', 'copilot', 'workforce'],
  '12': ['application', 'app', 'api', 'integration', 'legacy', 'modernization'],
  '13': ['data', 'fabric', 'ground', 'retrieval', 'knowledge', 'search', 'database'],
  '14': ['frontline', 'field', 'workforce', 'service', 'operations', 'copilot'],
  '15': ['github', 'developer', 'engineering', 'code'],
}

const PORTFOLIO_WIDE_OFFERINGS = new Set<FrontierOfferingId>(['01', '03', '07', '09', '10'])

export function collectCustomerJourneySources(
  customerId: string,
  sessions: DiscoverySession[],
  useCases: UseCase[],
  selection: Partial<JourneySourceSelection> = {},
): CustomerJourneySources {
  const customerSessions = sessions.filter((session) => session.customerId === customerId)
  const selectedSessionIds = selection.sessionIds !== undefined
    ? new Set(selection.sessionIds)
    : new Set(customerSessions.map((session) => session.id))
  const selectedSessions = customerSessions.filter((session) => selectedSessionIds.has(session.id))

  const selectedUseCaseIds = selection.useCaseIds !== undefined ? new Set(selection.useCaseIds) : null
  const selectedUseCases = useCases.filter((useCase) => (
    !!useCase.discoverySessionId
    && selectedSessionIds.has(useCase.discoverySessionId)
    && (!selectedUseCaseIds || selectedUseCaseIds.has(useCase.id))
  ))

  return {
    sessions: selectedSessions,
    useCases: selectedUseCases,
    selection: {
      sessionIds: selectedSessions.map((session) => session.id),
      useCaseIds: selectedUseCases.map((useCase) => useCase.id),
    },
  }
}

function useCaseSearchText(useCase: UseCase): string {
  return [
    useCase.title,
    useCase.description,
    useCase.businessFunction,
    useCase.referenceArchitecture,
    ...(useCase.solutionPlays ?? []),
    JSON.stringify(useCase.microsoftSolutions ?? []),
    JSON.stringify(useCase.agenticOpportunities ?? []),
    JSON.stringify(useCase.businessProcesses ?? []),
    JSON.stringify(useCase.regulatoryAssessment ?? {}),
    JSON.stringify(useCase.responsibleAIImpact ?? {}),
  ].filter(Boolean).join(' ').toLowerCase()
}

function suggestUseCaseIds(offeringId: FrontierOfferingId, useCases: UseCase[]): string[] {
  const eligible = useCases.filter((useCase) => useCase.disposition !== 'no-go')
  if (PORTFOLIO_WIDE_OFFERINGS.has(offeringId)) return eligible.map((useCase) => useCase.id)

  const keywords = OFFERING_KEYWORDS[offeringId]
  const matches = eligible.filter((useCase) => {
    const text = useCaseSearchText(useCase)
    return keywords.some((keyword) => text.includes(keyword))
  })

  if (matches.length > 0) return matches.map((useCase) => useCase.id)
  if (offeringId === '06') return eligible.slice(0, 3).map((useCase) => useCase.id)
  return []
}

function lowerFirst(value: string): string {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value
}

function customerValue(customerName: string, offeringId: FrontierOfferingId): string {
  const offering = FRONTIER_OFFERINGS[offeringId]
  const outcome = offering.outcomes[0] ?? offering.purpose
  return `${outcome.replace(/\.$/, '')} for ${customerName}.`
}

function customerContext(
  customerName: string,
  offeringId: FrontierOfferingId,
  linkedUseCases: UseCase[],
): string {
  if (linkedUseCases.length > 0) {
    return `Apply this engagement to ${linkedUseCases.map((useCase) => useCase.title).join(', ')}.`
  }
  return `Apply this engagement across ${customerName}'s AI portfolio to ${lowerFirst(FRONTIER_OFFERINGS[offeringId].purpose)}`
}

function whyNow(
  status: AccountJourneyStep['recommendationStatus'],
  stage: AccountCustomerJourney['maturity']['stage'],
  weakPillarIds: FrontierPillarId[],
): string {
  const weakPillars = weakPillarIds.map((pillarId) => (
    FRONTIER_PILLARS.find((pillar) => pillar.id === pillarId)?.name ?? pillarId
  ))

  switch (status) {
    case 'start-now':
      return `${stage} maturity places this engagement at the recommended starting point for the workstream.`
    case 'next':
      return 'This is the next engagement after the current workstream entry point and builds on its agreed outcomes.'
    case 'revisit-gap':
      return `Revisit this engagement because ${weakPillars.join(' and ')} readiness remains below the implementation threshold.`
    case 'assumed-in-place':
      return `This outcome is normally in place at ${stage} maturity; confirm it remains current and complete.`
    case 'later':
      return 'Keep this engagement visible on the full maturity arc for activation after its prerequisites are met.'
  }
}

function mergePreservedFields(
  base: AccountJourneyStep,
  previous: AccountJourneyStep | undefined,
  sourceUseCases: UseCase[],
): AccountJourneyStep {
  if (!previous) return base

  const sourceUseCaseIds = new Set(sourceUseCases.map((useCase) => useCase.id))
  const linkedUseCaseIds = previous.linkedUseCaseIds.filter((id) => sourceUseCaseIds.has(id))
  const linkedSessionIds = new Set(
    sourceUseCases
      .filter((useCase) => linkedUseCaseIds.includes(useCase.id))
      .map((useCase) => useCase.discoverySessionId)
      .filter((id): id is string => !!id),
  )

  return {
    ...base,
    id: previous.id,
    customerValue: previous.customerValue,
    customerContext: previous.customerContext,
    linkedUseCaseIds,
    sourceSessionIds: linkedUseCaseIds.length > 0 ? [...linkedSessionIds] : [...base.sourceSessionIds],
    prerequisites: [...previous.prerequisites],
    participants: [...previous.participants],
    customerCommitments: [...previous.customerCommitments],
    focusAreas: [...previous.focusAreas],
    deliverables: [...previous.deliverables],
    outcomes: [...previous.outcomes],
    successCriteria: [...previous.successCriteria],
    owner: previous.owner,
    targetTiming: previous.targetTiming,
    notes: previous.notes,
    isComplete: previous.isComplete,
    completedAt: previous.completedAt,
  }
}

export function buildAccountCustomerJourney({
  customer,
  sessions,
  useCases,
  readiness,
  selection,
  ambition,
  existingJourney,
  now = Date.now(),
}: BuildAccountCustomerJourneyInput): AccountCustomerJourney {
  const sources = collectCustomerJourneySources(customer.id, sessions, useCases, selection)
  const roadmap = buildFrontierRoadmap(readiness.ratings)
  const previousSteps = new Map(
    existingJourney?.workstreams.flatMap((workstream) => workstream.steps)
      .map((step) => [step.offeringId, step] as const) ?? [],
  )

  const workstreams = roadmap.workstreams.map((workstream) => ({
    id: workstream.id,
    label: workstream.label,
    steps: workstream.steps.map((roadmapStep, index) => {
      const offering = FRONTIER_OFFERINGS[roadmapStep.offeringId]
      const linkedUseCaseIds = suggestUseCaseIds(roadmapStep.offeringId, sources.useCases)
      const linkedUseCases = sources.useCases.filter((useCase) => linkedUseCaseIds.includes(useCase.id))
      const linkedSessionIds = new Set(linkedUseCases.map((useCase) => useCase.discoverySessionId).filter(Boolean))

      const base: AccountJourneyStep = {
        id: `${customer.id}-${roadmapStep.offeringId}`,
        offeringId: roadmapStep.offeringId,
        order: index + 1,
        publicationStatus: offering.publicationStatus,
        deliveryStage: offering.stage,
        title: offering.name,
        duration: offering.duration,
        recommendationStatus: roadmapStep.status,
        weakPillarIds: [...roadmapStep.weakPillarIds],
        customerValue: customerValue(customer.name, roadmapStep.offeringId),
        customerContext: customerContext(customer.name, roadmapStep.offeringId, linkedUseCases),
        whyNow: whyNow(roadmapStep.status, roadmap.maturity.stage, roadmapStep.weakPillarIds),
        linkedUseCaseIds,
        sourceSessionIds: linkedSessionIds.size > 0
          ? [...linkedSessionIds] as string[]
          : [...sources.selection.sessionIds],
        prerequisites: [...offering.prerequisites],
        participants: [...offering.audience],
        customerCommitments: [...offering.customerCommits],
        focusAreas: [...offering.focusAreas],
        deliverables: [...offering.deliverables],
        outcomes: [...offering.outcomes],
        successCriteria: [...offering.outcomes],
        isComplete: false,
      }

      return mergePreservedFields(base, previousSteps.get(roadmapStep.offeringId), sources.useCases)
    }),
  }))

  const desiredOutcome = sources.sessions.find((session) => session.desiredOutcomes?.trim())?.desiredOutcomes
  const startNowSteps = workstreams.flatMap((workstream) => workstream.steps)
    .filter((step) => step.recommendationStatus === 'start-now' && step.publicationStatus === 'published')

  return {
    id: existingJourney?.id ?? `account-journey-${customer.id}`,
    customerId: customer.id,
    accountId: customer.accountId,
    customerName: customer.name,
    title: existingJourney?.title ?? `${customer.name} Frontier AI Journey`,
    ambition: ambition ?? existingJourney?.ambition ?? desiredOutcome ?? `Advance ${customer.name} from its current AI maturity toward repeatable business value.`,
    readiness: {
      ...readiness,
      ratings: { ...readiness.ratings },
      evidence: { ...readiness.evidence },
    },
    maturity: { ...roadmap.maturity },
    sources: sources.selection,
    workstreams,
    warnings: roadmap.warnings.map((warning) => ({ ...warning })),
    nextSteps: existingJourney?.nextSteps ?? startNowSteps.map((step) => ({
      id: `${customer.id}-next-${step.offeringId}`,
      action: `Confirm scope, participants, and timing for ${step.title}`,
      owner: step.owner,
      isComplete: false,
    })),
    catalogVersion: FRONTIER_CATALOG_VERSION,
    generatedBy: existingJourney?.generatedBy ?? 'deterministic',
    revision: existingJourney ? existingJourney.revision + 1 : 1,
    createdAt: existingJourney?.createdAt ?? now,
    updatedAt: now,
  }
}

export function getCustomerSafeJourney(journey: AccountCustomerJourney): AccountCustomerJourney {
  return {
    ...journey,
    readiness: {
      ...journey.readiness,
      ratings: { ...journey.readiness.ratings },
      evidence: { ...journey.readiness.evidence },
    },
    sources: {
      sessionIds: [...journey.sources.sessionIds],
      useCaseIds: [...journey.sources.useCaseIds],
    },
    workstreams: journey.workstreams.map((workstream) => ({
      ...workstream,
      steps: workstream.steps
        .filter((step) => step.publicationStatus === 'published')
        .map((step) => ({
          ...step,
          linkedUseCaseIds: [...step.linkedUseCaseIds],
          sourceSessionIds: [...step.sourceSessionIds],
          weakPillarIds: [...step.weakPillarIds],
          prerequisites: [...step.prerequisites],
          participants: [...step.participants],
          customerCommitments: [...step.customerCommitments],
          focusAreas: [...step.focusAreas],
          deliverables: [...step.deliverables],
          outcomes: [...step.outcomes],
          successCriteria: [...step.successCriteria],
        })),
    })),
    warnings: journey.warnings.map((warning) => ({ ...warning })),
    nextSteps: journey.nextSteps.map((step) => ({ ...step })),
  }
}

export function validateCustomerJourney(journey: AccountCustomerJourney): CustomerJourneyValidationResult {
  const issues: CustomerJourneyValidationIssue[] = []
  const publishedSteps = journey.workstreams.flatMap((workstream) => workstream.steps)
    .filter((step) => step.publicationStatus === 'published')

  for (const step of publishedSteps) {
    if (!step.customerValue.trim()) {
      issues.push({
        offeringId: step.offeringId,
        field: 'customerValue',
        message: `${step.title} needs a customer value statement.`,
      })
    }
    if (!step.customerContext.trim() && step.linkedUseCaseIds.length === 0) {
      issues.push({
        offeringId: step.offeringId,
        field: 'customerContext',
        message: `${step.title} needs a linked use case or account-level context.`,
      })
    }
  }

  return { valid: issues.length === 0, issues }
}