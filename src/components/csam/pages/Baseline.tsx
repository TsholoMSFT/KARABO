/**
 * Page 3 — Investment Baseline (Section 2)
 * Page 4 — Value Realisation Map / Value Leakage Waterfall (Section 5 extra)
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CurrencyDollar, Funnel, Warning, Package } from '@phosphor-icons/react'
import { biggestLeakStage, valueLeakageStages } from '@/lib/csam/scoring'
import {
  CSAM_SOLUTION_AREA_LABELS,
  type CsamCustomerProfile,
  type Investment,
  type UsageSignal,
} from '@/lib/csam/types'
import {
  ClassificationBadge,
  ConfidenceBadge,
  EmptyState,
  formatUSD,
  Meter,
  PageHeader,
  Pill,
  StateBadge,
} from '../shared'

// ----------------------------------------------------------------------------
// Investment Baseline
// ----------------------------------------------------------------------------

export function InvestmentBaselinePage({ profile }: { profile: CsamCustomerProfile }) {
  if (!profile.investments.length) {
    return <EmptyState>No investments recorded for {profile.name} yet.</EmptyState>
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Investment Baseline"
        description="What the customer has invested in, who owns it, and how usage compares to the investment thesis."
        icon={<CurrencyDollar size={24} />}
      />
      <div className="space-y-4">
        {profile.investments.map((inv) => (
          <InvestmentCard
            key={inv.id}
            inv={inv}
            usage={profile.usageSignals.find((u) => u.investmentId === inv.id)}
          />
        ))}
      </div>
    </div>
  )
}

function gapState(gap?: number): 'green' | 'amber' | 'red' | 'grey' {
  if (gap == null) return 'grey'
  if (gap >= 50) return 'red'
  if (gap >= 25) return 'amber'
  return 'green'
}

function InvestmentCard({ inv, usage }: { inv: Investment; usage?: UsageSignal }) {
  const gap = usage?.adoptionGapPct
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={18} /> {inv.product}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary">{CSAM_SOLUTION_AREA_LABELS[inv.solutionArea]}</Badge>
              <Badge variant="outline" className="capitalize">{inv.purchaseType.replace('-', ' ')}</Badge>
              {inv.classification && <ClassificationBadge classification={inv.classification} />}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatUSD(inv.committedValueUSD)}</p>
            <p className="text-xs text-muted-foreground">committed</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm"><span className="text-muted-foreground">Intended outcome: </span>{inv.intendedOutcome}</p>

        {/* Usage vs. thesis */}
        {usage && (
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Usage vs. investment thesis</span>
              {gap != null && <StateBadge state={gapState(gap)} label={`${Math.round(gap)}% adoption gap`} />}
            </div>
            <Meter value={100 - (gap ?? 0)} state={gapState(gap)} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {usage.licensesPurchased != null && <span>Licences: {usage.licensesAssigned ?? '?'} / {usage.licensesPurchased} assigned</span>}
              {usage.activeUsers != null && <span>Active users: {usage.activeUsers.toLocaleString()}</span>}
              {usage.workloadConsumptionUSD != null && <span>Consumption: {formatUSD(usage.workloadConsumptionUSD)}/mo</span>}
              {usage.usageTrend && <span>Trend: {usage.usageTrend}</span>}
              {usage.intensityScore != null && <span>Intensity: {usage.intensityScore}/100</span>}
              <span className="inline-flex items-center gap-1">Confidence: <ConfidenceBadge confidence={usage.confidence} /></span>
            </div>
          </div>
        )}

        {/* Owners */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Owner label="Sponsor" name={inv.sponsor} />
          <Owner label="Business owner" name={inv.businessOwner} />
          <Owner label="Technical owner" name={inv.technicalOwner} />
          <Owner label="Finance owner" name={inv.financeOwner} />
        </div>

        {/* Links + risks */}
        <div className="flex flex-wrap gap-2">
          {inv.relatedSuccessPlan && <Pill className="border-sky-300 bg-sky-50 text-sky-700">CSP: {inv.relatedSuccessPlan}</Pill>}
          {inv.relatedCsdrTopic && <Pill className="border-violet-300 bg-violet-50 text-violet-700">CSDR: {inv.relatedCsdrTopic}</Pill>}
          {inv.risks?.map((r) => (
            <Pill key={r} className="border-amber-300 bg-amber-50 text-amber-800"><Warning size={12} className="mr-1" />{r}</Pill>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Owner({ label, name }: { label: string; name?: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{name ?? '—'}</p>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Value Realisation Map — Value Leakage Waterfall
// ----------------------------------------------------------------------------

export function ValueRealisationMapPage({ profile }: { profile: CsamCustomerProfile }) {
  const stages = useMemo(() => valueLeakageStages(profile), [profile])
  const leak = useMemo(() => biggestLeakStage(profile), [profile])

  if (!profile.useCases.length) {
    return <EmptyState>No use cases to map for {profile.name} yet.</EmptyState>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Value Realisation Map"
        description="The value-leakage waterfall — most dashboards stop at usage; this one continues to financial movement and executive value recognition."
        icon={<Funnel size={24} />}
      />

      {leak && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-center gap-2">
          <Warning size={18} />
          Value appears to leak most at <strong>“{leak.label}”</strong> — a {leak.dropoffPct}% drop-off from the previous stage.
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Purchased → Executive value recognised</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stages.map((s, i) => {
            const state = s.reachedPct >= 70 ? 'green' : s.reachedPct >= 40 ? 'amber' : s.reachedPct > 0 ? 'red' : 'grey'
            return (
              <div key={s.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    {s.label}
                  </span>
                  <span className="flex items-center gap-2">
                    {s.dropoffPct > 0 && <span className="text-xs text-red-600">−{s.dropoffPct}%</span>}
                    <span className="font-semibold tabular-nums w-10 text-right">{s.reachedPct}%</span>
                  </span>
                </div>
                <Meter value={s.reachedPct} state={state} />
              </div>
            )
          })}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Reach = the share of use cases that have reached each successive stage. Drop-offs flag where value stalls.
      </p>
    </div>
  )
}
