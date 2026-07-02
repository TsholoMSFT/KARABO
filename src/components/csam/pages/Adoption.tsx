/**
 * Page 6 — Adoption & Behavioural Barriers (Section 5)
 * Page 7 — Customer Health & Risk (Section 6)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Heartbeat, Warning, ShieldCheck } from '@phosphor-icons/react'
import { blockerInsight } from '@/lib/csam/engine'
import {
  ADOPTION_FACTOR_LABELS,
  BEHAVIOURAL_BLOCKER_LABELS,
  HEALTH_DIMENSION_LABELS,
  type AdoptionFactorId,
  type CsamCustomerProfile,
  type HealthSignal,
  type RiskLevel,
} from '@/lib/csam/types'
import { EmptyState, Meter, PageHeader, Pill, StateBadge } from '../shared'

// ----------------------------------------------------------------------------
// Adoption & Behavioural Barriers
// ----------------------------------------------------------------------------

function factorState(score: number): 'green' | 'amber' | 'red' | 'grey' {
  if (score >= 60) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

export function AdoptionBarriersPage({ profile }: { profile: CsamCustomerProfile }) {
  if (!profile.adoption.length) {
    return <EmptyState>No adoption diagnostics for {profile.name} yet.</EmptyState>
  }

  const allBlockers = [...new Set(profile.adoption.flatMap((d) => d.blockers))]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adoption & Behavioural Barriers"
        description="Behavioural readiness (ADKAR + trust, friction, incentives, workflow, executive modelling) and the blockers in the way."
        icon={<Users size={24} />}
      />

      {profile.adoption.map((diag) => {
        const uc = profile.useCases.find((u) => u.id === diag.useCaseId)
        const factors = Object.entries(diag.scores) as [AdoptionFactorId, number][]
        return (
          <Card key={diag.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{uc?.name ?? 'Adoption diagnostic'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {factors.map(([factor, score]) => (
                  <div key={factor} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{ADOPTION_FACTOR_LABELS[factor]}</span>
                      <span className="tabular-nums text-muted-foreground">{score}</span>
                    </div>
                    <Meter value={score} state={factorState(score)} />
                  </div>
                ))}
              </div>
              {diag.notes && <p className="text-sm text-muted-foreground">{diag.notes}</p>}
            </CardContent>
          </Card>
        )
      })}

      {allBlockers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Warning size={16} /> Behavioural blockers & interventions</h3>
          {allBlockers.map((b) => {
            const ins = blockerInsight(b)
            return (
              <Card key={b}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{BEHAVIOURAL_BLOCKER_LABELS[b]}</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Detail label="Likely root cause" value={ins.likelyRootCause} />
                  <Detail label="Evidence to look for" value={ins.evidenceToLookFor} />
                  <Detail label="Ask the customer" value={ins.customerQuestion} />
                  <Detail label="Recommended intervention" value={ins.recommendedIntervention} />
                  {ins.stakeholderOwner && (
                    <div className="md:col-span-2">
                      <Pill className="border-violet-300 bg-violet-50 text-violet-700">Owner: {ins.stakeholderOwner}</Pill>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Customer Health & Risk
// ----------------------------------------------------------------------------

const RISK_CLASSES: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300',
}

export function HealthRiskPage({ profile }: { profile: CsamCustomerProfile }) {
  if (!profile.healthSignals.length) {
    return <EmptyState>No health signals for {profile.name} yet.</EmptyState>
  }

  const critical = profile.healthSignals.filter((h) => h.riskLevel === 'critical').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Health & Risk"
        description="Resiliency, security, incident-readiness and operational health — with business and financial exposure for each."
        icon={<Heartbeat size={24} />}
        actions={
          critical ? (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">{critical} critical</Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1"><ShieldCheck size={14} /> No critical</Badge>
          )
        }
      />
      <div className="space-y-3">
        {profile.healthSignals.map((h) => (
          <HealthRow key={h.id} h={h} />
        ))}
      </div>
    </div>
  )
}

function HealthRow({ h }: { h: HealthSignal }) {
  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-medium">{HEALTH_DIMENSION_LABELS[h.dimension]}</p>
            {h.workload && <p className="text-xs text-muted-foreground">{h.workload}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`capitalize ${RISK_CLASSES[h.riskLevel]}`}>{h.riskLevel} risk</Badge>
            <StateBadge state={h.status} />
            {h.includeInCsdr && <Pill className="border-violet-300 bg-violet-50 text-violet-700">CSDR</Pill>}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {h.businessImpact && <Detail label="Business impact" value={h.businessImpact} />}
          {h.financialExposure && <Detail label="Financial exposure" value={h.financialExposure} />}
          {h.recommendation && <Detail label="Recommended action" value={h.recommendation} />}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground items-end">
            {h.customerOwner && <span>Customer: {h.customerOwner}</span>}
            {h.microsoftOwner && <span>Microsoft: {h.microsoftOwner}</span>}
            {h.reviewCadence && <span>Cadence: {h.reviewCadence}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
