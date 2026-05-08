import { useState } from 'react'
import { BookOpen, ArrowSquareOut, CaretDown, CaretRight } from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { searchLearn, fetchLearn, type LearnSnippet } from '@/lib/learn-docs-service'

interface LearnMorePopoverProps {
  /** Search query — typically the service name + "Azure". */
  query: string
  /** Optional label for the trigger button (defaults to "Learn"). */
  label?: string
}

/**
 * Compact popover that fetches Microsoft Learn snippets on first open.
 * Fails silently — shows a "no docs" state if the backend can't reach
 * the Learn MCP endpoint. Each snippet can be expanded inline to load
 * the full page via /api/learn-fetch.
 */
export function LearnMorePopover({ query, label = 'Learn' }: LearnMorePopoverProps) {
  const [snippets, setSnippets] = useState<LearnSnippet[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, { loading: boolean; text?: string }>>({})

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

  const toggleExpand = async (url: string) => {
    if (!url) return
    const current = expanded[url]
    if (current?.text) {
      // Collapse if already loaded.
      setExpanded(prev => {
        const next = { ...prev }
        delete next[url]
        return next
      })
      return
    }
    setExpanded(prev => ({ ...prev, [url]: { loading: true } }))
    const doc = await fetchLearn(url)
    setExpanded(prev => ({ ...prev, [url]: { loading: false, text: doc?.text ?? '' } }))
  }

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <BookOpen size={12} className="mr-1" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[28rem] max-h-[28rem] overflow-auto" side="right" align="start">
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
            {snippets.map((s, i) => {
              const exp = s.url ? expanded[s.url] : undefined
              const isOpen = !!exp?.text
              return (
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
                  {s.url && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.url)}
                      className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary/80 hover:text-primary"
                    >
                      {isOpen ? <CaretDown size={10} /> : <CaretRight size={10} />}
                      {exp?.loading ? 'Loading…' : isOpen ? 'Collapse' : 'Read full page'}
                    </button>
                  )}
                  {exp?.loading && (
                    <div className="mt-1 space-y-1">
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-2 w-5/6" />
                    </div>
                  )}
                  {isOpen && exp?.text && (
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-muted/40 p-2 text-[10.5px] leading-snug text-muted-foreground">{exp.text}</pre>
                  )}
                  {isOpen && exp && !exp.text && (
                    <div className="mt-1 text-[10px] italic text-muted-foreground">Page content unavailable.</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
