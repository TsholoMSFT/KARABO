import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { renderMermaidToSvg } from '@/lib/mermaid'

interface MermaidDiagramProps {
  mermaid: string
  className?: string
  title?: string
}

function getTheme(): 'default' | 'dark' {
  try {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'default'
  } catch {
    return 'default'
  }
}

export function MermaidDiagram({ mermaid, className = '', title }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const theme = useMemo(() => getTheme(), [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setError(null)
        const rawSvg = await renderMermaidToSvg(mermaid, theme)

        const sanitized = DOMPurify.sanitize(rawSvg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ['style'],
          ADD_ATTR: ['style', 'class', 'id'],
        })

        if (!cancelled) setSvg(sanitized)
      } catch (e) {
        if (!cancelled) {
          setSvg('')
          setError(e instanceof Error ? e.message : 'Failed to render diagram')
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [mermaid, theme])

  if (error) {
    return (
      <div className={`rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground ${className}`}>
        <div className="font-medium text-foreground">Diagram unavailable</div>
        <div className="mt-1">{error}</div>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className={`rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground ${className}`}>
        Rendering diagram…
      </div>
    )
  }

  return (
    <div className={className} aria-label={title}>
      <div
        className="w-full overflow-x-auto"
        // We sanitize via DOMPurify + Mermaid strict mode.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
