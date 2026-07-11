/**
 * Relationships tab (Focus 2) — decision-maker mapping with a power/interest
 * influence matrix, relationship health from contact cadence, persona tagging,
 * and an interaction log.
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash, UsersThree } from '@phosphor-icons/react'
import {
  createRelationship,
  createInteraction,
  relationshipHealth,
  deriveLastContact,
  influenceQuadrant,
  type InfluenceQuadrant,
} from '@/lib/relationship-engine'
import type {
  StakeholderRelationship, Interaction, BuyerPersona,
  RelationshipHealthBand, InteractionType,
} from '@/lib/fy27-types'
import { RELATIONSHIP_HEALTH_LABELS, INTERACTION_TYPE_LABELS } from '@/lib/fy27-types'
import type { StakeholderType, StakeholderDisposition } from '@/lib/types'

const STAKEHOLDER_TYPES: StakeholderType[] = ['economic-buyer', 'technical-evaluator', 'user-buyer', 'influencer', 'blocker']
const DISPOSITIONS: StakeholderDisposition[] = ['champion', 'supportive', 'neutral', 'skeptical', 'opposed', 'unknown']

const HEALTH_BADGE: Record<RelationshipHealthBand, string> = {
  strong: 'bg-green-100 text-green-800 border-green-200',
  stable: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'at-risk': 'bg-amber-100 text-amber-800 border-amber-200',
  stale: 'bg-red-100 text-red-800 border-red-200',
  none: 'bg-slate-100 text-slate-700 border-slate-200',
}

const QUADRANT_ORDER: { q: InfluenceQuadrant; title: string }[] = [
  { q: 'keep-satisfied', title: 'Keep satisfied · high power / low interest' },
  { q: 'manage-closely', title: 'Manage closely · high power / high interest' },
  { q: 'monitor', title: 'Monitor · low power / low interest' },
  { q: 'keep-informed', title: 'Keep informed · low power / high interest' },
]

export interface RelationshipsTabProps {
  accountId: string
  customerId?: string
  relationships: StakeholderRelationship[]
  interactions: Interaction[]
  personas: BuyerPersona[]
  onUpsertRelationship: (r: StakeholderRelationship) => void
  onRemoveRelationship: (id: string) => void
  onAddInteraction: (i: Interaction) => void
}

export function RelationshipsTab(props: RelationshipsTabProps) {
  const {
    accountId, customerId, relationships, interactions, personas,
    onUpsertRelationship, onRemoveRelationship, onAddInteraction,
  } = props

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [type, setType] = useState<StakeholderType>('economic-buyer')
  const [disposition, setDisposition] = useState<StakeholderDisposition>('neutral')
  const [influence, setInfluence] = useState(7)
  const [interest, setInterest] = useState(6)
  const [owner, setOwner] = useState('')

  // Interaction log form
  const [logRelId, setLogRelId] = useState('')
  const [logType, setLogType] = useState<InteractionType>('meeting')
  const [logSummary, setLogSummary] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onUpsertRelationship(
      createRelationship({
        accountId, customerId, name: name.trim(), role: role.trim() || 'Stakeholder',
        stakeholderType: type, disposition, influence, interest, relationshipOwner: owner.trim() || undefined,
      }),
    )
    setName(''); setRole(''); setOwner('')
  }

  const handleLog = () => {
    const rel = relationships.find((r) => r.id === logRelId)
    if (!rel || !logSummary.trim()) return
    onAddInteraction(
      createInteraction({
        accountId, customerId, stakeholderId: rel.id, stakeholderName: rel.name,
        type: logType, summary: logSummary.trim(),
      }),
    )
    setLogSummary('')
  }

  const buckets: Record<InfluenceQuadrant, StakeholderRelationship[]> = {
    'manage-closely': [], 'keep-satisfied': [], 'keep-informed': [], monitor: [],
  }
  for (const r of relationships) buckets[influenceQuadrant(r.influence, r.interest)].push(r)

  return (
    <div className="space-y-5">
      {/* Add relationship */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-12 items-end">
            <div className="md:col-span-3">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Decision maker" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Role / title</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="CFO" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as StakeholderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAKEHOLDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Disposition</Label>
              <Select value={disposition} onValueChange={(v) => setDisposition(v as StakeholderDisposition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISPOSITIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs">Power</Label>
              <Input type="number" min={1} max={10} value={influence} onChange={(e) => setInfluence(Number(e.target.value))} />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs">Interest</Label>
              <Input type="number" min={1} max={10} value={interest} onChange={(e) => setInterest(Number(e.target.value))} />
            </div>
            <div className="md:col-span-1">
              <Button size="sm" className="w-full" onClick={handleAdd} disabled={!name.trim()}><Plus /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Influence matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><UsersThree /> Influence matrix (power × interest)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {QUADRANT_ORDER.map(({ q, title }) => (
              <div key={q} className="rounded-md border bg-muted/30 p-2 min-h-[84px]">
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5">{title}</div>
                <div className="flex flex-wrap gap-1">
                  {buckets[q].length === 0
                    ? <span className="text-[11px] text-muted-foreground italic">—</span>
                    : buckets[q].map((r) => <Badge key={r.id} variant="secondary" className="text-[10px]">{r.name}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relationship list */}
      <div className="space-y-2">
        {relationships.map((r) => {
          const lastContact = r.lastContact ?? deriveLastContact(r, interactions)
          const band = relationshipHealth(lastContact, r.disposition)
          return (
            <Card key={r.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.role}</span>
                      <Badge variant="secondary" className="text-[10px]">{r.stakeholderType}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${HEALTH_BADGE[band]}`}>{RELATIONSHIP_HEALTH_LABELS[band]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.relationshipOwner ? `Owner: ${r.relationshipOwner}` : 'No relationship owner'}
                      {lastContact ? ` · Last contact ${new Date(lastContact).toLocaleDateString()}` : ' · No contact logged'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={r.personaId ?? 'none'} onValueChange={(v) => onUpsertRelationship({ ...r, personaId: v === 'none' ? undefined : v, updatedAt: Date.now() })}>
                      <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Persona" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No persona</SelectItem>
                        {personas.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemoveRelationship(r.id)}><Trash /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {relationships.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-6 text-center border border-dashed rounded-md">
            No decision makers mapped yet.
          </p>
        )}
      </div>

      {/* Log interaction */}
      {relationships.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Log an interaction</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-12 items-end">
              <div className="md:col-span-3">
                <Label className="text-xs">Stakeholder</Label>
                <Select value={logRelId} onValueChange={setLogRelId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {relationships.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Type</Label>
                <Select value={logType} onValueChange={(v) => setLogType(v as InteractionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map((t) => (
                      <SelectItem key={t} value={t}>{INTERACTION_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6">
                <Label className="text-xs">Summary</Label>
                <Input value={logSummary} onChange={(e) => setLogSummary(e.target.value)} placeholder="What was discussed / agreed?" />
              </div>
              <div className="md:col-span-1">
                <Button size="sm" className="w-full" onClick={handleLog} disabled={!logRelId || !logSummary.trim()}><Plus /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
