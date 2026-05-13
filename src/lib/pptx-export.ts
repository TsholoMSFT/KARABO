/**
 * PPTX export
 * ----------------------------------------------------------------------------
 * Generates a one-deck "executive readout" PowerPoint from a Karabo
 * discovery session: title, exec summary, top 5 use cases, business case,
 * cost/benefit chart, next steps. Uses pptxgenjs (browser-side, no server
 * round-trip).
 *
 * Public surface:
 *   exportSessionToPptx(input): Promise<void>  // triggers browser download
 */

import PptxGenJS from 'pptxgenjs'

export interface PptxUseCase {
  title: string
  description?: string
  priority?: number
  riceScore?: number
  annualCoiUSD?: number
  effortPersonWeeks?: number
}

export interface PptxInput {
  customerName: string
  industry?: string
  preparedBy?: string
  preparedFor?: string
  executiveSummary?: string
  useCases?: PptxUseCase[]
  businessCase?: {
    investmentUSD?: number
    threeYearBenefitUSD?: number
    paybackMonths?: number
    npvUSD?: number
    irrPct?: number
  }
  nextSteps?: string[]
  microsoftSolutions?: string[]
}

const COLORS = {
  primary: '0F6CBD', // MS blue
  accent: '2563EB',
  success: '059669',
  danger: 'DC2626',
  text: '1E293B',
  muted: '64748B',
  bg: 'F8FAFC',
}

function fmtUSD(n?: number) {
  if (n == null || isNaN(n)) return '—'
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export async function exportSessionToPptx(input: PptxInput): Promise<void> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 × 7.5 in
  pptx.title = `${input.customerName} — Discovery Readout`
  pptx.company = 'Microsoft'
  pptx.author = input.preparedBy || 'Karabo'

  // ── Slide 1: Title ────────────────────────────────────────────────────
  const s1 = pptx.addSlide()
  s1.background = { color: COLORS.primary }
  s1.addText('DISCOVERY EXECUTIVE READOUT', {
    x: 0.6, y: 0.6, w: 12, h: 0.4, fontSize: 12, color: 'FFFFFF', bold: true, charSpacing: 4,
  })
  s1.addText(input.customerName, {
    x: 0.6, y: 1.6, w: 12, h: 1.4, fontSize: 44, color: 'FFFFFF', bold: true,
  })
  if (input.industry) {
    s1.addText(input.industry, {
      x: 0.6, y: 3.0, w: 12, h: 0.5, fontSize: 18, color: 'E0E7FF',
    })
  }
  s1.addText(
    [
      input.preparedFor ? `Prepared for: ${input.preparedFor}` : '',
      input.preparedBy ? `Prepared by: ${input.preparedBy}` : '',
      `Date: ${new Date().toLocaleDateString()}`,
    ].filter(Boolean).join('\n'),
    { x: 0.6, y: 5.8, w: 8, h: 1.2, fontSize: 12, color: 'E0E7FF' },
  )
  s1.addText('Microsoft', {
    x: 11.2, y: 6.5, w: 1.6, h: 0.5, fontSize: 14, color: 'FFFFFF', bold: true, align: 'right',
  })

  // ── Slide 2: Executive Summary ────────────────────────────────────────
  if (input.executiveSummary) {
    const s = pptx.addSlide()
    s.background = { color: COLORS.bg }
    s.addText('Executive Summary', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true })
    s.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.05, w: 12.3, h: 0, line: { color: COLORS.accent, width: 2 } })
    // Truncate to keep slide readable
    const summary = input.executiveSummary.length > 1400
      ? input.executiveSummary.slice(0, 1380) + '…'
      : input.executiveSummary
    s.addText(summary, {
      x: 0.5, y: 1.3, w: 12.3, h: 5.6, fontSize: 14, color: COLORS.text, valign: 'top', paraSpaceAfter: 8,
    })
  }

  // ── Slide 3: Top use cases table ──────────────────────────────────────
  const top = (input.useCases || []).slice(0, 8)
  if (top.length) {
    const s = pptx.addSlide()
    s.background = { color: COLORS.bg }
    s.addText('Prioritised Use Cases', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true })
    s.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.05, w: 12.3, h: 0, line: { color: COLORS.accent, width: 2 } })

    const headerStyle = { bold: true, color: 'FFFFFF', fill: { color: COLORS.primary }, align: 'left' as const, valign: 'middle' as const, fontSize: 11 }
    const rowStyle = { color: COLORS.text, valign: 'middle' as const, fontSize: 10 }

    const rows: any[][] = [[
      { text: '#', options: headerStyle },
      { text: 'Use case', options: headerStyle },
      { text: 'RICE', options: { ...headerStyle, align: 'right' as const } },
      { text: 'Annual COI', options: { ...headerStyle, align: 'right' as const } },
      { text: 'Effort', options: { ...headerStyle, align: 'right' as const } },
    ]]
    top.forEach((uc, i) => {
      rows.push([
        { text: String(i + 1), options: rowStyle },
        { text: uc.title, options: { ...rowStyle, bold: true } },
        { text: uc.riceScore != null ? uc.riceScore.toFixed(1) : '—', options: { ...rowStyle, align: 'right' as const } },
        { text: fmtUSD(uc.annualCoiUSD), options: { ...rowStyle, align: 'right' as const, color: COLORS.danger } },
        { text: uc.effortPersonWeeks != null ? `${uc.effortPersonWeeks} wks` : '—', options: { ...rowStyle, align: 'right' as const } },
      ])
    })

    s.addTable(rows, {
      x: 0.5, y: 1.3, w: 12.3, colW: [0.6, 6.7, 1.4, 2.0, 1.6],
      border: { type: 'solid', color: 'E2E8F0', pt: 0.5 },
      rowH: 0.45,
    })
  }

  // ── Slide 4: Business case ────────────────────────────────────────────
  const bc = input.businessCase
  if (bc && (bc.investmentUSD || bc.threeYearBenefitUSD || bc.paybackMonths || bc.npvUSD)) {
    const s = pptx.addSlide()
    s.background = { color: COLORS.bg }
    s.addText('Business Case', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true })
    s.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.05, w: 12.3, h: 0, line: { color: COLORS.accent, width: 2 } })

    const stat = (x: number, label: string, value: string, color: string) => {
      s.addShape(pptx.ShapeType.roundRect, { x, y: 1.5, w: 2.9, h: 1.8, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1 })
      s.addText(label, { x: x + 0.1, y: 1.65, w: 2.7, h: 0.4, fontSize: 11, color: COLORS.muted, bold: true })
      s.addText(value, { x: x + 0.1, y: 2.1, w: 2.7, h: 1.0, fontSize: 28, color, bold: true, valign: 'middle' })
    }
    stat(0.5, '3-yr investment', fmtUSD(bc.investmentUSD), COLORS.text)
    stat(3.6, '3-yr benefit', fmtUSD(bc.threeYearBenefitUSD), COLORS.success)
    stat(6.7, 'Payback', bc.paybackMonths != null ? `${bc.paybackMonths.toFixed(1)} mo` : '—', COLORS.primary)
    stat(9.8, 'NPV', fmtUSD(bc.npvUSD), COLORS.success)

    if (bc.investmentUSD && bc.threeYearBenefitUSD) {
      s.addChart(pptx.ChartType.bar, [
        { name: 'Investment', labels: ['Investment'], values: [bc.investmentUSD] },
        { name: '3-yr benefit', labels: ['3-yr benefit'], values: [bc.threeYearBenefitUSD] },
      ], {
        x: 0.5, y: 3.6, w: 12.3, h: 3.4,
        chartColors: [COLORS.danger, COLORS.success],
        showLegend: true, legendPos: 'b',
        showTitle: true, title: 'Investment vs. 3-Year Benefit', titleFontSize: 14,
        catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
      })
    }
  }

  // ── Slide 5: Microsoft solutions ──────────────────────────────────────
  if (input.microsoftSolutions?.length) {
    const s = pptx.addSlide()
    s.background = { color: COLORS.bg }
    s.addText('Recommended Microsoft Stack', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true })
    s.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.05, w: 12.3, h: 0, line: { color: COLORS.accent, width: 2 } })

    const items = input.microsoftSolutions.slice(0, 16)
    const cols = 4
    const rows = Math.ceil(items.length / cols)
    const cellW = 12.3 / cols
    const cellH = Math.min(1.0, 5.5 / rows)
    items.forEach((sol, i) => {
      const c = i % cols
      const r = Math.floor(i / cols)
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.5 + c * cellW, y: 1.4 + r * (cellH + 0.15), w: cellW - 0.2, h: cellH,
        fill: { color: 'FFFFFF' }, line: { color: COLORS.accent, width: 1 }, rectRadius: 0.05,
      })
      s.addText(sol, {
        x: 0.5 + c * cellW, y: 1.4 + r * (cellH + 0.15), w: cellW - 0.2, h: cellH,
        fontSize: 12, color: COLORS.text, bold: true, align: 'center', valign: 'middle',
      })
    })
  }

  // ── Slide 6: Next steps ───────────────────────────────────────────────
  if (input.nextSteps?.length) {
    const s = pptx.addSlide()
    s.background = { color: COLORS.bg }
    s.addText('Recommended Next Steps', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true })
    s.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.05, w: 12.3, h: 0, line: { color: COLORS.accent, width: 2 } })
    const lines = input.nextSteps.slice(0, 10).map((n, i) => ({
      text: `${i + 1}. ${n}`,
      options: { fontSize: 16, color: COLORS.text, paraSpaceAfter: 12 },
    }))
    s.addText(lines, { x: 0.5, y: 1.3, w: 12.3, h: 5.5, valign: 'top' })
  }

  // ── Slide N: Closing ──────────────────────────────────────────────────
  const sN = pptx.addSlide()
  sN.background = { color: COLORS.primary }
  sN.addText('Thank you', { x: 0.5, y: 2.5, w: 12.3, h: 1.2, fontSize: 60, color: 'FFFFFF', bold: true, align: 'center' })
  sN.addText('Generated by Karabo · Microsoft Innovation Hub', {
    x: 0.5, y: 4.0, w: 12.3, h: 0.6, fontSize: 16, color: 'E0E7FF', align: 'center',
  })

  const safeName = input.customerName.replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60) || 'discovery'
  await pptx.writeFile({ fileName: `karabo-${safeName}-${new Date().toISOString().slice(0, 10)}.pptx` })
}
