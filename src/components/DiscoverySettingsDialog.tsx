import { useDiscoverySettings } from '@/hooks/use-discovery-settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Sparkle, Info, Lightning, ChatCircleDots, Lightbulb, MagicWand, Robot } from '@phosphor-icons/react'

interface DiscoverySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscoverySettingsDialog({ open, onOpenChange }: DiscoverySettingsDialogProps) {
  const { settings, updateSettings } = useDiscoverySettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="duotone" className="text-primary" />
            Discovery Settings
          </DialogTitle>
          <DialogDescription>
            Configure AI-powered features for your discovery sessions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Master AI Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="space-y-1 flex-1">
              <Label htmlFor="ai-assist" className="text-base font-semibold flex items-center gap-2">
                <Robot size={18} weight="duotone" className="text-primary" />
                Enable AI Assistance
              </Label>
              <p className="text-sm text-muted-foreground">
                Master toggle for all AI-powered features across Discovery and Strategic Assessment modes.
              </p>
            </div>
            <Switch
              id="ai-assist"
              checked={settings.enableAIAssist}
              onCheckedChange={(checked) => 
                updateSettings({ enableAIAssist: checked })
              }
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Discovery Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightning size={18} weight="duotone" className="text-primary" />
              <h3 className="font-semibold text-sm">Discovery</h3>
            </div>

            <div className={`space-y-4 ${!settings.enableAIAssist ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="follow-up-questions" className="text-sm font-medium flex items-center gap-2">
                    <ChatCircleDots size={16} className="text-muted-foreground" />
                    AI Follow-Up Questions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Generate intelligent follow-up questions to dig deeper into insights and uncover additional use cases.
                  </p>
                </div>
                <Switch
                  id="follow-up-questions"
                  checked={settings.enableFollowUpQuestions}
                  onCheckedChange={(checked) => 
                    updateSettings({ enableFollowUpQuestions: checked })
                  }
                  disabled={!settings.enableAIAssist}
                  className="mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="ai-insights" className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb size={16} className="text-muted-foreground" />
                    AI Insights
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Generate real-time AI insights and suggestions based on your responses during Live Discovery.
                  </p>
                </div>
                <Switch
                  id="ai-insights"
                  checked={settings.enableAIInsights}
                  onCheckedChange={(checked) => 
                    updateSettings({ enableAIInsights: checked })
                  }
                  disabled={!settings.enableAIAssist}
                  className="mt-0.5"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Enterprise Discovery Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkle size={18} weight="duotone" className="text-primary" />
              <h3 className="font-semibold text-sm">Strategic Assessment</h3>
            </div>

            <div className={`space-y-4 ${!settings.enableAIAssist ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="scq-generation" className="text-sm font-medium flex items-center gap-2">
                    <MagicWand size={16} className="text-muted-foreground" />
                    Auto-Generate SCQ
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate Situation, Complication, and Question (SCQ) framework content from your problem statements.
                  </p>
                </div>
                <Switch
                  id="scq-generation"
                  checked={settings.enableSCQGeneration}
                  onCheckedChange={(checked) => 
                    updateSettings({ enableSCQGeneration: checked })
                  }
                  disabled={!settings.enableAIAssist}
                  className="mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="use-case-generation" className="text-sm font-medium flex items-center gap-2">
                    <Robot size={16} className="text-muted-foreground" />
                    AI Use Case Generation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Generate AI-powered use case suggestions and recommendations based on your discovery inputs.
                  </p>
                </div>
                <Switch
                  id="use-case-generation"
                  checked={settings.enableUseCaseGeneration}
                  onCheckedChange={(checked) => 
                    updateSettings({ enableUseCaseGeneration: checked })
                  }
                  disabled={!settings.enableAIAssist}
                  className="mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
            <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              AI features require an active internet connection. You can enable or disable specific features as needed. All AI features can be bypassed during discovery sessions.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
