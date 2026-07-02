import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiscoveryType } from '@/lib/types'

interface Attendee {
  name: string
  role: string
}

interface Stage0Data {
  clientName: string
  attendees: Attendee[]
  sessionDate: number
  discoveryType: DiscoveryType
}

interface Stage0StartProps {
  initialData?: Stage0Data
  initialCustomerName?: string // Pre-populate from existing customer selection
  onComplete: (data: Stage0Data) => void
  onBack?: () => void
  isLiveMode?: boolean
}

export function Stage0Start({ initialData, initialCustomerName, onComplete, onBack }: Stage0StartProps) {
  const [clientName, setClientName] = useState(initialData?.clientName || initialCustomerName || '')
  const [attendees, setAttendees] = useState<Attendee[]>(
    initialData?.attendees || [{ name: '', role: '' }]
  )
  const [sessionDate, setSessionDate] = useState<Date>(
    initialData?.sessionDate ? new Date(initialData.sessionDate) : new Date()
  )
  const [discoveryType, setDiscoveryType] = useState<DiscoveryType>(
    initialData?.discoveryType || 'new-opportunity'
  )

  const addAttendee = () => {
    setAttendees([...attendees, { name: '', role: '' }])
  }

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index))
    }
  }

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees]
    updated[index][field] = value
    setAttendees(updated)
  }

  const handleSubmit = () => {
    // Filter out empty attendees
    const validAttendees = attendees.filter(a => a.name.trim() !== '' && a.role.trim() !== '')
    
    onComplete({
      clientName,
      attendees: validAttendees,
      sessionDate: sessionDate.getTime(),
      discoveryType,
    })
  }

  const isValid = 
    clientName.trim() !== '' &&
    attendees.some(a => a.name.trim() !== '' && a.role.trim() !== '')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 0: START</h2>
        <p className="text-muted-foreground mt-2">
          Initialize your discovery session with basic information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>
            Capture essential information about this discovery session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="client-name">
              Client/Account Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          {/* Session Date */}
          <div className="space-y-2">
            <Label>
              Discovery Session Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !sessionDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={(date) => date && setSessionDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Discovery Type */}
          <div className="space-y-2">
            <Label htmlFor="discovery-type">
              Discovery Type <span className="text-destructive">*</span>
            </Label>
            <Select value={discoveryType} onValueChange={(v) => setDiscoveryType(v as DiscoveryType)}>
              <SelectTrigger id="discovery-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-opportunity">New Opportunity</SelectItem>
                <SelectItem value="expansion">Expansion</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
                <SelectItem value="macc">MACC (Microsoft AI Cloud Commitment)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendees */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Attendees <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttendee}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Attendee
              </Button>
            </div>

            <div className="space-y-3">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Name"
                      value={attendee.name}
                      onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Role"
                      value={attendee.role}
                      onChange={(e) => updateAttendee(index, 'role', e.target.value)}
                    />
                  </div>
                  {attendees.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttendee(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!onBack}
        >
          Back to Dashboard
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-[#0078D4] hover:bg-[#106EBE] text-white"
        >
          Continue to Stage 1
        </Button>
      </div>
    </div>
  )
}
