/**
 * Financial Statement View Component
 * 
 * Displays three-statement financial model output:
 * - Income Statement (P&L)
 * - Balance Sheet Impact
 * - Cash Flow Statement
 * 
 * Shows before/after values with delta highlighting.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp, TrendingDown, Minus, FileText, Wallet, ArrowDownUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/financial-calculations'
import type { CommunicateStageData } from '@/lib/types'

interface FinancialStatementViewProps {
  data: CommunicateStageData
  currency?: 'USD' | 'GBP' | 'EUR'
}

// Format a value with trend indicator
function ValueCell({ 
  value, 
  isPositive = true,
  currency = 'USD' 
}: { 
  value: number
  isPositive?: boolean
  currency?: 'USD' | 'GBP' | 'EUR'
}) {
  const isZero = Math.abs(value) < 0.01
  const actuallyPositive = isPositive ? value > 0 : value < 0
  
  return (
    <div className={cn(
      'flex items-center justify-end gap-1 font-mono',
      isZero && 'text-muted-foreground',
      !isZero && actuallyPositive && 'text-green-600',
      !isZero && !actuallyPositive && 'text-red-600'
    )}>
      {!isZero && (
        actuallyPositive 
          ? <TrendingUp className="h-3 w-3" /> 
          : <TrendingDown className="h-3 w-3" />
      )}
      {isZero && <Minus className="h-3 w-3" />}
      {formatCurrency(Math.abs(value), currency)}
    </div>
  )
}

export function FinancialStatementView({ data, currency = 'USD' }: FinancialStatementViewProps) {
  const { threeStatementModel, plImpact, valueDriversByPLLine } = data
  
  return (
    <Tabs defaultValue="income" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="income" className="gap-2">
          <FileText className="h-4 w-4" />
          Income Statement
        </TabsTrigger>
        <TabsTrigger value="balance" className="gap-2">
          <Wallet className="h-4 w-4" />
          Balance Sheet
        </TabsTrigger>
        <TabsTrigger value="cashflow" className="gap-2">
          <ArrowDownUp className="h-4 w-4" />
          Cash Flow
        </TabsTrigger>
      </TabsList>
      
      {/* Income Statement */}
      <TabsContent value="income" className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Income Statement Impact
              <Badge variant="outline">3-Year Projection</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Line Item</TableHead>
                  <TableHead className="text-right">Year 1</TableHead>
                  <TableHead className="text-right">Year 2</TableHead>
                  <TableHead className="text-right">Year 3</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue */}
                <TableRow>
                  <TableCell className="font-medium">Revenue</TableCell>
                  <TableCell><ValueCell value={plImpact.year1.revenueImpact} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year2.revenueImpact} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year3.revenueImpact} currency={currency} /></TableCell>
                  <TableCell className="font-semibold"><ValueCell value={plImpact.total.revenueImpact} currency={currency} /></TableCell>
                </TableRow>
                
                {/* COGS */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">- COGS</TableCell>
                  <TableCell><ValueCell value={plImpact.year1.cogsImpact} isPositive={false} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year2.cogsImpact} isPositive={false} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year3.cogsImpact} isPositive={false} currency={currency} /></TableCell>
                  <TableCell className="font-semibold"><ValueCell value={plImpact.total.cogsImpact} isPositive={false} currency={currency} /></TableCell>
                </TableRow>
                
                {/* Gross Profit */}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-semibold">= Gross Profit</TableCell>
                  <TableCell><ValueCell value={plImpact.year1.grossMarginImpact} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year2.grossMarginImpact} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year3.grossMarginImpact} currency={currency} /></TableCell>
                  <TableCell className="font-bold"><ValueCell value={plImpact.total.grossMarginImpact} currency={currency} /></TableCell>
                </TableRow>
                
                {/* OpEx */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">- Operating Expenses</TableCell>
                  <TableCell><ValueCell value={plImpact.year1.opexImpact} isPositive={true} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year2.opexImpact} isPositive={true} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year3.opexImpact} isPositive={true} currency={currency} /></TableCell>
                  <TableCell className="font-semibold"><ValueCell value={plImpact.total.opexImpact} isPositive={true} currency={currency} /></TableCell>
                </TableRow>
                
                {/* EBIT */}
                <TableRow className="bg-[#0078D4]/10 border-t-2 border-[#0078D4]">
                  <TableCell className="font-bold text-[#0078D4]">= EBIT (Operating Income)</TableCell>
                  <TableCell><ValueCell value={plImpact.year1.ebitImpact} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year2.ebitImpact} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={plImpact.year3.ebitImpact} currency={currency} /></TableCell>
                  <TableCell className="font-bold text-lg"><ValueCell value={plImpact.total.ebitImpact} currency={currency} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            {/* Value Drivers Breakdown */}
            {valueDriversByPLLine && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Value Drivers by P&L Line</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Revenue Drivers */}
                  {valueDriversByPLLine.revenue?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">REVENUE</p>
                      {valueDriversByPLLine.revenue.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.driver}</span>
                          <span className="font-mono text-green-600">{formatCurrency(d.annualValue, currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* COGS Drivers */}
                  {valueDriversByPLLine.cogs?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">COGS SAVINGS</p>
                      {valueDriversByPLLine.cogs.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.driver}</span>
                          <span className="font-mono text-green-600">{formatCurrency(d.annualValue, currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* OpEx Drivers */}
                  {valueDriversByPLLine.opex?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">OPEX SAVINGS</p>
                      {valueDriversByPLLine.opex.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.driver}</span>
                          <span className="font-mono text-green-600">{formatCurrency(d.annualValue, currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Balance Sheet */}
      <TabsContent value="balance" className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Balance Sheet Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Category</TableHead>
                  <TableHead className="text-right">Impact</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Working Capital Change</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.balanceSheet?.workingCapitalChange || 0} currency={currency} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">One-time release from DSO/DIO improvement</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Inventory Reduction</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.balanceSheet?.inventoryReduction || 0} currency={currency} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">Reduced inventory carrying costs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Receivables Reduction</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.balanceSheet?.receivablesReduction || 0} currency={currency} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">Faster collections</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CapEx Avoided</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.balanceSheet?.capexAvoided || 0} currency={currency} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">Capital expenditure not required</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            {/* Balance Sheet Drivers */}
            {valueDriversByPLLine?.balanceSheet?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Balance Sheet Drivers</h4>
                <div className="space-y-2">
                  {valueDriversByPLLine.balanceSheet.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span>{d.driver}</span>
                      <span className="font-mono text-purple-600">{formatCurrency(d.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Cash Flow */}
      <TabsContent value="cashflow" className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Cash Flow Statement Impact
              <Badge variant="outline">3-Year Projection</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Cash Flow Category</TableHead>
                  <TableHead className="text-right">Year 1</TableHead>
                  <TableHead className="text-right">Year 2</TableHead>
                  <TableHead className="text-right">Year 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Operating Cash Flow</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.operatingCashFlow?.year1 || 0} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.operatingCashFlow?.year2 || 0} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.operatingCashFlow?.year3 || 0} currency={currency} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Investing Cash Flow</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.investingCashFlow?.year1 || 0} isPositive={false} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.investingCashFlow?.year2 || 0} isPositive={false} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.investingCashFlow?.year3 || 0} isPositive={false} currency={currency} /></TableCell>
                </TableRow>
                <TableRow className="bg-[#0078D4]/10 border-t-2 border-[#0078D4]">
                  <TableCell className="font-bold text-[#0078D4]">Net Cash Flow</TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.netCashFlow?.year1 || 0} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.netCashFlow?.year2 || 0} currency={currency} /></TableCell>
                  <TableCell><ValueCell value={threeStatementModel?.cashFlow?.netCashFlow?.year3 || 0} currency={currency} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
