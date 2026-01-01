import jsPDF from 'jspdf'
import { UseCase, ScoringMethod, CustomerMetadata } from './types'
import { calculateRICEScore, getQuadrant } from './scoring'
import { getKPIById } from './kpis'

export interface ExportOptions {
  effortUnit: 'person-weeks' | 'fte' | 'man-hours'
  customerMetadata?: CustomerMetadata
}

export function convertEffort(personWeeks: number, unit: 'person-weeks' | 'fte' | 'man-hours'): number {
  switch (unit) {
    case 'person-weeks':
      return personWeeks
    case 'fte':
      return personWeeks / 52
    case 'man-hours':
      return personWeeks * 40
  }
}

export function getEffortUnitLabel(unit: 'person-weeks' | 'fte' | 'man-hours'): string {
  switch (unit) {
    case 'person-weeks':
      return 'Person-Weeks'
    case 'fte':
      return 'FTE (Years)'
    case 'man-hours':
      return 'Man-Hours'
  }
}

export function exportToPDF(
  useCases: UseCase[],
  topUseCases: UseCase[],
  scoringMethod: ScoringMethod,
  options: ExportOptions
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(80, 50, 180)
  doc.text('Microsoft Innovation Hub', pageWidth / 2, y, { align: 'center' })
  y += 8
  doc.setFontSize(18)
  doc.setTextColor(50, 50, 50)
  doc.text('Use Case Assessment', pageWidth / 2, y, { align: 'center' })
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' })
  y += 4
  doc.text(`Scoring Method: ${scoringMethod === 'rice' ? 'RICE' : 'Impact vs. Feasibility'}`, pageWidth / 2, y, { align: 'center' })
  y += 12

  if (options.customerMetadata) {
    const meta = options.customerMetadata
    const hasAnyMetadata = meta.customerName || meta.primaryStakeholder || meta.accountTeamRep || 
                          meta.innovationHubLocation || meta.solutionEngineer

    if (hasAnyMetadata) {
      addPageIfNeeded(60)
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(60, 60, 60)
      doc.text('Customer Information', margin, y)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)

      const fields = [
        { label: 'Customer Name', value: meta.customerName },
        { label: 'Primary Stakeholder', value: meta.primaryStakeholder },
        { label: 'Account Team Rep', value: meta.accountTeamRep },
        { label: 'Innovation Hub Location', value: meta.innovationHubLocation },
        { label: 'Solution Engineer', value: meta.solutionEngineer },
      ]

      fields.forEach(field => {
        if (field.value) {
          addPageIfNeeded(8)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(`${field.label}:`, margin, y)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          doc.text(field.value, margin + 50, y)
          y += 6
        }
      })

      y += 6
    }

    if (meta.executiveSummary) {
      addPageIfNeeded(40)
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(60, 60, 60)
      doc.text('Executive Summary', margin, y)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      const summaryLines = doc.splitTextToSize(meta.executiveSummary, pageWidth - 2 * margin)
      summaryLines.forEach((line: string) => {
        addPageIfNeeded(6)
        doc.text(line, margin, y)
        y += 5
      })
      y += 8
    }
  }

  if (scoringMethod === 'rice') {
    addPageIfNeeded(80)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(80, 50, 180)
    doc.text('RICE Scoring Methodology', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    const riceIntro = 'RICE helps you prioritize initiatives using four key factors. Higher scores indicate better opportunities:'
    doc.text(riceIntro, margin, y, { maxWidth: pageWidth - 2 * margin })
    y += 12

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(80, 50, 180)
    doc.text('RICE Score = (Reach × Impact × Confidence) ÷ Effort', margin, y)
    y += 12

    const components = [
      {
        name: 'Reach (Users/Period)',
        description: 'How many unique users will benefit from this use case within a specific time period? This is calculated as Number of Users ÷ Time Period.',
        example: 'Example: If 1,000 users benefit per quarter, enter 1000 users and "quarter" as the period.'
      },
      {
        name: 'Impact Multiplier',
        description: 'How significantly will this affect each user\'s experience or outcomes? Use the scale: 3x = Massive (game-changing), 2x = High (significant improvement), 1x = Medium (noticeable benefit), 0.5x = Low (minor improvement), 0.25x = Minimal (small tweak).',
        example: 'Example: 2x for a high-impact feature'
      },
      {
        name: 'Confidence (%)',
        description: 'How certain are you about your Reach, Impact, and Effort estimates? Lower confidence reduces the final score.',
        example: 'Example: 100% = completely confident, 80% = pretty sure, 50% = rough guess'
      },
      {
        name: 'Effort (Person-Weeks)',
        description: `Total development time required to design, build, test, and deploy this solution. Sum the time across all team members who will work on implementation. This measures the cost to implement the new solution, not the time spent on the current process.`,
        example: 'Example: If 2 developers work for 3 weeks each, and 1 designer works for 1 week = 7 person-weeks total'
      }
    ]

    components.forEach((component) => {
      addPageIfNeeded(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      doc.text(`• ${component.name}`, margin, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(70, 70, 70)
      const lines = doc.splitTextToSize(component.description, pageWidth - 2 * margin - 5)
      lines.forEach((line: string) => {
        addPageIfNeeded(5)
        doc.text(line, margin + 5, y)
        y += 4
      })
      y += 2

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(component.example, margin + 5, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    })

    y += 5
  } else {
    addPageIfNeeded(70)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(80, 50, 180)
    doc.text('Impact vs. Feasibility Scoring', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    const ifIntro = 'Impact/Feasibility scoring helps you prioritize initiatives by plotting them on a 2x2 matrix. Use cases fall into four quadrants:'
    doc.text(ifIntro, margin, y, { maxWidth: pageWidth - 2 * margin })
    y += 12

    const quadrants = [
      {
        name: 'Quick Wins (High Impact, High Feasibility)',
        description: 'Prioritize these first - they deliver significant value and are relatively easy to implement.'
      },
      {
        name: 'Strategic Bets (High Impact, Low Feasibility)',
        description: 'High-value initiatives that require significant investment. Plan carefully and allocate sufficient resources.'
      },
      {
        name: 'Fill-ins (Low Impact, High Feasibility)',
        description: 'Easy to implement but lower value. Good for filling time between major projects.'
      },
      {
        name: 'Time Sinks (Low Impact, Low Feasibility)',
        description: 'Avoid or deprioritize - these require significant effort for minimal return.'
      }
    ]

    quadrants.forEach((quadrant) => {
      addPageIfNeeded(18)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      doc.text(`• ${quadrant.name}`, margin, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(70, 70, 70)
      const lines = doc.splitTextToSize(quadrant.description, pageWidth - 2 * margin - 5)
      lines.forEach((line: string) => {
        addPageIfNeeded(5)
        doc.text(line, margin + 5, y)
        y += 4
      })
      y += 4
    })

    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(80, 50, 180)
    doc.text('Score = Impact × Feasibility (both rated 1-10)', margin, y)
    y += 10
  }

  doc.addPage()
  y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(80, 50, 180)
  doc.text('Top Recommendations', margin, y)
  y += 10

  topUseCases.forEach((useCase, index) => {
    addPageIfNeeded(50)

    doc.setFillColor(165, 120, 255)
    doc.roundedRect(margin, y - 5, 10, 10, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text(`${index + 1}`, margin + 5, y + 1.5, { align: 'center' })

    doc.setTextColor(40, 40, 40)
    doc.setFontSize(12)
    doc.text(useCase.title, margin + 15, y + 1)
    y += 8

    if (useCase.description) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(70, 70, 70)
      const descLines = doc.splitTextToSize(useCase.description, pageWidth - 2 * margin - 5)
      descLines.forEach((line: string) => {
        addPageIfNeeded(5)
        doc.text(line, margin + 5, y)
        y += 4
      })
      y += 4
    }

    if (useCase.kpis && useCase.kpis.length > 0) {
      addPageIfNeeded(10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('KPIs:', margin + 5, y)
      y += 4

      doc.setFont('helvetica', 'normal')
      const kpiNames = useCase.kpis.map(kpiId => {
        const kpi = getKPIById(kpiId)
        return kpi ? kpi.name : null
      }).filter(Boolean).join(', ')
      
      const kpiLines = doc.splitTextToSize(kpiNames, pageWidth - 2 * margin - 10)
      kpiLines.forEach((line: string) => {
        addPageIfNeeded(4)
        doc.text(line, margin + 5, y)
        y += 3.5
      })
      y += 4
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    if (scoringMethod === 'rice') {
      const score = calculateRICEScore(useCase)
      const effortConverted = convertEffort(useCase.rice.effort, options.effortUnit)
      const effortLabel = getEffortUnitLabel(options.effortUnit)
      
      doc.setFillColor(240, 240, 250)
      doc.roundedRect(margin + 5, y - 3, pageWidth - 2 * margin - 10, 18, 2, 2, 'F')
      
      doc.text(`RICE Score: ${score.toFixed(1)}`, margin + 8, y + 2)
      y += 7
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`Reach: ${useCase.rice.reach.toLocaleString()} users/${useCase.rice.period || 'period'}`, margin + 8, y)
      y += 4
      doc.text(`Impact: ${useCase.rice.impact}× | Confidence: ${useCase.rice.confidence}% | Effort: ${effortConverted.toFixed(2)} ${effortLabel}`, margin + 8, y)
    } else {
      const combinedScore = useCase.impact * useCase.feasibility
      const quadrant = getQuadrant(useCase.impact, useCase.feasibility)
      
      doc.setFillColor(240, 240, 250)
      doc.roundedRect(margin + 5, y - 3, pageWidth - 2 * margin - 10, 18, 2, 2, 'F')
      
      doc.text(`Score: ${combinedScore.toFixed(1)} | Quadrant: ${quadrant}`, margin + 8, y + 2)
      y += 7
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`Impact: ${useCase.impact}/10 | Feasibility: ${useCase.feasibility}/10`, margin + 8, y)
    }
    y += 12
  })

  if (useCases.length > topUseCases.length) {
    doc.addPage()
    y = margin

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(80, 50, 180)
    doc.text(`All Use Cases (${useCases.length})`, margin, y)
    y += 10

    useCases.forEach((useCase) => {
      addPageIfNeeded(38)

      const isTopPick = topUseCases.some(top => top.id === useCase.id)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text(useCase.title, margin, y)
      
      if (isTopPick) {
        doc.setTextColor(165, 120, 255)
        doc.setFontSize(8)
        doc.text('★ TOP PICK', pageWidth - margin - 20, y)
        doc.setTextColor(0, 0, 0)
      }
      y += 6

      if (useCase.description) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(70, 70, 70)
        const descLines = doc.splitTextToSize(useCase.description, pageWidth - 2 * margin - 3)
        descLines.forEach((line: string) => {
          addPageIfNeeded(4)
          doc.text(line, margin + 3, y)
          y += 3.5
        })
        y += 3
      }

      if (useCase.kpis && useCase.kpis.length > 0) {
        addPageIfNeeded(8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text('KPIs:', margin + 3, y)
        doc.setFont('helvetica', 'normal')
        const kpiNames = useCase.kpis.map(kpiId => {
          const kpi = getKPIById(kpiId)
          return kpi ? kpi.name : null
        }).filter(Boolean).join(', ')
        doc.text(kpiNames, margin + 13, y, { maxWidth: pageWidth - 2 * margin - 16 })
        y += 5
      }

      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      if (scoringMethod === 'rice') {
        const score = calculateRICEScore(useCase)
        const effortConverted = convertEffort(useCase.rice.effort, options.effortUnit)
        const effortLabel = getEffortUnitLabel(options.effortUnit)
        
        doc.text(
          `RICE: ${score.toFixed(1)} | R: ${useCase.rice.reach} | I: ${useCase.rice.impact}× | C: ${useCase.rice.confidence}% | E: ${effortConverted.toFixed(2)} ${effortLabel}`,
          margin + 3,
          y
        )
      } else {
        const combinedScore = useCase.impact * useCase.feasibility
        doc.text(
          `Score: ${combinedScore.toFixed(1)} | Impact: ${useCase.impact}/10 | Feasibility: ${useCase.feasibility}/10`,
          margin + 3,
          y
        )
      }
      y += 10
    })
  }

  const fileName = `microsoft-innovation-hub-assessment-${Date.now()}.pdf`
  doc.save(fileName)
}
