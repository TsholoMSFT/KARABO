/**
 * Consumption planning tab (Focus 6) — MACC burn-down, forecast, renewal and
 * over-/under-consumption alerts derived from trailing ACR history.
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Warning, Info, CurrencyDollar } from '@phosphor-icons/react'
import { buildConsumptionPlan } from '@/lib/consumption-planning-engine'
import type { MACCCommitment } from '@/lib/types'
import type { ConsumptionDataPoint, ConsumptionAlertSeverity } from '@/lib/fy27-types'

const ALERT_STYLE: Record<ConsumptionAlertSeverity, string> = {
  info: 'bg-slate-50 text-slate-700 border-slate-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-red-50 text-red-800 border-red-200',
}

function serializeHistory(points: ConsumptionDataPoint[]): string {
  return points.map((p) => `${p.period},${p.acr}`).join('\n')
}

function parseHistory(text: string): ConsumptionDataPoint[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [period, acr] = line.split(',')
      return { period: (period || '').trim(), acr: Number((acr || '').trim()) }
    })
    .filter((p) => p.period && Number.isFinite(p.acr))
}

export interface ConsumptionPlanTabProps {
  accountId: string
  maccCommitment?: MACCCommitment
  history: ConsumptionDataPoint[]
  onSetHistory: (accountId: string, points: ConsumptionDataPoint[]) => void
}

export function ConsumptionPlanTab({ accountId, maccCommitment, history, onSetHistory }: ConsumptionPlanTabProps) {
  const [draft, setDraft] = useState(serializeHistory(history))

  const plan = buildConsumptionPlan(accountId, history, maccCommitment)

  const handleUpdate = () => onSetHistory(accountId, parseHistory(draft))

  return (
    <div className="space-y-5">
      {maccCommitment && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="MACC total" value={`$${Math.round(maccCommitment.totalAmount).toLocaleString()}`} />
          <Stat label="Remaining" value={`$${Math.round(maccCommitment.remainingBalance).toLocaleString()}`} />
          <Stat label="Current ACR/mo" value={`$${Math.round(plan.currentMonthlyACR).toLocaleString()}`} />
          <Stat label="Burn/mo" value={`$${Math.round(plan.burnRatePerMonth).toLocaleString()}`} />
        </div>
      )}

      {plan.alerts.length > 0 && (
        <div className="space-y-2">
          {plan.alerts.map((a) => (
            <div key={a.id} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${ALERT_STYLE[a.severity]}`}>
              {a.severity === 'info' ? <Info className="mt-0.5 shrink-0" /> : <Warning className="mt-0.5 shrink-0" />}
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Trailing ACR history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label className="text-xs text-muted-foreground">One line per month: <code>period,acr</code> (e.g. <code>FY26-M03,42000</code>)</Label>
            <Textarea rows={7} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={'FY26-M01,38000\nFY26-M02,40000\nFY26-M03,42000'} className="font-mono text-xs" />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleUpdate}><CurrencyDollar className="mr-1.5" /> Update history</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Forecast &amp; renewal</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Projected exhaustion" value={plan.projectedExhaustionDate ? new Date(plan.projectedExhaustionDate).toLocaleDateString() : '—'} />
            <Row label="Renewal / commitment end" value={plan.renewalDate ? new Date(plan.renewalDate).toLocaleDateString() : '—'} />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Projected next {plan.forecast.length} months (at current burn)</div>
              <div className="flex flex-wrap gap-1.5">
                {plan.forecast.map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {f.period}: ${Math.round(f.acr).toLocaleString()}
                  </Badge>
                ))}
                {plan.forecast.length === 0 && <span className="text-xs text-muted-foreground italic">Add history to forecast.</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="py-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </CardContent></Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
