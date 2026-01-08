import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Settings } from 'lucide-react'
import { StageNavigator } from './StageNavigator'
import { YellowLightsDashboard } from './YellowLightsDashboard'
import { SessionControlBar } from './SessionControlBar'
import { DiscoverySettingsDialog } from '@/components/DiscoverySettingsDialog'
import { Stage0Start } from './stages/Stage0Start'
import { Stage1Opportunity } from './stages/Stage1Opportunity'
import { Stage2Resources } from './stages/Stage2Resources'
import { Stage5SolutionScope } from './stages/Stage5SolutionScope'
import { Stage8Communicate } from './stages/Stage8Communicate'
import {
  Stage3DecisionProcess,
  Stage4Prioritise,
  Stage6Validate,
  Stage7Commit,
} from './stages/StagesPlaceholder'
import { exportEnterpriseDiscoveryToPDF } from '@/lib/enterprise-pdf-export'
import { exportEnterpriseDiscoveryToExcel } from '@/lib/enterprise-excel-export'
import type { EnterpriseDiscoverySession, YellowLight, StageStatus, BusinessEnvisioningData } from '@/lib/types'
import { toast } from 'sonner'

const PAUSED_SESSIONS_KEY = 'karabo-paused-enterprise-sessions'
const ENTERPRISE_SESSIONS_KEY = 'enterprise-sessions'

interface EnterpriseDiscoveryOrchestratorProps {
  initialSession?: EnterpriseDiscoverySession
  initialCustomerName?: string
  businessEnvisioning?: BusinessEnvisioningData
  onSave: (session: EnterpriseDiscoverySession) => void
  onComplete: (session: EnterpriseDiscoverySession) => void
  onCancel: () => void
  onPause?: (session: EnterpriseDiscoverySession) => void
}

export function EnterpriseDiscoveryOrchestrator({
  initialSession,
  initialCustomerName,
  businessEnvisioning,
  onSave,
  onComplete,
  onCancel,
  onPause,
}: EnterpriseDiscoveryOrchestratorProps) {
  const [session, setSession] = useState<EnterpriseDiscoverySession>(
    initialSession || {
      id: `ent-${Date.now()}`,
      clientName: '',
      attendees: [],
      sessionDate: Date.now(),
      discoveryType: 'new-opportunity',
      currentStageId: 0,
      stages: {
        0: { status: 'in-progress', data: null },
        1: { status: 'not-started', data: null },
        2: { status: 'not-started', data: null },
        3: { status: 'not-started', data: null },
        4: { status: 'not-started', data: null },
        5: { status: 'not-started', data: null },
        6: { status: 'not-started', data: null },
        7: { status: 'not-started', data: null },
        8: { status: 'not-started', data: null },
      },
      allYellowLights: [],
      isLiveMode: false,
      createdAt: Date.now(),
    }
  )
  
  const [lastSaved, setLastSaved] = useState<number | undefined>(session.lastSavedAt)
  const [isLiveMode, setIsLiveMode] = useState(session.isLiveMode || false)
  const [showSettings, setShowSettings] = useState(false)

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedSession = { ...session, lastSavedAt: Date.now(), isLiveMode }
      onSave(updatedSession)
      setLastSaved(Date.now())
    }, 30000)
    return () => clearInterval(interval)
  }, [session, onSave, isLiveMode])

  // Save session to localStorage for pause/resume
  const saveToLocalStorage = useCallback((sessionToSave: EnterpriseDiscoverySession) => {
    try {
      const pausedSessions = JSON.parse(localStorage.getItem(PAUSED_SESSIONS_KEY) || '[]')
      const existingIndex = pausedSessions.findIndex((s: EnterpriseDiscoverySession) => s.id === sessionToSave.id)
      if (existingIndex >= 0) {
        pausedSessions[existingIndex] = sessionToSave
      } else {
        pausedSessions.push(sessionToSave)
      }
      localStorage.setItem(PAUSED_SESSIONS_KEY, JSON.stringify(pausedSessions))
    } catch (error) {
      console.error('Failed to save session to localStorage:', error)
    }
  }, [])

  // Handle pause session
  const handlePauseSession = useCallback(() => {
    const pausedSession: EnterpriseDiscoverySession = {
      ...session,
      isPaused: true,
      pausedAt: Date.now(),
      lastSavedAt: Date.now(),
      isLiveMode,
    }
    saveToLocalStorage(pausedSession)
    onSave(pausedSession)
    if (onPause) {
      onPause(pausedSession)
    } else {
      onCancel() // Fall back to cancel if no pause handler
    }
  }, [session, isLiveMode, saveToLocalStorage, onSave, onPause, onCancel])

  // Handle end session with PDF export
  const handleEndSession = useCallback(async () => {
    const completedSession: EnterpriseDiscoverySession = {
      ...session,
      completedAt: Date.now(),
      lastSavedAt: Date.now(),
      isLiveMode,
    }
    
    // Export PDF
    try {
      const fileName = await exportEnterpriseDiscoveryToPDF(completedSession)
      toast.success('Discovery session completed!', {
        description: `PDF exported as ${fileName}`,
      })
    } catch (error) {
      console.error('Failed to export PDF:', error)
      toast.error('Failed to export PDF', {
        description: 'Session data was saved but PDF export failed.',
      })
    }
    
    onComplete(completedSession)
  }, [session, isLiveMode, onComplete])

  // Handle PDF export (without ending session)
  const handleExportPDF = useCallback(async () => {
    try {
      const fileName = await exportEnterpriseDiscoveryToPDF(session)
      toast.success('PDF exported successfully', {
        description: fileName,
      })
    } catch (error) {
      console.error('Failed to export PDF:', error)
      toast.error('Failed to export PDF')
    }
  }, [session])

  // Handle Excel export
  const handleExportExcel = useCallback(() => {
    try {
      const fileName = exportEnterpriseDiscoveryToExcel(session)
      toast.success('Excel exported successfully', {
        description: fileName,
      })
    } catch (error) {
      console.error('Failed to export Excel:', error)
      toast.error('Failed to export Excel')
    }
  }, [session])

  // Toggle live mode
  const handleToggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => !prev)
    toast.info(isLiveMode ? 'Voice input disabled' : 'Voice input enabled', {
      description: isLiveMode ? 'Switched to keyboard input' : 'You can now speak your responses',
    })
  }, [isLiveMode])

  const stages = Object.entries(session.stages).map(([id, stage]) => ({
    id: Number(id),
    name: `Stage ${id}`,
    status: stage.status,
  }))

  const currentStage = session.currentStageId
  const criticalYellowLights = session.allYellowLights.filter(
    (l) => !l.resolved && (l.severity === 'serious' || l.severity === 'deal-breaker')
  )

  // Check if Stage 1 has valid COI data
  const hasValidStage1Data = useCallback(() => {
    const stage1Data = session.stages[1].data
    if (!stage1Data?.coi) return false
    const coi = stage1Data.coi
    const totalCOI = coi.totalAnnual || (
      (coi.directCosts.oneTime || 0) + (coi.directCosts.recurring || 0) * 12 +
      (coi.opportunityCosts.oneTime || 0) + (coi.opportunityCosts.recurring || 0) * 12 +
      ((coi.riskCosts.oneTime || 0) * (coi.riskCosts.oneTimeProbability || 0) / 100) +
      ((coi.riskCosts.recurring || 0) * (coi.riskCosts.recurringProbability || 0) / 100 * 12)
    )
    return totalCOI > 0
  }, [session.stages])

  const handleStageComplete = (stageId: number, data: any) => {
    const updated = { ...session }
    updated.stages[stageId as keyof typeof updated.stages] = {
      status: 'completed',
      completedAt: Date.now(),
      data,
    }

    // Warn if Stage 1 COI is incomplete when advancing beyond Stage 1
    if (stageId >= 1 && !hasValidStage1Data()) {
      toast.warning('Stage 1 Cost of Inaction incomplete', {
        description: 'Financial outputs in Stage 8 will show $0 until COI is populated.',
        duration: 5000,
      })
    }

    // Move to next stage if not at the end
    if (stageId < 8) {
      updated.currentStageId = stageId + 1
      updated.stages[(stageId + 1) as keyof typeof updated.stages].status = 'in-progress'
    } else {
      // Completed all stages - save to enterprise sessions storage
      updated.completedAt = Date.now()
      try {
        const stored = JSON.parse(localStorage.getItem(ENTERPRISE_SESSIONS_KEY) || '[]')
        const existingIdx = stored.findIndex((s: EnterpriseDiscoverySession) => s.id === updated.id)
        if (existingIdx >= 0) {
          stored[existingIdx] = updated
        } else {
          stored.push(updated)
        }
        localStorage.setItem(ENTERPRISE_SESSIONS_KEY, JSON.stringify(stored))
      } catch (e) {
        console.error('Failed to persist completed session:', e)
      }
      toast.success('Enterprise Discovery Completed!')
      onComplete(updated)
      return
    }

    setSession(updated)
    onSave(updated)
    toast.success(`Stage ${stageId} completed`)
  }

  const handleStageBack = (targetStageId: number) => {
    const updated = { ...session }
    updated.currentStageId = targetStageId
    updated.stages[targetStageId as keyof typeof updated.stages].status = 'in-progress'
    updated.lastSavedAt = Date.now()
    setSession(updated)
    onSave(updated)
    setLastSaved(Date.now())
  }

  const handleResolveYellowLight = (id: string) => {
    const updated = { ...session }
    const light = updated.allYellowLights.find((l) => l.id === id)
    if (light) {
      light.resolved = true
      setSession(updated)
      onSave(updated)
      toast.success('Yellow light resolved')
    }
  }

  const handleStage0Complete = (data: any) => {
    const updated = { ...session }
    updated.clientName = data.clientName
    updated.attendees = data.attendees
    updated.sessionDate = data.sessionDate
    updated.discoveryType = data.discoveryType
    handleStageComplete(0, null)
  }

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return (
          <Stage0Start
            initialData={{
              clientName: session.clientName,
              attendees: session.attendees,
              sessionDate: session.sessionDate,
              discoveryType: session.discoveryType,
            }}
            initialCustomerName={initialCustomerName}
            onComplete={handleStage0Complete}
            onBack={onCancel}
            isLiveMode={isLiveMode}
          />
        )
      case 1:
        return (
          <Stage1Opportunity
            initialData={session.stages[1].data}
            businessEnvisioning={businessEnvisioning}
            onComplete={(data) => handleStageComplete(1, data)}
            onBack={() => handleStageBack(0)}
            isLiveMode={isLiveMode}
          />
        )
      case 2:
        return (
          <Stage2Resources
            initialData={session.stages[2].data}
            onComplete={(data) => handleStageComplete(2, data)}
            onBack={() => handleStageBack(1)}
            isLiveMode={isLiveMode}
          />
        )
      case 3:
        return (
          <Stage3DecisionProcess
            initialData={session.stages[3].data}
            onComplete={(data) => handleStageComplete(3, data)}
            onBack={() => handleStageBack(2)}
            isLiveMode={isLiveMode}
          />
        )
      case 4:
        return (
          <Stage4Prioritise
            initialData={session.stages[4].data}
            onComplete={(data) => handleStageComplete(4, data)}
            onBack={() => handleStageBack(3)}
            isLiveMode={isLiveMode}
          />
        )
      case 5:
        return (
          <Stage5SolutionScope
            initialData={session.stages[5].data}
            coiData={session.stages[1].data?.coi}
            prioritisationData={session.stages[4].data}
            clientName={session.clientName}
            onComplete={(data) => handleStageComplete(5, data)}
            onBack={() => handleStageBack(4)}
            isLiveMode={isLiveMode}
          />
        )
      case 6:
        return (
          <Stage6Validate
            initialData={session.stages[6].data}
            onComplete={(data) => handleStageComplete(6, data)}
            onBack={() => handleStageBack(5)}
            isLiveMode={isLiveMode}
          />
        )
      case 7:
        return (
          <Stage7Commit
            initialData={session.stages[7].data}
            onComplete={(data) => handleStageComplete(7, data)}
            onBack={() => handleStageBack(6)}
            isLiveMode={isLiveMode}
          />
        )
      case 8:
        return (
          <Stage8Communicate
            initialData={session.stages[8].data}
            solutionScopeData={session.stages[5].data}
            resourcesData={session.stages[2].data}
            coiData={session.stages[1].data?.coi}
            onComplete={(data) => handleStageComplete(8, data)}
            onBack={() => handleStageBack(7)}
            isLiveMode={isLiveMode}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0078D4]">Enterprise Discovery</h1>
          {session.clientName && (
            <p className="text-muted-foreground mt-1">
              {session.clientName} • {session.discoveryType.replace('-', ' ')}
            </p>
          )}
        </div>
        
        {/* Session Control Bar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <SessionControlBar
            sessionId={session.id}
            clientName={session.clientName}
            currentStage={currentStage}
            isLiveMode={isLiveMode}
            onToggleLiveMode={handleToggleLiveMode}
            onPauseSession={handlePauseSession}
            onEndSession={handleEndSession}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            lastSaved={lastSaved}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <DiscoverySettingsDialog open={showSettings} onOpenChange={setShowSettings} />

      {/* Stage Navigator */}
      <StageNavigator
        stages={stages}
        currentStageId={currentStage}
        onStageClick={(id) => {
          if (id <= currentStage || stages[id].status === 'completed') {
            handleStageBack(id)
          }
        }}
      />

      {/* Critical Yellow Lights Alert */}
      {criticalYellowLights.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalYellowLights.length} critical concern{criticalYellowLights.length > 1 ? 's' : ''} requiring
            attention before proceeding
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">{renderStage()}</div>

        {/* Sidebar - Yellow Lights */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <YellowLightsDashboard
              yellowLights={session.allYellowLights}
              onResolve={handleResolveYellowLight}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  )
}