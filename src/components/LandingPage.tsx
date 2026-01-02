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
  MagnifyingGlass
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface LandingPageProps {
  customers: Customer[]
  onStartNew: () => void
  onViewExisting: () => void
}

export function LandingPage({ customers, onStartNew, onViewExisting }: LandingPageProps) {
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

        <div className="grid md:grid-cols-2 gap-6">
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
                  <Badge className="text-xs">Recommended</Badge>
                </div>
                <CardTitle className="text-2xl">Start New Session</CardTitle>
                <CardDescription className="text-base">
                  Begin a new discovery process with AI-powered insights and use case generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">What you'll do:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Buildings size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                      <span>Enter customer information and ticker symbol</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MagnifyingGlass size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                      <span>Answer guided discovery questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkle size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                      <span>Get AI-generated use cases based on your responses and earnings data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChartBar size={16} weight="duotone" className="mt-0.5 text-primary flex-shrink-0" />
                      <span>Prioritize and score opportunities</span>
                    </li>
                  </ul>
                </div>
                <Separator />
                <Button 
                  onClick={onStartNew} 
                  className="w-full gap-2"
                  size="lg"
                >
                  <RocketLaunch size={20} weight="duotone" />
                  Start New Discovery
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                    <FolderOpen size={28} weight="duotone" className="text-blue-600" />
                  </div>
                  {hasExistingCustomers && (
                    <Badge variant="secondary" className="text-xs">
                      {customers.length} customer{customers.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">Continue Existing</CardTitle>
                <CardDescription className="text-base">
                  {hasExistingCustomers 
                    ? 'View and manage your saved discovery sessions and customers'
                    : 'You don\'t have any saved sessions yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasExistingCustomers ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">What you can do:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <FolderOpen size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>View past discovery sessions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Buildings size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>Filter by customer or view all sessions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChartBar size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>Compare multiple sessions side-by-side</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Lightbulb size={16} weight="duotone" className="mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>Review use cases and recommendations</span>
                        </li>
                      </ul>
                    </div>
                    <Separator />
                    <Button 
                      onClick={onViewExisting}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <FolderOpen size={20} weight="duotone" />
                      View Existing Sessions
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="py-8 text-center">
                      <FolderOpen size={48} weight="duotone" className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Start your first discovery session to see it here
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
                      No Sessions Yet
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
