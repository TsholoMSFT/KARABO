import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { buildSolutionPathsAnnex } from '@/lib/solution-blueprint/annex-builder'
import { useLocalStorage } from '@/hooks/use-local-storage'
import '@/lib/openai-service' // Initialize OpenAI service
import { UseCase, ScoringMethod, CustomerMetadata, DiscoverySession, Industry, DiscoveryResponse, EntityType, AccountSegment, BusinessFunction } from '@/lib/types'
import type { EnterpriseDiscoverySession, EnterpriseDiscoverySessionMVP } from '@/lib/types'

// Union type: handlers accept both legacy and MVP sessions
type AnyEnterpriseSession = EnterpriseDiscoverySession | EnterpriseDiscoverySessionMVP
import type { SessionTemplate } from '@/lib/session-templates'
import { SessionMetadata } from '@/components/SessionMetadataForm'
import { getTopUseCases, getRankedUseCases } from '@/lib/scoring'
import { useDiscovery } from '@/hooks/use-discovery'
import { useCustomers } from '@/hooks/use-customers'
import { LandingPage } from '@/components/LandingPage'
import { NavigationHeader } from '@/components/NavigationHeader'
import { EmptyState } from '@/components/EmptyState'
import { DemoModeBanner } from '@/components/DemoModeBanner'
import { Disclaimer } from '@/components/Disclaimer'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, ChartScatter, ListNumbers, FileArrowDown, FileArrowUp, CaretDown, CaretUp, FolderOpen, Funnel, CurrencyDollar, ShieldCheck, Calculator } from '@phosphor-icons/react'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Footer } from '@/components/ui/footer'
import { assessPortfolio, detectJurisdictions } from '@/lib/regulatory-engine'
import { 
  DEMO_DISCOVERY_SESSION, 
  DEMO_USE_CASES, 
  DEMO_ENTERPRISE_SESSION,
  DEMO_RETAIL_SESSION,
  DEMO_RETAIL_USE_CASES,
  DEMO_RETAIL_ENTERPRISE_SESSION,
  DEMO_FINANCIAL_SESSION,
  DEMO_FINANCIAL_USE_CASES,
  DEMO_FINANCIAL_ENTERPRISE_SESSION,
} from '@/lib/demo-data'
import type { DemoIndustry } from '@/lib/demo-data'
import type { ExtractedUseCase } from '@/lib/use-case-extraction'
import type { DiscoveryTrack } from '@/lib/discovery-questions'

// ── Code-split heavy / dialog / secondary-view components ─────────────────
const UseCaseCard = lazy(() => import('@/components/UseCaseCard').then(m => ({ default: m.UseCaseCard })))
const UseCaseDialog = lazy(() => import('@/components/UseCaseDialog').then(m => ({ default: m.UseCaseDialog })))
const TableExportView = lazy(() => import('@/components/TableExportView').then(m => ({ default: m.TableExportView })))
const PrioritizationMatrix = lazy(() => import('@/components/PrioritizationMatrix').then(m => ({ default: m.PrioritizationMatrix })))
const TopRecommendations = lazy(() => import('@/components/TopRecommendations').then(m => ({ default: m.TopRecommendations })))
const MutualSuccessPlanDialog = lazy(() => import('@/components/MutualSuccessPlan').then(m => ({ default: m.MutualSuccessPlanDialog })))
const CustomerMetadataComponent = lazy(() => import('@/components/CustomerMetadata').then(m => ({ default: m.CustomerMetadata })))
const ExecutiveSummary = lazy(() => import('@/components/ExecutiveSummary').then(m => ({ default: m.ExecutiveSummary })))
const ExecutiveSummaryGeneratorDialog = lazy(() => import('@/components/ExecutiveSummaryGeneratorDialog').then(m => ({ default: m.ExecutiveSummaryGeneratorDialog })))
const DiscoveryLauncher = lazy(() => import('@/components/DiscoveryLauncher').then(m => ({ default: m.DiscoveryLauncher })))
const DiscoveryWizard = lazy(() => import('@/components/DiscoveryWizard').then(m => ({ default: m.DiscoveryWizard })))
const DiscoveryResults = lazy(() => import('@/components/DiscoveryResults').then(m => ({ default: m.DiscoveryResults })))
const DiscoveryNotesInput = lazy(() => import('@/components/DiscoveryNotesInput').then(m => ({ default: m.DiscoveryNotesInput })))
const SovereignCloudWorkflow = lazy(() => import('@/components/SovereignCloudWorkflow').then(m => ({ default: m.SovereignCloudWorkflow })))
const SolutionBlueprintWorkspace = lazy(() => import('@/components/SolutionBlueprintWorkspace').then(m => ({ default: m.SolutionBlueprintWorkspace })))
const EnhancedDiscoveryWorkflow = lazy(() => import('@/components/EnhancedDiscoveryWorkflow').then(m => ({ default: m.EnhancedDiscoveryWorkflow })))
const LiveDiscoveryMode = lazy(() => import('@/components/LiveDiscoveryMode').then(m => ({ default: m.LiveDiscoveryMode })))
const LiveDiscoverySetup = lazy(() => import('@/components/LiveDiscoverySetup').then(m => ({ default: m.LiveDiscoverySetup })))
const SessionManager = lazy(() => import('@/components/SessionManager').then(m => ({ default: m.SessionManager })))
const SessionComparison = lazy(() => import('@/components/SessionComparison').then(m => ({ default: m.SessionComparison })))
const SessionMetadataForm = lazy(() => import('@/components/SessionMetadataForm').then(m => ({ default: m.SessionMetadataForm })))
const PortfolioIntelligenceView = lazy(() => import('@/components/PortfolioIntelligenceView').then(m => ({ default: m.PortfolioIntelligenceView })))
const CustomerSelector = lazy(() => import('@/components/CustomerSelector').then(m => ({ default: m.CustomerSelector })))
const EnterpriseDiscoveryOrchestrator = lazy(() => import('@/components/enterprise-discovery/EnterpriseDiscoveryOrchestratorMVP').then(m => ({ default: m.EnterpriseDiscoveryOrchestratorMVP })))
const FinancialImpactTab = lazy(() => import('@/components/FinancialImpactTab').then(m => ({ default: m.FinancialImpactTab })))
const ImportUseCasesDialog = lazy(() => import('@/components/ImportUseCasesDialog').then(m => ({ default: m.ImportUseCasesDialog })))
const DUCEWizard = lazy(() => import('@/components/duce').then(m => ({ default: m.DUCEWizard })))
const PipelineBoard = lazy(() => import('@/components/PipelineBoard').then(m => ({ default: m.PipelineBoard })))
const UnitEconomicsEngine = lazy(() => import('@/components/UnitEconomicsEngine').then(m => ({ default: m.UnitEconomicsEngine })))
const ValuePortfolio = lazy(() => import('@/components/ValuePortfolio').then(m => ({ default: m.ValuePortfolio })))

/** Fallback spinner for lazy-loaded components */
function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )
}

type AppView = 'landing' | 'dashboard' | 'session-metadata' | 'discovery-wizard' | 'discovery-results' | 'session-comparison' | 'live-discovery' | 'sovereign-cloud' | 'solution-blueprint' | 'enterprise-discovery' | 'notes-input' | 'notes-workflow' | 'duce-wizard' | 'portfolio' | 'pipeline' | 'unit-economics' | 'value-portfolio'

type SourceFilter = 'all' | 'ai-generated' | 'manual' | 'fallback'

interface SessionState {
  sessionName: string
  industry: Industry
  responses: DiscoveryResponse[]
}

function App() {
  const { sessions: discoverySessions, addSession, updateSession } = useDiscovery()
  const { customers, findOrCreateCustomer } = useCustomers()
  const [useCases, setUseCases] = useLocalStorage<UseCase[]>('use-cases', [])
  const [selectedSessionId, setSelectedSessionId] = useLocalStorage<string | null>('selected-session-id', null)
  const [selectedCustomerId, setSelectedCustomerId] = useLocalStorage<string | null>('selected-customer-id', null)
  const [enterpriseSessions, setEnterpriseSessions] = useLocalStorage<AnyEnterpriseSession[]>('enterprise-sessions', [])
  const [currentEnterpriseSession, setCurrentEnterpriseSession] = useState<AnyEnterpriseSession | null>(null)

  // Per-customer Solution Blueprint state (read-only here \u2014 owned by SolutionBlueprintWorkspace).
  // We surface its signals (reuse %, gap count) on the prioritization matrix.
  const [blueprintEstatesByCustomer, setBlueprintEstatesByCustomer] = useLocalStorage<Record<string, import('@/lib/solution-blueprint/types').TechnologyEstate>>(
    'solution-blueprint-estates',
    {},
  )
  const [blueprintUseCasesByCustomer] = useLocalStorage<Record<string, Array<import('@/lib/solution-blueprint/types').UseCaseInput & { id: string; sourceUseCaseId?: string }>>>(
    'solution-blueprint-usecases',
    {},
  )

  // Phase 4 one-shot: mirror legacy blueprint-usecases drafts onto the canonical
  // `UseCase.solutionBlueprint` slot. Runs once per browser via a localStorage
  // sentinel; new draft mutations go through onLinkBlueprint and don't need this.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      if (window.localStorage.getItem('solution-blueprint-migrated-v1')) return
      const draftsByCustomer = blueprintUseCasesByCustomer || {}
      const linkedDrafts = Object.values(draftsByCustomer)
        .flat()
        .filter((d) => d.sourceUseCaseId && d.archetypeId)
      if (linkedDrafts.length === 0) {
        window.localStorage.setItem('solution-blueprint-migrated-v1', '1')
        return
      }
      const slotById = new Map(
        linkedDrafts.map((d) => [
          d.sourceUseCaseId!,
          {
            archetypeId: d.archetypeId,
            sovereigntyRequired: d.sovereigntyRequired,
            extraCapabilities: d.extraCapabilities ?? [],
            draftId: d.id,
            linkedAt: Date.now(),
          },
        ]),
      )
      setUseCases((current) =>
        (current || []).map((uc) =>
          slotById.has(uc.id) && !uc.solutionBlueprint
            ? { ...uc, solutionBlueprint: slotById.get(uc.id)! }
            : uc,
        ),
      )
      window.localStorage.setItem('solution-blueprint-migrated-v1', '1')
    } catch {
      // best-effort; if it fails the workspace will still relink on next save.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoIndustry, setDemoIndustry] = useState<DemoIndustry>('mining')
  
  const [currentView, setCurrentView] = useState<AppView>('landing')
  const [currentDiscoverySession, setCurrentDiscoverySession] = useState<DiscoverySession | null>(null)
  const [comparingSessions, setComparingSessions] = useState<DiscoverySession[]>([])
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [pendingSessionMetadata, setPendingSessionMetadata] = useState<SessionMetadata | null>(null)
  const [pendingDiscoveryTrack, setPendingDiscoveryTrack] = useState<DiscoveryTrack | null>(null)
  const [discoveryMode, setDiscoveryMode] = useState<'standard' | 'live' | 'sovereign-cloud'>('standard')
  const [notesSession, setNotesSession] = useState<{ metadata: SessionMetadata; notes: string; extractedUseCases: ExtractedUseCase[] } | null>(null)
  
  // Draft persistence for notes - prevents data loss when switching views
  const [draftDiscoveryNotes, setDraftDiscoveryNotes] = useLocalStorage<{
    notes: string
    customerName: string
    sessionName: string
    industry: Industry
    entityType?: EntityType
    location?: string
    stockTicker?: string
  } | null>('discovery-draft', null)
  
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>('impact-feasibility')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tableExportOpen, setTableExportOpen] = useState(false)
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false)
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null)
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | undefined>()
  const [showConfetti, setShowConfetti] = useState(false)
  const [showImpactFeasibilityDesc, setShowImpactFeasibilityDesc] = useState(false)
  const [showRiceDesc, setShowRiceDesc] = useState(false)
    const [showFinancialImpactDesc, setShowFinancialImpactDesc] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [postQuickDiscoveryGateOpen, setPostQuickDiscoveryGateOpen] = useState(false)
  const [execSummaryGeneratorOpen, setExecSummaryGeneratorOpen] = useState(false)
  const selectedSession = discoverySessions?.find((s) => s.id === selectedSessionId) || null
  const filteredUseCases = useCases?.filter((uc) => uc.discoverySessionId === selectedSessionId) || []
  
  const useCasesList = filteredUseCases
  const topUseCases = getTopUseCases(useCasesList, scoringMethod, 5)
  const topUseCaseIds = new Set(topUseCases.map((uc) => uc.id))

  // Compute Solution Blueprint signals (reuse %, gaps) for use cases that
  // have an associated blueprint draft. Lazy-loads the recommender to keep
  // the initial bundle small. Re-computes only when inputs change.
  // Phase 4: signals derive from the canonical `UseCase.solutionBlueprint` slot
  // (legacy `solution-blueprint-usecases` is read only for back-compat fallback).
  const [blueprintSignals, setBlueprintSignals] = useState<Map<string, import('@/components/PrioritizationMatrix').BlueprintSignal>>(new Map())
  useEffect(() => {
    if (!selectedCustomerId) { setBlueprintSignals(new Map()); return }
    const estate = blueprintEstatesByCustomer[selectedCustomerId]
    const linked = (useCases ?? [])
      .filter((uc) => uc.solutionBlueprint?.archetypeId)
      .map((uc) => ({
        id: uc.solutionBlueprint!.draftId ?? uc.id,
        sourceUseCaseId: uc.id,
        name: uc.title,
        description: uc.description,
        archetypeId: uc.solutionBlueprint!.archetypeId,
        extraCapabilities: uc.solutionBlueprint!.extraCapabilities ?? [],
        sovereigntyRequired: uc.solutionBlueprint!.sovereigntyRequired,
      }))
    if (!estate || linked.length === 0) { setBlueprintSignals(new Map()); return }

    let cancelled = false
    import('@/lib/solution-blueprint/recommender').then(({ generateBlueprints }) => {
      if (cancelled) return
      const next = new Map<string, import('@/components/PrioritizationMatrix').BlueprintSignal>()
      for (const draft of linked) {
        try {
          const result = generateBlueprints(draft, estate)
          next.set(draft.sourceUseCaseId, {
            reuseRatio: result.estateOptimized.reuseRatio,
            gapCount: result.estateOptimized.gapCount,
          })
        } catch {
          // Skip drafts that fail to generate (e.g., missing capabilities).
        }
      }
      setBlueprintSignals(next)
    })
    return () => { cancelled = true }
  }, [selectedCustomerId, blueprintEstatesByCustomer, useCases])

  // Deterministic Markdown annex appended to executive summary exports.
  const execSummaryBlueprintAnnex = useMemo(() => {
    if (!selectedCustomerId) return ''
    const estate = blueprintEstatesByCustomer[selectedCustomerId]
    const drafts = filteredUseCases
      .filter((uc) => uc.solutionBlueprint?.archetypeId)
      .map((uc) => ({
        id: uc.solutionBlueprint!.draftId ?? uc.id,
        sourceUseCaseId: uc.id,
        name: uc.title,
        description: uc.description,
        archetypeId: uc.solutionBlueprint!.archetypeId,
        extraCapabilities: uc.solutionBlueprint!.extraCapabilities ?? [],
        sovereigntyRequired: uc.solutionBlueprint!.sovereigntyRequired,
      }))
    if (!estate || drafts.length === 0 || filteredUseCases.length === 0) return ''
    try {
      return buildSolutionPathsAnnex(filteredUseCases, drafts, estate)
    } catch {
      return ''
    }
  }, [selectedCustomerId, blueprintEstatesByCustomer, filteredUseCases])

  
  const customerMetadata: CustomerMetadata | null = selectedSession ? {
    customerName: selectedSession.customerName,
    innovationHubSPOC: selectedSession.innovationHubSPOC,
    primaryStakeholder: selectedSession.primaryStakeholder,
    accountTeamRep: selectedSession.accountTeamRep,
    innovationHubLocation: selectedSession.innovationHubLocation,
    solutionEngineer: selectedSession.solutionEngineer,
    executiveSummary: selectedSession.executiveSummary,
  } : null

  const shouldOfferExecutiveSummaryGeneration =
    !!selectedSession &&
    selectedSession.creationSource === 'skip-to-use-cases' &&
    !(customerMetadata?.executiveSummary || '').trim()

  useEffect(() => {
    if (useCasesList.length === 1 && !showConfetti) {
      setShowConfetti(true)
      toast.success('Great start! Add more use cases to compare and prioritize.', {
        duration: 3000,
      })
    }
  }, [useCasesList.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      // Ctrl/Cmd + N: New session
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleBackToLanding()
      }
      // Ctrl/Cmd + S: Save (prevent default browser save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        toast.info('Sessions auto-save to browser storage')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAddUseCase = (data: Partial<UseCase>) => {
    if (!selectedSessionId) {
      toast.error('Please select a discovery session first')
      return
    }
    const defaultRice = {
      reach: 100,
      users: 100,
      period: 'quarter' as const,
      impact: 1,
      confidence: 50,
      effort: 1,
    }
    const newUseCase: UseCase = {
      id: `uc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      discoverySessionId: selectedSessionId,
      title: data.title || '',
      description: data.description || '',
      impact: data.impact ?? 5,
      feasibility: data.feasibility ?? 5,
      rice: data.rice ?? defaultRice,
      kpis: data.kpis || [],
      customerAccountable: data.customerAccountable,
      microsoftAccountable: data.microsoftAccountable,
      aiRegulations: data.aiRegulations,
      cybersecurity: data.cybersecurity,
      dataSources: data.dataSources,
      aiEffortEstimate: data.aiEffortEstimate,
      costOfInaction: data.costOfInaction,
      expectedValue: data.expectedValue,
      strategicAlignment: data.strategicAlignment,
      businessProcesses: data.businessProcesses,
      microsoftSolutions: data.microsoftSolutions,
      referenceArchitecture: data.referenceArchitecture,
      earningsContext: data.earningsContext,
      industryContext: data.industryContext,
      createdAt: Date.now(),
    }
    setUseCases((current) => [...(current || []), newUseCase])
    toast.success('Use case added successfully!')
  }

  const handleUpdateUseCase = (updatedUseCase: UseCase) => {
    setUseCases((current) =>
      (current || []).map((uc) => (uc.id === updatedUseCase.id ? updatedUseCase : uc))
    )
  }

  const handleEditUseCase = (useCase: UseCase) => {
    setEditingUseCase(useCase)
    setDialogOpen(true)
  }

  const handleSaveEdit = (data: Partial<UseCase>) => {
    if (editingUseCase) {
      const updated: UseCase = {
        ...editingUseCase,
        ...data,
        title: data.title || editingUseCase.title,
        description: data.description || editingUseCase.description,
        kpis: data.kpis || editingUseCase.kpis || [],
      }
      handleUpdateUseCase(updated)
      toast.success('Use case updated!')
    } else {
      handleAddUseCase(data)
    }
    setEditingUseCase(null)
  }

  const handleImportUseCases = (importedUseCases: Partial<UseCase>[]) => {
    if (!selectedSessionId) {
      toast.error('Please select a discovery session first')
      return
    }
    const newUseCases: UseCase[] = importedUseCases.map(data => ({
      id: `uc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      discoverySessionId: selectedSessionId,
      title: data.title || '',
      description: data.description || '',
      impact: 5,
      feasibility: 5,
      rice: {
        reach: 100,
        users: 100,
        period: 'quarter',
        impact: 1,
        confidence: 50,
        effort: 1,
      },
      kpis: data.kpis || [],
      customerAccountable: data.customerAccountable,
      microsoftAccountable: data.microsoftAccountable,
      dataSources: data.dataSources || ['manual'],
      aiRegulations: data.aiRegulations,
      cybersecurity: data.cybersecurity,
      aiEffortEstimate: data.aiEffortEstimate,
      costOfInaction: data.costOfInaction,
      expectedValue: data.expectedValue,
      strategicAlignment: data.strategicAlignment,
      businessProcesses: data.businessProcesses,
      microsoftSolutions: data.microsoftSolutions,
      referenceArchitecture: data.referenceArchitecture,
      earningsContext: data.earningsContext,
      industryContext: data.industryContext,
      createdAt: Date.now(),
    }))
    setUseCases((current) => [...(current || []), ...newUseCases])
    toast.success(`Imported ${newUseCases.length} use case${newUseCases.length !== 1 ? 's' : ''} successfully!`)
  }

  const handleUpsertUseCasesForSession = (sessionId: string, nextForSession: UseCase[]) => {
    setUseCases((current) => {
      const existing = current || []
      const others = existing.filter((uc) => uc.discoverySessionId !== sessionId)
      return [...others, ...nextForSession]
    })
  }

  const handleDeleteUseCase = (id: string) => {
    setUseCases((current) => (current || []).filter((uc) => uc.id !== id))
    toast.success('Use case deleted')
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingUseCase(null)
    }
  }

  const handleOpenAddDialog = () => {
    setEditingUseCase(null)
    setDialogOpen(true)
  }

  const handleOpenTableExport = () => {
    setTableExportOpen(true)
  }

  /** Re-assess all use cases in the current session against regulatory frameworks */
  const handleReassessCompliance = () => {
    if (!selectedSession || useCasesList.length === 0) return
    const jurisdictions = detectJurisdictions(selectedSession.innovationHubLocation || '')
    if (jurisdictions.length === 0) {
      toast.warning('No jurisdiction detected from session location — cannot assess')
      return
    }
    const enforcement = (selectedSession as any).complianceEnforcement || 'advisory'
    const assessed = assessPortfolio(useCasesList, jurisdictions, selectedSession.industry, enforcement)
    
    // Update all assessed use cases
    setUseCases((current) =>
      (current || []).map((uc) => {
        const updated = assessed.find((a) => a.id === uc.id)
        return updated || uc
      })
    )
    toast.success(`Re-assessed ${assessed.length} use cases against ${jurisdictions.join(', ')} frameworks`)
  }

  const resetPendingDiscoveryDraft = () => {
    setSessionState(null)
    setPendingSessionMetadata(null)
    setPendingDiscoveryTrack(null)
  }

  const handleStartDiscovery = () => {
    resetPendingDiscoveryDraft()
    setDiscoveryMode('standard')
    setPendingDiscoveryTrack('use-case')
    setCurrentView('session-metadata')
  }

  const handleStartSovereignCloud = () => {
    if (selectedSessionId && selectedSession) {
      setCurrentView('sovereign-cloud')
      return
    }

    resetPendingDiscoveryDraft()
    setDiscoveryMode('sovereign-cloud')
    setCurrentView('session-metadata')
  }

  const [pendingBlueprintSeed, setPendingBlueprintSeed] = useState<{
    name: string
    description?: string
    archetypeId?: string
    sovereigntyRequired?: boolean
    sourceUseCaseId?: string
  } | null>(null)

  const handleStartSolutionBlueprint = (opts?: { fromUseCase?: UseCase }) => {
    if (opts?.fromUseCase) {
      const uc = opts.fromUseCase
      // Lazy-load to keep landing bundle small.
      import('@/lib/solution-blueprint/archetype-inference').then(m => {
        const inferred = m.inferArchetype(uc)
        setPendingBlueprintSeed({
          name: uc.title,
          description: uc.description,
          archetypeId: inferred?.archetype.id,
          sourceUseCaseId: uc.id,
        })
        setCurrentView('solution-blueprint')
        if (inferred) {
          toast.success(inferred.rationale, { duration: 5000 })
        } else {
          toast.message('Pre-filled blueprint — pick an archetype to continue.', { duration: 4000 })
        }
      })
      return
    }
    setPendingBlueprintSeed(null)
    setCurrentView('solution-blueprint')
  }

  const handleStartLiveDiscovery = () => {
    resetPendingDiscoveryDraft()
    setDiscoveryMode('live')
    setPendingDiscoveryTrack('use-case')
    setCurrentView('session-metadata')
  }

  const handleStartNotesAnalysis = () => {
    resetPendingDiscoveryDraft()
    setNotesSession(null)
    setCurrentView('notes-input')
  }

  const handleStartEnterpriseDiscovery = () => {
    setCurrentEnterpriseSession(null)
    setCurrentView('enterprise-discovery')
  }

  const handleStartDUCE = () => {
    // Reuse selected session if present; otherwise create a lightweight one so DUCE has a sessionId.
    if (!selectedSessionId) {
      const session: DiscoverySession = {
        id: `duce-${Date.now()}`,
        customerId: '',
        customerName: 'New DUCE Engagement',
        name: 'DUCE Session',
        industry: 'general',
        responses: [],
        suggestedUseCases: [],
        createdAt: Date.now(),
        completedAt: Date.now(),
      }
      addSession(session)
      setSelectedSessionId(session.id)
    }
    setCurrentView('duce-wizard')
  }

  const handleResumeEnterpriseDiscovery = (session: AnyEnterpriseSession) => {
    setCurrentEnterpriseSession(session)
    setCurrentView('enterprise-discovery')
  }

  // Demo mode handlers - load pre-populated demo data for selected industry
  const handleStartDemo = (demoType: 'mining' | 'retail' | 'financial') => {
    // Select the appropriate demo data based on type
    const demoDataMap = {
      mining: { session: DEMO_DISCOVERY_SESSION, useCases: DEMO_USE_CASES, name: 'Zava Mining', desc: 'AI-powered mining innovations with regulatory compliance' },
      retail: { session: DEMO_RETAIL_SESSION, useCases: DEMO_RETAIL_USE_CASES, name: 'MegaMart Retail', desc: 'Retail AI for inventory, shrinkage, and customer experience' },
      financial: { session: DEMO_FINANCIAL_SESSION, useCases: DEMO_FINANCIAL_USE_CASES, name: 'Contoso Financial', desc: 'Financial services AI for fraud, onboarding, and credit' },
    }
    const demoData = demoDataMap[demoType]

    // Create a fresh demo session with unique IDs
    const demoSession: DiscoverySession = {
      ...demoData.session,
      id: `demo-session-${Date.now()}`,
      customerId: `demo-customer-${Date.now()}`,
      createdAt: Date.now(),
      completedAt: Date.now(),
      isDemo: true,
    }
    
    // Create customer and add session
    const customer = findOrCreateCustomer(demoSession.customerName, demoSession.innovationHubSPOC || '', demoSession.stockTicker)
    demoSession.customerId = customer.id
    addSession(demoSession)
    
    // Add demo use cases with updated session ID
    const demoUseCasesWithIds = demoData.useCases.map(uc => ({
      ...uc,
      id: `demo-uc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      discoverySessionId: demoSession.id,
      createdAt: Date.now(),
    }))
    setUseCases(current => [...(current || []), ...demoUseCasesWithIds])
    
    // Select the demo session
    setSelectedCustomerId(customer.id)
    setSelectedSessionId(demoSession.id)
    
    toast.success(`Demo loaded! Exploring ${demoData.name} use cases...`, {
      description: demoData.desc,
    })
  }

  const handleStartEnterpriseDemo = (demoType: 'mining' | 'retail' | 'financial') => {
    // Select the appropriate enterprise demo data based on type
    const demoDataMap = {
      mining: { session: DEMO_ENTERPRISE_SESSION, name: 'Zava Mining', desc: 'Predictive maintenance opportunity' },
      retail: { session: DEMO_RETAIL_ENTERPRISE_SESSION, name: 'MegaMart Retail', desc: 'Inventory optimization opportunity' },
      financial: { session: DEMO_FINANCIAL_ENTERPRISE_SESSION, name: 'Contoso Financial', desc: 'Fraud detection and onboarding opportunity' },
    }
    const demoData = demoDataMap[demoType]

    // Load pre-populated enterprise discovery session
    const demoEnterpriseSession: EnterpriseDiscoverySession = {
      ...demoData.session,
      id: `demo-enterprise-${Date.now()}`,
      createdAt: Date.now(),
      sessionDate: Date.now(),
      isDemo: true,
    }
    
    setCurrentEnterpriseSession(demoEnterpriseSession)
    setCurrentView('enterprise-discovery')
    
    toast.success(`Enterprise Demo loaded!`, {
      description: `Exploring ${demoData.name} ${demoData.desc}.`,
    })
  }

  const handleEnterpriseSessionPause = (session: AnyEnterpriseSession) => {
    handleEnterpriseSessionSave(session)
    toast.info('Discovery session paused', {
      description: 'You can resume from the Strategic Assessment tab.',
    })
    setCurrentView('dashboard')
    setCurrentEnterpriseSession(null)
  }

  const handleEnterpriseSessionSave = (session: AnyEnterpriseSession) => {
    const updated = enterpriseSessions || []
    const index = updated.findIndex(s => s.id === session.id)
    if (index >= 0) {
      updated[index] = session
    } else {
      updated.push(session)
    }
    setEnterpriseSessions(updated)
  }

  const handleEnterpriseSessionComplete = (session: AnyEnterpriseSession) => {
    handleEnterpriseSessionSave(session)
    toast.success('Strategic Assessment completed successfully!')
    setCurrentView('dashboard')
    setCurrentEnterpriseSession(null)
  }

  const handleEnterpriseDiscoveryCancel = () => {
    setCurrentView('dashboard')
    setCurrentEnterpriseSession(null)
  }

  const handleBackToLanding = () => {
    setCurrentView('landing')
    setCurrentDiscoverySession(null)
    resetPendingDiscoveryDraft()
    setCurrentEnterpriseSession(null)
    // Exit demo mode when going back to landing
    if (isDemoMode) {
      setIsDemoMode(false)
    }
  }

  // Demo mode handlers
  const handleEnterDemoMode = (industry: DemoIndustry) => {
    setIsDemoMode(true)
    setDemoIndustry(industry)
    toast.success(`Demo Mode activated for ${industry === 'mining' ? 'Zava Mining' : industry === 'retail' ? 'MegaMart Retail' : 'Contoso Financial'}`, {
      description: 'Forms will be pre-filled with sample data. You can edit any values.',
    })
  }

  const handleExitDemoMode = () => {
    setIsDemoMode(false)
    setCurrentView('landing')
    setCurrentDiscoverySession(null)
    resetPendingDiscoveryDraft()
    setCurrentEnterpriseSession(null)
    toast.info('Exited demo mode', {
      description: 'You can start a fresh session or continue with existing data.',
    })
  }
  
  const handleSessionMetadataSubmit = (metadata: SessionMetadata) => {
    if (discoveryMode === 'sovereign-cloud') {
      const session: DiscoverySession = {
        id: `ai-${Date.now()}`,
        customerId: '',
        customerName: metadata.customerName,
        innovationHubSPOC: metadata.innovationHubSPOC,
        primaryStakeholder: metadata.primaryStakeholder,
        accountTeamRep: metadata.accountTeamRep,
        innovationHubLocation: metadata.innovationHubLocation,
        solutionEngineer: metadata.solutionEngineer,
        stockTicker: metadata.stockTicker,
        accountSegment: metadata.accountSegment,
        name: `Sovereign Cloud - ${metadata.customerName}`,
        industry: 'general',
        responses: [],
        suggestedUseCases: [],
        createdAt: Date.now(),
        completedAt: Date.now(),
      }

      const customer = findOrCreateCustomer(session.customerName, session.innovationHubSPOC || '', session.stockTicker)
      session.customerId = customer.id
      addSession(session)
      setSelectedCustomerId(customer.id)
      setSelectedSessionId(session.id)
      setDiscoveryMode('standard')
      setCurrentView('sovereign-cloud')
      return
    }

    setPendingSessionMetadata(metadata)
    if (discoveryMode === 'live') {
      setCurrentView('live-discovery')
    } else {
      setCurrentView('discovery-wizard')
    }
  }

  const handleSwitchToLive = (sessionName: string, industry: Industry, responses: DiscoveryResponse[]) => {
    setSessionState({ sessionName, industry, responses })
    setCurrentView('live-discovery')
  }

  const handleSwitchToStandard = (sessionName: string, industry: Industry, responses: DiscoveryResponse[]) => {
    setSessionState({ sessionName, industry, responses })
    setCurrentView('discovery-wizard')
  }

  const handleDiscoveryComplete = (session: DiscoverySession) => {
    const customer = findOrCreateCustomer(session.customerName, session.innovationHubSPOC || '', session.stockTicker)
    const sessionWithCustomer: DiscoverySession = {
      ...session,
      customerId: customer.id,
    }
    addSession(sessionWithCustomer)
    setCurrentDiscoverySession(sessionWithCustomer)
    setPendingSessionMetadata(null)
    setPendingDiscoveryTrack(null)
    setCurrentView('discovery-results')
  }

  const handleDiscoveryCancel = () => {
    setCurrentView('dashboard')
    setCurrentDiscoverySession(null)
    resetPendingDiscoveryDraft()
  }

  const handleNotesAnalyze = (notes: string, metadata: SessionMetadata, extractedUseCases: ExtractedUseCase[], sessionName: string, industry: Industry, entityType?: EntityType, businessFunctions?: BusinessFunction[]) => {
    // Create discovery session from notes
    const session: DiscoverySession = {
      id: `notes-${Date.now()}`,
      customerId: '', // Will be filled after customer creation
      customerName: metadata.customerName,
      innovationHubSPOC: metadata.innovationHubSPOC,
      primaryStakeholder: metadata.primaryStakeholder,
      accountTeamRep: metadata.accountTeamRep,
      innovationHubLocation: metadata.innovationHubLocation,
      solutionEngineer: metadata.solutionEngineer,
      stockTicker: metadata.stockTicker,
      accountSegment: metadata.accountSegment,
      name: sessionName,
      industry: industry,
      businessFunctions: businessFunctions,
      entityType: entityType,
      responses: [
        {
          questionId: 'notes-input',
          answer: notes,
        }
      ],
      createdAt: Date.now(),
      completedAt: Date.now(),
    }

    // Create customer and link to session
    const customer = findOrCreateCustomer(session.customerName, session.innovationHubSPOC || '', session.stockTicker)
    session.customerId = customer.id
    
    // Add session
    addSession(session)
    
    // Store notes session data for workflow
    setNotesSession({ metadata, notes, extractedUseCases })
    setCurrentDiscoverySession(session)
    setCurrentView('notes-workflow')
  }

  const handleNotesCancel = () => {
    setCurrentView('landing')
    setNotesSession(null)
  }

  // Handle template selection from industry templates
  const handleSelectTemplate = (template: SessionTemplate) => {
    setDraftDiscoveryNotes({
      notes: template.discoveryPrompts.join('\n\n'),
      customerName: '',
      sessionName: `${template.name} Discovery`,
      industry: template.industry,
      entityType: template.entityType
    })
    setCurrentView('notes-input')
  }

  const handleCreateUseCasesFromDiscovery = (newUseCases: Partial<UseCase>[], executiveSummary: string) => {
    if (!currentDiscoverySession) return
    
    const createdUseCases: UseCase[] = newUseCases.map((data) => ({
      id: `uc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      discoverySessionId: currentDiscoverySession.id,
      title: data.title || '',
      description: data.description || '',
      impact: data.impact || 5,
      feasibility: data.feasibility || 5,
      rice: data.rice || {
        reach: 100,
        users: 100,
        period: 'quarter',
        impact: 1,
        confidence: 50,
        effort: 1,
      },
      kpis: data.kpis?.length ? data.kpis : (currentDiscoverySession.targetKpis ?? []),
      businessFunction: data.businessFunction ?? currentDiscoverySession.businessFunctions?.[0],
      dataSources: data.dataSources,
      aiEffortEstimate: data.aiEffortEstimate,
      costOfInaction: data.costOfInaction,
      expectedValue: data.expectedValue,
      strategicAlignment: data.strategicAlignment,
      businessProcesses: data.businessProcesses,
      microsoftSolutions: data.microsoftSolutions,
      referenceArchitecture: data.referenceArchitecture,
      agenticOpportunities: data.agenticOpportunities,
      implementationComplexity: data.implementationComplexity,
      aiRegulations: data.aiRegulations,
      cybersecurity: data.cybersecurity,
      createdAt: Date.now(),
    }))

    setUseCases((current) => [...(current || []), ...createdUseCases])
    
    updateSession(currentDiscoverySession.id, {
      executiveSummary,
      completedAt: Date.now()
    })
    
    setSelectedCustomerId(currentDiscoverySession.customerId)
    setSelectedSessionId(currentDiscoverySession.id)
    setCurrentView('dashboard')
    setCurrentDiscoverySession(null)
    setSessionState(null)
    toast.success(`Session saved! Added ${createdUseCases.length} use case${createdUseCases.length !== 1 ? 's' : ''} successfully!`)

    // Explicit end-of-mode decision gate (Quick Discovery -> Proceed or Conclude)
    // User is already on the Portfolio/Matrix dashboard; this prompts whether to proceed to Sovereign Cloud Assessment.
    setPostQuickDiscoveryGateOpen(true)
  }

  const handleViewSession = (session: DiscoverySession) => {
    setCurrentDiscoverySession(session)
    setCurrentView('discovery-results')
  }

  const handleCompareSessions = (sessions: DiscoverySession[]) => {
    setComparingSessions(sessions)
    setCurrentView('session-comparison')
  }

  return (
    <>
      <Toaster position="top-right" />
      
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <DemoModeBanner 
          demoIndustry={demoIndustry} 
          onExitDemo={handleExitDemoMode} 
        />
      )}
      
      {/* Main content wrapper with padding when demo mode is active */}
      <SectionErrorBoundary section="Application">
      <Suspense fallback={<LazyFallback />}>
      <div className={isDemoMode ? 'pt-12' : ''}>
      
      {currentView === 'landing' && (
        <LandingPage
          customers={customers}
          onStartNew={() => {
            handleStartDiscovery()
          }}
          onStartSovereignCloud={handleStartSovereignCloud}
          onStartSolutionBlueprint={handleStartSolutionBlueprint}
          onStartEnterpriseDiscovery={handleStartEnterpriseDiscovery}
          onStartDUCE={handleStartDUCE}
          onStartNotesAnalysis={handleStartNotesAnalysis}
          onViewExisting={() => setCurrentView('dashboard')}
          onOpenPortfolio={() => setCurrentView('portfolio')}
          onOpenValuePortfolio={() => setCurrentView('value-portfolio')}
          onSelectTemplate={handleSelectTemplate}
          isDemoMode={isDemoMode}
          demoIndustry={demoIndustry}
          onEnterDemoMode={handleEnterDemoMode}
        />
      )}

      {currentView === 'portfolio' && (
        <>
          <NavigationHeader
            onBackToLanding={handleBackToLanding}
            onBack={handleBackToLanding}
            backLabel="Back"
            title="Portfolio Intelligence"
            subtitle="Pipeline plan across companies and public sector"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-[1400px]">
            <SectionErrorBoundary>
              <PortfolioIntelligenceView />
            </SectionErrorBoundary>
          </div>
        </>
      )}

      {currentView === 'value-portfolio' && (
        <>
          <NavigationHeader
            onBackToLanding={handleBackToLanding}
            onBack={() => setCurrentView('dashboard')}
            backLabel="Back to dashboard"
            title="Value Portfolio"
            subtitle="Price the use-case book as an investment portfolio"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-[1400px]">
            <SectionErrorBoundary>
              <ValuePortfolio
                useCases={filteredUseCases.length ? filteredUseCases : (useCases ?? [])}
                customerName={selectedSession?.customerName}
              />
            </SectionErrorBoundary>
          </div>
        </>
      )}

      {currentView === 'pipeline' && (
        <>
          <NavigationHeader
            onBackToLanding={handleBackToLanding}
            onBack={() => setCurrentView('dashboard')}
            backLabel="Back to dashboard"
            title="Use-case pipeline"
            subtitle="Validate use cases and progress opportunities through MCEM"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-[1400px]">
            <SectionErrorBoundary>
              <Suspense fallback={<LazyFallback />}>
                {selectedCustomerId ? (
                  <PipelineBoard
                    useCases={filteredUseCases}
                    customerId={selectedCustomerId}
                    discoverySessionId={selectedSessionId ?? undefined}
                    onUpdateUseCase={handleUpdateUseCase}
                    actorName={selectedSession?.accountTeamRep}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Select a customer to view its pipeline.</p>
                )}
              </Suspense>
            </SectionErrorBoundary>
          </div>
        </>
      )}

      {currentView === 'unit-economics' && (
        <Suspense fallback={<LazyFallback />}>
          <UnitEconomicsEngine
            customerName={selectedSession?.customerName}
            annualRevenueUSD={selectedSession?.manualFinancials?.annualRevenue}
            itBudgetUSD={selectedSession?.manualFinancials?.itBudget}
            onBack={() => setCurrentView('dashboard')}
            onBackToLanding={handleBackToLanding}
          />
        </Suspense>
      )}

      {currentView === 'duce-wizard' && selectedSessionId && (
        <Suspense fallback={<LazyFallback />}>
          <SectionErrorBoundary>
            <DUCEWizard
              sessionId={selectedSessionId}
              customerName={discoverySessions?.find(s => s.id === selectedSessionId)?.customerName}
              industry={discoverySessions?.find(s => s.id === selectedSessionId)?.industry}
              primaryStakeholder={discoverySessions?.find(s => s.id === selectedSessionId)?.primaryStakeholder}
              useCases={(useCases || []).filter(u => u.discoverySessionId === selectedSessionId)}
              onUseCasesChange={(next) => {
                setUseCases((current) => {
                  const others = (current || []).filter(u => u.discoverySessionId !== selectedSessionId)
                  return [...others, ...next.map(u => ({ ...u, discoverySessionId: selectedSessionId }))]
                })
              }}
              onExit={handleBackToLanding}
            />
          </SectionErrorBoundary>
        </Suspense>
      )}

      {currentView === 'enterprise-discovery' && (
        <>
          <NavigationHeader 
            onBackToLanding={handleBackToLanding}
            onBack={handleEnterpriseDiscoveryCancel}
            backLabel="Exit Assessment"
            title="Strategic Assessment"
            subtitle="Comprehensive opportunity assessment"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
            <EnterpriseDiscoveryOrchestrator
            initialSession={currentEnterpriseSession || undefined}
            initialCustomerName={selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : undefined}
            onSave={handleEnterpriseSessionSave}
            onComplete={handleEnterpriseSessionComplete}
            onCancel={handleEnterpriseDiscoveryCancel}
            onPause={handleEnterpriseSessionPause}
            />
          </div>
        </>
      )}

      {currentView === 'sovereign-cloud' && (
        <>
          <NavigationHeader
            onBackToLanding={handleBackToLanding}
            onBack={() => setCurrentView('dashboard')}
            backLabel="Back"
            title="Sovereign Cloud Assessment"
            subtitle="Deployment model, sovereign/hybrid strategy, and AI readiness"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
            {!selectedSession ? (
              <Card className="border-2 bg-card">
                <CardHeader>
                  <CardTitle>No active session selected</CardTitle>
                  <CardDescription>
                    Create or select a discovery session before running a Sovereign Cloud Assessment.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => setCurrentView('dashboard')}>Back to Dashboard</Button>
                </CardFooter>
              </Card>
            ) : (
              <SovereignCloudWorkflow
                session={selectedSession}
                useCases={filteredUseCases}
                onUpdateSession={updateSession}
                onUpsertUseCases={(next) => handleUpsertUseCasesForSession(selectedSession.id, next)}
                onProceedToPortfolio={() => setCurrentView('dashboard')}
                onProceedToEnterprise={() => {
                  setCurrentEnterpriseSession(null)
                  setCurrentView('enterprise-discovery')
                }}
                onConclude={() => setCurrentView('dashboard')}
                isDemoMode={isDemoMode}
                demoIndustry={demoIndustry}
                initialEstate={selectedSession.customerId ? blueprintEstatesByCustomer[selectedSession.customerId] ?? null : null}
                onEstatePatch={async (patch) => {
                  const cid = selectedSession.customerId
                  if (!cid) return
                  const { EMPTY_ESTATE } = await import('@/lib/solution-blueprint/types')
                  setBlueprintEstatesByCustomer((prev) => {
                    const existing = prev[cid]
                    const customerName = customers.find(c => c.id === cid)?.name ?? selectedSession.customerName ?? 'Unknown'
                    const base: import('@/lib/solution-blueprint/types').TechnologyEstate = existing ?? {
                      ...EMPTY_ESTATE,
                      id: `estate-${cid}`,
                      customerId: cid,
                      customerName,
                      updatedAt: Date.now(),
                    }
                    return {
                      ...prev,
                      [cid]: { ...base, ...patch, updatedAt: Date.now() },
                    }
                  })
                }}
              />
            )}
          </div>
        </>
      )}

      {currentView === 'solution-blueprint' && (
        <>
          <NavigationHeader
            onBackToLanding={handleBackToLanding}
            onBack={handleBackToLanding}
            backLabel="Back"
            title="Solution Blueprint"
            subtitle="Use-case led envisioning \u2014 best-fit vs estate-optimized"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
            <SolutionBlueprintWorkspace
              customers={customers}
              initialCustomerId={selectedCustomerId}
              initialUseCase={pendingBlueprintSeed}
              onLinkBlueprint={(sourceUseCaseId, slot) => {
                setUseCases((current) =>
                  (current || []).map((uc) =>
                    uc.id === sourceUseCaseId
                      ? { ...uc, solutionBlueprint: slot }
                      : uc,
                  ),
                )
              }}
            />
          </div>
        </>
      )}

      {currentView === 'session-comparison' && (
        <SessionComparison 
          sessions={comparingSessions} 
          onBack={() => {
            setCurrentView('dashboard')
            setComparingSessions([])
          }} 
        />
      )}

      {currentView === 'session-metadata' && (
        <SessionMetadataForm
          onSubmit={handleSessionMetadataSubmit}
          onCancel={handleDiscoveryCancel}
          onBackToLanding={handleBackToLanding}
          initialMetadata={selectedCustomerId ? { customerName: customers.find(c => c.id === selectedCustomerId)?.name || '' } : undefined}
          isDemoMode={isDemoMode}
          demoIndustry={demoIndustry}
        />
      )}

      {currentView === 'notes-input' && (
        <DiscoveryNotesInput
          onAnalyze={handleNotesAnalyze}
          onCancel={handleNotesCancel}
          onBackToLanding={handleBackToLanding}
          isDemoMode={isDemoMode}
          demoIndustry={demoIndustry}
          initialDraft={draftDiscoveryNotes}
          onDraftChange={setDraftDiscoveryNotes}
          onDraftClear={() => setDraftDiscoveryNotes(null)}
        />
      )}

      {currentView === 'notes-workflow' && currentDiscoverySession && notesSession && (
        <EnhancedDiscoveryWorkflow
          session={currentDiscoverySession}
          initialUseCases={notesSession.extractedUseCases.map(uc => ({
            title: uc.title,
            description: uc.description,
            rationale: uc.rationale,
            businessFunction: uc.businessFunction,
            sourceTexts: uc.sourceTexts,
            dataSources: ['ai-generated', 'discovery'],
            strategicAlignment: uc.strategicAlignment,
            businessProcesses: uc.businessProcess ? [{
              processId: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              processName: uc.businessProcess.processName,
              affectedSteps: [],
              currentPainPoints: uc.businessProcess.currentPainPoints,
              proposedImprovement: uc.businessProcess.expectedImprovement,
            }] : undefined,
            microsoftSolutions: uc.microsoftSolutions,
            referenceArchitecture: uc.referenceArchitecture,
            agenticOpportunities: uc.agenticOpportunity?.hasOpportunity ? [{
              title: uc.agenticOpportunity.title || '',
              agentType: uc.agenticOpportunity.agentType || 'task-agent',
              capabilities: uc.agenticOpportunity.capabilities || [],
              humanOversight: uc.agenticOpportunity.humanOversight || 'review',
              automationLevel: uc.agenticOpportunity.automationLevel || 'assisted',
              tools: [],
            }] : undefined,
            implementationComplexity: uc.implementationComplexity,
            aiRegulations: uc.aiRegulations,
            cybersecurity: uc.cybersecurity,
          }))}
          onComplete={(useCases, executiveSummary) => {
            // Save use cases
            const newUseCases: UseCase[] = useCases.map(uc => ({
              id: `uc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              discoverySessionId: currentDiscoverySession.id,
              title: uc.title || '',
              description: uc.description || '',
              impact: uc.impact || 5,
              feasibility: uc.feasibility || 5,
              rice: uc.rice || {
                reach: 100,
                users: 100,
                period: 'quarter',
                impact: 1,
                confidence: 50,
                effort: 1,
              },
              kpis: uc.kpis || [],
              dataSources: ['ai-generated', 'discovery'],
              strategicAlignment: uc.strategicAlignment,
              businessProcesses: uc.businessProcesses,
              microsoftSolutions: uc.microsoftSolutions,
              referenceArchitecture: uc.referenceArchitecture,
              agenticOpportunities: uc.agenticOpportunities,
              implementationComplexity: uc.implementationComplexity,
              aiRegulations: uc.aiRegulations,
              cybersecurity: uc.cybersecurity,
              costOfInaction: uc.costOfInaction,
              expectedValue: uc.expectedValue,
              aiEffortEstimate: uc.aiEffortEstimate,
              createdAt: Date.now(),
            }))
            setUseCases(current => [...(current || []), ...newUseCases])
            
            // Update session with summary
            updateSession(currentDiscoverySession.id, {
              executiveSummary,
            })
            
            // Select this session and customer
            setSelectedSessionId(currentDiscoverySession.id)
            setSelectedCustomerId(currentDiscoverySession.customerId)
            
            toast.success('Discovery complete!', {
              description: `${newUseCases.length} use cases created and prioritized`
            })
            
            setCurrentView('dashboard')
            setCurrentDiscoverySession(null)
            setNotesSession(null)

            // Explicit end-of-mode decision gate (Notes Analysis -> Proceed or Conclude)
            // User is already on the Portfolio/Matrix dashboard; this prompts whether to proceed to Sovereign Cloud Assessment.
            setPostQuickDiscoveryGateOpen(true)
          }}
          onCancel={() => {
            setCurrentView('dashboard')
            setCurrentDiscoverySession(null)
            setNotesSession(null)
          }}
        />
      )}

      {currentView === 'discovery-wizard' && pendingSessionMetadata && (
        <DiscoveryWizard 
          sessionMetadata={pendingSessionMetadata}
          onComplete={handleDiscoveryComplete} 
          onCancel={handleDiscoveryCancel}
          onBackToLanding={handleBackToLanding}
          onSwitchToLive={handleSwitchToLive}
          initialSessionName={sessionState?.sessionName}
          initialIndustry={sessionState?.industry}
          initialResponses={sessionState?.responses}
          initialDiscoveryTrack={pendingDiscoveryTrack || undefined}
          isDemoMode={isDemoMode}
          demoIndustry={demoIndustry}
        />
      )}

      {currentView === 'discovery-results' && currentDiscoverySession && (
        <DiscoveryResults
          session={currentDiscoverySession}
          onCreateUseCases={handleCreateUseCasesFromDiscovery}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'live-discovery' && !sessionState && pendingSessionMetadata && (
        <LiveDiscoverySetup
          onStart={(sessionName, industry) => {
            setSessionState({ sessionName, industry, responses: [] })
          }}
          onCancel={handleDiscoveryCancel}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'live-discovery' && sessionState && pendingSessionMetadata && (
        <LiveDiscoveryMode
          sessionMetadata={pendingSessionMetadata}
          sessionName={sessionState.sessionName}
          selectedIndustry={sessionState.industry}
          initialResponses={sessionState.responses}
          onComplete={handleDiscoveryComplete}
          onCancel={handleDiscoveryCancel}
          onBackToLanding={() => setCurrentView('landing')}
          onSwitchToStandard={handleSwitchToStandard}
        />
      )}

      {/* Fallback when live-discovery view is active but conditions not met */}
      {currentView === 'live-discovery' && !pendingSessionMetadata && (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <span>Session Error</span>
              </CardTitle>
              <CardDescription>
                Unable to start Live Discovery. Session metadata is missing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This can happen if the page was refreshed or the session timed out. 
                Please start a new discovery session.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('dashboard')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => {
                  setDiscoveryMode('live')
                  setCurrentView('session-metadata')
                }}
                className="flex-1"
              >
                Start New Session
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {currentView === 'dashboard' && (
        <motion.div
          animate={{
            backgroundColor: scoringMethod === 'impact-feasibility' 
              ? 'oklch(0.25 0.02 240)'
              : 'oklch(0.25 0.02 240)',
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="min-h-screen"
        >
          <NavigationHeader 
            onBackToLanding={handleBackToLanding}
            title="Microsoft Innovation Hub: ID-8"
            subtitle="Use Case Assessment Platform"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                ID-8 - Use Case Assessment
              </h2>
            </motion.header>

            <div className="mb-6 flex justify-center gap-3 flex-wrap">
              {selectedSessionId && (
                <Button variant="outline" onClick={() => setCurrentView('pipeline')}>
                  <Funnel className="mr-2" /> Open use-case pipeline
                </Button>
              )}
              <Button variant="outline" onClick={() => setCurrentView('unit-economics')}>
                <Calculator className="mr-2" /> Unit economics engine
              </Button>
            </div>

            {!selectedSession && (discoverySessions?.length === 0 || !discoverySessions) ? (
              <>
                <DiscoveryLauncher 
                  onStartDiscovery={handleStartDiscovery} 
                  onStartSovereignCloud={handleStartSovereignCloud}
                  onStartLiveDiscovery={handleStartLiveDiscovery} 
                  onStartEnterpriseDiscovery={handleStartEnterpriseDiscovery}
                  onResumeEnterpriseDiscovery={handleResumeEnterpriseDiscovery}
                  onStartDemo={handleStartDemo}
                  onStartEnterpriseDemo={handleStartEnterpriseDemo}
                  accountSegment={selectedSession?.accountSegment}
                />
                <EmptyState onAddFirst={handleOpenAddDialog} onImport={() => setImportDialogOpen(true)} />
              </>
            ) : (
              <>
                {customers.length > 0 && (
                  <CustomerSelector
                    customers={customers}
                    sessions={discoverySessions || []}
                    selectedCustomerId={selectedCustomerId}
                    onSelectCustomer={setSelectedCustomerId}
                  />
                )}

                <CustomerMetadataComponent
                  metadata={customerMetadata || {
                    customerName: '',
                    primaryStakeholder: '',
                    accountTeamRep: '',
                    innovationHubLocation: '',
                    solutionEngineer: '',
                    executiveSummary: '',
                  }}
                  onChange={(metadata) => {
                    if (selectedSessionId) {
                      updateSession(selectedSessionId, {
                        customerName: metadata.customerName,
                        innovationHubSPOC: metadata.innovationHubSPOC,
                        primaryStakeholder: metadata.primaryStakeholder,
                        accountTeamRep: metadata.accountTeamRep,
                        innovationHubLocation: metadata.innovationHubLocation,
                        solutionEngineer: metadata.solutionEngineer,
                      })
                    }
                  }}
                />

                {(customerMetadata?.executiveSummary || '').trim() ? (
                  <ExecutiveSummary
                    summary={customerMetadata?.executiveSummary || ''}
                    customerName={customerMetadata?.customerName}
                    industry={selectedSession?.industry}
                  />
                ) : shouldOfferExecutiveSummaryGeneration ? (
                  <Card className="border-2 bg-card mb-6">
                    <CardHeader className="pb-3">
                      <CardTitle>Executive Summary</CardTitle>
                      <CardDescription>
                        This session was created by skipping discovery. Generate an executive-ready summary from notes and attachments.
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-end">
                      <Button onClick={() => setExecSummaryGeneratorOpen(true)} className="gap-2">
                        Generate Executive Summary
                      </Button>
                    </CardFooter>
                  </Card>
                ) : null}

                <Disclaimer variant="compact" className="mb-6" />

                <DiscoveryLauncher 
                  onStartDiscovery={handleStartDiscovery} 
                  onStartSovereignCloud={handleStartSovereignCloud}
                  onStartLiveDiscovery={handleStartLiveDiscovery} 
                  onStartEnterpriseDiscovery={handleStartEnterpriseDiscovery}
                  onResumeEnterpriseDiscovery={handleResumeEnterpriseDiscovery}
                  onStartDemo={handleStartDemo}
                  onStartEnterpriseDemo={handleStartEnterpriseDemo}
                  customerName={customerMetadata?.customerName}
                  onOpenSessionComparison={() => setSessionManagerOpen(true)}
                  onOpenExport={() => handleOpenTableExport()}
                  accountSegment={selectedSession?.accountSegment}
                />

                <Card className="border-2 bg-card mb-8">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <FolderOpen size={24} weight="duotone" className="text-primary" />
                          Discovery Sessions
                        </CardTitle>
                        <CardDescription>
                          View and compare your saved discovery sessions
                        </CardDescription>
                      </div>
                      <Button onClick={() => setSessionManagerOpen(true)} variant="outline" className="gap-2">
                        <FolderOpen size={18} />
                        Manage Sessions
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {useCasesList.length === 0 ? (
                  <EmptyState onAddFirst={handleOpenAddDialog} onImport={() => setImportDialogOpen(true)} />
                ) : (
                  <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <motion.div
                    key={scoringMethod}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <Tabs
                      value={scoringMethod}
                      onValueChange={(value) => setScoringMethod(value as ScoringMethod)}
                      className="w-full sm:w-auto"
                    >
                      <TabsList className="grid w-full sm:w-auto grid-cols-3">
                        <TabsTrigger value="impact-feasibility" className="gap-2">
                          <ChartScatter size={18} />
                          <span className="hidden sm:inline">Impact/Feasibility</span>
                          <span className="sm:hidden">I/F</span>
                        </TabsTrigger>
                        <TabsTrigger value="rice" className="gap-2">
                          <ListNumbers size={18} />
                          RICE
                        </TabsTrigger>
                        <TabsTrigger value="financial-impact" className="gap-2">
                          <CurrencyDollar size={18} />
                          <span className="hidden sm:inline">Financial Impact</span>
                          <span className="sm:hidden">$</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </motion.div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      onClick={handleOpenTableExport} 
                      variant="outline" 
                      className="gap-2 flex-1 sm:flex-initial"
                    >
                      <FileArrowDown size={20} weight="bold" />
                      Export
                    </Button>
                    <Button 
                      onClick={() => setImportDialogOpen(true)} 
                      variant="outline" 
                      className="gap-2 flex-1 sm:flex-initial"
                    >
                      <FileArrowUp size={20} weight="bold" />
                      Import
                    </Button>
                    <Button
                      onClick={handleReassessCompliance}
                      variant="outline"
                      className="gap-2 flex-1 sm:flex-initial"
                      disabled={useCasesList.length === 0}
                      title="Re-assess all use cases against regulatory frameworks"
                    >
                      <ShieldCheck size={20} weight="bold" />
                      Re-assess
                    </Button>
                    <Button onClick={handleOpenAddDialog} className="gap-2 flex-1 sm:flex-initial">
                      <Plus size={20} weight="bold" />
                      Add Use Case
                    </Button>
                    <MutualSuccessPlanDialog
                      customerId={selectedCustomerId}
                      customerName={selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : undefined}
                    />
                  </div>
                </div>

                <TopRecommendations
                  topUseCases={topUseCases}
                  scoringMethod={scoringMethod}
                  onSelectUseCase={setSelectedUseCaseId}
                  onGenerateBlueprint={(uc) => handleStartSolutionBlueprint({ fromUseCase: uc })}
                />

                <AnimatePresence mode="wait">
                  {scoringMethod === 'impact-feasibility' && (
                    <motion.div
                      key="impact-feasibility"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      <PrioritizationMatrix
                        useCases={useCasesList}
                        selectedId={selectedUseCaseId}
                        onSelectUseCase={setSelectedUseCaseId}
                        showDescription={showImpactFeasibilityDesc}
                        onToggleDescription={() => setShowImpactFeasibilityDesc(!showImpactFeasibilityDesc)}
                        blueprintSignals={blueprintSignals}
                      />
                    </motion.div>
                  )}

                  {scoringMethod === 'rice' && (
                    <motion.div
                      key="rice"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                    <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setShowRiceDesc(!showRiceDesc)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-foreground">About RICE Scoring</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {showRiceDesc ? 'Click to hide details' : 'Click to learn how RICE prioritization works'}
                          </p>
                        </div>
                        {showRiceDesc ? (
                          <CaretUp size={24} className="text-foreground flex-shrink-0" />
                        ) : (
                          <CaretDown size={24} className="text-foreground flex-shrink-0" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {showRiceDesc && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6">
                              <p className="text-sm text-muted-foreground mb-4">
                                RICE helps you prioritize initiatives using four key factors. Higher scores indicate better opportunities:
                              </p>
                              <div className="grid grid-cols-1 gap-4 text-sm">
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">Reach (Users/Period)</h4>
                                  <p className="text-muted-foreground">
                                    How many unique users will benefit from this use case within a specific time period? 
                                    This is calculated as <span className="font-medium text-foreground">Number of Users ÷ Time Period</span>.
                                  </p>
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    Example: If 1,000 users benefit per quarter, enter 1000 users and "quarter" as the period.
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">Impact Multiplier</h4>
                                  <p className="text-muted-foreground">
                                    How significantly will this affect each user's experience or outcomes? Use the scale:
                                  </p>
                                  <ul className="text-muted-foreground mt-1 text-xs space-y-0.5 ml-4">
                                    <li><span className="font-medium text-foreground">3x = Massive</span> - Game-changing impact</li>
                                    <li><span className="font-medium text-foreground">2x = High</span> - Significant improvement</li>
                                    <li><span className="font-medium text-foreground">1x = Medium</span> - Noticeable benefit</li>
                                    <li><span className="font-medium text-foreground">0.5x = Low</span> - Minor improvement</li>
                                    <li><span className="font-medium text-foreground">0.25x = Minimal</span> - Small tweak</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">Confidence (%)</h4>
                                  <p className="text-muted-foreground">
                                    How certain are you about your Reach, Impact, and Effort estimates? Lower confidence reduces the final score.
                                  </p>
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    Example: 100% = completely confident, 80% = pretty sure, 50% = rough guess
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">Effort (Person-Weeks)</h4>
                                  <p className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Total development time</span> required to design, build, test, and deploy this solution.
                                    Sum the time across all team members who will work on implementation.
                                  </p>
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    Example: If 2 developers work for 3 weeks each, and 1 designer works for 1 week = 7 person-weeks total. 
                                    This measures the cost to <span className="font-medium text-foreground">implement the new solution</span>, not the time spent on the current process.
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 p-3 bg-background rounded border border-border">
                                <p className="text-sm font-mono text-foreground">
                                  RICE Score = (Reach × Impact × Confidence) ÷ Effort
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Higher scores = greater impact per unit of effort invested
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
                  {scoringMethod === 'financial-impact' && (
                    <motion.div
                      key="financial-impact"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => setShowFinancialImpactDesc(!showFinancialImpactDesc)}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-foreground">Financial Impact (COI + ROI)</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {showFinancialImpactDesc
                                ? 'Click to hide details'
                                : 'Click to learn how financial impact is derived and edited'}
                            </p>
                          </div>
                          {showFinancialImpactDesc ? (
                            <CaretUp size={24} className="text-foreground flex-shrink-0" />
                          ) : (
                            <CaretDown size={24} className="text-foreground flex-shrink-0" />
                          )}
                        </button>

                        <AnimatePresence>
                          {showFinancialImpactDesc && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 text-sm text-muted-foreground space-y-2">
                                <p>
                                  The app auto-derives initial COI/ROI values from discovery outputs (COI estimates, effort estimates, and any captured
                                  financial analysis evidence). All derived numbers and notes remain fully editable and are used in executive exports.
                                </p>
                                <ul className="list-disc ml-5 space-y-1">
                                  <li>Payback is calculated from implementation cost and annual value.</li>
                                  <li>3-year ROI is calculated using the current ROI model used throughout the app.</li>
                                  <li>Notes capture assumptions and the provenance of any derived defaults.</li>
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-6">
                        <FinancialImpactTab
                          useCases={useCasesList}
                          selectedId={selectedUseCaseId}
                          onSelectUseCase={setSelectedUseCaseId}
                          onUpdateUseCase={handleUpdateUseCase}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Card className="border-2 bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle>Portfolio/Matrix: Next step</CardTitle>
                    <CardDescription>
                      When you’re ready, proceed to Enterprise Discovery or conclude this assessment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleStartEnterpriseDiscovery()
                      }}
                    >
                      Proceed to Strategic Assessment
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        toast.success('Portfolio step concluded', {
                          description: 'You can proceed to Strategic Assessment anytime from the launcher.',
                        })
                      }}
                    >
                      Conclude
                    </Button>
                  </CardContent>
                </Card>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <motion.h2 
                      className="text-xl font-semibold text-foreground"
                      key={`header-${scoringMethod}`}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      All Use Cases ({
                        sourceFilter === 'all' 
                          ? useCasesList.length 
                          : useCasesList.filter(uc => uc.dataSources?.includes(sourceFilter as any)).length
                      })
                    </motion.h2>
                    <div className="flex items-center gap-2">
                      <Funnel size={16} className="text-muted-foreground" />
                      <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder="Filter by source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="ai-generated">AI Generated</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="fallback">Industry Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {getRankedUseCases(
                        sourceFilter === 'all' 
                          ? useCasesList 
                          : useCasesList.filter(uc => uc.dataSources?.includes(sourceFilter as any)),
                        scoringMethod
                      ).map((useCase) => (
                        <UseCaseCard
                          key={useCase.id}
                          useCase={useCase}
                          rank={topUseCaseIds.has(useCase.id) ? topUseCases.findIndex((uc) => uc.id === useCase.id) + 1 : undefined}
                          isTopPick={topUseCaseIds.has(useCase.id)}
                          scoringMethod={scoringMethod}
                          onUpdate={handleUpdateUseCase}
                          onDelete={handleDeleteUseCase}
                          onEdit={handleEditUseCase}
                          onGenerateBlueprint={(uc) => handleStartSolutionBlueprint({ fromUseCase: uc })}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>

          <UseCaseDialog
            open={dialogOpen}
            onOpenChange={handleDialogOpenChange}
            onSave={handleSaveEdit}
            editingUseCase={editingUseCase}
            sessionLocation={selectedSession?.innovationHubLocation}
            sessionIndustry={selectedSession?.industry}
            complianceEnforcement={(selectedSession as any)?.complianceEnforcement || 'advisory'}
          />

          <TableExportView
            open={tableExportOpen}
            onOpenChange={setTableExportOpen}
            useCases={getRankedUseCases(useCasesList, scoringMethod)}
            topUseCases={topUseCases}
            scoringMethod={scoringMethod}
            customerMetadata={customerMetadata || undefined}
            suggestedUseCases={selectedSession?.suggestedUseCases}
          />

          <SessionManager
            open={sessionManagerOpen}
            onOpenChange={setSessionManagerOpen}
            onViewSession={handleViewSession}
            onCompareSessions={handleCompareSessions}
            onResumeEnterpriseSession={handleResumeEnterpriseDiscovery}
          />

          <ImportUseCasesDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onImport={handleImportUseCases}
            discoverySessionId={selectedSessionId || undefined}
            sessionLocation={selectedSession?.innovationHubLocation}
            sessionIndustry={selectedSession?.industry}
            complianceEnforcement={(selectedSession as any)?.complianceEnforcement || 'advisory'}
          />

          {selectedSession && (
            <ExecutiveSummaryGeneratorDialog
              open={execSummaryGeneratorOpen}
              onOpenChange={setExecSummaryGeneratorOpen}
              session={selectedSession}
              useCases={filteredUseCases}
              blueprintAnnex={execSummaryBlueprintAnnex}
              onSaveSummary={(summary) => {
                if (!selectedSessionId) return
                updateSession(selectedSessionId, { executiveSummary: summary })
              }}
            />
          )}
        </motion.div>
      )}

      </div>{/* End of demo mode wrapper */}

      <Dialog open={postQuickDiscoveryGateOpen} onOpenChange={setPostQuickDiscoveryGateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discovery complete</DialogTitle>
            <DialogDescription>
              Decide whether to proceed to Sovereign Cloud Assessment (recommended) or conclude here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              onClick={() => {
                setPostQuickDiscoveryGateOpen(false)
                handleStartSovereignCloud()
              }}
            >
              Proceed to Sovereign Cloud Assessment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPostQuickDiscoveryGateOpen(false)
                toast.info('Concluded after Discovery', {
                  description: 'You’re in the Portfolio/Matrix view. You can continue later.',
                })
              }}
            >
              Conclude
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </Suspense>
      </SectionErrorBoundary>
      <Footer />
    </>
  )
}

export default App