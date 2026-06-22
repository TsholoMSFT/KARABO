import { describe, it, expect } from 'vitest'
import {
  PORTFOLIO_SEED,
  companyEntities,
  publicSectorEntities,
  effectiveTicker,
} from '../portfolio-seed'

describe('portfolio-seed', () => {
  it('contains all 32 seeded entities with unique ids', () => {
    expect(PORTFOLIO_SEED).toHaveLength(32)
    const ids = PORTFOLIO_SEED.map((e) => e.id)
    expect(new Set(ids).size).toBe(32)
  })

  it('splits into 21 company entities and 11 public-sector entities', () => {
    expect(companyEntities()).toHaveLength(21)
    expect(publicSectorEntities()).toHaveLength(11)
  })

  it('gives every public company a ticker', () => {
    const publicCos = PORTFOLIO_SEED.filter((e) => e.entityType === 'public-company')
    expect(publicCos.length).toBeGreaterThan(0)
    for (const co of publicCos) {
      expect(co.ticker, `${co.name} should have a ticker`).toBeTruthy()
    }
  })

  it('resolves financials via the listed parent for subsidiaries/private firms', () => {
    const anglo = PORTFOLIO_SEED.find((e) => e.id === 'seed-anglo-corp')!
    expect(anglo.entityType).toBe('private-company')
    expect(anglo.ticker).toBeUndefined()
    expect(effectiveTicker(anglo)).toBe('AGL.JO')
  })

  it('tags public-sector entities with an audit framework and tier', () => {
    for (const gov of publicSectorEntities()) {
      expect(gov.auditFramework, `${gov.name}`).toBeTruthy()
      expect(gov.publicSectorTier, `${gov.name}`).toBeTruthy()
    }
    const cct = PORTFOLIO_SEED.find((e) => e.id === 'seed-cct')!
    expect(cct.auditFramework).toBe('MFMA')
  })
})
