import { useEffect, useState } from 'react'
import { 
  BrowserCapabilities, 
  getBrowserCapabilities, 
  getAllCapabilityErrors,
  canUseLiveDiscovery,
  CapabilityError 
} from '@/lib/browser-capabilities'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  WarningCircle,
  CheckCircle,
  XCircle,
  MicrophoneSlash,
  GlobeX,
  Warning,
  ArrowRight,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface BrowserCapabilityCheckerProps {
  onCapabilitiesReady?: (capabilities: BrowserCapabilities) => void
  onCanContinue?: (canContinue: boolean) => void
  showDetails?: boolean
}

export function BrowserCapabilityChecker({
  onCapabilitiesReady,
  onCanContinue,
  showDetails = true,
}: BrowserCapabilityCheckerProps) {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [errors, setErrors] = useState<CapabilityError[]>([])

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const caps = await getBrowserCapabilities()
        setCapabilities(caps)
        const cappErrors = getAllCapabilityErrors(caps)
        setErrors(cappErrors)
        onCapabilitiesReady?.(caps)
        onCanContinue?.(canUseLiveDiscovery(caps))
      } catch (error) {
        console.error('Failed to check capabilities:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkCapabilities()
  }, [onCapabilitiesReady, onCanContinue])

  if (isChecking || !capabilities) {
    return (
      <Card className="border border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <CheckCircle size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Checking browser capabilities...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const blockingErrors = errors.filter((e) => e.isBlocking)
  const warnings = errors.filter((e) => !e.isBlocking)
  const canContinue = blockingErrors.length === 0

  if (!showDetails && canContinue) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Capability Status Summary */}
      <Card className="border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {canContinue ? (
                <>
                  <CheckCircle size={20} className="text-green-500" weight="fill" />
                  Ready for Live Discovery
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-red-500" weight="fill" />
                  Live Discovery Not Available
                </>
              )}
            </CardTitle>
            <Badge variant={canContinue ? 'default' : 'destructive'}>
              {capabilities.browserType}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {canContinue
              ? 'Your browser supports voice input. You can enable Live Discovery.'
              : 'Your browser or system does not support voice input at this time.'}
          </CardDescription>
        </CardHeader>

        {showDetails && (
          <CardContent className="space-y-3">
            {/* Capability Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {capabilities.speechApiSupported ? (
                    <CheckCircle size={16} className="text-green-600" weight="fill" />
                  ) : (
                    <XCircle size={16} className="text-red-600" weight="fill" />
                  )}
                  <span className="text-xs">Web Speech API</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.isHttps ? (
                    <CheckCircle size={16} className="text-green-600" weight="fill" />
                  ) : (
                    <WarningCircle size={16} className="text-yellow-600" weight="fill" />
                  )}
                  <span className="text-xs">HTTPS Security</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {capabilities.hasMicrophone ? (
                    <CheckCircle size={16} className="text-green-600" weight="fill" />
                  ) : (
                    <MicrophoneSlash size={16} className="text-red-600" weight="fill" />
                  )}
                  <span className="text-xs">Microphone</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.isOnline ? (
                    <CheckCircle size={16} className="text-green-600" weight="fill" />
                  ) : (
                    <GlobeX size={16} className="text-red-600" weight="fill" />
                  )}
                  <span className="text-xs">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Blocking Errors */}
      {blockingErrors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
            <XCircle size={16} />
            Issues Preventing Voice Input
          </h4>
          {blockingErrors.map((error) => (
            <Alert key={error.issue} variant="destructive" className="border-red-200 bg-red-50">
              <AlertTitle className="text-sm font-semibold">{error.message}</AlertTitle>
              <AlertDescription className="mt-1 text-xs">{error.suggestion}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
            <Warning size={16} />
            Limitations
          </h4>
          {warnings.map((warning) => (
            <Alert key={warning.issue} variant="default" className="border-yellow-200 bg-yellow-50">
              <AlertTitle className="text-sm font-semibold text-yellow-900">{warning.message}</AlertTitle>
              <AlertDescription className="mt-1 text-xs text-yellow-800">
                {warning.suggestion}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Fallback Option */}
      {!canContinue && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTitle className="text-sm font-semibold text-blue-900">Alternative Available</AlertTitle>
          <AlertDescription className="mt-1 text-xs text-blue-800">
            You can still use Standard Discovery mode with manual text input. Text input is fully supported
            and provides the same powerful discovery experience.
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
  )
}

/**
 * Minimal inline capability check for use in Live Discovery Setup
 */
interface BrowserCapabilityBannerProps {
  capabilities: BrowserCapabilities | null
  isLoading?: boolean
}

export function BrowserCapabilityBanner({ capabilities, isLoading }: BrowserCapabilityBannerProps) {
  if (isLoading) return null
  if (!capabilities) return null

  const blockingErrors = getAllCapabilityErrors(capabilities).filter((e) => e.isBlocking)

  if (blockingErrors.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-4">
        <CheckCircle size={16} className="text-green-600" weight="fill" />
        <AlertTitle className="text-sm text-green-900">Voice input is enabled</AlertTitle>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <XCircle size={16} />
      <AlertTitle className="text-sm">
        Live Discovery is not available in your browser
      </AlertTitle>
      <AlertDescription className="text-xs mt-1">
        <p className="mb-2">{blockingErrors[0].suggestion}</p>
        <p>You can use Standard Discovery with text input instead.</p>
      </AlertDescription>
    </Alert>
  )
}
