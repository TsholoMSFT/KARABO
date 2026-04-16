/**
 * AboutSection
 *
 * Collapsible "About ID-8" section for the landing page.
 * Contains four subsections:
 *   A — AI Regulations & Compliance (static framework list + live regulatory news)
 *   B — Financial Analysis Methodology (COI, ROI, NPV, IRR, ATM scoring)
 *   C — Platform Capabilities (feature grid)
 *   D — Responsible AI & Disclaimers
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Info,
  Scales,
  Calculator,
  RocketLaunch,
  ShieldCheck,
  CaretDown,
  CaretUp,
  Newspaper,
  Globe,
  Flag,
  Bank,
  Buildings,
  Factory,
  MagnifyingGlass,
  Briefcase,
  ShieldCheck,
  Microphone,
  ChartScatter,
  FileMagnifyingGlass,
  Path,
  FileText,
  FloppyDisk,
  Export,
  Sparkle,
  ChartBar,
  ChartLine,
  TrendUp,
  Target,
  ArrowSquareOut,
  Spinner,
  WarningCircle,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { AI_POLICIES, type AIPolicyDetails, type PolicyJurisdiction, type PolicyStatus } from '@/lib/ai-policies'
import { fetchRegulatoryNews } from '@/lib/regulatory-news-service'
import type { RegulatoryNewsItem } from '@/lib/types'

// ── Jurisdiction Groupings ──────────────────────────────────────────

interface JurisdictionGroup {
  label: string
  icon: typeof Globe
  jurisdictions: PolicyJurisdiction[]
}

const JURISDICTION_GROUPS: JurisdictionGroup[] = [
  { label: 'International / Global', icon: Globe, jurisdictions: ['global'] },
  { label: 'European Union', icon: Flag, jurisdictions: ['european-union'] },
  { label: 'United States', icon: Bank, jurisdictions: ['united-states'] },
  { label: 'South Africa', icon: Flag, jurisdictions: ['south-africa'] },
  { label: 'African Union & Africa', icon: Globe, jurisdictions: ['africa', 'african-union'] },
]

// Policies that start with 'ms-' are Microsoft-specific
function isMicrosoftPolicy(p: AIPolicyDetails): boolean {
  return p.id.startsWith('ms-')
}

function getIndustryPolicies(): AIPolicyDetails[] {
  return Object.values(AI_POLICIES).filter(
    p =>
      ['msha', 'epa', 'osha', 'nerc-cip', 'pci-dss'].includes(p.id) ||
      (p.applicableSectors && !p.applicableSectors.includes('All sectors'))
  )
}

// ── Status badge helper ─────────────────────────────────────────────

function StatusBadge({ status }: { status: PolicyStatus }) {
  const config: Record<PolicyStatus, { label: string; className: string }> = {
    enacted: { label: 'Enacted', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800' },
    'partially-enacted': { label: 'Partial', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
    draft: { label: 'Draft', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    proposed: { label: 'Proposed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    voluntary: { label: 'Voluntary', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  }
  const c = config[status] ?? config.voluntary
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${c.className}`}>
      {c.label}
    </Badge>
  )
}

// ── Feature data ────────────────────────────────────────────────────

interface FeatureItem {
  icon: typeof Sparkle
  title: string
  description: string
}

const FEATURES: FeatureItem[] = [
  { icon: MagnifyingGlass, title: 'Discovery', description: 'Guided industry-aware use case identification with AI-powered suggestions' },
  { icon: Briefcase, title: 'Strategic Assessment', description: '5-stage engagement framework — Start → Opportunity → Decision → Solution → Commit' },
  { icon: ShieldCheck, title: 'Sovereign Cloud Assessment', description: 'Deployment model decision engine for disconnected, government, hybrid, and edge environments — Azure Local, Arc, Foundry Local' },
  { icon: Microphone, title: 'Live Discovery Mode', description: 'Real-time speech-to-text discovery with AI follow-up insights' },
  { icon: ChartScatter, title: 'Prioritization Matrix', description: 'Impact × Feasibility scatter plot with quadrant analysis (Quick Wins, Strategic Bets, …)' },
  { icon: FileMagnifyingGlass, title: 'Company Research', description: 'Multi-source intelligence (paste, upload, RSS) with AI-extracted strategy & financial insights' },
  { icon: Path, title: 'Customer Journey Mapping', description: 'AI-generated engagement journeys from Business Envisioning to Rapid Prototype' },
  { icon: FileText, title: 'Executive Summary Generator', description: 'AI-powered session-to-report generation with stakeholder-ready formatting' },
  { icon: FloppyDisk, title: 'Session Management', description: 'Save, load, and compare discovery sessions side-by-side' },
  { icon: Export, title: 'Export Suite', description: 'PDF, Print, and Excel export capabilities for full deliverables' },
]

// ── Collapsible subsection wrapper ──────────────────────────────────

function SubSection({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: typeof Globe
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-left hover:text-foreground transition-colors group">
        <Icon size={18} weight="duotone" className="text-primary flex-shrink-0" />
        <span className="font-semibold text-sm flex-1">{title}</span>
        {open ? <CaretUp size={14} className="text-muted-foreground" /> : <CaretDown size={14} className="text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-4 pl-7">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ── Regulatory News Panel (live) ────────────────────────────────────

function RegulatoryNewsFeed() {
  const [items, setItems] = useState<RegulatoryNewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [fetched, setFetched] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchRegulatoryNews(['International', 'EU', 'US', 'South Africa'], undefined, 'AI regulation policy update')
      setItems(data.slice(0, 6))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }

  // Load on first render
  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Spinner size={16} className="animate-spin" />
        Loading latest regulatory news…
      </div>
    )
  }

  if (error || (fetched && items.length === 0)) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <WarningCircle size={16} />
        {error ? 'Unable to fetch regulatory news right now.' : 'No recent regulatory news available.'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Latest Regulatory News</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            <Newspaper size={14} weight="duotone" className="mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-foreground font-medium leading-tight line-clamp-2"
                >
                  {item.title}
                  <ArrowSquareOut size={12} className="inline ml-1 opacity-50" />
                </a>
              ) : (
                <span className="text-foreground font-medium leading-tight line-clamp-2">{item.title}</span>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground">{item.source}</span>
                {item.publishedDate && (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {item.jurisdiction && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{item.jurisdiction}</Badge>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────

export function AboutSection() {
  const [open, setOpen] = useState(false)

  // Pre-group policies by jurisdiction
  const allPolicies = Object.values(AI_POLICIES)
  const microsoftPolicies = allPolicies.filter(isMicrosoftPolicy)
  const industryPolicies = getIndustryPolicies()

  const groupedPolicies: Array<{ label: string; icon: typeof Globe; policies: AIPolicyDetails[] }> = [
    ...JURISDICTION_GROUPS.map(g => ({
      label: g.label,
      icon: g.icon,
      policies: allPolicies.filter(
        p => g.jurisdictions.includes(p.jurisdiction) && !isMicrosoftPolicy(p) && !industryPolicies.includes(p)
      ),
    })),
    { label: 'Industry-Specific', icon: Factory, policies: industryPolicies },
    { label: 'Microsoft', icon: Buildings, policies: microsoftPolicies },
  ].filter(g => g.policies.length > 0)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="mx-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Info size={18} weight="duotone" className="text-primary" />
        About ID-8
        {open ? <CaretUp size={14} /> : <CaretDown size={14} />}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
              <Card className="mt-4 border border-muted bg-gradient-to-br from-muted/10 to-transparent">
                <CardContent className="pt-5 pb-5 space-y-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    ID-8 is an enterprise-grade AI discovery and use case assessment platform built on Microsoft Azure OpenAI.
                    It combines regulatory compliance intelligence, financial impact modelling, and structured discovery
                    frameworks to help organisations identify, evaluate, and prioritise AI opportunities.
                  </p>

                  <Separator />

                  {/* ── A: AI Regulations & Compliance ─────────────────── */}
                  <SubSection icon={Scales} title={`AI Regulations & Compliance (${allPolicies.length}+ Frameworks)`}>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        ID-8 references a comprehensive library of AI policies, regulations, and standards across multiple
                        jurisdictions. The regulatory engine uses deterministic keyword matching (no AI hallucinations)
                        with industry-aware risk modulation to classify use cases against applicable frameworks.
                      </p>

                      {/* Grouped frameworks */}
                      <div className="space-y-3">
                        {groupedPolicies.map(group => (
                          <div key={group.label}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <group.icon size={14} weight="duotone" className="text-muted-foreground" />
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {group.label}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">{group.policies.length}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {group.policies.map(p => (
                                <div
                                  key={p.id}
                                  className="inline-flex items-center gap-1 border rounded-md px-2 py-1 text-xs bg-background"
                                  title={p.description}
                                >
                                  <span className="font-medium">{p.shortName}</span>
                                  <StatusBadge status={p.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Live regulatory news */}
                      <RegulatoryNewsFeed />
                    </div>
                  </SubSection>

                  <Separator />

                  {/* ── B: Financial Analysis Methodology ─────────────── */}
                  <SubSection icon={Calculator} title="Financial Analysis Methodology">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        ID-8 provides a full financial analysis toolkit to quantify the business case for each AI use case.
                        All calculators support AI-powered auto-fill from use case context and manual override.
                      </p>

                      {/* COI */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendUp size={16} weight="duotone" className="text-red-500" />
                          <span className="font-semibold text-foreground">Cost of Inaction (COI)</span>
                        </div>
                        <p className="pl-6">
                          Quantifies what it costs an organisation to <em>not</em> act. Uses a three-category model:
                        </p>
                        <ul className="pl-10 list-disc space-y-0.5">
                          <li><strong>Direct Costs</strong> — ongoing labour, operational inefficiency, manual workarounds</li>
                          <li><strong>Opportunity Costs</strong> — revenue not captured, market share erosion, delayed innovation</li>
                          <li><strong>Risk Costs</strong> — regulatory fines, reputational damage, security incidents</li>
                        </ul>
                        <p className="pl-6">
                          <span className="font-medium text-foreground">Total Annual COI</span> = Direct + Opportunity + Risk, displayed with monthly breakdown and category-percentage visualisation.
                        </p>
                      </div>

                      {/* ROI */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ChartBar size={16} weight="duotone" className="text-green-500" />
                          <span className="font-semibold text-foreground">Return on Investment (ROI)</span>
                        </div>
                        <p className="pl-6">
                          Evaluates the value of <em>taking</em> action. Four-input model:
                        </p>
                        <ul className="pl-10 list-disc space-y-0.5">
                          <li><strong>Revenue Impact</strong> — new or incremental annual revenue enabled</li>
                          <li><strong>Cost Savings</strong> — annual operational cost reduction</li>
                          <li><strong>Risk Mitigation</strong> — annual value of avoided losses</li>
                          <li><strong>Implementation Cost</strong> — one-time project investment</li>
                        </ul>
                        <p className="pl-6">
                          Outputs: <strong>Total Annual Value</strong>, <strong>Payback Period</strong> (months), and <strong>3-Year ROI %</strong>.
                          Supports aggregate mode to combine multiple use cases and includes a confidence indicator (High / Medium / Low).
                        </p>
                      </div>

                      {/* Advanced metrics */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ChartLine size={16} weight="duotone" className="text-blue-500" />
                          <span className="font-semibold text-foreground">Advanced Financial Metrics</span>
                        </div>
                        <ul className="pl-10 list-disc space-y-0.5">
                          <li><strong>Net Present Value (NPV)</strong> — discounted at 10 % over 3 years</li>
                          <li><strong>Internal Rate of Return (IRR)</strong> — iterative binary-search calculation</li>
                          <li><strong>P&L Impact Model</strong> — 3-year projection: Revenue → COGS → Gross Margin → OPEX → EBIT</li>
                          <li><strong>Sensitivity Analysis</strong> — Conservative (70 %), Base (100 %), Optimistic (130 %) scenarios</li>
                        </ul>
                        <p className="pl-6">
                          Industry-specific value multipliers are applied automatically (e.g. Financial Services 1.5×, Telecom 1.3×).
                        </p>
                      </div>

                      {/* ATM Scoring */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Target size={16} weight="duotone" className="text-purple-500" />
                          <span className="font-semibold text-foreground">Apps That Matter (ATM) Scoring</span>
                        </div>
                        <p className="pl-6">
                          A composite 0–100 score based on Microsoft's FY26 "Apps That Matter" framework, computed across five weighted dimensions.
                          Each dimension scores its sub-components on a points basis, normalises to 0–100, then contributes its weighted share to the composite.
                          Only assessed components count — missing data reduces confidence, not the score.
                        </p>
                        <div className="pl-6 space-y-2">
                          {/* Business Impact */}
                          <div>
                            <p className="font-medium text-foreground">1. Business Impact <span className="text-purple-500">(25 %)</span></p>
                            <ul className="pl-5 list-disc text-muted-foreground space-y-0.5 text-xs">
                              <li><strong>Financial Quantification</strong> — 30 pts — COI &amp; expected value thresholds ($100 K / $500 K / $1 M+)</li>
                              <li><strong>Strategic Alignment</strong> — 20 pts — alignment score (0–10) × 2, linked strategic priority</li>
                              <li><strong>Impact × Feasibility</strong> — 15 pts — product of the two ratings, scaled</li>
                              <li><strong>RICE Score</strong> — 15 pts — Reach × Impact × Confidence ÷ Effort, log-normalised</li>
                              <li><strong>KPI Definition</strong> — 10 pts — number of measurable KPIs (≥ 3 = full marks)</li>
                              <li><strong>Data Grounding</strong> — 10 pts — earnings (+5), research (+3), discovery (+2)</li>
                            </ul>
                          </div>
                          {/* Innovation / Agentic */}
                          <div>
                            <p className="font-medium text-foreground">2. Innovation / Agentic <span className="text-purple-500">(25 %)</span></p>
                            <ul className="pl-5 list-disc text-muted-foreground space-y-0.5 text-xs">
                              <li><strong>Agent Sophistication</strong> — 25 pts — agent type (orchestrator &gt; specialist &gt; task) + capability count</li>
                              <li><strong>Agentic Opportunity Defined</strong> — 20 pts — ≥ 2 agents = full marks</li>
                              <li><strong>Automation Level</strong> — 20 pts — autonomous / semi-autonomous / assisted, minus oversight deduction</li>
                              <li><strong>Process AI Opportunities</strong> — 20 pts — processes with AI pain points + cycle-time targets</li>
                              <li><strong>Reference Architecture</strong> — 15 pts — agentic-ai pattern = max; high/med/low potential scaled</li>
                              <li><strong>Interop &amp; Orchestration</strong> — 15 pts — MCP/A2A protocols + orchestration patterns</li>
                            </ul>
                          </div>
                          {/* Enterprise-Grade */}
                          <div>
                            <p className="font-medium text-foreground">3. Enterprise-Grade <span className="text-purple-500">(20 %)</span></p>
                            <ul className="pl-5 list-disc text-muted-foreground space-y-0.5 text-xs">
                              <li><strong>Regulatory Assessment</strong> — 25 pts — gate status (clear 25 / warning 10–18 / blocked 0)</li>
                              <li><strong>Security Posture</strong> — 20 pts — security requirements count (of 13) + data classification</li>
                              <li><strong>Risk Management</strong> — 20 pts — risks identified (1–5+) + remediations acknowledged</li>
                              <li><strong>Implementation Readiness</strong> — 20 pts — complexity assessed + duration + team size</li>
                              <li><strong>Landing Zone Readiness</strong> — 20 pts — AI LZ, ESLZ, private endpoints, network model, env separation</li>
                              <li><strong>Customer Maturity</strong> — 15 pts — cloud readiness + data maturity + AI governance</li>
                              <li><strong>WAF Assessment</strong> — 15 pts — Well-Architected pillar average (80 %+ = full marks)</li>
                            </ul>
                          </div>
                          {/* Multi-Pillar */}
                          <div>
                            <p className="font-medium text-foreground">4. Multi-Pillar <span className="text-purple-500">(15 %)</span></p>
                            <ul className="pl-5 list-disc text-muted-foreground space-y-0.5 text-xs">
                              <li><strong>Pillar Coverage</strong> — 50 pts — AI + Apps + Data pillars (3 = 50, 2 = 30, 1 = 15)</li>
                              <li><strong>Service Depth</strong> — 30 pts — distinct Azure/Microsoft services (8+ = full marks)</li>
                              <li><strong>Role Diversity</strong> — 20 pts — primary + supporting + integration roles</li>
                            </ul>
                          </div>
                          {/* Repeatability */}
                          <div>
                            <p className="font-medium text-foreground">5. Repeatability <span className="text-purple-500">(15 %)</span></p>
                            <ul className="pl-5 list-disc text-muted-foreground space-y-0.5 text-xs">
                              <li><strong>Reference Architecture</strong> — 35 pts — known catalog pattern = 35; custom = 15</li>
                              <li><strong>Business Process Mapping</strong> — 30 pts — processes mapped (3+ = 20) + cycle-time targets</li>
                              <li><strong>Industry Alignment</strong> — 20 pts — architecture proven in session industry</li>
                              <li><strong>CAF Maturity</strong> — 20 pts — lifecycle stage (define → adopt) + pillar maturity avg</li>
                              <li><strong>Solution Play Tagging</strong> — 15 pts — tagged solution plays (any = full marks)</li>
                              <li><strong>Architecture Layer Coverage</strong> — 15 pts — up to 5 layers × 3 pts each</li>
                            </ul>
                          </div>
                        </div>
                        <p className="pl-6">
                          <strong>Tiers:</strong> Platinum (≥ 80), Gold (≥ 60), Silver (≥ 40), Not Qualified (&lt; 40).
                          A confidence gate requires ≥ 50 % of components assessed; otherwise the tier shows "Insufficient Data."
                          Gap recommendations are generated with priority ranking based on potential point gain.
                        </p>
                      </div>
                    </div>
                  </SubSection>

                  <Separator />

                  {/* ── C: Platform Capabilities ──────────────────────── */}
                  <SubSection icon={RocketLaunch} title="Platform Capabilities">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FEATURES.map(f => (
                        <div key={f.title} className="flex items-start gap-2.5 border rounded-lg p-3 bg-background">
                          <f.icon size={18} weight="duotone" className="text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground leading-tight">{f.title}</p>
                            <p className="text-xs text-muted-foreground leading-snug mt-0.5">{f.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SubSection>

                  <Separator />

                  {/* ── D: Responsible AI & Disclaimers ───────────────── */}
                  <SubSection icon={ShieldCheck} title="Responsible AI & Disclaimers">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        ID-8 follows the <strong>Microsoft Responsible AI Principles</strong> — fairness, reliability & safety,
                        privacy & security, inclusiveness, transparency, and accountability.
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <strong>Deterministic compliance checks</strong> — all regulatory assessments use keyword-based matching
                          with word-boundary precision. No AI model is involved in compliance classification, eliminating hallucination risk.
                        </li>
                        <li>
                          <strong>AI-generated content labelling</strong> — sections produced by OpenAI GPT-4 are clearly marked.
                          All AI outputs should be reviewed by qualified personnel before decision-making.
                        </li>
                        <li>
                          <strong>Not legal, financial, or regulatory advice</strong> — ID-8 outputs are for informational and
                          planning purposes only. Organisations should consult qualified professionals.
                        </li>
                        <li>
                          <strong>Data residency</strong> — data remains in your Azure tenant. No third-party analytics or tracking is used.
                        </li>
                        <li>
                          <strong>Regional notices</strong> — additional disclaimers are surfaced for South Africa (POPIA, ECTA) and
                          broader African Union deployments (data sovereignty, cross-border transfer).
                        </li>
                      </ul>
                      <p className="text-xs pt-1">
                        Full disclaimer details are available in the assessment reports and export documents.
                      </p>
                    </div>
                  </SubSection>
                </CardContent>
              </Card>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}
