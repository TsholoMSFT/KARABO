import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

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

  // Validate configuration
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    return {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: { error: "Azure OpenAI not configured on server" },
    };
  }

  try {
    const body = await req.json() as ChatRequest;
    const { prompt, model = "gpt-4o-mini", expectJson = false } = body;

    if (!prompt) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: { error: "Prompt is required" },
      };
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
