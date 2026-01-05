import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Trash2, Sparkles, User, Users, Target, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Stakeholder, StakeholderType, StakeholderDisposition, AccessLevel } from '@/lib/types'

interface StakeholderGridProps {
  stakeholders: Stakeholder[]
  onAdd: (stakeholder: Stakeholder) => void
  onUpdate: (id: string, updates: Partial<Stakeholder>) => void
  onRemove: (id: string) => void
  onAISuggest: () => void
  isAISuggesting?: boolean
  className?: string
}

const STAKEHOLDER_TYPE_CONFIG: Record<StakeholderType, { label: string; icon: React.ElementType; color: string }> = {
  'economic-buyer': { label: 'Economic Buyer', icon: Target, color: 'text-green-600 bg-green-50' },
  'technical-evaluator': { label: 'Technical Evaluator', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
  'user-buyer': { label: 'User Buyer', icon: User, color: 'text-purple-600 bg-purple-50' },
  'influencer': { label: 'Influencer', icon: Users, color: 'text-amber-600 bg-amber-50' },
  'blocker': { label: 'Blocker', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
}

const DISPOSITION_CONFIG: Record<StakeholderDisposition, { label: string; color: string }> = {
  'champion': { label: 'Champion', color: 'bg-green-500' },
  'supportive': { label: 'Supportive', color: 'bg-green-300' },
  'neutral': { label: 'Neutral', color: 'bg-gray-400' },
  'skeptical': { label: 'Skeptical', color: 'bg-amber-400' },
  'opposed': { label: 'Opposed', color: 'bg-red-500' },
  'unknown': { label: 'Unknown', color: 'bg-gray-300' },
}

const ACCESS_LABELS: Record<AccessLevel, string> = {
  'direct': 'Direct Access',
  'indirect': 'Indirect Access',
  'none': 'No Access',
}

export function StakeholderGrid({
  stakeholders,
  onAdd,
  onUpdate,
  onRemove,
  onAISuggest,
  isAISuggesting = false,
  className,
}: StakeholderGridProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({
    name: '',
    role: '',
    type: 'influencer',
    disposition: 'unknown',
    accessLevel: 'indirect',
    keyConcern: '',
  })

  const handleAddStakeholder = () => {
    if (newStakeholder.name && newStakeholder.role) {
      onAdd({
        id: `stakeholder-${Date.now()}`,
        name: newStakeholder.name,
        role: newStakeholder.role,
        type: newStakeholder.type || 'influencer',
        disposition: newStakeholder.disposition || 'unknown',
        accessLevel: newStakeholder.accessLevel || 'indirect',
        keyConcern: newStakeholder.keyConcern || '',
      })
      setNewStakeholder({
        name: '',
        role: '',
        type: 'influencer',
        disposition: 'unknown',
        accessLevel: 'indirect',
        keyConcern: '',
      })
      setIsAddingNew(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with AI suggest button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Stakeholder Map</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Map key stakeholders involved in the decision. Identify their role, disposition, and access level.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAISuggest}
            disabled={isAISuggesting}
            className="gap-1"
          >
            <Sparkles className="h-4 w-4" />
            {isAISuggesting ? 'Suggesting...' : 'AI Suggest'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Stakeholder
          </Button>
        </div>
      </div>

      {/* Stakeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stakeholders.map((stakeholder) => {
          const typeConfig = STAKEHOLDER_TYPE_CONFIG[stakeholder.type]
          const dispositionConfig = DISPOSITION_CONFIG[stakeholder.disposition]
          const TypeIcon = typeConfig.icon

          return (
            <Card key={stakeholder.id} className="relative">
              <CardContent className="pt-4 pb-3 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded', typeConfig.color)}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <Input
                        value={stakeholder.name}
                        onChange={(e) => onUpdate(stakeholder.id, { name: e.target.value })}
                        className="h-7 text-sm font-medium border-0 p-0 focus-visible:ring-0"
                        placeholder="Name"
                      />
                      <Input
                        value={stakeholder.role}
                        onChange={(e) => onUpdate(stakeholder.id, { role: e.target.value })}
                        className="h-6 text-xs text-muted-foreground border-0 p-0 focus-visible:ring-0"
                        placeholder="Role/Title"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(stakeholder.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Type and disposition row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={stakeholder.type}
                    onValueChange={(v) => onUpdate(stakeholder.id, { type: v as StakeholderType })}
                  >
                    <SelectTrigger className="h-7 text-xs w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAKEHOLDER_TYPE_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={stakeholder.disposition}
                    onValueChange={(v) => onUpdate(stakeholder.id, { disposition: v as StakeholderDisposition })}
                  >
                    <SelectTrigger className="h-7 text-xs w-auto">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-2 h-2 rounded-full', dispositionConfig.color)} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DISPOSITION_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className={cn('w-2 h-2 rounded-full', config.color)} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Badge variant="outline" className="text-xs">
                    {ACCESS_LABELS[stakeholder.accessLevel]}
                  </Badge>
                </div>

                {/* Key concern */}
                <Input
                  value={stakeholder.keyConcern}
                  onChange={(e) => onUpdate(stakeholder.id, { keyConcern: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Key concern or priority..."
                />
              </CardContent>
            </Card>
          )
        })}

        {/* Add new stakeholder card */}
        {isAddingNew && (
          <Card className="border-dashed border-[#0078D4]">
            <CardContent className="pt-4 pb-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newStakeholder.name}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                  placeholder="Name"
                  className="h-8"
                />
                <Input
                  value={newStakeholder.role}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                  placeholder="Role/Title"
                  className="h-8"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={newStakeholder.type}
                  onValueChange={(v) => setNewStakeholder({ ...newStakeholder, type: v as StakeholderType })}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAKEHOLDER_TYPE_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newStakeholder.disposition}
                  onValueChange={(v) => setNewStakeholder({ ...newStakeholder, disposition: v as StakeholderDisposition })}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISPOSITION_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddStakeholder}
                  disabled={!newStakeholder.name || !newStakeholder.role}
                  className="bg-[#0078D4] hover:bg-[#106EBE]"
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {stakeholders.length === 0 && !isAddingNew && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No stakeholders mapped yet.</p>
          <p className="text-xs mt-1">Click "AI Suggest" to get started or add manually.</p>
        </div>
      )}
    </div>
  )
}
