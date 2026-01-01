import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Pause, Stop, FloppyDisk, Microphone, DotsThreeVertical, Download, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SessionControlBarProps {
  sessionId: string
  clientName: string
  currentStage: number
  isLiveMode: boolean
  onToggleLiveMode: () => void
  onPauseSession: () => void
  onEndSession: () => void
  onExportPDF: () => void
  lastSaved?: number
}

export function SessionControlBar({
  sessionId,
  clientName,
  currentStage,
  isLiveMode,
  onToggleLiveMode,
  onPauseSession,
  onEndSession,
  onExportPDF,
  lastSaved,
}: SessionControlBarProps) {
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)

  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved'
    const diff = Date.now() - lastSaved
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return new Date(lastSaved).toLocaleTimeString()
  }

  const handleEndConfirm = () => {
    setShowEndDialog(false)
    onEndSession()
  }

  const handlePauseConfirm = () => {
    setShowPauseDialog(false)
    onPauseSession()
    toast.success('Session paused', {
      description: 'Your progress has been saved. You can resume anytime.',
    })
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Live Mode Toggle */}
        <Button
          variant={isLiveMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleLiveMode}
          className={isLiveMode 
            ? 'bg-[#0078D4] hover:bg-[#106EBE] text-white gap-2' 
            : 'border-[#0078D4] text-[#0078D4] hover:bg-[#0078D4]/10 gap-2'
          }
        >
          <Microphone size={16} weight={isLiveMode ? 'fill' : 'regular'} />
          {isLiveMode ? 'Live Mode On' : 'Enable Voice'}
        </Button>

        {/* Last Saved Indicator */}
        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
          <FloppyDisk size={12} />
          {formatLastSaved()}
        </Badge>

        {/* Session Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPauseDialog(true)}
            className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            <Pause size={16} weight="fill" />
            Pause
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEndDialog(true)}
            className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
          >
            <Stop size={16} weight="fill" />
            End Discovery
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsThreeVertical size={18} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportPDF} className="gap-2">
                <Download size={16} />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-muted-foreground">
                <Clock size={16} />
                Stage {currentStage}/8
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">End Discovery Session?</DialogTitle>
            <DialogDescription>
              This will conclude the discovery session for <strong>{clientName || 'this client'}</strong>. 
              A PDF report will be generated with all captured information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Session Summary:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Current progress: Stage {currentStage} of 8</li>
                <li>• Session ID: {sessionId}</li>
                <li>• All data will be preserved and exported</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEndConfirm}
              className="gap-2"
            >
              <Stop size={16} weight="fill" />
              End & Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Session Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600">Pause Discovery Session?</DialogTitle>
            <DialogDescription>
              Your progress will be saved and you can resume this session later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-amber-800">What happens when you pause:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• All data is saved to your browser</li>
                <li>• You can close this tab safely</li>
                <li>• Resume from the main menu anytime</li>
                <li>• No data will be lost</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Continue Session
            </Button>
            <Button 
              onClick={handlePauseConfirm}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Pause size={16} weight="fill" />
              Pause & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
