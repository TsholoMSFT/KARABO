import { describe, it, expect } from 'vitest'
import {
  classifyPressureHeuristic,
  normalizePressureThemes,
  normalizeAuditThemes,
  normalizeCommitments,
  generateBriefingAgenda,
  mapPressureThemesToUseCases,
  mapAuditThemesToUseCases,
} from '../theme-engine'

describe('theme-engine: classifyPressureHeuristic', () => {
  it('classifies SA-specific and common pressures', () => {
    expect(classifyPressureHeuristic('Severe load-shedding hurt output')).toBe('energy-security')
    expect(classifyPressureHeuristic('a ransomware attack disrupted ops')).toBe('cyber-resilience')
    expect(classifyPressureHeuristic('persistent margin pressure from inflation')).toBe('margin-cost')
    expect(classifyPressureHeuristic('customer churn rose this quarter')).toBe('customer')
    expect(classifyPressureHeuristic('something unrelated entirely')).toBe('digital')
  })
})

describe('theme-engine: normalizePressureThemes', () => {
  it('assigns id, track and solution area from category', () => {
    const [t] = normalizePressureThemes([
      { title: 'Cost discipline', category: 'margin-cost', description: 'Cutting costs', severity: 4 },
    ])
    expect(t.id).toBeTruthy()
    expect(t.briefingTrack).toBe('D')
    expect(t.solutionArea).toBe('data-ai')
    expect(t.severity).toBe(4)
    expect(t.createdAt).toBeGreaterThan(0)
  })

  it('falls back to heuristic when category is invalid', () => {
    const [t] = normalizePressureThemes([
      { title: 'Power crisis', category: 'not-a-category', description: 'load-shedding impact' },
    ])
    expect(t.category).toBe('energy-security')
    expect(t.briefingTrack).toBe('A')
    expect(t.solutionArea).toBe('security')
  })

  it('skips items without a title and clamps severity', () => {
    const out = normalizePressureThemes([
      { description: 'no title' },
      { title: 'Growth', category: 'growth', severity: 99 },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].severity).toBe(5)
  })
})

describe('theme-engine: normalizeAuditThemes', () => {
  it('requires a valid T-category and maps the track', () => {
    const out = normalizeAuditThemes([
      { title: 'Weak IT controls', category: 'T5-it-controls', description: 'gaps', auditOutcome: 'Qualified' },
      { title: 'Invalid', category: 'T99-bogus' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].briefingTrack).toBe('A')
    expect(out[0].solutionArea).toBe('security')
    expect(out[0].auditOutcome).toBe('Qualified')
  })
})

describe('theme-engine: normalizeCommitments', () => {
  it('accepts statement/commitment/directive keys and defaults status', () => {
    const out = normalizeCommitments(
      [
        { commitment: 'Reduce net debt by FY26', executive: 'CFO' },
        { directive: 'Implement remedial action plan', issuedBy: 'AGSA' },
        { nothing: true },
      ],
      'management-commitment',
    )
    expect(out).toHaveLength(2)
    expect(out[0].statement).toContain('net debt')
    expect(out[0].source).toBe('CFO')
    expect(out[0].kind).toBe('management-commitment')
    expect(out[0].status).toBe('unknown')
  })
})

describe('theme-engine: generateBriefingAgenda', () => {
  it('builds welcome + scene + only the tracks present, with linked themes', () => {
    const themes = [
      { id: 'a1', title: 'Cyber', briefingTrack: 'A' as const },
      { id: 'd1', title: 'Growth', briefingTrack: 'D' as const },
    ]
    const agenda = generateBriefingAgenda(themes, { companyName: 'Acme', entityType: 'public-company' })
    const trackTitles = agenda.sessions.map((s) => s.title)
    expect(trackTitles).toContain('Arrival & welcome')
    expect(trackTitles.some((t) => t.startsWith('Track A'))).toBe(true)
    expect(trackTitles.some((t) => t.startsWith('Track D'))).toBe(true)
    expect(trackTitles.some((t) => t.startsWith('Track B'))).toBe(false)
    const trackA = agenda.sessions.find((s) => s.briefingTrack === 'A')!
    expect(trackA.linkedThemeIds).toEqual(['a1'])
  })

  it('uses entity-aware gov label for track D', () => {
    const agenda = generateBriefingAgenda([{ id: 'x', title: 'Data integrity', briefingTrack: 'D' }], {
      companyName: 'City of Cape Town',
      entityType: 'government',
    })
    const trackD = agenda.sessions.find((s) => s.briefingTrack === 'D')!
    expect(trackD.title).toContain('AI for Accountability')
  })

  it('inserts a networking break when more than two tracks are present', () => {
    const themes = [
      { id: '1', title: 'A', briefingTrack: 'A' as const },
      { id: '2', title: 'B', briefingTrack: 'B' as const },
      { id: '3', title: 'C', briefingTrack: 'C' as const },
    ]
    const agenda = generateBriefingAgenda(themes, { companyName: 'Acme' })
    expect(agenda.sessions.some((s) => s.title === 'Networking break')).toBe(true)
  })
})

describe('theme-engine: theme -> use-case mapping', () => {
  it('maps pressure themes to use cases with track-aligned Azure services', () => {
    const themes = normalizePressureThemes([
      { title: 'Cyber resilience', category: 'cyber-resilience', description: 'x' },
    ])
    const [row] = mapPressureThemesToUseCases(themes)
    expect(row.briefingTrack).toBe('A')
    expect(row.solutionArea).toBe('security')
    expect(row.customerUseCase).toContain('Zero Trust')
    expect(row.azureServices).toContain('Microsoft Sentinel')
    expect(row.outcome).toBeTruthy()
  })

  it('maps audit themes to use cases per the AGSA mapping', () => {
    const themes = normalizeAuditThemes([
      { title: 'Irregular expenditure', category: 'T1-irregular-expenditure', description: 'x' },
      { title: 'Failed ICT', category: 'T9-failed-ict-projects', description: 'y' },
    ])
    const rows = mapAuditThemesToUseCases(themes)
    expect(rows).toHaveLength(2)
    expect(rows[0].briefingTrack).toBe('B')
    expect(rows[0].customerUseCase).toContain('financial data platform')
    expect(rows[1].briefingTrack).toBe('E')
    expect(rows[1].azureServices).toContain('Azure DevOps')
  })
})
