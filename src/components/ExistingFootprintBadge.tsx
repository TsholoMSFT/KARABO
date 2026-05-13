/**
 * ExistingFootprintBadge
 * ----------------------------------------------------------------------------
 * Pluggable badge that surfaces overlap between a use case's selected
 * Microsoft solutions and the products the customer already owns (per the
 * uploaded internal sales CSV). Renders nothing if no overlap or no record.
 *
 * Drop-in: <ExistingFootprintBadge customerId={customer.id} solutions={useCase.microsoftSolutions} />
 */

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle } from '@phosphor-icons/react'
import { findOwnedOverlap, getSalesForCustomer, estimateImplementationDiscount } from '@/lib/sales-data-service'

interface Props {
  customerId?: string | null
  solutions?: string[]
  baseImplementationUSD?: number
  className?: string
}

export function ExistingFootprintBadge({ customerId, solutions, baseImplementationUSD, className }: Props) {
  const { overlaps, discount } = useMemo(() => {
    const record = getSalesForCustomer(customerId)
    const ovs = findOwnedOverlap(record, solutions)
    const disc = baseImplementationUSD && ovs.length
      ? estimateImplementationDiscount(baseImplementationUSD, ovs.length)
      : null
    return { overlaps: ovs, discount: disc }
  }, [customerId, solutions, baseImplementationUSD])

  if (!overlaps.length) return null

  const tooltip = (
    <div className="text-[11px] space-y-1 max-w-xs">
      <div className="font-semibold">Existing Microsoft footprint</div>
      <div>Customer already owns: {overlaps.join(', ')}</div>
      {discount && discount.discountUSD > 0 && (
        <div className="text-emerald-600">
          Estimated implementation saving: ${discount.discountUSD.toLocaleString()} ({Math.round(discount.discountPct * 100)}%)
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`bg-emerald-500/10 text-emerald-700 border-emerald-500/40 gap-1 ${className || ''}`}
          >
            <CheckCircle size={10} weight="fill" /> {overlaps.length} owned
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
