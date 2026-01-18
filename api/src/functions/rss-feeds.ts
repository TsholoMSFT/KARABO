import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Azure Function to fetch RSS feeds from Blob Storage
 * RSS data is stored by the karabo-rss-monitor Logic App
 */

function getStorageConnectionString(): string | undefined {
  // Prefer explicit connection string for this function, but fall back to
  // the standard Azure Functions storage setting to avoid surprising empty RSS.
  return (process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage)?.trim();
}
const CONTAINER_NAME = "rss-feeds";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

async function rssFeedsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

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

    // Get all blobs and find the most recent
    const blobs: Array<{ name: string; lastModified: Date }> = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        lastModified: blob.properties.lastModified || new Date(0),
      });
    }

    if (blobs.length === 0) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { items: [], message: "No RSS feeds found. Run the Logic App first." },
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

    // Parse RSS XML
    const items = parseRSSItems(xmlContent);

    context.log(`Parsed ${items.length} RSS items from ${latestBlob.name}`);

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        items,
        blobName: latestBlob.name,
        lastModified: latestBlob.lastModified.toISOString(),
        totalBlobs: blobs.length,
      },
    };
  } catch (error: any) {
    context.error("RSS feeds error:", error);

    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { 
        error: "Failed to fetch RSS feeds", 
        details: error.message 
      },
    };
  }
}

/**
 * Convert a readable stream to string
 */
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Parse RSS XML content into structured items
 */
function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // RSS 2.0 (<item>) and Atom (<entry>) support.
  // We intentionally keep parsing lightweight (regex-based) because the input
  // is trusted internal blob content and we want to avoid heavy XML deps.
  const blocks: Array<{ kind: "rss" | "atom"; xml: string }> = [];
  const rssItemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  const atomEntryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;

  while ((match = rssItemRegex.exec(xml)) !== null) {
    blocks.push({ kind: "rss", xml: match[1] });
  }

  while ((match = atomEntryRegex.exec(xml)) !== null) {
    blocks.push({ kind: "atom", xml: match[1] });
  }

  for (const block of blocks) {
    const title = extractTag(block.xml, "title") || "Untitled";

    const descriptionRaw =
      extractTag(block.xml, "description") ||
      extractTag(block.xml, "summary") ||
      extractTag(block.xml, "content:encoded") ||
      extractTag(block.xml, "content");

    const link =
      extractTag(block.xml, "link") ||
      extractLinkHref(block.xml) ||
      "";

    const pubDate =
      extractTag(block.xml, "pubDate") ||
      extractTag(block.xml, "published") ||
      extractTag(block.xml, "updated") ||
      extractTag(block.xml, "dc:date") ||
      new Date().toISOString();

    items.push({
      title,
      description: stripHtml(descriptionRaw),
      link,
      pubDate,
    });
  }

  return items;
}

/**
 * Atom feeds often use: <link href="https://..." rel="alternate" />
 */
function extractLinkHref(xml: string): string {
  const linkTagRegex = /<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i;
  const match = xml.match(linkTagRegex);
  return match ? match[1].trim() : "";
}

/**
 * Extract content from an XML tag, handling CDATA
 */
function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Try regular tag
  const regularRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const regularMatch = xml.match(regularRegex);
  if (regularMatch) {
    return regularMatch[1].trim();
  }

  return "";
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

app.http("rss-feeds", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "rss-feeds",
  handler: rssFeedsHandler,
});
