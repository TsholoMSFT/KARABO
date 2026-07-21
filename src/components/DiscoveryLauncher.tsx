import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DiscoverySettingsDialog } from '@/components/DiscoverySettingsDialog'
import { PausedSessionsList } from '@/components/enterprise-discovery/PausedSessionsList'
import { CustomerJourneyTool } from '@/components/CustomerJourneyTool'
import { ThreadlightTool } from '@/components/ThreadlightTool'
import { MagnifyingGlass, Lightbulb, ChartLine, Sparkle, Buildings, Microphone, GearSix, Briefcase, Rocket, Toolbox, FileArrowDown, ArrowsLeftRight, FileText } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import type { EnterpriseDiscoverySession, DiscoverySession, CustomerJourney, AccountSegment } from '@/lib/types'
import { getVisibleTabs, getSegmentFeatures, getDiscoveryButtonLabel, getStrategicAssessmentLabel } from '@/lib/segment-config'

type DiscoveryMode = 'quick' | 'enterprise' | 'tools'

interface DiscoveryLauncherProps {
  onStartDiscovery: () => void
  onStartLiveDiscovery?: () => void
  onStartEnterpriseDiscovery?: () => void
  onResumeEnterpriseDiscovery?: (session: EnterpriseDiscoverySession) => void
  onOpenSessionComparison?: () => void
  onOpenExport?: () => void
  onOpenEngagementHub?: () => void
  currentSession?: DiscoverySession | null
  onJourneyUpdate?: (useCaseId: string, journey: CustomerJourney) => void
  accountSegment?: AccountSegment
}

  export function DiscoveryLauncher({ onStartDiscovery, onStartLiveDiscovery, onStartEnterpriseDiscovery, onResumeEnterpriseDiscovery, onOpenSessionComparison, onOpenExport, onOpenEngagementHub, currentSession, onJourneyUpdate, accountSegment = 'enterprise' }: DiscoveryLauncherProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const visibleTabs = getVisibleTabs(accountSegment)
  const features = getSegmentFeatures(accountSegment)
  const availableTabs = visibleTabs.filter(t => t.visible)
  const [mode, setMode] = useState<DiscoveryMode>(availableTabs[0]?.id ?? 'quick')

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
        {/* Mode Toggle with Settings */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3">
          <Tabs value={mode} onValueChange={(v) => setMode(v as DiscoveryMode)} className="w-full sm:w-auto overflow-x-auto">
            <TabsList className={`grid w-full sm:w-[680px] min-w-[320px] grid-cols-${availableTabs.length}`}>
              {availableTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  {tab.id === 'quick' && <><Rocket size={16} /> Discovery</>}
                  {tab.id === 'enterprise' && <><Briefcase size={16} /> {getStrategicAssessmentLabel(accountSegment)}{tab.badge && <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{tab.badge}</Badge>}</>}
                  {tab.id === 'tools' && <><Toolbox size={16} /> Tools</>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button onClick={() => setSettingsOpen(true)} size="sm" variant="outline" className="gap-2">
            <GearSix size={16} />
            AI Settings
          </Button>
        </div>

        {/* Quick Discovery Card */}
        {mode === 'quick' && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <MagnifyingGlass size={28} weight="bold" className="text-primary" />
                    Use Case Discovery
                  </CardTitle>
                  <CardDescription className="text-base">
                    {features.discoveryDescription}
                  </CardDescription>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Buildings size={14} />
                      Industry-Specific Templates
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Sparkle size={14} weight="fill" />
                      AI-Powered Suggestions
                    </Badge>
                  </div>
                </div>
                <div className="flex min-w-0 w-full shrink-0 flex-col gap-2 md:w-auto">
                  <Button onClick={onStartDiscovery} size="lg" className="gap-2">
                    <Sparkle size={20} weight="fill" />
                    {getDiscoveryButtonLabel(accountSegment)}
                  </Button>
                  {onStartLiveDiscovery && (
                    <Button onClick={onStartLiveDiscovery} size="lg" variant="outline" className="gap-2">
                      <Microphone size={20} weight="fill" />
                      Live Discovery
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <MagnifyingGlass size={24} weight="bold" className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Select Industry & Answer Questions</h4>
                    <p className="text-xs text-muted-foreground">
                      Choose your industry for tailored questions about your business, challenges, and goals
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-secondary/10 p-2 rounded-lg shrink-0">
                    <Lightbulb size={24} weight="fill" className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Get Suggestions</h4>
                    <p className="text-xs text-muted-foreground">
                      AI analyzes your responses to identify relevant use cases for innovation
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-accent/10 p-2 rounded-lg shrink-0">
                    <ChartLine size={24} weight="bold" className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Prioritize & Assess</h4>
                    <p className="text-xs text-muted-foreground">
                      Add selected use cases to your dashboard for detailed scoring and comparison
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enterprise Discovery Card */}
        {mode === 'enterprise' && (
          <>
            {/* Paused Sessions */}
            {onResumeEnterpriseDiscovery && (
              <PausedSessionsList onResume={onResumeEnterpriseDiscovery} />
            )}
            
            <Card className="border-2 border-brand-blue/30 bg-gradient-to-br from-brand-blue/5 to-secondary/5">
            <CardHeader>
              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Briefcase size={28} weight="bold" className="text-brand-blue" />
                    Strategic Assessment Process
                  </CardTitle>
                  <CardDescription className="text-base">
                    Comprehensive {features.strategicAssessmentStages}-stage framework for evidence gathering, stakeholder alignment, and prioritization.
                  </CardDescription>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <ChartLine size={14} />
                      Evidence Review
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Buildings size={14} />
                      Stakeholder Mapping
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Sparkle size={14} weight="fill" />
                      Prioritization
                    </Badge>
                  </div>
                </div>
                <div className="flex min-w-0 w-full shrink-0 flex-col gap-2 md:w-auto">
                  <Button 
                    onClick={onStartEnterpriseDiscovery}
                    size="lg" 
                    className="gap-2 bg-brand-blue hover:bg-brand-blue/90 text-brand-blue-foreground"
                  >
                    <Briefcase size={20} weight="fill" />
                    Start Strategic Assessment
                  </Button>
                  {onStartLiveDiscovery && (
                    <Button 
                      onClick={onStartLiveDiscovery} 
                      size="lg" 
                      variant="outline" 
                      className="gap-2 text-white border-white/30 hover:bg-white/10"
                    >
                      <Microphone size={20} weight="fill" />
                      Live Strategic Assessment
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-brand-blue/10 p-2 rounded-lg shrink-0">
                    <MagnifyingGlass size={24} weight="bold" className="text-brand-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Discover & Analyze</h4>
                    <p className="text-xs text-muted-foreground">
                      Identify opportunities, map stakeholders, and assess resources across 5 comprehensive stages
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-secondary/10 p-2 rounded-lg shrink-0">
                    <ChartLine size={24} weight="bold" className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Outcome Validation</h4>
                    <p className="text-xs text-muted-foreground">
                      Validate expected outcomes, dependencies, risks, and measurable success criteria
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-accent/10 p-2 rounded-lg shrink-0">
                    <Buildings size={24} weight="bold" className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Validate & Commit</h4>
                    <p className="text-xs text-muted-foreground">
                      Align stakeholders, validate decisions, and generate executive-ready outputs
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {/* Tools Tab */}
        {mode === 'tools' && (
          <div className="space-y-6">
            {/* Engagement Tools launcher */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Toolbox size={22} weight="duotone" className="text-primary" />
                      Engagement Tools
                    </CardTitle>
                    <CardDescription>
                      Generate session agendas, follow-up emails, task timelines, closeouts, and architecture diagrams — and roll up portfolio insights.
                    </CardDescription>
                  </div>
                  <Button onClick={onOpenEngagementHub} className="gap-2 shrink-0">
                    <Rocket size={16} /> Open Engagement Tools
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Customer Journey Builder */}
            <CustomerJourneyTool
              session={currentSession || null}
              onJourneyUpdate={onJourneyUpdate}
            />

            {/* Threadlight Export Tool */}
            <ThreadlightTool
              useCases={[]}
              customerName={currentSession?.customerName}
              industry={currentSession?.industry}
            />

            {/* Other Tools Grid */}
            <Card className="border-2 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Toolbox size={24} weight="duotone" className="text-primary" />
                  Discovery Tools
                </CardTitle>
                <CardDescription>
                  Additional tools to support your discovery and analysis workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Session Comparison */}
                  <Card className="border hover:border-primary/50 transition-colors cursor-pointer group" onClick={onOpenSessionComparison}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg shrink-0 group-hover:bg-blue-500/20 transition-colors">
                          <ArrowsLeftRight size={24} weight="duotone" className="text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Session Comparison</h4>
                          <p className="text-xs text-muted-foreground">
                            Compare multiple discovery sessions side-by-side to identify patterns and trends
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Tools */}
                  <Card className="border hover:border-primary/50 transition-colors cursor-pointer group" onClick={onOpenExport}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-500/10 p-2 rounded-lg shrink-0 group-hover:bg-green-500/20 transition-colors">
                          <FileArrowDown size={24} weight="duotone" className="text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Export & Reports</h4>
                          <p className="text-xs text-muted-foreground">
                            Export use cases, generate PDF reports, and create executive summaries
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Notes Analysis */}
                  <Card className="border hover:border-primary/50 transition-colors cursor-pointer group" onClick={onStartDiscovery}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-500/10 p-2 rounded-lg shrink-0 group-hover:bg-purple-500/20 transition-colors">
                          <FileText size={24} weight="duotone" className="text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Quick Notes Analysis</h4>
                          <p className="text-xs text-muted-foreground">
                            Paste unstructured meeting notes and extract use cases with AI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
      
      <DiscoverySettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
