import { Customer } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkle, 
  RocketLaunch, 
  FolderOpen, 
  Lightbulb,
  ChartBar,
  MagnifyingGlass,
  Briefcase,
  Play,
  HardHat,
  ShoppingCart,
  Bank,
  FileText,
  TreeStructure
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

import type { DemoIndustry } from '@/lib/demo-data'

interface LandingPageProps {
  customers: Customer[]
  onStartNew: () => void
  onStartAIAssessment?: () => void
  onStartEnterpriseDiscovery: () => void
  onStartNotesAnalysis?: () => void
  onViewExisting: () => void
  onStartDemo?: (demoType: 'mining' | 'retail' | 'financial') => void
  onStartEnterpriseDemo?: (demoType: 'mining' | 'retail' | 'financial') => void
  onSkipToUseCases?: () => void
  // Demo mode props
  isDemoMode?: boolean
  demoIndustry?: DemoIndustry
  onEnterDemoMode?: (industry: DemoIndustry) => void
}

export function LandingPage({ 
  customers, 
  onStartNew, 
  onStartAIAssessment,
  onStartEnterpriseDiscovery,
  onStartNotesAnalysis, 
  onViewExisting,
  onStartDemo,
  onStartEnterpriseDemo,
  onSkipToUseCases,
  onEnterDemoMode
}: LandingPageProps) {
  const hasExistingCustomers = customers.length > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <div className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4"
          >
            <Sparkle size={48} weight="duotone" className="text-primary" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold tracking-tight"
          >
            Microsoft Innovation Hub
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Enterprise Discovery & AI Use Case Assessment Platform
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            <Badge variant="secondary" className="text-sm">
              <ChartBar size={14} className="mr-1" />
              AI-Powered Discovery
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Lightbulb size={14} className="mr-1" />
              Smart Recommendations
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Briefcase size={14} className="mr-1" />
              Innovation Hub Methodology
            </Badge>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Discovery Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <MagnifyingGlass size={28} weight="duotone" className="text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">Use Cases</Badge>
                </div>
                <CardTitle className="text-xl">Quick Discovery</CardTitle>
                <CardDescription className="text-sm">
                  Guided questions + AI suggestions to rapidly identify use cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <RocketLaunch size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                    <span>Answer guided questions (industry-aware)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkle size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                    <span>Generate and refine AI-powered use case suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChartBar size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                    <span>Prioritize with impact + feasibility scoring</span>
                  </li>
                </ul>
                <Separator />
                <div className="space-y-3">
                  <Button onClick={onStartNew} className="w-full gap-2" size="lg">
                    <RocketLaunch size={20} weight="duotone" />
                    Start Quick Discovery
                  </Button>

                  <div className="flex flex-col gap-2">
                    {onStartNotesAnalysis && (
                      <Button
                        onClick={onStartNotesAnalysis}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <FileText size={18} weight="duotone" />
                        Analyze Notes (Optional)
                      </Button>
                    )}
                    {onSkipToUseCases && (
                      <Button
                        onClick={onSkipToUseCases}
                        variant="ghost"
                        className="w-full gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Lightbulb size={18} weight="duotone" />
                        Skip to Use Case Entry
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enterprise Discovery Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
          >
            <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-brand-blue/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10">
                    <Briefcase size={28} weight="duotone" className="text-brand-blue" />
                  </div>
                  <Badge variant="outline" className="text-xs">Framework</Badge>
                </div>
                <CardTitle className="text-xl">Enterprise Discovery</CardTitle>
                <CardDescription className="text-sm">
                  5-stage framework with financial impact and prioritization outputs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Briefcase size={16} weight="duotone" className="mt-0.5 text-brand-blue flex-shrink-0" />
                    <span>Business envisioning + problem framing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChartBar size={16} weight="duotone" className="mt-0.5 text-brand-blue flex-shrink-0" />
                    <span>Financial impact modeling and prioritization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkle size={16} weight="duotone" className="mt-0.5 text-brand-blue flex-shrink-0" />
                    <span>Outputs ready for stakeholder alignment</span>
                  </li>
                </ul>
                <Separator />
                <Button
                  onClick={onStartEnterpriseDiscovery}
                  className="w-full gap-2 bg-brand-blue hover:bg-brand-blue/90 text-brand-blue-foreground"
                  size="lg"
                >
                  <Briefcase size={20} weight="duotone" />
                  Start Enterprise Discovery
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Assessment Lite Card */}
          {onStartAIAssessment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64 }}
            >
              <Card className="h-full border-2 border-brand-orange/40 hover:shadow-lg transition-all duration-300 hover:border-brand-orange bg-gradient-to-br from-brand-orange/5 to-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-orange/10">
                      <TreeStructure size={28} weight="duotone" className="text-brand-orange" />
                    </div>
                    <Badge variant="outline" className="text-xs">Process</Badge>
                  </div>
                  <CardTitle className="text-xl">AI Assessment Lite</CardTitle>
                  <CardDescription className="text-sm">
                    Structured process analysis to refine agent opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <TreeStructure size={16} weight="duotone" className="mt-0.5 text-brand-orange flex-shrink-0" />
                      <span>Map workflows, handoffs, and constraints</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-brand-orange flex-shrink-0" />
                      <span>Generate value + feasibility analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChartBar size={16} weight="duotone" className="mt-0.5 text-brand-orange flex-shrink-0" />
                      <span>Feed the portfolio prioritization matrix</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button
                    onClick={onStartAIAssessment}
                    className="w-full gap-2 bg-brand-orange hover:bg-brand-orange/90 text-brand-orange-foreground"
                    size="lg"
                  >
                    <Sparkle size={20} weight="duotone" />
                    AI Assessment Lite
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Continue Existing (secondary action) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.66 }}
            className="md:col-span-3"
          >
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                onClick={onViewExisting}
                variant={hasExistingCustomers ? 'outline' : 'ghost'}
                className="gap-2"
              >
                <FolderOpen size={18} weight="duotone" />
                {hasExistingCustomers
                  ? `Continue Existing (${customers.length} session${customers.length !== 1 ? 's' : ''})`
                  : 'Continue Existing'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Try Demo Section */}
        {(onStartDemo || onStartEnterpriseDemo || onEnterDemoMode) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/20">
              <CardContent className="py-6">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Play size={20} weight="fill" className="text-primary" />
                    <h3 className="font-semibold text-lg">Try Demo Mode</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Enter demo mode with pre-filled forms to explore all features</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  {/* Mining Demo */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3 hover:border-amber-500/50 hover:bg-amber-500/5"
                      onClick={() => {
                        onEnterDemoMode?.('mining')
                        onStartNew()
                      }}
                    >
                      <HardHat size={18} weight="duotone" className="text-amber-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Zava Mining</div>
                        <div className="text-[10px] text-muted-foreground">Enter Demo Mode</div>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Retail Demo */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3 hover:border-green-500/50 hover:bg-green-500/5"
                      onClick={() => {
                        onEnterDemoMode?.('retail')
                        onStartNew()
                      }}
                    >
                      <ShoppingCart size={18} weight="duotone" className="text-green-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">MegaMart Retail</div>
                        <div className="text-[10px] text-muted-foreground">Enter Demo Mode</div>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Financial Demo */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3 hover:border-blue-500/50 hover:bg-blue-500/5"
                      onClick={() => {
                        onEnterDemoMode?.('financial')
                        onStartNew()
                      }}
                    >
                      <Bank size={18} weight="duotone" className="text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Apex Financial</div>
                        <div className="text-[10px] text-muted-foreground">Enter Demo Mode</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Powered by Microsoft Azure OpenAI
        </motion.p>
        
      </motion.div>
    </div>
  )
}
