import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition-enhanced'
import { Microphone, MicrophoneSlash, Waveform } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceInputFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
  disabled?: boolean
  className?: string
}

export function VoiceInputField({
  value,
  onChange,
  placeholder = 'Type or speak your response...',
  label,
  rows = 3,
  disabled = false,
  className,
}: VoiceInputFieldProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeechRecognition({
    onTranscriptUpdate: (fullTranscript) => {
      if (fullTranscript) {
        // Append to existing value
        const currentValue = value.trim()
        if (currentValue) {
          onChange(`${currentValue} ${fullTranscript}`)
        } else {
          onChange(fullTranscript)
        }
      }
    },
  })

  // Update value when transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      const currentValue = value.trim()
      if (!currentValue.includes(transcript.trim())) {
        if (currentValue) {
          onChange(`${currentValue} ${transcript.trim()}`)
        } else {
          onChange(transcript.trim())
        }
      }
    }
  }, [transcript, isListening])

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening()
      setIsVoiceMode(false)
    } else {
      resetTranscript()
      startListening()
      setIsVoiceMode(true)
    }
  }

  if (!isSupported) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}</label>
            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
              <MicrophoneSlash size={12} />
              Voice not supported
            </Badge>
          </div>
        )}
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Voice input is not supported in this browser. Please use Chrome or Edge for voice features.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <Badge variant="outline" className="text-xs gap-1">
            <Microphone size={12} weight="fill" />
            Voice enabled
          </Badge>
        </div>
      )}
      
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || isListening}
          className={cn(
            'pr-24 transition-all',
            isListening && 'border-[#0078D4] ring-2 ring-[#0078D4]/20'
          )}
        />

        {/* Voice controls */}
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <Waveform size={16} weight="fill" className="text-[#0078D4] animate-pulse" />
                <span className="text-xs text-[#0078D4] font-medium">Listening...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="button"
            size="sm"
            variant={isListening ? 'destructive' : 'outline'}
            onClick={handleToggleVoice}
            disabled={disabled}
            className={cn(
              'h-8 w-8 p-0',
              !isListening && 'border-[#0078D4] text-[#0078D4] hover:bg-[#0078D4]/10'
            )}
          >
            {isListening ? (
              <MicrophoneSlash size={16} weight="fill" />
            ) : (
              <Microphone size={16} weight="fill" />
            )}
          </Button>
        </div>

        {/* Interim transcript preview */}
        <AnimatePresence>
          {isListening && interimTranscript && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute bottom-0 left-0 right-0 p-2 bg-[#0078D4]/5 border-t border-[#0078D4]/20 rounded-b text-sm text-muted-foreground italic"
            >
              {interimTranscript}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
