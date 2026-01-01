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
import { Sparkle, Info } from '@phosphor-icons/react'

interface DiscoverySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscoverySettingsDialog({ open, onOpenChange }: DiscoverySettingsDialogProps) {
  const { settings, updateSettings } = useDiscoverySettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="duotone" className="text-primary" />
            Discovery Settings
          </DialogTitle>
          <DialogDescription>
            Customize your discovery session experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="follow-up-questions" className="text-base font-semibold">
                AI Follow-Up Questions
              </Label>
              <p className="text-sm text-muted-foreground">
                After answering base questions, AI can generate intelligent follow-up questions to dig deeper into insights and uncover additional use cases.
              </p>
              <div className="flex items-start gap-2 mt-2 p-3 bg-muted/50 rounded-md">
                <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  When enabled, you'll be prompted to generate follow-up questions after completing the standard discovery questions. You can always skip if you prefer.
                </p>
              </div>
            </div>
            <Switch
              id="follow-up-questions"
              checked={settings.enableFollowUpQuestions}
              onCheckedChange={(checked) => 
                updateSettings({ enableFollowUpQuestions: checked })
              }
              className="mt-1"
            />
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
