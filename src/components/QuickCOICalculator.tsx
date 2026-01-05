import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Calculator,
  CurrencyDollar,
  Warning,
  ArrowClockwise,
  Question,
  Lightbulb,
  TrendUp,
  X,
  Copy,
  Check,
  Sparkle
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export interface COIValues {
  directCosts: number
  opportunityCosts: number
  riskCosts: number
  notes: string
}

interface QuickCOICalculatorProps {
  initialValues?: Partial<COIValues>
  onSave?: (values: COIValues & { totalCOI: number }) => void
  variant?: 'dialog' | 'inline' | 'compact'
  customerName?: string
  opportunityTitle?: string
}

interface CostInputProps {
  label: string
  description: string
  tooltip: string
  value: number
  onChange: (value: number) => void
  icon: React.ReactNode
  color: string
  examples?: string[]
}

function CostInput({ 
  label, 
  description, 
  tooltip, 
  value, 
  onChange, 
  icon, 
  color,
  examples 
}: CostInputProps) {
  const [showExamples, setShowExamples] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 transition-all ${
        value > 0 ? `border-${color}/50 bg-${color}/5` : 'border-border bg-muted/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-md bg-${color}/20`}>
            {icon}
          </div>
          <div>
            <Label className="text-base font-semibold">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setShowExamples(!showExamples)}
              >
                <Question size={16} className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative">
        <CurrencyDollar 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
        />
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="pl-9 text-lg font-semibold"
          min={0}
        />
      </div>

      <AnimatePresence>
        {showExamples && examples && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 bg-background rounded-md border">
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <Lightbulb size={14} className="text-amber-500" />
                Examples to consider:
              </p>
              <ul className="space-y-1">
                {examples.map((example, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toLocaleString()}`
}

export function QuickCOICalculator({
  initialValues,
  onSave,
  variant = 'inline',
  customerName,
  opportunityTitle
}: QuickCOICalculatorProps) {
  const [directCosts, setDirectCosts] = useState(initialValues?.directCosts || 0)
  const [opportunityCosts, setOpportunityCosts] = useState(initialValues?.opportunityCosts || 0)
  const [riskCosts, setRiskCosts] = useState(initialValues?.riskCosts || 0)
  const [notes, setNotes] = useState(initialValues?.notes || '')
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const totalCOI = useMemo(() => 
    directCosts + opportunityCosts + riskCosts,
    [directCosts, opportunityCosts, riskCosts]
  )

  const handleReset = useCallback(() => {
    setDirectCosts(0)
    setOpportunityCosts(0)
    setRiskCosts(0)
    setNotes('')
    toast.info('Calculator reset')
  }, [])

  const handleSave = useCallback(() => {
    if (totalCOI === 0) {
      toast.warning('Please enter at least one cost value')
      return
    }
    onSave?.({ directCosts, opportunityCosts, riskCosts, notes, totalCOI })
    toast.success('Cost of Inaction saved!')
    if (variant === 'dialog') {
      setDialogOpen(false)
    }
  }, [directCosts, opportunityCosts, riskCosts, notes, totalCOI, onSave, variant])

  const handleCopyToClipboard = useCallback(async () => {
    const summary = `
Cost of Inaction (COI) Summary
${customerName ? `Customer: ${customerName}` : ''}
${opportunityTitle ? `Opportunity: ${opportunityTitle}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Direct Costs:      ${formatCurrency(directCosts)}
Opportunity Costs: ${formatCurrency(opportunityCosts)}
Risk Costs:        ${formatCurrency(riskCosts)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total COI:         ${formatCurrency(totalCOI)}
${notes ? `\nNotes: ${notes}` : ''}
`.trim()

    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [directCosts, opportunityCosts, riskCosts, totalCOI, customerName, opportunityTitle, notes])

  const calculatorContent = (
    <div className="space-y-4">
      <CostInput
        label="Direct Costs"
        description="Current spending on workarounds, manual processes"
        tooltip="Annual costs from inefficient processes, manual labor, duplicate systems, overtime, and temporary solutions that wouldn't be needed with proper implementation."
        value={directCosts}
        onChange={setDirectCosts}
        icon={<CurrencyDollar size={20} weight="duotone" className="text-blue-500" />}
        color="blue-500"
        examples={[
          "Manual data entry labor costs",
          "Overtime to compensate for inefficiencies",
          "Maintenance of legacy workarounds",
          "Duplicate system licensing fees"
        ]}
      />

      <CostInput
        label="Opportunity Costs"
        description="Lost revenue, market share, or competitive edge"
        tooltip="Estimated annual revenue or value lost due to slower time-to-market, missed opportunities, inability to scale, or competitive disadvantage."
        value={opportunityCosts}
        onChange={setOpportunityCosts}
        icon={<TrendUp size={20} weight="duotone" className="text-amber-500" />}
        color="amber-500"
        examples={[
          "Delayed product launches",
          "Lost sales from slow response times",
          "Market share lost to faster competitors",
          "Unable to enter new markets"
        ]}
      />

      <CostInput
        label="Risk Costs"
        description="Potential fines, compliance issues, security risks"
        tooltip="Annual risk-adjusted costs from potential security breaches, compliance violations, regulatory fines, or business continuity failures."
        value={riskCosts}
        onChange={setRiskCosts}
        icon={<Warning size={20} weight="duotone" className="text-red-500" />}
        color="red-500"
        examples={[
          "Potential regulatory fines",
          "Data breach remediation costs",
          "Business continuity failures",
          "Reputation damage from incidents"
        ]}
      />

      <Separator />

      {/* Total COI Display */}
      <motion.div
        key={totalCOI}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        className="p-6 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calculator size={24} weight="duotone" className="text-primary" />
            <span className="text-lg font-semibold text-foreground">Total Cost of Inaction</span>
          </div>
          <Badge variant="secondary" className="text-xs">Annual</Badge>
        </div>
        <div className="text-4xl font-bold text-primary mt-2">
          {formatCurrency(totalCOI)}
        </div>
        {totalCOI > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Delaying action costs approximately <strong>{formatCurrency(totalCOI / 12)}/month</strong>
          </p>
        )}
      </motion.div>

      {/* Notes Section */}
      <div className="space-y-2">
        <Label htmlFor="coi-notes" className="flex items-center gap-2">
          <Sparkle size={16} className="text-primary" />
          Additional Notes
        </Label>
        <Textarea
          id="coi-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add context, assumptions, or data sources..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* COI Breakdown */}
      {totalCOI > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: 'Direct Costs', value: directCosts, color: 'bg-blue-500' },
              { label: 'Opportunity Costs', value: opportunityCosts, color: 'bg-amber-500' },
              { label: 'Risk Costs', value: riskCosts, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
                <span className="text-sm font-medium text-foreground">
                  {totalCOI > 0 ? Math.round((item.value / totalCOI) * 100) : 0}%
                </span>
                <span className="text-sm text-muted-foreground w-24 text-right">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const actionButtons = (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
        <ArrowClockwise size={16} />
        Reset
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="gap-2">
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy'}
      </Button>
      {onSave && (
        <Button size="sm" onClick={handleSave} className="gap-2" disabled={totalCOI === 0}>
          <Calculator size={16} />
          Save COI
        </Button>
      )}
    </div>
  )

  // Compact variant - minimal card
  if (variant === 'compact') {
    return (
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator size={20} weight="duotone" className="text-primary" />
            Quick COI Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {calculatorContent}
        </CardContent>
        <CardFooter>
          {actionButtons}
        </CardFooter>
      </Card>
    )
  }

  // Dialog variant - trigger button with modal
  if (variant === 'dialog') {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Calculator size={18} weight="duotone" />
            Calculate COI
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator size={24} weight="duotone" className="text-primary" />
              Quick Cost of Inaction Calculator
            </DialogTitle>
            <DialogDescription>
              Quantify the financial impact of maintaining the status quo. 
              This 4-box model helps justify investment in solutions.
            </DialogDescription>
          </DialogHeader>
          {calculatorContent}
          <DialogFooter>
            {actionButtons}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Default inline variant - full card
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator size={24} weight="duotone" className="text-primary" />
          Quick Financial Quantification
        </CardTitle>
        <CardDescription>
          Calculate the Cost of Inaction (COI) using the 4-box model to quantify the 
          business impact of maintaining the status quo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calculatorContent}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          All values are annual estimates
        </p>
        {actionButtons}
      </CardFooter>
    </Card>
  )
}

export default QuickCOICalculator
