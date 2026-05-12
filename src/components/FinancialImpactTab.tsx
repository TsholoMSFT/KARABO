import { useMemo } from 'react'
import type { UseCase, UseCaseCOI, UseCaseExpectedValue } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { QuickCOICalculator } from '@/components/QuickCOICalculator'
import { QuickROICalculator, type ROIInputs, type ROIResult } from '@/components/QuickROICalculator'
import { calculatePaybackPeriod, calculateROI } from '@/lib/financial-calculations'
import { REFERENCE_ARCHITECTURES, type ReferenceArchitecturePattern } from '@/lib/microsoft-solutions'
import { Calculator, TrendUp, WarningCircle, Target, CurrencyDollar } from '@phosphor-icons/react'
import { InlineDisclaimer } from '@/components/Disclaimer'
import { UseCaseCostBreakdown } from '@/components/UseCaseCostBreakdown'
import { portfolioRunCost } from '@/lib/cost-engine'

const DEFAULT_COST_PER_WEEK_USD = 8000

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value).toLocaleString()}`
}

function buildDerivedExpectedValueNotes(useCase: UseCase) {
  const lines: string[] = []

  const hasEV = !!useCase.expectedValue
  if (!hasEV) {
    lines.push('Derived defaults were applied because Expected Value was not yet set.')
  }

  const coiTotal = useCase.costOfInaction?.totalAnnualCOI
  if (typeof coiTotal === 'number' && coiTotal > 0 && !useCase.expectedValue?.totalAnnualValue) {
    lines.push(`Annual expected value defaulted to COI total ($${Math.round(coiTotal).toLocaleString()}/yr) — please adjust if value capture differs from COI.`)
  }

  const effortWeeks = useCase.aiEffortEstimate?.effortWeeks
  if (typeof effortWeeks === 'number' && effortWeeks > 0 && !useCase.expectedValue?.implementationCost) {
    lines.push(`Implementation cost defaulted from effort estimate (${effortWeeks} person-weeks × $${DEFAULT_COST_PER_WEEK_USD.toLocaleString()}/week).`)
  }

  if (useCase.dataSources?.length) {
    lines.push(`Evidence sources: ${useCase.dataSources.join(', ')}`)
  }

  if (useCase.earningsContext?.length) {
    lines.push('Earnings transcript highlights were captured and included in this use case.')
  }

  if (useCase.industryContext?.length) {
    lines.push('Industry / external research highlights were captured and included in this use case.')
  }

  return lines.join('\n')
}

function inferROIInputs(useCase: UseCase): ROIInputs {
  const annualFromEV = useCase.expectedValue?.totalAnnualValue
  const annualFromCOI = useCase.costOfInaction?.totalAnnualCOI

  const totalAnnualValue = typeof annualFromEV === 'number' && annualFromEV > 0
    ? annualFromEV
    : (typeof annualFromCOI === 'number' && annualFromCOI > 0 ? annualFromCOI : 0)

  const implFromEV = useCase.expectedValue?.implementationCost
  const effortWeeks = useCase.aiEffortEstimate?.effortWeeks
  const implFromEffort = typeof effortWeeks === 'number' && effortWeeks > 0
    ? effortWeeks * DEFAULT_COST_PER_WEEK_USD
    : 0

  const implementationCost = typeof implFromEV === 'number' && implFromEV > 0 ? implFromEV : implFromEffort

  return {
    revenueImpact: useCase.expectedValue?.revenueImpact ?? 0,
    costSavings: useCase.expectedValue?.costSavings ?? (totalAnnualValue > 0 ? totalAnnualValue : 0),
    riskMitigation: useCase.expectedValue?.riskMitigation ?? 0,
    implementationCost,
    notes: useCase.expectedValue?.notes ?? buildDerivedExpectedValueNotes(useCase),
  }
}

function computeROIResult(inputs: ROIInputs): ROIResult {
  const totalAnnualValue = (inputs.revenueImpact || 0) + (inputs.costSavings || 0) + (inputs.riskMitigation || 0)
  return {
    totalAnnualValue,
    paybackMonths: calculatePaybackPeriod(inputs.implementationCost || 0, totalAnnualValue),
    roi3YearPercent: calculateROI(inputs.implementationCost || 0, totalAnnualValue),
  }
}

function inferCOIValues(useCase: UseCase) {
  const c = useCase.costOfInaction
  return {
    directCosts: c?.directCosts ?? 0,
    opportunityCosts: c?.opportunityCosts ?? 0,
    riskCosts: c?.riskCosts ?? 0,
    notes: c?.notes ?? '',
  }
}

export function FinancialImpactTab({
  useCases,
  selectedId,
  onSelectUseCase,
  onUpdateUseCase,
}: {
  useCases: UseCase[]
  selectedId?: string
  onSelectUseCase: (id: string) => void
  onUpdateUseCase: (useCase: UseCase) => void
}) {
  const totals = useMemo(() => {
    const totalCOI = useCases.reduce((sum, uc) => sum + (uc.costOfInaction?.totalAnnualCOI || 0), 0)
    const totalValue = useCases.reduce((sum, uc) => sum + (uc.expectedValue?.totalAnnualValue || 0), 0)
    const withCOI = useCases.filter((u) => (u.costOfInaction?.totalAnnualCOI || 0) > 0).length
    const withEV = useCases.filter((u) => (u.expectedValue?.totalAnnualValue || 0) > 0).length
    const run = portfolioRunCost(useCases)
    return { totalCOI, totalValue, withCOI, withEV, run }
  }, [useCases])

  const selected = useMemo(
    () => useCases.find((u) => u.id === selectedId) || useCases[0] || null,
    [useCases, selectedId]
  )

  const selectedROIInputs = useMemo(() => (selected ? inferROIInputs(selected) : undefined), [selected])
  const selectedROIResult = useMemo(() => (selectedROIInputs ? computeROIResult(selectedROIInputs) : undefined), [selectedROIInputs])

  return (
    <div className="space-y-6">
      <Card className="border-2 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target size={20} weight="duotone" className="text-primary" />
            Financial Impact Overview
          </CardTitle>
          <CardDescription>
            COI and ROI are auto-derived where possible and remain fully editable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20">
              <Calculator size={16} className="text-red-500" />
              <span className="text-xs text-muted-foreground">Portfolio COI:</span>
              <span className="text-sm font-semibold text-red-600">{formatMoney(totals.totalCOI)}/yr</span>
              <Badge variant="outline" className="ml-1">{totals.withCOI}/{useCases.length}</Badge>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-green-500/10 border border-green-500/20">
              <TrendUp size={16} className="text-green-500" />
              <span className="text-xs text-muted-foreground">Portfolio Value:</span>
              <span className="text-sm font-semibold text-green-600">{formatMoney(totals.totalValue)}/yr</span>
              <Badge variant="outline" className="ml-1">{totals.withEV}/{useCases.length}</Badge>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <CurrencyDollar size={16} className="text-emerald-600" />
              <span className="text-xs text-muted-foreground">Run cost:</span>
              <span className="text-sm font-semibold text-emerald-700">{formatMoney(totals.run.totalAnnualUSD)}/yr</span>
              <Badge variant="outline" className="ml-1">{totals.run.withRunCost}/{useCases.length}</Badge>
            </div>
            {totals.run.totalImplementationUSD > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/20">
                <Calculator size={16} className="text-amber-600" />
                <span className="text-xs text-muted-foreground">One-time impl:</span>
                <span className="text-sm font-semibold text-amber-700">{formatMoney(totals.run.totalImplementationUSD)}</span>
              </div>
            )}
            {(totals.withCOI === 0 || totals.withEV === 0) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/20">
                <WarningCircle size={16} className="text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  Add COI/ROI for more complete executive reporting.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Use Cases</CardTitle>
            <CardDescription>Select a use case to view/edit COI + ROI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {useCases.map((uc) => {
              const coi = uc.costOfInaction?.totalAnnualCOI || 0
              const value = uc.expectedValue?.totalAnnualValue || 0
              const payback = uc.expectedValue?.paybackMonths
              const roi = uc.expectedValue?.threeYearROI
              const active = selected?.id === uc.id
              return (
                <button
                  key={uc.id}
                  onClick={() => onSelectUseCase(uc.id)}
                  className={
                    `w-full text-left p-3 rounded-md border transition-colors ${
                      active ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-muted/30'
                    }`
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{uc.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{uc.description}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-red-600">COI {coi ? formatMoney(coi) : '—'}</Badge>
                        <Badge variant="outline" className="text-green-600">Value {value ? formatMoney(value) : '—'}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {payback ? `Payback ${payback}mo` : 'Payback —'} • {roi ? `3Y ROI ${roi}%` : '3Y ROI —'}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selected ? (
            <>
              <Card className="border-2 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Discovery Evidence & Design Inputs</CardTitle>
                  <CardDescription>Summaries used in executive reporting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {selected.dataSources?.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                    {selected.referenceArchitecture && (
                      <Badge variant="outline">
                        Architecture: {REFERENCE_ARCHITECTURES[selected.referenceArchitecture as ReferenceArchitecturePattern]?.label || selected.referenceArchitecture}
                      </Badge>
                    )}
                  </div>

                  {selected.businessProcesses?.length ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Business processes</div>
                      <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                        {selected.businessProcesses.slice(0, 6).map((p) => (
                          <li key={p.processId}>
                            {p.processName}
                            {p.proposedImprovement ? ` — ${p.proposedImprovement}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {(selected.solutionPlays?.length || selected.microsoftSolutions?.length) ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Solution mapping</div>
                      {selected.solutionPlays?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selected.solutionPlays.slice(0, 10).map((s) => (
                            <Badge key={s} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                      ) : (
                        <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                          {selected.microsoftSolutions?.slice(0, 6).map((s, idx) => (
                            <li key={`${s.productFamily}-${idx}`}>{(s.services || []).slice(0, 6).join(', ')}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}

                  {(selected.earningsContext?.length || selected.industryContext?.length) ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Financial analysis highlights</div>
                      {selected.earningsContext?.length ? (
                        <>
                          <div className="text-xs text-muted-foreground">Earnings transcripts</div>
                          <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                            {selected.earningsContext.slice(0, 4).map((t, idx) => (
                              <li key={`earn-${idx}`}>{t}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                      {selected.industryContext?.length ? (
                        <>
                          <div className="text-xs text-muted-foreground">Reports / news / website</div>
                          <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                            {selected.industryContext.slice(0, 4).map((t, idx) => (
                              <li key={`ind-${idx}`}>{t}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {(selected.aiRegulations || selected.cybersecurity) ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Constraints & security</div>
                      <div className="text-sm text-muted-foreground">
                        {selected.aiRegulations?.applicableFrameworks?.length
                          ? `AI regs: ${selected.aiRegulations.applicableFrameworks.join(', ')}`
                          : 'AI regs: —'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selected.cybersecurity?.dataClassification
                          ? `Data classification: ${selected.cybersecurity.dataClassification}`
                          : 'Data classification: —'}
                      </div>
                      {selected.cybersecurity?.securityNotes ? (
                        <div className="text-sm text-muted-foreground">{selected.cybersecurity.securityNotes}</div>
                      ) : null}
                    </div>
                  ) : null}

                  <Separator />
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onSelectUseCase(selected.id)}>
                      Keep selected
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <UseCaseCostBreakdown useCase={selected} onUpdate={onUpdateUseCase} />

              <QuickCOICalculator
                variant="compact"
                customerName={undefined}
                opportunityTitle={selected.title}
                initialValues={inferCOIValues(selected)}
                onSave={(values) => {
                  const next: UseCaseCOI = {
                    directCosts: values.directCosts,
                    opportunityCosts: values.opportunityCosts,
                    riskCosts: values.riskCosts,
                    totalAnnualCOI: values.totalCOI,
                    notes: values.notes,
                    calculatedAt: Date.now(),
                  }
                  onUpdateUseCase({ ...selected, costOfInaction: next })
                }}
              />

              <QuickROICalculator
                currency="USD"
                initialValues={selectedROIInputs}
                onSave={(inputs: ROIInputs, result: ROIResult) => {
                  const next: UseCaseExpectedValue = {
                    revenueImpact: inputs.revenueImpact,
                    costSavings: inputs.costSavings,
                    riskMitigation: inputs.riskMitigation,
                    totalAnnualValue: result.totalAnnualValue,
                    implementationCost: inputs.implementationCost,
                    paybackMonths: Number.isFinite(result.paybackMonths) ? result.paybackMonths : undefined,
                    threeYearROI: Number.isFinite(result.roi3YearPercent) ? result.roi3YearPercent : undefined,
                    notes: inputs.notes,
                  }
                  onUpdateUseCase({ ...selected, expectedValue: next })
                }}
              />

              {selectedROIInputs && selectedROIResult ? (
                <Card className="border bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Derived calculation (preview)</CardTitle>
                    <CardDescription>These values are what will appear in executive exports.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <InlineDisclaimer
                      icon="info"
                      text="Values below are auto-derived from COI, effort estimates, and industry multipliers. Review and adjust before saving."
                      className="mb-3"
                    />
                    <div className="flex justify-between"><span>Total annual value</span><span className="text-foreground">{formatMoney(selectedROIResult.totalAnnualValue)}/yr</span></div>
                    <div className="flex justify-between"><span>Implementation cost</span><span className="text-foreground">{formatMoney(selectedROIInputs.implementationCost)}</span></div>
                    <div className="flex justify-between"><span>Payback (months)</span><span className="text-foreground">{Number.isFinite(selectedROIResult.paybackMonths) ? Math.round(selectedROIResult.paybackMonths) : '—'}</span></div>
                    <div className="flex justify-between"><span>3-year ROI</span><span className="text-foreground">{Number.isFinite(selectedROIResult.roi3YearPercent) ? `${selectedROIResult.roi3YearPercent.toFixed(0)}%` : '—'}</span></div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : (
            <Card className="border-2 bg-card">
              <CardHeader>
                <CardTitle className="text-base">No use cases</CardTitle>
                <CardDescription>Add a use case to quantify financial impact.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default FinancialImpactTab
