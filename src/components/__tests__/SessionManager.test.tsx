import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiscoverySession } from '@/lib/types'
import { SessionManager } from '@/components/SessionManager'

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
  responses: [],
  createdAt: 1,
}

describe('SessionManager', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('discovery-sessions', JSON.stringify([session]))
  })

  it('opens after an initially closed render without changing hook order', () => {
    const props = {
      onOpenChange: vi.fn(),
      onViewSession: vi.fn(),
      onCompareSessions: vi.fn(),
    }
    const { rerender } = render(<SessionManager open={false} {...props} />)

    rerender(<SessionManager open {...props} />)

    expect(screen.getByText('View, manage, and compare your saved discovery sessions')).toBeInTheDocument()
    expect(screen.getByText('ABSA Discovery')).toBeInTheDocument()
  })
})