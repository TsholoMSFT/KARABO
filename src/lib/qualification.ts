import type {
  BantQualification,
  QualificationSignalStatus,
  RaciAssignment,
} from './types'

export const BANT_DIMENSIONS = ['budget', 'authority', 'need', 'timeline'] as const

export type BantDimension = (typeof BANT_DIMENSIONS)[number]
export type BantIndication = 'unknown' | 'attention' | 'ready'

export interface BantSummary {
  indication: BantIndication
  confirmed: number
  weak: number
  unknown: number
  warnings: string[]
}

const DIMENSION_LABELS: Record<BantDimension, string> = {
  budget: 'Budget',
  authority: 'Authority',
  need: 'Need',
  timeline: 'Timeline',
}

export function createEmptyBantQualification(): BantQualification {
  return {
    budget: { status: 'unknown' },
    authority: { status: 'unknown' },
    need: { status: 'unknown' },
    timeline: { status: 'unknown' },
  }
}

export function summarizeBant(bant?: BantQualification): BantSummary {
  const qualification = bant ?? createEmptyBantQualification()
  const counts: Record<QualificationSignalStatus, number> = {
    confirmed: 0,
    weak: 0,
    unknown: 0,
  }
  const warnings: string[] = []

  for (const dimension of BANT_DIMENSIONS) {
    const status = qualification[dimension].status
    counts[status] += 1
    if (status !== 'confirmed') {
      warnings.push(`${DIMENSION_LABELS[dimension]} is ${status === 'weak' ? 'weakly evidenced' : 'not yet evidenced'}.`)
    }
  }

  return {
    indication: counts.confirmed === BANT_DIMENSIONS.length
      ? 'ready'
      : counts.unknown === BANT_DIMENSIONS.length
        ? 'unknown'
        : 'attention',
    confirmed: counts.confirmed,
    weak: counts.weak,
    unknown: counts.unknown,
    warnings,
  }
}

export interface RaciValidation {
  valid: boolean
  warnings: string[]
}

export function validateRaci(assignments: RaciAssignment[] = []): RaciValidation {
  const accountableCount = assignments.filter((assignment) => assignment.role === 'accountable').length
  const responsibleCount = assignments.filter((assignment) => assignment.role === 'responsible').length
  const duplicateAssignments = new Set<string>()
  const seen = new Set<string>()

  for (const assignment of assignments) {
    const key = `${assignment.stakeholderId}:${assignment.role}`
    if (seen.has(key)) duplicateAssignments.add(key)
    seen.add(key)
  }

  const warnings: string[] = []
  if (accountableCount === 0) warnings.push('No accountable stakeholder is assigned.')
  if (accountableCount > 1) warnings.push('Only one accountable stakeholder can be assigned.')
  if (responsibleCount === 0) warnings.push('No responsible stakeholder is assigned.')
  if (duplicateAssignments.size > 0) warnings.push('A stakeholder cannot hold the same RACI role more than once.')

  return {
    valid: accountableCount <= 1 && duplicateAssignments.size === 0,
    warnings,
  }
}