/**
 * QuestionnaireImportPanel — lets a consultant pull a customer's completed
 * questionnaire answers into the discovery flow, right before use cases are
 * generated. Two sources:
 *   1. Saved links (this browser) via useQuestionnaireLinks (+ adminToken)
 *   2. Manual entry of a linkToken + adminToken (cross-device)
 *
 * On selection it calls onImport with the question snapshot + responses so the
 * caller can merge them into the DiscoverySession.
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowsClockwise, CheckCircle, DownloadSimple, UserCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuestionnaireLinks } from '@/hooks/use-questionnaire-links'
import { getQuestionnaire, getQuestionnaireResponses } from '@/lib/questionnaire-api'
import type { DiscoveryQuestion, DiscoveryResponse } from '@/lib/types'
import type { QuestionnaireSubmission } from '@/lib/questionnaire-types'

export interface ImportedQuestionnaire {
  customerName: string
  questions: DiscoveryQuestion[]
  responses: DiscoveryResponse[]
  email?: string
}

interface QuestionnaireImportPanelProps {
  onImport: (data: ImportedQuestionnaire) => void
  onSkip?: () => void
}

export function QuestionnaireImportPanel({ onImport, onSkip }: QuestionnaireImportPanelProps) {
  const { links } = useQuestionnaireLinks()
  const [selectedToken, setSelectedToken] = useState('')
  const [manualLink, setManualLink] = useState('')
  const [manualAdmin, setManualAdmin] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState<{ customerName: string; questions: DiscoveryQuestion[]; submissions: QuestionnaireSubmission[] } | null>(
    null,
  )

  const loadFromSaved = async () => {
    const link = links.find((l) => l.linkToken === selectedToken)
    if (!link) return
    setLoading(true)
    try {
      const res = await getQuestionnaireResponses(link.linkToken, link.adminToken)
      setLoaded({ customerName: link.config.customerName, questions: link.config.questions, submissions: res.submissions })
      if (res.submissions.length === 0) toast.info('No submissions yet for this link')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setLoading(false)
    }
  }

  const loadFromManual = async () => {
    const linkToken = manualLink.trim()
    const adminToken = manualAdmin.trim()
    if (!linkToken || !adminToken) {
      toast.error('Enter both the link token and admin token')
      return
    }
    setLoading(true)
    try {
      const [pub, res] = await Promise.all([
        getQuestionnaire(linkToken),
        getQuestionnaireResponses(linkToken, adminToken),
      ])
      setLoaded({ customerName: pub.config.customerName, questions: pub.config.questions, submissions: res.submissions })
      if (res.submissions.length === 0) toast.info('No submissions yet for this link')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setLoading(false)
    }
  }

  const useSubmission = (s: QuestionnaireSubmission) => {
    if (!loaded) return
    onImport({
      customerName: loaded.customerName,
      questions: loaded.questions,
      responses: s.responses,
      email: s.email,
    })
    toast.success('Customer responses imported')
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DownloadSimple size={20} className="text-primary" />
          Import customer questionnaire responses
        </CardTitle>
        <CardDescription>
          Pull a customer's self-serve answers into this session before generating use cases.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.length > 0 && (
          <div className="space-y-2">
            <Label>From your saved links</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a questionnaire link" />
                </SelectTrigger>
                <SelectContent>
                  {links.map((l) => (
                    <SelectItem key={l.linkToken} value={l.linkToken}>
                      {l.config.customerName} · {l.status}
                      {typeof l.submissionCount === 'number' && l.submissionCount > 0 ? ` · ${l.submissionCount}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadFromSaved} disabled={!selectedToken || loading}>
                <ArrowsClockwise size={16} className="mr-2" />
                {loading ? 'Loading…' : 'Load responses'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Or enter tokens manually</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Link token" value={manualLink} onChange={(e) => setManualLink(e.target.value)} />
            <Input placeholder="Admin token" value={manualAdmin} onChange={(e) => setManualAdmin(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={loadFromManual} disabled={loading}>
            <ArrowsClockwise size={16} className="mr-2" />
            Load from tokens
          </Button>
        </div>

        {loaded && loaded.submissions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Choose a submission to import</Label>
              {loaded.submissions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle size={18} className="text-muted-foreground" />
                    <span className="font-medium">{s.email}</span>
                    {s.primaryStakeholder ? <span className="text-muted-foreground">· {s.primaryStakeholder}</span> : null}
                    <span className="text-muted-foreground">· {s.responses.length} answers</span>
                  </div>
                  <Button size="sm" onClick={() => useSubmission(s)}>
                    <CheckCircle size={16} className="mr-2" />
                    Use this response
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {onSkip && (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onSkip}>
              Skip — continue without importing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
