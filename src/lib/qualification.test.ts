import { describe, expect, it } from 'vitest'
import { createEmptyBantQualification, summarizeBant, validateRaci } from './qualification'

describe('BANT qualification', () => {
  it('treats missing qualification as advisory unknown signals', () => {
    expect(summarizeBant()).toEqual({
      indication: 'unknown',
      confirmed: 0,
      weak: 0,
      unknown: 4,
      warnings: [
        'Budget is not yet evidenced.',
        'Authority is not yet evidenced.',
        'Need is not yet evidenced.',
        'Timeline is not yet evidenced.',
      ],
    })
  })

  it('reports ready only when all four signals are confirmed', () => {
    const bant = createEmptyBantQualification()
    bant.budget.status = 'confirmed'
    bant.authority.status = 'confirmed'
    bant.need.status = 'confirmed'
    bant.timeline.status = 'confirmed'

    expect(summarizeBant(bant)).toMatchObject({ indication: 'ready', confirmed: 4, warnings: [] })
  })

  it('uses attention for partial evidence without making it invalid', () => {
    const bant = createEmptyBantQualification()
    bant.need.status = 'confirmed'
    bant.budget.status = 'weak'

    expect(summarizeBant(bant)).toMatchObject({ indication: 'attention', confirmed: 1, weak: 1, unknown: 2 })
  })
})

describe('RACI validation', () => {
  it('keeps missing roles advisory', () => {
    expect(validateRaci()).toEqual({
      valid: true,
      warnings: [
        'No accountable stakeholder is assigned.',
        'No responsible stakeholder is assigned.',
      ],
    })
  })

  it('rejects multiple accountable stakeholders', () => {
    const result = validateRaci([
      { stakeholderId: 'one', role: 'accountable' },
      { stakeholderId: 'two', role: 'accountable' },
    ])

    expect(result.valid).toBe(false)
    expect(result.warnings).toContain('Only one accountable stakeholder can be assigned.')
  })

  it('accepts one accountable and multiple responsible stakeholders', () => {
    expect(validateRaci([
      { stakeholderId: 'one', role: 'accountable' },
      { stakeholderId: 'two', role: 'responsible' },
      { stakeholderId: 'three', role: 'responsible' },
    ])).toEqual({ valid: true, warnings: [] })
  })
})