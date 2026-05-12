import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";
import { getBearerToken, notConfiguredBody } from "../lib/iq-credential";

/**
 * /api/work-iq — Work IQ via Microsoft Graph Connectors + Copilot retrieval.
 *
 * Modes (?mode=):
 *   - connections   → list Graph connector connections in tenant
 *   - schemas       → GET schema for ?connectionId=
 *   - retrieval     → POST /copilot/retrieval (semantic + ranking over connector content)
 *
 * Required env: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET (or MI)
 *               with Microsoft Graph application permissions:
 *                  ExternalConnection.Read.All / ExternalItem.Read.All
 *                  (and Copilot.Retrieval for retrieval mode if available)
 */

const corsHeaders = makeCorsHeaders("GET, POST, OPTIONS");
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function workHandler(request: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return { status: 204, headers: corsHeaders };
  try {
    const token = await getBearerToken(GRAPH_SCOPE);
    if (!token) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: notConfiguredBody(
          "Work IQ (Graph Connectors + Copilot retrieval)",
          ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"],
          "https://learn.microsoft.com/graph/connecting-external-content-connectors-overview",
        ),
      };
    }

    const mode = (request.query.get("mode") || "connections").toLowerCase();

    if (mode === "connections") {
      const res = await fetch(`${GRAPH_BASE}/external/connections`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({})) as any;
      if (!res.ok) {
        return { status: res.status, headers: corsHeaders, jsonBody: { error: `Graph connections HTTP ${res.status}`, hint: "Grant 'ExternalConnection.Read.All' application permission to the SP." } };
      }
      const items = (data?.value || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        state: c.state,
      }));
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, results: items, source: "Microsoft Graph Connectors", fetchedAt: new Date().toISOString() } };
    }

    if (mode === "schemas") {
      const connectionId = request.query.get("connectionId");
      if (!connectionId) return { status: 400, headers: corsHeaders, jsonBody: { error: "connectionId required" } };
      const res = await fetch(`${GRAPH_BASE}/external/connections/${encodeURIComponent(connectionId)}/schema`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({})) as any;
      if (!res.ok) {
        return { status: res.status, headers: corsHeaders, jsonBody: { error: `Schema HTTP ${res.status}` } };
      }
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, results: data?.properties || [], raw: data, source: "Microsoft Graph Connectors", fetchedAt: new Date().toISOString() } };
    }

    if (mode === "retrieval") {
      let body: any = null;
      try { body = await request.json(); } catch { body = null; }
      const q = body?.query || request.query.get("q") || "";
      const dataSource = body?.dataSource || "external"; // 'external' = Graph connectors index
      const top = Math.min(Number(body?.top || request.query.get("top") || 10), 25);
      const res = await fetch(`${GRAPH_BASE}/copilot/retrieval`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          queryString: q,
          dataSource,
          resourceMetadata: ["title", "url", "lastModifiedDateTime"],
          maximumNumberOfResults: top,
        }),
      });
      const data = await res.json().catch(() => ({})) as any;
      if (!res.ok) {
        return { status: res.status, headers: corsHeaders, jsonBody: { error: `Copilot retrieval HTTP ${res.status}`, hint: "Endpoint requires Microsoft 365 Copilot license + appropriate Graph permissions." } };
      }
      const hits = (data?.retrievalHits || []).map((h: any, i: number) => ({
        id: h.webUrl || `wiq-${i}`,
        title: h.resourceMetadata?.title,
        snippet: (h.extracts || []).map((e: any) => e.text).join(" … "),
        url: h.webUrl || h.resourceMetadata?.url,
        lastModified: h.resourceMetadata?.lastModifiedDateTime,
      }));
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, query: q, results: hits, source: "Work IQ (Copilot retrieval)", fetchedAt: new Date().toISOString() } };
    }

    return { status: 400, headers: corsHeaders, jsonBody: { error: `Unknown mode: ${mode}` } };
  } catch (err) {
    return { status: 502, headers: corsHeaders, jsonBody: { error: safeErrorMessage(err, "Work IQ query failed") } };
  }
}

app.http("work-iq", {
  route: "work-iq",
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: workHandler,
});
