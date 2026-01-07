/**
 * Manual Architecture Selector Component
 * Fallback UI for when AI-powered architecture selection is unavailable
 * Allows users to manually select reference architectures and Microsoft solutions
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  REFERENCE_ARCHITECTURES,
  PRODUCT_FAMILY_LABELS,
  PRODUCT_FAMILY_COLORS,
  COMPLEXITY_INDICATORS,
  AZURE_AI_SERVICES,
  AZURE_DATA_SERVICES,
  POWER_PLATFORM_SERVICES,
  M365_SERVICES,
  SECURITY_SERVICES,
  DYNAMICS_365_MODULES,
  FABRIC_WORKLOADS,
  type ReferenceArchitecturePattern,
  type MicrosoftSolutionMapping,
  type MicrosoftProductFamily,
} from '@/lib/microsoft-solutions'
import type { Industry } from '@/lib/types'
import {
  Warning,
  Graph,
  CaretRight,
  CheckCircle,
  Robot,
  Info,
  ArrowSquareOut,
} from '@phosphor-icons/react'

// Combined services lookup for all product families
const ALL_SERVICES: Record<string, { label: string; description: string; productFamily: MicrosoftProductFamily }> = {
  ...Object.fromEntries(Object.entries(AZURE_AI_SERVICES).map(([k, v]) => [k, { ...v, productFamily: 'azure-ai' as MicrosoftProductFamily }])),
  ...Object.fromEntries(Object.entries(AZURE_DATA_SERVICES).map(([k, v]) => [k, { ...v, productFamily: 'azure-data' as MicrosoftProductFamily }])),
  ...Object.fromEntries(Object.entries(POWER_PLATFORM_SERVICES).map(([k, v]) => [k, { ...v, productFamily: 'power-platform' as MicrosoftProductFamily }])),
  ...Object.fromEntries(Object.entries(M365_SERVICES).map(([k, v]) => [k, { ...v, productFamily: 'm365' as MicrosoftProductFamily }])),
  ...Object.fromEntries(Object.entries(SECURITY_SERVICES).map(([k, v]) => [k, { ...v, productFamily: 'security' as MicrosoftProductFamily }])),
  ...Object.fromEntries(Object.entries(DYNAMICS_365_MODULES).map(([k, v]) => [k, { ...v, productFamily: 'dynamics-365' as MicrosoftProductFamily }])),
  ...Object.fromEntries(Object.entries(FABRIC_WORKLOADS).map(([k, v]) => [k, { ...v, productFamily: 'fabric' as MicrosoftProductFamily }])),
}

interface ManualArchitectureSelectorProps {
  industry?: Industry
  currentPattern?: ReferenceArchitecturePattern
  currentSolutions?: MicrosoftSolutionMapping[]
  useCaseTitle?: string
  useCaseDescription?: string
  onSelect: (
    pattern: ReferenceArchitecturePattern,
    solutions: MicrosoftSolutionMapping[]
  ) => void
  onCancel?: () => void
  showWarning?: boolean
}

// Get recommended architectures for an industry
function getRecommendedArchitectures(industry?: string): ReferenceArchitecturePattern[] {
  if (!industry) {
    return Object.keys(REFERENCE_ARCHITECTURES) as ReferenceArchitecturePattern[]
  }
  
  return (Object.entries(REFERENCE_ARCHITECTURES) as [ReferenceArchitecturePattern, typeof REFERENCE_ARCHITECTURES[ReferenceArchitecturePattern]][])
    .filter(([, info]) => info.industries.includes(industry))
    .map(([pattern]) => pattern)
}

// Get product family from service ID
function getServiceProductFamily(serviceId: string): MicrosoftProductFamily | null {
  const service = ALL_SERVICES[serviceId]
  return service?.productFamily || null
}

export function ManualArchitectureSelector({
  industry,
  currentPattern,
  currentSolutions = [],
  useCaseTitle,
  useCaseDescription,
  onSelect,
  onCancel,
  showWarning = true,
}: ManualArchitectureSelectorProps) {
  const [selectedPattern, setSelectedPattern] = useState<ReferenceArchitecturePattern | undefined>(currentPattern)
  const [selectedServices, setSelectedServices] = useState<string[]>(
    currentSolutions.flatMap(s => s.services)
  )
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended')

  // Get recommended patterns for the industry
  const recommendedPatterns = useMemo(() => getRecommendedArchitectures(industry), [industry])
  const allPatterns = Object.keys(REFERENCE_ARCHITECTURES) as ReferenceArchitecturePattern[]
  
  const displayPatterns = activeTab === 'recommended' ? recommendedPatterns : allPatterns

  // Get architecture info for selected pattern
  const selectedArchitecture = selectedPattern ? REFERENCE_ARCHITECTURES[selectedPattern] : null

  // Build solution mappings from selected services
  const buildSolutionMappings = (): MicrosoftSolutionMapping[] => {
    const familyMap = new Map<MicrosoftProductFamily, string[]>()
    
    selectedServices.forEach(serviceId => {
      const family = getServiceProductFamily(serviceId)
      if (family) {
        if (!familyMap.has(family)) {
          familyMap.set(family, [])
        }
        familyMap.get(family)!.push(serviceId)
      }
    })

    return Array.from(familyMap.entries()).map(([family, services], idx) => ({
      productFamily: family,
      services,
      role: idx === 0 ? 'primary' : 'supporting' as const,
      justification: 'Manually selected during discovery',
    }))
  }

  const handleConfirm = () => {
    if (selectedPattern) {
      onSelect(selectedPattern, buildSolutionMappings())
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    )
  }

  // Auto-select typical services when pattern changes
  const handlePatternChange = (pattern: ReferenceArchitecturePattern) => {
    setSelectedPattern(pattern)
    const arch = REFERENCE_ARCHITECTURES[pattern]
    if (arch) {
      setSelectedServices(arch.typicalServices)
    }
  }

  return (
    <Card className="border-2 border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader>
        {showWarning && (
          <Alert variant="default" className="mb-4 border-amber-300 bg-amber-100/50 dark:bg-amber-900/30">
            <Warning size={16} className="text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>AI Architecture Selection Unavailable</strong>
              <p className="text-sm mt-1">
                Please manually select a reference architecture and Microsoft solutions for this use case.
                Your selection will be saved and can be updated later.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Graph size={24} weight="duotone" className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle>Select Reference Architecture</CardTitle>
            <CardDescription>
              Choose the best-fit Microsoft architecture pattern for this use case
            </CardDescription>
          </div>
        </div>

        {useCaseTitle && (
          <div className="mt-4 p-3 rounded-lg bg-background/50 border">
            <p className="text-sm font-medium">{useCaseTitle}</p>
            {useCaseDescription && (
              <p className="text-xs text-muted-foreground mt-1">{useCaseDescription}</p>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Architecture Pattern Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">1. Choose Architecture Pattern</Label>
            {industry && (
              <Badge variant="outline" className="text-xs">
                Filtered for {industry}
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recommended' | 'all')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommended">
                Recommended ({recommendedPatterns.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Patterns ({allPatterns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <RadioGroup
                value={selectedPattern}
                onValueChange={(v) => handlePatternChange(v as ReferenceArchitecturePattern)}
                className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
              >
                {displayPatterns.map(pattern => {
                  const arch = REFERENCE_ARCHITECTURES[pattern]
                  const complexity = COMPLEXITY_INDICATORS[arch.complexity]
                  const isSelected = selectedPattern === pattern

                  return (
                    <motion.div
                      key={pattern}
                      initial={false}
                      animate={{ 
                        borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      }}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                        isSelected ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => handlePatternChange(pattern)}
                    >
                      <RadioGroupItem value={pattern} id={pattern} className="mt-1" />
                      <Label htmlFor={pattern} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{arch.label}</span>
                          {arch.agenticPotential === 'high' && (
                            <Badge variant="outline" className="text-xs bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900 dark:text-violet-300">
                              <Robot size={10} className="mr-1" />
                              Agentic
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{arch.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {arch.primaryProducts.map(p => (
                            <Badge
                              key={p}
                              variant="secondary"
                              className={`text-xs ${PRODUCT_FAMILY_COLORS[p]}`}
                            >
                              {PRODUCT_FAMILY_LABELS[p]}
                            </Badge>
                          ))}
                          <Badge variant="outline" className={`text-xs ${complexity.color}`}>
                            {complexity.label}
                          </Badge>
                        </div>
                        {arch.msLearnUrl && (
                          <a
                            href={arch.msLearnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          >
                            <ArrowSquareOut size={12} />
                            Learn more
                          </a>
                        )}
                      </Label>
                      {isSelected && (
                        <CheckCircle size={20} weight="fill" className="text-primary mt-1" />
                      )}
                    </motion.div>
                  )
                })}
              </RadioGroup>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Microsoft Solutions Selection */}
        <AnimatePresence>
          {selectedArchitecture && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">2. Configure Microsoft Solutions</Label>
                <Badge variant="secondary" className="text-xs">
                  {selectedServices.length} selected
                </Badge>
              </div>

              <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/50 dark:border-blue-800">
                <Info size={16} className="text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm">
                  Typical services for <strong>{selectedArchitecture.label}</strong> have been pre-selected.
                  Adjust as needed for your specific requirements.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                {selectedArchitecture.primaryProducts.map(family => {
                  const familyServices = Object.entries(ALL_SERVICES)
                    .filter(([, service]) => service.productFamily === family)
                    .map(([id]) => id)

                  return (
                    <div key={family} className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium text-sm mb-3">
                        {PRODUCT_FAMILY_LABELS[family]}
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {familyServices.slice(0, 10).map(serviceId => {
                          const service = ALL_SERVICES[serviceId]
                          const isTypical = selectedArchitecture.typicalServices.includes(serviceId)
                          
                          return (
                            <div key={serviceId} className="flex items-center space-x-2">
                              <Checkbox
                                id={serviceId}
                                checked={selectedServices.includes(serviceId)}
                                onCheckedChange={() => toggleService(serviceId)}
                              />
                              <Label
                                htmlFor={serviceId}
                                className="text-sm cursor-pointer flex items-center gap-1"
                              >
                                {service.label}
                                {isTypical && (
                                  <span className="text-xs text-muted-foreground">(typical)</span>
                                )}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!selectedPattern}
            className="flex-1 gap-2"
          >
            <CheckCircle size={16} />
            Confirm Selection
            {selectedPattern && (
              <CaretRight size={16} />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ManualArchitectureSelector
