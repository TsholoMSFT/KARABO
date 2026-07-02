/**
 * Business Case generation per use case.
 *
 * Composes the full UseCase context (problem, solution, COI, EV, run-cost,
 * regulatory + RAI risks, MSP) into a prompt and asks the LLM (gpt-4o-mini)
 * for an executive one-pager in Markdown. Result is cached on the use case
 * via `useCase.businessCase`.
 */

import { callAIForTask } from './openai-service'
import { estimateRunCost } from './cost-engine'
import type { UseCase } from './types'

export interface BusinessCaseContext {
  customerName?: string
  industry?: string
  region?: string
  /** Internal sales / footprint hints (e.g. "M365 owned, 5k seats"). */
  internalContext?: string[]
}

const SYSTEM_PROMPT = `You are a senior Microsoft Innovation Hub strategist writing a one-page executive Business Case for a single AI use case. Output Markdown only. Sections: ## Problem, ## Proposed Solution, ## Cost of Inaction, ## Run Cost & Implementation, ## Expected Value, ## Net Benefit & Payback, ## Risks & Compliance, ## Decision Asks. Be specific, quantitative, and concise (max ~400 words). Avoid filler. Use bullet points. End with 3 numbered Decision Asks for the executive sponsor.`

function fmtMoney(n?: number, currency = 'USD'): string {
  if (!n || !isFinite(n)) return '—'
  return n.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 })
}

function summarizeUseCase(useCase: UseCase, ctx: BusinessCaseContext): string {
  const runCost = useCase.runCost ?? estimateRunCost(useCase)
  const coi = useCase.costOfInaction
  const ev = useCase.expectedValue

  const netAnnual = (ev?.totalAnnualValue ?? 0) - (runCost.totalAnnualUSD ?? 0)
  const payback = ev?.paybackMonths

  const solutionText = (useCase.microsoftSolutions || [])
    .map(s => `${s.productFamily}: ${s.services?.join(', ') || ''}${s.justification ? ` (${s.justification})` : ''}`)
    .join('; ') || 'Not yet selected'

  const businessProcesses = (useCase.businessProcesses || []).slice(0, 4)
    .map(p => `${p.processName}${p.proposedImprovement ? ` → ${p.proposedImprovement}` : ''}`)
    .join('; ') || '—'

  const regs = useCase.aiRegulations?.applicableFrameworks?.join(', ')
    || useCase.regulatoryAssessment?.frameworkAssessments?.map(f => f.framework).join(', ')
    || '—'

  const raiRisks = useCase.responsibleAIImpact?.principleAssessments
    ?.filter(p => p.risk === 'high')
    .slice(0, 3)
    .map(p => `${p.principle}: ${p.reason}`)
    .join('; ') || '—'

  return `
USE CASE: ${useCase.title}
DESCRIPTION: ${useCase.description}
${ctx.customerName ? `CUSTOMER: ${ctx.customerName}` : ''}
${ctx.industry ? `INDUSTRY: ${ctx.industry}` : ''}
${ctx.region ? `REGION: ${ctx.region}` : ''}
${ctx.internalContext?.length ? `INTERNAL CONTEXT: ${ctx.internalContext.join('; ')}` : ''}

PROBLEM (customer's words): ${useCase.problemStatement || useCase.description}
CONFIRMED: ${useCase.problemConfirmed ? 'yes' : 'no'}

BUSINESS PROCESSES IMPACTED: ${businessProcesses}

PROPOSED SOLUTION (Microsoft stack): ${solutionText}
REFERENCE ARCHITECTURE: ${useCase.referenceArchitecture || '—'}

COST OF INACTION (annual):
- Direct: ${fmtMoney(coi?.directCosts)}
- Opportunity: ${fmtMoney(coi?.opportunityCosts)}
- Risk: ${fmtMoney(coi?.riskCosts)}
- TOTAL COI: ${fmtMoney(coi?.totalAnnualCOI)}
COI notes: ${coi?.notes || '—'}

RUN COST (Azure + licenses, monthly): ${fmtMoney(runCost.totalMonthlyUSD)}  → annual ${fmtMoney(runCost.totalAnnualUSD)}
- Compute: ${fmtMoney(runCost.monthlyComputeUSD)}/mo
- Licenses: ${fmtMoney(runCost.monthlyLicenseUSD)}/mo
- Data: ${fmtMoney(runCost.monthlyDataUSD)}/mo
ONE-TIME IMPLEMENTATION: ${fmtMoney(runCost.oneTimeImplementationUSD)}
EFFORT: ${useCase.aiEffortEstimate?.effortWeeks || '—'} person-weeks

EXPECTED ANNUAL VALUE:
- Revenue impact: ${fmtMoney(ev?.revenueImpact)}
- Cost savings: ${fmtMoney(ev?.costSavings)}
- Risk mitigation: ${fmtMoney(ev?.riskMitigation)}
- TOTAL VALUE: ${fmtMoney(ev?.totalAnnualValue)}
- 3-yr ROI: ${ev?.threeYearROI ? `${ev.threeYearROI}%` : '—'}
- Payback: ${payback ? `${payback} months` : '—'}

NET ANNUAL BENEFIT (Value − Run Cost): ${fmtMoney(netAnnual)}

REGULATORY: ${regs}
RESPONSIBLE AI RISKS: ${raiRisks}
DATA CLASSIFICATION: ${useCase.cybersecurity?.dataClassification || '—'}

OPEN QUESTIONS: ${(useCase.openQuestions || []).filter(q => !q.answeredAt).map(q => q.question).slice(0, 3).join('; ') || 'none'}
DISPOSITION: ${useCase.disposition || 'pursue'}
`.trim()
}

/** Generate (or regenerate) the Business Case markdown for a use case. */
export async function generateBusinessCase(useCase: UseCase, ctx: BusinessCaseContext = {}): Promise<string> {
  const summary = summarizeUseCase(useCase, ctx)
  const prompt = `Write a one-page executive Business Case for the following use case. Use the data provided — do not invent numbers. Where a value is "—", state "not yet quantified" rather than guessing.\n\n${summary}`
  const md = await callAIForTask('business-case', prompt, { systemPrompt: SYSTEM_PROMPT })
  return md.trim()
}
