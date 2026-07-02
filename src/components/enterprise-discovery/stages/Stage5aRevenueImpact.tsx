/**
 * Stage 5a: Revenue Impact
 * 
 * Captures revenue-side value drivers with detailed metric chain inputs.
 * Auto-populates baseline from Stage 1 COI opportunity costs.
 * 
 * Revenue Drivers:
 * 1. More Customers (Leads × Conversion × Deal Size)
 * 2. Higher Prices/Margins (Price × Volume - Discount)
 * 3. Faster Sales Cycle (Pipeline × Win Rate × Cycle Reduction)
 * 4. Reduced Churn (Customers × Churn Reduction × LTV)
 * 5. Upsell/Cross-sell (Customers × Expansion Rate × ARPU)
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  UserMinus, 
  ArrowUpRight,
  Info,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  RevenueImpactDriver, 
  RevenueDriverType, 
  CostOfInaction,
} from '@/lib/types'
import {
  calculateRevenueDriver,
  coiToRevenueImpact,
  REVENUE_DRIVER_INFO,
  INDUSTRY_BENCHMARKS,
} from '@/lib/financial-mapping'
import { formatCurrency } from '@/lib/financial-calculations'

interface Stage5aRevenueImpactProps {
  initialData?: {
    drivers: RevenueImpactDriver[]
    totalAnnualRevenue: number
    sourceFromCOI: boolean
  }
  coiData?: CostOfInaction // From Stage 1 for auto-population
  onComplete: (data: {
    drivers: RevenueImpactDriver[]
    totalAnnualRevenue: number
    sourceFromCOI: boolean
  }) => void
  onBack: () => void
}

// Icons for each driver type
const DRIVER_ICONS: Record<RevenueDriverType, React.ReactNode> = {
  'customer-acquisition': <Users className="h-5 w-5" />,
  'margin-improvement': <DollarSign className="h-5 w-5" />,
  'sales-cycle': <Clock className="h-5 w-5" />,
  'churn-reduction': <UserMinus className="h-5 w-5" />,
  'upsell-crosssell': <ArrowUpRight className="h-5 w-5" />,
}

// Create default empty driver for each type
function createDefaultDriver(type: RevenueDriverType): RevenueImpactDriver {
  return {
    id: `revenue-${type}-${Date.now()}`,
    type,
    enabled: false,
    inputs: {},
    calculatedAnnualValue: 0,
    plLine: 'revenue',
  }
}

export function Stage5aRevenueImpact({
  initialData,
  coiData,
  onComplete,
  onBack,
}: Stage5aRevenueImpactProps) {
  // Initialize drivers - either from saved data or create defaults
  const [drivers, setDrivers] = useState<RevenueImpactDriver[]>(() => {
    if (initialData?.drivers && initialData.drivers.length > 0) {
      return initialData.drivers
    }
    
    // Create default drivers for each type
    const defaultDrivers: RevenueImpactDriver[] = [
      createDefaultDriver('customer-acquisition'),
      createDefaultDriver('margin-improvement'),
      createDefaultDriver('sales-cycle'),
      createDefaultDriver('churn-reduction'),
      createDefaultDriver('upsell-crosssell'),
    ]
    
    return defaultDrivers
  })
  
  const [hasAutoPopulated, setHasAutoPopulated] = useState(initialData?.sourceFromCOI || false)
  
  // Auto-populate from COI on first load if COI data exists and not already populated
  useEffect(() => {
    if (coiData && !hasAutoPopulated && !initialData?.sourceFromCOI) {
      const coiDrivers = coiToRevenueImpact(coiData)
      
      if (coiDrivers.length > 0) {
        setDrivers(prev => {
          const updated = [...prev]
          // Update customer-acquisition driver with COI baseline
          const custAcqIndex = updated.findIndex(d => d.type === 'customer-acquisition')
          if (custAcqIndex >= 0 && coiDrivers[0]) {
            updated[custAcqIndex] = {
              ...updated[custAcqIndex],
              enabled: true,
              calculatedAnnualValue: coiDrivers[0].calculatedAnnualValue || 0,
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
    return drivers.map(driver => ({
      ...driver,
      calculatedAnnualValue: driver.enabled ? calculateRevenueDriver(driver) : 0,
    }))
  }, [drivers])
  
  // Total annual revenue impact
  const totalAnnualRevenue = useMemo(() => {
    return driversWithCalculations
      .filter(d => d.enabled)
      .reduce((sum, d) => sum + d.calculatedAnnualValue, 0)
  }, [driversWithCalculations])
  
  // Update a driver's inputs
  const updateDriverInputs = (
    type: RevenueDriverType,
    inputKey: string,
    value: number | string
  ) => {
    setDrivers(prev =>
      prev.map(d =>
        d.type === type
          ? {
              ...d,
              inputs: {
                ...d.inputs,
                [inputKey]: typeof value === 'string' ? parseFloat(value) || 0 : value,
              },
            }
          : d
      )
    )
  }
  
  // Toggle driver enabled state
  const toggleDriver = (type: RevenueDriverType, enabled: boolean) => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, enabled } : d))
    )
  }
  
  // Update driver notes
  const updateDriverNotes = (type: RevenueDriverType, notes: string) => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, notes } : d))
    )
  }
  
  const handleComplete = () => {
    onComplete({
      drivers: driversWithCalculations,
      totalAnnualRevenue,
      sourceFromCOI: hasAutoPopulated,
    })
  }
  
  // Render input field with hint
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
  
  // Render each driver type's input form
  const renderDriverInputs = (driver: RevenueImpactDriver) => {
    const { type, inputs } = driver
    
    switch (type) {
      case 'customer-acquisition':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Annual New Leads',
              inputs.leads,
              (v) => updateDriverInputs(type, 'leads', v),
              INDUSTRY_BENCHMARKS.conversionRates.general.hint
            )}
            {renderInput(
              'Conversion Rate',
              inputs.conversionRate,
              (v) => updateDriverInputs(type, 'conversionRate', v),
              '2-5% typical B2B',
              undefined,
              '%'
            )}
            {renderInput(
              'Average Deal Size',
              inputs.avgDealSize,
              (v) => updateDriverInputs(type, 'avgDealSize', v),
              undefined,
              '$'
            )}
          </div>
        )
      
      case 'margin-improvement':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Price Increase',
              inputs.priceIncrease,
              (v) => updateDriverInputs(type, 'priceIncrease', v),
              '1-5% typical',
              undefined,
              '%'
            )}
            {renderInput(
              'Annual Volume (units)',
              inputs.volume,
              (v) => updateDriverInputs(type, 'volume', v)
            )}
            {renderInput(
              'Discount Reduction',
              inputs.discountReduction,
              (v) => updateDriverInputs(type, 'discountReduction', v),
              '1-3% typical',
              undefined,
              '%'
            )}
          </div>
        )
      
      case 'sales-cycle':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput(
              'Annual Pipeline Value',
              inputs.pipelineValue,
              (v) => updateDriverInputs(type, 'pipelineValue', v),
              undefined,
              '$'
            )}
            {renderInput(
              'Win Rate',
              inputs.winRate,
              (v) => updateDriverInputs(type, 'winRate', v),
              '20-40% typical',
              undefined,
              '%'
            )}
            {renderInput(
              'Current Cycle (days)',
              inputs.currentCycleDays,
              (v) => updateDriverInputs(type, 'currentCycleDays', v),
              '30-90 days typical'
            )}
            {renderInput(
              'New Cycle (days)',
              inputs.newCycleDays,
              (v) => updateDriverInputs(type, 'newCycleDays', v)
            )}
          </div>
        )
      
      case 'churn-reduction':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput(
              'Total Customers',
              inputs.customerCount,
              (v) => updateDriverInputs(type, 'customerCount', v)
            )}
            {renderInput(
              'Current Annual Churn',
              inputs.currentChurnRate,
              (v) => updateDriverInputs(type, 'currentChurnRate', v),
              INDUSTRY_BENCHMARKS.churnRates.general.hint,
              undefined,
              '%'
            )}
            {renderInput(
              'Target Annual Churn',
              inputs.newChurnRate,
              (v) => updateDriverInputs(type, 'newChurnRate', v),
              undefined,
              undefined,
              '%'
            )}
            {renderInput(
              'Customer Lifetime Value',
              inputs.customerLTV,
              (v) => updateDriverInputs(type, 'customerLTV', v),
              undefined,
              '$'
            )}
          </div>
        )
      
      case 'upsell-crosssell':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Existing Customers',
              inputs.existingCustomers,
              (v) => updateDriverInputs(type, 'existingCustomers', v)
            )}
            {renderInput(
              'Expansion Rate',
              inputs.expansionRate,
              (v) => updateDriverInputs(type, 'expansionRate', v),
              '10-30% typical',
              undefined,
              '%'
            )}
            {renderInput(
              'Average Revenue Per User',
              inputs.arpu,
              (v) => updateDriverInputs(type, 'arpu', v),
              undefined,
              '$'
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
            <span className="font-semibold">5a</span>
          </Badge>
          <span className="text-muted-foreground">of 3 sub-steps</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4] flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          Revenue Impact
        </h2>
        <p className="text-muted-foreground mt-2">
          Identify and quantify revenue-generating opportunities. Enable each driver that applies 
          and enter the metric chain inputs.
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
      <Card className="border-2 border-[#0078D4]/20 bg-gradient-to-r from-[#0078D4]/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Annual Revenue Impact</p>
              <p className="text-3xl font-bold text-[#0078D4]">
                {formatCurrency(totalAnnualRevenue, 'USD')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {driversWithCalculations.filter(d => d.enabled).length} of 5 drivers active
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maps to: Revenue line on P&L
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Driver Accordions */}
      <Accordion type="multiple" className="space-y-4">
        {driversWithCalculations.map((driver) => {
          const info = REVENUE_DRIVER_INFO[driver.type]
          const Icon = DRIVER_ICONS[driver.type]
          
          return (
            <AccordionItem
              key={driver.id}
              value={driver.type}
              className={cn(
                'border rounded-lg px-4',
                driver.enabled && 'border-[#0078D4]/50 bg-[#0078D4]/5'
              )}
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        driver.enabled ? 'bg-[#0078D4] text-white' : 'bg-muted'
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
                      <span className="text-lg font-semibold text-[#0078D4]">
                        {formatCurrency(driver.calculatedAnnualValue, 'USD')}
                      </span>
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
                      {driver.type === 'customer-acquisition' && 'Leads × Conversion Rate × Average Deal Size'}
                      {driver.type === 'margin-improvement' && '(Price Increase % + Discount Reduction %) × Volume × Base Price'}
                      {driver.type === 'sales-cycle' && 'Pipeline × Win Rate × (Cycle Reduction ÷ New Cycle)'}
                      {driver.type === 'churn-reduction' && 'Customers × (Old Churn - New Churn) × LTV'}
                      {driver.type === 'upsell-crosssell' && 'Existing Customers × Expansion Rate × ARPU'}
                    </p>
                  </div>
                  
                  {/* Input Fields */}
                  {renderDriverInputs(driver)}
                  
                  {/* Calculated Result */}
                  {driver.enabled && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm font-medium">Calculated Annual Value:</span>
                      <span className="text-xl font-bold text-[#0078D4]">
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
      
      {/* P&L Line Mapping Info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            P&L Statement Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            All revenue impact drivers map to the <strong>Revenue</strong> line on the Income Statement (P&L). 
            Margin improvements also affect <strong>Gross Profit</strong> through reduced discounting.
          </p>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          className="gap-2 bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Continue to Cost Impact
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
