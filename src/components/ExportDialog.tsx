import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FilePdf } from '@phosphor-icons/react'

export interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportPDF: (effortUnit: 'person-weeks' | 'fte' | 'man-hours') => void
}

export function ExportDialog({ open, onOpenChange, onExportPDF }: ExportDialogProps) {
  const [effortUnit, setEffortUnit] = useState<'person-weeks' | 'fte' | 'man-hours'>('person-weeks')

  const handleExportPDF = () => {
    onExportPDF(effortUnit)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePdf size={24} weight="duotone" className="text-red-600" />
            Export Assessment Report
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF report with all metrics, analyses, and AI insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Effort Unit Display</Label>
            <RadioGroup value={effortUnit} onValueChange={(value) => setEffortUnit(value as any)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="person-weeks" id="person-weeks" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="person-weeks" className="font-medium cursor-pointer">
                    Person-Weeks
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Default unit for effort estimation (e.g., 4 person-weeks)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="fte" id="fte" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="fte" className="font-medium cursor-pointer">
                    FTE (Full-Time Equivalents)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Convert to years (person-weeks ÷ 52, e.g., 4 weeks = 0.077 FTE)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="man-hours" id="man-hours" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="man-hours" className="font-medium cursor-pointer">
                    Man-Hours
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Convert to hours (person-weeks × 40, e.g., 4 weeks = 160 hours)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Report Contents</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Customer Information & Metadata</li>
              <li>✓ AI-Generated Executive Summary</li>
              <li>✓ Scoring Methodology Explanation</li>
              <li>✓ Top Recommendations with AI Rationales</li>
              <li>✓ Complete Use Case Analysis</li>
              <li>✓ KPI Mappings & Metrics</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExportPDF} className="gap-2">
            <FilePdf size={18} weight="bold" />
            Export PDF Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
