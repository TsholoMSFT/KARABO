import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";
import { getBearerToken, notConfiguredBody } from "../lib/iq-credential";

/**
 * /api/fabric-iq — Microsoft Fabric REST proxy.
 *
 * Modes (?mode=):
 *   - workspaces       → list workspaces visible to the SP/MI
 *   - items            → list items in ?workspaceId=
 *   - semantic-models  → list semantic models in ?workspaceId=
 *   - dax              → POST { workspaceId, datasetId, dax } executes DAX query
 *
 * Required env: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET (or MI)
 *               + service principal granted Workspace.ReadAll / Member roles
 *               in the target Fabric workspace.
 */

const corsHeaders = makeCorsHeaders("GET, POST, OPTIONS");
const FABRIC_SCOPE = "https://api.fabric.microsoft.com/.default";
const FABRIC_BASE = "https://api.fabric.microsoft.com/v1";
const PBI_BASE = "https://api.powerbi.com/v1.0/myorg"; // For executeQueries

async function fabricGet(path: string, token: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${FABRIC_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  let data: any = null;
  try { data = await res.json(); } catch { /* noop */ }
  return { status: res.status, data };
}

async function fabricHandler(request: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return { status: 204, headers: corsHeaders };
  try {
    const token = await getBearerToken(FABRIC_SCOPE);
    if (!token) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: notConfiguredBody(
          "Microsoft Fabric IQ",
          ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"],
          "https://learn.microsoft.com/rest/api/fabric/articles/using-fabric-apis",
        ),
      };
    }

    const mode = (request.query.get("mode") || "workspaces").toLowerCase();
    const workspaceId = request.query.get("workspaceId") || "";

    if (mode === "workspaces") {
      const r = await fabricGet("/workspaces", token);
      if (!r.status || r.status >= 400) {
        return { status: r.status || 502, headers: corsHeaders, jsonBody: { error: `Fabric workspaces HTTP ${r.status}`, hint: "Grant the SP 'Workspace.Read.All' or add it as a Workspace Member." } };
      }
      const items = (r.data?.value || []).map((w: any) => ({
        id: w.id,
        name: w.displayName,
        description: w.description,
        capacityId: w.capacityId,
        type: w.type,
      }));
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, results: items, source: "Microsoft Fabric", fetchedAt: new Date().toISOString() } };
    }

    if (mode === "items") {
      if (!workspaceId) return { status: 400, headers: corsHeaders, jsonBody: { error: "workspaceId required" } };
      const r = await fabricGet(`/workspaces/${encodeURIComponent(workspaceId)}/items`, token);
      const items = (r.data?.value || []).map((i: any) => ({
        id: i.id,
        name: i.displayName,
        type: i.type,
        description: i.description,
      }));
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, workspaceId, results: items, source: "Microsoft Fabric", fetchedAt: new Date().toISOString() } };
    }

    if (mode === "semantic-models") {
      if (!workspaceId) return { status: 400, headers: corsHeaders, jsonBody: { error: "workspaceId required" } };
      const r = await fabricGet(`/workspaces/${encodeURIComponent(workspaceId)}/semanticModels`, token);
      const items = (r.data?.value || []).map((m: any) => ({
        id: m.id,
        name: m.displayName,
        description: m.description,
      }));
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, workspaceId, results: items, source: "Microsoft Fabric", fetchedAt: new Date().toISOString() } };
    }

    if (mode === "dax") {
      let body: any = null;
      try { body = await request.json(); } catch { body = null; }
      const wsId = body?.workspaceId || workspaceId;
      const datasetId = body?.datasetId;
      const dax = body?.dax;
      if (!wsId || !datasetId || !dax) {
        return { status: 400, headers: corsHeaders, jsonBody: { error: "workspaceId, datasetId, and dax are required" } };
      }
      // executeQueries lives on the Power BI surface today
      const url = `${PBI_BASE}/groups/${encodeURIComponent(wsId)}/datasets/${encodeURIComponent(datasetId)}/executeQueries`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ queries: [{ query: dax }] }),
      });
      const data = await res.json().catch(() => null) as any;
      if (!res.ok) {
        return { status: res.status, headers: corsHeaders, jsonBody: { error: `DAX HTTP ${res.status}`, detail: data } };
      }
      const rows = data?.results?.[0]?.tables?.[0]?.rows || [];
      return { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, jsonBody: { configured: true, mode, results: rows, raw: data, source: "Microsoft Fabric (Power BI)", fetchedAt: new Date().toISOString() } };
    }

    return { status: 400, headers: corsHeaders, jsonBody: { error: `Unknown mode: ${mode}` } };
  } catch (err) {
    return { status: 502, headers: corsHeaders, jsonBody: { error: safeErrorMessage(err, "Fabric IQ query failed") } };
  }
}

app.http("fabric-iq", {
  route: "fabric-iq",
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: fabricHandler,
});
