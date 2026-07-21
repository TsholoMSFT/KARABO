import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiscoverySession } from '@/lib/types'

const { requestUseCaseCandidates } = vi.hoisted(() => ({
  requestUseCaseCandidates: vi.fn(),
}))

vi.mock('@/lib/use-case-generation-service', () => ({
  generateUseCaseCandidates: requestUseCaseCandidates,
}))

vi.mock('@/components/EnhancedDiscoveryWorkflow', () => ({
  EnhancedDiscoveryWorkflow: () => null,
}))

vi.mock('@/components/EngagementPrepCard', () => ({
  EngagementPrepCard: () => null,
}))

import { DiscoveryResults } from '@/components/DiscoveryResults'

const session: DiscoverySession = {
  id: 'discovery-1',
  customerId: 'customer-1',
  customerName: 'ABSA',
  name: 'ABSA Discovery',
  industry: 'financial-services',
  innovationHubLocation: 'Johannesburg, South Africa',
  solutionEngineer: 'Sam Patel',
  accountTeamRep: 'Alex Morgan',
  primaryStakeholder: 'Naledi Khumalo',
  responses: [{ questionId: 'challenge', answer: 'High fraud false positives.' }],
  suggestedUseCases: [{
    title: 'Fraud-alert triage',
    description: 'Prioritize fraud alerts for investigators.',
    rationale: 'Reduce false positives and investigation time.',
    dataSources: ['discovery', 'ai-generated'],
  }],
  useCaseGeneration: {
    mode: 'ai',
    provider: 'azure-openai',
    model: 'gpt-4o-mini',
    deployment: 'gpt-5.4-mini',
    generatedAt: 2,
  },
  createdAt: 1,
}

describe('DiscoveryResults persisted sessions', () => {
  beforeEach(() => {
    localStorage.clear()
    requestUseCaseCandidates.mockClear()
  })

  it('renders saved candidates without regenerating them', async () => {
    render(
      <DiscoveryResults
        session={session}
        onCreateUseCases={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(await screen.findByRole('heading', { name: '1 Use Cases Identified' })).toBeInTheDocument()
    expect(screen.queryByText('Analyzing Your Responses')).not.toBeInTheDocument()
    expect(requestUseCaseCandidates).not.toHaveBeenCalled()
  })
})