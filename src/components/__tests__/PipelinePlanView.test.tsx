import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelinePlanView, summarisePipelineRow } from '../PipelinePlanView'
import { PORTFOLIO_SEED } from '@/lib/portfolio-seed'
import { normalizePressureThemes, normalizeAuditThemes } from '@/lib/theme-engine'

const mtn = PORTFOLIO_SEED.find((e) => e.id === 'seed-mtn')!
const eskom = PORTFOLIO_SEED.find((e) => e.id === 'seed-eskom')!

describe('summarisePipelineRow', () => {
  it('summarises a company row from pressure themes', () => {
    const pressureThemes = normalizePressureThemes([
      { title: 'Network resilience', category: 'cyber-resilience', description: 'x' },
      { title: 'Cost discipline', category: 'margin-cost', description: 'y' },
    ])
    const row = summarisePipelineRow(mtn, { pressureThemes })
    expect(row.isGov).toBe(false)
    expect(row.generated).toBe(true)
    expect(row.ticker).toBe('MTN.JO')
    expect(row.themeCount).toBe(2)
    expect(row.reportingMilestone).toBe('Interim / final results')
    expect(row.leadSolutionArea).toBeDefined()
    expect(row.primaryTrack).toBeDefined()
  })

  it('summarises a public-sector row from audit themes', () => {
    const auditThemes = normalizeAuditThemes([
      { title: 'Weak IT controls', category: 'T5-it-controls', description: 'x' },
    ])
    const row = summarisePipelineRow(eskom, { auditThemes })
    expect(row.isGov).toBe(true)
    expect(row.ticker).toBeUndefined()
    expect(row.tier).toBe('SOE (Schedule 2)')
    expect(row.reportingMilestone).toContain('PFMA')
    expect(row.primaryTrack).toBe('A')
  })

  it('marks an ungenerated row with placeholder signal', () => {
    const row = summarisePipelineRow(mtn, undefined)
    expect(row.generated).toBe(false)
    expect(row.riskSignal).toBe('—')
    expect(row.nextStep).toContain('Gather signals')
  })
})

describe('PipelinePlanView render', () => {
  it('renders the portfolio with company and public-sector counts', () => {
    render(<PipelinePlanView />)
    expect(screen.getByText('Pipeline Plan')).toBeTruthy()
    expect(screen.getByText('21 companies')).toBeTruthy()
    expect(screen.getByText('11 public sector')).toBeTruthy()
    // a known company and a known public-sector entity both render
    expect(screen.getByText('MTN')).toBeTruthy()
    expect(screen.getByText('Eskom')).toBeTruthy()
  })
})
