import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, Loader2, Sparkles, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type {
  ResourcesStageData,
  BudgetStatus,
  BudgetRange,
  CapacityLevel,
  DataAvailability,
  SCQStatus,
} from '@/lib/types'

interface Stage2ResourcesProps {
  initialData?: ResourcesStageData
  onComplete: (data: ResourcesStageData) => void
  onBack?: () => void
  isLiveMode?: boolean
}

export function Stage2Resources({ initialData, onComplete, onBack, isLiveMode = false }: Stage2ResourcesProps) {
  // Financial
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>(initialData?.budgetStatus || 'unknown')
  const [budgetRange, setBudgetRange] = useState<BudgetRange>(initialData?.budgetRange || 'unknown')
  const [roiExpectation, setRoiExpectation] = useState(initialData?.roiExpectation || '')
  const [budgetOwner, setBudgetOwner] = useState(initialData?.budgetOwner || '')

  // Human
  const [executiveSponsor, setExecutiveSponsor] = useState(initialData?.executiveSponsor || '')
  const [projectLead, setProjectLead] = useState(initialData?.projectLead || '')
  const [teamCapacity, setTeamCapacity] = useState<CapacityLevel>(initialData?.teamCapacity || 'unknown')
  const [changeReadiness, setChangeReadiness] = useState<CapacityLevel>(initialData?.changeReadiness || 'unknown')

  // Technical
  const [existingPlatforms, setExistingPlatforms] = useState<string[]>(initialData?.existingPlatforms || [''])
  const [dataAvailability, setDataAvailability] = useState<DataAvailability>(initialData?.dataAvailability || 'unknown')
  const [integrationRequirements, setIntegrationRequirements] = useState<string[]>(
    initialData?.integrationRequirements || ['']
  )
  const [technicalDebtConcerns, setTechnicalDebtConcerns] = useState(initialData?.technicalDebtConcerns || '')

  // Temporal
  const [targetStart, setTargetStart] = useState<Date | null>(
    initialData?.targetStart ? new Date(initialData.targetStart) : null
  )
  const [targetCompletion, setTargetCompletion] = useState<Date | null>(
    initialData?.targetCompletion ? new Date(initialData.targetCompletion) : null
  )
  const [competingPriorities, setCompetingPriorities] = useState<string[]>(
    initialData?.competingPriorities || ['']
  )
  const [hardDependencies, setHardDependencies] = useState<string[]>(initialData?.hardDependencies || [''])

  // SCQ
  const [scq, setScq] = useState(
    initialData?.scq || { situation: '', complication: '', question: '', status: 'pending' as SCQStatus }
  )
  const [isGeneratingSCQ, setIsGeneratingSCQ] = useState(false)

  const generateSCQ = async () => {
    setIsGeneratingSCQ(true)
    try {
      const prompt = `Generate an SCQ for Stage 2 Resources:
Budget: ${budgetRange}, Status: ${budgetStatus}
Team Capacity: ${teamCapacity}, Change Readiness: ${changeReadiness}
Sponsor: ${executiveSponsor || 'TBD'}
Technical Debt: ${technicalDebtConcerns}

Return JSON: {situation, complication, question}`

      const response = await window.llm(prompt, 'gpt-4o-mini', true)
      const parsed = JSON.parse(response)
      setScq({ ...parsed, status: 'pending' })
    } catch (error) {
      console.error('Failed to generate SCQ:', error)
    } finally {
      setIsGeneratingSCQ(false)
    }
  }

  const handleSubmit = () => {
    onComplete({
      budgetStatus,
      budgetRange,
      roiExpectation,
      budgetOwner,
      executiveSponsor,
      projectLead,
      teamCapacity,
      changeReadiness,
      existingPlatforms: existingPlatforms.filter(p => p.trim() !== ''),
      dataAvailability,
      integrationRequirements: integrationRequirements.filter(r => r.trim() !== ''),
      technicalDebtConcerns,
      targetStart: targetStart?.getTime() || null,
      targetCompletion: targetCompletion?.getTime() || null,
      competingPriorities: competingPriorities.filter(p => p.trim() !== ''),
      hardDependencies: hardDependencies.filter(d => d.trim() !== ''),
      scq,
    })
  }

  const isValid = scq.status === 'confirmed' || scq.status === 'adjusted'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 2: RESOURCES</h2>
        <p className="text-muted-foreground mt-2">Understand constraints and enablers</p>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="human">Human</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="temporal">Temporal</TabsTrigger>
          <TabsTrigger value="scq">SCQ</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Status</Label>
                  <Select value={budgetStatus} onValueChange={(v) => setBudgetStatus(v as BudgetStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allocated">Allocated</SelectItem>
                      <SelectItem value="accessible">Accessible</SelectItem>
                      <SelectItem value="needs-case">Needs Case</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Range</Label>
                  <Select value={budgetRange} onValueChange={(v) => setBudgetRange(v as BudgetRange)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<50k">&lt; £50K</SelectItem>
                      <SelectItem value="50-150k">£50-150K</SelectItem>
                      <SelectItem value="150-500k">£150-500K</SelectItem>
                      <SelectItem value="500k-1m">£500K-1M</SelectItem>
                      <SelectItem value=">1m">&gt; £1M</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ROI Expectation</Label>
                <Input
                  value={roiExpectation}
                  onChange={(e) => setRoiExpectation(e.target.value)}
                  placeholder="e.g., 3x, 150%, 12 months payback"
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Owner</Label>
                <Input
                  value={budgetOwner}
                  onChange={(e) => setBudgetOwner(e.target.value)}
                  placeholder="Name / Role"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="human" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Human Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Executive Sponsor</Label>
                  <Input
                    value={executiveSponsor}
                    onChange={(e) => setExecutiveSponsor(e.target.value)}
                    placeholder="Name / Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Lead</Label>
                  <Input
                    value={projectLead}
                    onChange={(e) => setProjectLead(e.target.value)}
                    placeholder="Name / Role"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Team Capacity</Label>
                  <Select value={teamCapacity} onValueChange={(v) => setTeamCapacity(v as CapacityLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Change Readiness</Label>
                  <Select value={changeReadiness} onValueChange={(v) => setChangeReadiness(v as CapacityLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Existing Platforms</Label>
                {existingPlatforms.map((platform, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={platform}
                      onChange={(e) => {
                        const updated = [...existingPlatforms]
                        updated[i] = e.target.value
                        setExistingPlatforms(updated)
                      }}
                      placeholder="System name"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExistingPlatforms([...existingPlatforms, ''])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Platform
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Data Availability</Label>
                <Select value={dataAvailability} onValueChange={(v) => setDataAvailability(v as DataAvailability)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="needs-work">Needs Work</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Technical Debt Concerns</Label>
                <Textarea
                  value={technicalDebtConcerns}
                  onChange={(e) => setTechnicalDebtConcerns(e.target.value)}
                  placeholder="Describe any technical debt concerns..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Temporal Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetStart ? format(targetStart, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={targetStart || undefined} onSelect={setTargetStart} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Target Completion</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetCompletion ? format(targetCompletion, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={targetCompletion || undefined}
                        onSelect={setTargetCompletion}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SCQ Confirmation
                <Button variant="outline" size="sm" onClick={generateSCQ} disabled={isGeneratingSCQ}>
                  {isGeneratingSCQ ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Auto-Generate
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Situation</Label>
                <Textarea
                  value={scq.situation}
                  onChange={(e) => setScq({ ...scq, situation: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Complication</Label>
                <Textarea
                  value={scq.complication}
                  onChange={(e) => setScq({ ...scq, complication: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={scq.question}
                  onChange={(e) => setScq({ ...scq, question: e.target.value })}
                  rows={2}
                />
              </div>
              {scq.situation && (
                <div className="flex gap-2">
                  <Button
                    variant={scq.status === 'confirmed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScq({ ...scq, status: 'confirmed' })}
                    className={cn(scq.status === 'confirmed' && 'bg-green-600 hover:bg-green-700')}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Confirmed
                  </Button>
                  <Button
                    variant={scq.status === 'adjusted' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScq({ ...scq, status: 'adjusted' })}
                  >
                    Adjusted
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Stage 1
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="bg-[#0078D4] hover:bg-[#106EBE] text-white">
          Continue to Stage 3
        </Button>
      </div>
    </div>
  )
}
