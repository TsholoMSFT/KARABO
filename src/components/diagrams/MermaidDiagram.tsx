import { useEffect, useId, useRef, useState } from 'react'
import { mermaidThemeVariables, type DiagramTheme } from '@/lib/diagram/diagram-themes'
import { Skeleton } from '@/components/ui/skeleton'

interface MermaidDiagramProps {
  source: string
  theme?: DiagramTheme
  /** Called with the rendered SVG element after each render — for icon swaps / export. */
  onRendered?: (svg: SVGSVGElement) => void
  className?: string
}

/**
 * Lazy-renders Mermaid source to an SVG. Single shared mermaid instance
 * is initialized once per page; subsequent renders reuse it.
 *
 * Avoids the TS heavy import via dynamic `import('mermaid')`.
 */
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null
async function getMermaid(theme: DiagramTheme) {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => m.default)
  }
  const mermaid = await mermaidPromise
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: mermaidThemeVariables(theme),
    securityLevel: 'strict',
    flowchart: { htmlLabels: true, curve: 'basis' },
  })
  return mermaid
}

export function MermaidDiagram({ source, theme = 'light', onRendered, className }: MermaidDiagramProps) {
  const id = useId().replace(/[:]/g, '_')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const mermaid = await getMermaid(theme)
        if (cancelled || !containerRef.current) return
        const renderId = `mmd_${id}_${Date.now().toString(36)}`
        const { svg } = await mermaid.render(renderId, source)
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = svg
        const svgEl = containerRef.current.querySelector('svg')
        if (svgEl instanceof SVGSVGElement) {
          svgEl.setAttribute('width', '100%')
          svgEl.style.maxWidth = '100%'
          svgEl.style.height = 'auto'
          onRendered?.(svgEl)
        }
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to render diagram'
        setError(message)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [source, theme, id, onRendered])

  return (
    <div className={className}>
      {loading && <Skeleton className="h-72 w-full" />}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="font-medium">Diagram render error</div>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs opacity-80">{error}</pre>
        </div>
      )}
      <div ref={containerRef} className={loading || error ? 'hidden' : 'overflow-x-auto'} />
    </div>
  )
}
