import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";
import { getBearerToken, notConfiguredBody } from "../lib/iq-credential";

/**
 * /api/foundry-iq — Microsoft Foundry knowledge / agent retrieval proxy.
 *
 * Modes (?mode=):
 *   - knowledge   → query a Foundry knowledge source/index
 *   - agents      → list agents in the current project
 *   - models      → list deployed models in the current project
 *
 * Required env:
 *   AZURE_FOUNDRY_ENDPOINT     e.g. https://my-project.eastus.api.azureml.ms
 *   AZURE_FOUNDRY_PROJECT_NAME (used for ai-projects style endpoint)
 *
 * Optional env:
 *   AZURE_FOUNDRY_KNOWLEDGE_INDEX  default knowledge index name
 *
 * Auth: Microsoft.AI scope via DefaultAzureCredential / SP from iq-credential.
 */

const corsHeaders = makeCorsHeaders("GET, POST, OPTIONS");
// Foundry/Azure AI uses cognitiveservices.azure.com scope for data plane
const FOUNDRY_SCOPE = "https://ai.azure.com/.default";

interface FoundryHit {
  id: string;
  title?: string;
  snippet?: string;
  source?: string;
  score?: number;
  url?: string;
  metadata?: Record<string, any>;
}

async function foundryHandler(request: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return { status: 204, headers: corsHeaders };
  try {
    const endpoint = (process.env.AZURE_FOUNDRY_ENDPOINT || "").replace(/\/$/, "");
    const projectName = process.env.AZURE_FOUNDRY_PROJECT_NAME || "";
    if (!endpoint) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: notConfiguredBody(
          "Foundry IQ",
          ["AZURE_FOUNDRY_ENDPOINT", "AZURE_FOUNDRY_PROJECT_NAME", "AZURE_FOUNDRY_KNOWLEDGE_INDEX"],
          "https://learn.microsoft.com/azure/ai-foundry/concepts/knowledge",
        ),
      };
    }

    const token = await getBearerToken(FOUNDRY_SCOPE);
    if (!token) {
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: notConfiguredBody(
          "Foundry IQ",
          ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET (or managed identity)"],
        ),
      };
    }

    const mode = (request.query.get("mode") || "knowledge").toLowerCase();
    const q = request.query.get("q") || "";
    const top = Math.min(Number(request.query.get("top") || 5), 20);

    if (mode === "knowledge") {
      const indexName = request.query.get("index") || process.env.AZURE_FOUNDRY_KNOWLEDGE_INDEX || "default";
      // Foundry knowledge retrieval REST: POST /knowledge/indexes/{index}:search
      const url = `${endpoint}/knowledge/indexes/${encodeURIComponent(indexName)}:search?api-version=2025-05-01`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top }),
      });
      if (!res.ok) {
        return {
          status: res.status,
          headers: corsHeaders,
          jsonBody: { error: `Foundry knowledge HTTP ${res.status}`, hint: "Check AZURE_FOUNDRY_KNOWLEDGE_INDEX name and RBAC role 'Cognitive Services User' on the Foundry project." },
        };
      }
      const data = (await res.json()) as any;
      const hits: FoundryHit[] = (data?.results || data?.value || []).map((r: any, i: number) => ({
        id: r.id || `foundry-${i}`,
        title: r.title || r.metadata?.title || r.metadata?.source,
        snippet: r.text || r.content || r.snippet,
        source: r.metadata?.source || indexName,
        score: r.score ?? r.searchScore,
        url: r.metadata?.url,
        metadata: r.metadata,
      }));
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          configured: true,
          mode,
          index: indexName,
          query: q,
          results: hits,
          source: "Microsoft Foundry IQ",
          fetchedAt: new Date().toISOString(),
        },
      };
    }

    if (mode === "agents" || mode === "models") {
      const path = mode === "agents" ? "agents" : "models";
      const url = `${endpoint}/projects/${encodeURIComponent(projectName)}/${path}?api-version=2025-05-01`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        return {
          status: res.status,
          headers: corsHeaders,
          jsonBody: { error: `Foundry ${path} HTTP ${res.status}` },
        };
      }
      const data = (await res.json()) as any;
      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          configured: true,
          mode,
          results: data?.value || data || [],
          source: "Microsoft Foundry IQ",
          fetchedAt: new Date().toISOString(),
        },
      };
    }

    return { status: 400, headers: corsHeaders, jsonBody: { error: `Unknown mode: ${mode}` } };
  } catch (err) {
    return { status: 502, headers: corsHeaders, jsonBody: { error: safeErrorMessage(err, "Foundry IQ query failed") } };
  }
}

app.http("foundry-iq", {
  route: "foundry-iq",
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: foundryHandler,
});
