/**
 * CSAM cockpit guardrails (Section 14).
 *
 * Cross-cutting helpers that keep the cockpit honest:
 * - consistent confidence + colour states
 * - data-classification handling (vendor telemetry vs. customer data)
 * - "hypothesis to validate" framing for any unvalidated financial claim
 * - non-blaming, evidence-led language for AI-generated narratives
 */
import type {
  ColorState,
  CsamConfidence,
  DataClassification,
  ValidationStatus,
} from './types'

// ----------------------------------------------------------------------------
// Confidence
// ----------------------------------------------------------------------------

export const CONFIDENCE_ORDER: CsamConfidence[] = ['insufficient', 'low', 'medium', 'high']

export const CONFIDENCE_LABELS: Record<CsamConfidence, string> = {
  'insufficient': 'Insufficient evidence',
  'low': 'Low confidence',
  'medium': 'Medium confidence',
  'high': 'High confidence',
}

/** Derive a confidence band from how much of the expected evidence is present. */
export function confidenceFromCoverage(present: number, total: number): CsamConfidence {
  if (total <= 0 || present <= 0) return 'insufficient'
  const ratio = present / total
  if (ratio >= 0.75) return 'high'
  if (ratio >= 0.4) return 'medium'
  return 'low'
}

/** Lowest confidence across a set (a chain is only as strong as its weakest link). */
export function weakestConfidence(values: CsamConfidence[]): CsamConfidence {
  if (!values.length) return 'insufficient'
  return values.reduce((weakest, c) =>
    CONFIDENCE_ORDER.indexOf(c) < CONFIDENCE_ORDER.indexOf(weakest) ? c : weakest,
  )
}

// ----------------------------------------------------------------------------
// Colour states — single source of truth for the traffic-light styling
// ----------------------------------------------------------------------------

export const COLOR_STATE_LABELS: Record<ColorState, string> = {
  'green': 'On track',
  'amber': 'Intervention needed',
  'red': 'At risk — action required',
  'grey': 'Insufficient evidence',
}

export const COLOR_STATE_BADGE_CLASSES: Record<ColorState, string> = {
  'green': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'amber': 'bg-amber-100 text-amber-700 border-amber-300',
  'red': 'bg-red-100 text-red-700 border-red-300',
  'grey': 'bg-gray-100 text-gray-600 border-gray-300',
}

export const COLOR_STATE_DOT: Record<ColorState, string> = {
  'green': 'bg-emerald-500',
  'amber': 'bg-amber-500',
  'red': 'bg-red-500',
  'grey': 'bg-gray-400',
}

/** Map a 0-100 "higher is better" score + confidence to a colour state. */
export function scoreToColorState(
  score: number,
  confidence: CsamConfidence = 'medium',
  thresholds: { green: number; amber: number } = { green: 70, amber: 45 },
): ColorState {
  if (confidence === 'insufficient') return 'grey'
  if (score >= thresholds.green) return 'green'
  if (score >= thresholds.amber) return 'amber'
  return 'red'
}

// ----------------------------------------------------------------------------
// Data classification (Section 14 — keep telemetry separate from customer data)
// ----------------------------------------------------------------------------

export const DATA_CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  'public': 'Public',
  'internal': 'Internal (Microsoft)',
  'confidential': 'Confidential',
  'customer-provided': 'Customer-provided',
}

export const DATA_CLASSIFICATION_BADGE_CLASSES: Record<DataClassification, string> = {
  'public': 'bg-sky-100 text-sky-700 border-sky-300',
  'internal': 'bg-violet-100 text-violet-700 border-violet-300',
  'confidential': 'bg-amber-100 text-amber-800 border-amber-300',
  'customer-provided': 'bg-emerald-100 text-emerald-700 border-emerald-300',
}

// ----------------------------------------------------------------------------
// Validation status — financial claims are hypotheses until customer-validated
// ----------------------------------------------------------------------------

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  'hypothesis': 'Hypothesis — validate',
  'in-validation': 'In validation',
  'customer-validated': 'Customer-validated',
}

export const VALIDATION_STATUS_BADGE_CLASSES: Record<ValidationStatus, string> = {
  'hypothesis': 'bg-amber-100 text-amber-800 border-amber-300',
  'in-validation': 'bg-sky-100 text-sky-700 border-sky-300',
  'customer-validated': 'bg-emerald-100 text-emerald-700 border-emerald-300',
}

export const HYPOTHESIS_DISCLAIMER =
  'Financial statement impacts are hypotheses to validate with the customer, not realised value. ' +
  'Microsoft telemetry shows usage; it does not prove the customer\u2019s financial results moved. ' +
  'Distinguish correlation from causation and confirm with the customer\u2019s finance owner.'

/** Prefix a financial claim with hypothesis framing unless customer-validated. */
export function frameAsHypothesis(text: string, status: ValidationStatus): string {
  if (status === 'customer-validated') return text
  const trimmed = text.trim()
  if (/^(there appears|current|the original|we recommend|the next best|this suggests)/i.test(trimmed)) {
    return trimmed
  }
  return `There appears to be ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`
}

// ----------------------------------------------------------------------------
// Non-blaming, evidence-led language (Sections 8 + 14)
// ----------------------------------------------------------------------------

/** Injected as the system prompt for every CSAM AI generation. */
export const CSAM_NARRATIVE_SYSTEM_PROMPT = [
  'You are a senior Microsoft Customer Success Account Manager (CSAM) excellence lead and financial analyst.',
  'Write customer-centric, evidence-led, executive-ready language. Be financially literate but diplomatic.',
  'Frame everything as JOINT value realisation, never vendor policing.',
  'NEVER use blaming language such as: "you failed to use", "your financials should have", "you wasted",',
  '"Microsoft needs you to consume".',
  'PREFER language such as: "there appears to be unrealised value", "current adoption suggests an opportunity to improve",',
  '"the original investment thesis can be strengthened by", "we recommend validating the value hypothesis with",',
  '"the next best action to unlock measurable value is".',
  'Do NOT claim financial value is realised unless the input explicitly says it is customer-validated.',
  'Mark unvalidated value as a hypothesis. Distinguish correlation from causation. Never overstate Microsoft\u2019s influence',
  'over customer financial results. Use clear confidence levels and avoid false precision.',
].join(' ')

const BLAMING_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /\byou failed\b/i, suggestion: 'Reframe: "there appears to be unrealised value".' },
  { pattern: /\byou wasted\b/i, suggestion: 'Reframe: "the investment thesis can be strengthened".' },
  { pattern: /\byour financials should have\b/i, suggestion: 'Reframe as a hypothesis to validate.' },
  { pattern: /needs you to consume/i, suggestion: 'Reframe around customer outcomes, not consumption.' },
  { pattern: /\bwasted\b/i, suggestion: 'Avoid "wasted"; use "unrealised value".' },
  { pattern: /\bguarantee[sd]?\b/i, suggestion: 'Avoid guarantees; use confidence levels.' },
  { pattern: /\bwill definitely\b/i, suggestion: 'Avoid false precision; soften to "is expected to".' },
]

/** Returns human-readable warnings when narrative text breaks the guardrails. */
export function lintNarrative(text: string): string[] {
  const warnings: string[] = []
  for (const { pattern, suggestion } of BLAMING_PATTERNS) {
    if (pattern.test(text)) warnings.push(suggestion)
  }
  return warnings
}
