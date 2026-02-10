import { useState, useMemo } from 'react'
import { DiscoverySession, EnterpriseDiscoverySession } from '@/lib/types'
import { useDiscovery } from '@/hooks/use-discovery'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { industryLabels } from '@/lib/discovery-questions'
import { exportEnterpriseDiscoveryToPDF } from '@/lib/enterprise-pdf-export'
import { exportEnterpriseDiscoveryToExcel } from '@/lib/enterprise-excel-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Clock, Trash, Eye, ArrowsLeftRight, FolderOpen, X, PencilSimple, CalendarBlank, Play, FileArrowDown, Briefcase } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SessionManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewSession: (session: DiscoverySession) => void
  onCompareSessions: (sessions: DiscoverySession[]) => void
  onResumeEnterpriseSession?: (session: EnterpriseDiscoverySession) => void
}

export function SessionManager({ open, onOpenChange, onViewSession, onCompareSessions, onResumeEnterpriseSession }: SessionManagerProps) {
  const { sessions, deleteSession, updateSession } = useDiscovery()
  const [enterpriseSessions, setEnterpriseSessions] = useLocalStorage<EnterpriseDiscoverySession[]>('enterprise-sessions', [])
  const [activeTab, setActiveTab] = useState<'quick' | 'enterprise'>('quick')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set())
  const [comparisonMode, setComparisonMode] = useState(false)
  const [editingSession, setEditingSession] = useState<DiscoverySession | null>(null)
  const [editFormData, setEditFormData] = useState<{ name: string; date: Date | undefined }>({ 
    name: '', 
    date: undefined 
  })

  const handleDelete = (sessionId: string) => {
    deleteSession(sessionId)
    setDeleteConfirmId(null)
    setSelectedForComparison((current) => {
      const newSet = new Set(current)
      newSet.delete(sessionId)
      return newSet
    })
    toast.success('Session deleted')
  }

  const handleToggleComparison = (sessionId: string) => {
    setSelectedForComparison((current) => {
      const newSet = new Set(current)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        if (newSet.size >= 3) {
          toast.error('You can compare up to 3 sessions at a time')
          return current
        }
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const handleCompare = () => {
    const sessionsToCompare = sessions.filter((s) => selectedForComparison.has(s.id))
    if (sessionsToCompare.length < 2) {
      toast.error('Please select at least 2 sessions to compare')
      return
    }
    onCompareSessions(sessionsToCompare)
    onOpenChange(false)
  }

  const handleEdit = (session: DiscoverySession) => {
    setEditingSession(session)
    setEditFormData({ 
      name: session.name, 
      date: new Date(session.createdAt) 
    })
  }

  const handleSaveEdit = () => {
    if (!editingSession || !editFormData.name.trim()) {
      toast.error('Session name is required')
      return
    }

    const updates: Partial<DiscoverySession> = {
      name: editFormData.name,
      createdAt: editFormData.date ? editFormData.date.getTime() : editingSession.createdAt
    }

    updateSession(editingSession.id, updates)
    setEditingSession(null)
    toast.success('Session updated successfully')
  }

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode)
    setSelectedForComparison(new Set())
  }

  if (!open) return null

  const sortedSessions = [...sessions].sort((a, b) => b.createdAt - a.createdAt)
  const sortedEnterpriseSessions = useMemo(() => 
    [...(enterpriseSessions || [])].sort((a, b) => b.createdAt - a.createdAt),
    [enterpriseSessions]
  )

  const handleDeleteEnterpriseSession = (sessionId: string) => {
    setEnterpriseSessions(prev => (prev || []).filter(s => s.id !== sessionId))
    toast.success('Enterprise session deleted')
  }

  const handleExportEnterprisePDF = async (session: EnterpriseDiscoverySession) => {
    try {
      const fileName = await exportEnterpriseDiscoveryToPDF(session)
      toast.success('PDF exported', { description: fileName })
    } catch (e) {
      toast.error('Failed to export PDF')
    }
  }

  const handleExportEnterpriseExcel = (session: EnterpriseDiscoverySession) => {
    try {
      const fileName = exportEnterpriseDiscoveryToExcel(session)
      toast.success('Excel exported', { description: fileName })
    } catch (e) {
      toast.error('Failed to export Excel')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] z-50"
          >
            <Card className="border-2">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FolderOpen size={28} weight="duotone" className="text-primary" />
                      Discovery Sessions
                    </CardTitle>
                    <CardDescription>
                      View, manage, and compare your saved discovery sessions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {sortedSessions.length > 1 && (
                      <Button 
                        variant={comparisonMode ? "default" : "outline"} 
                        size="sm"
                        onClick={toggleComparisonMode}
                        className="gap-2"
                      >
                        <ArrowsLeftRight size={18} />
                        {comparisonMode ? 'Exit Compare' : 'Compare Mode'}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                      <X size={20} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'enterprise')}>
                  <div className="px-6 pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="quick" className="gap-2">
                        <FolderOpen size={16} />
                        Discovery ({sortedSessions.length})
                      </TabsTrigger>
                      <TabsTrigger value="enterprise" className="gap-2">
                        <Briefcase size={16} />
                        Enterprise ({sortedEnterpriseSessions.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="quick" className="mt-0">
                {sortedSessions.length === 0 ? (
                  <div className="py-16 text-center">
                    <FolderOpen size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Sessions Yet</h3>
                    <p className="text-muted-foreground">
                      Start a discovery process to create your first session
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="p-6 space-y-3">
                      {sortedSessions.map((session) => {
                        const isSelected = selectedForComparison.has(session.id)
                        const responseCount = session.responses.length
                        const useCaseCount = session.suggestedUseCases?.length || 0

                        return (
                          <motion.div
                            key={session.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Card
                              className={`transition-all hover:shadow-md ${
                                isSelected ? 'border-primary border-2 bg-primary/5' : 'border-border'
                              }`}
                            >
                              <CardHeader>
                                <div className="flex items-start gap-4">
                                  {comparisonMode && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleComparison(session.id)}
                                      className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                      aria-label={`Select ${session.name} for comparison`}
                                    />
                                  )}
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg">{session.name}</CardTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {session.industry && (
                                            <Badge variant="outline" className="text-xs">
                                              {industryLabels[session.industry]}
                                            </Badge>
                                          )}
                                          <Badge variant="secondary" className="text-xs">
                                            {responseCount} response{responseCount !== 1 ? 's' : ''}
                                          </Badge>
                                          {useCaseCount > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                              {useCaseCount} use case{useCaseCount !== 1 ? 's' : ''}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <Clock size={14} />
                                          {format(session.createdAt, 'MMM d, yyyy h:mm a')}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        {!comparisonMode && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(session)}
                                            className="gap-1.5"
                                          >
                                            <PencilSimple size={16} />
                                            Edit
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            onViewSession(session)
                                            onOpenChange(false)
                                          }}
                                          className="gap-1.5"
                                        >
                                          <Eye size={16} />
                                          View
                                        </Button>
                                        {!comparisonMode && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteConfirmId(session.id)}
                                            className="gap-1.5 text-destructive hover:text-destructive"
                                          >
                                            <Trash size={16} />
                                            Delete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
                  </TabsContent>

                  <TabsContent value="enterprise" className="mt-0">
                    {sortedEnterpriseSessions.length === 0 ? (
                      <div className="py-16 text-center">
                        <Briefcase size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Enterprise Sessions</h3>
                        <p className="text-muted-foreground">
                          Start a Strategic Assessment to see sessions here
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <div className="p-6 space-y-3">
                          {sortedEnterpriseSessions.map((session) => {
                            const completedStages = Object.values(session.stages).filter(s => s.status === 'completed').length
                            const isComplete = session.completedAt !== undefined

                            return (
                              <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <Card className={`transition-all hover:shadow-md ${isComplete ? 'border-green-500/50' : 'border-amber-500/50'}`}>
                                  <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          {session.clientName || 'Unnamed Client'}
                                          {isComplete ? (
                                            <Badge className="bg-green-500 text-xs">Completed</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-500 text-xs">In Progress</Badge>
                                          )}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge variant="outline" className="text-xs">
                                            {session.discoveryType.replace('-', ' ')}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            {completedStages}/9 stages
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <Clock size={14} />
                                          {format(session.createdAt, 'MMM d, yyyy h:mm a')}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        {!isComplete && onResumeEnterpriseSession && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              onResumeEnterpriseSession(session)
                                              onOpenChange(false)
                                            }}
                                            className="gap-1.5 text-[#0078D4]"
                                          >
                                            <Play size={16} />
                                            Resume
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleExportEnterprisePDF(session)}
                                          className="gap-1.5"
                                        >
                                          <FileArrowDown size={16} />
                                          PDF
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleExportEnterpriseExcel(session)}
                                          className="gap-1.5"
                                        >
                                          <FileArrowDown size={16} />
                                          Excel
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteEnterpriseSession(session.id)}
                                          className="gap-1.5 text-destructive hover:text-destructive"
                                        >
                                          <Trash size={16} />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                </Card>
                              </motion.div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>

              {sortedSessions.length > 0 && comparisonMode && (
                <CardFooter className="border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedForComparison.size > 0 ? (
                      <>
                        {selectedForComparison.size} session{selectedForComparison.size !== 1 ? 's' : ''} selected
                        for comparison
                      </>
                    ) : (
                      'Select 2-3 sessions to compare'
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleComparisonMode}>
                      Cancel
                    </Button>
                    {selectedForComparison.size >= 2 && (
                      <Button onClick={handleCompare} className="gap-2">
                        <ArrowsLeftRight size={18} />
                        Compare {selectedForComparison.size} Sessions
                      </Button>
                    )}
                  </div>
                </CardFooter>
              )}
            </Card>
          </motion.div>

          <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this discovery session. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={editingSession !== null} onOpenChange={(open) => !open && setEditingSession(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Session</DialogTitle>
                <DialogDescription>
                  Update the session name and date
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input
                    id="session-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter session name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editFormData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarBlank size={16} className="mr-2" />
                        {editFormData.date ? format(editFormData.date, "PPP p") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.date}
                        onSelect={(date) => setEditFormData({ ...editFormData, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingSession(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  )
}
