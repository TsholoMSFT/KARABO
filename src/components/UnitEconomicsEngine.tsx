import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NavigationHeader } from '@/components/NavigationHeader'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Calculator,
  TrendUp,
  TrendDown,
  Coins,
  Bank,
  ChartLineUp,
  Warning,
  Lightning,
  Stack,
} from '@phosphor-icons/react'
import {
  computeUnitEconomics,
  buildCfoNarrative,
  buildMacroMicroUnitNarrative,
  formatUSD,
  formatNumber,
  type TransactionUnit,
  type FirmFinancials,
  type CloudRepricing,
  type MacroContext,
  type CostPlacement,
  type RateEnv,
  type AiCycle,
  type RegPressure,
} from '@/lib/unit-economics'

interface UnitEconomicsEngineProps {
  customerName?: string
  annualRevenueUSD?: number
  itBudgetUSD?: number
  onBack?: () => void
  onBackToLanding?: () => void
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  prefix,
  suffix,
  hint,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  step?: number
  prefix?: string
  suffix?: string
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>
        )}
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={prefix ? 'pl-5' : suffix ? 'pr-8' : ''}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>}
    </div>
  )
}

const CHART_COLORS = {
  Labor: '#ef4444',
  Infra: '#f59e0b',
  Software: '#8b5cf6',
  Other: '#94a3b8',
  Cloud: '#0ea5e9',
  AI: '#22c55e',
}

export function UnitEconomicsEngine({
  customerName,
  annualRevenueUSD,
  itBudgetUSD,
  onBack,
  onBackToLanding,
}: UnitEconomicsEngineProps) {
  const [unit, setUnit] = useState<TransactionUnit>({
    id: 'txn-demo',
    name: 'Customer onboarding',
    annualVolume: 500_000,
    laborCostPerTxn: 12,
    infraCostPerTxn: 4,
    softwareCostPerTxn: 1.5,
    otherCostPerTxn: 0.5,
  })

  const [firm, setFirm] = useState<FirmFinancials>({
    annualRevenueUSD: annualRevenueUSD && annualRevenueUSD > 0 ? annualRevenueUSD : 500_000_000,
    grossMarginPct: 45,
    ebitdaMarginPct: 18,
    taxRatePct: 25,
  })

  const [repricing, setRepricing] = useState<CloudRepricing>({
    costPlacement: 'cogs',
    cloudCostPerTxn: 0.8,
    utilisationPctOnPrem: 35,
    aiAutomationPct: 70,
    aiResidualCostPerTxn: 0.15,
    onPremInfraCapexSharePct: 60,
    capexDepreciationYears: 4,
    implementationCostUSD: itBudgetUSD && itBudgetUSD > 0 ? Math.round(itBudgetUSD * 0.05) : 250_000,
  })

  const [macro, setMacro] = useState<MacroContext>({
    interestRateEnv: 'high',
    aiCycle: 'scaling',
    regulatoryPressure: 'medium',
  })

  const result = useMemo(
    () => computeUnitEconomics(unit, firm, repricing, macro),
    [unit, firm, repricing, macro],
  )
  const cfoPoints = useMemo(() => buildCfoNarrative(result), [result])
  const lenses = useMemo(() => buildMacroMicroUnitNarrative(result, firm, macro), [result, firm, macro])

  const chartData = [
    {
      name: 'On-prem (capacity)',
      Labor: result.current.laborUSD,
      Infra: result.current.infraUSD,
      Software: result.current.softwareUSD,
      Other: result.current.otherUSD,
      Cloud: 0,
      AI: 0,
    },
    {
      name: 'Azure (usage)',
      Labor: result.cloud.laborUSD,
      Infra: 0,
      Software: result.cloud.softwareUSD,
      Other: result.cloud.otherUSD,
      Cloud: result.cloud.cloudUSD,
      AI: 0,
    },
    {
      name: 'Azure + AI',
      Labor: result.cloudAi.laborUSD,
      Infra: 0,
      Software: result.cloudAi.softwareUSD,
      Other: result.cloudAi.otherUSD,
      Cloud: result.cloudAi.cloudUSD,
      AI: result.cloudAi.aiResidualUSD,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <NavigationHeader variant="minimal" onBackToLanding={onBackToLanding} onBack={onBack} backLabel="Back" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl pb-16 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Calculator size={28} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Unit Economics Engine</h1>
            <p className="text-muted-foreground">
              What does one unit of {customerName || "the customer's"} business cost to deliver — and how do Azure
              and AI re-price it, all the way through to gross margin, EBITDA, cash flow and the balance sheet?
            </p>
          </div>
        </div>

        {/* Three-lens framing strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {lenses.map((lens) => (
            <Card key={lens.lens} className="bg-muted/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase text-[10px] tracking-wide">
                    {lens.lens}
                  </Badge>
                  <CardTitle className="text-sm">{lens.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {lens.points.map((p, i) => (
                  <p key={i} className="text-xs text-muted-foreground leading-snug">
                    {p}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* ── INPUTS ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stack size={18} /> The repeated transaction
                </CardTitle>
                <CardDescription className="text-xs">
                  The "unit of business" you repeat most — and its fully-loaded cost today.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Transaction name</Label>
                  <Input
                    value={unit.name}
                    placeholder="e.g., Claim adjudicated, Invoice processed"
                    onChange={(e) => setUnit({ ...unit, name: e.target.value })}
                  />
                </div>
                <NumberField
                  label="Annual volume"
                  value={unit.annualVolume}
                  step={1000}
                  suffix="/yr"
                  onChange={(n) => setUnit({ ...unit, annualVolume: n })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Labour / txn" prefix="$" step={0.1} value={unit.laborCostPerTxn} onChange={(n) => setUnit({ ...unit, laborCostPerTxn: n })} />
                  <NumberField label="Infra / txn" prefix="$" step={0.1} value={unit.infraCostPerTxn} onChange={(n) => setUnit({ ...unit, infraCostPerTxn: n })} hint="On-prem, at full capacity" />
                  <NumberField label="Software / txn" prefix="$" step={0.1} value={unit.softwareCostPerTxn} onChange={(n) => setUnit({ ...unit, softwareCostPerTxn: n })} />
                  <NumberField label="Other / txn" prefix="$" step={0.1} value={unit.otherCostPerTxn} onChange={(n) => setUnit({ ...unit, otherCostPerTxn: n })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightning size={18} /> Re-price with Azure + AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Where does cloud spend land?</Label>
                  <Select
                    value={repricing.costPlacement}
                    onValueChange={(v) => setRepricing({ ...repricing, costPlacement: v as CostPlacement })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cogs">COGS → moves gross margin</SelectItem>
                      <SelectItem value="opex">OPEX → moves operating margin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Cloud / txn (usage)" prefix="$" step={0.05} value={repricing.cloudCostPerTxn} onChange={(n) => setRepricing({ ...repricing, cloudCostPerTxn: n })} />
                  <NumberField label="On-prem utilisation" suffix="%" value={repricing.utilisationPctOnPrem} onChange={(n) => setRepricing({ ...repricing, utilisationPctOnPrem: n })} hint="Lower = bigger capacity tax" />
                  <NumberField label="AI automates" suffix="%" value={repricing.aiAutomationPct} onChange={(n) => setRepricing({ ...repricing, aiAutomationPct: n })} hint="of the labour step" />
                  <NumberField label="AI cost / txn" prefix="$" step={0.01} value={repricing.aiResidualCostPerTxn} onChange={(n) => setRepricing({ ...repricing, aiResidualCostPerTxn: n })} hint="residual inference" />
                  <NumberField label="On-prem CAPEX share" suffix="%" value={repricing.onPremInfraCapexSharePct ?? 60} onChange={(n) => setRepricing({ ...repricing, onPremInfraCapexSharePct: n })} hint="capitalised vs opex" />
                  <NumberField label="Implementation" prefix="$" step={1000} value={repricing.implementationCostUSD ?? 0} onChange={(n) => setRepricing({ ...repricing, implementationCostUSD: n })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ChartLineUp size={18} /> Firm financials & macro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Annual revenue" prefix="$" step={1_000_000} value={firm.annualRevenueUSD} onChange={(n) => setFirm({ ...firm, annualRevenueUSD: n })} />
                  <NumberField label="Gross margin" suffix="%" value={firm.grossMarginPct} onChange={(n) => setFirm({ ...firm, grossMarginPct: n })} />
                  <NumberField label="EBITDA margin" suffix="%" value={firm.ebitdaMarginPct ?? 0} onChange={(n) => setFirm({ ...firm, ebitdaMarginPct: n })} />
                  <NumberField label="Tax rate" suffix="%" value={firm.taxRatePct ?? 25} onChange={(n) => setFirm({ ...firm, taxRatePct: n })} />
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Interest-rate environment</Label>
                    <Select value={macro.interestRateEnv} onValueChange={(v) => setMacro({ ...macro, interestRateEnv: v as RateEnv })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low rates</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="high">High rates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">AI cycle</Label>
                    <Select value={macro.aiCycle} onValueChange={(v) => setMacro({ ...macro, aiCycle: v as AiCycle })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="early">Early</SelectItem>
                        <SelectItem value="scaling">Scaling</SelectItem>
                        <SelectItem value="mature">Mature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Regulatory pressure</Label>
                    <Select value={macro.regulatoryPressure} onValueChange={(v) => setMacro({ ...macro, regulatoryPressure: v as RegPressure })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RESULTS ────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Headline metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-[11px] text-muted-foreground">Cost / txn today</p>
                  <p className="text-xl font-bold">{formatUSD(result.current.totalUSD)}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-4">
                  <p className="text-[11px] text-muted-foreground">Cost / txn (Azure + AI)</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatUSD(result.cloudAi.totalUSD)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-[11px] text-muted-foreground">Saving / txn</p>
                  <p className="text-xl font-bold">{formatUSD(result.savingsPerTxnUSD)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-[11px] text-muted-foreground">Annual saving</p>
                  <p className="text-xl font-bold">{formatUSD(result.annualSavingsUSD)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Cost-per-transaction chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cost to deliver one {unit.name || 'transaction'}</CardTitle>
                <CardDescription className="text-xs">
                  Usage-based pricing removes the {formatUSD(result.capacityPenaltyPerTxnUSD)}/txn peak-capacity tax;
                  AI inverts {formatUSD(result.aiInversionSavingPerTxnUSD)}/txn of labour.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => formatUSD(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Labor" stackId="a" fill={CHART_COLORS.Labor} />
                    <Bar dataKey="Infra" stackId="a" fill={CHART_COLORS.Infra} />
                    <Bar dataKey="Software" stackId="a" fill={CHART_COLORS.Software} />
                    <Bar dataKey="Other" stackId="a" fill={CHART_COLORS.Other} />
                    <Bar dataKey="Cloud" stackId="a" fill={CHART_COLORS.Cloud} />
                    <Bar dataKey="AI" stackId="a" fill={CHART_COLORS.AI} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CFO bridge: margin / EBITDA / cash / balance sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Margin */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendUp size={16} className="text-green-500" />
                    {result.margin.marginLine === 'gross' ? 'Gross margin (cloud in COGS)' : 'Operating margin (cloud in OPEX)'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{result.margin.marginAfterPct}%</span>
                    <span className="text-xs text-muted-foreground">from {result.margin.marginBeforePct}%</span>
                    <Badge variant="secondary" className="ml-auto">
                      {result.margin.marginDeltaPp >= 0 ? '+' : ''}{result.margin.marginDeltaPp}pp
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* EBITDA */}
              <Card className={result.ebitda.isOpticalDip ? 'border-amber-500/40 bg-amber-500/5' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {result.ebitda.ebitdaDeltaUSD < 0 ? <TrendDown size={16} className="text-amber-500" /> : <TrendUp size={16} className="text-green-500" />}
                    EBITDA
                    {result.ebitda.isOpticalDip && (
                      <Badge variant="outline" className="ml-auto border-amber-500 text-amber-700 dark:text-amber-400 gap-1">
                        <Warning size={11} /> optical dip
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{formatUSD(result.ebitda.ebitdaAfterUSD)}</span>
                    <span className={`text-xs ${result.ebitda.ebitdaDeltaUSD < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {result.ebitda.ebitdaDeltaUSD >= 0 ? '+' : ''}{formatUSD(result.ebitda.ebitdaDeltaUSD)}
                    </span>
                  </div>
                  {result.ebitda.isOpticalDip && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      CAPEX (added back) → OPEX (in EBITDA). Optical, not real — cash improves.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cash flow */}
              <Card className="border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Coins size={16} className="text-green-500" /> Free cash flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +{formatUSD(result.cashFlow.annualFcfImprovementUSD)}
                    </span>
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    + {formatUSD(result.cashFlow.capexAvoidedAnnualUSD)} CAPEX avoided · Yr-1 net {formatUSD(result.cashFlow.year1FcfImprovementUSD)}
                  </p>
                </CardContent>
              </Card>

              {/* Balance sheet / ROIC */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bank size={16} className="text-primary" /> Balance sheet · ROIC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{result.balanceSheet.roicAfterPct}%</span>
                    <span className="text-xs text-muted-foreground">from {result.balanceSheet.roicBeforePct}%</span>
                    <Badge variant="secondary" className="ml-auto">
                      {result.balanceSheet.roicDeltaPp >= 0 ? '+' : ''}{result.balanceSheet.roicDeltaPp}pp
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    −{formatUSD(result.balanceSheet.ppeReductionUSD)} capitalised IT assets off the balance sheet
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CFO narrative */}
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Say this to the CFO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cfoPoints.map((p, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span>{p}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Assumptions */}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">Assumptions &amp; method ({result.assumptions.length})</summary>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {result.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
