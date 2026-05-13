import { useEffect, useRef } from 'react'
import { getIcon, VENDOR_COLORS, type IconDescriptor } from '@/lib/diagram/azure-icons'
import { cn } from '@/lib/utils'

interface AzureIconProps {
  serviceId?: string
  fallbackLabel?: string
  size?: number
  className?: string
}

/**
 * Renders either a bundled Azure SVG (when present) or a vendor-coloured
 * tile with a glyph. Visual is deliberately compact and identity-stable so
 * Mermaid post-processing can swap nodes for these without layout shift.
 */
export function AzureIcon({ serviceId, fallbackLabel, size = 32, className }: AzureIconProps) {
  const icon: IconDescriptor = getIcon(serviceId, { label: fallbackLabel })
  const colors = VENDOR_COLORS[icon.vendor]
  const tileRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = tileRef.current
    if (!el) return
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.background = colors.bg
    el.style.color = colors.fg
    el.style.boxShadow = `inset 0 0 0 1px ${colors.ring}`
    el.style.fontSize = `${Math.max(9, Math.floor(size / (icon.glyph.length > 2 ? 4 : 3)))}px`
    el.style.letterSpacing = icon.glyph.length > 2 ? '-0.03em' : '0'
  }, [size, colors.bg, colors.fg, colors.ring, icon.glyph])

  if (icon.svgUrl) {
    return (
      <img
        src={icon.svgUrl}
        alt={icon.label}
        title={icon.label}
        width={size}
        height={size}
        className={cn('inline-block rounded-sm', className)}
      />
    )
  }

  return (
    <span
      ref={tileRef}
      role="img"
      aria-label={icon.label}
      title={icon.label}
      className={cn('inline-flex items-center justify-center rounded font-semibold leading-none select-none', className)}
    >
      {icon.glyph}
    </span>
  )
}
