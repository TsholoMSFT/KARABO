export type ThreadlightTopItem = {
  title: string
  description?: string
  scoreLabel?: string
  scoreValue?: number
}

export type ThreadlightFinancials = {
  annualCOI?: number
  annualValue?: number
  implementationCost?: number
  paybackMonths?: number
  roi3YearPercent?: number
}

export type ThreadlightByopTemplateInput = {
  customerName?: string
  opportunityName?: string
  industryLabel?: string
  processCandidates?: string
  processNotes?: string
  constraints?: string
  executiveSummary?: string
  topItems?: ThreadlightTopItem[]
  financials?: ThreadlightFinancials
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim()
}

export function makeThreadlightShortName(value: string, maxLen: number = 40): string {
  const cleaned = normalizeWhitespace(value)
    .replace(/[^a-zA-Z0-9 _\-]/g, '')
    .replace(/[ ]{2,}/g, ' ')
    .trim()

  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…'
}

function formatMoney(amount: number | undefined, currency: 'USD' | 'GBP' | 'EUR' = 'USD'): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '<USER_INPUT>'
  try {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return String(Math.round(amount))
  }
}

function formatNumber(amount: number | undefined, decimals: number = 0): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '<USER_INPUT>'
  return amount.toFixed(decimals)
}

function formatPercent(amount: number | undefined, decimals: number = 0): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '<USER_INPUT>'
  return `${amount.toFixed(decimals)}%`
}

export function buildThreadlightByopPasteText(input: ThreadlightByopTemplateInput): string {
  const industry = input.industryLabel || '<USER_SELECT_IN_WIZARD>'
  const customer = input.customerName || '<CUSTOMER>'
  const opportunity = input.opportunityName || '<OPPORTUNITY>'

  const top = Array.isArray(input.topItems) ? input.topItems : []
  const topBlock = top.length
    ? top
        .slice(0, 5)
        .map((t, idx) => {
          const score = t.scoreLabel
            ? `${t.scoreLabel}: ${typeof t.scoreValue === 'number' ? formatNumber(t.scoreValue, 2) : '<USER_INPUT>'}`
            : 'Score: <USER_INPUT>'

          const desc = t.description ? normalizeWhitespace(t.description) : '<DESCRIPTION>'
          return `${idx + 1}. ${normalizeWhitespace(t.title)}\n   - ${score}\n   - ${desc}`
        })
        .join('\n')
    : '1. <TOP_ITEM_TITLE>\n   - Score: <USER_INPUT>\n   - <DESCRIPTION>'

  const processCandidates = input.processCandidates && input.processCandidates.trim().length > 0
    ? normalizeWhitespace(input.processCandidates)
    : '<USER_INPUT>'

  const processNotes = input.processNotes && input.processNotes.trim().length > 0
    ? normalizeWhitespace(input.processNotes)
    : '<USER_INPUT>'

  const constraints = input.constraints && input.constraints.trim().length > 0
    ? normalizeWhitespace(input.constraints)
    : '<USER_INPUT>'

  const execSummary = input.executiveSummary && input.executiveSummary.trim().length > 0
    ? normalizeWhitespace(input.executiveSummary)
    : '<USER_INPUT>'

  const f = input.financials
  const annualCOI = formatMoney(f?.annualCOI, 'USD')
  const annualValue = formatMoney(f?.annualValue, 'USD')
  const investment = formatMoney(f?.implementationCost, 'USD')
  const paybackMonths = formatNumber(f?.paybackMonths, 0)
  const roi3Year = formatPercent(f?.roi3YearPercent, 0)

  // Strict “field: value” template so it’s predictable to paste.
  return [
    'THREADLIGHT_BYOP_V1',
    '---',
    `CUSTOMER: ${customer}`,
    `INDUSTRY: ${industry}`,
    `OPPORTUNITY: ${opportunity}`,
    'SHORT_NAME: <PASTE_SHORT_NAME_FROM_APP>',
    'WIZARD_OPTIONS: <USER_SELECT_IN_THREADLIGHT_UI>',
    '---',
    'PROCESS_CANDIDATES:',
    processCandidates,
    '---',
    'PROCESS_NOTES:',
    processNotes,
    '---',
    'CONSTRAINTS (SECURITY/COMPLIANCE/INTEGRATION):',
    constraints,
    '---',
    'TOP_SCORED_ITEMS:',
    topBlock,
    '---',
    'EXECUTIVE_SUMMARY (OPTIONAL):',
    execSummary,
    '---',
    'FINANCIALS (OPTIONAL):',
    `ANNUAL_COI: ${annualCOI}`,
    `ANNUAL_EXPECTED_VALUE: ${annualValue}`,
    `IMPLEMENTATION_COST: ${investment}`,
    `PAYBACK_MONTHS: ${paybackMonths}`,
    `ROI_3YR_PERCENT: ${roi3Year}`,
    '---',
    'NOTES:',
    '1) Replace <...> placeholders as needed.',
    '2) The wizard “options” should be selected in the Threadlight UI (this block will not auto-select them).',
  ].join('\n')
}

export function buildThreadlightProcessAnalysis(input: ThreadlightByopTemplateInput): string {
  const processCandidates = input.processCandidates && input.processCandidates.trim().length > 0
    ? normalizeWhitespace(input.processCandidates)
    : '<USER_INPUT>'

  const processNotes = input.processNotes && input.processNotes.trim().length > 0
    ? normalizeWhitespace(input.processNotes)
    : '<USER_INPUT>'

  const constraints = input.constraints && input.constraints.trim().length > 0
    ? normalizeWhitespace(input.constraints)
    : '<USER_INPUT>'

  return [
    'PROCESS_ANALYSIS_V1',
    '---',
    'PROCESS_CANDIDATES:',
    processCandidates,
    '---',
    'PROCESS_ANALYSIS:',
    processNotes,
    '---',
    'CONSTRAINTS (SECURITY/COMPLIANCE/INTEGRATION):',
    constraints,
  ].join('\n')
}
