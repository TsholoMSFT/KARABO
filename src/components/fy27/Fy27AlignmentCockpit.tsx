/**
 * FY27 Alignment Cockpit — the capstone surface that ties the new FY27 gap-closing
 * capabilities together and rolls them up into a leadership-facing scorecard.
 *
 * Owns all FY27 state (via the use-fy27 hooks + the MCEM opportunity store) as a
 * single source of truth, computes the six-focus alignment scorecard reactively,
 * and passes controlled props down to each tab.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DiscoverySession, UseCase, RegulatoryAssessment } from '@/lib/types'
import { getAccountById } from '@/lib/account-engine'
import { getRankedUseCases } from '@/lib/scoring'
import { computeFy27Scorecard } from '@/lib/fy27-alignment-engine'
import { isRefreshOverdue } from '@/lib/secure-ai-assessment-engine'
import { buildConsumptionPlan, isConsumptionOnTrack } from '@/lib/consumption-planning-engine'
import { summarizeRelationships } from '@/lib/relationship-engine'
import { summarizeBlockers } from '@/lib/blocker-engine'
import type { Fy27AlignmentSignals, SecureAIAssessmentInput } from '@/lib/fy27-types'
import { useOpportunities } from '@/hooks/use-opportunities'
import {
  useBlockers,
  useSecureAIAssessments,
  useRelationships,
  useRoadmaps,
  useConsumptionHistory,
} from '@/hooks/use-fy27'
import { Fy27ScorecardTab } from './Fy27ScorecardTab'
import { SecureAiAssessmentTab } from './SecureAiAssessmentTab'
import { RelationshipsTab } from './RelationshipsTab'
import { RoadmapTab } from './RoadmapTab'
import { ConsumptionPlanTab } from './ConsumptionPlanTab'
import { BlockerBoardTab } from './BlockerBoardTab'

export interface Fy27AlignmentCockpitProps {
  customerId?: string
  customerName?: string
  session?: DiscoverySession | null
  useCases: UseCase[]
  actorName?: string
}

export function Fy27AlignmentCockpit({
  customerId,
  customerName,
  session,
  useCases,
  actorName,
}: Fy27AlignmentCockpitProps) {
  const contextId = session?.accountId ?? customerId ?? 'default'
  const displayName = customerName ?? session?.customerName ?? 'Account'
  const account = session?.accountId ? getAccountById(session.accountId) : null
  const maccCommitment = account?.maccCommitment

  // ── Stores (single source of truth) ─────────────────────────────────────
  const opps = useOpportunities()
  const blockersStore = useBlockers()
  const secureStore = useSecureAIAssessments()
  const relStore = useRelationships()
  const roadmapStore = useRoadmaps()
  const consumptionStore = useConsumptionHistory()

  // ── Context-scoped slices ────────────────────────────────────────────────
  const ctxOpps = (customerId ? opps.forCustomer(customerId) : opps.opportunities).filter(
    (o) => o.status !== 'closed-lost',
  )
  const ctxBlockers = blockersStore.blockers.filter((b) => b.accountId === contextId)
  const ctxRelationships = relStore.relationships.filter((r) => r.accountId === contextId)
  const ctxInteractions = relStore.interactions.filter((i) => i.accountId === contextId)
  const currentAssessment = secureStore.current(contextId)
  const roadmap = roadmapStore.forAccount(contextId)[0]
  const history = consumptionStore.getHistory(contextId)

  const orderedUseCases = getRankedUseCases(useCases, 'blended')

  // ── Secure AI assessment input (aggregated from the session) ─────────────
  const regulatory = useCases
    .map((uc) => uc.regulatoryAssessment)
    .filter((r): r is RegulatoryAssessment => Boolean(r))
  const secureInput: SecureAIAssessmentInput = {
    customerName: displayName,
    accountId: contextId,
    customerId,
    sessionId: session?.id,
    governance: session?.aiGovernanceAssessment,
    regulatory,
    sovereign: session?.sovereignCloudAssessment,
    createdBy: actorName,
  }

  // ── Signals → scorecard ──────────────────────────────────────────────────
  const relSummary = summarizeRelationships(ctxRelationships, ctxInteractions)
  const blockerSummary = summarizeBlockers(ctxBlockers)
  const consumptionPlan = buildConsumptionPlan(contextId, history, maccCommitment)

  const signals: Fy27AlignmentSignals = {
    customerName: displayName,
    accountId: contextId,
    hasBusinessEnvisioning: Boolean(session?.businessEnvisioning),
    hasCompanyResearch: Boolean(session?.companyInsights?.length || session?.companyResearchSummary),
    roadmapPhaseCount: roadmap?.phases.length ?? 0,
    trackedRelationships: relSummary.total,
    staleRelationships: relSummary.staleOrNone,
    interactionsLast90Days: relSummary.interactionsLast90Days,
    hasSecureAIAssessment: Boolean(currentAssessment),
    secureAIPostureScore: currentAssessment?.postureScore,
    secureAIRefreshOverdue: currentAssessment ? isRefreshOverdue(currentAssessment) : false,
    totalUseCases: useCases.length,
    qualifiedOpportunities: ctxOpps.length,
    opportunitiesStage2Plus: ctxOpps.filter((o) => o.stage >= 2).length,
    hasMaccCommitment: Boolean(maccCommitment),
    consumptionOnTrack: maccCommitment ? isConsumptionOnTrack(consumptionPlan) : undefined,
    openBlockers: blockerSummary.open,
    overdueBlockers: blockerSummary.overdue,
  }
  const scorecard = computeFy27Scorecard(signals)

  return (
    <div className="space-y-4">
      <Tabs defaultValue="scorecard">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="secure-ai">Secure AI</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="blockers">Blockers</TabsTrigger>
        </TabsList>

        <TabsContent value="scorecard" className="mt-4">
          <Fy27ScorecardTab scorecard={scorecard} />
        </TabsContent>

        <TabsContent value="secure-ai" className="mt-4">
          <SecureAiAssessmentTab input={secureInput} current={currentAssessment} onSave={secureStore.save} />
        </TabsContent>

        <TabsContent value="relationships" className="mt-4">
          <RelationshipsTab
            accountId={contextId}
            customerId={customerId}
            relationships={ctxRelationships}
            interactions={ctxInteractions}
            personas={relStore.personas}
            onUpsertRelationship={relStore.upsertRelationship}
            onRemoveRelationship={relStore.removeRelationship}
            onAddInteraction={relStore.addInteraction}
          />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <RoadmapTab
            customerName={displayName}
            accountId={contextId}
            orderedUseCases={orderedUseCases}
            roadmap={roadmap}
            onUpsert={roadmapStore.upsert}
          />
        </TabsContent>

        <TabsContent value="consumption" className="mt-4">
          <ConsumptionPlanTab
            accountId={contextId}
            maccCommitment={maccCommitment}
            history={history}
            onSetHistory={consumptionStore.setHistory}
          />
        </TabsContent>

        <TabsContent value="blockers" className="mt-4">
          <BlockerBoardTab
            accountId={contextId}
            customerId={customerId}
            blockers={ctxBlockers}
            onUpsert={blockersStore.upsert}
            onSetStatus={blockersStore.setStatus}
            onRemove={blockersStore.remove}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
