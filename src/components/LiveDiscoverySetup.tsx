import { useState, useEffect } from 'react'
import { Industry } from '@/lib/types'
import { industryLabels } from '@/lib/discovery-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NavigationHeader } from '@/components/NavigationHeader'
import { Microphone, Warning, SpinnerGap } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { BrowserCapabilityBanner } from '@/components/BrowserCapabilityChecker'
import { BrowserCapabilities, getBrowserCapabilities, canUseLiveDiscovery } from '@/lib/browser-capabilities'
import { LiveDiscoverySettingsDialog, loadLiveDiscoverySettings } from '@/components/LiveDiscoverySettings'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LiveDiscoverySetupProps {
  onStart: (sessionName: string, industry: Industry) => void
  onCancel: () => void
  onBackToLanding?: () => void
}

export function LiveDiscoverySetup({ onStart, onCancel, onBackToLanding }: LiveDiscoverySetupProps) {
  const [sessionName, setSessionName] = useState('')
  const [industry, setIndustry] = useState<Industry>('general')
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null)
  const [isCheckingCapabilities, setIsCheckingCapabilities] = useState(true)
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false)
  const [, setMicrophoneGranted] = useState<boolean | null>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const caps = await getBrowserCapabilities()
        setCapabilities(caps)
        if (!canUseLiveDiscovery(caps)) {
          setShowFallback(true)
        }
      } catch (error) {
        console.error('Failed to check capabilities:', error)
        setShowFallback(true)
        toast.error('Could not verify browser capabilities')
      } finally {
        setIsCheckingCapabilities(false)
      }
    }

    checkCapabilities()
  }, [])

  // Pre-request microphone permission
  const requestMicrophoneAccess = async (): Promise<boolean> => {
    setIsRequestingMicrophone(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setMicrophoneGranted(true)
      return true
    } catch (error: any) {
      console.error('Microphone access denied:', error)
      setMicrophoneGranted(false)
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone permissions to use Live Discovery.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.')
      } else {
        toast.error('Could not access microphone. Please check your device settings.')
      }
      return false
    } finally {
      setIsRequestingMicrophone(false)
    }
  }

  const handleStart = async () => {
    if (!sessionName.trim()) return
    
    // Request microphone permission before starting
    const hasAccess = await requestMicrophoneAccess()
    if (!hasAccess) {
      return // Don't proceed if microphone access denied
    }
    
    // Load and apply saved settings
    loadLiveDiscoverySettings()
    onStart(sessionName, industry)
  }

  const handleFallback = () => {
    // User choosing to use text-based discovery instead
    onCancel()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-md">
        <NavigationHeader
          variant="minimal"
          onBackToLanding={onBackToLanding}
          onBack={onCancel}
          backLabel="Cancel"
        />
      </div>
      <div className="flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Show fallback option if capabilities check shows Live Discovery not available */}
        {showFallback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Alert className="border-yellow-200 bg-yellow-50">
              <Warning size={16} className="text-yellow-700" />
              <AlertDescription className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Live Discovery not available</p>
                <p className="text-xs mb-2">
                  Your browser or system doesn't support voice input at this time.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFallback}
                  className="w-full text-xs"
                >
                  Use Standard Discovery (Text Input)
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Microphone size={28} weight="bold" className="text-primary" />
                <CardTitle className="text-2xl">Start Live Discovery</CardTitle>
              </div>
              {!isCheckingCapabilities && (
                <LiveDiscoverySettingsDialog />
              )}
            </div>
            <CardDescription className="text-base">
              Quick setup to begin voice-enabled discovery session
            </CardDescription>
          </CardHeader>

          {/* Capability Status Banner */}
          {!isCheckingCapabilities && capabilities && (
            <CardContent className="pb-0">
              <BrowserCapabilityBanner 
                capabilities={capabilities} 
                isLoading={isCheckingCapabilities}
              />
            </CardContent>
          )}

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Customer A - Dec 2025"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sessionName.trim()) {
                    handleStart()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={(value) => setIndustry(value as Industry)}>
                <SelectTrigger id="industry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(industryLabels) as Industry[]).map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {industryLabels[ind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleStart} 
              disabled={
                !sessionName.trim() || 
                isCheckingCapabilities || 
                isRequestingMicrophone ||
                !!(showFallback && capabilities && !canUseLiveDiscovery(capabilities))
              }
              className="flex-1 gap-2"
            >
              {isCheckingCapabilities ? (
                <>
                  <SpinnerGap size={18} className="animate-spin" />
                  Checking...
                </>
              ) : isRequestingMicrophone ? (
                <>
                  <SpinnerGap size={18} className="animate-spin" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <Microphone size={18} weight="fill" />
                  Start
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      </div>
    </div>
  )
}
