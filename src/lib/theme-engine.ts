/**
 * Theme engine — the dual, entity-aware intelligence layer.
 *
 *  - Companies (public/private)  -> extractPressureThemes()  (earnings/financials)
 *  - Public sector (government)  -> extractAuditThemes()      (AGSA / Treasury)
 *
 * Both kinds of theme are tagged with an Azure solution area + briefing track
 * and feed the Pipeline Plan, use-case mapping and briefing agenda. Themes are
 * always generated live from source text — never hardcoded.
 *
 * Pure helpers (classification, normalization, agenda assembly) are exported so
 * they can be unit-tested without invoking the model.
 */
import type {
  AuditTheme,
  AuditThemeCategory,
  BriefingAgenda,
  BriefingAgendaSession,
  BriefingTrackId,
  Commitment,
  EarningsInsight,
  EntityType,
  Industry,
  PressureTheme,
  PressureThemeCategory,
  SolutionArea,
} from './types'
import { callAIForTask } from './openai-service'
import { parseJsonLenient } from './lenient-json'
import {
  BRIEFING_TRACKS,
  BRIEFING_TRACK_ORDER,
  briefingTrackForAuditTheme,
  briefingTrackForPressureTheme,
  getBriefingTrackLabel,
  solutionAreaForAuditTheme,
  solutionAreaForPressureTheme,
} from './briefing-tracks'

export interface ThemeExtractionInput {
  companyName: string
  industry?: Industry
  entityType?: EntityType
  region?: 'ZA' | 'US' | 'EU' | 'GLOBAL'
  /** Raw source text: earnings transcript, filing, annual/AGSA report, news. */
  sourceText?: string
  /** Short structured financial/audit snapshot summary. */
  financialSummary?: string
  /** Previously extracted insights to consider. */
  earningsInsights?: EarningsInsight[]
}

const PRESSURE_CATEGORIES: PressureThemeCategory[] = [
  'growth', 'margin-cost', 'digital', 'customer', 'supply-chain', 'data-analytics',
  'cyber-resilience', 'workforce', 'regulatory-esg', 'm-and-a', 'competition', 'energy-security',
]

const AUDIT_CATEGORIES: AuditThemeCategory[] = [
  'T1-irregular-expenditure', 'T2-consequence-mgmt', 'T3-financial-misstatement',
  'T4-performance-reporting', 'T5-it-controls', 'T6-cybersecurity', 'T7-backup-dr',
  'T8-legacy-infrastructure', 'T9-failed-ict-projects', 'T10-data-integrity', 'T11-scm-case-backlog',
]

// Heuristic keyword map for deterministic fallback classification (priority order).
const PRESSURE_KEYWORDS: Array<[PressureThemeCategory, string[]]> = [
  ['energy-security', ['load-shedding', 'loadshedding', 'load shedding', 'power outage', 'energy security', 'diesel', 'generator', 'electricity supply']],
  ['cyber-resilience', ['cyber', 'ransomware', 'data breach', 'security incident', 'phishing', 'malware']],
  ['supply-chain', ['supply chain', 'logistics', 'inventory', 'procurement', 'distribution network']],
  ['margin-cost', ['margin', 'cost pressure', 'cost-to-serve', 'inflation', 'efficiency', 'cost saving', 'overhead']],
  ['customer', ['customer experience', 'churn', 'retention', 'loyalty', 'customer satisfaction', 'cx']],
  ['m-and-a', ['acquisition', 'merger', 'm&a', 'integration of', 'bolt-on']],
  ['regulatory-esg', ['regulat', 'compliance', 'esg', 'privacy', 'popia', 'sustainab', 'carbon', 'two-pot', 'king iv']],
  ['data-analytics', ['data platform', 'analytics', 'data-driven', 'business intelligence', 'reporting', 'single view']],
  ['workforce', ['talent', 'workforce', 'skills shortage', 'employee productivity', 'reskilling']],
  ['competition', ['competit', 'disrupt', 'market share loss', 'new entrant', 'price war']],
  ['digital', ['digital', 'modernis', 'moderniz', 'cloud migration', 'legacy system', 'transformation']],
  ['growth', ['revenue growth', 'expansion', 'new market', 'top-line', 'organic growth', 'market expansion']],
]

/** Deterministic fallback classifier — maps free text to a pressure category. */
export function classifyPressureHeuristic(text: string): PressureThemeCategory {
  const t = (text || '').toLowerCase()
  for (const [category, keywords] of PRESSURE_KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) return category
  }
  return 'digital'
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function clampSeverity(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return undefined
  return Math.min(5, Math.max(1, Math.round(n)))
}

/** Normalize raw AI objects into validated PressureTheme[] with track mapping. */
export function normalizePressureThemes(raw: unknown[]): PressureTheme[] {
  if (!Array.isArray(raw)) return []
  const out: PressureTheme[] = []
  for (const item of raw) {
    const o = (item ?? {}) as Record<string, unknown>
    const title = asString(o.title)
    if (!title) continue
    const description = asString(o.description) ?? title
    let category = asString(o.category) as PressureThemeCategory | undefined
    if (!category || !PRESSURE_CATEGORIES.includes(category)) {
      category = classifyPressureHeuristic(`${title} ${description} ${asString(o.evidence) ?? ''}`)
    }
    out.push({
      id: crypto.randomUUID(),
      title,
      category,
      description,
      evidence: asString(o.evidence),
      source: asString(o.source) as PressureTheme['source'],
      sourceDate: asString(o.sourceDate),
      severity: clampSeverity(o.severity),
      solutionArea: solutionAreaForPressureTheme(category),
      briefingTrack: briefingTrackForPressureTheme(category),
      createdAt: Date.now(),
    })
  }
  return out
}

/** Normalize raw AI objects into validated AuditTheme[] with track mapping. */
export function normalizeAuditThemes(raw: unknown[]): AuditTheme[] {
  if (!Array.isArray(raw)) return []
  const out: AuditTheme[] = []
  for (const item of raw) {
    const o = (item ?? {}) as Record<string, unknown>
    const title = asString(o.title)
    if (!title) continue
    let category = asString(o.category) as AuditThemeCategory | undefined
    if (!category || !AUDIT_CATEGORIES.includes(category)) continue // audit category must be explicit (T1–T11)
    out.push({
      id: crypto.randomUUID(),
      title,
      category,
      description: asString(o.description) ?? title,
      evidence: asString(o.evidence),
      source: asString(o.source) as AuditTheme['source'],
      sourceDate: asString(o.sourceDate),
      severity: clampSeverity(o.severity),
      auditOutcome: asString(o.auditOutcome),
      solutionArea: solutionAreaForAuditTheme(category),
      briefingTrack: briefingTrackForAuditTheme(category),
      createdAt: Date.now(),
    })
  }
  return out
}

/** Normalize raw AI objects into validated Commitment[]. */
export function normalizeCommitments(
  raw: unknown[],
  kind: Commitment['kind'],
): Commitment[] {
  if (!Array.isArray(raw)) return []
  const out: Commitment[] = []
  for (const item of raw) {
    const o = (item ?? {}) as Record<string, unknown>
    const statement = asString(o.statement) ?? asString(o.commitment) ?? asString(o.directive)
    if (!statement) continue
    const status = asString(o.status) as Commitment['status']
    out.push({
      id: crypto.randomUUID(),
      kind,
      statement,
      source: asString(o.source) ?? asString(o.executive) ?? asString(o.issuedBy),
      sourceDate: asString(o.sourceDate),
      timeframe: asString(o.timeframe) ?? asString(o.targetDate) ?? asString(o.deadline),
      status: status && ['committed', 'in-progress', 'at-risk', 'met', 'unknown'].includes(status) ? status : 'unknown',
      howAzureHelps: asString(o.howAzureHelps),
      createdAt: Date.now(),
    })
  }
  return out
}

function regionContext(region?: ThemeExtractionInput['region']): string {
  if (region === 'ZA') {
    return [
      'MARKET CONTEXT: South Africa. Consider locally material pressures where evidenced:',
      'energy security / load-shedding and diesel costs; rand (ZAR) volatility and FX exposure;',
      'POPIA data privacy; King IV governance; JSE Listings Requirements; SARB/Prudential Authority',
      'and FSCA for financial firms; two-pot retirement reform (insurers/retirement funds); B-BBEE',
      'transformation; financial inclusion and the cash-vs-digital shift.',
    ].join(' ')
  }
  return ''
}

function buildContext(input: ThemeExtractionInput): string {
  const parts: string[] = [`COMPANY: ${input.companyName}`]
  if (input.industry) parts.push(`INDUSTRY: ${input.industry}`)
  if (input.entityType) parts.push(`ENTITY TYPE: ${input.entityType}`)
  const rc = regionContext(input.region)
  if (rc) parts.push(rc)
  if (input.financialSummary) parts.push(`FINANCIAL SNAPSHOT:\n${input.financialSummary}`)
  if (input.earningsInsights?.length) {
    parts.push(
      'EXISTING INSIGHTS:\n' +
        input.earningsInsights.slice(0, 12).map((i) => `- [${i.category}] ${i.title}: ${i.description}`).join('\n'),
    )
  }
  if (input.sourceText) parts.push(`SOURCE MATERIAL:\n${input.sourceText.slice(0, 12000)}`)
  return parts.join('\n\n')
}

function parseThemeArray(rawResponse: string): unknown[] {
  try {
    const parsed = parseJsonLenient<unknown>(rawResponse)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      for (const key of ['themes', 'items', 'results', 'commitments', 'directives']) {
        if (Array.isArray(obj[key])) return obj[key] as unknown[]
      }
    }
    return []
  } catch {
    return []
  }
}

/**
 * Extract company pressure/priority themes from earnings & financial source text.
 * Falls back to an empty list if the model is unavailable (caller can retry/paste).
 */
export async function extractPressureThemes(input: ThemeExtractionInput): Promise<PressureTheme[]> {
  const allowed = PRESSURE_CATEGORIES.join(', ')
  const prompt = `You are a Microsoft enterprise strategist analysing a company to surface the strategic and financial PRESSURE THEMES that create demand for Azure & Microsoft solutions.

${buildContext(input)}

Identify 4–8 distinct pressure/priority themes that are EVIDENCED in the source material (earnings calls, results, filings, news). For each theme return:
- "title": short theme name (max 8 words)
- "category": EXACTLY one of: ${allowed}
- "description": 1–2 sentences on the business pressure
- "evidence": a short verbatim quote or statistic from the source (omit if none)
- "source": one of earnings-call | 10-K | 10-Q | annual-report | sens | trading-statement | news | analyst | financials
- "sourceDate": ISO date if known
- "severity": integer 1 (watch) to 5 (urgent)

Return ONLY a JSON array. Do not invent evidence that is not in the source.`

  try {
    const res = await callAIForTask('analysis', prompt, { expectJson: true })
    return normalizePressureThemes(parseThemeArray(res))
  } catch {
    return []
  }
}

/**
 * Extract public-sector audit-failure themes from AGSA / Treasury source text,
 * classified against the T1–T11 rubric.
 */
export async function extractAuditThemes(input: ThemeExtractionInput): Promise<AuditTheme[]> {
  const allowed = AUDIT_CATEGORIES.join(', ')
  const prompt = `You are a Microsoft public-sector advisor analysing an organ of state to surface AUDIT-FAILURE THEMES (from AGSA PFMA/MFMA reports, annual reports, Treasury data) that create demand for Azure & Microsoft solutions.

${buildContext(input)}

Identify 3–8 audit-failure themes EVIDENCED in the source material. For each return:
- "title": short theme name (max 8 words)
- "category": EXACTLY one of these AGSA rubric ids: ${allowed}
- "description": 1–2 sentences on the control/finding
- "evidence": a short verbatim finding or statistic (omit if none)
- "source": one of agsa-pfma | agsa-mfma | annual-report | municipal-money | vulekamali | pmg | news
- "sourceDate": ISO date if known
- "severity": integer 1 to 5
- "auditOutcome": audit opinion if stated (Unqualified | Qualified | Adverse | Disclaimer)

Return ONLY a JSON array. Do not invent findings that are not in the source.`

  try {
    const res = await callAIForTask('analysis', prompt, { expectJson: true })
    return normalizeAuditThemes(parseThemeArray(res))
  } catch {
    return []
  }
}

/**
 * Extract commitments — management commitments (companies) or remedial
 * directives (public sector) — from source text.
 */
export async function extractCommitments(
  input: ThemeExtractionInput,
  kind: Commitment['kind'],
): Promise<Commitment[]> {
  const isDirective = kind === 'remedial-directive'
  const prompt = isDirective
    ? `From the public-sector source material below, extract REMEDIAL DIRECTIVES & INSTRUMENTS that the entity must comply with (e.g. AGSA Material Irregularity process, Certificate of Debt, Irregular Expenditure Framework, withholding of equitable share s216(2), Section 139 intervention / Financial Recovery Plan).

${buildContext(input)}

For each return JSON: "statement" (what it requires), "source" (issuing authority, e.g. AGSA, National Treasury), "sourceDate", "timeframe" (statutory deadline), "status" (committed|in-progress|at-risk|met|unknown), "howAzureHelps" (1 sentence on the Microsoft/Azure capability that helps comply). Return ONLY a JSON array.`
    : `From the company source material below, extract MANAGEMENT COMMITMENTS made to investors (strategic initiatives, guidance, targets stated by executives on earnings calls or in results).

${buildContext(input)}

For each return JSON: "statement" (the commitment), "source" (executive name/role if stated), "sourceDate", "timeframe" (target date, e.g. FY26), "status" (committed|in-progress|at-risk|met|unknown), "howAzureHelps" (1 sentence). Return ONLY a JSON array. Do not invent commitments not in the source.`

  try {
    const res = await callAIForTask('analysis', prompt, { expectJson: true })
    return normalizeCommitments(parseThemeArray(res), kind)
  } catch {
    return []
  }
}

/** Convenience dispatcher: company entities -> pressure themes, gov -> audit themes. */
export async function extractThemesForEntity(
  input: ThemeExtractionInput,
): Promise<{ pressureThemes: PressureTheme[]; auditThemes: AuditTheme[] }> {
  if (input.entityType === 'government') {
    return { pressureThemes: [], auditThemes: await extractAuditThemes(input) }
  }
  return { pressureThemes: await extractPressureThemes(input), auditThemes: [] }
}

// ── Briefing agenda assembly (deterministic) ────────────────────────────────

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + mins
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

interface TrackableTheme {
  id: string
  title: string
  briefingTrack?: BriefingTrackId
}

/**
 * Build a half-day briefing agenda from the themes present, mapping each
 * track to the themes it addresses. Entity-aware track labels.
 */
export function generateBriefingAgenda(
  themes: TrackableTheme[],
  options: { companyName: string; entityType?: EntityType } = { companyName: 'the organisation' },
): BriefingAgenda {
  const tracksPresent = BRIEFING_TRACK_ORDER.filter((id) =>
    themes.some((t) => t.briefingTrack === id),
  )
  const tracks = tracksPresent.length > 0 ? tracksPresent : BRIEFING_TRACK_ORDER

  const sessions: BriefingAgendaSession[] = [
    { startTime: '08:30', endTime: '09:00', title: 'Arrival & welcome', focus: 'Registration, coffee, and framing of the day: from signals to action.' },
    { startTime: '09:00', endTime: '09:30', title: 'Setting the scene', focus: `Walk through the themes most relevant to ${options.companyName} and the cost of inaction.` },
  ]

  let cursor = '09:30'
  tracks.forEach((id, idx) => {
    const meta = BRIEFING_TRACKS[id]
    const label = getBriefingTrackLabel(id, options.entityType)
    const linked = themes.filter((t) => t.briefingTrack === id)
    const end = addMinutes(cursor, 45)
    sessions.push({
      startTime: cursor,
      endTime: end,
      title: `Track ${id} – ${label}`,
      focus: meta.focus + (linked.length ? ` Addresses: ${linked.map((l) => l.title).join('; ')}.` : ''),
      solutionArea: meta.solutionArea,
      briefingTrack: id,
      linkedThemeIds: linked.map((l) => l.id),
    })
    cursor = end
    // 15-minute networking break after the second track session.
    if (idx === 1 && tracks.length > 2) {
      const breakEnd = addMinutes(cursor, 15)
      sessions.push({ startTime: cursor, endTime: breakEnd, title: 'Networking break', focus: 'Break.' })
      cursor = breakEnd
    }
  })

  return {
    title: `Half-Day Innovation Hub Briefing — ${options.companyName}`,
    generatedAt: Date.now(),
    sessions,
  }
}

// ── Theme -> Azure use-case mapping (deterministic, always available) ────────

export interface ThemeUseCaseMapping {
  themeId: string
  themeTitle: string
  customerUseCase: string
  outcome: string
  solutionArea: SolutionArea
  briefingTrack: BriefingTrackId
  azureServices: string[]
}

const PRESSURE_USE_CASE: Record<PressureThemeCategory, { useCase: string; outcome: string }> = {
  growth: { useCase: 'AI-driven growth: demand forecasting, personalisation and new digital revenue streams', outcome: 'Accelerates revenue growth and new digital offerings' },
  'margin-cost': { useCase: 'AI anomaly detection on spend plus FinOps cost optimisation', outcome: 'Protects margin and surfaces cost-to-serve savings' },
  digital: { useCase: 'Application modernisation onto a secure Azure landing zone', outcome: 'Replaces legacy systems and speeds delivery' },
  customer: { useCase: 'Customer 360 with Copilot-assisted service and retention', outcome: 'Improves customer experience and reduces churn' },
  'supply-chain': { useCase: 'Predictive supply-chain analytics and digital twin', outcome: 'Improves resilience and service levels' },
  'data-analytics': { useCase: 'Governed data platform (Fabric + Purview) with trusted reporting', outcome: 'Single source of truth and faster, assured insight' },
  'cyber-resilience': { useCase: 'Zero Trust, unified SIEM/XDR and tested backup & DR', outcome: 'Closes security gaps and assures continuity' },
  workforce: { useCase: 'Microsoft 365 Copilot and low-code automation for productivity', outcome: 'Lifts workforce productivity' },
  'regulatory-esg': { useCase: 'Purview-governed compliance and ESG reporting', outcome: 'Assures compliance and ESG disclosure' },
  'm-and-a': { useCase: 'Data integration and master-data management for M&A', outcome: 'Accelerates integration with unified data' },
  competition: { useCase: 'AI-led product innovation and rapid experimentation', outcome: 'Defends share and speeds innovation' },
  'energy-security': { useCase: 'Operational resilience: backup-power analytics, DR and hybrid continuity', outcome: 'Sustains operations through outages' },
}

const AUDIT_USE_CASE: Record<AuditThemeCategory, { useCase: string; outcome: string }> = {
  'T1-irregular-expenditure': { useCase: 'Trusted financial data platform with automated reconciliation', outcome: 'Reduces irregular spend and assures statutory reporting' },
  'T2-consequence-mgmt': { useCase: 'Accountability dashboards with case and consequence tracking', outcome: 'Enforces consequences and supports oversight' },
  'T3-financial-misstatement': { useCase: 'Automated reconciliation and continuous close', outcome: 'Reduces material misstatements and speeds reporting' },
  'T4-performance-reporting': { useCase: 'Single source of truth for performance reporting (Power BI + lineage)', outcome: 'Makes performance reports credible and auditable' },
  'T5-it-controls': { useCase: 'Zero Trust identity and security-management modernisation', outcome: 'Closes IT general-control gaps' },
  'T6-cybersecurity': { useCase: 'Unified SIEM/XDR and incident response (Sentinel, Defender)', outcome: 'Detects and responds to cyber threats' },
  'T7-backup-dr': { useCase: 'Tested cloud backup and disaster recovery (Azure Backup, Site Recovery)', outcome: 'Restores backup and DR readiness' },
  'T8-legacy-infrastructure': { useCase: 'Datacentre exit and platform modernisation (Landing Zones, Migrate, Arc)', outcome: 'Replaces ageing infrastructure' },
  'T9-failed-ict-projects': { useCase: 'Value-realisation governance: DevOps plus FinOps/licence optimisation', outcome: 'Stops wasted ICT spend' },
  'T10-data-integrity': { useCase: 'Master-data management and integration (Fabric, Purview, Data Factory)', outcome: 'Stops errors from unintegrated data' },
  'T11-scm-case-backlog': { useCase: 'Digital case / e-docket and investigation management (Power Platform)', outcome: 'Tracks actions to closure and clears backlog' },
}

function trackOf(track: BriefingTrackId): { solutionArea: SolutionArea; azureServices: string[] } {
  const meta = BRIEFING_TRACKS[track]
  return { solutionArea: meta.solutionArea, azureServices: meta.azureServices }
}

/** Build Theme -> Azure use-case mapping rows for company pressure themes. */
export function mapPressureThemesToUseCases(themes: PressureTheme[]): ThemeUseCaseMapping[] {
  return themes.map((t) => {
    const track = t.briefingTrack ?? briefingTrackForPressureTheme(t.category)
    const tmpl = PRESSURE_USE_CASE[t.category]
    const { solutionArea, azureServices } = trackOf(track)
    return {
      themeId: t.id,
      themeTitle: t.title,
      customerUseCase: tmpl.useCase,
      outcome: tmpl.outcome,
      solutionArea: t.solutionArea ?? solutionArea,
      briefingTrack: track,
      azureServices,
    }
  })
}

/** Build Theme -> Azure use-case mapping rows for public-sector audit themes. */
export function mapAuditThemesToUseCases(themes: AuditTheme[]): ThemeUseCaseMapping[] {
  return themes.map((t) => {
    const track = t.briefingTrack ?? briefingTrackForAuditTheme(t.category)
    const tmpl = AUDIT_USE_CASE[t.category]
    const { solutionArea, azureServices } = trackOf(track)
    return {
      themeId: t.id,
      themeTitle: t.title,
      customerUseCase: tmpl.useCase,
      outcome: tmpl.outcome,
      solutionArea: t.solutionArea ?? solutionArea,
      briefingTrack: track,
      azureServices,
    }
  })
}
