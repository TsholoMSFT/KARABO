/**
 * Import Use Cases Dialog
 * 
 * Allows importing use cases from Word, PDF, and Excel documents.
 * Features:
 * - File upload with drag & drop
 * - Preview of parsed use cases
 * - KPI fuzzy matching with manual override
 * - Expected benefits structured form with qualitative fallback
 */

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileArrowUp, 
  FilePdf, 
  FileXls, 
  FileDoc, 
  CircleNotch, 
  CheckCircle, 
  Warning, 
  X,
  MagnifyingGlass,
  CurrencyDollar,
  Note,
  ArrowRight,
  CaretDown,
  CaretRight,
} from '@phosphor-icons/react'
import { parseDocument, type ParsedUseCase, type DocumentParseResult } from '@/lib/document-parser'
import { matchKPI, type KPIMatchResult } from '@/lib/kpi-matcher'
import type { UseCase, UseCaseCOI, KPI } from '@/lib/types'
import { cn } from '@/lib/utils'

// Re-export AVAILABLE_KPIS from the actual location
import { AVAILABLE_KPIS as KPI_LIST } from '@/lib/kpis'

interface ImportUseCasesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (useCases: Partial<UseCase>[]) => void
  discoverySessionId?: string
}

type ImportStep = 'upload' | 'preview' | 'kpi-mapping' | 'benefits-mapping' | 'confirm'

interface EnrichedUseCase extends ParsedUseCase {
  // Selected for import
  selected: boolean
  // KPI mapping
  kpiMatches: KPIMatchResult[]
  finalKPIs: string[] // KPI IDs
  customKPIs: string[] // Free text KPIs that couldn't be matched
  // Benefits mapping
  benefitsMode: 'structured' | 'qualitative'
  structuredBenefits?: {
    directCosts: number
    opportunityCosts: number
    riskCosts: number
  }
  qualitativeNotes: string
}

export function ImportUseCasesDialog({
  open,
  onOpenChange,
  onImport,
  discoverySessionId,
}: ImportUseCasesDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null)
  const [enrichedUseCases, setEnrichedUseCases] = useState<EnrichedUseCase[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null)

  const resetState = useCallback(() => {
    setStep('upload')
    setIsProcessing(false)
    setParseResult(null)
    setEnrichedUseCases([])
    setDragActive(false)
    setExpandedUseCase(null)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onOpenChange(false)
  }, [resetState, onOpenChange])

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true)
    try {
      const result = await parseDocument(file)
      setParseResult(result)
      
      if (result.success && result.useCases.length > 0) {
        // Enrich use cases with KPI matching
        const enriched: EnrichedUseCase[] = result.useCases.map(uc => {
          const kpiMatches = uc.kpis.map(kpi => matchKPI(kpi, 0.5))
          const matchedIds = kpiMatches
            .filter(m => m.matchedKPI)
            .map(m => m.matchedKPI!.id)
          const unmatched = kpiMatches
            .filter(m => !m.matchedKPI)
            .map(m => m.originalText)
          
          return {
            ...uc,
            selected: true,
            kpiMatches,
            finalKPIs: [...new Set(matchedIds)],
            customKPIs: unmatched,
            benefitsMode: 'qualitative' as const,
            qualitativeNotes: uc.expectedBenefits,
          }
        })
        setEnrichedUseCases(enriched)
        setStep('preview')
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const toggleUseCaseSelection = useCallback((index: number) => {
    setEnrichedUseCases(prev => 
      prev.map((uc, i) => i === index ? { ...uc, selected: !uc.selected } : uc)
    )
  }, [])

  const updateUseCase = useCallback((index: number, updates: Partial<EnrichedUseCase>) => {
    setEnrichedUseCases(prev =>
      prev.map((uc, i) => i === index ? { ...uc, ...updates } : uc)
    )
  }, [])

  const addKPIToUseCase = useCallback((useCaseIndex: number, kpiId: string) => {
    setEnrichedUseCases(prev =>
      prev.map((uc, i) => {
        if (i !== useCaseIndex) return uc
        if (uc.finalKPIs.includes(kpiId)) return uc
        return { ...uc, finalKPIs: [...uc.finalKPIs, kpiId] }
      })
    )
  }, [])

  const removeKPIFromUseCase = useCallback((useCaseIndex: number, kpiId: string) => {
    setEnrichedUseCases(prev =>
      prev.map((uc, i) => {
        if (i !== useCaseIndex) return uc
        return { ...uc, finalKPIs: uc.finalKPIs.filter(id => id !== kpiId) }
      })
    )
  }, [])

  const handleImport = useCallback(() => {
    const selectedUseCases = enrichedUseCases.filter(uc => uc.selected)
    
    const useCasesToImport: Partial<UseCase>[] = selectedUseCases.map(uc => {
      const coi: UseCaseCOI | undefined = uc.benefitsMode === 'structured' && uc.structuredBenefits
        ? {
            directCosts: uc.structuredBenefits.directCosts,
            opportunityCosts: uc.structuredBenefits.opportunityCosts,
            riskCosts: uc.structuredBenefits.riskCosts,
            totalAnnualCOI: uc.structuredBenefits.directCosts + uc.structuredBenefits.opportunityCosts + uc.structuredBenefits.riskCosts,
            notes: uc.qualitativeNotes || undefined,
            calculatedAt: Date.now(),
          }
        : undefined
      
      return {
        title: uc.name,
        description: uc.problemStatement,
        kpis: uc.finalKPIs,
        costOfInaction: coi,
        dataSources: ['manual'] as const,
        // Store qualitative benefits if not structured
        earningsContext: uc.benefitsMode === 'qualitative' && uc.qualitativeNotes
          ? [`Expected Benefits: ${uc.qualitativeNotes}`]
          : undefined,
        // Store custom KPIs as context
        industryContext: uc.customKPIs.length > 0
          ? [`Custom KPIs: ${uc.customKPIs.join(', ')}`]
          : undefined,
      }
    })
    
    onImport(useCasesToImport)
    handleClose()
  }, [enrichedUseCases, onImport, handleClose])

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FilePdf size={48} className="text-red-500" />
      case 'excel': return <FileXls size={48} className="text-green-600" />
      case 'word': return <FileDoc size={48} className="text-blue-600" />
      default: return <FileArrowUp size={48} className="text-muted-foreground" />
    }
  }

  const selectedCount = enrichedUseCases.filter(uc => uc.selected).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArrowUp size={24} />
            Import Use Cases
          </DialogTitle>
          <DialogDescription>
            Import use cases from Word (.docx), Excel (.xlsx), or PDF files
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className={cn(step === 'upload' && 'text-primary font-medium')}>
            1. Upload
          </span>
          <ArrowRight size={14} />
          <span className={cn(step === 'preview' && 'text-primary font-medium')}>
            2. Preview
          </span>
          <ArrowRight size={14} />
          <span className={cn(step === 'kpi-mapping' && 'text-primary font-medium')}>
            3. KPI Mapping
          </span>
          <ArrowRight size={14} />
          <span className={cn(step === 'benefits-mapping' && 'text-primary font-medium')}>
            4. Benefits
          </span>
          <ArrowRight size={14} />
          <span className={cn(step === 'confirm' && 'text-primary font-medium')}>
            5. Confirm
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === 'upload' && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                isProcessing && "pointer-events-none opacity-50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4">
                  <CircleNotch size={48} className="animate-spin text-primary" />
                  <p className="text-lg font-medium">Processing document...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a moment for AI-assisted parsing
                  </p>
                </div>
              ) : (
                <>
                  <FileArrowUp size={64} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drag & drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.docx,.pdf"
                    onChange={handleInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                  <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileXls size={16} className="text-green-600" /> Excel
                    </span>
                    <span className="flex items-center gap-1">
                      <FileDoc size={16} className="text-blue-600" /> Word
                    </span>
                    <span className="flex items-center gap-1">
                      <FilePdf size={16} className="text-red-500" /> PDF
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error State */}
          {parseResult && !parseResult.success && step === 'upload' && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Warning size={20} className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Failed to parse document</p>
                  <p className="text-sm text-muted-foreground mt-1">{parseResult.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && parseResult && (
            <div className="space-y-4">
              {/* Parse Summary */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                {getFileIcon(parseResult.documentType)}
                <div className="flex-1">
                  <p className="font-medium">
                    Found {enrichedUseCases.length} use case{enrichedUseCases.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Parsed using {parseResult.parseMethod === 'ai-freetext' ? 'AI-assisted extraction' : 'table detection'}
                  </p>
                </div>
                {parseResult.warnings.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Warning size={14} />
                    {parseResult.warnings.length} warning{parseResult.warnings.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                  {parseResult.warnings.map((warning, i) => (
                    <p key={i} className="text-amber-700 dark:text-amber-400">{warning}</p>
                  ))}
                </div>
              )}

              {/* Use Case List */}
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {enrichedUseCases.map((uc, index) => (
                    <Card key={index} className={cn(!uc.selected && 'opacity-50')}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={uc.selected}
                            onCheckedChange={() => toggleUseCaseSelection(index)}
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{uc.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {uc.parseConfidence} confidence
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm">
                        {uc.problemStatement && (
                          <p className="text-muted-foreground line-clamp-2">{uc.problemStatement}</p>
                        )}
                        {uc.kpis.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {uc.kpis.slice(0, 3).map((kpi, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{kpi}</Badge>
                            ))}
                            {uc.kpis.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{uc.kpis.length - 3} more</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* KPI Mapping Step */}
          {step === 'kpi-mapping' && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Review and adjust KPI mappings. We've attempted to match your KPIs to our library.
                </p>
                
                {enrichedUseCases.filter(uc => uc.selected).map((uc, index) => {
                  const realIndex = enrichedUseCases.findIndex(u => u.name === uc.name)
                  const isExpanded = expandedUseCase === uc.name
                  
                  return (
                    <Card key={uc.name}>
                      <CardHeader 
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedUseCase(isExpanded ? null : uc.name)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                          <CardTitle className="text-base flex-1">{uc.name}</CardTitle>
                          <Badge variant="outline">
                            {uc.finalKPIs.length} matched
                          </Badge>
                          {uc.customKPIs.length > 0 && (
                            <Badge variant="secondary">
                              {uc.customKPIs.length} unmatched
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="p-4 pt-0 space-y-4">
                          {/* Matched KPIs */}
                          <div>
                            <Label className="text-sm font-medium">Matched KPIs</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {uc.finalKPIs.map(kpiId => {
                                const kpi = KPI_LIST.find(k => k.id === kpiId)
                                return (
                                  <Badge key={kpiId} className="gap-1 pr-1">
                                    <CheckCircle size={14} className="text-green-500" />
                                    {kpi?.name || kpiId}
                                    <button
                                      onClick={() => removeKPIFromUseCase(realIndex, kpiId)}
                                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                      title={`Remove ${kpi?.name || kpiId}`}
                                      aria-label={`Remove ${kpi?.name || kpiId}`}
                                    >
                                      <X size={12} />
                                    </button>
                                  </Badge>
                                )
                              })}
                              {uc.finalKPIs.length === 0 && (
                                <span className="text-sm text-muted-foreground">No matched KPIs</span>
                              )}
                            </div>
                          </div>

                          {/* Unmatched KPIs */}
                          {uc.customKPIs.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Unmatched (will be saved as notes)</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {uc.customKPIs.map((kpi, i) => (
                                  <Badge key={i} variant="outline" className="gap-1">
                                    <Warning size={14} className="text-amber-500" />
                                    {kpi}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add KPI */}
                          <div>
                            <Label className="text-sm font-medium">Add from library</Label>
                            <Select onValueChange={(v) => addKPIToUseCase(realIndex, v)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select a KPI to add..." />
                              </SelectTrigger>
                              <SelectContent>
                                {KPI_LIST.filter(k => !uc.finalKPIs.includes(k.id)).map(kpi => (
                                  <SelectItem key={kpi.id} value={kpi.id}>
                                    {kpi.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* Benefits Mapping Step */}
          {step === 'benefits-mapping' && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Convert expected benefits to financial metrics for analysis, or keep as qualitative notes.
                </p>
                
                {enrichedUseCases.filter(uc => uc.selected).map((uc, index) => {
                  const realIndex = enrichedUseCases.findIndex(u => u.name === uc.name)
                  const isExpanded = expandedUseCase === uc.name
                  
                  return (
                    <Card key={uc.name}>
                      <CardHeader 
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedUseCase(isExpanded ? null : uc.name)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                          <CardTitle className="text-base flex-1">{uc.name}</CardTitle>
                          <Badge variant={uc.benefitsMode === 'structured' ? 'default' : 'outline'}>
                            {uc.benefitsMode === 'structured' ? (
                              <><CurrencyDollar size={14} className="mr-1" /> Structured</>
                            ) : (
                              <><Note size={14} className="mr-1" /> Qualitative</>
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="p-4 pt-0 space-y-4">
                          {/* Original Benefits Text */}
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Label className="text-xs text-muted-foreground">Original expected benefits</Label>
                            <p className="text-sm mt-1">{uc.expectedBenefits || 'No benefits specified'}</p>
                          </div>

                          {/* Mode Toggle */}
                          <Tabs 
                            value={uc.benefitsMode} 
                            onValueChange={(v) => updateUseCase(realIndex, { benefitsMode: v as 'structured' | 'qualitative' })}
                          >
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="qualitative" className="gap-2">
                                <Note size={16} />
                                Keep as Notes
                              </TabsTrigger>
                              <TabsTrigger value="structured" className="gap-2">
                                <CurrencyDollar size={16} />
                                Convert to Financial
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="qualitative" className="mt-4">
                              <Textarea
                                value={uc.qualitativeNotes}
                                onChange={(e) => updateUseCase(realIndex, { qualitativeNotes: e.target.value })}
                                placeholder="Qualitative notes about expected benefits..."
                                rows={3}
                              />
                            </TabsContent>

                            <TabsContent value="structured" className="mt-4 space-y-3">
                              <div className="grid gap-3">
                                <div>
                                  <Label className="text-sm">Direct Cost Savings (Annual)</Label>
                                  <div className="relative mt-1">
                                    <CurrencyDollar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      min={0}
                                      className="pl-8"
                                      placeholder="0"
                                      value={uc.structuredBenefits?.directCosts || ''}
                                      onChange={(e) => updateUseCase(realIndex, {
                                        structuredBenefits: {
                                          ...(uc.structuredBenefits || { directCosts: 0, opportunityCosts: 0, riskCosts: 0 }),
                                          directCosts: Number(e.target.value) || 0,
                                        }
                                      })}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm">Opportunity Value (Annual)</Label>
                                  <div className="relative mt-1">
                                    <CurrencyDollar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      min={0}
                                      className="pl-8"
                                      placeholder="0"
                                      value={uc.structuredBenefits?.opportunityCosts || ''}
                                      onChange={(e) => updateUseCase(realIndex, {
                                        structuredBenefits: {
                                          ...(uc.structuredBenefits || { directCosts: 0, opportunityCosts: 0, riskCosts: 0 }),
                                          opportunityCosts: Number(e.target.value) || 0,
                                        }
                                      })}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm">Risk Mitigation Value (Annual)</Label>
                                  <div className="relative mt-1">
                                    <CurrencyDollar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      min={0}
                                      className="pl-8"
                                      placeholder="0"
                                      value={uc.structuredBenefits?.riskCosts || ''}
                                      onChange={(e) => updateUseCase(realIndex, {
                                        structuredBenefits: {
                                          ...(uc.structuredBenefits || { directCosts: 0, opportunityCosts: 0, riskCosts: 0 }),
                                          riskCosts: Number(e.target.value) || 0,
                                        }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                              <Textarea
                                value={uc.qualitativeNotes}
                                onChange={(e) => updateUseCase(realIndex, { qualitativeNotes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={2}
                              />
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Ready to import {selectedCount} use case{selectedCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use cases will be added to your current session with "manual" source tag
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {enrichedUseCases.filter(uc => uc.selected).map((uc, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{uc.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {uc.finalKPIs.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {uc.finalKPIs.length} KPI{uc.finalKPIs.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {uc.benefitsMode === 'structured' ? 'Financial metrics' : 'Qualitative notes'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== 'upload' && (
            <Button 
              variant="outline" 
              onClick={() => {
                const steps: ImportStep[] = ['upload', 'preview', 'kpi-mapping', 'benefits-mapping', 'confirm']
                const currentIndex = steps.indexOf(step)
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1])
                }
              }}
            >
              Back
            </Button>
          )}
          
          <div className="flex-1" />

          {step === 'preview' && (
            <Button onClick={() => setStep('kpi-mapping')} disabled={selectedCount === 0}>
              Continue to KPI Mapping
            </Button>
          )}
          
          {step === 'kpi-mapping' && (
            <Button onClick={() => setStep('benefits-mapping')}>
              Continue to Benefits
            </Button>
          )}
          
          {step === 'benefits-mapping' && (
            <Button onClick={() => setStep('confirm')}>
              Review & Confirm
            </Button>
          )}
          
          {step === 'confirm' && (
            <Button onClick={handleImport} className="gap-2">
              <CheckCircle size={18} />
              Import {selectedCount} Use Case{selectedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
