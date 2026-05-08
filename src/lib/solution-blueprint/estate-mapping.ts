/**
 * Bidirectional mapping between assessment-shaped data and the canonical
 * TechnologyEstate model used by Solution Blueprint.
 *
 * The estate is the customer-scoped source of truth for cloud footprint,
 * identity posture, and security controls. SovereignCloudWorkflow and
 * LandingZoneAssessment are *views* over the same underlying state.
 *
 * Direction:
 *  - `estateFromLandingZone(...)` / `estateFromSovereign(...)` produce a
 *    partial estate patch from an assessment.
 *  - `landingZoneFromEstate(...)` / `sovereignSeedFromEstate(...)` produce
 *    seed values for the assessment forms.
 */

import type { LandingZoneReadiness, SovereignCloudTrackAssessment } from '@/lib/types'
import type { TechnologyEstate } from './types'

// ── Estate ← Landing Zone ────────────────────────────────────────

export function estateFromLandingZone(lz: LandingZoneReadiness): Partial<TechnologyEstate> {
  return {
    hasAzure: true,
    primaryCloud: 'azure',
    hasPrivateEndpoints: !!lz.privateEndpoints,
    sovereigntyRequired: !!lz.sovereignCloudRequired,
  }
}

// ── Estate ← Sovereign Cloud Track ───────────────────────────────

export function estateFromSovereign(s: SovereignCloudTrackAssessment): Partial<TechnologyEstate> {
  const patch: Partial<TechnologyEstate> = {
    sovereigntyRequired: s.mandateLevel !== 'none',
    sovereignProfile: s.cloudEnvironment ?? undefined,
    primaryCloud: 'azure',
    hasAzure: true,
  }
  if (s.recommendedRegions?.length) {
    patch.azureRegions = [...s.recommendedRegions]
  }
  if (s.landingZoneReadiness) {
    Object.assign(patch, estateFromLandingZone(s.landingZoneReadiness))
    // Re-apply sovereign-specific signal so it isn't clobbered.
    patch.sovereigntyRequired = s.mandateLevel !== 'none'
  }
  return patch
}

// ── Landing Zone ← Estate ────────────────────────────────────────

export function landingZoneFromEstate(e: TechnologyEstate): Partial<LandingZoneReadiness> {
  return {
    hasAILandingZone: e.hasAzure && e.hasPrivateEndpoints && (e.azureRegions?.length ?? 0) > 0,
    privateEndpoints: e.hasPrivateEndpoints,
    sovereignCloudRequired: e.sovereigntyRequired,
    cloudEnvironment: e.sovereigntyRequired ? (e.sovereignProfile as LandingZoneReadiness['cloudEnvironment']) : undefined,
  }
}

// ── Sovereign Track ← Estate ─────────────────────────────────────

export function sovereignSeedFromEstate(e: TechnologyEstate): Partial<SovereignCloudTrackAssessment> {
  return {
    cloudEnvironment: (e.sovereignProfile as SovereignCloudTrackAssessment['cloudEnvironment']) ?? undefined,
    recommendedRegions: (e.azureRegions ?? []) as SovereignCloudTrackAssessment['recommendedRegions'],
    mandateLevel: e.sovereigntyRequired ? 'preferred' : 'none',
  }
}

// ── Merge helper ─────────────────────────────────────────────────

/** Merge a patch into an estate without dropping the empty array semantics. */
export function mergeEstate(base: TechnologyEstate, patch: Partial<TechnologyEstate>): TechnologyEstate {
  return { ...base, ...patch, updatedAt: Date.now() }
}
