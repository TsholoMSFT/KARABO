/**
 * Stage 5b: Cost Impact
 * 
 * Captures cost-side value drivers with detailed metric chain inputs and FTE equivalents.
 * Auto-populates baseline from Stage 1 COI direct costs.
 * 
 * Cost Drivers:
 * 1. Labour Efficiency (Hours × Loaded Cost × Volume)
 * 2. Error Reduction (Error Rate × Volume × Cost per Error)
 * 3. Infrastructure Savings (Current - Future Spend)
 * 4. Vendor Consolidation (Vendors × Cost - Consolidated)
 * 5. Process Automation (Manual - Automated × Volume)
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  PiggyBank,
  Clock,
  AlertTriangle,
  Server,
  Building2,
  Cog,
  Info,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  CostImpactDriver,
  CostDriverType,
  CostOfInaction,
} from '@/lib/types'
import {
  calculateCostDriver,
  coiToCostImpact,
  COST_DRIVER_INFO,
  INDUSTRY_BENCHMARKS,
} from '@/lib/financial-mapping'
import { formatCurrency } from '@/lib/financial-calculations'

interface Stage5bCostImpactProps {
  initialData?: {
    drivers: CostImpactDriver[]
    totalAnnualSavings: number
    totalFTEEquivalent: number
    sourceFromCOI: boolean
  }
  coiData?: CostOfInaction
  onComplete: (data: {
    drivers: CostImpactDriver[]
    totalAnnualSavings: number
    totalFTEEquivalent: number
    sourceFromCOI: boolean
  }) => void
  onBack: () => void
}

// Icons for each driver type
const DRIVER_ICONS: Record<CostDriverType, React.ReactNode> = {
  'labour-efficiency': <Clock className="h-5 w-5" />,
  'error-reduction': <AlertTriangle className="h-5 w-5" />,
  'infrastructure': <Server className="h-5 w-5" />,
  'vendor-consolidation': <Building2 className="h-5 w-5" />,
  'automation': <Cog className="h-5 w-5" />,
}

// Create default empty driver for each type
function createDefaultDriver(type: CostDriverType): CostImpactDriver {
  return {
    id: `cost-${type}-${Date.now()}`,
    type,
    enabled: false,
    inputs: {},
    calculatedAnnualValue: 0,
    fteEquivalent: 0,
    plLine: type === 'labour-efficiency' || type === 'error-reduction' ? 'cogs' : 'opex',
  }
}

export function Stage5bCostImpact({
  initialData,
  coiData,
  onComplete,
  onBack,
}: Stage5bCostImpactProps) {
  // Initialize drivers
  const [drivers, setDrivers] = useState<CostImpactDriver[]>(() => {
    if (initialData?.drivers && initialData.drivers.length > 0) {
      return initialData.drivers
    }
    
    return [
      createDefaultDriver('labour-efficiency'),
      createDefaultDriver('error-reduction'),
      createDefaultDriver('infrastructure'),
      createDefaultDriver('vendor-consolidation'),
      createDefaultDriver('automation'),
    ]
  })
  
  const [hasAutoPopulated, setHasAutoPopulated] = useState(initialData?.sourceFromCOI || false)
  
  // Auto-populate from COI
  useEffect(() => {
    if (coiData && !hasAutoPopulated && !initialData?.sourceFromCOI) {
      const coiDrivers = coiToCostImpact(coiData)
      
      if (coiDrivers.length > 0) {
        setDrivers(prev => {
          const updated = [...prev]
          const labourIndex = updated.findIndex(d => d.type === 'labour-efficiency')
          if (labourIndex >= 0 && coiDrivers[0]) {
            updated[labourIndex] = {
              ...updated[labourIndex],
              enabled: true,
              calculatedAnnualValue: coiDrivers[0].calculatedAnnualValue || 0,
              fteEquivalent: coiDrivers[0].fteEquivalent || 0,
              notes: coiDrivers[0].notes,
            }
          }
          return updated
        })
        setHasAutoPopulated(true)
      }
    }
  }, [coiData, hasAutoPopulated, initialData?.sourceFromCOI])
  
  // Recalculate values when inputs change
  const driversWithCalculations = useMemo(() => {
    return drivers.map(driver => {
      if (!driver.enabled) {
        return { ...driver, calculatedAnnualValue: 0, fteEquivalent: 0 }
      }
      const { annualValue, fteEquivalent } = calculateCostDriver(driver)
      return {
        ...driver,
        calculatedAnnualValue: annualValue,
        fteEquivalent,
      }
    })
  }, [drivers])
  
  // Totals
  const totalAnnualSavings = useMemo(() => {
    return driversWithCalculations
      .filter(d => d.enabled)
      .reduce((sum, d) => sum + d.calculatedAnnualValue, 0)
  }, [driversWithCalculations])
  
  const totalFTEEquivalent = useMemo(() => {
    return driversWithCalculations
      .filter(d => d.enabled)
      .reduce((sum, d) => sum + d.fteEquivalent, 0)
  }, [driversWithCalculations])
  
  // Update inputs
  const updateDriverInputs = (
    type: CostDriverType,
    inputKey: string,
    value: number
  ) => {
    setDrivers(prev =>
      prev.map(d =>
        d.type === type
          ? { ...d, inputs: { ...d.inputs, [inputKey]: value } }
          : d
      )
    )
  }
  
  // Toggle driver
  const toggleDriver = (type: CostDriverType, enabled: boolean) => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, enabled } : d))
    )
  }
  
  // Update P&L line assignment
  const updatePLLine = (type: CostDriverType, plLine: 'cogs' | 'opex') => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, plLine } : d))
    )
  }
  
  // Update notes
  const updateDriverNotes = (type: CostDriverType, notes: string) => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, notes } : d))
    )
  }
  
  const handleComplete = () => {
    onComplete({
      drivers: driversWithCalculations,
      totalAnnualSavings,
      totalFTEEquivalent,
      sourceFromCOI: hasAutoPopulated,
    })
  }
  
  // Render input with hint
  const renderInput = (
    label: string,
    value: number | undefined,
    onChange: (value: number) => void,
    hint?: string,
    prefix?: string,
    suffix?: string
  ) => (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={hint}
          className="flex-1"
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          {hint}
        </p>
      )}
    </div>
  )
  
  // Render driver inputs based on type
  const renderDriverInputs = (driver: CostImpactDriver) => {
    const { type, inputs } = driver
    
    switch (type) {
      case 'labour-efficiency':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Hours Saved per Task',
              inputs.hoursSavedPerTask,
              (v) => updateDriverInputs(type, 'hoursSavedPerTask', v),
              '0.5-4 hours typical'
            )}
            {renderInput(
              'Fully Loaded Hourly Cost',
              inputs.fullyLoadedHourlyCost,
              (v) => updateDriverInputs(type, 'fullyLoadedHourlyCost', v),
              INDUSTRY_BENCHMARKS.fullyLoadedCosts.senior.hint,
              '$'
            )}
            {renderInput(
              'Tasks per Month',
              inputs.tasksPerMonth,
              (v) => updateDriverInputs(type, 'tasksPerMonth', v)
            )}
          </div>
        )
      
      case 'error-reduction':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput(
              'Current Error Rate',
              inputs.currentErrorRate,
              (v) => updateDriverInputs(type, 'currentErrorRate', v),
              '1-5% typical',
              undefined,
              '%'
            )}
            {renderInput(
              'Target Error Rate',
              inputs.newErrorRate,
              (v) => updateDriverInputs(type, 'newErrorRate', v),
              undefined,
              undefined,
              '%'
            )}
            {renderInput(
              'Monthly Transaction Volume',
              inputs.transactionVolume,
              (v) => updateDriverInputs(type, 'transactionVolume', v)
            )}
            {renderInput(
              'Cost per Error (rework)',
              inputs.costPerError,
              (v) => updateDriverInputs(type, 'costPerError', v),
              '$50-500 typical',
              '$'
            )}
          </div>
        )
      
      case 'infrastructure':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput(
              'Current Monthly Spend',
              inputs.currentMonthlySpend,
              (v) => updateDriverInputs(type, 'currentMonthlySpend', v),
              undefined,
              '$'
            )}
            {renderInput(
              'Future Monthly Spend',
              inputs.futureMonthlySpend,
              (v) => updateDriverInputs(type, 'futureMonthlySpend', v),
              undefined,
              '$'
            )}
          </div>
        )
      
      case 'vendor-consolidation':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Current # of Vendors',
              inputs.vendorCount,
              (v) => updateDriverInputs(type, 'vendorCount', v)
            )}
            {renderInput(
              'Annual Cost per Vendor',
              inputs.costPerVendor,
              (v) => updateDriverInputs(type, 'costPerVendor', v),
              undefined,
              '$'
            )}
            {renderInput(
              'Consolidated Annual Cost',
              inputs.consolidatedCost,
              (v) => updateDriverInputs(type, 'consolidatedCost', v),
              undefined,
              '$'
            )}
          </div>
        )
      
      case 'automation':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Manual Cost per Process',
              inputs.manualCostPerProcess,
              (v) => updateDriverInputs(type, 'manualCostPerProcess', v),
              undefined,
              '$'
            )}
            {renderInput(
              'Automated Cost per Process',
              inputs.automatedCostPerProcess,
              (v) => updateDriverInputs(type, 'automatedCostPerProcess', v),
              undefined,
              '$'
            )}
            {renderInput(
              'Monthly Process Volume',
              inputs.processVolume,
              (v) => updateDriverInputs(type, 'processVolume', v)
            )}
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="gap-1">
            <span className="font-semibold">5b</span>
          </Badge>
          <span className="text-muted-foreground">of 3 sub-steps</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4] flex items-center gap-3">
          <PiggyBank className="h-8 w-8" />
          Cost Impact
        </h2>
        <p className="text-muted-foreground mt-2">
          Identify and quantify cost savings. For transparency, each driver shows the FTE equivalent 
          of time saved (note: this represents capacity freed, not headcount reduction).
        </p>
      </div>
      
      {/* COI Auto-population Alert */}
      {hasAutoPopulated && (
        <Alert className="border-[#0078D4]/30 bg-[#0078D4]/5">
          <Sparkles className="h-4 w-4 text-[#0078D4]" />
          <AlertDescription className="text-sm">
            <strong>Baseline from Stage 1:</strong> Initial values have been pre-populated from 
            your Cost of Inaction analysis. Review and refine the metric chain inputs below.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Summary Card */}
      <Card className="border-2 border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Annual Cost Savings</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalAnnualSavings, 'USD')}
              </p>
            </div>
            <div className="text-center px-6 border-x">
              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">FTE Equivalent</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {totalFTEEquivalent.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">capacity freed</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {driversWithCalculations.filter(d => d.enabled).length} of 5 drivers active
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maps to: COGS or OpEx on P&L
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Driver Accordions */}
      <Accordion type="multiple" className="space-y-4">
        {driversWithCalculations.map((driver) => {
          const info = COST_DRIVER_INFO[driver.type]
          const Icon = DRIVER_ICONS[driver.type]
          
          return (
            <AccordionItem
              key={driver.id}
              value={driver.type}
              className={cn(
                'border rounded-lg px-4',
                driver.enabled && 'border-green-500/50 bg-green-50/50'
              )}
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        driver.enabled ? 'bg-green-600 text-white' : 'bg-muted'
                      )}
                    >
                      {Icon}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold flex items-center gap-2">
                        {info.label}
                        {driver.notes && (
                          <Badge variant="outline" className="text-xs font-normal">
                            From COI
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {driver.enabled && driver.calculatedAnnualValue > 0 && (
                      <div className="text-right">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(driver.calculatedAnnualValue, 'USD')}
                        </span>
                        {driver.fteEquivalent > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {driver.fteEquivalent.toFixed(1)} FTE
                          </p>
                        )}
                      </div>
                    )}
                    <Switch
                      checked={driver.enabled}
                      onCheckedChange={(checked) => toggleDriver(driver.type, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="pb-4">
                <div className="space-y-4 pt-2">
                  {/* Metric Chain Formula */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Metric Chain:
                    </p>
                    <p className="text-sm font-mono">
                      {driver.type === 'labour-efficiency' && 'Hours Saved × Fully Loaded Cost × Tasks × 12 months'}
                      {driver.type === 'error-reduction' && '(Current Error % - New Error %) × Volume × 12 × Cost per Error'}
                      {driver.type === 'infrastructure' && '(Current Monthly - Future Monthly) × 12 months'}
                      {driver.type === 'vendor-consolidation' && '(Vendors × Cost per Vendor) - Consolidated Cost'}
                      {driver.type === 'automation' && '(Manual Cost - Automated Cost) × Volume × 12 months'}
                    </p>
                  </div>
                  
                  {/* Input Fields */}
                  {renderDriverInputs(driver)}
                  
                  {/* P&L Line Assignment */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm">P&L Line Assignment</Label>
                    <RadioGroup
                      value={driver.plLine}
                      onValueChange={(v) => updatePLLine(driver.type, v as 'cogs' | 'opex')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cogs" id={`${driver.type}-cogs`} />
                        <Label htmlFor={`${driver.type}-cogs`} className="text-sm font-normal">
                          COGS (Cost of Goods Sold)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="opex" id={`${driver.type}-opex`} />
                        <Label htmlFor={`${driver.type}-opex`} className="text-sm font-normal">
                          OpEx (Operating Expenses)
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {info.plLine}
                    </p>
                  </div>
                  
                  {/* Calculated Results */}
                  {driver.enabled && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <span className="text-sm font-medium">Calculated Annual Savings:</span>
                        {driver.fteEquivalent > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Equivalent to {driver.fteEquivalent.toFixed(2)} FTEs capacity freed
                          </p>
                        )}
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(driver.calculatedAnnualValue, 'USD')}/year
                      </span>
                    </div>
                  )}
                  
                  {/* Notes */}
                  <div className="space-y-1">
                    <Label className="text-sm">Notes / Assumptions</Label>
                    <Textarea
                      value={driver.notes || ''}
                      onChange={(e) => updateDriverNotes(driver.type, e.target.value)}
                      placeholder="Document key assumptions or data sources..."
                      className="h-20"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
      
      {/* FTE Explanation */}
      <Card className="bg-amber-50/50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <Info className="h-4 w-4" />
            About FTE Equivalents
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900/80">
          <p>
            FTE equivalents represent <strong>capacity freed</strong> through efficiency gains, 
            not headcount reductions. This capacity can be redeployed to higher-value activities. 
            Based on {INDUSTRY_BENCHMARKS.annualHoursPerFTE.toLocaleString()} productive hours per FTE per year 
            (47 weeks × 40 hours).
          </p>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Revenue
        </Button>
        <Button
          onClick={handleComplete}
          className="gap-2 bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Continue to Balance Sheet
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
