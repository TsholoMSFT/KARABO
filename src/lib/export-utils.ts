import { UseCase, ScoringMethod, CustomerMetadata } from './types'
import { calculateRICEScore, getQuadrant } from './scoring'
import { getKPIById } from './kpis'
import * as XLSX from 'xlsx'

export function formatEffort(personWeeks: number, unit: 'person-weeks' | 'fte' | 'man-hours'): string {
  switch (unit) {
    case 'fte':
      return `${(personWeeks / 52).toFixed(3)} FTE`
    case 'man-hours':
      return `${(personWeeks * 40).toFixed(0)} hours`
    default:
      return `${personWeeks} weeks`
  }
}

export function exportToCSV(
  useCases: UseCase[],
  scoringMethod: ScoringMethod,
  effortUnit: 'person-weeks' | 'fte' | 'man-hours',
  customerMetadata?: CustomerMetadata
) {
  const headers: string[] = []
  const rows: string[][] = []

  if (scoringMethod === 'rice') {
    headers.push('Rank', 'Title', 'Description', 'KPIs', 'Reach', 'Impact (multiplier)', 'Confidence (%)', `Effort (${effortUnit})`, 'RICE Score')
    
    useCases.forEach((useCase, index) => {
      const kpiNames = (useCase.kpis || [])
        .map(kpiId => getKPIById(kpiId)?.name)
        .filter(Boolean)
        .join('; ')
      
      rows.push([
        (index + 1).toString(),
        useCase.title,
        useCase.description || '',
        kpiNames,
        useCase.rice.reach.toLocaleString(),
        `${useCase.rice.impact}x`,
        `${useCase.rice.confidence}%`,
        formatEffort(useCase.rice.effort, effortUnit),
        calculateRICEScore(useCase).toFixed(2)
      ])
    })
  } else {
    headers.push('Rank', 'Title', 'Description', 'KPIs', 'Impact (1-10)', 'Feasibility (1-10)', 'Quadrant', 'Composite Score')
    
    useCases.forEach((useCase, index) => {
      const kpiNames = (useCase.kpis || [])
        .map(kpiId => getKPIById(kpiId)?.name)
        .filter(Boolean)
        .join('; ')
      
      rows.push([
        (index + 1).toString(),
        useCase.title,
        useCase.description || '',
        kpiNames,
        useCase.impact.toString(),
        useCase.feasibility.toString(),
        getQuadrant(useCase.impact, useCase.feasibility),
        (useCase.impact * useCase.feasibility).toFixed(2)
      ])
    })
  }

  const csvContent = [
    customerMetadata?.customerName ? [`Customer: ${customerMetadata.customerName}`] : [],
    customerMetadata?.innovationHubLocation ? [`Innovation Hub: ${customerMetadata.innovationHubLocation}`] : [],
    [''],
    headers,
    ...rows
  ]
    .filter(row => row.length > 0)
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `use-case-assessment-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel(
  useCases: UseCase[],
  scoringMethod: ScoringMethod,
  effortUnit: 'person-weeks' | 'fte' | 'man-hours',
  customerMetadata?: CustomerMetadata
) {
  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Summary with metadata
  const summaryData: any[] = []
  if (customerMetadata) {
    summaryData.push(['Customer Information'], [])
    summaryData.push(['Customer Name:', customerMetadata.customerName])
    summaryData.push(['Primary Stakeholder:', customerMetadata.primaryStakeholder])
    summaryData.push(['Account Team Rep:', customerMetadata.accountTeamRep])
    summaryData.push(['Innovation Hub Location:', customerMetadata.innovationHubLocation])
    summaryData.push(['Solution Engineer:', customerMetadata.solutionEngineer])
    if (customerMetadata.executiveSummary) {
      summaryData.push(['Executive Summary:', customerMetadata.executiveSummary])
    }
    summaryData.push([])
  }
  
  summaryData.push(['Assessment Summary'], [])
  summaryData.push(['Scoring Method:', scoringMethod === 'rice' ? 'RICE Framework' : 'Impact/Feasibility Matrix'])
  summaryData.push(['Total Use Cases:', useCases.length])
  summaryData.push(['Export Date:', new Date().toISOString().split('T')[0]])
  summaryData.push(['Effort Unit:', effortUnit])

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Sheet 2: Detailed Use Cases
  const headers: string[] = []
  const rows: (string | number)[][] = []

  if (scoringMethod === 'rice') {
    headers.push('Rank', 'Title', 'Description', 'KPIs', 'Reach', 'Impact (multiplier)', 'Confidence (%)', `Effort (${effortUnit})`, 'RICE Score')
    
    useCases.forEach((useCase, index) => {
      const kpiNames = (useCase.kpis || [])
        .map(kpiId => getKPIById(kpiId)?.name)
        .filter(Boolean)
        .join('; ')
      
      const score = calculateRICEScore(useCase)
      rows.push([
        index + 1,
        useCase.title,
        useCase.description || '',
        kpiNames,
        useCase.rice.reach,
        useCase.rice.impact,
        useCase.rice.confidence,
        formatEffort(useCase.rice.effort, effortUnit),
        parseFloat(score.toFixed(2))
      ])
    })
  } else {
    headers.push('Rank', 'Title', 'Description', 'KPIs', 'Impact (1-10)', 'Feasibility (1-10)', 'Quadrant', 'Composite Score')
    
    useCases.forEach((useCase, index) => {
      const kpiNames = (useCase.kpis || [])
        .map(kpiId => getKPIById(kpiId)?.name)
        .filter(Boolean)
        .join('; ')
      
      const score = useCase.impact * useCase.feasibility
      rows.push([
        index + 1,
        useCase.title,
        useCase.description || '',
        kpiNames,
        useCase.impact,
        useCase.feasibility,
        getQuadrant(useCase.impact, useCase.feasibility),
        parseFloat(score.toFixed(2))
      ])
    })
  }

  const detailSheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // Format header row
  const range = XLSX.utils.decode_range(detailSheet['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell_address = XLSX.utils.encode_col(col) + '1'
    if (!detailSheet[cell_address]) continue
    detailSheet[cell_address].fill = { patternType: 'solid', fgColor: { rgb: 'FF4472C4' } }
    detailSheet[cell_address].font = { bold: true, color: { rgb: 'FFFFFFFF' } }
  }
  
  // Set column widths
  detailSheet['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 40 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 }
  ]

  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Use Cases')

  // Generate and download
  const fileName = `use-case-assessment-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
export function exportToJSON(
  useCases: UseCase[],
  scoringMethod: ScoringMethod,
  effortUnit: 'person-weeks' | 'fte' | 'man-hours',
  customerMetadata?: CustomerMetadata
) {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      scoringMethod,
      effortUnit,
      totalUseCases: useCases.length,
      customer: customerMetadata
    },
    useCases: useCases.map((useCase, index) => ({
      rank: index + 1,
      id: useCase.id,
      title: useCase.title,
      description: useCase.description,
      kpis: (useCase.kpis || []).map(kpiId => {
        const kpi = getKPIById(kpiId)
        return kpi ? { id: kpi.id, name: kpi.name, category: kpi.category } : null
      }).filter(Boolean),
      scoring: scoringMethod === 'rice' 
        ? {
            method: 'RICE',
            reach: useCase.rice.reach,
            impact: useCase.rice.impact,
            confidence: useCase.rice.confidence,
            effort: useCase.rice.effort,
            effortFormatted: formatEffort(useCase.rice.effort, effortUnit),
            score: parseFloat(calculateRICEScore(useCase).toFixed(2))
          }
        : {
            method: 'Impact/Feasibility',
            impact: useCase.impact,
            feasibility: useCase.feasibility,
            quadrant: getQuadrant(useCase.impact, useCase.feasibility),
            score: parseFloat((useCase.impact * useCase.feasibility).toFixed(2))
          },
      createdAt: new Date(useCase.createdAt).toISOString()
    }))
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `use-case-assessment-${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}