/**
 * Page 1 — Portfolio Overview, and Page 2 — Customer 360 with the
 * Account Value Executive Summary (Section 1).
 */
import { useMemo, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Buildings, ChartBar, Warning, Target, Lightbulb, ChatText, ArrowRight, Users,
} from '@phosphor-icons/react'
import {
  computeAllScores,
  computeHealthScore,
  computeValueRealisationScore,
  topConversationStarters,
  topValueGaps,
} from '@/lib/csam/scoring'
import { recommendNextBestActions } from '@/lib/csam/engine'
import type { CsamCustomerProfile } from '@/lib/csam/types'
import { ColorDot, EmptyState, formatUSD, PageHeader, ScoreCard, StateBadge } from '../shared'

// ----------------------------------------------------------------------------
// Portfolio Overview
// ----------------------------------------------------------------------------

export function PortfolioOverviewPage({
  profiles,
  onSelect,
}: {
  profiles: CsamCustomerProfile[]
  onSelect: (customerId: string) => void
}) {
  const rows = useMemo(
    () =>
      profiles.map((p) => ({
        profile: p,
        value: computeValueRealisationScore(p),
        health: computeHealthScore(p),
        invested: p.investments.reduce((s, i) => s + (i.committedValueUSD ?? 0), 0),
        gaps: topValueGaps(p, 1)[0],
      })),
    [profiles],
  )

  const totals = useMemo(() => {
    const invested = rows.reduce((s, r) => s + r.invested, 0)
    const atRisk = rows.filter((r) => r.value.colorState === 'red' || r.health.colorState === 'red').length
    const expansion = profiles.filter((p) =>
      p.useCases.some((u) => u.adoptionStage === 'financial-validated' || u.adoptionStage === 'exec-recognised'),
    ).length
    return { invested, atRisk, expansion }
  }, [rows, profiles])

  if (!profiles.length) {
    return <EmptyState>No customers yet. Add a profile or enable demo mode to explore the sample scenarios.</EmptyState>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Overview"
        description="Value realisation and health across your accounts. Spot recurring value gaps and where to focus."
        icon={<ChartBar size={24} />}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Accounts" value={String(profiles.length)} />
        <Stat label="Tracked investment" value={formatUSD(totals.invested)} />
        <Stat label="At-risk accounts" value={String(totals.atRisk)} tone={totals.atRisk ? 'red' : 'green'} />
        <Stat label="Expansion-ready" value={String(totals.expansion)} tone="green" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {rows.map(({ profile, value, health, invested, gaps }) => (
            <button
              key={profile.customerId}
              onClick={() => onSelect(profile.customerId)}
              className="w-full flex items-center justify-between gap-4 py-3 text-left hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Buildings size={16} className="shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{profile.name}</span>
                  {profile.industry && <Badge variant="secondary" className="shrink-0">{profile.industry}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{gaps ?? 'No material value gap detected.'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Metric label="Value" state={value.colorState} score={value.score} />
                <Metric label="Health" state={health.colorState} score={health.score} />
                <span className="hidden sm:inline text-sm tabular-nums text-muted-foreground w-16 text-right">{formatUSD(invested)}</span>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-600' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function Metric({ label, state, score }: { label: string; state: 'green' | 'amber' | 'red' | 'grey'; score: number }) {
  return (
    <div className="hidden md:flex flex-col items-center w-14">
      <div className="flex items-center gap-1">
        <ColorDot state={state} />
        <span className="text-sm font-semibold tabular-nums">{score}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Customer 360 + Account Value Executive Summary (Section 1)
// ----------------------------------------------------------------------------

export function Customer360Page({ profile }: { profile: CsamCustomerProfile }) {
  const scores = useMemo(() => computeAllScores(profile), [profile])
  const gaps = useMemo(() => topValueGaps(profile), [profile])
  const starters = useMemo(() => topConversationStarters(profile), [profile])
  const actions = useMemo(() => recommendNextBestActions(profile).slice(0, 3), [profile])

  const invested = profile.investments.reduce((s, i) => s + (i.committedValueUSD ?? 0), 0)
  const realised = profile.useCases.filter(
    (u) => u.adoptionStage === 'financial-validated' || u.adoptionStage === 'exec-recognised',
  )
  const atRisk = profile.healthSignals.filter((h) => h.status === 'red' || h.riskLevel === 'critical')

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Customer 360 — ${profile.name}`}
        description="Account value executive summary: what was invested, what is happening, and what to do next."
        icon={<Buildings size={24} />}
        actions={profile.renewalSignal ? <StateBadge state={profile.renewalSignal} label={`Renewal: ${profile.renewalSignal}`} /> : undefined}
      />

      {/* Identity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Field label="Industry" value={profile.industry} />
        <Field label="Segment" value={profile.segment} />
        <Field label="Region (data residency)" value={profile.region} />
        <Field label="CSAM" value={profile.team?.csam} />
      </div>
      {profile.executivePriorities?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Target size={14} /> Executive priorities:</span>
          {profile.executivePriorities.map((p) => (
            <Badge key={p} variant="outline">{p}</Badge>
          ))}
        </div>
      ) : null}

      {/* Five scores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {scores.map((s) => (
          <ScoreCard key={s.id} score={s} />
        ))}
      </div>

      {/* Investment snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Value at a glance</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Line label="Invested / committed" value={formatUSD(invested)} />
          <Line label="Use cases in flight" value={String(profile.useCases.length)} />
          <Line label="Value realised" value={`${realised.length} use case(s) validated / exec-recognised`} />
          <Line label="Value at risk" value={atRisk.length ? `${atRisk.length} critical health signal(s)` : 'None critical'} />
          <Line
            label="Likely unrealised"
            value={gaps.length ? `${gaps.length} value gap(s) identified` : 'No material gap'}
          />
          <Line label="Next best action" value={actions[0]?.recommendation ?? 'Schedule a CSDR'} />
        </CardContent>
      </Card>

      {/* Top 3s */}
      <div className="grid md:grid-cols-3 gap-4">
        <TopList icon={<Warning size={16} />} title="Top value gaps" items={gaps} emptyText="No material gaps." />
        <TopList
          icon={<Lightbulb size={16} />}
          title="Recommended CSAM actions"
          items={actions.map((a) => a.recommendation)}
          emptyText="No actions yet."
        />
        <TopList icon={<ChatText size={16} />} title="Executive conversation starters" items={starters} emptyText="—" />
      </div>

      {profile.team && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users size={16} /> Account team</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {Object.entries(profile.team)
              .filter(([, name]) => !!name)
              .map(([role, name]) => (
                <Badge key={role} variant="secondary" className="uppercase">{role}: <span className="ml-1 normal-case font-normal">{name}</span></Badge>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value ?? '—'}</p>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

function TopList({
  icon,
  title,
  items,
  emptyText,
}: {
  icon: ReactNode
  title: string
  items: string[]
  emptyText: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ol className="space-y-2 text-sm list-decimal list-inside">
            {items.map((it, i) => (
              <li key={i} className="text-muted-foreground"><span className="text-foreground">{it}</span></li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  )
}
