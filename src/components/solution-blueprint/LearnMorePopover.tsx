/**
 * Lazy "Learn more" popover for blueprint component cards.
 * Calls /api/learn-search via the existing learn-docs-service shim and
 * renders the top snippets. Failures fall back silently to an offline
 * notice so the blueprint flow never hard-fails on Learn outages.
 */
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ArrowSquareOut, BookOpen, CaretDown, CaretRight, Spinner } from '@phosphor-icons/react'
import { fetchLearn, searchLearn, type LearnSnippet } from '@/lib/learn-docs-service'

interface Props {
  /** Free-text query — usually the service name or capability label. */
  query: string
  /** Top N snippets to fetch. */
  top?: number
}

// In-memory cache so re-opening the popover for the same query is instant.
const cache = new Map<string, LearnSnippet[]>()
const pageCache = new Map<string, string>()

export function LearnMorePopover({ query, top = 3 }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snippets, setSnippets] = useState<LearnSnippet[] | null>(cache.get(query) ?? null)
  const [errored, setErrored] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, { loading: boolean; text?: string }>>({})

  useEffect(() => {
    if (!open || snippets || loading) return
    setLoading(true)
    setErrored(false)
    searchLearn(query, top)
      .then((res) => {
        cache.set(query, res)
        setSnippets(res)
        if (res.length === 0) setErrored(true)
      })
      .catch(() => setErrored(true))
      .finally(() => setLoading(false))
  }, [open, query, top, snippets, loading])

  const toggleExpand = async (url: string) => {
    if (!url) return
    const current = expanded[url]
    if (current?.text) {
      setExpanded(prev => {
        const next = { ...prev }
        delete next[url]
        return next
      })
      return
    }
    const cached = pageCache.get(url)
    if (cached) {
      setExpanded(prev => ({ ...prev, [url]: { loading: false, text: cached } }))
      return
    }
    setExpanded(prev => ({ ...prev, [url]: { loading: true } }))
    const doc = await fetchLearn(url)
    const text = doc?.text ?? ''
    if (text) pageCache.set(url, text)
    setExpanded(prev => ({ ...prev, [url]: { loading: false, text } }))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`Learn more about ${query}`}
          onClick={(e) => e.stopPropagation()}
        >
          <BookOpen size={12} weight="duotone" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-96 p-3 text-xs">
        <div className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <BookOpen size={14} weight="duotone" />
          Microsoft Learn — {query}
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-muted-foreground py-3">
            <Spinner size={12} className="animate-spin" /> Fetching…
          </div>
        )}
        {!loading && errored && (
          <div className="text-muted-foreground py-2">
            Learn enrichment unavailable. Showing static catalog only.
          </div>
        )}
        {!loading && snippets && snippets.length > 0 && (
          <ul className="space-y-2.5">
            {snippets.map((s, i) => {
              const exp = s.url ? expanded[s.url] : undefined
              const isOpen = !!exp?.text
              return (
                <li key={`${s.url}-${i}`} className="border-b last:border-0 pb-2 last:pb-0">
                  <a
                    href={s.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {s.title}
                    <ArrowSquareOut size={10} />
                  </a>
                  {s.excerpt && (
                    <div className="text-muted-foreground mt-0.5 line-clamp-3">{s.excerpt}</div>
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
