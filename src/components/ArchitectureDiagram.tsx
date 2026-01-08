/**
 * Architecture Diagram Component
 * Visualizes Microsoft Reference Architecture patterns with validated architecture diagrams
 * Specific to Microsoft Learn validated architecture patterns
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ReferenceArchitectureMermaid } from '@/components/ReferenceArchitectureMermaid'
import {
  REFERENCE_ARCHITECTURES,
  PRODUCT_FAMILY_LABELS,
  PRODUCT_FAMILY_COLORS,
  PRODUCT_FAMILY_ICONS,
  COMPLEXITY_INDICATORS,
  getServiceLabel,
  type ReferenceArchitecturePattern,
} from '@/lib/microsoft-solutions'
import { SERVICE_TIER_MAPPING, type ServiceTier } from '@/lib/architecture-diagrams'
import { 
  ArrowRight, 
  ArrowsClockwise, 
  Brain, 
  Database, 
  Cloud, 
  Lightning, 
  Gear,
  ArrowSquareOut,
  CaretDown,
  CaretUp,
  Robot,
  ChartLine,
  FileText,
  Chats,
  Factory,
  Users,
  ShieldCheck,
  Code,
  Sparkle,
  ChatCircleDots,
} from '@phosphor-icons/react'

// Architecture pattern icons
const ARCHITECTURE_ICONS: Record<ReferenceArchitecturePattern, React.ElementType> = {
  'conversational-ai': Chats,
  'document-processing': FileText,
  'predictive-analytics': ChartLine,
  'iot-telemetry': Gear,
  'digital-twin': Factory,
  'knowledge-mining': Brain,
  'process-automation': Lightning,
  'customer-360': Users,
  'supply-chain-optimization': ArrowsClockwise,
  'fraud-detection': ShieldCheck,
  'content-generation': Sparkle,
  'code-assistant': Code,
  'agentic-ai': Robot,
}

const SERVICE_TIER_CONFIG: Record<ServiceTier, { label: string; color: string; icon: React.ElementType }> = {
  ingestion: { label: 'Data Ingestion', color: 'bg-blue-500', icon: Cloud },
  processing: { label: 'Processing', color: 'bg-purple-500', icon: Gear },
  intelligence: { label: 'AI/ML', color: 'bg-pink-500', icon: Brain },
  storage: { label: 'Data Storage', color: 'bg-green-500', icon: Database },
  presentation: { label: 'Presentation', color: 'bg-amber-500', icon: ChartLine },
  integration: { label: 'Integration', color: 'bg-sky-500', icon: ArrowsClockwise },
}

interface ArchitectureDiagramProps {
  pattern: ReferenceArchitecturePattern
  compact?: boolean
  className?: string
  showLearnLink?: boolean
  onRequestDifferent?: (feedback: string) => void
}

export function ArchitectureDiagram({ 
  pattern, 
  compact = false, 
  className = '',
  showLearnLink = true,
  onRequestDifferent,
}: ArchitectureDiagramProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  
  const architecture = REFERENCE_ARCHITECTURES[pattern]
  
  if (!architecture) {
    return (
      <div className={`p-4 border rounded-lg bg-muted/50 ${className}`}>
        <p className="text-sm text-muted-foreground">Unknown architecture pattern: {pattern}</p>
      </div>
    )
  }

  const Icon = ARCHITECTURE_ICONS[pattern]
  const complexityInfo = COMPLEXITY_INDICATORS[architecture.complexity]

  const servicesByTier: Record<ServiceTier, string[]> = {
    ingestion: [],
    processing: [],
    intelligence: [],
    storage: [],
    presentation: [],
    integration: [],
  }

  architecture.typicalServices.forEach(service => {
    const tier = SERVICE_TIER_MAPPING[service] || 'integration'
    servicesByTier[tier].push(service)
  })

  const activeTiers = (Object.entries(servicesByTier) as [ServiceTier, string[]][])
    .filter(([, services]) => services.length > 0)

  if (compact && !isExpanded) {
    return (
      <div 
        className={`flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon size={16} weight="duotone" className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{architecture.label}</p>
          <p className="text-xs text-muted-foreground truncate">
            {architecture.typicalServices.length} services • {architecture.complexity} complexity
          </p>
        </div>
        <CaretDown size={16} className="text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      initial={compact ? { opacity: 0, height: 0 } : false}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={className}
    >
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{architecture.label}</CardTitle>
                <CardDescription className="mt-1">{architecture.description}</CardDescription>
              </div>
            </div>
            {compact && (
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                <CaretUp size={20} />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {architecture.primaryProducts.map(family => (
              <Badge 
                key={family} 
                variant="outline" 
                className={`${PRODUCT_FAMILY_COLORS[family]} text-xs`}
              >
                {PRODUCT_FAMILY_ICONS[family]} {PRODUCT_FAMILY_LABELS[family]}
              </Badge>
            ))}
            <Badge variant="outline" className={`${complexityInfo.color} text-xs`}>
              {complexityInfo.label}
            </Badge>
            {architecture.agenticPotential === 'high' && (
              <Badge variant="outline" className="bg-violet-100 text-violet-800 border-violet-200 text-xs">
                <Robot size={12} className="mr-1" />
                High Agentic Potential
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkle size={14} />
              Rendered Diagram (JSON → Mermaid)
            </div>
            <ReferenceArchitectureMermaid pattern={pattern} className="rounded-md border border-border bg-muted/10 p-2" />
          </div>

          <div className="relative">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Gear size={14} />
              Architecture Components
            </div>
            
            <div className="flex flex-col gap-2">
              {activeTiers.map(([tier, services], tierIndex) => {
                const tierConfig = SERVICE_TIER_CONFIG[tier]
                const TierIcon = tierConfig.icon

                return (
                  <div key={tier} className="relative">
                    {tierIndex > 0 && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                        <ArrowRight size={16} className="text-muted-foreground rotate-90" />
                      </div>
                    )}
                    
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1 rounded ${tierConfig.color}`}>
                          <TierIcon size={14} className="text-white" weight="bold" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {tierConfig.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {services.map(service => (
                          <Badge 
                            key={service} 
                            variant="secondary" 
                            className="text-xs font-normal"
                          >
                            {getServiceLabel(service)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Typical Duration</p>
              <p className="font-medium">{complexityInfo.typicalDuration}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Team Size</p>
              <p className="font-medium">{complexityInfo.typicalTeamSize}</p>
            </div>
          </div>

          {showLearnLink && architecture.msLearnUrl && (
            <a
              href={architecture.msLearnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowSquareOut size={16} />
              View on Microsoft Learn
            </a>
          )}

          {onRequestDifferent && (
            <div className="pt-2 border-t">
              {!showFeedback ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFeedback(true)}
                  className="w-full"
                >
                  <ChatCircleDots size={16} className="mr-2" />
                  Request Different Architecture
                </Button>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe what type of architecture would better fit this use case..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        onRequestDifferent(feedback)
                        setShowFeedback(false)
                        setFeedback('')
                      }}
                      disabled={!feedback.trim()}
                    >
                      Submit Request
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowFeedback(false)
                        setFeedback('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ArchitectureBadge({ 
  pattern, 
  showTooltip = true 
}: { 
  pattern: ReferenceArchitecturePattern
  showTooltip?: boolean 
}) {
  const architecture = REFERENCE_ARCHITECTURES[pattern]
  if (!architecture) return null

  const Icon = ARCHITECTURE_ICONS[pattern]

  return (
    <Badge 
      variant="outline" 
      className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 gap-1"
      title={showTooltip ? architecture.description : undefined}
    >
      <Icon size={12} weight="fill" />
      {architecture.label}
    </Badge>
  )
}

export default ArchitectureDiagram
