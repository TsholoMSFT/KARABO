import { randomUUID } from "crypto";
import { getOutputTokenLimit, type AITask } from "./ai-cost-controls";
import {
  AIProviderError,
  classifyAIResponseError,
  resolveAIProviderConfig,
  type AICloudEnvironment,
  type AIModel,
} from "./ai-provider";
import { tryFoundryLocalChat } from "./foundry-local-client";
import { getAoaiAuthHeaders } from "./iq-credential";

const GPT5_OR_O_SERIES_RE = /(^|[^a-z])(gpt-?5|o[134])([^a-z]|$)/i;
const PROVIDER_TIMEOUT_MS = 60_000;

export interface AICompletionRequest {
  prompt: string;
  model?: AIModel;
  task?: AITask;
  expectJson?: boolean;
  systemPrompt?: string;
  cloudEnvironment?: AICloudEnvironment;
  correlationId?: string;
}

export interface AICompletionResult {
  content: string;
  provider: "azure-openai" | "foundry-local";
  source: "azure-openai" | "foundry-local";
  model: string;
  deployment?: string;
  correlationId: string;
  usage?: unknown;
}

export interface AICompletionLogger {
  log(message: string): void;
  warn(message: string): void;
}

export async function completeAI(
  request: AICompletionRequest,
  logger?: AICompletionLogger,
  fetchImpl: typeof fetch = fetch,
): Promise<AICompletionResult> {
  const {
    prompt,
    model = "phi-4-mini-instruct",
    task = "general",
    expectJson = false,
    systemPrompt,
    cloudEnvironment,
    correlationId = randomUUID(),
  } = request;

  try {
    const localResponse = await tryFoundryLocalChat({ prompt, task, expectJson, systemPrompt });
    if (localResponse) {
      logger?.log(`AI correlationId=${correlationId} provider=foundry-local model=${localResponse.model} task=${task}`);
      return { ...localResponse, provider: "foundry-local", correlationId };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Foundry Local error";
    logger?.warn(`Foundry Local unavailable; falling back to Azure OpenAI: ${message}`);
  }

  const config = resolveAIProviderConfig(model, cloudEnvironment);
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

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const outputTokenLimit = getOutputTokenLimit(task);
  const requestBody: Record<string, unknown> = { messages };
  if (GPT5_OR_O_SERIES_RE.test(config.deployment)) {
    requestBody.max_completion_tokens = outputTokenLimit;
  } else {
    requestBody.max_tokens = outputTokenLimit;
    requestBody.temperature = 0.7;
  }
  if (expectJson) requestBody.response_format = { type: "json_object" };

  logger?.log(`AI correlationId=${correlationId} auth=${config.authMode} model=${model} deployment=${config.deployment} cloud=${config.cloud} task=${task} maxOutputTokens=${outputTokenLimit}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(
      `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIProviderError("PROVIDER_TIMEOUT", "AI provider request timed out.", true, 504);
    }
    throw new AIProviderError("PROVIDER_ERROR", "AI provider could not be reached.", true, 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw classifyAIResponseError(response.status, errorData.error?.message || response.statusText);
  }

  const data = await response.json() as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AIProviderError("INVALID_MODEL_OUTPUT", "AI provider returned no content.", false, 502);
  }

  return {
    content,
    model: data.model || config.deployment,
    deployment: config.deployment,
    provider: "azure-openai",
    source: "azure-openai",
    usage: data.usage,
    correlationId,
  };
}