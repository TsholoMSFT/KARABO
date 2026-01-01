import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Gear, CheckCircle } from '@phosphor-icons/react'

export interface LiveDiscoverySettings {
  language: string
  speechTimeout: number // milliseconds
  enableAiInsights: boolean
  enableFollowUp: boolean
  autoStopOnSilence: boolean
  showWarnings: boolean
}

const DEFAULT_SETTINGS: LiveDiscoverySettings = {
  language: 'en-US',
  speechTimeout: 10000,
  enableAiInsights: true,
  enableFollowUp: true,
  autoStopOnSilence: true,
  showWarnings: true,
}

interface LiveDiscoverySettingsDialogProps {
  onSettingsChange?: (settings: LiveDiscoverySettings) => void
  initialSettings?: Partial<LiveDiscoverySettings>
}

export function LiveDiscoverySettingsDialog({
  onSettingsChange,
  initialSettings = {},
}: LiveDiscoverySettingsDialogProps) {
  const [settings, setSettings] = useState<LiveDiscoverySettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  })
  const [isOpen, setIsOpen] = useState(false)

  const handleSettingChange = (key: keyof LiveDiscoverySettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('liveDiscoverySettings', JSON.stringify(settings))
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Configure Live Discovery settings"
        >
          <Gear size={16} />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Live Discovery Settings</DialogTitle>
          <DialogDescription>
            Customize how Live Discovery works for your session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium">
              Language
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value) => handleSettingChange('language', value)}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="it-IT">Italian</SelectItem>
                <SelectItem value="ja-JP">Japanese</SelectItem>
                <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Speech recognition language for voice input
            </p>
          </div>

          {/* Speech Timeout */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Speech Timeout: {settings.speechTimeout / 1000}s
            </Label>
            <Slider
              value={[settings.speechTimeout]}
              onValueChange={(value) => handleSettingChange('speechTimeout', value[0])}
              min={3000}
              max={30000}
              step={1000}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Time to wait before showing "no speech detected" warning (3-30 seconds)
            </p>
          </div>

          {/* AI Insights */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">Enable AI Insights</Label>
              <p className="text-xs text-muted-foreground">
                Get real-time insights on your answers
              </p>
            </div>
            <Switch
              checked={settings.enableAiInsights}
              onCheckedChange={(checked) => handleSettingChange('enableAiInsights', checked)}
            />
          </div>

          {/* Follow-up Questions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">Enable Follow-up Questions</Label>
              <p className="text-xs text-muted-foreground">
                Get AI-generated follow-up questions
              </p>
            </div>
            <Switch
              checked={settings.enableFollowUp}
              onCheckedChange={(checked) => handleSettingChange('enableFollowUp', checked)}
            />
          </div>

          {/* Auto-stop on Silence */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">Auto-stop on Silence</Label>
              <p className="text-xs text-muted-foreground">
                Automatically stop listening after silence
              </p>
            </div>
            <Switch
              checked={settings.autoStopOnSilence}
              onCheckedChange={(checked) => handleSettingChange('autoStopOnSilence', checked)}
            />
          </div>

          {/* Show Warnings */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">Show Warnings</Label>
              <p className="text-xs text-muted-foreground">
                Display helpful warnings during input
              </p>
            </div>
            <Switch
              checked={settings.showWarnings}
              onCheckedChange={(checked) => handleSettingChange('showWarnings', checked)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 gap-2">
            <CheckCircle size={16} />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Load saved settings from localStorage or return defaults
 */
export function loadLiveDiscoverySettings(): LiveDiscoverySettings {
  try {
    const saved = localStorage.getItem('liveDiscoverySettings')
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.warn('Failed to load settings:', error)
  }
  return DEFAULT_SETTINGS
}

/**
 * Settings summary card for display
 */
interface LiveDiscoverySettingsSummaryProps {
  settings: LiveDiscoverySettings
}

export function LiveDiscoverySettingsSummary({ settings }: LiveDiscoverySettingsSummaryProps) {
  return (
    <Card className="border border-border bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Active Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Language</span>
          <span className="font-medium">{settings.language}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Timeout</span>
          <span className="font-medium">{settings.speechTimeout / 1000}s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">AI Features</span>
          <span className="font-medium">
            {settings.enableAiInsights && settings.enableFollowUp
              ? 'All enabled'
              : settings.enableAiInsights
                ? 'Insights only'
                : settings.enableFollowUp
                  ? 'Follow-up only'
                  : 'Disabled'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
