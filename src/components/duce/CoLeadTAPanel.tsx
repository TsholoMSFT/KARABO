import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash } from '@phosphor-icons/react'
import type { CoLeadDomain, CoLeadInput } from '@/lib/duce-types'
import { CO_LEAD_DOMAIN_LABELS } from '@/lib/duce-types'

interface CoLeadTAPanelProps {
  inputs: CoLeadInput[]
  onChange: (next: CoLeadInput[]) => void
}

const DOMAINS: CoLeadDomain[] = ['apps', 'data', 'ai', 'security', 'infra']

export function CoLeadTAPanel({ inputs, onChange }: CoLeadTAPanelProps) {
  const [activeDomain, setActiveDomain] = useState<CoLeadDomain>('apps')
  const [draft, setDraft] = useState<{ contributor: string; perspective: string; risks: string; recs: string }>({
    contributor: '',
    perspective: '',
    risks: '',
    recs: '',
  })

  const submit = () => {
    if (!draft.perspective.trim()) return
    const entry: CoLeadInput = {
      id: `co-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      domain: activeDomain,
      contributor: draft.contributor || undefined,
      perspective: draft.perspective.trim(),
      risksFlagged: draft.risks ? draft.risks.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      recommendations: draft.recs ? draft.recs.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      updatedAt: Date.now(),
    }
    onChange([entry, ...inputs])
    setDraft({ contributor: '', perspective: '', risks: '', recs: '' })
  }

  const remove = (id: string) => onChange(inputs.filter((i) => i.id !== id))

  const counts: Record<CoLeadDomain, number> = {
    apps: 0, data: 0, ai: 0, security: 0, infra: 0,
  }
  for (const i of inputs) counts[i.domain]++

  const domainItems = inputs.filter((i) => i.domain === activeDomain).sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Co-Lead TA Perspectives</CardTitle>
        <CardDescription>
          Capture multi-domain expert input asynchronously. Reduces dependency on a single bottleneck TA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeDomain} onValueChange={(v) => setActiveDomain(v as CoLeadDomain)}>
          <TabsList className="grid grid-cols-5">
            {DOMAINS.map((d) => (
              <TabsTrigger key={d} value={d} className="text-xs">
                {CO_LEAD_DOMAIN_LABELS[d]}
                {counts[d] > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">{counts[d]}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {DOMAINS.map((d) => (
            <TabsContent key={d} value={d} className="mt-3 space-y-3">
              {d === activeDomain && (
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Contributor name (optional)"
                      value={draft.contributor}
                      onChange={(e) => setDraft({ ...draft, contributor: e.target.value })}
                    />
                    <Select value={activeDomain} onValueChange={(v) => setActiveDomain(v as CoLeadDomain)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOMAINS.map((dd) => (
                          <SelectItem key={dd} value={dd}>{CO_LEAD_DOMAIN_LABELS[dd]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder={`${CO_LEAD_DOMAIN_LABELS[activeDomain]} perspective on the proposed solution…`}
                    value={draft.perspective}
                    onChange={(e) => setDraft({ ...draft, perspective: e.target.value })}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Textarea
                      rows={2}
                      placeholder="Risks (one per line)"
                      value={draft.risks}
                      onChange={(e) => setDraft({ ...draft, risks: e.target.value })}
                    />
                    <Textarea
                      rows={2}
                      placeholder="Recommendations (one per line)"
                      value={draft.recs}
                      onChange={(e) => setDraft({ ...draft, recs: e.target.value })}
                    />
                  </div>
                  <Button size="sm" onClick={submit} disabled={!draft.perspective.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Add perspective
                  </Button>
                </div>
              )}
              {domainItems.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No {CO_LEAD_DOMAIN_LABELS[d]} perspectives yet.</p>
              ) : (
                <ul className="space-y-2">
                  {domainItems.map((i) => (
                    <li key={i.id} className="rounded-lg border bg-card p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {i.contributor ?? 'Anonymous'} · {new Date(i.updatedAt).toLocaleDateString()}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => remove(i.id)}>
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm">{i.perspective}</p>
                      {i.risksFlagged?.length ? (
                        <div className="text-xs">
                          <span className="font-semibold">Risks: </span>
                          <span className="text-muted-foreground">{i.risksFlagged.join(' · ')}</span>
                        </div>
                      ) : null}
                      {i.recommendations?.length ? (
                        <div className="text-xs">
                          <span className="font-semibold">Recommendations: </span>
                          <span className="text-muted-foreground">{i.recommendations.join(' · ')}</span>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
