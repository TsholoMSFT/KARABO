import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";

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

// Authentication mode: 'key' (default) or 'entra-id'
const AUTH_TYPE = process.env.AZURE_OPENAI_AUTH_TYPE || "key";

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
function getCloudConfig(cloud: CloudEnvironment): { endpoint: string; key: string } | null {
  switch (cloud) {
    case "government":
    case "government-dod":
      if (AZURE_GOV_OPENAI_ENDPOINT && AZURE_GOV_OPENAI_API_KEY) {
        return { endpoint: AZURE_GOV_OPENAI_ENDPOINT, key: AZURE_GOV_OPENAI_API_KEY };
      }
      // Fall through to public if gov not configured
      break;
    case "china":
      if (AZURE_CN_OPENAI_ENDPOINT && AZURE_CN_OPENAI_API_KEY) {
        return { endpoint: AZURE_CN_OPENAI_ENDPOINT, key: AZURE_CN_OPENAI_API_KEY };
      }
      break;
    case "eu-boundary":
    case "public":
    default:
      if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY) {
        return { endpoint: AZURE_OPENAI_ENDPOINT, key: AZURE_OPENAI_API_KEY };
      }
      break;
  }
  // Fallback: try public cloud config  
  if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY) {
    return { endpoint: AZURE_OPENAI_ENDPOINT, key: AZURE_OPENAI_API_KEY };
  }
  return null;
}

function getDeploymentConfig(model: ModelType, cloud: CloudEnvironment = AZURE_CLOUD_ENV): DeploymentConfig | null {
  // AI Hub models (only available in public cloud)
  if ((model === "phi-4-mini-instruct" || model === "gpt-5-nano") && AI_HUB_ENDPOINT && AI_HUB_API_KEY) {
    return {
      endpoint: AI_HUB_ENDPOINT,
      key: AI_HUB_API_KEY,
      deployment: model,
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
    // Phi/nano fall through to GPT models when AI Hub not configured
    "phi-4-mini-instruct": process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI || "gpt-4o-mini",
    "gpt-5-nano": process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI || "gpt-4o-mini",
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
async function getEntraIdToken(context: InvocationContext): Promise<string | null> {
  try {
    const { DefaultAzureCredential } = await import("@azure/identity");
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken("https://cognitiveservices.azure.com/.default");
    return tokenResponse.token;
  } catch (error: any) {
    context.warn(`Entra ID auth failed, falling back to API key: ${error.message}`);
    return null;
  }
}

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

    // Validate configuration, fallback if needed
    if (!config || !config.endpoint || !config.key) {
      context.log(`Model ${model} not configured for ${targetCloud}, attempting fallback...`);
      
      // Fallback chain: AI Hub models → gpt-4o-mini → gpt-4o
      const fallbackOrder: ModelType[] = ["gpt-5-nano", "gpt-4o-mini", "gpt-4o"];
      for (const fallbackModel of fallbackOrder) {
        const fallbackConfig = getDeploymentConfig(fallbackModel, targetCloud);
        if (fallbackConfig && fallbackConfig.endpoint && fallbackConfig.key) {
          context.log(`Falling back to ${fallbackModel} on ${targetCloud}`);
          config = fallbackConfig;
          actualModel = fallbackModel;
          break;
        }
      }

      if (!config || !config.endpoint || !config.key) {
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

    // Build auth headers — Entra ID or API key
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (AUTH_TYPE === "entra-id" && !config.isAIHub) {
      const token = await getEntraIdToken(context);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        context.log(`Using Entra ID auth for ${actualModel} on ${config.cloud}`);
      } else {
        // Fallback to API key
        headers["api-key"] = config.key;
        context.log(`Entra ID unavailable, using API key for ${actualModel} on ${config.cloud}`);
      }
    } else {
      headers["api-key"] = config.key;
    }

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
