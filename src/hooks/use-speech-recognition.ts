import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechRecognitionProps {
  onTranscriptUpdate?: (transcript: string) => void
  onComplete?: (transcript: string) => void
  onError?: (error: string) => void
  language?: string
  maxRetries?: number
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
  isStarting: boolean
  retryCount: number
}

export function useSpeechRecognition({
  onTranscriptUpdate,
  onComplete,
  onError,
  language = 'en-US',
  maxRetries = 3,
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isSupported, setIsSupported] = useState(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    return !!SpeechRecognition
  })
  
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const isStartingRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Store callbacks in refs to avoid recreating recognition instance
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onTranscriptUpdateRef.current = onTranscriptUpdate
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onTranscriptUpdate, onComplete, onError])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  // Initialize recognition instance only once per language change
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.language = language

    recognition.onstart = () => {
      console.log('[SpeechRecognition] Started successfully')
      setIsListening(true)
      setIsStarting(false)
      setError(null)
      isStartingRef.current = false
      retryCountRef.current = 0
      setRetryCount(0)
    }

    recognition.onresult = (event: any) => {
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
        onTranscriptUpdateRef.current?.(newTranscript)
      }

      setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      console.warn('[SpeechRecognition] Error:', event.error)
      
      if (event.error === 'aborted') {
        setIsStarting(false)
        isStartingRef.current = false
        return
      }
      
      if (event.error === 'no-speech') {
        return
      }

      if (event.error === 'not-allowed') {
        const errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.'
        setError(errorMessage)
        setIsListening(false)
        setIsStarting(false)
        isStartingRef.current = false
        onErrorRef.current?.(errorMessage)
        return
      }

      if (event.error === 'network') {
        const errorMessage = 'Network error. Please check your internet connection.'
        setError(errorMessage)
        setIsListening(false)
        setIsStarting(false)
        isStartingRef.current = false
        onErrorRef.current?.(errorMessage)
        return
      }

      const errorMessage = `Speech recognition error: ${event.error}`
      setError(errorMessage)
      setIsListening(false)
      setIsStarting(false)
      isStartingRef.current = false
      onErrorRef.current?.(errorMessage)
    }

    recognition.onend = () => {
      console.log('[SpeechRecognition] Ended')
      setIsListening(false)
      setIsStarting(false)
      isStartingRef.current = false
      const currentTranscript = transcriptRef.current
      if (currentTranscript) {
        onCompleteRef.current?.(currentTranscript)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [language])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.warn('[SpeechRecognition] Recognition not initialized')
      setError('Speech recognition not available')
      return
    }

    if (isStartingRef.current) {
      console.log('[SpeechRecognition] Already starting, ignoring duplicate call')
      return
    }

    isStartingRef.current = true
    setIsStarting(true)
    setError(null)

    try {
      console.log('[SpeechRecognition] Attempting to start...')
      recognitionRef.current.start()
    } catch (error: any) {
      console.error('[SpeechRecognition] Start failed:', error)
      
      if (error.name === 'InvalidStateError') {
        console.log('[SpeechRecognition] InvalidStateError - attempting restart')
        try {
          recognitionRef.current.stop()
        } catch (stopError) {
          // Ignore
        }
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          setRetryCount(retryCountRef.current)
          console.log(`[SpeechRecognition] Retry ${retryCountRef.current}/${maxRetries}`)
          
          retryTimeoutRef.current = setTimeout(() => {
            isStartingRef.current = false
            startListening()
          }, 300)
        } else {
          isStartingRef.current = false
          setIsStarting(false)
          setError('Failed to start after multiple attempts. Please try again.')
          onErrorRef.current?.('Failed to start after multiple attempts')
        }
      } else {
        isStartingRef.current = false
        setIsStarting(false)
        setError('Failed to start speech recognition. Please try again.')
        onErrorRef.current?.('Failed to start speech recognition')
      }
    }
  }, [maxRetries])

  const stopListening = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    
    if (recognitionRef.current) {
      try {
        console.log('[SpeechRecognition] Stopping...')
        recognitionRef.current.stop()
      } catch (error) {
        console.error('[SpeechRecognition] Stop failed:', error)
      }
    }
    setIsListening(false)
    setIsStarting(false)
    isStartingRef.current = false
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    transcriptRef.current = ''
    retryCountRef.current = 0
    setRetryCount(0)
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isStarting,
    retryCount,
  }
}
