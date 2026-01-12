import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Calculator, Copy, Check } from '@phosphor-icons/react'
import {
  calculatePaybackPeriod,
  calculateROI,
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

export function QuickROICalculator({ initialValues, onSave, currency = 'USD' }: QuickROICalculatorProps) {
  const [revenueImpact, setRevenueImpact] = useState(initialValues?.revenueImpact || 0)
  const [costSavings, setCostSavings] = useState(initialValues?.costSavings || 0)
  const [riskMitigation, setRiskMitigation] = useState(initialValues?.riskMitigation || 0)
  const [implementationCost, setImplementationCost] = useState(initialValues?.implementationCost || 0)
  const [notes, setNotes] = useState(initialValues?.notes || '')
  const [copied, setCopied] = useState(false)

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
        <CardTitle className="flex items-center gap-2">
          <Calculator size={20} weight="duotone" className="text-primary" />
          ROI Calculator (Optional)
        </CardTitle>
        <CardDescription>
          Enter annual value drivers and implementation cost to compute payback and 3-year ROI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Revenue impact (annual)</Label>
            <Input type="number" min={0} value={revenueImpact || ''} onChange={(e) => setRevenueImpact(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Cost savings (annual)</Label>
            <Input type="number" min={0} value={costSavings || ''} onChange={(e) => setCostSavings(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Risk mitigation value (annual)</Label>
            <Input type="number" min={0} value={riskMitigation || ''} onChange={(e) => setRiskMitigation(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Implementation cost (one-time)</Label>
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
