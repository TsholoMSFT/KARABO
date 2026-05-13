/**
 * CostOptimizationPanel
 * ----------------------------------------------------------------------------
 * On-demand AI-powered FinOps panel. Sends the portfolio's run-cost data to
 * gpt-4o-mini and renders a ranked list of actionable savings opportunities.
 *
 * Drop-in into FinancialImpactTab (or anywhere a UseCase[] is available).
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sparkle, TrendDown, Lightning, Warning, ArrowsClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { UseCase } from '@/lib/types'
import {
  analyzeCostOptimizations,
  type CostOptimization,
  type CostOptimizationReport,
} from '@/lib/cost-optimization-service'

interface Props {
  useCases: UseCase[]
}

const CATEGORY_LABEL: Record<CostOptimization['category'], string> = {
  'sku-swap': 'SKU swap',
  'rightsize': 'Rightsize',
  'reservation': 'Reservation',
  'serverless-shift': 'Serverless shift',
  'caching': 'Caching',
  'storage-tier': 'Storage tier',
  'consolidation': 'Consolidation',
  'other': 'Other',
}

const fmtUSD = (n?: number) => {
  if (n == null) return '—'
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

const confidenceColor = (c: CostOptimization['confidence']) =>
  c === 'high' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40'
  : c === 'medium' ? 'bg-amber-500/10 text-amber-700 border-amber-500/40'
  : 'bg-rose-500/10 text-rose-700 border-rose-500/40'

const effortColor = (e: CostOptimization['effort']) =>
  e === 'low' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40'
  : e === 'medium' ? 'bg-amber-500/10 text-amber-700 border-amber-500/40'
  : 'bg-rose-500/10 text-rose-700 border-rose-500/40'

export function CostOptimizationPanel({ useCases }: Props) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<CostOptimizationReport | null>(null)

  const eligible = useCases.filter((u) => u.runCost?.totalMonthlyUSD)

  const run = async () => {
    setLoading(true)
    try {
      const r = await analyzeCostOptimizations(useCases)
      setReport(r)
      if (r.recommendations.length === 0) {
        toast.info('No optimisations found')
      } else {
        toast.success(`${r.recommendations.length} recommendations · est. ${fmtUSD(r.totalAnnualSavingUSD)}/yr saving`)
      }
    } catch (err: any) {
      toast.error(`Cost analysis failed: ${err?.message || String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkle size={18} weight="duotone" className="text-emerald-600" />
              Cost-optimisation AI
            </CardTitle>
            <CardDescription>
              Reviews this portfolio's run-cost estimates and recommends SKU swaps, rightsizing,
              reservations and architectural shifts. Powered by GPT-4o-mini.
            </CardDescription>
          </div>
          <Button size="sm" onClick={run} disabled={loading || eligible.length === 0} className="gap-1">
            {loading ? <ArrowsClockwise size={14} className="animate-spin" /> : <Lightning size={14} />}
            {loading ? 'Analysing…' : report ? 'Re-analyse' : 'Analyse'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {eligible.length === 0 && (
          <div className="text-[12px] text-muted-foreground border border-dashed rounded p-3 flex items-start gap-2">
            <Warning size={14} className="text-amber-500 mt-0.5" />
            <span>
              Estimate run cost on at least one use case (Cost &amp; Effort panel) to enable
              the optimisation analyser.
            </span>
          </div>
        )}

        {report && (
          <>
            <div className="flex items-center justify-between rounded bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
              <div className="flex items-center gap-2 text-[13px]">
                <TrendDown size={16} className="text-emerald-600" />
                <span className="font-semibold text-emerald-700">
                  Total estimated saving: {fmtUSD(report.totalAnnualSavingUSD)}/yr
                </span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {report.recommendations.length} recommendation{report.recommendations.length === 1 ? '' : 's'}
              </Badge>
            </div>

            {report.summary && (
              <p className="text-[12px] text-muted-foreground italic">{report.summary}</p>
            )}

            <Separator />

            <ScrollArea className="max-h-[480px] pr-2">
              <div className="space-y-2">
                {report.recommendations.map((r) => (
                  <div key={r.id} className="rounded border bg-card p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-[13px]">{r.title}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {CATEGORY_LABEL[r.category]}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${effortColor(r.effort)}`}>
                            Effort: {r.effort}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${confidenceColor(r.confidence)}`}>
                            Confidence: {r.confidence}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-700 font-bold text-[14px]">
                          {fmtUSD(r.annualSavingUSD)}/yr
                        </div>
                        {r.monthlySavingUSD ? (
                          <div className="text-[10px] text-muted-foreground">
                            {fmtUSD(r.monthlySavingUSD)}/mo
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-[12px] text-foreground/80">{r.rationale}</p>
                    {r.affectedUseCases && r.affectedUseCases.length > 0 && (
                      <div className="text-[11px] text-muted-foreground">
                        Applies to: {r.affectedUseCases
                          .map((id) => useCases.find((u) => u.id === id)?.title || id)
                          .slice(0, 4).join(', ')}
                        {r.affectedUseCases.length > 4 ? ` + ${r.affectedUseCases.length - 4} more` : ''}
                      </div>
                    )}
                    {r.riskNotes && (
                      <div className="text-[11px] text-amber-700 flex items-start gap-1">
                        <Warning size={11} className="mt-0.5" />
                        <span>{r.riskNotes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-[10px] text-muted-foreground text-right">
              Generated {new Date(report.generatedAt).toLocaleString()} · review with FinOps before committing
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
