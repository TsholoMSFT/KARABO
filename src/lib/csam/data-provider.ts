/**
 * CsamDataProvider seam.
 *
 * The cockpit reads all account / investment / usage / health data through
 * this interface so the source can change without reworking the UI:
 *   v1  — ManualProvider (locally stored)
 *   next — ServiceBackedProvider (existing free Functions: company-financials,
 *          economic-data, earnings, graph-query usage reports)
 *   later — MsxProvider (Dataverse), GraphUsageProvider (M365 usage),
 *           FabricProvider (telemetry) — gated on governance approval.
 */
import type { CsamCustomerProfile } from './types'
export type CsamProviderMode = 'manual' | 'service' | 'msx'

export interface CsamCustomerRef {
  customerId: string
  name: string
  source: CsamProviderMode
}

export interface CsamDataProvider {
  readonly id: CsamProviderMode
  readonly label: string
  /** True when this provider can actually serve data in the current build. */
  readonly available: boolean
  listCustomers(): Promise<CsamCustomerRef[]>
  getProfile(customerId: string): Promise<CsamCustomerProfile | null>
}

// ----------------------------------------------------------------------------
// Manual provider — backed by whatever the caller has persisted locally.
// The hook (use-csam) injects the stored profiles via setManualProfiles().
// ----------------------------------------------------------------------------

let manualProfiles: CsamCustomerProfile[] = []
export function setManualProfiles(profiles: CsamCustomerProfile[]): void {
  manualProfiles = profiles
}

export const manualProvider: CsamDataProvider = {
  id: 'manual',
  label: 'Manually entered',
  available: true,
  async listCustomers() {
    return manualProfiles.map((p) => ({ customerId: p.customerId, name: p.name, source: 'manual' as const }))
  },
  async getProfile(customerId) {
    return manualProfiles.find((p) => p.customerId === customerId) ?? null
  },
}

// ----------------------------------------------------------------------------
// Future providers — typed stubs so the wiring exists ahead of approval.
// ----------------------------------------------------------------------------

export const serviceBackedProvider: CsamDataProvider = {
  id: 'service',
  label: 'Existing services (financials / economic / earnings)',
  available: false,
  async listCustomers() {
    return []
  },
  async getProfile() {
    // Adapter to be implemented over /api/company-financials, /api/economic-data,
    // /api/earnings and /api/graph-query usage reports.
    return null
  },
}

export const msxProvider: CsamDataProvider = {
  id: 'msx',
  label: 'MSX (Dataverse) \u2014 pending governance approval',
  available: false,
  async listCustomers() {
    return []
  },
  async getProfile() {
    // Implemented once the MSX/MCAPS data platform team approves scoped,
    // delegated (on-behalf-of seller) read access. Honours row-level security.
    return null
  },
}

export const CSAM_PROVIDERS: CsamDataProvider[] = [
  manualProvider,
  serviceBackedProvider,
  msxProvider,
]

export function resolveProvider(mode: CsamProviderMode): CsamDataProvider {
  return CSAM_PROVIDERS.find((p) => p.id === mode) ?? manualProvider
}
