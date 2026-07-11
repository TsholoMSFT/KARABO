/**
 * Roadmap engine (Focus 1) — builds a multi-horizon transformation roadmap that
 * ties captured objectives to the prioritised use-case pipeline. Pure; the
 * caller supplies use cases already ordered by whatever scoring method is active.
 */
import type { UseCase } from './types'
import type {
  TransformationRoadmap,
  RoadmapPhase,
  RoadmapObjective,
  RoadmapHorizon,
} from './fy27-types'

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createRoadmapObjective(title: string, useCaseIds: string[] = []): RoadmapObjective {
  return { id: genId('obj'), title, linkedUseCaseIds: useCaseIds }
}

const HORIZONS: { horizon: RoadmapHorizon; name: string; milestones: string[] }[] = [
  { horizon: 'now', name: 'Now — Prove & land', milestones: ['Confirm priority use cases', 'Land first workload'] },
  { horizon: 'next', name: 'Next — Scale', milestones: ['Expand to adjacent workloads', 'Establish governance baseline'] },
  { horizon: 'later', name: 'Later — Transform', milestones: ['Enterprise rollout', 'Optimise & institutionalise'] },
]

export function createEmptyRoadmap(customerName: string, accountId?: string): TransformationRoadmap {
  const now = Date.now()
  return {
    id: genId('rmap'),
    accountId,
    customerName,
    phases: HORIZONS.map((h) => ({
      id: genId('phase'),
      name: h.name,
      horizon: h.horizon,
      objectives: [],
      milestones: [...h.milestones],
    })),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Build a starter roadmap by distributing the ordered use cases across the
 * three horizons (highest-priority first → Now). Deterministic thirds split.
 */
export function buildDefaultRoadmap(
  customerName: string,
  orderedUseCases: UseCase[],
  accountId?: string,
): TransformationRoadmap {
  const roadmap = createEmptyRoadmap(customerName, accountId)
  const n = orderedUseCases.length
  if (n === 0) return roadmap

  const third = Math.ceil(n / 3)
  const buckets: UseCase[][] = [
    orderedUseCases.slice(0, third),
    orderedUseCases.slice(third, third * 2),
    orderedUseCases.slice(third * 2),
  ]

  roadmap.phases = roadmap.phases.map((phase, idx) => {
    const objectives: RoadmapObjective[] = (buckets[idx] || []).map((uc) => ({
      id: genId('obj'),
      title: uc.title,
      linkedUseCaseIds: [uc.id],
      businessOutcomeRef: uc.strategicAlignment?.primaryPriority,
    }))
    return { ...phase, objectives }
  })

  return roadmap
}

export interface RoadmapSummary {
  phaseCount: number
  objectiveCount: number
  linkedUseCaseCount: number
}

export function summarizeRoadmap(roadmap: Pick<TransformationRoadmap, 'phases'>): RoadmapSummary {
  const objectiveCount = roadmap.phases.reduce((acc, p) => acc + p.objectives.length, 0)
  const linked = new Set<string>()
  for (const p of roadmap.phases) {
    for (const o of p.objectives) {
      for (const id of o.linkedUseCaseIds) linked.add(id)
    }
  }
  return {
    phaseCount: roadmap.phases.length,
    objectiveCount,
    linkedUseCaseCount: linked.size,
  }
}

export function updatePhase(
  roadmap: TransformationRoadmap,
  phaseId: string,
  updater: (phase: RoadmapPhase) => RoadmapPhase,
): TransformationRoadmap {
  return {
    ...roadmap,
    phases: roadmap.phases.map((p) => (p.id === phaseId ? updater(p) : p)),
    updatedAt: Date.now(),
  }
}
