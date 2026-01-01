import { Customer, DiscoverySession } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Buildings, User, CalendarBlank } from '@phosphor-icons/react'

interface CustomerSelectorProps {
  customers: Customer[]
  sessions: DiscoverySession[]
  selectedCustomerId?: string | null
  onSelectCustomer: (customerId: string | null) => void
}

export function CustomerSelector({
  customers,
  sessions,
  selectedCustomerId,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const getSessionsForCustomer = (customerId: string) => {
    return sessions.filter((s) => s.customerId === customerId)
  }

  const allSessionsCount = sessions.length
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const selectedCustomerSessions = selectedCustomerId ? getSessionsForCustomer(selectedCustomerId) : sessions

  return (
    <Card className="border-2 bg-card mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Buildings size={24} weight="duotone" className="text-primary" />
              Customer & Sessions
            </CardTitle>
            <CardDescription>
              {selectedCustomerId 
                ? `Viewing ${selectedCustomerSessions.length} session${selectedCustomerSessions.length !== 1 ? 's' : ''} for ${selectedCustomer?.name}`
                : `${allSessionsCount} total session${allSessionsCount !== 1 ? 's' : ''} across ${customers.length} customer${customers.length !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Filter by Customer</label>
          <Select 
            value={selectedCustomerId || 'all'} 
            onValueChange={(value) => onSelectCustomer(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Buildings size={16} weight="duotone" />
                  <span>All Customers ({customers.length})</span>
                </div>
              </SelectItem>
              <Separator className="my-2" />
              {customers.map((customer) => {
                const customerSessions = getSessionsForCustomer(customer.id)
                return (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span>{customer.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {customerSessions.length} session{customerSessions.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedCustomer && (
          <>
            <Separator />
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <User size={18} weight="duotone" className="text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Innovation Hub SPOC</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.innovationHubSPOC || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarBlank size={18} weight="duotone" className="text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Customer Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
