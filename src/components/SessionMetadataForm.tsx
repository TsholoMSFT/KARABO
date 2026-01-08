import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DiscoverySettingsDialog } from '@/components/DiscoverySettingsDialog'
import { NavigationHeader } from '@/components/NavigationHeader'
import { useCustomers } from '@/hooks/use-customers'
import { lookupTickerSymbol, TickerLookupResult } from '@/lib/earnings-service'
import { Building, User, UserCircle, MapPin, Wrench, GearSix, ChartLine, MagnifyingGlass, Check, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
  onBackToLanding?: () => void
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

export function SessionMetadataForm({ onSubmit, onCancel, onBackToLanding, initialMetadata }: SessionMetadataFormProps) {
  const { customers, getCustomerById } = useCustomers()
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
  const [tickerSuggestions, setTickerSuggestions] = useState<TickerLookupResult[]>([])
  const [isSearchingTicker, setIsSearchingTicker] = useState(false)
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false)
  const [tickerAutoPopulated, setTickerAutoPopulated] = useState(false)

  // Auto-search ticker when customer name is filled
  const handleTickerSearch = useCallback(async () => {
    if (!metadata.customerName.trim() || metadata.customerName.trim().length < 3) {
      toast.error('Please enter a customer name (minimum 3 characters)')
      return
    }

    setIsSearchingTicker(true)
    setShowTickerSuggestions(true)
    setTickerSuggestions([])

    try {
      const results = await lookupTickerSymbol(metadata.customerName)
      setTickerSuggestions(results)
      
      if (results.length === 0) {
        toast.info('No ticker symbols found. You can enter one manually.')
      } else {
        toast.success(`Found ${results.length} ticker suggestion${results.length !== 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error('Ticker lookup error:', error)
      toast.error('Failed to search ticker symbols. You can enter one manually.')
    } finally {
      setIsSearchingTicker(false)
    }
  }, [metadata.customerName])

  // Auto-populate from existing customer when customer name changes
  useEffect(() => {
    const customerName = metadata.customerName.trim().toLowerCase()
    if (!customerName || tickerAutoPopulated) return

    const existingCustomer = customers.find(
      (c) => c.name.toLowerCase().trim() === customerName
    )

    if (existingCustomer && existingCustomer.stockTicker) {
      setMetadata((current) => ({
        ...current,
        stockTicker: existingCustomer.stockTicker || '',
      }))
      setTickerAutoPopulated(true)
      toast.success(`Ticker ${existingCustomer.stockTicker} loaded from previous session`)
    }
  }, [metadata.customerName, customers, tickerAutoPopulated])

  // Auto-search ticker when customer name has 3+ characters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        metadata.customerName.trim().length >= 3 && 
        !metadata.stockTicker && 
        !tickerAutoPopulated &&
        !isSearchingTicker
      ) {
        handleTickerSearch()
      }
    }, 1500) // Debounce 1.5 seconds

    return () => clearTimeout(timer)
  }, [metadata.customerName, metadata.stockTicker, tickerAutoPopulated, isSearchingTicker, handleTickerSearch])

  const handleSelectTicker = (ticker: TickerLookupResult) => {
    setMetadata((current) => ({
      ...current,
      stockTicker: ticker.ticker,
    }))
    setShowTickerSuggestions(false)
    setTickerAutoPopulated(true)
    toast.success(`Ticker ${ticker.ticker} selected`)
  }

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <NavigationHeader
            variant="minimal"
            onBackToLanding={onBackToLanding}
            onBack={onCancel}
            backLabel="Cancel"
          />
        </div>
        <div className="flex items-center justify-center p-4">
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stock-ticker" className="flex items-center gap-2">
                  <ChartLine size={16} />
                  Stock Ticker (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="stock-ticker"
                    placeholder="e.g., MSFT, NPN.JO, SOL.JO"
                    value={metadata.stockTicker || ''}
                    onChange={(e) => {
                      handleChange('stockTicker', e.target.value.toUpperCase())
                      setTickerAutoPopulated(false)
                    }}
                    className="uppercase flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTickerSearch}
                    disabled={isSearchingTicker || !metadata.customerName.trim()}
                    className="gap-2"
                  >
                    <MagnifyingGlass size={16} />
                    {isSearchingTicker ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    For public companies - enables AI analysis of earnings calls and financial data. 
                    Click Search to auto-discover ticker symbols or enter manually.
                  </span>
                </div>

                <AnimatePresence>
                  {showTickerSuggestions && tickerSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border rounded-lg p-3 bg-muted/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Suggested Tickers:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTickerSuggestions(false)}
                          className="h-6 px-2 text-xs"
                        >
                          Close
                        </Button>
                      </div>
                      <Separator />
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {tickerSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.ticker}
                            type="button"
                            onClick={() => handleSelectTicker(suggestion)}
                            className="w-full text-left p-2 rounded hover:bg-accent transition-colors flex items-center justify-between group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-sm">
                                  {suggestion.ticker}
                                </span>
                                {typeof suggestion.score === 'number' && (
                                  <Badge variant="outline" className="text-xs">
                                    {(suggestion.score * 100).toFixed(0)}%
                                  </Badge>
                                )}
                                <Badge 
                                  variant={
                                    suggestion.confidence === 'high' 
                                      ? 'default' 
                                      : suggestion.confidence === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {suggestion.confidence}
                                </Badge>
                                {suggestion.region && (
                                  <Badge variant="outline" className="text-xs">
                                    {suggestion.region}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {suggestion.name}
                                {suggestion.exchange && ` • ${suggestion.exchange}`}
                              </p>
                            </div>
                            <Check size={16} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Sources: Yahoo Finance & Alpha Vantage
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
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
      </div>
      
      <DiscoverySettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
