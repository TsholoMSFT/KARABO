import * as XLSX from 'xlsx'
import type { EnterpriseDiscoverySession } from '@/lib/types'
import { calculateTotalCOI } from '@/lib/financial-calculations'

export function exportEnterpriseDiscoveryToExcel(session: EnterpriseDiscoverySession): string {
  const workbook = XLSX.utils.book_new()

  // ============ SUMMARY SHEET ============
  const summaryData = [
    ['Microsoft Innovation Hub - Enterprise Discovery Report'],
    [''],
    ['Client Name', session.clientName || 'Unnamed'],
    ['Session Date', new Date(session.sessionDate).toLocaleDateString()],
    ['Discovery Type', session.discoveryType],
    ['Completed', session.completedAt ? 'Yes' : 'No'],
    ['Stages Completed', Object.values(session.stages).filter(s => s.status === 'completed').length + ' of 9'],
    [''],
    ['Attendees'],
    ...session.attendees.map(a => [`  ${a.name}`, a.role]),
  ]
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // ============ STAGE 1: OPPORTUNITY ============
  const stage1Data = session.stages[1].data
  if (stage1Data) {
    const opportunityData = [
      ['Stage 1: Opportunity'],
      [''],
      ['Problem Statement', stage1Data.problemStatement || ''],
      ['Problem Category', stage1Data.problemCategory || ''],
      ['Affected Area', stage1Data.affectedArea || ''],
      [''],
      ['Desired Outcome', stage1Data.desiredOutcome || ''],
      ['Timeline Expectation', stage1Data.timelineExpectation || ''],
      [''],
      ['Success Metrics'],
      ...(stage1Data.successMetrics || []).map((m: string) => [`  ${m}`]),
      [''],
      ['SCQ Framework'],
      ['Situation', stage1Data.scq?.situation || ''],
      ['Complication', stage1Data.scq?.complication || ''],
      ['Question', stage1Data.scq?.question || ''],
      [''],
      ['Cost of Inaction'],
      ['Direct Costs (One-time)', stage1Data.coi?.directCosts?.oneTime || 0],
      ['Direct Costs (Monthly)', stage1Data.coi?.directCosts?.recurring || 0],
      ['Opportunity Costs (One-time)', stage1Data.coi?.opportunityCosts?.oneTime || 0],
      ['Opportunity Costs (Monthly)', stage1Data.coi?.opportunityCosts?.recurring || 0],
      ['Risk Costs (One-time)', stage1Data.coi?.riskCosts?.oneTime || 0],
      ['Risk Probability (%)', stage1Data.coi?.riskCosts?.oneTimeProbability || 0],
      ['Risk Costs (Monthly)', stage1Data.coi?.riskCosts?.recurring || 0],
      ['Total Annual COI', stage1Data.coi ? calculateTotalCOI(stage1Data.coi) : 0],
    ]
    
    const opportunitySheet = XLSX.utils.aoa_to_sheet(opportunityData)
    XLSX.utils.book_append_sheet(workbook, opportunitySheet, 'Opportunity')
  }

  // ============ STAGE 2: RESOURCES ============
  const stage2Data = session.stages[2].data
  if (stage2Data) {
    const resourcesData = [
      ['Stage 2: Resources'],
      [''],
      ['Financial'],
      ['Budget Status', stage2Data.budgetStatus || ''],
      ['Budget Range', stage2Data.budgetRange || ''],
      ['ROI Expectation', stage2Data.roiExpectation || ''],
      ['Budget Owner', stage2Data.budgetOwner || ''],
      [''],
      ['Human Resources'],
      ['Executive Sponsor', stage2Data.executiveSponsor || ''],
      ['Project Lead', stage2Data.projectLead || ''],
      ['Team Capacity', stage2Data.teamCapacity || ''],
      ['Change Readiness', stage2Data.changeReadiness || ''],
      [''],
      ['Technical'],
      ['Data Availability', stage2Data.dataAvailability || ''],
      ['Technical Debt Concerns', stage2Data.technicalDebtConcerns || ''],
      [''],
      ['Existing Platforms'],
      ...(stage2Data.existingPlatforms || []).map((p: string) => [`  ${p}`]),
      [''],
      ['Integration Requirements'],
      ...(stage2Data.integrationRequirements || []).map((r: string) => [`  ${r}`]),
    ]
    
    const resourcesSheet = XLSX.utils.aoa_to_sheet(resourcesData)
    XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources')
  }

  // ============ STAGE 4: PRIORITISATION ============
  const stage4Data = session.stages[4].data
  if (stage4Data?.opportunities && stage4Data.opportunities.length > 0) {
    const prioData = [
      ['Stage 4: Prioritisation (RICE Scoring)'],
      [''],
      ['Title', 'Reach', 'Impact', 'Confidence', 'Effort', 'RICE Score', 'Recommended'],
      ...stage4Data.opportunities.map((opp: any) => [
        opp.title,
        opp.rice?.reach || 0,
        opp.rice?.impact || 0,
        opp.rice?.confidence || 0,
        opp.rice?.effort || 0,
        opp.rice?.score || 0,
        opp.id === stage4Data.recommendedOpportunityId ? 'Yes' : ''
      ])
    ]
    
    const prioSheet = XLSX.utils.aoa_to_sheet(prioData)
    XLSX.utils.book_append_sheet(workbook, prioSheet, 'Prioritisation')
  }

  // ============ STAGE 5: SOLUTION SCOPE ============
  const stage5Data = session.stages[5].data
  if (stage5Data) {
    // Revenue Impact
    const revenueData = [
      ['Stage 5: Solution Scope - Revenue Impact'],
      [''],
      ['Driver Type', 'Annual Value', 'Enabled'],
      ...(stage5Data.revenueImpact?.drivers || []).map((d: any) => [
        d.type?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '',
        d.calculatedAnnualValue || 0,
        d.enabled ? 'Yes' : 'No'
      ]),
      [''],
      ['Total Revenue Impact', stage5Data.revenueImpact?.totalAnnualRevenue || 0],
    ]
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData)
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Impact')

    // Cost Impact
    const costData = [
      ['Stage 5: Solution Scope - Cost Impact'],
      [''],
      ['Driver Type', 'Annual Value', 'FTE Equivalent', 'P&L Line', 'Enabled'],
      ...(stage5Data.costImpact?.drivers || []).map((d: any) => [
        d.type?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '',
        d.calculatedAnnualValue || 0,
        d.fteEquivalent || 0,
        d.plLine || '',
        d.enabled ? 'Yes' : 'No'
      ]),
      [''],
      ['Total Cost Savings', stage5Data.costImpact?.totalAnnualSavings || 0],
      ['Total FTE Equivalent', stage5Data.costImpact?.totalFTEEquivalent || 0],
    ]
    const costSheet = XLSX.utils.aoa_to_sheet(costData)
    XLSX.utils.book_append_sheet(workbook, costSheet, 'Cost Impact')

    // Balance Sheet
    const bsData = [
      ['Stage 5: Solution Scope - Balance Sheet & Cash Flow'],
      [''],
      ['Driver Type', 'Value', 'Cash Flow Impact', 'Enabled'],
      ...(stage5Data.balanceSheetCashFlow?.drivers || []).map((d: any) => [
        d.type?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '',
        d.calculatedValue || 0,
        d.cashFlowImpact || 0,
        d.enabled ? 'Yes' : 'No'
      ]),
      [''],
      ['Total Working Capital Impact', stage5Data.balanceSheetCashFlow?.totalWorkingCapitalImpact || 0],
      ['Total Cash Flow Impact', stage5Data.balanceSheetCashFlow?.totalCashFlowImpact || 0],
    ]
    const bsSheet = XLSX.utils.aoa_to_sheet(bsData)
    XLSX.utils.book_append_sheet(workbook, bsSheet, 'Balance Sheet')
  }

  // ============ STAGE 8: FINANCIAL SUMMARY ============
  const stage8Data = session.stages[8].data
  if (stage8Data) {
    const financialSummary = [
      ['Stage 8: Financial Summary'],
      [''],
      ['Investment Analysis'],
      ['Total Investment (Year 1)', stage8Data.investmentAnalysis?.totalInvestmentYear1 || 0],
      ['Annual Benefit', stage8Data.investmentAnalysis?.totalAnnualBenefit || 0],
      ['Payback Period (Months)', stage8Data.investmentAnalysis?.simplePaybackMonths || 0],
      ['3-Year ROI (%)', stage8Data.investmentAnalysis?.roi3Year || 0],
      ['NPV (10%)', stage8Data.investmentAnalysis?.npv10Percent || 0],
      ['IRR (%)', stage8Data.investmentAnalysis?.irr || 0],
      [''],
      ['Sensitivity Analysis'],
      ['', 'Conservative', 'Base', 'Optimistic'],
      ['Annual Benefit', 
        stage8Data.sensitivityAnalysis?.conservative?.annualBenefit || 0,
        stage8Data.sensitivityAnalysis?.base?.annualBenefit || 0,
        stage8Data.sensitivityAnalysis?.optimistic?.annualBenefit || 0
      ],
      ['Payback (Months)',
        stage8Data.sensitivityAnalysis?.conservative?.paybackMonths || 0,
        stage8Data.sensitivityAnalysis?.base?.paybackMonths || 0,
        stage8Data.sensitivityAnalysis?.optimistic?.paybackMonths || 0
      ],
      ['3-Year ROI (%)',
        stage8Data.sensitivityAnalysis?.conservative?.roi3Year || 0,
        stage8Data.sensitivityAnalysis?.base?.roi3Year || 0,
        stage8Data.sensitivityAnalysis?.optimistic?.roi3Year || 0
      ],
      ['NPV',
        stage8Data.sensitivityAnalysis?.conservative?.npv || 0,
        stage8Data.sensitivityAnalysis?.base?.npv || 0,
        stage8Data.sensitivityAnalysis?.optimistic?.npv || 0
      ],
      [''],
      ['P&L Impact - Year 1'],
      ['Revenue Impact', stage8Data.plImpact?.year1?.revenueImpact || 0],
      ['COGS Impact', stage8Data.plImpact?.year1?.cogsImpact || 0],
      ['Gross Margin Impact', stage8Data.plImpact?.year1?.grossMarginImpact || 0],
      ['OpEx Impact', stage8Data.plImpact?.year1?.opexImpact || 0],
      ['EBIT Impact', stage8Data.plImpact?.year1?.ebitImpact || 0],
    ]
    
    const financialSheet = XLSX.utils.aoa_to_sheet(financialSummary)
    XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial Summary')
  }

  // ============ YELLOW LIGHTS ============
  if (session.allYellowLights && session.allYellowLights.length > 0) {
    const yellowLightsData = [
      ['Yellow Lights & Concerns'],
      [''],
      ['Description', 'Severity', 'Stage Identified', 'Resolution Plan', 'Owner', 'Resolved'],
      ...session.allYellowLights.map(light => [
        light.description,
        light.severity,
        light.stageIdentified,
        light.resolutionPlan || '',
        light.owner || '',
        light.resolved ? 'Yes' : 'No'
      ])
    ]
    
    const yellowLightsSheet = XLSX.utils.aoa_to_sheet(yellowLightsData)
    XLSX.utils.book_append_sheet(workbook, yellowLightsSheet, 'Yellow Lights')
  }

  // Generate filename and save
  const clientSlug = (session.clientName || 'discovery').toLowerCase().replace(/\s+/g, '-').slice(0, 30)
  const fileName = `enterprise-discovery-${clientSlug}-${new Date().toISOString().split('T')[0]}.xlsx`
  
  XLSX.writeFile(workbook, fileName)
  
  return fileName
}
