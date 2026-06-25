import { useMemo, useState, type ReactNode } from 'react'
import {
  ChartLineUp,
  Coins,
  Wallet,
  Stack,
  Target,
  Scales,
  TrendUp,
  ChartBar,
  Info,
  CheckCircle,
  Circle,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UseCase } from '@/lib/types'
import {
  allocateCapital,
  monteCarloNPV,
  portfolioMetrics,
  type PortfolioAsset,
} from '@/lib/portfolio-analytics'
import { formatCurrency, formatPercentage } from '@/lib/financial-calculations'
import { businessFunctionLabel } from '@/lib/business-functions'

interface ValuePortfolioProps {
  /** Use cases to value as an investment portfolio (typically the current session's). */
  useCases: UseCase[]
  /** Optional customer label for the header copy. */
  customerName?: string
}

/** Microsoft fiscal year label (FY starts 1 July) from a timestamp. */
function fiscalYear(ts?: number): string | undefined {
  if (!ts) return undefined
  const d = new Date(ts)
  const fy = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear()
  return `FY${String(fy).slice(2)}`
}

const usd = (n: number) => formatCurrency(Math.round(n), 'USD')
const mult = (n: number) => (isFinite(n) ? `${n.toFixed(2)}\u00d7` : '\u2014')
const piLabel = (n: number) => (isFinite(n) ? n.toFixed(2) : '\u221e')

/** Small KPI tile. */
function Kpi({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {icon}
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function ValuePortfolio({ useCases, customerName }: ValuePortfolioProps) {
  // ── Build priced assets from use cases ────────────────────────────────────
  const { priced, unpriced } = useMemo(() => {
    const priced: PortfolioAsset[] = []
    const unpriced: { id: string; title: string; reason: string }[] = []
    for (const uc of useCases ?? []) {
      const annualValue = uc.expectedValue?.totalAnnualValue ?? 0
      const annualRun =
        uc.runCost?.totalAnnualUSD ??
        (uc.consumptionEstimate?.estimatedMonthly ? uc.consumptionEstimate.estimatedMonthly * 12 : 0)
      const impl = uc.expectedValue?.implementationCost ?? uc.runCost?.oneTimeImplementationUSD ?? 0
      if (impl <= 0 || annualValue <= 0) {
        unpriced.push({
          id: uc.id,
          title: uc.title,
          reason: impl <= 0 ? 'Needs implementation cost' : 'Needs expected value',
        })
        continue
      }
      priced.push({
        id: uc.id,
        name: uc.title,
        category: uc.businessFunction
          ? businessFunctionLabel(uc.businessFunction)
          : uc.microsoftSolutions?.[0]?.productFamily,
        vintage: fiscalYear(uc.createdAt),
        investedCapital: impl,
        annualReturn: annualValue - annualRun,
        returnBasis: 'projected',
        successProbability: Math.max(0.1, Math.min(1, (uc.feasibility ?? 5) / 10)),
      })
    }
    return { priced, unpriced }
  }, [useCases])

  const metrics = useMemo(() => portfolioMetrics(priced), [priced])
  const totalNPV = useMemo(() => metrics.perAsset.reduce((s, m) => s + m.npv, 0), [metrics])
  const rankedAssets = useMemo(
    () => [...metrics.perAsset].sort((a, b) => b.profitabilityIndex - a.profitabilityIndex),
    [metrics],
  )

  // Risk-adjusted value grouped by business function / department.
  const departments = useMemo(() => {
    const byCat = new Map<string, { invested: number; annualReturn: number; count: number }>()
    for (const a of priced) {
      const key = a.category ?? 'Unassigned'
      const cur = byCat.get(key) ?? { invested: 0, annualReturn: 0, count: 0 }
      cur.invested += a.investedCapital
      cur.annualReturn += a.annualReturn * (a.successProbability ?? 1)
      cur.count += 1
      byCat.set(key, cur)
    }
    return [...byCat.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.annualReturn - a.annualReturn)
  }, [priced])

  // ── Capital allocation under a budget ─────────────────────────────────────
  const [budget, setBudget] = useState<number>(() => Math.round(metrics.totalInvested))
  const allocation = useMemo(() => allocateCapital(priced, budget || 0), [priced, budget])
  const fundedSet = useMemo(() => new Set(allocation.fundedIds), [allocation])

  // ── Portfolio Monte Carlo (synthetic aggregate, 30% CoV, independent) ─────
  const mc = useMemo(() => {
    if (!priced.length) return null
    const haircut = priced.map((a) => a.annualReturn * (a.successProbability ?? 1))
    const totalReturn = haircut.reduce((s, r) => s + r, 0)
    const totalInvested = priced.reduce((s, a) => s + a.investedCapital, 0)
    const stdDev = Math.sqrt(haircut.reduce((s, r) => s + Math.pow(0.3 * r, 2), 0))
    return monteCarloNPV(
      {
        id: 'portfolio',
        name: 'Portfolio',
        investedCapital: totalInvested,
        annualReturn: totalReturn,
        returnBasis: 'projected',
        successProbability: 1,
        returnStdDev: stdDev,
      },
      { runs: 2000, seed: 1 },
    )
  }, [priced])

  const subtitle = customerName ? `${customerName} \u00b7 ${priced.length} priced of ${priced.length + unpriced.length} use cases` : `${priced.length} priced of ${priced.length + unpriced.length} use cases`

  return (
    <div className="space-y-6">
      {/* Explainer */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ChartLineUp size={22} weight="duotone" className="text-primary" />
                Value Portfolio
              </CardTitle>
              <CardDescription className="max-w-2xl">
                Treats every use case as an investment and prices the book: net asset value, profitability-ranked
                capital allocation, vintage returns, value attribution and a risk-adjusted NPV range. {subtitle}.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 shrink-0">
              <Info size={13} weight="duotone" />
              Projected &middot; not yet measured
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {priced.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Stack size={40} className="mx-auto opacity-40" />
            <p className="font-medium">No priced use cases yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add an <strong>expected value</strong> and an <strong>implementation cost</strong> to your use cases
              (Financial Impact tab) and they&rsquo;ll appear here as portfolio assets.
            </p>
            {unpriced.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {unpriced.length} use case{unpriced.length === 1 ? '' : 's'} found but not yet costed.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Headline KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              icon={<Wallet size={14} weight="duotone" />}
              label="Portfolio NAV"
              value={usd(metrics.nav)}
              sub="PV of projected benefits"
            />
            <Kpi
              icon={<Coins size={14} weight="duotone" />}
              label="Total invested"
              value={usd(metrics.totalInvested)}
              sub={`${metrics.assetCount} assets`}
            />
            <Kpi
              icon={<TrendUp size={14} weight="duotone" />}
              label="Net annual return"
              value={usd(metrics.totalAnnualReturn)}
              sub="value \u2212 run cost"
            />
            <Kpi
              icon={<Target size={14} weight="duotone" />}
              label="Total NPV"
              value={usd(totalNPV)}
              sub={`MOIC ${mult(metrics.portfolioMOIC)}`}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              icon={<ChartBar size={14} weight="duotone" />}
              label="Weighted IRR"
              value={formatPercentage(metrics.weightedIRR)}
            />
            <Kpi
              icon={<Info size={14} weight="duotone" />}
              label="Blended confidence"
              value={`${Math.round(metrics.blendedConfidence * 100)}%`}
              sub="value-weighted"
            />
            <Kpi
              icon={<Scales size={14} weight="duotone" />}
              label="Concentration"
              value={metrics.concentrationByValue.toFixed(2)}
              sub="Herfindahl (1/n\u20261)"
            />
            <Kpi
              icon={<Stack size={14} weight="duotone" />}
              label="Vintages"
              value={String(metrics.vintages.length || 1)}
              sub={metrics.vintages.map((v) => v.vintage).filter(Boolean).join(', ') || 'unassigned'}
            />
          </div>

          {/* Monte Carlo */}
          {mc && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ChartLineUp size={18} weight="duotone" className="text-primary" />
                  Risk-adjusted NPV range
                </CardTitle>
                <CardDescription>
                  2,000-run Monte Carlo on the aggregate book (30% coefficient of variation per asset, assumed
                  independent). Deterministic seed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">P10 (downside)</div>
                    <div className="text-xl font-semibold tabular-nums">{usd(mc.p10)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">P50 (median)</div>
                    <div className="text-xl font-semibold tabular-nums">{usd(mc.p50)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">P90 (upside)</div>
                    <div className="text-xl font-semibold tabular-nums">{usd(mc.p90)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">P(NPV &gt; 0)</div>
                    <div className="text-xl font-semibold tabular-nums">
                      {Math.round(mc.probabilityPositive * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Capital allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Coins size={18} weight="duotone" className="text-primary" />
                Capital allocation
              </CardTitle>
              <CardDescription>
                Profitability-ranked selection (highest PV per dollar first) under a budget constraint. Only
                value-creating assets (PI &gt; 1) are eligible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <label htmlFor="vp-budget" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Budget (USD)
                  </label>
                  <Input
                    id="vp-budget"
                    type="number"
                    min={0}
                    step={10000}
                    value={budget}
                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
                    className="w-40 tabular-nums"
                  />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Funded </span>
                    <span className="font-semibold tabular-nums">
                      {allocation.fundedIds.length}/{priced.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deployed </span>
                    <span className="font-semibold tabular-nums">{usd(allocation.capitalDeployed)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unspent </span>
                    <span className="font-semibold tabular-nums">{usd(allocation.capitalRemaining)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Funded NPV </span>
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {usd(allocation.fundedNPV)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-asset table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stack size={18} weight="duotone" className="text-primary" />
                Assets by profitability
              </CardTitle>
              <CardDescription>Sorted by Profitability Index (PV of benefits &divide; invested capital).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Use case</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Net / yr</TableHead>
                      <TableHead className="text-right">NPV</TableHead>
                      <TableHead className="text-right">PI</TableHead>
                      <TableHead className="text-right">IRR</TableHead>
                      <TableHead className="text-right">EVA</TableHead>
                      <TableHead className="text-right">MOIC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedAssets.map((m) => {
                      const funded = fundedSet.has(m.id)
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="pr-0">
                            {funded ? (
                              <CheckCircle size={16} weight="fill" className="text-emerald-500" />
                            ) : (
                              <Circle size={16} className="text-muted-foreground/40" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium max-w-[18rem] truncate" title={m.name}>
                            {m.name}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{usd(m.investedCapital)}</TableCell>
                          <TableCell className="text-right tabular-nums">{usd(m.annualReturn)}</TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${m.npv >= 0 ? '' : 'text-destructive'}`}
                          >
                            {usd(m.npv)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Badge variant={m.profitabilityIndex > 1 ? 'default' : 'secondary'} className="tabular-nums">
                              {piLabel(m.profitabilityIndex)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatPercentage(m.irr)}</TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${m.eva >= 0 ? '' : 'text-destructive'}`}
                          >
                            {usd(m.eva)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{mult(m.moic)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Value by department */}
          {departments.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scales size={18} weight="duotone" className="text-primary" />
                  Value by department
                </CardTitle>
                <CardDescription>
                  Risk-adjusted annual return and invested capital grouped by business function.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {departments.map((d) => {
                  const share = metrics.totalAnnualReturn > 0 ? d.annualReturn / metrics.totalAnnualReturn : 0
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="shrink-0">{d.name}</Badge>
                          <span className="text-muted-foreground truncate">
                            {d.count} use case{d.count === 1 ? '' : 's'} &middot; {usd(d.invested)} invested
                          </span>
                        </span>
                        <span className="tabular-nums text-muted-foreground shrink-0">
                          {usd(d.annualReturn)}/yr &middot; {Math.round(share * 100)}%
                        </span>
                      </div>
                      <Progress value={share * 100} className="h-1.5" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Vintage + attribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ChartBar size={18} weight="duotone" className="text-primary" />
                  Vintage cohorts
                </CardTitle>
                <CardDescription>Returns by the fiscal year an investment was made.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.vintages.length === 0 && (
                  <p className="text-sm text-muted-foreground">No dated vintages.</p>
                )}
                {metrics.vintages.map((v) => (
                  <div key={v.vintage || 'unassigned'} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{v.vintage || 'Unassigned'}</Badge>
                      <span className="text-muted-foreground">
                        {v.assetCount} asset{v.assetCount === 1 ? '' : 's'} &middot; {usd(v.investedCapital)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 tabular-nums">
                      <span title="Gross value multiple">{mult(v.moic)}</span>
                      <span className="text-muted-foreground" title="IRR">
                        {formatPercentage(v.irr)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target size={18} weight="duotone" className="text-primary" />
                  Value attribution
                </CardTitle>
                <CardDescription>Share of total annual value by use case.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.attribution.slice(0, 8).map((a) => (
                  <div key={a.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="truncate" title={a.name}>
                        {a.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground shrink-0">
                        {usd(a.contribution)} &middot; {Math.round(a.share * 100)}%
                      </span>
                    </div>
                    <Progress value={a.share * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Unpriced */}
          {unpriced.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info size={18} weight="duotone" className="text-muted-foreground" />
                  Not yet priced ({unpriced.length})
                </CardTitle>
                <CardDescription>
                  These use cases are excluded from portfolio metrics until they have both an expected value and an
                  implementation cost.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {unpriced.map((u) => (
                    <Badge key={u.id} variant="secondary" className="gap-1" title={u.reason}>
                      {u.title}
                      <span className="text-muted-foreground">&middot; {u.reason}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
