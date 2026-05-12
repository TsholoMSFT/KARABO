/**
 * ATMScoreCard — Expandable detail panel for ATM qualification
 *
 * Renders:
 * - Radar chart (5 dimensions)
 * - Per-dimension breakdown with component scores
 * - Gap recommendations
 * - Methodology explainer
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ATMScore,
  ATMDimensionScore,
  ATMComponentScore,
  ATM_TIER_CONFIG,
  ATM_DIMENSION_LABELS,
  ATM_DIMENSION_DESCRIPTIONS,
} from '@/lib/types'
import type { AccountSegment } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CaretDown,
  CaretUp,
  Info,
  Lightning,
  Target,
  ShieldCheck,
  Cube,
  ArrowsOutSimple,
  CheckCircle,
  WarningCircle,
  Question,
} from '@phosphor-icons/react'

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ATMScoreCardProps {
  atmScore: ATMScore
  className?: string
  accountSegment?: AccountSegment
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ATMScoreCard({ atmScore, className = '', accountSegment = 'enterprise' }: ATMScoreCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showMethodology, setShowMethodology] = useState(false)
  const tier = ATM_TIER_CONFIG[atmScore.tier]
  const isInsufficient = atmScore.tier === 'insufficient-data'

  // SME&C: ATM scoring hidden entirely (caller should not render, but guard anyway)
  if (accountSegment === 'smec') return null

  // Majors Growth: summary-only — show tier + composite + top 3 gap recommendations
  if (accountSegment === 'majors-growth') {
    const topGaps = atmScore.gapRecommendations.slice(0, 3)
    return (
      <div className={`border rounded-lg ${tier.borderColor} ${tier.bgColor} p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg">{tier.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${tier.color}`}>ATM: {tier.label}</span>
              {!isInsufficient && <span className="text-xs text-muted-foreground">{Math.round(atmScore.compositeScore)}/100</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
          </div>
        </div>
        {topGaps.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Top improvement actions:</p>
            {topGaps.map((gap, i) => (
              <div key={i} className="text-xs flex items-start gap-2">
                <Lightning size={12} className="mt-0.5 text-amber-500 flex-shrink-0" />
                <span>{gap.action} <span className="text-muted-foreground">(+{gap.potentialPointsGain} pts)</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${tier.borderColor} ${tier.bgColor} overflow-hidden ${className}`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{tier.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${tier.color}`}>
                ATM: {tier.label}
              </span>
              {!isInsufficient && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(atmScore.compositeScore)}/100
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tier.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Pillar dots */}
          {!isInsufficient && (
            <div className="flex gap-1">
              {(['ai', 'apps', 'data'] as const).map((p) => (
                <div
                  key={p}
                  className={`w-2 h-2 rounded-full ${
                    atmScore.pillarsCovered.includes(p)
                      ? 'bg-accent'
                      : 'bg-muted-foreground/30'
                  }`}
                  title={`${p.toUpperCase()} pillar ${
                    atmScore.pillarsCovered.includes(p) ? 'covered' : 'not covered'
                  }`}
                />
              ))}
            </div>
          )}
          {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/30">
              {/* Radar chart (SVG) */}
              {!isInsufficient && (
                <div className="flex justify-center pt-4">
                  <RadarChart dimensions={atmScore.dimensions} />
                </div>
              )}

              {/* Dimension breakdowns */}
              <div className="space-y-3 pt-2">
                {atmScore.dimensions.map((dim) => (
                  <DimensionRow key={dim.dimension} dimension={dim} />
                ))}
              </div>

              {/* Pillar coverage detail */}
              {!isInsufficient && (
                <div className="pt-2 border-t border-border/30">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                    Multi-Pillar Coverage
                  </h4>
                  <div className="flex gap-3">
                    {(['ai', 'apps', 'data'] as const).map((p) => {
                      const covered = atmScore.pillarsCovered.includes(p)
                      return (
                        <div
                          key={p}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${
                            covered
                              ? 'border-accent/40 bg-accent/10 text-accent-foreground font-medium'
                              : 'border-muted bg-muted/20 text-muted-foreground'
                          }`}
                        >
                          {covered ? (
                            <CheckCircle size={14} weight="fill" className="text-green-400" />
                          ) : (
                            <WarningCircle size={14} className="text-muted-foreground/60" />
                          )}
                          {p.toUpperCase()}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Gap recommendations */}
              {atmScore.gapRecommendations.length > 0 && (
                <div className="pt-2 border-t border-border/30">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                    Gap Recommendations ({atmScore.gapRecommendations.length})
                  </h4>
                  <div className="space-y-2">
                    {atmScore.gapRecommendations.slice(0, 5).map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs"
                      >
                        <PriorityIndicator priority={rec.priority} />
                        <div>
                          <span className="text-foreground">{rec.recommendation}</span>
                          <span className="text-muted-foreground/70 ml-1">
                            — {ATM_DIMENSION_LABELS[rec.dimension]}
                            {rec.potentialPointsGain > 0 && (
                              <> (+{rec.potentialPointsGain} pts)</>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                    {atmScore.gapRecommendations.length > 5 && (
                      <p className="text-[10px] text-muted-foreground italic">
                        +{atmScore.gapRecommendations.length - 5} more recommendations
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence & methodology */}
              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/70 italic">
                  Confidence: {Math.round(atmScore.confidence * 100)}% of scoring components assessed
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMethodology(!showMethodology)
                  }}
                >
                  <Info size={12} className="mr-1" />
                  {showMethodology ? 'Hide' : 'Methodology'}
                </Button>
              </div>

              <AnimatePresence>
                {showMethodology && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <MethodologyExplainer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// DIMENSION ROW
// ============================================================================

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  'business-impact': <Target size={14} />,
  'innovation-agentic': <Lightning size={14} />,
  'enterprise-grade': <ShieldCheck size={14} />,
  'multi-pillar': <Cube size={14} />,
  'repeatability': <ArrowsOutSimple size={14} />,
}

function DimensionRow({ dimension }: { dimension: ATMDimensionScore }) {
  const [showComponents, setShowComponents] = useState(false)

  return (
    <div>
      <button
        onClick={() => setShowComponents(!showComponents)}
        className="w-full flex items-center gap-2 py-1 hover:bg-white/5 rounded transition-colors text-left"
      >
        <span className="text-muted-foreground">
          {DIMENSION_ICONS[dimension.dimension] ?? <Question size={14} />}
        </span>
        <span className="text-xs font-medium text-foreground flex-1">
          {dimension.label}
        </span>
        {/* Score bar */}
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${dimension.normalizedScore}%`,
              backgroundColor: getScoreColor(dimension.normalizedScore),
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(dimension.normalizedScore)}
        </span>
        {showComponents ? <CaretUp size={12} /> : <CaretDown size={12} />}
      </button>

      <AnimatePresence>
        {showComponents && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-5 mt-1 space-y-1"
          >
            {dimension.components.map((comp) => (
              <ComponentRow key={comp.name} component={comp} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// COMPONENT ROW
// ============================================================================

function ComponentRow({ component }: { component: ATMComponentScore }) {
  const pct = component.maxPoints > 0
    ? (component.earnedPoints / component.maxPoints) * 100
    : 0

  return (
    <div className="flex items-start gap-2 py-0.5 text-[11px]">
      <StatusDot status={component.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground/80 truncate">{component.name}</span>
          <span className="text-muted-foreground whitespace-nowrap">
            {component.earnedPoints}/{component.maxPoints}
          </span>
        </div>
        {component.status !== 'not-assessed' && component.explanation && (
          <p className="text-muted-foreground/60 text-[10px] mt-0.5 leading-tight">
            {component.explanation}
          </p>
        )}
        {component.recommendation && (
          <p className="text-amber-400/80 text-[10px] mt-0.5 leading-tight">
            → {component.recommendation}
          </p>
        )}
      </div>
      {/* Mini bar */}
      <div className="w-10 h-1 rounded-full bg-muted mt-1.5 shrink-0">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: getScoreColor(pct),
          }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// STATUS DOT
// ============================================================================

function StatusDot({ status }: { status: ATMComponentScore['status'] }) {
  const colors: Record<typeof status, string> = {
    scored: 'bg-green-400',
    partial: 'bg-amber-400',
    'not-assessed': 'bg-muted-foreground/30',
  }
  return (
    <div
      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors[status]}`}
      title={status === 'not-assessed' ? 'Not yet assessed' : status}
    />
  )
}

// ============================================================================
// PRIORITY INDICATOR
// ============================================================================

function PriorityIndicator({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles: Record<typeof priority, string> = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-muted-foreground',
  }
  const labels: Record<typeof priority, string> = {
    high: '▲',
    medium: '■',
    low: '▽',
  }
  return (
    <span className={`${styles[priority]} text-[10px] mt-0.5 shrink-0`} title={`${priority} priority`}>
      {labels[priority]}
    </span>
  )
}

// ============================================================================
// RADAR CHART (pure SVG)
// ============================================================================

function RadarChart({ dimensions }: { dimensions: ATMDimensionScore[] }) {
  const size = 180
  const cx = size / 2
  const cy = size / 2
  const maxR = 70
  const levels = 4 // grid rings

  // Order dimensions consistently
  const ordered = [
    'business-impact',
    'innovation-agentic',
    'enterprise-grade',
    'multi-pillar',
    'repeatability',
  ]
  const dims = ordered.map(
    (d) => dimensions.find((dim) => dim.dimension === d) ?? { dimension: d, normalizedScore: 0, label: d }
  )
  const n = dims.length
  const angleStep = (Math.PI * 2) / n

  // Convert score (0-100) to a point on the radar
  const getPoint = (index: number, score: number): [number, number] => {
    const angle = -Math.PI / 2 + index * angleStep
    const r = (score / 100) * maxR
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  // Grid rings
  const gridRings = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxR
    return dims
      .map((_, idx) => {
        const angle = -Math.PI / 2 + idx * angleStep
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
      })
      .join(' ')
  })

  // Data polygon
  const dataPoints = dims.map((d, i) => getPoint(i, d.normalizedScore))
  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(' ')

  // Axis lines
  const axisEnds = dims.map((_, i) => getPoint(i, 100))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {gridRings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="oklch(0.5 0 0 / 0.15)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {axisEnds.map(([x, y], i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke="oklch(0.5 0 0 / 0.1)"
          strokeWidth={0.5}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="oklch(0.7 0.15 295 / 0.15)"
        stroke="oklch(0.7 0.15 295)"
        strokeWidth={1.5}
      />

      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={3}
          fill="oklch(0.75 0.15 295)"
          stroke="oklch(0.3 0 0)"
          strokeWidth={1}
        />
      ))}

      {/* Labels */}
      {dims.map((d, i) => {
        const [x, y] = getPoint(i, 120) // slightly outside the chart
        const label = 'label' in d ? (d as ATMDimensionScore).label : d.dimension
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={8}
          >
            {label.length > 14 ? label.slice(0, 12) + '…' : label}
          </text>
        )
      })}
    </svg>
  )
}

// ============================================================================
// METHODOLOGY EXPLAINER
// ============================================================================

function MethodologyExplainer() {
  return (
    <div className="bg-muted/20 rounded p-3 space-y-2 text-[11px] text-muted-foreground">
      <h5 className="font-semibold text-foreground text-xs">How ATM Scoring Works</h5>
      <p>
        Microsoft's <strong>Apps That Matter</strong> framework defines five qualitative criteria
        for high-impact opportunities. ID-8 quantifies these into a 0–100 composite score
        using data already captured during discovery sessions.
      </p>
      <div className="space-y-1">
        <div><strong>Business Impact</strong> (25%) — Strategic alignment, financial metrics, RICE, KPIs</div>
        <div><strong>Innovation/Agentic</strong> (25%) — Agentic patterns, automation level, architecture</div>
        <div><strong>Enterprise-Grade</strong> (20%) — Regulatory, security, risk assessment, maturity</div>
        <div><strong>Multi-Pillar</strong> (15%) — AI + Apps + Data coverage, service depth</div>
        <div><strong>Repeatability</strong> (15%) — Reference architectures, industry plays</div>
      </div>
      <p className="italic text-[10px]">
        This is ID-8's interpretation — the official ATM criteria are qualitative (pass/fail).
        The numerical model helps identify gaps and strengthen opportunities before pipeline tagging.
      </p>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'oklch(0.72 0.18 295)'  // purple
  if (score >= 60) return 'oklch(0.75 0.16 80)'   // amber
  if (score >= 40) return 'oklch(0.65 0.08 250)'  // slate-blue
  return 'oklch(0.55 0.06 250)'                    // muted
}
