import { cn } from '@/lib/utils'
import { Check, Clock, SkipForward } from 'lucide-react'
import type { TabCompletionStatus } from '@/lib/types'

interface TabInfo {
  id: string
  label: string
  status: TabCompletionStatus
}

interface TabCompletionIndicatorProps {
  tabs: TabInfo[]
  currentTab: string
  onTabClick?: (tabId: string) => void
  className?: string
}

export function TabCompletionIndicator({ 
  tabs, 
  currentTab, 
  onTabClick,
  className 
}: TabCompletionIndicatorProps) {
  const getStatusIcon = (status: TabCompletionStatus) => {
    switch (status) {
      case 'complete':
        return <Check className="h-3 w-3 text-green-600" />
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-500" />
      case 'skipped':
        return <SkipForward className="h-3 w-3 text-muted-foreground" />
      default:
        return null
    }
  }

  const getStatusColor = (status: TabCompletionStatus, isActive: boolean) => {
    if (isActive) return 'border-[#0078D4] bg-[#0078D4]/10'
    switch (status) {
      case 'complete':
        return 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
      case 'pending':
        return 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
      case 'skipped':
        return 'border-muted bg-muted/50'
      default:
        return 'border-border'
    }
  }

  const completedCount = tabs.filter(t => t.status === 'complete').length
  const totalCount = tabs.length

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Progress: {completedCount}/{totalCount} sections complete</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" /> Complete
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <SkipForward className="h-3 w-3 text-muted-foreground" /> Skipped
          </span>
        </div>
      </div>

      {/* Tab indicators */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabClick?.(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                getStatusColor(tab.status, isActive),
                onTabClick && 'cursor-pointer hover:opacity-80',
                !onTabClick && 'cursor-default'
              )}
            >
              {getStatusIcon(tab.status)}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
