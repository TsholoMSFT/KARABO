import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { randomUUID } from "crypto";
import { makeCorsHeaders, safeErrorMessage } from "../lib/xml-utils";
import { getAoaiAuthHeaders } from "../lib/iq-credential";
import { AITask, getOutputTokenLimit } from "../lib/ai-cost-controls";
import { tryFoundryLocalChat } from "../lib/foundry-local-client";
import {
  AIProviderError,
  classifyAIResponseError,
  resolveAIProviderConfig,
  toAIErrorBody,
  type AICloudEnvironment,
  type AIModel,
} from "../lib/ai-provider";

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

// Deployments whose names indicate GPT-5 or o-series — those models reject
// `temperature` and require `max_completion_tokens` instead of `max_tokens`.
const GPT5_OR_O_SERIES_RE = /(^|[^a-z])(gpt-?5|o[134])([^a-z]|$)/i;

interface ChatRequest {
  prompt: string;
  model?: AIModel;
  task?: AITask;
  expectJson?: boolean;
  systemPrompt?: string;
  cloudEnvironment?: AICloudEnvironment;
}

/**
 * Get Entra ID (AAD) token for Azure OpenAI.
 * Uses DefaultAzureCredential which supports managed identity, VS Code, CLI, etc.
 */
// Token acquisition is now handled by getAoaiAuthHeaders in iq-credential.

const corsHeaders = makeCorsHeaders("POST, OPTIONS");

async function chatHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = req.headers.get("x-correlation-id")?.trim() || randomUUID();

  // Handle preflight
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as ChatRequest;
    const { prompt, model = "phi-4-mini-instruct", task = "general", expectJson = false, systemPrompt, cloudEnvironment } = body;

    if (!prompt) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "Prompt is required" },
      };
    }

    try {
      const localResponse = await tryFoundryLocalChat({ prompt, task, expectJson, systemPrompt });
      if (localResponse) {
        context.log(`AI correlationId=${correlationId} provider=foundry-local model=${localResponse.model} task=${task}`);
        return {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          jsonBody: { ...localResponse, correlationId },
        };
      }
    } catch (error) {
      context.warn(`Foundry Local unavailable; falling back to Azure OpenAI: ${safeErrorMessage(error)}`);
    }

    const config = resolveAIProviderConfig(model, cloudEnvironment);
    const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`;

    // Build messages array with optional system prompt (for prompt caching)
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const isGpt5OrO = GPT5_OR_O_SERIES_RE.test(config.deployment || "");
    const outputTokenLimit = getOutputTokenLimit(task);
    const requestBody: Record<string, unknown> = { messages };
    if (isGpt5OrO) {
      requestBody.max_completion_tokens = outputTokenLimit;
    } else {
      requestBody.max_tokens = outputTokenLimit;
      requestBody.temperature = 0.7;
    }

    if (expectJson) {
      requestBody.response_format = { type: "json_object" };
    }

    // Build auth headers — Entra ID (default) or API key
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const authHeaders = await getAoaiAuthHeaders(config.apiKey, config.authMode);
    if (!authHeaders) {
      throw new AIProviderError(
        "AI_AUTH_FAILED",
        config.authMode === "entra-id"
          ? "Entra ID authentication failed. Sign in locally or configure the Function App managed identity."
          : "AI key authentication is selected, but the configured key could not be used.",
        false,
        503,
      );
    }
    Object.assign(headers, authHeaders);
    context.log(`AI correlationId=${correlationId} auth=${config.authMode} model=${model} deployment=${config.deployment} cloud=${config.cloud} aiHub=${config.isAIHub} task=${task} maxOutputTokens=${outputTokenLimit}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      const aoaiMsg = errorData?.error?.message || response.statusText || "";
      throw classifyAIResponseError(response.status, aoaiMsg);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIProviderError("INVALID_MODEL_OUTPUT", "AI provider returned no content.", false, 502);
    }

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        content,
        model: data.model || config.deployment,
        deployment: config.deployment,
        provider: "azure-openai",
        source: "azure-openai",
        usage: data.usage,
        correlationId,
      },
    };
  } catch (error: unknown) {
    const body = toAIErrorBody(error, correlationId);
    const status = error instanceof AIProviderError ? error.status : 500;
    context.error(`AI correlationId=${correlationId} code=${body.code} retryable=${body.retryable}: ${body.error}`);
    return {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: body,
    };
  }
}

app.http("chat", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "chat",
  handler: chatHandler,
});
