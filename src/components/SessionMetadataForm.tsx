import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DiscoverySettingsDialog } from '@/components/DiscoverySettingsDialog'
import { Building, User, UserCircle, MapPin, Wrench, GearSix, ChartLine } from '@phosphor-icons/react'

export interface SessionMetadata {
  customerName: string
  innovationHubSPOC: string
  primaryStakeholder: string
  accountTeamRep: string
  innovationHubLocation: string
  solutionEngineer: string
  stockTicker?: string // Optional stock ticker for public companies
}

interface SessionMetadataFormProps {
  onSubmit: (metadata: SessionMetadata) => void
  onCancel: () => void
  initialMetadata?: Partial<SessionMetadata>
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

export function SessionMetadataForm({ onSubmit, onCancel, initialMetadata }: SessionMetadataFormProps) {
  const [metadata, setMetadata] = useState<SessionMetadata>({
    customerName: initialMetadata?.customerName || '',
    innovationHubSPOC: initialMetadata?.innovationHubSPOC || '',
    primaryStakeholder: initialMetadata?.primaryStakeholder || '',
    accountTeamRep: initialMetadata?.accountTeamRep || '',
    innovationHubLocation: initialMetadata?.innovationHubLocation || '',
    solutionEngineer: initialMetadata?.solutionEngineer || '',
    stockTicker: initialMetadata?.stockTicker || '',
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleChange = (field: keyof SessionMetadata, value: string) => {
    setMetadata((current) => ({ ...current, [field]: value }))
  }

  const isValid =
    metadata.customerName.trim() &&
    metadata.innovationHubSPOC.trim() &&
    metadata.primaryStakeholder.trim() &&
    metadata.accountTeamRep.trim() &&
    metadata.innovationHubLocation.trim() &&
    metadata.solutionEngineer.trim()

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-card border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Session Information</CardTitle>
                <CardDescription>
                  Provide information about the customer and this discovery session
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2" 
                onClick={() => setSettingsOpen(true)}
              >
                <GearSix size={16} />
                Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name" className="flex items-center gap-2">
                  <Building size={16} />
                  Customer Name
                </Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer name"
                  value={metadata.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="innovation-hub-spoc" className="flex items-center gap-2">
                  <UserCircle size={16} />
                  Innovation Hub SPOC
                </Label>
                <Input
                  id="innovation-hub-spoc"
                  placeholder="Enter Hub SPOC name"
                  value={metadata.innovationHubSPOC}
                  onChange={(e) => handleChange('innovationHubSPOC', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-stakeholder" className="flex items-center gap-2">
                  <UserCircle size={16} />
                  Primary Stakeholder
                </Label>
                <Input
                  id="primary-stakeholder"
                  placeholder="Enter primary stakeholder name"
                  value={metadata.primaryStakeholder}
                  onChange={(e) => handleChange('primaryStakeholder', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-team-rep" className="flex items-center gap-2">
                  <User size={16} />
                  Account Team Representative
                </Label>
                <Input
                  id="account-team-rep"
                  placeholder="Enter account team rep name"
                  value={metadata.accountTeamRep}
                  onChange={(e) => handleChange('accountTeamRep', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="innovation-hub-location" className="flex items-center gap-2">
                  <MapPin size={16} />
                  Innovation Hub Location
                </Label>
                <Select
                  value={metadata.innovationHubLocation}
                  onValueChange={(value) => handleChange('innovationHubLocation', value)}
                >
                  <SelectTrigger id="innovation-hub-location">
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
                <Label htmlFor="solution-engineer" className="flex items-center gap-2">
                  <Wrench size={16} />
                  Innovation Hub Solution Engineer
                </Label>
                <Input
                  id="solution-engineer"
                  placeholder="Enter solution engineer name"
                  value={metadata.solutionEngineer}
                  onChange={(e) => handleChange('solutionEngineer', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-ticker" className="flex items-center gap-2">
                  <ChartLine size={16} />
                  Stock Ticker (Optional)
                </Label>
                <Input
                  id="stock-ticker"
                  placeholder="e.g., MSFT, NPN.JO, SOL.JO"
                  value={metadata.stockTicker || ''}
                  onChange={(e) => handleChange('stockTicker', e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  For public companies - enables AI analysis of earnings calls and financial data
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={() => onSubmit(metadata)} disabled={!isValid}>
                Continue to Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DiscoverySettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
