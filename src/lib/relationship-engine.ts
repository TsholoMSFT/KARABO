/**
 * Relationship engine (Focus 2) — pure logic for tracking decision-maker
 * relationships: contact cadence, relationship health, and the power/interest
 * influence-matrix quadrant. Persistence lives in `use-relationships.ts`.
 */
import type {
  Interaction,
  InteractionType,
  StakeholderRelationship,
  RelationshipHealthBand,
} from './fy27-types'
import type { StakeholderType, StakeholderDisposition } from './types'

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ── Interactions ───────────────────────────────────────────────────────────

export interface CreateInteractionInput {
  type: InteractionType
  summary: string
  date?: number
  accountId?: string
  customerId?: string
  stakeholderId?: string
  stakeholderName?: string
  nextAction?: string
  nextActionDue?: number
  ownerName?: string
}

export function createInteraction(input: CreateInteractionInput): Interaction {
  const now = Date.now()
  return {
    id: genId('intx'),
    accountId: input.accountId,
    customerId: input.customerId,
    stakeholderId: input.stakeholderId,
    stakeholderName: input.stakeholderName,
    type: input.type,
    date: input.date ?? now,
    summary: input.summary,
    nextAction: input.nextAction,
    nextActionDue: input.nextActionDue,
    ownerName: input.ownerName,
    createdAt: now,
  }
}

// ── Relationships ────────────────────────────────────────────────────────

export interface CreateRelationshipInput {
  name: string
  role: string
  stakeholderType: StakeholderType
  disposition: StakeholderDisposition
  influence?: number
  interest?: number
  accountId?: string
  customerId?: string
  relationshipOwner?: string
  personaId?: string
}

export function createRelationship(input: CreateRelationshipInput): StakeholderRelationship {
  const now = Date.now()
  return {
    id: genId('rel'),
    accountId: input.accountId,
    customerId: input.customerId,
    name: input.name,
    role: input.role,
    stakeholderType: input.stakeholderType,
    disposition: input.disposition,
    influence: clamp(input.influence ?? 5, 1, 10),
    interest: clamp(input.interest ?? 5, 1, 10),
    relationshipOwner: input.relationshipOwner,
    personaId: input.personaId,
    createdAt: now,
    updatedAt: now,
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Most recent interaction timestamp for a relationship (by id or name match). */
export function deriveLastContact(
  relationship: Pick<StakeholderRelationship, 'id' | 'name'>,
  interactions: Interaction[],
): number | undefined {
  const matches = interactions.filter(
    (i) => i.stakeholderId === relationship.id || i.stakeholderName === relationship.name,
  )
  if (matches.length === 0) return undefined
  return Math.max(...matches.map((i) => i.date))
}

/**
 * Relationship health from contact recency, softened by disposition. Opposed
 * contacts are capped at "at-risk"; skeptical contacts are downgraded one band.
 */
export function relationshipHealth(
  lastContact: number | undefined,
  disposition?: StakeholderDisposition,
  now = Date.now(),
): RelationshipHealthBand {
  if (!lastContact) return 'none'
  const days = (now - lastContact) / MS_PER_DAY
  let band: RelationshipHealthBand
  if (days <= 30) band = 'strong'
  else if (days <= 60) band = 'stable'
  else if (days <= 90) band = 'at-risk'
  else band = 'stale'

  if (disposition === 'opposed') {
    // Cannot be better than at-risk with an opposed contact.
    if (band === 'strong' || band === 'stable') band = 'at-risk'
  } else if (disposition === 'skeptical') {
    band = downgrade(band)
  }
  return band
}

function downgrade(band: RelationshipHealthBand): RelationshipHealthBand {
  const order: RelationshipHealthBand[] = ['strong', 'stable', 'at-risk', 'stale', 'none']
  const idx = order.indexOf(band)
  return order[Math.min(order.length - 1, idx + 1)]
}

export type InfluenceQuadrant = 'manage-closely' | 'keep-satisfied' | 'keep-informed' | 'monitor'

export const INFLUENCE_QUADRANT_LABELS: Record<InfluenceQuadrant, string> = {
  'manage-closely': 'Manage closely (high power, high interest)',
  'keep-satisfied': 'Keep satisfied (high power, low interest)',
  'keep-informed': 'Keep informed (low power, high interest)',
  monitor: 'Monitor (low power, low interest)',
}

const MID = 5.5

export function influenceQuadrant(influence: number, interest: number): InfluenceQuadrant {
  const highPower = influence >= MID
  const highInterest = interest >= MID
  if (highPower && highInterest) return 'manage-closely'
  if (highPower && !highInterest) return 'keep-satisfied'
  if (!highPower && highInterest) return 'keep-informed'
  return 'monitor'
}

export interface RelationshipSummary {
  total: number
  byHealth: Record<RelationshipHealthBand, number>
  staleOrNone: number
  interactionsLast90Days: number
  unownedRelationships: number
}

export function summarizeRelationships(
  relationships: StakeholderRelationship[],
  interactions: Interaction[],
  now = Date.now(),
): RelationshipSummary {
  const summary: RelationshipSummary = {
    total: relationships.length,
    byHealth: { strong: 0, stable: 0, 'at-risk': 0, stale: 0, none: 0 },
    staleOrNone: 0,
    interactionsLast90Days: 0,
    unownedRelationships: 0,
  }
  for (const rel of relationships) {
    const lastContact = rel.lastContact ?? deriveLastContact(rel, interactions)
    const band = relationshipHealth(lastContact, rel.disposition, now)
    summary.byHealth[band]++
    if (band === 'stale' || band === 'none') summary.staleOrNone++
    if (!rel.relationshipOwner) summary.unownedRelationships++
  }
  const cutoff = now - 90 * MS_PER_DAY
  summary.interactionsLast90Days = interactions.filter((i) => i.date >= cutoff).length
  return summary
}
