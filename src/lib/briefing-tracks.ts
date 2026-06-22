/**
 * Briefing tracks (A–E) — the Innovation Hub session lens layered over Azure
 * solution areas. Labels are entity-aware: public-sector engagements use the
 * audit/accountability-oriented variants; companies use growth-oriented ones.
 *
 * Mapping rubric is derived from the audit-failure -> Azure use-case mapping
 * and reused for company pressure themes.
 */
import type {
  BriefingTrackId,
  SolutionArea,
  EntityType,
  PressureThemeCategory,
  AuditThemeCategory,
} from './types'

export interface BriefingTrackMeta {
  id: BriefingTrackId
  /** Default (company) label. */
  label: string
  /** Public-sector label variant. */
  govLabel: string
  /** Primary Azure solution area for this track. */
  solutionArea: SolutionArea
  /** Solution areas this track spans. */
  solutionAreas: SolutionArea[]
  /** Short description of the track's focus. */
  focus: string
  /** Representative Azure / Microsoft services demoed in this track. */
  azureServices: string[]
}

export const BRIEFING_TRACKS: Record<BriefingTrackId, BriefingTrackMeta> = {
  A: {
    id: 'A',
    label: 'Secure & Resilient Foundations',
    govLabel: 'Secure & Resilient Foundations',
    solutionArea: 'security',
    solutionAreas: ['security', 'infrastructure'],
    focus:
      'Zero Trust identity, unified SIEM/XDR, vulnerability & patch management, tested cloud backup and DR.',
    azureServices: [
      'Microsoft Entra ID',
      'Microsoft Sentinel',
      'Defender XDR',
      'Defender for Cloud',
      'Azure Backup',
      'Azure Site Recovery',
    ],
  },
  B: {
    id: 'B',
    label: 'Trusted Data & Financial Integrity',
    govLabel: 'Trusted Data & Financial Integrity',
    solutionArea: 'data-ai',
    solutionAreas: ['data-ai'],
    focus:
      'Governed financial/operational data platform with automated reconciliation and continuous close.',
    azureServices: ['Microsoft Fabric', 'Azure SQL', 'Azure Synapse', 'Microsoft Purview', 'Dataverse'],
  },
  C: {
    id: 'C',
    label: 'Transparency & Insight',
    govLabel: 'Transparency & Oversight',
    solutionArea: 'data-ai',
    solutionAreas: ['data-ai'],
    focus:
      'Accountability & performance dashboards with data lineage for credible, auditable reporting.',
    azureServices: ['Power BI', 'Microsoft Fabric', 'Microsoft Purview', 'Azure SQL'],
  },
  D: {
    id: 'D',
    label: 'AI for Growth & Efficiency',
    govLabel: 'AI for Accountability',
    solutionArea: 'data-ai',
    solutionAreas: ['data-ai'],
    focus:
      'Anomaly detection on spend/operations, eligibility/risk verification, and Copilot for frontline and casework.',
    azureServices: [
      'Azure AI',
      'Azure OpenAI',
      'Microsoft Copilot',
      'Power Automate',
      'Azure AI Anomaly Detector',
    ],
  },
  E: {
    id: 'E',
    label: 'Modern Apps & Delivery',
    govLabel: 'Modern Apps & Delivery',
    solutionArea: 'digital-app-innovation',
    solutionAreas: ['digital-app-innovation', 'biz-apps'],
    focus:
      'Product-led delivery with DevOps, low-code case management, and FinOps/licence optimisation.',
    azureServices: [
      'Azure DevOps',
      'GitHub',
      'Power Platform',
      'Dataverse',
      'Azure App Service',
      'Azure Cost Management',
    ],
  },
}

export const BRIEFING_TRACK_ORDER: BriefingTrackId[] = ['A', 'B', 'C', 'D', 'E']

/** Entity-aware track label. Public sector uses the audit-oriented variants. */
export function getBriefingTrackLabel(id: BriefingTrackId, entityType?: EntityType): string {
  const t = BRIEFING_TRACKS[id]
  return entityType === 'government' ? t.govLabel : t.label
}

/** Company pressure-theme category -> briefing track. */
const PRESSURE_THEME_TRACK: Record<PressureThemeCategory, BriefingTrackId> = {
  growth: 'D',
  'margin-cost': 'D',
  digital: 'E',
  customer: 'E',
  'supply-chain': 'D',
  'data-analytics': 'B',
  'cyber-resilience': 'A',
  workforce: 'E',
  'regulatory-esg': 'C',
  'm-and-a': 'B',
  competition: 'D',
  'energy-security': 'A',
}

/** AGSA audit-theme (T1–T11) -> briefing track (from audit -> use-case mapping). */
const AUDIT_THEME_TRACK: Record<AuditThemeCategory, BriefingTrackId> = {
  'T1-irregular-expenditure': 'B',
  'T2-consequence-mgmt': 'C',
  'T3-financial-misstatement': 'B',
  'T4-performance-reporting': 'C',
  'T5-it-controls': 'A',
  'T6-cybersecurity': 'A',
  'T7-backup-dr': 'A',
  'T8-legacy-infrastructure': 'A',
  'T9-failed-ict-projects': 'E',
  'T10-data-integrity': 'D',
  'T11-scm-case-backlog': 'E',
}

export function briefingTrackForPressureTheme(category: PressureThemeCategory): BriefingTrackId {
  return PRESSURE_THEME_TRACK[category]
}

export function briefingTrackForAuditTheme(category: AuditThemeCategory): BriefingTrackId {
  return AUDIT_THEME_TRACK[category]
}

export function solutionAreaForBriefingTrack(id: BriefingTrackId): SolutionArea {
  return BRIEFING_TRACKS[id].solutionArea
}

export function solutionAreaForPressureTheme(category: PressureThemeCategory): SolutionArea {
  return solutionAreaForBriefingTrack(briefingTrackForPressureTheme(category))
}

export function solutionAreaForAuditTheme(category: AuditThemeCategory): SolutionArea {
  return solutionAreaForBriefingTrack(briefingTrackForAuditTheme(category))
}
