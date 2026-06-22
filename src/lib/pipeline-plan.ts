/**
 * Pipeline-plan data model & derivation — the pure logic behind the portfolio
 * Pipeline Plan. Kept in lib (not the component) so exporters and tests can
 * reuse it. The React view (PipelinePlanView) renders these row models.
 */
import type {
  PressureTheme, AuditTheme, Commitment, SolutionArea, BriefingTrackId,
} from './types'
import { ENTITY_TYPE_LABELS } from './types'
import { effectiveTicker, type PortfolioSeedEntity } from './portfolio-seed'

/** Live intelligence generated for an entity (themes, commitments, pipeline meta). */
export interface EntityIntel {
  pressureThemes?: PressureTheme[]
  auditThemes?: AuditTheme[]
  commitments?: Commitment[]
  riskSignal?: string
  reportingMilestone?: string
  nextStep?: string
  pipelineCoverPct?: number
  partner?: string
  accountExec?: string
  stakeholder?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  engagementDate?: string
}

export interface PipelineRow {
  entity: PortfolioSeedEntity
  tier: string
  ticker?: string
  isGov: boolean
  generated: boolean
  themeCount: number
  topThemes: string[]
  riskSignal: string
  leadSolutionArea?: SolutionArea
  primaryTrack?: BriefingTrackId
  commitmentCount: number
  reportingMilestone: string
  nextStep: string
}

function mode<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined
  const counts = new Map<T, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/** Themes that drive this entity's row (audit for gov, pressure for companies). */
export function themesForEntity(
  entity: PortfolioSeedEntity,
  intel?: EntityIntel,
): Array<PressureTheme | AuditTheme> {
  return entity.entityType === 'government'
    ? intel?.auditThemes ?? []
    : intel?.pressureThemes ?? []
}

/** Pure: derive the streamlined pipeline row for an entity + its intel. */
export function summarisePipelineRow(
  entity: PortfolioSeedEntity,
  intel?: EntityIntel,
): PipelineRow {
  const isGov = entity.entityType === 'government'
  const themes = themesForEntity(entity, intel)
  const generated = themes.length > 0

  const defaultMilestone = isGov
    ? entity.auditFramework === 'MFMA'
      ? 'MFMA: AFS due 31 Aug'
      : 'PFMA: AFS due 31 Aug'
    : 'Interim / final results'

  return {
    entity,
    tier: isGov ? entity.publicSectorTier ?? 'Public Sector' : ENTITY_TYPE_LABELS[entity.entityType],
    ticker: isGov ? undefined : effectiveTicker(entity),
    isGov,
    generated,
    themeCount: themes.length,
    topThemes: themes.slice(0, 3).map((t) => t.title),
    riskSignal: intel?.riskSignal ?? themes[0]?.evidence ?? themes[0]?.title ?? '—',
    leadSolutionArea: mode(themes.map((t) => t.solutionArea).filter(Boolean) as SolutionArea[]),
    primaryTrack: mode(themes.map((t) => t.briefingTrack).filter(Boolean) as BriefingTrackId[]),
    commitmentCount: intel?.commitments?.length ?? 0,
    reportingMilestone: intel?.reportingMilestone ?? defaultMilestone,
    nextStep: intel?.nextStep ?? (generated ? 'Schedule innovation-hub briefing' : 'Gather signals & generate themes'),
  }
}
