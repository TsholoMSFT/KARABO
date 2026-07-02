/**
 * Stage 5c: Balance Sheet & Cash Flow Impact
 * 
 * Captures balance sheet and cash flow impacts that don't flow through P&L.
 * Also includes Metric Hierarchy builder and final summary.
 * 
 * Balance Sheet/Cash Flow Drivers:
 * 1. Faster Collections (DSO Reduction)
 * 2. Inventory Optimisation (DIO Reduction)
 * 3. CapEx Avoidance
 * 4. Risk Provision Release
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Wallet,
  Banknote,
  Package,
  HardDrive,
  Shield,
  Info,
  ArrowRight,
  ArrowLeft,
  Layers,
  Target,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  BalanceSheetCashFlowDriver,
  BalanceSheetDriverType,
  MetricHierarchy,
} from '@/lib/types'
import {
  calculateBalanceSheetDriver,
  BALANCE_SHEET_DRIVER_INFO,
  METRIC_HIERARCHY_TEMPLATES,
  INDUSTRY_BENCHMARKS,
  createEmptyMetricHierarchy,
} from '@/lib/financial-mapping'
import { formatCurrency } from '@/lib/financial-calculations'

interface Stage5cBalanceSheetProps {
  initialData?: {
    drivers: BalanceSheetCashFlowDriver[]
    totalWorkingCapitalImpact: number
    totalCashFlowImpact: number
    metricHierarchy: MetricHierarchy
  }
  revenueTotal: number
  costTotal: number
  onComplete: (data: {
    drivers: BalanceSheetCashFlowDriver[]
    totalWorkingCapitalImpact: number
    totalCashFlowImpact: number
    metricHierarchy: MetricHierarchy
  }) => void
  onBack: () => void
}

// Icons for each driver type
const DRIVER_ICONS: Record<BalanceSheetDriverType, React.ReactNode> = {
  'collections': <Banknote className="h-5 w-5" />,
  'inventory': <Package className="h-5 w-5" />,
  'capex-avoidance': <HardDrive className="h-5 w-5" />,
  'risk-provision': <Shield className="h-5 w-5" />,
}

// Create default empty driver
function createDefaultDriver(type: BalanceSheetDriverType): BalanceSheetCashFlowDriver {
  return {
    id: `bs-${type}-${Date.now()}`,
    type,
    enabled: false,
    inputs: {},
    calculatedValue: 0,
    cashFlowImpact: 0,
    statementLine: type === 'collections' || type === 'inventory' 
      ? 'working-capital' 
      : type === 'capex-avoidance' 
        ? 'cash-investing' 
        : 'balance-sheet',
  }
}

// Metric hierarchy levels with icons
const METRIC_LEVELS = [
  { level: 'strategic', label: 'Strategic Outcomes', icon: Target, color: 'text-purple-600', description: 'Board/CEO level metrics' },
  { level: 'financial', label: 'Financial Metrics', icon: BarChart3, color: 'text-blue-600', description: 'CFO/Finance level metrics' },
  { level: 'operational', label: 'Operational Metrics', icon: Activity, color: 'text-green-600', description: 'Business Unit level metrics' },
  { level: 'activity', label: 'Activity Metrics', icon: Zap, color: 'text-orange-600', description: 'Team level metrics' },
] as const

export function Stage5cBalanceSheet({
  initialData,
  revenueTotal,
  costTotal,
  onComplete,
  onBack,
}: Stage5cBalanceSheetProps) {
  // Initialize drivers
  const [drivers, setDrivers] = useState<BalanceSheetCashFlowDriver[]>(() => {
    if (initialData?.drivers && initialData.drivers.length > 0) {
      return initialData.drivers
    }
    
    return [
      createDefaultDriver('collections'),
      createDefaultDriver('inventory'),
      createDefaultDriver('capex-avoidance'),
      createDefaultDriver('risk-provision'),
    ]
  })
  
  // Metric Hierarchy
  const [metricHierarchy, setMetricHierarchy] = useState<MetricHierarchy>(
    initialData?.metricHierarchy || createEmptyMetricHierarchy()
  )
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
  // Calculate values
  const driversWithCalculations = useMemo(() => {
    return drivers.map(driver => {
      if (!driver.enabled) {
        return { ...driver, calculatedValue: 0, cashFlowImpact: 0 }
      }
      const { value, cashFlowImpact } = calculateBalanceSheetDriver(driver)
      return { ...driver, calculatedValue: value, cashFlowImpact }
    })
  }, [drivers])
  
  // Totals
  const totalWorkingCapitalImpact = useMemo(() => {
    return driversWithCalculations
      .filter(d => d.enabled && (d.statementLine === 'working-capital' || d.statementLine === 'balance-sheet'))
      .reduce((sum, d) => sum + d.calculatedValue, 0)
  }, [driversWithCalculations])
  
  const totalCashFlowImpact = useMemo(() => {
    return driversWithCalculations
      .filter(d => d.enabled)
      .reduce((sum, d) => sum + d.cashFlowImpact, 0)
  }, [driversWithCalculations])
  
  // Grand total of all value (Revenue + Cost + Cash Flow)
  const grandTotalAnnualValue = revenueTotal + costTotal
  
  // Update inputs
  const updateDriverInputs = (
    type: BalanceSheetDriverType,
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
  const toggleDriver = (type: BalanceSheetDriverType, enabled: boolean) => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, enabled } : d))
    )
  }
  
  // Update notes
  const updateDriverNotes = (type: BalanceSheetDriverType, notes: string) => {
    setDrivers(prev =>
      prev.map(d => (d.type === type ? { ...d, notes } : d))
    )
  }
  
  // Apply template to metric hierarchy
  const applyTemplate = (templateKey: string) => {
    if (templateKey && METRIC_HIERARCHY_TEMPLATES[templateKey]) {
      setMetricHierarchy(METRIC_HIERARCHY_TEMPLATES[templateKey])
      setSelectedTemplate(templateKey)
    }
  }
  
  // Update metric hierarchy fields
  const updateMetricHierarchy = (field: keyof MetricHierarchy, value: string | string[]) => {
    setMetricHierarchy(prev => ({ ...prev, [field]: value }))
  }
  
  const handleComplete = () => {
    onComplete({
      drivers: driversWithCalculations,
      totalWorkingCapitalImpact,
      totalCashFlowImpact,
      metricHierarchy,
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
  
  // Render driver inputs
  const renderDriverInputs = (driver: BalanceSheetCashFlowDriver) => {
    const { type, inputs } = driver
    
    switch (type) {
      case 'collections':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Current DSO (Days)',
              inputs.currentDSO,
              (v) => updateDriverInputs(type, 'currentDSO', v),
              INDUSTRY_BENCHMARKS.dso.general.hint
            )}
            {renderInput(
              'Target DSO (Days)',
              inputs.newDSO,
              (v) => updateDriverInputs(type, 'newDSO', v)
            )}
            {renderInput(
              'Daily Revenue',
              inputs.dailyRevenue,
              (v) => updateDriverInputs(type, 'dailyRevenue', v),
              'Annual Revenue ÷ 365',
              '$'
            )}
          </div>
        )
      
      case 'inventory':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput(
              'Current DIO (Days)',
              inputs.currentDIO,
              (v) => updateDriverInputs(type, 'currentDIO', v),
              '30-60 days typical'
            )}
            {renderInput(
              'Target DIO (Days)',
              inputs.newDIO,
              (v) => updateDriverInputs(type, 'newDIO', v)
            )}
            {renderInput(
              'Daily COGS',
              inputs.dailyCOGS,
              (v) => updateDriverInputs(type, 'dailyCOGS', v),
              'Annual COGS ÷ 365',
              '$'
            )}
          </div>
        )
      
      case 'capex-avoidance':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput(
              'Avoided CapEx',
              inputs.avoidedCapEx,
              (v) => updateDriverInputs(type, 'avoidedCapEx', v),
              'Hardware, software licenses, facilities',
              '$'
            )}
            {renderInput(
              'Alternative Annual OpEx',
              inputs.alternativeOpEx,
              (v) => updateDriverInputs(type, 'alternativeOpEx', v),
              'Cloud/subscription alternative if any',
              '$'
            )}
          </div>
        )
      
      case 'risk-provision':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput(
              'Current Provision Amount',
              inputs.currentProvision,
              (v) => updateDriverInputs(type, 'currentProvision', v),
              'Bad debt, warranty, legal reserves',
              '$'
            )}
            {renderInput(
              'Risk Reduction',
              inputs.riskReductionPercent,
              (v) => updateDriverInputs(type, 'riskReductionPercent', v),
              '10-30% typical',
              undefined,
              '%'
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
            <span className="font-semibold">5c</span>
          </Badge>
          <span className="text-muted-foreground">of 3 sub-steps</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4] flex items-center gap-3">
          <Wallet className="h-8 w-8" />
          Balance Sheet & Cash Flow
        </h2>
        <p className="text-muted-foreground mt-2">
          Capture working capital improvements and cash flow impacts that don't flow directly through P&L.
        </p>
      </div>
      
      {/* Combined Summary Card */}
      <Card className="border-2 border-[#0078D4]/30 bg-gradient-to-r from-[#0078D4]/5 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Revenue Impact</p>
              <p className="text-xl font-bold text-[#0078D4]">
                {formatCurrency(revenueTotal, 'USD')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cost Savings</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(costTotal, 'USD')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cash Flow Impact</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(totalCashFlowImpact, 'USD')}
              </p>
              <p className="text-xs text-muted-foreground">one-time</p>
            </div>
            <div className="border-l pl-4">
              <p className="text-xs font-medium text-muted-foreground">Total Annual Value</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(grandTotalAnnualValue, 'USD')}
              </p>
              <p className="text-xs text-muted-foreground">P&L impact/year</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Balance Sheet Drivers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-600" />
          Working Capital & Cash Flow Drivers
        </h3>
        
        <Accordion type="multiple" className="space-y-4">
          {driversWithCalculations.map((driver) => {
            const info = BALANCE_SHEET_DRIVER_INFO[driver.type]
            const Icon = DRIVER_ICONS[driver.type]
            
            return (
              <AccordionItem
                key={driver.id}
                value={driver.type}
                className={cn(
                  'border rounded-lg px-4',
                  driver.enabled && 'border-purple-500/50 bg-purple-50/50'
                )}
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          driver.enabled ? 'bg-purple-600 text-white' : 'bg-muted'
                        )}
                      >
                        {Icon}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{info.label}</div>
                        <p className="text-sm text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {driver.enabled && driver.calculatedValue > 0 && (
                        <span className="text-lg font-semibold text-purple-600">
                          {formatCurrency(driver.calculatedValue, 'USD')}
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
                    {/* Formula */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Metric Chain:
                      </p>
                      <p className="text-sm font-mono">
                        {driver.type === 'collections' && '(Current DSO - New DSO) × Daily Revenue'}
                        {driver.type === 'inventory' && '(Current DIO - New DIO) × Daily COGS'}
                        {driver.type === 'capex-avoidance' && 'Avoided CapEx - NPV(Alternative OpEx)'}
                        {driver.type === 'risk-provision' && 'Current Provision × Risk Reduction %'}
                      </p>
                    </div>
                    
                    {/* Inputs */}
                    {renderDriverInputs(driver)}
                    
                    {/* Statement line info */}
                    <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                      <strong>Statement Line:</strong> {info.statementLine}
                    </div>
                    
                    {/* Calculated Result */}
                    {driver.enabled && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm font-medium">Calculated Value:</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-purple-600">
                            {formatCurrency(driver.calculatedValue, 'USD')}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            One-time working capital release
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Notes */}
                    <div className="space-y-1">
                      <Label className="text-sm">Notes / Assumptions</Label>
                      <Textarea
                        value={driver.notes || ''}
                        onChange={(e) => updateDriverNotes(driver.type, e.target.value)}
                        placeholder="Document key assumptions..."
                        className="h-20"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
      
      {/* Metric Hierarchy Builder */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#0078D4]" />
            Metric Hierarchy
          </CardTitle>
          <CardDescription>
            Link activity metrics to strategic outcomes. This shows how day-to-day improvements 
            roll up to business results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Start from Template (optional)</Label>
            <Select value={selectedTemplate} onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue-growth">Revenue Growth Focus</SelectItem>
                <SelectItem value="cost-efficiency">Cost Efficiency Focus</SelectItem>
                <SelectItem value="customer-experience">Customer Experience Focus</SelectItem>
                <SelectItem value="risk-management">Risk Management Focus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Hierarchy Levels */}
          <div className="space-y-4">
            {METRIC_LEVELS.map(({ level, label, icon: LevelIcon, color, description }) => (
              <div key={level} className="space-y-2">
                <Label className={cn('flex items-center gap-2', color)}>
                  <LevelIcon className="h-4 w-4" />
                  {label}
                  <span className="font-normal text-muted-foreground">({description})</span>
                </Label>
                {level === 'strategic' ? (
                  <Input
                    value={metricHierarchy.strategicOutcome}
                    onChange={(e) => updateMetricHierarchy('strategicOutcome', e.target.value)}
                    placeholder="e.g., Shareholder Value, Revenue Growth Rate"
                  />
                ) : (
                  <Textarea
                    value={(metricHierarchy[`${level}Metrics` as keyof MetricHierarchy] as string[])?.join('\n') || ''}
                    onChange={(e) => updateMetricHierarchy(
                      `${level}Metrics` as keyof MetricHierarchy,
                      e.target.value.split('\n').filter(Boolean)
                    )}
                    placeholder={`Enter metrics (one per line)...\n${
                      level === 'financial' ? 'e.g., Revenue by Segment, EBITDA Margin' :
                      level === 'operational' ? 'e.g., Cycle Time, Error Rate, NPS' :
                      'e.g., Documents Processed, Hours per Task'
                    }`}
                    className="min-h-[80px]"
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Hierarchy Preview */}
          {metricHierarchy.strategicOutcome && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Hierarchy Preview:</p>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {metricHierarchy.strategicOutcome}
                </span>
                <span className="text-muted-foreground">←</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {metricHierarchy.financialMetrics?.length || 0} financial
                </span>
                <span className="text-muted-foreground">←</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  {metricHierarchy.operationalMetrics?.length || 0} operational
                </span>
                <span className="text-muted-foreground">←</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                  {metricHierarchy.activityMetrics?.length || 0} activity
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Cost
        </Button>
        <Button
          onClick={handleComplete}
          className="gap-2 bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Complete Stage 5
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
