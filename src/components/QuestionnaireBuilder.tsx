/**
 * QuestionnaireBuilder — consultant surface to create and manage customer
 * self-serve Discovery questionnaire links.
 *
 *  - Configure scope (company, industry, track, optional business functions, expiry)
 *  - Generate a dual-token link (public linkToken in the URL + private adminToken kept locally)
 *  - Share via copy / Teams / Outlook
 *  - Retrieve submissions (admin-token gated) and export them (JSON / Markdown)
 */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowSquareOut,
  ArrowsClockwise,
  Copy,
  DownloadSimple,
  LinkSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  TrashSimple,
  X,
} from '@phosphor-icons/react'
import { NavigationHeader } from '@/components/NavigationHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DISCOVERY_TRACK_LABELS,
  DISCOVERY_TRACK_DESCRIPTIONS,
  getQuestionsForIndustry,
  industryLabels,
  type DiscoveryTrack,
} from '@/lib/discovery-questions'
import { businessFunctionLabel, groupedBusinessFunctions } from '@/lib/business-functions'
import { createQuestionnaireLink, getQuestionnaireResponses } from '@/lib/questionnaire-api'
import { downloadResponsesJson, downloadResponsesMarkdown } from '@/lib/questionnaire-export'
import { openOutlookCompose, openTeamsShare } from '@/lib/share-helpers'
import { useQuestionnaireLinks } from '@/hooks/use-questionnaire-links'
import type { BusinessFunction, Industry } from '@/lib/types'
import type { QuestionnaireLink, QuestionnaireSubmission } from '@/lib/questionnaire-types'

interface QuestionnaireBuilderProps {
  onBack: () => void
  onBackToLanding?: () => void
  initialCustomerName?: string
  initialIndustry?: Industry
}

const INDUSTRIES = Object.keys(industryLabels) as Industry[]
const TRACKS = Object.keys(DISCOVERY_TRACK_LABELS) as DiscoveryTrack[]
const EXPIRY_OPTIONS = [
  { value: '0', label: 'No expiry' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
]
const QUESTION_CATEGORY_LABELS = {
  business: 'Business outcomes',
  challenges: 'Challenges',
  users: 'Users and stakeholders',
  technical: 'Technical considerations',
} as const

export function QuestionnaireBuilder({
  onBack,
  onBackToLanding,
  initialCustomerName,
  initialIndustry,
}: QuestionnaireBuilderProps) {
  const { links, addLink, updateLink, deleteLink } = useQuestionnaireLinks()

  const [customerName, setCustomerName] = useState(initialCustomerName ?? '')
  const [industry, setIndustry] = useState<Industry>(initialIndustry ?? 'general')
  const [track, setTrack] = useState<DiscoveryTrack>('use-case')
  const [businessFunctions, setBusinessFunctions] = useState<BusinessFunction[]>([])
  const [bfToAdd, setBfToAdd] = useState('')
  const [introMessage, setIntroMessage] = useState('')
  const [expiryDays, setExpiryDays] = useState('0')
  const [generating, setGenerating] = useState(false)
  const [questionSearch, setQuestionSearch] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])

  const [retrieval, setRetrieval] = useState<
    Record<string, { loading: boolean; error?: string; submissions?: QuestionnaireSubmission[] }>
  >({})

  const availableQuestions = useMemo(() => getQuestionsForIndustry(industry, track), [industry, track])
  const selectedQuestionIdSet = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds])
  const previewQuestions = useMemo(
    () => availableQuestions.filter((question) => selectedQuestionIdSet.has(question.id)),
    [availableQuestions, selectedQuestionIdSet],
  )
  const groupedQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase()
    return Object.entries(QUESTION_CATEGORY_LABELS).map(([category, label]) => ({
      category,
      label,
      questions: availableQuestions.filter(
        (question) => question.category === category && (!query || question.question.toLowerCase().includes(query)),
      ),
    })).filter((group) => group.questions.length > 0)
  }, [availableQuestions, questionSearch])

  useEffect(() => {
    setSelectedQuestionIds(availableQuestions.map((question) => question.id))
    setQuestionSearch('')
  }, [availableQuestions])

  const toggleQuestion = (questionId: string, selected: boolean) => {
    setSelectedQuestionIds((current) =>
      selected ? [...current, questionId] : current.filter((id) => id !== questionId),
    )
  }

  const addBusinessFunction = (id: string) => {
    const bf = id as BusinessFunction
    if (!businessFunctions.includes(bf)) setBusinessFunctions((prev) => [...prev, bf])
    setBfToAdd('')
  }

  const handleGenerate = async () => {
    if (!customerName.trim()) {
      toast.error('Enter a company name first')
      return
    }
    if (previewQuestions.length === 0) {
      toast.error('Select at least one question')
      return
    }
    setGenerating(true)
    try {
      const expiresAt = expiryDays !== '0' ? Date.now() + Number(expiryDays) * 86_400_000 : undefined
      const config = {
        customerName: customerName.trim(),
        industry,
        track,
        businessFunctions: businessFunctions.length ? businessFunctions : undefined,
        questions: previewQuestions,
        introMessage: introMessage.trim() || undefined,
        expiresAt,
      }
      const result = await createQuestionnaireLink(config)
      const link: QuestionnaireLink = {
        linkToken: result.linkToken,
        adminToken: result.adminToken,
        url: result.url,
        config,
        status: 'pending',
        createdAt: Date.now(),
        submissionCount: 0,
      }
      addLink(link)
      toast.success('Questionnaire link created')
      setIntroMessage('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setGenerating(false)
    }
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not copy — select and copy the link manually')
    }
  }

  const shareTeams = (link: QuestionnaireLink) =>
    openTeamsShare({
      message: `Please complete our short discovery questionnaire for ${link.config.customerName}: ${link.url}`,
      topic: 'Discovery Questionnaire',
    })

  const shareOutlook = (link: QuestionnaireLink) =>
    openOutlookCompose({
      subject: `Discovery questionnaire for ${link.config.customerName}`,
      body:
        `Hello,\n\nTo help us tailor our discovery session, please complete this short questionnaire:\n${link.url}\n\n` +
        `It takes about 10 minutes and your answers go straight to our engagement team.\n\nThank you.`,
    })

  const retrieve = async (link: QuestionnaireLink) => {
    setRetrieval((prev) => ({ ...prev, [link.linkToken]: { loading: true } }))
    try {
      const res = await getQuestionnaireResponses(link.linkToken, link.adminToken)
      setRetrieval((prev) => ({ ...prev, [link.linkToken]: { loading: false, submissions: res.submissions } }))
      updateLink(link.linkToken, {
        status: res.status,
        submissionCount: res.submissionCount,
        lastRetrievedAt: Date.now(),
      })
      toast.success(`${res.submissionCount} submission${res.submissionCount === 1 ? '' : 's'} retrieved`)
    } catch (err) {
      setRetrieval((prev) => ({
        ...prev,
        [link.linkToken]: { loading: false, error: err instanceof Error ? err.message : 'Failed to retrieve' },
      }))
    }
  }

  const exportSubmission = (link: QuestionnaireLink, s: QuestionnaireSubmission, fmt: 'json' | 'md') => {
    const input = {
      companyName: s.companyName || link.config.customerName,
      email: s.email,
      primaryStakeholder: s.primaryStakeholder,
      businessFunction: s.businessFunction,
      industry: industryLabels[link.config.industry as Industry],
      submittedAt: s.submittedAt,
      questions: link.config.questions,
      responses: s.responses,
    }
    fmt === 'json' ? downloadResponsesJson(input) : downloadResponsesMarkdown(input)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        title="Customer Questionnaire"
        subtitle="Send the Discovery questions to your customer and collect their answers"
        onBack={onBack}
        onBackToLanding={onBackToLanding}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* ── Create ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Create a questionnaire link</CardTitle>
            <CardDescription>
              You choose the scope; the customer only enters their details and answers the questions — they never see the
              rest of the tool.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company name</Label>
                <Input
                  id="company"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoso Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((id) => (
                      <SelectItem key={id} value={id}>
                        {industryLabels[id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discovery track</Label>
              <Select value={track} onValueChange={(v) => setTrack(v as DiscoveryTrack)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACKS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {DISCOVERY_TRACK_LABELS[id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{DISCOVERY_TRACK_DESCRIPTIONS[track]}</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Label htmlFor="question-search">Questions</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose the exact questions included in the customer link.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedQuestionIds(availableQuestions.map((question) => question.id))}
                  >
                    Select all
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedQuestionIds([])}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="question-search"
                  value={questionSearch}
                  onChange={(event) => setQuestionSearch(event.target.value)}
                  placeholder="Search questions"
                  className="pl-9"
                />
              </div>
              <div className="max-h-80 overflow-y-auto rounded-md border p-4 space-y-5">
                {groupedQuestions.map((group) => (
                  <section key={group.category} className="space-y-2">
                    <h3 className="text-sm font-medium">{group.label}</h3>
                    {group.questions.map((question) => (
                      <label key={question.id} className="flex items-start gap-3 py-1.5 text-sm leading-5 cursor-pointer">
                        <Checkbox
                          checked={selectedQuestionIdSet.has(question.id)}
                          onCheckedChange={(checked) => toggleQuestion(question.id, checked === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <span>{question.question}</span>
                      </label>
                    ))}
                  </section>
                ))}
                {groupedQuestions.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No questions match your search.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {previewQuestions.length} of {availableQuestions.length} questions selected
              </p>
            </div>

            <div className="space-y-2">
              <Label>Business functions (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {businessFunctions.map((bf) => (
                  <Badge key={bf} variant="secondary" className="gap-1">
                    {businessFunctionLabel(bf)}
                    <button
                      type="button"
                      onClick={() => setBusinessFunctions((prev) => prev.filter((x) => x !== bf))}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${businessFunctionLabel(bf)}`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select value={bfToAdd} onValueChange={addBusinessFunction}>
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="Add a business function…" />
                </SelectTrigger>
                <SelectContent>
                  {groupedBusinessFunctions().map((g) => (
                    <SelectGroup key={g.group}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.functions
                        .filter((f) => !businessFunctions.includes(f.id))
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Link expiry</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Badge variant="outline" className="h-9 px-3">
                  {previewQuestions.length} questions in this scope
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro">Welcome message (optional)</Label>
              <Textarea
                id="intro"
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder="A short note shown to the customer at the top of the questionnaire."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerate} disabled={generating || !customerName.trim() || previewQuestions.length === 0}>
                <LinkSimple size={18} className="mr-2" />
                {generating ? 'Generating…' : 'Generate link'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Manage ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your questionnaire links</h2>
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground">No links yet. Create one above and share it with your customer.</p>
          )}
          {links.map((link) => {
            const r = retrieval[link.linkToken]
            return (
              <Card key={link.linkToken}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{link.config.customerName}</CardTitle>
                      <CardDescription>
                        {industryLabels[link.config.industry as Industry]} · {DISCOVERY_TRACK_LABELS[link.config.track]} ·{' '}
                        {link.config.questions.length} questions
                      </CardDescription>
                    </div>
                    <Badge variant={link.status === 'completed' ? 'default' : link.status === 'expired' ? 'destructive' : 'secondary'}>
                      {link.status}
                      {typeof link.submissionCount === 'number' && link.submissionCount > 0
                        ? ` · ${link.submissionCount}`
                        : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input readOnly value={link.url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                    <Button size="icon" variant="outline" onClick={() => copyLink(link.url)} aria-label="Copy link">
                      <Copy size={16} />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => shareTeams(link)}>
                      <PaperPlaneTilt size={16} className="mr-2" />
                      Share via Teams
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => shareOutlook(link)}>
                      <ArrowSquareOut size={16} className="mr-2" />
                      Share via Outlook
                    </Button>
                    <Button size="sm" onClick={() => retrieve(link)} disabled={r?.loading}>
                      <ArrowsClockwise size={16} className="mr-2" />
                      {r?.loading ? 'Retrieving…' : 'Retrieve responses'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteLink(link.linkToken)}
                    >
                      <TrashSimple size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>

                  {r?.error && <p className="text-sm text-destructive">{r.error}</p>}

                  {r?.submissions && r.submissions.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {r.submissions.map((s) => (
                          <div
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                          >
                            <div className="text-sm">
                              <span className="font-medium">{s.email}</span>
                              {s.primaryStakeholder ? <span className="text-muted-foreground"> · {s.primaryStakeholder}</span> : null}
                              <span className="text-muted-foreground"> · {new Date(s.submittedAt).toLocaleString()}</span>
                              <span className="text-muted-foreground"> · {s.responses.length} answers</span>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => exportSubmission(link, s, 'md')}>
                                <DownloadSimple size={14} className="mr-1" />
                                MD
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => exportSubmission(link, s, 'json')}>
                                <DownloadSimple size={14} className="mr-1" />
                                JSON
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {r?.submissions && r.submissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No submissions yet.</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
