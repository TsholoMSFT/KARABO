import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";

/**
 * Azure Function for Earnings Transcript Search
 * Searches multiple FREE sources:
 * - SEC EDGAR (US public companies)
 * - JSE SENS (South African companies)
 * - Yahoo Finance (Global)
 * - Alpha Vantage (Global, with free API key)
 */

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;

interface EarningsTranscript {
  id: string;
  companyName: string;
  ticker?: string;
  quarter: string;
  year: number;
  date: string;
  source: "sec-edgar" | "jse-sens" | "yahoo-finance" | "alpha-vantage" | "manual";
  url?: string;
  summary?: string;
}

interface SearchRequest {
  companyName: string;
  ticker?: string;
  region?: "US" | "ZA" | "EU" | "GLOBAL";
}

const corsHeaders = makeCorsHeaders("POST, OPTIONS");

// SEC EDGAR Search (US Companies - Free, no key needed)
async function searchSECEdgar(companyName: string, ticker?: string): Promise<EarningsTranscript[]> {
  try {
    const searchTerm = ticker || companyName;
    const url = `https://efts.sec.gov/LATEST/search-index?q="${encodeURIComponent(searchTerm)}"&dateRange=custom&startdt=2024-01-01&enddt=2026-12-31&forms=8-K`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "KARABO Discovery Tool (Microsoft Innovation Hub)",
        Accept: "application/json",
      },
    });

    if (!response.ok) return [];

    const data = await response.json() as any;
    const transcripts: EarningsTranscript[] = [];

    if (data.hits?.hits) {
      for (const hit of data.hits.hits.slice(0, 5)) {
        const filing = hit._source;
        const desc = (filing.file_description || "").toLowerCase();
        if (filing.form === "8-K" && (desc.includes("earning") || desc.includes("result"))) {
          transcripts.push({
            id: `sec-${hit._id}`,
            companyName: filing.display_names?.[0] || companyName,
            ticker: filing.tickers?.[0],
            quarter: extractQuarter(filing.file_date),
            year: new Date(filing.file_date).getFullYear(),
            date: filing.file_date,
            source: "sec-edgar",
            url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${filing.cik}&type=8-K`,
          });
        }
      }
    }
    return transcripts;
  } catch (error) {
    console.error("SEC EDGAR error:", error);
    return [];
  }
}

// JSE SENS Search (South African Companies - Free, no key needed)
async function searchJSESens(companyName: string, ticker?: string): Promise<EarningsTranscript[]> {
  try {
    // JSE SENS API endpoint for announcements
    const searchTerm = ticker || companyName;
    const url = `https://www.jse.co.za/api/sens?keyword=${encodeURIComponent(searchTerm)}&pageSize=10`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "KARABO Discovery Tool (Microsoft Innovation Hub)",
        Accept: "application/json",
      },
    });

    // If API doesn't work, return static URL for manual access
    if (!response.ok) {
      // Return a helpful link to search manually
      return [{
        id: `jse-manual-${Date.now()}`,
        companyName,
        ticker,
        quarter: "Recent",
        year: new Date().getFullYear(),
        date: new Date().toISOString(),
        source: "jse-sens",
        url: `https://www.jse.co.za/sens?keyword=${encodeURIComponent(searchTerm)}`,
        summary: `Search JSE SENS for ${companyName} announcements including earnings results, trading statements, and financial updates.`,
      }];
    }

    const data = await response.json() as any;
    const transcripts: EarningsTranscript[] = [];

    // Parse SENS announcements for earnings-related items
    const announcements = data.items || data.announcements || data || [];
    for (const item of announcements.slice(0, 5)) {
      const title = (item.title || item.headline || "").toLowerCase();
      const isEarnings = 
        title.includes("result") ||
        title.includes("earning") ||
        title.includes("trading statement") ||
        title.includes("financial") ||
        title.includes("interim") ||
        title.includes("annual");

      if (isEarnings) {
        const dateStr = item.date || item.publishedDate || item.releaseDate || new Date().toISOString();
        transcripts.push({
          id: `jse-${item.id || Date.now()}-${transcripts.length}`,
          companyName: item.company || item.issuer || companyName,
          ticker: item.ticker || item.jseCode || ticker,
          quarter: extractQuarter(dateStr),
          year: new Date(dateStr).getFullYear(),
          date: dateStr,
          source: "jse-sens",
          url: item.url || item.link || `https://www.jse.co.za/sens/${item.id}`,
          summary: item.title || item.headline || item.description,
        });
      }
    }

    // Always include manual search link
    if (transcripts.length === 0) {
      transcripts.push({
        id: `jse-search-${Date.now()}`,
        companyName,
        ticker,
        quarter: "Search",
        year: new Date().getFullYear(),
        date: new Date().toISOString(),
        source: "jse-sens",
        url: `https://www.jse.co.za/sens?keyword=${encodeURIComponent(searchTerm)}`,
        summary: `Search JSE SENS directly for ${companyName} announcements.`,
      });
    }

    return transcripts;
  } catch (error) {
    console.error("JSE SENS error:", error);
    // Return manual search link on error
    return [{
      id: `jse-fallback-${Date.now()}`,
      companyName,
      ticker,
      quarter: "Search",
      year: new Date().getFullYear(),
      date: new Date().toISOString(),
      source: "jse-sens",
      url: `https://www.jse.co.za/sens?keyword=${encodeURIComponent(ticker || companyName)}`,
      summary: `Search JSE SENS for ${companyName} earnings and financial announcements.`,
    }];
  }
}

// Yahoo Finance (Global - Free, no key needed)
async function searchYahooFinance(companyName: string, ticker?: string): Promise<EarningsTranscript[]> {
  if (!ticker) return [];

  try {
    // Yahoo Finance API for earnings
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=earnings,earningsHistory,earningsTrend`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "KARABO Discovery Tool",
      },
    });

    if (!response.ok) {
      // Return link to Yahoo Finance page
      return [{
        id: `yahoo-link-${Date.now()}`,
        companyName,
        ticker,
        quarter: "Recent",
        year: new Date().getFullYear(),
        date: new Date().toISOString(),
        source: "yahoo-finance",
        url: `https://finance.yahoo.com/quote/${ticker}/analysis`,
        summary: `View ${ticker} earnings analysis and estimates on Yahoo Finance.`,
      }];
    }

    const data = await response.json() as any;
    const transcripts: EarningsTranscript[] = [];

    // Extract earnings history
    const earningsHistory = data.quoteSummary?.result?.[0]?.earningsHistory?.history || [];
    
    for (const earning of earningsHistory.slice(0, 4)) {
      const dateStr = earning.quarter?.fmt || new Date().toISOString().split('T')[0];
      const epsActual = earning.epsActual?.raw;
      const epsEstimate = earning.epsEstimate?.raw;
      const surprise = earning.epsDifference?.raw;
      const surprisePercent = earning.surprisePercent?.raw;

      transcripts.push({
        id: `yahoo-${ticker}-${dateStr}`,
        companyName,
        ticker,
        quarter: extractQuarter(dateStr),
        year: new Date(dateStr).getFullYear(),
        date: dateStr,
        source: "yahoo-finance",
        url: `https://finance.yahoo.com/quote/${ticker}/analysis`,
        summary: epsActual !== undefined 
          ? `EPS: ${epsActual} (Est: ${epsEstimate}), Surprise: ${surprise} (${(surprisePercent * 100).toFixed(1)}%)`
          : `Earnings data for ${ticker}`,
      });
    }

    // Add link to full analysis
    transcripts.push({
      id: `yahoo-analysis-${Date.now()}`,
      companyName,
      ticker,
      quarter: "Analysis",
      year: new Date().getFullYear(),
      date: new Date().toISOString(),
      source: "yahoo-finance",
      url: `https://finance.yahoo.com/quote/${ticker}/analysis`,
      summary: `View full earnings analysis, estimates, and trends for ${ticker}.`,
    });

    return transcripts;
  } catch (error) {
    console.error("Yahoo Finance error:", error);
    // Return link on error
    if (ticker) {
      return [{
        id: `yahoo-fallback-${Date.now()}`,
        companyName,
        ticker,
        quarter: "View",
        year: new Date().getFullYear(),
        date: new Date().toISOString(),
        source: "yahoo-finance",
        url: `https://finance.yahoo.com/quote/${ticker}`,
        summary: `View ${ticker} on Yahoo Finance for earnings and financial data.`,
      }];
    }
    return [];
  }
}

// Alpha Vantage (Earnings data)
async function searchAlphaVantage(ticker: string): Promise<EarningsTranscript[]> {
  if (!ALPHA_VANTAGE_KEY || !ticker) return [];

  try {
    const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json() as any;
    const transcripts: EarningsTranscript[] = [];

    if (data.quarterlyEarnings) {
      for (const earning of data.quarterlyEarnings.slice(0, 4)) {
        const date = new Date(earning.fiscalDateEnding);
        transcripts.push({
          id: `av-${ticker}-${earning.fiscalDateEnding}`,
          companyName: data.symbol || ticker,
          ticker,
          quarter: `Q${Math.ceil((date.getMonth() + 1) / 3)}`,
          year: date.getFullYear(),
          date: earning.fiscalDateEnding,
          source: "alpha-vantage",
          summary: `Reported EPS: ${earning.reportedEPS}, Estimated: ${earning.estimatedEPS}, Surprise: ${earning.surprisePercentage}%`,
        });
      }
    }
    return transcripts;
  } catch (error) {
    console.error("Alpha Vantage error:", error);
    return [];
  }
}

// Helper to add manual search links for companies
function createManualSearchLinks(companyName: string, ticker?: string): EarningsTranscript[] {
  const links: EarningsTranscript[] = [];
  const searchTerm = ticker || companyName;
  const year = new Date().getFullYear();

  // Google search for transcripts
  links.push({
    id: `google-${Date.now()}`,
    companyName,
    ticker,
    quarter: "Search",
    year,
    date: new Date().toISOString(),
    source: "manual",
    url: `https://www.google.com/search?q=${encodeURIComponent(`"${searchTerm}" earnings call transcript ${year}`)}`,
    summary: `Google search for ${companyName} earnings call transcripts.`,
  });

  // Seeking Alpha (no subscription needed to search)
  if (ticker) {
    links.push({
      id: `sa-${Date.now()}`,
      companyName,
      ticker,
      quarter: "View",
      year,
      date: new Date().toISOString(),
      source: "manual",
      url: `https://seekingalpha.com/symbol/${ticker}/earnings/transcripts`,
      summary: `Seeking Alpha transcripts for ${ticker} (may require free account).`,
    });
  }

  // Motley Fool
  links.push({
    id: `fool-${Date.now()}`,
    companyName,
    ticker,
    quarter: "Search",
    year,
    date: new Date().toISOString(),
    source: "manual",
    url: `https://www.fool.com/search/solr.aspx?q=${encodeURIComponent(`${searchTerm} earnings call transcript`)}`,
    summary: `Motley Fool search for ${companyName} transcripts.`,
  });

  return links;
}

function extractQuarter(dateStr: string): string {
  const month = new Date(dateStr).getMonth() + 1;
  return `Q${Math.ceil(month / 3)}`;
}

// Main function
async function earningsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json().catch(() => ({})) as Partial<SearchRequest>;
    const { companyName, ticker, region = "GLOBAL" } = body;

    if (!companyName) {
      return { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "companyName is required" } 
      };
    }

    // Search all sources in parallel
    const searches: Promise<EarningsTranscript[]>[] = [];

    // SEC EDGAR for US companies
    if (region === "US" || region === "GLOBAL") {
      searches.push(searchSECEdgar(companyName, ticker));
    }

    // JSE SENS for South African companies
    if (region === "ZA" || region === "GLOBAL") {
      searches.push(searchJSESens(companyName, ticker));
    }

    // Yahoo Finance for global coverage (if ticker provided)
    if (ticker) {
      searches.push(searchYahooFinance(companyName, ticker));
    }

    // Alpha Vantage if ticker and key available
    if (ticker && ALPHA_VANTAGE_KEY) {
      searches.push(searchAlphaVantage(ticker));
    }

    const results = await Promise.allSettled(searches);
    const allTranscripts: EarningsTranscript[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        allTranscripts.push(...result.value);
      }
    }

    // Add manual search links if we have few results
    if (allTranscripts.length < 3) {
      allTranscripts.push(...createManualSearchLinks(companyName, ticker));
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allTranscripts.filter((t) => {
      const key = t.url || t.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date (most recent first), but keep manual links at end
    unique.sort((a, b) => {
      if (a.source === "manual" && b.source !== "manual") return 1;
      if (a.source !== "manual" && b.source === "manual") return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        transcripts: unique.slice(0, 12),
        sources: {
          secEdgar: region === "US" || region === "GLOBAL",
          jseSens: region === "ZA" || region === "GLOBAL",
          yahooFinance: !!ticker,
          alphaVantage: !!ALPHA_VANTAGE_KEY && !!ticker,
        },
      },
    };
  } catch (error: any) {
    context.error("Earnings search error:", error);
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: "Search failed", details: safeErrorMessage(error, "Search failed") },
    };
  }
}

app.http("earnings", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "earnings/search",
  handler: earningsHandler,
});

// Ticker Lookup Handler
interface TickerLookupRequest {
  companyName: string;
}

interface TickerLookupResult {
  ticker: string;
  name: string;
  exchange?: string;
  region?: string;
  source: "yahoo" | "alpha-vantage";
  confidence: "high" | "medium" | "low";
  score?: number;
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|inc\.|ltd|ltd\.|limited|plc|holdings?|group|corp|corp\.|corporation|co|co\.|company|sa|ag|pty|pty\.|bv|nv)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeNormalized(name: string): string[] {
  const normalized = normalizeCompanyName(name);
  return normalized ? normalized.split(" ").filter(t => t.length >= 2) : [];
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const aSet = new Set(a);
  const bSet = new Set(b);
  let intersection = 0;
  for (const t of aSet) {
    if (bSet.has(t)) intersection++;
  }
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function computeFuzzyScore(queryCompanyName: string, candidateName: string, candidateTicker: string): number {
  const q = normalizeCompanyName(queryCompanyName);
  const c = normalizeCompanyName(candidateName);

  if (!q || !c) return 0;

  const tokenScore = jaccardSimilarity(tokenizeNormalized(q), tokenizeNormalized(c));
  const includesBonus = (c.includes(q) || q.includes(c)) ? 0.25 : 0;
  const startsWithBonus = c.startsWith(q) ? 0.15 : 0;
  const tickerBonus = candidateTicker && q.replace(/\s/g, "").includes(candidateTicker.toLowerCase()) ? 0.15 : 0;

  return Math.max(0, Math.min(1, tokenScore + includesBonus + startsWithBonus + tickerBonus));
}

async function lookupTickerYahoo(companyName: string): Promise<TickerLookupResult[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}&quotesCount=10&newsCount=0`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "KARABO Discovery Tool",
      },
    });

    if (!response.ok) return [];

    const data = await response.json() as any;
    const results: TickerLookupResult[] = [];

    if (data.quotes) {
      for (const quote of data.quotes.slice(0, 5)) {
        if (quote.symbol && quote.shortname) {
          // Determine confidence based on name match
          const nameLower = companyName.toLowerCase();
          const quoteName = (quote.shortname || quote.longname || "").toLowerCase();
          let confidence: "high" | "medium" | "low" = "low";
          
          if (quoteName.includes(nameLower) || nameLower.includes(quoteName)) {
            confidence = "high";
          } else if (quoteName.split(" ").some((word: string) => nameLower.includes(word) && word.length > 3)) {
            confidence = "medium";
          }

          // Determine region from exchange
          let region = "GLOBAL";
          const exchange = quote.exchange || "";
          if (exchange.includes("JSE") || quote.symbol.endsWith(".JO")) {
            region = "ZA";
          } else if (["NMS", "NYQ", "NGM", "NYE"].includes(exchange)) {
            region = "US";
          } else if (["LSE", "FRA", "PAR"].includes(exchange)) {
            region = "EU";
          }

          results.push({
            ticker: quote.symbol,
            name: quote.shortname || quote.longname || quote.symbol,
            exchange: quote.exchange,
            region,
            source: "yahoo",
            confidence,
            score: undefined,
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Yahoo ticker lookup error:", error);
    return [];
  }
}

async function lookupTickerAlphaVantage(companyName: string): Promise<TickerLookupResult[]> {
  if (!ALPHA_VANTAGE_KEY) return [];

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(companyName)}&apikey=${ALPHA_VANTAGE_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json() as any;
    const results: TickerLookupResult[] = [];

    if (data.bestMatches) {
      for (const match of data.bestMatches.slice(0, 5)) {
        const matchScore = parseFloat(match["9. matchScore"] || "0");
        let confidence: "high" | "medium" | "low" = "low";
        
        if (matchScore >= 0.8) confidence = "high";
        else if (matchScore >= 0.5) confidence = "medium";

        // Determine region
        const region = match["4. region"] || "GLOBAL";
        let regionCode = "GLOBAL";
        if (region.includes("United States")) regionCode = "US";
        else if (region.includes("South Africa")) regionCode = "ZA";
        else if (region.includes("Europe") || region.includes("United Kingdom")) regionCode = "EU";

        results.push({
          ticker: match["1. symbol"],
          name: match["2. name"],
          exchange: match["4. region"],
          region: regionCode,
          source: "alpha-vantage",
          confidence,
          score: isFinite(matchScore) ? Math.max(0, Math.min(1, matchScore)) : undefined,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Alpha Vantage ticker lookup error:", error);
    return [];
  }
}

async function tickerLookupHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json().catch(() => ({})) as Partial<TickerLookupRequest>;
    const { companyName } = body;

    if (!companyName || companyName.trim().length < 2) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "companyName is required (min 2 characters)" },
      };
    }

    // Query both sources in parallel
    const [yahooResults, alphaResults] = await Promise.allSettled([
      lookupTickerYahoo(companyName),
      lookupTickerAlphaVantage(companyName),
    ]);

    const allResults: TickerLookupResult[] = [];

    if (yahooResults.status === "fulfilled") {
      allResults.push(...yahooResults.value);
    }
    if (alphaResults.status === "fulfilled") {
      allResults.push(...alphaResults.value);
    }

    // Deduplicate by ticker symbol, prefer higher confidence
    const uniqueMap = new Map<string, TickerLookupResult>();
    for (const result of allResults) {
      const existing = uniqueMap.get(result.ticker);
      if (!existing || result.confidence === "high") {
        uniqueMap.set(result.ticker, result);
      }
    }

    const unique = Array.from(uniqueMap.values());

    // Compute fuzzy score for ranking (prefer Alpha matchScore where available)
    for (const r of unique) {
      if (typeof r.score !== "number") {
        r.score = computeFuzzyScore(companyName, r.name, r.ticker);
      }
      // Derive confidence from score if not already strong
      if (r.confidence === "low") {
        if ((r.score ?? 0) >= 0.85) r.confidence = "high";
        else if ((r.score ?? 0) >= 0.65) r.confidence = "medium";
      }
    }

    // Sort by score, then confidence, then source (Yahoo first, then Alpha Vantage)
    unique.sort((a, b) => {
      const aScore = typeof a.score === "number" ? a.score : 0;
      const bScore = typeof b.score === "number" ? b.score : 0;
      if (bScore !== aScore) return bScore - aScore;

      const confidenceOrder = { high: 3, medium: 2, low: 1 } as const;
      const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confDiff !== 0) return confDiff;

      if (a.source === b.source) return 0;
      return a.source === "yahoo" ? -1 : 1;
    });

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        tickers: unique.slice(0, 10),
      },
    };
  } catch (error: any) {
    context.error("Ticker lookup error:", error);
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: "Ticker lookup failed", details: safeErrorMessage(error, "Ticker lookup failed") },
    };
  }
}

app.http("ticker-lookup", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "earnings/ticker-lookup",
  handler: tickerLookupHandler,
});

// ============================================================================
// FINANCIAL STATEMENTS HANDLER
// ============================================================================
interface FinancialsRequest {
  ticker: string;
}

async function financialsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json().catch(() => ({})) as Partial<FinancialsRequest>;
    const { ticker } = body;

    if (!ticker) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "ticker is required" },
      };
    }

    const statements: any[] = [];
    let summary = '';

    // Fetch from Alpha Vantage
    if (ALPHA_VANTAGE_KEY) {
      try {
        // Income Statement
        const incomeUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`;
        const incomeRes = await fetch(incomeUrl);
        const incomeData = await incomeRes.json() as any;

        // Balance Sheet
        const balanceUrl = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_KEY}`;
        const balanceRes = await fetch(balanceUrl);
        const balanceData = await balanceRes.json() as any;

        // Parse annual reports
        const annualReports = incomeData.annualReports || [];
        const balanceReports = balanceData.annualReports || [];

        if (annualReports.length > 0) {
          const latest = annualReports[0];
          const latestBalance = balanceReports[0] || {};
          
          const revenue = parseInt(latest.totalRevenue || '0');
          const netIncome = parseInt(latest.netIncome || '0');
          const totalAssets = parseInt(latestBalance.totalAssets || '0');
          const totalLiabilities = parseInt(latestBalance.totalLiabilities || '0');

          statements.push({
            ticker,
            fiscalYear: parseInt(latest.fiscalDateEnding?.substring(0, 4) || '2024'),
            revenue,
            netIncome,
            totalAssets,
            totalLiabilities,
            source: 'alpha-vantage',
          });

          // Format currency
          const formatNum = (num: number) => {
            if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
            if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
            return `$${num.toLocaleString()}`;
          };

          summary = `${ticker} reported ${formatNum(revenue)} in revenue with ${formatNum(netIncome)} net income. Total assets: ${formatNum(totalAssets)}.`;
        }
      } catch (error) {
        console.error('Alpha Vantage financials error:', error);
      }
    }

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { statements, summary },
    };
  } catch (error: any) {
    context.error("Financials fetch error:", error);
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: "Failed to fetch financials", details: safeErrorMessage(error, "Failed to fetch financials") },
    };
  }
}

app.http("financials", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "earnings/financials",
  handler: financialsHandler,
});

// ============================================================================
// NEWS HANDLER
// ============================================================================
interface NewsRequest {
  companyName: string;
  ticker?: string;
}

async function newsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json().catch(() => ({})) as Partial<NewsRequest>;
    const { companyName, ticker } = body;

    if (!companyName) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "companyName is required" },
      };
    }

    const articles: any[] = [];
    let summary = '';

    // Fetch from Alpha Vantage News API
    if (ALPHA_VANTAGE_KEY) {
      try {
        const searchTerm = ticker || companyName;
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(searchTerm)}&apikey=${ALPHA_VANTAGE_KEY}&limit=20&sort=LATEST`;
        
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.feed) {
          for (const item of data.feed.slice(0, 15)) {
            const sentiment = (item.overall_sentiment_label || 'Neutral').toLowerCase();
            articles.push({
              id: item.url || `news-${Date.now()}-${Math.random()}`,
              title: item.title,
              source: item.source,
              url: item.url,
              publishedAt: item.time_published,
              summary: item.summary || item.title,
              sentiment: sentiment === 'bullish' || sentiment === 'positive' ? 'positive' 
                       : sentiment === 'bearish' || sentiment === 'negative' ? 'negative' 
                       : 'neutral',
            });
          }

          summary = `Found ${articles.length} recent news articles about ${companyName}.`;
        }
      } catch (error) {
        console.error('News fetch error:', error);
      }
    }

    // If no news found, return empty but valid response
    if (articles.length === 0) {
      summary = `No recent news articles found for ${companyName}.`;
    }

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { articles, summary },
    };
  } catch (error: any) {
    context.error("News fetch error:", error);
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: "Failed to fetch news", details: safeErrorMessage(error, "Failed to fetch news") },
    };
  }
}

app.http("news", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "earnings/news",
  handler: newsHandler,
});

// ============================================================================
// INDUSTRY RESEARCH HANDLER
// ============================================================================
interface IndustryResearchRequest {
  industry: string;
  companyName: string;
}

function getIndustryInsights(industry: string): any[] {
  const insights: Record<string, any[]> = {
    'healthcare': [
      { id: '1', category: 'regulation', title: 'HIPAA Compliance', description: 'Health Insurance Portability and Accountability Act requirements for patient data protection', source: 'HHS.gov', relevanceScore: 10 },
      { id: '2', category: 'trend', title: 'AI in Medical Diagnostics', description: 'Growing adoption of AI and machine learning for medical imaging analysis and disease diagnosis', source: 'Healthcare IT News', relevanceScore: 9 },
      { id: '3', category: 'standard', title: 'HL7 FHIR Standard', description: 'Fast Healthcare Interoperability Resources for healthcare data exchange', source: 'HL7.org', relevanceScore: 8 },
      { id: '4', category: 'trend', title: 'Telemedicine Growth', description: 'Accelerated adoption of virtual care and remote patient monitoring', source: 'Industry Report', relevanceScore: 8 },
    ],
    'financial-services': [
      { id: '1', category: 'regulation', title: 'SOX Compliance', description: 'Sarbanes-Oxley Act requirements for financial reporting and internal controls', source: 'SEC.gov', relevanceScore: 10 },
      { id: '2', category: 'trend', title: 'Open Banking APIs', description: 'API-driven financial services enabling third-party access to banking data', source: 'Fintech Report', relevanceScore: 9 },
      { id: '3', category: 'regulation', title: 'PCI-DSS', description: 'Payment Card Industry Data Security Standard for payment processing', source: 'PCI Security Standards Council', relevanceScore: 9 },
      { id: '4', category: 'trend', title: 'AI Fraud Detection', description: 'Machine learning models for real-time fraud detection and prevention', source: 'Financial Technology', relevanceScore: 8 },
    ],
    'manufacturing': [
      { id: '1', category: 'standard', title: 'ISO 9001 Quality Management', description: 'International standard for quality management systems', source: 'ISO.org', relevanceScore: 9 },
      { id: '2', category: 'trend', title: 'Industry 4.0', description: 'Smart manufacturing with IoT, AI, and automation', source: 'Manufacturing Today', relevanceScore: 10 },
      { id: '3', category: 'trend', title: 'Predictive Maintenance', description: 'AI-powered predictive maintenance to reduce downtime', source: 'Industry Report', relevanceScore: 9 },
      { id: '4', category: 'standard', title: 'OPC UA Protocol', description: 'Open Platform Communications Unified Architecture for industrial automation', source: 'OPC Foundation', relevanceScore: 7 },
    ],
    'retail': [
      { id: '1', category: 'trend', title: 'Omnichannel Commerce', description: 'Seamless integration of online and offline retail experiences', source: 'Retail Dive', relevanceScore: 9 },
      { id: '2', category: 'trend', title: 'AI-Powered Personalization', description: 'Machine learning for personalized product recommendations', source: 'Retail Technology', relevanceScore: 8 },
      { id: '3', category: 'standard', title: 'PCI-DSS Compliance', description: 'Payment card data security for retail transactions', source: 'PCI SSC', relevanceScore: 9 },
      { id: '4', category: 'trend', title: 'Supply Chain Visibility', description: 'Real-time tracking and optimization of supply chain operations', source: 'Supply Chain Management', relevanceScore: 8 },
    ],
    'energy': [
      { id: '1', category: 'regulation', title: 'NERC CIP Standards', description: 'Critical Infrastructure Protection standards for power grid cybersecurity', source: 'NERC', relevanceScore: 10 },
      { id: '2', category: 'trend', title: 'Smart Grid Technology', description: 'Digital transformation of electrical grid with IoT and AI', source: 'Energy Magazine', relevanceScore: 9 },
      { id: '3', category: 'trend', title: 'Renewable Energy Integration', description: 'AI optimization for renewable energy sources and storage', source: 'Clean Energy Report', relevanceScore: 8 },
      { id: '4', category: 'standard', title: 'ISO 50001 Energy Management', description: 'International standard for energy management systems', source: 'ISO.org', relevanceScore: 7 },
    ],
  };

  return insights[industry] || [
    { id: '1', category: 'trend', title: 'Digital Transformation', description: 'Organizations adopting cloud, AI, and automation technologies', source: 'Industry Research', relevanceScore: 8 },
    { id: '2', category: 'trend', title: 'Data Analytics', description: 'Growing focus on data-driven decision making', source: 'Technology Trends', relevanceScore: 7 },
  ];
}

async function industryResearchHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json().catch(() => ({})) as Partial<IndustryResearchRequest>;
    const { industry, companyName } = body;

    if (!industry) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "industry is required" },
      };
    }

    // Get curated insights based on industry
    const insights = getIndustryInsights(industry);
    const summary = `Key trends, standards, and regulations for ${industry} industry.`;

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { insights, summary },
    };
  } catch (error: any) {
    context.error("Industry research error:", error);
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: "Failed to fetch industry research", details: safeErrorMessage(error, "Failed to fetch industry research") },
    };
  }
}

app.http("industry-research", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "earnings/industry-research",
  handler: industryResearchHandler,
});
