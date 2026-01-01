import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechRecognitionProps {
  onTranscriptUpdate?: (transcript: string) => void
  onComplete?: (transcript: string) => void
  onError?: (error: string) => void
  language?: string
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
}

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
  
  const recognitionRef = useRef<any>(null)
  const isSupported = useRef(false)
  const transcriptRef = useRef('')
  const isStartingRef = useRef(false)

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

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
      isStartingRef.current = false
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
        onTranscriptUpdate?.(newTranscript)
      }

      setInterimTranscript(interim)
    }

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

    recognition.onend = () => {
      setIsListening(false)
      isStartingRef.current = false
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
    }
  }, [onTranscriptUpdate, onComplete, onError, language])

  const startListening = useCallback(() => {
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
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Failed to stop speech recognition:', error)
      }
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
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
  }
}
