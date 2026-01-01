import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YellowLight, YellowLightSeverity } from '@/lib/types'
import { format } from 'date-fns'

interface YellowLightsDashboardProps {
  yellowLights: YellowLight[]
  onResolve: (id: string) => void
  compact?: boolean
}

const severityConfig: Record<YellowLightSeverity, { label: string; color: string; icon: typeof AlertTriangle }> = {
  minor: { label: 'Minor', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  serious: { label: 'Serious', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  'deal-breaker': { label: 'Deal Breaker', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function YellowLightsDashboard({ yellowLights, onResolve, compact = false }: YellowLightsDashboardProps) {
  const unresolvedLights = yellowLights.filter(l => !l.resolved)
  const resolvedLights = yellowLights.filter(l => l.resolved)
  const criticalCount = unresolvedLights.filter(l => l.severity === 'serious' || l.severity === 'deal-breaker').length

  if (compact) {
    return (
      <Card className={cn('border-l-4', criticalCount > 0 ? 'border-l-red-500' : 'border-l-yellow-500')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Yellow Lights</CardTitle>
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} Critical
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {unresolvedLights.length} Active
              </Badge>
            </div>
          </div>
        </CardHeader>
        {unresolvedLights.length > 0 && (
          <CardContent className="space-y-2">
            {unresolvedLights.slice(0, 3).map((light) => {
              const config = severityConfig[light.severity]
              return (
                <div key={light.id} className="flex items-start gap-2 text-sm">
                  <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>
                  <span className="flex-1 line-clamp-1">{light.description}</span>
                  <Button variant="ghost" size="sm" onClick={() => onResolve(light.id)} className="h-6 px-2">
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
            {unresolvedLights.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">+{unresolvedLights.length - 3} more</p>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Yellow Lights Dashboard</h3>
          <p className="text-sm text-muted-foreground">Track concerns across all discovery stages</p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive">{criticalCount} Critical Issues</Badge>
          )}
          <Badge variant="secondary">{unresolvedLights.length} Active Concerns</Badge>
        </div>
      </div>

      {/* Unresolved Lights */}
      {unresolvedLights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Concerns</CardTitle>
            <CardDescription>Issues requiring attention before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unresolvedLights.map((light) => {
              const config = severityConfig[light.severity]
              return (
                <Card key={light.id} className={cn('border-l-4', config.color.replace('bg-', 'border-l-'))}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={config.color}>{config.label}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {light.stageIdentified}
                          </Badge>
                        </div>
                        <p className="font-medium">{light.description}</p>
                        <p className="text-sm text-muted-foreground">{light.resolutionPlan}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Owner: {light.owner}</span>
                          {light.dueDate && <span>Due: {format(new Date(light.dueDate), 'PP')}</span>}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolve(light.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Resolved Lights */}
      {resolvedLights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resolved Concerns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resolvedLights.map((light) => (
              <div key={light.id} className="flex items-start gap-2 text-sm opacity-60">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="flex-1">{light.description}</span>
                <Badge variant="outline" className="text-xs">
                  {light.stageIdentified}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {unresolvedLights.length === 0 && resolvedLights.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p>No concerns identified</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}