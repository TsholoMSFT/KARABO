/**
 * CAFReadinessPanel — Cloud Adoption Framework readiness assessment
 * 
 * Shows a 7-axis radar chart for CAF pillar maturity and a lifecycle stage selector.
 * Uses inline SVG for the radar (no external chart library dependency).
 */

import { useMemo, useState } from 'react'
import { Compass, ChartPolar, ArrowRight, Info, CaretDown, CaretUp } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  CAFCapability,
  CAFLifecycleStage,
  CAFMaturityLevel,
} from '@/lib/types'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  cafStage?: CAFLifecycleStage
  cafCapabilityMaturity?: Partial<Record<CAFCapability, CAFMaturityLevel>>
  onStageChange?: (stage: CAFLifecycleStage) => void
  onMaturityChange?: (pillar: CAFCapability, level: CAFMaturityLevel) => void
  readOnly?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MATURITY_LEVELS: { value: CAFMaturityLevel; label: string; numericValue: number }[] = [
  { value: 'initial', label: 'Initial', numericValue: 1 },
  { value: 'developing', label: 'Developing', numericValue: 2 },
  { value: 'defined', label: 'Defined', numericValue: 3 },
  { value: 'managed', label: 'Managed', numericValue: 4 },
  { value: 'optimizing', label: 'Optimizing', numericValue: 5 },
]

const LIFECYCLE_STAGES: { value: CAFLifecycleStage; label: string }[] = [
  { value: 'define', label: 'Define Strategy' },
  { value: 'plan', label: 'Plan' },
  { value: 'ready', label: 'Ready' },
  { value: 'adopt', label: 'Adopt' },
  { value: 'govern-manage', label: 'Govern & Manage' },
]

const CAF_PILLARS: CAFCapability[] = [
  'strategy',
  'plan',
  'ready',
  'adopt',
  'govern',
  'manage',
  'secure',
]

const PILLAR_COLORS: Record<CAFCapability, string> = {
  'strategy': '#3b82f6',
  'plan': '#8b5cf6',
  'ready': '#f59e0b',
  'adopt': '#10b981',
  'govern': '#ef4444',
  'manage': '#6366f1',
  'secure': '#ec4899',
}

const PILLAR_LABELS: Record<CAFCapability, string> = {
  strategy: 'Strategy',
  plan: 'Plan',
  ready: 'Ready',
  adopt: 'Adopt',
  govern: 'Govern',
  manage: 'Manage',
  secure: 'Secure',
}

function getMaturityNumeric(level?: CAFMaturityLevel): number {
  if (!level) return 0
  return MATURITY_LEVELS.find(m => m.value === level)?.numericValue ?? 0
}

// ============================================================================
// RADAR CHART (inline SVG)
// ============================================================================

function RadarChart({
  maturity,
}: {
  maturity: Partial<Record<CAFCapability, CAFMaturityLevel>>
}) {
  const cx = 120
  const cy = 120
  const maxR = 90
  const levels = 5

  const points = useMemo(() => {
    const n = CAF_PILLARS.length
    return CAF_PILLARS.map((pillar, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const value = getMaturityNumeric(maturity[pillar])
      const r = (value / levels) * maxR
      return {
        pillar,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        labelX: cx + (maxR + 20) * Math.cos(angle),
        labelY: cy + (maxR + 20) * Math.sin(angle),
        angle,
        value,
      }
    })
  }, [maturity])

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxR
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={1}
      />
    )
  })

  // Grid lines (spokes)
  const spokes = CAF_PILLARS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / CAF_PILLARS.length - Math.PI / 2
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={cx + maxR * Math.cos(angle)}
        y2={cy + maxR * Math.sin(angle)}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={1}
      />
    )
  })

  // Data polygon
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto text-foreground">
      {gridCircles}
      {spokes}

      {/* Data area */}
      <polygon
        points={polygonPoints}
        fill="hsl(var(--primary))"
        fillOpacity={0.15}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map(p => (
        <circle
          key={p.pillar}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={PILLAR_COLORS[p.pillar]}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {points.map(p => {
        return (
          <text
            key={p.pillar}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] fill-muted-foreground font-medium"
          >
            {PILLAR_LABELS[p.pillar] ?? p.pillar}
          </text>
        )
      })}
    </svg>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CAFReadinessPanel({
  cafStage,
  cafCapabilityMaturity = {},
  onStageChange,
  onMaturityChange,
  readOnly = false,
}: Props) {
  const [showMethodology, setShowMethodology] = useState(false)
  const assessedCount = Object.keys(cafCapabilityMaturity).length
  const avgMaturity = assessedCount > 0
    ? (Object.values(cafCapabilityMaturity).reduce((sum, lvl) => sum + getMaturityNumeric(lvl as CAFMaturityLevel), 0) / assessedCount).toFixed(1)
    : '—'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Compass weight="duotone" className="h-4 w-4" />
        <span>Cloud Adoption Framework (CAF) Readiness</span>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {assessedCount}/{CAF_PILLARS.length} assessed · avg {avgMaturity}/5
        </Badge>
      </div>

      {/* Methodology explainer */}
      <div className="rounded-md border border-muted">
        <button
          type="button"
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info size={14} weight="fill" className="text-blue-500 flex-shrink-0" />
          <span className="flex-1 text-left">About CAF Readiness Assessment</span>
          {showMethodology ? <CaretUp size={12} /> : <CaretDown size={12} />}
        </button>
        {showMethodology && (
          <div className="px-3 pb-3 space-y-2 text-[11px] text-muted-foreground border-t border-muted pt-2">
            <p>
              The <span className="font-medium text-foreground/80">Cloud Adoption Framework (CAF)</span> is Microsoft's
              proven guidance for cloud adoption. This assessment evaluates readiness across 7 pillars:
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><span className="font-medium">Strategy</span> — Business justification and expected outcomes</li>
              <li><span className="font-medium">Plan</span> — Actionable adoption plan aligned to business outcomes</li>
              <li><span className="font-medium">Ready</span> — Azure environment preparation (landing zones)</li>
              <li><span className="font-medium">Adopt</span> — Migration and innovation workload deployment</li>
              <li><span className="font-medium">Govern</span> — Governance policies, cost management, security baseline</li>
              <li><span className="font-medium">Manage</span> — Operations management and monitoring</li>
              <li><span className="font-medium">Secure</span> — Security controls, identity, and threat protection</li>
            </ul>
            <p className="italic text-[10px]">
              Maturity levels: 1 (Initial) → 5 (Optimizing). The radar chart visualises the current maturity profile.
              Scores are self-assessed and should be validated with technical stakeholders.
            </p>
          </div>
        )}
      </div>

      {/* Lifecycle stage */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Lifecycle Stage</Label>
        <Select
          value={cafStage ?? ''}
          onValueChange={v => onStageChange?.(v as CAFLifecycleStage)}
          disabled={readOnly}
        >
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="Select CAF stage…" />
          </SelectTrigger>
          <SelectContent>
            {LIFECYCLE_STAGES.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lifecycle progress indicator */}
      {cafStage && (
        <div className="flex items-center gap-1 text-xs">
          {LIFECYCLE_STAGES.map((s, i) => {
            const current = LIFECYCLE_STAGES.findIndex(ls => ls.value === cafStage)
            const isPast = i < current
            const isCurrent = i === current
            return (
              <div key={s.value} className="flex items-center gap-1">
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                    ${isPast ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                    ${!isPast && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {s.label}
                </span>
                {i < LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Radar chart */}
      <RadarChart maturity={cafCapabilityMaturity} />

      {/* Pillar maturity selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CAF_PILLARS.map(pillar => {
          const pillarLabel = PILLAR_LABELS[pillar] ?? pillar
          return (
            <div key={pillar} className="flex items-center gap-2 p-1.5 rounded border border-muted">
              <ChartPolar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Label className="text-xs font-medium flex-1 min-w-0 truncate" title={pillarLabel}>
                {pillarLabel}
              </Label>
              <Select
                value={cafCapabilityMaturity[pillar] ?? ''}
                onValueChange={v => onMaturityChange?.(pillar, v as CAFMaturityLevel)}
                disabled={readOnly}
              >
                <SelectTrigger className="h-7 text-[11px] w-[110px]">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_LEVELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.numericValue}. {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
