/**
 * Secure AI Assessment tab (Focus 3) — packages the existing governance /
 * regulatory / sovereign assessments into one ownable, versioned posture that
 * can be shared with the v-team and refreshed over time.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ArrowClockwise, ShieldCheck, MicrosoftTeamsLogo, Sparkle } from '@phosphor-icons/react'
import {
  buildSecureAIAssessment,
  refreshSecureAIAssessment,
  isRefreshOverdue,
} from '@/lib/secure-ai-assessment-engine'
import { openTeamsShare } from '@/lib/share-helpers'
import type {
  SecureAIAssessment, SecureAIAssessmentInput, SecurePostureBand,
} from '@/lib/fy27-types'
import { SECURE_POSTURE_BAND_LABELS } from '@/lib/fy27-types'

const BAND_COLOR: Record<SecurePostureBand, string> = {
  critical: 'text-red-600',
  'at-risk': 'text-orange-600',
  developing: 'text-amber-600',
  strong: 'text-green-600',
  leading: 'text-blue-600',
}

export interface SecureAiAssessmentTabProps {
  input: SecureAIAssessmentInput
  current?: SecureAIAssessment
  onSave: (a: SecureAIAssessment) => void
}

export function SecureAiAssessmentTab({ input, current, onSave }: SecureAiAssessmentTabProps) {
  const hasInputs = Boolean(input.governance || (input.regulatory && input.regulatory.length) || input.sovereign)

  const handleGenerate = () => {
    onSave(buildSecureAIAssessment(input))
    toast.success('Secure AI Assessment generated')
  }

  const handleRefresh = () => {
    if (!current) return
    onSave(refreshSecureAIAssessment(current, input))
    toast.success(`Refreshed to v${current.version + 1}`)
  }

  const handleShare = () => {
    if (!current) return
    const lines = [
      `Customer Secure AI Assessment — ${current.customerName} (v${current.version})`,
      `Posture: ${current.postureScore}/100 (${SECURE_POSTURE_BAND_LABELS[current.postureBand]})`,
      '',
      ...current.dimensions.map((d) => `• ${d.label}: ${d.score}/100`),
      '',
      ...(current.remediations.length ? ['Top remediations:', ...current.remediations.slice(0, 5).map((r) => `- [${r.priority}] ${r.title}: ${r.recommendation}`)] : []),
    ]
    openTeamsShare({ message: lines.join('\n'), topic: `Secure AI Assessment — ${current.customerName}` })
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <ShieldCheck className="mx-auto text-4xl text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No Secure AI Assessment yet. Generate one by aggregating this customer's AI-governance,
            regulatory-compliance and data-sovereignty assessments into a single posture.
          </p>
          <Button onClick={handleGenerate} disabled={!hasInputs}>
            <Sparkle className="mr-1.5" /> Generate assessment
          </Button>
          {!hasInputs && (
            <p className="text-xs text-orange-700">
              Complete an AI governance, compliance or sovereign-cloud assessment first.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const overdue = isRefreshOverdue(current)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck /> Customer Secure AI Assessment
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                v{current.version} · assessed {new Date(current.assessmentDate).toLocaleDateString()}
                {current.nextRefreshDue && (
                  <span className={overdue ? 'text-red-600 font-medium' : ''}>
                    {' · '}refresh due {new Date(current.nextRefreshDue).toLocaleDateString()}
                    {overdue ? ' (overdue)' : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={!hasInputs}>
                <ArrowClockwise className="mr-1.5" /> Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={handleShare}>
                <MicrosoftTeamsLogo className="mr-1.5" /> Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${BAND_COLOR[current.postureBand]}`}>
              {current.postureScore}
              <span className="text-lg text-muted-foreground font-normal">/100</span>
            </div>
            <div className="flex-1">
              <Progress value={current.postureScore} className="h-3" />
              <p className="mt-1 text-xs text-muted-foreground">
                Posture: {SECURE_POSTURE_BAND_LABELS[current.postureBand]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {current.dimensions.map((d) => (
          <Card key={d.key}>
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{d.label}</span>
                <Badge variant="outline">{d.score}/100</Badge>
              </div>
              <Progress value={d.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{d.summary}</p>
              {d.gaps.length > 0 && (
                <ul className="text-xs text-orange-700 list-disc pl-4 space-y-0.5">
                  {d.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {current.remediations.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Remediation roadmap</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {current.remediations.map((r) => (
              <div key={r.id} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 capitalize">{r.priority}</Badge>
                <div>
                  <span className="font-medium">{r.title}</span>
                  <p className="text-xs text-muted-foreground">{r.recommendation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
