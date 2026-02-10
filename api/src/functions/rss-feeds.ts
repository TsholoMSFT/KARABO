import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import {
  makeCorsHeaders,
  safeErrorMessage,
  streamToString,
  parseRSSItems,
  type RSSItem,
} from "../lib/xml-utils";

/**
 * Azure Function to fetch RSS feeds from Blob Storage
 * RSS data is stored by the karabo-rss-monitor Logic App
 */

function getStorageConnectionString(): string | undefined {
  return (process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage)?.trim();
}
const CONTAINER_NAME = "rss-feeds";
const corsHeaders = makeCorsHeaders("GET, OPTIONS");

/**
 * Fetch live RSS from Google News when no cached data exists
 */
async function fetchLiveRSS(companyName: string, context: InvocationContext): Promise<RSSItem[]> {
  const query = encodeURIComponent(companyName);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  
  context.log(`Fetching live RSS for "${companyName}" from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KARABO/1.0; +https://karabo.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlContent = await response.text();
    const items = parseRSSItems(xmlContent);
    
    context.log(`Fetched ${items.length} live RSS items for "${companyName}"`);
    return items;
  } catch (error: any) {
    context.error(`Failed to fetch live RSS for "${companyName}":`, error);
    throw error;
  }
}

async function rssFeedsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  // Get company filter from query parameter
  const companyParam = req.query.get("company") || "";
  const companyPrefix = companyParam
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const storageConnectionString = getStorageConnectionString();

  // Check if storage is configured
  if (!storageConnectionString) {
    context.warn("Azure Storage not configured - returning empty RSS");
    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { 
        items: [], 
        message:
          "RSS storage not configured. Add AZURE_STORAGE_CONNECTION_STRING (preferred) or AzureWebJobsStorage to the environment.",
      },
    };
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Check if container exists
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { items: [], message: "RSS container not found" },
      };
    }

    // Get all blobs, optionally filtered by company prefix
    const blobs: Array<{ name: string; lastModified: Date }> = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      // Filter by company prefix if provided
      if (companyPrefix && !blob.name.toLowerCase().startsWith(companyPrefix + "-news-")) {
        continue;
      }
      blobs.push({
        name: blob.name,
        lastModified: blob.properties.lastModified || new Date(0),
      });
    }

    if (blobs.length === 0) {
      // No cached blobs found - try live RSS fetch if company specified
      if (companyParam) {
        context.log(`No cached RSS for "${companyParam}", fetching live...`);
        try {
          const liveItems = await fetchLiveRSS(companyParam, context);
          return {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            jsonBody: {
              items: liveItems,
              message: `Live RSS fetched for "${companyParam}" (not cached yet)`,
              company: companyParam,
              source: "live",
              totalBlobs: 0,
            },
          };
        } catch (liveError: any) {
          context.error(`Live RSS fetch failed for "${companyParam}":`, liveError);
          return {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            jsonBody: {
              items: [],
              message: `No cached RSS for "${companyParam}" and live fetch failed: ${liveError.message}`,
              company: companyParam,
              source: "none",
            },
          };
        }
      }
      
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { items: [], message: "No RSS feeds found. Specify a company or run the Logic App first.", company: null },
      };
    }

    // Sort by last modified, get the newest
    blobs.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    const latestBlob = blobs[0];

    context.log(`Reading RSS from blob: ${latestBlob.name}`);

    // Download the blob content
    const blobClient = containerClient.getBlobClient(latestBlob.name);
    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("No stream body in blob response");
    }

    const xmlContent = await streamToString(downloadResponse.readableStreamBody);

    const diagnostics = {
      sizeBytes: Buffer.byteLength(xmlContent, "utf8"),
      hasRss: /<rss\b/i.test(xmlContent),
      hasChannel: /<channel\b/i.test(xmlContent),
      hasAtomFeed: /<feed\b/i.test(xmlContent),
      itemTagCount: (xmlContent.match(/<item\b/gi) || []).length,
      entryTagCount: (xmlContent.match(/<entry\b/gi) || []).length,
    };

    // Parse RSS XML
    const items = parseRSSItems(xmlContent);

    context.log(`Parsed ${items.length} RSS items from ${latestBlob.name}`);

    const message =
      items.length > 0
        ? undefined
        : diagnostics.hasRss || diagnostics.hasAtomFeed
          ? "RSS blob downloaded but contained no parsable items. Verify the Logic App is writing raw RSS/Atom XML (with <item> or <entry>) into the 'rss-feeds' container."
          : "Latest blob does not appear to be RSS/Atom XML. Verify the Logic App is writing the RSS XML body to Blob Storage (not JSON, HTML, or a status payload).";

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        items,
        message,
        company: companyParam || null,
        source: "cache",
        blobName: latestBlob.name,
        lastModified: latestBlob.lastModified.toISOString(),
        totalBlobs: blobs.length,
        diagnostics,
      },
    };
  } catch (error: any) {
    context.error("RSS feeds error:", error);

    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { 
        error: "Failed to fetch RSS feeds", 
        details: safeErrorMessage(error, "Failed to fetch RSS feeds"),
      },
    };
  }
}

app.http("rss-feeds", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "rss-feeds",
  handler: rssFeedsHandler,
});
