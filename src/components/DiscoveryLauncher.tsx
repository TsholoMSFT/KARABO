import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DiscoverySettingsDialog } from '@/components/DiscoverySettingsDialog'
import { PausedSessionsList } from '@/components/enterprise-discovery/PausedSessionsList'
import { MagnifyingGlass, Lightbulb, ChartLine, Sparkle, Buildings, Microphone, GearSix, Briefcase, Rocket } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import type { EnterpriseDiscoverySession } from '@/lib/types'

type DiscoveryMode = 'quick' | 'enterprise'

interface DiscoveryLauncherProps {
  onStartDiscovery: () => void
  onStartLiveDiscovery?: () => void
  onStartEnterpriseDiscovery?: () => void
  onResumeEnterpriseDiscovery?: (session: EnterpriseDiscoverySession) => void
}

export function DiscoveryLauncher({ onStartDiscovery, onStartLiveDiscovery, onStartEnterpriseDiscovery, onResumeEnterpriseDiscovery }: DiscoveryLauncherProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<DiscoveryMode>('quick')

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <Tabs value={mode} onValueChange={(v) => setMode(v as DiscoveryMode)} className="w-auto">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="quick" className="gap-2">
                <Rocket size={16} />
                Quick Discovery
              </TabsTrigger>
              <TabsTrigger value="enterprise" className="gap-2">
                <Briefcase size={16} />
                Enterprise Discovery
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
                  <Button onClick={() => setSettingsOpen(true)} size="sm" variant="ghost" className="gap-2">
                    <GearSix size={16} />
                    Settings
                  </Button>
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
      </motion.div>
      
      <DiscoverySettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
