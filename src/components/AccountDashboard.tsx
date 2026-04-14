/**
 * AccountDashboard — aggregated view of an Account's sessions, workloads,
 * MACC tracking, and portfolio breakdown.  Designed for the ATS persona.
 */
import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChartBar, CloudArrowUp, CurrencyDollar, Database,
  ArrowRight, Clock, Plus, Briefcase, Buildings, Users,
  CaretDown, CaretUp,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type {
  Account, DiscoverySession, UseCase, SolutionArea,
} from '@/lib/types'
import {
  SOLUTION_AREA_LABELS, SOLUTION_AREA_COLORS, WORKLOAD_TYPE_LABELS,
  ACCOUNT_TEAM_ROLE_LABELS, ACCOUNT_SEGMENT_LABELS,
} from '@/lib/types'
import {
  computeAccountMetrics,
  getWorkloadsForAccount,
} from '@/lib/account-engine'

interface AccountDashboardProps {
  account: Account
  sessions: DiscoverySession[]
  useCases: UseCase[]
  onSelectSession?: (sessionId: string) => void
  onEditAccount?: (account: Account) => void
  onAddWorkload?: () => void
  onClose?: () => void
}

export function AccountDashboard({
  account,
  sessions,
  useCases,
  onSelectSession,
  onEditAccount,
  onAddWorkload,
  onClose,
}: AccountDashboardProps) {
  const [showTeam, setShowTeam] = useState(false)
  const [showWorkloads, setShowWorkloads] = useState(true)
  
  const workloads = useMemo(() => getWorkloadsForAccount(account.id), [account.id])
  const metrics = useMemo(
    () => computeAccountMetrics(account, sessions, useCases),
    [account, sessions, useCases],
  )

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
    return `$${amount.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Buildings size={28} />
            {account.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{ACCOUNT_SEGMENT_LABELS[account.accountSegment]}</Badge>
            {account.fiscalYear && <Badge variant="secondary">{account.fiscalYear} {account.fiscalQuarter}</Badge>}
            <Badge className={
              account.healthRating === 'healthy' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
              account.healthRating === 'at-risk' ? 'bg-amber-100 text-amber-700 border-amber-300' :
              account.healthRating === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
              'bg-gray-100 text-gray-600 border-gray-300'
            }>
              {account.healthRating === 'healthy' ? '● Healthy' :
               account.healthRating === 'at-risk' ? '● At Risk' :
               account.healthRating === 'critical' ? '● Critical' : '○ Not Assessed'}
            </Badge>
          </div>
        </div>
        {onClose && <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Briefcase size={14} /> Sessions
            </div>
            <p className="text-2xl font-bold">{metrics.totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Database size={14} /> Use Cases
            </div>
            <p className="text-2xl font-bold">{metrics.totalUseCases}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CloudArrowUp size={14} /> Workloads
            </div>
            <p className="text-2xl font-bold">{metrics.totalWorkloads}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CurrencyDollar size={14} /> Est. Monthly
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalEstimatedConsumption)}</p>
          </CardContent>
        </Card>
      </div>

      {/* MACC Tracking */}
      {account.maccCommitment && (
        <Card className="bg-card border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CurrencyDollar size={18} />
              MACC Commitment
              {metrics.maccOnTrack 
                ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">On Track</Badge>
                : <Badge className="bg-red-100 text-red-700 text-[10px]">At Risk</Badge>
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Commitment</p>
                <p className="font-semibold">{formatCurrency(account.maccCommitment.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Remaining Balance</p>
                <p className="font-semibold">{formatCurrency(account.maccCommitment.remainingBalance)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Current ACR (Monthly)</p>
                <p className="font-semibold">{formatCurrency(account.maccCommitment.currentACR)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Burn Rate (Months)</p>
                <p className="font-semibold">{metrics.maccBurnRate > 0 ? `${Math.round(metrics.maccBurnRate)} months` : 'N/A'}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Consumed</span>
                <span>{Math.round(((account.maccCommitment.totalAmount - account.maccCommitment.remainingBalance) / account.maccCommitment.totalAmount) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${metrics.maccOnTrack ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, ((account.maccCommitment.totalAmount - account.maccCommitment.remainingBalance) / account.maccCommitment.totalAmount) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Team */}
      <Card className="bg-card">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTeam(!showTeam)}>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users size={18} /> Account Team ({account.team.length})
            </span>
            {showTeam ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {showTeam && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <CardContent>
                {account.team.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {account.team.map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{ACCOUNT_TEAM_ROLE_LABELS[member.role]}</p>
                        </div>
                        {member.email && <p className="text-[10px] text-muted-foreground">{member.email}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Workload Portfolio */}
      <Card className="bg-card border-2">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowWorkloads(!showWorkloads)}>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CloudArrowUp size={18} /> Workload Portfolio
            </span>
            <div className="flex items-center gap-2">
              {onAddWorkload && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); onAddWorkload() }}>
                  <Plus size={12} /> Add Workload
                </Button>
              )}
              {showWorkloads ? <CaretUp size={16} /> : <CaretDown size={16} />}
            </div>
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {showWorkloads && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <CardContent>
                {/* Solution area breakdown */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(Object.entries(metrics.workloadsBySolutionArea) as [SolutionArea, number][])
                    .filter(([, count]) => count > 0)
                    .map(([area, count]) => (
                      <Badge key={area} variant="outline" style={{ borderColor: SOLUTION_AREA_COLORS[area], color: SOLUTION_AREA_COLORS[area] }}>
                        {SOLUTION_AREA_LABELS[area]}: {count}
                      </Badge>
                    ))}
                  {metrics.totalWorkloads === 0 && (
                    <p className="text-sm text-muted-foreground">No workloads added yet. Click "Add Workload" to start building the portfolio.</p>
                  )}
                </div>

                {/* Workload list */}
                {workloads.length > 0 && (
                  <div className="space-y-2">
                    {workloads.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{w.name}</span>
                            <Badge variant="outline" className="text-[10px]">{WORKLOAD_TYPE_LABELS[w.type]}</Badge>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: SOLUTION_AREA_COLORS[w.solutionArea] }}>
                              {SOLUTION_AREA_LABELS[w.solutionArea]}
                            </Badge>
                          </div>
                          {w.sourceSystem && <p className="text-xs text-muted-foreground mt-0.5">Source: {w.sourceSystem}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          {w.consumptionEstimate && (
                            <span className="text-xs text-muted-foreground">{formatCurrency(w.consumptionEstimate.estimatedMonthly)}/mo</span>
                          )}
                          <Badge className={
                            w.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            w.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                            w.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }>
                            {w.priority}
                          </Badge>
                          <div className="w-16">
                            <div className="flex justify-between text-[9px] text-muted-foreground">
                              <span>Ready</span>
                              <span>{w.migrationReadiness}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  w.migrationReadiness >= 80 ? 'bg-emerald-500' :
                                  w.migrationReadiness >= 50 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${w.migrationReadiness}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Sessions Timeline */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock size={18} /> Discovery Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions linked to this account yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onSelectSession?.(s.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{s.industry || 'General'}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      {s.engagementType && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <Badge variant="outline" className="text-[10px]">{s.engagementType}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technology Plan Summary */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ChartBar size={18} /> Account Technology Plan
          </CardTitle>
          <CardDescription>
            Free-form summary of the account's technology strategy and roadmap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[120px] p-3 text-sm rounded-md border bg-background resize-y"
            placeholder="Summarize the account's technology vision, priorities, and Microsoft adoption roadmap..."
            value={account.technologyPlanSummary || ''}
            onChange={(e) => onEditAccount?.({ ...account, technologyPlanSummary: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
