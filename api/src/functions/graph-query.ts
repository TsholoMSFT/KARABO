import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";
import { getBearerToken, notConfiguredBody } from "../lib/iq-credential";

/**
 * /api/graph-query — Microsoft Graph proxy.
 *
 * Modes (?mode=):
 *   - people    → /me/people or /users?$search   (delegated or app)
 *   - files     → /me/drive/root/search(q='…')   (delegated)
 *   - messages  → /me/messages?$search='…'        (delegated, requires Mail.Read)
 *   - search    → POST /search/query (universal Graph search; works app or delegated)
 *   - org       → /organization                   (app)
 *
 * Auth: app-only via service principal (AZURE_TENANT_ID/CLIENT_ID/CLIENT_SECRET)
 * with Microsoft Graph application permissions, OR delegated when an upstream
 * SWA easyAuth/OBO token is forwarded as `x-graph-bearer` header (advanced).
 *
 * The first MVP supports app-only and "search" mode reliably; other modes
 * require Mail.Read/Files.Read.All app permissions to be granted.
 */

const corsHeaders = makeCorsHeaders("GET, POST, OPTIONS");
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

interface GraphResponse {
  configured: boolean;
  mode: string;
  results: any[];
  raw?: any;
  source: string;
  fetchedAt: string;
}

async function callGraph(method: string, path: string, body: any, forwardedToken?: string): Promise<{ status: number; data: any }> {
  const token = forwardedToken || (await getBearerToken(GRAPH_SCOPE));
  if (!token) {
    return { status: 401, data: { error: "No Graph access token available" } };
  }
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ConsistencyLevel: "eventual",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function graphHandler(request: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return { status: 204, headers: corsHeaders };
  try {
    const mode = (request.query.get("mode") || "search").toLowerCase();
    const q = request.query.get("q") || "";
    const top = Math.min(Number(request.query.get("top") || 10), 25);
    const forwarded = request.headers.get("x-graph-bearer") || undefined;

    const tokenAvailable = forwarded || (await getBearerToken(GRAPH_SCOPE));
    if (!tokenAvailable) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: notConfiguredBody(
          "Microsoft Graph",
          ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"],
          "https://learn.microsoft.com/graph/auth-v2-service",
        ),
      };
    }

    let results: any[] = [];
    let raw: any = undefined;

    if (mode === "search") {
      // Universal search across messages, driveItem, listItem, person, etc.
      const entityTypes = (request.query.get("entityTypes") || "message,driveItem,person,listItem")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        requests: [
          {
            entityTypes,
            query: { queryString: q || "*" },
            from: 0,
            size: top,
          },
        ],
      };
      const r = await callGraph("POST", "/search/query", body, forwarded);
      raw = r.data;
      const hitsContainers = r.data?.value?.[0]?.hitsContainers || [];
      for (const hc of hitsContainers) {
        for (const h of hc.hits || []) {
          results.push({
            id: h.hitId,
            entityType: h._summary?.entityType || hc.entityType || "unknown",
            title: h.resource?.subject || h.resource?.name || h.resource?.displayName || h.summary,
            snippet: h.summary || h.resource?.bodyPreview,
            url: h.resource?.webUrl || h.resource?.webLink,
            lastModified: h.resource?.lastModifiedDateTime,
          });
        }
      }
    } else if (mode === "people") {
      const path = q ? `/me/people?$search="${encodeURIComponent(q)}"&$top=${top}` : `/me/people?$top=${top}`;
      const r = await callGraph("GET", path, undefined, forwarded);
      raw = r.data;
      results = (r.data?.value || []).map((p: any) => ({
        id: p.id,
        title: p.displayName,
        snippet: p.jobTitle ? `${p.jobTitle}${p.companyName ? " · " + p.companyName : ""}` : p.companyName,
        url: undefined,
        emails: (p.scoredEmailAddresses || []).map((e: any) => e.address),
      }));
    } else if (mode === "files") {
      const r = await callGraph("GET", `/me/drive/root/search(q='${encodeURIComponent(q)}')?$top=${top}`, undefined, forwarded);
      raw = r.data;
      results = (r.data?.value || []).map((f: any) => ({
        id: f.id,
        title: f.name,
        snippet: f.parentReference?.path,
        url: f.webUrl,
        lastModified: f.lastModifiedDateTime,
      }));
    } else if (mode === "messages") {
      const path = `/me/messages?$search="${encodeURIComponent(q)}"&$top=${top}`;
      const r = await callGraph("GET", path, undefined, forwarded);
      raw = r.data;
      results = (r.data?.value || []).map((m: any) => ({
        id: m.id,
        title: m.subject,
        snippet: m.bodyPreview,
        url: m.webLink,
        from: m.from?.emailAddress?.address,
        lastModified: m.receivedDateTime,
      }));
    } else if (mode === "org") {
      const r = await callGraph("GET", `/organization`, undefined, forwarded);
      raw = r.data;
      results = (r.data?.value || []).map((o: any) => ({
        id: o.id,
        title: o.displayName,
        snippet: `${o.country || ""} · ${o.verifiedDomains?.[0]?.name || ""}`.trim(),
      }));
    } else {
      return { status: 400, headers: corsHeaders, jsonBody: { error: `Unknown mode: ${mode}` } };
    }

    const payload: GraphResponse = {
      configured: true,
      mode,
      results,
      raw: request.query.get("raw") === "1" ? raw : undefined,
      source: "Microsoft Graph",
      fetchedAt: new Date().toISOString(),
    };

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: payload,
    };
  } catch (err) {
    return { status: 502, headers: corsHeaders, jsonBody: { error: safeErrorMessage(err, "Graph query failed") } };
  }
}

app.http("graph-query", {
  route: "graph-query",
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: graphHandler,
});
