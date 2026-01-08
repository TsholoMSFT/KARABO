import { REFERENCE_ARCHITECTURES, type ReferenceArchitecturePattern } from '@/lib/microsoft-solutions'
import { buildReferenceArchitectureDiagramSpec } from '@/lib/architecture-diagrams'
import { diagramSpecToMermaidFlowchart } from '@/lib/mermaid'
import { MermaidDiagram } from '@/components/MermaidDiagram'

interface ReferenceArchitectureMermaidProps {
  pattern: ReferenceArchitecturePattern
  className?: string
}

export function ReferenceArchitectureMermaid({ pattern, className }: ReferenceArchitectureMermaidProps) {
  const architecture = REFERENCE_ARCHITECTURES[pattern]
  if (!architecture) return null

  const spec = buildReferenceArchitectureDiagramSpec({
    title: architecture.label,
    services: architecture.typicalServices,
    direction: 'LR',
  })

  const mermaid = diagramSpecToMermaidFlowchart(spec)

  return <MermaidDiagram mermaid={mermaid} title={architecture.label} className={className} />
}
