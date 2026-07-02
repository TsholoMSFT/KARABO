/**
 * Page 14 — CSDR Agenda Builder.
 *
 * Reuses the existing engagement AgendaBuilderDialog + generateEngagementAgenda
 * engine, pre-seeded with CSDR (Customer Success Delivery Review) context and a
 * grounding transcript built from the account's value gaps and health signals.
 */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarBlank, Copy, Sparkle } from '@phosphor-icons/react'
import { AgendaBuilderDialog, type EngagementToolContext } from '@/components/engagement/AgendaBuilderDialog'
import { computeAllScores, topValueGaps } from '@/lib/csam/scoring'
import { recommendNextBestActions } from '@/lib/csam/engine'
import type { CsamCustomerProfile } from '@/lib/csam/types'
import type { EngagementArtifact } from '@/lib/types'
import { EmptyState, PageHeader } from '../shared'

export function CsdrAgendaPage({ profile }: { profile: CsamCustomerProfile }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<EngagementArtifact | null>(null)

  const context = useMemo<EngagementToolContext>(() => {
    const scores = computeAllScores(profile)
    const gaps = topValueGaps(profile)
    const actions = recommendNextBestActions(profile).slice(0, 4)
    const stakeholders = [
      ...Object.values(profile.team ?? {}).filter((v): v is string => !!v),
      ...profile.investments.flatMap((i) => [i.sponsor, i.businessOwner].filter((v): v is string => !!v)),
    ]
    const transcript = [
      `CSDR planning context for ${profile.name}.`,
      `Scores: ${scores.map((s) => `${s.label} ${s.score}/100 (${s.colorState})`).join('; ')}.`,
      gaps.length ? `Top value gaps: ${gaps.join(' | ')}.` : '',
      actions.length ? `Candidate next actions: ${actions.map((a) => a.recommendation).join(' | ')}.` : '',
      'Goal: a value-led, non-accusatory review aligning on realised value, value at risk, and the forward plan.',
    ]
      .filter(Boolean)
      .join('\n')

    return {
      customerName: profile.name,
      industry: profile.industry,
      engagementType: 'Customer Success Delivery Review (CSDR)',
      useCases: profile.useCases.map((u) => ({ title: u.name, description: u.businessProblem })),
      stakeholders: [...new Set(stakeholders)],
      defaultTranscript: transcript,
    }
  }, [profile])

  const handleSave = (artifact: EngagementArtifact) => {
    setSaved(artifact)
  }

  const handleCopy = async () => {
    if (!saved) return
    try {
      await navigator.clipboard.writeText(saved.markdown)
      toast.success('Agenda copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSDR Agenda Builder"
        description="Generate a time-boxed Customer Success Delivery Review agenda, grounded in this account's value gaps, health signals and next actions."
        icon={<CalendarBlank size={24} />}
        actions={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Sparkle size={16} /> Build CSDR agenda
          </Button>
        }
      />

      {saved ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{saved.title}</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2"><Copy size={14} /> Copy</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm leading-relaxed">
              {saved.markdown.split('\n').map((line, i) => {
                const t = line.trim()
                if (!t) return <div key={i} className="h-1.5" />
                if (t.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-2">{t.slice(3)}</h3>
                if (t.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-2">{t.slice(2)}</h2>
                if (t.startsWith('- ')) return <p key={i} className="pl-4"><span className="text-muted-foreground">• </span>{t.slice(2)}</p>
                return <p key={i}>{t}</p>
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState>No agenda yet. Click “Build CSDR agenda” to generate one from this account's signals, then edit and export it.</EmptyState>
      )}

      <AgendaBuilderDialog open={open} onOpenChange={setOpen} context={context} onSaveArtifact={handleSave} />
    </div>
  )
}
