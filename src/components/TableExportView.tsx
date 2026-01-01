import { UseCase, ScoringMethod, CustomerMetadata } from '@/lib/types'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { calculateRICEScore, getQuadrant } from '@/lib/scoring'
import { getKPIById, KPI_CATEGORIES } from '@/lib/kpis'
import { formatEffort, exportToCSV, exportToExcel, exportToJSON } from '@/lib/export-utils'
import { X, Printer, FileCsv, FileXls, Code } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

interface TableExportViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  useCases: UseCase[]
  topUseCases: UseCase[]
  scoringMethod: ScoringMethod
  customerMetadata?: CustomerMetadata
}

export function TableExportView({
  open,
  onOpenChange,
  useCases,
  topUseCases,
  scoringMethod,
  customerMetadata,
}: TableExportViewProps) {
  const [effortUnit, setEffortUnit] = useState<'person-weeks' | 'fte' | 'man-hours'>('person-weeks')
  const [pageBreaks, setPageBreaks] = useState({
    executiveSummary: true,
    topRecommendations: true,
    allUseCases: true,
  })
  const topUseCaseIds = new Set(topUseCases.map((uc) => uc.id))

  const getCategoryColor = (category: string) => {
    const cat = KPI_CATEGORIES.find((c) => c.value === category)
    return cat?.color || 'oklch(0.5 0.1 240)'
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    exportToCSV(useCases, scoringMethod, effortUnit, customerMetadata)
  }

  const handleExportExcel = () => {
    exportToExcel(useCases, scoringMethod, effortUnit, customerMetadata)
  }

  const handleExportJSON = () => {
    exportToJSON(useCases, scoringMethod, effortUnit, customerMetadata)
  }

  useEffect(() => {
    if (open) {
      document.body.classList.add('table-export-mode')
    } else {
      document.body.classList.remove('table-export-mode')
    }
    return () => {
      document.body.classList.remove('table-export-mode')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col print:max-w-full print:max-h-full print:overflow-visible print:p-8">
        <div className="print:hidden flex flex-col gap-4 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Export Use Case Assessment</h2>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="icon">
              <X size={18} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Effort Unit:</Label>
              <RadioGroup 
                value={effortUnit} 
                onValueChange={(value) => setEffortUnit(value as any)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="person-weeks" id="pw" />
                  <Label htmlFor="pw" className="cursor-pointer text-sm">Person-Weeks</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fte" id="fte" />
                  <Label htmlFor="fte" className="cursor-pointer text-sm">FTE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="man-hours" id="mh" />
                  <Label htmlFor="mh" className="cursor-pointer text-sm">Man-Hours</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Page Breaks:</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pb-exec" 
                    checked={pageBreaks.executiveSummary}
                    onCheckedChange={(checked) => 
                      setPageBreaks(prev => ({ ...prev, executiveSummary: checked as boolean }))
                    }
                  />
                  <Label htmlFor="pb-exec" className="cursor-pointer text-sm">
                    Executive Summary on separate page
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pb-top" 
                    checked={pageBreaks.topRecommendations}
                    onCheckedChange={(checked) => 
                      setPageBreaks(prev => ({ ...prev, topRecommendations: checked as boolean }))
                    }
                  />
                  <Label htmlFor="pb-top" className="cursor-pointer text-sm">
                    Top Recommendations on separate page
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pb-all" 
                    checked={pageBreaks.allUseCases}
                    onCheckedChange={(checked) => 
                      setPageBreaks(prev => ({ ...prev, allUseCases: checked as boolean }))
                    }
                  />
                  <Label htmlFor="pb-all" className="cursor-pointer text-sm">
                    All Use Cases on separate page
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <FileCsv size={18} weight="bold" />
              CSV
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <FileXls size={18} weight="bold" />
              Excel
            </Button>
            <Button onClick={handleExportJSON} variant="outline" className="gap-2">
              <Code size={18} weight="bold" />
              JSON
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer size={18} weight="bold" />
              Print
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto print:overflow-visible">
          <div className="print-content space-y-6 p-4 print:p-0 print:space-y-0">
            <header className="border-b-2 border-border pb-6 print:page-break-after-avoid print:mb-8">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  Microsoft Innovation Hub
                </h1>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Use Case Assessment Report
                </h2>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-border pt-4">
                <div>
                  <span className="text-muted-foreground">Assessment Method: </span>
                  <span className="font-semibold text-foreground">
                    {scoringMethod === 'rice' ? 'RICE Scoring' : 'Impact/Feasibility Analysis'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Generated: </span>
                  <span className="font-semibold text-foreground">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </header>

            {customerMetadata && (customerMetadata.customerName || customerMetadata.primaryStakeholder || customerMetadata.accountTeamRep || customerMetadata.innovationHubLocation || customerMetadata.solutionEngineer) && (
              <section className="bg-card border border-border rounded-lg print:page-break-inside-avoid print:mb-8 print:rounded-none">
                <div className="bg-accent/10 px-4 py-3 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground print:page-break-after-avoid">Customer Information</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {customerMetadata.customerName && (
                      <div className="flex">
                        <span className="text-muted-foreground font-medium min-w-[140px]">Customer Name:</span>
                        <span className="font-medium text-foreground">{customerMetadata.customerName}</span>
                      </div>
                    )}
                    {customerMetadata.primaryStakeholder && (
                      <div className="flex">
                        <span className="text-muted-foreground font-medium min-w-[140px]">Primary Stakeholder:</span>
                        <span className="font-medium text-foreground">{customerMetadata.primaryStakeholder}</span>
                      </div>
                    )}
                    {customerMetadata.accountTeamRep && (
                      <div className="flex">
                        <span className="text-muted-foreground font-medium min-w-[140px]">Account Team Rep:</span>
                        <span className="font-medium text-foreground">{customerMetadata.accountTeamRep}</span>
                      </div>
                    )}
                    {customerMetadata.innovationHubLocation && (
                      <div className="flex">
                        <span className="text-muted-foreground font-medium min-w-[140px]">Innovation Hub:</span>
                        <span className="font-medium text-foreground">{customerMetadata.innovationHubLocation}</span>
                      </div>
                    )}
                    {customerMetadata.solutionEngineer && (
                      <div className="flex">
                        <span className="text-muted-foreground font-medium min-w-[140px]">Solution Engineer:</span>
                        <span className="font-medium text-foreground">{customerMetadata.solutionEngineer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {customerMetadata?.executiveSummary && (
              <section 
                className={`bg-card border border-border rounded-lg print:page-break-inside-avoid print:mb-8 print:rounded-none ${
                  pageBreaks.executiveSummary ? 'print:page-break-before-always' : ''
                }`}
              >
                <div className="bg-accent/10 px-4 py-3 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground print:page-break-after-avoid">Executive Summary</h2>
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {customerMetadata.executiveSummary}
                  </p>
                </div>
              </section>
            )}

            <section 
              className={`print:mb-8 ${
                pageBreaks.topRecommendations ? 'print:page-break-before-always' : ''
              }`}
            >
              <div className="bg-card border border-border rounded-lg print:page-break-inside-avoid print:mb-8 print:rounded-none">
                <div className="bg-primary/10 px-4 py-3 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground print:page-break-after-avoid">
                    Scoring Methodology
                  </h2>
                </div>
                <div className="p-4">
                  {scoringMethod === 'rice' ? (
                    <div className="space-y-4 text-sm">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2 text-base">RICE Scoring Framework</h3>
                        <p className="text-muted-foreground mb-3 leading-relaxed">
                          RICE is a prioritization framework that helps evaluate opportunities using four key factors. The final score indicates the value delivered per unit of effort invested. Higher RICE scores represent better opportunities.
                        </p>
                        <div className="bg-accent/10 p-3 rounded border border-border mb-3">
                          <p className="font-mono text-foreground font-semibold text-center">
                            RICE Score = (Reach × Impact × Confidence) ÷ Effort
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-3">
                          <div className="border-l-4 border-primary pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Reach (Users/Period)</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              The number of unique users who will benefit from this use case within a specific time period. Calculated as the number of users divided by the time period (quarter, month, or year).
                            </p>
                          </div>
                          <div className="border-l-4 border-secondary pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Impact Multiplier</h4>
                            <p className="text-muted-foreground leading-relaxed mb-2">
                              Measures how significantly this will affect each user's experience or outcomes:
                            </p>
                            <ul className="text-muted-foreground text-xs space-y-1 ml-4">
                              <li><span className="font-semibold text-foreground">3x = Massive:</span> Game-changing impact on user experience</li>
                              <li><span className="font-semibold text-foreground">2x = High:</span> Significant improvement to workflows</li>
                              <li><span className="font-semibold text-foreground">1x = Medium:</span> Noticeable benefit to operations</li>
                              <li><span className="font-semibold text-foreground">0.5x = Low:</span> Minor improvement</li>
                              <li><span className="font-semibold text-foreground">0.25x = Minimal:</span> Small incremental change</li>
                            </ul>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="border-l-4 border-accent pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Confidence (%)</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Your level of certainty about the Reach, Impact, and Effort estimates. Lower confidence appropriately reduces the final score to account for uncertainty. Use 100% for well-validated estimates and lower percentages for rougher approximations.
                            </p>
                          </div>
                          <div className="border-l-4 border-destructive pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Effort (Person-Weeks)</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              The total development time required to design, build, test, and deploy the new solution. This represents the cumulative time across all team members involved in implementation. For example, if 2 developers work for 3 weeks each and 1 designer works for 1 week, the total effort is 7 person-weeks.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2 text-base">Impact vs. Feasibility Matrix</h3>
                        <p className="text-muted-foreground mb-3 leading-relaxed">
                          This prioritization framework evaluates use cases on two dimensions: the business impact they deliver and the feasibility of implementation. Each use case is plotted on a 10-point scale for both dimensions, creating four strategic quadrants.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-3">
                          <div className="border-l-4 border-primary pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Impact (Y-Axis)</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Measures the potential business value and strategic benefit this use case will deliver. Consider factors such as revenue impact, cost savings, user satisfaction, competitive advantage, and alignment with organizational goals. Scored from 1 (minimal impact) to 10 (transformational impact).
                            </p>
                          </div>
                          <div className="border-l-4 border-secondary pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Feasibility (X-Axis)</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Evaluates how practical and achievable the implementation will be. Consider technical complexity, resource availability, time to implement, dependencies, risks, and organizational readiness. Scored from 1 (very difficult/high risk) to 10 (easy to implement/low risk).
                            </p>
                          </div>
                        </div>
                        <div>
                          <div className="border-l-4 border-accent pl-3">
                            <h4 className="font-semibold text-foreground mb-1.5">Strategic Quadrants</h4>
                            <ul className="text-muted-foreground space-y-2 mt-1">
                              <li className="leading-relaxed">
                                <span className="font-semibold text-foreground">Quick Wins</span> (High Impact, High Feasibility) — Top priority. These deliver significant value with manageable implementation effort. Execute these first.
                              </li>
                              <li className="leading-relaxed">
                                <span className="font-semibold text-foreground">Major Projects</span> (High Impact, Low Feasibility) — High value but challenging to implement. Plan carefully with adequate resources and timeline.
                              </li>
                              <li className="leading-relaxed">
                                <span className="font-semibold text-foreground">Fill-Ins</span> (Low Impact, High Feasibility) — Easy to implement but limited value. Consider if resources are available after higher priorities.
                              </li>
                              <li className="leading-relaxed">
                                <span className="font-semibold text-foreground">Hard Slogs</span> (Low Impact, Low Feasibility) — Difficult to implement with limited return. Generally avoid unless strategic factors require it.
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-4 text-foreground print:page-break-after-avoid">
                Top Recommendations ({topUseCases.length})
              </h2>
              <div className="border border-border rounded-lg overflow-hidden print:overflow-visible print:page-break-inside-avoid">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-accent/20 hover:bg-accent/20">
                      <TableHead className="font-bold w-[60px]">Rank</TableHead>
                      <TableHead className="font-bold min-w-[200px]">Title</TableHead>
                      <TableHead className="font-bold min-w-[250px]">Description</TableHead>
                      <TableHead className="font-bold min-w-[150px]">KPIs</TableHead>
                      {scoringMethod === 'rice' ? (
                        <>
                          <TableHead className="font-bold text-right">Reach</TableHead>
                          <TableHead className="font-bold text-right">Impact</TableHead>
                          <TableHead className="font-bold text-right">Confidence</TableHead>
                          <TableHead className="font-bold text-right">Effort</TableHead>
                          <TableHead className="font-bold text-right">RICE Score</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-bold text-right">Impact</TableHead>
                          <TableHead className="font-bold text-right">Feasibility</TableHead>
                          <TableHead className="font-bold">Quadrant</TableHead>
                          <TableHead className="font-bold text-right">Score</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUseCases.map((useCase, index) => (
                      <TableRow key={useCase.id} className="print:page-break-inside-avoid">
                        <TableCell className="font-bold">
                          <Badge className="bg-accent text-accent-foreground">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{useCase.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{useCase.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {useCase.kpis && useCase.kpis.length > 0 ? (
                              useCase.kpis.map((kpiId) => {
                                const kpi = getKPIById(kpiId)
                                if (!kpi) return null
                                return (
                                  <Badge
                                    key={kpiId}
                                    variant="secondary"
                                    className="text-xs whitespace-nowrap"
                                    style={{
                                      backgroundColor: getCategoryColor(kpi.category),
                                      color: 'oklch(0.98 0 0)',
                                      borderColor: getCategoryColor(kpi.category),
                                    }}
                                  >
                                    {kpi.name}
                                  </Badge>
                                )
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        {scoringMethod === 'rice' ? (
                          <>
                            <TableCell className="text-right">{useCase.rice.reach.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{useCase.rice.impact}x</TableCell>
                            <TableCell className="text-right">{useCase.rice.confidence}%</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{formatEffort(useCase.rice.effort, effortUnit)}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{calculateRICEScore(useCase).toFixed(1)}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-right">{useCase.impact}/10</TableCell>
                            <TableCell className="text-right">{useCase.feasibility}/10</TableCell>
                            <TableCell className="font-medium">{getQuadrant(useCase.impact, useCase.feasibility)}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{(useCase.impact * useCase.feasibility).toFixed(1)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section 
              className={`print:mb-8 ${
                pageBreaks.allUseCases ? 'print:page-break-before-always' : ''
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                All Use Cases ({useCases.length})
              </h2>
              <div className="border border-border rounded-lg overflow-hidden print:overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-bold w-[60px]">Rank</TableHead>
                      <TableHead className="font-bold min-w-[200px]">Title</TableHead>
                      <TableHead className="font-bold min-w-[250px]">Description</TableHead>
                      <TableHead className="font-bold min-w-[150px]">KPIs</TableHead>
                      {scoringMethod === 'rice' ? (
                        <>
                          <TableHead className="font-bold text-right">Reach</TableHead>
                          <TableHead className="font-bold text-right">Impact</TableHead>
                          <TableHead className="font-bold text-right">Confidence</TableHead>
                          <TableHead className="font-bold text-right">Effort</TableHead>
                          <TableHead className="font-bold text-right">RICE Score</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-bold text-right">Impact</TableHead>
                          <TableHead className="font-bold text-right">Feasibility</TableHead>
                          <TableHead className="font-bold">Quadrant</TableHead>
                          <TableHead className="font-bold text-right">Score</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {useCases.map((useCase, index) => {
                      const isTopPick = topUseCaseIds.has(useCase.id)
                      return (
                        <TableRow 
                          key={useCase.id} 
                          className={`print:page-break-inside-avoid ${isTopPick ? 'bg-accent/5' : ''}`}
                        >
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell className="font-medium">{useCase.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{useCase.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {useCase.kpis && useCase.kpis.length > 0 ? (
                                useCase.kpis.map((kpiId) => {
                                  const kpi = getKPIById(kpiId)
                                  if (!kpi) return null
                                  return (
                                    <Badge
                                      key={kpiId}
                                      variant="secondary"
                                      className="text-xs whitespace-nowrap"
                                      style={{
                                        backgroundColor: getCategoryColor(kpi.category),
                                        color: 'oklch(0.98 0 0)',
                                        borderColor: getCategoryColor(kpi.category),
                                      }}
                                    >
                                      {kpi.name}
                                    </Badge>
                                  )
                                })
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          {scoringMethod === 'rice' ? (
                            <>
                              <TableCell className="text-right">{useCase.rice.reach.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{useCase.rice.impact}x</TableCell>
                              <TableCell className="text-right">{useCase.rice.confidence}%</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatEffort(useCase.rice.effort, effortUnit)}</TableCell>
                              <TableCell className="text-right font-bold text-primary">{calculateRICEScore(useCase).toFixed(1)}</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-right">{useCase.impact}/10</TableCell>
                              <TableCell className="text-right">{useCase.feasibility}/10</TableCell>
                              <TableCell className="font-medium">{getQuadrant(useCase.impact, useCase.feasibility)}</TableCell>
                              <TableCell className="text-right font-bold text-primary">{(useCase.impact * useCase.feasibility).toFixed(1)}</TableCell>
                            </>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </div>

        <style>{`
          @media print {
            body.table-export-mode {
              margin: 0;
              padding: 0;
            }
            .print-content {
              max-width: 100%;
              padding: 0;
            }
            h1 {
              font-size: 24pt;
              margin-bottom: 8pt;
            }
            h2 {
              font-size: 16pt;
              margin-top: 16pt;
              margin-bottom: 8pt;
            }
            h3 {
              font-size: 14pt;
              margin-bottom: 6pt;
            }
            h4 {
              font-size: 12pt;
              margin-bottom: 4pt;
            }
            p, li {
              font-size: 10pt;
              line-height: 1.4;
            }
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
              break-after: avoid;
            }
            table {
              page-break-inside: auto;
              width: 100%;
              font-size: 9pt;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            td, th {
              padding: 6pt 8pt;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
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
            .print\\:mb-8 {
              margin-bottom: 16pt;
            }
            .print\\:overflow-visible {
              overflow: visible !important;
            }
            .print\\:space-y-0 > * + * {
              margin-top: 0;
            }
            section {
              margin-bottom: 12pt;
            }
            @page {
              margin: 2cm 1.5cm;
              size: A4 portrait;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
