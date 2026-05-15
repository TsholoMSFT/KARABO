import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Microphone, ArrowsClockwise, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MeetingUploadProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

const MAX_BYTES = 25 * 1024 * 1024
const ACCEPT = 'audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac,.mp4'

export function MeetingUpload({ onTranscript, disabled, className }: MeetingUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [progressLabel, setProgressLabel] = useState('')

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.error(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 25 MB. Trim or compress the recording first.`)
      return
    }
    setBusy(true)
    setProgressLabel(`Transcribing ${file.name}…`)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/transcribe', { method: 'POST', body: form })
      if (!res.ok) {
        let detail = ''
        try {
          const j = await res.json()
          detail = j?.detail || j?.error || ''
        } catch {
          detail = await res.text().catch(() => '')
        }
        throw new Error(`Transcription failed (${res.status}): ${detail}`)
      }
      const data = await res.json() as { text?: string; language?: string; duration?: number }
      const text = (data.text || '').trim()
      if (!text) throw new Error('Transcript was empty')
      onTranscript(text)
      const mins = data.duration ? ` (${Math.round(data.duration / 60)} min)` : ''
      toast.success(`Transcript ready: ${text.length} characters${mins}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transcription failed'
      toast.error(msg)
    } finally {
      setBusy(false)
      setProgressLabel('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Card className={`border-dashed ${className ?? ''}`}>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-md bg-primary/10 shrink-0">
            <Microphone size={20} weight="duotone" className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">Upload meeting recording</div>
            <div className="text-xs text-muted-foreground truncate">
              {busy ? progressLabel : 'mp3, wav, m4a or webm — up to 25 MB. Auto-fills the notes below.'}
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="gap-1.5 shrink-0"
        >
          {busy ? <ArrowsClockwise size={14} className="animate-spin" /> : <Upload size={14} />}
          {busy ? 'Transcribing' : 'Choose file'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          aria-label="Meeting recording file"
          title="Meeting recording file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </CardContent>
    </Card>
  )
}
