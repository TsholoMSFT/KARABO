/**
 * Blocker board tab (Focus 6) — structured blocker orchestration: ownable,
 * escalatable, trackable items replacing the untyped `Workload.blockers`.
 */
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash, Warning, CheckCircle } from '@phosphor-icons/react'
import {
  createBlocker,
  summarizeBlockers,
  sortBlockersByAttention,
  isBlockerOverdue,
  needsEscalation,
} from '@/lib/blocker-engine'
import type {
  Blocker, BlockerCategory, BlockerPriority, BlockerStatus,
} from '@/lib/fy27-types'
import { BLOCKER_CATEGORY_LABELS, BLOCKER_STATUS_LABELS } from '@/lib/fy27-types'

const PRIORITY_BADGE: Record<BlockerPriority, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
}

export interface BlockerBoardTabProps {
  accountId: string
  customerId?: string
  blockers: Blocker[]
  onUpsert: (b: Blocker) => void
  onSetStatus: (id: string, status: BlockerStatus, notes?: string) => void
  onRemove: (id: string) => void
}

export function BlockerBoardTab({
  accountId, customerId, blockers, onUpsert, onSetStatus, onRemove,
}: BlockerBoardTabProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<BlockerCategory>('technical')
  const [priority, setPriority] = useState<BlockerPriority>('high')
  const [owner, setOwner] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const summary = summarizeBlockers(blockers)
  const sorted = sortBlockersByAttention(blockers)

  const handleAdd = () => {
    if (!title.trim()) return
    onUpsert(
      createBlocker({
        accountId,
        customerId,
        title: title.trim(),
        category,
        priority,
        ownerName: owner.trim() || undefined,
        targetResolutionDate: targetDate ? new Date(targetDate).getTime() : undefined,
      }),
    )
    setTitle(''); setOwner(''); setTargetDate('')
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Open" value={summary.open} />
        <StatCard label="Overdue" value={summary.overdue} tone={summary.overdue ? 'warn' : undefined} />
        <StatCard label="Needs escalation" value={summary.needingEscalation} tone={summary.needingEscalation ? 'bad' : undefined} />
        <StatCard label="Resolved" value={summary.resolved} tone="good" />
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-12 items-end">
            <div className="md:col-span-4">
              <Label className="text-xs">Blocker</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is blocking progress?" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as BlockerCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BLOCKER_CATEGORY_LABELS) as BlockerCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{BLOCKER_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as BlockerPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['critical', 'high', 'medium', 'low'] as BlockerPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Owner</Label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Name" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Target date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!title.trim()}>
              <Plus className="mr-1.5" /> Add blocker
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-8 text-center border border-dashed rounded-md">
            No blockers logged. A clear board is a good sign.
          </p>
        ) : (
          sorted.map((b) => {
            const overdue = isBlockerOverdue(b)
            const escalate = needsEscalation(b)
            return (
              <Card key={b.id} className={escalate ? 'border-red-300' : ''}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{b.title}</span>
                        <Badge variant="outline" className={PRIORITY_BADGE[b.priority]}>{b.priority}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{BLOCKER_CATEGORY_LABELS[b.category]}</Badge>
                        {escalate && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 gap-1">
                            <Warning /> Escalate
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {b.ownerName ? `Owner: ${b.ownerName}` : 'Unassigned'}
                        {b.targetResolutionDate && (
                          <span className={overdue ? 'text-red-600 font-medium' : ''}>
                            {' · '}Due {new Date(b.targetResolutionDate).toLocaleDateString()}
                            {overdue ? ' (overdue)' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select value={b.status} onValueChange={(v) => onSetStatus(b.id, v as BlockerStatus)}>
                        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(BLOCKER_STATUS_LABELS) as BlockerStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{BLOCKER_STATUS_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {b.status === 'resolved' && <CheckCircle className="text-green-600" />}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemove(b.id)}>
                        <Trash />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'warn' | 'bad' }) {
  const color =
    tone === 'good' ? 'text-green-600' : tone === 'warn' ? 'text-amber-600' : tone === 'bad' ? 'text-red-600' : ''
  return (
    <Card>
      <CardContent className="py-3">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
