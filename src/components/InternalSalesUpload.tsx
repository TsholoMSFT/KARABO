/**
 * InternalSalesUpload
 * ----------------------------------------------------------------------------
 * Drag-drop / file-picker for CSV exports of internal sales data
 * (CRM, Dynamics 365, MSX, Salesforce). Parses with PapaParse, normalises
 * column headers, previews the first 5 rows, then persists per-customer.
 */

import { useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UploadSimple, Trash, CheckCircle, Warning, FileCsv } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  parseSalesCsv,
  saveSalesRecords,
  getSalesForCustomer,
  removeSalesForCustomer,
  type ImportResult,
} from '@/lib/sales-data-service'
import type { InternalSalesRecord } from '@/lib/types'

interface Props {
  customerId?: string
  customerName?: string
  onImported?: (records: InternalSalesRecord[]) => void
}

const SAMPLE_HEADERS = [
  'customer name', 'arr usd', 'expansion pipeline', 'products owned',
  'renewal date', 'segment', 'primary contact',
]

export function InternalSalesUpload({ customerId, customerName, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [existing, setExisting] = useState<InternalSalesRecord | null>(() =>
    customerId ? getSalesForCustomer(customerId) : null,
  )
  const [overrideCustomerId, setOverrideCustomerId] = useState<string>(customerId || '')

  const onFile = async (file: File) => {
    setParsing(true); setPreview(null)
    try {
      const result = await parseSalesCsv(file, overrideCustomerId || customerId)
      setPreview(result)
      if (!result.records.length) toast.warning(`No usable rows found (${result.skipped} skipped)`)
      else toast.success(`Parsed ${result.records.length} row${result.records.length === 1 ? '' : 's'}`)
    } catch (err: any) {
      toast.error(`CSV parse failed: ${err?.message || String(err)}`)
    } finally {
      setParsing(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) void onFile(f)
  }

  const importNow = () => {
    if (!preview?.records.length) return
    const n = saveSalesRecords(preview.records)
    toast.success(`Imported ${n} sales record${n === 1 ? '' : 's'}`)
    onImported?.(preview.records)
    if (customerId) setExisting(getSalesForCustomer(customerId))
    setPreview(null)
  }

  const clearExisting = () => {
    if (!customerId) return
    removeSalesForCustomer(customerId)
    setExisting(null)
    toast.success('Cleared sales record for this customer')
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCsv size={18} weight="duotone" /> Internal sales data
        </CardTitle>
        <CardDescription>
          Optional. Upload a CSV export from your CRM (Dynamics 365, MSX, Salesforce). Headers are matched
          tolerantly: <code className="text-[11px]">{SAMPLE_HEADERS.join(', ')}</code>. Data stays in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {existing && (
          <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-[12px] flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold flex items-center gap-1">
                <CheckCircle size={12} weight="fill" /> Sales record on file
              </div>
              <div className="text-muted-foreground mt-0.5 space-y-0.5">
                {existing.arrUSD !== undefined && <div>ARR: ${existing.arrUSD.toLocaleString()} USD</div>}
                {existing.expansionPipelineUSD !== undefined && (
                  <div>Expansion pipeline: ${existing.expansionPipelineUSD.toLocaleString()} USD</div>
                )}
                {existing.productsOwned?.length ? (
                  <div>Owns: {existing.productsOwned.slice(0, 6).join(', ')}{existing.productsOwned.length > 6 ? '…' : ''}</div>
                ) : null}
                {existing.renewalDate && <div>Renewal: {existing.renewalDate}</div>}
                {existing.segment && <div>Segment: {existing.segment}</div>}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={clearExisting}>
              <Trash size={12} className="mr-1" /> Clear
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <Label className="text-[11px]">Customer ID for these rows (optional)</Label>
            <Input
              value={overrideCustomerId}
              onChange={(e) => setOverrideCustomerId(e.target.value)}
              placeholder={customerName || 'leave blank to derive from CSV account name'}
              className="h-8 text-[12px]"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            aria-label="Upload sales data CSV"
            title="Upload sales data CSV"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = '' }}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={parsing}>
            <UploadSimple size={14} className="mr-1" /> {parsing ? 'Parsing…' : 'Choose CSV'}
          </Button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed rounded p-4 text-center text-[12px] text-muted-foreground hover:border-primary/50 transition-colors"
        >
          …or drop a CSV here
        </div>

        {preview && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[12px]">
              <Badge variant="secondary">{preview.records.length} parsed</Badge>
              {preview.skipped > 0 && <Badge variant="outline">{preview.skipped} skipped</Badge>}
              {preview.warnings.map((w, i) => (
                <Badge key={i} variant="outline" className="text-amber-600 border-amber-500/40">
                  <Warning size={10} className="mr-1" /> {w}
                </Badge>
              ))}
            </div>
            <ScrollArea className="max-h-48 border rounded p-2 text-[11px]">
              {preview.records.slice(0, 5).map((r, i) => (
                <div key={i} className="border-b last:border-b-0 py-1">
                  <div className="font-medium">{r.customerName || r.customerId}</div>
                  <div className="text-muted-foreground">
                    {r.arrUSD !== undefined && <>ARR ${r.arrUSD.toLocaleString()} · </>}
                    {r.productsOwned?.length ? <>Owns {r.productsOwned.length} sku · </> : null}
                    {r.renewalDate ? <>Renews {r.renewalDate}</> : null}
                  </div>
                </div>
              ))}
              {preview.records.length > 5 && <div className="text-muted-foreground pt-1">+ {preview.records.length - 5} more…</div>}
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Cancel</Button>
              <Button size="sm" onClick={importNow}>Import {preview.records.length} record{preview.records.length === 1 ? '' : 's'}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
