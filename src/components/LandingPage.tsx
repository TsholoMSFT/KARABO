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
  FileText,
  ShieldCheck,
  CaretDown,
  CaretUp,
  Buildings,
  Heartbeat,
  ClipboardText,
  CalendarBlank,
  EnvelopeSimple
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AboutSection } from '@/components/AboutSection'

interface LandingPageProps {
  customers: Customer[]
  onStartNew: () => void
  onStartSolutionBlueprint?: () => void
  onStartEnterpriseDiscovery: () => void
  onStartNotesAnalysis?: () => void
  onViewExisting: () => void
  onOpenPortfolio?: () => void
  onOpenCsamCockpit?: () => void
  onOpenCustomerQuestionnaire?: () => void
  onOpenAgenda?: () => void
  onOpenFollowupEmail?: () => void
  onSelectTemplate?: (template: SessionTemplate) => void
}

export function LandingPage({ 
  customers, 
  onStartNew, 
  onStartSolutionBlueprint,
  onStartEnterpriseDiscovery,
  onStartNotesAnalysis, 
  onViewExisting,
  onOpenPortfolio,
  onOpenCsamCockpit,
  onOpenCustomerQuestionnaire,
  onOpenAgenda,
  onOpenFollowupEmail,
  onSelectTemplate,
}: LandingPageProps) {
  const hasExistingCustomers = customers.length > 0
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSecurityNotice, setShowSecurityNotice] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
            Use Case Generator
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Turn customer context into qualified, prioritized use cases and engagement-ready outputs.
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

        <div className="mb-6 flex justify-center">
          <Button type="button" variant="ghost" className="gap-2" onClick={() => setShowAdvanced((current) => !current)}>
            <Buildings size={18} weight="duotone" />
            Advanced tools
            {showAdvanced ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </Button>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <Button onClick={onStartNew} className="w-full gap-2" size="lg">
                  <RocketLaunch size={20} weight="duotone" />
                  Start Guided Discovery
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {onStartNotesAnalysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.61 }}>
              <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-cyan-500/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-2">
                    <FileText size={28} weight="duotone" className="text-cyan-500" />
                  </div>
                  <CardTitle className="text-xl">Analyze Notes</CardTitle>
                  <CardDescription>Paste meeting notes or a transcript and extract candidate use cases with supporting context.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Extract problems, outcomes, and use cases</li>
                    <li>Retain source evidence for review</li>
                    <li>Refine before adding to the customer</li>
                  </ul>
                  <Separator />
                  <Button onClick={onStartNotesAnalysis} variant="outline" className="w-full gap-2" size="lg">
                    <FileText size={18} weight="duotone" /> Analyze Notes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {onSelectTemplate && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}>
              <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-amber-500/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 mb-2">
                    <Sparkle size={28} weight="duotone" className="text-amber-500" />
                  </div>
                  <CardTitle className="text-xl">Industry Template</CardTitle>
                  <CardDescription>Start with proven questions and use-case patterns tailored to the customer’s industry.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Choose an industry-specific starting point</li>
                    <li>Adapt suggested questions and outcomes</li>
                    <li>Shorten preparation time</li>
                  </ul>
                  <Separator />
                  <Button onClick={() => setShowTemplates(true)} variant="outline" className="w-full gap-2" size="lg">
                    <Sparkle size={18} weight="duotone" /> Choose Template
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enterprise Discovery Card */}
          {showAdvanced && (<motion.div
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
                  5-stage framework with evidence-based prioritization outputs
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
                    <span>Outcome validation and prioritization</span>
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
          </motion.div>)}

            </div>
          </section>

          <section aria-labelledby="prepare-lane-heading">
            <div className="mb-4">
              <h2 id="prepare-lane-heading" className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <CalendarBlank size={22} weight="duotone" className="text-emerald-500" />
                Prepare
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Turn selected use cases into customer-ready meeting material.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 hover:border-emerald-500/50 transition-colors">
                <CardHeader>
                  <CalendarBlank size={28} weight="duotone" className="text-emerald-500" />
                  <CardTitle className="text-xl">Agenda Builder</CardTitle>
                  <CardDescription>Create a time-boxed, tabular agenda grounded in the customer and use cases.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={onOpenAgenda} variant="outline" className="w-full gap-2" size="lg">
                    <CalendarBlank size={18} /> Build Agenda
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-sky-500/50 transition-colors">
                <CardHeader>
                  <EnvelopeSimple size={28} weight="duotone" className="text-sky-500" />
                  <CardTitle className="text-xl">Follow-up Email</CardTitle>
                  <CardDescription>Draft an audience-aware recap with decisions, actions, and next steps.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={onOpenFollowupEmail} variant="outline" className="w-full gap-2" size="lg">
                    <EnvelopeSimple size={18} /> Draft Email
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Build lane ───────────────────────────────────────── */}
          {showAdvanced && (<section aria-labelledby="build-lane-heading">
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
          </section>)}

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
              {showAdvanced && onOpenPortfolio && (
                <Button onClick={onOpenPortfolio} variant="outline" className="gap-2">
                  <Buildings size={18} weight="duotone" />
                  Portfolio Intelligence
                </Button>
              )}
              {showAdvanced && onOpenCsamCockpit && (
                <Button onClick={onOpenCsamCockpit} variant="outline" className="gap-2">
                  <Heartbeat size={18} weight="duotone" />
                  Client Health Dashboard
                </Button>
              )}
              {showAdvanced && onOpenCustomerQuestionnaire && (
                <Button onClick={onOpenCustomerQuestionnaire} variant="outline" className="gap-2">
                  <ClipboardText size={18} weight="duotone" />
                  Send Customer Questionnaire
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
