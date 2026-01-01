/**
 * Browser capability detection and validation utilities
 * Provides comprehensive checks for Live Discovery feature requirements
 */

export enum BrowserCapabilityIssue {
  SPEECH_API_NOT_SUPPORTED = 'SPEECH_API_NOT_SUPPORTED',
  MICROPHONE_NOT_AVAILABLE = 'MICROPHONE_NOT_AVAILABLE',
  MICROPHONE_PERMISSION_DENIED = 'MICROPHONE_PERMISSION_DENIED',
  HTTPS_REQUIRED = 'HTTPS_REQUIRED',
  OFFLINE = 'OFFLINE',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export interface BrowserCapabilities {
  isSupported: boolean
  hasMicrophone: boolean
  isHttps: boolean
  isOnline: boolean
  speechApiSupported: boolean
  browserType: string
  issues: BrowserCapabilityIssue[]
}

export interface CapabilityError {
  issue: BrowserCapabilityIssue
  message: string
  suggestion: string
  severity: 'error' | 'warning'
  isBlocking: boolean
}

/**
 * Detect the browser type
 */
export function detectBrowser(): string {
  const ua = navigator.userAgent
  
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge'
  if (ua.includes('Opera')) return 'Opera'
  
  return 'Unknown'
}

/**
 * Check if Web Speech API is supported
 */
export function isSpeechApiSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

/**
 * Check if running over HTTPS (required for microphone access)
 */
export function isHttpsEnabled(): boolean {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Check if microphone permissions have been granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as any })
    return result.state === 'granted'
  } catch (error) {
    // Fallback if permissions API is not available
    return true // Assume it might be available
  }
}

/**
 * Attempt to get microphone access to verify hardware availability
 */
export async function testMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch (error: any) {
    console.warn('Microphone access test failed:', error)
    return false
  }
}

/**
 * Get comprehensive browser capabilities and identify issues
 */
export async function getBrowserCapabilities(): Promise<BrowserCapabilities> {
  const issues: BrowserCapabilityIssue[] = []
  const browserType = detectBrowser()
  const speechApiSupported = isSpeechApiSupported()
  const isHttps = isHttpsEnabled()
  const online = isOnline()

  let hasMicrophone = false
  if (isHttps) {
    hasMicrophone = await testMicrophoneAccess()
  }

  // Determine issues
  if (!speechApiSupported) {
    issues.push(BrowserCapabilityIssue.SPEECH_API_NOT_SUPPORTED)
  }

  if (!isHttps) {
    issues.push(BrowserCapabilityIssue.HTTPS_REQUIRED)
  }

  if (!hasMicrophone && isHttps) {
    issues.push(BrowserCapabilityIssue.MICROPHONE_NOT_AVAILABLE)
  }

  if (!online) {
    issues.push(BrowserCapabilityIssue.OFFLINE)
  }

  // Check browser-specific support
  if (!isBrowserSupported(browserType, speechApiSupported)) {
    issues.push(BrowserCapabilityIssue.BROWSER_NOT_SUPPORTED)
  }

  return {
    isSupported: issues.length === 0 && speechApiSupported && isHttps && hasMicrophone && online,
    hasMicrophone,
    isHttps,
    isOnline: online,
    speechApiSupported,
    browserType,
    issues,
  }
}

/**
 * Check if the browser has sufficient support for Live Discovery
 */
function isBrowserSupported(browser: string, hasSpeechApi: boolean): boolean {
  const supportedBrowsers: Record<string, boolean> = {
    Chrome: true,
    Edge: true,
    Safari: hasSpeechApi, // Partial support, depends on version
    Firefox: false, // Not supported
    Opera: true,
    Unknown: hasSpeechApi,
  }

  return supportedBrowsers[browser] ?? false
}

/**
 * Get user-friendly error message for a capability issue
 */
export function getCapabilityError(issue: BrowserCapabilityIssue): CapabilityError {
  const errors: Record<BrowserCapabilityIssue, CapabilityError> = {
    [BrowserCapabilityIssue.SPEECH_API_NOT_SUPPORTED]: {
      issue,
      message: 'Web Speech API is not available in your browser',
      suggestion: 'Please use Chrome, Edge, or Safari (14.1+). Firefox does not support voice input.',
      severity: 'error',
      isBlocking: true,
    },
    [BrowserCapabilityIssue.MICROPHONE_NOT_AVAILABLE]: {
      issue,
      message: 'No microphone was detected on your device',
      suggestion: 'Please ensure a microphone is connected and properly configured, then try again.',
      severity: 'error',
      isBlocking: true,
    },
    [BrowserCapabilityIssue.MICROPHONE_PERMISSION_DENIED]: {
      issue,
      message: 'Microphone permission was denied',
      suggestion: 'Please allow microphone access in your browser settings and refresh the page.',
      severity: 'error',
      isBlocking: true,
    },
    [BrowserCapabilityIssue.HTTPS_REQUIRED]: {
      issue,
      message: 'HTTPS is required for microphone access',
      suggestion: 'Please access this application over a secure HTTPS connection.',
      severity: 'error',
      isBlocking: true,
    },
    [BrowserCapabilityIssue.OFFLINE]: {
      issue,
      message: 'You appear to be offline',
      suggestion: 'Please check your internet connection and try again.',
      severity: 'error',
      isBlocking: true,
    },
    [BrowserCapabilityIssue.BROWSER_NOT_SUPPORTED]: {
      issue,
      message: 'Your browser does not fully support voice input',
      suggestion: 'For the best experience, please use Chrome or Edge. Text input will still be available.',
      severity: 'warning',
      isBlocking: false,
    },
    [BrowserCapabilityIssue.UNKNOWN]: {
      issue,
      message: 'An unknown error occurred while checking capabilities',
      suggestion: 'Please try refreshing the page or switching to a different browser.',
      severity: 'error',
      isBlocking: true,
    },
  }

  return errors[issue] || errors[BrowserCapabilityIssue.UNKNOWN]
}

/**
 * Get all error messages for current capability issues
 */
export function getAllCapabilityErrors(capabilities: BrowserCapabilities): CapabilityError[] {
  return capabilities.issues.map((issue) => getCapabilityError(issue))
}

/**
 * Check if Live Discovery mode can be enabled with current capabilities
 */
export function canUseLiveDiscovery(capabilities: BrowserCapabilities): boolean {
  return capabilities.isSupported && capabilities.speechApiSupported && 
         capabilities.isHttps && capabilities.hasMicrophone && capabilities.isOnline
}
