import { describe, expect, it } from 'vitest'
import { clipDiscoveryNotes } from './ai-input-limits'

describe('clipDiscoveryNotes', () => {
  it('leaves notes within the limit unchanged', () => {
    expect(clipDiscoveryNotes('short discovery notes', 100)).toBe('short discovery notes')
  })

  it('retains the original prefix so source offsets remain valid', () => {
    const notes = '0123456789abcdefghij'
    const clipped = clipDiscoveryNotes(notes, 10)

    expect(clipped.startsWith('0123456789')).toBe(true)
    expect(clipped).toContain('Notes truncated')
    expect(clipped).not.toContain('abcdefghij')
  })
})
