import { describe, it, expect } from 'vitest'
import {
  pipelinePlanSheet, themesSheet, mappingSheet, commitmentsSheet, type IntelMap,
} from '../excel-export'
import { PORTFOLIO_SEED } from '../portfolio-seed'
import { normalizePressureThemes, normalizeAuditThemes } from '../theme-engine'

const mtn = PORTFOLIO_SEED.find((e) => e.id === 'seed-mtn')!
const eskom = PORTFOLIO_SEED.find((e) => e.id === 'seed-eskom')!

const intel: IntelMap = {
  [mtn.id]: {
    pressureThemes: normalizePressureThemes([
      { title: 'Network resilience', category: 'cyber-resilience', description: 'x', evidence: 'quote' },
      { title: 'Cost discipline', category: 'margin-cost', description: 'y' },
    ]),
    commitments: [
      { id: 'c1', kind: 'management-commitment', statement: 'Cut costs 10% by FY26', timeframe: 'FY26', createdAt: 1 },
    ],
  },
  [eskom.id]: {
    auditThemes: normalizeAuditThemes([
      { title: 'Weak IT controls', category: 'T5-it-controls', description: 'x', auditOutcome: 'Qualified' },
    ]),
  },
}

describe('excel-export sheet builders', () => {
  it('pipelinePlanSheet has a header and one row per entity', () => {
    const sheet = pipelinePlanSheet(PORTFOLIO_SEED, {})
    expect(sheet[0][0]).toMatchObject({ value: 'Account', fontWeight: 'bold' })
    expect(sheet).toHaveLength(PORTFOLIO_SEED.length + 1)
  })

  it('pipelinePlanSheet fills themes and use cases from intel', () => {
    const sheet = pipelinePlanSheet([mtn], intel)
    const row = sheet[1].map((c) => c.value)
    expect(row[0]).toBe('MTN')
    expect(String(row[7])).toContain('Network resilience') // Primary Themes
    expect(String(row[8])).toContain('Zero Trust') // Recommended Use Cases (from cyber theme)
  })

  it('themesSheet emits one row per theme with category label', () => {
    const sheet = themesSheet([mtn, eskom], intel)
    expect(sheet).toHaveLength(1 + 3) // header + 2 MTN + 1 Eskom
    const eskomRow = sheet.find((r) => r[0].value === 'Eskom')!
    expect(String(eskomRow[2].value)).toContain('T5')
    expect(eskomRow[6].value).toBe('Qualified') // audit outcome
  })

  it('mappingSheet maps each theme to a use case with Azure services', () => {
    const sheet = mappingSheet([mtn], intel)
    expect(sheet.length).toBe(1 + 2)
    const cyberRow = sheet.find((r) => String(r[5].value).includes('Sentinel'))
    expect(cyberRow).toBeTruthy()
  })

  it('commitmentsSheet lists commitments', () => {
    const sheet = commitmentsSheet([mtn], intel)
    expect(sheet).toHaveLength(1 + 1)
    expect(sheet[1][1].value).toBe('Management Commitment')
    expect(String(sheet[1][2].value)).toContain('Cut costs')
  })
})
