/**
 * Metric Hierarchy View Component
 * 
 * Displays how activity metrics roll up to strategic outcomes:
 * Activity → Operational → Financial → Strategic
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, BarChart3, Activity, Zap, ArrowRight, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetricHierarchy } from '@/lib/types'

interface MetricHierarchyViewProps {
  data: MetricHierarchy
  compact?: boolean
}

// Level configuration
const LEVELS = [
  {
    key: 'activity',
    label: 'Activity Metrics',
    description: 'Team Level',
    icon: Zap,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeColor: 'bg-orange-100 text-orange-800',
  },
  {
    key: 'operational',
    label: 'Operational Metrics',
    description: 'Business Unit',
    icon: Activity,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-800',
  },
  {
    key: 'financial',
    label: 'Financial Metrics',
    description: 'CFO/Finance',
    icon: BarChart3,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    key: 'strategic',
    label: 'Strategic Outcome',
    description: 'Board/CEO',
    icon: Target,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
] as const

export function MetricHierarchyView({ data, compact = false }: MetricHierarchyViewProps) {
  if (!data.strategicOutcome) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No metric hierarchy defined</p>
          <p className="text-sm">Complete Stage 5c to build the metric hierarchy</p>
        </CardContent>
      </Card>
    )
  }
  
  const getMetrics = (key: string): string[] => {
    if (key === 'strategic') return [data.strategicOutcome]
    return data[`${key}Metrics` as keyof MetricHierarchy] as string[] || []
  }
  
  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {LEVELS.map((level, index) => {
          const metrics = getMetrics(level.key)
          const LevelIcon = level.icon
          
          return (
            <div key={level.key} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border',
                level.bgColor,
                level.borderColor
              )}>
                <LevelIcon className={cn('h-4 w-4', level.textColor)} />
                <div>
                  <p className={cn('text-xs font-medium', level.textColor)}>{level.label}</p>
                  <p className="text-sm font-semibold">
                    {level.key === 'strategic' ? metrics[0] : `${metrics.length} metrics`}
                  </p>
                </div>
              </div>
              {index < LEVELS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  // Full vertical view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#0078D4]" />
          Metric Hierarchy
        </CardTitle>
        <CardDescription>
          How activity-level improvements roll up to strategic outcomes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {LEVELS.map((level, index) => {
          const metrics = getMetrics(level.key)
          const LevelIcon = level.icon
          
          if (metrics.length === 0) return null
          
          return (
            <div key={level.key} className="relative">
              {/* Connector line */}
              {index < LEVELS.length - 1 && (
                <div className="absolute left-6 top-full h-4 w-0.5 bg-muted-foreground/20" />
              )}
              
              <div className={cn(
                'flex gap-4 p-4 rounded-lg border',
                level.bgColor,
                level.borderColor
              )}>
                {/* Icon */}
                <div className={cn(
                  'shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  level.badgeColor
                )}>
                  <LevelIcon className={cn('h-6 w-6', level.textColor)} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={cn('font-semibold', level.textColor)}>{level.label}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {level.description}
                    </Badge>
                  </div>
                  
                  {level.key === 'strategic' ? (
                    <p className="text-lg font-bold">{metrics[0]}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {metrics.map((metric, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={cn('font-normal', level.borderColor)}
                        >
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Arrow */}
                {index < LEVELS.length - 1 && (
                  <div className="shrink-0 flex items-center">
                    <ArrowRight className={cn('h-5 w-5', level.textColor)} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Explanation */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg mt-4">
          <p>
            <strong>Reading the hierarchy:</strong> Improvements in activity metrics 
            (e.g., documents processed, hours per task) drive operational metrics 
            (e.g., cycle time, error rate), which flow to financial results 
            (e.g., revenue growth, margin improvement), ultimately achieving strategic outcomes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
