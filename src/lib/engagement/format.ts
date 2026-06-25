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
} from '@/lib/openai-service'
import type { EngagementType } from '@/lib/types'

export const ENGAGEMENT_TYPE_LABELS: Record<EngagementType, string> = {
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
  lines.push('## Agenda')
  a.items.forEach((it) => {
    const time = it.time ? `**${it.time}** — ` : ''
    const owner = it.owner ? ` _(${it.owner})_` : ''
    lines.push(`- ${time}${it.topic}${owner}`)
    if (it.description) lines.push(`  - ${it.description}`)
  })
  if (a.nextSteps.length) {
    lines.push('', '## Next steps')
    a.nextSteps.forEach((s) => lines.push(`- ${s}`))
  }
  return lines.join('\n')
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
