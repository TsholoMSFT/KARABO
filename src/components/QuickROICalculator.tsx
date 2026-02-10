import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { Calculator, Copy, Check, Sparkle, Stack, Info, Question } from '@phosphor-icons/react'
import { InlineDisclaimer } from '@/components/Disclaimer'
import {
  calculatePaybackPeriod,
  calculateROI,
  inferROIFromContext,
  inferAggregateROI,
  type ROIAutoContext,
  type ROIAggregateContext,
  type InferredROIInputs,
} from '@/lib/financial-calculations'

export interface ROIInputs {
  revenueImpact: number
  costSavings: number
  riskMitigation: number
  implementationCost: number
  notes?: string
}

export interface ROIResult {
  totalAnnualValue: number
  paybackMonths: number
  roi3YearPercent: number
}

interface QuickROICalculatorProps {
  initialValues?: Partial<ROIInputs>
  onSave?: (inputs: ROIInputs, result: ROIResult) => void
  currency?: 'USD' | 'GBP' | 'EUR'
  /** Context for auto-populating from a single use case */
  autoContext?: ROIAutoContext
  /** Context for aggregating multiple use cases */
  aggregateContext?: ROIAggregateContext
  /** Show aggregate toggle when multiple use cases available */
  showAggregateOption?: boolean
}

function formatMoney(value: number, currency: 'USD' | 'GBP' | 'EUR') {
  try {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return String(Math.round(value))
  }
}

export function QuickROICalculator({ 
  initialValues, 
  onSave, 
  currency = 'USD',
  autoContext,
  aggregateContext,
  showAggregateOption = false,
}: QuickROICalculatorProps) {
  const [revenueImpact, setRevenueImpact] = useState(initialValues?.revenueImpact || 0)
  const [costSavings, setCostSavings] = useState(initialValues?.costSavings || 0)
  const [riskMitigation, setRiskMitigation] = useState(initialValues?.riskMitigation || 0)
  const [implementationCost, setImplementationCost] = useState(initialValues?.implementationCost || 0)
  const [notes, setNotes] = useState(initialValues?.notes || '')
  const [copied, setCopied] = useState(false)
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low' | null>(null)
  const [isAggregateMode, setIsAggregateMode] = useState(false)
  const [hasAutoFilled, setHasAutoFilled] = useState(false)
  const [showMethodology, setShowMethodology] = useState(false)
  const [showAutoFillDisclaimer, setShowAutoFillDisclaimer] = useState(false)

  // Auto-fill on mount if autoContext is provided and no initial values
  useEffect(() => {
    if (hasAutoFilled) return
    
    const hasInitialValues = (initialValues?.revenueImpact || 0) + 
      (initialValues?.costSavings || 0) + 
      (initialValues?.riskMitigation || 0) + 
      (initialValues?.implementationCost || 0) > 0
    
    if (hasInitialValues) {
      setHasAutoFilled(true)
      return
    }

    if (autoContext?.useCase) {
      const inferred = inferROIFromContext(autoContext)
      applyInferredValues(inferred)
      setHasAutoFilled(true)
    }
  }, [autoContext, initialValues, hasAutoFilled])

  const applyInferredValues = useCallback((inferred: InferredROIInputs) => {
    setRevenueImpact(inferred.revenueImpact)
    setCostSavings(inferred.costSavings)
    setRiskMitigation(inferred.riskMitigation)
    setImplementationCost(inferred.implementationCost)
    setNotes(inferred.notes)
    setConfidence(inferred.confidence)
    setShowAutoFillDisclaimer(true)
  }, [])

  const handleAutoFill = useCallback(() => {
    if (!autoContext?.useCase) {
      toast.warning('No use case context available for auto-fill')
      return
    }
    const inferred = inferROIFromContext(autoContext)
    applyInferredValues(inferred)
    setIsAggregateMode(false)
    toast.success('Auto-filled from use case data', {
      description: `Confidence: ${inferred.confidence}`,
    })
  }, [autoContext, applyInferredValues])

  const handleAggregateAll = useCallback(() => {
    if (!aggregateContext?.useCases?.length) {
      toast.warning('No use cases available for aggregation')
      return
    }
    const inferred = inferAggregateROI(aggregateContext)
    applyInferredValues(inferred)
    setIsAggregateMode(true)
    toast.success(`Aggregated ${aggregateContext.useCases.length} use cases`, {
      description: `Total implementation: ${formatMoney(inferred.implementationCost, currency)}`,
    })
  }, [aggregateContext, applyInferredValues, currency])

  const totalAnnualValue = useMemo(
    () => revenueImpact + costSavings + riskMitigation,
    [revenueImpact, costSavings, riskMitigation]
  )

  const paybackMonths = useMemo(
    () => calculatePaybackPeriod(implementationCost, totalAnnualValue),
    [implementationCost, totalAnnualValue]
  )

  const roi3YearPercent = useMemo(
    () => calculateROI(implementationCost, totalAnnualValue),
    [implementationCost, totalAnnualValue]
  )

  const handleCopy = useCallback(async () => {
    const text = [
      'ROI Summary',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Revenue Impact:       ${formatMoney(revenueImpact, currency)}/year`,
      `Cost Savings:         ${formatMoney(costSavings, currency)}/year`,
      `Risk Mitigation:      ${formatMoney(riskMitigation, currency)}/year`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Total Annual Value:   ${formatMoney(totalAnnualValue, currency)}/year`,
      `Implementation Cost:  ${formatMoney(implementationCost, currency)}`,
      `Payback Period:       ${Number.isFinite(paybackMonths) ? `${Math.round(paybackMonths)} months` : 'N/A'}`,
      `3-Year ROI:           ${Number.isFinite(roi3YearPercent) ? `${roi3YearPercent.toFixed(0)}%` : 'N/A'}`,
      ...(notes && notes.trim().length > 0 ? ['━━━━━━━━━━━━━━━━━━━━━━━━━━━', `Notes:               ${notes.trim()}`] : []),
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Failed to copy')
    }
  }, [costSavings, currency, implementationCost, notes, paybackMonths, revenueImpact, riskMitigation, roi3YearPercent, totalAnnualValue])

  const handleSave = useCallback(() => {
    if (totalAnnualValue <= 0 || implementationCost <= 0) {
      toast.warning('Enter implementation cost and at least one annual value input')
      return
    }

    const inputs: ROIInputs = {
      revenueImpact,
      costSavings,
      riskMitigation,
      implementationCost,
      notes: notes && notes.trim().length > 0 ? notes.trim() : undefined,
    }

    const result: ROIResult = {
      totalAnnualValue,
      paybackMonths,
      roi3YearPercent,
    }

    onSave?.(inputs, result)
    toast.success('ROI saved')
  }, [costSavings, implementationCost, notes, onSave, paybackMonths, revenueImpact, riskMitigation, roi3YearPercent, totalAnnualValue])

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Calculator size={20} weight="duotone" className="text-primary" />
              ROI Calculator
              {isAggregateMode && (
                <Badge variant="secondary" className="ml-2">
                  <Stack size={12} className="mr-1" />
                  Aggregated
                </Badge>
              )}
              {confidence && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'outline'}
                      className="ml-2 cursor-help"
                    >
                      <Info size={12} className="mr-1" />
                      {confidence} confidence
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      {confidence === 'high' && 'Values based on manual input or validated data'}
                      {confidence === 'medium' && 'Values derived from AI estimates or COI calculations'}
                      {confidence === 'low' && 'Values based on industry benchmarks - review recommended'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
            <CardDescription>
              {isAggregateMode 
                ? 'Combined ROI across all selected use cases'
                : 'Annual value drivers and implementation cost for payback and 3-year ROI'
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {autoContext?.useCase && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={handleAutoFill}
              >
                <Sparkle size={14} weight="duotone" />
                Auto-fill
              </Button>
            )}
            {showAggregateOption && aggregateContext?.useCases && aggregateContext.useCases.length > 1 && (
              <Button 
                variant={isAggregateMode ? "default" : "outline"}
                size="sm" 
                className="gap-1.5"
                onClick={handleAggregateAll}
              >
                <Stack size={14} weight="duotone" />
                Aggregate ({aggregateContext.useCases.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Revenue impact (annual)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Question size={14} className="text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Expected annual increase in top-line revenue from this initiative (e.g., new customer acquisition, upsell, faster time-to-market).
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input type="number" min={0} value={revenueImpact || ''} onChange={(e) => setRevenueImpact(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Cost savings (annual)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Question size={14} className="text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Annual reduction in operating costs — labor, infrastructure, licensing, process inefficiencies.
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input type="number" min={0} value={costSavings || ''} onChange={(e) => setCostSavings(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Risk mitigation value (annual)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Question size={14} className="text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Probability-weighted annual value of avoided risks — regulatory fines, security incidents, compliance failures.
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input type="number" min={0} value={riskMitigation || ''} onChange={(e) => setRiskMitigation(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Implementation cost (one-time)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Question size={14} className="text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Total upfront investment including development, deployment, training, and change management.
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input type="number" min={0} value={implementationCost || ''} onChange={(e) => setImplementationCost(Number(e.target.value) || 0)} />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Calculation notes / assumptions (editable)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document assumptions, sources, and any inferred values (e.g., weekly rate, value drivers, baseline volumes)."
          />
        </div>

        <Separator />

        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total annual value</span>
            <Badge variant="secondary">{formatMoney(totalAnnualValue, currency)}/year</Badge>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payback</span>
              <span className="font-medium">
                {Number.isFinite(paybackMonths) ? `${Math.round(paybackMonths)} months` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">3-year ROI</span>
              <span className="font-medium">
                {Number.isFinite(roi3YearPercent) ? `${roi3YearPercent.toFixed(0)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Auto-fill AI disclaimer */}
        {showAutoFillDisclaimer && (
          <InlineDisclaimer
            icon="ai"
            text="Values estimated by AI based on use case description, industry, and company context. Review and adjust before sharing."
          />
        )}

        {/* Collapsible ROI methodology */}
        <Collapsible open={showMethodology} onOpenChange={setShowMethodology}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors p-1 rounded-md hover:bg-primary/5">
              <Info size={14} weight="fill" />
              <span>{showMethodology ? 'Hide methodology' : 'How is ROI calculated?'}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 bg-muted/20 rounded-lg text-[11px] text-muted-foreground space-y-2">
              <h5 className="font-semibold text-foreground text-xs">ROI Calculation Methodology</h5>
              <div className="space-y-1">
                <p><strong>Total Annual Value</strong> = Revenue Impact + Cost Savings + Risk Mitigation</p>
                <p><strong>Payback Period</strong> = (Implementation Cost ÷ Total Annual Value) × 12 months</p>
                <p><strong>3-Year ROI</strong> = ((Total Annual Value × 3 − Implementation Cost) ÷ Implementation Cost) × 100%</p>
              </div>
              <p className="italic text-[10px]">These are simplified calculations. For NPV, IRR, and sensitivity analysis, see the Stage 8 Communicate view.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {onSave && (
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={implementationCost <= 0 && totalAnnualValue <= 0}>
            Save ROI
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default QuickROICalculator
