/**
 * Engagement timeline engine.
 * ----------------------------------------------------------------------------
 * Business-day-aware scheduling (T-28 -> T+3) anchored to an engagement date,
 * plus a Microsoft Planner-ready CSV export. Pure + deterministic (unit-tested).
 */
import type { EngagementTimelineItem } from '@/lib/openai-service'
import type { EngagementTask } from '@/lib/types'

/** Move `businessDays` business days from `start` (skips Sat/Sun). 0 = same day. */
export function addBusinessDays(start: Date, businessDays: number): Date {
  const d = new Date(start)
  const step = businessDays >= 0 ? 1 : -1
  let remaining = Math.abs(Math.trunc(businessDays))
  while (remaining > 0) {
    d.setDate(d.getDate() + step)
    const day = d.getDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return d
}

/** Canonical pre/at/post-engagement task template (business-day offsets). */
export const DEFAULT_TIMELINE_TEMPLATE: EngagementTimelineItem[] = [
  { title: 'Confirm objectives & success criteria with the customer', offsetDays: -28, bucket: 'Preparation', owner: 'Microsoft' },
  { title: 'Identify and invite required stakeholders', offsetDays: -21, bucket: 'Preparation', owner: 'Microsoft & Customer' },
  { title: 'Send pre-read and data request', offsetDays: -14, bucket: 'Preparation', owner: 'Microsoft' },
  { title: 'Draft agenda and align internally', offsetDays: -10, bucket: 'Preparation', owner: 'Microsoft' },
  { title: 'Confirm logistics, room, and tech check', offsetDays: -5, bucket: 'Preparation', owner: 'Microsoft' },
  { title: 'Final agenda sign-off with customer sponsor', offsetDays: -2, bucket: 'Preparation', owner: 'Microsoft & Customer' },
  { title: 'Deliver the engagement session', offsetDays: 0, bucket: 'Delivery', owner: 'Microsoft & Customer' },
  { title: 'Capture notes, decisions, and action items', offsetDays: 0, bucket: 'Delivery', owner: 'Microsoft' },
  { title: 'Send thank-you and recap email', offsetDays: 1, bucket: 'Follow-up', owner: 'Microsoft' },
  { title: 'Generate closeout / debrief summary', offsetDays: 2, bucket: 'Follow-up', owner: 'Microsoft' },
  { title: 'Schedule next-step / readout meeting', offsetDays: 3, bucket: 'Follow-up', owner: 'Microsoft & Customer' },
]

/** Anchor offset-based items to absolute due dates around an engagement date. */
export function anchorTimeline(items: EngagementTimelineItem[], engagementDate: Date): EngagementTask[] {
  return items.map((it, i) => ({
    id: `task-${i}-${it.offsetDays}`,
    title: it.title,
    offsetDays: it.offsetDays,
    dueDate: addBusinessDays(engagementDate, it.offsetDays).getTime(),
    bucket: it.bucket,
    owner: it.owner,
    notes: it.notes,
  }))
}

function csvCell(s: string): string {
  return `"${(s ?? '').replace(/"/g, '""')}"`
}

function fmtDate(ts?: number): string {
  return ts ? new Date(ts).toLocaleDateString('en-US') : '' // M/D/YYYY for Planner
}

/** Build a Microsoft Planner-importable CSV from anchored tasks. */
export function timelineToPlannerCsv(tasks: EngagementTask[]): string {
  const headers = ['Task Name', 'Bucket Name', 'Assigned To', 'Start Date', 'Due Date', 'Notes']
  const lines = [headers.map(csvCell).join(',')]
  for (const t of [...tasks].sort((a, b) => a.offsetDays - b.offsetDays)) {
    const due = fmtDate(t.dueDate)
    lines.push([
      csvCell(t.title),
      csvCell(t.bucket || ''),
      csvCell(t.owner || ''),
      csvCell(due),
      csvCell(due),
      csvCell(t.notes || ''),
    ].join(','))
  }
  return lines.join('\r\n')
}

/** Render anchored tasks (with dates) to grouped markdown. */
export function anchoredTimelineToMarkdown(tasks: EngagementTask[], customerName?: string): string {
  const lines: string[] = ['# Engagement Timeline']
  if (customerName) lines.push(`**Customer:** ${customerName}`)
  lines.push('')
  const byBucket = new Map<string, EngagementTask[]>()
  for (const t of [...tasks].sort((a, b) => a.offsetDays - b.offsetDays)) {
    const key = t.bucket || 'Tasks'
    if (!byBucket.has(key)) byBucket.set(key, [])
    byBucket.get(key)!.push(t)
  }
  for (const [bucket, items] of byBucket) {
    lines.push(`## ${bucket}`)
    for (const t of items) {
      const tLabel = t.offsetDays === 0 ? 'T' : t.offsetDays > 0 ? `T+${t.offsetDays}` : `T${t.offsetDays}`
      const date = t.dueDate ? ` — ${new Date(t.dueDate).toLocaleDateString()}` : ''
      const owner = t.owner ? ` _(${t.owner})_` : ''
      lines.push(`- **${tLabel}**${date} ${t.title}${owner}`)
      if (t.notes) lines.push(`  - ${t.notes}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}
