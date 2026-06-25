import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false
function ensureInit() {
  if (initialized) return
  // securityLevel 'strict' sanitizes AI-generated diagram source before render.
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' })
  initialized = true
}

/** Renders Mermaid source to inline SVG, with a graceful error/source fallback. */
export function MermaidDiagram({ code, className }: { code: string; className?: string }) {
  const rawId = useId()
  const id = `mmd-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ensureInit()
    const src = (code || '').trim()
    if (!src) { setSvg(''); setError(null); return }
    mermaid
      .render(id, src)
      .then(({ svg }) => { if (!cancelled) { setSvg(svg); setError(null) } })
      .catch((e: unknown) => {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'Invalid diagram syntax'); setSvg('') }
      })
    return () => { cancelled = true }
  }, [code, id])

  if (error) {
    return (
      <div className={className}>
        <p className="text-xs text-destructive mb-2">Diagram preview failed — check the syntax below.</p>
        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap">{code}</pre>
      </div>
    )
  }

  return <div className={className} aria-label="Architecture diagram" dangerouslySetInnerHTML={{ __html: svg }} />
}
