import { describe, expect, it } from 'vitest'
import type { Customer, FrontierReadinessAssessment } from '@/lib/types'
import { buildAccountCustomerJourney } from '@/lib/frontier-ai/journey-builder'
import { accountJourneyToMarkdown, agendaToMarkdown } from './format'

describe('agendaToMarkdown', () => {
  it('renders agenda items as a table and escapes cell content', () => {
    const markdown = agendaToMarkdown({
      title: 'Customer session',
      durationMinutes: 60,
      objectives: ['Align on outcomes'],
      items: [
        { time: '09:00-09:15', topic: 'Goals | context', owner: 'Customer', description: 'Line one\nLine two' },
        { topic: 'Close' },
      ],
      nextSteps: ['Confirm owners'],
    }, 'Contoso')

    expect(markdown).toContain('| Time | Topic | Owner | Details |')
    expect(markdown).toContain('| 09:00-09:15 | Goals \\| context | Customer | Line one<br>Line two |')
    expect(markdown).toContain('|  | Close |  |  |')
    expect(markdown).toContain('## Next steps')
  })
})

describe('accountJourneyToMarkdown', () => {
  it('renders the customer journey contract and excludes draft/internal offering data', () => {
    const customer: Customer = {
      id: 'customer-1',
      name: 'Contoso',
      innovationHubSPOC: 'Hub lead',
      createdAt: 1,
    }
    const readiness: FrontierReadinessAssessment = {
      ratings: {
        ai_platform: 3,
        database_platform: 3,
        application_platform: 2,
        secure_the_solution: 2,
        secure_the_user: 2,
        m365_copilot: 1,
        copilot_chat: 1,
        copilot_studio: 1,
        github_copilot: 0,
      },
      evidence: { ai_platform: 'A governed AI platform is available.' },
      assessedAt: Date.UTC(2026, 7, 17),
    }
    const journey = buildAccountCustomerJourney({ customer, sessions: [], useCases: [], readiness, now: 1 })
    const markdown = accountJourneyToMarkdown(journey, [])

    expect(markdown).toContain('# Contoso Frontier AI Journey')
    expect(markdown).toContain('**Current maturity:** Scaling')
    expect(markdown).toContain('## Journey at a glance')
    expect(markdown).toContain('## Shared Foundation')
    expect(markdown).toContain('## Trusted Intelligence')
    expect(markdown).toContain('## Agentify Your Business')
    expect(markdown).toContain('**Customer value:**')
    expect(markdown).toContain('**Applied context:**')
    expect(markdown).toContain('**Customer commitments**')
    expect(markdown).toContain('**Success criteria**')
    expect(markdown).not.toContain('GitHub Copilot Developer Productivity Activation')
    expect(markdown).not.toMatch(/\bT[123]\b|ACR|MAU|MACC/)
  })
})