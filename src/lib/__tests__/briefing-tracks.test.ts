import { describe, it, expect } from 'vitest'
import {
  BRIEFING_TRACKS,
  BRIEFING_TRACK_ORDER,
  getBriefingTrackLabel,
  briefingTrackForAuditTheme,
  briefingTrackForPressureTheme,
  solutionAreaForBriefingTrack,
  solutionAreaForPressureTheme,
} from '../briefing-tracks'

describe('briefing-tracks', () => {
  it('exposes all five tracks in order', () => {
    expect(BRIEFING_TRACK_ORDER).toEqual(['A', 'B', 'C', 'D', 'E'])
    for (const id of BRIEFING_TRACK_ORDER) {
      expect(BRIEFING_TRACKS[id]).toBeDefined()
      expect(BRIEFING_TRACKS[id].azureServices.length).toBeGreaterThan(0)
    }
  })

  it('uses entity-aware labels for track D', () => {
    expect(getBriefingTrackLabel('D', 'public-company')).toBe('AI for Growth & Efficiency')
    expect(getBriefingTrackLabel('D', 'private-company')).toBe('AI for Growth & Efficiency')
    expect(getBriefingTrackLabel('D', 'government')).toBe('AI for Accountability')
    // default (no entity) -> company label
    expect(getBriefingTrackLabel('D')).toBe('AI for Growth & Efficiency')
  })

  it('maps AGSA audit themes to the right track (per attachment)', () => {
    expect(briefingTrackForAuditTheme('T5-it-controls')).toBe('A')
    expect(briefingTrackForAuditTheme('T6-cybersecurity')).toBe('A')
    expect(briefingTrackForAuditTheme('T8-legacy-infrastructure')).toBe('A')
    expect(briefingTrackForAuditTheme('T3-financial-misstatement')).toBe('B')
    expect(briefingTrackForAuditTheme('T4-performance-reporting')).toBe('C')
    expect(briefingTrackForAuditTheme('T10-data-integrity')).toBe('D')
    expect(briefingTrackForAuditTheme('T9-failed-ict-projects')).toBe('E')
  })

  it('maps company pressure themes to a track', () => {
    expect(briefingTrackForPressureTheme('cyber-resilience')).toBe('A')
    expect(briefingTrackForPressureTheme('energy-security')).toBe('A')
    expect(briefingTrackForPressureTheme('data-analytics')).toBe('B')
    expect(briefingTrackForPressureTheme('regulatory-esg')).toBe('C')
    expect(briefingTrackForPressureTheme('growth')).toBe('D')
    expect(briefingTrackForPressureTheme('digital')).toBe('E')
  })

  it('resolves a primary solution area per track', () => {
    expect(solutionAreaForBriefingTrack('A')).toBe('security')
    expect(solutionAreaForBriefingTrack('B')).toBe('data-ai')
    expect(solutionAreaForBriefingTrack('E')).toBe('digital-app-innovation')
    expect(solutionAreaForPressureTheme('cyber-resilience')).toBe('security')
  })
})
