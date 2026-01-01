import { useState, useEffect } from 'react'
import { UseCase } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { KPISelector } from '@/components/KPISelector'

interface UseCaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (useCase: Partial<UseCase>) => void
  editingUseCase?: UseCase | null
}

export function UseCaseDialog({ open, onOpenChange, onSave, editingUseCase }: UseCaseDialogProps) {
  const [title, setTitle] = useState(editingUseCase?.title || '')
  const [description, setDescription] = useState(editingUseCase?.description || '')
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>(editingUseCase?.kpis || [])

  useEffect(() => {
    if (editingUseCase) {
      setTitle(editingUseCase.title)
      setDescription(editingUseCase.description)
      setSelectedKPIs(editingUseCase.kpis || [])
    } else {
      setTitle('')
      setDescription('')
      setSelectedKPIs([])
    }
  }, [editingUseCase, open])

  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      ...(editingUseCase || {}),
      title: title.trim(),
      description: description.trim(),
      kpis: selectedKPIs,
    })

    setTitle('')
    setDescription('')
    setSelectedKPIs([])
    onOpenChange(false)
  }

  const handleClose = () => {
    if (!editingUseCase) {
      setTitle('')
      setDescription('')
      setSelectedKPIs([])
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingUseCase ? 'Edit Use Case' : 'Add New Use Case'}</DialogTitle>
          <DialogDescription>
            {editingUseCase
              ? 'Update the details of your use case.'
              : 'Enter the details for a new use case to evaluate.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Real-time collaboration feature"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handleSave()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the use case, its benefits, and context..."
                rows={4}
              />
            </div>
          </div>

          <Separator />

          <KPISelector selectedKPIs={selectedKPIs} onChange={setSelectedKPIs} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {editingUseCase ? 'Save Changes' : 'Add Use Case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
