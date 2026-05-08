import { lazy, Suspense, useMemo, useState } from 'react'
import type { BlueprintPathKind, BlueprintResult } from '@/lib/solution-blueprint/types'
import { toMermaid } from '@/lib/diagram/blueprint-to-mermaid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Copy, Code } from 'lucide-react'
import { toast } from 'sonner'
import { LearnMorePopover } from './LearnMorePopover'

const MermaidDiagram = lazy(() =>
  import('./MermaidDiagram').then(m => ({ default: m.MermaidDiagram })),
)

interface BlueprintDiagramProps {
  result: BlueprintResult
  defaultPath?: BlueprintPathKind | 'side-by-side'
}

type ViewMode = BlueprintPathKind | 'side-by-side'

function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function PathPanel({
  result,
  path,
  onSvgReady,
}: {
  result: BlueprintResult
  path: BlueprintPathKind
  onSvgReady?: (svg: string) => void
}) {
  const source = useMemo(() => toMermaid(result, path), [result, path])
  const blueprint = path === 'best-fit' ? result.bestFit : result.estateOptimized
  const [showSource, setShowSource] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={path === 'best-fit' ? 'default' : 'secondary'}>
          {path === 'best-fit' ? 'Path A — Best fit' : 'Path B — Estate-optimized'}
        </Badge>
        <Badge variant="outline">{Math.round(blueprint.reuseRatio * 100)}% reuse</Badge>
        <Badge variant="outline">{blueprint.gapCount} gap{blueprint.gapCount === 1 ? '' : 's'}</Badge>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(source)
              toast.success('Mermaid source copied')
            }}
          >
            <Copy className="mr-1 size-3.5" /> Source
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSource(s => !s)}>
            <Code className="mr-1 size-3.5" /> {showSource ? 'Hide' : 'Show'} code
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <MermaidDiagram
          source={source}
          onRendered={svg => onSvgReady?.(svg.outerHTML)}
          className="rounded-md border bg-card p-3"
        />
      </Suspense>

      <ComponentsLegend blueprint={blueprint} />

      {showSource && (
        <pre className="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">
          <code>{source}</code>
        </pre>
      )}
    </div>
  )
}

function ComponentsLegend({ blueprint }: { blueprint: import('@/lib/solution-blueprint/types').Blueprint }) {
  const byLayer = useMemo(() => {
    const map = new Map<string, typeof blueprint.components>()
    for (const c of blueprint.components) {
      const arr = map.get(c.layer) ?? []
      arr.push(c)
      map.set(c.layer, arr)
    }
    return Array.from(map.entries())
  }, [blueprint])

  if (!blueprint.components.length) return null

  return (
    <details className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <summary className="cursor-pointer font-medium select-none">
        Components ({blueprint.components.length})
      </summary>
      <div className="mt-2 space-y-3">
        {byLayer.map(([layer, comps]) => (
          <div key={layer}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{layer}</div>
            <ul className="space-y-1">
              {comps.map(c => (
                <li key={c.capability} className="flex items-center gap-2">
                  <span className="flex-1">
                    <span className="font-medium">{c.capabilityName}</span>
                    {c.service && <span className="text-muted-foreground"> — {c.service.name}</span>}
                    {c.gap && <Badge variant="destructive" className="ml-2 text-[10px]">gap</Badge>}
                    {c.reused && <Badge variant="outline" className="ml-2 text-[10px]">reused</Badge>}
                  </span>
                  {c.service && <LearnMorePopover query={`${c.service.name} Azure`} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

export function BlueprintDiagram({ result, defaultPath = 'side-by-side' }: BlueprintDiagramProps) {
  const [mode, setMode] = useState<ViewMode>(defaultPath)
  const [svgA, setSvgA] = useState<string | null>(null)
  const [svgB, setSvgB] = useState<string | null>(null)

  const slug = result.useCase.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blueprint'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={mode} onValueChange={v => setMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="best-fit">Path A</TabsTrigger>
            <TabsTrigger value="estate-optimized">Path B</TabsTrigger>
            <TabsTrigger value="side-by-side">Side-by-side</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!svgA}
            onClick={() => svgA && downloadSvg(svgA, `${slug}-best-fit.svg`)}
          >
            <Download className="mr-1 size-3.5" /> Path A SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!svgB}
            onClick={() => svgB && downloadSvg(svgB, `${slug}-estate-optimized.svg`)}
          >
            <Download className="mr-1 size-3.5" /> Path B SVG
          </Button>
        </div>
      </div>

      <Tabs value={mode}>
        <TabsContent value="best-fit" className="mt-0">
          <PathPanel result={result} path="best-fit" onSvgReady={setSvgA} />
        </TabsContent>
        <TabsContent value="estate-optimized" className="mt-0">
          <PathPanel result={result} path="estate-optimized" onSvgReady={setSvgB} />
        </TabsContent>
        <TabsContent value="side-by-side" className="mt-0">
          <div className="grid gap-4 lg:grid-cols-2">
            <PathPanel result={result} path="best-fit" onSvgReady={setSvgA} />
            <PathPanel result={result} path="estate-optimized" onSvgReady={setSvgB} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
