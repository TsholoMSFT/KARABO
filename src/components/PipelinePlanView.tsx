/**
 * PipelinePlanView — the headline portfolio artifact. Renders the seeded 32
 * accounts in a streamlined, entity-aware table with expandable detail. Company
 * rows are driven by earnings pressure themes; public-sector rows by AGSA audit
 * themes. The full attachment column set is available on row expansion and in
 * the Excel/PPT export.
 */
import { Fragment, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  CaretDown, CaretRight, ArrowsClockwise, Buildings, Bank, CircleNotch,
} from '@phosphor-icons/react'
import type { PressureTheme, AuditTheme } from '@/lib/types'
import {
  SOLUTION_AREA_LABELS, SOLUTION_AREA_COLORS,
  PRESSURE_THEME_CATEGORY_LABELS, AUDIT_THEME_CATEGORY_LABELS,
} from '@/lib/types'
import { PORTFOLIO_SEED, type PortfolioSeedEntity } from '@/lib/portfolio-seed'
import { BRIEFING_TRACKS, getBriefingTrackLabel } from '@/lib/briefing-tracks'
import {
  summarisePipelineRow,
  type EntityIntel, type PipelineRow,
} from '@/lib/pipeline-plan'

// Re-export the data model for consumers importing it from this view.
export { summarisePipelineRow }
export type { EntityIntel, PipelineRow }

interface PipelinePlanViewProps {
  entities?: PortfolioSeedEntity[]
  intel?: Record<string, EntityIntel>
  onGenerate?: (entity: PortfolioSeedEntity) => void
  generatingIds?: Set<string>
}

export function PipelinePlanView({
  entities = PORTFOLIO_SEED,
  intel = {},
  onGenerate,
  generatingIds,
}: PipelinePlanViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const rows = useMemo(
    () => entities.map((e) => summarisePipelineRow(e, intel[e.id])),
    [entities, intel],
  )

  const stats = useMemo(() => {
    const companies = rows.filter((r) => !r.isGov).length
    const gov = rows.filter((r) => r.isGov).length
    const generated = rows.filter((r) => r.generated).length
    return { total: rows.length, companies, gov, generated }
  }, [rows])

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Buildings size={20} /> Pipeline Plan
          <span className="ml-2 flex flex-wrap gap-1.5 text-xs font-normal">
            <Badge variant="secondary">{stats.total} accounts</Badge>
            <Badge variant="outline">{stats.companies} companies</Badge>
            <Badge variant="outline">{stats.gov} public sector</Badge>
            <Badge variant="outline">{stats.generated} with themes</Badge>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Account</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Risk Signal</TableHead>
                <TableHead>Primary Themes</TableHead>
                <TableHead>Lead Solution Area</TableHead>
                <TableHead>Briefing Track</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isOpen = expanded.has(row.entity.id)
                const busy = generatingIds?.has(row.entity.id)
                const track = row.primaryTrack
                return (
                  <Fragment key={row.entity.id}>
                    <TableRow className="align-top">
                      <TableCell className="cursor-pointer" onClick={() => toggle(row.entity.id)}>
                        {isOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          {row.isGov ? <Bank size={14} className="text-muted-foreground" /> : <Buildings size={14} className="text-muted-foreground" />}
                          {row.entity.name}
                        </div>
                        {row.ticker && <span className="text-[10px] text-muted-foreground">{row.ticker}</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.tier}
                        {row.isGov && row.entity.auditFramework && (
                          <Badge variant="outline" className="ml-1 text-[9px]">{row.entity.auditFramework}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] text-xs text-muted-foreground">{row.riskSignal}</TableCell>
                      <TableCell className="max-w-[220px]">
                        {row.topThemes.length ? (
                          <div className="flex flex-col gap-0.5">
                            {row.topThemes.map((t, i) => (
                              <span key={i} className="text-xs">• {t}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not generated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.leadSolutionArea && (
                          <Badge variant="outline" className="text-[10px]" style={{ borderColor: SOLUTION_AREA_COLORS[row.leadSolutionArea], color: SOLUTION_AREA_COLORS[row.leadSolutionArea] }}>
                            {SOLUTION_AREA_LABELS[row.leadSolutionArea]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {track ? `${track} – ${getBriefingTrackLabel(track, row.entity.entityType)}` : '—'}
                      </TableCell>
                      <TableCell className="max-w-[180px] text-xs">{row.nextStep}</TableCell>
                      <TableCell className="text-right">
                        {onGenerate && (
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={busy} onClick={() => onGenerate(row.entity)}>
                            {busy ? <CircleNotch size={12} className="animate-spin" /> : <ArrowsClockwise size={12} />}
                            {row.generated ? 'Refresh' : 'Generate'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow key={`${row.entity.id}-detail`} className="bg-muted/30">
                        <TableCell />
                        <TableCell colSpan={8}>
                          <PipelineRowDetail row={row} intel={intel[row.entity.id]} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function PipelineRowDetail({ row, intel }: { row: PipelineRow; intel?: EntityIntel }) {
  const themes: Array<PressureTheme | AuditTheme> = row.isGov
    ? intel?.auditThemes ?? []
    : intel?.pressureThemes ?? []
  return (
    <div className="grid gap-3 py-2 md:grid-cols-2">
      <div className="space-y-1 text-xs">
        <DetailLine label="Audit Framework" value={row.entity.auditFramework} />
        <DetailLine label="Reporting Milestone" value={row.reportingMilestone} />
        <DetailLine label="Pipeline Cover %" value={intel?.pipelineCoverPct != null ? `${intel.pipelineCoverPct}%` : undefined} />
        <DetailLine label="Partner" value={intel?.partner} />
        <DetailLine label="Account Exec / ATS" value={intel?.accountExec} />
        <DetailLine label="Stakeholder" value={intel?.stakeholder} />
        <DetailLine label="Priority" value={intel?.priority} />
        <DetailLine label="Engagement Date" value={intel?.engagementDate} />
      </div>
      <div className="space-y-2 text-xs">
        <div className="font-medium">
          {row.isGov ? 'Audit-Failure Themes' : 'Pressure Themes'} ({themes.length})
        </div>
        {themes.length === 0 && <p className="italic text-muted-foreground">No themes yet — generate from earnings/AGSA sources or paste a transcript/report.</p>}
        {themes.map((t) => (
          <div key={t.id} className="rounded border bg-background p-2">
            <div className="font-medium">{t.title}</div>
            <div className="text-[10px] text-muted-foreground">
              {row.isGov
                ? AUDIT_THEME_CATEGORY_LABELS[(t as AuditTheme).category]
                : PRESSURE_THEME_CATEGORY_LABELS[(t as PressureTheme).category]}
              {t.briefingTrack && ` · Track ${t.briefingTrack} (${BRIEFING_TRACKS[t.briefingTrack].label})`}
            </div>
            {t.evidence && <p className="mt-1 italic text-muted-foreground">“{t.evidence}”</p>}
          </div>
        ))}
        {intel?.commitments?.length ? (
          <div className="pt-1">
            <div className="font-medium">{row.isGov ? 'Remedial Directives' : 'Management Commitments'} ({intel.commitments.length})</div>
            {intel.commitments.map((c) => (
              <div key={c.id} className="mt-1 text-[11px]">• {c.statement}{c.timeframe ? ` (${c.timeframe})` : ''}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? '—'}</span>
    </div>
  )
}
