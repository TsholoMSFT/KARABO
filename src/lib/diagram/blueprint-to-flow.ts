/**
 * Pure converter: BlueprintResult → React Flow nodes & edges.
 *
 * Edges are sourced from the shared `deriveEdges` so the Mermaid renderer
 * and the interactive Flow renderer always agree.
 */
import type { Edge, Node } from '@xyflow/react'
import type {
  Blueprint,
  BlueprintComponent,
  BlueprintPathKind,
  BlueprintResult,
} from '@/lib/solution-blueprint/types'
import { deriveEdges } from './edges'

export interface AzureServiceNodeData extends Record<string, unknown> {
  component: BlueprintComponent
  pathKind: BlueprintPathKind
}

export type AzureServiceNode = Node<AzureServiceNodeData, 'azureService'>

function nodeIdForCapability(capability: string) {
  return `n_${capability.replace(/[^a-zA-Z0-9_]/g, '_')}`
}

const EDGE_STYLES: Record<string, { stroke: string; dashed?: boolean; label?: string }> = {
  control: { stroke: '#64748B' },
  data: { stroke: '#2563EB' },
  auth: { stroke: '#9333EA', dashed: true },
  observe: { stroke: '#0EA5E9', dashed: true },
}

export function toFlow(
  result: BlueprintResult,
  pathKind: BlueprintPathKind,
): { nodes: AzureServiceNode[]; edges: Edge[] } {
  const blueprint: Blueprint = pathKind === 'best-fit' ? result.bestFit : result.estateOptimized

  const sortedComponents = [...blueprint.components].sort(
    (a, b) =>
      a.layer.localeCompare(b.layer) || a.capability.localeCompare(b.capability),
  )

  const nodes: AzureServiceNode[] = sortedComponents.map((c) => ({
    id: nodeIdForCapability(c.capability),
    type: 'azureService',
    data: { component: c, pathKind },
    position: { x: 0, y: 0 },
  }))

  const rawEdges = deriveEdges(blueprint)
  const edges: Edge[] = rawEdges.map((e) => {
    const style = EDGE_STYLES[e.kind] ?? EDGE_STYLES.control
    return {
      id: e.id,
      source: nodeIdForCapability(e.fromCapability),
      target: nodeIdForCapability(e.toCapability),
      label: e.label,
      labelStyle: { fontSize: 10, fill: '#475569' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgStyle: { fill: '#F8FAFC', stroke: '#E2E8F0' },
      style: {
        stroke: style.stroke,
        strokeWidth: 1.5,
        ...(style.dashed ? { strokeDasharray: '4 3' } : {}),
      },
      animated: e.kind === 'data',
    }
  })

  return { nodes, edges }
}
