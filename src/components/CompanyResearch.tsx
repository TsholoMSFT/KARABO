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
  CaretUp,
  Buildings,
  Bank
} from '@phosphor-icons/react'
import { ENTITY_TYPE_LABELS, type EntityType } from '@/lib/types'
import { toast } from 'sonner'
import { AIBadge, InlineDisclaimer } from '@/components/Disclaimer'
import { AIDataDisclosure } from '@/components/AIDataDisclosure'
import { 
  CompanyInsight, 
  CompanySource,
  RSSFeedItem,
  FetchRSSFromBlobStorageResult,
  extractInsightsFromText, 
  extractTextFromFile,
  generateResearchSummary,
  fetchRSSFromBlobStorage,
  rssItemsToText,
  searchCompanyNews,
  fetchCompanyFilings,
  getCategoryColor,
  SUGGESTED_RSS_FEEDS,
  fetchCompanyProfile,
  companyProfileToText,
  type CompanyProfile,
  type NewsSearchResultItem,
  type FetchFilingsResult
} from '@/lib/company-research-service'

interface CompanyResearchProps {
  companyName: string
  entityType?: EntityType
  onInsightsChange: (insights: CompanyInsight[]) => void
  onSummaryChange?: (summary: string) => void
  initialInsights?: CompanyInsight[]
  initialSummary?: string
}

export function CompanyResearch({ 
  companyName, 
  entityType,
  onInsightsChange,
  onSummaryChange,
  initialInsights = [],
  initialSummary = ''
}: CompanyResearchProps) {
  const [insights, setInsights] = useState<CompanyInsight[]>(initialInsights)
  const [sources, setSources] = useState<CompanySource[]>([])
  const [pastedText, setPastedText] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [summary, setSummary] = useState(initialSummary)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [rssItems, setRssItems] = useState<RSSFeedItem[]>([])
  const [isLoadingRSS, setIsLoadingRSS] = useState(false)
  const [newsQuery, setNewsQuery] = useState('')
  const [newsResults, setNewsResults] = useState<NewsSearchResultItem[]>([])
  const [isSearchingNews, setIsSearchingNews] = useState(false)
  const [newsSearchMethod, setNewsSearchMethod] = useState<'vector' | 'keyword' | undefined>()
  const [newsSearchMessage, setNewsSearchMessage] = useState('')
  const [filingsItems, setFilingsItems] = useState<RSSFeedItem[]>([])
  const [isLoadingFilings, setIsLoadingFilings] = useState(false)
  const [filingsSource, setFilingsSource] = useState('')
  const [filingsMessage, setFilingsMessage] = useState('')
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileCountry, setProfileCountry] = useState('')
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
        sourceTitle || 'Pasted Content',
        entityType
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
      const newInsights = await extractInsightsFromText(content, companyName, file.name, entityType)
      
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
    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }

    setIsLoadingRSS(true)
    try {
      const result: FetchRSSFromBlobStorageResult = await fetchRSSFromBlobStorage('/api', companyName)
      const items = result.items

      setRssItems(items)

      if (items.length === 0) {
        const descriptionParts: string[] = []
        if (result.blobName) {
          descriptionParts.push(
            `Latest blob: ${result.blobName}${result.lastModified ? ` (${result.lastModified})` : ''}`
          )
        }
        if (result.diagnostics?.itemTagCount !== undefined || result.diagnostics?.entryTagCount !== undefined) {
          descriptionParts.push(
            `Detected tags: item=${result.diagnostics?.itemTagCount ?? 0}, entry=${result.diagnostics?.entryTagCount ?? 0}`
          )
        }

        toast.info(result.message || 'No RSS items found.', {
          description: descriptionParts.length ? descriptionParts.join(' • ') : undefined,
        })
      } else {
        toast.success(`Loaded ${items.length} news items`)
      }
    } catch (error) {
      toast.error('Failed to fetch RSS feeds')
    } finally {
      setIsLoadingRSS(false)
    }
  }

  const handleSearchNews = async () => {
    if (!newsQuery.trim()) return
    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }
    setIsSearchingNews(true)
    try {
      const res = await searchCompanyNews(companyName, newsQuery, { k: 8 })
      setNewsResults(res.results)
      setNewsSearchMethod(res.method)
      setNewsSearchMessage(res.message || '')
      if (res.results.length === 0) {
        toast.info(res.message || 'No matching news found')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'News search failed')
    } finally {
      setIsSearchingNews(false)
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
      const newInsights = await extractInsightsFromText(rssText, companyName, 'RSS News Feed', entityType)

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

  const handleFetchFilings = async () => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }

    setIsLoadingFilings(true)
    try {
      const result: FetchFilingsResult = await fetchCompanyFilings(companyName)
      setFilingsItems(result.items)
      setFilingsSource(result.source || '')
      setFilingsMessage(result.items.length === 0 ? (result.message || 'No regulatory filings found.') : '')

      if (result.items.length === 0) {
        toast.info(result.message || 'No regulatory filings found.')
      } else {
        toast.success(`Loaded ${result.items.length} filings`)
      }
    } catch (error) {
      toast.error('Failed to fetch filings')
    } finally {
      setIsLoadingFilings(false)
    }
  }

  const handleExtractFromFilings = async () => {
    if (filingsItems.length === 0) {
      toast.error('No filings to analyze. Fetch filings first.')
      return
    }

    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }

    setIsExtracting(true)
    try {
      const filingsText = rssItemsToText(filingsItems, 12)
      const newInsights = await extractInsightsFromText(filingsText, companyName, 'Regulatory Filings', entityType)

      if (newInsights.length === 0) {
        toast.info('No insights extracted from filings', {
          description: 'Filings loaded successfully, but the AI extraction returned no insights. Check that /api/chat is configured.',
        })
      }

      const source: CompanySource = {
        id: crypto.randomUUID(),
        type: 'rss',
        title: 'Regulatory Filings',
        content: `${filingsItems.length} filing items`,
        addedAt: new Date().toISOString(),
      }

      setSources(prev => [...prev, source])
      setInsights(prev => [...prev, ...newInsights])

      toast.success(`Extracted ${newInsights.length} insights from filings`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to extract from filings')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleFetchProfile = async () => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name first')
      return
    }
    setIsLoadingProfile(true)
    setProfileMessage('')
    try {
      const { profile: resolved, message } = await fetchCompanyProfile(companyName, {
        country: profileCountry.trim() || undefined,
      })
      if (resolved) {
        setProfile(resolved)
        toast.success(`Profile resolved for ${resolved.identity.name}`)
      } else {
        setProfile(null)
        setProfileMessage(message || 'No company profile found. Try adding a country code or use the other tabs.')
        toast.info(message || 'No company profile found.')
      }
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Failed to fetch company profile')
      toast.error('Failed to fetch company profile')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleExtractFromProfile = async () => {
    if (!profile) return
    setIsExtracting(true)
    try {
      const profileText = companyProfileToText(profile)
      const newInsights = await extractInsightsFromText(profileText, companyName, 'Company Profile', entityType)

      const source: CompanySource = {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Company Profile',
        content: profileText.substring(0, 500),
        addedAt: new Date().toISOString(),
      }

      setSources(prev => [...prev, source])
      setInsights(prev => [...prev, ...newInsights])
      toast.success(`Extracted ${newInsights.length} insights from profile`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to extract from profile')
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
      onSummaryChange?.(result)
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
        {entityType && entityType !== 'public-company' && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Buildings size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span>
              <span className="font-medium text-foreground">{ENTITY_TYPE_LABELS[entityType]}:</span>{' '}
              No public market data is available for non-listed entities — research uses news (by company name),
              uploaded documents, pasted content, and any financial context you provided, analysed with that lens.
            </span>
          </div>
        )}
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="paste" className="gap-2">
              <FileText size={16} /> Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload size={16} /> Upload
            </TabsTrigger>
            <TabsTrigger value="rss" className="gap-2">
              <Rss size={16} /> RSS Feeds
            </TabsTrigger>
            <TabsTrigger value="filings" className="gap-2">
              <Bank size={16} /> Filings
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Buildings size={16} /> Profile
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
            <AIDataDisclosure
              fields={['pasted content', 'company name', 'source title']}
              model="gpt-4o-mini"
              note="Text is sent to AI to extract structured insights about the company."
            />
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Upload a document to extract insights
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Word (.docx), Excel (.xlsx), PDF, text (.txt, .md, .csv, .json) and images
              </p>
              <input
                type="file"
                accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.tiff,.bmp"
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
                Word, Excel and text-based PDFs are parsed in your browser. Scanned PDFs and
                images are read with Azure Document Intelligence. Max 10&nbsp;MB per file.
              </p>
              {!companyName.trim() && (
                <p className="text-xs text-amber-600 mt-2">Enter a company name first to enable uploads.</p>
              )}
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

              {/* Semantic search over the cached news corpus (blob-backed vector search) */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <MagnifyingGlass size={16} className="text-primary" />
                  <p className="text-sm font-medium">Semantic news search</p>
                  {newsSearchMethod && (
                    <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                      {newsSearchMethod}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rank cached news by meaning &mdash; e.g. &ldquo;AI data center deals&rdquo; or &ldquo;executive pay backlash&rdquo;.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newsQuery}
                    onChange={(e) => setNewsQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchNews() }}
                    placeholder="Search company news by topic..."
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSearchNews}
                    disabled={isSearchingNews || !newsQuery.trim() || !companyName.trim()}
                  >
                    {isSearchingNews ? (
                      <SpinnerGap size={14} className="animate-spin" />
                    ) : (
                      <MagnifyingGlass size={14} />
                    )}
                  </Button>
                </div>
                {newsResults.length > 0 && (
                  <div className="max-h-56 overflow-y-auto space-y-2 pt-1">
                    {newsResults.map((r, i) => (
                      <a
                        key={i}
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{r.title}</p>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {Math.round(r.score * 100)}%
                          </Badge>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                {newsResults.length === 0 && newsSearchMessage && (
                  <p className="text-xs text-muted-foreground">{newsSearchMessage}</p>
                )}
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

          {/* Filings Tab — SEC EDGAR + JSE/SENS regulatory filings */}
          <TabsContent value="filings" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Recent regulatory filings &amp; announcements (SEC EDGAR + JSE/SENS)
              </p>
              <div className="flex items-center gap-2">
                {filingsSource && (
                  <Badge variant="outline" className="text-[10px] uppercase">{filingsSource}</Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleFetchFilings} disabled={isLoadingFilings}>
                  {isLoadingFilings ? (
                    <SpinnerGap size={14} className="animate-spin mr-1" />
                  ) : (
                    <ArrowsClockwise size={14} className="mr-1" />
                  )}
                  Fetch filings
                </Button>
              </div>
            </div>

            {filingsItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{filingsItems.length} filing items</p>
                  <Button size="sm" onClick={handleExtractFromFilings} disabled={isExtracting || !companyName.trim()}>
                    {isExtracting ? (
                      <SpinnerGap size={14} className="animate-spin mr-1" />
                    ) : (
                      <Lightbulb size={14} className="mr-1" />
                    )}
                    Extract Insights
                  </Button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {filingsItems.map((item, i) => {
                    const isSec = /^\[SEC\]/i.test(item.title)
                    const isJse = /^\[JSE\]/i.test(item.title)
                    const cleanTitle = item.title.replace(/^\[(SEC|JSE)\]\s*/i, '')
                    const parsedDate = item.pubDate ? new Date(item.pubDate) : null
                    const dateValid = parsedDate !== null && !isNaN(parsedDate.getTime())
                    return (
                      <a
                        key={i}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{cleanTitle}</p>
                          {(isSec || isJse) && (
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              {isSec ? 'SEC' : 'JSE'}
                            </Badge>
                          )}
                        </div>
                        {dateValid && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {parsedDate!.toLocaleDateString()}
                          </p>
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {filingsItems.length === 0 && filingsMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                <Bank size={14} className="mt-0.5 flex-shrink-0" />
                <span>{filingsMessage}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Filings are collected every 12 hours by the karabo-filings-monitor Logic App and served from blob
              storage, with a live SEC EDGAR + JSE news fallback when no cache exists.
            </p>
            <AIDataDisclosure
              fields={['company name']}
              model="gpt-4o-mini"
              note="Filing headlines are sent to AI to extract structured insights about the company."
            />
          </TabsContent>

          {/* Profile Tab — name-based identity lookup (works for non-listed entities) */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="profile-country" className="text-xs">Country (optional, ISO code)</Label>
                <Input
                  id="profile-country"
                  placeholder="e.g., GB, US, ZA"
                  value={profileCountry}
                  onChange={(e) => setProfileCountry(e.target.value.toUpperCase().slice(0, 2))}
                  className="uppercase"
                />
              </div>
              <Button onClick={handleFetchProfile} disabled={isLoadingProfile || !companyName.trim()} className="gap-2">
                {isLoadingProfile ? <SpinnerGap size={16} className="animate-spin" /> : <MagnifyingGlass size={16} />}
                Look up profile
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Resolves company identity by name (Wikidata, SEC Form D, Companies House, OpenCorporates) — works for
              private and non-listed entities, no stock ticker required.
            </p>

            {profileMessage && !profile && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                <Buildings size={14} className="mt-0.5 flex-shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}

            {profile && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{profile.identity.name}</p>
                    {profile.identity.industry && (
                      <p className="text-xs text-muted-foreground">{profile.identity.industry}</p>
                    )}
                  </div>
                  <Badge variant={profile.isPublic ? 'default' : 'secondary'}>
                    {profile.isPublic
                      ? `Public${profile.ticker ? ` · ${profile.ticker.symbol}` : ''}`
                      : 'Private / non-listed'}
                  </Badge>
                </div>
                {profile.identity.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{profile.identity.description}</p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {profile.identity.headquarters && (
                    <div><span className="text-muted-foreground">HQ:</span> {profile.identity.headquarters}</div>
                  )}
                  {profile.identity.founded && (
                    <div><span className="text-muted-foreground">Founded:</span> {profile.identity.founded}</div>
                  )}
                  {typeof profile.identity.employees === 'number' && (
                    <div><span className="text-muted-foreground">Employees:</span> {profile.identity.employees.toLocaleString()}</div>
                  )}
                  {profile.identity.website && (
                    <div className="truncate"><span className="text-muted-foreground">Web:</span> {profile.identity.website}</div>
                  )}
                </div>
                {profile.registry.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium mb-1">Registry records</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {profile.registry.slice(0, 3).map((r, i) => (
                        <li key={i} className="truncate">
                          [{r.registry}] {r.name}{r.companyNumber ? ` (No. ${r.companyNumber})` : ''}{r.status ? ` — ${r.status}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.privatePlacements.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium mb-1">SEC Form D (private placements)</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {profile.privatePlacements.slice(0, 3).map((f, i) => (
                        <li key={i} className="truncate">{f.issuer}{f.filedAt ? ` · filed ${f.filedAt}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button onClick={handleExtractFromProfile} disabled={isExtracting} size="sm" className="gap-2">
                  {isExtracting ? <SpinnerGap size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                  Extract insights from profile
                </Button>
              </div>
            )}
            <AIDataDisclosure
              fields={['company name', 'country']}
              model="gpt-4o-mini"
              note="The company name is sent to free registry/identity sources; the resolved profile is then summarised by AI into insights."
            />
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
                <h4 className="font-medium mb-2 flex items-center gap-2">Research Summary <AIBadge /></h4>
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
                <InlineDisclaimer
                  text="This summary was generated by AI from the extracted insights."
                  icon="ai"
                  className="mt-2"
                />
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
                        <AIBadge />
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
