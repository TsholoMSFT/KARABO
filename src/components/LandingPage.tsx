import { useState } from 'react'
import { Customer } from '@/lib/types'
import { TemplateSelector } from '@/components/TemplateSelector'
import type { SessionTemplate } from '@/lib/session-templates'
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
  ShieldCheck,
  CaretDown,
  CaretUp,
  Buildings,
  Compass,
  ChartLineUp
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AboutSection } from '@/components/AboutSection'

import type { DemoIndustry } from '@/lib/demo-data'

interface LandingPageProps {
  customers: Customer[]
  onStartNew: () => void
  onStartSovereignCloud?: () => void
  onStartSolutionBlueprint?: () => void
  onStartEnterpriseDiscovery: () => void
  onStartDUCE?: () => void
  onStartNotesAnalysis?: () => void
  onViewExisting: () => void
  onOpenPortfolio?: () => void
  onOpenValuePortfolio?: () => void
  onStartDemo?: (demoType: 'mining' | 'retail' | 'financial') => void
  onStartEnterpriseDemo?: (demoType: 'mining' | 'retail' | 'financial') => void
  onSelectTemplate?: (template: SessionTemplate) => void
  // Demo mode props
  isDemoMode?: boolean
  demoIndustry?: DemoIndustry
  onEnterDemoMode?: (industry: DemoIndustry) => void
}

export function LandingPage({ 
  customers, 
  onStartNew, 
  onStartSovereignCloud,
  onStartSolutionBlueprint,
  onStartEnterpriseDiscovery,
  onStartDUCE,
  onStartNotesAnalysis, 
  onViewExisting,
  onOpenPortfolio,
  onOpenValuePortfolio,
  onStartDemo,
  onStartEnterpriseDemo,
  onSelectTemplate,
  onEnterDemoMode
}: LandingPageProps) {
  const hasExistingCustomers = customers.length > 0
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSecurityNotice, setShowSecurityNotice] = useState(false)

  return (
    <>
      {/* Template Selector Overlay */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <TemplateSelector 
            onSelectTemplate={(template) => {
              onSelectTemplate?.(template)
              setShowTemplates(false)
            }}
            onSkip={() => setShowTemplates(false)}
          />
        </div>
      )}

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
            Microsoft Innovation Hub: ID-8
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            AI Discovery and Assessment Platform
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

        {/* ── Security & Compliance Notice ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowSecurityNotice(prev => !prev)}
            className="mx-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShieldCheck size={18} weight="duotone" className="text-green-600 dark:text-green-400" />
            Security &amp; Compliance
            {showSecurityNotice ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>

          <AnimatePresence>
            {showSecurityNotice && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Card className="mt-3 border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="pt-5 pb-4 text-sm leading-relaxed space-y-3">
                    <p className="font-semibold text-base text-foreground">Security Hardening Measures</p>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span><strong>Server-side AI Proxy</strong> — All AI calls route through a secure Azure Function; no API keys are exposed in the browser bundle.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span><strong>CORS Restricted</strong> — API endpoints only accept requests from the allowed origin (no wildcard *).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span><strong>Error Sanitization</strong> — Server error messages are redacted before reaching the client to prevent information leakage.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span><strong>Prompt Injection Guard</strong> — User-supplied text is scrubbed of injection patterns before being interpolated into AI prompts.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span><strong>Code Splitting</strong> — Heavy components are lazily loaded with React.lazy + Suspense, wrapped in error boundaries per section.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span><strong>Regulatory Engine</strong> — 20+ frameworks (EU AI Act, GDPR, DORA, NIS2, FedRAMP, FINRA, SOC 2, ISO 27001, …) with word-boundary keyword matching and industry-aware risk modulation.</span>
                      </li>
                    </ul>

                    <Separator />

                    <p className="text-xs text-muted-foreground">
                      ID-8 follows the <strong>Microsoft Responsible AI Principles</strong>. 
                      All regulatory assessments are deterministic (no AI hallucination). 
                      Data remains in your Azure tenant; no third-party analytics or tracking is used.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="space-y-10">
          {/* ── Discover lane ────────────────────────────────────── */}
          <section aria-labelledby="discover-lane-heading">
            <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h2 id="discover-lane-heading" className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <MagnifyingGlass size={22} weight="duotone" className="text-primary" />
                  Discover
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Understand the customer — capture context, use cases, and cloud posture.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">Stage 1</Badge>
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
                <CardTitle className="text-xl">Discovery</CardTitle>
                <CardDescription className="text-sm">
                  Guided questions + AI suggestions to identify and assess use cases
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
                    Start Discovery
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
                    {onSelectTemplate && (
                      <Button
                        onClick={() => setShowTemplates(true)}
                        variant="secondary"
                        className="w-full gap-2"
                      >
                        <Sparkle size={18} weight="duotone" />
                        Use Industry Template
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
                <CardTitle className="text-xl">Strategic Assessment</CardTitle>
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
                  Start Strategic Assessment
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* DUCE — Innovation Hub Engine Card */}
          {onStartDUCE && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.63 }}
            >
              <Card className="h-full border-2 border-violet-500/40 hover:shadow-lg transition-all duration-300 hover:border-violet-500 bg-gradient-to-br from-violet-500/5 to-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-violet-500/10">
                      <Compass size={28} weight="duotone" className="text-violet-500" />
                    </div>
                    <Badge variant="outline" className="text-xs">Decision Engine</Badge>
                  </div>
                  <CardTitle className="text-xl">DUCE — Innovation Hub Engine</CardTitle>
                  <CardDescription className="text-sm">
                    6-step decision-driven flow: strategy → process → problems → use cases → deep dive → outputs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Lightbulb size={16} weight="duotone" className="mt-0.5 text-violet-500 flex-shrink-0" />
                      <span>Quantify problems, classify AI fit, and rank dispositions deterministically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-violet-500 flex-shrink-0" />
                      <span>Recommend architecture patterns from a curated library + co-lead TA inputs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChartBar size={16} weight="duotone" className="mt-0.5 text-violet-500 flex-shrink-0" />
                      <span>Produce roadmap, decision log, and exportable knowledge output</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button
                    onClick={onStartDUCE}
                    className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                    size="lg"
                  >
                    <Compass size={20} weight="duotone" />
                    Start DUCE
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Sovereign Cloud Assessment Card */}
          {onStartSovereignCloud && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64 }}
            >
              <Card className="h-full border-2 border-teal-500/40 hover:shadow-lg transition-all duration-300 hover:border-teal-500 bg-gradient-to-br from-teal-500/5 to-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-teal-500/10">
                      <ShieldCheck size={28} weight="duotone" className="text-teal-500" />
                    </div>
                    <Badge variant="outline" className="text-xs">Cloud</Badge>
                  </div>
                  <CardTitle className="text-xl">Sovereign Cloud Assessment</CardTitle>
                  <CardDescription className="text-sm">
                    Assess deployment model, sovereign/hybrid strategy, and AI readiness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={16} weight="duotone" className="mt-0.5 text-teal-500 flex-shrink-0" />
                      <span>Map deployment model: public, sovereign, Azure Local, Arc, Foundry Local</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-teal-500 flex-shrink-0" />
                      <span>Landing Zone, CAF, compliance & regulatory assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChartBar size={16} weight="duotone" className="mt-0.5 text-teal-500 flex-shrink-0" />
                      <span>AI architecture, data, and governance readiness</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button
                    onClick={onStartSovereignCloud}
                    className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                    size="lg"
                  >
                    <ShieldCheck size={20} weight="duotone" />
                    Sovereign Cloud Assessment
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
            </div>
          </section>

          {/* ── Build lane ───────────────────────────────────────── */}
          <section aria-labelledby="build-lane-heading">
            <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h2 id="build-lane-heading" className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Buildings size={22} weight="duotone" className="text-purple-500" />
                  Build
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Synthesize architectures &mdash; turn discovered use cases into best-fit and estate-optimized blueprints.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">Stage 2</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solution Blueprint Card (use-case-led envisioning) */}
              {onStartSolutionBlueprint && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="md:col-span-2"
                >
              <Card className="h-full border-2 border-purple-500/40 hover:shadow-lg transition-all duration-300 hover:border-purple-500 bg-gradient-to-br from-purple-500/5 to-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
                      <Buildings size={28} weight="duotone" className="text-purple-500" />
                    </div>
                    <Badge variant="outline" className="text-xs">Use-case led</Badge>
                  </div>
                  <CardTitle className="text-xl">Solution Blueprint</CardTitle>
                  <CardDescription className="text-sm">
                    Customer arrived with use cases? Generate dual blueprints — best-fit vs estate-optimized.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Buildings size={16} weight="duotone" className="mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Capture the customer's existing technology estate once</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Pick an archetype per use case to derive required capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={16} weight="duotone" className="mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>Side-by-side stack with security &amp; identity overlays</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button
                    onClick={onStartSolutionBlueprint}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    <Buildings size={20} weight="duotone" />
                    Open Solution Blueprint
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
            </div>
          </section>

          {/* Continue Existing (secondary action, footer) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.66 }}
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
              {onOpenPortfolio && (
                <Button onClick={onOpenPortfolio} variant="outline" className="gap-2">
                  <Buildings size={18} weight="duotone" />
                  Portfolio Intelligence
                </Button>
              )}
              {onOpenValuePortfolio && (
                <Button onClick={onOpenValuePortfolio} variant="outline" className="gap-2">
                  <ChartLineUp size={18} weight="duotone" />
                  Value Portfolio
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <AboutSection />
        </motion.div>

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
                  {/* 1. Quick Discovery - Zava Mining */}
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
                        <div className="text-[10px] text-muted-foreground">Discovery</div>
                      </div>
                    </Button>
                  </div>
                  
                  {/* 2. Sovereign Cloud Assessment - Contoso Financial */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3 hover:border-teal-500/50 hover:bg-teal-500/5"
                      onClick={() => {
                        onEnterDemoMode?.('financial')
                        onStartSovereignCloud?.()
                      }}
                    >
                      <Bank size={18} weight="duotone" className="text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Contoso Financial</div>
                        <div className="text-[10px] text-muted-foreground">Sovereign Cloud</div>
                      </div>
                    </Button>
                  </div>
                  
                  {/* 3. Enterprise Discovery - MegaMart Retail */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3 hover:border-green-500/50 hover:bg-green-500/5"
                      onClick={() => {
                        onEnterDemoMode?.('retail')
                        onStartEnterpriseDiscovery()
                      }}
                    >
                      <ShoppingCart size={18} weight="duotone" className="text-green-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">MegaMart Retail</div>
                        <div className="text-[10px] text-muted-foreground">Strategic Assessment</div>
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
    </>
  )
}
