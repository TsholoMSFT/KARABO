/**
 * Page 9  — Value Hypothesis Builder (Section 4)
 * Page 10 — CSDR-ready Narrative Generator (Section 8)
 * Page 11 — Next Best CSAM Action engine (Section 9)
 */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Sparkle, FloppyDisk, ArrowClockwise, Copy, Lightbulb, ChatText } from '@phosphor-icons/react'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { generateCsdrNarrative, generateValueHypothesis, recommendNextBestActions } from '@/lib/csam/engine'
import { lintNarrative } from '@/lib/csam/guardrails'
import {
  ACTION_TIMEFRAME_LABELS,
  BEHAVIOURAL_BLOCKER_LABELS,
  type ActionPlan,
  type ActionTimeframe,
  type BehaviouralBlockerId,
  type CsamCustomerProfile,
  type ValueHypothesis,
  type ValueHypothesisInput,
  type ValueHypothesisOutputs,
} from '@/lib/csam/types'
import { ConfidenceBadge, EmptyState, PageHeader } from '../shared'

// ============================================================================
// Value Hypothesis Builder
// ============================================================================

const EMPTY_INPUT: ValueHypothesisInput = {
  investment: '',
  problem: '',
  process: '',
  persona: '',
  metric: '',
  financialLine: '',
  usageEvidence: '',
  healthEvidence: '',
  supportPattern: '',
  unlockingAction: '',
  sponsor: '',
}

export function ValueHypothesisPage({
  profile,
  onSave,
}: {
  profile: CsamCustomerProfile
  onSave?: (h: ValueHypothesis) => void
}) {
  const [input, setInput] = useState<ValueHypothesisInput>(EMPTY_INPUT)
  const [outputs, setOutputs] = useState<ValueHypothesisOutputs | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof ValueHypothesisInput>(key: K, value: ValueHypothesisInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const canGenerate = input.investment.trim() && input.problem.trim() && input.metric.trim()

  const handleGenerate = async () => {
    setBusy(true)
    try {
      const result = await generateValueHypothesis(input, { customerName: profile.name, industry: profile.industry })
      setOutputs(result)
    } catch {
      toast.error('Could not generate the value hypothesis. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => {
    if (!outputs) return
    const hypothesis: ValueHypothesis = {
      id: `vh-${Date.now()}`,
      customerId: profile.customerId,
      createdAt: Date.now(),
      ...input,
      ...outputs,
    }
    onSave?.(hypothesis)
    toast.success('Value hypothesis saved')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Value Hypothesis Builder"
        description="Turn an investment into a testable value hypothesis with a CSDR narrative, behavioural read and a 30/60/90 plan."
        icon={<Lightbulb size={24} />}
        actions={<AIBadge />}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Text label="Investment made *" value={input.investment} onChange={(v) => set('investment', v)} placeholder="e.g. Microsoft 365 Copilot (4,000 licences)" />
          <Text label="Problem it should solve *" value={input.problem} onChange={(v) => set('problem', v)} placeholder="e.g. reps spend hours on admin, not selling" />
          <Text label="Business process that should change" value={input.process} onChange={(v) => set('process', v)} placeholder="e.g. account follow-up & CRM hygiene" />
          <Text label="Persona / team that must adopt" value={input.persona} onChange={(v) => set('persona', v)} placeholder="e.g. sales & service reps" />
          <Text label="Metric that should improve *" value={input.metric} onChange={(v) => set('metric', v)} placeholder="e.g. hours saved/week; revenue per employee" />
          <Text label="Financial line that should move" value={input.financialLine} onChange={(v) => set('financialLine', v)} placeholder="e.g. G&A expense (productivity)" />
          <Text label="Usage / adoption evidence" value={input.usageEvidence ?? ''} onChange={(v) => set('usageEvidence', v)} placeholder="e.g. 900 of 3,200 assigned active" />
          <Text label="Operational health evidence" value={input.healthEvidence ?? ''} onChange={(v) => set('healthEvidence', v)} placeholder="e.g. partial usage telemetry" />
          <div className="space-y-1.5">
            <Label htmlFor="vh-blocker">Suspected behavioural blocker</Label>
            <select
              id="vh-blocker"
              title="Suspected behavioural blocker"
              aria-label="Suspected behavioural blocker"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              value={input.behaviouralBlocker ?? ''}
              onChange={(e) => set('behaviouralBlocker', (e.target.value || undefined) as BehaviouralBlockerId | undefined)}
            >
              <option value="">— unknown —</option>
              {(Object.keys(BEHAVIOURAL_BLOCKER_LABELS) as BehaviouralBlockerId[]).map((b) => (
                <option key={b} value={b}>{BEHAVIOURAL_BLOCKER_LABELS[b]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vh-gap">Estimated value gap (USD)</Label>
            <Input
              id="vh-gap"
              type="number"
              value={input.estimatedValueGapUSD ?? ''}
              onChange={(e) => set('estimatedValueGapUSD', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 250000"
            />
          </div>
          <Text label="Unlocking action idea" value={input.unlockingAction ?? ''} onChange={(v) => set('unlockingAction', v)} placeholder="e.g. role-based adoption play" />
          <Text label="Sponsor" value={input.sponsor ?? ''} onChange={(v) => set('sponsor', v)} placeholder="e.g. VP Sales Ops" />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={handleGenerate} disabled={!canGenerate || busy} className="gap-2">
          {busy ? <ArrowClockwise size={16} className="animate-spin" /> : <Sparkle size={16} />}
          {busy ? 'Generating…' : 'Generate value hypothesis'}
        </Button>
        {outputs && onSave && (
          <Button variant="outline" onClick={handleSave} className="gap-2"><FloppyDisk size={16} /> Save</Button>
        )}
      </div>

      {outputs && (
        <div className="space-y-4">
          <OutputCard title="Value hypothesis statement" text={outputs.statement} />
          <OutputCard title="CSDR-ready narrative" text={outputs.csdrNarrative} />
          <OutputCard title="Behavioural adoption hypothesis" text={outputs.behaviouralHypothesis} />
          <OutputCard title="Recommended intervention" text={outputs.interventionPlan} />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">30 / 60 / 90-day plan</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <PlanCol title="First 30 days" items={outputs.plan306090.d30} />
              <PlanCol title="By 60 days" items={outputs.plan306090.d60} />
              <PlanCol title="By 90 days" items={outputs.plan306090.d90} />
            </CardContent>
          </Card>
          <InlineDisclaimer text="AI-generated draft. Treat financial-statement impacts as hypotheses to validate with the customer, not realised value." />
        </div>
      )}
    </div>
  )
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function OutputCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-sm leading-relaxed">{text}</p></CardContent>
    </Card>
  )
}

function PlanCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium mb-1">{title}</p>
      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
        {items.map((it, i) => <li key={i}><span className="text-foreground">{it}</span></li>)}
      </ul>
    </div>
  )
}

// ============================================================================
// CSDR Narrative Generator
// ============================================================================

export function CsdrNarrativePage({ profile }: { profile: CsamCustomerProfile }) {
  const [markdown, setMarkdown] = useState('')
  const [busy, setBusy] = useState(false)
  const warnings = useMemo(() => (markdown ? lintNarrative(markdown) : []), [markdown])

  const handleGenerate = async () => {
    setBusy(true)
    try {
      const md = await generateCsdrNarrative(profile)
      setMarkdown(md)
    } catch {
      toast.error('Could not generate the CSDR narrative.')
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      toast.success('CSDR narrative copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSDR Narrative Builder"
        description="Convert the cockpit insights into a Customer Success Delivery Review narrative — customer-centric, evidence-led, non-accusatory."
        icon={<ChatText size={24} />}
        actions={<AIBadge />}
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleGenerate} disabled={busy} className="gap-2">
          {busy ? <ArrowClockwise size={16} className="animate-spin" /> : <Sparkle size={16} />}
          {busy ? 'Generating…' : markdown ? 'Regenerate' : 'Generate CSDR narrative'}
        </Button>
        {markdown && <Button variant="outline" onClick={handleCopy} className="gap-2"><Copy size={16} /> Copy</Button>}
      </div>

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
          <p className="font-medium">Tone check:</p>
          {warnings.map((w, i) => <p key={i}>• {w}</p>)}
        </div>
      )}

      {markdown ? (
        <Card>
          <CardContent className="pt-5">
            <MarkdownLite markdown={markdown} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState>Generate a CSDR narrative grounded in {profile.name}&apos;s scores, gaps and health signals.</EmptyState>
      )}
      {markdown && <InlineDisclaimer text="AI-generated narrative. Review for accuracy and validate financial impacts with the customer before sharing." />}
    </div>
  )
}

/** Minimal, safe markdown renderer for headings, bullets and paragraphs. */
function MarkdownLite({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const t = line.trim()
        if (!t) return <div key={i} className="h-1.5" />
        if (t.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2">{t.slice(4)}</h4>
        if (t.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-3">{t.slice(3)}</h3>
        if (t.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3">{t.slice(2)}</h2>
        if (t.startsWith('- ')) return <p key={i} className="pl-4 text-muted-foreground"><span className="text-foreground">• {t.slice(2)}</span></p>
        return <p key={i}>{t}</p>
      })}
    </div>
  )
}

// ============================================================================
// Next Best CSAM Action
// ============================================================================

const TIMEFRAME_CLASSES: Record<ActionTimeframe, string> = {
  'now': 'bg-red-100 text-red-700 border-red-300',
  'next-csdr': 'bg-amber-100 text-amber-700 border-amber-300',
  'next-quarter': 'bg-sky-100 text-sky-700 border-sky-300',
  'renewal-cycle': 'bg-violet-100 text-violet-700 border-violet-300',
}

const PRIORITY_CLASSES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  low: 'bg-gray-100 text-gray-600 border-gray-300',
}

export function NextBestActionPage({ profile }: { profile: CsamCustomerProfile }) {
  const actions = useMemo(() => recommendNextBestActions(profile), [profile])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Next Best CSAM Action"
        description="Prioritised, evidence-backed actions — each with a talk track, the financial line it could move, and a timeframe."
        icon={<Lightbulb size={24} />}
      />
      {actions.length ? (
        <div className="space-y-3">{actions.map((a) => <ActionCard key={a.id} a={a} />)}</div>
      ) : (
        <EmptyState>No actions to recommend right now.</EmptyState>
      )}
    </div>
  )
}

function ActionCard({ a }: { a: ActionPlan }) {
  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="font-medium">{a.recommendation}</p>
          <div className="flex items-center gap-2">
            {a.priority && <Badge variant="outline" className={`capitalize ${PRIORITY_CLASSES[a.priority]}`}>{a.priority}</Badge>}
            <Badge variant="outline" className={TIMEFRAME_CLASSES[a.timeframe]}>{ACTION_TIMEFRAME_LABELS[a.timeframe]}</Badge>
            <ConfidenceBadge confidence={a.confidence} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {a.why && <Kv label="Why" value={a.why} />}
          {a.evidence && <Kv label="Evidence" value={a.evidence} />}
          {a.expectedImpact && <Kv label="Expected impact" value={a.expectedImpact} />}
          {a.financialLine && <Kv label="Financial line" value={a.financialLine} />}
          {a.successMetric && <Kv label="Success metric" value={a.successMetric} />}
          {a.stakeholders?.length ? <Kv label="Stakeholders" value={a.stakeholders.join(', ')} /> : null}
        </div>
        {a.talkTrack && (
          <div className="rounded bg-muted/60 p-2 text-sm italic">“{a.talkTrack}”</div>
        )}
      </CardContent>
    </Card>
  )
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  )
}
