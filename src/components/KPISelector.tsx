import { useState } from 'react'
import { AVAILABLE_KPIS, KPI_CATEGORIES, getKPIById } from '@/lib/kpis'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Check } from '@phosphor-icons/react'

interface KPISelectorProps {
  selectedKPIs: string[]
  onChange: (kpis: string[]) => void
  maxSelection?: number
}

export function KPISelector({ selectedKPIs, onChange, maxSelection }: KPISelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const toggleKPI = (kpiId: string) => {
    if (selectedKPIs.includes(kpiId)) {
      onChange(selectedKPIs.filter((id) => id !== kpiId))
    } else {
      if (maxSelection && selectedKPIs.length >= maxSelection) {
        return
      }
      onChange([...selectedKPIs, kpiId])
    }
  }

  const filteredKPIs =
    activeCategory === 'all'
      ? AVAILABLE_KPIS
      : AVAILABLE_KPIS.filter((kpi) => kpi.category === activeCategory)

  const getCategoryColor = (category: string) => {
    const cat = KPI_CATEGORIES.find((c) => c.value === category)
    return cat?.color || 'oklch(0.5 0.1 240)'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Select KPIs & Metrics</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose metrics this use case will impact {maxSelection ? `(max ${maxSelection})` : ''}
          </p>
        </div>
        {selectedKPIs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="h-8 gap-1.5"
          >
            <X size={16} />
            Clear
          </Button>
        )}
      </div>

      {selectedKPIs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedKPIs.map((kpiId) => {
            const kpi = getKPIById(kpiId)
            if (!kpi) return null
            return (
              <Badge
                key={kpiId}
                variant="secondary"
                className="gap-1.5 pr-1.5 py-1"
                style={{
                  backgroundColor: getCategoryColor(kpi.category) + '20',
                  color: getCategoryColor(kpi.category),
                  borderColor: getCategoryColor(kpi.category) + '40',
                }}
              >
                {kpi.name}
                <button
                  onClick={() => toggleKPI(kpiId)}
                  className="hover:bg-black/10 rounded-full p-0.5"
                >
                  <X size={12} weight="bold" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          {KPI_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-3">
              {filteredKPIs.map((kpi) => {
                const isSelected = selectedKPIs.includes(kpi.id)
                const isDisabled =
                  !isSelected && maxSelection ? selectedKPIs.length >= maxSelection : false

                return (
                  <div
                    key={kpi.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-accent/10 border-accent/40'
                        : 'bg-card border-border hover:bg-muted/30'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !isDisabled && toggleKPI(kpi.id)}
                  >
                    <Checkbox
                      id={kpi.id}
                      checked={isSelected}
                      disabled={isDisabled}
                      className="mt-0.5"
                      onCheckedChange={() => !isDisabled && toggleKPI(kpi.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={kpi.id}
                        className={`text-sm font-medium cursor-pointer ${
                          isDisabled ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        {kpi.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{kpi.description}</p>
                      <Badge
                        variant="outline"
                        className="text-xs mt-1"
                        style={{
                          backgroundColor: getCategoryColor(kpi.category) + '15',
                          borderColor: getCategoryColor(kpi.category) + '40',
                          color: getCategoryColor(kpi.category),
                        }}
                      >
                        {KPI_CATEGORIES.find((c) => c.value === kpi.category)?.label}
                      </Badge>
                    </div>
                    {isSelected && (
                      <Check size={20} weight="bold" className="text-accent flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
