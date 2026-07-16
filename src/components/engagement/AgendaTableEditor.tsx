import type { EngagementAgendaItem } from '@/lib/openai-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react'

interface AgendaTableEditorProps {
  items: EngagementAgendaItem[]
  onChange: (items: EngagementAgendaItem[]) => void
}

export function AgendaTableEditor({ items, onChange }: AgendaTableEditorProps) {
  const update = (index: number, updates: Partial<EngagementAgendaItem>) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="w-32 p-2 font-medium">Time</th>
              <th className="p-2 font-medium">Topic</th>
              <th className="w-44 p-2 font-medium">Owner</th>
              <th className="p-2 font-medium">Details</th>
              <th className="w-28 p-2"><span className="sr-only">Row actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t align-top">
                <td className="p-2">
                  <Input value={item.time ?? ''} onChange={(event) => update(index, { time: event.target.value })} aria-label={`Agenda row ${index + 1} time`} />
                </td>
                <td className="p-2">
                  <Input value={item.topic} onChange={(event) => update(index, { topic: event.target.value })} aria-label={`Agenda row ${index + 1} topic`} />
                </td>
                <td className="p-2">
                  <Input value={item.owner ?? ''} onChange={(event) => update(index, { owner: event.target.value })} aria-label={`Agenda row ${index + 1} owner`} />
                </td>
                <td className="p-2">
                  <Textarea value={item.description ?? ''} onChange={(event) => update(index, { description: event.target.value })} rows={2} aria-label={`Agenda row ${index + 1} details`} />
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move row ${index + 1} up`}>
                      <ArrowUp size={15} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move row ${index + 1} down`}>
                      <ArrowDown size={15} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Delete row ${index + 1}`} className="text-destructive">
                      <Trash size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { time: '', topic: 'New agenda item', owner: '', description: '' }])} className="gap-2">
        <Plus size={15} /> Add agenda row
      </Button>
    </div>
  )
}