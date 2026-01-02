# Live Discovery - Browser API Improvements Roadmap

## Overview
This document outlines specific code improvements to enhance browser API compatibility, error handling, and fallback mechanisms for the Live Discovery feature.

---

## Priority 1: Critical Fixes (Implement First)

### 1.1 Add Specific Permission Denied Handling

**File**: [src/hooks/use-speech-recognition.ts](src/hooks/use-speech-recognition.ts)

**Current Code**:
```typescript
recognition.onerror = (event: any) => {
  if (event.error === 'aborted') {
    return
  }
  if (event.error === 'no-speech') {
    return
  }
  const errorMessage = `Speech recognition error: ${event.error}`
  setError(errorMessage)
  setIsListening(false)
  onError?.(errorMessage)
}
```

**Improved Code**:
```typescript
recognition.onerror = (event: any) => {
  if (event.error === 'aborted') {
    return
  }
  if (event.error === 'no-speech') {
    return
  }
  
  // Map specific errors to user-friendly messages
  let errorMessage = `Speech recognition error: ${event.error}`
  
  switch (event.error) {
    case 'permission-denied':
      errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and try again.'
      break
    case 'audio-capture':
      errorMessage = 'No microphone detected. Please check that your microphone is connected and try again.'
      break
    case 'network-error':
      errorMessage = 'Network connection error. Please check your internet connection and try again.'
      break
    case 'service-not-available':
      errorMessage = 'Speech recognition service is unavailable. Please try again later.'
      break
    case 'speech-timeout':
      errorMessage = 'No speech detected for too long. Please try speaking again.'
      break
    case 'bad-grammar':
      errorMessage = 'Could not understand speech. Please try again.'
      break
  }
  
  setError(errorMessage)
  setIsListening(false)
  onError?.(errorMessage)
}
```

**Impact**: Users get clear, actionable error messages instead of cryptic error codes.

---

### 1.2 Add HTTPS Requirement Detection

**File**: [src/components/LiveDiscoverySetup.tsx](src/components/LiveDiscoverySetup.tsx) OR [src/components/LiveDiscoveryMode.tsx](src/components/LiveDiscoveryMode.tsx)

**Add New Function**:
```typescript
function isSecureConnection(): boolean {
  // HTTPS, localhost, and 127.0.0.1 are secure
  const isHttps = window.location.protocol === 'https:'
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
  return isHttps || isLocalhost
}
```

**Usage in LiveDiscoveryMode**:
```typescript
const [securityWarning, setSecurityWarning] = useState<string | null>(null)

useEffect(() => {
  if (!isSecureConnection() && isSupported) {
    setSecurityWarning(
      'Warning: Live Discovery requires HTTPS for microphone access. ' +
      'Your browser may not allow microphone access on HTTP connections.'
    )
  }
}, [isSupported])

// In render, add warning alert if securityWarning is set
{securityWarning && (
  <Alert className="bg-yellow-50 border-yellow-200 mb-4">
    <AlertTriangleIcon className="text-yellow-600" />
    <AlertDescription className="text-yellow-800">
      {securityWarning}
    </AlertDescription>
  </Alert>
)}
```

**Impact**: Prevents silent failures on HTTP connections.

---

### 1.3 Add Microphone Availability Detection

**File**: [src/hooks/use-speech-recognition.ts](src/hooks/use-speech-recognition.ts)

**Add New Check**:
```typescript
async function checkMicrophoneAvailable(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === 'audioinput')
  } catch (error) {
    console.error('Failed to check microphone availability:', error)
    // If we can't enumerate, assume it's available
    return true
  }
}
```

**Usage**:
```typescript
const [microphoneAvailable, setMicrophoneAvailable] = useState(true)

useEffect(() => {
  if (isSupported && navigator.mediaDevices) {
    checkMicrophoneAvailable().then(setMicrophoneAvailable)
  }
}, [isSupported])

return {
  isListening,
  isSupported: isSupported.current && microphoneAvailable,
  transcript,
  interimTranscript,
  startListening,
  stopListening,
  resetTranscript,
  error,
  microphoneAvailable, // New return value
}
```

**Impact**: Detects missing hardware before attempting to use it.

---

### 1.4 Add Timeout Feedback UI

**File**: [src/components/LiveDiscoveryMode.tsx](src/components/LiveDiscoveryMode.tsx)

**Current Code**:
```typescript
<div className="bg-background p-4 rounded border border-border min-h-[100px]">
  <p className="text-foreground whitespace-pre-wrap break-words">
    {displayText}
    {interimTranscript && !useManualInput && (
      <span className="text-muted-foreground italic">
        {interimTranscript}
      </span>
    )}
  </p>
  {!displayText && (
    <p className="text-muted-foreground text-sm italic">
      Start speaking to fill in your answer...
    </p>
  )}
</div>
```

**Improved Code**:
```typescript
const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null)
const [showSilenceWarning, setShowSilenceWarning] = useState(false)

// Add timeout detection
useEffect(() => {
  if (isListening && !interimTranscript && !transcript) {
    const timeout = setTimeout(() => {
      setShowSilenceWarning(true)
    }, 5000) // Show warning after 5 seconds of silence
    
    setSilenceTimeout(timeout)
    return () => {
      clearTimeout(timeout)
      setShowSilenceWarning(false)
    }
  }
}, [isListening, interimTranscript, transcript])

// In render:
<div className="bg-background p-4 rounded border border-border min-h-[100px]">
  <p className="text-foreground whitespace-pre-wrap break-words">
    {displayText}
    {interimTranscript && !useManualInput && (
      <span className="text-muted-foreground italic">
        {interimTranscript}
      </span>
    )}
  </p>
  {!displayText && isListening && showSilenceWarning && (
    <p className="text-amber-600 text-sm">
      ⏱️ No speech detected - Please start speaking...
    </p>
  )}
  {!displayText && !isListening && (
    <p className="text-muted-foreground text-sm italic">
      Start speaking to fill in your answer...
    </p>
  )}
</div>
```

**Impact**: Users get visual feedback when they're not speaking, reducing confusion.

---

## Priority 2: Important Improvements (Implement Second)

### 2.1 Enhance Browser Detection in Setup Phase

**File**: [src/components/LiveDiscoverySetup.tsx](src/components/LiveDiscoverySetup.tsx)

**Add Early Detection**:
```typescript
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

export function LiveDiscoverySetup({ onStart, onCancel }: LiveDiscoverySetupProps) {
  const [sessionName, setSessionName] = useState('')
  const [industry, setIndustry] = useState<Industry>('general')
  const { isSupported } = useSpeechRecognition()

  // Show warning before user enters details
  if (!isSupported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-2 border-amber-200 bg-amber-50 max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Live Discovery Not Available</CardTitle>
            <CardDescription>
              Your browser doesn't support voice-based discovery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Live Discovery requires the Web Speech API, which is available in:
            </p>
            <ul className="text-sm space-y-1 mb-4 list-disc list-inside">
              <li>Chrome 25+</li>
              <li>Edge 79+</li>
              <li>Safari 14.1+</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              You can still use Standard Discovery with manual input.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => window.history.back()} className="flex-1">
              Use Standard Mode
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ... rest of component
}
```

**Impact**: Users know about limitations before entering data.

---

### 2.2 Add Error Recovery UI

**File**: [src/components/LiveDiscoveryMode.tsx](src/components/LiveDiscoveryMode.tsx)

**Add to Component**:
```typescript
const { 
  isListening, 
  isSupported, 
  transcript, 
  interimTranscript, 
  startListening, 
  stopListening, 
  resetTranscript,
  error // Now used for error display
} = useSpeechRecognition({
  onTranscriptUpdate: (fullTranscript) => {
    if (fullTranscript.length > 20) {
      setManualOverride(fullTranscript)
    }
  },
  onError: (errorMsg) => {
    // Could add error tracking here
    console.error('Speech recognition error:', errorMsg)
  }
})

// In render, add error display with recovery options:
{error && (
  <Alert className="bg-red-50 border-red-200 mb-4">
    <AlertTriangleIcon className="text-red-600" />
    <AlertDescription className="text-red-800">
      <p className="font-semibold mb-2">{error}</p>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => {
            resetTranscript()
            startListening()
          }}
          variant="outline"
        >
          Try Again
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setUseManualInput(true)}
        >
          Use Text Input
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

**Impact**: Gives users clear options to recover from errors.

---

### 2.3 Add Language Selection UI

**File**: [src/components/LiveDiscoverySetup.tsx](src/components/LiveDiscoverySetup.tsx)

**Current Code**:
```typescript
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
```

**Improved Code**:
```typescript
const [language, setLanguage] = useState('en-US')

<div className="space-y-4">
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

  <div className="space-y-2">
    <Label htmlFor="language">Language</Label>
    <Select value={language} onValueChange={setLanguage}>
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
        <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

// Pass to session creation:
const handleStart = () => {
  if (!sessionName.trim()) return
  onStart(sessionName, industry, language)
}
```

**Impact**: Supports non-English users.

---

## Priority 3: Design Improvements (Nice to Have)

### 3.1 Add Browser-Specific UI Adaptations

**File**: New utility: [src/lib/browser-detection.ts](src/lib/browser-detection.ts)

```typescript
export interface BrowserInfo {
  name: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Unknown'
  version: string
  isSecure: boolean
  supportsWebSpeech: boolean
  supportsPermissionsAPI: boolean
}

export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent
  
  let name: BrowserInfo['name'] = 'Unknown'
  let version = 'Unknown'
  
  if (ua.includes('Chrome') && !ua.includes('Edge')) {
    name = 'Chrome'
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari'
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Edge')) {
    name = 'Edge'
    version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown'
  }
  
  return {
    name,
    version,
    isSecure: window.location.protocol === 'https:' || 
              window.location.hostname === 'localhost',
    supportsWebSpeech: !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    ),
    supportsPermissionsAPI: !!navigator.permissions,
  }
}

export function shouldShowSafariWarning(browser: BrowserInfo): boolean {
  if (browser.name !== 'Safari') return false
  // Show warning if we can't verify it's 14.1+
  // (Version detection from UA is unreliable for Safari)
  return true
}
```

**Usage in LiveDiscoveryMode**:
```typescript
const browser = detectBrowser()
const showSafariNote = shouldShowSafariWarning(browser)

{showSafariNote && (
  <Alert className="bg-blue-50 border-blue-200 mb-4">
    <InfoIcon className="text-blue-600" />
    <AlertDescription className="text-blue-800">
      Safari users: Live Discovery requires macOS 14.1+ or iOS 14.5+. 
      Older versions should use Standard Discovery mode.
    </AlertDescription>
  </Alert>
)}
```

**Impact**: Provides browser-specific guidance.

---

### 3.2 Add Offline Mode Detection

**File**: [src/hooks/use-speech-recognition.ts](src/hooks/use-speech-recognition.ts)

```typescript
export function useSpeechRecognition({
  onTranscriptUpdate,
  onComplete,
  onError,
  language = 'en-US',
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // ... existing code ...
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setError('You are offline. Speech recognition requires an internet connection.')
      setIsListening(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const startListening = useCallback(() => {
    if (!isOnline) {
      setError('Cannot start: You are offline')
      return
    }
    
    if (recognitionRef.current && !isListening && !isStartingRef.current) {
      try {
        isStartingRef.current = true
        recognitionRef.current.start()
      } catch (error: any) {
        isStartingRef.current = false
        if (error.name !== 'InvalidStateError') {
          console.error('Failed to start speech recognition:', error)
          setError('Failed to start speech recognition')
        }
      }
    }
  }, [isListening, isOnline])
  
  return {
    isListening,
    isSupported: isSupported.current && isOnline,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}
```

**Impact**: Prevents confusing errors when user is offline.

---

## Testing Checklist

After implementing these improvements, test:

```
✓ Microphone permission denied
  └─ Expect: Clear message "Microphone access denied..."
  └─ Verify: "Try Again" button works after allowing permission
  
✓ No microphone hardware
  └─ Expect: Clear message "No microphone detected..."
  └─ Verify: "Use Text Input" button works
  
✓ HTTP vs HTTPS
  └─ Expect: Warning on HTTP
  └─ Verify: Warning not shown on HTTPS/localhost
  
✓ Network disconnect
  └─ Expect: Clear error about network
  └─ Verify: "Try Again" button works after reconnect
  
✓ Timeout (5+ seconds of silence)
  └─ Expect: "No speech detected" message appears
  └─ Verify: User can continue speaking
  
✓ Language selection
  └─ Expect: Available languages in setup
  └─ Verify: Speech recognition uses selected language
  
✓ Firefox browser
  └─ Expect: Warning in setup phase
  └─ Verify: Can use Standard mode instead
  
✓ Safari warning
  └─ Expect: Informational alert in Live mode
  └─ Verify: Doesn't block functionality
  
✓ Recovery from errors
  └─ Expect: "Try Again" and "Use Text Input" buttons
  └─ Verify: Both options work correctly
  
✓ Mobile Safari
  └─ Expect: Works on iOS 14.5+
  └─ Verify: Shows appropriate warnings for older iOS
```

---

## Estimated Implementation Effort

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Specific error messages | 1-2 hrs | High |
| 1 | HTTPS detection | 30 min | High |
| 1 | Microphone availability | 1 hr | High |
| 1 | Timeout feedback | 1 hr | Medium |
| 2 | Browser detection in setup | 1 hr | Medium |
| 2 | Error recovery UI | 1 hr | High |
| 2 | Language selection | 1 hr | Low |
| 3 | Browser-specific UI | 2 hrs | Medium |
| 3 | Offline detection | 1 hr | Low |
| **Total** | | **9-10 hrs** | |

---

## Deployment Notes

1. **Phase 1** (Critical): Implement Priority 1 items before next production release
2. **Phase 2** (Important): Include Priority 2 items in next minor version
3. **Phase 3** (Polish): Include Priority 3 items in future releases
4. **Testing**: Each phase should include the testing checklist above
5. **Documentation**: Update README.md browser compatibility section with improvements

