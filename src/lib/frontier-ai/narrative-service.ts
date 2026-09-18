import { z } from 'zod'
import type { AccountCustomerJourney, DiscoverySession, UseCase } from '../types'
import { callAIForTask } from '../openai-service'
import { FRONTIER_OFFERINGS, type FrontierOfferingId } from './catalog'
import { getCustomerSafeJourney } from './journey-builder'

const publishedOfferingIds = Object.values(FRONTIER_OFFERINGS)
  .filter((offering) => offering.publicationStatus === 'published')
  .map((offering) => offering.id) as [Exclude<FrontierOfferingId, '15'>, ...Exclude<FrontierOfferingId, '15'>[]]

const accountJourneyNarrativeSchema = z.object({
  ambition: z.string().trim().min(1).max(1200),
  steps: z.array(z.object({
    offeringId: z.enum(publishedOfferingIds),
    customerValue: z.string().trim().min(1).max(1200),
    customerContext: z.string().trim().min(1).max(1200),
    whyNow: z.string().trim().min(1).max(1200),
    outcomes: z.array(z.string().trim().min(1).max(500)).min(1).max(6),
    successCriteria: z.array(z.string().trim().min(1).max(500)).min(1).max(6),
  }).strict()).max(14),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>()
  for (const step of value.steps) {
    if (seen.has(step.offeringId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['steps'],
        message: `Duplicate offering ${step.offeringId}`,
      })
    }
    seen.add(step.offeringId)
  }
})

export type AccountJourneyNarrative = z.infer<typeof accountJourneyNarrativeSchema>

export function applyAccountJourneyNarrative(
  journey: AccountCustomerJourney,
  input: unknown,
  now = Date.now(),
): AccountCustomerJourney {
  const parsed = accountJourneyNarrativeSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(`Invalid account journey narrative: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`)
  }

  const narrativeByOffering = new Map(parsed.data.steps.map((step) => [step.offeringId, step]))
  return {
    ...journey,
    ambition: parsed.data.ambition,
    workstreams: journey.workstreams.map((workstream) => ({
      ...workstream,
      steps: workstream.steps.map((step) => {
        const narrative = narrativeByOffering.get(step.offeringId as Exclude<FrontierOfferingId, '15'>)
        if (!narrative) return step
        return {
          ...step,
          customerValue: narrative.customerValue,
          customerContext: narrative.customerContext,
          whyNow: narrative.whyNow,
          outcomes: [...narrative.outcomes],
          successCriteria: [...narrative.successCriteria],
        }
      }),
    })),
    generatedBy: 'ai-assisted',
    revision: journey.revision + 1,
    updatedAt: now,
  }
}

function truncate(value: string | undefined, maxLength = 1200): string | undefined {
  if (!value) return undefined
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`
}

export async function tailorAccountJourneyNarrative(
  journey: AccountCustomerJourney,
  useCases: UseCase[],
  sessions: DiscoverySession[],
): Promise<AccountCustomerJourney> {
  const safeJourney = getCustomerSafeJourney(journey)
  const selectedUseCases = useCases
    .filter((useCase) => safeJourney.sources.useCaseIds.includes(useCase.id))
    .map((useCase) => ({
      id: useCase.id,
      title: truncate(useCase.title, 200),
      description: truncate(useCase.description),
      businessFunction: useCase.businessFunction,
      desiredValue: truncate(useCase.expectedValue ? JSON.stringify(useCase.expectedValue) : undefined, 600),
      businessProcesses: truncate(useCase.businessProcesses ? JSON.stringify(useCase.businessProcesses) : undefined, 600),
    }))
  const selectedSessions = sessions
    .filter((session) => safeJourney.sources.sessionIds.includes(session.id))
    .map((session) => ({
      id: session.id,
      name: truncate(session.name, 200),
      industry: session.industry,
      desiredOutcomes: truncate(session.desiredOutcomes),
      executiveSummary: truncate(session.executiveSummary),
      discoveryResponses: session.responses.slice(0, 12).map((response) => truncate(response.answer, 500)),
    }))
  const lockedSteps = safeJourney.workstreams.flatMap((workstream) => workstream.steps).map((step) => ({
    offeringId: step.offeringId,
    title: step.title,
    workstream: safeJourney.workstreams.find((item) => item.steps.some((candidate) => candidate.offeringId === step.offeringId))?.label,
    recommendationStatus: step.recommendationStatus,
    deliveryStage: step.deliveryStage,
    linkedUseCaseIds: step.linkedUseCaseIds,
    currentCustomerValue: step.customerValue,
    currentCustomerContext: step.customerContext,
    currentWhyNow: step.whyNow,
  }))

  const prompt = `Create customer-facing narrative for an existing Frontier AI account journey.

The roadmap structure below is LOCKED. Do not add, remove, reorder, rename, or change the status, stage, duration, or workstream of any offering. Return narrative only for the supplied published offering IDs.

CUSTOMER
${JSON.stringify({
    customerName: safeJourney.customerName,
    currentMaturity: safeJourney.maturity.stage,
    maturityDescription: safeJourney.maturity.description,
    readinessEvidence: safeJourney.readiness.evidence,
    currentAmbition: safeJourney.ambition,
  })}

DISCOVERY EVIDENCE
${JSON.stringify({ sessions: selectedSessions, useCases: selectedUseCases })}

LOCKED ROADMAP
${JSON.stringify(lockedSteps)}

Return this exact JSON shape:
{
  "ambition": "A concise, customer-safe account ambition grounded in the evidence",
  "steps": [
    {
      "offeringId": "one supplied published offering ID",
      "customerValue": "Specific value for this customer",
      "customerContext": "Specific use case or account context",
      "whyNow": "Evidence-based reason for its current status and timing",
      "outcomes": ["Tailored customer outcome"],
      "successCriteria": ["Observable exit criterion"]
    }
  ]
}

Requirements:
- Use customer language, not sales language.
- Do not introduce financial, usage, seat, commercial-threshold, or internal effort-tier claims.
- Do not invent facts. When evidence is limited, phrase an assumption as something to validate.
- Include every supplied published offering exactly once.`

  const result = await callAIForTask('journey', prompt, {
    expectJson: true,
    systemPrompt: 'You tailor customer-facing journey narrative. The application owns all deterministic roadmap structure. Return only valid JSON matching the requested schema.',
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(result)
  } catch {
    throw new Error('Invalid account journey narrative: model returned malformed JSON')
  }
  return applyAccountJourneyNarrative(journey, parsed)
}