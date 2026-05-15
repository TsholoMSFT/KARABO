import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";
import { getAoaiAuthHeaders } from "../lib/iq-credential";

/**
 * Azure Function Proxy for Azure OpenAI
 * Supports multiple endpoints and sovereign cloud environments:
 * - Azure Commercial (GPT-4o, GPT-4o-mini)
 * - Azure Government (FedRAMP authorized)
 * - Azure China 21Vianet
 * - Azure EU Data Boundary
 * - AI Hub (Phi-4-mini-instruct, GPT-5-nano for cheap tasks)
 * 
 * Features:
 * - Multi-model routing based on cost optimization
 * - Multi-cloud endpoint resolution per sovereign environment
 * - Entra ID (AAD) + API key authentication
 * - System prompt support for prompt caching
 * - Silent fallback with logging
 */

// ── Cloud environment detection ──────────────────────────────────────
type CloudEnvironment = "public" | "government" | "government-dod" | "china" | "eu-boundary";
const AZURE_CLOUD_ENV = (process.env.AZURE_CLOUD_ENVIRONMENT || "public") as CloudEnvironment;

// ── Azure OpenAI configuration (per-cloud) ───────────────────────────
// Public cloud (default)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

// Azure Government
const AZURE_GOV_OPENAI_ENDPOINT = process.env.AZURE_GOV_OPENAI_ENDPOINT;
const AZURE_GOV_OPENAI_API_KEY = process.env.AZURE_GOV_OPENAI_API_KEY;

// Azure China 21Vianet
const AZURE_CN_OPENAI_ENDPOINT = process.env.AZURE_CN_OPENAI_ENDPOINT;
const AZURE_CN_OPENAI_API_KEY = process.env.AZURE_CN_OPENAI_API_KEY;

// AI Hub configuration (Phi and cheaper models — public cloud only)
const AI_HUB_ENDPOINT = process.env.AI_HUB_ENDPOINT;
const AI_HUB_API_KEY = process.env.AI_HUB_API_KEY;

// Authentication mode: 'entra-id' (default — keys disabled) or 'key'
const AUTH_TYPE = (process.env.AZURE_OPENAI_AUTH_TYPE || "entra-id").toLowerCase();
const REQUIRES_KEY = AUTH_TYPE === "key";

// ── API versions per cloud ───────────────────────────────────────────
// 2025-04-01-preview supports both GPT-5/o-series (max_completion_tokens) and
// legacy 4o models. Sovereign clouds lag — keep them on the highest GA version
// they accept.
const API_VERSIONS: Record<CloudEnvironment, string> = {
  public: "2025-04-01-preview",
  government: "2024-10-21",
  "government-dod": "2024-10-21",
  china: "2024-10-21",
  "eu-boundary": "2025-04-01-preview",
};

// Deployments whose names indicate GPT-5 or o-series — those models reject
// `temperature` and require `max_completion_tokens` instead of `max_tokens`.
const GPT5_OR_O_SERIES_RE = /(^|[^a-z])(gpt-?5|o[134])([^a-z]|$)/i;

// Model type definition
type ModelType = "gpt-4o" | "gpt-4o-mini" | "gpt-5-nano" | "phi-4-mini-instruct";

// Deployment configuration
interface DeploymentConfig {
  endpoint: string;
  key: string;
  deployment: string;
  isAIHub: boolean;
  cloud: CloudEnvironment;
}

/**
 * Resolve endpoint + key for a given cloud environment.
 */
function hasAuth(endpoint: string | undefined, key: string | undefined): boolean {
  if (!endpoint) return false;
  if (REQUIRES_KEY) return Boolean(key);
  return true; // entra-id only needs an endpoint
}

function getCloudConfig(cloud: CloudEnvironment): { endpoint: string; key: string } | null {
  switch (cloud) {
    case "government":
    case "government-dod":
      if (hasAuth(AZURE_GOV_OPENAI_ENDPOINT, AZURE_GOV_OPENAI_API_KEY)) {
        return { endpoint: AZURE_GOV_OPENAI_ENDPOINT!, key: AZURE_GOV_OPENAI_API_KEY || "" };
      }
      break;
    case "china":
      if (hasAuth(AZURE_CN_OPENAI_ENDPOINT, AZURE_CN_OPENAI_API_KEY)) {
        return { endpoint: AZURE_CN_OPENAI_ENDPOINT!, key: AZURE_CN_OPENAI_API_KEY || "" };
      }
      break;
    case "eu-boundary":
    case "public":
    default:
      if (hasAuth(AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY)) {
        return { endpoint: AZURE_OPENAI_ENDPOINT!, key: AZURE_OPENAI_API_KEY || "" };
      }
      break;
  }
  if (hasAuth(AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY)) {
    return { endpoint: AZURE_OPENAI_ENDPOINT!, key: AZURE_OPENAI_API_KEY || "" };
  }
  return null;
}

function getDeploymentConfig(model: ModelType, cloud: CloudEnvironment = AZURE_CLOUD_ENV): DeploymentConfig | null {
  // Dedicated AI Hub endpoint (separate from primary AOAI/Foundry resource)
  if ((model === "phi-4-mini-instruct" || model === "gpt-5-nano") && hasAuth(AI_HUB_ENDPOINT, AI_HUB_API_KEY)) {
    return {
      endpoint: AI_HUB_ENDPOINT!,
      key: AI_HUB_API_KEY || "",
      deployment:
        model === "phi-4-mini-instruct"
          ? process.env.AI_HUB_DEPLOYMENT_PHI || "Phi-4-mini-instruct"
          : process.env.AI_HUB_DEPLOYMENT_NANO || "gpt-5-nano",
      isAIHub: true,
      cloud: "public",
    };
  }

  // Resolve cloud-specific endpoint
  const cloudConfig = getCloudConfig(cloud);
  if (!cloudConfig) return null;

  const deploymentMap: Record<string, string> = {
    "gpt-4o": process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O || "gpt-4o",
    "gpt-4o-mini": process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI || "gpt-4o-mini",
    "phi-4-mini-instruct":
      process.env.AZURE_OPENAI_DEPLOYMENT_PHI ||
      process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI ||
      "gpt-4o-mini",
    "gpt-5-nano":
      process.env.AZURE_OPENAI_DEPLOYMENT_NANO ||
      process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI ||
      "gpt-4o-mini",
  };

  return {
    endpoint: cloudConfig.endpoint,
    key: cloudConfig.key,
    deployment: deploymentMap[model] || "gpt-4o-mini",
    isAIHub: false,
    cloud,
  };
}

interface ChatRequest {
  prompt: string;
  model?: ModelType;
  expectJson?: boolean;
  systemPrompt?: string;
  cloudEnvironment?: CloudEnvironment; // Optional: override cloud per request
}

/**
 * Get Entra ID (AAD) token for Azure OpenAI.
 * Uses DefaultAzureCredential which supports managed identity, VS Code, CLI, etc.
 */
// Token acquisition is now handled by getAoaiAuthHeaders in iq-credential.

const corsHeaders = makeCorsHeaders("POST, OPTIONS");

async function chatHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as ChatRequest;
    const { prompt, model = "phi-4-mini-instruct", expectJson = false, systemPrompt, cloudEnvironment } = body;

    if (!prompt) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "Prompt is required" },
      };
    }

    // Resolve target cloud: request override > env var default
    const targetCloud = cloudEnvironment || AZURE_CLOUD_ENV;

    // Get deployment config for requested model + cloud
    let config = getDeploymentConfig(model, targetCloud);
    let actualModel = model;

    // A config is "valid" if endpoint is set; key only required in key-auth mode.
    const isConfigValid = (c: DeploymentConfig | null | undefined): c is DeploymentConfig =>
      Boolean(c && c.endpoint && (!REQUIRES_KEY || c.key));

    // Validate configuration, fallback if needed
    if (!isConfigValid(config)) {
      context.log(`Model ${model} not configured for ${targetCloud}, attempting fallback...`);

      // Fallback chain: AI Hub models → gpt-4o-mini → gpt-4o
      const fallbackOrder: ModelType[] = ["gpt-5-nano", "gpt-4o-mini", "gpt-4o"];
      for (const fallbackModel of fallbackOrder) {
        const fallbackConfig = getDeploymentConfig(fallbackModel, targetCloud);
        if (isConfigValid(fallbackConfig)) {
          context.log(`Falling back to ${fallbackModel} on ${targetCloud}`);
          config = fallbackConfig;
          actualModel = fallbackModel;
          break;
        }
      }

      if (!isConfigValid(config)) {
        return {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          jsonBody: { error: `No AI models configured for cloud environment: ${targetCloud}` },
        };
      }
    }

    const apiVersion = API_VERSIONS[config.cloud] || API_VERSIONS.public;
    const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${apiVersion}`;

    // Build messages array with optional system prompt (for prompt caching)
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const isGpt5OrO = GPT5_OR_O_SERIES_RE.test(config.deployment || "");
    const requestBody: Record<string, unknown> = { messages };
    if (isGpt5OrO) {
      requestBody.max_completion_tokens = 8000;
    } else {
      requestBody.max_tokens = 8000;
      requestBody.temperature = 0.7;
    }

    if (expectJson) {
      requestBody.response_format = { type: "json_object" };
    }

    // Build auth headers — Entra ID (default) or API key
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const authHeaders = await getAoaiAuthHeaders(config.key || undefined);
    if (!authHeaders) {
      return {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          error:
            "No auth method available. Set AZURE_OPENAI_AUTH_TYPE=entra-id with valid az login / managed identity, or provide AZURE_OPENAI_API_KEY.",
        },
      };
    }
    Object.assign(headers, authHeaders);
    context.log(`Auth=${authHeaders.Authorization ? "entra-id" : "api-key"} model=${actualModel} cloud=${config.cloud} aiHub=${config.isAIHub}`);

    context.log(`Calling ${actualModel} (requested: ${model}) on ${config.cloud} at ${config.endpoint}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      const aoaiMsg = errorData?.error?.message || response.statusText || "";
      context.error(
        `Azure OpenAI ${response.status} on ${config.cloud}/${config.deployment}: ${aoaiMsg}`,
      );
      return {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          error: `Azure OpenAI ${response.status}: ${aoaiMsg}`,
          details: `deployment=${config.deployment} cloud=${config.cloud}`,
        },
      };
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "No content in response" },
      };
    }

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { content, usage: data.usage },
    };
  } catch (error: any) {
    context.error("Chat function error:", error);
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: safeErrorMessage(error) },
    };
  }
}

app.http("chat", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "chat",
  handler: chatHandler,
});
