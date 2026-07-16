import { useState } from 'react'
import type { Customer, CustomerStakeholder, StakeholderType } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash, UsersThree } from '@phosphor-icons/react'
import { PowerInterestMatrix } from '@/components/PowerInterestMatrix'

interface CustomerStakeholderMapProps {
  customer: Customer
  onChange: (stakeholders: CustomerStakeholder[]) => void
}

const TYPE_LABELS: Record<StakeholderType, string> = {
  'economic-buyer': 'Economic buyer',
  'technical-evaluator': 'Technical evaluator',
  'user-buyer': 'User buyer',
  influencer: 'Influencer',
  blocker: 'Blocker',
}

const EMPTY_STAKEHOLDER: Omit<CustomerStakeholder, 'id'> = {
  name: '',
  role: '',
  type: 'influencer',
  disposition: 'unknown',
  accessLevel: 'indirect',
  keyConcern: '',
  department: '',
  email: '',
  influence: 'low',
  interest: 'low',
}

export function CustomerStakeholderMap({ customer, onChange }: CustomerStakeholderMapProps) {
  const stakeholders = customer.stakeholders ?? []
  const [draft, setDraft] = useState(EMPTY_STAKEHOLDER)

  const addStakeholder = () => {
    if (!draft.name.trim() || !draft.role.trim()) return
    onChange([
      ...stakeholders,
      { ...draft, id: `stakeholder-${Date.now()}`, name: draft.name.trim(), role: draft.role.trim() },
    ])
    setDraft(EMPTY_STAKEHOLDER)
  }

  const updateStakeholder = (id: string, updates: Partial<CustomerStakeholder>) => {
    onChange(stakeholders.map((stakeholder) => stakeholder.id === id ? { ...stakeholder, ...updates } : stakeholder))
  }

  return (
    <Card className="mb-6 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><UsersThree size={22} /> Stakeholders</CardTitle>
        <CardDescription>Attach decision-makers and influencers to {customer.name}, then reuse them across use cases and engagement outputs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="people">
          <TabsList>
            <TabsTrigger value="people">Stakeholder form</TabsTrigger>
            <TabsTrigger value="matrix">Power-interest matrix</TabsTrigger>
          </TabsList>
          <TabsContent value="people" className="mt-4 space-y-4">
            <div className="grid gap-3 rounded-md border border-dashed p-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="stakeholder-name">Name</Label>
                <Input id="stakeholder-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stakeholder-role">Role or title</Label>
                <Input id="stakeholder-role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stakeholder-department">Department</Label>
                <Input id="stakeholder-department" value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Buyer role</Label>
                <Select value={draft.type} onValueChange={(type) => setDraft({ ...draft, type: type as StakeholderType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Influence</Label>
                <Select value={draft.influence} onValueChange={(influence) => setDraft({ ...draft, influence: influence as 'low' | 'high' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Interest</Label>
                <Select value={draft.interest} onValueChange={(interest) => setDraft({ ...draft, interest: interest as 'low' | 'high' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="stakeholder-concern">Priority or concern</Label>
                <Input id="stakeholder-concern" value={draft.keyConcern} onChange={(event) => setDraft({ ...draft, keyConcern: event.target.value })} />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <Button type="button" onClick={addStakeholder} disabled={!draft.name.trim() || !draft.role.trim()} className="gap-2"><Plus size={16} /> Add stakeholder</Button>
              </div>
            </div>

            {stakeholders.length === 0 ? (
              <p className="py-5 text-center text-sm text-muted-foreground">No stakeholders mapped for this customer yet.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="grid gap-2 p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input value={stakeholder.name} onChange={(event) => updateStakeholder(stakeholder.id, { name: event.target.value })} aria-label={`${stakeholder.name} name`} />
                    <Input value={stakeholder.role} onChange={(event) => updateStakeholder(stakeholder.id, { role: event.target.value })} aria-label={`${stakeholder.name} role`} />
                    <div className="flex gap-2">
                      <Select value={stakeholder.influence} onValueChange={(influence) => updateStakeholder(stakeholder.id, { influence: influence as 'low' | 'high' })}>
                        <SelectTrigger aria-label={`${stakeholder.name} influence`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low influence</SelectItem><SelectItem value="high">High influence</SelectItem></SelectContent>
                      </Select>
                      <Select value={stakeholder.interest} onValueChange={(interest) => updateStakeholder(stakeholder.id, { interest: interest as 'low' | 'high' })}>
                        <SelectTrigger aria-label={`${stakeholder.name} interest`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low interest</SelectItem><SelectItem value="high">High interest</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => onChange(stakeholders.filter((item) => item.id !== stakeholder.id))} aria-label={`Remove ${stakeholder.name}`}><Trash size={16} /></Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="matrix" className="mt-4">
            <PowerInterestMatrix stakeholders={stakeholders} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}