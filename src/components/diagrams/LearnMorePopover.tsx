import { useState } from 'react'
import { BookOpen, ArrowSquareOut } from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { searchLearn, type LearnSnippet } from '@/lib/learn-docs-service'

interface LearnMorePopoverProps {
  /** Search query — typically the service name + "Azure". */
  query: string
  /** Optional label for the trigger button (defaults to "Learn"). */
  label?: string
}

/**
 * Compact popover that fetches Microsoft Learn snippets on first open.
 * Fails silently — shows a "no docs" state if the backend can't reach
 * the Learn MCP endpoint.
 */
export function LearnMorePopover({ query, label = 'Learn' }: LearnMorePopoverProps) {
  const [snippets, setSnippets] = useState<LearnSnippet[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)

  const handleOpen = async (open: boolean) => {
    if (!open) return
    if (opened) return
    setOpened(true)
    setLoading(true)
    try {
      const results = await searchLearn(query, 4)
      setSnippets(results)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <BookOpen size={12} className="mr-1" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-auto" side="right" align="start">
        <div className="text-xs font-semibold mb-2 text-muted-foreground">
          Microsoft Learn — {query}
        </div>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        )}
        {!loading && snippets && snippets.length === 0 && (
          <div className="text-xs text-muted-foreground italic">
            No Learn results available. The Learn MCP endpoint may be unreachable.
          </div>
        )}
        {!loading && snippets && snippets.length > 0 && (
          <ul className="space-y-3">
            {snippets.map((s, i) => (
              <li key={i} className="text-xs">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {s.title}
                    <ArrowSquareOut size={10} />
                  </a>
                ) : (
                  <span className="font-medium">{s.title}</span>
                )}
                {s.excerpt && (
                  <p className="mt-1 text-muted-foreground leading-snug">{s.excerpt}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
