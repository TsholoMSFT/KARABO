/**
 * Page 8 — Use Case Value Prioritisation (Section 7).
 *
 * A CSAM prioritisation model: each use case is scored and bucketed into
 * quick wins, strategic bets, health remediations, adoption recovery,
 * expansion candidates, or deprioritise/monitor.
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListChecks } from '@phosphor-icons/react'
import { prioritiseUseCases } from '@/lib/csam/scoring'
import {
  ADOPTION_STAGE_LABELS,
  CSAM_SOLUTION_AREA_LABELS,
  PRIORITISATION_CATEGORY_LABELS,
  type CsamCustomerProfile,
  type PrioritisationCategory,
  type PrioritisedUseCase,
} from '@/lib/csam/types'
import { ConfidenceBadge, EmptyState, PageHeader } from '../shared'

const CATEGORY_CLASSES: Record<PrioritisationCategory, string> = {
  'quick-win': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'strategic-bet': 'bg-sky-100 text-sky-700 border-sky-300',
  'health-remediation': 'bg-red-100 text-red-700 border-red-300',
  'adoption-recovery': 'bg-amber-100 text-amber-700 border-amber-300',
  'expansion': 'bg-violet-100 text-violet-700 border-violet-300',
  'deprioritise': 'bg-gray-100 text-gray-600 border-gray-300',
}

const CATEGORY_ORDER: PrioritisationCategory[] = [
  'health-remediation',
  'adoption-recovery',
  'quick-win',
  'strategic-bet',
  'expansion',
  'deprioritise',
]

export function UseCasePrioritisationPage({ profile }: { profile: CsamCustomerProfile }) {
  const ranked = useMemo(() => prioritiseUseCases(profile), [profile])

  const byCategory = useMemo(() => {
    const map = new Map<PrioritisationCategory, PrioritisedUseCase[]>()
    for (const r of ranked) {
      const list = map.get(r.category) ?? []
      list.push(r)
      map.set(r.category, list)
    }
    return map
  }, [ranked])

  if (!ranked.length) {
    return <EmptyState>No use cases to prioritise for {profile.name} yet.</EmptyState>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Use Case Value Prioritisation"
        description="Where to focus next — blending value at stake, committed value and urgency through a CSAM lens."
        icon={<ListChecks size={24} />}
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((c) => (
          <Badge key={c} variant="outline" className={CATEGORY_CLASSES[c]}>
            {PRIORITISATION_CATEGORY_LABELS[c]} ({byCategory.get(c)?.length ?? 0})
          </Badge>
        ))}
      </div>

      {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${CATEGORY_CLASSES[category].split(' ')[0]}`} />
              {PRIORITISATION_CATEGORY_LABELS[category]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.get(category)!.map(({ useCase, score, confidence, rationale }) => (
              <div key={useCase.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium">{useCase.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{CSAM_SOLUTION_AREA_LABELS[useCase.solutionArea]}</Badge>
                      <Badge variant="outline">{ADOPTION_STAGE_LABELS[useCase.adoptionStage]}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{score}</p>
                      <p className="text-[10px] text-muted-foreground">priority</p>
                    </div>
                    <ConfidenceBadge confidence={confidence} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
