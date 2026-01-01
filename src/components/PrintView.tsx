import { UseCase, ScoringMethod, CustomerMetadata } from '@/lib/types'
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
}

export function PrintView({
  open,
  onOpenChange,
  useCases,
  topUseCases,
  scoringMethod,
  effortUnit,
  customerMetadata,
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
              Microsoft Innovation Hub Use Case Assessment
            </h1>
            <p className="text-muted-foreground">
              Generated on {new Date().toLocaleDateString()} using{' '}
              {scoringMethod === 'rice' ? 'RICE' : 'Impact/Feasibility'} scoring
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
