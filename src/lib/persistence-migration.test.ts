import { beforeEach, describe, expect, it } from 'vitest'
import { persistenceMigrationKeys, runPersistenceMigration, sanitizeLegacyData } from './persistence-migration'

describe('persistence migration', () => {
  beforeEach(() => localStorage.clear())

  it('recursively removes financial and sovereign fields while preserving discovery data', () => {
    const migrated = sanitizeLegacyData({
      id: 'session-1',
      responses: [{ questionId: 'q1', answer: 'Keep this' }, { questionId: 'ai-sec-q6', answer: 'Remove this' }],
      useCases: [{ id: 'u1', title: 'Keep', costOfInaction: { totalAnnualCOI: 10 }, runCost: { totalAnnualUSD: 5 } }],
      sovereignCloudAssessment: { mandateLevel: 'required' },
      aiGovernanceAssessment: { overallScore: 70 },
      companyInsights: [{ title: 'Keep research' }],
    })

    expect(migrated).toEqual({
      id: 'session-1',
      responses: [{ questionId: 'q1', answer: 'Keep this' }],
      useCases: [{ id: 'u1', title: 'Keep' }],
      aiGovernanceAssessment: { overallScore: 70 },
      companyInsights: [{ title: 'Keep research' }],
    })
  })

  it('migrates known stores and removes DUCE and questionnaire local data once', () => {
    localStorage.setItem('use-cases', JSON.stringify([{ id: 'u1', expectedValue: { totalAnnualValue: 10 } }]))
    localStorage.setItem('duce-sessions', '{"session":{}}')
    localStorage.setItem('duce-user-mode', 'technical')
    localStorage.setItem('questionnaire-links', '[]')
    localStorage.setItem('karabo:q:token', '{"answers":{}}')

    expect(runPersistenceMigration()).toBe(true)
    expect(JSON.parse(localStorage.getItem('use-cases') || '[]')).toEqual([{ id: 'u1' }])
    expect(localStorage.getItem('duce-sessions')).toBeNull()
    expect(localStorage.getItem('duce-user-mode')).toBeNull()
    expect(localStorage.getItem('questionnaire-links')).toBeNull()
    expect(localStorage.getItem('karabo:q:token')).toBeNull()
    expect(localStorage.getItem(persistenceMigrationKeys.backup)).toBeTruthy()
    expect(runPersistenceMigration()).toBe(false)
  })
})