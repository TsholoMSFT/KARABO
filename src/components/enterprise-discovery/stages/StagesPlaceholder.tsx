// Placeholder stage components for Stages 3-8
// Stage 5 has been fully implemented in Stage5SolutionScope.tsx
// These can be fully implemented following the pattern of Stage 1 & 2

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Construction, Mic } from 'lucide-react'

interface PlaceholderStageProps {
  initialData?: any
  onComplete: (data: any) => void
  onBack?: () => void
  isLiveMode?: boolean
}

// Stage 3: Decision Process
export function Stage3DecisionProcess({ initialData, onComplete, onBack, isLiveMode }: PlaceholderStageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 3: DECISION PROCESS</h2>
          <p className="text-muted-foreground mt-2">Map stakeholders and decision-making process</p>
        </div>
        {isLiveMode && (
          <Badge variant="outline" className="gap-1 text-[#0078D4] border-[#0078D4]">
            <Mic className="w-3 h-3" />
            Voice Active
          </Badge>
        )}
      </div>
      <Alert>
        <Construction className="h-4 w-4" />
        <AlertDescription>
          Full stakeholder mapping UI coming soon. For now, proceeding to next stage.
        </AlertDescription>
      </Alert>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onComplete({})} className="bg-[#0078D4] hover:bg-[#106EBE] text-white">Continue to Stage 4</Button>
      </div>
    </div>
  )
}

// Stage 4: Prioritise (RICE)
export function Stage4Prioritise({ initialData, onComplete, onBack, isLiveMode }: PlaceholderStageProps) {
  const [opportunities, setOpportunities] = React.useState<Array<{
    id: string
    title: string
    description?: string
    rice: { reach: number; impact: number; confidence: number; effort: number; score: number }
  }>>(initialData?.opportunities || [
    { id: 'opp-1', title: 'Primary Opportunity', rice: { reach: 100, impact: 2, confidence: 80, effort: 4, score: 0 } },
  ])

  const calculateRICEScore = (rice: { reach: number; impact: number; confidence: number; effort: number }) => {
    if (rice.effort === 0) return 0
    return Math.round((rice.reach * rice.impact * (rice.confidence / 100)) / Math.max(rice.effort, 0.1))
  }

  const updateOpportunity = (id: string, field: keyof typeof opportunities[0]['rice'], value: number) => {
    setOpportunities(prev => prev.map(opp => {
      if (opp.id === id) {
        const updatedRice = { ...opp.rice, [field]: value }
        updatedRice.score = calculateRICEScore(updatedRice)
        return { ...opp, rice: updatedRice }
      }
      return opp
    }))
  }

  const addOpportunity = () => {
    setOpportunities(prev => [...prev, {
      id: `opp-${Date.now()}`,
      title: `Opportunity ${prev.length + 1}`,
      rice: { reach: 100, impact: 1, confidence: 50, effort: 4, score: 0 }
    }])
  }

  const removeOpportunity = (id: string) => {
    if (opportunities.length > 1) {
      setOpportunities(prev => prev.filter(opp => opp.id !== id))
    }
  }

  const sortedOpportunities = [...opportunities].sort((a, b) => b.rice.score - a.rice.score)
  const recommendedId = sortedOpportunities[0]?.id

  const handleComplete = () => {
    const data = {
      opportunities: opportunities.map(opp => ({
        ...opp,
        rice: { ...opp.rice, score: calculateRICEScore(opp.rice) }
      })),
      recommendedOpportunityId: recommendedId
    }
    onComplete(data)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 4: PRIORITISE</h2>
          <p className="text-muted-foreground mt-2">Rank opportunities using RICE methodology</p>
        </div>
        {isLiveMode && (
          <Badge variant="outline" className="gap-1 text-[#0078D4] border-[#0078D4]">
            <Mic className="w-3 h-3" />
            Voice Active
          </Badge>
        )}
      </div>

      {/* RICE Explanation */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>RICE Score</strong> = (Reach × Impact × Confidence) ÷ Effort. 
            Higher scores indicate better opportunities to pursue.
          </p>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.map((opp, index) => (
          <Card key={opp.id} className={`border-2 ${opp.id === recommendedId ? 'border-[#0078D4] bg-[#0078D4]/5' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={opp.title}
                    onChange={(e) => setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, title: e.target.value } : o))}
                    className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#0078D4] rounded px-2 py-1"
                  />
                  {opp.id === recommendedId && (
                    <Badge className="bg-[#0078D4]">Recommended</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#0078D4]">{calculateRICEScore(opp.rice)}</span>
                  {opportunities.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeOpportunity(opp.id)} className="text-destructive">
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Reach */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reach (users/quarter)</label>
                  <input
                    type="number"
                    value={opp.rice.reach}
                    onChange={(e) => updateOpportunity(opp.id, 'reach', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="0"
                  />
                </div>
                {/* Impact */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Impact (0.25-3)</label>
                  <select
                    value={opp.rice.impact}
                    onChange={(e) => updateOpportunity(opp.id, 'impact', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="3">3x - Massive</option>
                    <option value="2">2x - High</option>
                    <option value="1">1x - Medium</option>
                    <option value="0.5">0.5x - Low</option>
                    <option value="0.25">0.25x - Minimal</option>
                  </select>
                </div>
                {/* Confidence */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confidence (%)</label>
                  <input
                    type="number"
                    value={opp.rice.confidence}
                    onChange={(e) => updateOpportunity(opp.id, 'confidence', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                {/* Effort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Effort (person-weeks)</label>
                  <input
                    type="number"
                    value={opp.rice.effort}
                    onChange={(e) => updateOpportunity(opp.id, 'effort', Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    min="0.1"
                    step="0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addOpportunity} className="w-full border-dashed">
        + Add Another Opportunity
      </Button>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleComplete} className="bg-[#0078D4] hover:bg-[#106EBE] text-white">
          Continue to Stage 5
        </Button>
      </div>
    </div>
  )
}

// Stage 6: Validate
export function Stage6Validate({ initialData, onComplete, onBack, isLiveMode }: PlaceholderStageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 6: VALIDATE</h2>
          <p className="text-muted-foreground mt-2">Test assumptions and validate business case</p>
        </div>
        {isLiveMode && (
          <Badge variant="outline" className="gap-1 text-[#0078D4] border-[#0078D4]">
            <Mic className="w-3 h-3" />
            Voice Active
          </Badge>
        )}
      </div>
      <Alert>
        <Construction className="h-4 w-4" />
        <AlertDescription>Assumptions and validation tracking UI coming soon.</AlertDescription>
      </Alert>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onComplete({})} className="bg-[#0078D4] hover:bg-[#106EBE] text-white">Continue to Stage 7</Button>
      </div>
    </div>
  )
}

// Stage 7: Commit
export function Stage7Commit({ initialData, onComplete, onBack, isLiveMode }: PlaceholderStageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0078D4]">Stage 7: COMMIT</h2>
          <p className="text-muted-foreground mt-2">Assess relationship quality and make go/no-go decision</p>
        </div>
        {isLiveMode && (
          <Badge variant="outline" className="gap-1 text-[#0078D4] border-[#0078D4]">
            <Mic className="w-3 h-3" />
            Voice Active
          </Badge>
        )}
      </div>
      <Alert>
        <Construction className="h-4 w-4" />
        <AlertDescription>
          Relationship assessment and decision framework UI coming soon.
        </AlertDescription>
      </Alert>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onComplete({})} className="bg-[#0078D4] hover:bg-[#106EBE] text-white">Continue to Stage 8</Button>
      </div>
    </div>
  )
}