import { randomUUID } from "crypto";
import { getAoaiAuthHeaders } from "./iq-credential";
import {
  AIProviderError,
  classifyAIResponseError,
  resolveAIProviderConfig,
  toAIErrorBody,
  type AIErrorCode,
  type AIProviderConfig,
} from "./ai-provider";

export interface AIReadinessResult {
  status: "ready" | "unavailable";
  checkedAt: string;
  provider: "azure-openai";
  model: string;
  deployment?: string;
  authMode?: AIProviderConfig["authMode"];
  correlationId: string;
  code?: AIErrorCode;
  retryable?: boolean;
  message?: string;
}

interface AIReadinessDependencies {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  getAuthHeaders?: typeof getAoaiAuthHeaders;
  correlationId?: string;
  now?: () => Date;
  bypassCache?: boolean;
}

const CACHE_TTL_MS = 30_000;
let cachedResult: { expiresAt: number; value: AIReadinessResult } | null = null;

function readinessUrl(config: AIProviderConfig): string {
  return `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`;
}

export function clearAIReadinessCache(): void {
  cachedResult = null;
}

export async function checkAzureAIReadiness(
  dependencies: AIReadinessDependencies = {},
): Promise<AIReadinessResult> {
  const now = dependencies.now?.() || new Date();
  if (!dependencies.bypassCache && cachedResult && cachedResult.expiresAt > now.getTime()) {
    return cachedResult.value;
  }

  const correlationId = dependencies.correlationId || randomUUID();
  const fetchImpl = dependencies.fetchImpl || fetch;
  const getAuthHeaders = dependencies.getAuthHeaders || getAoaiAuthHeaders;
  const model = "gpt-4o-mini";

  let result: AIReadinessResult;
  try {
    const config = resolveAIProviderConfig(model, undefined, dependencies.env || process.env);
    const authHeaders = await getAuthHeaders(config.apiKey, config.authMode);
    if (!authHeaders) {
      throw new AIProviderError(
        "AI_AUTH_FAILED",
        `${config.authMode === "entra-id" ? "Entra ID" : "API key"} authentication is unavailable.`,
        false,
        503,
      );
    }

    const response = await fetchImpl(readinessUrl(config), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Reply with OK." }],
        max_completion_tokens: 16,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw classifyAIResponseError(
        response.status,
        errorData.error?.message || response.statusText,
      );
    }

    result = {
      status: "ready",
      checkedAt: now.toISOString(),
      provider: "azure-openai",
      model,
      deployment: config.deployment,
      authMode: config.authMode,
      correlationId,
    };
  } catch (error) {
    const body = toAIErrorBody(error, correlationId);
    result = {
      status: "unavailable",
      checkedAt: now.toISOString(),
      provider: "azure-openai",
      model,
      correlationId,
      code: body.code,
      retryable: body.retryable,
      message: body.error,
    };
  }

  cachedResult = { expiresAt: now.getTime() + CACHE_TTL_MS, value: result };
  return result;
}