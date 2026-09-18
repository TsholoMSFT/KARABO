import { useMemo, useState } from 'react'
import type { Customer, DiscoverySession, FrontierReadinessAssessment as ReadinessAssessment, UseCase } from '@/lib/types'
import { buildAccountCustomerJourney, collectCustomerJourneySources, validateCustomerJourney } from '@/lib/frontier-ai/journey-builder'
import { computeFrontierMaturity } from '@/lib/frontier-ai/maturity-engine'
import { useAccountCustomerJourney } from '@/hooks/use-account-customer-journey'
import { accountJourneyToMarkdown } from '@/lib/engagement/format'
import { artifactFilename, downloadDocxFromMarkdown, downloadMarkdown } from '@/lib/engagement/exports'
import { exportAccountJourneyToPptx } from '@/lib/pptx-export'
import { tailorAccountJourneyNarrative } from '@/lib/frontier-ai/narrative-service'
import { FrontierReadinessAssessment } from './FrontierReadinessAssessment'
import { AccountJourneyView } from './AccountJourneyView'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartLineUp, CheckCircle, FileText, MicrosoftPowerpointLogo, Path, PresentationChart, Printer, Sparkle, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AccountJourneyWorkspaceProps {
  customer: Customer
  sessions: DiscoverySession[]
  useCases: UseCase[]
}

function emptyReadiness(): ReadinessAssessment {
  return {
    ratings: {
      ai_platform: 0,
      database_platform: 0,
      application_platform: 0,
      secure_the_solution: 0,
      secure_the_user: 0,
      m365_copilot: 0,
      copilot_chat: 0,
      copilot_studio: 0,
      github_copilot: 0,
    },
    evidence: {},
    assessedAt: Date.now(),
  }
}

export function AccountJourneyWorkspace({ customer, sessions, useCases }: AccountJourneyWorkspaceProps) {
  const { journey, saveJourney } = useAccountCustomerJourney(customer.id)
  const available = useMemo(
    () => collectCustomerJourneySources(customer.id, sessions, useCases),
    [customer.id, sessions, useCases],
  )
  const [readiness, setReadiness] = useState<ReadinessAssessment>(() => journey?.readiness ?? emptyReadiness())
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(() => journey?.sources.sessionIds ?? available.selection.sessionIds)
  const [selectedUseCaseIds, setSelectedUseCaseIds] = useState<string[]>(() => journey?.sources.useCaseIds ?? available.selection.useCaseIds)
  const [activeTab, setActiveTab] = useState(journey ? 'roadmap' : 'readiness')
  const [isTailoring, setIsTailoring] = useState(false)
  const maturity = computeFrontierMaturity(readiness.ratings)

  const selectedSessionIdSet = new Set(selectedSessionIds)
  const visibleUseCases = available.useCases.filter((useCase) => useCase.discoverySessionId && selectedSessionIdSet.has(useCase.discoverySessionId))

  const toggleId = (id: string, checked: boolean, current: string[], setCurrent: (ids: string[]) => void) => {
    setCurrent(checked ? [...new Set([...current, id])] : current.filter((value) => value !== id))
  }

  const buildJourney = () => {
    const nextJourney = buildAccountCustomerJourney({
      customer,
      sessions,
      useCases,
      readiness,
      selection: { sessionIds: selectedSessionIds, useCaseIds: selectedUseCaseIds },
      existingJourney: journey ?? undefined,
    })
    saveJourney(nextJourney)
    setActiveTab('roadmap')
    toast.success(journey ? 'Account journey refreshed' : 'Account journey created')
  }

  const presentationValidation = journey ? validateCustomerJourney(journey) : null
  const journeyUseCases = journey
    ? available.useCases.filter((useCase) => journey.sources.useCaseIds.includes(useCase.id))
    : []

  const exportMarkdown = () => {
    if (!journey) return
    const markdown = accountJourneyToMarkdown(journey, available.useCases)
    downloadMarkdown(markdown, artifactFilename(customer.name, 'frontier-ai-journey', 'md'))
  }

  const exportDocx = async () => {
    if (!journey) return
    const markdown = accountJourneyToMarkdown(journey, available.useCases)
    await downloadDocxFromMarkdown(
      markdown,
      artifactFilename(customer.name, 'frontier-ai-journey', 'docx'),
      journey.title,
    )
  }

  const exportPptx = async () => {
    if (!journey) return
    try {
      await exportAccountJourneyToPptx({ journey, useCases: available.useCases })
      toast.success('PowerPoint journey downloaded')
    } catch (error) {
      toast.error(`PowerPoint export failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const tailorNarrative = async () => {
    if (!journey) return
    setIsTailoring(true)
    try {
      const tailored = await tailorAccountJourneyNarrative(journey, journeyUseCases, available.sessions)
      saveJourney(tailored)
      toast.success('Customer narrative tailored with AI')
    } catch (error) {
      toast.error(`Narrative tailoring failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTailoring(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Frontier AI account journey</p>
          <h1 className="mt-1 text-3xl font-bold">{customer.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{maturity.stage} · {available.sessions.length} discovery sessions · {available.useCases.length} use cases</p>
        </div>
        <Button onClick={buildJourney} className="gap-2">
          <Sparkle size={17} weight="fill" /> {journey ? 'Refresh journey' : 'Build journey'}
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="readiness" className="gap-2"><ChartLineUp size={16} /> Readiness</TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2"><Path size={16} /> Roadmap</TabsTrigger>
          <TabsTrigger value="presentation" className="gap-2"><PresentationChart size={16} /> Presentation</TabsTrigger>
        </TabsList>

        <TabsContent value="readiness" className="mt-6 space-y-6">
          <FrontierReadinessAssessment value={readiness} onChange={setReadiness} />

          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-md">
              <CardHeader className="pb-3"><CardTitle className="text-base">Evidence sessions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {available.sessions.length === 0 && <p className="text-sm text-muted-foreground">No discovery sessions are linked to this customer.</p>}
                {available.sessions.map((session) => (
                  <label key={session.id} className="flex items-start gap-3 border-t py-2 first:border-0">
                    <Checkbox
                      checked={selectedSessionIds.includes(session.id)}
                      onCheckedChange={(checked) => toggleId(session.id, !!checked, selectedSessionIds, setSelectedSessionIds)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{session.name}</span>
                      <span className="block text-xs text-muted-foreground">{session.industry || 'Cross-industry'} · {new Date(session.createdAt).toLocaleDateString()}</span>
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader className="pb-3"><CardTitle className="text-base">Journey use cases</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {visibleUseCases.length === 0 && <p className="text-sm text-muted-foreground">No use cases are available from the selected sessions.</p>}
                {visibleUseCases.map((useCase) => (
                  <label key={useCase.id} className="flex items-start gap-3 border-t py-2 first:border-0">
                    <Checkbox
                      checked={selectedUseCaseIds.includes(useCase.id)}
                      onCheckedChange={(checked) => toggleId(useCase.id, !!checked, selectedUseCaseIds, setSelectedUseCaseIds)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{useCase.title}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{useCase.description}</span>
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6">
          {journey ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => void tailorNarrative()} disabled={isTailoring}>
                  <Sparkle size={15} weight="fill" /> {isTailoring ? 'Tailoring narrative...' : 'Tailor narrative with AI'}
                </Button>
              </div>
              <AccountJourneyView journey={journey} sessions={available.sessions} useCases={journeyUseCases} onUpdate={saveJourney} />
            </div>
          ) : (
            <EmptyJourneyState onBuild={() => setActiveTab('readiness')} />
          )}
        </TabsContent>

        <TabsContent value="presentation" className="mt-6">
          {journey ? (
            <div className="space-y-4">
              {presentationValidation && !presentationValidation.valid && (
                <section className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="flex items-center gap-2 font-semibold"><Warning size={17} /> Complete {presentationValidation.issues.length} missing journey fields before presenting.</p>
                </section>
              )}
              <div className="flex flex-wrap justify-end gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={exportMarkdown} disabled={presentationValidation ? !presentationValidation.valid : true}>
                  <FileText size={15} /> Markdown
                </Button>
                <Button variant="outline" size="sm" onClick={() => void exportDocx()} disabled={presentationValidation ? !presentationValidation.valid : true}>
                  <FileText size={15} weight="fill" /> Word
                </Button>
                <Button variant="outline" size="sm" onClick={() => void exportPptx()} disabled={presentationValidation ? !presentationValidation.valid : true}>
                  <MicrosoftPowerpointLogo size={15} weight="fill" /> PowerPoint
                </Button>
                <Button size="sm" onClick={() => window.print()} disabled={presentationValidation ? !presentationValidation.valid : true}>
                  <Printer size={15} /> Print / PDF
                </Button>
              </div>
              <AccountJourneyView journey={journey} sessions={available.sessions} useCases={journeyUseCases} presentation />
            </div>
          ) : (
            <EmptyJourneyState onBuild={() => setActiveTab('readiness')} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyJourneyState({ onBuild }: { onBuild: () => void }) {
  return (
    <div className="border-y border-border py-16 text-center">
      <CheckCircle size={36} className="mx-auto text-muted-foreground" />
      <h2 className="mt-3 text-xl font-semibold">Complete the readiness assessment</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">The account journey is generated from the customer maturity profile and selected discovery evidence.</p>
      <Button variant="outline" onClick={onBuild} className="mt-4">Open readiness</Button>
    </div>
  )
}

export default AccountJourneyWorkspace