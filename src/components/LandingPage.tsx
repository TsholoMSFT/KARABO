import { Customer } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkle, 
  RocketLaunch, 
  Buildings, 
  FolderOpen, 
  Lightbulb,
  ChartBar,
  MagnifyingGlass,
  Briefcase,
  ChartLine,
  Calculator,
  Play,
  HardHat,
  ShoppingCart,
  Bank,
  FileText,
  TreeStructure
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

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
  onSkipToUseCases
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
              <MagnifyingGlass size={14} className="mr-1" />
              Earnings Analysis
            </Badge>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <RocketLaunch size={28} weight="duotone" className="text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">Quick Start</Badge>
                </div>
                <CardTitle className="text-xl">Quick Discovery</CardTitle>
                <CardDescription className="text-sm">
                  Rapid use case identification with AI-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <MagnifyingGlass size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                    <span>Guided discovery questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkle size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                    <span>AI-generated use cases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChartBar size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                    <span>Impact & RICE scoring</span>
                  </li>
                </ul>
                <Separator />
                <Button 
                  onClick={onStartNew} 
                  className="w-full gap-2"
                  size="lg"
                >
                  <RocketLaunch size={20} weight="duotone" />
                  Quick Discovery
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Notes Analysis Card */}
          {onStartNotesAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
            >
              <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-green-500/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                      <FileText size={28} weight="duotone" className="text-green-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">Instant</Badge>
                  </div>
                  <CardTitle className="text-xl">Notes Analysis</CardTitle>
                  <CardDescription className="text-sm">
                    Paste notes and extract use cases instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <FileText size={16} weight="duotone" className="mt-0.5 text-green-600 flex-shrink-0" />
                      <span>Paste discovery notes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-green-600 flex-shrink-0" />
                      <span>AI extracts use cases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChartBar size={16} weight="duotone" className="mt-0.5 text-green-600 flex-shrink-0" />
                      <span>Source highlighting</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button 
                    onClick={onStartNotesAnalysis} 
                    variant="outline"
                    className="w-full gap-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    size="lg"
                  >
                    <FileText size={20} weight="duotone" />
                    Analyze Notes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enterprise Discovery Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Card className="h-full border-2 border-[#0078D4]/50 hover:shadow-lg transition-all duration-300 hover:border-[#0078D4] bg-gradient-to-br from-[#0078D4]/5 to-transparent">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#0078D4]/10">
                    <Briefcase size={28} weight="duotone" className="text-[#0078D4]" />
                  </div>
                  <Badge className="text-xs bg-[#0078D4] hover:bg-[#0078D4]">Recommended</Badge>
                </div>
                <CardTitle className="text-xl">Enterprise Discovery</CardTitle>
                <CardDescription className="text-sm">
                  Comprehensive 5-stage framework with financial modeling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Calculator size={16} weight="duotone" className="mt-0.5 text-[#0078D4] flex-shrink-0" />
                    <span>COI 4-box quantification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Buildings size={16} weight="duotone" className="mt-0.5 text-[#0078D4] flex-shrink-0" />
                    <span>Stakeholder & MEDDPICC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChartLine size={16} weight="duotone" className="mt-0.5 text-[#0078D4] flex-shrink-0" />
                    <span>ROI & executive summary</span>
                  </li>
                </ul>
                <Separator />
                <Button 
                  onClick={onStartEnterpriseDiscovery} 
                  className="w-full gap-2 bg-[#0078D4] hover:bg-[#106EBE]"
                  size="lg"
                >
                  <Briefcase size={20} weight="duotone" />
                  Enterprise Discovery
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Assessment Card */}
          {onStartAIAssessment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.67 }}
            >
              <Card className="h-full border-2 border-purple-500/40 hover:shadow-lg transition-all duration-300 hover:border-purple-500 bg-gradient-to-br from-purple-500/5 to-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
                      <TreeStructure size={28} weight="duotone" className="text-purple-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">Process</Badge>
                  </div>
                  <CardTitle className="text-xl">AI Assessment</CardTitle>
                  <CardDescription className="text-sm">
                    Structured process analysis to refine agent opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <TreeStructure size={16} weight="duotone" className="mt-0.5 text-purple-600 flex-shrink-0" />
                      <span>Map workflows, handoffs, and constraints</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-purple-600 flex-shrink-0" />
                      <span>Generate value + feasibility analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChartBar size={16} weight="duotone" className="mt-0.5 text-purple-600 flex-shrink-0" />
                      <span>Feed the portfolio prioritization matrix</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button
                    onClick={onStartAIAssessment}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <Sparkle size={20} weight="duotone" />
                    AI Assessment
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Continue Existing Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-blue-500/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                    <FolderOpen size={28} weight="duotone" className="text-blue-600" />
                  </div>
                  {hasExistingCustomers && (
                    <Badge variant="secondary" className="text-xs">
                      {customers.length} session{customers.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">Continue Existing</CardTitle>
                <CardDescription className="text-sm">
                  {hasExistingCustomers 
                    ? 'View and manage saved sessions'
                    : 'No saved sessions yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasExistingCustomers ? (
                  <>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <FolderOpen size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>View past sessions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChartBar size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>Compare side-by-side</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lightbulb size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>Review recommendations</span>
                      </li>
                    </ul>
                    <Separator />
                    <Button 
                      onClick={onViewExisting}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <FolderOpen size={20} weight="duotone" />
                      View Sessions
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="py-6 text-center">
                      <FolderOpen size={40} weight="duotone" className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Start a discovery to see it here
                      </p>
                    </div>
                    <Button 
                      onClick={onViewExisting}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                      disabled
                    >
                      <FolderOpen size={20} weight="duotone" />
                      No Sessions
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <Card className="bg-muted/30 border-muted">
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">3</div>
                  <div className="text-sm text-muted-foreground">Discovery Modes</div>
                </div>
                <Separator orientation="vertical" className="h-12 hidden sm:block" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">AI-Powered</div>
                  <div className="text-sm text-muted-foreground">Use Case Generation</div>
                </div>
                <Separator orientation="vertical" className="h-12 hidden sm:block" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Integrated</div>
                  <div className="text-sm text-muted-foreground">Earnings Analysis</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Try Demo Section */}
        {(onStartDemo || onStartEnterpriseDemo) && (
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
                    <h3 className="font-semibold text-lg">Try a Demo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Explore pre-populated sessions with real-world scenarios</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  {/* Mining Demo */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3"
                      onClick={() => onStartDemo?.('mining')}
                    >
                      <HardHat size={18} weight="duotone" className="text-amber-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Zava Mining</div>
                        <div className="text-[10px] text-muted-foreground">Quick Discovery</div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => onStartEnterpriseDemo?.('mining')}
                    >
                      <Briefcase size={12} />
                      Enterprise
                    </Button>
                  </div>
                  
                  {/* Retail Demo */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3"
                      onClick={() => onStartDemo?.('retail')}
                    >
                      <ShoppingCart size={18} weight="duotone" className="text-green-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">MegaMart Retail</div>
                        <div className="text-[10px] text-muted-foreground">Quick Discovery</div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => onStartEnterpriseDemo?.('retail')}
                    >
                      <Briefcase size={12} />
                      Enterprise
                    </Button>
                  </div>
                  
                  {/* Financial Demo */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-auto py-3"
                      onClick={() => onStartDemo?.('financial')}
                    >
                      <Bank size={18} weight="duotone" className="text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Apex Financial</div>
                        <div className="text-[10px] text-muted-foreground">Quick Discovery</div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => onStartEnterpriseDemo?.('financial')}
                    >
                      <Briefcase size={12} />
                      Enterprise
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
        
        {onSkipToUseCases && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95 }}
            className="text-center mt-4"
          >
            <Button
              variant="link"
              onClick={onSkipToUseCases}
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <Lightbulb size={14} />
              Skip directly to use case entry →
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
