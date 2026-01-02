import { AzureFunction, Context, HttpRequest } from "@azure/functions";

/**
 * Azure Function Proxy for Azure OpenAI
 * Keeps API keys secure on the server side
 */

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT_GPT4O = process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O || "gpt-4o";
const DEPLOYMENT_GPT4O_MINI = process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI || "gpt-4o-mini";

interface ChatRequest {
  prompt: string;
  model?: "gpt-4o" | "gpt-4o-mini";
  expectJson?: boolean;
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers };
    return;
  }

  // Validate configuration
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    context.res = {
      status: 500,
      headers,
      body: { error: "Azure OpenAI not configured on server" },
    };
    return;
  }

  try {
    const { prompt, model = "gpt-4o-mini", expectJson = false }: ChatRequest = req.body;

    if (!prompt) {
      context.res = {
        status: 400,
        headers,
        body: { error: "Prompt is required" },
      };
      return;
    }

    // Select deployment based on model
    const deployment = model === "gpt-4o" ? DEPLOYMENT_GPT4O : DEPLOYMENT_GPT4O_MINI;
    const apiVersion = "2024-08-01-preview";
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const requestBody: any = {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    };

    if (expectJson) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      context.res = {
        status: response.status,
        headers,
        body: {
          error: `Azure OpenAI error: ${response.status}`,
          details: errorData.error?.message || response.statusText,
        },
      };
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      context.res = {
        status: 500,
        headers,
        body: { error: "No content in response" },
      };
      return;
    }

    context.res = {
      status: 200,
      headers,
      body: { content, usage: data.usage },
    };
  } catch (error: any) {
    context.log.error("Chat function error:", error);
    context.res = {
      status: 500,
      headers,
      body: { error: "Internal server error", details: error.message },
    };
  }
};

export default httpTrigger;
