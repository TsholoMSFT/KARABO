/**
 * IQConnectionsPanel
 * ----------------------------------------------------------------------------
 * Intern-friendly "Connect data" step inside the Solution Blueprint workspace.
 *
 * Shows four cards — Microsoft Graph, Foundry IQ, Fabric IQ, Work IQ — each with:
 *   1. "What this brings" plain-English explainer
 *   2. Live availability badge (probed against the backend)
 *   3. One-click "Pull insights" action
 *   4. Returned hits + an "Apply to blueprint" action that pushes hints
 *      back into the technology estate (capabilities + estate items).
 *
 * If a connector is not configured, the card collapses to a clear instructions
 * panel with the required env vars and a docs link, so the workflow keeps
 * moving on dev machines without tenant access.
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Brain,
  ChartBar,
  Database,
  Graph,
  Lightning,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  ArrowSquareOut,
  CheckCircle,
  Warning,
  Info,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  graphSearch,
  foundryKnowledge,
  fabricWorkspaces,
  workRetrieval,
  type IQQueryResponse,
  type IQHit,
} from '@/lib/iq-service'

// ── Types passed from parent ───────────────────────────────────────────────
export interface IQInsightHint {
  source: 'graph' | 'foundry' | 'fabric' | 'work'
  kind: 'estate-item' | 'capability' | 'context-note'
  /** What the user sees attached to a card. */
  label: string
  /** Optional long-form context that downstream prompts can pick up. */
  detail?: string
  /** Used by parent to dedupe & track provenance. */
  id: string
}

interface Props {
  customerName?: string
  /** Free-text query the user can refine — defaults to customer name. */
  initialQuery?: string
  /** Called when the user clicks "Apply to blueprint" on a result group. */
  onApplyHints: (hints: IQInsightHint[]) => void
}

interface ConnectorState {
  loading: boolean
  response: IQQueryResponse | null
  error: string | null
}

const EMPTY_STATE: ConnectorState = { loading: false, response: null, error: null }

interface ConnectorMeta {
  id: 'graph' | 'foundry' | 'fabric' | 'work'
  title: string
  oneLiner: string
  whatItBrings: string[]
  icon: React.ReactNode
  accent: string
  docsUrl: string
}

const CONNECTORS: ConnectorMeta[] = [
  {
    id: 'graph',
    title: 'Microsoft Graph',
    oneLiner: 'People, files, mail, Teams chats — the customer\'s collaboration fabric.',
    whatItBrings: [
      'Identifies key stakeholders & org structure',
      'Surfaces existing docs that reference your topic',
      'Anchors language and acronyms used internally',
    ],
    icon: <Graph size={20} weight="duotone" />,
    accent: 'from-sky-500/10 to-blue-500/10 border-sky-200',
    docsUrl: 'https://learn.microsoft.com/graph/overview',
  },
  {
    id: 'foundry',
    title: 'Foundry IQ',
    oneLiner: 'The customer\'s curated AI knowledge index inside Microsoft Foundry.',
    whatItBrings: [
      'Grounds blueprint with the customer\'s own knowledge sources',
      'Reuses agents/models the customer has already deployed',
      'Cuts duplicate spend on RAG infrastructure',
    ],
    icon: <Brain size={20} weight="duotone" />,
    accent: 'from-violet-500/10 to-fuchsia-500/10 border-violet-200',
    docsUrl: 'https://learn.microsoft.com/azure/ai-foundry/',
  },
  {
    id: 'fabric',
    title: 'Fabric IQ',
    oneLiner: 'OneLake, semantic models & lakehouses — the customer\'s analytics core.',
    whatItBrings: [
      'Reveals existing semantic models we can ground RAG against',
      'Maps which workspaces hold customer master data',
      'Flags reuse opportunities vs. building a new lakehouse',
    ],
    icon: <ChartBar size={20} weight="duotone" />,
    accent: 'from-emerald-500/10 to-teal-500/10 border-emerald-200',
    docsUrl: 'https://learn.microsoft.com/fabric/',
  },
  {
    id: 'work',
    title: 'Work IQ',
    oneLiner: 'Graph Connectors + Copilot retrieval over external systems (CRM, ERP, wikis).',
    whatItBrings: [
      'Pulls grounded snippets from connected line-of-business systems',
      'Tells you what 3rd-party content Copilot already sees',
      'Suggests connectors to add for richer answers',
    ],
    icon: <Lightning size={20} weight="duotone" />,
    accent: 'from-amber-500/10 to-orange-500/10 border-amber-200',
    docsUrl: 'https://learn.microsoft.com/graph/connecting-external-content-connectors-overview',
  },
]

const STATUS_LABEL: Record<'unknown' | 'configured' | 'unconfigured' | 'error', { label: string; cls: string; icon: React.ReactNode }> = {
  unknown: { label: 'Checking…', cls: 'bg-muted text-muted-foreground', icon: <Info size={12} /> },
  configured: { label: 'Connected', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={12} weight="fill" /> },
  unconfigured: { label: 'Demo mode', cls: 'bg-amber-100 text-amber-700 border border-amber-200', icon: <Warning size={12} /> },
  error: { label: 'Unreachable', cls: 'bg-rose-100 text-rose-700 border border-rose-200', icon: <Warning size={12} /> },
}

export function IQConnectionsPanel({ customerName, initialQuery, onApplyHints }: Props) {
  const [query, setQuery] = useState(initialQuery || customerName || '')
  const [states, setStates] = useState<Record<string, ConnectorState>>({
    graph: EMPTY_STATE,
    foundry: EMPTY_STATE,
    fabric: EMPTY_STATE,
    work: EMPTY_STATE,
  })

  // Keep query in sync if parent flips customer
  useEffect(() => {
    setQuery((q) => q || initialQuery || customerName || '')
  }, [customerName, initialQuery])

  const runQuery = async (id: ConnectorMeta['id']) => {
    setStates((s) => ({ ...s, [id]: { loading: true, response: null, error: null } }))
    try {
      let response: IQQueryResponse
      const q = query.trim() || customerName || ''
      switch (id) {
        case 'graph':
          response = await graphSearch(q || '*', { mode: 'search', top: 8 })
          break
        case 'foundry':
          response = await foundryKnowledge(q, { top: 6 })
          break
        case 'fabric':
          response = await fabricWorkspaces()
          break
        case 'work':
          response = await workRetrieval(q, { top: 8 })
          break
      }
      setStates((s) => ({ ...s, [id]: { loading: false, response, error: null } }))
      if (response.configured) {
        const n = response.results?.length ?? 0
        toast.success(`${id.toUpperCase()}: ${n} insight${n === 1 ? '' : 's'} returned`)
      } else {
        toast.message(`${id.toUpperCase()} is not configured on this environment`, {
          description: response.message || 'See card for required env vars.',
        })
      }
    } catch (err: any) {
      setStates((s) => ({ ...s, [id]: { loading: false, response: null, error: err?.message || String(err) } }))
      toast.error(`Failed to query ${id}`)
    }
  }

  const applyHints = (id: ConnectorMeta['id'], hits: IQHit[]) => {
    if (!hits.length) return
    const hints: IQInsightHint[] = hits.slice(0, 5).map((h, i) => ({
      source: id,
      kind: id === 'fabric' ? 'estate-item' : id === 'foundry' ? 'capability' : 'context-note',
      id: `${id}:${h.id || i}`,
      label: h.title || h.snippet || `Insight ${i + 1}`,
      detail: h.snippet || h.url,
    }))
    onApplyHints(hints)
    toast.success(`Applied ${hints.length} hint${hints.length === 1 ? '' : 's'} to the blueprint`)
  }

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkle size={18} weight="duotone" /> Connect data sources
          </CardTitle>
          <CardDescription>
            <span className="font-medium">Step 1 of the blueprint:</span> pull live signals from the customer's
            collaboration, knowledge, analytics and external systems. Results refine the technology estate and ground the
            blueprint in <em>their</em> data, not generic templates. Skip any source that's not available — the engine
            still works.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium">Search topic</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={customerName ? `e.g. "${customerName} risk reporting"` : 'e.g. "claims automation"'}
              />
            </div>
            <Button
              variant="default"
              onClick={() => CONNECTORS.forEach((c) => runQuery(c.id))}
              className="gap-2"
            >
              <MagnifyingGlass size={14} /> Pull all
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck size={12} /> Reads only. Nothing the customer sees is written back to their tenant.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {CONNECTORS.map((c) => (
          <ConnectorCard
            key={c.id}
            meta={c}
            state={states[c.id]}
            onRun={() => runQuery(c.id)}
            onApply={(hits) => applyHints(c.id, hits)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Per-connector card ────────────────────────────────────────────────────
function ConnectorCard({
  meta,
  state,
  onRun,
  onApply,
}: {
  meta: ConnectorMeta
  state: ConnectorState
  onRun: () => void
  onApply: (hits: IQHit[]) => void
}) {
  const status = useMemo<keyof typeof STATUS_LABEL>(() => {
    if (state.loading) return 'unknown'
    if (state.error) return 'error'
    if (!state.response) return 'unknown'
    return state.response.configured ? 'configured' : 'unconfigured'
  }, [state])

  const s = STATUS_LABEL[status]
  const hits = state.response?.results || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border bg-gradient-to-br ${meta.accent} p-0`}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="rounded-md bg-background/60 p-1.5">{meta.icon}</span>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {meta.title}
                  <Badge className={`gap-1 text-[10px] font-normal ${s.cls}`} variant="outline">
                    {s.icon} {s.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-[12px] mt-0.5">{meta.oneLiner}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-[11px] space-y-0.5 text-muted-foreground">
            {meta.whatItBrings.map((b) => (
              <li key={b} className="flex gap-1.5">
                <span className="text-emerald-500">✓</span> <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onRun} disabled={state.loading} className="gap-1.5">
              {state.loading ? (
                <>
                  <span className="size-3 rounded-full border border-current border-t-transparent animate-spin" />
                  Querying…
                </>
              ) : (
                <>
                  <MagnifyingGlass size={12} /> Pull insights
                </>
              )}
            </Button>
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground hover:underline inline-flex items-center gap-0.5"
            >
              Docs <ArrowSquareOut size={10} />
            </a>
          </div>

          {state.error && (
            <Alert variant="destructive" className="py-2">
              <AlertTitle className="text-xs">Connector error</AlertTitle>
              <AlertDescription className="text-[11px]">{state.error}</AlertDescription>
            </Alert>
          )}

          {state.response && !state.response.configured && (
            <Alert className="py-2">
              <AlertTitle className="text-xs flex items-center gap-1">
                <Database size={12} /> {state.response.message || 'Not configured'}
              </AlertTitle>
              <AlertDescription className="text-[11px] space-y-1">
                {state.response.requiredEnv && (
                  <div>
                    Set on the Function App:{' '}
                    {state.response.requiredEnv.map((e) => (
                      <code key={e} className="mr-1 rounded bg-muted px-1 py-0.5 text-[10px]">{e}</code>
                    ))}
                  </div>
                )}
                {state.response.docsUrl && (
                  <a
                    href={state.response.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Setup guide <ArrowSquareOut size={10} />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          {hits.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {hits.slice(0, 6).map((h) => (
                  <div key={h.id} className="rounded-md border bg-background/60 px-2 py-1.5 text-[11px]">
                    <div className="font-medium truncate">{h.title || h.snippet || h.id}</div>
                    {h.snippet && h.title && (
                      <div className="text-muted-foreground line-clamp-2">{h.snippet}</div>
                    )}
                    {h.url && (
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-0.5 text-[10px]"
                      >
                        Open <ArrowSquareOut size={9} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="default" onClick={() => onApply(hits)} className="w-full">
                Apply top {Math.min(5, hits.length)} to blueprint
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
