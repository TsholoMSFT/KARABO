import { useMemo, useState, useEffect } from 'react'
import type { BusinessEnvisioningData, DiscoverySession, UseCase, CustomerJourney } from '@/lib/types'
import { generateDefaultJourneyMilestones, calculateJourneyDuration } from '@/lib/types'
import { callAIForTask, generateCustomerJourney } from '@/lib/openai-service'
import { parseJsonLenient } from '@/lib/lenient-json'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CircleNotch, Sparkle, ArrowRight, CheckCircle, TreeStructure } from '@phosphor-icons/react'
import { calculateRICEScore, getTopUseCases } from '@/lib/scoring'
import { ThreadlightPasteCard } from '@/components/ThreadlightPasteCard'
import { CustomerJourneyView } from '@/components/CustomerJourneyView'
import { buildThreadlightByopPasteText, buildThreadlightProcessAnalysis, makeThreadlightShortName } from '@/lib/threadlight-export'
import { DEMO_PROCESS_ANALYSIS } from '@/lib/demo-data'
import type { DemoIndustry } from '@/lib/demo-data'

type AIAssessmentStep = 'inputs' | 'review'

interface AIAssessmentWorkflowProps {
  session: DiscoverySession
  useCases: UseCase[]
  onUpdateSession: (sessionId: string, updates: Partial<DiscoverySession>) => void
  onUpsertUseCases: (next: UseCase[]) => void
  onProceedToPortfolio: () => void
  onProceedToEnterprise: () => void
  onConclude: () => void
  // Demo mode props
  isDemoMode?: boolean
  demoIndustry?: DemoIndustry
}

type CurrentStateMaturity = {
  techStackMaturity: 'legacy' | 'modernizing' | 'modern' | 'cloud-native'
  dataMaturity: 'siloed' | 'integrated' | 'governed' | 'ai-ready'
  cloudReadiness: 'on-premises' | 'hybrid' | 'cloud-first' | 'cloud-native'
  aiUsage: 'none' | 'experimental' | 'pilot' | 'production'
  aiGovernance: 'yes' | 'no' | 'unknown'
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function AIAssessmentWorkflow({
  session,
  useCases,
  onUpdateSession,
  onUpsertUseCases,
  onProceedToPortfolio,
  onProceedToEnterprise,
  onConclude,
  isDemoMode,
  demoIndustry,
}: AIAssessmentWorkflowProps) {
  const [step, setStep] = useState<AIAssessmentStep>('inputs')
  const [selectedUseCaseIds, setSelectedUseCaseIds] = useState<string[]>(useCases.map((u) => u.id))
  const [processCandidates, setProcessCandidates] = useState('')
  const [processNotes, setProcessNotes] = useState('')
  const [constraints, setConstraints] = useState('')
  const [currentState, setCurrentState] = useState<CurrentStateMaturity>({
    techStackMaturity: 'modernizing',
    dataMaturity: 'integrated',
    cloudReadiness: 'hybrid',
    aiUsage: 'experimental',
    aiGovernance: 'unknown',
  })

  // Pre-fill with demo data when demo mode is active
  useEffect(() => {
    if (isDemoMode && demoIndustry) {
      const demoData = DEMO_PROCESS_ANALYSIS[demoIndustry]
      if (demoData) {
        setProcessCandidates(demoData.processCandidates)
        setProcessNotes(demoData.processNotes)
        setConstraints(demoData.constraints)
      }
    }
  }, [isDemoMode, demoIndustry])

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBusinessEnvisioning, setGeneratedBusinessEnvisioning] = useState<BusinessEnvisioningData | null>(
    session.businessEnvisioning || null
  )

  const selectedUseCases = useMemo(
    () => useCases.filter((u) => selectedUseCaseIds.includes(u.id)),
    [useCases, selectedUseCaseIds]
  )

  const topScored = useMemo(() => getTopUseCases(selectedUseCases, 'rice', 3), [selectedUseCases])

  const toggleUseCase = (id: string) => {
    setSelectedUseCaseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const catalogUseCases = selectedUseCases.map((u) => ({
        id: u.id,
        title: u.title,
        description: u.description,
        impact: u.impact,
        feasibility: u.feasibility,
        kpis: u.kpis || [],
      }))

      const prompt = `You are facilitating an AI Assessment Lite workshop.

GOAL
- Turn process analysis inputs into: (1) structured Business Envisioning data, and (2) agent-focused analysis per use case.

CUSTOMER
- Name: ${session.customerName}
- Industry: ${session.industry || 'general'}

CURRENT STATE MATURITY
${JSON.stringify(currentState, null, 2)}

PROCESS CANDIDATES (newline list)
${processCandidates || '(none)'}

PROCESS NOTES
${processNotes || '(none)'}

CONSTRAINTS (security/compliance/integration)
${constraints || '(none)'}

PORTFOLIO USE CASES IN SCOPE
${JSON.stringify(catalogUseCases, null, 2)}

OUTPUT REQUIREMENTS
Return strict JSON ONLY (no markdown) with this shape:
{
  "businessEnvisioning": {
    "strategicPriorities": [],
    "businessOutcomes": [],
    "businessProcesses": [],
    "currentState": {
      "techStack": {"maturity":"modernizing","keyPlatforms":[],"integrationChallenges":[]},
      "data": {"maturity":"integrated","keyDataSources":[],"dataQualityConcerns":[],"governanceInPlace": false},
      "infrastructure": {"cloudReadiness":"hybrid","existingAzureServices":[],"existingMicrosoftProducts":[]},
      "aiMaturity": {"currentUsage":"experimental","existingAITools":[],"aiGovernance": false,"aiSkillsGap":"moderate"}
    }
  },
  "useCaseRecommendations": [
    {
      "useCaseId": "<must match an input useCase id>",
      "impact": 1,
      "feasibility": 1,
      "kpis": ["kpi-id"],
      "agenticOpportunities": [
        {
          "id": "ao-1",
          "title": "...",
          "description": "...",
          "agentType": "task-agent",
          "capabilities": ["reasoning","tool-use"],
          "humanOversight": "approval",
          "automationLevel": "assisted",
          "tools": ["..."]
        }
      ],
      "implementationComplexity": {
        "level": "medium",
        "factors": ["..."],
        "estimatedDuration": "...",
        "estimatedTeamSize": "...",
        "keyRisks": ["..."]
      },
      "notes": ["short bullets for rationale"]
    }
  ],
  "newUseCases": [
    {
      "title": "...",
      "description": "...",
      "impact": 5,
      "feasibility": 5,
      "kpis": ["kpi-id"],
      "agenticOpportunities": [],
      "implementationComplexity": {"level":"low","factors":[]}
    }
  ]
}

RULES
- If there are no portfolio use cases in scope, populate "newUseCases" (3-6) derived from the process analysis.
- Keep impact/feasibility on a 1-10 scale.
- Be conservative on feasibility when integrations/security are unclear.
`

      const raw = await callAIForTask('analysis', prompt, {
        expectJson: true,
        systemPrompt: 'Return only strict JSON. No markdown.',
      })

      const parsed = parseJsonLenient<any>(raw)

      const businessEnvisioning = parsed?.businessEnvisioning as BusinessEnvisioningData | undefined
      if (businessEnvisioning) {
        setGeneratedBusinessEnvisioning(businessEnvisioning)
        onUpdateSession(session.id, { businessEnvisioning })
      }

      const recs: any[] = Array.isArray(parsed?.useCaseRecommendations) ? parsed.useCaseRecommendations : []
      const recById = new Map<string, any>()
      for (const r of recs) {
        if (r?.useCaseId) recById.set(String(r.useCaseId), r)
      }

      const created: any[] = Array.isArray(parsed?.newUseCases) ? parsed.newUseCases : []
      const newUseCases: UseCase[] = created
        .filter((u) => u?.title && u?.description)
        .slice(0, 8)
        .map((u) => ({
          id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          discoverySessionId: session.id,
          title: String(u.title),
          description: String(u.description),
          impact: clampInt(u.impact, 1, 10, 5),
          feasibility: clampInt(u.feasibility, 1, 10, 5),
          rice: {
            reach: 100,
            users: 100,
            period: 'quarter',
            impact: 1,
            confidence: 50,
            effort: 1,
          },
          kpis: Array.isArray(u.kpis) ? u.kpis.map(String) : [],
          agenticOpportunities: Array.isArray(u.agenticOpportunities) ? u.agenticOpportunities : undefined,
          implementationComplexity: u.implementationComplexity,
          dataSources: ['ai-generated', 'discovery'],
          createdAt: Date.now(),
        }))

      const updatedExisting = useCases.map((uc) => {
        const r = recById.get(uc.id)
        if (!r) return uc
        return {
          ...uc,
          impact: clampInt(r.impact, 1, 10, uc.impact),
          feasibility: clampInt(r.feasibility, 1, 10, uc.feasibility),
          kpis: Array.isArray(r.kpis) ? r.kpis.map(String) : uc.kpis,
          agenticOpportunities: Array.isArray(r.agenticOpportunities) ? r.agenticOpportunities : uc.agenticOpportunities,
          implementationComplexity: r.implementationComplexity || uc.implementationComplexity,
          industryContext: Array.isArray(r.notes)
            ? [...(uc.industryContext || []), ...r.notes.map(String)].slice(0, 20)
            : uc.industryContext,
        }
      })

      const merged = [...updatedExisting, ...newUseCases]
      
      // Generate customer journeys for all use cases
      toast.info('Generating customer journeys...')
      const mergedWithJourneys = await Promise.all(
        merged.map(async (uc) => {
          if (uc.customerJourney) return uc // Already has a journey
          
          try {
            const complexity: 'low' | 'medium' | 'high' | 'very-high' = 
              uc.implementationComplexity?.level || 'medium'
            
            const generated = await generateCustomerJourney(
              { id: uc.id, title: uc.title, description: uc.description },
              { complexity, industry: session.industry, customerName: session.customerName }
            )
            
            const journey: CustomerJourney = {
              useCaseId: uc.id,
              milestones: generated.milestones.map((m, mIdx) => ({
                id: `${uc.id}-m${mIdx + 1}`,
                order: mIdx + 1,
                title: m.title,
                description: m.description,
                engagement: m.engagement,
                duration: m.duration,
                deliverables: m.deliverables,
                dependencies: m.dependencies,
                isComplete: false
              })),
              totalDuration: generated.totalDuration,
              createdAt: Date.now(),
              generatedBy: 'ai',
              editHistory: []
            }
            
            return { ...uc, customerJourney: journey }
          } catch (error) {
            console.error(`Failed to generate journey for ${uc.title}:`, error)
            // Use default journey on error
            const milestones = generateDefaultJourneyMilestones(uc.id, 'medium')
            const journey: CustomerJourney = {
              useCaseId: uc.id,
              milestones,
              totalDuration: calculateJourneyDuration(milestones),
              createdAt: Date.now(),
              generatedBy: 'ai',
              editHistory: []
            }
            return { ...uc, customerJourney: journey }
          }
        })
      )
      
      onUpsertUseCases(mergedWithJourneys)

      toast.success('AI Assessment Lite generated', {
        description: businessEnvisioning
          ? 'Saved process analysis and updated portfolio use cases.'
          : 'Updated portfolio use cases.',
      })

      setStep('review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate AI Assessment Lite'
      toast.error('AI Assessment Lite failed', { description: message })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-2 border-brand-orange/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle size={20} weight="fill" className="text-brand-orange" />
            AI Assessment Lite
          </CardTitle>
          <CardDescription>
            Run a structured process analysis to refine agent opportunities, then decide whether to proceed to Portfolio or Enterprise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'inputs' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Use cases in scope</Label>
                {useCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No portfolio use cases exist for this session yet. You can still run AI Assessment Lite and generate new use cases from process analysis.
                  </p>
                ) : (
                  <ScrollArea className="h-[200px] rounded-md border p-3">
                    <div className="space-y-3">
                      {useCases.map((uc) => (
                        <div key={uc.id} className="flex items-start gap-3">
                          <Checkbox
                            id={`uc-${uc.id}`}
                            checked={selectedUseCaseIds.includes(uc.id)}
                            onCheckedChange={() => toggleUseCase(uc.id)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor={`uc-${uc.id}`} className="text-sm font-medium cursor-pointer">
                              {uc.title}
                            </Label>
                            <p className="text-xs text-muted-foreground line-clamp-2">{uc.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tech stack maturity</Label>
                  <Select
                    value={currentState.techStackMaturity}
                    onValueChange={(v) => setCurrentState((s) => ({ ...s, techStackMaturity: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legacy">Legacy</SelectItem>
                      <SelectItem value="modernizing">Modernizing</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="cloud-native">Cloud-native</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data maturity</Label>
                  <Select
                    value={currentState.dataMaturity}
                    onValueChange={(v) => setCurrentState((s) => ({ ...s, dataMaturity: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="siloed">Siloed</SelectItem>
                      <SelectItem value="integrated">Integrated</SelectItem>
                      <SelectItem value="governed">Governed</SelectItem>
                      <SelectItem value="ai-ready">AI-ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cloud readiness</Label>
                  <Select
                    value={currentState.cloudReadiness}
                    onValueChange={(v) => setCurrentState((s) => ({ ...s, cloudReadiness: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on-premises">On-premises</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="cloud-first">Cloud-first</SelectItem>
                      <SelectItem value="cloud-native">Cloud-native</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI usage maturity</Label>
                  <Select
                    value={currentState.aiUsage}
                    onValueChange={(v) => setCurrentState((s) => ({ ...s, aiUsage: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="experimental">Experimental</SelectItem>
                      <SelectItem value="pilot">Pilot</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Process candidates</Label>
                <Textarea
                  value={processCandidates}
                  onChange={(e) => setProcessCandidates(e.target.value)}
                  placeholder="List 1-3 processes (one per line). e.g.\n- Invoice processing\n- Customer onboarding\n- Incident triage"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Process notes</Label>
                <Textarea
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  placeholder="Describe the as-is flow, handoffs, exceptions, volumes, and pain points."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Constraints</Label>
                <Textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Security/compliance requirements, data residency, approvals, systems of record, integration constraints."
                  rows={3}
                />
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-accent/10">
                <CheckCircle size={22} className="text-accent" />
                <div>
                  <p className="font-medium">AI Assessment Lite complete</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your process analysis is saved to this session and your portfolio use cases were updated.
                  </p>
                </div>
              </div>

              {generatedBusinessEnvisioning && (
                <div className="space-y-2">
                  <Label className="text-sm">Saved artifacts</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Business Processes</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {generatedBusinessEnvisioning.businessProcesses?.length || 0} mapped
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Business Outcomes</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {generatedBusinessEnvisioning.businessOutcomes?.length || 0} captured
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Customer Journeys Section */}
              {useCases.some(uc => uc.customerJourney) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TreeStructure size={20} weight="duotone" className="text-brand-orange" />
                    <Label className="text-sm font-medium">Customer Journeys</Label>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4 pr-4">
                      {useCases.filter(uc => uc.customerJourney).map((uc) => (
                        <div key={uc.id}>
                          <h4 className="text-sm font-medium mb-2">{uc.title}</h4>
                          <CustomerJourneyView
                            journey={uc.customerJourney!}
                            onUpdate={(journey) => {
                              const updated = useCases.map(u => 
                                u.id === uc.id ? { ...u, customerJourney: journey } : u
                              )
                              onUpsertUseCases(updated)
                            }}
                            colorScheme="orange"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <ThreadlightPasteCard
                industryLabel={session.industry || 'general'}
                industryValue={session.industry || 'general'}
                shortName={makeThreadlightShortName(topScored[0]?.title || 'AI Assessment Lite')}
                topScoredItems={topScored.map((u) => ({
                  title: u.title,
                  scoreLabel: 'RICE',
                  scoreValue: calculateRICEScore(u),
                }))}
                processAnalysis={buildThreadlightProcessAnalysis({
                  customerName: session.customerName,
                  opportunityName: session.name,
                  industryLabel: session.industry || 'general',
                  processCandidates,
                  processNotes,
                  constraints,
                  topItems: topScored.map((u) => ({
                    title: u.title,
                    description: u.description,
                    scoreLabel: 'RICE',
                    scoreValue: calculateRICEScore(u),
                  })),
                })}
                pasteText={buildThreadlightByopPasteText({
                  customerName: session.customerName,
                  opportunityName: session.name,
                  industryLabel: session.industry || 'general',
                  processCandidates,
                  processNotes,
                  constraints,
                  topItems: topScored.map((u) => ({
                    title: u.title,
                    description: u.description,
                    scoreLabel: 'RICE',
                    scoreValue: calculateRICEScore(u),
                  })),
                })}
              />
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          {step === 'inputs' ? (
            <>
              <Button type="button" variant="outline" onClick={onConclude}>
                Conclude
              </Button>
              <Button type="button" onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? <CircleNotch size={18} className="animate-spin" /> : <Sparkle size={18} weight="fill" />}
                Generate AI Assessment Lite
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onConclude}>
                Conclude
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onProceedToPortfolio} className="gap-2">
                  Portfolio / Matrix
                  <ArrowRight size={16} />
                </Button>
                <Button type="button" onClick={onProceedToEnterprise} className="gap-2">
                  Enterprise Discovery
                  <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
