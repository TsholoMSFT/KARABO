/**
 * Build a deterministic Markdown "Solution Paths" annex appended to
 * Executive Summary exports. Reads from the per-customer estate and
 * blueprint use-case drafts; only emits sections for drafts that are
 * linked to a discovered UseCase (via `sourceUseCaseId`) and that have
 * a chosen `archetypeId`.
 */

import { generateBlueprints } from './recommender'
import { BLUEPRINT_LAYER_LABELS } from './types'
import type {
  BlueprintLayer,
  TechnologyEstate,
  UseCaseInput,
} from './types'
import type { UseCase } from '@/lib/types'

type LinkedDraft = UseCaseInput & { id: string; sourceUseCaseId?: string }

const LAYER_ORDER: BlueprintLayer[] = [
  'experience',
  'app-ai',
  'data',
  'integration',
  'platform',
  'governance',
]

export function buildSolutionPathsAnnex(
  useCases: UseCase[],
  drafts: LinkedDraft[],
  estate: TechnologyEstate | null | undefined,
): string {
  if (!estate || drafts.length === 0 || useCases.length === 0) return ''

  const ucById = new Map(useCases.map((u) => [u.id, u]))
  const linked = drafts.filter((d) => d.sourceUseCaseId && d.archetypeId && ucById.has(d.sourceUseCaseId!))
  if (linked.length === 0) return ''

  const sections: string[] = []
  for (const draft of linked) {
    const uc = ucById.get(draft.sourceUseCaseId!)!
    let result
    try {
      result = generateBlueprints(draft, estate)
    } catch {
      continue
    }
    const bp = result.estateOptimized
    const archetypeName = result.archetype?.name ?? draft.archetypeId ?? '—'
    const reusePct = Math.round(bp.reuseRatio * 100)

    const byLayer = new Map<BlueprintLayer, string[]>()
    for (const c of bp.components) {
      const label = c.service?.name ?? '— gap —'
      const tag = c.gap ? ' (gap)' : c.reused ? ' (reused)' : ''
      const arr = byLayer.get(c.layer) ?? []
      arr.push(`${label}${tag}`)
      byLayer.set(c.layer, arr)
    }

    const layerLines: string[] = []
    for (const layer of LAYER_ORDER) {
      const items = byLayer.get(layer)
      if (!items?.length) continue
      layerLines.push(`  - **${BLUEPRINT_LAYER_LABELS[layer]}:** ${items.join(', ')}`)
    }

    sections.push(
      [
        `### ${uc.title}`,
        `- Archetype: **${archetypeName}**`,
        `- Estate reuse: **${reusePct}%** • Gaps: **${bp.gapCount}**`,
        layerLines.length ? `- Components by layer:\n${layerLines.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  if (sections.length === 0) return ''

  return [
    '',
    '---',
    '',
    '## Solution Paths (Estate-Optimized)',
    '',
    '_Auto-generated from the Solution Blueprint workspace. Each use case below has a linked architecture draft._',
    '',
    sections.join('\n\n'),
    '',
  ].join('\n')
}
