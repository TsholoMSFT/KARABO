/**
 * AIGovernanceAssessment — AI Governance workflow step
 *
 * 3 sub-steps:
 *   A) Governance Maturity Input (6 dimension dropdowns)
 *   B) Governance Maturity Results + Radar Chart + AI Action Plan
 *   C) Responsible AI Impact per Use Case (accordion)
 *
 * Placed between ComplianceReviewStep and Summary in EnhancedDiscoveryWorkflow.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, ShieldCheck, ChartPolar, Warning, CheckCircle, Sparkle, CaretDown, CaretUp, Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AIDataDisclosure } from '@/components/AIDataDisclosure'
import { InlineDisclaimer } from '@/components/Disclaimer'

import type {
  DiscoverySession,
  AIGovernanceDimension,
  AIGovernanceMaturityLevel,
  AIGovernanceAssessment as AIGovernanceAssessmentType,
  ResponsibleAIImpact,
  ResponsibleAIPrinciple,
  AIRiskLevel,
  GovernanceRecommendation,
} from '@/lib/types'
import {
  AI_GOVERNANCE_DIMENSION_LABELS,
  AI_GOVERNANCE_DIMENSION_DESCRIPTIONS,
  AI_GOVERNANCE_MATURITY_CONFIG,
  RESPONSIBLE_AI_PRINCIPLE_LABELS,
} from '@/lib/types'
import { assessGovernanceMaturity, assessPortfolioRAIA } from '@/lib/governance-engine'
import { generateGovernanceActionPlan } from '@/lib/openai-service'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  session: DiscoverySession
  useCases: Array<{ id: string; title: string; description: string }>
  onComplete: (
    assessment: AIGovernanceAssessmentType,
    raiaResults: Map<string, ResponsibleAIImpact>
  ) => void
  onBack: () => void
}

type SubStep = 'input' | 'results' | 'raia'

const ALL_DIMENSIONS: AIGovernanceDimension[] = [
  'ai-strategy',
  'data-governance',
  'model-lifecycle',
  'ethics-fairness',
  'security-privacy',
  'monitoring-accountability',
]

const MATURITY_LEVELS: AIGovernanceMaturityLevel[] = [
  'ad-hoc', 'developing', 'defined', 'managed', 'optimized',
]

const DIMENSION_COLORS: Record<AIGovernanceDimension, string> = {
  'ai-strategy': '#3b82f6',
  'data-governance': '#8b5cf6',
  'model-lifecycle': '#f59e0b',
  'ethics-fairness': '#10b981',
  'security-privacy': '#ef4444',
  'monitoring-accountability': '#ec4899',
}

const RISK_BADGE_CONFIG: Record<AIRiskLevel, { color: string; bg: string; border: string }> = {
  unacceptable: { color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/40' },
  high: { color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
  limited: { color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40' },
  minimal: { color: 'text-green-300', bg: 'bg-green-500/15', border: 'border-green-500/40' },
}

// ============================================================================
// GOVERNANCE RADAR CHART (inline SVG — following CAFReadinessPanel pattern)
// ============================================================================

function GovernanceRadarChart({
  scores,
}: {
  scores: Record<AIGovernanceDimension, AIGovernanceMaturityLevel>
}) {
  const cx = 120
  const cy = 120
  const maxR = 90
  const levels = 5

  const points = useMemo(() => {
    const n = ALL_DIMENSIONS.length
    return ALL_DIMENSIONS.map((dim, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const value = AI_GOVERNANCE_MATURITY_CONFIG[scores[dim]]?.numericValue ?? 0
      const r = (value / levels) * maxR
      return {
        dim,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        labelX: cx + (maxR + 24) * Math.cos(angle),
        labelY: cy + (maxR + 24) * Math.sin(angle),
        value,
      }
    })
  }, [scores])

  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxR
    return (
      <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
    )
  })

  const spokes = ALL_DIMENSIONS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / ALL_DIMENSIONS.length - Math.PI / 2
    return (
      <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
    )
  })

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto text-foreground">
      {gridCircles}
      {spokes}
      <polygon points={polygonPoints} fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} strokeOpacity={0.6} />
      {points.map((p) => (
        <g key={p.dim}>
          <circle cx={p.x} cy={p.y} r={4} fill={DIMENSION_COLORS[p.dim]} stroke="hsl(var(--background))" strokeWidth={1.5} />
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground"
            style={{ fontSize: '7px' }}
          >
            {AI_GOVERNANCE_DIMENSION_LABELS[p.dim].split(' ').map((w, wi) => (
              <tspan key={wi} x={p.labelX} dy={wi === 0 ? 0 : 10}>{w}</tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIGovernanceAssessment({ session, useCases, onComplete, onBack }: Props) {
  const [subStep, setSubStep] = useState<SubStep>('input')

  // Sub-step A: Maturity inputs
  const [dimensionScores, setDimensionScores] = useState<Record<AIGovernanceDimension, AIGovernanceMaturityLevel>>({
    'ai-strategy': 'ad-hoc',
    'data-governance': 'ad-hoc',
    'model-lifecycle': 'ad-hoc',
    'ethics-fairness': 'ad-hoc',
    'security-privacy': 'ad-hoc',
    'monitoring-accountability': 'ad-hoc',
  })

  // Sub-step B: Assessment results
  const [assessment, setAssessment] = useState<AIGovernanceAssessmentType | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  // Sub-step C: RAIA results
  const [raiaResults, setRaiaResults] = useState<Map<string, ResponsibleAIImpact>>(new Map())
  const [expandedUseCases, setExpandedUseCases] = useState<Set<string>>(new Set())

  // ─── Handlers ───

  const handleDimensionChange = useCallback((dim: AIGovernanceDimension, level: AIGovernanceMaturityLevel) => {
    setDimensionScores(prev => ({ ...prev, [dim]: level }))
  }, [])

  const handleAssess = useCallback(async () => {
    // Run deterministic assessment
    const result = assessGovernanceMaturity(dimensionScores)
    setAssessment(result)
    setSubStep('results')
    toast.success('Governance maturity assessed!')

    // Generate AI action plan in background
    setIsGeneratingPlan(true)
    try {
      const actionPlan = await generateGovernanceActionPlan({
        dimensionScores,
        overallMaturity: result.overallMaturity,
        gaps: result.gaps,
        entityType: session.entityType,
        industry: session.industry,
        useCaseTitles: useCases.map(uc => uc.title),
      })
      setAssessment(prev => prev ? { ...prev, actionPlan } : prev)
      toast.success('AI governance action plan generated!')
    } catch {
      toast.error('Failed to generate AI action plan — using deterministic recommendations')
    } finally {
      setIsGeneratingPlan(false)
    }
  }, [dimensionScores, session, useCases])

  const handleProceedToRAIA = useCallback(() => {
    // Run deterministic RAIA for all use cases
    const results = assessPortfolioRAIA(useCases, assessment?.overallMaturity)
    setRaiaResults(results)
    setSubStep('raia')
    toast.success('Responsible AI impact assessed for all use cases!')
  }, [useCases, assessment])

  const handleComplete = useCallback(() => {
    if (assessment) {
      onComplete(assessment, raiaResults)
    }
  }, [assessment, raiaResults, onComplete])

  const toggleUseCaseExpanded = useCallback((id: string) => {
    setExpandedUseCases(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Overall maturity color
  const maturityColor = assessment
    ? assessment.overallMaturity >= 3.5 ? 'text-green-400'
      : assessment.overallMaturity >= 2.5 ? 'text-yellow-400'
      : 'text-red-400'
    : ''

  // ─── Render ───

  return (
    <AnimatePresence mode="wait">
      {/* ================================================================
          SUB-STEP A: Governance Maturity Input
          ================================================================ */}
      {subStep === 'input' && (
        <motion.div
          key="gov-input"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <ShieldCheck size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Governance Assessment</CardTitle>
                  <CardDescription>
                    Rate the customer's AI governance maturity across 6 dimensions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Assess the organization's current governance readiness for AI deployment. Each dimension is rated on a 5-level maturity scale aligned with the Microsoft Responsible AI Standard and NIST AI RMF.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALL_DIMENSIONS.map(dim => (
                  <div key={dim} className="space-y-2 p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DIMENSION_COLORS[dim] }} />
                      <Label className="text-sm font-medium">{AI_GOVERNANCE_DIMENSION_LABELS[dim]}</Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {AI_GOVERNANCE_DIMENSION_DESCRIPTIONS[dim]}
                    </p>
                    <Select
                      value={dimensionScores[dim]}
                      onValueChange={(v) => handleDimensionChange(dim, v as AIGovernanceMaturityLevel)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATURITY_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AI_GOVERNANCE_MATURITY_CONFIG[level].color }} />
                              {AI_GOVERNANCE_MATURITY_CONFIG[level].label} — {AI_GOVERNANCE_MATURITY_CONFIG[level].description}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                <Button onClick={handleAssess}>
                  Assess Governance <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ================================================================
          SUB-STEP B: Governance Results + Radar Chart + Action Plan
          ================================================================ */}
      {subStep === 'results' && assessment && (
        <motion.div
          key="gov-results"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <ChartPolar size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Governance Maturity Results</CardTitle>
                  <CardDescription>
                    Overall maturity: <span className={`font-bold ${maturityColor}`}>{assessment.overallMaturity.toFixed(1)}/5</span>
                    {' '}({AI_GOVERNANCE_MATURITY_CONFIG[assessment.overallMaturityLabel].label})
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Radar Chart + Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GovernanceRadarChart scores={dimensionScores} />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Dimension Scores</h4>
                  {ALL_DIMENSIONS.map(dim => {
                    const level = dimensionScores[dim]
                    const config = AI_GOVERNANCE_MATURITY_CONFIG[level]
                    return (
                      <div key={dim} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DIMENSION_COLORS[dim] }} />
                          {AI_GOVERNANCE_DIMENSION_LABELS[dim]}
                        </span>
                        <Badge variant="outline" className="text-xs" style={{ color: config.color, borderColor: config.color }}>
                          {config.label} ({config.numericValue}/5)
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Identified Gaps */}
              {assessment.gaps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Warning size={16} className="text-amber-400" /> Identified Gaps ({assessment.gaps.length})
                  </h4>
                  <div className="space-y-2">
                    {assessment.gaps.map((gap, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DIMENSION_COLORS[gap.dimension] }} />
                          <span className="font-medium">{AI_GOVERNANCE_DIMENSION_LABELS[gap.dimension]}</span>
                          <Badge variant={gap.impact === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {gap.impact} impact
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">{gap.gap}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Current: {AI_GOVERNANCE_MATURITY_CONFIG[gap.currentLevel].label} &rarr; Target: {AI_GOVERNANCE_MATURITY_CONFIG[gap.targetLevel].label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assessment.gaps.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-400 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                  <CheckCircle size={18} weight="fill" />
                  All governance dimensions meet or exceed target maturity levels.
                </div>
              )}

              <Separator />

              {/* AI-Generated Action Plan */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkle size={16} className="text-primary" /> AI Governance Action Plan
                </h4>

                <AIDataDisclosure
                  fields={['governance dimension scores', 'identified gaps', 'entity type', 'industry', 'use case titles']}
                  model="gpt-4o-mini"
                  note="Used to generate a contextual governance action plan. Data is not stored."
                />

                {isGeneratingPlan && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                    <Sparkle size={16} className="text-primary animate-pulse" />
                    Generating AI governance action plan...
                  </div>
                )}

                {assessment.actionPlan && (
                  <div className="space-y-4">
                    <p className="text-sm text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                      {assessment.actionPlan.overallReadinessStatement}
                    </p>

                    {[
                      { label: 'Short-term (0-3 months)', items: assessment.actionPlan.shortTerm, icon: '\uD83D\uDD34' },
                      { label: 'Medium-term (3-12 months)', items: assessment.actionPlan.mediumTerm, icon: '\uD83D\uDFE1' },
                      { label: 'Long-term (12+ months)', items: assessment.actionPlan.longTerm, icon: '\uD83D\uDFE2' },
                    ].map(({ label, items, icon }) => items.length > 0 && (
                      <div key={label} className="space-y-2">
                        <h5 className="text-xs font-semibold text-muted-foreground">{icon} {label}</h5>
                        {items.map((rec) => (
                          <ActionPlanCard key={rec.id} rec={rec} />
                        ))}
                      </div>
                    ))}

                    <InlineDisclaimer text="AI-generated action plan — review with customer before adoption." icon="ai" className="text-[10px]" />
                  </div>
                )}

                {!assessment.actionPlan && !isGeneratingPlan && (
                  <p className="text-xs text-muted-foreground">Action plan will be generated automatically...</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setSubStep('input')}>
                  <ArrowLeft size={16} className="mr-2" /> Edit Scores
                </Button>
                <Button onClick={handleProceedToRAIA}>
                  Responsible AI Impact <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ================================================================
          SUB-STEP C: Responsible AI Impact per Use Case
          ================================================================ */}
      {subStep === 'raia' && (
        <motion.div
          key="gov-raia"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <ShieldCheck size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Responsible AI Impact Assessment</CardTitle>
                  <CardDescription>
                    Per-use-case assessment across the 6 Microsoft Responsible AI Principles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary bar */}
              <div className="flex flex-wrap gap-3">
                {(['high', 'limited', 'minimal'] as AIRiskLevel[]).map(level => {
                  const count = useCases.filter(uc => raiaResults.get(uc.id)?.overallRisk === level).length
                  if (count === 0) return null
                  return (
                    <Badge
                      key={level}
                      variant="outline"
                      className={`${RISK_BADGE_CONFIG[level].color} ${RISK_BADGE_CONFIG[level].bg} ${RISK_BADGE_CONFIG[level].border}`}
                    >
                      {count} {level} risk
                    </Badge>
                  )
                })}
              </div>

              {/* Per use-case accordion */}
              <div className="space-y-2">
                {useCases.map(uc => {
                  const raia = raiaResults.get(uc.id)
                  if (!raia) return null
                  const isExpanded = expandedUseCases.has(uc.id)
                  const riskConfig = RISK_BADGE_CONFIG[raia.overallRisk]

                  return (
                    <div key={uc.id} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => toggleUseCaseExpanded(uc.id)}
                      >
                        <Badge variant="outline" className={`text-[10px] ${riskConfig.color} ${riskConfig.bg} ${riskConfig.border}`}>
                          {raia.overallRisk}
                        </Badge>
                        <span className="text-sm font-medium flex-1 truncate">{uc.title}</span>
                        {raia.involvesDecisionsAboutPeople && (
                          <Badge variant="outline" className="text-[10px] text-amber-300 bg-amber-500/10 border-amber-500/30">
                            People decisions
                          </Badge>
                        )}
                        {raia.humanOversightRequired && (
                          <Badge variant="outline" className="text-[10px] text-blue-300 bg-blue-500/10 border-blue-500/30">
                            Human oversight
                          </Badge>
                        )}
                        {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div className="border-t p-3 space-y-3 bg-card/50">
                          {/* Principle-by-principle breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {raia.principleAssessments.map(pa => (
                              <PrincipleCard key={pa.principle} assessment={pa} />
                            ))}
                          </div>

                          {/* Protected classes */}
                          {raia.protectedClassesAffected && raia.protectedClassesAffected.length > 0 && (
                            <div className="p-2 rounded border border-amber-500/20 bg-amber-500/5">
                              <p className="text-xs font-medium text-amber-300 mb-1">Potential Protected Classes Affected</p>
                              <div className="flex flex-wrap gap-1">
                                {raia.protectedClassesAffected.map(pc => (
                                  <Badge key={pc} variant="outline" className="text-[10px]">{pc}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fairness metrics */}
                          {raia.fairnessMetricsRecommended && raia.fairnessMetricsRecommended.length > 0 && (
                            <div className="p-2 rounded border border-blue-500/20 bg-blue-500/5">
                              <p className="text-xs font-medium text-blue-300 mb-1">Recommended Fairness Metrics</p>
                              <div className="flex flex-wrap gap-1">
                                {raia.fairnessMetricsRecommended.map(fm => (
                                  <Badge key={fm} variant="outline" className="text-[10px]">{fm}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Requirements summary */}
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {raia.humanOversightRequired && (
                              <span className="flex items-center gap-1 text-blue-300">
                                <Info size={10} /> Human-in-the-loop required
                              </span>
                            )}
                            {raia.modelDocumentationRequired && (
                              <span className="flex items-center gap-1 text-purple-300">
                                <Info size={10} /> Model card / AI system documentation required
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <InlineDisclaimer text="Responsible AI assessments are indicative only — conduct thorough impact assessments with qualified professionals." icon="legal" className="text-[10px]" />

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setSubStep('results')}>
                  <ArrowLeft size={16} className="mr-2" /> Back to Results
                </Button>
                <Button onClick={handleComplete}>
                  Complete Governance <CheckCircle size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ActionPlanCard({ rec }: { rec: GovernanceRecommendation }) {
  const dimColor = DIMENSION_COLORS[rec.dimension] || '#888'
  return (
    <div className="p-2 rounded border bg-card text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dimColor }} />
        <span className="font-medium">{AI_GOVERNANCE_DIMENSION_LABELS[rec.dimension]}</span>
        <Badge
          variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}
          className="text-[9px] px-1 py-0"
        >
          {rec.priority}
        </Badge>
      </div>
      <p className="text-foreground/90">{rec.action}</p>
      {rec.rationale && <p className="text-muted-foreground text-[10px] mt-1">{rec.rationale}</p>}
    </div>
  )
}

function PrincipleCard({ assessment }: { assessment: { principle: ResponsibleAIPrinciple; risk: AIRiskLevel; reason: string; mitigations?: string[] } }) {
  const riskConfig = RISK_BADGE_CONFIG[assessment.risk]
  const [showMitigations, setShowMitigations] = useState(false)

  return (
    <div className="p-2 rounded border bg-card/50 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{RESPONSIBLE_AI_PRINCIPLE_LABELS[assessment.principle]}</span>
        <Badge variant="outline" className={`text-[9px] ${riskConfig.color} ${riskConfig.bg} ${riskConfig.border}`}>
          {assessment.risk}
        </Badge>
      </div>
      <p className="text-muted-foreground text-[10px]">{assessment.reason}</p>
      {assessment.mitigations && assessment.mitigations.length > 0 && (
        <>
          <button
            type="button"
            className="text-[10px] text-primary/80 hover:text-primary flex items-center gap-1"
            onClick={() => setShowMitigations(!showMitigations)}
          >
            {showMitigations ? <CaretUp size={10} /> : <CaretDown size={10} />}
            {assessment.mitigations.length} mitigation{assessment.mitigations.length > 1 ? 's' : ''}
          </button>
          {showMitigations && (
            <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-3">
              {assessment.mitigations.map((m, i) => (
                <li key={i} className="list-disc">{m}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
