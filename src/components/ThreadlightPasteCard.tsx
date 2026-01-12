import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, Check, ArrowSquareOut } from '@phosphor-icons/react'

interface ThreadlightPasteCardProps {
  wizardUrl?: string
  industryLabel?: string
  industryValue?: string
  shortName: string
  customProcessShortName?: string
  processAnalysis?: string
  pasteText: string
  title?: string
  description?: string
  topScoredLabel?: string
  topScoredItems?: Array<{ title: string; scoreLabel?: string; scoreValue?: number }>
}

export function ThreadlightPasteCard({
  wizardUrl = 'https://threadlight.ai/wizard/byop',
  industryLabel,
  industryValue,
  shortName,
  customProcessShortName,
  processAnalysis,
  pasteText,
  title = 'Threadlight BYOP (Copy/Paste)',
  description = 'Copy the Short Name and Paste Block into the Threadlight BYOP wizard. You will select the wizard options yourself.',
  topScoredLabel = 'Top scored',
  topScoredItems,
}: ThreadlightPasteCardProps) {
  const [copiedKey, setCopiedKey] = useState<'industry' | 'process-short' | 'analysis' | 'short' | 'paste' | null>(null)

  const trimmedIndustry = useMemo(() => (industryValue ?? industryLabel ?? '').trim(), [industryValue, industryLabel])
  const trimmedShortName = useMemo(() => shortName.trim(), [shortName])
  const trimmedProcessShortName = useMemo(() => (customProcessShortName ?? shortName).trim(), [customProcessShortName, shortName])
  const trimmedProcessAnalysis = useMemo(() => (processAnalysis ?? '').trim(), [processAnalysis])
  const trimmedPasteText = useMemo(() => pasteText.trim(), [pasteText])

  const copy = useCallback(async (key: 'industry' | 'process-short' | 'analysis' | 'short' | 'paste', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      toast.error('Failed to copy')
    }
  }, [])

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {industryLabel && <Badge variant="secondary">Industry: {industryLabel}</Badge>}
              {Array.isArray(topScoredItems) && topScoredItems.length > 0 && (
                <Badge variant="outline">{topScoredLabel}: {topScoredItems[0]?.title}</Badge>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
            <a href={wizardUrl} target="_blank" rel="noreferrer">
              Open Wizard
              <ArrowSquareOut size={16} />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {(trimmedIndustry || trimmedProcessAnalysis) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="threadlight-industry">Industry</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copy('industry', trimmedIndustry)}
                  disabled={!trimmedIndustry}
                >
                  {copiedKey === 'industry' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey === 'industry' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Input id="threadlight-industry" value={trimmedIndustry || '<USER_SELECT_IN_WIZARD>'} readOnly />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="threadlight-process-short-name">Short Name (Custom Process)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copy('process-short', trimmedProcessShortName)}
                  disabled={!trimmedProcessShortName}
                >
                  {copiedKey === 'process-short' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey === 'process-short' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Input id="threadlight-process-short-name" value={trimmedProcessShortName} readOnly />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="threadlight-process-analysis">Process Analysis</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copy('analysis', trimmedProcessAnalysis)}
                  disabled={!trimmedProcessAnalysis}
                >
                  {copiedKey === 'analysis' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey === 'analysis' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Textarea
                id="threadlight-process-analysis"
                value={trimmedProcessAnalysis}
                readOnly
                rows={8}
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}

        {Array.isArray(topScoredItems) && topScoredItems.length > 0 && (
          <div className="space-y-2">
            <Label>{topScoredLabel}</Label>
            <div className="space-y-2">
              {topScoredItems.slice(0, 3).map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.scoreLabel ? `${item.scoreLabel}: ` : ''}
                      {typeof item.scoreValue === 'number' ? item.scoreValue.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="threadlight-short-name">Short Name</Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copy('short', trimmedShortName)}
              disabled={!trimmedShortName}
            >
              {copiedKey === 'short' ? <Check size={16} /> : <Copy size={16} />}
              {copiedKey === 'short' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <Input id="threadlight-short-name" value={trimmedShortName} readOnly />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="threadlight-paste">Paste Block</Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copy('paste', trimmedPasteText)}
              disabled={!trimmedPasteText}
            >
              {copiedKey === 'paste' ? <Check size={16} /> : <Copy size={16} />}
              {copiedKey === 'paste' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <Textarea
            id="threadlight-paste"
            value={trimmedPasteText}
            readOnly
            rows={12}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Tip: In Threadlight, you will select the wizard options manually; this output does not pick options for you.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ThreadlightPasteCard
