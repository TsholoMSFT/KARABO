/**
 * Portfolio seed — the 32 South African accounts that pre-populate the Pipeline
 * Plan. A mix of JSE-listed companies (earnings/financials path), private
 * companies (paste/upload path) and public-sector entities (AGSA audit path).
 *
 * These are identity/metadata records only — themes, use cases and pipeline
 * detail are generated live per entity, never hardcoded.
 */
import type { EntityType, Industry } from './types'

export type AuditFramework = 'PFMA' | 'MFMA'

export interface PortfolioSeedEntity {
  id: string
  name: string
  entityType: EntityType
  industry: Industry
  /** Exchange ticker for public companies (used for auto-fetch). */
  ticker?: string
  region: 'ZA'
  /** Public-sector audit framework. */
  auditFramework?: AuditFramework
  /** Public-sector tier descriptor (shown in the pipeline "Tier" column). */
  publicSectorTier?: string
  /** SOEs that publish annual financials / bond disclosures. */
  financialReportsAvailable?: boolean
  /** Listed parent whose ticker provides financials for a subsidiary. */
  financialsViaTicker?: string
}

export const PORTFOLIO_SEED: PortfolioSeedEntity[] = [
  // ── Public companies (JSE-listed) — earnings/financials path ──────────────
  { id: 'seed-arm', name: 'African Rainbow Minerals', entityType: 'public-company', industry: 'mining-resources', ticker: 'ARI.JO', region: 'ZA' },
  { id: 'seed-alexforbes', name: 'Alexander Forbes', entityType: 'public-company', industry: 'financial-services', ticker: 'AFH.JO', region: 'ZA' },
  { id: 'seed-anglogold', name: 'AngloGold Ashanti', entityType: 'public-company', industry: 'mining-resources', ticker: 'ANG.JO', region: 'ZA' },
  { id: 'seed-premier', name: 'Premier FMCG', entityType: 'public-company', industry: 'manufacturing', ticker: 'PMR.JO', region: 'ZA' },
  { id: 'seed-sun', name: 'Sun International', entityType: 'public-company', industry: 'general', ticker: 'SUI.JO', region: 'ZA' },
  { id: 'seed-spar', name: 'The SPAR Group', entityType: 'public-company', industry: 'retail', ticker: 'SPP.JO', region: 'ZA' },
  { id: 'seed-woolworths', name: 'Woolworths', entityType: 'public-company', industry: 'retail', ticker: 'WHL.JO', region: 'ZA' },
  { id: 'seed-absa', name: 'ABSA', entityType: 'public-company', industry: 'financial-services', ticker: 'ABG.JO', region: 'ZA' },
  { id: 'seed-shoprite', name: 'Shoprite Checkers', entityType: 'public-company', industry: 'retail', ticker: 'SHP.JO', region: 'ZA' },
  { id: 'seed-telkom', name: 'Telkom SA', entityType: 'public-company', industry: 'telecommunications', ticker: 'TKG.JO', region: 'ZA' },
  { id: 'seed-discovery-health', name: 'Discovery Health', entityType: 'public-company', industry: 'healthcare', ticker: 'DSY.JO', region: 'ZA', financialsViaTicker: 'DSY.JO' },
  { id: 'seed-firstrand', name: 'FirstRand Bank', entityType: 'public-company', industry: 'financial-services', ticker: 'FSR.JO', region: 'ZA', financialsViaTicker: 'FSR.JO' },
  { id: 'seed-investec', name: 'Investec SA', entityType: 'public-company', industry: 'financial-services', ticker: 'INL.JO', region: 'ZA' },
  { id: 'seed-mtn', name: 'MTN', entityType: 'public-company', industry: 'telecommunications', ticker: 'MTN.JO', region: 'ZA' },
  { id: 'seed-nedbank', name: 'Nedbank', entityType: 'public-company', industry: 'financial-services', ticker: 'NED.JO', region: 'ZA' },
  { id: 'seed-sanlam', name: 'Sanlam', entityType: 'public-company', industry: 'financial-services', ticker: 'SLM.JO', region: 'ZA' },
  { id: 'seed-sasol', name: 'Sasol South Africa', entityType: 'public-company', industry: 'energy', ticker: 'SOL.JO', region: 'ZA', financialsViaTicker: 'SOL.JO' },
  { id: 'seed-standardbank', name: 'Standard Bank of SA', entityType: 'public-company', industry: 'financial-services', ticker: 'SBK.JO', region: 'ZA', financialsViaTicker: 'SBK.JO' },

  // ── Private companies — paste/upload path ─────────────────────────────────
  { id: 'seed-anglo-corp', name: 'Anglo Corporate Services', entityType: 'private-company', industry: 'mining-resources', region: 'ZA', financialsViaTicker: 'AGL.JO' },
  { id: 'seed-derivco', name: 'Derivco', entityType: 'private-company', industry: 'technology-software', region: 'ZA' },
  { id: 'seed-hollard', name: 'Hollard Holdings', entityType: 'private-company', industry: 'financial-services', region: 'ZA' },

  // ── Public sector — AGSA audit path ───────────────────────────────────────
  { id: 'seed-cct', name: 'City of Cape Town', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'MFMA', publicSectorTier: 'Metro Municipality' },
  { id: 'seed-coj', name: 'City of Johannesburg', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'MFMA', publicSectorTier: 'Metro Municipality' },
  { id: 'seed-ethekwini', name: 'eThekwini Municipality', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'MFMA', publicSectorTier: 'Metro Municipality' },
  { id: 'seed-ec-prov', name: 'Eastern Cape Provincial Govt', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'Provincial Government' },
  { id: 'seed-kzn-prov', name: 'KZN Provincial Govt', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'Provincial Government' },
  { id: 'seed-dws', name: 'National Department of Water & Sanitation', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'National Department' },
  { id: 'seed-dojcd', name: 'National Department of Justice & Constitutional Development', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'National Department' },
  { id: 'seed-sita', name: 'SITA', entityType: 'government', industry: 'technology-software', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'SOE (Schedule 3A)', financialReportsAvailable: true },
  { id: 'seed-transnet', name: 'Transnet', entityType: 'government', industry: 'general', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'SOE (Schedule 2)', financialReportsAvailable: true },
  { id: 'seed-eskom', name: 'Eskom', entityType: 'government', industry: 'energy', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'SOE (Schedule 2)', financialReportsAvailable: true },
  { id: 'seed-sars', name: 'SARS', entityType: 'government', industry: 'government', region: 'ZA', auditFramework: 'PFMA', publicSectorTier: 'National Public Entity', financialReportsAvailable: true },
]

/** Entities that follow the company (earnings/financials) intelligence path. */
export function companyEntities(): PortfolioSeedEntity[] {
  return PORTFOLIO_SEED.filter(
    (e) => e.entityType === 'public-company' || e.entityType === 'private-company',
  )
}

/** Entities that follow the public-sector (AGSA audit) intelligence path. */
export function publicSectorEntities(): PortfolioSeedEntity[] {
  return PORTFOLIO_SEED.filter((e) => e.entityType === 'government')
}

/** The ticker to use for financial auto-fetch (own ticker or listed parent). */
export function effectiveTicker(e: PortfolioSeedEntity): string | undefined {
  return e.ticker ?? e.financialsViaTicker
}
