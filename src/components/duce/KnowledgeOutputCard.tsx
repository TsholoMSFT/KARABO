import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { DecisionContext, DUCESessionData, KnowledgeOutput } from '@/lib/duce-types'
import { ARCHITECTURE_PATTERNS } from '@/lib/architecture-patterns'
import {
  generateArchitectureSummary,
  generateDeploymentSteps,
  generateRisksAndDependencies,
} from '@/lib/decision-engine'

interface KnowledgeOutputCardProps {
  duce: DUCESessionData
  onSnapshot?: (snapshot: KnowledgeOutput) => void
}

export function KnowledgeOutputCard({ duce, onSnapshot }: KnowledgeOutputCardProps) {
  const selected = useMemo(
    () => ARCHITECTURE_PATTERNS.filter((p) => duce.selectedPatternIds.includes(p.id)),
    [duce.selectedPatternIds]
  )

  const ctx: DecisionContext = duce.decisionContext

  const summary = useMemo(() => generateArchitectureSummary(selected, ctx), [selected, ctx])
  const steps = useMemo(() => generateDeploymentSteps(selected), [selected])
  const risks = useMemo(() => generateRisksAndDependencies(selected, ctx), [selected, ctx])

  const snapshot = (): KnowledgeOutput => ({
    generatedAt: Date.now(),
    architectureSummary: summary,
    decisionLog: duce.decisionLog,
    deploymentSteps: steps,
    risksAndDependencies: risks,
    selectedPatternIds: duce.selectedPatternIds,
  })

  const onDownload = () => {
    const k = snapshot()
    const md = [
      `# Engagement Knowledge Output`,
      `_Generated: ${new Date(k.generatedAt).toLocaleString()}_`,
      ``,
      `## Architecture Summary`,
      k.architectureSummary,
      ``,
      `## Deployment Steps`,
      ...k.deploymentSteps.map((s, i) => `${i + 1}. ${s}`),
      ``,
      `## Risks & Dependencies`,
      ...k.risksAndDependencies.map((r) => `- ${r}`),
      ``,
      `## Decision Log (${k.decisionLog.length})`,
      ...k.decisionLog.map(
        (d) =>
          `- **${new Date(d.timestamp).toLocaleString()}** — ${d.decision} — ${d.rationale}${
            d.finalDisposition ? ` (final: ${d.finalDisposition})` : ''
          }`
      ),
    ].join('\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `engagement-knowledge-${k.generatedAt}.md`
    a.click()
    URL.revokeObjectURL(url)
    onSnapshot?.(k)
    toast.success('Knowledge output exported')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Engagement Knowledge Output</CardTitle>
            <CardDescription>
              Auto-generated architecture summary, deployment steps, and risks from the captured decisions and selected patterns.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{selected.length} pattern{selected.length === 1 ? '' : 's'}</Badge>
            <Button size="sm" variant="default" onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" /> Export .md
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Architecture</TabsTrigger>
            <TabsTrigger value="steps">Deployment Steps</TabsTrigger>
            <TabsTrigger value="risks">Risks & Deps</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-3">
            <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/30 p-3 rounded-md max-h-[420px] overflow-auto">
              {summary}
            </pre>
          </TabsContent>
          <TabsContent value="steps" className="mt-3">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </TabsContent>
          <TabsContent value="risks" className="mt-3">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
