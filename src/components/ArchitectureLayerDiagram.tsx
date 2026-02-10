/**
 * ArchitectureLayerDiagram — Interactive 5-layer conceptual reference architecture
 * 
 * Renders horizontal layers (bottom → top):
 *   5. LZ Capabilities → 4. AI Landing Zone → 3. Foundry/AI Services → 2. Enterprise Capabilities → 1. Engagement
 * 
 * Each layer shows relevant Azure services as badges. Hovering a service reveals
 * data-flow connections. Clicking a layer opens its principle & responsibility detail.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stack,
  ShieldCheck,
  Cloud,
  CubeTransparent,
  Users,
  Cpu,
  ArrowUp,
  ArrowDown,
  Info,
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_LAYERS_ORDERED,
} from '@/lib/architecture-layers'
import type { ArchitectureComponent, ArchitectureLayer } from '@/lib/types'
import type { ReferenceArchitectureInfo } from '@/lib/microsoft-solutions'
import { getServiceLabel } from '@/lib/microsoft-solutions'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  /** The reference architecture to visualise */
  architecture: ReferenceArchitectureInfo
  /** Compact mode (smaller) for card embedding */
  compact?: boolean
}

// ============================================================================
// LAYER STYLING
// ============================================================================

const LAYER_COLORS: Record<ArchitectureLayer, { bg: string; border: string; text: string; badge: string }> = {
  'engagement': {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-200',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  'enterprise-capabilities': {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  'foundry-ai-services': {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  'ai-landing-zone': {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-800 dark:text-green-200',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  'lz-capabilities': {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-300 dark:border-slate-700',
    text: 'text-slate-800 dark:text-slate-200',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  },
}

const LAYER_ICONS: Record<ArchitectureLayer, typeof Stack> = {
  'engagement': Users,
  'enterprise-capabilities': CubeTransparent,
  'foundry-ai-services': Cpu,
  'ai-landing-zone': Cloud,
  'lz-capabilities': ShieldCheck,
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ArchitectureLayerDiagram({ architecture, compact = false }: Props) {
  const [expandedLayer, setExpandedLayer] = useState<ArchitectureLayer | null>(null)
  const [highlightedService, setHighlightedService] = useState<string | null>(null)

  // Build service → layer mapping from topology
  const servicesByLayer = useMemo(() => {
    const map: Record<ArchitectureLayer, ArchitectureComponent[]> = {
      'engagement': [],
      'enterprise-capabilities': [],
      'foundry-ai-services': [],
      'ai-landing-zone': [],
      'lz-capabilities': [],
    }
    if (architecture.componentTopology) {
      for (const comp of architecture.componentTopology) {
        if (map[comp.layer]) {
          map[comp.layer].push(comp)
        }
      }
    }
    return map
  }, [architecture.componentTopology])

  // Data flows involving highlighted service
  const activeFlows = useMemo(() => {
    if (!highlightedService || !architecture.componentTopology) return []
    return architecture.componentTopology
      .filter(c => c.serviceId === highlightedService && c.dataFlows)
      .flatMap(c => c.dataFlows!.map(f => ({ from: c.serviceId, ...f })))
  }, [highlightedService, architecture.componentTopology])

  // Only render layers that the architecture spans
  const activeLayers = useMemo(() => {
    return ARCHITECTURE_LAYERS_ORDERED.filter(l =>
      architecture.layers.includes(l.id as ArchitectureLayer)
    )
  }, [architecture.layers])

  const toggleLayer = (layer: ArchitectureLayer) => {
    setExpandedLayer(prev => prev === layer ? null : layer)
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Stack weight="duotone" className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">
            Architecture Layers ({activeLayers.length}/5)
          </span>
          {architecture.interopProtocols && architecture.interopProtocols.length > 0 && (
            <div className="flex gap-1 ml-auto">
              {architecture.interopProtocols.map(p => (
                <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">
                  {p.toUpperCase()}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Layer stack (top → bottom, rendered top to bottom on screen) */}
        <div className="flex flex-col gap-0.5">
          {activeLayers.map((layerConfig, idx) => {
            const layerId = layerConfig.id as ArchitectureLayer
            const colors = LAYER_COLORS[layerId]
            const Icon = LAYER_ICONS[layerId]
            const components = servicesByLayer[layerId]
            const isExpanded = expandedLayer === layerId
            const layerDef = ARCHITECTURE_LAYERS[layerId]

            return (
              <div key={layerId}>
                {/* Layer bar */}
                <button
                  onClick={() => toggleLayer(layerId)}
                  className={`
                    w-full flex items-center gap-2 px-3 rounded-md border transition-all cursor-pointer
                    ${colors.bg} ${colors.border}
                    ${compact ? 'py-1.5' : 'py-2'}
                    hover:shadow-sm
                  `}
                >
                  <Icon weight="duotone" className={`h-4 w-4 shrink-0 ${colors.text}`} />
                  <span className={`font-semibold ${colors.text} truncate`}>
                    {layerConfig.label}
                  </span>

                  {/* Service badges */}
                  <div className="flex flex-wrap gap-1 ml-auto max-w-[60%] justify-end">
                    {components.map(comp => (
                      <Tooltip key={comp.serviceId}>
                        <TooltipTrigger asChild>
                          <span
                            className={`
                              px-1.5 py-0 rounded text-[10px] font-medium cursor-default whitespace-nowrap
                              ${colors.badge}
                              ${comp.role === 'primary' ? 'ring-1 ring-offset-1 ring-current' : ''}
                              ${highlightedService === comp.serviceId ? 'ring-2 ring-yellow-400' : ''}
                              transition-shadow
                            `}
                            onMouseEnter={() => setHighlightedService(comp.serviceId)}
                            onMouseLeave={() => setHighlightedService(null)}
                          >
                            {getServiceLabel(comp.serviceId) || comp.serviceId}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          <div className="font-semibold">{getServiceLabel(comp.serviceId)}</div>
                          <div className="text-muted-foreground">
                            Role: {comp.role}
                            {comp.securityBoundary && ` · Security: ${comp.securityBoundary}`}
                          </div>
                          {comp.dataFlows && comp.dataFlows.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {comp.dataFlows.map((f, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <ArrowDown className="h-3 w-3" />
                                  <span>{f.description} → {getServiceLabel(f.to) || f.to}</span>
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">{f.protocol}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && layerDef && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`ml-6 mt-1 mb-2 p-3 rounded border ${colors.bg} ${colors.border} space-y-2`}>
                        <p className="text-muted-foreground">{layerDef.description}</p>
                        {layerDef.responsibilities.length > 0 && (
                          <div>
                            <div className="font-semibold text-xs mb-1">Responsibilities</div>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                              {layerDef.responsibilities.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {layerDef.principlesApplied.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {layerDef.principlesApplied.map(p => (
                              <Badge key={p} variant="secondary" className="text-[10px]">
                                {p.replace(/-/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Data flow arrows between layers */}
                {idx < activeLayers.length - 1 && activeFlows.length > 0 && (
                  <div className="flex justify-center">
                    {activeFlows.some(f => {
                      const targetComponent = architecture.componentTopology?.find(c => c.serviceId === f.to)
                      return targetComponent?.layer === activeLayers[idx + 1]?.id
                    }) && (
                      <div className="flex items-center gap-1 text-yellow-500 text-[10px]">
                        <ArrowDown className="h-3 w-3" />
                        <span className="font-medium">
                          {activeFlows.find(f => {
                            const tc = architecture.componentTopology?.find(c => c.serviceId === f.to)
                            return tc?.layer === activeLayers[idx + 1]?.id
                          })?.description}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Deployment model */}
        {architecture.deploymentModel && !compact && (
          <div className="mt-3 p-2 rounded border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
            <span className="font-medium">Deployment:</span>{' '}
            {architecture.deploymentModel.primary}
            {architecture.deploymentModel.fallback && ` (fallback: ${architecture.deploymentModel.fallback})`}
            {' · '}
            {architecture.deploymentModel.haModel} HA · {architecture.deploymentModel.regions.join(', ')}
          </div>
        )}

        {/* Channel strip */}
        {architecture.channels.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-muted-foreground font-medium">Channels:</span>
            {architecture.channels.map(ch => (
              <Badge key={ch} variant="outline" className="text-[10px] px-1.5 py-0">
                {ch.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
