import { ARCHETYPE_BY_ID } from './archetypes'
import { CAPABILITY_BY_ID } from './capabilities'
import { SERVICE_BY_ID, SERVICE_CATALOG } from './service-catalog'
import type {
  Blueprint,
  BlueprintComponent,
  BlueprintDelta,
  BlueprintResult,
  CapabilityId,
  ServiceDef,
  TechnologyEstate,
  UseCaseInput,
} from './types'

/**
 * Resolve required capabilities for a use case input.
 * If an archetype is selected, use its required + recommended capabilities.
 * Always merge in any user-specified extra capabilities.
 */
function resolveRequiredCapabilities(input: UseCaseInput): CapabilityId[] {
  const set = new Set<CapabilityId>()
  if (input.archetypeId) {
    const arch = ARCHETYPE_BY_ID[input.archetypeId]
    if (arch) {
      arch.requiredCapabilities.forEach((c) => set.add(c))
      arch.recommendedCapabilities?.forEach((c) => set.add(c))
    }
  }
  input.extraCapabilities?.forEach((c) => set.add(c))
  return Array.from(set)
}

function isVendorAllowed(service: ServiceDef, estate: TechnologyEstate): boolean {
  if (estate.blockedVendors?.includes(service.vendor)) return false
  if (estate.approvedVendors && estate.approvedVendors.length > 0) {
    return estate.approvedVendors.includes(service.vendor)
  }
  return true
}

function pickBestFit(
  capability: CapabilityId,
  estate: TechnologyEstate,
  sovereigntyRequired: boolean,
): ServiceDef | null {
  const candidates = SERVICE_CATALOG.filter(
    (s) =>
      s.capabilities.includes(capability) &&
      isVendorAllowed(s, estate) &&
      (!sovereigntyRequired || s.sovereignReady),
  )
  if (candidates.length === 0) return null
  // Best-fit prefers highest fitScore. Azure-native is already weighted higher
  // in the catalog. Tie-breakers: alphabetical for determinism.
  return candidates.sort((a, b) => b.fitScore - a.fitScore || a.name.localeCompare(b.name))[0]
}

function pickEstateOptimized(
  capability: CapabilityId,
  estate: TechnologyEstate,
  sovereigntyRequired: boolean,
): { service: ServiceDef | null; reused: boolean } {
  // 1) Prefer something the customer already owns that satisfies the capability.
  const owned = estate.ownedServiceIds
    .map((id) => SERVICE_BY_ID[id])
    .filter((s): s is ServiceDef => Boolean(s))
    .filter(
      (s) =>
        s.capabilities.includes(capability) &&
        isVendorAllowed(s, estate) &&
        (!sovereigntyRequired || s.sovereignReady),
    )
    .sort((a, b) => b.fitScore - a.fitScore || a.name.localeCompare(b.name))

  if (owned.length > 0) return { service: owned[0], reused: true }

  // 2) Fall back to best-fit for the gap.
  const best = pickBestFit(capability, estate, sovereigntyRequired)
  return { service: best, reused: false }
}

function buildComponents(
  capabilities: CapabilityId[],
  pick: (cap: CapabilityId) => { service: ServiceDef | null; reused: boolean },
): BlueprintComponent[] {
  return capabilities.map((cap) => {
    const def = CAPABILITY_BY_ID[cap]
    const { service, reused } = pick(cap)
    return {
      capability: cap,
      capabilityName: def?.name ?? cap,
      layer: def?.layer ?? 'app-ai',
      service,
      reused,
      gap: !service,
      rationale: !service
        ? 'No service in the catalog satisfies this capability with current constraints.'
        : reused
          ? `Reusing ${service.name} from the existing technology estate.`
          : service.rationale ?? `${service.name} is the highest-fit service for this capability.`,
    }
  })
}

function summarize(pathKind: 'best-fit' | 'estate-optimized', components: BlueprintComponent[]): Blueprint {
  const total = components.length
  const reused = components.filter((c) => c.reused).length
  const gaps = components.filter((c) => c.gap).length
  const netNew = Array.from(
    new Set(
      components
        .filter((c) => !c.reused && c.service)
        .map((c) => c.service!.id),
    ),
  )
  return {
    pathKind,
    components,
    reuseRatio: total > 0 ? reused / total : 0,
    gapCount: gaps,
    netNewServiceIds: netNew,
  }
}

function diff(a: Blueprint, b: Blueprint): BlueprintDelta {
  const swaps: BlueprintDelta['swaps'] = []
  for (const compA of a.components) {
    const compB = b.components.find((c) => c.capability === compA.capability)
    if (!compB) continue
    if ((compA.service?.id ?? null) !== (compB.service?.id ?? null)) {
      swaps.push({
        capability: compA.capability,
        capabilityName: compA.capabilityName,
        layer: compA.layer,
        bestFit: compA.service,
        estateOptimized: compB.service,
      })
    }
  }
  const avgFit = (bp: Blueprint) => {
    const scores = bp.components.map((c) => c.service?.fitScore ?? 0)
    return scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : 0
  }
  return {
    swaps,
    fitScoreDelta: avgFit(a) - avgFit(b),
    reuseRatioDelta: a.reuseRatio - b.reuseRatio,
  }
}

/**
 * Build dual-path blueprints (best-fit and estate-optimized) for a use case
 * given the customer's technology estate.
 */
export function generateBlueprints(input: UseCaseInput, estate: TechnologyEstate): BlueprintResult {
  const archetype = input.archetypeId ? ARCHETYPE_BY_ID[input.archetypeId] ?? null : null
  const capabilities = resolveRequiredCapabilities(input)
  const sovereigntyRequired = input.sovereigntyRequired ?? estate.sovereigntyRequired

  const bestFitComponents = buildComponents(capabilities, (cap) => ({
    service: pickBestFit(cap, estate, sovereigntyRequired),
    reused: false,
  })).map((c) => ({
    ...c,
    // Mark reused even in best-fit when the chosen service happens to be in the estate.
    reused: !!c.service && estate.ownedServiceIds.includes(c.service.id),
  }))

  const estateComponents = buildComponents(capabilities, (cap) =>
    pickEstateOptimized(cap, estate, sovereigntyRequired),
  )

  const bestFit = summarize('best-fit', bestFitComponents)
  const estateOptimized = summarize('estate-optimized', estateComponents)

  return {
    useCase: input,
    archetype,
    bestFit,
    estateOptimized,
    delta: diff(bestFit, estateOptimized),
    generatedAt: Date.now(),
  }
}
