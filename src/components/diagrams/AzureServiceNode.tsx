import { memo, useEffect, useRef } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { AzureIcon } from './AzureIcon'
import { STATE_COLORS } from '@/lib/diagram/diagram-themes'
import type { AzureServiceNode as AzureServiceNodeType } from '@/lib/diagram/blueprint-to-flow'

function chipStyle(c: { reused: boolean; gap: boolean }) {
  if (c.gap) return STATE_COLORS.gap
  if (c.reused) return STATE_COLORS.reused
  return STATE_COLORS.netNew
}

function AzureServiceNodeImpl({ data, selected }: NodeProps<AzureServiceNodeType>) {
  const { component } = data
  const colors = chipStyle(component)
  const vendor = component.service?.vendor

  const nodeRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nodeRef.current) {
      nodeRef.current.style.width = '220px'
      nodeRef.current.style.borderColor = colors.stroke
      nodeRef.current.style.boxShadow = selected ? `0 0 0 2px ${colors.stroke}66` : ''
    }
    if (footerRef.current) {
      footerRef.current.style.background = colors.fill
      footerRef.current.style.color = colors.text
      footerRef.current.style.borderColor = colors.stroke
    }
    // Style the React Flow handles by querying within this node
    if (nodeRef.current) {
      const handles = nodeRef.current.querySelectorAll<HTMLElement>('.react-flow__handle')
      handles.forEach((h) => { h.style.background = colors.stroke })
    }
  }, [colors.stroke, colors.fill, colors.text, selected])

  return (
    <div
      ref={nodeRef}
      className="rounded-md border bg-card text-card-foreground shadow-sm"
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-start gap-2 p-2.5">
        <AzureIcon serviceId={component.service?.id} fallbackLabel={component.service?.name ?? component.capabilityName} size={28} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {component.capabilityName}
          </div>
          <div className="truncate text-sm font-medium">
            {component.service?.name ?? '—'}
          </div>
          {vendor && vendor !== 'azure' && (
            <div className="truncate text-[10px] text-muted-foreground">{vendor}</div>
          )}
        </div>
      </div>
      <div
        ref={footerRef}
        className="flex items-center justify-between border-t px-2 py-1"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide">{component.layer}</span>
        <div className="flex gap-1">
          {component.gap && <Badge variant="destructive" className="text-[9px] py-0">gap</Badge>}
          {component.reused && !component.gap && (
            <Badge variant="outline" className="text-[9px] py-0">reused</Badge>
          )}
          {!component.reused && !component.gap && component.service && (
            <Badge variant="outline" className="text-[9px] py-0">net-new</Badge>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export const AzureServiceNode = memo(AzureServiceNodeImpl)
