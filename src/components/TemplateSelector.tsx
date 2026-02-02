import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  FirstAid,
  Bank,
  Factory,
  Storefront,
  Buildings,
  Code,
  Lightning,
  ArrowRight,
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { SESSION_TEMPLATES, type SessionTemplate, type TemplateSuggestedUseCase } from '@/lib/session-templates'
import { industryLabels } from '@/lib/discovery-questions'

interface TemplateSelectorProps {
  onSelectTemplate: (template: SessionTemplate) => void
  onSkip: () => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FirstAid: <FirstAid size={24} weight="duotone" className="text-red-500" />,
  Bank: <Bank size={24} weight="duotone" className="text-blue-600" />,
  Factory: <Factory size={24} weight="duotone" className="text-orange-500" />,
  Storefront: <Storefront size={24} weight="duotone" className="text-purple-500" />,
  Buildings: <Buildings size={24} weight="duotone" className="text-slate-600" />,
  Code: <Code size={24} weight="duotone" className="text-green-500" />,
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  return `$${(value / 1000).toFixed(0)}K`
}

function UseCasePreview({ useCase }: { useCase: TemplateSuggestedUseCase }) {
  return (
    <div className="p-3 border rounded-lg bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h5 className="font-medium text-sm">{useCase.title}</h5>
          <p className="text-xs text-muted-foreground mt-1">{useCase.description}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {useCase.category}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span>COI: {formatCurrency(useCase.typicalCOI.min)}-{formatCurrency(useCase.typicalCOI.max)}/yr</span>
        <span>Effort: {useCase.typicalEffort.min}-{useCase.typicalEffort.max} weeks</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {useCase.aiProducts.slice(0, 3).map((product, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {product}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ 
  template, 
  onSelect 
}: { 
  template: SessionTemplate
  onSelect: (template: SessionTemplate) => void 
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {ICON_MAP[template.icon] || <FileText size={24} weight="duotone" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{industryLabels[template.industry]}</Badge>
            <Badge variant="outline">{template.suggestedUseCases.length} use cases</Badge>
          </div>

          {/* Quick preview of use cases */}
          <div className="space-y-1">
            {template.suggestedUseCases.slice(0, 2).map((uc, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <CheckCircle size={12} className="text-green-500 shrink-0" />
                <span className="truncate">{uc.title}</span>
              </div>
            ))}
            {template.suggestedUseCases.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{template.suggestedUseCases.length - 2} more
              </span>
            )}
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {ICON_MAP[template.icon]}
                    {template.name}
                  </DialogTitle>
                  <DialogDescription>{template.description}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4">
                    {/* Common Challenges */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Common Challenges</h4>
                      <ul className="space-y-1">
                        {template.commonChallenges.map((challenge, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Discovery Prompts */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Discovery Prompts</h4>
                      <ul className="space-y-1">
                        {template.discoveryPrompts.map((prompt, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Sparkle size={12} className="text-yellow-500 mt-1 shrink-0" />
                            {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Suggested Use Cases */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Suggested Use Cases</h4>
                      <div className="space-y-2">
                        {template.suggestedUseCases.map((uc, i) => (
                          <UseCasePreview key={i} useCase={uc} />
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => { setShowDetails(false); onSelect(template) }} className="gap-2">
                    <Lightning size={16} weight="fill" />
                    Use This Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              size="sm" 
              onClick={() => onSelect(template)}
              className="flex-1 gap-2"
            >
              Use Template
              <ArrowRight size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function TemplateSelector({ onSelectTemplate, onSkip }: TemplateSelectorProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightning size={24} weight="duotone" className="text-yellow-500" />
              Quick Start Templates
            </CardTitle>
            <CardDescription className="mt-1">
              Accelerate your discovery with industry-specific templates including common use cases and prompts
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Start from scratch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SESSION_TEMPLATES.map((template) => (
            <TemplateCard 
              key={template.id} 
              template={template} 
              onSelect={onSelectTemplate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default TemplateSelector
