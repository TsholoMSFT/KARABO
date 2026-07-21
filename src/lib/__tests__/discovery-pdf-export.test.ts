import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  exportToPDF: vi.fn(),
}))

vi.mock('../pdf-export', () => ({
  exportToPDF: mocks.exportToPDF,
}))

import { exportDiscoveryReportToPDF } from '../discovery-pdf-export'

describe('Discovery PDF export', () => {
  beforeEach(() => {
    mocks.exportToPDF.mockReset()
    mocks.exportToPDF.mockResolvedValue(undefined)
  })

  it('exports every use case in ranked order without COI sections', async () => {
    await exportDiscoveryReportToPDF({
      customerMetadata: {
        customerName: 'ABSA',
        primaryStakeholder: 'Business Sponsor',
        accountTeamRep: 'Account Executive',
        innovationHubLocation: 'Johannesburg',
        solutionEngineer: 'Solution Engineer',
        executiveSummary: 'Prioritize responsible AI use cases with measurable value.',
      },
      useCases: [
        {
          id: 'rank-1',
          title: 'Intelligent Fraud Investigation',
          description: 'Assemble explainable fraud evidence for human review.',
          impact: 9,
          feasibility: 8,
          rice: { reach: 1200, impact: 3, confidence: 90, effort: 8 },
          kpis: ['Investigation cycle time'],
        },
        {
          id: 'rank-2',
          title: 'Contact Centre Guidance',
          description: 'Give agents grounded next-best-action guidance.',
          impact: 8,
          feasibility: 8,
          rice: { reach: 900, impact: 2, confidence: 85, effort: 6 },
        },
        {
          id: 'rank-3',
          title: 'Document Intelligence',
          description: 'Extract and validate customer document data.',
          aiEffortEstimate: {
            effortWeeks: 5,
            reasoning: 'Uses managed document extraction services.',
            estimatedAt: 1,
          },
        },
      ],
    }, 'man-hours')

    expect(mocks.exportToPDF).toHaveBeenCalledOnce()
    const [allUseCases, topUseCases, scoringMethod, options] = mocks.exportToPDF.mock.calls[0]

    expect(allUseCases.map((useCase: { title: string }) => useCase.title)).toEqual([
      'Intelligent Fraud Investigation',
      'Contact Centre Guidance',
      'Document Intelligence',
    ])
    expect(topUseCases).toEqual(allUseCases)
    expect(allUseCases[2].rice.effort).toBe(5)
    expect(scoringMethod).toBe('rice')
    expect(options).toMatchObject({
      effortUnit: 'man-hours',
      includeCOI: false,
      includeExpectedValue: true,
      includeDataSources: true,
    })
  })
})