import { useState, useRef, useCallback, useEffect } from 'react'

export enum SpeechRecognitionErrorType {
  NO_MATCH = 'no-match',
  NO_SPEECH = 'no-speech',
  AUDIO_CAPTURE = 'audio-capture',
  NETWORK = 'network',
  PERMISSION_DENIED = 'permission-denied',
  ABORTED = 'aborted',
  SERVICE_NOT_ALLOWED = 'service-not-allowed',
  BAD_GRAMMAR = 'bad-grammar',
  NETWORK_TIMEOUT = 'network-timeout',
  UNKNOWN = 'unknown',
}

interface UseSpeechRecognitionProps {
  onTranscriptUpdate?: (transcript: string) => void
  onComplete?: (transcript: string) => void
  onError?: (error: string, errorType: SpeechRecognitionErrorType) => void
  onWarning?: (warning: string) => void
  language?: string
  timeout?: number // milliseconds before showing "no speech" warning
  showWarnings?: boolean
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
  errorType: SpeechRecognitionErrorType | null
  warning: string | null
  canRequestMicrophone: () => Promise<boolean>
  getErrorMessage: (errorType: SpeechRecognitionErrorType) => string
}

const ERROR_MESSAGES: Record<SpeechRecognitionErrorType, string> = {
  [SpeechRecognitionErrorType.NO_MATCH]: 'No speech was recognized. Please try again.',
  [SpeechRecognitionErrorType.NO_SPEECH]: 'No speech detected. Please make sure your microphone is working and try again.',
  [SpeechRecognitionErrorType.AUDIO_CAPTURE]: 'No microphone was found. Please check your device has a microphone connected.',
  [SpeechRecognitionErrorType.NETWORK]: 'Network error occurred. Please check your internet connection.',
  [SpeechRecognitionErrorType.PERMISSION_DENIED]: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
  [SpeechRecognitionErrorType.ABORTED]: 'Speech recognition was stopped.',
  [SpeechRecognitionErrorType.SERVICE_NOT_ALLOWED]: 'Speech recognition service is not allowed. Please check your browser settings.',
  [SpeechRecognitionErrorType.BAD_GRAMMAR]: 'Grammar configuration error. Please try again.',
  [SpeechRecognitionErrorType.NETWORK_TIMEOUT]: 'Network request timed out. Please try again.',
  [SpeechRecognitionErrorType.UNKNOWN]: 'An unknown error occurred. Please try again.',
}

export function useSpeechRecognition({
  onTranscriptUpdate,
  onComplete,
  onError,
  onWarning,
  language = 'en-US',
  timeout = 10000,
  showWarnings = true,
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<SpeechRecognitionErrorType | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const isSupported = useRef(false)
  const transcriptRef = useRef('')
  const isStartingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastResultTimeRef = useRef<number>(0)
  const isListeningRef = useRef(false)

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    isSupported.current = !!SpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.language = language

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setErrorType(null)
      setWarning(null)
      isStartingRef.current = false
      lastResultTimeRef.current = Date.now()

      // Set timeout for "no speech" warning
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (showWarnings) {
        timeoutRef.current = setTimeout(() => {
          // Use ref instead of state to avoid stale closure
          if (isListeningRef.current) {
            const warningMsg = 'No speech detected. Please speak now or click Stop to provide text manually.'
            setWarning(warningMsg)
            onWarning?.(warningMsg)
          }
        }, timeout)
      }
    }

    recognition.onresult = (event: any) => {
      lastResultTimeRef.current = Date.now()
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          final += transcriptSegment + ' '
        } else {
          interim += transcriptSegment
        }
      }

      if (final) {
        const newTranscript = transcriptRef.current + final
        setTranscript(newTranscript)
        setWarning(null)
        onTranscriptUpdate?.(newTranscript)
      }

      setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const errorCode = event.error as string

      // Map browser error codes to our error types
      let errorTypeToSet: SpeechRecognitionErrorType = SpeechRecognitionErrorType.UNKNOWN
      
      if (errorCode === 'no-speech') {
        errorTypeToSet = SpeechRecognitionErrorType.NO_SPEECH
      } else if (errorCode === 'no-match') {
        errorTypeToSet = SpeechRecognitionErrorType.NO_MATCH
      } else if (errorCode === 'audio-capture') {
        errorTypeToSet = SpeechRecognitionErrorType.AUDIO_CAPTURE
      } else if (errorCode === 'network') {
        errorTypeToSet = SpeechRecognitionErrorType.NETWORK
      } else if (errorCode === 'permission-denied') {
        errorTypeToSet = SpeechRecognitionErrorType.PERMISSION_DENIED
      } else if (errorCode === 'service-not-allowed') {
        errorTypeToSet = SpeechRecognitionErrorType.SERVICE_NOT_ALLOWED
      } else if (errorCode === 'bad-grammar') {
        errorTypeToSet = SpeechRecognitionErrorType.BAD_GRAMMAR
      } else if (errorCode === 'network-timeout') {
        errorTypeToSet = SpeechRecognitionErrorType.NETWORK_TIMEOUT
      } else if (errorCode === 'aborted') {
        return // Silent abort, don't show error
      }

      const errorMessage = ERROR_MESSAGES[errorTypeToSet]
      setError(errorMessage)
      setErrorType(errorTypeToSet)
      setIsListening(false)
      onError?.(errorMessage, errorTypeToSet)
    }

    recognition.onend = () => {
      setIsListening(false)
      isStartingRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      
      const currentTranscript = transcriptRef.current
      if (currentTranscript) {
        onComplete?.(currentTranscript)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onTranscriptUpdate, onComplete, onError, onWarning, language, timeout, showWarnings])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isStartingRef.current) {
      try {
        isStartingRef.current = true
        recognitionRef.current.start()
      } catch (error: any) {
        isStartingRef.current = false
        if (error.name !== 'InvalidStateError') {
          console.error('Failed to start speech recognition:', error)
          const errorMessage = 'Failed to start speech recognition'
          setError(errorMessage)
          setErrorType(SpeechRecognitionErrorType.UNKNOWN)
          onError?.(errorMessage, SpeechRecognitionErrorType.UNKNOWN)
        }
      }
    }
  }, [isListening, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Failed to stop speech recognition:', error)
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setErrorType(null)
    setWarning(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const canRequestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (error) {
      return false
    }
  }, [])

  const getErrorMessage = useCallback((type: SpeechRecognitionErrorType): string => {
    return ERROR_MESSAGES[type]
  }, [])

  return {
    isListening,
    isSupported: isSupported.current,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    errorType,
    warning,
    canRequestMicrophone,
    getErrorMessage,
  }
}
