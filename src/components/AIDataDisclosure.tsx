/**
 * AIDataDisclosure — shows users exactly what data is sent to AI
 * and which model processes it. Placed before AI trigger points for transparency.
 */

import { useState } from 'react'
import { Info, CaretDown, CaretUp, Robot } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AIDataDisclosureProps {
  /** Human-readable field names that will be sent (e.g. 'industry', 'company name') */
  fields: string[]
  /** Model name shown to user (e.g. 'gpt-4o-mini') */
  model?: string
  /** Optional extra note */
  note?: string
  className?: string
}

export function AIDataDisclosure({ fields, model, note, className }: AIDataDisclosureProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('rounded-md border border-primary/15 bg-primary/[0.03]', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info size={14} weight="fill" className="text-primary/60 flex-shrink-0" />
        <span className="flex-1 text-left">What data is sent to AI?</span>
        {open ? <CaretUp size={12} /> : <CaretDown size={12} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 text-[11px] text-muted-foreground border-t border-primary/10 pt-2">
          <div className="flex items-start gap-2">
            <Robot size={12} className="text-primary/60 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground/80">Fields sent: </span>
              {fields.join(', ')}
            </div>
          </div>
          {model && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-foreground/80 ml-[20px]">Model: </span>
              <span>{model}</span>
            </div>
          )}
          <p className="ml-[20px] italic text-[10px]">
            {note || 'Data is processed in-session and not stored beyond the current request.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AIDataDisclosure
