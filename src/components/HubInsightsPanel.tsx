import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChartBar, UploadSimple, Warning } from '@phosphor-icons/react'
import type { Account, UseCase } from '@/lib/types'
import { loadAccounts } from '@/lib/account-engine'
import { useDiscovery } from '@/hooks/use-discovery'
import { useEngagements } from '@/hooks/use-engagements'
import { useLocalStorage } from '@/hooks/use-local-storage'
import {
  createEngagementProvider, importCEHubEngagements,
  type PortfolioRollup, type ImportedEngagementRow,
} from '@/lib/engagement/provider'

interface HubInsightsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const provider = createEngagementProvider()

function fmtUSD(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${Math.round(v).toLocaleString()}`
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3 bg-card">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function HubInsightsPanel({ open, onOpenChange }: HubInsightsPanelProps) {
  const { sessions } = useDiscovery()
  const { engagements } = useEngagements()
  const [useCases] = useLocalStorage<UseCase[]>('use-cases', [])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [imported, setImported] = useState<ImportedEngagementRow[]>([])
  const [rollup, setRollup] = useState<PortfolioRollup | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) setAccounts(loadAccounts()) }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    provider
      .getPortfolioRollup({ accounts, sessions, useCases: useCases ?? [], engagements, imported })
      .then((r) => { if (!cancelled) setRollup(r) })
    return () => { cancelled = true }
  }, [open, accounts, sessions, useCases, engagements, imported])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const rows = importCEHubEngagements(await file.text())
      setImported(rows)
      toast.success(`Imported ${rows.length} row${rows.length === 1 ? '' : 's'} from ${file.name}`)
    } catch {
      toast.error('Could not parse that CSV file')
    }
  }

  const statusEntries = useMemo(() => Object.entries(rollup?.engagementsByStatus ?? {}), [rollup])
  const typeEntries = useMemo(() => Object.entries(rollup?.engagementsByType ?? {}), [rollup])
  const healthEntries = useMemo(() => Object.entries(rollup?.accountsByHealth ?? {}), [rollup])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartBar size={20} weight="duotone" /> Hub Insights
          </DialogTitle>
          <DialogDescription>
            A portfolio rollup computed from your accounts, sessions, use cases, and engagements. Optionally enrich it with a CEHub / Dataverse CSV export.
          </DialogDescription>
        </DialogHeader>

        {rollup && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Stat label="Engagements" value={rollup.totalEngagements} />
              <Stat label="Accounts" value={rollup.accountCount} />
              <Stat label="Sessions" value={rollup.sessionCount} />
              <Stat label="Use cases" value={rollup.useCaseCount} />
              <Stat label="Pipeline (risk-adj/yr)" value={fmtUSD(rollup.pipelineAnnualValueUSD)} />
            </div>

            {/* MACC burn-down */}
            {rollup.maccTotalUSD > 0 && (
              <div className="rounded-lg border p-4 bg-card space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">MACC consumption</span>
                  <span className="text-muted-foreground">{rollup.maccConsumedPct}% consumed</span>
                </div>
                <Progress value={Math.min(100, rollup.maccConsumedPct)} className="h-2" />
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>Total: <span className="text-foreground font-medium">{fmtUSD(rollup.maccTotalUSD)}</span></span>
                  <span>Remaining: <span className="text-foreground font-medium">{fmtUSD(rollup.maccRemainingUSD)}</span></span>
                  <span>ACR: <span className="text-foreground font-medium">{fmtUSD(rollup.currentACRMonthlyUSD)}/mo</span></span>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Engagements by status</div>
                {statusEntries.length ? statusEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm"><span className="capitalize">{k}</span><Badge variant="outline">{v}</Badge></div>
                )) : <p className="text-xs text-muted-foreground">No engagements yet.</p>}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Engagements by type</div>
                {typeEntries.length ? typeEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm"><span className="capitalize">{k.replace(/-/g, ' ')}</span><Badge variant="outline">{v}</Badge></div>
                )) : <p className="text-xs text-muted-foreground">—</p>}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Accounts by health</div>
                {healthEntries.length ? healthEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm"><span className="capitalize">{k.replace(/-/g, ' ')}</span><Badge variant="outline">{v}</Badge></div>
                )) : <p className="text-xs text-muted-foreground">No accounts yet.</p>}
              </div>
            </div>

            {rollup.atRiskAccounts.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700"><Warning size={16} /> At-risk accounts</div>
                {rollup.atRiskAccounts.map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-sm">
                    <span>{a.name}</span>
                    <span className="text-muted-foreground capitalize">{a.healthRating}{a.remainingUSD ? ` · ${fmtUSD(a.remainingUSD)} left` : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CSV import */}
            <div className="rounded-lg border p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">CEHub / Dataverse CSV</div>
                <div className="text-xs text-muted-foreground">
                  {rollup.importedEngagementCount > 0
                    ? `${rollup.importedEngagementCount} imported rows enriching this view`
                    : 'Export a CEHub view to CSV and import it to enrich the rollup — no backend needed.'}
                </div>
              </div>
              <div className="flex gap-2">
                {imported.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setImported([])}>Clear</Button>
                )}
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                  <UploadSimple size={16} /> Import CSV
                </Button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="Import CEHub CSV file" title="Import CEHub CSV file"
                  onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = '' }} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
