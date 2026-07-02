/**
 * Page 5 — Financial Statement Impact Map (Section 3).
 *
 * Maps each value hypothesis to income-statement / balance-sheet / cash-flow
 * lines. Every line is framed as a hypothesis to validate unless the customer
 * has validated it — telemetry shows usage, not realised financial movement.
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartLineUp, Warning, Info } from '@phosphor-icons/react'
import { HYPOTHESIS_DISCLAIMER } from '@/lib/csam/guardrails'
import {
  FINANCIAL_DIRECTION_LABELS,
  STATEMENT_TYPE_LABELS,
  type CsamCustomerProfile,
  type FinancialStatementLine,
  type StatementType,
} from '@/lib/csam/types'
import { ConfidenceBadge, EmptyState, formatUSD, PageHeader, ValidationBadge } from '../shared'

const STATEMENT_ORDER: StatementType[] = ['income', 'balance-sheet', 'cash-flow']

export function FinancialImpactPage({ profile }: { profile: CsamCustomerProfile }) {
  const grouped = useMemo(() => {
    const map: Record<StatementType, FinancialStatementLine[]> = {
      'income': [],
      'balance-sheet': [],
      'cash-flow': [],
    }
    for (const f of profile.financialImpacts) map[f.statementType].push(f)
    return map
  }, [profile.financialImpacts])

  if (!profile.financialImpacts.length) {
    return <EmptyState>No financial impact hypotheses mapped for {profile.name} yet. Use the Value Hypothesis Builder to create them.</EmptyState>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Statement Impact Map"
        description="How each investment could move the customer's income statement, balance sheet and cash flow."
        icon={<ChartLineUp size={24} />}
      />

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
        <Warning size={18} className="mt-0.5 shrink-0" />
        <span>{HYPOTHESIS_DISCLAIMER}</span>
      </div>

      {STATEMENT_ORDER.map((type) =>
        grouped[type].length ? (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{STATEMENT_TYPE_LABELS[type]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grouped[type].map((line) => (
                <FinancialLineRow key={line.id} line={line} />
              ))}
            </CardContent>
          </Card>
        ) : null,
      )}
    </div>
  )
}

function FinancialLineRow({ line }: { line: FinancialStatementLine }) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-medium">{line.lineItem}</p>
          <p className="text-sm text-muted-foreground">{line.mechanism}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{FINANCIAL_DIRECTION_LABELS[line.expectedDirection]}</Badge>
          <ValidationBadge status={line.validationStatus} />
          <ConfidenceBadge confidence={line.confidence} />
        </div>
      </div>

      {(line.baseline != null || line.current != null || line.target != null) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          {line.baseline != null && <Num label="Baseline" value={formatUSD(line.baseline)} />}
          {line.current != null && <Num label="Current" value={formatUSD(line.current)} />}
          {line.target != null && <Num label="Target" value={formatUSD(line.target)} />}
        </div>
      )}

      {line.metric && <p className="text-xs"><span className="text-muted-foreground">Suggested metric: </span>{line.metric}</p>}

      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {line.evidenceAvailable && <p><span className="text-emerald-700">Evidence available: </span>{line.evidenceAvailable}</p>}
        {line.evidenceMissing && <p><span className="text-amber-700">Evidence missing: </span>{line.evidenceMissing}</p>}
        {line.dataOwner && <p><span className="text-muted-foreground">Data owner: </span>{line.dataOwner}</p>}
      </div>

      {line.validationQuestion && (
        <div className="flex items-start gap-2 text-xs rounded bg-muted/60 p-2">
          <Info size={14} className="mt-0.5 shrink-0 text-sky-600" />
          <span><span className="text-muted-foreground">Validate with customer: </span>{line.validationQuestion}</span>
        </div>
      )}
    </div>
  )
}

function Num({ label, value }: { label: string; value: string }) {
  return (
    <span className="tabular-nums">
      <span className="text-muted-foreground">{label}: </span>
      {value}
    </span>
  )
}
