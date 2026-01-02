import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

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

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
      jsonBody: { error: "Search failed", details: error.message },
    };
  }
}

app.http("earnings", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "earnings/search",
  handler: earningsHandler,
});
