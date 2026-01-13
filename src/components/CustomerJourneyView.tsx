import { useState, useCallback, useMemo } from 'react'
import {
  CustomerJourney,
  CustomerJourneyMilestone,
  JourneyEdit,
  ENGAGEMENT_DEFAULTS,
  calculateJourneyDuration,
  InnovationHubEngagement
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowCounterClockwise,
  CheckCircle,
  Circle,
  DotsSixVertical,
  Lightning,
  Lightbulb,
  Pencil,
  Eye,
  ArrowsDownUp,
  Clock,
  Package,
  TreeStructure
} from '@phosphor-icons/react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CustomerJourneyViewProps {
  journey: CustomerJourney
  onUpdate: (journey: CustomerJourney) => void
  colorScheme?: 'primary' | 'green' | 'orange'
  className?: string
}

const ENGAGEMENT_COLORS: Record<InnovationHubEngagement, { bg: string; text: string; border: string }> = {
  'business-envisioning': { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' },
  'solution-envisioning': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
  'architecture-design': { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/30' },
  'rapid-prototype': { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' }
}

const ENGAGEMENT_ICONS: Record<InnovationHubEngagement, React.ReactNode> = {
  'business-envisioning': <Lightbulb size={16} weight="duotone" />,
  'solution-envisioning': <TreeStructure size={16} weight="duotone" />,
  'architecture-design': <Package size={16} weight="duotone" />,
  'rapid-prototype': <Lightning size={16} weight="duotone" />
}

export function CustomerJourneyView({
  journey,
  onUpdate,
  colorScheme = 'primary',
  className = ''
}: CustomerJourneyViewProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)

  // Calculate total duration dynamically
  const totalDuration = useMemo(() => calculateJourneyDuration(journey.milestones), [journey.milestones])

  // Save edit to history for undo
  const saveToHistory = useCallback(
    (action: JourneyEdit['action'], description: string, previousMilestones: CustomerJourneyMilestone[]) => {
      const edit: JourneyEdit = {
        id: `edit-${Date.now()}`,
        timestamp: Date.now(),
        action,
        previousState: previousMilestones.map(m => ({ ...m })),
        description
      }
      const newHistory = [...journey.editHistory, edit].slice(-20) // Keep last 20 edits
      return newHistory
    },
    [journey.editHistory]
  )

  // Undo last edit
  const handleUndo = useCallback(() => {
    if (journey.editHistory.length === 0) return

    const lastEdit = journey.editHistory[journey.editHistory.length - 1]
    onUpdate({
      ...journey,
      milestones: lastEdit.previousState,
      editHistory: journey.editHistory.slice(0, -1),
      updatedAt: Date.now()
    })
  }, [journey, onUpdate])

  // Toggle milestone completion
  const handleToggleComplete = useCallback(
    (milestoneId: string) => {
      const previousMilestones = journey.milestones.map(m => ({ ...m }))
      const milestone = journey.milestones.find(m => m.id === milestoneId)
      if (!milestone) return

      const updatedMilestones = journey.milestones.map(m =>
        m.id === milestoneId
          ? { ...m, isComplete: !m.isComplete, completedAt: !m.isComplete ? Date.now() : undefined }
          : m
      )

      onUpdate({
        ...journey,
        milestones: updatedMilestones,
        editHistory: saveToHistory('complete', `Toggled completion for "${milestone.title}"`, previousMilestones),
        updatedAt: Date.now()
      })
    },
    [journey, onUpdate, saveToHistory]
  )

  // Update milestone duration
  const handleUpdateDuration = useCallback(
    (milestoneId: string, duration: string) => {
      const previousMilestones = journey.milestones.map(m => ({ ...m }))
      const updatedMilestones = journey.milestones.map(m =>
        m.id === milestoneId ? { ...m, duration } : m
      )

      onUpdate({
        ...journey,
        milestones: updatedMilestones,
        totalDuration: calculateJourneyDuration(updatedMilestones),
        editHistory: saveToHistory('duration', `Updated duration`, previousMilestones),
        updatedAt: Date.now()
      })
    },
    [journey, onUpdate, saveToHistory]
  )

  // Update milestone notes
  const handleUpdateNotes = useCallback(
    (milestoneId: string, notes: string) => {
      const previousMilestones = journey.milestones.map(m => ({ ...m }))
      const updatedMilestones = journey.milestones.map(m =>
        m.id === milestoneId ? { ...m, notes } : m
      )

      onUpdate({
        ...journey,
        milestones: updatedMilestones,
        editHistory: saveToHistory('notes', `Updated notes`, previousMilestones),
        updatedAt: Date.now()
      })
    },
    [journey, onUpdate, saveToHistory]
  )

  // Update deliverables
  const handleUpdateDeliverables = useCallback(
    (milestoneId: string, deliverables: string[]) => {
      const previousMilestones = journey.milestones.map(m => ({ ...m }))
      const updatedMilestones = journey.milestones.map(m =>
        m.id === milestoneId ? { ...m, deliverables } : m
      )

      onUpdate({
        ...journey,
        milestones: updatedMilestones,
        editHistory: saveToHistory('deliverables', `Updated deliverables`, previousMilestones),
        updatedAt: Date.now()
      })
    },
    [journey, onUpdate, saveToHistory]
  )

  // Handle reorder
  const handleReorder = useCallback(
    (newOrder: CustomerJourneyMilestone[]) => {
      const previousMilestones = journey.milestones.map(m => ({ ...m }))
      const updatedMilestones = newOrder.map((m, index) => ({ ...m, order: index + 1 }))

      onUpdate({
        ...journey,
        milestones: updatedMilestones,
        editHistory: saveToHistory('reorder', `Reordered milestones`, previousMilestones),
        updatedAt: Date.now()
      })
    },
    [journey, onUpdate, saveToHistory]
  )

  // Get color classes based on scheme
  const getSchemeClasses = () => {
    switch (colorScheme) {
      case 'green':
        return { border: 'border-brand-green/30', accent: 'text-brand-green', bg: 'bg-brand-green/10' }
      case 'orange':
        return { border: 'border-brand-orange/30', accent: 'text-brand-orange', bg: 'bg-brand-orange/10' }
      default:
        return { border: 'border-primary/30', accent: 'text-primary', bg: 'bg-primary/10' }
    }
  }

  const schemeClasses = getSchemeClasses()
  const completedCount = journey.milestones.filter(m => m.isComplete).length

  return (
    <Card className={cn(`border-2 ${schemeClasses.border}`, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', schemeClasses.bg)}>
              <ArrowsDownUp size={20} weight="duotone" className={schemeClasses.accent} />
            </div>
            <div>
              <CardTitle className="text-lg">Customer Journey</CardTitle>
              <CardDescription>
                Innovation Hub engagement roadmap • {totalDuration}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress indicator */}
            <Badge variant="outline" className="gap-1">
              <CheckCircle size={14} weight={completedCount === journey.milestones.length ? 'fill' : 'regular'} />
              {completedCount}/{journey.milestones.length}
            </Badge>

            {/* Undo button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleUndo}
                    disabled={journey.editHistory.length === 0}
                    className="h-8 w-8"
                  >
                    <ArrowCounterClockwise size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {journey.editHistory.length > 0
                    ? `Undo: ${journey.editHistory[journey.editHistory.length - 1].description}`
                    : 'No actions to undo'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Edit/View mode toggle */}
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="gap-2"
            >
              {isEditMode ? (
                <>
                  <Eye size={14} />
                  View
                </>
              ) : (
                <>
                  <Pencil size={14} />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Timeline visualization */}
        <div className="relative">
          {isEditMode ? (
            <Reorder.Group
              axis="y"
              values={journey.milestones}
              onReorder={handleReorder}
              className="space-y-4"
            >
              {journey.milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  isLast={index === journey.milestones.length - 1}
                  isEditMode={isEditMode}
                  isEditing={editingMilestoneId === milestone.id}
                  onToggleEdit={() => setEditingMilestoneId(editingMilestoneId === milestone.id ? null : milestone.id)}
                  onToggleComplete={() => handleToggleComplete(milestone.id)}
                  onUpdateDuration={(duration) => handleUpdateDuration(milestone.id, duration)}
                  onUpdateNotes={(notes) => handleUpdateNotes(milestone.id, notes)}
                  onUpdateDeliverables={(deliverables) => handleUpdateDeliverables(milestone.id, deliverables)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="space-y-4">
              {journey.milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  isLast={index === journey.milestones.length - 1}
                  isEditMode={false}
                  isEditing={false}
                  onToggleEdit={() => {}}
                  onToggleComplete={() => handleToggleComplete(milestone.id)}
                  onUpdateDuration={() => {}}
                  onUpdateNotes={() => {}}
                  onUpdateDeliverables={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* Generation info */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Generated by {journey.generatedBy === 'ai' ? 'AI' : 'user'} •{' '}
            {new Date(journey.createdAt).toLocaleDateString()}
          </span>
          {journey.updatedAt && (
            <span>Last updated: {new Date(journey.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MILESTONE CARD COMPONENT
// ============================================================================

interface MilestoneCardProps {
  milestone: CustomerJourneyMilestone
  index: number
  isLast: boolean
  isEditMode: boolean
  isEditing: boolean
  onToggleEdit: () => void
  onToggleComplete: () => void
  onUpdateDuration: (duration: string) => void
  onUpdateNotes: (notes: string) => void
  onUpdateDeliverables: (deliverables: string[]) => void
}

function MilestoneCard({
  milestone,
  index,
  isLast,
  isEditMode,
  isEditing,
  onToggleEdit,
  onToggleComplete,
  onUpdateDuration,
  onUpdateNotes,
  onUpdateDeliverables
}: MilestoneCardProps) {
  const colors = ENGAGEMENT_COLORS[milestone.engagement]
  const icon = ENGAGEMENT_ICONS[milestone.engagement]
  const engagementInfo = ENGAGEMENT_DEFAULTS[milestone.engagement]

  const CardWrapper = isEditMode ? Reorder.Item : motion.div

  return (
    <CardWrapper
      value={milestone}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative pl-8',
        isEditMode && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Timeline node */}
      <div
        className={cn(
          'absolute left-0 top-3 w-6 h-6 rounded-full flex items-center justify-center border-2',
          milestone.isComplete
            ? 'bg-green-500 border-green-500 text-white'
            : `${colors.bg} ${colors.border} ${colors.text}`
        )}
      >
        {milestone.isComplete ? (
          <CheckCircle size={14} weight="fill" />
        ) : (
          <span className="text-xs font-medium">{index + 1}</span>
        )}
      </div>

      {/* Milestone content */}
      <Card className={cn('border', colors.border, milestone.isComplete && 'opacity-70')}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {isEditMode && (
                <DotsSixVertical
                  size={20}
                  className="text-muted-foreground mt-1 flex-shrink-0"
                />
              )}
              <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', colors.bg)}>
                <span className={colors.text}>{icon}</span>
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {milestone.title}
                  <Badge variant="outline" className={cn('text-xs', colors.text, colors.border)}>
                    {engagementInfo.title}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-1 line-clamp-2">
                  {milestone.description}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="gap-1">
                <Clock size={12} />
                {isEditing ? (
                  <Input
                    value={milestone.duration}
                    onChange={(e) => onUpdateDuration(e.target.value)}
                    className="h-5 w-20 text-xs p-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  milestone.duration
                )}
              </Badge>

              <Checkbox
                checked={milestone.isComplete}
                onCheckedChange={() => onToggleComplete()}
                className="h-5 w-5"
              />

              {isEditMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onToggleEdit}
                >
                  <Pencil size={12} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          {/* Deliverables */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Deliverables:</span>
            {isEditing ? (
              <Textarea
                value={milestone.deliverables.join('\n')}
                onChange={(e) => onUpdateDeliverables(e.target.value.split('\n').filter(Boolean))}
                className="text-xs min-h-[80px]"
                placeholder="One deliverable per line"
              />
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {milestone.deliverables.map((deliverable, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Circle size={6} weight="fill" className="mt-1.5 flex-shrink-0 opacity-50" />
                    {deliverable}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes (editable) */}
          <AnimatePresence>
            {(isEditing || milestone.notes) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t"
              >
                {isEditing ? (
                  <Textarea
                    value={milestone.notes || ''}
                    onChange={(e) => onUpdateNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="text-xs min-h-[60px]"
                  />
                ) : (
                  milestone.notes && (
                    <p className="text-xs text-muted-foreground italic">{milestone.notes}</p>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}

export default CustomerJourneyView
