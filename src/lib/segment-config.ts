/**
 * Segment-aware configuration
 *
 * Provides helpers that adapt the discovery experience for
 * Enterprise, Majors Growth, and SME & Commercial accounts.
 */

import type { AccountSegment } from './types'
import { ACCOUNT_SEGMENT_META } from './types'

// ── Discovery mode visibility ───────────────────────────────────────────────

export type DiscoveryTab = 'quick' | 'enterprise' | 'tools'

/** Which tabs are visible (and optionally badged) for each segment */
export interface TabConfig {
  id: DiscoveryTab
  visible: boolean
  badge?: string // e.g. "Advanced" on Strategic Assessment for Majors
}

export function getVisibleTabs(segment: AccountSegment): TabConfig[] {
  const meta = ACCOUNT_SEGMENT_META[segment]
  return [
    { id: 'quick', visible: true },
    {
      id: 'enterprise',
      visible: meta.showStrategicAssessment,
      badge: segment === 'majors-growth' ? 'Advanced' : undefined,
    },
    { id: 'tools', visible: true },
  ]
}

// ── Feature flags derived from segment ──────────────────────────────────────

export interface SegmentFeatures {
  /** Show full 5-dimension ATM breakdown vs. summary vs. hidden */
  atmScoring: 'full' | 'summary' | 'hidden'
  /** Show 3-statement financial model vs. simple ROI vs. hidden */
  financialModel: 'full' | 'simple' | 'hidden'
  /** Show full stakeholder grid vs. simplified contacts */
  stakeholderMapping: 'full' | 'simplified'
  /** Max number of guided discovery questions */
  maxQuestions: number
  /** Show Landing Zone / CAF / WAF deep assessments */
  showLandingZoneAssessment: boolean
  /** Show full regulatory deep-dive vs. top frameworks only */
  regulatoryDepth: 'full' | 'top-frameworks'
  /** Default number of use cases to generate */
  defaultUseCaseCount: number
  /** Show earnings / ticker integration */
  showEarningsIntegration: boolean
  /** Engagement timeline label shown in cards */
  engagementDuration: string
  /** Discovery card description override */
  discoveryDescription: string
  /** Strategic Assessment stage count (Enterprise=5, Majors=3, SME=0) */
  strategicAssessmentStages: number
}

export function getSegmentFeatures(segment: AccountSegment): SegmentFeatures {
  switch (segment) {
    case 'enterprise':
      return {
        atmScoring: 'full',
        financialModel: 'full',
        stakeholderMapping: 'full',
        maxQuestions: 8,
        showLandingZoneAssessment: true,
        regulatoryDepth: 'full',
        defaultUseCaseCount: 10,
        showEarningsIntegration: true,
        engagementDuration: '2–4 hours',
        discoveryDescription: 'AI-powered discovery with guided questions. Identify, validate, and prioritize use cases across the full Innovation Hub methodology.',
        strategicAssessmentStages: 5,
      }
    case 'majors-growth':
      return {
        atmScoring: 'summary',
        financialModel: 'simple',
        stakeholderMapping: 'simplified',
        maxQuestions: 5,
        showLandingZoneAssessment: false,
        regulatoryDepth: 'top-frameworks',
        defaultUseCaseCount: 5,
        showEarningsIntegration: false,
        engagementDuration: '30–60 min',
        discoveryDescription: 'Streamlined discovery focused on business value. Identify top use cases and build a quick business case.',
        strategicAssessmentStages: 3,
      }
    case 'smec':
      return {
        atmScoring: 'hidden',
        financialModel: 'hidden',
        stakeholderMapping: 'simplified',
        maxQuestions: 3,
        showLandingZoneAssessment: false,
        regulatoryDepth: 'top-frameworks',
        defaultUseCaseCount: 3,
        showEarningsIntegration: false,
        engagementDuration: '15–30 min',
        discoveryDescription: 'Rapid value assessment — answer a few focused questions and get actionable AI use-case recommendations.',
        strategicAssessmentStages: 0,
      }
  }
}

// ── Budget range helper ─────────────────────────────────────────────────────

export function getBudgetRanges(segment: AccountSegment): string[] {
  return ACCOUNT_SEGMENT_META[segment].budgetRanges
}

// ── Segment-aware label helpers ─────────────────────────────────────────────

export function getDiscoveryButtonLabel(segment: AccountSegment): string {
  switch (segment) {
    case 'enterprise': return 'Start Discovery'
    case 'majors-growth': return 'Start Discovery'
    case 'smec': return 'Quick Value Assessment'
  }
}

export function getStrategicAssessmentLabel(segment: AccountSegment): string {
  switch (segment) {
    case 'enterprise': return 'Strategic Assessment'
    case 'majors-growth': return 'Business Case Builder'
    case 'smec': return 'Strategic Assessment' // hidden but fallback
  }
}
