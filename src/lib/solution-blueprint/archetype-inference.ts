/**
 * Heuristic archetype inference for a discovered `UseCase`.
 * Pure, deterministic keyword scoring — no LLM call. Used to seed the
 * Solution Blueprint when a user clicks "Generate blueprint" on a use case.
 *
 * Returns the best-matching archetype id plus a short human rationale.
 * If nothing scores above the floor, returns null and the caller can let
 * the user pick.
 */

import type { UseCase } from '@/lib/types'
import { ARCHETYPES } from './archetypes'
import type { ArchetypeDef } from './types'

interface ArchetypeKeywords {
  /** Keywords that strongly indicate this archetype. */
  strong: string[]
  /** Keywords that weakly hint at this archetype. */
  weak?: string[]
}

const KEYWORDS: Record<string, ArchetypeKeywords> = {
  'rag-knowledge-assistant': {
    strong: ['rag', 'knowledge', 'q&a', 'q and a', 'search', 'retrieval', 'document grounding', 'ask about', 'helpdesk', 'self-service', 'answer questions'],
    weak: ['chatbot', 'assistant', 'copilot', 'policy', 'sop', 'manual', 'wiki', 'sharepoint', 'documentation'],
  },
  'agentic-process-automation': {
    strong: ['agent', 'agentic', 'autonomous', 'multi-step', 'orchestrate', 'workflow automation', 'end-to-end', 'process automation', 'rpa replacement', 'tool use'],
    weak: ['automate', 'process', 'integration', 'connector', 'crm', 'erp', 'ticketing', 'servicenow', 'salesforce', 'sap'],
  },
  'document-intelligence': {
    strong: ['extract', 'invoice', 'form', 'contract', 'claim', 'ocr', 'document processing', 'parse pdf', 'structured data from', 'idp', 'intelligent document'],
    weak: ['pdf', 'scan', 'paper', 'kyc', 'onboarding', 'backoffice'],
  },
  'contact-center-copilot': {
    strong: ['contact center', 'call center', 'agent assist', 'after-call', 'transcribe', 'real-time transcription', 'csat', 'wrap-up', 'caller'],
    weak: ['voice', 'speech', 'phone', 'support agent', 'helpdesk', 'service desk', 'ivr'],
  },
  'm365-copilot-extension': {
    strong: ['m365 copilot', 'microsoft 365 copilot', 'copilot extension', 'declarative agent', 'copilot studio', 'plugin for copilot', 'graph connector'],
    weak: ['teams', 'outlook', 'office', 'sharepoint', 'word', 'excel'],
  },
  'predictive-analytics': {
    strong: ['predict', 'forecast', 'churn', 'propensity', 'lead scoring', 'demand planning', 'time series', 'regression', 'classification model', 'recommendation'],
    weak: ['analytics', 'ml', 'machine learning', 'model', 'segment', 'risk score'],
  },
  'computer-vision-quality': {
    strong: ['vision', 'image', 'video', 'defect detection', 'visual inspection', 'quality control', 'safety monitoring', 'cctv', 'object detection', 'ppe'],
    weak: ['camera', 'photo', 'manufacturing', 'plant floor', 'mining safety', 'inspection'],
  },
  'event-driven-integration': {
    strong: ['event-driven', 'streaming', 'real-time pipeline', 'kafka', 'event hub', 'iot ingestion', 'cdc', 'change data capture', 'pubsub'],
    weak: ['integration', 'pipeline', 'ingest', 'stream', 'telemetry', 'sensor'],
  },
}

const STRONG_WEIGHT = 5
const WEAK_WEIGHT = 1
const MIN_SCORE = 3

export interface InferredArchetype {
  archetype: ArchetypeDef
  score: number
  matchedKeywords: string[]
  rationale: string
}

export function inferArchetype(useCase: Pick<UseCase, 'title' | 'description' | 'kpis' | 'agenticOpportunities' | 'solutionPlays'>): InferredArchetype | null {
  const haystackParts: string[] = []
  if (useCase.title) haystackParts.push(useCase.title)
  if (useCase.description) haystackParts.push(useCase.description)
  if (useCase.kpis?.length) haystackParts.push(useCase.kpis.join(' '))
  if (useCase.solutionPlays?.length) haystackParts.push(useCase.solutionPlays.join(' '))
  if (useCase.agenticOpportunities?.length) {
    for (const op of useCase.agenticOpportunities) {
      if (op.description) haystackParts.push(op.description)
      if (op.title) haystackParts.push(op.title)
    }
  }
  const haystack = haystackParts.join(' ').toLowerCase()
  if (!haystack.trim()) return null

  // Boost for explicit agentic signal.
  const hasAgenticSignal = (useCase.agenticOpportunities?.length ?? 0) > 0

  let best: { archetypeId: string; score: number; matched: string[] } | null = null

  for (const [archetypeId, kws] of Object.entries(KEYWORDS)) {
    const matched: string[] = []
    let score = 0
    for (const kw of kws.strong) {
      if (haystack.includes(kw)) {
        score += STRONG_WEIGHT
        matched.push(kw)
      }
    }
    for (const kw of kws.weak ?? []) {
      if (haystack.includes(kw)) {
        score += WEAK_WEIGHT
        matched.push(kw)
      }
    }
    if (hasAgenticSignal && archetypeId === 'agentic-process-automation') score += 2
    if (best === null || score > best.score) best = { archetypeId, score, matched }
  }

  if (!best || best.score < MIN_SCORE) return null

  const archetype = ARCHETYPES.find(a => a.id === best!.archetypeId)
  if (!archetype) return null

  const sample = best.matched.slice(0, 3).join(', ')
  const rationale = sample
    ? `Suggested ${archetype.name} based on signals: ${sample}.`
    : `Suggested ${archetype.name}.`

  return { archetype, score: best.score, matchedKeywords: best.matched, rationale }
}
