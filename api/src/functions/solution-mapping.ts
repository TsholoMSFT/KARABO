import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { completeAI } from "../lib/ai-completion";
import { AIProviderError, toAIErrorBody } from "../lib/ai-provider";
import { generateSolutionMapping } from "../lib/solution-mapping";
import { makeCorsHeaders } from "../lib/xml-utils";

const corsHeaders = makeCorsHeaders("POST, OPTIONS");

async function solutionMappingHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const correlationId = request.headers.get("x-correlation-id")?.trim() || randomUUID();
  if (request.method === "OPTIONS") return { status: 204, headers: corsHeaders };

  try {
    const input = await request.json();
    const result = await generateSolutionMapping(input, async (prompt, options) => {
      return completeAI({
        prompt,
        model: "gpt-4o-mini",
        task: options.task,
        expectJson: options.expectJson,
        systemPrompt: options.systemPrompt,
        correlationId,
      }, context);
    });

    return {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: {
        mapping: result.mapping,
        generation: {
          ...result.metadata,
          generatedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        jsonBody: {
          error: "Ranked use case failed validation.",
          code: "INVALID_REQUEST",
          retryable: false,
          correlationId,
          issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      };
    }

    const normalizedError = error instanceof Error && error.message === "INVALID_MODEL_OUTPUT"
      ? new AIProviderError("INVALID_MODEL_OUTPUT", "AI solution mapping failed schema validation.", false, 502)
      : error;
    const body = toAIErrorBody(normalizedError, correlationId);
    const status = normalizedError instanceof AIProviderError ? normalizedError.status : 500;
    context.error(`Solution mapping correlationId=${correlationId} code=${body.code}: ${body.error}`);
    return {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      jsonBody: body,
    };
  }
}

app.http("solution-mapping", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "solution-mapping",
  handler: solutionMappingHandler,
});