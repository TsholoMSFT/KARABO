import { describe, expect, it } from 'vitest'
import { agendaToMarkdown } from './format'

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