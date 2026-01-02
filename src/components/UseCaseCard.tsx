import { useState } from 'react'
import { UseCase } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PencilSimple, Trash, Sparkle, Info, ShieldCheck, Scales, CaretDown, CaretUp } from '@phosphor-icons/react'
import { calculateRICEScore, getQuadrant } from '@/lib/scoring'
import { getKPIById, KPI_CATEGORIES } from '@/lib/kpis'
import { REGULATION_LABELS, RISK_LEVEL_LABELS, SECURITY_REQUIREMENT_LABELS, DATA_CLASSIFICATION_LABELS } from '@/lib/demo-data'
import { motion, AnimatePresence } from 'framer-motion'

interface UseCaseCardProps {
  useCase: UseCase
  rank?: number
  isTopPick?: boolean
  scoringMethod: 'impact-feasibility' | 'rice'
  onUpdate: (useCase: UseCase) => void
  onDelete: (id: string) => void
  onEdit: (useCase: UseCase) => void
}

export function UseCaseCard({
  useCase,
  rank,
  isTopPick,
  scoringMethod,
  onUpdate,
  onDelete,
  onEdit,
}: UseCaseCardProps) {
  const [showCompliance, setShowCompliance] = useState(false)
  const riceScore = calculateRICEScore(useCase)
  const impactFeasScore = useCase.impact * useCase.feasibility
  const quadrant = getQuadrant(useCase.impact, useCase.feasibility)

  const hasComplianceInfo = useCase.aiRegulations || useCase.cybersecurity

  const impactLabels = [
    { value: 0.25, label: 'Minimal' },
    { value: 0.5, label: 'Low' },
    { value: 1, label: 'Medium' },
    { value: 2, label: 'High' },
    { value: 3, label: 'Massive' },
  ]

  const getCategoryColor = (category: string) => {
    const cat = KPI_CATEGORIES.find((c) => c.value === category)
    return cat?.color || 'oklch(0.5 0.1 240)'
  }

  return (
    <motion.div
      layout
      layoutId={useCase.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        layout: { type: 'spring', stiffness: 350, damping: 35, mass: 0.8 },
        default: { type: 'spring', stiffness: 300, damping: 30 }
      }}
    >
      <motion.div
        key={`card-${useCase.id}-${rank}-${scoringMethod}`}
        animate={{
          borderColor: isTopPick ? 'oklch(0.70 0.22 330)' : 'oklch(0.40 0.02 240)',
          boxShadow: isTopPick 
            ? '0 10px 15px -3px oklch(0.70 0.22 330 / 0.1), 0 4px 6px -4px oklch(0.70 0.22 330 / 0.1)' 
            : '0 1px 2px 0 oklch(0 0 0 / 0.05)',
          scale: isTopPick ? 1.01 : 1,
        }}
        initial={false}
        transition={{ 
          duration: 0.5, 
          ease: 'easeInOut',
          scale: { type: 'spring', stiffness: 300, damping: 25 }
        }}
      >
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isTopPick 
              ? 'oklch(0.70 0.22 330 / 0.03)' 
              : 'oklch(0.30 0.025 240)',
          }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className={`p-6 transition-all hover:shadow-md ${
              isTopPick ? 'border-2' : ''
            }`}
            style={{ backgroundColor: 'transparent' }}
          >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isTopPick && rank && (
                <motion.div
                  key={`rank-${rank}-${scoringMethod}`}
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 20,
                    opacity: { duration: 0.2 }
                  }}
                >
                  <Badge variant="default" className="bg-accent text-accent-foreground font-semibold">
                    <Sparkle className="mr-1" weight="fill" size={14} />#{rank}
                  </Badge>
                </motion.div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{useCase.title}</h3>
            </div>
            {useCase.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{useCase.description}</p>
            )}
            {useCase.kpis && useCase.kpis.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {useCase.kpis.map((kpiId) => {
                  const kpi = getKPIById(kpiId)
                  if (!kpi) return null
                  return (
                    <Badge
                      key={kpiId}
                      variant="secondary"
                      className="text-xs px-2 py-0.5"
                      style={{
                        backgroundColor: getCategoryColor(kpi.category),
                        color: 'oklch(0.98 0 0)',
                        borderColor: getCategoryColor(kpi.category),
                      }}
                    >
                      {kpi.name}
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(useCase)}>
              <PencilSimple size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(useCase.id)}>
              <Trash size={18} />
            </Button>
          </div>
        </div>

        <motion.div
          key={scoringMethod}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {scoringMethod === 'impact-feasibility' ? (
            <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium uppercase tracking-wide">Impact</Label>
                <span className="text-sm font-semibold tabular-nums">{useCase.impact}</span>
              </div>
              <Slider
                value={[useCase.impact]}
                onValueChange={([value]) => onUpdate({ ...useCase, impact: value })}
                min={1}
                max={10}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium uppercase tracking-wide">Feasibility</Label>
                <span className="text-sm font-semibold tabular-nums">{useCase.feasibility}</span>
              </div>
              <Slider
                value={[useCase.feasibility]}
                onValueChange={([value]) => onUpdate({ ...useCase, feasibility: value })}
                min={1}
                max={10}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quadrant
              </span>
              <Badge variant="outline" className="font-medium">
                {quadrant}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Score
              </span>
              <motion.span
                key={`if-score-${impactFeasScore}-${scoringMethod}`}
                initial={{ scale: 1.3, color: 'oklch(0.58 0.18 195)' }}
                animate={{ scale: 1, color: 'oklch(0.65 0.20 310)' }}
                transition={{ 
                  duration: 0.4,
                  scale: { type: 'spring', stiffness: 300, damping: 20 }
                }}
                className="text-xl font-bold tabular-nums"
              >
                {impactFeasScore.toFixed(1)}
              </motion.span>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    Number of Users
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Number of Users</p>
                      <p className="text-xs">How many users will this feature impact? Enter the estimated number of people who will use or benefit from this use case.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useCase.rice.users || 0}
                  onChange={(e) => {
                    const users = Number(e.target.value) || 0
                    const reach = users
                    onUpdate({
                      ...useCase,
                      rice: { ...useCase.rice, users, reach },
                    })
                  }}
                  min={0}
                  className="tabular-nums"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    Period
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Time Period</p>
                      <p className="text-xs">Over what time period will these users be reached? This helps contextualize the Reach metric.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={useCase.rice.period || 'quarter'}
                  onValueChange={(value) =>
                    onUpdate({
                      ...useCase,
                      rice: { ...useCase.rice, period: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Per Week</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                    <SelectItem value="quarter">Per Quarter</SelectItem>
                    <SelectItem value="year">Per Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Calculated Reach
                  </span>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {useCase.rice.reach} users/{useCase.rice.period || 'quarter'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    Impact Multiplier
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Impact Multiplier</p>
                      <p className="text-xs mb-2">How much will this feature impact each user?</p>
                      <ul className="text-xs space-y-1">
                        <li><strong>3x - Massive:</strong> Fundamental game-changer</li>
                        <li><strong>2x - High:</strong> Major improvement</li>
                        <li><strong>1x - Medium:</strong> Moderate improvement</li>
                        <li><strong>0.5x - Low:</strong> Small improvement</li>
                        <li><strong>0.25x - Minimal:</strong> Barely noticeable</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={String(useCase.rice.impact)}
                  onValueChange={(value) =>
                    onUpdate({
                      ...useCase,
                      rice: { ...useCase.rice, impact: Number(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {impactLabels.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.value}x - {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs font-medium uppercase tracking-wide">
                      Confidence
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Confidence (%)</p>
                        <p className="text-xs">How confident are you in your estimates for Reach and Impact? Use this to account for uncertainty. 100% means very confident, 50% means moderate uncertainty.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{useCase.rice.confidence}%</span>
                </div>
                <Slider
                  value={[useCase.rice.confidence]}
                  onValueChange={([value]) =>
                    onUpdate({ ...useCase, rice: { ...useCase.rice, confidence: value } })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Label className="text-xs font-medium uppercase tracking-wide">
                    Effort (Person-Weeks)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Effort (Person-Weeks)</p>
                      <p className="text-xs mb-2">Total <strong>development time</strong> to design, build, test, and deploy this solution. Sum the time across all team members.</p>
                      <p className="text-xs mb-2"><strong>Example:</strong> 2 developers × 3 weeks + 1 designer × 1 week = 7 person-weeks</p>
                      <p className="text-xs text-muted-foreground">Note: This measures implementation effort, not the time spent on the current process before the solution exists.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useCase.rice.effort}
                  onChange={(e) =>
                    onUpdate({
                      ...useCase,
                      rice: { ...useCase.rice, effort: Math.max(0.1, Number(e.target.value) || 0.1) },
                    })
                  }
                  min={0.1}
                  step={0.1}
                  className="tabular-nums"
                  placeholder="e.g., 7"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  RICE Score
                </span>
                <motion.span
                  key={`rice-score-${riceScore}-${scoringMethod}`}
                  initial={{ scale: 1.3, color: 'oklch(0.58 0.18 195)' }}
                  animate={{ scale: 1, color: 'oklch(0.65 0.20 310)' }}
                  transition={{ 
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 300, damping: 20 }
                  }}
                  className="text-xl font-bold tabular-nums"
                >
                  {riceScore.toFixed(1)}
                </motion.span>
              </div>
            </div>
          </TooltipProvider>
        )}
        </motion.div>

        {/* Compliance & Security Footnote Section */}
        {hasComplianceInfo && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <button
              onClick={() => setShowCompliance(!showCompliance)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Scales size={14} />
              <ShieldCheck size={14} />
              <span>Compliance & Security Notes</span>
              {showCompliance ? <CaretUp size={12} /> : <CaretDown size={12} />}
            </button>
            
            <AnimatePresence>
              {showCompliance && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3 text-xs">
                    {/* AI Regulations */}
                    {useCase.aiRegulations && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Scales size={12} />
                          <span className="font-medium">AI Regulations</span>
                          {useCase.aiRegulations.riskClassification && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {RISK_LEVEL_LABELS[useCase.aiRegulations.riskClassification] || useCase.aiRegulations.riskClassification}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {useCase.aiRegulations.applicableFrameworks?.map((framework) => (
                            <Badge 
                              key={framework} 
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-4 bg-muted/50"
                            >
                              {REGULATION_LABELS[framework] || framework}
                            </Badge>
                          ))}
                        </div>
                        {useCase.aiRegulations.jurisdictions && useCase.aiRegulations.jurisdictions.length > 0 && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Jurisdictions:</span> {useCase.aiRegulations.jurisdictions.join(', ')}
                          </div>
                        )}
                        {useCase.aiRegulations.complianceNotes && (
                          <p className="text-muted-foreground italic">{useCase.aiRegulations.complianceNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Cybersecurity */}
                    {useCase.cybersecurity && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ShieldCheck size={12} />
                          <span className="font-medium">Cybersecurity</span>
                          {useCase.cybersecurity.dataClassification && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {DATA_CLASSIFICATION_LABELS[useCase.cybersecurity.dataClassification] || useCase.cybersecurity.dataClassification}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {useCase.cybersecurity.securityRequirements?.map((req) => (
                            <Badge 
                              key={req} 
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-4 bg-muted/50"
                            >
                              {SECURITY_REQUIREMENT_LABELS[req] || req}
                            </Badge>
                          ))}
                        </div>
                        {useCase.cybersecurity.securityNotes && (
                          <p className="text-muted-foreground italic">{useCase.cybersecurity.securityNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
