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
 * Company filings watcher reader.
 *
 * Serves regulatory filings for a company from Blob Storage (written by the
 * `karabo-filings-monitor` Logic App as `{company}-filings-<timestamp>.xml`),
 * and transparently falls back to **live** sources when no cached blob exists:
 *   • SEC EDGAR  — official US filings Atom feed (per company).
 *   • JSE / SENS — South-African announcements via a Google-News proxy query.
 *
 * Always returns HTTP 200 (with a diagnostic `message` on degraded paths) so the
 * UI renders an empty state rather than a hard error.
 */

function getStorageConnectionString(): string | undefined {
  return (process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage)?.trim();
}

const CONTAINER_NAME = "filings";
const corsHeaders = makeCorsHeaders("GET, OPTIONS");
const FETCH_TIMEOUT_MS = 8000;

function companyPrefix(company: string): string {
  return company
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch live filings: SEC EDGAR (official US) + a JSE/SENS Google-News proxy (South Africa). */
async function fetchLiveFilings(company: string, context: InvocationContext): Promise<RSSItem[]> {
  const q = encodeURIComponent(company);

  // SEC EDGAR requires a descriptive User-Agent with contact info.
  const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${q}&type=&dateb=&owner=include&count=40&output=atom`;
  const jseUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    `${company} SENS JSE announcement`,
  )}&hl=en-ZA&gl=ZA&ceid=ZA:en`;

  const [secRes, jseRes] = await Promise.allSettled([
    fetchWithTimeout(secUrl, {
      "User-Agent": "KARABO-Research/1.0 (research@karabo.app)",
      Accept: "application/atom+xml, application/xml, text/xml, */*",
    }),
    fetchWithTimeout(jseUrl, {
      "User-Agent": "Mozilla/5.0 (compatible; KARABO/1.0; +https://karabo.app)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    }),
  ]);

  const items: RSSItem[] = [];
  if (secRes.status === "fulfilled") {
    try {
      for (const it of parseRSSItems(secRes.value)) {
        items.push({ ...it, title: it.title.startsWith("[") ? it.title : `[SEC] ${it.title}` });
      }
    } catch (e: any) {
      context.warn(`filings: SEC parse failed: ${e?.message ?? "unknown"}`);
    }
  } else {
    context.warn(`filings: SEC fetch failed: ${secRes.reason?.message ?? "unknown"}`);
  }
  if (jseRes.status === "fulfilled") {
    try {
      for (const it of parseRSSItems(jseRes.value)) {
        items.push({ ...it, title: it.title.startsWith("[") ? it.title : `[JSE] ${it.title}` });
      }
    } catch (e: any) {
      context.warn(`filings: JSE parse failed: ${e?.message ?? "unknown"}`);
    }
  } else {
    context.warn(`filings: JSE fetch failed: ${jseRes.reason?.message ?? "unknown"}`);
  }

  // De-dupe by link.
  const seen = new Set<string>();
  return items.filter((it) => {
    const key = (it.link || it.title).trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function filingsFeedsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === "OPTIONS") return { status: 204, headers: corsHeaders };

  const ok = (jsonBody: unknown): HttpResponseInit => ({
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    jsonBody,
  });

  const company = (req.query.get("company") || "").trim();
  const prefix = companyPrefix(company);
  const conn = getStorageConnectionString();

  const liveFallback = async (reason: string): Promise<HttpResponseInit> => {
    if (!company) return ok({ items: [], message: reason });
    try {
      const items = await fetchLiveFilings(company, context);
      return ok({
        items,
        company,
        source: "live",
        message: items.length ? undefined : `No filings found for "${company}" (SEC EDGAR + JSE).`,
      });
    } catch (e) {
      return ok({ items: [], company, source: "live", message: `Live filings fetch failed: ${safeErrorMessage(e, "unknown")}` });
    }
  };

  // No storage configured → straight to live.
  if (!conn) return liveFallback("Filings storage not configured; using live SEC EDGAR + JSE.");

  try {
    const svc = BlobServiceClient.fromConnectionString(conn);
    const container = svc.getContainerClient(CONTAINER_NAME);

    let containerExists: boolean;
    try {
      containerExists = await Promise.race([
        container.exists(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Storage connectivity timeout (3s)")), 3000)),
      ]);
    } catch (connError: any) {
      context.warn("filings: storage unreachable:", connError.message);
      return liveFallback("Storage unavailable; using live SEC EDGAR + JSE.");
    }

    if (!containerExists) {
      return liveFallback("Filings container not found yet; using live SEC EDGAR + JSE.");
    }

    // Newest blob for the company.
    const blobs: Array<{ name: string; lastModified: Date }> = [];
    for await (const blob of container.listBlobsFlat()) {
      if (prefix && !blob.name.toLowerCase().startsWith(prefix + "-filings-")) continue;
      blobs.push({ name: blob.name, lastModified: blob.properties.lastModified || new Date(0) });
    }
    if (blobs.length === 0) {
      return liveFallback(`No cached filings for "${company}" yet; using live SEC EDGAR + JSE.`);
    }
    blobs.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    const latest = blobs[0];

    const dl = await container.getBlobClient(latest.name).download();
    if (!dl.readableStreamBody) return liveFallback("Cached filings blob was empty; using live SEC EDGAR + JSE.");
    const xml = await streamToString(dl.readableStreamBody);
    const items = parseRSSItems(xml);

    if (items.length === 0) {
      return liveFallback("Cached filings blob had no parsable items; using live SEC EDGAR + JSE.");
    }

    return ok({
      items,
      company: company || null,
      source: "cache",
      blobName: latest.name,
      lastModified: latest.lastModified.toISOString(),
      totalBlobs: blobs.length,
    });
  } catch (error) {
    context.error("filings-feeds error (falling back to live):", error);
    return liveFallback(`Filings read failed: ${safeErrorMessage(error, "unknown")}`);
  }
}

app.http("filings-feeds", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "filings-feeds",
  handler: filingsFeedsHandler,
});
