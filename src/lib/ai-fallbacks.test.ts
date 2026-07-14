import { describe, expect, it } from 'vitest'
import { createFallbackEngagementCloseout, createFallbackFollowupEmail } from './ai-fallbacks'

describe('createFallbackFollowupEmail', () => {
  it('creates a complete draft from sparse context', () => {
    const email = createFallbackFollowupEmail({ customerName: 'Contoso' })

    expect(email.subject).toContain('Contoso')
    expect(email.bodyText).toContain('Hello Contoso team,')
    expect(email.bullets).toHaveLength(1)
    expect(email.callToAction).toContain('priorities, owners, and next steps')
    expect(email.bodyHtml).toContain('<ul><li>')
  })

  it('uses supplied facts and escapes them in HTML', () => {
    const email = createFallbackFollowupEmail({
      customerName: 'A&B <Group>',
      audience: 'Technical stakeholders',
      highlights: ['Validate <data> access'],
      useCases: [{ title: 'Customer & Agent Copilot' }],
    })

    expect(email.bullets).toEqual([
      'Validate <data> access',
      'Explore next steps for Customer & Agent Copilot',
    ])
    expect(email.bodyHtml).toContain('A&amp;B &lt;Group&gt;')
    expect(email.bodyHtml).toContain('Validate &lt;data&gt; access')
    expect(email.bodyHtml).not.toContain('Validate <data> access')
    expect(email.callToAction).toContain('technical follow-up')
  })
})

describe('createFallbackEngagementCloseout', () => {
  it('creates a reviewable closeout without inventing decisions or risks', () => {
    const closeout = createFallbackEngagementCloseout({
      customerName: 'Contoso',
      engagementType: 'Architecture workshop',
      useCases: [{ title: 'Claims assistant' }],
    })

    expect(closeout.summary).toContain('Claims assistant')
    expect(closeout.decisions[0]).toContain('No decisions were automatically extracted')
    expect(closeout.risks[0]).toContain('not automatically extracted')
    expect(closeout.actionItems[0].owner).toBe('Microsoft & Customer')
    expect(closeout.sentiment).toBe('neutral')
  })
})