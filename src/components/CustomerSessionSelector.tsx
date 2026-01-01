import { Customer, DiscoverySession } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Buildings, Notebook } from '@phosphor-icons/react'
import { useState } from 'react'

interface CustomerSessionSelectorProps {
  customers: Customer[]
  sessions: DiscoverySession[]
  selectedCustomerId: string | null
  selectedSessionId: string | null
  onCustomerChange: (customerId: string | null) => void
  onSessionChange: (sessionId: string | null) => void
  onCreateCustomer: (name: string, innovationHubSPOC: string) => void
  onStartDiscovery: () => void
}

export function CustomerSessionSelector({
  customers,
  sessions,
  selectedCustomerId,
  selectedSessionId,
  onCustomerChange,
  onSessionChange,
  onCreateCustomer,
  onStartDiscovery,
}: CustomerSessionSelectorProps) {
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerSPOC, setNewCustomerSPOC] = useState('')

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const customerSessions = sessions.filter((s) => s.customerName === selectedCustomer?.name)

  const handleCreateCustomer = () => {
    if (newCustomerName.trim() && newCustomerSPOC.trim()) {
      onCreateCustomer(newCustomerName.trim(), newCustomerSPOC.trim())
      setNewCustomerName('')
      setNewCustomerSPOC('')
      setNewCustomerDialogOpen(false)
    }
  }

  return (
    <Card className="border-2 bg-card mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Buildings size={24} weight="duotone" className="text-primary" />
          Customer & Session Selection
        </CardTitle>
        <CardDescription>
          Select a customer and discovery session to view and manage use cases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Customer</Label>
            <Select value={selectedCustomerId || 'none'} onValueChange={(value) => onCustomerChange(value === 'none' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No customer selected</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer && (
              <p className="text-xs text-muted-foreground mt-1">
                Hub SPOC: {selectedCustomer.innovationHubSPOC}
              </p>
            )}
          </div>
          <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus size={18} />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Add a new customer to start creating discovery sessions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-spoc">Innovation Hub SPOC</Label>
                  <Input
                    id="customer-spoc"
                    value={newCustomerSPOC}
                    onChange={(e) => setNewCustomerSPOC(e.target.value)}
                    placeholder="Enter SPOC name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewCustomerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} disabled={!newCustomerName.trim() || !newCustomerSPOC.trim()}>
                  Create Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {selectedCustomerId && (
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Discovery Session</Label>
              <Select value={selectedSessionId || 'none'} onValueChange={(value) => onSessionChange(value === 'none' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No session selected</SelectItem>
                  {customerSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onStartDiscovery} className="gap-2">
              <Notebook size={18} />
              New Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
