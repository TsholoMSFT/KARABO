import { UseCase, ScoringMethod, CustomerMetadata, AI_GOVERNANCE_DIMENSION_LABELS, AI_GOVERNANCE_MATURITY_CONFIG } from '@/lib/types'
import type { AIGovernanceAssessment, SovereignCloudAssessment } from '@/lib/types'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculateRICEScore, getQuadrant } from '@/lib/scoring'
import { getKPIById, KPI_CATEGORIES } from '@/lib/kpis'
import { X, Printer } from '@phosphor-icons/react'
import { useEffect } from 'react'

interface PrintViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  useCases: UseCase[]
  topUseCases: UseCase[]
  scoringMethod: ScoringMethod
  effortUnit: 'person-weeks' | 'fte' | 'man-hours'
  customerMetadata?: CustomerMetadata
  governanceAssessment?: AIGovernanceAssessment
  sovereignCloudAssessment?: SovereignCloudAssessment
}

export function PrintView({
  open,
  onOpenChange,
  useCases,
  topUseCases,
  scoringMethod,
  effortUnit,
  customerMetadata,
  governanceAssessment,
  sovereignCloudAssessment,
}: PrintViewProps) {
  const topUseCaseIds = new Set(topUseCases.map((uc) => uc.id))

  const formatEffort = (personWeeks: number) => {
    switch (effortUnit) {
      case 'fte':
        return `${(personWeeks / 52).toFixed(3)} FTE`
      case 'man-hours':
        return `${(personWeeks * 40).toFixed(0)} hours`
      default:
        return `${personWeeks} weeks`
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = KPI_CATEGORIES.find((c) => c.value === category)
    return cat?.color || 'oklch(0.5 0.1 240)'
  }

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    if (open) {
      document.body.classList.add('print-mode')
    } else {
      document.body.classList.remove('print-mode')
    }
    return () => {
      document.body.classList.remove('print-mode')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto print:max-w-full print:max-h-full print:overflow-visible print:p-0">
        <div className="print:hidden flex justify-end gap-2 sticky top-0 bg-background z-10 pb-4 border-b border-border mb-4">
          <Button onClick={handlePrint} className="gap-2">
            <Printer size={18} weight="bold" />
            Print
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline" size="icon">
            <X size={18} />
          </Button>
        </div>

        <div className="print-content space-y-6 print:space-y-8">
          <header className="text-center border-b border-border pb-6 print:page-break-after-avoid">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ID-8 - Use Case Assessment
            </h1>
            <p className="text-muted-foreground">
              Generated on {new Date().toLocaleDateString()} using{' '}
              {scoringMethod === 'rice' ? 'RICE' : scoringMethod === 'blended' ? 'Balanced' : 'Impact/Feasibility'} scoring
            </p>
          </header>

          {customerMetadata && (customerMetadata.customerName || customerMetadata.primaryStakeholder || customerMetadata.accountTeamRep || customerMetadata.innovationHubLocation || customerMetadata.solutionEngineer) && (
            <section className="bg-card border border-border p-6 rounded-lg print:page-break-inside-avoid print:page-break-after-avoid">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Customer Information</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {customerMetadata.customerName && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Customer Name</span>
                    <span className="font-medium">{customerMetadata.customerName}</span>
                  </div>
                )}
                {customerMetadata.primaryStakeholder && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Primary Stakeholder</span>
                    <span className="font-medium">{customerMetadata.primaryStakeholder}</span>
                  </div>
                )}
                {customerMetadata.accountTeamRep && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Account Team Representative</span>
                    <span className="font-medium">{customerMetadata.accountTeamRep}</span>
                  </div>
                )}
                {customerMetadata.innovationHubLocation && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Innovation Hub Location</span>
                    <span className="font-medium">{customerMetadata.innovationHubLocation}</span>
                  </div>
                )}
                {customerMetadata.solutionEngineer && (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Innovation Hub Solution Engineer</span>
                    <span className="font-medium">{customerMetadata.solutionEngineer}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {customerMetadata?.executiveSummary && (
            <section className="bg-card border border-border p-6 rounded-lg print:page-break-inside-avoid print:page-break-after-avoid">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Executive Summary</h2>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {customerMetadata.executiveSummary}
              </p>
            </section>
          )}

          {scoringMethod === 'rice' && (
            <section className="bg-muted/30 p-6 rounded-lg print:page-break-inside-avoid print:page-break-before-always">
              <h2 className="text-xl font-semibold mb-4">About RICE Scoring</h2>
              <p className="text-sm text-muted-foreground mb-4">
                RICE is a prioritization framework that helps you evaluate and rank initiatives based on four
                factors:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Reach (Users/Period)</h3>
                  <p className="text-muted-foreground">
                    How many users will this feature impact within a given time period?
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Impact Multiplier</h3>
                  <p className="text-muted-foreground">
                    How much will this feature impact each user? (3x = Massive, 2x = High, 1x = Medium,
                    0.5x = Low, 0.25x = Minimal)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Confidence (%)</h3>
                  <p className="text-muted-foreground">
                    How confident are you in your estimates? (100% = very confident, 50% = moderate
                    uncertainty)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Effort (Person-Weeks)</h3>
                  <p className="text-muted-foreground">
                    Total time required from all team members combined. Can be displayed as person-weeks,
                    FTE, or man-hours.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-background rounded border border-border">
                <p className="text-sm font-mono">
                  RICE Score = (Reach × Impact × Confidence) ÷ Effort
                </p>
              </div>
            </section>
          )}

          {scoringMethod === 'impact-feasibility' && (
            <section className="bg-muted/30 p-6 rounded-lg print:page-break-inside-avoid print:page-break-before-always">
              <h2 className="text-xl font-semibold mb-4">About Impact/Feasibility Scoring</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Impact/Feasibility scoring helps you prioritize initiatives by plotting them on a 2x2 matrix. Use cases fall into four quadrants based on their scores:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Quick Wins (High Impact, High Feasibility)</h3>
                  <p className="text-muted-foreground">
                    Prioritize these first - they deliver significant value and are relatively easy to implement.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Strategic Bets (High Impact, Low Feasibility)</h3>
                  <p className="text-muted-foreground">
                    High-value initiatives that require significant investment. Plan carefully and allocate sufficient resources.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Fill-ins (Low Impact, High Feasibility)</h3>
                  <p className="text-muted-foreground">
                    Easy to implement but lower value. Good for filling time between major projects.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Time Sinks (Low Impact, Low Feasibility)</h3>
                  <p className="text-muted-foreground">
                    Avoid or deprioritize - these require significant effort for minimal return.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-background rounded border border-border">
                <p className="text-sm font-mono">
                  Score = Impact × Feasibility (both rated 1-10)
                </p>
              </div>
            </section>
          )}

          <section className="print:page-break-before-always print:page-break-inside-avoid">
            <h2 className="text-2xl font-semibold mb-4">Top Recommendations</h2>
            <div className="space-y-4">
              {topUseCases.map((useCase, index) => (
                <div
                  key={useCase.id}
                  className="border-2 border-accent bg-accent/5 p-6 rounded-lg print:page-break-inside-avoid"
                >
                  <div className="flex items-start gap-4">
                    <Badge className="bg-accent text-accent-foreground text-lg px-3 py-1 shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                      {useCase.description && (
                        <p className="text-sm text-muted-foreground mb-4">{useCase.description}</p>
                      )}
                      {useCase.kpis && useCase.kpis.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {useCase.kpis.map((kpiId) => {
                            const kpi = getKPIById(kpiId)
                            if (!kpi) return null
                            return (
                              <Badge
                                key={kpiId}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: getCategoryColor(kpi.category),
                                  color: 'oklch(0.98 0 0)',
                                  borderColor: getCategoryColor(kpi.category),
                                }}
                              >
                                {kpi.name}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                      {scoringMethod === 'rice' ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Reach</span>
                            <span className="font-semibold">{useCase.rice.reach.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Impact</span>
                            <span className="font-semibold">{useCase.rice.impact}x</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Confidence</span>
                            <span className="font-semibold">{useCase.rice.confidence}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Effort</span>
                            <span className="font-semibold">{formatEffort(useCase.rice.effort)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">RICE Score</span>
                            <span className="font-bold text-lg text-primary">
                              {calculateRICEScore(useCase).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Impact</span>
                            <span className="font-semibold">{useCase.impact}/10</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Feasibility</span>
                            <span className="font-semibold">{useCase.feasibility}/10</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Quadrant</span>
                            <span className="font-semibold">
                              {getQuadrant(useCase.impact, useCase.feasibility)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Score</span>
                            <span className="font-bold text-lg text-primary">
                              {(useCase.impact * useCase.feasibility).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="print:page-break-before-always">
            <h2 className="text-2xl font-semibold mb-4">All Use Cases ({useCases.length})</h2>
            <div className="space-y-3">
              {useCases.map((useCase) => {
                const isTopPick = topUseCaseIds.has(useCase.id)
                const rank = isTopPick
                  ? topUseCases.findIndex((uc) => uc.id === useCase.id) + 1
                  : undefined

                return (
                  <div
                    key={useCase.id}
                    className={`border p-4 rounded-lg print:page-break-inside-avoid ${
                      isTopPick ? 'border-accent bg-accent/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {rank && (
                        <Badge className="bg-accent text-accent-foreground shrink-0">#{rank}</Badge>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{useCase.title}</h3>
                        {useCase.description && (
                          <p className="text-sm text-muted-foreground mb-3">{useCase.description}</p>
                        )}
                        {useCase.kpis && useCase.kpis.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {useCase.kpis.map((kpiId) => {
                              const kpi = getKPIById(kpiId)
                              if (!kpi) return null
                              return (
                                <Badge
                                  key={kpiId}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: getCategoryColor(kpi.category),
                                    color: 'oklch(0.98 0 0)',
                                    borderColor: getCategoryColor(kpi.category),
                                  }}
                                >
                                  {kpi.name}
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                        {scoringMethod === 'rice' ? (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Reach:</span>{' '}
                              <span className="font-semibold">{useCase.rice.reach.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Impact:</span>{' '}
                              <span className="font-semibold">{useCase.rice.impact}x</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Confidence:</span>{' '}
                              <span className="font-semibold">{useCase.rice.confidence}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Effort:</span>{' '}
                              <span className="font-semibold">{formatEffort(useCase.rice.effort)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Score:</span>{' '}
                              <span className="font-bold text-primary">
                                {calculateRICEScore(useCase).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Impact:</span>{' '}
                              <span className="font-semibold">{useCase.impact}/10</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Feasibility:</span>{' '}
                              <span className="font-semibold">{useCase.feasibility}/10</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quadrant:</span>{' '}
                              <span className="font-semibold">
                                {getQuadrant(useCase.impact, useCase.feasibility)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Score:</span>{' '}
                              <span className="font-bold text-primary">
                                {(useCase.impact * useCase.feasibility).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* AI Governance Assessment Section */}
          {governanceAssessment && (
            <section className="print:page-break-before-always">
              <h2 className="text-xl font-bold mb-4 text-purple-600">AI Governance Assessment</h2>
              
              <div className="mb-4">
                <p className="text-sm">
                  <strong>Overall Maturity:</strong>{' '}
                  <span className={`font-bold ${
                    governanceAssessment.overallMaturity >= 3.5 ? 'text-green-600' :
                    governanceAssessment.overallMaturity >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {governanceAssessment.overallMaturity.toFixed(1)}/5
                  </span>
                  {' '}({AI_GOVERNANCE_MATURITY_CONFIG[governanceAssessment.overallMaturityLabel].label})
                </p>
              </div>

              {/* Dimension scores */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Dimension Scores</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Dimension</th>
                      <th className="text-left py-1">Level</th>
                      <th className="text-left py-1">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(governanceAssessment.dimensionScores) as Array<keyof typeof governanceAssessment.dimensionScores>).map(dim => {
                      const level = governanceAssessment.dimensionScores[dim]
                      const config = AI_GOVERNANCE_MATURITY_CONFIG[level]
                      return (
                        <tr key={dim} className="border-b border-gray-100">
                          <td className="py-1">{AI_GOVERNANCE_DIMENSION_LABELS[dim]}</td>
                          <td className="py-1">{config.label}</td>
                          <td className="py-1">{config.numericValue}/5</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Gaps */}
              {governanceAssessment.gaps.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 text-amber-600">Key Gaps ({governanceAssessment.gaps.length})</h3>
                  {governanceAssessment.gaps.slice(0, 6).map((gap, i) => (
                    <div key={i} className="mb-2 pl-3 border-l-2 border-amber-300">
                      <p className="text-xs font-medium">{AI_GOVERNANCE_DIMENSION_LABELS[gap.dimension]} [{gap.impact} impact]</p>
                      <p className="text-xs text-muted-foreground">{gap.gap}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* RAIA summary */}
              {useCases.some(uc => uc.responsibleAIImpact) && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 text-purple-600">Responsible AI Impact Summary</h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Use Case</th>
                        <th className="text-left py-1">Risk</th>
                        <th className="text-left py-1">People</th>
                        <th className="text-left py-1">Oversight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {useCases.filter(uc => uc.responsibleAIImpact).slice(0, 10).map(uc => (
                        <tr key={uc.id} className="border-b border-gray-100">
                          <td className="py-1 max-w-[200px] truncate">{uc.title}</td>
                          <td className="py-1">
                            <Badge variant="outline" className="text-[9px]">{uc.responsibleAIImpact!.overallRisk}</Badge>
                          </td>
                          <td className="py-1">{uc.responsibleAIImpact!.involvesDecisionsAboutPeople ? 'Yes' : 'No'}</td>
                          <td className="py-1">{uc.responsibleAIImpact!.humanOversightRequired ? 'Required' : 'Optional'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Sovereign Cloud & Data Residency */}
          {sovereignCloudAssessment && sovereignCloudAssessment.mandateLevel !== 'optional' && (
            <section className="print:page-break-before-always">
              <h2 className="text-lg font-bold text-blue-700 border-b pb-1 mb-3">
                ☁ Sovereign Cloud & Data Residency
              </h2>

              <div className="mb-3">
                <p className="text-sm">
                  <span className="font-semibold">Cloud Environment: </span>
                  {{
                    'azure-public': 'Azure Commercial (Global)',
                    'azure-government': 'Azure Government (US)',
                    'azure-government-dod': 'Azure Government DoD',
                    'azure-china-21vianet': 'Azure China (21Vianet)',
                    'azure-eu-boundary': 'Azure EU Data Boundary',
                    'azure-local': 'Azure Local (On-Premises)',
                    'azure-arc': 'Azure Arc (Hybrid)',
                    'disconnected': 'Disconnected / Air-Gapped',
                    'private-cloud': 'Private Cloud (Non-Azure)',
                    'foundry-local': 'Foundry Local (On-Premises AI)',
                  }[sovereignCloudAssessment.cloudEnvironment] || sovereignCloudAssessment.cloudEnvironment}
                  <Badge variant="outline" className={`ml-2 text-[9px] ${
                    sovereignCloudAssessment.mandateLevel === 'required' ? 'text-red-600 border-red-300' : 'text-blue-600 border-blue-300'
                  }`}>
                    {sovereignCloudAssessment.mandateLevel}
                  </Badge>
                  <span className={`ml-3 font-bold text-sm ${
                    sovereignCloudAssessment.readinessScore >= 70 ? 'text-green-600' :
                    sovereignCloudAssessment.readinessScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Readiness: {sovereignCloudAssessment.readinessScore}/100
                  </span>
                </p>
                <p className="text-xs text-gray-600 italic mt-1">
                  {sovereignCloudAssessment.dataResidency.justification}
                </p>
              </div>

              {/* Service Availability */}
              <div className="mb-3">
                <h3 className="text-sm font-semibold mb-1">Service Availability</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1">Service</th>
                      <th className="text-left py-1">Available</th>
                      <th className="text-left py-1">Limitations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sovereignCloudAssessment.serviceAvailability.map(svc => (
                      <tr key={svc.service} className="border-b border-gray-100">
                        <td className="py-1">{svc.service}</td>
                        <td className={`py-1 ${svc.availableInCloud ? 'text-green-600' : 'text-red-600'}`}>
                          {svc.availableInCloud ? '✅ Yes' : '❌ No'}
                        </td>
                        <td className="py-1 text-gray-500">{svc.limitations || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gaps */}
              {sovereignCloudAssessment.gaps.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold mb-1 text-amber-600">Readiness Gaps ({sovereignCloudAssessment.gaps.length})</h3>
                  {sovereignCloudAssessment.gaps.slice(0, 6).map(gap => (
                    <div key={gap.id} className="border-l-2 border-amber-300 pl-2 mb-1 text-xs">
                      <span className="font-medium">[{gap.impact.toUpperCase()}] {gap.dimension}:</span>{' '}
                      {gap.description}
                      <br />
                      <span className="text-gray-500">→ {gap.recommendation}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <style>{`
          @media print {
            body.print-mode {
              margin: 0;
              padding: 0;
            }
            .print-content {
              max-width: 100%;
              padding: 0;
            }
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
              break-after: avoid;
            }
            .print\\:page-break-inside-avoid {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .print\\:page-break-before-always {
              page-break-before: always;
              break-before: always;
            }
            .print\\:page-break-after-avoid {
              page-break-after: avoid;
              break-after: avoid;
            }
            section {
              margin-bottom: 2rem;
            }
            section > div {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            @page {
              margin: 1.5cm;
              size: A4;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
