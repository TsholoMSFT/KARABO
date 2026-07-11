/**
 * Blocker engine — pure, deterministic logic for blocker orchestration (Focus 6).
 *
 * No I/O, no React. Persistence lives in `use-blockers.ts`.
 */
import type {
  Blocker,
  BlockerPriority,
  BlockerStatus,
} from './fy27-types'

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const OPEN_STATUSES: BlockerStatus[] = ['open', 'in-progress', 'escalated']

const PRIORITY_RANK: Record<BlockerPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export interface CreateBlockerInput {
  title: string
  accountId?: string
  customerId?: string
  description?: string
  category?: Blocker['category']
  priority?: BlockerPriority
  ownerName?: string
  ownerRole?: Blocker['ownerRole']
  escalationPath?: string
  targetResolutionDate?: number
  linkedWorkloadIds?: string[]
  linkedUseCaseIds?: string[]
  linkedOpportunityIds?: string[]
}

export function createBlocker(input: CreateBlockerInput): Blocker {
  const now = Date.now()
  return {
    id: genId('blk'),
    accountId: input.accountId,
    customerId: input.customerId,
    title: input.title,
    description: input.description,
    category: input.category ?? 'other',
    priority: input.priority ?? 'medium',
    status: 'open',
    ownerName: input.ownerName,
    ownerRole: input.ownerRole,
    escalationPath: input.escalationPath,
    linkedWorkloadIds: input.linkedWorkloadIds,
    linkedUseCaseIds: input.linkedUseCaseIds,
    linkedOpportunityIds: input.linkedOpportunityIds,
    targetResolutionDate: input.targetResolutionDate,
    createdAt: now,
    updatedAt: now,
  }
}

export function isBlockerOpen(b: Pick<Blocker, 'status'>): boolean {
  return OPEN_STATUSES.includes(b.status)
}

/** A blocker is overdue when it is still open and past its target date. */
export function isBlockerOverdue(b: Pick<Blocker, 'status' | 'targetResolutionDate'>, now = Date.now()): boolean {
  if (!isBlockerOpen(b)) return false
  return typeof b.targetResolutionDate === 'number' && b.targetResolutionDate < now
}

/**
 * A blocker needs escalation when it is a high/critical priority item that is
 * overdue and not yet marked as escalated. Deterministic — drives the "needs
 * attention" surface without any manual flagging.
 */
export function needsEscalation(b: Blocker, now = Date.now()): boolean {
  if (b.status === 'escalated' || !isBlockerOpen(b)) return false
  if (!isBlockerOverdue(b, now)) return false
  return b.priority === 'critical' || b.priority === 'high'
}

/** Resolve a blocker (immutably), stamping the resolution time + notes. */
export function resolveBlocker(b: Blocker, resolutionNotes?: string, now = Date.now()): Blocker {
  return { ...b, status: 'resolved', resolvedAt: now, resolutionNotes, updatedAt: now }
}

/** Sort blockers by "attention" — open first, then priority, then due date. */
export function sortBlockersByAttention(blockers: Blocker[], now = Date.now()): Blocker[] {
  return [...blockers].sort((a, b) => {
    const aOpen = isBlockerOpen(a) ? 0 : 1
    const bOpen = isBlockerOpen(b) ? 0 : 1
    if (aOpen !== bOpen) return aOpen - bOpen
    const aEsc = needsEscalation(a, now) ? 0 : 1
    const bEsc = needsEscalation(b, now) ? 0 : 1
    if (aEsc !== bEsc) return aEsc - bEsc
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    }
    const aDue = a.targetResolutionDate ?? Number.MAX_SAFE_INTEGER
    const bDue = b.targetResolutionDate ?? Number.MAX_SAFE_INTEGER
    return aDue - bDue
  })
}

export interface BlockerSummary {
  total: number
  open: number
  overdue: number
  needingEscalation: number
  resolved: number
  byPriority: Record<BlockerPriority, number>
}

export function summarizeBlockers(blockers: Blocker[], now = Date.now()): BlockerSummary {
  const summary: BlockerSummary = {
    total: blockers.length,
    open: 0,
    overdue: 0,
    needingEscalation: 0,
    resolved: 0,
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
  }
  for (const b of blockers) {
    if (isBlockerOpen(b)) summary.open++
    if (b.status === 'resolved') summary.resolved++
    if (isBlockerOverdue(b, now)) summary.overdue++
    if (needsEscalation(b, now)) summary.needingEscalation++
    summary.byPriority[b.priority]++
  }
  return summary
}
