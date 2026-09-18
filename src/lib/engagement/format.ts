/**
 * Markdown renderers + labels for engagement artifacts.
 * Keeps the AI-structured payloads and the human-editable markdown in sync.
 */
import type {
  EngagementAgenda,
  FollowupEmail,
  EngagementTimeline,
  EngagementCloseout,
  ArchitectureDiagram,
  GeneratedJourney,
} from '@/lib/openai-service'
import type { EngagementToolkitType } from '@/lib/types'
import type { AccountCustomerJourney, UseCase } from '@/lib/types'
import { FRONTIER_PILLARS } from '@/lib/frontier-ai/catalog'
import { getCustomerSafeJourney } from '@/lib/frontier-ai/journey-builder'

export const ENGAGEMENT_TYPE_LABELS: Record<EngagementToolkitType, string> = {
  discovery: 'Discovery',
  'architecture-review': 'Architecture Review',
  'executive-briefing': 'Executive Briefing',
  'proof-of-concept': 'Proof of Concept',
  'deep-dive': 'Deep Dive',
  workshop: 'Workshop',
  other: 'Other',
}

export function agendaToMarkdown(a: EngagementAgenda, customerName?: string): string {
  const lines: string[] = [`# ${a.title}`]
  if (customerName) lines.push(`**Customer:** ${customerName}`)
  if (a.durationMinutes) lines.push(`**Duration:** ${a.durationMinutes} minutes`)
  lines.push('')
  if (a.objectives.length) {
    lines.push('## Objectives')
    a.objectives.forEach((o) => lines.push(`- ${o}`))
    lines.push('')
  }
  lines.push('## Agenda', '', '| Time | Topic | Owner | Details |', '| --- | --- | --- | --- |')
  a.items.forEach((it) => lines.push(
    `| ${escapeTableCell(it.time)} | ${escapeTableCell(it.topic)} | ${escapeTableCell(it.owner)} | ${escapeTableCell(it.description)} |`,
  ))
  if (a.nextSteps.length) {
    lines.push('', '## Next steps')
    a.nextSteps.forEach((s) => lines.push(`- ${s}`))
  }
  return lines.join('\n')
}

function escapeTableCell(value?: string): string {
  return (value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')
    .trim()
}

export function emailToMarkdown(e: FollowupEmail): string {
  const lines: string[] = [`**Subject:** ${e.subject}`, '']
  // bodyText already carries the prose; bullets are surfaced explicitly too.
  if (e.bodyText?.trim()) lines.push(e.bodyText.trim(), '')
  if (e.bullets.length) {
    e.bullets.forEach((b) => lines.push(`- ${b}`))
    lines.push('')
  }
  if (e.callToAction) lines.push(`**${e.callToAction}**`)
  return lines.join('\n').trim()
}

export function timelineToMarkdown(t: EngagementTimeline, customerName?: string): string {
  const lines: string[] = ['# Engagement Timeline']
  if (customerName) lines.push(`**Customer:** ${customerName}`)
  lines.push('')
  const buckets = new Map<string, typeof t.items>()
  for (const item of [...t.items].sort((a, b) => a.offsetDays - b.offsetDays)) {
    const key = item.bucket || 'Tasks'
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(item)
  }
  for (const [bucket, items] of buckets) {
    lines.push(`## ${bucket}`)
    items.forEach((it) => {
      const t0 = it.offsetDays === 0 ? 'T' : it.offsetDays > 0 ? `T+${it.offsetDays}` : `T${it.offsetDays}`
      const owner = it.owner ? ` _(${it.owner})_` : ''
      lines.push(`- **${t0}** ${it.title}${owner}`)
      if (it.notes) lines.push(`  - ${it.notes}`)
    })
    lines.push('')
  }
  return lines.join('\n').trim()
}

export function closeoutToMarkdown(c: EngagementCloseout, customerName?: string): string {
  const lines: string[] = ['# Engagement Closeout']
  if (customerName) lines.push(`**Customer:** ${customerName}`)
  if (c.sentiment) lines.push(`**Sentiment:** ${c.sentiment}`)
  lines.push('', '## Summary', c.summary || '_No summary._', '')
  if (c.decisions.length) {
    lines.push('## Decisions')
    c.decisions.forEach((d) => lines.push(`- ${d}`))
    lines.push('')
  }
  if (c.actionItems.length) {
    lines.push('## Action items')
    c.actionItems.forEach((a) => {
      const owner = a.owner ? ` — _${a.owner}_` : ''
      const due = a.due ? ` (due ${a.due})` : ''
      lines.push(`- ${a.action}${owner}${due}`)
    })
    lines.push('')
  }
  if (c.risks.length) {
    lines.push('## Risks')
    c.risks.forEach((r) => lines.push(`- ${r}`))
    lines.push('')
  }
  if (c.nextSteps.length) {
    lines.push('## Next steps')
    c.nextSteps.forEach((s) => lines.push(`- ${s}`))
  }
  return lines.join('\n').trim()
}

export function diagramToMarkdown(d: ArchitectureDiagram): string {
  const lines: string[] = [`# ${d.title}`, '']
  if (d.explanation) lines.push(d.explanation, '')
  lines.push('```mermaid', d.mermaid, '```')
  return lines.join('\n')
}

export function journeyToMarkdown(j: GeneratedJourney, customerName?: string): string {
  const lines: string[] = [`# ${j.title}`]
  if (customerName) lines.push(`**Customer:** ${customerName}`)
  if (j.totalDuration) lines.push(`**Total duration:** ${j.totalDuration}`)
  if (j.journeyNotes) lines.push('', j.journeyNotes)
  lines.push('', '## Milestones')
  j.milestones.forEach((m, i) => {
    lines.push('', `### ${i + 1}. ${m.title}`)
    const meta = [m.engagement, m.duration].filter(Boolean).join(' · ')
    if (meta) lines.push(`_${meta}_`)
    if (m.description) lines.push(m.description)
    if (m.deliverables?.length) lines.push(`- **Deliverables:** ${m.deliverables.join(', ')}`)
    if (m.dependencies?.length) lines.push(`- **Dependencies:** ${m.dependencies.join(', ')}`)
  })
  if (j.nextSteps?.length) {
    lines.push('', '## Next steps')
    j.nextSteps.forEach((s) => {
      const meta = [s.owner, s.targetDate].filter(Boolean).join(', ')
      lines.push(`- ${s.action}${meta ? ` (${meta})` : ''}`)
    })
  }
  return lines.join('\n')
}

const ACCOUNT_JOURNEY_STATUS_LABELS = {
  'start-now': 'Start now',
  next: 'Next',
  later: 'Later',
  'assumed-in-place': 'Assumed in place',
  'revisit-gap': 'Revisit gap',
} as const

const READINESS_RATING_LABELS = [
  'Not started',
  'Exploring',
  'Planning',
  'Implementing',
  'Scaling / Realizing',
] as const

export function accountJourneyToMarkdown(journey: AccountCustomerJourney, useCases: UseCase[]): string {
  const safeJourney = getCustomerSafeJourney(journey)
  const useCaseNames = new Map(useCases.map((useCase) => [useCase.id, useCase.title]))
  const lines: string[] = [
    `# ${safeJourney.title}`,
    `**Customer:** ${safeJourney.customerName}`,
    `**Current maturity:** ${safeJourney.maturity.stage}`,
    `**Assessment date:** ${new Date(safeJourney.readiness.assessedAt).toLocaleDateString()}`,
    '',
    '## Account ambition',
    safeJourney.ambition,
    '',
    '## Readiness snapshot',
  ]

  for (const pillar of FRONTIER_PILLARS) {
    const rating = safeJourney.readiness.ratings[pillar.id]
    const evidence = safeJourney.readiness.evidence[pillar.id]
    lines.push(`- **${pillar.name}:** ${rating} - ${READINESS_RATING_LABELS[rating]}${evidence ? `; ${evidence}` : ''}`)
  }

  lines.push('', '## Journey at a glance', '', '| Workstream | Start now | Next |', '| --- | --- | --- |')
  for (const workstream of safeJourney.workstreams) {
    const startNow = workstream.steps.filter((step) => step.recommendationStatus === 'start-now').map((step) => step.title).join(', ') || '-'
    const next = workstream.steps.filter((step) => step.recommendationStatus === 'next').map((step) => step.title).join(', ') || '-'
    lines.push(`| ${escapeTableCell(workstream.label)} | ${escapeTableCell(startNow)} | ${escapeTableCell(next)} |`)
  }

  for (const workstream of safeJourney.workstreams) {
    lines.push('', `## ${workstream.label}`)
    workstream.steps.forEach((step, index) => {
      lines.push('', `### ${index + 1}. ${step.title}`)
      lines.push(`**Status:** ${ACCOUNT_JOURNEY_STATUS_LABELS[step.recommendationStatus]}  `)
      lines.push(`**Stage:** ${step.deliveryStage}  `)
      lines.push(`**Duration:** ${step.duration}`)
      lines.push('', `**Customer value:** ${step.customerValue}`)
      lines.push('', `**Applied context:** ${step.customerContext}`)
      lines.push('', `**Why now:** ${step.whyNow}`)

      const linkedNames = step.linkedUseCaseIds.map((id) => useCaseNames.get(id)).filter((name): name is string => !!name)
      if (linkedNames.length > 0) lines.push('', `**Linked use cases:** ${linkedNames.join(', ')}`)
      if (step.owner) lines.push(`**Owner:** ${step.owner}`)
      if (step.targetTiming) lines.push(`**Target timing:** ${step.targetTiming}`)

      const appendList = (label: string, values: string[]) => {
        if (values.length === 0) return
        lines.push('', `**${label}**`)
        values.forEach((value) => lines.push(`- ${value}`))
      }
      appendList('Customer commitments', step.customerCommitments)
      appendList('Deliverables', step.deliverables)
      appendList('Outcomes', step.outcomes)
      appendList('Success criteria', step.successCriteria)
    })
  }

  if (safeJourney.warnings.length > 0) {
    lines.push('', '## Dependencies and cautions')
    safeJourney.warnings.forEach((warning) => lines.push(`- ${warning.message}`))
  }

  if (safeJourney.nextSteps.length > 0) {
    lines.push('', '## Mutual next steps')
    safeJourney.nextSteps.forEach((step) => {
      const metadata = [step.owner, step.targetDate].filter(Boolean).join(', ')
      lines.push(`- ${step.action}${metadata ? ` (${metadata})` : ''}`)
    })
  }

  return lines.join('\n').trim()
}
