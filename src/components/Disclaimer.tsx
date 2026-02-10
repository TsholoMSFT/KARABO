import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Warning, 
  Info, 
  ShieldCheck, 
  Robot, 
  Scales,
  CaretDown,
  CaretUp,
  Bank,
  Globe
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DisclaimerProps {
  variant?: 'compact' | 'expanded' | 'banner'
  showAIDisclaimer?: boolean
  showLegalDisclaimer?: boolean
  showFinancialDisclaimer?: boolean
  showAfricaDisclaimer?: boolean
  className?: string
}

export function Disclaimer({
  variant = 'compact',
  showAIDisclaimer = true,
  showLegalDisclaimer = true,
  showFinancialDisclaimer = false,
  showAfricaDisclaimer = false,
  className
}: DisclaimerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'banner') {
    return (
      <div className={cn(
        "bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm",
        className
      )}>
        <div className="flex items-start gap-2">
          <Warning size={18} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Disclaimer:</span> This tool uses AI to generate insights and recommendations. 
              Content should be validated by qualified professionals before use in decision-making.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-between text-muted-foreground hover:text-foreground gap-2 h-auto py-2"
          >
            <div className="flex items-center gap-2">
              <Info size={16} weight="fill" className="text-blue-500" />
              <span className="text-xs">Important Disclaimers & Legal Notices</span>
            </div>
            {isOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 text-xs text-muted-foreground border-t pt-3">
            {showAIDisclaimer && (
              <div className="flex items-start gap-2">
                <Robot size={14} className="text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium text-foreground">AI-Generated Content:</span> Portions of this assessment 
                  are generated using AI. Content should be reviewed and validated before use.
                </p>
              </div>
            )}
            {showLegalDisclaimer && (
              <div className="flex items-start gap-2">
                <Scales size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium text-foreground">Not Legal Advice:</span> Regulatory information is for 
                  educational purposes only. Consult qualified legal professionals for compliance requirements.
                </p>
              </div>
            )}
            {showFinancialDisclaimer && (
              <div className="flex items-start gap-2">
                <Bank size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium text-foreground">Not Financial Advice:</span> Financial projections are 
                  illustrative only. Conduct independent financial analysis before decisions.
                </p>
              </div>
            )}
            {showAfricaDisclaimer && (
              <div className="flex items-start gap-2">
                <Globe size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium text-foreground">Africa Region:</span> Ensure compliance with POPIA, 
                  AU AI Strategy, and local regulations. Consider data sovereignty requirements.
                </p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-medium text-foreground">Microsoft Position:</span> This assessment is provided 
                as part of Innovation Hub activities. Views do not necessarily reflect Microsoft's official position.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Expanded variant
  return (
    <Card className={cn("bg-muted/30 border-muted", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Warning size={20} weight="duotone" className="text-amber-500" />
          Important Notices & Disclaimers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {showAIDisclaimer && (
          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Robot size={20} weight="duotone" className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary mb-1">AI-Generated Content</p>
              <p className="text-muted-foreground text-xs">
                Portions of this assessment, including executive summaries, use case rationales, and recommendations, 
                have been generated using artificial intelligence. While we strive for accuracy, AI-generated content 
                may contain errors or omissions. All content should be reviewed and validated by qualified personnel.
              </p>
            </div>
          </div>
        )}

        {showLegalDisclaimer && (
          <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <Scales size={20} weight="duotone" className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-700 dark:text-orange-300 mb-1">Not Legal or Regulatory Advice</p>
              <p className="text-muted-foreground text-xs">
                The regulatory and compliance information presented is for educational purposes only and does not 
                constitute legal advice. Requirements vary by jurisdiction and are subject to change. Consult with 
                qualified legal professionals for specific compliance requirements.
              </p>
            </div>
          </div>
        )}

        {showFinancialDisclaimer && (
          <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <Bank size={20} weight="duotone" className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300 mb-1">Not Financial Advice</p>
              <p className="text-muted-foreground text-xs">
                Any financial projections, ROI estimates, or cost savings are illustrative only and based on 
                assumptions that may not apply to your situation. Conduct independent financial analysis and 
                consult qualified financial professionals.
              </p>
            </div>
          </div>
        )}

        {showAfricaDisclaimer && (
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Globe size={20} weight="duotone" className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Africa & South Africa Compliance</p>
              <p className="text-muted-foreground text-xs">
                For African deployments, ensure compliance with POPIA (South Africa), the African Union Continental 
                AI Strategy, and relevant national policies. Consider data sovereignty, cross-border data transfers, 
                and local capacity building requirements.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
          <ShieldCheck size={20} weight="duotone" className="text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Microsoft Position</p>
            <p className="text-muted-foreground text-xs">
              This assessment is provided as part of Microsoft's Innovation Hub engagement activities. The views 
              and recommendations expressed do not necessarily reflect the official position of Microsoft Corporation. 
              Microsoft makes no warranties regarding the accuracy or suitability of the information provided.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Subtle AI attribution indicator for AI-generated content
export function AIBadge({ className }: { className?: string }) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-0.5 text-[10px] py-0 px-1.5 h-5 bg-primary/5 border-primary/20 text-primary/70",
        className
      )}
    >
      <Robot size={10} weight="fill" />
      AI
    </Badge>
  )
}

// Compact inline disclaimer for use in cards/dialogs
export function InlineDisclaimer({ 
  text, 
  icon = 'info',
  className 
}: { 
  text: string
  icon?: 'info' | 'warning' | 'ai' | 'legal'
  className?: string 
}) {
  const iconComponents = {
    info: <Info size={14} weight="fill" className="text-blue-500 flex-shrink-0" />,
    warning: <Warning size={14} weight="fill" className="text-amber-500 flex-shrink-0" />,
    ai: <Robot size={14} weight="fill" className="text-primary flex-shrink-0" />,
    legal: <Scales size={14} weight="fill" className="text-orange-500 flex-shrink-0" />
  }

  return (
    <div className={cn(
      "flex items-start gap-1.5 text-xs text-muted-foreground",
      className
    )}>
      {iconComponents[icon]}
      <p>{text}</p>
    </div>
  )
}
