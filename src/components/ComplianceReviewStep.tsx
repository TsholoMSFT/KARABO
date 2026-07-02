/**
 * ComplianceReviewStep
 *
 * A workflow step that assesses ALL selected use cases against applicable
 * regulatory frameworks, displays risk color-coded results, and enforces
 * stage-gating in strict mode.
 *
 * Can be used inside the EnhancedDiscoveryWorkflow or standalone.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type {
  UseCase,
  DiscoverySession,
  AIRiskLevel,
  ComplianceEnforcement,
  RegulatoryAssessment,
  SovereignCloudAssessment,
} from '@/lib/types'
import {
  SOVEREIGN_CLOUD_LABELS,
  SOVEREIGN_REGION_LABELS,
} from '@/lib/types'
import {
  assessUseCaseRisk,
  getRegulationDisplayInfo,
  RISK_LEVEL_CONFIG,
  getSovereignImplicationsFromFrameworks,
} from '@/lib/regulatory-engine'
import { detectJurisdictions, getApplicableFrameworks } from '@/lib/regulatory-engine'
import { assessSovereignCloud } from '@/lib/sovereign-cloud-engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ShieldCheck,
  CaretDown,
  CaretUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Warning,
  Prohibit,
  LinkSimple,
  Signature,
  Info,
  Cloud,
  Globe,
  MapPin,
  ShieldWarning,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Disclaimer } from '@/components/Disclaimer'

// ── Helpers ──────────────────────────────────────────────────────────

const RISK_ORDER: AIRiskLevel[] = ['unacceptable', 'high', 'limited', 'minimal']

function sortByRisk<T extends { overallRisk: AIRiskLevel }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => RISK_ORDER.indexOf(a.overallRisk) - RISK_ORDER.indexOf(b.overallRisk)
  )
}

// ── Types ────────────────────────────────────────────────────────────

interface AssessedUseCase {
  id: string
  title: string
  description: string
  assessment: RegulatoryAssessment
  overrideJustification?: string
  signedOff?: boolean
}

export interface ComplianceReviewStepProps {
  session: DiscoverySession
  /** Use cases to assess — can be Partial<UseCase> from the workflow */
  useCases: Array<{ id: string; title: string; description: string }>
  enforcement: ComplianceEnforcement
  onComplete: (assessments: Map<string, RegulatoryAssessment>) => void
  onBack: () => void
}

export function ComplianceReviewStep({
  session,
  useCases,
  enforcement,
  onComplete,
  onBack,
}: ComplianceReviewStepProps) {
  // Resolve jurisdictions from session location
  const jurisdictions = useMemo(() => {
    const locs: string[] = []
    if (session.innovationHubLocation) locs.push(session.innovationHubLocation)
    const detected = locs.flatMap(detectJurisdictions)
    // Deduplicate
    return [...new Set(detected.length > 0 ? detected : ['international'])]
  }, [session.innovationHubLocation])

  const applicableFrameworkCodes = useMemo(
    () => getApplicableFrameworks(jurisdictions, session.industry),
    [jurisdictions, session.industry]
  )

  // Run assessment on mount
  const [assessed, setAssessed] = useState<AssessedUseCase[]>([])

  useEffect(() => {
    const results = useCases.map((uc) => {
      // Build a minimal UseCase-shaped object for the engine
      const fakeUseCase = {
        id: uc.id,
        title: uc.title,
        description: uc.description,
      } as UseCase

      const assessment = assessUseCaseRisk(fakeUseCase, jurisdictions, session.industry, enforcement)

      return {
        id: uc.id,
        title: uc.title,
        description: uc.description,
        assessment,
      }
    })

    setAssessed(results)
  }, [useCases, jurisdictions, session.industry, enforcement])

  // Sovereign cloud assessment
  const [sovereignAssessment, setSovereignAssessment] = useState<SovereignCloudAssessment | null>(null)
  const [sovereignExpanded, setSovereignExpanded] = useState(false)

  useEffect(() => {
    const assessment = assessSovereignCloud(session, jurisdictions)
    setSovereignAssessment(assessment)
  }, [session, jurisdictions])

  // Sovereign implications from triggered frameworks
  const sovereignImplications = useMemo(() => {
    return getSovereignImplicationsFromFrameworks(applicableFrameworkCodes)
  }, [applicableFrameworkCodes])

  // Track expanded use cases
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // Aggregate stats
  const stats = useMemo(() => {
    const counts: Record<AIRiskLevel, number> = {
      unacceptable: 0,
      high: 0,
      limited: 0,
      minimal: 0,
    }
    assessed.forEach((a) => counts[a.assessment.overallRisk]++)
    return counts
  }, [assessed])

  // Determine if gate blocks proceeding
  const isBlocked = useMemo(() => {
    if (enforcement !== 'strict') return false
    return assessed.some(
      (a) =>
        a.assessment.gateStatus === 'blocked' &&
        !a.signedOff &&
        !a.assessment.overrideJustification
    )
  }, [assessed, enforcement])

  // Handle sign-off for a use case
  const handleSignOff = useCallback((ucId: string) => {
    setAssessed((prev) =>
      prev.map((a) =>
        a.id === ucId
          ? {
              ...a,
              signedOff: true,
              assessment: {
                ...a.assessment,
                signedOff: true,
                signedOffAt: Date.now(),
              },
            }
          : a
      )
    )
    toast.success('Use case signed off')
  }, [])

  // Handle override justification
  const handleOverride = useCallback((ucId: string, justification: string) => {
    setAssessed((prev) =>
      prev.map((a) =>
        a.id === ucId
          ? {
              ...a,
              overrideJustification: justification,
              assessment: {
                ...a.assessment,
                overrideJustification: justification,
                gateStatus: justification.trim().length > 20 ? 'warning' : a.assessment.gateStatus,
              },
            }
          : a
      )
    )
  }, [])

  // Proceed handler
  const handleProceed = () => {
    const map = new Map<string, RegulatoryAssessment>()
    assessed.forEach((a) => map.set(a.id, a.assessment))
    onComplete(map)
  }

  return (
    <motion.div
      key="compliance-review"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={24} weight="duotone" className="text-primary" />
            Regulatory Compliance Review
          </CardTitle>
          <CardDescription>
            Each use case is assessed against{' '}
            <strong>{applicableFrameworkCodes.length} applicable frameworks</strong> for the{' '}
            <strong>{jurisdictions.join(', ')}</strong> jurisdiction
            {jurisdictions.length > 1 ? 's' : ''}.
            {enforcement === 'strict' && (
              <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                Strict mode — high/unacceptable risk use cases require sign-off.
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Methodology note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md border border-muted bg-muted/20">
            <Info size={14} weight="fill" className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-1">
                <span className="font-medium text-foreground/80">How risk levels are determined:</span> Each use case is
                checked against applicable regulatory frameworks (e.g. EU AI Act, POPIA, HIPAA) using keyword and
                category matching. Risk levels follow the EU AI Act classification:
              </p>
              <p><strong>Unacceptable</strong> — prohibited uses (social scoring, real-time biometrics). <strong>High</strong> — requires conformity assessment. <strong>Limited</strong> — transparency obligations. <strong>Minimal</strong> — no specific requirements.</p>
              <p className="mt-1 italic text-[10px]">This is a preliminary screening tool, not a legal assessment. Consult qualified legal counsel for compliance decisions.</p>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex flex-wrap gap-3">
            {RISK_ORDER.map((level) => {
              const cfg = RISK_LEVEL_CONFIG[level]
              return (
                <div
                  key={level}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {stats[level]}
                  </Badge>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Sovereign Cloud & Data Residency Panel */}
          {sovereignAssessment && sovereignAssessment.mandateLevel !== 'optional' && (
            <Collapsible open={sovereignExpanded} onOpenChange={setSovereignExpanded}>
              <div className="border rounded-lg overflow-hidden bg-card">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <Cloud size={20} weight="duotone" className="text-blue-400" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Sovereign Cloud & Data Residency</h4>
                      <p className="text-xs text-muted-foreground">
                        {SOVEREIGN_CLOUD_LABELS[sovereignAssessment.cloudEnvironment]}
                        {sovereignAssessment.mandateLevel === 'required' ? ' — Required' : ' — Recommended'}
                        {' · '}{sovereignAssessment.readinessScore}/100 readiness
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={sovereignAssessment.mandateLevel === 'required'
                        ? 'text-red-400 bg-red-500/10 border-red-500/30'
                        : 'text-blue-400 bg-blue-500/10 border-blue-500/30'}
                    >
                      {sovereignAssessment.mandateLevel === 'required' ? '🔴 Required' : '🔵 Recommended'}
                    </Badge>
                    {sovereignExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <Separator />

                    {/* Requirement summary */}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md border bg-muted/20">
                      <Globe size={14} className="text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground/80 font-medium mb-1">
                          {sovereignAssessment.dataResidency.justification}
                        </p>
                        {sovereignAssessment.dataResidency.triggeringFrameworks.length > 0 && (
                          <p>Driven by: {sovereignAssessment.dataResidency.triggeringFrameworks.map(f => {
                            const info = getRegulationDisplayInfo(f)
                            return info.shortName
                          }).join(', ')}</p>
                        )}
                      </div>
                    </div>

                    {/* Recommended regions */}
                    {sovereignAssessment.recommendedRegions.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                          <MapPin size={12} /> Recommended Regions
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {sovereignAssessment.recommendedRegions.map(region => (
                            <Badge key={region} variant="outline" className="text-xs">
                              {SOVEREIGN_REGION_LABELS[region] || region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service availability */}
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Service Availability in {SOVEREIGN_CLOUD_LABELS[sovereignAssessment.cloudEnvironment]}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {sovereignAssessment.serviceAvailability.map(svc => (
                          <div
                            key={svc.service}
                            className={`flex items-start gap-2 p-2 rounded border text-xs ${
                              svc.availableInCloud
                                ? 'border-green-500/20 bg-green-500/5'
                                : 'border-red-500/20 bg-red-500/5'
                            }`}
                          >
                            <span>{svc.availableInCloud ? '✅' : '❌'}</span>
                            <div className="flex-1">
                              <span className="font-medium">{svc.service}</span>
                              {svc.limitations && (
                                <p className="text-muted-foreground text-[10px] mt-0.5">{svc.limitations}</p>
                              )}
                              {svc.availableModels && svc.availableModels.length > 0 && (
                                <p className="text-muted-foreground text-[10px]">
                                  Models: {svc.availableModels.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cross-border data flows */}
                    {sovereignAssessment.crossBorderFlows.some(f => f.risk !== 'minimal') && (
                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                          <ShieldWarning size={12} /> Cross-border Data Flow Assessment
                        </h5>
                        <div className="space-y-1.5">
                          {sovereignAssessment.crossBorderFlows.filter(f => f.risk !== 'minimal').map((flow, i) => {
                            const cfg = RISK_LEVEL_CONFIG[flow.risk]
                            return (
                              <div key={i} className={`flex items-start gap-2 p-2 rounded border text-xs ${cfg.bgColor} ${cfg.borderColor}`}>
                                <span>{cfg.icon}</span>
                                <div className="flex-1">
                                  <span className="font-medium">{flow.dataTypes[0]}</span>
                                  <p className="text-muted-foreground text-[10px]">
                                    {flow.permitted ? 'Permitted' : 'Blocked'} — {flow.mechanism}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Gaps */}
                    {sovereignAssessment.gaps.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                          <Warning size={12} className="text-amber-400" /> Readiness Gaps ({sovereignAssessment.gaps.length})
                        </h5>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                          {sovereignAssessment.gaps.map(gap => (
                            <div key={gap.id} className="flex items-start gap-2 p-2 rounded bg-muted/40 text-xs">
                              <span>{gap.impact === 'high' ? '🔴' : gap.impact === 'medium' ? '🟡' : '🟢'}</span>
                              <div className="flex-1">
                                <p className="font-medium">{gap.description}</p>
                                <p className="text-muted-foreground text-[10px]">{gap.recommendation}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{gap.dimension}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regulatory framework implications */}
                    {sovereignImplications.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Framework Sovereign Cloud Implications
                        </h5>
                        <div className="space-y-1">
                          {sovereignImplications.map((impl, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                              <Badge
                                variant="outline"
                                className={`text-[9px] ${
                                  impl.mandateLevel === 'required'
                                    ? 'text-red-400 border-red-500/30'
                                    : 'text-blue-400 border-blue-500/30'
                                }`}
                              >
                                {impl.mandateLevel}
                              </Badge>
                              <span className="font-medium">{impl.frameworkShortName}</span>
                              <span className="text-muted-foreground flex-1">→ {SOVEREIGN_CLOUD_LABELS[impl.requiredCloud]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Readiness score bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">Readiness</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            sovereignAssessment.readinessScore >= 70 ? 'bg-green-500'
                              : sovereignAssessment.readinessScore >= 40 ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${sovereignAssessment.readinessScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${
                        sovereignAssessment.readinessScore >= 70 ? 'text-green-400'
                          : sovereignAssessment.readinessScore >= 40 ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {sovereignAssessment.readinessScore}/100
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          <Separator />

          {/* Use case list */}
          <ScrollArea className="max-h-[60vh] overflow-hidden pr-4">
            <div className="space-y-3">
              <AnimatePresence>
                {sortByRisk(assessed.map((a) => ({ ...a, overallRisk: a.assessment.overallRisk }))).map(
                  (item) => {
                    const a = assessed.find((x) => x.id === item.id)!
                    const cfg = RISK_LEVEL_CONFIG[a.assessment.overallRisk]
                    const isExpanded = expandedIds.has(a.id)

                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(a.id)}>
                          <Card className={`border ${cfg.borderColor} ${cfg.bgColor}`}>
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
                                <span className="text-xl">{cfg.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm truncate">{a.title}</h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {a.assessment.frameworkAssessments.length} frameworks assessed
                                    {a.assessment.remediations.length > 0 &&
                                      ` · ${a.assessment.remediations.length} remediations`}
                                  </p>
                                </div>
                                <Badge className={`${cfg.color} ${cfg.bgColor} border ${cfg.borderColor}`}>
                                  {cfg.label}
                                </Badge>
                                {a.signedOff && (
                                  <CheckCircle size={20} weight="fill" className="text-green-600" />
                                )}
                                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-4">
                                <Separator />

                                {/* Framework breakdown */}
                                <div>
                                  <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    Framework Assessments
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {a.assessment.frameworkAssessments.map((fa, i) => {
                                      const info = getRegulationDisplayInfo(fa.framework)
                                      const faCfg = RISK_LEVEL_CONFIG[fa.risk]
                                      return (
                                        <div
                                          key={i}
                                          className={`flex items-start gap-2 p-2 rounded border ${faCfg.borderColor} ${faCfg.bgColor}`}
                                        >
                                          <span className="text-sm">{faCfg.icon}</span>
                                          <div className="flex-1 text-xs">
                                            <div className="flex items-center gap-2">
                                              <span className={`font-medium ${faCfg.color}`}>
                                                {info.shortName}
                                              </span>
                                              <span className="text-muted-foreground">
                                                ({info.jurisdiction})
                                              </span>
                                              {info.url && (
                                                <a
                                                  href={info.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-500 hover:underline"
                                                  title={`View ${info.displayName}`}
                                                >
                                                  <LinkSimple size={12} />
                                                </a>
                                              )}
                                            </div>
                                            <p className="text-muted-foreground mt-0.5">
                                              {fa.reason}
                                            </p>
                                            {fa.articles && fa.articles.length > 0 && (
                                              <p className="text-muted-foreground italic">
                                                References: {fa.articles.join(', ')}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                    {a.assessment.frameworkAssessments.length === 0 && (
                                      <p className="text-xs text-muted-foreground italic">
                                        No specific risk triggers detected across applicable frameworks.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Remediations */}
                                {a.assessment.remediations.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                      Recommended Remediations
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[250px] overflow-y-auto pr-1">
                                      {a.assessment.remediations.map((rem) => (
                                        <div
                                          key={rem.id}
                                          className="flex items-start gap-2 text-xs p-2 rounded bg-muted/40"
                                        >
                                          <span>
                                            {rem.priority === 'critical'
                                              ? '🔴'
                                              : rem.priority === 'recommended'
                                              ? '🟡'
                                              : '🟢'}
                                          </span>
                                          <div className="flex-1">
                                            <p className="font-medium">{rem.action}</p>
                                            <p className="text-muted-foreground">
                                              {rem.description}
                                            </p>
                                          </div>
                                          <Badge variant="outline" className="text-[10px]">
                                            {getRegulationDisplayInfo(rem.framework).shortName}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sign-off / Override (strict mode only, high/unacceptable) */}
                                {enforcement === 'strict' &&
                                  (a.assessment.overallRisk === 'high' ||
                                    a.assessment.overallRisk === 'unacceptable') && (
                                    <div className="border-t pt-3 space-y-3">
                                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                        <Warning size={14} />
                                        <span className="font-medium">
                                          {a.assessment.overallRisk === 'unacceptable'
                                            ? 'This use case is blocked. Provide override justification or redesign.'
                                            : 'Sign-off required to proceed with this high-risk use case.'}
                                        </span>
                                      </div>

                                      {!a.signedOff && (
                                        <>
                                          <div className="space-y-1.5">
                                            <Label
                                              htmlFor={`override-${a.id}`}
                                              className="text-xs"
                                            >
                                              Override Justification (min 20 characters)
                                            </Label>
                                            <Textarea
                                              id={`override-${a.id}`}
                                              placeholder="Explain why this risk is acceptable or how it will be mitigated..."
                                              value={a.overrideJustification || ''}
                                              onChange={(e) =>
                                                handleOverride(a.id, e.target.value)
                                              }
                                              rows={2}
                                              className="text-xs"
                                            />
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2"
                                            disabled={
                                              !a.overrideJustification ||
                                              a.overrideJustification.trim().length < 20
                                            }
                                            onClick={() => handleSignOff(a.id)}
                                          >
                                            <Signature size={14} />
                                            Sign Off on Risk
                                          </Button>
                                        </>
                                      )}

                                      {a.signedOff && (
                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                          <CheckCircle size={14} weight="fill" />
                                          Signed off
                                          {a.assessment.overrideJustification && (
                                            <span className="text-muted-foreground">
                                              — {a.assessment.overrideJustification.slice(0, 60)}
                                              {(a.assessment.overrideJustification?.length ?? 0) > 60
                                                ? '...'
                                                : ''}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      </motion.div>
                    )
                  }
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <Disclaimer variant="compact" showLegalDisclaimer showAIDisclaimer={false} />
        </CardContent>

        <CardFooter className="relative z-10 flex justify-between items-center border-t bg-card">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft size={18} weight="bold" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {isBlocked && (
              <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <Prohibit size={14} />
                Sign off on all blocked use cases to proceed
              </span>
            )}
            <Button
              onClick={handleProceed}
              disabled={isBlocked}
              className="gap-2"
            >
              {enforcement === 'strict'
                ? isBlocked
                  ? 'Blocked — Sign Off Required'
                  : 'Approved — Continue'
                : 'Continue'}
              {!isBlocked && <ArrowRight size={18} weight="bold" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
