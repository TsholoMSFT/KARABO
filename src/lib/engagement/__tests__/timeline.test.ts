import { describe, it, expect } from 'vitest'
import {
  addBusinessDays,
  anchorTimeline,
  timelineToPlannerCsv,
  DEFAULT_TIMELINE_TEMPLATE,
} from '../timeline'

/** First Monday on or after the given date. */
function mondayOnOrAfter(d: Date): Date {
  const r = new Date(d)
  while (r.getDay() !== 1) r.setDate(r.getDate() + 1)
  return r
}

const MON = mondayOnOrAfter(new Date(2026, 5, 1)) // a Monday in June 2026

describe('addBusinessDays', () => {
  it('returns the same date for offset 0', () => {
    expect(addBusinessDays(MON, 0).getTime()).toBe(MON.getTime())
  })

  it('advances one business day Mon -> Tue', () => {
    expect(addBusinessDays(MON, 1).getDay()).toBe(2)
  })

  it('skips the weekend: Mon + 5 business days lands on the next Monday (7 calendar days)', () => {
    const r = addBusinessDays(MON, 5)
    expect(r.getDay()).toBe(1)
    expect(Math.round((r.getTime() - MON.getTime()) / 86_400_000)).toBe(7)
  })

  it('goes backwards across the weekend: Mon - 1 business day = previous Friday', () => {
    expect(addBusinessDays(MON, -1).getDay()).toBe(5)
  })

  it('Friday + 1 business day = Monday', () => {
    const fri = addBusinessDays(MON, 4) // Mon+4 = Fri
    expect(fri.getDay()).toBe(5)
    expect(addBusinessDays(fri, 1).getDay()).toBe(1)
  })

  it('never lands on a weekend across a wide range of offsets', () => {
    for (let n = -30; n <= 30; n++) {
      const day = addBusinessDays(MON, n).getDay()
      expect(day).not.toBe(0)
      expect(day).not.toBe(6)
    }
  })
})

describe('anchorTimeline + template', () => {
  it('the default template spans T-28 to T+3', () => {
    const offsets = DEFAULT_TIMELINE_TEMPLATE.map((i) => i.offsetDays)
    expect(Math.min(...offsets)).toBe(-28)
    expect(Math.max(...offsets)).toBe(3)
  })

  it('anchors every task to a weekday due date', () => {
    const tasks = anchorTimeline(DEFAULT_TIMELINE_TEMPLATE, MON)
    expect(tasks).toHaveLength(DEFAULT_TIMELINE_TEMPLATE.length)
    for (const t of tasks) {
      expect(t.dueDate).toBeTypeOf('number')
      const day = new Date(t.dueDate!).getDay()
      expect(day).not.toBe(0)
      expect(day).not.toBe(6)
    }
    // The T0 (delivery) task is anchored exactly on the engagement date.
    const delivery = tasks.find((t) => t.offsetDays === 0)
    expect(delivery?.dueDate).toBe(MON.getTime())
  })
})

describe('timelineToPlannerCsv', () => {
  it('emits a header row + one row per task with Planner columns', () => {
    const tasks = anchorTimeline(DEFAULT_TIMELINE_TEMPLATE, MON)
    const csv = timelineToPlannerCsv(tasks)
    const rows = csv.split('\r\n')
    expect(rows[0]).toBe('"Task Name","Bucket Name","Assigned To","Start Date","Due Date","Notes"')
    expect(rows).toHaveLength(tasks.length + 1)
    // Rows are ordered by offset (earliest first).
    expect(rows[1]).toContain('Confirm objectives')
  })

  it('escapes embedded quotes', () => {
    const csv = timelineToPlannerCsv([
      { id: 't', title: 'Say "hello"', offsetDays: 0, bucket: 'Delivery', owner: 'Microsoft', dueDate: MON.getTime() },
    ])
    expect(csv).toContain('"Say ""hello"""')
  })
})
