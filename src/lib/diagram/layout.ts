/**
 * Dagre layered auto-layout for the React Flow renderer.
 *
 * Pure function: given nodes/edges (with measured `width`/`height`), returns
 * a new node array with `position` assigned and matching `targetPosition` /
 * `sourcePosition` set so edges enter and exit on the correct sides.
 */
import dagre from 'dagre'
import type { Edge, Node } from '@xyflow/react'

export type Direction = 'TB' | 'LR'

const DEFAULT_NODE_WIDTH = 220
const DEFAULT_NODE_HEIGHT = 88

export function layoutNodes<T extends Node>(
  nodes: T[],
  edges: Edge[],
  direction: Direction = 'TB',
): T[] {
  const g = new dagre.graphlib.Graph({ multigraph: true, compound: false })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 36, ranksep: 64, edgesep: 16, marginx: 24, marginy: 24 })

  for (const n of nodes) {
    g.setNode(n.id, {
      width: (n as any).width ?? n.style?.width ?? DEFAULT_NODE_WIDTH,
      height: (n as any).height ?? n.style?.height ?? DEFAULT_NODE_HEIGHT,
    })
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target, {}, e.id)
  }

  dagre.layout(g)

  const horizontal = direction === 'LR'
  return nodes.map((n) => {
    const { x, y, width, height } = g.node(n.id) as { x: number; y: number; width: number; height: number }
    return {
      ...n,
      // Dagre positions nodes by center; React Flow expects top-left.
      position: { x: x - width / 2, y: y - height / 2 },
      targetPosition: horizontal ? ('left' as const) : ('top' as const),
      sourcePosition: horizontal ? ('right' as const) : ('bottom' as const),
    }
  })
}
