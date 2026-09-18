import {
  FRONTIER_MATURITY_DESCRIPTIONS,
  FRONTIER_OFFERINGS,
  FRONTIER_PILLAR_OFFERINGS,
  FRONTIER_PILLARS,
  FRONTIER_WORKSTREAM_LABELS,
  FRONTIER_WORKSTREAM_SEQUENCES,
  type FrontierMaturityStage,
  type FrontierOfferingId,
  type FrontierPillarId,
  type FrontierReadinessRating,
  type FrontierReadinessRatings,
  type FrontierWorkstreamId,
} from './catalog'

export type FrontierRoadmapStatus =
  | 'start-now'
  | 'next'
  | 'later'
  | 'assumed-in-place'
  | 'revisit-gap'

export interface FrontierMaturityResult {
  stage: FrontierMaturityStage
  description: string
  pillarsAtThreshold: number
  aiPillarsAtThreshold: number
  trustedPillarsAtThreshold: number
  agentifyPillarsAtThreshold: number
}

export interface FrontierRoadmapStep {
  offeringId: FrontierOfferingId
  status: FrontierRoadmapStatus
  weakPillarIds: FrontierPillarId[]
}

export interface FrontierRoadmapWorkstream {
  id: FrontierWorkstreamId
  label: string
  offeringIds: FrontierOfferingId[]
  steps: FrontierRoadmapStep[]
}

export interface FrontierPriorityGap {
  pillarId: FrontierPillarId
  rating: FrontierReadinessRating
  offeringIds: FrontierOfferingId[]
}

export interface FrontierRoadmapWarning {
  id: 'governance-before-scale'
  offeringId: '08'
  message: string
}

export interface FrontierRoadmap {
  maturity: FrontierMaturityResult
  workstreams: FrontierRoadmapWorkstream[]
  priorityGaps: FrontierPriorityGap[]
  warnings: FrontierRoadmapWarning[]
}

const ENTRY_INDEX: Record<FrontierMaturityStage, Record<FrontierWorkstreamId, number>> = {
  Exploring: { shared: 0, trusted: 0, agentify: 0 },
  Planning: { shared: 1, trusted: 0, agentify: 0 },
  Implementing: { shared: 2, trusted: 2, agentify: 1 },
  Scaling: { shared: 3, trusted: 3, agentify: 2 },
  Realizing: { shared: 4, trusted: 5, agentify: 3 },
}

function isAtThreshold(rating: FrontierReadinessRating): boolean {
  return rating >= 3
}

export function computeFrontierMaturity(ratings: FrontierReadinessRatings): FrontierMaturityResult {
  const met = FRONTIER_PILLARS.filter((pillar) => isAtThreshold(ratings[pillar.id]))
  const pillarsAtThreshold = met.length
  const aiPillarsAtThreshold = met.filter((pillar) => pillar.isAiPillar).length
  const anyActivity = FRONTIER_PILLARS.some((pillar) => ratings[pillar.id] >= 1)

  let stage: FrontierMaturityStage = 'Exploring'
  if (pillarsAtThreshold >= 7) stage = 'Realizing'
  else if (pillarsAtThreshold >= 2 && aiPillarsAtThreshold >= 1) stage = 'Scaling'
  else if (pillarsAtThreshold >= 1) stage = 'Implementing'
  else if (anyActivity) stage = 'Planning'

  const trustedPillarsAtThreshold = [
    'ai_platform',
    'database_platform',
    'application_platform',
    'secure_the_solution',
    'secure_the_user',
  ].filter((pillarId) => isAtThreshold(ratings[pillarId as FrontierPillarId])).length

  const agentifyPillarsAtThreshold = [
    'm365_copilot',
    'copilot_chat',
    'copilot_studio',
    'github_copilot',
    'secure_the_user',
  ].filter((pillarId) => isAtThreshold(ratings[pillarId as FrontierPillarId])).length

  return {
    stage,
    description: FRONTIER_MATURITY_DESCRIPTIONS[stage],
    pillarsAtThreshold,
    aiPillarsAtThreshold,
    trustedPillarsAtThreshold,
    agentifyPillarsAtThreshold,
  }
}

function buildWorkstream(
  workstreamId: FrontierWorkstreamId,
  entryIndex: number,
  ratings: FrontierReadinessRatings,
): FrontierRoadmapWorkstream {
  const offeringIds = [...FRONTIER_WORKSTREAM_SEQUENCES[workstreamId]]
  const steps = offeringIds.map((offeringId, index): FrontierRoadmapStep => {
    const weakPillarIds = FRONTIER_OFFERINGS[offeringId].linkedPillars
      .filter((pillarId) => !isAtThreshold(ratings[pillarId]))

    let status: FrontierRoadmapStatus
    if (index < entryIndex) status = weakPillarIds.length > 0 ? 'revisit-gap' : 'assumed-in-place'
    else if (index === entryIndex) status = 'start-now'
    else if (index <= entryIndex + 1) status = 'next'
    else status = 'later'

    return { offeringId, status, weakPillarIds: [...weakPillarIds] }
  })

  return {
    id: workstreamId,
    label: FRONTIER_WORKSTREAM_LABELS[workstreamId],
    offeringIds,
    steps,
  }
}

function getPriorityGaps(ratings: FrontierReadinessRatings): FrontierPriorityGap[] {
  return FRONTIER_PILLARS
    .map((pillar, sourceIndex) => ({ pillar, sourceIndex, rating: ratings[pillar.id] }))
    .filter(({ rating }) => !isAtThreshold(rating))
    .sort((left, right) => left.rating - right.rating || left.sourceIndex - right.sourceIndex)
    .slice(0, 4)
    .map(({ pillar, rating }) => ({
      pillarId: pillar.id,
      rating,
      offeringIds: [...FRONTIER_PILLAR_OFFERINGS[pillar.id]],
    }))
}

export function buildFrontierRoadmap(ratings: FrontierReadinessRatings): FrontierRoadmap {
  const maturity = computeFrontierMaturity(ratings)
  const entry = ENTRY_INDEX[maturity.stage]
  const workstreams = (['shared', 'trusted', 'agentify'] as const)
    .map((workstreamId) => buildWorkstream(workstreamId, entry[workstreamId], ratings))

  const needsGovernanceBeforeScale =
    (maturity.stage === 'Scaling' || maturity.stage === 'Realizing')
    && (!isAtThreshold(ratings.secure_the_solution) || !isAtThreshold(ratings.secure_the_user))

  return {
    maturity,
    workstreams,
    priorityGaps: getPriorityGaps(ratings),
    warnings: needsGovernanceBeforeScale
      ? [{
          id: 'governance-before-scale',
          offeringId: '08',
          message: 'Strengthen responsible AI, security, and agent governance before expanding further build and scale activity.',
        }]
      : [],
  }
}

export function getCustomerVisibleRoadmap(roadmap: FrontierRoadmap): FrontierRoadmap {
  return {
    ...roadmap,
    workstreams: roadmap.workstreams.map((workstream) => {
      const steps = workstream.steps.filter(
        (step) => FRONTIER_OFFERINGS[step.offeringId].publicationStatus === 'published',
      )
      return {
        ...workstream,
        offeringIds: steps.map((step) => step.offeringId),
        steps,
      }
    }),
    priorityGaps: roadmap.priorityGaps.map((gap) => ({
      ...gap,
      offeringIds: gap.offeringIds.filter(
        (offeringId) => FRONTIER_OFFERINGS[offeringId].publicationStatus === 'published',
      ),
    })),
  }
}