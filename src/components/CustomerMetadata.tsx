import type { CustomerMetadata } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, User, UserCircle, MapPin, Wrench } from '@phosphor-icons/react'

interface CustomerMetadataFormProps {
  metadata: CustomerMetadata
  onChange: (metadata: CustomerMetadata) => void
}

const INNOVATION_HUB_LOCATIONS = [
  'Amsterdam, Netherlands',
  'Atlanta, USA',
  'Beijing, China',
  'Bengaluru, India',
  'Boston, USA',
  'Cairo, Egypt',
  'Chicago, USA',
  'Copenhagen, Denmark',
  'Dublin, Ireland',
  'Dubai, UAE',
  'Houston, USA',
  'Johannesburg, South Africa',
  'London, UK',
  'Los Angeles, USA',
  'Melbourne, Australia',
  'Mexico City, Mexico',
  'Miami, USA',
  'Milan, Italy',
  'Moscow, Russia',
  'Munich, Germany',
  'New York, USA',
  'Paris, France',
  'Redmond, USA',
  'San Francisco, USA',
  'São Paulo, Brazil',
  'Seattle, USA',
  'Seoul, South Korea',
  'Shanghai, China',
  'Singapore',
  'Stockholm, Sweden',
  'Sydney, Australia',
  'Tokyo, Japan',
  'Toronto, Canada',
  'Vancouver, Canada',
  'Washington DC, USA',
  'Zurich, Switzerland',
]

export function CustomerMetadata({ metadata, onChange }: CustomerMetadataFormProps) {
  const handleChange = (field: keyof CustomerMetadata, value: string) => {
    onChange({
      ...metadata,
      [field]: value,
    })
  }

  return (
    <Card className="p-6 mb-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Building size={24} weight="duotone" className="text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Customer Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name" className="flex items-center gap-2 text-foreground">
            <Building size={16} />
            Customer Name
          </Label>
          <Input
            id="customer-name"
            placeholder="Enter customer name"
            value={metadata.customerName}
            onChange={(e) => handleChange('customerName', e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="innovation-hub-spoc" className="flex items-center gap-2 text-foreground">
            <UserCircle size={16} />
            Innovation Hub SPOC
          </Label>
          <Input
            id="innovation-hub-spoc"
            placeholder="Enter Hub SPOC name"
            value={metadata.innovationHubSPOC || ''}
            onChange={(e) => handleChange('innovationHubSPOC', e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary-stakeholder" className="flex items-center gap-2 text-foreground">
            <UserCircle size={16} />
            Primary Stakeholder
          </Label>
          <Input
            id="primary-stakeholder"
            placeholder="Enter primary stakeholder name"
            value={metadata.primaryStakeholder}
            onChange={(e) => handleChange('primaryStakeholder', e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-team-rep" className="flex items-center gap-2 text-foreground">
            <User size={16} />
            Account Team Representative
          </Label>
          <Input
            id="account-team-rep"
            placeholder="Enter account team rep name"
            value={metadata.accountTeamRep}
            onChange={(e) => handleChange('accountTeamRep', e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="innovation-hub-location" className="flex items-center gap-2 text-foreground">
            <MapPin size={16} />
            Innovation Hub Location
          </Label>
          <Select
            value={metadata.innovationHubLocation}
            onValueChange={(value) => handleChange('innovationHubLocation', value)}
          >
            <SelectTrigger id="innovation-hub-location" className="bg-background">
              <SelectValue placeholder="Select hub location" />
            </SelectTrigger>
            <SelectContent>
              {INNOVATION_HUB_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="solution-engineer" className="flex items-center gap-2 text-foreground">
            <Wrench size={16} />
            Innovation Hub Solution Engineer
          </Label>
          <Input
            id="solution-engineer"
            placeholder="Enter solution engineer name"
            value={metadata.solutionEngineer}
            onChange={(e) => handleChange('solutionEngineer', e.target.value)}
            className="bg-background"
          />
        </div>
      </div>
    </Card>
  )
}
