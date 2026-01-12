import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import '@/lib/openai-service' // Initialize OpenAI service
import { UseCase, ScoringMethod, CustomerMetadata, DiscoverySession, Industry, DiscoveryResponse } from '@/lib/types'
import type { EnterpriseDiscoverySession } from '@/lib/types'
import { SessionMetadata } from '@/components/SessionMetadataForm'
import { getTopUseCases, getRankedUseCases } from '@/lib/scoring'
import { useDiscovery } from '@/hooks/use-discovery'
import { useCustomers } from '@/hooks/use-customers'
import { UseCaseCard } from '@/components/UseCaseCard'
import { UseCaseDialog } from '@/components/UseCaseDialog'
import { TableExportView } from '@/components/TableExportView'
import { PrioritizationMatrix } from '@/components/PrioritizationMatrix'
import { TopRecommendations } from '@/components/TopRecommendations'
import { EmptyState } from '@/components/EmptyState'
import { CustomerMetadata as CustomerMetadataComponent } from '@/components/CustomerMetadata'
import { ExecutiveSummary } from '@/components/ExecutiveSummary'
import { DiscoveryLauncher } from '@/components/DiscoveryLauncher'
import { DiscoveryWizard } from '@/components/DiscoveryWizard'
import { DiscoveryResults } from '@/components/DiscoveryResults'
import { DiscoveryNotesInput } from '@/components/DiscoveryNotesInput'
import { AIAssessmentWorkflow } from '@/components/AIAssessmentWorkflow'
import { LiveDiscoveryMode } from '@/components/LiveDiscoveryMode'
import { LiveDiscoverySetup } from '@/components/LiveDiscoverySetup'
import { SessionManager } from '@/components/SessionManager'
import { SessionComparison } from '@/components/SessionComparison'
import { SessionMetadataForm } from '@/components/SessionMetadataForm'
import { CustomerSelector } from '@/components/CustomerSelector'
import { EnterpriseDiscoveryOrchestrator } from '@/components/enterprise-discovery/EnterpriseDiscoveryOrchestrator'
import { Disclaimer } from '@/components/Disclaimer'
import { LandingPage } from '@/components/LandingPage'
import { NavigationHeader } from '@/components/NavigationHeader'
import { QuickCOICalculator } from '@/components/QuickCOICalculator'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, ChartScatter, ListNumbers, FileArrowDown, FileArrowUp, CaretDown, CaretUp, FolderOpen, Funnel, CurrencyDollar } from '@phosphor-icons/react'
import { FinancialImpactTab } from '@/components/FinancialImpactTab'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Footer } from '@/components/ui/footer'
import { ImportUseCasesDialog } from '@/components/ImportUseCasesDialog'
import type { ExtractedUseCase } from '@/lib/use-case-extraction'

type AppView = 'landing' | 'dashboard' | 'session-metadata' | 'discovery-wizard' | 'discovery-results' | 'session-comparison' | 'live-discovery' | 'ai-assessment' | 'enterprise-discovery' | 'notes-input' | 'notes-workflow'

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
  const [enterpriseSessions, setEnterpriseSessions] = useLocalStorage<EnterpriseDiscoverySession[]>('enterprise-sessions', [])
  const [currentEnterpriseSession, setCurrentEnterpriseSession] = useState<EnterpriseDiscoverySession | null>(null)
  
  const [currentView, setCurrentView] = useState<AppView>('landing')
  const [currentDiscoverySession, setCurrentDiscoverySession] = useState<DiscoverySession | null>(null)
  const [comparingSessions, setComparingSessions] = useState<DiscoverySession[]>([])
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [pendingSessionMetadata, setPendingSessionMetadata] = useState<SessionMetadata | null>(null)
  const [discoveryMode, setDiscoveryMode] = useState<'standard' | 'live' | 'ai-assessment'>('standard')
  const [notesSession, setNotesSession] = useState<{ metadata: SessionMetadata; notes: string; extractedUseCases: ExtractedUseCase[] } | null>(null)
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

  const filteredSessions = selectedCustomerId 
    ? discoverySessions?.filter((s) => s.customerId === selectedCustomerId) || []
    : discoverySessions || []

  const selectedSession = discoverySessions?.find((s) => s.id === selectedSessionId) || null
  const filteredUseCases = useCases?.filter((uc) => uc.discoverySessionId === selectedSessionId) || []
  
  const useCasesList = filteredUseCases
  const topUseCases = getTopUseCases(useCasesList, scoringMethod, 5)
  const topUseCaseIds = new Set(topUseCases.map((uc) => uc.id))
  
  const customerMetadata: CustomerMetadata | null = selectedSession ? {
    customerName: selectedSession.customerName,
    innovationHubSPOC: selectedSession.innovationHubSPOC,
    primaryStakeholder: selectedSession.primaryStakeholder,
    accountTeamRep: selectedSession.accountTeamRep,
    innovationHubLocation: selectedSession.innovationHubLocation,
    solutionEngineer: selectedSession.solutionEngineer,
    executiveSummary: selectedSession.executiveSummary,
  } : null

  useEffect(() => {
    if (useCasesList.length === 1 && !showConfetti) {
      setShowConfetti(true)
      toast.success('Great start! Add more use cases to compare and prioritize.', {
        duration: 3000,
      })
    }
  }, [useCasesList.length])

  const handleAddUseCase = (data: Partial<UseCase>) => {
    if (!selectedSessionId) {
      toast.error('Please select a discovery session first')
      return
    }
    const newUseCase: UseCase = {
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
      const updated = {
        ...editingUseCase,
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
      dataSources: data.dataSources || ['manual'],
      costOfInaction: data.costOfInaction,
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

  const handleStartDiscovery = () => {
    setSessionState(null)
    setPendingSessionMetadata(null)
    setDiscoveryMode('standard')
    setCurrentView('session-metadata')
  }

  const handleStartAIAssessment = () => {
    if (selectedSessionId && selectedSession) {
      setCurrentView('ai-assessment')
      return
    }

    setSessionState(null)
    setPendingSessionMetadata(null)
    setDiscoveryMode('ai-assessment')
    setCurrentView('session-metadata')
  }

  const handleStartLiveDiscovery = () => {
    setSessionState(null)
    setPendingSessionMetadata(null)
    setDiscoveryMode('live')
    setCurrentView('session-metadata')
  }

  const handleStartNotesAnalysis = () => {
    setSessionState(null)
    setPendingSessionMetadata(null)
    setNotesSession(null)
    setCurrentView('notes-input')
  }

  const handleStartEnterpriseDiscovery = () => {
    setCurrentEnterpriseSession(null)
    setCurrentView('enterprise-discovery')
  }

  const handleResumeEnterpriseDiscovery = (session: EnterpriseDiscoverySession) => {
    setCurrentEnterpriseSession(session)
    setCurrentView('enterprise-discovery')
  }

  // Demo mode handlers - load pre-populated demo data for selected industry
  const handleStartDemo = (demoType: 'mining' | 'retail' | 'financial') => {
    // Select the appropriate demo data based on type
    const demoDataMap = {
      mining: { session: DEMO_DISCOVERY_SESSION, useCases: DEMO_USE_CASES, name: 'Zava Mining', desc: 'AI-powered mining innovations with regulatory compliance' },
      retail: { session: DEMO_RETAIL_SESSION, useCases: DEMO_RETAIL_USE_CASES, name: 'MegaMart Retail', desc: 'Retail AI for inventory, shrinkage, and customer experience' },
      financial: { session: DEMO_FINANCIAL_SESSION, useCases: DEMO_FINANCIAL_USE_CASES, name: 'Apex Financial', desc: 'Financial services AI for fraud, onboarding, and credit' },
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
      financial: { session: DEMO_FINANCIAL_ENTERPRISE_SESSION, name: 'Apex Financial', desc: 'Fraud detection and onboarding opportunity' },
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

  const handleEnterpriseSessionPause = (session: EnterpriseDiscoverySession) => {
    handleEnterpriseSessionSave(session)
    toast.info('Discovery session paused', {
      description: 'You can resume from the Enterprise Discovery tab.',
    })
    setCurrentView('dashboard')
    setCurrentEnterpriseSession(null)
  }

  const handleEnterpriseSessionSave = (session: EnterpriseDiscoverySession) => {
    const updated = enterpriseSessions || []
    const index = updated.findIndex(s => s.id === session.id)
    if (index >= 0) {
      updated[index] = session
    } else {
      updated.push(session)
    }
    setEnterpriseSessions(updated)
  }

  const handleEnterpriseSessionComplete = (session: EnterpriseDiscoverySession) => {
    handleEnterpriseSessionSave(session)
    toast.success('Enterprise Discovery completed successfully!')
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
    setSessionState(null)
    setPendingSessionMetadata(null)
    setCurrentEnterpriseSession(null)
  }
  
  const handleSessionMetadataSubmit = (metadata: SessionMetadata) => {
    if (discoveryMode === 'ai-assessment') {
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
        name: `AI Assessment - ${metadata.customerName}`,
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
      setCurrentView('ai-assessment')
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
    setCurrentView('discovery-results')
  }

  const handleDiscoveryCancel = () => {
    setCurrentView('dashboard')
    setCurrentDiscoverySession(null)
    setSessionState(null)
    setPendingSessionMetadata(null)
  }

  const handleNotesAnalyze = (notes: string, metadata: SessionMetadata, extractedUseCases: ExtractedUseCase[], sessionName: string, industry: Industry) => {
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
      name: sessionName,
      industry: industry,
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

  const handleSkipToUseCases = () => {
    // Create a minimal session for direct use case entry
    const minimalSession: DiscoverySession = {
      id: `direct-${Date.now()}`,
      customerId: '',
      customerName: 'Quick Session',
      innovationHubSPOC: '',
      primaryStakeholder: '',
      accountTeamRep: '',
      innovationHubLocation: '',
      solutionEngineer: '',
      industry: 'general',
      responses: [],
      suggestedUseCases: [],
      createdAt: Date.now(),
      completedAt: Date.now(),
    }
    
    const customer = findOrCreateCustomer('Quick Session', '', undefined)
    minimalSession.customerId = customer.id
    addSession(minimalSession)
    setSelectedCustomerId(customer.id)
    setSelectedSessionId(minimalSession.id)
    setCurrentView('dashboard')
    
    toast.success('Ready to add use cases!', {
      description: 'You can edit customer details anytime.',
    })
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
      kpis: data.kpis || [],
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
    // User is already on the Portfolio/Matrix dashboard; this prompts whether to proceed to AI Assessment.
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
      
      {currentView === 'landing' && (
        <LandingPage
          customers={customers}
          onStartNew={() => {
            setDiscoveryMode('standard')
            setCurrentView('session-metadata')
          }}
          onStartAIAssessment={handleStartAIAssessment}
          onStartEnterpriseDiscovery={handleStartEnterpriseDiscovery}
          onStartNotesAnalysis={handleStartNotesAnalysis}
          onViewExisting={() => setCurrentView('dashboard')}
          onSkipToUseCases={handleSkipToUseCases}
        />
      )}

      {currentView === 'enterprise-discovery' && (
        <>
          <NavigationHeader 
            onBackToLanding={handleBackToLanding}
            onBack={handleEnterpriseDiscoveryCancel}
            backLabel="Exit Discovery"
            title="Enterprise Discovery"
            subtitle="Comprehensive opportunity assessment"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
            <EnterpriseDiscoveryOrchestrator
            initialSession={currentEnterpriseSession || undefined}
            initialCustomerName={selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : undefined}
            businessEnvisioning={selectedSession?.businessEnvisioning}
            onSave={handleEnterpriseSessionSave}
            onComplete={handleEnterpriseSessionComplete}
            onCancel={handleEnterpriseDiscoveryCancel}
            onPause={handleEnterpriseSessionPause}
            />
          </div>
        </>
      )}

      {currentView === 'ai-assessment' && (
        <>
          <NavigationHeader
            onBackToLanding={handleBackToLanding}
            onBack={() => setCurrentView('dashboard')}
            backLabel="Back"
            title="AI Assessment"
            subtitle="Process analysis and agent opportunity refinement"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
            {!selectedSession ? (
              <Card className="border-2 bg-card">
                <CardHeader>
                  <CardTitle>No active session selected</CardTitle>
                  <CardDescription>
                    Create or select a discovery session before running an AI Assessment.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => setCurrentView('dashboard')}>Back to Dashboard</Button>
                </CardFooter>
              </Card>
            ) : (
              <AIAssessmentWorkflow
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
              />
            )}
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
          onBackToLanding={() => setCurrentView('landing')}
          initialMetadata={selectedCustomerId ? { customerName: customers.find(c => c.id === selectedCustomerId)?.name || '' } : undefined}
        />
      )}

      {currentView === 'notes-input' && (
        <DiscoveryNotesInput
          onAnalyze={handleNotesAnalyze}
          onCancel={handleNotesCancel}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'notes-workflow' && currentDiscoverySession && notesSession && (
        <EnhancedDiscoveryWorkflow
          session={currentDiscoverySession}
          initialUseCases={notesSession.extractedUseCases.map(uc => ({
            title: uc.title,
            description: uc.description,
            rationale: uc.rationale,
            sourceTexts: uc.sourceTexts,
            dataSources: ['ai-generated', 'discovery'],
            strategicAlignment: uc.strategicAlignment,
            businessProcesses: uc.businessProcess ? [{
              process: uc.businessProcess.processName,
              category: uc.businessProcess.category,
              currentState: uc.businessProcess.currentPainPoints.join('; '),
              painPoints: uc.businessProcess.currentPainPoints,
              desiredState: uc.businessProcess.expectedImprovement,
              aiIntervention: '',
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
            // User is already on the Portfolio/Matrix dashboard; this prompts whether to proceed to AI Assessment.
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
          onBackToLanding={() => setCurrentView('landing')}
          onSwitchToLive={handleSwitchToLive}
          initialSessionName={sessionState?.sessionName}
          initialIndustry={sessionState?.industry}
          initialResponses={sessionState?.responses}
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
            title="Microsoft Innovation Hub"
            subtitle="Use Case Assessment Platform"
          />
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Microsoft Innovation Hub Use Case Assessment
              </h1>
            </motion.header>

            {!selectedSession && (discoverySessions?.length === 0 || !discoverySessions) ? (
              <>
                <DiscoveryLauncher 
                  onStartDiscovery={handleStartDiscovery} 
                  onStartAIAssessment={handleStartAIAssessment}
                  onStartLiveDiscovery={handleStartLiveDiscovery} 
                  onStartEnterpriseDiscovery={handleStartEnterpriseDiscovery}
                  onResumeEnterpriseDiscovery={handleResumeEnterpriseDiscovery}
                  onStartDemo={handleStartDemo}
                  onStartEnterpriseDemo={handleStartEnterpriseDemo}
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

                <ExecutiveSummary
                  summary={customerMetadata?.executiveSummary || ''}
                />

                <Disclaimer variant="compact" className="mb-6" />

                <DiscoveryLauncher 
                  onStartDiscovery={handleStartDiscovery} 
                  onStartAIAssessment={handleStartAIAssessment}
                  onStartLiveDiscovery={handleStartLiveDiscovery} 
                  onStartEnterpriseDiscovery={handleStartEnterpriseDiscovery}
                  onResumeEnterpriseDiscovery={handleResumeEnterpriseDiscovery}
                  onStartDemo={handleStartDemo}
                  onStartEnterpriseDemo={handleStartEnterpriseDemo}
                  customerName={customerMetadata?.customerName}
                  onOpenSessionComparison={() => setSessionManagerOpen(true)}
                  onOpenExport={() => handleOpenTableExport()}
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
                    <Button onClick={handleOpenAddDialog} className="gap-2 flex-1 sm:flex-initial">
                      <Plus size={20} weight="bold" />
                      Add Use Case
                    </Button>
                  </div>
                </div>

                <TopRecommendations
                  topUseCases={topUseCases}
                  scoringMethod={scoringMethod}
                  onSelectUseCase={setSelectedUseCaseId}
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
                      Proceed to Enterprise Discovery
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        toast.success('Portfolio step concluded', {
                          description: 'You can proceed to Enterprise Discovery anytime from the launcher.',
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
          />
        </motion.div>
      )}

      <Dialog open={postQuickDiscoveryGateOpen} onOpenChange={setPostQuickDiscoveryGateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Discovery complete</DialogTitle>
            <DialogDescription>
              Decide whether to proceed to AI Assessment (recommended) or conclude here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              onClick={() => {
                setPostQuickDiscoveryGateOpen(false)
                handleStartAIAssessment()
              }}
            >
              Proceed to AI Assessment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPostQuickDiscoveryGateOpen(false)
                toast.info('Concluded after Quick Discovery', {
                  description: 'You’re in the Portfolio/Matrix view. You can continue later.',
                })
              }}
            >
              Conclude
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </>
  )
}

export default App