import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Azure Function Proxy for Azure OpenAI
 * Supports multiple endpoints:
 * - Azure OpenAI (GPT-4o, GPT-4o-mini)
 * - AI Hub (Phi-4-mini-instruct, GPT-5-nano for cheap tasks)
 * 
 * Features:
 * - Multi-model routing based on cost optimization
 * - System prompt support for prompt caching
 * - Silent fallback with logging
 */

// Azure OpenAI configuration (GPT models)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

// AI Hub configuration (Phi and cheaper models)
const AI_HUB_ENDPOINT = process.env.AI_HUB_ENDPOINT;
const AI_HUB_API_KEY = process.env.AI_HUB_API_KEY;

// Model type definition
type ModelType = "gpt-4o" | "gpt-4o-mini" | "gpt-5-nano" | "phi-4-mini-instruct";

// Deployment configuration
interface DeploymentConfig {
  endpoint: string;
  key: string;
  deployment: string;
  isAIHub: boolean;
}

function getDeploymentConfig(model: ModelType): DeploymentConfig | null {
  const configs: Record<ModelType, DeploymentConfig> = {
    "gpt-4o": {
      endpoint: AZURE_OPENAI_ENDPOINT || "",
      key: AZURE_OPENAI_API_KEY || "",
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O || "gpt-4o",
      isAIHub: false,
    },
    "gpt-4o-mini": {
      endpoint: AZURE_OPENAI_ENDPOINT || "",
      key: AZURE_OPENAI_API_KEY || "",
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI || "gpt-4o-mini",
      isAIHub: false,
    },
    "phi-4-mini-instruct": {
      endpoint: AI_HUB_ENDPOINT || "",
      key: AI_HUB_API_KEY || "",
      deployment: "phi-4-mini-instruct",
      isAIHub: true,
    },
    "gpt-5-nano": {
      endpoint: AI_HUB_ENDPOINT || "",
      key: AI_HUB_API_KEY || "",
      deployment: "gpt-5-nano",
      isAIHub: true,
    },
  };
  return configs[model] || null;
}

interface ChatRequest {
  prompt: string;
  model?: ModelType;
  expectJson?: boolean;
  systemPrompt?: string;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function chatHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as ChatRequest;
    const { prompt, model = "phi-4-mini-instruct", expectJson = false, systemPrompt } = body;

    if (!prompt) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "Prompt is required" },
      };
    }

    // Get deployment config for requested model
    let config = getDeploymentConfig(model);
    let actualModel = model;

    // Validate configuration, fallback if needed
    if (!config || !config.endpoint || !config.key) {
      context.log(`Model ${model} not configured, attempting fallback...`);
      
      // Fallback chain: AI Hub models → gpt-4o-mini → gpt-4o
      const fallbackOrder: ModelType[] = ["gpt-5-nano", "gpt-4o-mini", "gpt-4o"];
      for (const fallbackModel of fallbackOrder) {
        const fallbackConfig = getDeploymentConfig(fallbackModel);
        if (fallbackConfig && fallbackConfig.endpoint && fallbackConfig.key) {
          context.log(`Falling back to ${fallbackModel}`);
          config = fallbackConfig;
          actualModel = fallbackModel;
          break;
        }
      }

      if (!config || !config.endpoint || !config.key) {
        return {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          jsonBody: { error: "No AI models configured on server" },
        };
      }
    }

    const apiVersion = "2024-08-01-preview";
    const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${apiVersion}`;

    // Build messages array with optional system prompt (for prompt caching)
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const requestBody: Record<string, unknown> = {
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    };

    if (expectJson) {
      requestBody.response_format = { type: "json_object" };
    }

    context.log(`Calling ${actualModel} (requested: ${model}) at ${config.endpoint}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.key,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      return {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          error: `Azure OpenAI error: ${response.status}`,
          details: errorData.error?.message || response.statusText,
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
      jsonBody: { error: "Internal server error", details: error.message },
    };
  }
}

app.http("chat", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "chat",
  handler: chatHandler,
});
