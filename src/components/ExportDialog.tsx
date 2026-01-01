import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Printer, FilePdf, FileText, FileCsv, Code } from '@phosphor-icons/react'

export interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenPrintView: (effortUnit: 'person-weeks' | 'fte' | 'man-hours') => void
  onExportPDF: (effortUnit: 'person-weeks' | 'fte' | 'man-hours') => void
  onExportCSV: (effortUnit: 'person-weeks' | 'fte' | 'man-hours') => void
  onExportExcel: (effortUnit: 'person-weeks' | 'fte' | 'man-hours') => void
  onExportJSON: (effortUnit: 'person-weeks' | 'fte' | 'man-hours') => void
}

export function ExportDialog({ open, onOpenChange, onOpenPrintView, onExportPDF, onExportCSV, onExportExcel, onExportJSON }: ExportDialogProps) {
  const [effortUnit, setEffortUnit] = useState<'person-weeks' | 'fte' | 'man-hours'>('person-weeks')

  const handleOpenPrintView = () => {
    onOpenPrintView(effortUnit)
    onOpenChange(false)
  }

  const handleExportPDF = () => {
    onExportPDF(effortUnit)
    onOpenChange(false)
  }

  const handleExportCSV = () => {
    onExportCSV(effortUnit)
    onOpenChange(false)
  }

  const handleExportExcel = () => {
    onExportExcel(effortUnit)
    onOpenChange(false)
  }

  const handleExportJSON = () => {
    onExportJSON(effortUnit)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePdf size={24} weight="duotone" />
            Export Assessment
          </DialogTitle>
          <DialogDescription>
            Configure export options and select your preferred format
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

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Formats</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleExportPDF} className="justify-start gap-2" variant="outline">
                <FilePdf size={18} weight="bold" className="text-red-600" />
                <div className="text-left">
                  <div className="font-medium">PDF Report</div>
                  <div className="text-xs text-muted-foreground">Professional formatted report</div>
                </div>
              </Button>
              
              <Button onClick={handleExportExcel} className="justify-start gap-2" variant="outline">
                <FileCsv size={18} weight="bold" className="text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Excel (XLSX)</div>
                  <div className="text-xs text-muted-foreground">Multi-sheet workbook</div>
                </div>
              </Button>

              <Button onClick={handleExportCSV} className="justify-start gap-2" variant="outline">
                <FileText size={18} weight="bold" className="text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-muted-foreground">Spreadsheet compatible</div>
                </div>
              </Button>

              <Button onClick={handleExportJSON} className="justify-start gap-2" variant="outline">
                <Code size={18} weight="bold" className="text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">JSON</div>
                  <div className="text-xs text-muted-foreground">Raw data export</div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button onClick={handleOpenPrintView} className="gap-2" variant="secondary">
            <Printer size={18} weight="bold" />
            Print View
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
