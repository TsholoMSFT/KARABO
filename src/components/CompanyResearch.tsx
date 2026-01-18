import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  MagnifyingGlass, 
  FileText, 
  Upload, 
  Rss, 
  Lightbulb,
  SpinnerGap,
  Trash,
  ArrowsClockwise,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  CompanyInsight, 
  CompanySource,
  RSSFeedItem,
  extractInsightsFromText, 
  extractTextFromFile,
  generateResearchSummary,
  fetchRSSFromBlobStorage,
  rssItemsToText,
  getCategoryColor,
  SUGGESTED_RSS_FEEDS
} from '@/lib/company-research-service'

interface CompanyResearchProps {
  companyName: string
  onInsightsChange: (insights: CompanyInsight[]) => void
  initialInsights?: CompanyInsight[]
}

export function CompanyResearch({ 
  companyName, 
  onInsightsChange,
  initialInsights = []
}: CompanyResearchProps) {
  const [insights, setInsights] = useState<CompanyInsight[]>(initialInsights)
  const [sources, setSources] = useState<CompanySource[]>([])
  const [pastedText, setPastedText] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [summary, setSummary] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [rssItems, setRssItems] = useState<RSSFeedItem[]>([])
  const [isLoadingRSS, setIsLoadingRSS] = useState(false)
  const [showAllInsights, setShowAllInsights] = useState(false)

  // Update parent when insights change
  useEffect(() => {
    onInsightsChange(insights)
  }, [insights, onInsightsChange])

  const handleExtractFromText = async () => {
    if (!pastedText.trim()) {
      toast.error('Please paste some content to analyze')
      return
    }

    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }

    setIsExtracting(true)
    try {
      const newInsights = await extractInsightsFromText(
        pastedText, 
        companyName, 
        sourceTitle || 'Pasted Content'
      )
      
      const source: CompanySource = {
        id: crypto.randomUUID(),
        type: 'text',
        title: sourceTitle || 'Pasted Content',
        content: pastedText.substring(0, 500) + '...',
        addedAt: new Date().toISOString(),
      }
      
      setSources(prev => [...prev, source])
      setInsights(prev => [...prev, ...newInsights])
      
      setPastedText('')
      setSourceTitle('')
      toast.success(`Extracted ${newInsights.length} insights`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to extract insights')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      event.target.value = ''
      return
    }

    setIsExtracting(true)
    try {
      const content = await extractTextFromFile(file)
      const newInsights = await extractInsightsFromText(content, companyName, file.name)
      
      const source: CompanySource = {
        id: crypto.randomUUID(),
        type: 'document',
        title: file.name,
        content: content.substring(0, 500) + '...',
        fileName: file.name,
        addedAt: new Date().toISOString(),
      }
      
      setSources(prev => [...prev, source])
      setInsights(prev => [...prev, ...newInsights])
      
      toast.success(`Extracted ${newInsights.length} insights from ${file.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setIsExtracting(false)
      event.target.value = ''
    }
  }

  const handleFetchRSS = async () => {
    setIsLoadingRSS(true)
    try {
      const items = await fetchRSSFromBlobStorage()
      setRssItems(items)
      
      if (items.length === 0) {
        toast.info('No RSS items found. Make sure the Logic App has run.')
      } else {
        toast.success(`Loaded ${items.length} news items`)
      }
    } catch (error) {
      toast.error('Failed to fetch RSS feeds')
    } finally {
      setIsLoadingRSS(false)
    }
  }

  const handleExtractFromRSS = async () => {
    if (rssItems.length === 0) {
      toast.error('No RSS items to analyze. Fetch RSS first.')
      return
    }

    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }

    setIsExtracting(true)
    try {
      const rssText = rssItemsToText(rssItems, 10)
      const newInsights = await extractInsightsFromText(rssText, companyName, 'RSS News Feed')

      if (newInsights.length === 0) {
        toast.info('No insights extracted from RSS items', {
          description: 'RSS data loaded successfully, but the AI extraction returned no insights. Check that /api/chat is configured and returning valid JSON for extraction tasks.',
        })
      }
      
      const source: CompanySource = {
        id: crypto.randomUUID(),
        type: 'rss',
        title: 'RSS News Feed',
        content: `${rssItems.length} news items`,
        addedAt: new Date().toISOString(),
      }
      
      setSources(prev => [...prev, source])
      setInsights(prev => [...prev, ...newInsights])
      
      toast.success(`Extracted ${newInsights.length} insights from RSS`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to extract from RSS')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (insights.length === 0) {
      toast.error('Add some research content first')
      return
    }

    setIsGeneratingSummary(true)
    try {
      const result = await generateResearchSummary(companyName, insights)
      setSummary(result)
    } catch (error) {
      toast.error('Failed to generate summary')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const removeInsight = (id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id))
  }

  const clearAllInsights = () => {
    setInsights([])
    setSources([])
    setSummary('')
    toast.success('Cleared all research data')
  }

  const displayedInsights = showAllInsights ? insights : insights.slice(0, 5)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MagnifyingGlass size={24} weight="duotone" className="text-primary" />
            <CardTitle>Company Research</CardTitle>
          </div>
          {insights.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllInsights} className="text-muted-foreground">
              <Trash size={16} className="mr-1" /> Clear All
            </Button>
          )}
        </div>
        <CardDescription>
          Add company information to enhance discovery insights
          {companyName && <span className="font-medium"> for {companyName}</span>}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste" className="gap-2">
              <FileText size={16} /> Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload size={16} /> Upload
            </TabsTrigger>
            <TabsTrigger value="rss" className="gap-2">
              <Rss size={16} /> RSS Feeds
            </TabsTrigger>
          </TabsList>

          {/* Paste Text Tab */}
          <TabsContent value="paste" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="source-title">Source Title (optional)</Label>
              <Input
                id="source-title"
                placeholder="e.g., Q4 2025 Earnings Call, Company Blog Post"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pasted-content">Paste Content</Label>
              <Textarea
                id="pasted-content"
                placeholder="Paste news articles, press releases, website content, earnings transcripts..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
              />
            </div>
            <Button 
              onClick={handleExtractFromText} 
              disabled={isExtracting || !pastedText.trim() || !companyName.trim()}
              className="w-full gap-2"
            >
              {isExtracting ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  Extracting Insights...
                </>
              ) : (
                <>
                  <Lightbulb size={16} />
                  Extract Insights
                </>
              )}
            </Button>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload .txt, .md, .csv, or .json files
              </p>
              <input
                type="file"
                accept=".txt,.md,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isExtracting}
              />
              <Button asChild variant="outline" disabled={isExtracting || !companyName.trim()}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isExtracting ? 'Processing...' : 'Choose File'}
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                PDF, Word, and Excel require Azure Document Intelligence (coming soon)
              </p>
            </div>
          </TabsContent>

          {/* RSS Tab */}
          <TabsContent value="rss" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Fetch news from RSS feeds configured in Azure Logic Apps
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFetchRSS}
                  disabled={isLoadingRSS}
                >
                  {isLoadingRSS ? (
                    <SpinnerGap size={14} className="animate-spin mr-1" />
                  ) : (
                    <ArrowsClockwise size={14} className="mr-1" />
                  )}
                  Fetch RSS
                </Button>
              </div>

              {/* RSS Items Preview */}
              {rssItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{rssItems.length} news items</p>
                    <Button 
                      size="sm" 
                      onClick={handleExtractFromRSS}
                      disabled={isExtracting || !companyName.trim()}
                    >
                      {isExtracting ? (
                        <SpinnerGap size={14} className="animate-spin mr-1" />
                      ) : (
                        <Lightbulb size={14} className="mr-1" />
                      )}
                      Extract Insights
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {rssItems.slice(0, 5).map((item, i) => (
                      <div key={i} className="p-2 border rounded text-sm">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    ))}
                    {rssItems.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{rssItems.length - 5} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Configured Feeds */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Configured RSS Feeds</p>
                {SUGGESTED_RSS_FEEDS.map((feed, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{feed.name}</p>
                      <p className="text-xs text-muted-foreground">{feed.description}</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Insights Display */}
        {insights.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Extracted Insights ({insights.length})</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary && <SpinnerGap size={14} className="animate-spin mr-1" />}
                Generate Summary
              </Button>
            </div>

            {/* Summary */}
            {summary && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Research Summary</h4>
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
              </div>
            )}

            {/* Insights List */}
            <div className="space-y-2">
              {displayedInsights.map((insight) => (
                <div key={insight.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={getCategoryColor(insight.category)}>
                          {insight.category}
                        </Badge>
                        <span className="font-medium text-sm">{insight.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{insight.summary}</p>
                      <p className="text-xs text-muted-foreground italic">
                        AI Relevance: {insight.relevanceToAI}
                      </p>
                      {insight.potentialUseCases.length > 0 && (
                        <p className="text-xs text-primary mt-1">
                          💡 {insight.potentialUseCases.join(' • ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {insight.source}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInsight(insight.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More/Less */}
            {insights.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllInsights(!showAllInsights)}
                className="w-full"
              >
                {showAllInsights ? (
                  <>
                    <CaretUp size={14} className="mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <CaretDown size={14} className="mr-1" /> Show All ({insights.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {insights.length === 0 && (
          <div className="mt-6 text-center py-8 text-muted-foreground">
            <MagnifyingGlass size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No research insights yet</p>
            <p className="text-xs">Paste content, upload files, or fetch RSS to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
