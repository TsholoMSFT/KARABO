import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DiscoverySettingsDialog } from '@/components/DiscoverySettingsDialog'
import { PausedSessionsList } from '@/components/enterprise-discovery/PausedSessionsList'
import { QuickCOICalculator } from '@/components/QuickCOICalculator'
import { MagnifyingGlass, Lightbulb, ChartLine, Sparkle, TreeStructure, Buildings, Microphone, GearSix, Briefcase, Rocket, Play, Toolbox, Calculator, FileArrowDown, ArrowsLeftRight, FileText } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { EnterpriseDiscoverySession } from '@/lib/types'

type DiscoveryMode = 'quick' | 'ai-assessment' | 'enterprise' | 'tools'

interface DiscoveryLauncherProps {
  onStartDiscovery: () => void
  onStartAIAssessment?: () => void
  onStartLiveDiscovery?: () => void
  onStartEnterpriseDiscovery?: () => void
  onResumeEnterpriseDiscovery?: (session: EnterpriseDiscoverySession) => void
  onStartDemo?: () => void
  onStartEnterpriseDemo?: () => void
  customerName?: string
  onOpenSessionComparison?: () => void
  onOpenExport?: () => void
}

export function DiscoveryLauncher({ onStartDiscovery, onStartAIAssessment, onStartLiveDiscovery, onStartEnterpriseDiscovery, onResumeEnterpriseDiscovery, onStartDemo, onStartEnterpriseDemo, customerName, onOpenSessionComparison, onOpenExport }: DiscoveryLauncherProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<DiscoveryMode>('quick')

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
        {/* Mode Toggle with Settings */}
        <div className="flex justify-center items-center gap-3">
          <Tabs value={mode} onValueChange={(v) => setMode(v as DiscoveryMode)} className="w-auto">
            <TabsList className="grid w-[680px] grid-cols-4">
              <TabsTrigger value="quick" className="gap-2">
                <Rocket size={16} />
                Quick Discovery
              </TabsTrigger>
              <TabsTrigger value="ai-assessment" className="gap-2">
                <Sparkle size={16} weight="fill" />
                AI Assessment
              </TabsTrigger>
              <TabsTrigger value="enterprise" className="gap-2">
                <Briefcase size={16} />
                Enterprise Discovery
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <Toolbox size={16} />
                Tools
              </TabsTrigger>
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
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <MagnifyingGlass size={28} weight="bold" className="text-primary" />
                    Quick Use Case Discovery
                  </CardTitle>
                  <CardDescription className="text-base">
                    Fast-track discovery with AI-powered insights. Perfect for rapid use case identification and validation.
                  </CardDescription>
                  <div className="flex items-center gap-2 pt-1">
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
                <div className="flex flex-col gap-2 shrink-0">
                  <Button onClick={onStartDiscovery} size="lg" className="gap-2">
                    <Sparkle size={20} weight="fill" />
                    Start Discovery
                  </Button>
                  {onStartLiveDiscovery && (
                    <Button onClick={onStartLiveDiscovery} size="lg" variant="outline" className="gap-2">
                      <Microphone size={20} weight="fill" />
                      Live Discovery
                    </Button>
                  )}
                  {onStartDemo && (
                    <Button onClick={onStartDemo} size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                      <Play size={16} weight="fill" />
                      Try Demo (Zava Mining)
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

        {/* AI Assessment Card */}
        {mode === 'ai-assessment' && (
          <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-secondary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Sparkle size={28} weight="fill" className="text-purple-500" />
                    AI Assessment Discovery
                  </CardTitle>
                  <CardDescription className="text-base">
                    Structured process analysis to identify and refine agent opportunities, then feed your portfolio and enterprise discovery.
                  </CardDescription>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <TreeStructure size={14} />
                      Process Mapping
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Sparkle size={14} weight="fill" />
                      Agent Opportunity Analysis
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <ChartLine size={14} />
                      Value & Feasibility
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    onClick={() => {
                      if (!onStartAIAssessment) {
                        toast.info('AI Assessment is not available in this context')
                        return
                      }
                      onStartAIAssessment()
                    }}
                    size="lg"
                    className="gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkle size={20} weight="fill" />
                    Start AI Assessment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-purple-500/10 p-2 rounded-lg shrink-0">
                    <TreeStructure size={24} weight="bold" className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Map Processes</h4>
                    <p className="text-xs text-muted-foreground">
                      Validate end-to-end workflows, systems of record, handoffs, and approvals
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-secondary/10 p-2 rounded-lg shrink-0">
                    <Sparkle size={24} weight="fill" className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Identify Agent Jobs</h4>
                    <p className="text-xs text-muted-foreground">
                      Convert pain points into agent-able jobs with triggers, actions, and oversight
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-accent/10 p-2 rounded-lg shrink-0">
                    <ChartLine size={24} weight="bold" className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Feed the Portfolio</h4>
                    <p className="text-xs text-muted-foreground">
                      Draft impact/feasibility, KPIs, and constraints—then prioritize in the existing matrix
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
            
            <Card className="border-2 border-[#0078D4]/30 bg-gradient-to-br from-[#0078D4]/5 to-secondary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Briefcase size={28} weight="bold" className="text-[#0078D4]" />
                    Enterprise Discovery Process
                  </CardTitle>
                  <CardDescription className="text-base">
                    Comprehensive 8-stage discovery framework with financial modeling, stakeholder mapping, and ROI analysis.
                  </CardDescription>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <ChartLine size={14} />
                      Financial Analysis
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Buildings size={14} />
                      Stakeholder Mapping
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 bg-background">
                      <Sparkle size={14} weight="fill" />
                      ROI Calculator
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button 
                    onClick={onStartEnterpriseDiscovery}
                    size="lg" 
                    className="gap-2 bg-[#0078D4] hover:bg-[#106EBE]"
                  >
                    <Briefcase size={20} weight="fill" />
                    Start Enterprise Discovery
                  </Button>
                  {onStartLiveDiscovery && (
                    <Button 
                      onClick={onStartLiveDiscovery} 
                      size="lg" 
                      variant="outline" 
                      className="gap-2 text-white border-white/30 hover:bg-white/10"
                    >
                      <Microphone size={20} weight="fill" />
                      Live Enterprise Discovery
                    </Button>
                  )}
                  {onStartEnterpriseDemo && (
                    <Button onClick={onStartEnterpriseDemo} size="sm" variant="ghost" className="gap-2 text-white/60 hover:text-white hover:bg-white/10">
                      <Play size={16} weight="fill" />
                      Try Demo (Zava Mining)
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-[#0078D4]/10 p-2 rounded-lg shrink-0">
                    <MagnifyingGlass size={24} weight="bold" className="text-[#0078D4]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Discover & Analyze</h4>
                    <p className="text-xs text-muted-foreground">
                      Identify opportunities, map stakeholders, and assess resources across 8 comprehensive stages
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-secondary/10 p-2 rounded-lg shrink-0">
                    <ChartLine size={24} weight="bold" className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Financial Modeling</h4>
                    <p className="text-xs text-muted-foreground">
                      Build detailed ROI projections with cost-benefit analysis and investment timelines
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
            {/* Quick COI Calculator */}
            <QuickCOICalculator 
              variant="inline"
              customerName={customerName}
              autoContext={{
                companyName: customerName,
              }}
              onSave={(coiData) => {
                toast.success(`COI of ${coiData.totalCOI.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} calculated`)
              }}
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
