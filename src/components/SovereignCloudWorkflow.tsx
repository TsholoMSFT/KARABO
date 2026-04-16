import { useMemo, useState, useEffect } from 'react'
import type {
  BusinessEnvisioningData,
  DiscoverySession,
  UseCase,
  CustomerJourney,
  CurrentStateMaturity,
  DeploymentConstraints,
  DeploymentRecommendation,
  SovereignCloudTrackAssessment,
  ConnectivityLevel,
  DataClassificationLevel,
  LatencyRequirement,
  LandingZoneReadiness,
  CAFLifecycleStage,
  CAFCapability,
  CAFMaturityLevel,
} from '@/lib/types'
import { DEPLOYMENT_MODEL_LABELS } from '@/lib/types'
import { generateDefaultJourneyMilestones, calculateJourneyDuration } from '@/lib/types'
import { callAIForTask, generateCustomerJourney } from '@/lib/openai-service'
import { parseJsonLenient } from '@/lib/lenient-json'
import { assessDeploymentModelFromConstraints } from '@/lib/deployment-model-engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import {
  CircleNotch,
  Sparkle,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Globe,
  CloudArrowUp,
  HardDrives,
  GitBranch,
  CaretDown,
  Warning,
  TreeStructure,
} from '@phosphor-icons/react'
import { AIBadge } from '@/components/Disclaimer'
import { AIDataDisclosure } from '@/components/AIDataDisclosure'
import { CustomerJourneyView } from '@/components/CustomerJourneyView'
import { DEMO_PROCESS_ANALYSIS } from '@/lib/demo-data'
import type { DemoIndustry } from '@/lib/demo-data'
import LandingZoneAssessment, { EMPTY_LANDING_ZONE } from '@/components/LandingZoneAssessment'
import CAFReadinessPanel from '@/components/CAFReadinessPanel'

type SovereignCloudStep = 'inputs' | 'review'

interface SovereignCloudWorkflowProps {
  session: DiscoverySession
  useCases: UseCase[]
  onUpdateSession: (sessionId: string, updates: Partial<DiscoverySession>) => void
  onUpsertUseCases: (next: UseCase[]) => void
  onProceedToPortfolio: () => void
  onProceedToEnterprise: () => void
  onConclude: () => void
  isDemoMode?: boolean
  demoIndustry?: DemoIndustry
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function SovereignCloudWorkflow({
  session,
  useCases,
  onUpdateSession,
  onUpsertUseCases,
  onProceedToPortfolio,
  onProceedToEnterprise,
  onConclude,
  isDemoMode,
  demoIndustry,
}: SovereignCloudWorkflowProps) {
  const [step, setStep] = useState<SovereignCloudStep>('inputs')
  const [selectedUseCaseIds, setSelectedUseCaseIds] = useState<string[]>(useCases.map((u) => u.id))

  // ── Sovereign Cloud fields (priority) ──
  const [connectivity, setConnectivity] = useState<ConnectivityLevel>('always-on')
  const [dataClassification, setDataClassification] = useState<DataClassificationLevel>('internal')
  const [latencyRequirements, setLatencyRequirements] = useState<LatencyRequirement>('tolerant')
  const [isGovernmentWorkload, setIsGovernmentWorkload] = useState(false)
  const [governmentClassificationLevel, setGovernmentClassificationLevel] = useState('')
  const [existingInfrastructure, setExistingInfrastructure] = useState('')
  const [requiresFoundryLocal, setRequiresFoundryLocal] = useState(false)
  const [requiresAzureArc, setRequiresAzureArc] = useState(false)
  const [hybridAcceptable, setHybridAcceptable] = useState(true)
  const [physicalLocation, setPhysicalLocation] = useState('')
  const [edgeRequirements, setEdgeRequirements] = useState('')
  const [regulatoryFrameworks, setRegulatoryFrameworks] = useState('')

  // ── AI Assessment fields (migrated, secondary) ──
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

  // ── Landing Zone & CAF ──
  const [landingZone, setLandingZone] = useState<LandingZoneReadiness>(EMPTY_LANDING_ZONE)
  const [cafStage, setCafStage] = useState<CAFLifecycleStage | undefined>(undefined)
  const [cafMaturity, setCafMaturity] = useState<Partial<Record<CAFCapability, CAFMaturityLevel>>>({})

  // ── Collapsible section states ──
  const [showAISection, setShowAISection] = useState(false)
  const [showLandingZone, setShowLandingZone] = useState(false)
  const [showCAF, setShowCAF] = useState(false)

  // ── Results ──
  const [deploymentRecommendation, setDeploymentRecommendation] = useState<DeploymentRecommendation | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBusinessEnvisioning, setGeneratedBusinessEnvisioning] = useState<BusinessEnvisioningData | null>(
    session.businessEnvisioning || null
  )

  // Pre-fill with demo data
  useEffect(() => {
    if (isDemoMode && demoIndustry) {
      const demoData = DEMO_PROCESS_ANALYSIS[demoIndustry]
      if (demoData) {
        setProcessCandidates(demoData.processCandidates)
        setProcessNotes(demoData.processNotes)
        setConstraints(demoData.constraints)
      }
      // Demo sovereign defaults
      if (demoIndustry === 'financial') {
        setDataClassification('confidential')
        setRegulatoryFrameworks('GDPR, POPIA')
        setPhysicalLocation('South Africa')
      }
    }
  }, [isDemoMode, demoIndustry])

  const selectedUseCases = useMemo(
    () => useCases.filter((u) => selectedUseCaseIds.includes(u.id)),
    [useCases, selectedUseCaseIds]
  )

  const toggleUseCase = (id: string) => {
    setSelectedUseCaseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // ── Build constraints from form state ──
  const buildConstraints = (): DeploymentConstraints => ({
    connectivity,
    dataClassification,
    latencyRequirements,
    regulatoryFrameworks: regulatoryFrameworks.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean),
    physicalLocation: physicalLocation || undefined,
    edgeRequirements: edgeRequirements || undefined,
    aiWorkloadType: 'inference-only',
    existingInfrastructure: existingInfrastructure || undefined,
    isGovernmentWorkload,
    governmentClassificationLevel: governmentClassificationLevel || undefined,
    requiresFoundryLocal,
    requiresAzureArc,
    hybridAcceptable,
  })

  // ── Generate ──
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // 1. Run deployment model decision tree
      const dConstraints = buildConstraints()
      const recommendation = assessDeploymentModelFromConstraints(dConstraints)
      setDeploymentRecommendation(recommendation)

      // 2. Run AI process analysis (if process candidates provided)
      let businessEnvisioning: BusinessEnvisioningData | undefined
      if (processCandidates.trim() || processNotes.trim()) {
        const catalogUseCases = selectedUseCases.map((u) => ({
          id: u.id,
          title: u.title,
          description: u.description,
          impact: u.impact,
          feasibility: u.feasibility,
          kpis: u.kpis || [],
        }))

        const prompt = `You are facilitating a Sovereign Cloud Assessment workshop.

GOAL
- Turn process analysis inputs into: (1) structured Business Envisioning data, and (2) agent-focused analysis per use case.
- Factor in the deployment model constraints when assessing feasibility.

CUSTOMER
- Name: ${session.customerName}
- Industry: ${session.industry || 'general'}

DEPLOYMENT MODEL
- Recommended: ${recommendation.primaryModel}
- Architecture: ${recommendation.architecturePattern}
- Rationale: ${recommendation.rationale}

CURRENT STATE MATURITY
${JSON.stringify(currentState, null, 2)}

SOVEREIGN CONSTRAINTS
- Connectivity: ${connectivity}
- Data Classification: ${dataClassification}
- Government Workload: ${isGovernmentWorkload}
- Foundry Local Required: ${requiresFoundryLocal}
- Physical Location: ${physicalLocation || 'not specified'}

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
- Be conservative on feasibility when the deployment model has limited services (e.g., disconnected, Foundry Local).
- Note any sovereign/hybrid constraints that affect implementation in the notes.
`
        const raw = await callAIForTask('analysis', prompt, {
          expectJson: true,
          systemPrompt: 'Return only strict JSON. No markdown.',
        })

        const parsed = parseJsonLenient<any>(raw)

        businessEnvisioning = parsed?.businessEnvisioning as BusinessEnvisioningData | undefined
        if (businessEnvisioning) {
          setGeneratedBusinessEnvisioning(businessEnvisioning)
          onUpdateSession(session.id, { businessEnvisioning })
        }

        // Process use case recommendations
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
            rice: { reach: 100, users: 100, period: 'quarter', impact: 1, confidence: 50, effort: 1 },
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

        // Generate customer journeys
        toast.info('Generating customer journeys...')
        const mergedWithJourneys = await Promise.all(
          merged.map(async (uc) => {
            if (uc.customerJourney) return uc
            try {
              const complexity: 'low' | 'medium' | 'high' | 'very-high' =
                uc.implementationComplexity?.level || 'medium'
              const generated = await generateCustomerJourney(
                { id: uc.id, title: uc.title, description: uc.description },
                { complexity, industry: session.industry, customerName: session.customerName }
              )
              const journey: CustomerJourney = {
                useCaseId: uc.id,
                title: generated.title,
                journeyNotes: generated.journeyNotes,
                milestones: generated.milestones.map((m, mIdx) => ({
                  id: `${uc.id}-m${mIdx + 1}`,
                  order: mIdx + 1,
                  title: m.title,
                  description: m.description,
                  engagement: m.engagement,
                  duration: m.duration,
                  deliverables: m.deliverables,
                  dependencies: m.dependencies,
                  isComplete: false,
                  discoveryContext: m.discoveryContext,
                })),
                nextSteps: generated.nextSteps?.map((s, sIdx) => ({
                  id: `${uc.id}-step${sIdx + 1}`,
                  action: s.action,
                  owner: s.owner,
                  targetDate: s.targetDate,
                  isComplete: false,
                })),
                totalDuration: generated.totalDuration,
                createdAt: Date.now(),
                generatedBy: 'ai',
                editHistory: [],
                discoveryInsights: generated.discoveryInsights,
              }
              return { ...uc, customerJourney: journey }
            } catch (error) {
              console.error(`Failed to generate journey for ${uc.title}:`, error)
              const milestones = generateDefaultJourneyMilestones(uc.id, 'medium')
              const journey: CustomerJourney = {
                useCaseId: uc.id,
                title: `${uc.title} Implementation Journey`,
                milestones,
                totalDuration: calculateJourneyDuration(milestones),
                createdAt: Date.now(),
                generatedBy: 'ai',
                editHistory: [],
              }
              return { ...uc, customerJourney: journey }
            }
          })
        )
        onUpsertUseCases(mergedWithJourneys)
      }

      // 3. Save sovereign cloud track assessment to session
      const trackAssessment: SovereignCloudTrackAssessment = {
        cloudEnvironment: recommendation.primaryCloudEnvironment || 'azure-public',
        recommendedRegions: [],
        mandateLevel: isGovernmentWorkload ? 'required' : 'recommended',
        serviceAvailability: recommendation.serviceAvailability,
        crossBorderFlows: [],
        gaps: recommendation.gaps,
        readinessScore: recommendation.readinessScore,
        assessedAt: Date.now(),
        deploymentModel: recommendation.primaryModel,
        deploymentConstraints: dConstraints,
        deploymentRecommendation: recommendation,
        landingZoneReadiness: landingZone,
        currentStateMaturity: currentState,
        processCandidates: processCandidates || undefined,
        processNotes: processNotes || undefined,
        constraints: constraints || undefined,
      }

      onUpdateSession(session.id, {
        sovereignCloudTrackAssessment: trackAssessment,
        deploymentModel: recommendation.primaryModel,
      })

      toast.success('Sovereign Cloud Assessment complete', {
        description: `Recommended: ${DEPLOYMENT_MODEL_LABELS[recommendation.primaryModel]} — ${recommendation.architecturePattern}`,
      })

      setStep('review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate assessment'
      toast.error('Assessment failed', { description: message })
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Render ──
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-2 border-teal-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={20} weight="fill" className="text-teal-500" />
            Sovereign Cloud Assessment
          </CardTitle>
          <CardDescription>
            Assess deployment model, sovereign/hybrid cloud strategy, and AI readiness — then proceed to Portfolio or Strategic Assessment.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'inputs' && (
            <>
              {/* ════════════════════════════════════════════════════════════════
                  SECTION 1: SOVEREIGN CLOUD CONSTRAINTS (Priority)
                  ════════════════════════════════════════════════════════════════ */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Globe size={16} weight="duotone" className="text-teal-500" />
                  Cloud Environment & Connectivity
                </h3>
                <p className="text-xs text-muted-foreground">
                  These fields drive the deployment model recommendation — sovereign, disconnected, hybrid, Azure Local, Arc, or Foundry Local.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Connectivity level</Label>
                  <Select value={connectivity} onValueChange={(v) => setConnectivity(v as ConnectivityLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always-on">Always-on (full internet)</SelectItem>
                      <SelectItem value="intermittent">Intermittent (periodic sync)</SelectItem>
                      <SelectItem value="air-gapped">Air-gapped (fully disconnected)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data classification level</Label>
                  <Select value={dataClassification} onValueChange={(v) => setDataClassification(v as DataClassificationLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                      <SelectItem value="top-secret">Top Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Latency requirements</Label>
                  <Select value={latencyRequirements} onValueChange={(v) => setLatencyRequirements(v as LatencyRequirement)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tolerant">Tolerant (&gt;500ms OK)</SelectItem>
                      <SelectItem value="sensitive">Sensitive (&lt;100ms preferred)</SelectItem>
                      <SelectItem value="real-time">Real-time (&lt;10ms required)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Physical location / jurisdiction</Label>
                  <Textarea
                    value={physicalLocation}
                    onChange={(e) => setPhysicalLocation(e.target.value)}
                    placeholder="E.g., South Africa, European Union, United States, UAE..."
                    rows={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Existing on-premises infrastructure</Label>
                  <Textarea
                    value={existingInfrastructure}
                    onChange={(e) => setExistingInfrastructure(e.target.value)}
                    placeholder="E.g., Azure Local, VMware vSphere, bare metal, Hyper-V, nutanix..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Regulatory frameworks</Label>
                  <Textarea
                    value={regulatoryFrameworks}
                    onChange={(e) => setRegulatoryFrameworks(e.target.value)}
                    placeholder="E.g., FedRAMP, GDPR, POPIA, ITAR, NIS2, EU AI Act..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="text-sm">Government / defense workload</Label>
                    <p className="text-xs text-muted-foreground">Triggers sovereign cloud mandate assessment</p>
                  </div>
                  <Switch checked={isGovernmentWorkload} onCheckedChange={setIsGovernmentWorkload} />
                </div>

                {isGovernmentWorkload && (
                  <div className="space-y-2">
                    <Label>Classification level</Label>
                    <Select value={governmentClassificationLevel} onValueChange={setGovernmentClassificationLevel}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unclassified">Unclassified</SelectItem>
                        <SelectItem value="IL4">IL4 (Controlled Unclassified)</SelectItem>
                        <SelectItem value="IL5">IL5 (National Security)</SelectItem>
                        <SelectItem value="IL6">IL6 (Secret)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="text-sm">Requires Foundry Local</Label>
                    <p className="text-xs text-muted-foreground">On-prem AI inference</p>
                  </div>
                  <Switch checked={requiresFoundryLocal} onCheckedChange={setRequiresFoundryLocal} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="text-sm">Requires Azure Arc</Label>
                    <p className="text-xs text-muted-foreground">Hybrid management</p>
                  </div>
                  <Switch checked={requiresAzureArc} onCheckedChange={setRequiresAzureArc} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="text-sm">Hybrid acceptable</Label>
                    <p className="text-xs text-muted-foreground">Mix cloud + on-prem</p>
                  </div>
                  <Switch checked={hybridAcceptable} onCheckedChange={setHybridAcceptable} />
                </div>
              </div>

              {edgeRequirements !== undefined && (
                <div className="space-y-2">
                  <Label>Edge computing requirements</Label>
                  <Textarea
                    value={edgeRequirements}
                    onChange={(e) => setEdgeRequirements(e.target.value)}
                    placeholder="E.g., factory floor sensors, store kiosks, field devices, OT/SCADA..."
                    rows={2}
                  />
                </div>
              )}

              <Separator />

              {/* ════════════════════════════════════════════════════════════════
                  SECTION 2: CURRENT STATE MATURITY (AI Assessment — woven)
                  ════════════════════════════════════════════════════════════════ */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <HardDrives size={16} weight="duotone" className="text-teal-500" />
                  Current State Maturity
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tech stack maturity</Label>
                  <Select
                    value={currentState.techStackMaturity}
                    onValueChange={(v) => setCurrentState((s) => ({ ...s, techStackMaturity: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="experimental">Experimental</SelectItem>
                      <SelectItem value="pilot">Pilot</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* ════════════════════════════════════════════════════════════════
                  SECTION 3: LANDING ZONE ASSESSMENT (collapsible)
                  ════════════════════════════════════════════════════════════════ */}
              <Collapsible open={showLandingZone} onOpenChange={setShowLandingZone}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-teal-500 transition-colors w-full">
                  <CaretDown size={14} className={`transition-transform ${showLandingZone ? 'rotate-0' : '-rotate-90'}`} />
                  <CloudArrowUp size={16} weight="duotone" className="text-teal-500" />
                  Landing Zone Assessment
                  <Badge variant="outline" className="ml-auto text-xs">Optional</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <LandingZoneAssessment value={landingZone} onChange={setLandingZone} />
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* ════════════════════════════════════════════════════════════════
                  SECTION 4: CAF READINESS (collapsible)
                  ════════════════════════════════════════════════════════════════ */}
              <Collapsible open={showCAF} onOpenChange={setShowCAF}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-teal-500 transition-colors w-full">
                  <CaretDown size={14} className={`transition-transform ${showCAF ? 'rotate-0' : '-rotate-90'}`} />
                  <GitBranch size={16} weight="duotone" className="text-teal-500" />
                  CAF Readiness Panel
                  <Badge variant="outline" className="ml-auto text-xs">Optional</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <CAFReadinessPanel
                    cafStage={cafStage}
                    cafCapabilityMaturity={cafMaturity}
                    onStageChange={setCafStage}
                    onMaturityChange={(pillar, level) => setCafMaturity((prev) => ({ ...prev, [pillar]: level }))}
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* ════════════════════════════════════════════════════════════════
                  SECTION 5: AI PROCESS ANALYSIS (collapsible, migrated)
                  ════════════════════════════════════════════════════════════════ */}
              <Collapsible open={showAISection} onOpenChange={setShowAISection}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-teal-500 transition-colors w-full">
                  <CaretDown size={14} className={`transition-transform ${showAISection ? 'rotate-0' : '-rotate-90'}`} />
                  <Sparkle size={16} weight="duotone" className="text-teal-500" />
                  AI Process Analysis
                  <Badge variant="outline" className="ml-auto text-xs">Optional</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Use cases in scope</Label>
                    {useCases.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No portfolio use cases exist yet. You can still generate new use cases from process analysis.
                      </p>
                    ) : (
                      <ScrollArea className="h-[160px] rounded-md border p-3">
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
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Constraints</Label>
                    <Textarea
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="Security/compliance requirements, data residency, approvals, integration constraints."
                      rows={3}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <AIDataDisclosure
                fields={['cloud constraints', 'maturity', 'landing zone', 'CAF', 'process candidates', 'process notes', 'constraints', 'selected use cases']}
                model="gpt-4o-mini"
                note="Cloud constraint fields are assessed locally (no AI). Process analysis inputs are sent to AI to generate recommendations."
              />
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              REVIEW STEP
              ════════════════════════════════════════════════════════════════ */}
          {step === 'review' && deploymentRecommendation && (
            <>
              {/* Deployment Model Recommendation (top position) */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-teal-500/30 bg-teal-500/5">
                  <ShieldCheck size={24} className="text-teal-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base">
                        {DEPLOYMENT_MODEL_LABELS[deploymentRecommendation.primaryModel]}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {deploymentRecommendation.architecturePattern}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {deploymentRecommendation.rationale}
                    </p>
                    {deploymentRecommendation.fallbackModel && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Fallback: {DEPLOYMENT_MODEL_LABELS[deploymentRecommendation.fallbackModel]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Readiness Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Readiness Score</span>
                    <span className="font-bold text-teal-500">{deploymentRecommendation.readinessScore}/100</span>
                  </div>
                  <Progress value={deploymentRecommendation.readinessScore} className="h-2" />
                </div>
              </div>

              <Separator />

              {/* Service Availability */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Service Availability</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {deploymentRecommendation.serviceAvailability.map((svc, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                      {svc.availableInCloud ? (
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Warning size={16} className="text-amber-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{svc.service}</span>
                        {svc.limitations && (
                          <p className="text-xs text-muted-foreground truncate">{svc.limitations}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foundry Local Models (if applicable) */}
              {deploymentRecommendation.foundryLocalCapabilities && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <HardDrives size={16} weight="duotone" className="text-teal-500" />
                      Foundry Local Model Catalog
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {deploymentRecommendation.foundryLocalCapabilities.map((model, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.modelName}</span>
                            <Badge variant="secondary" className="text-xs">{model.modelFamily}</Badge>
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <span>GPU: ≥{model.minGPUMemoryGB}GB</span>
                            <span>Context: {(model.maxContextTokens / 1024).toFixed(0)}K</span>
                            {model.onnxSupported && <Badge variant="outline" className="text-xs">ONNX</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.supportedTasks.map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Gaps & Recommendations */}
              {deploymentRecommendation.gaps.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Warning size={16} className="text-amber-500" />
                      Gaps & Recommendations ({deploymentRecommendation.gaps.length})
                    </h4>
                    <div className="space-y-2">
                      {deploymentRecommendation.gaps.map((gap) => (
                        <div key={gap.id} className="p-3 rounded-lg border">
                          <div className="flex items-start gap-2">
                            <Badge
                              variant={gap.impact === 'high' ? 'destructive' : gap.impact === 'medium' ? 'default' : 'secondary'}
                              className="text-xs shrink-0"
                            >
                              {gap.impact}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">{gap.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{gap.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Process Analysis Results (if generated) */}
              {generatedBusinessEnvisioning && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-accent/10">
                    <CheckCircle size={22} className="text-accent" />
                    <div>
                      <p className="font-medium flex items-center gap-2">Process Analysis complete <AIBadge /></p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your process analysis is saved and portfolio use cases were updated.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1.5">Business Processes <AIBadge /></CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {generatedBusinessEnvisioning.businessProcesses?.length || 0} mapped
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1.5">Business Outcomes <AIBadge /></CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {generatedBusinessEnvisioning.businessOutcomes?.length || 0} captured
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Customer Journeys */}
              {useCases.some((uc) => uc.customerJourney) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TreeStructure size={20} weight="duotone" className="text-teal-500" />
                    <Label className="text-sm font-medium">Customer Journeys</Label>
                    <AIBadge />
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4 pr-4">
                      {useCases.filter((uc) => uc.customerJourney).map((uc) => (
                        <div key={uc.id}>
                          <h4 className="text-sm font-medium mb-2">{uc.title}</h4>
                          <CustomerJourneyView
                            journey={uc.customerJourney!}
                            onUpdate={(journey) => {
                              const updated = useCases.map((u) =>
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
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          {step === 'inputs' ? (
            <>
              <Button type="button" variant="outline" onClick={onConclude}>
                Conclude
              </Button>
              <Button type="button" onClick={handleGenerate} disabled={isGenerating} className="gap-2 bg-teal-600 hover:bg-teal-700">
                {isGenerating ? <CircleNotch size={18} className="animate-spin" /> : <ShieldCheck size={18} weight="fill" />}
                Run Sovereign Cloud Assessment
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
                  Strategic Assessment
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
