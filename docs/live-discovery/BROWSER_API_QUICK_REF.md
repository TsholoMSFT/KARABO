# Live Discovery - Quick Reference Guide

**Author:** Tsholo K. Setati  
**Project:** Microsoft Innovation Hub Enterprise Discovery

## Browser Support at a Glance

```
Chrome 90+        ✅ FULL SUPPORT
├─ Web Speech API: Native
├─ Continuous mode: ✅
├─ Interim results: ✅
└─ Recommended browser

Edge 90+          ✅ FULL SUPPORT
├─ Web Speech API: Chromium-based
├─ Continuous mode: ✅
├─ Interim results: ✅
└─ Recommended browser

Safari 14.1+      ⚠️ PARTIAL SUPPORT
├─ macOS 14.1+: ✅
├─ iOS 14.5+: ✅
├─ Continuous mode: ⚠️ May vary
├─ Interim results: ✅
└─ Supported (with caveats)

Firefox           ❌ NO SUPPORT
├─ Web Speech API: Not implemented
└─ Falls back to Manual/Standard

Opera 76+         ✅ FULL SUPPORT
├─ Chromium-based
└─ Equivalent to Chrome
```

## Error Detection Flow

```
Start Live Discovery
│
├─ isSupported check
│  ├─ YES → Proceed to voice input
│  └─ NO → Show "Not Supported" message
│         ├─ "Try Chrome, Edge, or Safari"
│         └─ Buttons: Cancel, Go Back
│
├─ Request microphone permission
│  ├─ ALLOW → Enable microphone input
│  ├─ DENY → ⚠️ MISSING ERROR HANDLING
│  │         (Falls through to generic error)
│  └─ NO DEVICE → ⚠️ MISSING ERROR HANDLING
│                  (Falls through to generic error)
│
├─ Start speech recognition
│  ├─ SUCCESS → Show "Recording..." UI
│  ├─ NETWORK ERROR → Generic "Speech recognition error"
│  ├─ SERVICE UNAVAILABLE → Generic "Speech recognition error"
│  └─ INVALID STATE → Silently ignored
│
├─ Listen for speech
│  ├─ Speech detected
│  │  ├─ INTERIM RESULTS → Show in real-time
│  │  └─ FINAL RESULTS → Add to transcript
│  │
│  ├─ No speech (timeout) → ⚠️ Silently ignored
│  │                        (Should show UI feedback)
│  │
│  ├─ Network error → Generic error message
│  ├─ Service error → Generic error message
│  ├─ Audio capture → ⚠️ MISSING specific handling
│  └─ Permission denied → ⚠️ MISSING specific handling
│
└─ User controls
   ├─ Stop → Save transcript, move to next
   ├─ Edit manually → Switch to text input
   ├─ Get AI insight → Call LLM, show result
   ├─ Generate follow-ups → Call LLM, show result
   └─ Switch to Standard → Switch modes, preserve data
```

## Known Issues Summary

### Critical Issues (Missing Error Handling)
```
1. MICROPHONE PERMISSION DENIED
   Current behavior: Generic "speech recognition error: permission-denied"
   Expected: "Microphone access denied. Allow in browser settings."
   Impact: User confused about what went wrong

2. NO MICROPHONE HARDWARE
   Current behavior: Generic error (if error at all)
   Expected: "No microphone detected on this device"
   Impact: User tries to continue anyway

3. HTTPS REQUIREMENT NOT DOCUMENTED
   Current behavior: Silent failure on HTTP
   Expected: Warning message before attempting Live Discovery
   Impact: Production deployment issues, unexpected failures

4. NETWORK SERVICE UNAVAILABLE
   Current behavior: Generic error
   Expected: "Speech recognition service unavailable. Try again?"
   Impact: Unclear if it's user's network or service issue
```

### Design Issues
```
5. SAFARI CONTINUOUS MODE QUIRKS
   Current: Same UI for all browsers
   Better: Adjust expectations for Safari
   
6. FIREFOX NOT DETECTED EARLY
   Current: Error shown during attempt
   Better: Detect in setup phase, show warning

7. MOBILE SAFARI LIMITATIONS
   Current: Same UI as desktop
   Better: Adaptive UI for iOS constraints

8. NO TIMEOUT FEEDBACK
   Current: 'no-speech' silently ignored
   Better: Show "No speech detected" message after timeout
```

## API Capabilities Used

```
┌─────────────────────────────────────────┐
│    Web Speech API (SpeechRecognition)    │
├─────────────────────────────────────────┤
│ ✅ continuous: true                     │
│    → Keeps listening until stopped       │
│                                          │
│ ✅ interimResults: true                 │
│    → Shows partial results as typing     │
│                                          │
│ ✅ language: 'en-US'                    │
│    → Hardcoded, not user-selectable     │
│                                          │
│ ✅ onresult event                       │
│    → Fires for interim & final results   │
│                                          │
│ ✅ onerror event                        │
│    → Handles errors (with gaps)          │
│                                          │
│ ❌ Confidence scores (not exposed)      │
│ ❌ Audio streaming (not available)      │
│ ❌ Frequency data (not available)       │
└─────────────────────────────────────────┘
```

## Fallback Chain

```
                        ┌─────────────────────┐
                        │ Live Discovery Mode │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
          ┌──────────────────┐        ┌─────────────────────┐
          │ Web Speech API   │        │ Manual Text Input   │
          │ ✅ Works         │        │ ✅ Works            │
          └────────┬─────────┘        │ (Edit button)       │
                   │                  └─────────────────────┘
      ┌────────────┴────────────┐
      ▼                         ▼
  ┌────────┐          ┌────────────────────┐
  │Browser │          │ Switch to Standard  │
  │Support │          │ Discovery (Manual)  │
  │Check   │          │ ✅ Works            │
  └────────┘          └────────────────────┘
     │
  ┌──┴──┐
  YES   NO
  │     │
  ▼     ▼
 🎤   📝 (Manual only)
```

## Permission & Requirement Checklist

```
Before Live Discovery Works, Need:
├─ ✅ Browser support check (implemented)
├─ ⚠️ HTTPS or localhost (NOT checked)
├─ ❌ Microphone available (NOT checked)
├─ ❌ Microphone permission granted (error if denied, not specific)
└─ ❌ Network connectivity (NOT checked)

Runtime Requirements:
├─ ✅ Continuous Web Speech API
├─ ✅ Microphone device
├─ ✅ Network connection to Google's servers
└─ ✅ Browser doesn't mute recognizer
```

## Error Messages Matrix

```
Error Type                 | Current Message              | Status | Suggested Message
---------------------------|------------------------------|--------|------------------------------------------
Browser unsupported        | "doesn't support Web Speech" | ✅ OK  | (Good)
Permission denied          | "permission-denied"          | ❌ Bad | "Microphone access denied. Check settings"
No microphone              | (Generic or none)            | ❌ Bad | "No microphone detected"
Network error              | "network-error"              | ❌ Bad | "Connection lost. Check network?"
Service unavailable        | "service-not-available"      | ❌ Bad | "Speech service unavailable. Retry?"
Audio capture fail         | "audio-capture"              | ❌ Bad | "Failed to access microphone"
No speech detected         | (Silently ignored)           | ❌ Bad | "No speech detected. Please speak..."
Speech timeout             | (Silently ignored)           | ❌ Bad | "Timeout - please try again"
Invalid state              | (Silently ignored)           | ✅ OK  | (OK - expected)
Aborted                    | (Silently ignored)           | ✅ OK  | (OK - user initiated)
```

## Testing Priorities

```
🔴 CRITICAL (Test Immediately)
├─ Firefox shows "not supported" message
├─ Chrome/Edge work in Live mode
├─ Safari works (if version 14.1+)
├─ Manual text input works as fallback
└─ Switch to Standard mode works

🟡 HIGH (Test Before Production)
├─ Microphone permission denial handling
├─ HTTP vs HTTPS requirement
├─ Network failure handling
├─ Timeout feedback to user
└─ No microphone error handling

🟢 MEDIUM (Test Before Release)
├─ Safari continuous mode behavior
├─ iOS Safari limitations
├─ Very long transcripts
├─ Rapid mode switching
└─ AI feature fallbacks
```

## Code Quality Issues Found

```
✅ Good:
  ├─ Browser support detection implemented
  ├─ Multiple error handlers in place
  ├─ Graceful mode switching fallback
  ├─ Try-catch error wrapping
  ├─ State management is clean
  └─ UI feedback for recording state

❌ Missing:
  ├─ Specific error messages for permission denial
  ├─ Microphone availability detection
  ├─ HTTPS requirement detection
  ├─ Timeout feedback UI
  ├─ Network error recovery logic
  ├─ Language selection UI
  ├─ Browser detection in setup phase
  └─ Error logging for debugging
```

## API Compatibility Details

### Web Speech API Support
```
Stable APIs (fully implemented):
  ✅ SpeechRecognition interface
  ✅ start() / stop() methods
  ✅ abort() method
  ✅ continuous mode
  ✅ interimResults mode
  ✅ language property

Non-standard features (may vary):
  ⚠️ maxAlternatives (not used here)
  ⚠️ Individual word confidence (not exposed)
  ⚠️ Acoustic model selection (not available)
```

### Microphone Access Requirements
```
Modern Security Model:
  ├─ HTTPS required (except localhost/127.0.0.1)
  ├─ User permission required
  ├─ Permission persists per site
  ├─ User can revoke in settings
  ├─ No silent failure (permission required)
  └─ Browser shows clear permission prompt

Key Implementation Detail:
  Web Speech API uses same permission as:
    ├─ WebRTC audio/video calls
    ├─ MediaRecorder API
    └─ getUserMedia() API
```

---

## References

- W3C Web Speech API Specification: https://wicg.github.io/speech-api/
- MDN Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Can I Use - Speech Recognition: https://caniuse.com/speech-recognition
- HTTPS Requirement: https://www.chromium.org/Home/chromium-security/prefer-https/

