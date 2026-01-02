import { UseCase, ScoringMethod, CustomerMetadata, SuggestedUseCaseData } from '@/lib/types'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { FilePdf, X, Info, ShieldCheck, FileText } from '@phosphor-icons/react'
import { exportToPDF } from '@/lib/pdf-export'
import { useState } from 'react'
import { Disclaimer } from './Disclaimer'

interface TableExportViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  useCases: UseCase[]
  topUseCases: UseCase[]
  scoringMethod: ScoringMethod
  customerMetadata?: CustomerMetadata
  suggestedUseCases?: SuggestedUseCaseData[]
}

export function TableExportView({
  open,
  onOpenChange,
  useCases,
  topUseCases,
  scoringMethod,
  customerMetadata,
  suggestedUseCases,
}: TableExportViewProps) {
  const [effortUnit, setEffortUnit] = useState<'person-weeks' | 'fte' | 'man-hours'>('person-weeks')
  const [includeDisclaimers, setIncludeDisclaimers] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportToPDF(useCases, topUseCases, scoringMethod, {
        effortUnit,
        customerMetadata,
        suggestedUseCases,
        includeDisclaimers,
      })
      onOpenChange(false)
    } finally {
      setIsExporting(false)
    }
  }

  const reportContents = [
    { label: 'Cover Page', description: 'Customer information and report title' },
    { label: 'Executive Summary', description: 'AI-generated strategic overview' },
    { label: 'Top Recommendations', description: `${topUseCases.length} highest-scoring use cases` },
    { label: 'Scoring Methodology', description: scoringMethod === 'rice' ? 'RICE Framework explanation' : 'Impact/Feasibility Matrix explanation' },
    { label: 'All Use Cases', description: `Complete list of ${useCases.length} evaluated use cases` },
    { label: 'AI-Suggested Use Cases', description: suggestedUseCases?.length ? `${suggestedUseCases.length} AI-recommended opportunities` : 'None available' },
    { label: 'Regulatory Considerations', description: 'Applicable AI governance frameworks' },
    ...(includeDisclaimers ? [{ label: 'Disclaimers', description: 'Legal notices and compliance information' }] : []),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FilePdf size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Export Assessment Report</h2>
                <p className="text-sm text-muted-foreground">Generate a comprehensive PDF report</p>
              </div>
            </div>
            <Button onClick={() => onOpenChange(false)} variant="ghost" size="icon">
              <X size={18} />
            </Button>
          </div>

          {/* Report Contents Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-muted-foreground" />
              <Label className="text-sm font-medium">Report Contents</Label>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-3">
              {reportContents.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Effort Unit */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Effort Display Unit</Label>
              <RadioGroup 
                value={effortUnit} 
                onValueChange={(value) => setEffortUnit(value as any)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="person-weeks" id="pw" />
                  <Label htmlFor="pw" className="cursor-pointer text-sm">Person-Weeks</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fte" id="fte" />
                  <Label htmlFor="fte" className="cursor-pointer text-sm">FTE (Full-Time Equivalent)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="man-hours" id="mh" />
                  <Label htmlFor="mh" className="cursor-pointer text-sm">Man-Hours</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Report Options</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="disclaimers" 
                    checked={includeDisclaimers}
                    onCheckedChange={(checked) => setIncludeDisclaimers(checked as boolean)}
                  />
                  <Label htmlFor="disclaimers" className="cursor-pointer text-sm">
                    Include legal disclaimers
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* AI Disclaimer Banner */}
          <Disclaimer variant="compact" />

          {/* Export Button */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="gap-2"
            >
              <FilePdf size={18} weight="bold" />
              {isExporting ? 'Generating PDF...' : 'Export PDF Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
