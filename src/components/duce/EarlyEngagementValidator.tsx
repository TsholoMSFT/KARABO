import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react'
import type { EarlyValidationResult } from '@/lib/duce-types'

const ICONS = {
  pass: <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />,
  warn: <WarningCircle className="h-4 w-4 text-amber-500" weight="fill" />,
  fail: <XCircle className="h-4 w-4 text-rose-500" weight="fill" />,
}

const OVERALL_STYLES: Record<EarlyValidationResult['overall'], string> = {
  ready: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'needs-attention': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  blocked: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

const OVERALL_LABEL: Record<EarlyValidationResult['overall'], string> = {
  ready: 'Ready',
  'needs-attention': 'Needs attention',
  blocked: 'Blocked',
}

export function EarlyEngagementValidator({ result }: { result: EarlyValidationResult }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Engagement Readiness</CardTitle>
            <CardDescription>{result.summary}</CardDescription>
          </div>
          <Badge variant="outline" className={`text-xs ${OVERALL_STYLES[result.overall]}`}>
            {OVERALL_LABEL[result.overall]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {result.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0">{ICONS[c.status]}</span>
              <div className="flex-1">
                <div className="font-medium">{c.label}</div>
                {c.detail && <div className="text-xs text-muted-foreground">{c.detail}</div>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
