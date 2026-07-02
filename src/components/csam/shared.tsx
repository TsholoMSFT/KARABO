/**
 * Shared presentational helpers for the CSAM cockpit. Kept dependency-light
 * (Card / Badge only) so every page stays consistent and easy to render.
 */
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CONFIDENCE_LABELS,
  COLOR_STATE_BADGE_CLASSES,
  COLOR_STATE_DOT,
  COLOR_STATE_LABELS,
  DATA_CLASSIFICATION_BADGE_CLASSES,
  DATA_CLASSIFICATION_LABELS,
  VALIDATION_STATUS_BADGE_CLASSES,
  VALIDATION_STATUS_LABELS,
} from '@/lib/csam/guardrails'
import type {
  CockpitScore,
  ColorState,
  CsamConfidence,
  DataClassification,
  ValidationStatus,
} from '@/lib/csam/types'

export function formatUSD(amount?: number): string {
  if (amount == null) return '—'
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

const CONFIDENCE_CLASSES: Record<CsamConfidence, string> = {
  insufficient: 'bg-gray-100 text-gray-600 border-gray-300',
  low: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-sky-100 text-sky-700 border-sky-300',
  high: 'bg-emerald-100 text-emerald-700 border-emerald-300',
}

export function ColorDot({ state, className = '' }: { state: ColorState; className?: string }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${COLOR_STATE_DOT[state]} ${className}`} />
}

export function StateBadge({ state, label }: { state: ColorState; label?: string }) {
  return (
    <Badge variant="outline" className={`gap-1.5 ${COLOR_STATE_BADGE_CLASSES[state]}`}>
      <ColorDot state={state} />
      {label ?? COLOR_STATE_LABELS[state]}
    </Badge>
  )
}

export function ConfidenceBadge({ confidence }: { confidence: CsamConfidence }) {
  return (
    <Badge variant="outline" className={CONFIDENCE_CLASSES[confidence]}>
      {CONFIDENCE_LABELS[confidence]}
    </Badge>
  )
}

export function ClassificationBadge({ classification }: { classification: DataClassification }) {
  return (
    <Badge variant="outline" className={DATA_CLASSIFICATION_BADGE_CLASSES[classification]}>
      {DATA_CLASSIFICATION_LABELS[classification]}
    </Badge>
  )
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  return (
    <Badge variant="outline" className={VALIDATION_STATUS_BADGE_CLASSES[status]}>
      {VALIDATION_STATUS_LABELS[status]}
    </Badge>
  )
}

const METER_FILL: Record<ColorState, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  grey: 'bg-gray-400',
}

// Fixed width classes (5% steps) — kept as literals so Tailwind's JIT emits them
// and we avoid inline styles (repo lint rule).
const WIDTH_CLASS: Record<number, string> = {
  0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]', 25: 'w-1/4',
  30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]', 50: 'w-1/2', 55: 'w-[55%]',
  60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]', 75: 'w-3/4', 80: 'w-[80%]', 85: 'w-[85%]',
  90: 'w-[90%]', 95: 'w-[95%]', 100: 'w-full',
}

export function widthClass(value: number): string {
  const p = Math.max(0, Math.min(100, Math.round(value / 5) * 5))
  return WIDTH_CLASS[p] ?? 'w-0'
}

export function Meter({ value, state = 'grey' }: { value: number; state?: ColorState }) {
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${METER_FILL[state]} ${widthClass(value)}`} />
    </div>
  )
}

/** Renders one of the five executive scores (Section 1). */
export function ScoreCard({ score }: { score: CockpitScore }) {
  return (
    <Card className="bg-card">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{score.label}</p>
          <ColorDot state={score.colorState} className="mt-1" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tabular-nums">{score.score}</span>
          <span className="text-xs text-muted-foreground mb-1">/ 100</span>
        </div>
        <Meter value={score.score} state={score.colorState} />
        <div className="flex items-center justify-between">
          <ConfidenceBadge confidence={score.confidence} />
          <StateBadge state={score.colorState} />
        </div>
        {score.rationale && <p className="text-xs text-muted-foreground leading-snug">{score.rationale}</p>}
      </CardContent>
    </Card>
  )
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-primary">{icon}</div>}
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function InfoCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${className}`}>{children}</span>
  )
}
