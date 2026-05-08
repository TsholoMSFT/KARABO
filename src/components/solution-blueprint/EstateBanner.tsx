import { Badge } from '@/components/ui/badge'
import { Cloud, ShieldCheck, IdentificationCard, Globe } from '@phosphor-icons/react'
import type { TechnologyEstate } from '@/lib/solution-blueprint/types'

interface EstateBannerProps {
  estate: TechnologyEstate | null
  className?: string
}

/**
 * Compact, read-only summary of the active customer's TechnologyEstate.
 * Surfaces the high-signal facts (cloud, sovereignty, identity, key
 * security controls) so the same context is visible across all
 * blueprint, landing-zone, and sovereign workflows.
 */
export function EstateBanner({ estate, className }: EstateBannerProps) {
  if (!estate) {
    return (
      <div className={`text-xs text-muted-foreground italic ${className ?? ''}`}>
        No estate captured for this customer yet.
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className ?? ''}`}>
      <Badge variant="secondary" className="gap-1">
        <Cloud size={12} />
        {estate.primaryCloud === 'unknown' ? 'Cloud unknown' : `Primary: ${estate.primaryCloud}`}
      </Badge>
      {estate.sovereigntyRequired && (
        <Badge variant="default" className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30">
          <ShieldCheck size={12} />
          Sovereignty {estate.sovereignProfile ? `· ${estate.sovereignProfile}` : 'required'}
        </Badge>
      )}
      {estate.azureRegions && estate.azureRegions.length > 0 && (
        <Badge variant="outline" className="gap-1">
          <Globe size={12} />
          {estate.azureRegions.slice(0, 2).join(', ')}
          {estate.azureRegions.length > 2 ? ` +${estate.azureRegions.length - 2}` : ''}
        </Badge>
      )}
      {estate.identityProvider !== 'unknown' && (
        <Badge variant="outline" className="gap-1">
          <IdentificationCard size={12} />
          {estate.identityProvider}
        </Badge>
      )}
      {estate.hasPrivateEndpoints && <Badge variant="outline">private endpoints</Badge>}
      {estate.hasKeyVault && <Badge variant="outline">Key Vault</Badge>}
      {estate.hasDefenderForCloud && <Badge variant="outline">Defender</Badge>}
      {estate.hasSentinel && <Badge variant="outline">Sentinel</Badge>}
      {estate.hasPurview && <Badge variant="outline">Purview</Badge>}
    </div>
  )
}
