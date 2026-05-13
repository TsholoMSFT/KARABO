import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ARCHITECTURE_PATTERNS, PATTERN_CATEGORY_LABELS } from '@/lib/architecture-patterns'
import { recommendPatterns } from '@/lib/decision-engine'
import { PatternCard } from './PatternCard'
import type { DecisionContext, AIFitCategory, PatternCategory } from '@/lib/duce-types'

interface PatternLibraryProps {
  selectedIds: string[]
  onToggle: (id: string) => void
  context: DecisionContext
  recommendForFit?: AIFitCategory
}

export function PatternLibrary({ selectedIds, onToggle, context, recommendForFit }: PatternLibraryProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<PatternCategory | 'all'>('all')

  const recommendations = useMemo(() => recommendPatterns(context, undefined, recommendForFit, 5), [
    context,
    recommendForFit,
  ])
  const recById = useMemo(() => new Map(recommendations.map((r) => [r.pattern.id, r])), [recommendations])

  const filtered = useMemo(() => {
    const lower = search.toLowerCase().trim()
    return ARCHITECTURE_PATTERNS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (!lower) return true
      return (
        p.name.toLowerCase().includes(lower) ||
        p.summary.toLowerCase().includes(lower) ||
        p.components.some((c) => c.toLowerCase().includes(lower))
      )
    })
  }, [search, category])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Architecture Pattern Library</CardTitle>
            <CardDescription>
              Curated reference patterns. Recommendations adapt to engagement context (industry, residency, AI fit).
            </CardDescription>
          </div>
          <Badge variant="outline">{selectedIds.length} selected</Badge>
        </div>
        <div className="flex flex-col md:flex-row gap-2 pt-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patterns…" />
          <Select value={category} onValueChange={(v) => setCategory(v as PatternCategory | 'all')}>
            <SelectTrigger className="md:w-56">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(PATTERN_CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recommended">
          <TabsList>
            <TabsTrigger value="recommended">Recommended ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="all">All Patterns ({filtered.length})</TabsTrigger>
            <TabsTrigger value="selected">Selected ({selectedIds.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="recommended" className="space-y-3 mt-3">
            {recommendations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Provide more engagement context (industry, AI fit, residency) to surface recommendations.
              </p>
            )}
            {recommendations.map((rec) => (
              <PatternCard
                key={rec.pattern.id}
                pattern={rec.pattern}
                selected={selectedIds.includes(rec.pattern.id)}
                onToggle={onToggle}
                recommendation={rec}
              />
            ))}
          </TabsContent>
          <TabsContent value="all" className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            {filtered.map((p) => (
              <PatternCard
                key={p.id}
                pattern={p}
                selected={selectedIds.includes(p.id)}
                onToggle={onToggle}
                recommendation={recById.get(p.id)}
                compact
              />
            ))}
          </TabsContent>
          <TabsContent value="selected" className="space-y-3 mt-3">
            {selectedIds.length === 0 && <p className="text-sm text-muted-foreground">No patterns selected yet.</p>}
            {selectedIds.map((id) => {
              const p = ARCHITECTURE_PATTERNS.find((x) => x.id === id)
              return p ? <PatternCard key={id} pattern={p} selected onToggle={onToggle} /> : null
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
